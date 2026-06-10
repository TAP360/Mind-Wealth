import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  glass?: boolean;
  borderRadius?: number;
  padding?: number;
}

export function GradientCard({
  children,
  style,
  colors = ["#2E3192", "#92278F", "#F37021"],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  glass = false,
  borderRadius = 20,
  padding = 20,
}: Props) {
  if (glass) {
    return (
      <View
        style={[
          styles.glass,
          { borderRadius, padding },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      start={start}
      end={end}
      style={[{ borderRadius, padding }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
