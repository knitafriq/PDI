// src/components/RadarChart.tsx
import React, { useMemo, useState } from "react";

/**
 * RadarChart (SVG) with tooltip showing series PDI (mean of values).
 *
 * Props:
 * - labels: string[] (axis names)
 * - series: [{ name: string, values: number[], color?: string }]
 * - size: number (px, square). default 480
 * - gridLevels: number of concentric rings. default 4
 * - max: numeric max for values (values normalized by max). default 1
 */

type Series = { name: string; values: number[]; color?: string };

type Props = {
  labels: string[];
  series: Series[];
  size?: number;
  gridLevels?: number;
  max?: number;
};

const defaultColors = ["#0f1724", "#075985", "#9a3412", "#0ea5e9", "#9973ff"];

function polygonPoints(centerX: number, centerY: number, radius: number, count: number, valueRatios: number[]) {
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    const r = Math.max(0, Math.min(1, valueRatios[i])) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

function mean(vals: number[]) {
  if (!vals || !vals.length) return 0;
  const s = vals.reduce((a, b) => a + b, 0);
  return s / vals.length;
}

export default function RadarChart({ labels, series, size = 480, gridLevels = 4, max = 1 }: Props) {
  const count = Math.max(3, labels.length);
  // padding to leave room for axis labels + legend
  const pad = Math.round(Math.max(28, Math.min(48, size * 0.07))); // responsive
  const legendHeight = Math.min(120, Math.max(24, series.length * 20)); // reserve vertical space for legend
  const svgHeight = size + legendHeight + pad; // extra room for legend

  // center the radar a bit higher to give labels top/bottom space
  const cx = size / 2;
  const cy = (size / 2) - Math.round(legendHeight * 0.15);

  // radius limited by available space minus padding
  const radius = Math.max(40, Math.min(cx, cy) - pad);

  // grid rings (ratios)
  const rings = Array.from({ length: gridLevels }, (_, i) => (i + 1) / gridLevels);

  // Compute axis endpoints (for axes and labels)
  const axisInfo = Array.from({ length: count }).map((_, i) => {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return { x, y, angle };
  });

  // helper to choose text anchor based on angle
  const anchorForAngle = (angle: number) => {
    const cos = Math.cos(angle);
    if (Math.abs(cos) < 0.2) return "middle";
    return cos > 0 ? "start" : "end";
  };

  // label offset factor (push labels a little further out)
  const labelFactor = 1.12;

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    html: string;
  }>({ visible: false, x: 0, y: 0, html: "" });

  // Precompute series ratios and PDIs
  const prepared = useMemo(() => {
    return series.map((s, si) => {
      const ratios = Array.from({ length: count }).map((_, i) => {
        const v = s.values[i];
        return v == null ? 0 : Math.max(0, Math.min(1, v / (max || 1)));
      });
      const pdi = mean(s.values.map((v) => (v == null ? 0 : v)));
      return { ...s, ratios, pdi, color: s.color || defaultColors[si % defaultColors.length] };
    });
  }, [series, count, max]);

  // Tooltip helpers
  const showTooltip = (e: React.MouseEvent, html: string) => {
    const x = e.clientX + 12;
    const y = e.clientY + 12;
    setTooltip({ visible: true, x, y, html });
  };
  const hideTooltip = () => setTooltip({ visible: false, x: 0, y: 0, html: "" });

  return (
    <div style={{ position: "relative", width: "100%", overflow: "visible" }}>
      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${size} ${svgHeight}`}
        style={{ maxWidth: "100%", overflow: "visible", display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.06" />
          </filter>
        </defs>

        <g>
          {/* GRID RINGS */}
          <g stroke="#e6eef2" fill="none">
            {rings.map((r, idx) => (
              <polygon
                key={`ring-${idx}`}
                points={polygonPoints(cx, cy, radius * r, count, Array(count).fill(1))}
                strokeWidth={1}
                stroke="#e6eef2"
                fill="none"
              />
            ))}
          </g>

          {/* AXES */}
          <g stroke="#e6eef2" strokeWidth={1}>
            {axisInfo.map((p, i) => (
              <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} />
            ))}
          </g>

          {/* AXIS LABELS */}
          <g fontSize={12} fill="#0f1724" style={{ fontFamily: "inherit" }}>
            {axisInfo.map((p, i) => {
              const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
              const lx = cx + radius * labelFactor * Math.cos(angle);
              const ly = cy + radius * labelFactor * Math.sin(angle);
              const anchor = anchorForAngle(angle);
              return (
                <text
                  key={`lbl-${i}`}
                  x={lx}
                  y={ly}
                  textAnchor={anchor as any}
                  dominantBaseline="middle"
                  fontSize={12}
                  style={{ userSelect: "none" }}
                >
                  {labels[i]}
                </text>
              );
            })}
          </g>

          {/* SERIES POLYGONS */}
          {prepared.map((s, si) => {
            const pts = polygonPoints(cx, cy, radius, count, s.ratios);
            const fill = s.color;
            return (
              <g key={`series-${si}`} style={{ filter: "none" }}>
                <polygon
                  points={pts}
                  fill={fill}
                  fillOpacity={0.12}
                  stroke={fill}
                  strokeWidth={2}
                  strokeOpacity={0.95}
                  onMouseMove={(e) => showTooltip(e, `<strong>${s.name}</strong><div>PDI: ${s.pdi.toFixed(3)}</div>`)}
                  onMouseLeave={hideTooltip}
                />
                {s.ratios.map((r, idx) => {
                  const angle = ((Math.PI * 2) / count) * idx - Math.PI / 2;
                  const x = cx + (radius * r) * Math.cos(angle);
                  const y = cy + (radius * r) * Math.sin(angle);
                  return (
                    <circle
                      key={`dot-${si}-${idx}`}
                      cx={x}
                      cy={y}
                      r={3.5}
                      fill={fill}
                      onMouseMove={(e) =>
                        showTooltip(
                          e,
                          `<strong>${s.name}</strong><div>PDI: ${s.pdi.toFixed(3)}</div><div>${labels[idx]}: ${(
                            (s.ratios[idx] || 0) * (max || 1)
                          ).toFixed(3)}</div>`
                        )
                      }
                      onMouseLeave={hideTooltip}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* LEGEND below radar */}
          <g transform={`translate(0, ${size + Math.max(8, pad * 0.2)})`} fontSize={12}>
            {prepared.map((s, i) => {
              const itemHeight = 18;
              const xRect = cx - 110;
              const y = i * itemHeight;
              return (
                <g key={`legend-${i}`} transform={`translate(${xRect}, ${y})`}>
                  <rect x={0} y={-8} width={12} height={12} fill={s.color} rx={3} />
                  <text
                    x={18}
                    y={0}
                    dominantBaseline="middle"
                    fill="#0f1724"
                    style={{ fontSize: 12, cursor: "default", userSelect: "none" }}
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip overlay (HTML layer) */}
      {tooltip.visible && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: "none",
            background: "rgba(15,23,42,0.98)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 6,
            fontSize: 13,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            zIndex: 9999,
            whiteSpace: "nowrap",
            transform: "translate(0, 0)",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}
