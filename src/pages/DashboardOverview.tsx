import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";
import ComplexityChoroplethMap from "../components/ComplexityChoroplethMap";

// Local type used only in this file
type HoverContext = {
  level: "province" | "district" | "municipality";
  code: string;
};

const DashboardOverview: React.FC = () => {
  // ---- DATA FROM CONTEXT ----
  const {
    loading,
    error,
    municipalities,
    pdiMinmax,
    lmModel,
    mappedMunicipalitiesCount,
    pdiRowsCount,
    highComplexityCount,
    provincialStats,
  } = useData() as any;

  // ---- LOCAL STATE FOR MAP SELECTIONS ----
  const [selectedMuniCode, setSelectedMuniCode] =
    useState<string | null>(null);
  const [activeProv, setActiveProv] =
    useState<string | null>(null);
  const [activeDist, setActiveDist] =
    useState<string | null>(null);
  const [hoverContext, setHoverContext] =
    useState<HoverContext | null>(null);

  // ---- SAMPLE MUNICIPALITY (USED IN JSON PANEL) ----
  const sampleMunicipality =
    (lmModel || []).find(
      (m: any) =>
        selectedMuniCode &&
        String(m.muni_code) === String(selectedMuniCode)
    ) ||
    (lmModel && lmModel[0]) ||
    (municipalities && municipalities[0]) ||
    {};

  // ---- TOP PROVINCE BY AVG PDI ----
  const sortedProvincial = [...(provincialStats || [])].sort(
    (a: any, b: any) => b.avgPdi - a.avgPdi
  );
  const topProvince = sortedProvincial[0];

  // ---- COMPLEXITY DISTRIBUTION (SCOPED TO CURRENT SELECTION) ----
  const complexityBuckets = useMemo(() => {
    type Level = 1 | 2 | 3 | 4 | 5;

    const buckets: Record<Level, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const toLevel = (pdi: any): Level | null => {
      const v = Number(pdi);
      if (isNaN(v)) return null;
      if (v < 0.2) return 1;
      if (v < 0.4) return 2;
      if (v < 0.6) return 3;
      if (v < 0.8) return 4;
      return 5;
    };

    const rows: any[] = lmModel || [];

    // Scope to the same selection logic as the map & theme drivers
    let scoped = rows;

    if (selectedMuniCode) {
      scoped = scoped.filter(
        (r) => String(r.muni_code) === String(selectedMuniCode)
      );
    } else if (activeDist) {
      scoped = scoped.filter(
        (r) => String(r.dist_code) === String(activeDist)
      );
    } else if (activeProv) {
      scoped = scoped.filter(
        (r) => String(r.prov_code) === String(activeProv)
      );
    }

    scoped.forEach((m: any) => {
      const lvl = toLevel(m.PDI_MinMax);
      if (lvl) buckets[lvl] += 1;
    });

    const total = Object.values(buckets).reduce((acc, v) => acc + v, 0);
    return { buckets, total };
  }, [lmModel, selectedMuniCode, activeDist, activeProv]);


  const { buckets, total } = complexityBuckets;

  // ---- THEME SCOPE LABEL (FOR SUBTITLE) ----
  const themeScopeLabel = useMemo(() => {
    const rows: any[] = lmModel || [];

    // 1) Most specific: individual municipality selected
    if (selectedMuniCode) {
      const row = rows.find(
        (r) => String(r.muni_code) === String(selectedMuniCode)
      );
      if (row?.muni_name) {
        return `Selected municipality: ${row.muni_name}`;
      }
      return "Selected municipality";
    }

    // 2) District selection
    if (activeDist) {
      const row = rows.find(
        (r) => String(r.dist_code) === String(activeDist)
      );
      if (row?.dist_name) {
        return `District: ${row.dist_name}`;
      }
      return `District code: ${activeDist}`;
    }

    // 3) Province selection
    if (activeProv) {
      const row = rows.find(
        (r) => String(r.prov_code) === String(activeProv)
      );
      if (row?.prov_name) {
        return `Province: ${row.prov_name}`;
      }
      return `Province code: ${activeProv}`;
    }

    // 4) No filters – national view
    return "All municipalities nationally";
  }, [lmModel, selectedMuniCode, activeDist, activeProv]);


  // ---- THEME DRIVERS (RESPOND TO SELECTIONS) ----
  const themeStats = useMemo(() => {
    const rows: any[] = lmModel || [];
    const HIGH_THRESHOLD = 0.6;

    // 1) Scope by current selection
    let scoped = rows;

    if (selectedMuniCode) {
      scoped = scoped.filter(
        (r) => String(r.muni_code) === String(selectedMuniCode)
      );
    } else if (activeDist) {
      scoped = scoped.filter(
        (r) => String(r.dist_code) === String(activeDist)
      );
    } else if (activeProv) {
      scoped = scoped.filter(
        (r) => String(r.prov_code) === String(activeProv)
      );
    }

    // 2) High-complexity count is still based on PDI ≥ 0.6
    const scopedHighComplexCount = scoped.filter((m) => {
      const v = Number(m.PDI_MinMax);
      return !isNaN(v) && v >= HIGH_THRESHOLD;
    }).length;

    // 3) Theme averages are now based on *all* scoped municipalities
    const themeKeys = [
      "Demographics",
      "Finance",
      "Governance",
      "Health",
      "Infrastructure",
      "Poverty",
      "Safety",
    ] as const;

    type ThemeStat = {
      key: (typeof themeKeys)[number];
      avg: number;
    };

    const stats: ThemeStat[] = themeKeys.map((key) => {
      const vals = scoped
        .map((m) => Number((m as any)[key]))
        .filter((v) => !isNaN(v));
      const avg =
        vals.length > 0
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : 0;
      return { key, avg };
    });

    const maxAvg = Math.max(0, ...stats.map((t) => t.avg));

    return {
      stats,
      maxAvg,
      highComplexCount: scopedHighComplexCount,
    };
  }, [lmModel, selectedMuniCode, activeDist, activeProv]);

  const hoverThemeStats = useMemo(() => {
  if (!hoverContext) return null;
  const rows: any[] = lmModel || [];

  let scoped = rows;
  if (hoverContext.level === "province") {
    scoped = scoped.filter(
      (r) => String(r.prov_code) === String(hoverContext.code)
    );
  } else if (hoverContext.level === "district") {
    scoped = scoped.filter(
      (r) => String(r.dist_code) === String(hoverContext.code)
    );
  } else if (hoverContext.level === "municipality") {
    scoped = scoped.filter(
      (r) => String(r.muni_code) === String(hoverContext.code)
    );
  }

  if (!scoped.length) return null;

  const themeKeys = [
    "Demographics",
    "Finance",
    "Governance",
    "Health",
    "Infrastructure",
    "Poverty",
    "Safety",
  ] as const;

  const stats = themeKeys.map((key) => {
    const vals = scoped
      .map((m) => Number((m as any)[key]))
      .filter((v) => !isNaN(v));
    const avg =
      vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : 0;
    return { key, avg };
  });

  const maxAvg = Math.max(0, ...stats.map((t) => t.avg));

  const labelPrefix =
    hoverContext.level === "province"
      ? "Province"
      : hoverContext.level === "district"
      ? "District"
      : "Municipality";

  return {
    label: `${labelPrefix} ${hoverContext.code}`,
    stats,
    maxAvg,
    count: scoped.length,
  };
}, [hoverContext, lmModel]);


  const {
    stats: themeDriverStats,
    maxAvg: maxThemeAvg,
    highComplexCount: scopedHighComplexCount,
  } = themeStats;

  // ---- LOADING / ERROR STATES (AFTER HOOKS) ----
  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>
          Dashboard Overview
        </h1>
        <p style={{ color: "red" }}>
          Error loading data: {String(error)}
        </p>
      </div>
    );
  }

  const muniWithPdi = mappedMunicipalitiesCount ?? (pdiMinmax || []).length;
  const totalPossible = 257;
  const pctHigh =
    muniWithPdi > 0
      ? (highComplexityCount / muniWithPdi) * 100
      : 0;

  // ---- MAIN RENDER ----
  return (
    <div>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>
        Dashboard Overview
      </h1>

      {/* KPI CARDS */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {/* 1. MUNICIPALITIES WITH PDI */}

	<Card title="Municipalities with PDI">
         <div
           style={{
           fontSize: 13,
           color: "#6b7280",
           minHeight: 18,
           marginBottom: 8,
        }}
         >
           (Local municipalites)
         </div>

         <div style={{ fontSize: 36, fontWeight: 700 }}>
           {mappedMunicipalitiesCount}
         </div>

         <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
           PDI calculated for{" "}
          <strong style={{ color: "#6b7280" }}>
           {mappedMunicipalitiesCount}
          </strong>{" "}
           of{" "}
          <strong style={{ color: "#6b7280" }}>
           257
          </strong>{" "}
           municipalities
          </div>
        </Card>

        {/* 2. HIGH-COMPLEXITY MUNICIPALITIES */}
<Card title="High-complexity municipalities">
  <div
    style={{
      fontSize: 13,
      color: "#6b7280",
      minHeight: 18,
      marginBottom: 8,
    }}
  >
    (PDI ≥ 0.6)
  </div>

  <div style={{ fontSize: 36, fontWeight: 700 }}>
    {highComplexityCount}
  </div>

  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
  <strong style={{ color: "#6b7280" }}>
    {highComplexityCount}
  </strong>{" "}
  municipalities
</div>

<div style={{ fontSize: 13, color: "#6b7280" }}>
  <strong style={{ color: "#6b7280" }}>
    {((highComplexityCount / mappedMunicipalitiesCount) * 100).toFixed(1)}%
  </strong>{" "}
  of municipalities with PDI
</div>

</Card>

 {/* 3. HIGHEST PROVINCE BY AVG PDI */}
<Card title="Highest scored province">
  <div
    style={{
      fontSize: 13,
      color: "#6b7280",
      minHeight: 18,
      marginBottom: 8,
    }}
  >
    (average PDI)
  </div>

  <div style={{ fontSize: 36, fontWeight: 700 }}>
    {topProvince?.prov_code ?? "—"}
  </div>

 <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
  Avg PDI:{" "}
  <strong style={{ color: "#6b7280"  }}>
    {topProvince?.avgPdi.toFixed(2)}
  </strong>
</div>

<div style={{ fontSize: 13, color: "#6b7280" }}>
  High-complex municipalities:{" "}
  <strong style={{ color: "#6b7280"  }}>
    {topProvince?.highComplexityCount}
  </strong>
</div>

</Card>


      </div>


      {/* HIGH COMPLEXITY SUMMARY LINE */}
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 16,
        }}
      >
        High-complexity municipalities (PDI ≥ 0.6):{" "}
        <span style={{ fontWeight: 600 }}>
          {highComplexityCount} nationally /{" "}
          {scopedHighComplexCount} in current selection
        </span>
      </p>

      {/* MAP (LEFT) + RIGHT COLUMN (DISTRIBUTION + PROVINCIAL TABLE) */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: MAP */}

