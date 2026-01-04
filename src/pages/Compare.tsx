// src/pages/Compare.tsx
import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";
import RadarChart from "../components/RadarChart";

/* =========================
   THEME DEFINITIONS
========================= */

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
  if (!rows?.length) return keys.map(() => 0);
  const sums = keys.map(() => 0);
  const counts = keys.map(() => 0);

  rows.forEach((r) =>
    keys.forEach((k, i) => {
      const v = Number(r[k]);
      if (!isNaN(v)) {
        sums[i] += v;
        counts[i] += 1;
      }
    })
  );

  return keys.map((_, i) => (counts[i] ? sums[i] / counts[i] : 0));
};

/* =========================
   SEARCHABLE SELECT
========================= */

interface SearchableOpt {
  value: string;
  label: string;
}
interface SearchableSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SearchableOpt[];
  label?: string;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = "— None —",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const qq = q.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(qq) ||
        o.value.toLowerCase().includes(qq)
    );
  }, [options, q]);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? "";

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 10 }}>
      {label && (
        <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>
          {label}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          height: 40,
          padding: "0 36px 0 12px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          background: "#fff",
          fontSize: 13,
          textAlign: "left",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundImage:
            "linear-gradient(45deg, transparent 50%, #374151 50%), linear-gradient(135deg, #374151 50%, transparent 50%)",
          backgroundPosition:
            "calc(100% - 16px) 50%, calc(100% - 11px) 50%",
          backgroundSize: "5px 5px, 5px 5px",
          backgroundRepeat: "no-repeat",
        }}
      >
        {selectedLabel || placeholder}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1200,
            width: "100%",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
            padding: 8,
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              marginBottom: 8,
              fontSize: 13,
            }}
          />

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            <div
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              style={{ padding: "6px 8px", cursor: "pointer" }}
            >
              <em style={{ color: "#6b7280" }}>— None —</em>
            </div>

            {filtered.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setQ("");
                }}
                style={{
                  padding: "6px 8px",
                  cursor: "pointer",
                  borderRadius: 4,
                  background:
                    opt.value === value ? "#f3f4f6" : "transparent",
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================
   MAIN PAGE
========================= */

const Compare: React.FC = () => {
  const { loading, error, lmModel } = useData() as any;
  const rows: any[] = lmModel || [];

  const [prov1, setProv1] = useState("");
  const [prov2, setProv2] = useState("");
  const [prov3, setProv3] = useState("");

  const [dist1, setDist1] = useState("");
  const [dist2, setDist2] = useState("");
  const [dist3, setDist3] = useState("");

  const provinces = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.prov_code))
      ).map((p) => ({
        value: p,
        label: p,
      })),
    [rows]
  );

  const districts = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.dist_code))
      ).map((d) => ({
        value: d,
        label: d,
      })),
    [rows]
  );

  const provinceSeries = useMemo(() => {
    return [prov1, prov2, prov3]
      .filter(Boolean)
      .map((code) => ({
        name: code,
        values: computeThemeVector(
          rows.filter((r) => r.prov_code === code),
          THEME_KEYS
        ),
      }));
  }, [rows, prov1, prov2, prov3]);

  const districtSeries = useMemo(() => {
    return [dist1, dist2, dist3]
      .filter(Boolean)
      .map((code) => ({
        name: code,
        values: computeThemeVector(
          rows.filter((r) => r.dist_code === code),
          THEME_KEYS
        ),
      }));
  }, [rows, dist1, dist2, dist3]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>
        Compare municipalities
      </h1>

      {/* ================= PROVINCE ================= */}
      <Card title="Province comparison (overlay)">
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          Select one or more provinces to see the comparison.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220, maxWidth: 260 }}>
            <SearchableSelect label="Province 1" value={prov1} onChange={setProv1} options={provinces} />
            <SearchableSelect label="Province 2" value={prov2} onChange={setProv2} options={provinces} />
            <SearchableSelect label="Province 3" value={prov3} onChange={setProv3} options={provinces} />
          </div>

          <div style={{ flex: 1, minWidth: 320, display: "flex", justifyContent: "center" }}>
            {provinceSeries.length ? (
              <RadarChart labels={THEME_KEYS} series={provinceSeries} size={320} />
            ) : null}
          </div>
        </div>
      </Card>

      {/* ================= DISTRICT ================= */}
      <div style={{ marginTop: 14 }}>
        <Card title="District comparison (overlay)">
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Select one or more districts to see the comparison.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 220, maxWidth: 260 }}>
              <SearchableSelect label="District 1" value={dist1} onChange={setDist1} options={districts} />
              <SearchableSelect label="District 2" value={dist2} onChange={setDist2} options={districts} />
              <SearchableSelect label="District 3" value={dist3} onChange={setDist3} options={districts} />
            </div>

            <div style={{ flex: 1, minWidth: 320, display: "flex", justifyContent: "center" }}>
              {districtSeries.length ? (
                <RadarChart labels={THEME_KEYS} series={districtSeries} size={320} />
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Compare;
