import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/themes", label: "Themes" },
  { to: "/compare", label: "Compare" },
  { to: "/profile", label: "Municipality Profile" }
];

const Sidebar: React.FC = () => {
  return (
    <aside style={{
      width: 260,
      background: "#F07D00",
      color: "#fff",
      padding: "20px 12px",
      boxSizing: "border-box"
    }}>
      <div style={{ padding: "12px 16px", marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 18, color: "#fff" }}>PDI Dashboard</h1>
        <div style={{ color: "#dbe6ef", fontSize: 12, marginTop: 4 }}>Prototype</div>
      </div>

      <nav>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            style={({ isActive }) => ({
              display: "block",
              padding: "10px 16px",
              color: isActive ? "#0f1724" : "#dbe6ef",
              background: isActive ? "#fff" : "transparent",
              margin: "6px 8px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 24, padding: "12px 16px", fontSize: 13, color: "#dbe6ef" }}>
        <div style={{ marginBottom: 8 }}>Filters</div>
        <div style={{ fontSize: 12 }}>Province: <strong>All</strong></div>
        <div style={{ fontSize: 12 }}>Year: <strong>2024</strong></div>
      </div>
    </aside>
  );
};

export default Sidebar;
