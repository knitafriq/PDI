import React from "react";

type CardProps = {
  title: string;
  children: React.ReactNode;
  maxWidth?: number | string;
};

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 260,
        maxWidth: maxWidth ?? "none", // ✅ default unchanged
        // visual card appearance
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        padding: 16,

        // layout inside
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
          lineHeight: 1.3,
          whiteSpace: "normal",      // ✅ allow wrapping
          wordBreak: "break-word",   // ✅ prevent overflow
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
};


export default Card;
