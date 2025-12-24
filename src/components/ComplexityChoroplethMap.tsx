import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON, useMapEvent } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { useData } from "../context/DataContext";

type Props = {
  selectedMuniCode?: string | null;
  onSelectMuniCode?: (code: string) => void;
  onActiveProvChange?: (prov?: string | null) => void;
  onActiveDistChange?: (dist?: string | null) => void;

  // 🔹 New: notify dashboard when hovering shapes
  onHoverChange?: (
    ctx:
      | { level: "province"; code: string }
      | { level: "district"; code: string }
      | { level: "municipality"; code: string }
      | null
  ) => void;
};



type ViewLevel = "province" | "district" | "municipality";

type LevelDblClickHandlerProps = {
  viewLevel: ViewLevel;
  bounds: [[number, number], [number, number]];
  activeProv: string | null;
  activeDist: string | null;
  provinceGeo: FeatureCollection | null;
  districtGeo: FeatureCollection | null;
  setViewLevel: React.Dispatch<React.SetStateAction<ViewLevel>>;
  setActiveProv: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveDist: React.Dispatch<React.SetStateAction<string | null>>;
  onSelectMuniCode?: (code: string) => void;
};

const LevelDblClickHandler: React.FC<LevelDblClickHandlerProps> = ({
  viewLevel,
  bounds,
  activeProv,
  activeDist,
  provinceGeo,
  districtGeo,
  setViewLevel,
  setActiveProv,
  setActiveDist,
  onSelectMuniCode,
}) => {
useMapEvent("dblclick", (e) => {
  const map = e.target as LeafletMap;

  // MUNICIPALITY → DISTRICT
  if (viewLevel === "municipality") {
    setViewLevel("district");
    if (onSelectMuniCode) onSelectMuniCode("");

    if (activeDist && districtGeo) {
      const feat = districtGeo.features.find((f) => {
        const props = (f.properties || {}) as any;
        return String(props.dist_code ?? "").trim() === activeDist;
      });

      if (feat) {
        const layer = L.geoJSON(feat as any);
        map.flyToBounds(layer.getBounds(), {
          padding: [16, 16],
          maxZoom: 8,
          animate: true,
        });
        layer.remove();
        return;
      }
    }
    return;
  }

  // DISTRICT → PROVINCE
  if (viewLevel === "district") {
    setViewLevel("province");
    setActiveDist(null);

    if (activeProv && provinceGeo) {
      const feat = provinceGeo.features.find((f) => {
        const props = (f.properties || {}) as any;
        return String(props.prov_code ?? "").trim() === activeProv;
      });

      if (feat) {
        const layer = L.geoJSON(feat as any);
        map.flyToBounds(layer.getBounds(), {
          padding: [16, 16],
          maxZoom: 7,
          animate: true,
        });
        layer.remove();
        return;
      }
    }
    return;
  }

  // PROVINCE → COUNTRY (FULL RESET — STOP ALL BLINKING ✅)
  setViewLevel("province");
  setActiveProv(null);
  setActiveDist(null);
  if (onSelectMuniCode) onSelectMuniCode("");

  // 🔥 Explicitly remove blink classes from all map layers
(map as any).eachLayer((layer: any) => {
  if (layer && typeof (layer as any).getElement === "function") {
    const el = (layer as any).getElement();
    if (el && (el as any).classList) {
      (el as any).classList.remove(
        "prov-selected",
        "dist-selected",
        "muni-selected"
      );
    }
  }
});

  map.flyToBounds(bounds, {
    padding: [16, 16],
    animate: true,
  });
});


  return null;
};

const PDI_COLORS = {
  low: "#e0f2fe",
  lowMed: "#93c5fd",
  med: "#3b82f6",
  high: "#1d4ed8",
  veryHigh: "#1e3a8a",
  noData: "#e5e7eb",
};

