import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/localization";
import {
  getLocalTransactionAdvice,
  getTransactionFeelingEmoji,
  type TransactionType,
} from "@/components/transactionAdvice";

interface Props {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryLabel: string;
  emotionTag?: string;
  onDone: () => void;
}

export function TransactionSaveFeedback({
  type,
  amount,
  categoryId,
  categoryLabel,
  emotionTag,
  onDone,
}: Props) {
  const colors = useColors();
  const { t, isRTL, language } = useLocalization();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const adviceKeys = getLocalTransactionAdvice({
    type,
    amount,
    categoryId,
    emotionTag,
  });
  const coachAdvice = adviceKeys.map((key) => t(key)).join(" ");
  const feelingEmoji = getTransactionFeelingEmoji(
    type,
    amount,
    categoryId,
    emotionTag,
  );
  const displayedAmount = amount.toLocaleString(language === "ar" ? "ar-EG" : "en-EG");

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const showFeedback = (reduceMotion: boolean) => {
      if (!active) return;
      animation?.stop();
      if (reduceMotion) {
        opacity.setValue(1);
        scale.setValue(1);
        return;
      }
      animation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(showFeedback)
      .catch(() => showFeedback(false));
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      showFeedback,
    );

    return () => {
      active = false;
      animation?.stop();
      subscription.remove();
    };
  }, [opacity, scale]);

  return (
    <View
      style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[
          styles.celebration,
          {
            opacity,
            transform: [{ scale }],
            backgroundColor: type === "income" ? "#22C55E18" : "#F3702118",
          },
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${t(type === "income" ? "transaction.savedIncome" : "transaction.savedExpense")}. ${t("transaction.amountSummary", { amount: displayedAmount, category: categoryLabel })}`}
      >
        <Text style={styles.feelingEmoji}>{feelingEmoji}</Text>
      </Animated.View>
      <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
        {t(type === "income" ? "transaction.savedIncome" : "transaction.savedExpense")}
      </Text>
      <Text style={[styles.summary, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
        {t("transaction.amountSummary", {
          amount: displayedAmount,
          category: categoryLabel,
        })}
      </Text>

      <View
        style={[
          styles.coachCard,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <View style={[styles.coachHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={styles.coachAvatar}>
            <Feather name="message-circle" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.coachHeading}>
            <Text style={[styles.coachName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {t("transaction.coachLabel")}
            </Text>
            <Text style={[styles.disclaimer, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
              {t("transaction.localInsightDisclaimer")}
            </Text>
          </View>
        </View>
        {adviceKeys.map((key, index) => (
          <Text
            key={`${key}-${index}`}
            style={[
              styles.advice,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
              index > 0 && styles.additionalAdvice,
            ]}
            accessibilityRole="text"
            accessibilityLabel={index === 0 ? coachAdvice : undefined}
          >
            {t(key)}
          </Text>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onDone}
        style={({ pressed }) => [
          styles.doneButton,
          { backgroundColor: type === "income" ? "#22C55E" : "#2E3192" },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="check" size={18} color="#FFFFFF" />
        <Text style={styles.doneText}>{t("common.done")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: 20, paddingBottom: 8 },
  celebration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  feelingEmoji: { fontSize: 48 },
  title: { fontSize: 23, fontFamily: "Inter_700Bold", marginBottom: 6 },
  summary: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 20,
    textAlign: "center",
  },
  coachCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  coachHeader: { alignItems: "center", gap: 10, marginBottom: 12 },
  coachAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2E3192",
    alignItems: "center",
    justifyContent: "center",
  },
  coachHeading: { flex: 1 },
  coachName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  advice: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
  additionalAdvice: { marginTop: 10 },
  doneButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doneText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  pressed: { opacity: 0.82 },
});