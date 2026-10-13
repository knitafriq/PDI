import React, { useMemo, useState } from "react";
import ComplexityChoroplethMap from "../components/ComplexityChoroplethMap";
import { HCCS_NOT_COMPUTED, HCCS_THEMES } from "../hccs/contracts";
import { useHccsFeeds } from "../hccs/useHccsFeeds";
import { firstValue } from "../hccs/format";
import { MetricCard, PageHeader, SectionCard } from "../components/Shared";
import { Fragment as HccsR4Fragment } from "react";


export default function Overview() {
  const feeds = useHccsFeeds();
  const [selectedMuniCode, setSelectedMuniCode] = useState<string | null>(null);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);

  const sourceByTheme = useMemo(() => {
    return HCCS_THEMES.map((theme) => {
      const rows = feeds.sourceMaster.filter(
        (row) => firstValue(row, ["theme", "theme_name"]) === theme
      );
      return { theme, count: rows.length };
    });
  }, [feeds.sourceMaster]);

  const selectedRow = useMemo(() => {
    if (!selectedMuniCode) return null;
    return (
      feeds.municipalityDrivers.find(
        (row) =>
          firstValue(row, ["muni_code", "municipality_code"]).toUpperCase() ===
          selectedMuniCode.toUpperCase()
      ) || null
    );
  }, [feeds.municipalityDrivers, selectedMuniCode]);

  const numericCapacityRows = useMemo(() => {
    return feeds.provinceCapacitySummary.filter((row) => {
      const value = firstValue(row, [
        "capacity_allocation_score",
        "capacity_score",
        "capacity_allocation_score_num",
      ]);
      return value !== "" && value !== HCCS_NOT_COMPUTED && Number.isFinite(Number(value));
    }).length;
  }, [feeds.provinceCapacitySummary]);

  if (feeds.loading) {
    return (
      <div>
        <h1>SALGA Differentiation & Complexity Model</h1>
        <p>Loading current HCCS model…</p>
      </div>
    );
  }

  if (feeds.error) {
    return <div className="error-banner">{feeds.error}</div>;
  }

  const selectedName = selectedRow
    ? firstValue(selectedRow, ["municipality_name", "muni_name"])
    : activeDistrict || activeProvince || "National";

  const selectedOverall = selectedRow
    ? firstValue(selectedRow, ["hccs_complexity_score"]) || HCCS_NOT_COMPUTED
    : HCCS_NOT_COMPUTED;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard overview"
        title="SALGA Differentiation & Complexity Model"
        description="Bottom-up municipal evidence for organisational realignment and support-capacity decisions."
      />

      <div className="metric-grid">
        <MetricCard label="Municipalities" value={feeds.municipalityDrivers.length} note="205 local municipalities + 8 metros" />
        <MetricCard label="Indicators" value={feeds.sourceMaster.length} note="All mapped indicators remain governed" />
        <MetricCard label="Themes" value={HCCS_THEMES.length} note="Equal theme weight only when all six are complete" />
        <MetricCard label="Capacity allocation" value={numericCapacityRows > 0 ? numericCapacityRows : HCCS_NOT_COMPUTED} note="No historical capacity fallback" />
      </div>

      <div className="hccs-map-section-header">
        <h3>Map selector: capacity and support load</h3>
        <p>
          Select a province, district or municipality on the map. The panel on the right
          interprets current governed HCCS evidence for the selected geography.
        </p>
      </div>

      <div className="dashboard-main hccs-scroll-stage">
        <div className="dashboard-map hccs-map-stage">
          <div className="map-wrapper">
            <ComplexityChoroplethMap
              hccsMunicipalityRows={feeds.municipalityDrivers}
              selectedMuniCode={selectedMuniCode}
              onSelectMuniCode={setSelectedMuniCode}
              onActiveProvChange={setActiveProvince}
              onActiveDistChange={setActiveDistrict}
            />
          </div>
        </div>

        <div className="dashboard-side hccs-card-rail">
          <SectionCard
            title="Capacity requirement profile"
            description={selectedName}
          >
            <div className="not-computed-panel">
              <strong>{selectedOverall}</strong>
              <span>
                {selectedRow
                  ? firstValue(selectedRow, ["dominant_support_type"]) || "Current source-backed support evidence"
                  : "Select a municipality to inspect current evidence."}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            title="What is driving complexity"
            description="Current governed indicator mapping across all six HCCS themes."
          >
            <div className="theme-grid">
              {sourceByTheme.map((item) => (
                <HccsR4Fragment key={item.theme}>
                  <div className="theme-card__count">{item.count}</div>
                  <div>{item.theme}</div>
                  <small>mapped indicators</small>
                </HccsR4Fragment>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Model orientation"
            description="Higher scores mean greater complexity and support pressure."
          >
            <div className="level-grid">
              <div><strong>Level 1</strong><span>1.00–1.49</span><small>Foundational</small></div>
              <div><strong>Level 2</strong><span>1.50–2.49</span><small>Emerging</small></div>
              <div><strong>Level 3</strong><span>2.50–3.49</span><small>Intermediate</small></div>
              <div><strong>Level 4</strong><span>3.50–4.00</span><small>Optimized</small></div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}