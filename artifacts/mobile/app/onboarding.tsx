import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, PersonalityType } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Understand Your\nMoney Personality",
    subtitle: "Discover why you spend, save, and make financial decisions the way you do.",
    image: require("@/assets/images/onboarding1.png"),
  },
  {
    id: "2",
    title: "Track Your Emotional\nFinancial Intelligence",
    subtitle: "Understand the emotions behind your financial behavior and decisions.",
    image: require("@/assets/images/onboarding2.png"),
  },
  {
    id: "3",
    title: "Meet Your AI\nFinancial Coach",
    subtitle: "Receive personalized coaching, insights, and recommendations — 24/7.",
    image: require("@/assets/images/onboarding1.png"),
  },
  {
    id: "4",
    title: "Build Better\nFinancial Habits",
    subtitle: "Develop saving habits and long-term financial confidence, one day at a time.",
    image: require("@/assets/images/onboarding2.png"),
  },
];

const QUESTIONS = [
  {
    id: 1,
    text: "When you receive unexpected money, what's your first instinct?",
    options: [
      { text: "Spend it on something I've wanted", scores: { worship: 2 } },
      { text: "Save it immediately", scores: { vigilance: 2 } },
      { text: "Buy something to impress others", scores: { status: 2 } },
      { text: "Feel guilty and donate it", scores: { avoidance: 2 } },
    ],
  },
  {
    id: 2,
    text: "How do you feel when discussing money with family?",
    options: [
      { text: "Anxious — I prefer not to talk about it", scores: { avoidance: 2, vigilance: 1 } },
      { text: "Obligated to help everyone financially", scores: { obligation: 2 } },
      { text: "Open and comfortable", scores: { vigilance: 1 } },
      { text: "It shows who has power", scores: { status: 2 } },
    ],
  },
  {
    id: 3,
    text: "What does financial success mean to you?",
    options: [
      { text: "Having enough to never worry again", scores: { worship: 2 } },
      { text: "Living below my means, always saving", scores: { vigilance: 2 } },
      { text: "Driving a luxury car and nice home", scores: { status: 2 } },
      { text: "Being free from financial ties", scores: { avoidance: 2 } },
    ],
  },
  {
    id: 4,
    text: "When you see something expensive you want, you:",
    options: [
      { text: "Buy it — I deserve it", scores: { worship: 2 } },
      { text: "Research, wait, then decide carefully", scores: { vigilance: 2 } },
      { text: "Buy it so others see my taste", scores: { status: 2 } },
      { text: "Talk myself out of it, feel relief", scores: { avoidance: 1, obligation: 1 } },
    ],
  },
];

type ScoreKey = "worship" | "vigilance" | "status" | "avoidance" | "obligation";

function getPersonality(scores: Record<ScoreKey, number>): PersonalityType {
  const max = Math.max(...Object.values(scores));
  const winner = Object.entries(scores).find(([, v]) => v === max)?.[0] as ScoreKey;
  const map: Record<ScoreKey, PersonalityType> = {
    worship: "Money Worship",
    vigilance: "Money Vigilance",
    status: "Money Status",
    avoidance: "Money Avoidance",
    obligation: "Money Obligation",
  };
  return map[winner] ?? "Money Vigilance";
}

const personalityInfo: Record<
  string,
  { emoji: string; color: string; desc: string; strength: string; risk: string }
