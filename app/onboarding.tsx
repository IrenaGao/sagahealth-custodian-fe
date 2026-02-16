import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

const TOTAL_STEPS = 11;

const banks = [
  { id: "chase", name: "Chase" },
  { id: "boa", name: "Bank of America" },
  { id: "wells", name: "Wells Fargo" },
  { id: "citi", name: "Citi" },
  { id: "capital", name: "Capital One" },
  { id: "usbank", name: "US Bank" },
];

const presetAmounts = [50, 100, 200, 500, 1000];

const frequencies = ["One-time", "Weekly", "Monthly"];

const portfolios = [
  { label: "Conservative", stocks: 20, bonds: 60, cash: 20 },
  { label: "Moderately Conservative", stocks: 40, bonds: 45, cash: 15 },
  { label: "Moderate", stocks: 60, bonds: 30, cash: 10 },
  { label: "Moderately Aggressive", stocks: 75, bonds: 20, cash: 5 },
  { label: "Aggressive", stocks: 90, bonds: 8, cash: 2 },
];

function formatDob(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatSsn(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatPhone(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, toggleAutoInvest } = useHSA();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 16;

  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [ssn, setSsn] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [planType, setPlanType] = useState<"individual" | "family" | null>(null);
  const [spouseOver55, setSpouseOver55] = useState(false);

  const [agreedDisclosures, setAgreedDisclosures] = useState(false);

  const [bankSearch, setBankSearch] = useState("");
  const [connectingBank, setConnectingBank] = useState<string | null>(null);

  const [contributionAmount, setContributionAmount] = useState(200);
  const [frequency, setFrequency] = useState("One-time");

  const [fundsAvailable, setFundsAvailable] = useState(false);

  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState<number | null>(null);
  const [q5, setQ5] = useState<number | null>(null);

  const [portfolioIndex, setPortfolioIndex] = useState(2);

  const [autoInvest, setAutoInvest] = useState(true);
  const [investPercent, setInvestPercent] = useState(100);
  const [investmentConfirmed, setInvestmentConfirmed] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => setStep(4), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (step === 7) {
      setFundsAvailable(false);
      const t = setTimeout(() => setFundsAvailable(true), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const goNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 10) {
      if (!investmentConfirmed) {
        setInvestmentConfirmed(true);
        return;
      }
      completeOnboarding(firstName.trim());
      if (autoInvest) toggleAutoInvest();
      router.replace("/(tabs)");
      return;
    }
    setStep(step + 1);
  };

  const goBack = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(step - 1);
  };

  const handleBankSelect = (bankId: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setConnectingBank(bankId);
    setTimeout(() => {
      setConnectingBank(null);
      setStep(6);
    }, 2000);
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 0:
        return firstName.trim().length > 0 && lastName.trim().length > 0 && dob.trim().length > 0 && ssn.trim().length >= 9;
      case 1:
        return email.trim().length > 0 && phone.trim().length > 0 && street.trim().length > 0 && city.trim().length > 0 && state.trim().length === 2 && zip.trim().length >= 5;
      case 2:
        return planType !== null && agreedDisclosures;
      case 4:
        return true;
      case 6:
        return contributionAmount > 0;
      case 7:
        return fundsAvailable;
      case 8:
        return q1 !== null && q2 !== null && q3 !== null && q4 !== null && q5 !== null;
      case 9:
        return true;
      case 10:
        return true;
      default:
        return false;
    }
  };

  const getButtonText = (): string => {
    if (step === 4) return "Add Funds";
    if (step === 7) return "Start Investing";
    if (step === 10) {
      if (investmentConfirmed) return "Go to Dashboard";
      return "Confirm & Invest";
    }
    return "Continue";
  };

  const showButton = step !== 3 && step !== 5;

  const getAge = (): number => {
    if (!dob || dob.length < 8) return 0;
    const parts = dob.split("/");
    if (parts.length !== 3) return 0;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return 0;
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };
  const isOver55 = getAge() >= 55;
  const catchUp = isOver55 ? (planType === "family" && spouseOver55 ? 2000 : 1000) : 0;
  const annualLimit = (planType === "family" ? 8750 : 4400) + catchUp;

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const getDotSize = (index: number, active: boolean) => {
    const isBig = index === 0 || index === 2 || index === 4;
    if (active) {
      return isBig
        ? { width: 32, height: 32, borderRadius: 16 }
        : { width: 16, height: 16, borderRadius: 8 };
    }
    return isBig
      ? { width: 28, height: 28, borderRadius: 14 }
      : { width: 12, height: 12, borderRadius: 6 };
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Let's get started</Text>
            <Text style={styles.stepSubtitle}>Tell us about yourself to set up your HSA</Text>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={Colors.light.textMuted} />
              </View>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={Colors.light.textMuted} />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput style={styles.input} value={dob} onChangeText={(t) => setDob(formatDob(t))} placeholder="MM/DD/YYYY" placeholderTextColor={Colors.light.textMuted} keyboardType="number-pad" maxLength={10} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Social Security Number</Text>
              <TextInput style={styles.input} value={ssn} onChangeText={(t) => setSsn(formatSsn(t))} placeholder="XXX-XX-XXXX" placeholderTextColor={Colors.light.textMuted} secureTextEntry maxLength={11} keyboardType="number-pad" />
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Contact & Address</Text>
            <Text style={styles.stepSubtitle}>Where should we send your Saga debit card?</Text>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={(t) => setEmail(t)} placeholder="you@email.com" placeholderTextColor={Colors.light.textMuted} keyboardType="email-address" autoCapitalize="none" autoComplete="off" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={(t) => setPhone(formatPhone(t))} placeholder="(555) 555-5555" placeholderTextColor={Colors.light.textMuted} keyboardType="phone-pad" maxLength={14} autoComplete="off" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput style={styles.input} value={street} onChangeText={(t) => setStreet(t)} placeholder="123 Main St" placeholderTextColor={Colors.light.textMuted} autoComplete="off" autoCorrect={false} spellCheck={false} />
            </View>
            <View style={styles.rowFields}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput style={styles.input} value={city} onChangeText={(t) => setCity(t)} placeholder="City" placeholderTextColor={Colors.light.textMuted} autoComplete="off" />
              </View>
              <View style={[styles.formGroup, { width: 70 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput style={styles.input} value={state} onChangeText={(t) => setState(t.toUpperCase())} placeholder="CA" placeholderTextColor={Colors.light.textMuted} maxLength={2} autoCapitalize="characters" autoComplete="off" />
              </View>
              <View style={[styles.formGroup, { width: 100 }]}>
                <Text style={styles.inputLabel}>Zip</Text>
                <TextInput style={styles.input} value={zip} onChangeText={(t) => setZip(t)} placeholder="90210" placeholderTextColor={Colors.light.textMuted} keyboardType="number-pad" maxLength={5} autoComplete="off" />
              </View>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Health Plan Type</Text>
            <Text style={styles.stepSubtitle}>This determines your annual HSA contribution limit</Text>
            <View style={styles.planCards}>
              <Pressable
                style={[styles.planCard, planType === "individual" && styles.planCardActive]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setPlanType("individual");
                }}
              >
                <Ionicons name="person" size={32} color={planType === "individual" ? Colors.light.tint : Colors.light.textSecondary} />
                <Text style={[styles.planLabel, planType === "individual" && styles.planLabelActive]}>Individual</Text>
                <Text style={styles.planLimit}>{isOver55 ? "$5,400" : "$4,400"}/year</Text>
                {isOver55 && <Text style={styles.planCatchUp}>Includes $1,000 catch-up</Text>}
              </Pressable>
              <Pressable
                style={[styles.planCard, planType === "family" && styles.planCardActive]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setPlanType("family");
                }}
              >
                <Ionicons name="people" size={32} color={planType === "family" ? Colors.light.tint : Colors.light.textSecondary} />
                <Text style={[styles.planLabel, planType === "family" && styles.planLabelActive]}>Family</Text>
                <Text style={styles.planLimit}>{isOver55 ? (spouseOver55 ? "$10,750" : "$9,750") : "$8,750"}/year</Text>
                {isOver55 && <Text style={styles.planCatchUp}>{spouseOver55 ? "Includes $2,000 catch-up" : "Includes $1,000 catch-up"}</Text>}
              </Pressable>
            </View>
            {isOver55 && planType === "family" && (
              <Pressable
                style={styles.spouseRow}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setSpouseOver55(!spouseOver55);
                }}
              >
                <View style={[styles.checkbox, spouseOver55 && styles.checkboxActive]}>
                  {spouseOver55 && <Ionicons name="checkmark" size={14} color={Colors.light.white} />}
                </View>
                <Text style={styles.spouseLabel}>My spouse is also 55 or older (+$1,000 additional catch-up)</Text>
              </Pressable>
            )}
            {isOver55 && (
              <View style={styles.catchUpBanner}>
                <Ionicons name="information-circle" size={20} color={Colors.light.info} />
                <Text style={styles.catchUpBannerText}>
                  {planType === "family" && spouseOver55
                    ? "Both you and your spouse qualify for catch-up contributions, adding $2,000 to your annual limit."
                    : "Since you're 55 or older, you qualify for an additional $1,000 catch-up contribution."}
                </Text>
              </View>
            )}
            <View style={[styles.disclosureBox, { height: 180, marginTop: 24 }]}>
              <ScrollView style={styles.disclosureScroll} nestedScrollEnabled>
                <Text style={styles.disclosureText}>
                  HSA CUSTODIAL AGREEMENT{"\n\n"}
                  By opening a Health Savings Account (HSA) with Saga Health, you agree to the terms and conditions set forth in this Custodial Agreement. Saga Health will serve as the custodian of your HSA, maintaining your account in compliance with Section 223 of the Internal Revenue Code.{"\n\n"}
                  Your HSA is established exclusively for the purpose of paying or reimbursing qualified medical expenses of the account beneficiary, their spouse, and dependents. Contributions to your HSA are subject to the annual limits set by the IRS.{"\n\n"}
                  ELECTRONIC CONSENT{"\n\n"}
                  By providing your consent, you agree to receive all account-related communications, statements, disclosures, and notices electronically. You may withdraw this consent at any time by contacting customer support.{"\n\n"}
                  PRIVACY POLICY{"\n\n"}
                  Saga Health is committed to protecting your personal information. We collect and use your data solely for the purpose of administering your HSA, processing transactions, and complying with applicable laws and regulations. We do not sell your personal information to third parties. Your data is encrypted and stored securely using industry-standard protocols.{"\n\n"}
                  For complete details, please visit our website or contact our support team.
                </Text>
              </ScrollView>
            </View>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setAgreedDisclosures(!agreedDisclosures);
              }}
            >
              <View style={[styles.checkbox, agreedDisclosures && styles.checkboxActive]}>
                {agreedDisclosures && <Ionicons name="checkmark" size={14} color={Colors.light.white} />}
              </View>
              <Text style={styles.checkboxLabel}>I agree to the HSA Custodial Agreement, Electronic Consent, and Privacy Policy</Text>
            </Pressable>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.centeredStep}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.processingText}>Verifying your information...</Text>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.centeredStep}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
            <Text style={styles.successTitle}>Your HSA is ready!</Text>
            <Text style={styles.successSubtitle}>Your Saga Health Savings Account has been approved.</Text>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Connect Your Bank</Text>
            <Text style={styles.stepSubtitle}>Link a bank account to fund your HSA</Text>
            <TextInput
              style={styles.searchInput}
              value={bankSearch}
              onChangeText={setBankSearch}
              placeholder="Search banks..."
              placeholderTextColor={Colors.light.textMuted}
            />
            <View style={styles.bankList}>
              {filteredBanks.map((bank) => (
                <Pressable
                  key={bank.id}
                  style={styles.bankCard}
                  onPress={() => handleBankSelect(bank.id)}
                  disabled={connectingBank !== null}
                >
                  <View style={styles.bankIconWrap}>
                    <Ionicons name="business" size={24} color={Colors.light.tint} />
                  </View>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  {connectingBank === bank.id ? (
                    <ActivityIndicator size="small" color={Colors.light.tint} />
                  ) : (
                    <Feather name="chevron-right" size={20} color={Colors.light.textMuted} />
                  )}
                </Pressable>
              ))}
            </View>
            {connectingBank && (
              <Text style={styles.connectingText}>Connecting...</Text>
            )}
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Set Your Contribution</Text>
            <Text style={styles.stepSubtitle}>How much would you like to contribute?</Text>
            <Text style={styles.amountDisplay}>${contributionAmount.toLocaleString()}</Text>
            <View style={styles.presetRow}>
              {presetAmounts.map((amt) => (
                <Pressable
                  key={amt}
                  style={[styles.presetBtn, contributionAmount === amt && styles.presetBtnActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setContributionAmount(amt);
                  }}
                >
                  <Text style={[styles.presetBtnText, contributionAmount === amt && styles.presetBtnTextActive]}>
                    ${amt >= 1000 ? `${(amt / 1000).toFixed(0)},000` : amt}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.freqRow}>
              {frequencies.map((f) => (
                <Pressable
                  key={f}
                  style={[styles.freqPill, frequency === f && styles.freqPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setFrequency(f);
                  }}
                >
                  <Text style={[styles.freqPillText, frequency === f && styles.freqPillTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.limitInfo}>
              <Text style={styles.limitLabel}>Annual Limit</Text>
              <Text style={styles.limitValue}>${annualLimit.toLocaleString()}</Text>
            </View>
            {catchUp > 0 && (
              <Text style={styles.catchUpText}>Includes {catchUp > 1000 ? "$2,000" : "$1,000"} catch-up contribution</Text>
            )}
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.centeredStep}>
            {fundsAvailable ? (
              <>
                <Ionicons name="checkmark-circle" size={64} color={Colors.light.success} />
                <Text style={styles.successTitle}>Funds Available</Text>
              </>
            ) : (
              <>
                <Ionicons name="time" size={64} color={Colors.light.accent} />
                <Text style={styles.successTitle}>Funds Pending</Text>
              </>
            )}
            <Text style={styles.successSubtitle}>${contributionAmount.toLocaleString()}</Text>
          </Animated.View>
        );

      case 8:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Investment Profile</Text>
            <Text style={styles.stepSubtitle}>Help us understand your risk tolerance</Text>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>What is your annual household income?</Text>
              <View style={styles.optionsWrap}>
                {["Under $50K", "$50K-$100K", "$100K-$200K", "Over $200K"].map((opt, i) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionPill, q1 === i && styles.optionPillActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setQ1(i);
                    }}
                  >
                    <Text style={[styles.optionPillText, q1 === i && styles.optionPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>What is your investing experience?</Text>
              <View style={styles.optionsWrap}>
                {["Beginner", "Average", "Expert"].map((opt, i) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionPill, q2 === i && styles.optionPillActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setQ2(i);
                    }}
                  >
                    <Text style={[styles.optionPillText, q2 === i && styles.optionPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>What are your investment goals?</Text>
              <View style={styles.optionsWrap}>
                {["Grow my savings as much as possible", "Grow my savings without too much risk", "Something in between"].map((opt, i) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionPill, q3 === i && styles.optionPillActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setQ3(i);
                    }}
                  >
                    <Text style={[styles.optionPillText, q3 === i && styles.optionPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>What is your current annual medical spending?</Text>
              <View style={styles.optionsWrap}>
                {["Low (Under $1,500)", "Medium ($1,500-$4,000)", "High (Over $4,000)"].map((opt, i) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionPill, q4 === i && styles.optionPillActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setQ4(i);
                    }}
                  >
                    <Text style={[styles.optionPillText, q4 === i && styles.optionPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>If your HSA investment dropped 20% during a market downturn, what would you most likely do?</Text>
              <View style={styles.optionsWrap}>
                {["Sell everything", "Wait it out", "Buy more"].map((opt, i) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionPill, q5 === i && styles.optionPillActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setQ5(i);
                    }}
                  >
                    <Text style={[styles.optionPillText, q5 === i && styles.optionPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 9:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Recommended Portfolio</Text>
            <Text style={styles.stepSubtitle}>Based on your risk profile, we recommend:</Text>
            <View style={styles.portfolioSection}>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderLine} />
                <View style={styles.sliderDots}>
                  {portfolios.map((p, i) => {
                    const active = portfolioIndex === i;
                    const dotSize = getDotSize(i, active);
                    return (
                      <Pressable
                        key={i}
                        style={styles.sliderDotWrap}
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                          setPortfolioIndex(i);
                        }}
                      >
                        <View
                          style={[
                            {
                              width: dotSize.width,
                              height: dotSize.height,
                              borderRadius: dotSize.borderRadius,
                              backgroundColor: active ? Colors.light.tint : Colors.light.border,
                              borderWidth: active ? 3 : 2,
                              borderColor: active ? Colors.light.tintLight : Colors.light.card,
                            },
                          ]}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Conservative</Text>
                <Text style={styles.sliderLabelText}>Aggressive</Text>
              </View>
              <Text style={styles.portfolioLabel}>{portfolios[portfolioIndex].label}</Text>
              <Text style={styles.portfolioBreakdown}>
                {portfolios[portfolioIndex].stocks}% Stocks, {portfolios[portfolioIndex].bonds}% Bonds, {portfolios[portfolioIndex].cash}% Cash
              </Text>
            </View>
          </Animated.View>
        );

      case 10:
        if (investmentConfirmed) {
          return (
            <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.centeredStep}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
              <Text style={styles.successTitle}>Investment in Progress</Text>
              <Text style={styles.successSubtitle}>Your portfolio is being set up with the {portfolios[portfolioIndex].label} strategy.</Text>
            </Animated.View>
          );
        }
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Set Up Auto-Invest</Text>
            <Text style={styles.stepSubtitle}>Configure your investment preferences</Text>
            <View style={styles.toggleCard}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Auto-Invest</Text>
                <Text style={styles.toggleDesc}>Automatically invest new contributions</Text>
              </View>
              <Switch
                value={autoInvest}
                onValueChange={(v) => setAutoInvest(v)}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor={Colors.light.white}
              />
            </View>
            <View style={styles.investPercentSection}>
              <Text style={styles.toggleLabel}>Contribution Investment Percentage</Text>
              <Text style={styles.investPercentSubtitle}>What percentage of your contributions should be invested?</Text>
              <View style={styles.investPercentWrap}>
                {[25, 50, 75, 100].map((pct) => (
                  <Pressable
                    key={pct}
                    style={[styles.investPercentPill, investPercent === pct && styles.presetBtnActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setInvestPercent(pct);
                    }}
                  >
                    <Text style={[styles.presetBtnText, investPercent === pct && styles.presetBtnTextActive]}>
                      {pct}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAwareScrollViewCompat
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + bottomPad + 24 }]}
        bottomOffset={80}
      >
        {renderStep()}

        {showButton && (
          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                { opacity: pressed && canContinue() ? 0.9 : 1, transform: [{ scale: pressed && canContinue() ? 0.98 : 1 }] },
              ]}
              onPress={goNext}
              disabled={!canContinue()}
            >
              <LinearGradient
                colors={canContinue() ? [Colors.light.tint, Colors.light.tintDark] : [Colors.light.border, Colors.light.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={[styles.nextBtnText, !canContinue() && { color: Colors.light.textMuted }]}>{getButtonText()}</Text>
                <Feather name="arrow-right" size={18} color={canContinue() ? Colors.light.white : Colors.light.textMuted} />
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stepContent: {
    width: "100%",
  },
  centeredStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  stepTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 16,
  },
  stepSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  nameRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.light.text,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  planCards: {
    flexDirection: "row",
    gap: 16,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  planLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  planLabelActive: {
    color: Colors.light.tint,
  },
  planLimit: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  disclosureBox: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    height: 260,
    marginBottom: 20,
  },
  disclosureScroll: {
    padding: 16,
  },
  disclosureText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  processingText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 18,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  successTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    textAlign: "center",
  },
  successSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  searchInput: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
  },
  bankList: {
    gap: 10,
  },
  bankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  bankIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bankName: {
    flex: 1,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  connectingText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.tint,
    textAlign: "center",
    marginTop: 16,
  },
  amountDisplay: {
    fontFamily: "DMSans_700Bold",
    fontSize: 48,
    color: Colors.light.tint,
    textAlign: "center",
    marginBottom: 24,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 24,
  },
  presetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetBtnActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  presetBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  presetBtnTextActive: {
    color: Colors.light.tint,
  },
  freqRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 24,
  },
  freqPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  freqPillActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  freqPillText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  freqPillTextActive: {
    color: Colors.light.white,
  },
  limitInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  limitLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  limitValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  catchUpText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.tint,
    textAlign: "center",
    marginTop: 10,
  },
  planCatchUp: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: Colors.light.info,
    marginTop: 2,
  },
  catchUpBanner: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
    backgroundColor: Colors.light.infoLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  catchUpBannerText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.info,
    lineHeight: 18,
  },
  spouseRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginTop: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  spouseLabel: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  questionSection: {
    marginBottom: 28,
  },
  questionLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 14,
    lineHeight: 22,
  },
  optionsWrap: {
    gap: 10,
  },
  optionPill: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionPillActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  optionPillText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.text,
  },
  optionPillTextActive: {
    color: Colors.light.tint,
  },
  portfolioSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  portfolioTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: "center",
  },
  sliderContainer: {
    height: 48,
    justifyContent: "center",
    marginBottom: 8,
  },
  sliderLine: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },
  sliderDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  sliderDotWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  portfolioLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 18,
    color: Colors.light.tint,
    textAlign: "center",
    marginBottom: 6,
  },
  portfolioBreakdown: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
  },
  toggleDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  investPercentSection: {
    marginTop: 10,
  },
  investPercentSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  investPercentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  investPercentPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: "transparent",
  },
  bottomBar: {
    paddingTop: 24,
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
