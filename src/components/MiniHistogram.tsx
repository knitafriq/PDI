import React from "react";

type Props = { values: number[]; width?: number; height?: number };

const MiniHistogram: React.FC<Props> = ({ values, width = 200, height = 40 }) => {
  if (!values || values.length === 0) return <div style={{height}} />;
  const bins = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const counts = new Array(bins).fill(0);
  values.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor(((v - min) / range) * bins));
    counts[idx] += 1;
  });
  const maxCount = Math.max(...counts);
  const barWidth = width / bins;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {counts.map((c, i) => {
        const h = (c / maxCount) * height;
        const x = i * barWidth;
        return (
          <rect
            key={i}
            x={x + 1}
            y={height - h}
            width={barWidth - 2}
            height={h}
            fill="#0f1724"
            opacity={0.85}
            rx={2}
          />
        );
      })}
    </svg>
  );
};

export default MiniHistogram;
