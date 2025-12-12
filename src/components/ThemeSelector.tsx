import React from "react";

type Props = {
  themes: string[];
  selected: string;
  onSelect: (t: string) => void;
};

const ThemeSelector: React.FC<Props> = ({ themes, selected, onSelect }) => {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: selected === t ? "2px solid #0f1724" : "1px solid rgba(15,23,36,0.08)",
            background: selected === t ? "#fff" : "#ffffffef",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;
