import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

const { width } = Dimensions.get("window");

const riskLevels = [
  {
    id: "conservative",
    label: "Conservative",
    desc: "Lower risk, steady growth. 70% bonds, 30% stocks.",
    icon: "shield",
    color: Colors.light.info,
    bg: Colors.light.infoLight,
  },
  {
    id: "moderate",
    label: "Moderate",
    desc: "Balanced approach. 40% bonds, 60% stocks.",
    icon: "sliders",
    color: Colors.light.tint,
    bg: Colors.light.tintLight,
  },
  {
    id: "aggressive",
    label: "Aggressive",
    desc: "Higher risk, higher potential. 15% bonds, 85% stocks.",
    icon: "trending-up",
    color: Colors.light.accent,
    bg: Colors.light.accentLight,
  },
];

const contributionOptions = [
  { id: "weekly", label: "Weekly", amount: "$50/week" },
  { id: "biweekly", label: "Bi-weekly", amount: "$100/2 weeks" },
  { id: "monthly", label: "Monthly", amount: "$200/month" },
  { id: "custom", label: "Custom", amount: "Set your own" },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, toggleAutoInvest, toggleFirstDollar } = useHSA();
  const [step, setStep] = useState(0);
  const [selectedRisk, setSelectedRisk] = useState("moderate");
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");
  const [autoInvest, setAutoInvest] = useState(true);
  const [firstDollar, setFirstDollar] = useState(true);
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const totalSteps = 3;

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)");
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= step && styles.progressDotActive]}
            />
          ))}
        </View>
        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {step === 0 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <LinearGradient
                colors={[Colors.light.tint, Colors.light.tintDark]}
                style={styles.stepIconGradient}
              >
                <Feather name="zap" size={32} color={Colors.light.white} />
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>Auto-Invest Setup</Text>
            <Text style={styles.stepSubtitle}>
              Let your money grow automatically. We'll invest your contributions based on your risk preference.
            </Text>

            <View style={styles.optionsList}>
              {riskLevels.map((risk) => (
                <Pressable
                  key={risk.id}
                  style={[
                    styles.riskCard,
                    selectedRisk === risk.id && styles.riskCardActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setSelectedRisk(risk.id);
                  }}
                >
                  <View style={[styles.riskIcon, { backgroundColor: risk.bg }]}>
                    <Feather name={risk.icon as any} size={20} color={risk.color} />
                  </View>
                  <View style={styles.riskInfo}>
                    <Text style={styles.riskLabel}>{risk.label}</Text>
                    <Text style={styles.riskDesc}>{risk.desc}</Text>
                  </View>
                  <View style={[styles.radioOuter, selectedRisk === risk.id && styles.radioOuterActive]}>
                    {selectedRisk === risk.id && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <LinearGradient
                colors={["#8B5CF6", "#6D28D9"]}
                style={styles.stepIconGradient}
              >
                <Feather name="dollar-sign" size={32} color={Colors.light.white} />
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>Contribution Schedule</Text>
            <Text style={styles.stepSubtitle}>
              Set up automatic contributions to maximize your HSA benefits and reach the annual limit.
            </Text>

            <View style={styles.optionsList}>
              {contributionOptions.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.freqCard,
                    selectedFrequency === opt.id && styles.freqCardActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setSelectedFrequency(opt.id);
                  }}
                >
                  <View style={styles.freqInfo}>
                    <Text style={styles.freqLabel}>{opt.label}</Text>
                    <Text style={styles.freqAmount}>{opt.amount}</Text>
                  </View>
                  <View style={[styles.radioOuter, selectedFrequency === opt.id && styles.radioOuterActive]}>
                    {selectedFrequency === opt.id && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <LinearGradient
                colors={[Colors.light.accent, "#EA580C"]}
                style={styles.stepIconGradient}
              >
                <Feather name="check-circle" size={32} color={Colors.light.white} />
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>Smart Features</Text>
            <Text style={styles.stepSubtitle}>
              Enable intelligent features that help your HSA grow effortlessly.
            </Text>

            <View style={styles.optionsList}>
              <Pressable
                style={[styles.featureCard, autoInvest && styles.featureCardActive]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAutoInvest(!autoInvest);
                }}
              >
                <View style={[styles.featureIcon, { backgroundColor: Colors.light.tintLight }]}>
                  <Feather name="zap" size={20} color={Colors.light.tint} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureLabel}>Auto-Invest</Text>
                  <Text style={styles.featureDesc}>Automatically invest new contributions into your portfolio</Text>
                </View>
                <View style={[styles.checkbox, autoInvest && styles.checkboxActive]}>
                  {autoInvest && <Ionicons name="checkmark" size={14} color={Colors.light.white} />}
                </View>
              </Pressable>

              <Pressable
                style={[styles.featureCard, firstDollar && styles.featureCardActive]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFirstDollar(!firstDollar);
                }}
              >
                <View style={[styles.featureIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Feather name="dollar-sign" size={20} color={Colors.light.accent} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureLabel}>First Dollar Investing</Text>
                  <Text style={styles.featureDesc}>Start investing from your very first contribution, no minimums</Text>
                </View>
                <View style={[styles.checkbox, firstDollar && styles.checkboxActive]}>
                  {firstDollar && <Ionicons name="checkmark" size={14} color={Colors.light.white} />}
                </View>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={[Colors.light.tint, Colors.light.tintDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={styles.nextBtnText}>
              {step === totalSteps - 1 ? "Get Started" : "Continue"}
            </Text>
            <Feather name="arrow-right" size={18} color={Colors.light.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  progressDotActive: {
    backgroundColor: Colors.light.tint,
  },
  skipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stepContent: {
    alignItems: "center",
  },
  stepIcon: {
    marginBottom: 24,
    marginTop: 20,
  },
  stepIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  optionsList: {
    width: "100%",
    gap: 12,
  },
  riskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  riskCardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  riskIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  riskInfo: {
    flex: 1,
    gap: 2,
  },
  riskLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  riskDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.light.tint,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.tint,
  },
  freqCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  freqCardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  freqInfo: {
    gap: 2,
  },
  freqLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  freqAmount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  featureCardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: {
    flex: 1,
    gap: 2,
  },
  featureLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  featureDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
  },
  nextBtn: {},
  nextBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
});
