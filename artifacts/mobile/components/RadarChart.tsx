import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Polygon,
  Line,
  Circle,
  Text as SvgText,
} from "react-native-svg";

export interface RadarDimension {
  label: string;
  value: number;
  max?: number;
}

interface Props {
  dimensions: RadarDimension[];
  size?: number;
  color?: string;
  fillOpacity?: number;
}

function polarToCart(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function RadarChart({
  dimensions,
  size = 220,
  color = "#7C83E0",
  fillOpacity = 0.25,
}: Props) {
  const n = dimensions.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const rings = 4;
  const angleStep = 360 / n;

  const ringPoints = (r: number) =>
    Array.from({ length: n }, (_, i) => polarToCart(i * angleStep, r, cx, cy))
      .map((p) => `${p.x},${p.y}`)
      .join(" ");

  const dataPoints = dimensions
    .map((d, i) => {
      const val = d.value / (d.max ?? 100);
      const r = val * maxR;
      return polarToCart(i * angleStep, r, cx, cy);
    })
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: rings }, (_, ri) => {
        const r = ((ri + 1) / rings) * maxR;
        return (
          <Polygon
            key={ri}
            points={ringPoints(r)}
            fill="none"
            stroke="rgba(100,116,139,0.2)"
            strokeWidth={1}
          />
        );
      })}

      {Array.from({ length: n }, (_, i) => {
        const outer = polarToCart(i * angleStep, maxR, cx, cy);
        return (
          <Line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(100,116,139,0.2)"
            strokeWidth={1}
          />
        );
      })}

      <Polygon
        points={dataPoints}
        fill={color}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {dimensions.map((d, i) => {
        const val = d.value / (d.max ?? 100);
        const r = val * maxR;
        const pt = polarToCart(i * angleStep, r, cx, cy);
        return (
          <Circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
        );
      })}

      {dimensions.map((d, i) => {
        const labelR = maxR + 22;
        const pt = polarToCart(i * angleStep, labelR, cx, cy);
        const anchor =
          Math.abs(pt.x - cx) < 5
            ? "middle"
            : pt.x < cx
            ? "end"
            : "start";
        return (
          <SvgText
            key={i}
            x={pt.x}
            y={pt.y + 4}
            textAnchor={anchor}
            fontSize={10}
            fill="#64748B"
            fontFamily="Inter_500Medium"
          >
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({});