const ComplexityChoroplethMap: React.FC<Props> = ({
  selectedMuniCode,
  onSelectMuniCode,
  onActiveProvChange,
  onActiveDistChange,
  onHoverChange,
}) => {
  const { lmModel } = useData() as any;

  const [map, setMap] = useState<LeafletMap | null>(null);

  const [lmGeo, setLmGeo] = useState<FeatureCollection | null>(null);
  const [districtGeo, setDistrictGeo] =
    useState<FeatureCollection | null>(null);
  const [provinceGeo, setProvinceGeo] =
    useState<FeatureCollection | null>(null);

  const [viewLevel, setViewLevel] = useState<ViewLevel>("province");
  const [activeProv, setActiveProv] = useState<string | null>(null);
  const [activeDist, setActiveDist] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const lmByCode = useMemo(() => {
    const m = new Map<string, any>();
    (lmModel || []).forEach((row: any) => {
      const code = String(row.muni_code ?? "").trim();
      if (!code) return;
      m.set(code, row);
    });
    return m;
  }, [lmModel]);

  // --- PDI maps aggregated from lmModel ---
  const provinceStatsMap = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    (lmModel || []).forEach((m: any) => {
      const code = String(m.prov_code ?? "").trim();
      const v = Number(m.PDI_MinMax ?? m.PDI ?? m.pdi ?? NaN);
      if (!code || isNaN(v)) return;
      if (!acc[code]) acc[code] = { sum: 0, n: 0 };
      acc[code].sum += v;
      acc[code].n += 1;
    });
    return new Map(
      Object.entries(acc).map(([k, v]) => [k, v.sum / v.n])
    );
  }, [lmModel]);

  const districtStatsMap = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    (lmModel || []).forEach((m: any) => {
      const code = String(m.dist_code ?? "").trim();
      const v = Number(m.PDI_MinMax ?? m.PDI ?? m.pdi ?? NaN);
      if (!code || isNaN(v)) return;
      if (!acc[code]) acc[code] = { sum: 0, n: 0 };
      acc[code].sum += v;
      acc[code].n += 1;
    });
    return new Map(
      Object.entries(acc).map(([k, v]) => [k, v.sum / v.n])
    );
  }, [lmModel]);

  const muniStatsMap = useMemo(() => {
    const m = new Map<string, number>();
    (lmModel || []).forEach((row: any) => {
      const code = String(row.muni_code ?? "").trim();
      const v = Number(row.PDI_MinMax ?? row.PDI ?? row.pdi ?? NaN);
      if (!code || isNaN(v)) return;
      m.set(code, v);
    });
    return m;
  }, [lmModel]);

  // load geojsons once
  useEffect(() => {
    async function load() {
      const [lmRes, distRes, provRes] = await Promise.all([
        fetch("/maps/local_municipality_clean.geojson"),
        fetch("/maps/district_boundaries.geojson").catch(() => null),
        fetch("/maps/province_boundaries.geojson"),
      ]);

      const lmJson = (await lmRes.json()) as FeatureCollection;
      setLmGeo(lmJson);

      if (distRes && distRes.ok) {
        const distJson = (await distRes.json()) as FeatureCollection;
        setDistrictGeo(distJson);
      }

      const provJson = (await provRes.json()) as FeatureCollection;
      setProvinceGeo(provJson);
    }

    load();
  }, []);

  // bubble selected province/district up to DashboardOverview
  useEffect(() => {
    if (onActiveProvChange) onActiveProvChange(activeProv);
  }, [activeProv, onActiveProvChange]);

  useEffect(() => {
    if (onActiveDistChange) onActiveDistChange(activeDist);
  }, [activeDist, onActiveDistChange]);

  const colorFor = (pdi?: number) => {
    if (pdi == null || isNaN(pdi)) return PDI_COLORS.noData;
    if (pdi < 0.2) return PDI_COLORS.low;
    if (pdi < 0.4) return PDI_COLORS.lowMed;
    if (pdi < 0.6) return PDI_COLORS.med;
    if (pdi < 0.8) return PDI_COLORS.high;
    return PDI_COLORS.veryHigh;
  };

  const provincesFiltered = useMemo(() => provinceGeo, [provinceGeo]);

  const districtsFiltered = useMemo(() => {
    if (!districtGeo) return null;
    if (!activeProv) return districtGeo;
    const features = districtGeo.features.filter((f) => {
      const props = (f.properties || {}) as any;
      const p = String(props.prov_code ?? props.PROV_CODE ?? "");
      return p === String(activeProv);
    });
    return { ...districtGeo, features };
  }, [districtGeo, activeProv]);

  const lmFiltered = useMemo(() => {
    if (!lmGeo) return null;
    const features = lmGeo.features.filter((f) => {
      const props = (f.properties || {}) as any;
      const p = String(props.prov_code ?? "");
      const d = String(props.dist_code ?? "");

      if (viewLevel === "province") {
        if (!activeProv) return true;
        return p === String(activeProv);
      }
      if (viewLevel === "district") {
        if (activeDist) return d === String(activeDist);
        if (activeProv) return p === String(activeProv);
        return true;
      }
      // municipality view
      if (activeDist) return d === String(activeDist);
      if (activeProv) return p === String(activeProv);
      return true;
    });
    return { ...lmGeo, features };
  }, [lmGeo, viewLevel, activeProv, activeDist]);

  const provinceStyle = (feature: any) => {
    const props = (feature.properties || {}) as any;
    const code = String(props.prov_code ?? "").trim();
    const pdi = provinceStatsMap.get(code);

    const isActive = activeProv && String(activeProv) === code;
    const isHovered = hoveredId === `prov:${code}`;
    const dim =
      Boolean(activeProv) &&
      String(activeProv) !== code &&
      viewLevel !== "province";

    return {
      className: isActive ? "prov-selected" : "",
      weight: isActive || isHovered ? 1.4 : 0.9,
      color: "rgba(249, 250, 251, 0.9)",
      fillColor: colorFor(pdi),
      fillOpacity: dim ? 0.12 : 0.9,
    };
  };

  const districtStyle = (feature: any) => {
    const props = (feature.properties || {}) as any;
    const code = String(props.dist_code ?? "").trim();
    const pdi = districtStatsMap.get(code);

    const isActive = activeDist && String(activeDist) === code;
    const isHovered = hoveredId === `dist:${code}`;
    const dim =
      Boolean(activeDist) &&
      String(activeDist) !== code &&
      viewLevel === "municipality";

    return {
      className: isActive ? "dist-selected" : "",
      weight: isActive || isHovered ? 1.2 : 0.7,
      color: "rgba(243, 244, 246, 0.95)",
      fillColor: colorFor(pdi),
      fillOpacity: dim ? 0.12 : 0.9,
    };
  };

  const lmStyle = (feature: any) => {
    const props = (feature.properties || {}) as any;
    const code = String(props.muni_code ?? "").trim();
    const pdi = muniStatsMap.get(code);

    const isSelected =
      selectedMuniCode && String(selectedMuniCode) === code;
    const isHovered = hoveredId === `muni:${code}`;
    const dim =
      viewLevel === "municipality" &&
      selectedMuniCode &&
      !isSelected;

    return {
      className: isSelected ? "muni-selected" : "",
      weight: isSelected || isHovered ? 1.2 : 0.5,
      color: "rgba(229, 231, 235, 0.95)",
      fillColor: colorFor(pdi),
      fillOpacity: dim ? 0.18 : isSelected ? 0.95 : 0.9,
    };
  };

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // South Africa bounding box
  const bounds: [[number, number], [number, number]] = [
    [-35, 15],
    [-21, 34],
  ];

  // Helper: zoom so the clicked layer fills most of the map window, per level
  const fitLayerToView = (layer: any, level: ViewLevel) => {
    // use the Leaflet map attached to this layer (not the React state snapshot)
    const leafletMap = (layer as any)?._map as LeafletMap | undefined;
    if (!leafletMap) return;

    const b = layer.getBounds();

    const options: any = {
      paddingTopLeft: [24, 24],
      paddingBottomRight: [24, 24],
      animate: true,
      duration: 0.45,
    };

    // Shape-aware auto-fit, but cap zoom so it never gets "too close"
    if (level === "province") {
      options.maxZoom = 7;
    } else if (level === "district") {
      options.maxZoom = 8;
    } else {
      options.maxZoom = 9;
    }

    leafletMap.flyToBounds(b, options);
  };

  if (!provinceGeo || !lmGeo) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 760,
          height: 420,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          backgroundColor: "#e5f0ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        Loading map…
      </div>
    );
  }

