import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const ACHIEVEMENTS = [
  { id: "1", icon: "award", label: "First Save", desc: "Saved for the first time", unlocked: true, color: "#F37021" },
  { id: "2", icon: "zap", label: "7-Day Streak", desc: "Saved 7 days in a row", unlocked: true, color: "#2E3192" },
  { id: "3", icon: "shield", label: "Emergency Ready", desc: "50% Emergency Fund", unlocked: true, color: "#22C55E" },
  { id: "4", icon: "star", label: "Discipline", desc: "No impulse buys for 2 weeks", unlocked: false, color: "#92278F" },
  { id: "5", icon: "target", label: "Goal Getter", desc: "Complete your first goal", unlocked: false, color: "#F59E0B" },
  { id: "6", icon: "trending-up", label: "Investor", desc: "Start your investment journey", unlocked: false, color: "#64748B" },
];

const GOAL_ICONS: Record<string, string> = {
  shield: "🛡️",
  car: "🚗",
  airplane: "✈️",
  book: "📚",
  home: "🏠",
  briefcase: "💼",
};

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = Math.min((value / total) * 100, 100);
  return (
    <View style={{ height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
      <LinearGradient
        colors={[color, color + "BB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct}%`, height: "100%", borderRadius: 4 }}
      />
    </View>
  );
}

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, streak, profile } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const overallPct = Math.round((totalSaved / totalTarget) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={["#0B1026", "#1A1040", "#2E3192"]}
          style={[styles.header, { paddingTop: topPad + 16 }]}
        >
          <Text style={styles.headerTitle}>Goals & Challenges</Text>
          <Text style={styles.headerSub}>Build your financial future, one goal at a time</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMain]}>
              <Text style={styles.statValue}>{overallPct}%</Text>
              <Text style={styles.statLabel}>Total Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{goals.length}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
                  {totalSaved.toLocaleString()} EGP
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  saved of {totalTarget.toLocaleString()} EGP total
                </Text>
              </View>
              <View style={[styles.pctBadge, { backgroundColor: "#2E319215" }]}>
                <Text style={styles.pctText}>{overallPct}%</Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <ProgressBar value={totalSaved} total={totalTarget} color="#2E3192" />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Goals</Text>

          {goals.map((g) => {
            const pct = Math.round((g.current / g.target) * 100);
            const remaining = g.target - g.current;
            return (
              <View key={g.id} style={[styles.goalCard, { backgroundColor: colors.card }]}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIconWrap, { backgroundColor: g.color + "20" }]}>
                    <Text style={styles.goalEmoji}>{GOAL_ICONS[g.icon] ?? "🎯"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.foreground }]}>{g.title}</Text>
                    <Text style={[styles.goalDeadline, { color: colors.mutedForeground }]}>Target: {g.deadline}</Text>
                  </View>
                  <View style={[styles.goalPct, { backgroundColor: g.color + "20" }]}>
                    <Text style={[styles.goalPctText, { color: g.color }]}>{pct}%</Text>
                  </View>
                </View>
                <View style={{ marginTop: 12, marginBottom: 10 }}>
                  <ProgressBar value={g.current} total={g.target} color={g.color} />
                </View>
                <View style={styles.goalAmtRow}>
                  <Text style={[styles.goalAmt, { color: colors.foreground }]}>
                    {g.current.toLocaleString()} EGP
                  </Text>
                  <Text style={[styles.goalRemaining, { color: colors.mutedForeground }]}>
                    {remaining.toLocaleString()} EGP to go
                  </Text>
                </View>
              </View>
            );
          })}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.achieveCard,
                  { backgroundColor: colors.card },
                  !a.unlocked && { opacity: 0.45 },
                ]}
              >
                <View style={[styles.achieveIcon, { backgroundColor: a.color + "20" }]}>
                  <Feather name={a.icon as any} size={20} color={a.unlocked ? a.color : colors.mutedForeground} />
                </View>
                <Text style={[styles.achieveLabel, { color: colors.foreground }]}>{a.label}</Text>
                <Text style={[styles.achieveDesc, { color: colors.mutedForeground }]}>{a.desc}</Text>
                {a.unlocked && (
                  <View style={[styles.unlockedBadge, { backgroundColor: a.color }]}>
                    <Text style={styles.unlockedText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <LinearGradient
            colors={["#2E3192", "#92278F", "#F37021"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.challengeCard}
          >
            <View style={styles.challengeRow}>
              <Feather name="flag" size={22} color="rgba(255,255,255,0.8)" />
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeTitle}>This Week's Challenge</Text>
                <Text style={styles.challengeText}>Skip 3 impulse purchases and add the savings to your Emergency Fund.</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={[styles.challengeStep, i === 1 && styles.challengeStepDone]}>
                      <Feather name={i === 1 ? "check" : "circle"} size={12} color={i === 1 ? "#22C55E" : "rgba(255,255,255,0.5)"} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: botPad + 20 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAdd(true);
        }}
      >
        <LinearGradient
          colors={["#2E3192", "#92278F"]}
          style={styles.fabGrad}
        >
          <Feather name="plus" size={26} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
              placeholder="Goal name (e.g. Emergency Fund)"
              placeholderTextColor={colors.mutedForeground}
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
              placeholder="Target amount (EGP)"
              placeholderTextColor={colors.mutedForeground}
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setShowAdd(false)}>
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, { opacity: newGoalTitle && newGoalTarget ? 1 : 0.4 }]}
                disabled={!newGoalTitle || !newGoalTarget}
                onPress={() => {
                  setShowAdd(false);
                  setNewGoalTitle("");
                  setNewGoalTarget("");
                }}
              >
                <LinearGradient colors={["#2E3192", "#92278F"]} style={styles.modalConfirmGrad}>
                  <Text style={styles.modalConfirmText}>Create Goal</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 14, alignItems: "center" },
  statCardMain: { backgroundColor: "rgba(243,112,33,0.25)", borderWidth: 1, borderColor: "rgba(243,112,33,0.4)" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 3, textAlign: "center" },
  body: { padding: 16, gap: 8 },
  summaryCard: { borderRadius: 20, padding: 18, marginBottom: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  pctBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  pctText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#2E3192" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginTop: 8, marginBottom: 4 },
  goalCard: { borderRadius: 20, padding: 18, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  goalIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  goalEmoji: { fontSize: 24 },
  goalTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  goalDeadline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  goalPct: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  goalPctText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  goalAmtRow: { flexDirection: "row", justifyContent: "space-between" },
  goalAmt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  goalRemaining: { fontSize: 13, fontFamily: "Inter_400Regular" },
  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achieveCard: {
    width: "47%", borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    alignItems: "center", gap: 6, position: "relative",
  },
  achieveIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  achieveLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  achieveDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  unlockedBadge: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  unlockedText: { fontSize: 10, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  challengeCard: { borderRadius: 20, padding: 20, marginTop: 4 },
  challengeRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  challengeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF", marginBottom: 6 },
  challengeText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  challengeStep: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  challengeStepDone: { borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.2)" },
  fab: { position: "absolute", right: 20 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", shadowColor: "#2E3192", shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 14 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalInput: { borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", borderWidth: 1 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  modalCancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  modalConfirm: { flex: 2, borderRadius: 14, overflow: "hidden" },
  modalConfirmGrad: { paddingVertical: 14, alignItems: "center" },
  modalConfirmText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
