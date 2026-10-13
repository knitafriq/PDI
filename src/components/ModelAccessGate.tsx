import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

type State = "checking" | "granted" | "denied";

export default function ModelAccessGate() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch("/api/model-access", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          setState("denied");
          return;
        }

        const body = await response.json();
        setState(body?.authenticated === true ? "granted" : "denied");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("denied");
      }
    })();

    return () => controller.abort();
  }, []);

  if (state === "checking") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f8fa",
          color: "#334155",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Verifying model access...
      </div>
    );
  }

  if (state === "granted") {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
}