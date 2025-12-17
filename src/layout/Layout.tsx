// src/layout/Layout.tsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-manage sidebar visibility by screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // desktop
      } else {
        setSidebarOpen(false); // mobile
      }
    };

    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <div
        className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
      >
        <Sidebar />
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          background: "#f6f8fa",
          display: "flex",
          flexDirection: "column",
          minWidth: 0, // IMPORTANT: prevents overflow issues
        }}
      >
        {/* HEADER */}
        <header
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            background: "#fff",
            borderBottom: "1.5px solid #F07D00",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          {/* MOBILE SIDEBAR TOGGLE */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              marginRight: 12,
              display: window.innerWidth < 1024 ? "inline-flex" : "none",
              alignItems: "center",
              justifyContent: "center",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ☰
          </button>

          <h2 style={{ margin: 0, fontSize: 18 }}>
            Provincial Differentiation & Complexity
          </h2>

          {/* RIGHT SIDE */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: "#666", fontSize: 13 }} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <img
                src="/images/salga-logo.png"
                alt="SALGA"
                style={{ height: 50, objectFit: "contain" }}
              />
              <img
                src="/images/digital-logo.png"
                alt="SALGA Partner"
                style={{ height: 70, objectFit: "contain" }}
              />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
            minWidth: 0, // prevents horizontal clipping on mobile
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