> = {
  "Money Vigilance": {
    emoji: "🛡️",
    color: "#2E3192",
    desc: "You are careful, responsible, and private about money. You believe in saving and being prepared.",
    strength: "Excellent at saving and financial security",
    risk: "May avoid spending even on important needs",
  },
  "Money Worship": {
    emoji: "✨",
    color: "#F37021",
    desc: "You believe money can solve problems and create happiness. You work hard to earn more.",
    strength: "High financial motivation and ambition",
    risk: "Prone to overspending or compulsive buying",
  },
  "Money Status": {
    emoji: "👑",
    color: "#92278F",
    desc: "Money equals success and social status. Your self-worth is tied to financial achievement.",
    strength: "Driven to achieve financial milestones",
    risk: "Spending to impress rather than fulfill",
  },
  "Money Avoidance": {
    emoji: "🌿",
    color: "#22C55E",
    desc: "You believe money is corrupting or stressful. You prefer to ignore financial matters.",
    strength: "Less materialistic, values experiences",
    risk: "May neglect important financial planning",
  },
  "Money Obligation": {
    emoji: "🤝",
    color: "#F59E0B",
    desc: "You feel a deep sense of responsibility to provide for and support others financially.",
    strength: "Generous and family-oriented with money",
    risk: "May sacrifice your own financial wellbeing",
  },
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useApp();

  const [phase, setPhase] = useState<"slides" | "name" | "assessment" | "result">("slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [userName, setUserName] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    worship: 0, vigilance: 0, status: 0, avoidance: 0, obligation: 0,
  });
  const [personality, setPersonality] = useState<PersonalityType>(null);
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeTransition = (fn: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleSlideNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slideIndex < SLIDES.length - 1) {
      const next = slideIndex + 1;
      setSlideIndex(next);
      flatRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      fadeTransition(() => setPhase("name"));
    }
  };

  const handleNameNext = () => {
    if (!userName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fadeTransition(() => setPhase("assessment"));
  };

  const handleAnswer = (optionScores: Partial<Record<ScoreKey, number>>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newScores = { ...scores };
    for (const [k, v] of Object.entries(optionScores) as [ScoreKey, number][]) {
      newScores[k] = (newScores[k] ?? 0) + v;
    }
    setScores(newScores);

    if (questionIndex < QUESTIONS.length - 1) {
      fadeTransition(() => setQuestionIndex((i) => i + 1));
    } else {
      const p = getPersonality(newScores);
      setPersonality(p);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fadeTransition(() => setPhase("result"));
    }
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding(personality, userName.trim() || undefined);
    router.replace("/(tabs)/");
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (phase === "slides") {
    return (
      <LinearGradient
        colors={["#0B1026", "#1A1040", "#2E1855"]}
        style={[styles.fill, { paddingTop: topPad }]}
      >
        <FlatList
          ref={flatRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        <View style={[styles.slideDots, { marginBottom: botPad + 20 }]}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === slideIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={[styles.slideActions, { paddingBottom: botPad + 16 }]}>
          <Pressable style={styles.nextBtn} onPress={handleSlideNext}>
            <LinearGradient
              colors={["#2E3192", "#92278F", "#F37021"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              <Text style={styles.nextBtnText}>
                {slideIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
              </Text>
            </LinearGradient>
          </Pressable>
          {slideIndex < SLIDES.length - 1 && (
            <Pressable
              style={styles.skipBtn}
              onPress={() => {
                setSlideIndex(SLIDES.length - 1);
                flatRef.current?.scrollToIndex({ index: SLIDES.length - 1, animated: true });
              }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    );
  }

  if (phase === "name") {
    return (
      <LinearGradient
        colors={["#0B1026", "#1A1040", "#2E1855"]}
        style={[styles.fill, { paddingTop: topPad, paddingBottom: botPad + 16 }]}
      >
        <Animated.View style={[styles.center, { opacity: fadeAnim }]}>
          <Text style={styles.assessTitle}>What should we call you?</Text>
          <Text style={styles.assessSubtitle}>
            MindWealth AI will personalize your experience based on your name.
          </Text>
          <TextInput
            style={styles.nameInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="Your first name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleNameNext}
          />
          <Pressable
            style={[styles.assessBtn, !userName.trim() && styles.assessBtnDisabled]}
            onPress={handleNameNext}
            disabled={!userName.trim()}
          >
            <LinearGradient
              colors={["#2E3192", "#92278F", "#F37021"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.assessBtnGrad}
            >
              <Text style={styles.assessBtnText}>Continue</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    );
  }

  if (phase === "assessment") {
    const q = QUESTIONS[questionIndex];
    return (
      <LinearGradient
        colors={["#0B1026", "#1A1040", "#2E1855"]}
        style={[styles.fill, { paddingTop: topPad, paddingBottom: botPad + 16 }]}
      >
        <Animated.View style={[styles.assessContainer, { opacity: fadeAnim }]}>
          <View style={styles.progressRow}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i <= questionIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.assessStep}>
            Question {questionIndex + 1} of {QUESTIONS.length}
          </Text>
          <Text style={styles.assessTitle}>{q.text}</Text>
          <View style={styles.optionList}>
            {q.options.map((opt, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => handleAnswer(opt.scores)}
              >
                <Text style={styles.optionText}>{opt.text}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>
    );
  }

  const info = personalityInfo[personality ?? "Money Vigilance"];
  return (
    <LinearGradient
      colors={["#0B1026", "#1A1040", "#2E1855"]}
      style={[styles.fill, { paddingTop: topPad, paddingBottom: botPad + 16 }]}
    >
      <Animated.View style={[styles.center, { opacity: fadeAnim }]}>
        <View style={[styles.personalityBadge, { backgroundColor: info.color + "22", borderColor: info.color + "55" }]}>
          <Text style={styles.personalityEmoji}>{info.emoji}</Text>
          <Text style={[styles.personalityName, { color: info.color }]}>{personality}</Text>
        </View>

        <Text style={styles.slideTitle}>Your Money Personality</Text>
        <Text style={styles.resultDesc}>{info.desc}</Text>

        <View style={styles.resultCards}>
          <View style={styles.resultCard}>
            <Text style={styles.resultCardLabel}>Strength</Text>
            <Text style={styles.resultCardText}>{info.strength}</Text>
          </View>
          <View style={[styles.resultCard, { borderColor: "#EF444422", backgroundColor: "#EF444411" }]}>
            <Text style={[styles.resultCardLabel, { color: "#EF4444" }]}>Watch Out</Text>
            <Text style={styles.resultCardText}>{info.risk}</Text>
          </View>
        </View>

        <Pressable style={styles.nextBtn} onPress={handleFinish}>
          <LinearGradient
            colors={["#2E3192", "#92278F", "#F37021"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGrad}
          >
            <Text style={styles.nextBtnText}>Start My Journey</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  slideImage: { width: width * 0.7, height: height * 0.32, marginBottom: 36 },
  slideTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  slideDots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { width: 24, backgroundColor: "#F37021" },
  slideActions: { paddingHorizontal: 28, gap: 12 },
  nextBtn: { borderRadius: 16, overflow: "hidden" },
  nextBtnGrad: { paddingVertical: 16, paddingHorizontal: 32, alignItems: "center", borderRadius: 16 },
  nextBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)" },

  assessContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" },
  progressDotActive: { backgroundColor: "#F37021" },
  assessStep: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 12,
  },
  assessTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 30,
    marginBottom: 24,
    textAlign: "center",
  },
  assessSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  optionList: { gap: 12 },
  option: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionPressed: { backgroundColor: "rgba(46,49,146,0.4)", borderColor: "rgba(146,39,143,0.6)" },
  optionText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#FFFFFF", lineHeight: 22 },

  nameInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 24,
  },
  assessBtn: { borderRadius: 16, overflow: "hidden", width: "100%" },
  assessBtnDisabled: { opacity: 0.45 },
  assessBtnGrad: { paddingVertical: 16, alignItems: "center", borderRadius: 16 },
  assessBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },

  personalityBadge: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  personalityEmoji: { fontSize: 40 },
  personalityName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  resultDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  resultCards: { width: "100%", gap: 12, marginBottom: 32 },
  resultCard: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    borderRadius: 16,
    padding: 16,
  },
  resultCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#22C55E",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultCardText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
  },
});
