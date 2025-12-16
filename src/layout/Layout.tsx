// src/layout/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh", // full viewport; sidebar stays fixed visually
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* LEFT PANE: Sidebar stays fixed height */}
      <Sidebar />

      {/* RIGHT PANE: header fixed, content scrolls */}
      <div
        style={{
          flex: 1,
          background: "#f6f8fa",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
          <h2 style={{ margin: 0, fontSize: 18 }}>
            Provincial Differentiation & Complexity
          </h2>

          {/* RIGHT SIDE OF HEADER: logos & optional controls */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* optional user / filter space */}
            <div style={{ color: "#666", fontSize: 13 }}>
              {/* add user/profile or date filters here if needed */}
            </div>

            {/* SALGA logos (update src to your real paths) */}
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
                style={{ height: 50, objectFit: "contain", display: "block" }}
              />
              <img
                src="/images/digital-logo.png"
                alt="SALGA Partner"
                style={{ height: 70, objectFit: "contain", display: "block" }}
              />
            </div>
          </div>
        </header>

        {/* Scrollable main content */}
        <main
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
