import React from "react";

type Props = {
  themes: string[];
  selected: string;
  onSelect: (t: string) => void;
};

const ThemeSelector: React.FC<Props> = ({ themes, selected, onSelect }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      {themes.map((t) => {
        const isActive = selected === t;

        return (
          <button
            key={t}
            onClick={() => onSelect(t)}
            type="button"
            style={{
              height: 30,                    // ✅ matches dropdown height
              padding: "0 12px",
              borderRadius: 6,               // ✅ same as selects
              fontSize: 12,                  // ✅ same font size
              fontWeight: 600,
              lineHeight: "30px",
              border: isActive
                ? "1.5px solid #0f1724"
                : "1px solid #d1d5db",
              background: "#ffffff",
              color: "#0f1724",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
