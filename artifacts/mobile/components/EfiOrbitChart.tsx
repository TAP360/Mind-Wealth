import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface EfiDimension {
  label: string;
  value: number;
  color: string;
}

interface EfiOrbitChartProps {
  score: number;
  dimensions: EfiDimension[];
  title: string;
}

const SIZE = 232;
const OUTER_RADIUS = 105;
const INNER_RADIUS = 37;

function clampValue(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

export function EfiOrbitChart({
  score,
  dimensions,
  title,
}: EfiOrbitChartProps) {
  const colors = useColors();
  const safeScore = clampValue(score);
  const ringCount = dimensions.length;
  const radialStep =
    ringCount > 1 ? (OUTER_RADIUS - INNER_RADIUS) / (ringCount - 1) : 0;
  const strokeWidth =
    ringCount > 1 ? Math.min(6.5, radialStep * 0.44) : 6.5;
  const summary = [
    title,
    `${formatValue(safeScore)}/100`,
    ...dimensions.map(
      (dimension) =>
        `${dimension.label}: ${formatValue(clampValue(dimension.value))}/100`,
    ),
  ].join(". ");

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary}
      style={styles.container}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

      <View style={styles.orbitFrame}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
        >
          {dimensions.map((dimension, index) => {
            const radius =
              ringCount > 1
                ? OUTER_RADIUS - index * radialStep
                : (OUTER_RADIUS + INNER_RADIUS) / 2;
            const circumference = 2 * Math.PI * radius;
            const progress = clampValue(dimension.value) / 100;
            const dashOffset = circumference * (1 - progress);

            return (
              <React.Fragment key={`${dimension.label}-${index}`}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={radius}
                  fill="none"
                  stroke={colors.border}
                  strokeWidth={strokeWidth}
                  opacity={0.72}
                />
                {progress > 0 ? (
                  <>
                    <Circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={radius}
                      fill="none"
                      stroke={dimension.color}
                      strokeWidth={strokeWidth + 5}
                      strokeOpacity={0.12}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
                    />
                    <Circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={radius}
                      fill="none"
                      stroke={dimension.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
                    />
                  </>
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>

        <View style={[styles.scoreCenter, { pointerEvents: "none" }]}>
          <Text
            style={[styles.score, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatValue(safeScore)}
          </Text>
          <Text style={[styles.scoreScale, { color: colors.mutedForeground }]}>
            /100
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        {dimensions.map((dimension, index) => (
          <View key={`${dimension.label}-${index}`} style={styles.legendRow}>
            <View
              style={[
                styles.legendMarker,
                { backgroundColor: dimension.color },
              ]}
            />
            <Text
              style={[styles.dimensionLabel, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {dimension.label}
            </Text>
            <Text style={[styles.dimensionValue, { color: colors.mutedForeground }]}>
              {formatValue(clampValue(dimension.value))}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
    maxWidth: 330,
    alignSelf: "center",
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 6,
  },
  orbitFrame: {
    width: "100%",
    maxWidth: SIZE,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCenter: {
    position: "absolute",
    width: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 27,
    lineHeight: 31,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
  scoreScale: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: "Inter_500Medium",
  },
  legend: {
    width: "100%",
    marginTop: 7,
  },
  legendRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: 10,
  },
  legendMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dimensionLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: "Inter_500Medium",
  },
  dimensionValue: {
    minWidth: 27,
    textAlign: "right",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
});