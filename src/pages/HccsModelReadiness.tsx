import React from "react";
import { decideHccsRelease } from "../model/hccsCanonicalGate";

/**
 * R776 staging-only integration surface.
 * The numbers below are a non-live, read-only R775 audit snapshot.
 * This component never loads prototype MinMax scores as HCCS scores.
 * There is no certified backend release to load at this checkpoint.
 */
const audit = {
  checkpoint: "R775 · 4 November 2026",
  municipalities: 213,
  indicators: 80,
  themes: 6,
  positions: 17040,
  numeric: 14416,
  categorical: 1716,
  missing: 908,
  certifiedSources: 0,
  actualScores: 0
} as const;

const gates = [
  ["Source certification", "Publisher definitions, dates and source-cell authority not signed"],
  ["Indicator rules", "Directions and three absolute 1–4 cutpoints not approved"],
  ["MIIF authority", "Peer categories and cross-category fairness not approved"],
  ["Weights and missingness", "Correlated measures, fixed weights and suppression not approved"],
  ["Geographic roll-ups", "District, province and national release policy not signed"],
  ["Production release", "Backend verification and deployment authority not signed"]
] as const;

/** No backend endpoint or public client-controlled approval flags are trusted here. */
const decision = decideHccsRelease(null);

const tile: React.CSSProperties = {
  background: "#fff", border: "1px solid #dce2e9", borderRadius: 8,
  padding: "16px 18px", minWidth: 130, flex: "1 1 155px"
};

const HccsModelReadiness: React.FC = () => {
  return (
    <section aria-label="HCCS canonical model readiness" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <p style={{ fontSize: 12, color: "#64748b", marginTop: 0 }}>{audit.checkpoint} | Read-only evidence snapshot</p>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>HCCS differentiation model — 1–4</h1>
      <p style={{ color: "#475569", maxWidth: 900, lineHeight: 1.55 }}>
        Canonical 80-indicator, six-theme municipal model. This staging screen is separate from the
        legacy prototype dashboards. Source reconciliation is not the same as approved scoring.
      </p>
      <div role="status" aria-live="polite" style={{
        border: "1px solid #f0d6a8", background: "#fffaf0", borderRadius: 8,
        padding: 16, margin: "18px 0"
      }}>
        <strong>Actual model status: {decision.status === "CERTIFIED" ? "CERTIFIED" : "NOT COMPUTED"}</strong>
        <p style={{ margin: "6px 0 0" }}>
          {decision.reason} No municipality, district, province or SALGA score is presented.
          A backend-signed release is required; a browser flag cannot grant approval.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
        {([
          ["Municipalities", audit.municipalities],
          ["Indicators", audit.indicators],
          ["Themes", audit.themes],
          ["Original fact positions", audit.positions],
          ["Governed missing", audit.missing],
          ["Certified scores", audit.actualScores]
        ] as const).map(([label, value]) => (
          <div key={label} style={tile}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
            <div style={{ fontSize: 25, fontWeight: 700, marginTop: 5 }}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 19, marginBottom: 8 }}>Release conditions — all held</h2>
      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #dce2e9", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ textAlign: "left", background: "#f8fafc" }}>
            <th style={{ padding: 12 }}>Gate</th><th style={{ padding: 12 }}>Required resolution</th><th style={{ padding: 12 }}>Status</th>
          </tr></thead>
          <tbody>{gates.map(([name, reason]) => (
            <tr key={name} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={{ padding: 12, fontWeight: 600 }}>{name}</td>
              <td style={{ padding: 12 }}>{reason}</td>
              <td style={{ padding: 12, whiteSpace: "nowrap" }}>Not approved</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h2 style={{ fontSize: 19, marginTop: 24 }}>Evidence preservation</h2>
      <p style={{ lineHeight: 1.55 }}>
        The retained R775 fact grid contains <strong>{audit.numeric.toLocaleString()} numeric</strong>,
        {" "}<strong>{audit.categorical.toLocaleString()} categorical</strong> and
        {" "}<strong>{audit.missing.toLocaleString()} governed missing</strong> observations.
        Those totals are working evidence, not source certification. Certified source approvals:
        {" "}<strong>{audit.certifiedSources}</strong>.
      </p>
      <p style={{ color: "#475569", lineHeight: 1.55 }}>
        Absolute 1–4 scores only at every level. No peer-rank-only metro penalty, no implied
        zero for missing evidence, no backlog derived from access, no automatic weight
        redistribution, and no double-counting municipalities or overlapping indicators.
        The four missing metro GVA observations remain suspended.
      </p>
      <p style={{ fontSize: 12, color: "#64748b" }}>
        Integration state: staging route only. Backend certification not connected. No live
        score tables, database writes, or production substitution. The pre-existing prototype
        pages remain unchanged and are not evidence of a certified HCCS score.
      </p>
    </section>
  );
};

export default HccsModelReadiness;
