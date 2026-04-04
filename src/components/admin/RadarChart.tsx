"use client";

import { TENETS, TENET_LABELS, Tenet } from "@/types";

interface RadarChartProps {
  scores: Record<Tenet, number>;
  size?: number;
}

export default function RadarChart({ scores, size = 300 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const rings = [20, 40, 60, 80, 100];
  const count = TENETS.length;
  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2; // start from top

  function polarToXY(angle: number, r: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function ringPolygon(value: number) {
    const r = (value / 100) * radius;
    return TENETS.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const [x, y] = polarToXY(angle, r);
      return `${x},${y}`;
    }).join(" ");
  }

  const dataPoints = TENETS.map((t, i) => {
    const score = Math.max(0, Math.min(100, scores[t] ?? 0));
    const r = (score / 100) * radius;
    const angle = startAngle + i * angleStep;
    return polarToXY(angle, r);
  });

  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ userSelect: "none" }}
    >
      {/* Grid rings */}
      {rings.map((value) => (
        <polygon
          key={value}
          points={ringPolygon(value)}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {TENETS.map((_, i) => {
        const angle = startAngle + i * angleStep;
        const [x, y] = polarToXY(angle, radius);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="var(--accent)"
        fillOpacity={0.15}
        stroke="var(--accent)"
        strokeWidth={2.5}
      />

      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle
          key={`dot-${i}`}
          cx={x}
          cy={y}
          r={5}
          fill="var(--accent)"
        />
      ))}

      {/* Labels */}
      {TENETS.map((t, i) => {
        const angle = startAngle + i * angleStep;
        const labelR = radius + 22;
        const [x, y] = polarToXY(angle, labelR);
        let anchor: "middle" | "end" | "start" = "middle";
        if (x < cx - 5) anchor = "end";
        else if (x > cx + 5) anchor = "start";
        return (
          <text
            key={`label-${t}`}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="var(--text-secondary)"
            fontSize={12}
            fontFamily="var(--font-heading), 'Space Grotesk', sans-serif"
            fontWeight={500}
          >
            {TENET_LABELS[t]}
          </text>
        );
      })}
    </svg>
  );
}
