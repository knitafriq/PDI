// src/pages/Compare.tsx
import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";
import RadarChart from "../components/RadarChart";

// ---------- Theme keys (aligned with Themes page) ----------
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

// ---------- Reusable multi-select dropdown (kept for filters) ----------
type MultiSelectOption = { value: string; label: string };

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxLabelCount?: number;
  searchable?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectProps> = ({
  label,
  options,
  values,
  onChange,
  placeholder = "All",
  maxLabelCount = 1,
  searchable = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const summaryLabel = (() => {
    if (!values.length) return placeholder;
    const selectedOptions = options.filter((o) =>
      values.includes(o.value)
    );
    if (!selectedOptions.length) return placeholder;
    const firstLabels = selectedOptions
      .slice(0, maxLabelCount)
      .map((o) => o.label);
    const extra = selectedOptions.length - maxLabelCount;
    if (extra > 0) {
      return `${firstLabels.join(", ")} +${extra}`;
    }
    return firstLabels.join(", ");
  })();

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter((o) =>
      o.label.toLowerCase().includes(q)
    );
  }, [options, searchable, searchTerm]);

  return (
    <div
  ref={containerRef}
  style={{
    position: "relative",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>

      <span style={{ color: "#4b5563" }}>{label}:</span>
<button
  type="button"
  onClick={() => setOpen((o) => !o)}
  style={{
    fontSize: 12,
    padding: "6px 28px 6px 10px", // 🔑 room for arrow
    borderRadius: 6,
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    minWidth: 180,
    textAlign: "left",
    cursor: "pointer",

    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",

    backgroundImage:
      "linear-gradient(45deg, transparent 50%, #374151 50%), linear-gradient(135deg, #374151 50%, transparent 50%)",
    backgroundPosition:
      "calc(100% - 16px) calc(50% - 3px), calc(100% - 11px) calc(50% - 3px)",
    backgroundSize: "5px 5px, 5px 5px",
    backgroundRepeat: "no-repeat",
  }}
>
  <span
    style={{
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
    {summaryLabel}
  </span>
</button>


      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1200,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: 8,
            maxHeight: 280,
            overflowY: "auto",
            minWidth: 260,
            boxShadow: "0 8px 20px rgba(15,23,42,0.12)",
          }}
        >
          {searchable && (
            <div style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #e6e6e6",
                }}
              />
            </div>
          )}

          {filteredOptions.map((opt) => (
            <label key={opt.value} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 2px", cursor: "pointer" }}>
              <input type="checkbox" checked={values.includes(opt.value)} onChange={() => toggleValue(opt.value)} />
              <div style={{ fontSize: 13 }}>{opt.label}</div>
            </label>
          ))}

          {filteredOptions.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>No options</div>}

          <div style={{ marginTop: 8, borderTop: "1px solid #f1f1f1", paddingTop: 8, textAlign: "right" }}>
            <button onClick={() => onChange([])} style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer" }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Searchable single-select dropdown for selectors ----------
interface SearchableOpt { value: string; label: string; }
interface SearchableSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SearchableOpt[];
  placeholder?: string;
  label?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ value, onChange, options, placeholder = "— None —", label }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const qq = q.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(qq) || o.value.toLowerCase().includes(qq));
  }, [options, q]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div
  ref={containerRef}
  style={{ position: "relative", marginBottom: 8 }}
>

      {label && <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>}
<button
  type="button"
  onClick={() => setOpen((s) => !s)}
  style={{
    width: "100%",
    height: 40,                 // 🔑 fixed height
    padding: "0 36px 0 12px",    // 🔑 space for caret
    borderRadius: 6,
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: 13,

    display: "flex",
    alignItems: "center",

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
  <span
    style={{
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "100%",
    }}
  >
    {selectedLabel || placeholder}
  </span>
</button>



      {open && (
        <div style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 1200, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, width: "100%", boxShadow: "0 8px 20px rgba(15,23,42,0.08)", padding: 8 }}>
          <input
  value={q}
  onChange={(e) => setQ(e.target.value)}
  placeholder="Search..."
  style={{
    width: "100%",
    boxSizing: "border-box",   // 🔑 critical fix
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    marginBottom: 8,
    fontSize: 13,
  }}
/>

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            <div onClick={() => { onChange(""); setOpen(false); }} style={{ padding: "6px 8px", cursor: "pointer" }}>
              <em style={{ color: "#6b7280" }}>— None —</em>
            </div>
            {filtered.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); setQ(""); }}
                style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, background: opt.value === value ? "#f3f4f6" : "transparent" }}
              >
                {opt.label}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: "#9ca3af", padding: "6px 8px" }}>No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- MAIN COMPONENT ----------
