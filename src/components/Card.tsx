import React from "react";

type CardProps = {
  title: string;
  children: React.ReactNode;
  maxWidth?: number | string;
};

const Card: React.FC<CardProps> = ({ title, children, maxWidth }) => {
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        padding: 16,

        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",

        overflow: "visible",

        // optional constraint
        maxWidth: maxWidth ?? "none",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
          lineHeight: 1.3,

          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "anywhere",

          minHeight: 48, // allows 2 lines cleanly
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
};

export default Card;
