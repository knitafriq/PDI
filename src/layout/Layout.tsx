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

  // Listen for sidebar close events
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
        style={{ height: "100vh", flexShrink: 0 }}
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
            background: "#fff",
            borderBottom: "1.5px solid #F07D00",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          {/* ================= DESKTOP HEADER ================= */}
          {isDesktop && (
            <div
              style={{
                height: 72,
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                gap: 8,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  whiteSpace: "nowrap",
                  flex: "1 1 auto",
                }}
              >
                Provincial Differentiation & Complexity
              </h2>

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
          )}

          {/* ================= MOBILE HEADER ================= */}
          {!isDesktop && (
            <div
              style={{
                padding: "6px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {/* TOP ROW */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
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
                  }}
                >
                  ☰
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginLeft: "auto",
                  }}
                >
                  <img
                    src="/images/salga-logo.png"
                    alt="SALGA"
                    style={{
                      height: isMobileLogo ? 32 : 50,
                      objectFit: "contain",
                    }}
                  />
                  <img
                    src="/images/digital-logo.png"
                    alt="SALGA Partner"
                    style={{
                      height: isMobileLogo ? 50 : 70,
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>

              {/* TITLE ROW */}
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.2,
                }}
              >
                Provincial Differentiation & Complexity
              </h2>
            </div>
          )}
        </header>

        {/* PAGE CONTENT */}
        <main
  style={{
    flex: 1,
    padding: 24,
    minWidth: 0,
    overflowY: isDesktop ? "auto" : "visible",
    WebkitOverflowScrolling: isDesktop ? "touch" : "auto",
  }}
>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