type MuniOption = {
  code: string;
  name: string;
  province: string;
  prov_code?: string;
  dist_code?: string;
  miif?: string;
};

const Compare: React.FC = () => {
  const { loading, error, lmModel } = useData() as any;
  const rows: any[] = lmModel || [];

  // top filter state (we will only render these inside municipal card)
  const [provFilter, setProvFilter] = useState<string[]>([]);
  const [distFilter, setDistFilter] = useState<string[]>([]);
  const [miifFilter, setMiifFilter] = useState<string[]>([]);

  // Province selectors (three)
  const [provSel1, setProvSel1] = useState<string>("");
  const [provSel2, setProvSel2] = useState<string>("");
  const [provSel3, setProvSel3] = useState<string>("");

  // District selectors (three)
  const [distSel1, setDistSel1] = useState<string>("");
  const [distSel2, setDistSel2] = useState<string>("");
  const [distSel3, setDistSel3] = useState<string>("");

  // Municipality selectors (three)
  const [muni1, setMuni1] = useState<string>("");
  const [muni2, setMuni2] = useState<string>("");
  const [muni3, setMuni3] = useState<string>("");

  // build dimension lists & muni list
  const {
    provinces,
    districts,
    miifCategories,
    muniOptionsAll,
  }: {
    provinces: { code: string; name?: string }[];
    districts: { code: string; name?: string; prov_code?: string }[];
    miifCategories: string[];
    muniOptionsAll: MuniOption[];
  } = useMemo(() => {
    const provMap = new Map<string, { code: string; name?: string }>();
    const distMap = new Map<string, { code: string; name?: string; prov_code?: string }>();
    const miifSet = new Set<string>();
    const muniMap = new Map<string, MuniOption>();

    rows.forEach((r) => {
      const prov_code = String(r.prov_code ?? "").trim();
      const dist_code = String(r.dist_code ?? "").trim();
      const prov_name = (r.prov_name as string) || undefined;
      const dist_name = (r.dist_name as string) || undefined;

      const muni_code = String(r.muni_code ?? r.MunicipalityCode ?? "").trim();
      const muni_name = (r.muni_name as string) || (r.MunicipalityName as string) || (r.Municipality as string) || undefined;

      const miif = String(r.miif_category ?? r.MIIF_CATEGORY ?? r.MIIF_Category ?? "").trim();

      if (prov_code && !provMap.has(prov_code)) provMap.set(prov_code, { code: prov_code, name: prov_name });
      if (dist_code && !distMap.has(dist_code)) distMap.set(dist_code, { code: dist_code, name: dist_name, prov_code });
      if (miif) miifSet.add(miif);

      if (muni_code && !muniMap.has(muni_code)) {
        muniMap.set(muni_code, {
          code: muni_code,
          name: muni_name || muni_code,
          province: (r.prov_name as string) || (r.ProvinceName as string) || (r.Province as string) || "",
          prov_code: prov_code || undefined,
          dist_code: dist_code || undefined,
          miif: miif || undefined,
        });
      }
    });

    const provArr = Array.from(provMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    const distArr = Array.from(distMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    const miifArr = Array.from(miifSet).sort((a, b) => a.localeCompare(b));
    const muniArr = Array.from(muniMap.values()).sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));

    return { provinces: provArr, districts: distArr, miifCategories: miifArr, muniOptionsAll: muniArr };
  }, [rows]);

  // restrict by top filters (districts & municipalities)
  const districtsFiltered = useMemo(() => {
    let out = districts;
    if (provFilter.length) out = out.filter((d) => d.prov_code && provFilter.includes(String(d.prov_code)));
    return out;
  }, [districts, provFilter]);

  const muniOptions: MuniOption[] = useMemo(() => {
    let out = muniOptionsAll;
    if (provFilter.length) {
      out = out.filter((m) => m.prov_code && provFilter.includes(String(m.prov_code)));
    }
    if (distFilter.length) {
      out = out.filter((m) => m.dist_code && distFilter.includes(String(m.dist_code)));
    }
    if (miifFilter.length) {
      out = out.filter((m) => m.miif && miifFilter.includes(m.miif));
    }
    return out;
  }, [muniOptionsAll, provFilter, distFilter, miifFilter]);

  const resetFilters = () => {
    setProvFilter([]);
    setDistFilter([]);
    setMiifFilter([]);
  };

  // ---------- series builders ----------
  const provinceSeries = useMemo(() => {
    const codes = [provSel1, provSel2, provSel3].filter(Boolean);
    const series: { name: string; values: number[] }[] = [];
    codes.forEach((code) => {
      const subset = rows.filter((r) => String(r.prov_code ?? "").trim() === code);
      if (!subset.length) return;
      series.push({ name: (provinces.find((p) => p.code === code)?.name ? `${code} — ${provinces.find((p) => p.code === code)?.name}` : code) as string, values: computeThemeVector(subset, THEME_KEYS) });
    });
    return series;
  }, [rows, provSel1, provSel2, provSel3, provinces]);

  const districtSeries = useMemo(() => {
    const codes = [distSel1, distSel2, distSel3].filter(Boolean);
    const series: { name: string; values: number[] }[] = [];
    codes.forEach((code) => {
      const subset = rows.filter((r) => String(r.dist_code ?? "").trim() === code);
      if (!subset.length) return;
      const d = districts.find((x) => x.code === code);
      const label = d?.name ? `${code} — ${d.name}` : code;
      series.push({ name: label, values: computeThemeVector(subset, THEME_KEYS) });
    });
    return series;
  }, [rows, distSel1, distSel2, distSel3, districts]);

  const muniSeries = useMemo(() => {
    const codes = [muni1, muni2, muni3].filter(Boolean);
    const series: { name: string; values: number[] }[] = [];
    codes.forEach((code) => {
      const subset = rows.filter((r) => String(r.muni_code ?? r.MunicipalityCode ?? "").trim() === code);
      if (!subset.length) return;
      const opt = muniOptionsAll.find((m) => m.code === code);
      const label = opt?.name ? `${opt.name} (${opt.code})` : code;
      series.push({ name: label, values: computeThemeVector(subset, THEME_KEYS) });
    });
    return series;
  }, [rows, muni1, muni2, muni3, muniOptionsAll]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>Error loading data: {String(error)}</div>;

  const provincesForSelectors = provFilter.length > 0 ? provinces.filter((p) => provFilter.includes(p.code)) : provinces;
  const districtsForSelectors = districtsFiltered.length > 0 ? districtsFiltered : districts;

  // helper option lists for searchable selects
  const provOpts = provincesForSelectors.map((p) => ({ value: p.code, label: p.name ? `${p.code} — ${p.name}` : p.code }));
  const distOpts = districtsForSelectors.map((d) => ({ value: d.code, label: d.name ? `${d.code} — ${d.name}` : d.code }));
  const muniOpts = muniOptions.map((m) => ({ value: m.code, label: `${m.name} (${m.code})${m.province ? ` — ${m.province}` : ""}` }));

  return (
    <div>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Compare municipalities</h1>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
        Compare average theme profiles at provincial, district and municipal levels.
      </p>

      <div>
        {/* 1. PROVINCE COMPARE */}
<div style={{ marginTop: 14 }}>
        <Card title="Province comparison (overlay)">
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
               Select up to three provinces to overlay their average theme profiles.
            </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
  {/* LEFT COLUMN */}
  <div style={{ fontSize: 12, minWidth: 220, maxWidth: 260 }}>

    {[[provSel1, setProvSel1], [provSel2, setProvSel2], [provSel3, setProvSel3]].map(
      ([val, setVal], idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <SearchableSelect
            value={val as string}
            onChange={setVal as (v: string) => void}
            options={provOpts}
            label={`Province ${idx + 1}`}
            placeholder="— None —"
          />
        </div>
      )
    )}
  </div>

  {/* RIGHT COLUMN */}
<div style={{ flex: 1, minWidth: 320, display: "flex", flex-wrap: "wrap", justifyContent: "flex-start", padding: "8px 0 28px 0", boxSizing: "border-box" }}>
                {provinceSeries.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280", paddingTop: 24 }}>Select one or more tshepos to see the comparison.</div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 520, overflow: "visible" }}>
                    <RadarChart labels={THEME_KEYS} series={provinceSeries} size={260} gridLevels={4} max={1} />
                  </div>
                )}
              </div>
</div>
        </Card>
</div>
        {/* 2. DISTRICT COMPARE */}
        <div style={{ marginTop: 14 }}>
          <Card title="District comparison (overlay)">
    <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
      Select up to three districts to overlay their average theme profiles.
    </p>
<div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
  {/* LEFT COLUMN */}
  <div style={{ fontSize: 12, minWidth: 220, maxWidth: 260 }}>
    {[[distSel1, setDistSel1], [distSel2, setDistSel2], [distSel3, setDistSel3]].map(
      ([val, setVal], idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <SearchableSelect
            value={val as string}
            onChange={setVal as (v: string) => void}
            options={distOpts}
            label={`District ${idx + 1}`}
            placeholder="— None —"
          />
        </div>
      )
    )}
  </div>

  {/* RIGHT COLUMN */}
<div style={{ flex: 1, minWidth: 320, display: "flex", flex-wrap: "wrap", justifyContent: "flex-start", padding: "8px 0 28px 0", boxSizing: "border-box" }}>
                {districtSeries.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280", paddingTop: 24 }}>Select one or more districts to see the comparison.</div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 520, overflow: "visible" }}>
                    <RadarChart labels={THEME_KEYS} series={districtSeries} size={260} gridLevels={4} max={1} />
                  </div>
                )}
              </div>
</div>
          </Card>
        </div>

        {/* 3. MUNICIPAL COMPARE */}
        <div style={{ marginTop: 14 }}>
          <Card title="Municipality comparison (overlay)">
            {/* 🔧 Top filters returned only for the municipality view */}
            <div style={{ marginBottom: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <MultiSelectDropdown
                label="Province"
                options={provinces.map((p) => ({ value: p.code, label: p.name ? `${p.code} — ${p.name}` : p.code }))}
                values={provFilter}
                onChange={(vals) => { setProvFilter(vals); setDistFilter([]); }}
                placeholder="All provinces"
                searchable
              />
              <MultiSelectDropdown
                label="District"
                options={districts.map((d) => ({ value: d.code, label: d.name ? `${d.code} — ${d.name}` : d.code }))}
                values={distFilter}
                onChange={setDistFilter}
                placeholder="All districts"
                searchable
              />
              <MultiSelectDropdown
                label="MIIF category"
                options={miifCategories.map((c) => ({ value: c, label: c }))}
                values={miifFilter}
                onChange={setMiifFilter}
                placeholder="All categories"
                searchable
              />
              <button type="button" onClick={resetFilters} style={{ height: 36, borderRadius: 6, border: "1px solid #e6e6e6", background: "#fff", padding: "0 10px", cursor: "pointer" }}>Reset</button>
            </div>

            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Select up to three municipalities to overlay their theme profiles.</p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{fontSize: 12, minWidth: 220, maxWidth: 260 }}>
                {[[muni1, setMuni1], [muni2, setMuni2], [muni3, setMuni3]].map(([val, setVal], idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <SearchableSelect value={val as string} onChange={setVal as (v: string) => void} options={muniOpts} label={`Municipality ${idx + 1}`} placeholder="— None —" />
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, minWidth: 320, display: "flex", flex-wrap: "wrap", justifyContent: "flex-start", padding: "8px 0 28px 0", boxSizing: "border-box" }}>
                {muniSeries.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280", paddingTop: 24 }}>Select one or more municipalities to see the comparison.</div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 520, overflow: "visible" }}>
                    <RadarChart labels={THEME_KEYS} series={muniSeries} size={260} gridLevels={4} max={1} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Compare;
 