return (
<div
  className="map-wrapper"
  style={{
    position: "relative",
    width: "100%",
    height: "60vh",      // 🔑 THIS CONTROLS MAP SIZE
    minHeight: 320,
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    backgroundColor: "#e5f0ff",
  }}
>




      {/* View controls */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: 999,
            padding: 3,
            boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
          }}
        >
          {(["province", "district", "municipality"] as ViewLevel[]).map(
            (lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setViewLevel(lvl);
                  if (lvl === "province") {
                    setActiveProv(null);
                    setActiveDist(null);
                    onSelectMuniCode && onSelectMuniCode("");
                    if (map) {
                      map.flyToBounds(bounds, {
                        paddingTopLeft: [16, 16],
                        paddingBottomRight: [16, 16],
                        animate: true,
                        duration: 0.45,
                      });
                    }
                  } else if (lvl === "district") {
                    setActiveDist(null);
                    onSelectMuniCode && onSelectMuniCode("");
                  }
                }}
                style={{
                  padding: "2px 6px",
                  fontSize: 11,
                  lineHeight: 1.2,
                  borderRadius: 999,
                  border: "none",
                  background:
                    viewLevel === lvl ? "#111827" : "transparent",
                  color:
                    viewLevel === lvl ? "#ffffff" : "#374151",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {lvl === "province"
                  ? "Province"
                  : lvl === "district"
                  ? "District"
                  : "Municipality"}
              </button>
            )
          )}
        </div>
      </div>

      <MapContainer
        center={[-30, 24]}
        zoom={isMobile ? 4.4 : 5}
        maxBounds={isMobile ? undefined : bounds}
        maxBoundsViscosity={isMobile ? 0 : 1.0}
        minZoom={isMobile ? 4.4 : 5}
        maxZoom={11}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
        attributionControl={false}
        zoomControl={true}
        doubleClickZoom={false}
