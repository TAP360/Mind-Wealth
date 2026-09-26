import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface EfiDimension {
  label: string;
  value: number;
  color: string;
}

interface EfiBarChartProps {
  dimensions: EfiDimension[];
  title: string;
  outOfLabel: string;
}

function safeScore(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

export function EfiBarChart({ dimensions, title, outOfLabel }: EfiBarChartProps) {
  const colors = useColors();

  return (
    <View style={styles.chart}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>{outOfLabel}</Text>
      </View>
      {dimensions.map((dimension, index) => {
        const value = safeScore(dimension.value);
        return (
          <View
            key={`${dimension.label}-${index}`}
            style={styles.row}
            accessibilityRole="progressbar"
            accessibilityLabel={dimension.label}
            accessibilityValue={{ min: 0, max: 100, now: value }}
          >
            <View style={styles.labelRow}>
              <View style={[styles.marker, { backgroundColor: dimension.color }]} />
              <Text style={[styles.label, { color: colors.foreground }]}>
                {dimension.label}
              </Text>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {Math.round(value)}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.secondary }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${value}%`, backgroundColor: dimension.color },
                ]}
              />
            </View>
          </View>
        );
      })}
      <View style={styles.scale}>
        <Text style={[styles.scaleText, { color: colors.mutedForeground }]}>0</Text>
        <Text style={[styles.scaleText, { color: colors.mutedForeground }]}>100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { width: "100%", paddingTop: 14 },
  heading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  unit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  row: { paddingTop: 10, paddingBottom: 7, gap: 9 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  marker: { width: 9, height: 9, borderRadius: 5 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 18 },
  value: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    minWidth: 28,
    textAlign: "right",
  },
  track: { height: 12, borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8 },
  scale: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  scaleText: { fontSize: 10, fontFamily: "Inter_400Regular" },
});