import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/localization";

interface ForecastCoachCardProps {
  onAskCoach?: () => void;
}

type QuestionId = "bars" | "estimates" | "actions";

const QUESTIONS: { id: QuestionId; questionKey: string; answerKey: string }[] = [
  {
    id: "bars",
    questionKey: "insights.forecastCoach.questionBars",
    answerKey: "insights.forecastCoach.answerBars",
  },
  {
    id: "estimates",
    questionKey: "insights.forecastCoach.questionEstimates",
    answerKey: "insights.forecastCoach.answerEstimates",
  },
  {
    id: "actions",
    questionKey: "insights.forecastCoach.questionActions",
    answerKey: "insights.forecastCoach.answerActions",
  },
];

export function ForecastCoachCard({ onAskCoach }: ForecastCoachCardProps) {
  const colors = useColors();
  const { t, isRTL } = useLocalization();
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionId | null>(
    null,
  );
  const [responseVersion, setResponseVersion] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const answerOpacity = useRef(new Animated.Value(1)).current;
  const answerShift = useRef(new Animated.Value(0)).current;
  const ambientAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const responseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let active = true;
    const updateMotionPreference = (enabled: boolean) => {
      if (!active) return;
      setReduceMotion(enabled);
      if (enabled) {
        ambientAnimation.current?.stop();
        ambientAnimation.current = null;
        bob.setValue(0);
      }
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(updateMotionPreference)
      .catch(() => updateMotionPreference(false));
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      updateMotionPreference,
    );

    return () => {
      active = false;
      subscription.remove();
      ambientAnimation.current?.stop();
      responseAnimation.current?.stop();
    };
  }, [bob]);

  useEffect(() => {
    if (!isVisible || reduceMotion) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -3,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    ambientAnimation.current = animation;
    animation.start();

    return () => {
      animation.stop();
      if (ambientAnimation.current === animation) {
        ambientAnimation.current = null;
      }
    };
  }, [bob, isVisible, reduceMotion]);

  useEffect(() => {
    if (!selectedQuestion) return;
    responseAnimation.current?.stop();
    if (reduceMotion) {
      answerOpacity.setValue(1);
      answerShift.setValue(0);
      return;
    }

    answerOpacity.setValue(0);
    answerShift.setValue(5);
    const animation = Animated.parallel([
      Animated.timing(answerOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(answerShift, {
        toValue: 0,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);
    responseAnimation.current = animation;
    animation.start();

    return () => {
      animation.stop();
      if (responseAnimation.current === animation) {
        responseAnimation.current = null;
      }
    };
  }, [answerOpacity, answerShift, reduceMotion, responseVersion, selectedQuestion]);

  const handleQuestion = useCallback((id: QuestionId) => {
    setSelectedQuestion(id);
    setResponseVersion((version) => version + 1);
  }, []);

  const answerKey =
    QUESTIONS.find((question) => question.id === selectedQuestion)?.answerKey ??
    "insights.forecastCoach.greeting";

  return (
    <View
      onLayout={() => setIsVisible(true)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          direction: isRTL ? "rtl" : "ltr",
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Animated.View
          style={[
            styles.avatarHalo,
            {
              borderColor: colors.primary,
              transform: [{ translateY: bob }],
            },
          ]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={t("insights.forecastCoach.name")}
        >
          <View
            style={[
              styles.avatarFace,
              { backgroundColor: colors.accent },
            ]}
          >
            <View
              style={[
                styles.hair,
                { backgroundColor: colors.primary },
              ]}
            />
            <View style={styles.eyes}>
              <View style={[styles.eye, { backgroundColor: colors.foreground }]} />
              <View style={[styles.eye, { backgroundColor: colors.foreground }]} />
            </View>
            <View style={[styles.smile, { borderColor: colors.foreground }]} />
            <View
              style={[
                styles.cheek,
                styles.leftCheek,
                { backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[
                styles.cheek,
                styles.rightCheek,
                { backgroundColor: colors.primary },
              ]}
            />
          </View>
          <View
            style={[
              styles.speechHalo,
              { backgroundColor: colors.primary, borderColor: colors.card },
            ]}
          />
        </Animated.View>

        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.name,
              {
                color: colors.foreground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("insights.forecastCoach.name")}
          </Text>
          <Text
            style={[
              styles.greeting,
              {
                color: colors.mutedForeground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("insights.forecastCoach.greeting")}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.questions,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {QUESTIONS.map((question) => {
          const selected = selectedQuestion === question.id;
          return (
            <Pressable
              key={question.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`forecast-coach-question-${question.id}`}
              onPress={() => handleQuestion(question.id)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.secondary,
                  borderColor: selected ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: selected ? colors.primaryForeground : colors.foreground,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t(question.questionKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.answerBox,
          {
            backgroundColor: colors.secondary,
            flexDirection: isRTL ? "row-reverse" : "row",
            opacity: answerOpacity,
            transform: [{ translateY: answerShift }],
          },
        ]}
      >
        <View
          style={[
            styles.answerMarker,
            {
              backgroundColor:
                selectedQuestion === "bars"
                  ? colors.success
                  : selectedQuestion === "estimates"
                    ? colors.purple
                    : colors.primary,
            },
          ]}
        />
        <Text
          style={[
            styles.answerText,
            {
              color: colors.foreground,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
        >
          {t(answerKey)}
        </Text>
      </Animated.View>

      {onAskCoach ? (
        <Pressable
          accessibilityRole="button"
          testID="forecast-coach-ask"
          onPress={onAskCoach}
          style={({ pressed }) => [
            styles.askButton,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.askText, { color: colors.primary }]}>
            {t("insights.forecastCoach.askCoach")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  header: { alignItems: "center", gap: 12 },
  avatarHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarFace: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  hair: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 13,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  eyes: { flexDirection: "row", gap: 9, marginTop: 3 },
  eye: {
    width: 4,
    height: 5,
    borderRadius: 3,
  },
  smile: {
    width: 10,
    height: 5,
    borderBottomWidth: 1.5,
    borderRadius: 8,
    marginTop: 2,
  },
  cheek: {
    position: "absolute",
    top: 26,
    width: 5,
    height: 3,
    borderRadius: 3,
    opacity: 0.38,
  },
  leftCheek: { left: 6 },
  rightCheek: { right: 6 },
  speechHalo: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    right: -2,
    top: 0,
    borderWidth: 2,
  },
  headerCopy: { flex: 1, gap: 3 },
  name: { fontSize: 14, lineHeight: 19, fontFamily: "Inter_600SemiBold" },
  greeting: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  questions: { flexWrap: "wrap", gap: 7 },
  chip: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "30%",
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: { fontSize: 11, lineHeight: 15, fontFamily: "Inter_500Medium" },
  answerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 12,
  },
  answerMarker: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  answerText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  askButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  askText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pressed: { opacity: 0.78 },
});