whenCreated={(m) => {
  setMap(m);

  requestAnimationFrame(() => {
    setTimeout(() => {
      m.invalidateSize();

if (!isMobile) {
  m.fitBounds(bounds, {
    paddingTopLeft: [24, 64],
    paddingBottomRight: [24, 48],
    maxZoom: 7,
    animate: false,
  });
}

    }, 150);
  });
}}


      >
        <LevelDblClickHandler
          viewLevel={viewLevel}
          bounds={bounds}
          activeProv={activeProv}
          activeDist={activeDist}
          provinceGeo={provinceGeo}
          districtGeo={districtGeo}
          setViewLevel={setViewLevel}
          setActiveProv={setActiveProv}
          setActiveDist={setActiveDist}
          onSelectMuniCode={onSelectMuniCode}
        />

        {/* PROVINCES */}
        {viewLevel === "province" && provincesFiltered && (
          <GeoJSON
            data={provincesFiltered as any}
            style={provinceStyle}
            smoothFactor={1.5}
            onEachFeature={(feature, layer) => {
              const props = (feature.properties || {}) as any;
              const code = String(
                props.prov_code ?? props.PROV_CODE ?? ""
              );
              const name =
                props.prov_name ?? props.PROV_NAME ?? code;
              const pdi = provinceStatsMap.get(code);

              const tooltip = [
                `<div style="font-size:12px"><strong>${name}</strong>`,
                `<div>Code: ${code}</div>`,
                pdi !== undefined && !isNaN(pdi)
                  ? `<div>Avg PDI: ${pdi.toFixed(2)}</div>`
                  : `<div>No PDI</div>`,
                `</div>`,
              ].join("");

              layer.bindTooltip(tooltip, {
                sticky: true,
                direction: "top",
              });

              layer.on({
                click: () => {
                  setActiveProv(code);
                  setActiveDist(null);
                  setViewLevel("district");
                  fitLayerToView(layer as any, "province");
                },
                dblclick: (e: any) => {
                  if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                  }
                },
                mouseover: () => {
                  setHoveredId(`prov:${code}`);
                  layer.setStyle({
                    weight: 3,
                  });
                  (layer as any).bringToFront();
                  if (onHoverChange) {
                   onHoverChange({ level: "province", code });
                  }
                },
                mouseout: () => {
                  setHoveredId(null);
                  layer.setStyle(provinceStyle(feature));
                  if (onHoverChange) {
                    onHoverChange(null);
                  }
                },
              });
            }}
          />
        )}

        {/* DISTRICTS */}
        {viewLevel === "district" && districtsFiltered && (
          <GeoJSON
            data={districtsFiltered as any}
            style={districtStyle}
            smoothFactor={1.5}
            onEachFeature={(feature, layer) => {
              const props = (feature.properties || {}) as any;
              const code = String(
                props.dist_code ?? props.DIST_CODE ?? ""
              );
              const name =
                props.dist_name ?? props.DIST_NAME ?? code;
              const pdi = districtStatsMap.get(code);

              const tooltip = [
                `<div style="font-size:12px"><strong>${name}</strong>`,
                `<div>Code: ${code}</div>`,
                pdi !== undefined && !isNaN(pdi)
                  ? `<div>Avg PDI: ${pdi.toFixed(2)}</div>`
                  : `<div>No PDI</div>`,
                `</div>`,
              ].join("");

              layer.bindTooltip(tooltip, {
                sticky: true,
                direction: "top",
              });

              layer.on({
                click: () => {
                  setActiveDist(code);
                  setViewLevel("municipality");
                  fitLayerToView(layer as any, "district");
                },
                dblclick: (e: any) => {
                  if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                  }
                },
                mouseover: () => {
                  setHoveredId(`dist:${code}`);
                  layer.setStyle({
                    weight: 2.4,
                  });
                  (layer as any).bringToFront();
                  if (onHoverChange) {
                    onHoverChange({ level: "district", code });
                  }
                },
                mouseout: () => {
                  setHoveredId(null);
                  layer.setStyle(districtStyle(feature));
                  if (onHoverChange) {
                    onHoverChange(null);
                  }
                },
              });
            }}
          />
        )}

        {/* MUNICIPALITIES */}
        {viewLevel === "municipality" && lmFiltered && (
          <GeoJSON
            data={lmFiltered as any}
            style={lmStyle}
            smoothFactor={1.2}
            onEachFeature={(feature, layer) => {
              const props = (feature.properties || {}) as any;
              const code = String(
                props.muni_code ?? props.MUNI_CODE ?? ""
              ).trim();

              const row = lmByCode.get(code);
              const name =
                row?.muni_name ??
                props.muni_name ??
                props.NAME ??
                code;

              const pdi =
                muniStatsMap.get(code) ??
                (row
                  ? Number(
                      row.PDI_MinMax ??
                        row.PDI ??
                        row.pdi ??
                        NaN
                    )
                  : undefined);

              const tooltip = [
                `<div style="font-size:12px"><strong>${name}</strong>`,
                `<div>Code: ${code}</div>`,
                pdi !== undefined && !isNaN(pdi)
                  ? `<div>PDI: ${pdi.toFixed(2)}</div>`
                  : `<div>No PDI</div>`,
                `</div>`,
              ].join("");

              layer.bindTooltip(tooltip, {
                sticky: true,
                direction: "top",
              });

              layer.on({
                click: () => {
                  if (onSelectMuniCode) onSelectMuniCode(code);
                  fitLayerToView(layer as any, "municipality");
                },
                dblclick: (e: any) => {
                  if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                  }
                },
                mouseover: () => {
                  setHoveredId(`muni:${code}`);
                  layer.setStyle({
                    weight: 1.2,
                  });
                  (layer as any).bringToFront();
                  if (onHoverChange) {
                    onHoverChange({ level: "municipality", code });
                  }
                },
                mouseout: () => {
                  setHoveredId(null);
                  layer.setStyle(lmStyle(feature));
                  if (onHoverChange) {
                    onHoverChange(null);
                  }
                },
              });
            }}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 4,
          padding: "6px 8px",
          boxShadow: "0 1px 2px rgba(15,23,42,0.12)",
          fontSize: 11,
          lineHeight: 1.3,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          PDI (relative)
        </div>
        {[
          { label: "< 0.2", color: PDI_COLORS.low },
          { label: "0.2 – 0.4", color: PDI_COLORS.lowMed },
          { label: "0.4 – 0.6", color: PDI_COLORS.med },
          { label: "0.6 – 0.8", color: PDI_COLORS.high },
          { label: ">= 0.8", color: PDI_COLORS.veryHigh },
        ].map((b) => (
          <div
            key={b.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: b.color,
                borderRadius: 2,
                display: "inline-block",
              }}
            />
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplexityChoroplethMap;
