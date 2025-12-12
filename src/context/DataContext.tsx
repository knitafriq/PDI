import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Papa from "papaparse";

/**
 * Robust DataContext
 * - Serves CSVs from /public/prototype_dummy
 * - Tries semicolon first, then comma if parsing looks wrong
 * - If parsed row keys look like a single string containing commas, reparses with autodetect
 */

const CSV_BASE = ""; // same origin, Vite serves public/

async function fetchCsvFlexible(path: string) {
  const url = `${CSV_BASE}/prototype_dummy/${path}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      `Failed to fetch ${url}: ${res.status} ${res.statusText}`
    );
  const txt = await res.text();

  // Helper to parse with given delimiter
  function parseWith(delim: string) {
    const parsed = Papa.parse(txt, {
      header: true,
      skipEmptyLines: true,
      delimiter: delim,
      dynamicTyping: false,
    });
    return parsed;
  }

  // 1) try semicolon
  let p = parseWith(";");
  // If result has a single column name that itself contains commas, it's malformed
  const keys =
    p.data && p.data.length > 0
      ? Object.keys(p.data[0])
      : p.meta && p.meta.fields
      ? p.meta.fields
      : [];
  if (
    keys.length === 1 &&
    typeof keys[0] === "string" &&
    keys[0].includes(",")
  ) {
    // try comma delimiter
    p = parseWith(",");
    const keys2 =
      p.data && p.data.length > 0
        ? Object.keys(p.data[0])
        : p.meta && p.meta.fields
        ? p.meta.fields
        : [];
    // If comma parse still gives single garbage column, try auto-detect
    if (keys2.length === 1 && keys2[0].includes(",")) {
      // Use Papa auto-detect: no delimiter provided
      p = Papa.parse(txt, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });
    }
  }

  // Final safety: if parsed rows are objects with only one key but that key contains commas,
  // then do a manual CSV split (best-effort)
  const finalRows = (p.data || []) as any[];
  if (finalRows.length > 0) {
    const sampleKeys = Object.keys(finalRows[0]);
    if (sampleKeys.length === 1 && sampleKeys[0].includes(",")) {
      // Manual fallback: split header and lines by newline, then split by comma
      const lines = txt.split(/\r?\n/).filter(Boolean);
      if (lines.length >= 1) {
        const headerLine = lines[0];
        // try both semicolon or comma split heuristics
        const candidateDelims = [",", ";", "\t"];
        let hdrFields: string[] = [];
        for (const d of candidateDelims) {
          const parts = headerLine
            .split(d)
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length > 1) {
            hdrFields = parts;
            break;
          }
        }
        if (hdrFields.length === 0)
          hdrFields = headerLine
            .split(",")
            .map((s) => s.trim());

        const rowsOut: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          // split using header candidate delim (best-effort)
          const values =
            hdrFields.length > 1
              ? line
                  .split(
                    headerLine.includes(";")
                      ? ";"
                      : ","
                  )
                  .map((s) => s.trim())
              : line.split(",").map((s) => s.trim());
          const obj: any = {};
          for (let j = 0; j < hdrFields.length; j++) {
            obj[hdrFields[j]] =
              values[j] !== undefined ? values[j] : "";
          }
          rowsOut.push(obj);
        }
        return rowsOut;
      }
    }
  }

  return finalRows;
}

type LmRecord = {
  [key: string]: any;
};

type ProvincialStat = {
  prov_code: string;
  avgPdi: number;
  highComplexityCount: number;
  municipalityCount: number;
};

type DataState = {
  loading: boolean;
  error?: string;
  municipalities: any[];
  indicators: any[];
  themeScoresMinmax: any[];
  pdiMinmax: any[];

  // NEW: joined model + overview metrics
  lmModel: LmRecord[];
  mappedMunicipalitiesCount: number;
  pdiRowsCount: number;
  highComplexityCount: number;
  provincialStats: ProvincialStat[];
};

const initialState: DataState = {
  loading: true,
  municipalities: [],
  indicators: [],
  themeScoresMinmax: [],
  pdiMinmax: [],

  lmModel: [],
  mappedMunicipalitiesCount: 0,
  pdiRowsCount: 0,
  highComplexityCount: 0,
  provincialStats: [],
};

const DataContext = createContext<DataState>(initialState);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] =
    useState<DataState>(initialState);

  useEffect(() => {
    let mounted = true;

    const HIGH_THRESHOLD = 0.6; // can be tuned later

    (async () => {
      try {
        const [
          municipalities,
          indicators,
          themeScoresMinmax,
          pdiMinmax,
        ] = await Promise.all([
          fetchCsvFlexible("DimMunicipality_clean.csv"),
          fetchCsvFlexible(
            "DimIndicator_clean_fixed_semicolon.csv"
          ),
          fetchCsvFlexible(
            "theme_scores_municipality_minmax_dummy.csv"
          ),
          fetchCsvFlexible(
            "pdi_municipality_minmax_dummy.csv"
          ),
        ]);

        if (!mounted) return;

        // Helper to normalise codes
        const norm = (v: any) =>
          v == null ? "" : String(v).trim();

        // Build lookup maps by municipality code
        const themeByCode = new Map<
          string,
          any
        >();
        for (const r of themeScoresMinmax) {
          const code = norm(
            r.muni_code ??
              r.MunicipalityCode ??
              r.MUNICODE
          );
          if (code) themeByCode.set(code, r);
        }

        const pdiByCode = new Map<string, any>();
        for (const r of pdiMinmax) {
          const code = norm(
            r.muni_code ??
              r.MunicipalityCode ??
              r.MUNICODE
          );
          if (code) pdiByCode.set(code, r);
        }

        // Join into lmModel, starting from mapped municipalities
        const lmModel: LmRecord[] = [];

        for (const m of municipalities) {
          const code = norm(
            m.muni_code ??
              m.MUNICODE ??
              m.MunicipalityCode
          );
          if (!code) continue;

          const theme = themeByCode.get(code);
          const pdi = pdiByCode.get(code);

          const muni_name =
            m.muni_name ??
            m.Municipality ??
            pdi?.Municipality ??
            theme?.Municipality ??
            "";

          const prov_code =
            m.prov_code ??
            m.Province ??
            theme?.Province ??
            pdi?.Province ??
            "";

          const PDI_MinMax = pdi?.PDI_MinMax
            ? Number(pdi.PDI_MinMax)
            : theme?.PDI_MinMax
            ? Number(theme.PDI_MinMax)
            : m.PDI_MinMax
            ? Number(m.PDI_MinMax)
            : undefined;

          const record: LmRecord = {
            ...m,
            ...(theme || {}),
            ...(pdi || {}),
            muni_code: code,
            muni_name,
            prov_code,
            PDI_MinMax,
          };

          lmModel.push(record);
        }

        const mappedMunicipalitiesCount =
          municipalities.length;
        const pdiRowsCount = pdiMinmax.length;

        const highComplexityCount = lmModel.filter(
          (r) =>
            typeof r.PDI_MinMax === "number" &&
            r.PDI_MinMax >= HIGH_THRESHOLD
        ).length;

        // Provincial stats for leaderboard / top province
        const byProv: Record<
          string,
          {
            sumPdi: number;
            count: number;
            highCount: number;
          }
        > = {};

        for (const r of lmModel) {
          const prov = norm(r.prov_code);
          const pdi =
            typeof r.PDI_MinMax === "number"
              ? r.PDI_MinMax
              : undefined;
          if (!prov || pdi == null) continue;

          if (!byProv[prov]) {
            byProv[prov] = {
              sumPdi: 0,
              count: 0,
              highCount: 0,
            };
          }
          byProv[prov].sumPdi += pdi;
          byProv[prov].count += 1;
          if (pdi >= HIGH_THRESHOLD)
            byProv[prov].highCount += 1;
        }

        const provincialStats: ProvincialStat[] =
          Object.entries(byProv).map(
            ([prov_code, v]) => ({
              prov_code,
              avgPdi: v.sumPdi / v.count,
              highComplexityCount: v.highCount,
              municipalityCount: v.count,
            })
          );

        setState({
          loading: false,
          municipalities,
          indicators,
          themeScoresMinmax,
          pdiMinmax,
          lmModel,
          mappedMunicipalitiesCount,
          pdiRowsCount,
          highComplexityCount,
          provincialStats,
        });
      } catch (err: any) {
        console.error("Data load error:", err);
        if (!mounted) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: String(err),
        }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DataContext.Provider value={state}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx)
    throw new Error(
      "useData must be used within DataProvider"
    );
  return ctx;
};
