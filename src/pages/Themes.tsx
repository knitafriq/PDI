import React, { useMemo, useState, useRef, useEffect } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";

type ThemeKey =
  | "Demographics"
  | "Education"
  | "Governance"
  | "Health"
  | "Infrastructure & Services"
  | "Poverty & Inequality"
  | "Safety";

type ThemeSelection = ThemeKey | "ALL";

const THEME_OPTIONS: { key: ThemeKey; label: string }[] = [
  { key: "Demographics", label: "Demographics" },
  { key: "Education", label: "Education" },
  { key: "Governance", label: "Governance" },
  { key: "Health", label: "Health" },
  { key: "Infrastructure & Services", label: "Infrastructure & Services" },
  { key: "Poverty & Inequality", label: "Poverty & Inequality" },
  { key: "Safety", label: "Safety" },
];

// ---------- Reusable slick multi-select dropdown ----------

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

  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  useEffect(() => {
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
        gap: 4,
      }}
    >
      <span style={{ color: "#4b5563" }}>{label}:</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: 12,
          padding: "4px 28px 4px 8px", // room for native arrow look
          borderRadius: 4,
          border: "1px solid #d1d5db",
          background: "#ffffff",
          minWidth: 140,
          maxWidth: 260,
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
            top: "100%",
            left: label ? 52 : 0,
            zIndex: 1000,
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            marginTop: 4,
            padding: 6,
            maxHeight: 260,
            overflowY: "auto",
            minWidth: 200,
            boxShadow: "0 8px 20px rgba(15,23,42,0.15)",
            boxSizing: "border-box",
          }}
        >
          {searchable && (
            <div style={{ marginBottom: 6 }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "4px 6px",
                  borderRadius: 4,
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {filteredOptions.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 2px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={values.includes(opt.value)}
                onChange={() => toggleValue(opt.value)}
                style={{ margin: 0 }}
              />
              <span>{opt.label}</span>
            </label>
          ))}

          {filteredOptions.length === 0 && (
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                padding: "2px 0",
              }}
            >
              No options
            </div>
          )}

          {/* 🔹 Inline reset just for this filter */}
          <div
            style={{
              marginTop: 6,
              paddingTop: 4,
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                fontSize: 11,
                border: "none",
                background: "transparent",
                color: "#F07D00",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- MAIN COMPONENT ----------

const Themes: React.FC = () => {
  const { loading, error, lmModel } = useData() as any;

  const [selectedTheme, setSelectedTheme] =
    useState<ThemeSelection>("ALL"); // default = all themes

  // slicers (multi-select for all except theme)
  const [provFilter, setProvFilter] = useState<string[]>([]);
  const [distFilter, setDistFilter] = useState<string[]>([]);
  const [muniFilter, setMuniFilter] = useState<string[]>([]);
  const [miifFilter, setMiifFilter] = useState<string[]>([]);

  // which provinces in the provincial table are expanded to show districts
  const [expandedProvinces, setExpandedProvinces] =
    useState<string[]>([]);

  // 🔹 global tooltip state (fixed to viewport)
  const [strongTooltip, setStrongTooltip] = useState<{
    themes: ThemeKey[];
    x: number;
    y: number;
  } | null>(null);

  // ---- HARD RESET (filters only) ----
  const resetFilters = () => {
    setProvFilter([]);
    setDistFilter([]);
    setMuniFilter([]);
    setMiifFilter([]);
    setExpandedProvinces([]);
  };

  const rows: any[] = lmModel || [];

  // ---- DISTINCT PROVINCES, DISTRICTS, MUNICIPALITIES & MIIF FOR SLICERS ----
  const {
    provinces,
    districts,
    miifCategories,
    municipalities,
  } = useMemo(() => {
    const provMap = new Map<
      string,
      { code: string; name?: string }
    >();
    const distMap = new Map<
      string,
      { code: string; name?: string; prov_code?: string }
    >();
    const muniMap = new Map<
      string,
      {
        code: string;
        name?: string;
        prov_code?: string;
        dist_code?: string;
      }
    >();
    const miifSet = new Set<string>();

    rows.forEach((r) => {
      const prov_code = String(r.prov_code ?? "").trim();
      const dist_code = String(r.dist_code ?? "").trim();
      const prov_name = r.prov_name as string | undefined;
      const dist_name = r.dist_name as string | undefined;

      const muni_code = String(r.muni_code ?? "").trim();
      const muni_name = r.muni_name as string | undefined;

      const miif = String(
        r.miif_category ??
          r.MIIF_CATEGORY ??
          r.MIIF_Category ??
          ""
      ).trim();

      if (prov_code) {
        if (!provMap.has(prov_code)) {
          provMap.set(prov_code, {
            code: prov_code,
            name: prov_name,
          });
        }
      }
      if (dist_code) {
        if (!distMap.has(dist_code)) {
          distMap.set(dist_code, {
            code: dist_code,
            name: dist_name,
            prov_code,
          });
        }
      }
      if (muni_code) {
        if (!muniMap.has(muni_code)) {
          muniMap.set(muni_code, {
            code: muni_code,
            name: muni_name,
            prov_code,
            dist_code,
          });
        }
      }
      if (miif) {
        miifSet.add(miif);
      }
    });

    const provArr = Array.from(provMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
    const distArr = Array.from(distMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
    const muniArr = Array.from(muniMap.values()).sort((a, b) =>
      (a.name ?? a.code).localeCompare(b.name ?? b.code)
    );
    const miifArr = Array.from(miifSet).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      provinces: provArr,
      districts: distArr,
      miifCategories: miifArr,
      municipalities: muniArr,
    };
  }, [rows]);

  // 🔹 simple lookup for district names by code (for tooltips)
  const districtNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    districts.forEach((d) => {
      if (d.name) {
        map[d.code] = d.name;
      }
    });
    return map;
  }, [districts]);

  // Only show districts of selected province(s) (if any)
  const districtsForFilter = useMemo(() => {
    if (!provFilter.length) return districts;
    return districts.filter(
      (d) =>
        d.prov_code &&
        provFilter.includes(String(d.prov_code))
    );
  }, [districts, provFilter]);

  // Municipalities filtered by selected province/district (for dropdown)
  const municipalitiesForFilter = useMemo(() => {
    if (!provFilter.length && !distFilter.length)
      return municipalities;

    return municipalities.filter((m) => {
      const provOk =
        !provFilter.length ||
        (m.prov_code &&
          provFilter.includes(String(m.prov_code)));
      const distOk =
        !distFilter.length ||
        (m.dist_code &&
          distFilter.includes(String(m.dist_code)));
      return provOk && distOk;
    });
  }, [municipalities, provFilter, distFilter]);

  // ---- APPLY SLICERS TO ROWS ----
  const filteredRows = useMemo(() => {
    let scoped = rows;

    if (provFilter.length) {
      scoped = scoped.filter((r) =>
        provFilter.includes(String(r.prov_code ?? "").trim())
      );
    }

    if (distFilter.length) {
      scoped = scoped.filter((r) =>
        distFilter.includes(String(r.dist_code ?? "").trim())
      );
    }

    if (miifFilter.length) {
      scoped = scoped.filter((r) => {
        const miif = String(
          r.miif_category ??
            r.MIIF_CATEGORY ??
            r.MIIF_Category ??
            ""
        ).trim();
        return miifFilter.includes(miif);
      });
    }

    if (muniFilter.length) {
      scoped = scoped.filter((r) =>
        muniFilter.includes(
          String(r.muni_code ?? "").trim()
        )
      );
    }

    return scoped;
  }, [rows, provFilter, distFilter, miifFilter, muniFilter]);

  // ---- CORE THEME STATS (BASED ON FILTERED ROWS) ----
  const themeStats = useMemo(() => {
    const rowsLocal = filteredRows;
    const allThemeKeys: ThemeKey[] = [
      "Demographics",
      "Finance",
      "Governance",
      "Health",
      "Infrastructure",
      "Poverty",
      "Safety",
    ];

    const pdiList = rowsLocal
      .map((r) => Number(r.PDI_MinMax))
      .filter((v) => !isNaN(v));

    let themeScores: number[] = [];
    let strongThemeCount = 0;

    if (selectedTheme === "ALL") {
      rowsLocal.forEach((r) => {
        const vals = allThemeKeys
          .map((k) => Number(r[k]))
          .filter((v) => !isNaN(v));
        if (!vals.length) return;

        const rowAvg =
          vals.reduce((a, b) => a + b, 0) / vals.length;
        themeScores.push(rowAvg);

        if (vals.some((v) => v >= 0.6)) {
          strongThemeCount += 1;
        }
      });
    } else {
      themeScores = rowsLocal
        .map((r) => Number(r[selectedTheme]))
        .filter((v) => !isNaN(v));

      strongThemeCount = rowsLocal.filter((r) => {
        const v = Number(r[selectedTheme]);
        return !isNaN(v) && v >= 0.6;
      }).length;
    }

    const avgTheme =
      themeScores.length > 0
        ? themeScores.reduce((a, b) => a + b, 0) /
          themeScores.length
        : 0;

    const avgPdi =
      pdiList.length > 0
        ? pdiList.reduce((a, b) => a + b, 0) /
          pdiList.length
        : 0;

    return {
      avgTheme,
      avgPdi,
      strongThemeCount,
      total: rowsLocal.length,
    };
  }, [filteredRows, selectedTheme]);

  // ---- PROVINCIAL AGGREGATES BY THEME (USING FILTERED ROWS) ----
  const provincialThemeStats = useMemo(() => {
    const allThemeKeys: ThemeKey[] = [
      "Demographics",
      "Finance",
      "Governance",
      "Health",
      "Infrastructure",
      "Poverty",
      "Safety",
    ];

    type Acc = {
      prov_code: string;
      prov_name?: string;
      sumTheme: number;
      sumPdi: number;
      n: number;
      strongThemeCount: number;
      strongThemeThemes: Set<ThemeKey>;
    };

    const acc: Record<string, Acc> = {};

    filteredRows.forEach((r) => {
      const prov_code = String(r.prov_code ?? "").trim();
      if (!prov_code) return;
      const prov_name = r.prov_name as string | undefined;

      if (!acc[prov_code]) {
        acc[prov_code] = {
          prov_code,
          prov_name,
          sumTheme: 0,
          sumPdi: 0,
          n: 0,
          strongThemeCount: 0,
          strongThemeThemes: new Set<ThemeKey>(),
        };
      }

      const pdiVal = Number(r.PDI_MinMax);
      let themeVal: number | null = null;

      if (selectedTheme === "ALL") {
        const vals = allThemeKeys
          .map((k) => Number((r as any)[k]))
          .filter((v) => !isNaN(v));
        if (vals.length) {
          themeVal =
            vals.reduce((a, b) => a + b, 0) / vals.length;
        }
      } else {
        const v = Number((r as any)[selectedTheme]);
        if (!isNaN(v)) themeVal = v;
      }

      if (themeVal != null) {
        acc[prov_code].sumTheme += themeVal;
      }
      if (!isNaN(pdiVal)) {
        acc[prov_code].sumPdi += pdiVal;
      }
      if (themeVal != null || !isNaN(pdiVal)) {
        acc[prov_code].n += 1;
      }

      if (selectedTheme === "ALL") {
        let anyStrong = false;
        allThemeKeys.forEach((k) => {
          const v = Number((r as any)[k]);
          if (!isNaN(v) && v >= 0.6) {
            anyStrong = true;
            acc[prov_code].strongThemeThemes.add(k);
          }
        });
        if (anyStrong) {
          acc[prov_code].strongThemeCount += 1;
        }
      } else if (themeVal != null && themeVal >= 0.6) {
        acc[prov_code].strongThemeCount += 1;
        acc[prov_code].strongThemeThemes.add(
          selectedTheme as ThemeKey
        );
      }
    });

    return Object.values(acc).map((v) => ({
      prov_code: v.prov_code,
      prov_name: v.prov_name,
      avgTheme: v.n > 0 ? v.sumTheme / v.n : 0,
      avgPdi: v.n > 0 ? v.sumPdi / v.n : 0,
      strongThemeCount: v.strongThemeCount,
      strongThemeNames: Array.from(v.strongThemeThemes),
      total: v.n,
    }));
  }, [filteredRows, selectedTheme]);

  // ---- DISTRICT AGGREGATES BY THEME (GROUPED BY PROVINCE) ----
  type DistrictStat = {
    prov_code: string;
    dist_code: string;
    dist_name?: string;
    avgTheme: number;
    avgPdi: number;
    strongThemeCount: number;
    strongThemeNames: ThemeKey[];
    total: number;
  };

  const districtThemeStatsByProvince = useMemo(() => {
    const allThemeKeys: ThemeKey[] = [
      "Demographics",
      "Finance",
      "Governance",
      "Health",
      "Infrastructure",
      "Poverty",
      "Safety",
    ];

    const acc: Record<
      string,
      {
        prov_code: string;
        dist_code: string;
        dist_name?: string;
        sumTheme: number;
        sumPdi: number;
        n: number;
        strongThemeCount: number;
        strongThemeThemes: Set<ThemeKey>;
      }
    > = {};

    filteredRows.forEach((r) => {
      const prov_code = String(r.prov_code ?? "").trim();
      const dist_code = String(r.dist_code ?? "").trim();
      if (!prov_code || !dist_code) return;

      const key = `${prov_code}__${dist_code}`;
      const dist_name = r.dist_name as string | undefined;

      let themeVal: number | null = null;
      const pdiVal = Number(r.PDI_MinMax);

      if (selectedTheme === "ALL") {
        const vals = allThemeKeys
          .map((k) => Number(r[k]))
          .filter((v) => !isNaN(v));
        if (vals.length) {
          themeVal =
            vals.reduce((a, b) => a + b, 0) / vals.length;
        }
      } else {
        const v = Number(r[selectedTheme]);
        if (!isNaN(v)) themeVal = v;
      }

      if (!acc[key]) {
        acc[key] = {
          prov_code,
          dist_code,
          dist_name,
          sumTheme: 0,
          sumPdi: 0,
          n: 0,
          strongThemeCount: 0,
          strongThemeThemes: new Set<ThemeKey>(),
        };
      }

      if (themeVal != null) {
        acc[key].sumTheme += themeVal;
      }
      if (!isNaN(pdiVal)) {
        acc[key].sumPdi += pdiVal;
      }
      if (themeVal != null || !isNaN(pdiVal)) {
        acc[key].n += 1;
      }

      if (selectedTheme === "ALL") {
        let anyStrong = false;
        allThemeKeys.forEach((k) => {
          const v = Number(r[k]);
          if (!isNaN(v) && v >= 0.6) {
            anyStrong = true;
            acc[key].strongThemeThemes.add(k);
          }
        });
        if (anyStrong) {
          acc[key].strongThemeCount += 1;
        }
      } else if (themeVal != null && themeVal >= 0.6) {
        acc[key].strongThemeCount += 1;
        acc[key].strongThemeThemes.add(
          selectedTheme as ThemeKey
        );
      }
    });

    const byProv: Record<string, DistrictStat[]> = {};

    Object.values(acc).forEach((v) => {
      const entry: DistrictStat = {
        prov_code: v.prov_code,
        dist_code: v.dist_code,
        dist_name: v.dist_name,
        avgTheme: v.n > 0 ? v.sumTheme / v.n : 0,
        avgPdi: v.n > 0 ? v.sumPdi / v.n : 0,
        strongThemeCount: v.strongThemeCount,
        strongThemeNames: Array.from(v.strongThemeThemes),
        total: v.n,
      };
      if (!byProv[v.prov_code]) byProv[v.prov_code] = [];
      byProv[v.prov_code].push(entry);
    });

    Object.keys(byProv).forEach((prov) => {
      byProv[prov].sort((a, b) => b.avgTheme - a.avgTheme);
    });

    return byProv;
  }, [filteredRows, selectedTheme]);

  // ---- TOP MUNICIPALITIES FOR THIS THEME (FILTERED ROWS) ----
  const topMunicipalities = useMemo(() => {
    const allThemeKeys: ThemeKey[] = [
      "Demographics",
      "Finance",
      "Governance",
      "Health",
      "Infrastructure",
      "Poverty",
      "Safety",
    ];

    return [...filteredRows]
      .map((r) => {
        const pdiVal = Number(r.PDI_MinMax);
        let themeVal = 0;

        if (selectedTheme === "ALL") {
          const vals = allThemeKeys
            .map((k) => Number(r[k]))
            .filter((v) => !isNaN(v));
          if (vals.length) {
            themeVal =
              vals.reduce((a, b) => a + b, 0) / vals.length;
          }
        } else {
          const v = Number(r[selectedTheme]);
          themeVal = isNaN(v) ? 0 : v;
        }

        return {
          muni_code: r.muni_code,
          muni_name: r.muni_name,
          prov_code: r.prov_code,
          dist_code: r.dist_code,
          themeVal,
          pdiVal: isNaN(pdiVal) ? null : pdiVal,
        };
      })
      .filter((r) => r.themeVal > 0)
      .sort((a, b) => b.themeVal - a.themeVal)
      .slice(0, 10);
  }, [filteredRows, selectedTheme]);

  // ---- BOTTOM MUNICIPALITIES (LOWEST THEME SCORES) ----
  const bottomMunicipalities = useMemo(() => {
    const allThemeKeys: ThemeKey[] = [
      "Demographics",
      "Finance",
      "Governance",
      "Health",
      "Infrastructure",
      "Poverty",
      "Safety",
    ];

    return [...filteredRows]
      .map((r) => {
        const pdiVal = Number(r.PDI_MinMax);
        let themeVal = 0;

        if (selectedTheme === "ALL") {
          const vals = allThemeKeys
            .map((k) => Number(r[k]))
            .filter((v) => !isNaN(v));
          if (vals.length) {
            themeVal =
              vals.reduce((a, b) => a + b, 0) / vals.length;
          }
        } else {
          const v = Number(r[selectedTheme]);
          themeVal = isNaN(v) ? 0 : v;
        }

        return {
          muni_code: r.muni_code,
          muni_name: r.muni_name,
          prov_code: r.prov_code,
          dist_code: r.dist_code,
          themeVal,
          pdiVal: isNaN(pdiVal) ? null : pdiVal,
        };
      })
      .filter((r) => r.themeVal > 0)
      .sort((a, b) => a.themeVal - b.themeVal)
      .slice(0, 10);
  }, [filteredRows, selectedTheme]);

  const themeLabel =
    selectedTheme === "ALL"
      ? "All themes"
      : THEME_OPTIONS.find((t) => t.key === selectedTheme)?.label ??
        selectedTheme;

  const toggleProvinceExpanded = (code: string) => {
    setExpandedProvinces((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  // ---- SIMPLE LOADING / ERROR RENDER AFTER HOOKS ----
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>Themes</h1>
        <p style={{ color: "red" }}>
          Error loading data: {String(error)}
        </p>
      </div>
    );
  }

  // ---- RENDER ----
  return (
    <div>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Themes</h1>

      {/* TOP CONTROL BAR: THEME + SLICERS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Left: intro + theme selector */}
        <div>
          <p
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 4,
            }}
          >
            View how individual themes drive municipal complexity,
            nationally and for specific provinces, districts, or
            municipalities.
          </p>
          <label
            style={{
              fontSize: 12,
              color: "#4b5563",
            }}
          >
            Theme:
            <select
              value={selectedTheme}
              onChange={(e) =>
                setSelectedTheme(
                  e.target.value as ThemeSelection
                )
              }
               style={{
                 marginLeft: 8,
                 fontSize: 12,
                 padding: "4px 28px 4px 8px", // 🔑 match MultiSelect
                 borderRadius: 4,
                 border: "1px solid #d1d5db",
                 backgroundColor: "#ffffff",
                 cursor: "pointer",

               // 🔒 remove native arrow
                 appearance: "none",
                 WebkitAppearance: "none",
                 MozAppearance: "none",

               // 🔽 custom arrow (IDENTICAL to MultiSelectDropdown)
                 backgroundImage:
                   "linear-gradient(45deg, transparent 50%, #374151 50%), linear-gradient(135deg, #374151 50%, transparent 50%)",
                 backgroundPosition:
                   "calc(100% - 16px) calc(50% - 3px), calc(100% - 11px) calc(50% - 3px)",
                 backgroundSize: "5px 5px, 5px 5px",
                 backgroundRepeat: "no-repeat",
               }}

            >
              <option value="ALL">All themes</option>
              {THEME_OPTIONS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Right: slicers + reset */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Province filter – multi-select */}
          <MultiSelectDropdown
            label="Province"
            options={provinces.map((p) => ({
              value: p.code,
              label: p.name
                ? `${p.code} — ${p.name}`
                : p.code,
            }))}
            values={provFilter}
            onChange={(vals) => {
              setProvFilter(vals);
              setDistFilter([]);
              setMuniFilter([]);
            }}
            placeholder="All provinces"
          />

          {/* District filter – multi-select */}
          <MultiSelectDropdown
            label="District"
            options={districtsForFilter.map((d) => ({
              value: d.code,
              label: d.name
                ? `${d.code} — ${d.name}`
                : d.code,
            }))}
            values={distFilter}
            onChange={(vals) => {
              setDistFilter(vals);
              setMuniFilter([]);
            }}
            placeholder="All districts"
          />

          {/* Municipality filter – multi-select dropdown with search */}
          <MultiSelectDropdown
            label="Municipality"
            options={municipalitiesForFilter.map((m) => ({
              value: m.code,
              label: m.name
                ? `${m.name} (${m.code})`
                : m.code,
            }))}
            values={muniFilter}
            onChange={setMuniFilter}
            placeholder="All municipalities"
            maxLabelCount={1}
            searchable
          />

          {/* MIIF category filter – multi-select (moved after municipality) */}
          <MultiSelectDropdown
            label="MIIF category"
            options={miifCategories.map((c) => ({
              value: c,
              label: c,
            }))}
            values={miifFilter}
            onChange={setMiifFilter}
            placeholder="All categories"
          />

          {/* Hard reset button */}
          <button
            type="button"
            onClick={resetFilters}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 4,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              cursor: "pointer",
              color: "#374151",
              marginLeft: 4,
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {/* 1. Average theme score */}
        <Card title={`Average ${themeLabel} score`}>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              minHeight: 18,
              marginBottom: 8,
            }}
          >
            (filtered selection)
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {themeStats.avgTheme.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 6,
            }}
          >
            Based on{" "}
            <strong style={{ color: "#6b7280" }}>
              {themeStats.total}
            </strong>{" "}
            municipalities after filters
          </div>
        </Card>

        {/* 2. Strong theme municipalities */}
        <Card title="Strong theme municipalities">
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              minHeight: 18,
              marginBottom: 8,
            }}
          >
            ({themeLabel} score ≥ 0.6)
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {themeStats.strongThemeCount}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 6,
            }}
          >
            <strong style={{ color: "#6b7280" }}>
              {(
                (themeStats.strongThemeCount /
                  (themeStats.total || 1)) *
                100
              ).toFixed(1)}
              %
            </strong>{" "}
            of filtered municipalities
          </div>
        </Card>

        {/* 3. Average PDI */}
        <Card title="Average PDI (context)">
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              minHeight: 18,
              marginBottom: 8,
            }}
          >
            (same filtered selection)
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {themeStats.avgPdi.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 6,
            }}
          >
            Helps link {themeLabel.toLowerCase()} to overall
            complexity
          </div>
        </Card>
      </div>

      {/* MAIN LAYOUT: LEFT = PROVINCIAL TABLE, RIGHT = TOP/BOTTOM MUNICIPALITIES */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: PROVINCIAL THEME VIEW WITH DISTRICT DRILLDOWN */}
        <section
          style={{
            flex: 1,
            minWidth: 320,
            background: "#fff",
            borderRadius: 6,
            border: "1px solid #e6e9ee",
            padding: 12,
          }}
        >
          <h3 style={{ marginBottom: 6 }}>
            Provincial view — {themeLabel}
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            Average {themeLabel.toLowerCase()} score and
            strong-theme municipalities (score ≥ 0.6) by
            province, after applying filters. Click a province
            row to expand district-level detail.
          </p>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={{ padding: "4px 6px" }}></th>
                  <th style={{ padding: "4px 6px" }}>Province</th>
                  <th style={{ padding: "4px 6px" }}>
                    Avg theme score
                  </th>
                  <th style={{ padding: "4px 6px" }}>Avg PDI</th>
                  <th style={{ padding: "4px 6px" }}>
                    Strong-theme (n)
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    Municipalities (n)
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...provincialThemeStats]
                  .sort((a, b) => b.avgTheme - a.avgTheme)
                  .map((p) => {
                    const isExpanded =
                      expandedProvinces.includes(p.prov_code);
                    const distStats =
                      districtThemeStatsByProvince[p.prov_code] ||
                      [];
                    return (
                      <React.Fragment key={p.prov_code}>
                        <tr
                          style={{
                            borderBottom: "1px solid #f3f4f6",
                            cursor:
                              distStats.length > 0
                                ? "pointer"
                                : "default",
                            background: isExpanded
                              ? "#f9fafb"
                              : "transparent",
                          }}
                          onClick={() => {
                            if (distStats.length === 0) return;
                            toggleProvinceExpanded(p.prov_code);
                          }}
                        >
                          <td
                            style={{
                              padding: "4px 6px",
                              width: 24,
                              color:
                                distStats.length > 0
                                  ? "#4b5563"
                                  : "#d1d5db",
                            }}
                          >
                            {distStats.length > 0
                              ? isExpanded
                                ? "▾"
                                : "▸"
                              : ""}
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            {p.prov_code}
                            {p.prov_name ? "" : ""}
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            {p.avgTheme.toFixed(2)}
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            {p.avgPdi.toFixed(2)}
                          </td>
                          {/* Province strong-theme tooltip */}
                          <td
                            style={{
                              padding: "4px 6px",
                              position: "relative",
                              cursor:
                                selectedTheme === "ALL" &&
                                p.strongThemeCount > 0
                                  ? "pointer"
                                  : "default",
                            }}
                            onMouseEnter={(e) => {
                              if (
                                selectedTheme !== "ALL" ||
                                !p.strongThemeNames ||
                                p.strongThemeNames.length === 0
                              ) {
                                return;
                              }
                              setStrongTooltip({
                                themes: p.strongThemeNames,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                            onMouseMove={(e) => {
                              setStrongTooltip((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      x: e.clientX,
                                      y: e.clientY,
                                    }
                                  : prev
                              );
                            }}
                            onMouseLeave={() =>
                              setStrongTooltip(null)
                            }
                          >
                            {p.strongThemeCount}
                          </td>

                          <td style={{ padding: "4px 6px" }}>
                            {p.total}
                          </td>
                        </tr>

                        {isExpanded && distStats.length > 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                padding: "4px 6px 8px 32px",
                                background: "#f9fafb",
                              }}
                            >
                              <div
                                style={{
                                  borderLeft:
                                    "2px solid #e5e7eb",
                                  paddingLeft: 8,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#6b7280",
                                    marginBottom: 4,
                                  }}
                                >
                                  District breakdown for{" "}
                                  <strong>{p.prov_code}</strong>
                                </div>
                                <table
                                  style={{
                                    width: "100%",
                                    borderCollapse:
                                      "collapse",
                                    fontSize: 11,
                                  }}
                                >
                                  <thead>
                                    <tr
                                      style={{
                                        textAlign: "left",
                                        borderBottom:
                                          "1px solid #e5e7eb",
                                      }}
                                    >
                                      <th
                                        style={{
                                          padding: "3px 4px",
                                        }}
                                      >
                                        District
                                      </th>
                                      <th
                                        style={{
                                          padding: "3px 4px",
                                        }}
                                      >
                                        Code
                                      </th>
                                      <th
                                        style={{
                                          padding: "3px 4px",
                                        }}
                                      >
                                        Avg theme
                                      </th>
                                      <th
                                        style={{
                                          padding: "3px 4px",
                                        }}
                                      >
                                        Avg PDI
                                      </th>
                                      <th
                                        style={{
                                          padding: "3px 4px",
                                        }}
                                      >
                                        Strong-theme (n)
                                      </th>
                                      <th
                                        style={{
                                          padding: "3px 4px",
                                        }}
                                      >
                                        Municipalities (n)
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {distStats.map((d) => (
                                      <tr
                                        key={d.dist_code}
                                        style={{
                                          borderBottom:
                                            "1px solid #f3f4f6",
                                        }}
                                      >
                                        <td
                                          style={{
                                            padding:
                                              "3px 4px",
                                          }}
                                        >
                                          {d.dist_name ??
                                            "—"}
                                        </td>
                                        <td
                                          style={{
                                            padding:
                                              "3px 4px",
                                          }}
                                        >
                                          {d.dist_code}
                                        </td>
                                        <td
                                          style={{
                                            padding:
                                              "3px 4px",
                                          }}
                                        >
                                          {d.avgTheme.toFixed(
                                            2
                                          )}
                                        </td>
                                        <td
                                          style={{
                                            padding:
                                              "3px 4px",
                                          }}
                                        >
                                          {d.avgPdi.toFixed(
                                            2
                                          )}
                                        </td>
                                        {/* District strong-theme tooltip */}
                                        <td
                                          style={{
                                            padding:
                                              "3px 4px",
                                            position:
                                              "relative",
                                            cursor:
                                              selectedTheme ===
                                                "ALL" &&
                                              d.strongThemeCount >
                                                0
                                                ? "pointer"
                                                : "default",
                                          }}
                                          onMouseEnter={(e) => {
                                            if (
                                              selectedTheme !==
                                                "ALL" ||
                                              !d.strongThemeNames ||
                                              d
                                                .strongThemeNames
                                                .length === 0
                                            ) {
                                              return;
                                            }
                                            setStrongTooltip({
                                              themes:
                                                d.strongThemeNames,
                                              x: e.clientX,
                                              y: e.clientY,
                                            });
                                          }}
                                          onMouseMove={(e) => {
                                            setStrongTooltip(
                                              (prev) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      x: e.clientX,
                                                      y: e.clientY,
                                                    }
                                                  : prev
                                            );
                                          }}
                                          onMouseLeave={() =>
                                            setStrongTooltip(
                                              null
                                            )
                                          }
                                        >
                                          {d.strongThemeCount}
                                        </td>
                                        <td
                                          style={{
                                            padding:
                                              "3px 4px",
                                          }}
                                        >
                                          {d.total}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* RIGHT: TOP & BOTTOM MUNICIPALITIES FOR THEME */}
        <section
          style={{
            flex: 1,
            minWidth: 320,
            background: "#fff",
            borderRadius: 6,
            border: "1px solid #e6e9ee",
            padding: 12,
          }}
        >
          {/* TOP 10 */}
          <h3 style={{ marginBottom: 6 }}>
            Municipalities with highest {themeLabel} scores
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "#D2222D", fontWeight: 600 }}>Top 10</span> municipalities by{" "}
            {themeLabel.toLowerCase()} within the current
            filters.
          </p>

          <div
            style={{
              maxHeight: 180,
              overflowY: "auto",
              marginBottom: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={{ padding: "4px 6px" }}>
                    Municipality
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    District
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    Province
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    Theme score
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    PDI
                  </th>
                </tr>
              </thead>
              <tbody>
                {topMunicipalities.map((m) => {
                  const distCode = String(m.dist_code ?? "");
                  const distName =
                    districtNameByCode[distCode] || "";
                  return (
                    <tr
                      key={m.muni_code}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td style={{ padding: "4px 6px" }}>
                        {m.muni_name ?? "—"}
                      </td>
                      {/* DISTRICT code with tooltip for name */}
                      <td
                        style={{ padding: "4px 6px" }}
                        title={distName}
                      >
                        {distCode || "—"}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        {m.prov_code}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        {m.themeVal.toFixed(2)}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        {m.pdiVal != null
                          ? m.pdiVal.toFixed(2)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {topMunicipalities.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "8px 6px",
                        color: "#9ca3af",
                        textAlign: "center",
                      }}
                    >
                      No municipalities match the current
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* BOTTOM 10 */}
          <h3 style={{marginBottom: 6 }}>
            Municipalities with lowest {themeLabel} scores
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "#238823", fontWeight: 600 }}>Bottom 10</span> municipalities by{" "}
            {themeLabel.toLowerCase()} within the current
            filters.
          </p>

          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={{ padding: "4px 6px" }}>
                    Municipality
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    District
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    Province
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    Theme score
                  </th>
                  <th style={{ padding: "4px 6px" }}>
                    PDI
                  </th>
                </tr>
              </thead>
              <tbody>
                {bottomMunicipalities.map((m) => {
                  const distCode = String(m.dist_code ?? "");
                  const distName =
                    districtNameByCode[distCode] || "";
                  return (
                    <tr
                      key={m.muni_code}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td style={{ padding: "4px 6px" }}>
                        {m.muni_name ?? "—"}
                      </td>
                      {/* DISTRICT code with tooltip for name */}
                      <td
                        style={{ padding: "4px 6px" }}
                        title={distName}
                      >
                        {distCode || "—"}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        {m.prov_code}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        {m.themeVal.toFixed(2)}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        {m.pdiVal != null
                          ? m.pdiVal.toFixed(2)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {bottomMunicipalities.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "8px 6px",
                        color: "#9ca3af",
                        textAlign: "center",
                      }}
                    >
                      No municipalities match the current
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>{" "}
      {/* end of main layout flex (provincial + muni tables) */}

      {/* 🔹 Global strong-theme tooltip (fixed to viewport) */}
      {strongTooltip && (
        <div
          style={{
            position: "fixed",
            left: strongTooltip.x + 12,
            top: strongTooltip.y + 12,
            background: "#020617",
            color: "#f9fafb",
            padding: "8px 10px",
            borderRadius: 6,
            fontSize: 11,
            boxShadow: "0 10px 30px rgba(15,23,42,0.32)",
            maxWidth: 220,
            zIndex: 9999,
            pointerEvents: "none",
            lineHeight: 1.35,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Strong themes
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 14,
            }}
          >
            {strongTooltip.themes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Themes;
