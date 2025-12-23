// src/layout/Layout.tsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const DESKTOP_BREAKPOINT = 1024;
const MOBILE_LOGO_BREAKPOINT = 768;

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileLogo, setIsMobileLogo] = useState(false);

  // Handle responsive behaviour
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
      setIsMobileLogo(window.innerWidth < MOBILE_LOGO_BREAKPOINT);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔴 IMPORTANT: listen for sidebar close events from Sidebar.tsx
  useEffect(() => {
    const closeSidebar = () => setSidebarOpen(false);
    window.addEventListener("closeSidebar", closeSidebar);
    return () => window.removeEventListener("closeSidebar", closeSidebar);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* MOBILE BACKDROP */}
      {!isDesktop && sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
        style={{
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#f6f8fa",
          minWidth: 0,
        }}
      >
        {/* HEADER */}
        <header
          style={{
            minHeight: 72,
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            background: "#fff",
            borderBottom: "1.5px solid #F07D00",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {/* MOBILE MENU BUTTON */}
          {!isDesktop && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              ☰
            </button>
          )}

          {/* 🔑 HEADER CONTENT (TITLE + LOGOS) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              width: "100%",
              gap: 8,
            }}
          >
            {/* TITLE */}
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                whiteSpace: "nowrap",
                flex: isDesktop ? "1 1 auto" : "1 1 100%",
                order: isDesktop ? 1 : 2, // ⬅ title moves below on mobile
              }}
            >
              Provincial Differentiation & Complexity
            </h2>

            {/* LOGOS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: "auto",
                flexShrink: 0,
                order: isDesktop ? 2 : 1, // ⬅ logos on top-right on mobile
              }}
            >
              <img
                src="/images/salga-logo.png"
                alt="SALGA"
                style={{
                  height: isMobileLogo ? 36 : 50,
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <img
                src="/images/digital-logo.png"
                alt="SALGA Partner"
                style={{
                  height: isMobileLogo ? 44 : 70,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            flex: 1,
            padding: 24,
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
