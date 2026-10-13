import React, { useMemo } from "react";
import { HCCS_NOT_COMPUTED } from "../hccs/contracts";
import { useHccsFeeds } from "../hccs/useHccsFeeds";
import { canonicalProvinceCode, firstValue } from "../hccs/format";
import { PageHeader, SectionCard } from "../components/Shared";

export default function Compare() {
  const feeds = useHccsFeeds();

  const provinces = useMemo(() => {
    const codes = new Set<string>();
    feeds.provinceDrivers.forEach((row) => {
      const code = canonicalProvinceCode(row);
      if (code) codes.add(code);
    });
    feeds.provinceCapacitySummary.forEach((row) => {
      const code = canonicalProvinceCode(row);
      if (code) codes.add(code);
    });
    return Array.from(codes).sort();
  }, [feeds.provinceDrivers, feeds.provinceCapacitySummary]);

  if (feeds.loading) return <div className="loading">Loading provincial comparison…</div>;
  if (feeds.error) return <div className="error-banner">{feeds.error}</div>;

  return (
    <>
      <PageHeader
        eyebrow="Provincial comparison"
        title="Complexity evidence by province"
        description="Compare current evidence distributions without manufacturing incomplete provincial capacity scores."
      />

      <SectionCard
        title="Provincial capacity overview"
        description="Capacity allocation remains NOT_COMPUTED until its governed decision-layer contract is approved."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Province</th>
                <th>Municipalities</th>
                <th>Capacity allocation</th>
                <th>Current evidence note</th>
              </tr>
            </thead>
            <tbody>
              {provinces.map((code) => {
                const capacity = feeds.provinceCapacitySummary.find((row) => canonicalProvinceCode(row) === code);
                return (
                  <tr key={code}>
                    <td><strong>{code}</strong></td>
                    <td>{firstValue(capacity, ["municipality_count"]) || HCCS_NOT_COMPUTED}</td>
                    <td>{firstValue(capacity, ["capacity_allocation_score", "capacity_score"]) || HCCS_NOT_COMPUTED}</td>
                    <td>{firstValue(capacity, ["ui_feed_note", "note", "status"]) || "Current evidence retained; no historical capacity fallback."}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}