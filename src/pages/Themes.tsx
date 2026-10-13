import React, { useMemo, useState } from "react";
import { HCCS_THEMES } from "../hccs/contracts";
import { useHccsFeeds } from "../hccs/useHccsFeeds";
import { firstValue } from "../hccs/format";
import { EmptyState, PageHeader, SectionCard } from "../components/Shared";

export default function Themes() {
  const feeds = useHccsFeeds();
  const [selected, setSelected] = useState<string>(HCCS_THEMES[0]);

  const rows = useMemo(
    () => feeds.sourceMaster.filter((row) => firstValue(row, ["theme", "theme_name"]) === selected),
    [feeds.sourceMaster, selected],
  );

  if (feeds.loading) return <div className="loading">Loading theme evidence…</div>;
  if (feeds.error) return <div className="error-banner">{feeds.error}</div>;

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="Theme evidence"
        title="Six-theme HCCS model"
        description="Operational model: Theme → Indicator. Subthemes do not block scoring or data closure."
      />

      <div className="theme-tabs">
        {HCCS_THEMES.map((theme) => (
          <button
            type="button"
            key={theme}
            className={selected === theme ? "theme-tab theme-tab--active" : "theme-tab"}
            onClick={() => setSelected(theme)}
          >
            {theme}
          </button>
        ))}
      </div>

      <SectionCard title={selected} description={`${rows.length} mapped indicators in the governed source master.`}>
        {rows.length === 0 ? (
          <EmptyState>No mapped indicators were returned for this theme.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicator</th>
                  <th>Representation</th>
                  <th>Source owner</th>
                  <th>Current use</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${firstValue(row, ["indicator_id", "indicator_or_driver_id"])}-${index}`}>
                    <td>
                      <strong>{firstValue(row, ["indicator_name", "indicator_or_driver_name"])}</strong>
                      <small className="table-subline">{firstValue(row, ["indicator_id", "indicator_or_driver_id"])}</small>
                    </td>
                    <td>{firstValue(row, ["representation_level", "current_representation"])}</td>
                    <td>{firstValue(row, ["source_owner", "primary_source_owner"])}</td>
                    <td>{firstValue(row, ["current_report_use", "rollup_status", "current_use"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}