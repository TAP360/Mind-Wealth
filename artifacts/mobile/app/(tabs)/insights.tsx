import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { CircularProgress } from '@/components/CircularProgress';
import { RadarChart, RadarDimension } from '@/components/RadarChart';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const EFI_DIMENSIONS: RadarDimension[] = [
  { label: 'Awareness', value: 72 },
  { label: 'Confidence', value: 75 },
  { label: 'Impulse\nControl', value: 58 },
  { label: 'Stress\nMgmt', value: 64 },
  { label: 'Planning', value: 80 },
];

const MONTHLY_DATA = [
  { month: 'Jan', savings: 1200, spending: 8400 },
  { month: 'Feb', savings: 1500, spending: 7900 },
  { month: 'Mar', savings: 900, spending: 9100 },
  { month: 'Apr', savings: 2100, spending: 7500 },
  { month: 'May', savings: 1800, spending: 7800 },
  { month: 'Jun', savings: 2400, spending: 7200 },
];

const ANOMALIES = [
  {
    id: '1',
    title: 'Unusual shopping spike',
    desc: '420 EGP above your average — possible impulse trigger',
    confidence: 87,
    risk: 'medium',
    icon: 'shopping-bag',
  },
  {
    id: '2',
    title: 'Weekend dining pattern',
    desc: 'Consistent 35% over-budget on weekends for 3 weeks',
    confidence: 92,
    risk: 'low',
    icon: 'coffee',
  },
  {
    id: '3',
    title: 'Subscription waste detected',
    desc: '3 rarely-used subscriptions totaling 245 EGP/month',
    confidence: 95,
    risk: 'low',
    icon: 'credit-card',
  },
];

const NUDGES = [
  {
    id: '1',
    icon: 'trending-up',
    color: '#22C55E',
    title: 'Savings opportunity',
    text: 'You have 1,200 EGP more than usual this month. Consider adding to your Emergency Fund.',
  },
  {
    id: '2',
    icon: 'alert-triangle',
    color: '#F59E0B',
    title: 'Cooling-off reminder',
    text: "You've browsed 3 shopping sites today — impulse risk is elevated. Try a 24-hour wait.",
  },
  {
    id: '3',
    icon: 'award',
    color: '#2E3192',
    title: 'Milestone reached',
    text: "You've maintained your savings streak for 12 days. Your best streak ever!",
  },
];

type TabKey = 'efi' | 'forecast' | 'nudges' | 'anomalies';

function MiniBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  return (
    <View
      style={{
        height: 4,
        flex: 1,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
      }}
    >
      <View
        style={{
          width: `${(value / max) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

function SpendingBar({
  item,
  maxVal,
}: {
  item: (typeof MONTHLY_DATA)[0];
  maxVal: number;
}) {
  const barH = 80;
  const savH = Math.round((item.savings / maxVal) * barH);
  const spH = Math.round((item.spending / maxVal) * barH);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 2,
          height: barH,
        }}
      >
        <View
          style={{
            width: 8,
            height: savH,
            backgroundColor: '#22C55E',
            borderRadius: 2,
          }}
        />
        <View
          style={{
            width: 8,
            height: spH,
            backgroundColor: '#2E3192',
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
      </View>
      <Text
        style={{
          fontSize: 10,
          color: '#64748B',
          fontFamily: 'Inter_400Regular',
        }}
      >
        {item.month}
      </Text>
    </View>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('efi');

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const bottomPad = insets.bottom + (Platform.OS === 'android' ? 96 : 60);
  const maxBarVal = Math.max(
    ...MONTHLY_DATA.flatMap((d) => [d.savings, d.spending]),
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'efi', label: 'EFI' },
    { key: 'forecast', label: 'Forecast' },
    { key: 'nudges', label: 'Nudges' },
    { key: 'anomalies', label: 'Alerts' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    >
      <LinearGradient
        colors={['#0B1026', '#1A1040', '#2E3192']}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <Text style={styles.headerTitle}>Financial Insights</Text>
        <Text style={styles.headerSub}>AI-powered behavioral analysis</Text>

        <View style={styles.scoreRow}>
          <View style={styles.headerScoreCard}>
            <CircularProgress
              value={profile.efiScore}
              size={80}
              strokeWidth={7}
              colors={['#92278F', '#F37021', '#F37021']}
              valueColor="#FFFFFF"
              trackColor="rgba(255,255,255,0.15)"
            />
            <Text style={styles.headerScoreLabel}>EFI Score</Text>
          </View>
          <View style={styles.headerScoreCard}>
            <CircularProgress
              value={profile.wellnessScore}
              size={80}
              strokeWidth={7}
              colors={['#2E3192', '#92278F', '#92278F']}
              valueColor="#FFFFFF"
              trackColor="rgba(255,255,255,0.15)"
            />
            <Text style={styles.headerScoreLabel}>Wellness</Text>
          </View>
          <View style={styles.headerScoreCard}>
            <CircularProgress
              value={profile.confidenceScore}
              size={80}
              strokeWidth={7}
              colors={['#22C55E', '#2E3192', '#2E3192']}
              valueColor="#FFFFFF"
              trackColor="rgba(255,255,255,0.15)"
            />
            <Text style={styles.headerScoreLabel}>Confidence</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === t.key ? '#2E3192' : colors.mutedForeground,
                },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        {activeTab === 'efi' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Emotional Financial Intelligence
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Your 5 EFI dimensions at a glance
              </Text>
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <RadarChart
                  dimensions={EFI_DIMENSIONS}
                  color="#7C83E0"
                  size={220}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Dimension Breakdown
              </Text>
              {EFI_DIMENSIONS.map((d) => (
                <View key={d.label} style={styles.dimRow}>
                  <Text style={[styles.dimLabel, { color: colors.foreground }]}>
                    {d.label.replace('\n', ' ')}
                  </Text>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <MiniBar value={d.value} max={100} color="#7C83E0" />
                  </View>
                  <Text
                    style={[styles.dimValue, { color: colors.mutedForeground }]}
                  >
                    {d.value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Risk Indicators
              </Text>
              {[
                {
                  label: 'Anxiety Index',
                  value: 32,
                  color: '#EF4444',
                  desc: 'Low — within healthy range',
                },
                {
                  label: 'Spending Trigger Index',
                  value: 58,
                  color: '#F59E0B',
                  desc: 'Moderate — monitor weekend patterns',
                },
                {
                  label: 'Emotional Stability',
                  value: 74,
                  color: '#22C55E',
                  desc: 'Good — consistent over 30 days',
                },
              ].map((r) => (
                <View
                  key={r.label}
                  style={[styles.riskRow, { borderColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.riskLabel, { color: colors.foreground }]}
                    >
                      {r.label}
                    </Text>
                    <Text
                      style={[
                        styles.riskDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {r.desc}
                    </Text>
                  </View>
                  <Text style={[styles.riskValue, { color: r.color }]}>
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'forecast' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Monthly Overview
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Savings vs Spending (EGP)
              </Text>
              <View style={styles.chartRow}>
                {MONTHLY_DATA.map((d) => (
                  <SpendingBar key={d.month} item={d} maxVal={maxBarVal} />
                ))}
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: '#22C55E' }]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Savings
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: '#2E3192', opacity: 0.5 },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Spending
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                July Predictions
              </Text>
              {[
                {
                  cat: 'Food & Drink',
                  predicted: 2800,
                  icon: 'coffee',
                  color: '#F37021',
                },
                {
                  cat: 'Shopping',
                  predicted: 1600,
                  icon: 'shopping-bag',
                  color: '#92278F',
                },
                {
                  cat: 'Transport',
                  predicted: 750,
                  icon: 'map-pin',
                  color: '#2E3192',
                },
                {
                  cat: 'Bills',
                  predicted: 1200,
                  icon: 'zap',
                  color: '#22C55E',
                },
              ].map((p) => (
                <View key={p.cat} style={styles.predRow}>
                  <View
                    style={[
                      styles.predIcon,
                      { backgroundColor: p.color + '20' },
                    ]}
                  >
                    <Feather name={p.icon as any} size={16} color={p.color} />
                  </View>
                  <Text style={[styles.predCat, { color: colors.foreground }]}>
                    {p.cat}
                  </Text>
                  <Text
                    style={[styles.predVal, { color: colors.mutedForeground }]}
                  >
                    {p.predicted.toLocaleString()} EGP
                  </Text>
                </View>
              ))}
            </View>

            <LinearGradient
              colors={['#2E3192', '#92278F']}
              style={styles.savingOpCard}
            >
              <Feather
                name="dollar-sign"
                size={24}
                color="rgba(255,255,255,0.8)"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.savingOpTitle}>Savings Opportunity</Text>
              <Text style={styles.savingOpText}>
                Reducing coffee spending by 20% this month could save you 300
                EGP. Over 12 months, that's 3,600 EGP toward your Emergency
                Fund.
              </Text>
            </LinearGradient>
          </>
        )}

        {activeTab === 'nudges' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Smart Nudges
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                AI-powered behavioral interventions
              </Text>
            </View>
            {NUDGES.map((n) => (
              <View
                key={n.id}
                style={[
                  styles.nudgeCard,
                  { backgroundColor: colors.card, borderLeftColor: n.color },
                ]}
              >
                <View
                  style={[
                    styles.nudgeIcon,
                    { backgroundColor: n.color + '20' },
                  ]}
                >
                  <Feather name={n.icon as any} size={18} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.nudgeTitle, { color: colors.foreground }]}
                  >
                    {n.title}
                  </Text>
                  <Text
                    style={[
                      styles.nudgeText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {n.text}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'anomalies' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Anomaly Detection
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Unusual patterns detected by AI
              </Text>
            </View>
            {ANOMALIES.map((a) => (
              <View
                key={a.id}
                style={[styles.anomalyCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.anomalyHeader}>
                  <View
                    style={[
                      styles.anomalyIcon,
                      {
                        backgroundColor:
                          a.risk === 'medium' ? '#F59E0B20' : '#22C55E20',
                      },
                    ]}
                  >
                    <Feather
                      name={a.icon as any}
                      size={18}
                      color={a.risk === 'medium' ? '#F59E0B' : '#22C55E'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.anomalyTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {a.title}
                    </Text>
                    <Text
                      style={[
                        styles.anomalyDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {a.desc}
                    </Text>
                  </View>
                </View>
                <View style={styles.anomalyFooter}>
                  <Text
                    style={[
                      styles.anomalyConf,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    AI Confidence: {a.confidence}%
                  </Text>
                  <Pressable style={styles.anomalyBtn}>
                    <Text style={styles.anomalyBtnText}>View Details</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    marginBottom: 20,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around' },
  headerScoreCard: { alignItems: 'center', gap: 8 },
  headerScoreLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.65)',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabActive: { backgroundColor: '#2E319215' },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  body: { padding: 16, gap: 12 },
  card: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  dimRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  dimLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', width: 80 },
  dimValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    width: 28,
    textAlign: 'right',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  riskLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  riskDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  riskValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    marginBottom: 12,
  },
  legendRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  predIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predCat: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  predVal: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  savingOpCard: { borderRadius: 20, padding: 20 },
  savingOpTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  savingOpText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
  },
  nudgeCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  nudgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  nudgeText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  anomalyCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  anomalyHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  anomalyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anomalyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  anomalyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  anomalyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anomalyConf: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  anomalyBtn: {
    backgroundColor: '#2E319215',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  anomalyBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#2E3192',
  },
});
