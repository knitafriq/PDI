import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export type RouteKey = "overview" | "themes" | "compare" | "profile" | "glossary";

const nav: { key: RouteKey; label: string; path: string }[] = [
  { key: "overview", label: "Overview", path: "/overview" },
  { key: "themes", label: "Themes", path: "/themes" },
  { key: "compare", label: "Compare", path: "/compare" },
  { key: "profile", label: "Profile", path: "/profile" },
  { key: "glossary", label: "Model glossary", path: "/glossary" },
];

const desktopBreakpoint = 1024;
const compactBreakpoint = 768;

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      const desktop = window.innerWidth >= desktopBreakpoint;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
      setIsCompact(window.innerWidth < compactBreakpoint);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const activeRoute =
    nav.find((item) => location.pathname === item.path)?.key ?? "overview";

  const openRoute = (item: (typeof nav)[number]) => {
    navigate(item.path);
    if (window.innerWidth < desktopBreakpoint) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {!isDesktop && sidebarOpen ? (
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
        style={{ height: "100vh", flexShrink: 0 }}
      >
        <aside
          style={{
            width: 260,
            background:
              "linear-gradient(180deg, #f07d00 0%, #dd6f00 54%, #c96500 100%)",
            color: "#fff",
            padding: "12px 8px",
            boxSizing: "border-box",
            height: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <div className="brand-block">
            <div className="brand-eyebrow">SALGA</div>
            <div className="brand-title">Differentiation Model</div>
            <div className="brand-subtitle">HCCS organisational realignment</div>
          </div>

          <nav aria-label="Model navigation">
            {nav.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  item.key === activeRoute
                    ? "nav-item nav-item--active"
                    : "nav-item"
                }
                onClick={() => openRoute(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-note">
            Current model
            <strong>1–4 complexity / support pressure</strong>
          </div>
        </aside>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#f6f8fa",
          minWidth: 0,
        }}
      >
        <header
          style={{
            background: "#fff",
            borderBottom: "1.5px solid #F07D00",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          {isDesktop ? (
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
                HCCS organisational realignment
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          ) : (
            <div
              style={{
                padding: "6px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  type="button"
                  aria-label="Toggle model navigation"
                  onClick={() => setSidebarOpen((open) => !open)}
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
                      height: isCompact ? 32 : 50,
                      objectFit: "contain",
                    }}
                  />
                  <img
                    src="/images/digital-logo.png"
                    alt="SALGA Partner"
                    style={{
                      height: isCompact ? 50 : 70,
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
              <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.2 }}>
                HCCS organisational realignment
              </h2>
            </div>
          )}
        </header>

        <main
          style={{
            flex: 1,
            padding: 24,
            minWidth: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}