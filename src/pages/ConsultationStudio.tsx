import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Json = Record<string, unknown>;

function countNodes(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + 1 + countNodes(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Json).reduce(
      (sum, item) => sum + countNodes(item),
      0
    );
  }
  return 0;
}

export default function ConsultationStudio() {
  const [data, setData] = useState<Json | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/consultation/consultation_model_v5.json", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((body) => {
        if (active) setData(body);
      })
      .catch((reason) => {
        if (active) setError(String(reason?.message || reason));
      });

    return () => {
      active = false;
    };
  }, []);

  const keys = useMemo(() => (data ? Object.keys(data) : []), [data]);
  const nodes = useMemo(() => (data ? countNodes(data) : 0), [data]);

  return (
    <div className="consultation-studio-page">
      <div className="cs-studio-shell">
        <aside className="cs-stage-rail">
          <h2 className="cs-stage-rail-heading">Governed consultation source</h2>

          <div className="cs-sidebar-status">
            {error
              ? `Unable to load consultation model: ${error}`
              : data
                ? "consultation_model_v5.json loaded"
                : "Loading consultation model…"}
          </div>

          <div className="cs-rail-scope">
            Operational HCCS themes, scores and current feeds are not overwritten by this route.
          </div>

          <nav className="cs-nav" aria-label="Consultation evidence">
            <button className="is-active" type="button">
              <span>01</span>
              <strong>Consultation evidence</strong>
            </button>
          </nav>
        </aside>

        <section className="cs-stage-main">
          <header className="cs-topbar">
            <div className="cs-topbar-title">
              <div className="cs-eyebrow">SALGA consultation lane</div>
              <strong>Consultation Studio</strong>
              <div className="cs-topbar-meta">
                Preserved separately from the operational HCCS scoring model.
              </div>
            </div>

            <div className="cs-topbar-actions">
              <Link className="cs-button cs-button-ghost" to="/">
                Back to gateway
              </Link>
            </div>
          </header>

          {data ? (
            <section className="cs-facilitator-guide">
              <div className="cs-guide-ask">
                Top-level sections: <strong>{keys.length}</strong>
              </div>
              <div className="cs-guide-outcome">
                Structured nodes available for stakeholder validation: <strong>{nodes}</strong>
              </div>
            </section>
          ) : null}

          <div className="cs-content">
            {data ? (
              <div className="cs-workshop-window-zone">
                {keys.slice(0, 24).map((key) => (
                  <button
                    type="button"
                    className="cs-workshop-window-button"
                    key={key}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ) : (
              <p>{error || "Loading…"}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}