import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/localization";

export type ForecastQuestion = "bars" | "estimates" | "actions";

export const FORECAST_QUESTIONS: {
  id: ForecastQuestion;
  questionKey: string;
  answerKey: string;
}[] = [
  { id: "bars", questionKey: "insights.forecastCoach.questionBars", answerKey: "insights.forecastCoach.answerBars" },
  { id: "estimates", questionKey: "insights.forecastCoach.questionEstimates", answerKey: "insights.forecastCoach.answerEstimates" },
  { id: "actions", questionKey: "insights.forecastCoach.questionActions", answerKey: "insights.forecastCoach.answerActions" },
];

interface ForecastCoachWidgetProps {
  onContinue: (question: ForecastQuestion | null) => void;
  initialOpen?: boolean;
}

export function ForecastCoachWidget({ onContinue, initialOpen = false }: ForecastCoachWidgetProps) {
  const colors = useColors();
  const { t, isRTL } = useLocalization();
  const [open, setOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(initialOpen);
  const [selected, setSelected] = useState<ForecastQuestion | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const panel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => { if (active) setReduceMotion(value); })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || open) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: Platform.OS !== "web" }),
    );
    animation.start();
    return () => animation.stop();
  }, [open, pulse, reduceMotion]);

  useEffect(() => {
    if (!mounted) return;
    if (reduceMotion) {
      panel.setValue(open ? 1 : 0);
      if (!open) setMounted(false);
      return;
    }
    const animation = Animated.timing(panel, {
      toValue: open ? 1 : 0,
      duration: open ? 300 : 210,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
    return () => animation.stop();
  }, [mounted, open, panel, reduceMotion]);

  const toggle = () => {
    if (!open) setMounted(true);
    setOpen(!open);
  };
  const current = FORECAST_QUESTIONS.find((question) => question.id === selected);

  return (
    <View style={[styles.anchor, isRTL ? styles.anchorLeft : styles.anchorRight, { pointerEvents: "box-none" }]}>
      {mounted ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            styles.panel,
            {
              pointerEvents: open ? "auto" : "none",
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: panel,
              transform: [
                { translateY: panel.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                { scale: panel.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
              ],
            },
          ]}
        >
          <View style={[styles.panelHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.panelIcon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="robot-outline" size={23} color={colors.primary} />
            </View>
            <View style={styles.panelHeading}>
              <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                {t("insights.forecastCoach.name")}
              </Text>
              <Text style={[styles.caption, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
                {t("insights.forecastCoach.previewNotice")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("insights.forecastCoach.close")}
              testID="forecast-coach-close"
              onPress={toggle}
              hitSlop={8}
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.panelScroll}
            contentContainerStyle={styles.panelContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.prompt, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {t("insights.forecastCoach.greeting")}
            </Text>
            {FORECAST_QUESTIONS.map((question) => (
              <Pressable
                key={question.id}
                accessibilityRole="button"
                accessibilityState={{ selected: selected === question.id }}
                testID={`forecast-coach-question-${question.id}`}
                onPress={() => setSelected(question.id)}
                style={({ pressed }) => [
                  styles.question,
                  {
                    backgroundColor: selected === question.id ? colors.primary : colors.secondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.questionText, { color: selected === question.id ? colors.primaryForeground : colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                  {t(question.questionKey)}
                </Text>
              </Pressable>
            ))}
            {current ? (
              <View style={[styles.answer, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Text style={[styles.answerText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                  {t(current.answerKey)}
                </Text>
              </View>
            ) : null}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            testID="forecast-coach-continue"
            onPress={() => onContinue(selected)}
            style={({ pressed }) => [
              styles.continueButton,
              { backgroundColor: colors.primary, flexDirection: isRTL ? "row-reverse" : "row", opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.continueText, { color: colors.primaryForeground }]}>
              {t("insights.forecastCoach.continue")}
            </Text>
            <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={16} color={colors.primaryForeground} />
          </Pressable>
        </Animated.View>
      ) : null}
      <View style={styles.fabWrap}>
        {!open && !reduceMotion ? (
          <Animated.View
            style={[
              styles.pulse,
              {
                pointerEvents: "none",
                borderColor: colors.primary,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
              },
            ]}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? t("insights.forecastCoach.close") : t("insights.forecastCoach.open")}
          accessibilityState={{ expanded: open }}
          testID="forecast-coach-toggle"
          onPress={toggle}
          style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.purple]}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="robot-outline" size={26} color={colors.primaryForeground} />
            <Feather name="zap" size={12} color={colors.primaryForeground} style={styles.spark} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "absolute", bottom: 103, zIndex: 20, width: "84%", maxWidth: 340, alignItems: "flex-end" },
  anchorRight: { right: 18 },
  anchorLeft: { left: 18, alignItems: "flex-start" },
  fabWrap: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  pulse: { position: "absolute", width: 58, height: 58, borderRadius: 29, borderWidth: 2 },
  fab: { width: 56, height: 56, borderRadius: 28, elevation: 7 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  spark: { position: "absolute", top: 8, right: 8 },
  panel: { width: "100%", maxHeight: 375, borderRadius: 20, borderWidth: 1, marginBottom: 12, padding: 14, elevation: 8, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 16 },
  panelHeader: { alignItems: "center", gap: 10, marginBottom: 10 },
  panelIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  panelHeading: { flex: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 14 },
  caption: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, marginTop: 2 },
  panelScroll: { flexShrink: 1 },
  panelContent: { gap: 8, paddingBottom: 5 },
  prompt: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18 },
  question: { borderRadius: 11, minHeight: 38, paddingHorizontal: 11, paddingVertical: 10, justifyContent: "center" },
  questionText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  answer: { padding: 12, borderRadius: 12, borderLeftWidth: 3 },
  answerText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 19 },
  continueButton: { minHeight: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  continueText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});