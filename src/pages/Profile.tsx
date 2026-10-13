import React, { useMemo, useState } from "react";
import { HCCS_NOT_COMPUTED } from "../hccs/contracts";
import { useHccsFeeds } from "../hccs/useHccsFeeds";
import { canonicalMunicipalityCode, canonicalMunicipalityName, firstValue } from "../hccs/format";
import { MetricCard, PageHeader, SectionCard } from "../components/Shared";
import { Fragment as HccsR4Fragment } from "react";


export default function Profile() {
  const feeds = useHccsFeeds();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return feeds.municipalityDrivers.slice(0, 30);
    return feeds.municipalityDrivers.filter((row) => {
      const name = canonicalMunicipalityName(row).toLowerCase();
      const code = canonicalMunicipalityCode(row).toLowerCase();
      return name.includes(needle) || code.includes(needle);
    }).slice(0, 30);
  }, [feeds.municipalityDrivers, query]);

  const selected = filtered[0];

  if (feeds.loading) return <div className="loading">Loading municipal profile…</div>;
  if (feeds.error) return <div className="error-banner">{feeds.error}</div>;

  return (
    <div className="hccs-profile-page">
      <PageHeader
        eyebrow="Municipal Profile"
        title="Current municipal support evidence"
        description="Search a municipality to review current evidence and top support drivers."
      />

      <div className="filter-bar">
        <label>
          Municipality
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by municipality name or code"
          />
        </label>
      </div>

      {selected ? (
        <>
          <div className="metric-grid">
            <MetricCard label="Municipality" value={canonicalMunicipalityName(selected)} note={canonicalMunicipalityCode(selected)} />
            <MetricCard label="Province" value={firstValue(selected, ["province_code", "province"]) || HCCS_NOT_COMPUTED} />
            <MetricCard label="MIIF" value={firstValue(selected, ["miif_category", "miif_description"]) || HCCS_NOT_COMPUTED} />
            <MetricCard label="Six-theme overall" value={firstValue(selected, ["hccs_complexity_score"]) || HCCS_NOT_COMPUTED} note="No fallback classification" />
          </div>

          <SectionCard title="Top support drivers requiring attention">
            <div className="driver-grid">
              {[1, 2, 3].map((index) => (
                <HccsR4Fragment key={index}>
                  <div className="driver-rank">0{index}</div>
                  <h3>{firstValue(selected, [`prevalent_indicator_or_driver_${index}`]) || HCCS_NOT_COMPUTED}</h3>
                  <p>{firstValue(selected, [`theme_${index}`])}</p>
                  <strong>{firstValue(selected, [`score_${index}`]) || HCCS_NOT_COMPUTED}</strong>
                </HccsR4Fragment>
              ))}
            </div>
          </SectionCard>
        </>
      ) : (
        <div className="empty-state">No matching municipality.</div>
      )}
    </div>
  );
}