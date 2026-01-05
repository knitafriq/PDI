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
        flex: 1,
        minWidth: 0,   
        maxWidth: "100%",  
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
        overflow: "visible",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
          width: "100%", 
          lineHeight: 1.3,
          whiteSpace: "normal",      // ✅ allow wrapping
          wordBreak: "break-word",   // ✅ prevent overflow
          overflowWrap: "anywhere",    // wrap even in overlap 
          minHeight: 48,          // enough for 2 lines
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
};


export default Card;
