import React, { useMemo, useState } from "react";

/**
 * Responsive RadarChart (SVG)
 * - iOS safe
 * - No label clipping
 * - Stable on re-render / selection
 */

type Series = {
  name: string;
  values: number[];
  color?: string;
};

type Props = {
  labels: string[];
  series: Series[];
  size?: number;
  gridLevels?: number;
  max?: number;
};

const defaultColors = ["#0f1724", "#075985", "#9a3412", "#0ea5e9", "#9973ff"];

function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  ratios: number[]
) {
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    const r = Math.max(0, Math.min(1, ratios[i])) * radius;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

const mean = (vals: number[]) =>
  vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

export default function RadarChart({
  labels,
  series,
  size = 480,
  gridLevels = 4,
  max = 1,
}: Props) {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;
  const isTouch =
    typeof window !== "undefined" && "ontouchstart" in window;

  /** ---------- SIZE ---------- */
  const effectiveSize = Math.min(size, isMobile ? 260 : 480);
  const count = Math.max(3, labels.length);

  /** ---------- PADDING (FIXED) ---------- */
  const padLeft = isMobile ? 20 : 28;
  const padRight = isMobile ? 36 : 44; // extra room for right labels
  const padTop = isMobile ? 20 : 28;
  const padBottom = isMobile ? 20 : 28;

  // 🔑 single pad value used for svg height
  const pad = Math.max(padTop, padBottom);

  /** ---------- LEGEND ---------- */
  const legendHeight = !isMobile
    ? Math.min(120, Math.max(24, series.length * 20))
    : 0;

  const svgHeight = effectiveSize + legendHeight + pad;

  /** ---------- CENTER (SHIFTED RIGHT) ---------- */
  const cx = (effectiveSize + padRight - padLeft) / 2;
  const cy = effectiveSize / 2;

  /** ---------- RADIUS ---------- */
  const radius = Math.max(
    40,
    Math.min(
      cx - padLeft,
      effectiveSize - cx - padRight,
      cy - padTop,
      effectiveSize - cy - padBottom
    )
  );

  /** ---------- GRID ---------- */
  const rings = Array.from(
    { length: gridLevels },
    (_, i) => (i + 1) / gridLevels
  );

  const axisInfo = Array.from({ length: count }).map((_, i) => {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    return {
      angle,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  const labelFactor = isMobile ? 1.04 : 1.12;

  /** ---------- SERIES ---------- */
  const prepared = useMemo(() => {
    return series.map((s, i) => {
      const ratios = Array.from({ length: count }).map(
        (_, idx) => Math.max(0, Math.min(1, (s.values[idx] ?? 0) / max))
      );

      return {
        ...s,
        ratios,
        pdi: mean(s.values.filter((v) => v != null)),
        color: s.color || defaultColors[i % defaultColors.length],
      };
    });
  }, [series, count, max]);

  /** ---------- TOOLTIP ---------- */
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    html: "",
  });

  const showTooltip = (e: React.MouseEvent, html: string) => {
    if (isTouch) return;
    setTooltip({
      visible: true,
      x: e.clientX + 12,
      y: e.clientY + 12,
      html,
    });
  };

  const hideTooltip = () =>
    setTooltip({ visible: false, x: 0, y: 0, html: "" });

  /** ---------- RENDER ---------- */
  return (
    <div style={{ width: "100%", minWidth: 0, position: "relative" }}>
      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${effectiveSize} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        {/* GRID */}
        <g stroke="#e6eef2" fill="none">
          {rings.map((r, i) => (
            <polygon
              key={i}
              points={polygonPoints(
                cx,
                cy,
                radius * r,
                count,
                Array(count).fill(1)
              )}
            />
          ))}
        </g>

        {/* AXES */}
        <g stroke="#e6eef2">
          {axisInfo.map((p, i) => (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} />
          ))}
        </g>

        {/* LABELS */}
        <g
          fontSize={isMobile ? 10 : 12}
          fill="#0f1724"
          style={{ userSelect: "none" }}
        >
          {axisInfo.map((p, i) => {
            const lx = cx + radius * labelFactor * Math.cos(p.angle);
            const ly = cy + radius * labelFactor * Math.sin(p.angle);
            const anchor =
              Math.abs(Math.cos(p.angle)) < 0.2
                ? "middle"
                : Math.cos(p.angle) > 0
                ? "start"
                : "end";

            return (
              <text
                key={i}
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
              >
                {labels[i]}
              </text>
            );
          })}
        </g>

        {/* SERIES */}
        {prepared.map((s, si) => {
          const pts = polygonPoints(cx, cy, radius, count, s.ratios);
          return (
            <g key={si}>
              <polygon
                points={pts}
                fill={s.color}
                fillOpacity={0.12}
                stroke={s.color}
                strokeWidth={2}
                onMouseMove={(e) =>
                  showTooltip(
                    e,
                    `<strong>${s.name}</strong><div>PDI: ${s.pdi.toFixed(
                      3
                    )}</div>`
                  )
                }
                onMouseLeave={hideTooltip}
              />
              {s.ratios.map((r, i) => {
                const angle =
                  ((Math.PI * 2) / count) * i - Math.PI / 2;
                return (
                  <circle
                    key={i}
                    cx={cx + radius * r * Math.cos(angle)}
                    cy={cy + radius * r * Math.sin(angle)}
                    r={3}
                    fill={s.color}
                  />
                );
              })}
            </g>
          );
        })}

        {/* LEGEND (DESKTOP ONLY) */}
        {!isMobile && (
          <g transform={`translate(${cx - 110}, ${effectiveSize + 12})`}>
            {prepared.map((s, i) => (
              <g key={i} transform={`translate(0, ${i * 18})`}>
                <rect width={12} height={12} fill={s.color} rx={3} />
                <text x={18} y={10} fontSize={12}>
                  {s.name}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      {/* TOOLTIP */}
      {!isTouch && tooltip.visible && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            background: "rgba(15,23,42,0.96)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 9999,
            whiteSpace: "nowrap",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}
