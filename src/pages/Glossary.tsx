import React from "react";
import { HCCS_THEMES } from "../hccs/contracts";
import { PageHeader, SectionCard } from "../components/Shared";

export default function Glossary() {
  return (
    <div className="model-orientation-page">
      <PageHeader
        eyebrow="Model glossary"
        title="SALGA Differentiation & Complexity Model — Objective & Capacity Level Glossary"
        description="Definitions used by the current organisational realignment and resource-allocation model."
      />

      <button
        type="button"
        className="word-download-button"
        onClick={() => window.print()}
      >
        Print glossary
      </button>

      <div className="orientation-card">
        <SectionCard title="Why the model exists">
          <p>
            The model differentiates municipal complexity and support pressure from current,
            source-backed municipal evidence so SALGA can align organisational capability and
            support resources to actual need.
          </p>
        </SectionCard>
      </div>

      <div className="orientation-card">
        <SectionCard title="How to interpret the four capacity levels">
          <div className="level-grid">
            <div><strong>Level 1</strong><span>1.00–1.49</span><small>Foundational</small></div>
            <div><strong>Level 2</strong><span>1.50–2.49</span><small>Emerging</small></div>
            <div><strong>Level 3</strong><span>2.50–3.49</span><small>Intermediate</small></div>
            <div><strong>Level 4</strong><span>3.50–4.00</span><small>Optimized</small></div>
          </div>
        </SectionCard>
      </div>

      <div className="orientation-card">
        <SectionCard title="Aggregation rules">
          <dl className="definition-list">
            <div><dt>Indicator score</dt><dd>Current validated evidence only, scored from 1 to 4.</dd></div>
            <div><dt>Theme score</dt><dd>Arithmetic mean only when all approved roll-up indicators required for that municipality/theme are scored.</dd></div>
            <div><dt>Municipal overall</dt><dd>Equal arithmetic mean of six complete theme scores. Each theme has weight 1/6.</dd></div>
            <div><dt>District</dt><dd>Roll-up and coordination node only; never a primary scored municipality.</dd></div>
            <div><dt>Capacity allocation</dt><dd>Separate decision layer. NOT_COMPUTED until its governed composite contract is approved.</dd></div>
          </dl>
        </SectionCard>
      </div>

      <div className="orientation-card">
        <SectionCard title="How themes map to indicators and support drivers">
          <ol className="theme-list">
            {HCCS_THEMES.map((theme) => <li key={theme}>{theme}</li>)}
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}