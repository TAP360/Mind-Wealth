import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface Props {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  colors?: string[];
  label?: string;
  sublabel?: string;
  valueColor?: string;
  trackColor?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  colors: gradColors = ["#2E3192", "#92278F", "#F37021"],
  label,
  sublabel,
  valueColor = "#111827",
  trackColor = "#E2E8F0",
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;
  const gradId = `grad-${Math.round(value)}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradColors[0]} />
            <Stop offset="50%" stopColor={gradColors[1] ?? gradColors[0]} />
            <Stop offset="100%" stopColor={gradColors[2] ?? gradColors[0]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      <View style={styles.inner}>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {label ? <Text style={[styles.label, { color: valueColor }]}>{label}</Text> : null}
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    opacity: 0.7,
    marginTop: 1,
  },
  sublabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 1,
  },
});
