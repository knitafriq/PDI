import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AudienceLanding() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function openModel() {
    setMessage("");
    try {
      const response = await fetch("/api/model-access", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const body = await response.json();
        if (body?.authenticated === true) {
          navigate("/glossary");
          return;
        }
      }
    } catch {}

    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (working) return;

    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      setMessage("Enter your authorised SALGA email and the model access password.");
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const response = await fetch("/api/model-access", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalized, password }),
      });

      if (!response.ok) {
        setMessage("Access could not be verified. Check your details and try again.");
        return;
      }

      const body = await response.json();
      if (body?.authenticated !== true) {
        setMessage("Access could not be verified. Check your details and try again.");
        return;
      }

      setPassword("");
      setModalOpen(false);
      navigate("/glossary");
    } catch {
      setMessage("The access service is unavailable. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="audience-landing">
      <div className="audience-landing__glow audience-landing__glow--one" />
      <div className="audience-landing__glow audience-landing__glow--two" />

      <header className="audience-landing__header">
        <div className="audience-landing__brand">
          <div className="audience-landing__brand-mark">SALGA</div>
          <div>
            <div className="audience-landing__brand-title">Differentiation & Complexity</div>
            <div className="audience-landing__brand-subtitle">One model. Two governed working paths.</div>
          </div>
        </div>
      </header>

      <main className="audience-landing__main">

      <section className="audience-landing__intro">
        <div className="audience-landing__eyebrow">SALGA decision support</div>
        <h1>One model.</h1>
        <p className="audience-landing__intro">
          Enter the operational Differentiation Model or open the separate Consultation Studio.
        </p>

        <div className="audience-landing__paths">
          <button
            type="button"
            className="audience-path audience-path--primary"
            data-audience-path="model"
            onClick={openModel}
          >
            <span className="audience-path__topline">
              <span className="audience-path__number">01</span>
              <span className="audience-path__badge">Protected model</span>
            </span>
            <span className="audience-path__kicker">Operational HCCS model</span>
            <strong>Differentiation Model</strong>
            <span className="audience-path__copy">
              Current municipal evidence, themes, comparison, profile and glossary.
            </span>
          </button>

          <button
            type="button"
            className="audience-path"
            data-audience-path="consultation"
            onClick={() => navigate("/consultation")}
          >
            <span className="audience-path__topline">
              <span className="audience-path__number">02</span>
              <span className="audience-path__badge">Separate governed lane</span>
            </span>
            <span className="audience-path__kicker">Stakeholder validation</span>
            <strong>Consultation Studio</strong>
            <span className="audience-path__copy">
              Inspect and validate the preserved consultation model without changing HCCS scoring.
            </span>
          </button>
        </div>
      </section>

      {modalOpen && (
        <div className="model-access-overlay" role="presentation">
          <form className="model-access-dialog" onSubmit={submit}>
            <div className="model-access-kicker">Authorised model access</div>
            <h2 id="model-access-title">Open the Differentiation Model</h2>
            <p>Use your authorised SALGA email and the model access password.</p>

            <label>
              Email
              <input
                type="email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {message && <div className="model-access-message">{message}</div>}

            <div className="model-access-actions">
              <button
                type="button"
                onClick={() => {
                  if (!working) {
                    setMessage("");
                    setPassword("");
                    setModalOpen(false);
                  }
                }}
              >
                Cancel
              </button>
              <button type="submit" disabled={working}>
                {working ? "Verifying…" : "Open model"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
    </div>
  );
}