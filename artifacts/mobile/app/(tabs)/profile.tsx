import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const personalityColors: Record<string, string> = {
  "Money Vigilance": "#2E3192",
  "Money Worship": "#F37021",
  "Money Status": "#92278F",
  "Money Avoidance": "#22C55E",
  "Money Obligation": "#F59E0B",
};

const SUBSCRIPTION_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "#64748B" },
  premium: { label: "Premium", color: "#F37021" },
  premium_plus: { label: "Premium+", color: "#92278F" },
};

const PLAN_FEATURES = {
  free: ["Money Personality Assessment", "Manual Transaction Tracking", "Limited AI Coach (5/day)", "Basic Insights"],
  premium: ["Unlimited AI Coaching", "Bank Integration", "Real-time EFI Tracking", "Personalized Saving Plans", "Investment Suggestions"],
  premium_plus: ["Advanced Investments", "Family Sharing", "Loan Management", "Tax Assistance", "Human Advisor Sessions"],
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [nudges, setNudges] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pColor = personalityColors[profile.personalityType ?? "Money Vigilance"] ?? "#2E3192";
  const subInfo = SUBSCRIPTION_LABELS[profile.subscription];

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: "user", label: "Personal Information", arrow: true, onPress: () => {} },
        { icon: "link", label: "Linked Accounts", arrow: true, onPress: () => {} },
        { icon: "credit-card", label: "Payment Methods", arrow: true, onPress: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "bell", label: "Notifications", toggle: true, value: notifications, onToggle: setNotifications },
        { icon: "zap", label: "Smart Nudges", toggle: true, value: nudges, onToggle: setNudges },
        { icon: "moon", label: "Dark Mode", toggle: true, value: darkMode, onToggle: setDarkMode },
        { icon: "globe", label: "Language", value: "English", arrow: true, onPress: () => {} },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: "lock", label: "Change Passcode", arrow: true, onPress: () => {} },
        { icon: "shield", label: "Biometric Login", toggle: true, value: true, onToggle: () => {} },
        { icon: "eye-off", label: "Privacy Settings", arrow: true, onPress: () => {} },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle", label: "Help Center", arrow: true, onPress: () => {} },
        { icon: "message-square", label: "Contact Support", arrow: true, onPress: () => {} },
        { icon: "star", label: "Rate MindWealth", arrow: true, onPress: () => {} },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <LinearGradient
        colors={["#0B1026", "#1A1040", "#2E3192"]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[pColor, pColor + "AA"]}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarLetter}>{profile.name[0]}</Text>
          </LinearGradient>
          <Pressable style={styles.editAvatarBtn}>
            <Feather name="camera" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
        <View style={styles.headerBadges}>
          <View style={[styles.subBadge, { backgroundColor: subInfo.color + "30", borderColor: subInfo.color + "60" }]}>
            <Feather name="star" size={12} color={subInfo.color} />
            <Text style={[styles.subBadgeText, { color: subInfo.color }]}>{subInfo.label}</Text>
          </View>
          <Text style={styles.joinText}>Member since {profile.joinDate}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {profile.personalityType && (
          <View style={[styles.personalityCard, { backgroundColor: colors.card }]}>
            <View style={[styles.personalityIcon, { backgroundColor: pColor + "20" }]}>
              <Feather name="user-check" size={22} color={pColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.personalityLabel, { color: colors.mutedForeground }]}>Money Personality</Text>
              <Text style={[styles.personalityName, { color: pColor }]}>{profile.personalityType}</Text>
            </View>
            <Pressable style={[styles.viewBtn, { borderColor: colors.border }]}>
              <Text style={[styles.viewBtnText, { color: colors.mutedForeground }]}>Retake</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.subscriptionCard, { backgroundColor: colors.card }]}>
          <View style={styles.subHeader}>
            <View>
              <Text style={[styles.subTitle, { color: colors.foreground }]}>Your Plan</Text>
              <Text style={[styles.subCurrent, { color: subInfo.color }]}>{subInfo.label}</Text>
            </View>
            {profile.subscription === "free" && (
              <Pressable>
                <LinearGradient
                  colors={["#2E3192", "#92278F", "#F37021"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeBtn}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>

          <View style={styles.featuresGrid}>
            {(PLAN_FEATURES[profile.subscription] ?? PLAN_FEATURES.free).map((f) => (
              <View key={f} style={styles.featureRow}>
                <Feather name="check-circle" size={14} color={subInfo.color} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}
          </View>

          {profile.subscription === "free" && (
            <View style={styles.premiumPriceRow}>
              <View style={styles.priceCard}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Premium</Text>
                <Text style={[styles.priceValue, { color: "#F37021" }]}>150 EGP</Text>
                <Text style={[styles.pricePeriod, { color: colors.mutedForeground }]}>/month</Text>
              </View>
              <View style={styles.priceCard}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Premium+</Text>
                <Text style={[styles.priceValue, { color: "#92278F" }]}>400 EGP</Text>
                <Text style={[styles.pricePeriod, { color: colors.mutedForeground }]}>/month</Text>
              </View>
            </View>
          )}
        </View>

        {settingsSections.map((section) => (
          <View key={section.title} style={styles.settingsSection}>
            <Text style={[styles.settingsSectionTitle, { color: colors.mutedForeground }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.settingsRow,
                      pressed && !item.toggle && { opacity: 0.7 },
                    ]}
                    onPress={item.toggle ? undefined : item.onPress}
                  >
                    <View style={[styles.settingsIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name={item.icon as any} size={16} color={colors.foreground} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
                    {item.toggle ? (
                      <Switch
                        value={item.value as boolean}
                        onValueChange={item.onToggle as (v: boolean) => void}
                        trackColor={{ true: "#2E3192", false: colors.border }}
                        thumbColor="#FFFFFF"
                      />
                    ) : item.value && typeof item.value === "string" ? (
                      <Text style={[styles.settingsValue, { color: colors.mutedForeground }]}>{item.value}</Text>
                    ) : (
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                  {idx < section.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={styles.signOutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: () => {} },
            ]);
          }}
        >
          <View style={[styles.signOutInner, { borderColor: "#EF4444" + "40" }]}>
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </View>
        </Pressable>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>MindWealth AI v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center" },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  editAvatarBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#0B1026",
  },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 4 },
  profileEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", marginBottom: 12 },
  headerBadges: { flexDirection: "row", alignItems: "center", gap: 12 },
  subBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  subBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  joinText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)" },
  body: { padding: 16, gap: 8 },
  personalityCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  personalityIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  personalityLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 3 },
  personalityName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  viewBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  viewBtnText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  subscriptionCard: { borderRadius: 20, padding: 18, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  subHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  subTitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 3 },
  subCurrent: { fontSize: 18, fontFamily: "Inter_700Bold" },
  upgradeBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  upgradeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  featuresGrid: { gap: 8, marginBottom: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  premiumPriceRow: { flexDirection: "row", gap: 10 },
  priceCard: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 14, padding: 12, alignItems: "center" },
  priceLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4, textTransform: "uppercase" },
  priceValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  pricePeriod: { fontSize: 11, fontFamily: "Inter_400Regular" },
  settingsSection: { gap: 6 },
  settingsSectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, paddingLeft: 4 },
  settingsCard: { borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  settingsRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  settingsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  settingsValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginLeft: 62 },
  signOutBtn: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  signOutInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  signOutText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#EF4444" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
});
