import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Row = Record<string, unknown>;

type Props = {
  hccsMunicipalityRows: Row[];
  selectedMuniCode?: string | null;
  onSelectMuniCode?: (code: string | null) => void;
  onActiveProvChange?: (code: string | null) => void;
  onActiveDistChange?: (code: string | null) => void;
};

const MAP_PATHS = {
  province: "/maps/province_boundaries.geojson",
  district: "/maps/district_boundaries.geojson",
  municipality: "/maps/local_municipality_clean.geojson",
};

function first(obj: Row, keys: string[]): string {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function prop(properties: Row, keys: string[]): string {
  return first(properties || {}, keys);
}

function municipalityCode(properties: Row): string {
  return prop(properties, [
    "muni_code",
    "municipality_code",
    "MUNIC_CODE",
    "MUNICCODE",
    "MDB_CODE",
    "CAT_B",
    "CODE",
    "code",
  ]);
}

function provinceCode(properties: Row): string {
  return prop(properties, [
    "province_code",
    "PROVINCE_CODE",
    "PROV_CODE",
    "PR_CODE",
    "province",
  ]);
}

function districtCode(properties: Row): string {
  return prop(properties, [
    "district_code",
    "DISTRICT_CODE",
    "DIST_CODE",
    "DC_MDB_C",
    "DISTRICT",
  ]);
}

function featureLabel(properties: Row): string {
  return prop(properties, [
    "municipality_name",
    "MUNICNAME",
    "MUNIC_NAME",
    "NAME_2",
    "DISTRICT_N",
    "DISTRICT",
    "PROVINCE",
    "PROVNAME",
    "NAME_1",
    "name",
  ]) || "Selected geography";
}

function numericScore(row?: Row): number | null {
  if (!row) return null;
  const raw = first(row, [
    "hccs_complexity_score",
    "complexity_score",
    "average_complexity_score_num",
  ]);
  if (!raw || raw === "NOT_COMPUTED") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1 || value > 4) return null;
  return value;
}

function fillForScore(score: number | null): string {
  if (score === null) return "#d1d5db";
  if (score < 1.5) return "#d9ead3";
  if (score < 2.5) return "#fff2cc";
  if (score < 3.5) return "#f6b26b";
  return "#cc4125";
}

