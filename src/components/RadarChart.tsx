import React, { useMemo, useState } from "react";

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
  return ratios
    .map((r, i) => {
      const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
      return `${cx + r * radius * Math.cos(angle)},${cy + r * radius * Math.sin(angle)}`;
    })
    .join(" ");
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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  /* ---------------- SIZE ---------------- */
  const effectiveSize = isMobile ? 260 : Math.max(size, 360);
  const count = Math.max(3, labels.length);

  /* ---------------- PADDING ---------------- */
  const padLeft = isMobile ? 16 : 28;
  const padRight = isMobile ? 24 : 44;
  const padTop = isMobile ? 16 : 28;
  const padBottom = isMobile ? 16 : 28;

  /* ---------------- LEGEND ---------------- */
  const mobileLegendHeight = isMobile ? series.length * 16 + 12 : 0;
  const desktopLegendHeight = !isMobile
    ? Math.min(120, series.length * 20)
    : 0;

  const svgHeight =
    effectiveSize + mobileLegendHeight + desktopLegendHeight + padBottom;

  /* ---------------- CENTER ---------------- */
  const cx =
    effectiveSize / 2 + (isMobile ? -14 : (padRight - padLeft) / 2);
  const cy = effectiveSize / 2;

  /* ---------------- RADIUS ---------------- */
  const radius = Math.min(
    cx - padLeft,
    effectiveSize - cx - padRight,
    cy - padTop,
    effectiveSize - cy - padBottom
  );

  /* ---------------- DATA ---------------- */
  const prepared = useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        ratios: s.values.map((v) => Math.max(0, Math.min(1, (v ?? 0) / max))),
        pdi: mean(s.values.filter((v) => v != null)),
        color: s.color || defaultColors[i % defaultColors.length],
      })),
    [series, max]
  );

  /* ---------------- TOOLTIP ---------------- */
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

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${effectiveSize} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* GRID */}
        {[...Array(gridLevels)].map((_, i) => (
          <polygon
            key={i}
            points={polygonPoints(
              cx,
              cy,
              radius * ((i + 1) / gridLevels),
              count,
              Array(count).fill(1)
            )}
            fill="none"
            stroke="#e6eef2"
          />
        ))}

        {/* AXES */}
        {labels.map((_, i) => {
          const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + radius * Math.cos(angle)}
              y2={cy + radius * Math.sin(angle)}
              stroke="#e6eef2"
            />
          );
        })}

        {/* LABELS */}
        {labels.map((l, i) => {
          const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
          const factor = isMobile ? 1.04 : 1.12;
          const lx = cx + radius * factor * Math.cos(angle);
          const ly = cy + radius * factor * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              fontSize={isMobile ? 10 : 12}
              textAnchor={
                Math.abs(Math.cos(angle)) < 0.2
                  ? "middle"
                  : Math.cos(angle) > 0
                  ? "start"
                  : "end"
              }
              dominantBaseline="middle"
            >
              {l}
            </text>
          );
        })}

        {/* SERIES */}
        {prepared.map((s, si) => (
          <polygon
            key={si}
            points={polygonPoints(cx, cy, radius, count, s.ratios)}
            fill={s.color}
            fillOpacity={0.12}
            stroke={s.color}
            strokeWidth={2}
            onMouseMove={(e) =>
              showTooltip(
                e,
                `<strong>${s.name}</strong><div>PDI: ${s.pdi.toFixed(3)}</div>`
              )
            }
          />
        ))}

        {/* DESKTOP LEGEND */}
        {!isMobile && (
          <g transform={`translate(${cx - 120}, ${effectiveSize + 12})`}>
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

        {/* MOBILE LEGEND (BOTTOM, CENTERED) */}
        {isMobile && (
          <g
            transform={`translate(${cx - 80}, ${
              effectiveSize + 8
            })`}
          >
            {prepared.map((s, i) => (
              <g key={i} transform={`translate(0, ${i * 14})`}>
                <rect width={10} height={10} fill={s.color} rx={2} />
                <text x={14} y={9} fontSize={10}>
                  {s.name}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

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
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}
