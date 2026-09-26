import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useExplainInsight } from "@workspace/api-client-react";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/localization";

interface InsightAssistantProps {
  kind: "nudge" | "anomaly";
  id: string;
  title: string;
  description: string;
}

export function InsightAssistant({ kind, id, title, description }: InsightAssistantProps) {
  const colors = useColors();
  const { t, language, isRTL } = useLocalization();
  const explanation = useExplainInsight();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const ask = async () => {
    setOpen(true);
    setError(false);
    try {
      const result = await explanation.mutateAsync({
        data: { kind, title, description, language },
      });
      setAnswer(result.explanation);
    } catch {
      setError(true);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        testID={`ask-ai-${kind}-${id}`}
        onPress={() => {
          if (open) setOpen(false);
          else if (answer) setOpen(true);
          else if (!explanation.isPending) void ask();
        }}
        style={({ pressed }) => [
          styles.askButton,
          { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="creation" size={16} color={colors.primary} />
        <Text style={[styles.askText, { color: colors.primary }]}>
          {open ? t("insights.hideAI") : t("insights.askAI")}
        </Text>
      </Pressable>
      {open ? (
        <View style={[styles.answer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.caption, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {t("insights.exampleAIExplanation")}
          </Text>
          {explanation.isPending && !answer ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : error ? (
            <Pressable accessibilityRole="button" onPress={() => void ask()} testID={`retry-ai-${kind}-${id}`}>
              <Text style={[styles.bodyText, { color: colors.primary, textAlign: isRTL ? "right" : "left" }]}>
                {t("insights.explainError")}
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.bodyText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {answer}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, gap: 8 },
  askButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 12,
  },
  askText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  answer: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  caption: { fontSize: 11, fontFamily: "Inter_500Medium" },
  bodyText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  spinner: { alignSelf: "flex-start", marginVertical: 10 },
});