export default function ComplexityChoroplethMap({
  hccsMunicipalityRows,
  selectedMuniCode,
  onSelectMuniCode,
  onActiveProvChange,
  onActiveDistChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const rowByCode = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of hccsMunicipalityRows || []) {
      const code = first(row, ["muni_code", "municipality_code"]);
      if (code) map.set(code.toUpperCase(), row);
    }
    return map;
  }, [hccsMunicipalityRows]);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      zoomControl: true,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 13,
    }).setView([-30.6, 24.2], 5);

    mapRef.current = map;

    let active = true;
    const layers: L.Layer[] = [];

    const provinceStyle: L.PathOptions = {
      color: "#334155",
      weight: 2,
      fillColor: "#f8fafc",
      fillOpacity: 0.08,
    };

    const districtStyle: L.PathOptions = {
      color: "#64748b",
      weight: 1,
      fillColor: "#ffffff",
      fillOpacity: 0.02,
      dashArray: "4 3",
    };

    Promise.all([
      fetch(MAP_PATHS.province).then((r) => {
        if (!r.ok) throw new Error(`Unable to load ${MAP_PATHS.province}: HTTP ${r.status}`);
        return r.json();
      }),
      fetch(MAP_PATHS.district).then((r) => {
        if (!r.ok) throw new Error(`Unable to load ${MAP_PATHS.district}: HTTP ${r.status}`);
        return r.json();
      }),
      fetch(MAP_PATHS.municipality).then((r) => {
        if (!r.ok) throw new Error(`Unable to load ${MAP_PATHS.municipality}: HTTP ${r.status}`);
        return r.json();
      }),
    ]).then(([provinceGeo, districtGeo, municipalityGeo]) => {
      if (!active) return;

      const municipalityLayer = L.geoJSON(municipalityGeo, {
        style: (feature) => {
          const props = (feature?.properties || {}) as Row;
          const code = municipalityCode(props).toUpperCase();
          const row = rowByCode.get(code);
          const score = numericScore(row);
          const selected =
            Boolean(selectedMuniCode) &&
            code === String(selectedMuniCode).toUpperCase();

          return {
            color: selected ? "#0f172a" : "#ffffff",
            weight: selected ? 2 : 0.7,
            fillColor: fillForScore(score),
            fillOpacity: 0.82,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = (feature?.properties || {}) as Row;
          const code = municipalityCode(props);
          const prov = provinceCode(props);
          const dist = districtCode(props);
          const row = rowByCode.get(code.toUpperCase());
          const score = numericScore(row);
          const scoreText = score === null ? "NOT_COMPUTED" : score.toFixed(2);
          const supportType = first(row || {}, ["dominant_support_type"]) || "Current evidence";

          layer.bindTooltip(
            `<strong>${featureLabel(props)}</strong><br/>${code || "—"}<br/>Overall: ${scoreText}<br/>${supportType}`,
            { sticky: true }
          );

          layer.on("click", () => {
            onSelectMuniCode?.(code || null);
            onActiveProvChange?.(prov || null);
            onActiveDistChange?.(dist || null);
            if ((layer as L.Polygon).getBounds) {
              map.fitBounds((layer as L.Polygon).getBounds(), {
                padding: [18, 18],
                maxZoom: 10,
              });
            }
          });
        },
      });

      const districtLayer = L.geoJSON(districtGeo, {
        style: districtStyle,
        onEachFeature: (feature, layer) => {
          const props = (feature?.properties || {}) as Row;
          const dist = districtCode(props);
          const prov = provinceCode(props);
          layer.bindTooltip(`<strong>${featureLabel(props)}</strong>`, { sticky: true });
          layer.on("click", () => {
            onActiveDistChange?.(dist || null);
            onActiveProvChange?.(prov || null);
            if ((layer as L.Polygon).getBounds) {
              map.fitBounds((layer as L.Polygon).getBounds(), {
                padding: [18, 18],
                maxZoom: 8,
              });
            }
          });
        },
      });

      const provinceLayer = L.geoJSON(provinceGeo, {
        style: provinceStyle,
        onEachFeature: (feature, layer) => {
          const props = (feature?.properties || {}) as Row;
          const prov = provinceCode(props);
          layer.bindTooltip(`<strong>${featureLabel(props)}</strong>`, { sticky: true });
          layer.on("click", () => {
            onActiveProvChange?.(prov || null);
            onActiveDistChange?.(null);
            onSelectMuniCode?.(null);
            if ((layer as L.Polygon).getBounds) {
              map.fitBounds((layer as L.Polygon).getBounds(), {
                padding: [18, 18],
                maxZoom: 7,
              });
            }
          });
        },
      });

      municipalityLayer.addTo(map);
      districtLayer.addTo(map);
      provinceLayer.addTo(map);

      layers.push(municipalityLayer, districtLayer, provinceLayer);

      L.control.layers(
        {},
        {
          "Municipalities": municipalityLayer,
          "District boundaries": districtLayer,
          "Province boundaries": provinceLayer,
        },
        { collapsed: true }
      ).addTo(map);

      const bounds = provinceLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [14, 14] });
      }
    }).catch((error) => {
      if (!active || !hostRef.current) return;
      hostRef.current.innerHTML =
        `<div style="padding:16px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">Map unavailable: ${String(error?.message || error)}</div>`;
    });

    return () => {
      active = false;
      for (const layer of layers) {
        try { map.removeLayer(layer); } catch {}
      }
      map.remove();
      mapRef.current = null;
    };
  }, [rowByCode, selectedMuniCode, onSelectMuniCode, onActiveProvChange, onActiveDistChange]);

  return (
    <div
      ref={hostRef}
      className="hccs-functional-map leaflet-host"
      aria-label="Interactive South African municipality complexity map"
      style={{ width: "100%", minHeight: 560, borderRadius: 8, overflow: "hidden" }}
    />
  );
}