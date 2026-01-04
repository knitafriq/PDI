// src/pages/Profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";
import SortableTable from "../components/SortableTable";
import { numericVal, mean } from "../utils/dataHelpers";
import * as Papa from "papaparse";

// -----------------------------------------------------------------------------
// Helpers / constants
// -----------------------------------------------------------------------------
const FACT_CSV_PATH =
  "/prototype_dummy/FactLong_2024_dummy_populated_compact_semicolon.csv";

const ensureStr = (v: any) =>
  v === null || v === undefined ? "" : String(v).trim().toString();

const getMuniCodeFromAny = (r: any): string =>
  ensureStr(
    r.muni_code ??
      r.MunicipalCode ??
      r.MunicipalityCode ??
      r.MunicipalityCode ??
      r.Municipality ??
      r.Municipal // defensive
  );

// theme metadata keys to ignore when detecting theme columns
const ThemeMetadataKeys = [
  "MunicipalityCode",
  "MunicipalCode",
  "MunicipalityName",
  "ProvinceName",
  "Province",
  "Municipality",
  "MIIF_Category",
  "Latitude",
  "Longitude",
  "DistrictName",
  "DistrictCode",
  "muni_code",
  "prov_code",
  "dist_code",
];

// Build option list helper (generic, but we'll prefer dim-derived options)
const buildOptionsFromDim = (
  rows: any[],
  idKey: string,
  labelFn: (r: any) => string
) => {
  const map = new Map<string, string>();
  (rows || []).forEach((r) => {
    const id = ensureStr(r[idKey]);
    if (!id) return;
    const label = labelFn(r) || id;
    if (!map.has(id)) map.set(id, label);
  });
  return Array.from(map.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
const Profile: React.FC = () => {
  const {
    municipalities, // DimMunicipality_clean (authoritative dimension)
    indicators,
    themeScoresMinmax,
    pdiMinmax,
    loading,
  } = useData() as any;

  const themeRows = (themeScoresMinmax || []) as any[];
  const pdiRows = (pdiMinmax || []) as any[];

  // ---------------------------------------------------------------------------
  // Build dim lookup from municipalities (DimMunicipality_clean)
  // expecting fields like: muni_code, muni_name, prov_code, dist_code, prov_name, dist_name, miif_category, centroid_lat, centroid_lon
  // ---------------------------------------------------------------------------
  const muniDimLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        prov_code: string;
        prov_name: string;
        dist_code: string;
        dist_name: string;
        muni_name: string;
        miif_category?: string;
        lat?: string;
        lon?: string;
      }
    >();

    (municipalities || []).forEach((m: any) => {
      // defensively support many possible keys
      const code =
        ensureStr(
          m.muni_code ??
            m.MunicipalityCode ??
            m.MunicipalCode ??
            m.Municipal ??
            m.Municipality
        ) || "";
      if (!code) return;
      const prov_code = ensureStr(m.prov_code ?? m.Province ?? m.ProvinceCode ?? m.ProvCode);
      const prov_name = ensureStr(m.prov_name ?? m.ProvinceName ?? m.ProvName ?? m.prov);
      const dist_code = ensureStr(m.dist_code ?? m.DistrictCode ?? m.District ?? m.dist);
      const dist_name = ensureStr(m.dist_name ?? m.DistrictName ?? m.dist_name ?? m.distname);
      const muni_name = ensureStr(m.muni_name ?? m.MunicipalityName ?? m.Municipality ?? m.muni);
      const miif_category = ensureStr(m.miif_category ?? m.MIIF_Category ?? m.miif_name ?? m.miif);
      const lat = ensureStr(m.centroid_lat ?? m.centroidLat ?? m.Latitude ?? m.lat);
      const lon = ensureStr(m.centroid_lon ?? m.centroidLon ?? m.Longitude ?? m.lon);

      map.set(code, {
        prov_code,
        prov_name,
        dist_code,
        dist_name,
        muni_name,
        miif_category,
        lat,
        lon,
      });
    });

    return map;
  }, [municipalities]);

  // ---------------------------------------------------------------------------
  // Theme columns detection and national stats
  // ---------------------------------------------------------------------------
  const themeColumns = useMemo(() => {
    if (!themeRows || themeRows.length === 0) return [];
    const sample = themeRows[0] || {};
    return Object.keys(sample).filter((k) => !ThemeMetadataKeys.includes(k));
  }, [themeRows]);

  const themeStatsAll: Record<string, { avg: number; values: number[] }> = useMemo(() => {
    const out: Record<string, { avg: number; values: number[] }> = {};
    if (!themeRows || !themeRows.length || !themeColumns.length) return out;
    themeColumns.forEach((c) => {
      const vals = themeRows.map((r) => numericVal(r[c])).filter((v: any) => v != null) as number[];
      out[c] = { avg: mean(vals), values: vals };
    });
    return out;
  }, [themeRows, themeColumns]);

  // ---------------------------------------------------------------------------
  // Dimension options (derived from the dim lookup - authoritative)
  // ---------------------------------------------------------------------------
  const provinceOptions = useMemo(() => {
    // gather unique prov_code -> prov_name from dim lookup
    const entries: { id: string; label: string }[] = [];
    muniDimLookup.forEach((v, code) => {
      const id = ensureStr(v.prov_code);
      if (!id) return;
      const label = v.prov_name ? `${id} — ${v.prov_name}` : id;
      entries.push({ id, label });
    });
    // unique and sort
    const unique = Array.from(new Map(entries.map((e) => [e.id, e.label])).entries()).map(([id, label]) => ({ id, label }));
    return unique.sort((a, b) => a.label.localeCompare(b.label));
  }, [muniDimLookup]);

  const districtOptions = useMemo(() => {
    const entries: { id: string; label: string }[] = [];
    muniDimLookup.forEach((v, code) => {
      const id = ensureStr(v.dist_code);
      if (!id) return;
      const label = v.dist_name ? `${id} — ${v.dist_name}` : id;
      entries.push({ id, label });
    });
    const unique = Array.from(new Map(entries.map((e) => [e.id, e.label])).entries()).map(([id, label]) => ({ id, label }));
    return unique.sort((a, b) => a.label.localeCompare(b.label));
  }, [muniDimLookup]);

  const municipalityOptions = useMemo(() => {
    const out: { code: string; label: string }[] = [];
    muniDimLookup.forEach((v, code) => {
      const label = v.muni_name ? `${v.muni_name} (${code}) — ${v.prov_name || ""}`.trim() : `${code}${v.prov_name ? ` — ${v.prov_name}` : ""}`;
      out.push({ code, label });
    });
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [muniDimLookup]);

  // ---------------------------------------------------------------------------
  // Local selectors (independent per view)
  // ---------------------------------------------------------------------------
  const [selectedProvId, setSelectedProvId] = useState<string>("");
  const [selectedDistId, setSelectedDistId] = useState<string>("");
  const [selectedMuniCode, setSelectedMuniCode] = useState<string>("");

  // ---------------------------------------------------------------------------
  // FACT TABLE (loaded once)
  // ---------------------------------------------------------------------------
  const [allFactRows, setAllFactRows] = useState<any[] | "LOADING" | null>(null);
  const [factError, setFactError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFact() {
      setAllFactRows("LOADING");
      setFactError(null);

      const parseAndSet = async (delimiter: ";" | ",") => {
        const res = await fetch(FACT_CSV_PATH);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();
        const parsed = Papa.parse(txt, { header: true, skipEmptyLines: true, delimiter });
        if (!cancelled) setAllFactRows((parsed.data || []) as any[]);
      };

      try {
        await parseAndSet(";");
      } catch {
        try {
          await parseAndSet(",");
        } catch (err: any) {
          if (!cancelled) {
            setAllFactRows(null);
            setFactError(String(err));
          }
        }
      }
    }

    loadFact();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Build indicator aggregation helper
  // ---------------------------------------------------------------------------
  const buildIndicatorRowsForCodes = (muniCodes: Set<string>): any[] => {
    const base = indicators || [];
    const fact = allFactRows;

    const ensureIdFromFact = (r: any): string =>
      ensureStr(r.IndicatorID ?? r.IndicatorId ?? r.INDICATOR_ID ?? r.Id ?? r.id ?? "");

    const ensureIdFromIndicator = (ind: any): string =>
      ensureStr(ind.IndicatorID ?? ind.ID ?? ind.Id ?? ind.id ?? "");

    if (!Array.isArray(fact) || !fact.length || !muniCodes.size) {
      return (base as any[]).map((ind) => ({
        IndicatorName: ind.IndicatorName || ind.Name || ind.Label || "",
        Theme: ind.Theme || ind.Them || ind.Category || "",
        ValueParsed: null,
      }));
    }

    const groups: Record<string, number[]> = {};
    (fact as any[]).forEach((r) => {
      const code = ensureStr(r.muni_code ?? r.MunicipalityCode ?? r.MunicipalCode ?? r.Municipality);
      if (!code || !muniCodes.has(code)) return;
      const id = ensureIdFromFact(r);
      if (!id) return;
      const v = numericVal(r.ValueParsed ?? r.ValueRaw ?? r.Value ?? null);
      if (v == null) return;
      if (!groups[id]) groups[id] = [];
      groups[id].push(v);
    });

    return (base as any[]).map((ind) => {
      const id = ensureIdFromIndicator(ind);
      const vals = groups[id] || [];
      const avg = vals.length ? mean(vals) : null;
      return {
        IndicatorName: ind.IndicatorName || ind.Name || ind.Label || id,
        Theme: ind.Theme || ind.Them || ind.Category || "",
        ValueParsed: avg,
      };
    });
  };

  // indicator columns (no ID/source)
  const indicatorColumns = [
    { key: "IndicatorName", label: "Indicator" },
    { key: "Theme", label: "Theme" },
    { key: "ValueParsed", label: "Value (avg)" },
  ];

  // ---------------------------------------------------------------------------
  // Province profile (use dim mapping to find themeRows that belong to selected province)
  // ---------------------------------------------------------------------------
  const provincialThemeRows = useMemo(() => {
    if (!selectedProvId) return [];
    const muniCodesInProv = new Set<string>();
    muniDimLookup.forEach((v, code) => {
      if (v.prov_code === selectedProvId) muniCodesInProv.add(code);
    });
    if (!muniCodesInProv.size) return [];
    return themeRows.filter((r) => {
      const code = getMuniCodeFromAny(r);
      return code && muniCodesInProv.has(code);
    });
  }, [selectedProvId, muniDimLookup, themeRows]);

  const provincialThemeAverages: Record<string, number | null> = useMemo(() => {
    const out: Record<string, number | null> = {};
    if (!provincialThemeRows.length) return out;
    themeColumns.forEach((c) => {
      const vals = provincialThemeRows.map((r) => numericVal(r[c])).filter((v: any) => v != null) as number[];
      out[c] = vals.length ? mean(vals) : null;
    });
    return out;
  }, [provincialThemeRows, themeColumns]);

  const provincialMuniCodes = useMemo(() => {
    return new Set(provincialThemeRows.map((r) => getMuniCodeFromAny(r)).filter(Boolean));
  }, [provincialThemeRows]);

  const provincialIndicatorRows = useMemo(() => {
    return selectedProvId ? buildIndicatorRowsForCodes(provincialMuniCodes) : [];
  }, [provincialMuniCodes, indicators, allFactRows, selectedProvId]);

  const provincialPdiAvg = useMemo(() => {
    if (!pdiRows.length || !selectedProvId) return null;
    const rows = pdiRows.filter((r) => {
      const code = ensureStr(r.prov_code ?? r.Province ?? r.ProvinceCode ?? r.ProvinceName);
      return code === selectedProvId;
    });
    const vals = rows.map((r) => numericVal(r.PDI_MINMAX ?? r.PDI ?? r.PDI_VALUE ?? r.PDI_MinMax)).filter((v) => v != null) as number[];
    return vals.length ? mean(vals) : null;
  }, [pdiRows, selectedProvId]);

  const selectedProvName = useMemo(() => {
    // use dim lookup to get a display name
    const entry = Array.from(muniDimLookup.values()).find((v) => v.prov_code === selectedProvId);
    return entry ? (entry.prov_name || selectedProvId) : "";
  }, [muniDimLookup, selectedProvId]);

  // ---------------------------------------------------------------------------
  // District profile (use dim mapping)
  // ---------------------------------------------------------------------------
  const districtThemeRowsSelected = useMemo(() => {
    if (!selectedDistId) return [];
    const muniCodesInDist = new Set<string>();
    muniDimLookup.forEach((v, code) => {
      if (v.dist_code === selectedDistId) muniCodesInDist.add(code);
    });
    if (!muniCodesInDist.size) return [];
    return themeRows.filter((r) => {
      const code = getMuniCodeFromAny(r);
      return code && muniCodesInDist.has(code);
    });
  }, [selectedDistId, muniDimLookup, themeRows]);

  const districtThemeAverages: Record<string, number | null> = useMemo(() => {
    const out: Record<string, number | null> = {};
    if (!districtThemeRowsSelected.length) return out;
    themeColumns.forEach((c) => {
      const vals = districtThemeRowsSelected.map((r) => numericVal(r[c])).filter((v: any) => v != null) as number[];
      out[c] = vals.length ? mean(vals) : null;
    });
    return out;
  }, [districtThemeRowsSelected, themeColumns]);

  const districtMuniCodes = useMemo(() => {
    return new Set(districtThemeRowsSelected.map((r) => getMuniCodeFromAny(r)).filter(Boolean));
  }, [districtThemeRowsSelected]);

  const districtIndicatorRows = useMemo(() => {
    return selectedDistId ? buildIndicatorRowsForCodes(districtMuniCodes) : [];
  }, [districtMuniCodes, indicators, allFactRows, selectedDistId]);

  const districtPdiAvg = useMemo(() => {
    if (!pdiRows.length || !selectedDistId) return null;
    const rows = pdiRows.filter((r) => {
      const d = ensureStr(r.dist_code ?? r.DistrictCode ?? r.District ?? r.DistrictName);
      return d === selectedDistId;
    });
    const vals = rows.map((r) => numericVal(r.PDI_MINMAX ?? r.PDI ?? r.PDI_VALUE ?? r.PDI_MinMax)).filter((v) => v != null) as number[];
    return vals.length ? mean(vals) : null;
  }, [pdiRows, selectedDistId]);

  const selectedDistName = useMemo(() => {
    const entry = Array.from(muniDimLookup.values()).find((v) => v.dist_code === selectedDistId);
    return entry ? (entry.dist_name || selectedDistId) : "";
  }, [muniDimLookup, selectedDistId]);

  // ---------------------------------------------------------------------------
  // Municipality profile (detailed)
  // ---------------------------------------------------------------------------
  const themeRowMuni = useMemo(() => {
    if (!selectedMuniCode) return null;
    return themeRows.find((r) => {
      const code = getMuniCodeFromAny(r);
      return code === selectedMuniCode;
    }) || null;
  }, [themeRows, selectedMuniCode]);

  const themeValuesMuni: Record<string, number | null> = useMemo(() => {
    const out: Record<string, number | null> = {};
    if (!themeRowMuni) return out;
    themeColumns.forEach((c) => {
      out[c] = numericVal(themeRowMuni[c]);
    });
    return out;
  }, [themeRowMuni, themeColumns]);

  const themeRanksMuni: Record<string, number | null> = useMemo(() => {
    const out: Record<string, number | null> = {};
    if (!themeRowMuni) return out;
    themeColumns.forEach((c) => {
      const all = (themeStatsAll[c]?.values ?? []).slice().sort((a, b) => b - a);
      const val = numericVal(themeRowMuni[c]);
      if (val == null || !all.length) {
        out[c] = null;
      } else {
        const idx = all.indexOf(val);
        out[c] = idx !== -1 ? idx + 1 : null;
      }
    });
    return out;
  }, [themeRowMuni, themeColumns, themeStatsAll]);

  const muniPdiValue = useMemo(() => {
    if (!selectedMuniCode) return null;
    const row = pdiRows.find((r) => {
      const code = getMuniCodeFromAny(r);
      return code === selectedMuniCode;
    });
    if (!row) return null;
    return numericVal(row.PDI_MINMAX ?? row.PDI ?? row.PDI_VALUE ?? row.PDI_MinMax);
  }, [pdiRows, selectedMuniCode]);

  const muniIndicatorRows = useMemo(() => {
    return selectedMuniCode ? buildIndicatorRowsForCodes(new Set([selectedMuniCode])) : [];
  }, [selectedMuniCode, indicators, allFactRows]);

  const municipalityDimObj = useMemo(() => {
    if (!selectedMuniCode) return null;
    return muniDimLookup.get(selectedMuniCode) || null;
  }, [muniDimLookup, selectedMuniCode]);

  const displayName =
    municipalityDimObj?.muni_name ??
    themeRowMuni?.MunicipalityName ??
    themeRowMuni?.Municipality ??
    "";

  const muniProvince =
    municipalityDimObj?.prov_name ??
    (themeRowMuni ? ensureStr(themeRowMuni.ProvinceName ?? themeRowMuni.Province) : "");

  const muniDistrict =
    municipalityDimObj?.dist_name ??
    (themeRowMuni ? ensureStr(themeRowMuni.DistrictName ?? themeRowMuni.District) : "");

  const muniMiif = municipalityDimObj?.miif_category ?? themeRowMuni?.MIIF_Category ?? "—";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Municipality Profile</h1>

      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
        View how themes and indicators roll up at <strong>province</strong>, <strong>district</strong> and <strong>municipality</strong> level. Each panel has its own selector and shows aggregated values for that geography.
      </p>

      {/* ----------------------- Provincial profile --------------------------- */}
      <Card title="Provincial profile">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0, maxWidth: 520 }}>
            Aggregated view of theme scores and indicators for the selected <strong>province</strong>. Values are averages across all municipalities in that province, with national averages shown for context.
          </p>

          <div style={{ minWidth: 220 }}>
            <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 4 }}>Province</label>
            <select value={selectedProvId} onChange={(e) => setSelectedProvId(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#ffffff" }}>
              <option value="">Select province…</option>
              {provinceOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {!selectedProvId ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>Select a province above to see its profile.</div>
        ) : provincialThemeRows.length === 0 ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>No municipalities found for this province.</div>
        ) : (
          <>
            <div style={{ display: "grid",
                          gridTemplateColumns: "1fr 300px",
                          gap: 48, 
                          alignItems: "flex-start" 
              }}
            >
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>Theme scores</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 48 }}>
                  {themeColumns.map((t) => {
                    const provAvg = provincialThemeAverages[t];
                    const natAvg = themeStatsAll[t]?.avg ?? null;
                    return (
                      <Card key={`prov-${t}`} title={<span style={{ fontSize: 18, fontWeight: 600 }}>{t}</span>}>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{provAvg != null ? provAvg.toFixed(3) : "—"}</div>
                        <div style={{ color: "#666", marginTop: 6, fontSize: 11 }}>National avg: {natAvg != null ? natAvg.toFixed(3) : "—"}</div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div style={{ transform: "translateX(12px)" }}>
                <Card title="PDI & quick metrics">
                  <div style={{ fontSize: 12, wordBreak: "break-word",  display: "flex", flexDirection: "column"}}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{provincialPdiAvg != null ? provincialPdiAvg.toFixed(3) : "—"}</div>
                  <div style={{ color: "#666", marginTop: 8, marginBottom: 8, fontSize: 12 }}>
                    PDI (average) for across this district.</div>
                  <div style={{ fontSize: 12 }}>
                      <div><strong>Province:</strong> {selectedProvName || selectedProvId || "province"  || "-"}</div>
                  </div>
                   <div style={{ fontSize: 12 }}>
                      <div><strong>Districts:</strong> {provincialThemeRows.length}</div>
                  </div>
                  <div style={{ fontSize: 12 }}>
                      <div><strong>Municipalities:</strong> {provincialThemeRows.length}</div>
                  </div>
                 </div>
                </Card>
             </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Card title="Indicators">
                <div style={{ fontSize: 12, maxHeight: 220, overflow: "auto" }}>
                  <SortableTable rows={provincialIndicatorRows} columns={indicatorColumns} />
                </div>
                {allFactRows === "LOADING" && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>Loading fact table…</div>}
                {factError && <div style={{ marginTop: 8, fontSize: 12, color: "crimson" }}>{factError}</div>}
              </Card>
            </div>
          </>
        )}
      </Card>

      {/* ----------------------- District profile --------------------------- */}
      <div style={{ marginTop: 14 }}>
        <Card title="District profile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0, maxWidth: 520 }}>
              Aggregated themes and indicators for the selected <strong>district</strong>. Values are averages across all municipalities in the district.
            </p>

            <div style={{ minWidth: 220 }}>
              <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 4 }}>District</label>
              <select value={selectedDistId} onChange={(e) => setSelectedDistId(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#ffffff" }}>
                <option value="">Select district…</option>
                {districtOptions.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {!selectedDistId ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Select a district above to see its profile.</div>
          ) : districtThemeRowsSelected.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>No municipalities found for this district.</div>
          ) : (
            <>
              <div style={{ display: "grid", 
                          gridTemplateColumns: "1fr 300px",
                          gap: 12, 
                          alignItems: "flex-start" 
              }}
            >
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>Theme scores</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 8 }}>
                    {themeColumns.map((t) => {
                      const distAvg = districtThemeAverages[t];
                      return (
                        <Card key={`dist-${t}`} title={<span style={{ fontSize: 18, fontWeight: 600 }}>{t}</span>}>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{distAvg != null ? distAvg.toFixed(3) : "—"}</div>
                          <div style={{ color: "#666", marginTop: 6, fontSize: 11 }}>District avg</div>
                          <div style={{ color: "#666", marginTop: 6, fontSize: 11 }}>Municipalities: {districtThemeRowsSelected.length}</div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

              <div>
                  <Card title="PDI & quick metrics">
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{districtPdiAvg != null ? districtPdiAvg.toFixed(3) : "—"}</div>
                    <div style={{ color: "#666", marginTop: 8, marginBottom: 8, fontSize: 12 }}>PDI (average) for across this district.</div>
                    <div style={{ fontSize: 12 }}>
                      <div><strong>Province:</strong> {muniProvince || "—"}</div>
                    </div>
                  </Card>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <Card title="District Indicators">
                  <div style={{ fontSize: 12, maxHeight: 220, overflow: "auto" }}>
                    <SortableTable rows={districtIndicatorRows} columns={indicatorColumns} />
                  </div>
                  {allFactRows === "LOADING" && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>Loading fact table…</div>}
                  {factError && <div style={{ marginTop: 8, fontSize: 12, color: "crimson" }}>{factError}</div>}
                </Card>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ----------------------- Municipality profile --------------------------- */}
      <div style={{ marginTop: 14 }}>
        <Card title="Municipality profile">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{selectedMuniCode ? displayName :             
                 <p style={{ fontSize: 12, color: "#6b7280", margin: 0, maxWidth: 520 }}>
                    Actual themes and indicators for the selected <strong>municiplity</strong>. Values are actuals for the municipalities.
                 </p>}
              </div>
              {selectedMuniCode && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {muniProvince && `${muniProvince} • `}District: {muniDistrict || "—"} • MIIF: {muniMiif}
                </div>
              )}
            </div>

            <div style={{ minWidth: 260 }}>
              <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 4 }}>Municipality</label>
              <select value={selectedMuniCode} onChange={(e) => setSelectedMuniCode(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "#ffffff" }}>
                <option value="">Select municipality…</option>
                {municipalityOptions.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {!selectedMuniCode ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Select a municipality above to see detailed scores and indicators.</div>
          ) : !themeRowMuni ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>No data found for this municipality.</div>
          ) : (
            <>
              <div style={{ display: "grid", 
                          gridTemplateColumns: "1fr 300px",
                          gap: 12, 
                          alignItems: "flex-start" 
              }}
            >
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>Theme scores</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 8 }}>
                    {themeColumns.map((t) => {
                      const val = themeValuesMuni[t];
                      const avg = themeStatsAll[t]?.avg ?? null;
                      const rank = themeRanksMuni[t];
                      const n = themeStatsAll[t]?.values?.length ?? 0;
                      return (
                        <Card key={`muni-${t}`} title={<span style={{ fontSize: 18, fontWeight: 600 }}>{t}</span>}>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{val != null ? val.toFixed(3) : "—"}</div>
                          <div style={{ color: "#666", marginTop: 6, fontSize: 11 }}>National avg: {avg != null ? avg.toFixed(3) : "—"}</div>
                          <div style={{ marginTop: 6, fontSize: 11 }}>{rank ? `Rank: ${rank} / ${n}` : "Rank: —"}</div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

              <div>
                  <Card title="PDI & quick metrics">
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{muniPdiValue != null ? muniPdiValue.toFixed(3) : "—"}</div>
                    <div style={{ color: "#666", marginTop: 8, marginBottom: 8, fontSize: 12 }}>PDI (min-max scaled) for this municipality.</div>
                    <div style={{ fontSize: 12 }}>
                      <div><strong>Province:</strong> {muniProvince || "—"}</div>
                      <div><strong>District:</strong> {muniDistrict || "—"}</div>
                      <div><strong>MIIF category:</strong> {muniMiif}</div>
                      <div style={{ marginTop: 8 }}>
                        <strong>Coordinates</strong>
                        <div style={{ color: "#666" }}>
                          {(municipalityDimObj?.lat ?? themeRowMuni?.Latitude ?? "—") + ", "}{(municipalityDimObj?.lon ?? themeRowMuni?.Longitude ?? "—")}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <Card title="Local Municipality Indicators">
                  <div style={{ fontSize: 12, maxHeight: 360, overflow: "auto" }}>
                    <SortableTable rows={muniIndicatorRows} columns={indicatorColumns} />
                  </div>
                  {allFactRows === "LOADING" && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>Loading fact table…</div>}
                  {factError && <div style={{ marginTop: 8, fontSize: 12, color: "crimson" }}>{factError}</div>}
                </Card>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;