<div style={{
      flex: 1,
      minWidth: 360,
      display: "flex",
      flexDirection: "column",
    }}>
  <h3 style={{ marginBottom: 6 }}>
    Spatial view of municipal complexity
  </h3>
  <p
    style={{
      fontSize: 12,
      color: "#6b7280",
      marginBottom: 8,
    }}
  >
    Drill from provinces down to districts and municipalities.
    Hover for stats, click to lock a selection and update the panels.
  </p>

  <div style={{flex: 1, minHeight: 420 }}>
    {/* Map itself */}
    <ComplexityChoroplethMap
      selectedMuniCode={selectedMuniCode}
      onSelectMuniCode={setSelectedMuniCode}
      onActiveProvChange={setActiveProv}
      onActiveDistChange={setActiveDist}
      onHoverChange={setHoverContext}
    />

  </div>
</div>


{/* RIGHT: MATCH MAP HEIGHT */}
<div
  style={{
    width: 360,
    minWidth: 300,
    minHeight: 420,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    position: "relative",
  }}
>
  {/* Hover theme drivers twin – appears next to the map, not over it */}
  {hoverThemeStats && (
    <section
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e6e9ee",
        padding: 10,
        fontSize: 11,
        boxShadow: "0 8px 20px rgba(15,23,42,0.16)",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          fontSize: 12,
        }}
      >
        Theme drivers — {hoverThemeStats.label}
      </div>
      <div
        style={{
          color: "#6b7280",
          marginBottom: 6,
        }}
      >
        {hoverThemeStats.count} municipalities in this area
      </div>

      {hoverThemeStats.stats.map((t) => {
        const pct =
          hoverThemeStats.maxAvg > 0
            ? (t.avg / hoverThemeStats.maxAvg) * 100
            : 0;
        return (
          <div key={t.key} style={{ marginBottom: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <span>{t.key}</span>
              <span style={{ color: "#4b5563" }}>
                {t.avg.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                background: "#f3f4f6",
                borderRadius: 999,
                overflow: "hidden",
                height: 8,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  maxWidth: "100%",
                  height: "100%",
                  background: "#2563eb",
                }}
              />
            </div>
          </div>
        );
      })}
    </section>
  )}

  {/* Complexity distribution */}
  <section>
    <h3 style={{ marginBottom: 4 }}>Complexity distribution</h3>
    <p
      style={{
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 8,
      }}
    >
      Distribution of municipalities by PDI level.
      <br />
      <span style={{ fontWeight: 500 }}>{themeScopeLabel}</span>
    </p>
    <div
      style={{
        background: "#fff",
        borderRadius: 6,
        padding: 12,
        border: "1px solid #e6e9ee",
        fontSize: 12,
      }}
    >
      {([1, 2, 3, 4, 5] as const).map((level) => {
        const count = buckets[level];
        const pct = total > 0 ? (count / total) * 100 : 0;

        return (
          <div
            key={level}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 70,
                fontWeight: 400,
              }}
            >
              Level {level}
            </div>
            <div
              style={{
                flex: 1,
                background: "#f3f4f6",
                borderRadius: 999,
                overflow: "hidden",
                marginRight: 8,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  maxWidth: "100%",
                  height: 8,
                  background: "#2563eb",
                }}
              />
            </div>
            <div
              style={{
                width: 90,
                textAlign: "right",
                color: "#4b5563",
              }}
            >
              {count}{" "}
              <span style={{ color: "#9ca3af" }}>
                ({pct.toFixed(1)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </section>

  {/* Provincial complexity overview (fills remaining height) */}
  <section
    style={{
      flex: 1,
      background: "#fff",
      borderRadius: 6,
      border: "1px solid #e6e9ee",
      padding: 12,
    }}
  >
    <h3 style={{ marginBottom: 8 }}>
      Provincial complexity overview
    </h3>
    <p
      style={{
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 8,
      }}
    >
      Average PDI and count of high-complexity municipalities
      (PDI ≥ 0.6) by province.
    </p>
    <div>
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
            <th style={{ padding: "4px 6px" }}>Province</th>
            <th style={{ padding: "4px 6px" }}>Avg PDI</th>
            <th style={{ padding: "4px 6px" }}>
              High-complex municipalities
            </th>
            <th style={{ padding: "4px 6px" }}>
              Total municipalities
            </th>
          </tr>
        </thead>
        <tbody>
          {[...(provincialStats || [])]
            .sort((a: any, b: any) => b.avgPdi - a.avgPdi)
            .map((p: any) => (
              <tr
                key={p.prov_code}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  background:
                    activeProv &&
                    String(activeProv) === String(p.prov_code)
                      ? "#eff6ff"
                      : "transparent",
                }}
              >
                <td style={{ padding: "4px 6px" }}>{p.prov_code}</td>
                <td style={{ padding: "4px 6px" }}>
                  {p.avgPdi.toFixed(2)}
                </td>
                <td style={{ padding: "4px 6px" }}>
                  {p.highComplexityCount}
                </td>
                <td style={{ padding: "4px 6px" }}>
                  {p.municipalityCount}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </section>
</div>
</div>
</div>
  );
};

export default DashboardOverview;
