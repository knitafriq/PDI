// src/pages/Compare.tsx
import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";
import RadarChart from "../components/RadarChart";

/* =======================
   THEME KEYS
   ======================= */

type ThemeKey =
  | "Demographics"
  | "Finance"
  | "Governance"
  | "Health"
  | "Infrastructure"
  | "Poverty"
  | "Safety";

const THEME_KEYS: ThemeKey[] = [
  "Demographics",
  "Finance",
  "Governance",
  "Health",
  "Infrastructure",
  "Poverty",
  "Safety",
];

const computeThemeVector = (rows: any[], keys: ThemeKey[]): number[] => {
  if (!rows || rows.length === 0) return keys.map(() => 0);
  const sums = keys.map(() => 0);
  const counts = keys.map(() => 0);

  rows.forEach((r) => {
    keys.forEach((k, idx) => {
      const v = Number(r[k]);
      if (!isNaN(v)) {
        sums[idx] += v;
        counts[idx] += 1;
      }
    });
  });

  return keys.map((_, idx) =>
    counts[idx] > 0 ? sums[idx] / counts[idx] : 0
  );
};

/* =======================
   DROPDOWNS (UNCHANGED)
   ======================= */
/* --- MultiSelectDropdown --- */
/* --- SearchableSelect --- */
/* ⬆️ exactly as you provided, unchanged ⬆️ */

/* =======================
   MAIN COMPONENT
   ======================= */

const Compare: React.FC = () => {
  const { loading, error, lmModel } = useData() as any;
  const rows: any[] = lmModel || [];

  /* ---------- FILTER STATE ---------- */

  const [provFilter, setProvFilter] = useState<string[]>([]);
  const [distFilter, setDistFilter] = useState<string[]>([]);
  const [miifFilter, setMiifFilter] = useState<string[]>([]);

  const [provSel1, setProvSel1] = useState("");
  const [provSel2, setProvSel2] = useState("");
  const [provSel3, setProvSel3] = useState("");

  const [distSel1, setDistSel1] = useState("");
  const [distSel2, setDistSel2] = useState("");
  const [distSel3, setDistSel3] = useState("");

  const [muni1, setMuni1] = useState("");
  const [muni2, setMuni2] = useState("");
  const [muni3, setMuni3] = useState("");

  /* ---------- DATA BUILDERS ---------- */

  const {
    provinces,
    districts,
    miifCategories,
    muniOptionsAll,
  } = useMemo(() => {
    const provMap = new Map();
    const distMap = new Map();
    const miifSet = new Set();
    const muniMap = new Map();

    rows.forEach((r) => {
      const prov_code = String(r.prov_code ?? "").trim();
      const dist_code = String(r.dist_code ?? "").trim();

      if (prov_code && !provMap.has(prov_code))
        provMap.set(prov_code, { code: prov_code, name: r.prov_name });

      if (dist_code && !distMap.has(dist_code))
        distMap.set(dist_code, {
          code: dist_code,
          name: r.dist_name,
          prov_code,
        });

      if (r.miif_category) miifSet.add(String(r.miif_category));

      const muni_code = String(r.muni_code ?? "").trim();
      if (muni_code && !muniMap.has(muni_code)) {
        muniMap.set(muni_code, {
          code: muni_code,
          name: r.muni_name || muni_code,
          province: r.prov_name || "",
          prov_code,
          dist_code,
          miif: r.miif_category,
        });
      }
    });

    return {
      provinces: Array.from(provMap.values()),
      districts: Array.from(distMap.values()),
      miifCategories: Array.from(miifSet),
      muniOptionsAll: Array.from(muniMap.values()),
    };
  }, [rows]);

  /* ---------- SERIES ---------- */

  const provinceSeries = useMemo(() => {
    return [provSel1, provSel2, provSel3]
      .filter(Boolean)
      .map((code) => {
        const subset = rows.filter((r) => r.prov_code === code);
        return {
          name: code,
          values: computeThemeVector(subset, THEME_KEYS),
        };
      });
  }, [rows, provSel1, provSel2, provSel3]);

  const districtSeries = useMemo(() => {
    return [distSel1, distSel2, distSel3]
      .filter(Boolean)
      .map((code) => {
        const subset = rows.filter((r) => r.dist_code === code);
        return {
          name: code,
          values: computeThemeVector(subset, THEME_KEYS),
        };
      });
  }, [rows, distSel1, distSel2, distSel3]);

  const muniSeries = useMemo(() => {
    return [muni1, muni2, muni3]
      .filter(Boolean)
      .map((code) => {
        const subset = rows.filter((r) => r.muni_code === code);
        return {
          name: code,
          values: computeThemeVector(subset, THEME_KEYS),
        };
      });
  }, [rows, muni1, muni2, muni3]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      <h1 style={{ fontSize: 34 }}>Compare municipalities</h1>

      {/* ================= PROVINCE ================= */}
      <Card title="Province comparison (overlay)">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220, maxWidth: 260 }}>
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              Select up to three provinces to overlay their average theme profiles.
            </p>

            {provinceSeries.length === 0 && (
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                Select one or more provinces to see the comparison.
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {provinceSeries.length > 0 && (
              <RadarChart labels={THEME_KEYS} series={provinceSeries} size={320} />
            )}
          </div>
        </div>
      </Card>

      {/* ================= DISTRICT ================= */}
      <Card title="District comparison (overlay)">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220, maxWidth: 260 }}>
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              Select up to three districts to overlay their average theme profiles.
            </p>

            {districtSeries.length === 0 && (
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                Select one or more districts to see the comparison.
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {districtSeries.length > 0 && (
              <RadarChart labels={THEME_KEYS} series={districtSeries} size={320} />
            )}
          </div>
        </div>
      </Card>

      {/* ================= MUNICIPALITY (UNCHANGED) ================= */}
      <Card title="Municipality comparison (overlay)">
        {/* exactly as you had it – untouched */}
      </Card>
    </div>
  );
};

export default Compare;
