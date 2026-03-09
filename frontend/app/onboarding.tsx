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
  ToastAndroid,
  // AlertIOS,
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
import { API_BASE_URL } from "../shared/constants";

const TOTAL_STEPS = 12;

const EMPLOYMENT_OPTIONS = ["Employed", "Retired", "Student", "Unemployed", "Self-employed"] as const;

const banks = [
  { id: "chase", name: "Chase" },
  { id: "boa", name: "Bank of America" },
  { id: "wells", name: "Wells Fargo" },
  { id: "citi", name: "Citi" },
  { id: "capital", name: "Capital One" },
  { id: "usbank", name: "US Bank" },
];

const presetAmounts = [25, 50, 100, 200];

const frequencies = ["One-time", "Weekly", "Monthly"];

const portfolios = [
  { label: "Conservative", stocks: 20, bonds: 60, cash: 20 },
  { label: "Moderately Conservative", stocks: 40, bonds: 45, cash: 15 },
  { label: "Moderate", stocks: 60, bonds: 30, cash: 10 },
  { label: "Moderately Aggressive", stocks: 75, bonds: 20, cash: 5 },
  { label: "Aggressive", stocks: 90, bonds: 8, cash: 2 },
];

const AVAILABLE_TICKERS = [
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", type: "etf" },
  { ticker: "VTI", name: "Vanguard Total Stock Market", type: "etf" },
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", type: "etf" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", type: "etf" },
  { ticker: "SCHD", name: "Schwab US Dividend Equity", type: "etf" },
  { ticker: "VXUS", name: "Vanguard Total International", type: "etf" },
  { ticker: "BND", name: "Vanguard Total Bond Market", type: "etf" },
  { ticker: "AAPL", name: "Apple Inc.", type: "stock" },
  { ticker: "MSFT", name: "Microsoft Corporation", type: "stock" },
  { ticker: "GOOGL", name: "Alphabet Inc. (Google)", type: "stock" },
  { ticker: "AMZN", name: "Amazon.com Inc.", type: "stock" },
  { ticker: "NVDA", name: "NVIDIA Corporation", type: "stock" },
  { ticker: "META", name: "Meta Platforms Inc.", type: "stock" },
  { ticker: "TSLA", name: "Tesla Inc.", type: "stock" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", type: "stock" },
  { ticker: "JNJ", name: "Johnson & Johnson", type: "stock" },
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
  const scrollViewRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

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

  const [contributionAmount, setContributionAmount] = useState(0);
  const [customAmountMode, setCustomAmountMode] = useState(false);
  const [customAmountText, setCustomAmountText] = useState("");
  const [frequency, setFrequency] = useState("One-time");

  const [fundsAvailable, setFundsAvailable] = useState(false);

  const [irsWithholdingBackup, setIrsWithholdingBackup] = useState<boolean | null>(null);
  const [employmentStatus, setEmploymentStatus] = useState<string | null>(null);
  const [directorOfPublicCompany, setDirectorOfPublicCompany] = useState<boolean | null>(null);
  const [directorStockTicker, setDirectorStockTicker] = useState("");
  const [politicallyExposed, setPoliticallyExposed] = useState<boolean | null>(null);
  const [pepFullName, setPepFullName] = useState("");
  const [brokerDealerAffiliate, setBrokerDealerAffiliate] = useState<boolean | null>(null);
  const [investmentConsentAgreed, setInvestmentConsentAgreed] = useState(false);

  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState<number | null>(null);
  const [q5, setQ5] = useState<number | null>(null);

  const [portfolioIndex, setPortfolioIndex] = useState(2);
  const [useCustomTickers, setUseCustomTickers] = useState(false);
  const [customTickerSelections, setCustomTickerSelections] = useState<{ ticker: string; name: string; allocation: number }[]>([]);
  const [tickerSearch, setTickerSearch] = useState("");

  const [autoInvest, setAutoInvest] = useState(true);
  const [investPercent, setInvestPercent] = useState(100);
  const [investPercentCustomMode, setInvestPercentCustomMode] = useState(false);
  const [investPercentCustomText, setInvestPercentCustomText] = useState("");
  const [investmentConfirmed, setInvestmentConfirmed] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => setStep(4), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (step === 9) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [step]);


  const goNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 11) {
      if (!investmentConfirmed) {
        setInvestmentConfirmed(true);
        return;
      }
      completeOnboarding(
        firstName.trim(),
        useCustomTickers && customTickerTotal === 100 ? undefined : portfolioIndex,
        useCustomTickers && customTickerTotal === 100 ? customTickerSelections : undefined
      );
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

  const handleSkip = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding(firstName.trim() || undefined);
    router.replace("/(tabs)");
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
        return (
          firstName.trim().length > 0 &&
          lastName.trim().length > 0 &&
          phone.trim().length >= 14 &&
          password.length >= 8
        );
      case 1:
        return (
          dob.trim().length >= 10 &&
          ssn.trim().length >= 11 &&
          email.trim().length > 0 &&
          street.trim().length > 0 &&
          city.trim().length > 0 &&
          state.trim().length === 2 &&
          zip.trim().length >= 5
        );
      case 2:
        return planType !== null && agreedDisclosures;
      case 4:
        return true;
      case 6:
        return contributionAmount > 0;
      case 7:
        return true;
      case 8: {
        const baseValid =
          irsWithholdingBackup !== null &&
          employmentStatus !== null &&
          directorOfPublicCompany !== null &&
          politicallyExposed !== null &&
          brokerDealerAffiliate !== null &&
          investmentConsentAgreed;
        const directorValid = directorOfPublicCompany !== true || directorStockTicker.trim().length > 0;
        const pepValid = politicallyExposed !== true || pepFullName.trim().length > 0;
        return baseValid && directorValid && pepValid;
      }
      case 9:
        return q1 !== null && q2 !== null && q3 !== null && q4 !== null && q5 !== null;
      case 10:
        if (useCustomTickers) {
          return customTickerSelections.length > 0 && customTickerTotal === 100;
        }
        return true;
      case 11:
        return true;
      default:
        return false;
    }
  };

  const getButtonText = (): string => {
    if (step === 4) return "Add Funds";
    if (step === 7) return "Start Investing";
    if (step === 11) {
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

  const customTickerTotal = customTickerSelections.reduce((sum, s) => sum + s.allocation, 0);

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
        // Connectivity test - uncomment to verify API connection during onboarding development
        // console.log(`API_BASE_URL: ${API_BASE_URL}`);
        // fetch(`${API_BASE_URL}/`).then(res => res.json()).then(data => {
        //   console.log("API Response:", data);
        //   if (Platform.OS === "android") {
        //     ToastAndroid.show("API Connected Successfully!", ToastAndroid.SHORT);
        //   } else if (Platform.OS === "ios") {
        //     // AlertIOS.alert("API Connected Successfully!");
        //   } else {
        //     alert("API Connected Successfully!");
        //   }
        // }).catch(err => console.error("API Error:", err));
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
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.input} value={phone} onChangeText={(t) => setPhone(formatPhone(t))} placeholder="(555) 555-5555" placeholderTextColor={Colors.light.textMuted} keyboardType="phone-pad" maxLength={14} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Create a password (min 8 characters)" placeholderTextColor={Colors.light.textMuted} secureTextEntry autoCapitalize="none" autoComplete="off" />
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Contact & Address</Text>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput style={styles.input} value={dob} onChangeText={(t) => setDob(formatDob(t))} placeholder="MM/DD/YYYY" placeholderTextColor={Colors.light.textMuted} keyboardType="number-pad" maxLength={10} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Social Security Number</Text>
              <TextInput style={styles.input} value={ssn} onChangeText={(t) => setSsn(formatSsn(t))} placeholder="XXX-XX-XXXX" placeholderTextColor={Colors.light.textMuted} secureTextEntry maxLength={11} keyboardType="number-pad" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={(t) => setEmail(t)} placeholder="you@email.com" placeholderTextColor={Colors.light.textMuted} keyboardType="email-address" autoCapitalize="none" autoComplete="off" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Street Name</Text>
              <TextInput
                style={styles.input}
                value={street}
                onChangeText={setStreet}
                keyboardType="default"
              />


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
          </View>
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
            <Text style={styles.successTitle}>We're setting up your account.</Text>
            <Text style={styles.successSubtitle}>Let's first connect your bank account.</Text>
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
            {customAmountMode ? (
              <View style={styles.customAmountWrap}>
                <View style={styles.customAmountInputRow}>
                  <Text style={styles.customDollarSign}>$</Text>
                  <TextInput
                    style={styles.customAmountInput}
                    value={customAmountText}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, "");
                      const parts = cleaned.split(".");
                      const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
                      setCustomAmountText(formatted);
                      const val = parseFloat(formatted);
                      if (!isNaN(val) && val >= 0.01 && val <= annualLimit) {
                        setContributionAmount(val);
                      } else if (formatted === "" || val === 0) {
                        setContributionAmount(0);
                      }
                    }}
                    placeholder="0.00"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="decimal-pad"
                    autoFocus
                    testID="custom-amount-input"
                  />
                </View>
                <Text style={styles.customAmountHint}>
                  Enter $0.01 to ${annualLimit.toLocaleString()}
                </Text>
                <Pressable
                  style={styles.customBackLink}
                  onPress={() => {
                    setCustomAmountMode(false);
                    setCustomAmountText("");
                    setContributionAmount(0);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                >
                  <Feather name="arrow-left" size={14} color={Colors.light.tint} />
                  <Text style={styles.customBackLinkText}>Back to presets</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.amountDisplay}>
                  {contributionAmount > 0 ? `$${contributionAmount.toLocaleString()}` : "Select amount"}
                </Text>
                <View style={styles.presetRow}>
                  {presetAmounts.map((amt) => (
                    <Pressable
                      key={amt}
                      style={[styles.presetBtn, contributionAmount === amt && !customAmountMode && styles.presetBtnActive]}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        setContributionAmount(amt);
                      }}
                    >
                      <Text style={[styles.presetBtnText, contributionAmount === amt && !customAmountMode && styles.presetBtnTextActive]}>
                        ${amt}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.presetBtn, styles.customBtn]}
                    onPress={() => {
                      setCustomAmountMode(true);
                      setContributionAmount(0);
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                  >
                    <Feather name="edit-2" size={14} color={Colors.light.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.presetBtnText}>Custom</Text>
                  </Pressable>
                </View>
              </>
            )}
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
            <Pressable
              style={styles.skipContributionBtn}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setContributionAmount(0);
                setStep(step + 1);
              }}
              testID="skip-contribution-btn"
            >
              <Text style={styles.skipContributionText}>Skip for now</Text>
              <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />
            </Pressable>
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.centeredStep}>
            <Ionicons name="time" size={64} color={Colors.light.accent} />
            <Text style={styles.successTitle}>
              {contributionAmount > 0 ? "Your funds are pending" : "Let's set up your investments"}
            </Text>
            <Text style={styles.successSubtitle}>
              Now let's set up your HSA investments so you maximize triple tax advantage growth.
            </Text>
            {contributionAmount > 0 && (
              <Text style={styles.successSubtitle}>${contributionAmount.toLocaleString()} contribution</Text>
            )}
          </Animated.View>
        );

      case 8:
        return (
          <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Investment Compliance</Text>
            <Text style={styles.stepSubtitle}>A few questions before we set up your investment profile</Text>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Are you subject to IRS backup withholding?</Text>
              <View style={styles.optionsWrap}>
                <Pressable
                  style={[styles.optionPill, irsWithholdingBackup === false && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setIrsWithholdingBackup(false);
                  }}
                >
                  <Text style={[styles.optionPillText, irsWithholdingBackup === false && styles.optionPillTextActive]}>No</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionPill, irsWithholdingBackup === true && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setIrsWithholdingBackup(true);
                  }}
                >
                  <Text style={[styles.optionPillText, irsWithholdingBackup === true && styles.optionPillTextActive]}>Yes</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Employment status</Text>
              <View style={styles.optionsWrap}>
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionPill, employmentStatus === opt && styles.optionPillActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setEmploymentStatus(opt);
                    }}
                  >
                    <Text style={[styles.optionPillText, employmentStatus === opt && styles.optionPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Are you a Director, Officer, or 10% stock owner of a publicly traded company?</Text>
              <Text style={styles.questionHint}>Indicates whether the member is a Director, Officer, or 10% stock owner of a publicly traded company.</Text>
              <View style={styles.optionsWrap}>
                <Pressable
                  style={[styles.optionPill, directorOfPublicCompany === false && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setDirectorOfPublicCompany(false);
                    setDirectorStockTicker("");
                  }}
                >
                  <Text style={[styles.optionPillText, directorOfPublicCompany === false && styles.optionPillTextActive]}>No</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionPill, directorOfPublicCompany === true && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setDirectorOfPublicCompany(true);
                  }}
                >
                  <Text style={[styles.optionPillText, directorOfPublicCompany === true && styles.optionPillTextActive]}>Yes</Text>
                </Pressable>
              </View>
              {directorOfPublicCompany === true && (
                <View style={[styles.formGroup, { marginTop: 12 }]}>
                  <Text style={styles.inputLabel}>Stock ticker of the company</Text>
                  <TextInput
                    style={styles.input}
                    value={directorStockTicker}
                    onChangeText={(t) => setDirectorStockTicker(t.toUpperCase())}
                    placeholder="e.g. AAPL, MSFT"
                    placeholderTextColor={Colors.light.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              )}
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Are you a politically exposed person or public official?</Text>
              <Text style={styles.questionHint}>Indicates whether the member is a current or former politically exposed person or public official (includes US and Foreign). A politically exposed person is someone who has been entrusted with a prominent public function, or who is closely related to such a person.</Text>
              <View style={styles.optionsWrap}>
                <Pressable
                  style={[styles.optionPill, politicallyExposed === false && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setPoliticallyExposed(false);
                    setPepFullName("");
                  }}
                >
                  <Text style={[styles.optionPillText, politicallyExposed === false && styles.optionPillTextActive]}>No</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionPill, politicallyExposed === true && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setPoliticallyExposed(true);
                  }}
                >
                  <Text style={[styles.optionPillText, politicallyExposed === true && styles.optionPillTextActive]}>Yes</Text>
                </Pressable>
              </View>
              {politicallyExposed === true && (
                <View style={[styles.formGroup, { marginTop: 12 }]}>
                  <Text style={styles.inputLabel}>Full name of the politically exposed person</Text>
                  <TextInput
                    style={styles.input}
                    value={pepFullName}
                    onChangeText={setPepFullName}
                    placeholder="Enter full name"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
              )}
            </View>
            <View style={styles.questionSection}>
              <Text style={styles.questionLabel}>Is your current employer a broker/dealer?</Text>
              <Text style={styles.questionHint}>Indicates whether the member's current employer is a broker/dealer.</Text>
              <View style={styles.optionsWrap}>
                <Pressable
                  style={[styles.optionPill, brokerDealerAffiliate === false && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setBrokerDealerAffiliate(false);
                  }}
                >
                  <Text style={[styles.optionPillText, brokerDealerAffiliate === false && styles.optionPillTextActive]}>No</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionPill, brokerDealerAffiliate === true && styles.optionPillActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setBrokerDealerAffiliate(true);
                  }}
                >
                  <Text style={[styles.optionPillText, brokerDealerAffiliate === true && styles.optionPillTextActive]}>Yes</Text>
                </Pressable>
              </View>
            </View>
            <View style={[styles.disclosureBox, { height: 180, marginTop: 8, marginBottom: 20 }]}>
              <ScrollView style={styles.disclosureScroll} nestedScrollEnabled>
                <Text style={styles.disclosureText}>
                  INVESTMENTS CONSENT DISCLOSURE{"\n\n"}
                  By proceeding with investment services, you acknowledge that investing through your HSA involves risk, including the possible loss of principal. Past performance is not indicative of future results. Saga Health provides investment options for informational purposes only and does not provide investment, tax, or legal advice.{"\n\n"}
                  You understand that you are solely responsible for your investment decisions and that you should consult with qualified professionals regarding your specific financial situation. By checking the box below, you confirm that you have read, understood, and agree to the terms of this Investments Consent Disclosure.
                </Text>
              </ScrollView>
            </View>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setInvestmentConsentAgreed(!investmentConsentAgreed);
              }}
            >
              <View style={[styles.checkbox, investmentConsentAgreed && styles.checkboxActive]}>
                {investmentConsentAgreed && <Ionicons name="checkmark" size={14} color={Colors.light.white} />}
              </View>
              <Text style={styles.checkboxLabel}>I agree to the Investments Consent Disclosure</Text>
            </Pressable>
          </Animated.View>
        );

      case 9:
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

      case 10:
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

            <View style={styles.customTickerSection}>
              <Pressable
                style={[styles.customTickerToggle, useCustomTickers && styles.customTickerToggleActive]}
                onPress={() => {
                  setUseCustomTickers(!useCustomTickers);
                  if (!useCustomTickers) setCustomTickerSelections([]);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
              >
                <Feather name="layers" size={18} color={useCustomTickers ? Colors.light.white : Colors.light.tint} />
                <Text style={[styles.customTickerToggleText, useCustomTickers && styles.customTickerToggleTextActive]}>
                  Or choose individual tickers
                </Text>
              </Pressable>

              {useCustomTickers && (
                <>
                  <TextInput
                    style={styles.tickerSearchInput}
                    value={tickerSearch}
                    onChangeText={setTickerSearch}
                    placeholder="Search tickers (e.g. VOO, AAPL)"
                    placeholderTextColor={Colors.light.textMuted}
                    autoCapitalize="characters"
                  />
                  <ScrollView style={styles.tickerListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {AVAILABLE_TICKERS.filter(
                      (t) =>
                        t.ticker.toLowerCase().includes(tickerSearch.toLowerCase()) ||
                        t.name.toLowerCase().includes(tickerSearch.toLowerCase())
                    ).map((t) => {
                      const selected = customTickerSelections.find((s) => s.ticker === t.ticker);
                      return (
                        <Pressable
                          key={t.ticker}
                          style={[styles.tickerListItem, selected && styles.tickerListItemSelected]}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                            if (selected) {
                              setCustomTickerSelections((prev) => prev.filter((p) => p.ticker !== t.ticker));
                            } else {
                              setCustomTickerSelections((prev) => [...prev, { ticker: t.ticker, name: t.name, allocation: 0 }]);
                            }
                          }}
                        >
                          <View style={styles.tickerListLeft}>
                            <Text style={styles.tickerListTicker}>{t.ticker}</Text>
                            <View style={[styles.tickerTypeBadge, { backgroundColor: t.type === "etf" ? Colors.light.tintLight : Colors.light.accent + "30" }]}>
                              <Text style={[styles.tickerTypeText, { color: t.type === "etf" ? Colors.light.tint : Colors.light.accent }]}>{t.type.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.tickerListName} numberOfLines={1}>{t.name}</Text>
                          </View>
                          {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.light.tint} />}
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {customTickerSelections.length > 0 && (
                    <View style={styles.selectedTickersSection}>
                      <Text style={styles.selectedTickersTitle}>Your allocation (must total 100%)</Text>
                      {customTickerSelections.map((s, i) => (
                        <View key={s.ticker} style={styles.selectedTickerRow}>
                          <Text style={styles.selectedTickerLabel}>{s.ticker}</Text>
                          <View style={styles.allocationInputRow}>
                            <TextInput
                              style={styles.allocationInput}
                              value={s.allocation ? String(s.allocation) : ""}
                              onChangeText={(txt) => {
                                const num = parseInt(txt.replace(/\D/g, ""), 10) || 0;
                                setCustomTickerSelections((prev) =>
                                  prev.map((p, idx) => (idx === i ? { ...p, allocation: Math.min(100, num) } : p))
                                );
                              }}
                              placeholder="0"
                              placeholderTextColor={Colors.light.textMuted}
                              keyboardType="number-pad"
                              maxLength={3}
                            />
                            <Text style={styles.allocationPercent}>%</Text>
                          </View>
                          <Pressable
                            onPress={() => setCustomTickerSelections((prev) => prev.filter((p) => p.ticker !== s.ticker))}
                            hitSlop={8}
                          >
                            <Ionicons name="close-circle" size={22} color={Colors.light.textMuted} />
                          </Pressable>
                        </View>
                      ))}
                      <View style={styles.allocationTotalRow}>
                        <Text style={styles.allocationTotalLabel}>Total</Text>
                        <Text style={[styles.allocationTotalValue, (customTickerTotal === 100 ? styles.allocationTotalValid : styles.allocationTotalInvalid)]}>
                          {customTickerTotal}%
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        );

      case 11:
        if (investmentConfirmed) {
          return (
            <Animated.View entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined} style={styles.centeredStep}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
              <Text style={styles.successTitle}>Investment in Progress</Text>
              <Text style={styles.successSubtitle}>
                Your portfolio is being set up{useCustomTickers ? ` with your selected holdings` : ` with the ${portfolios[portfolioIndex].label} strategy`}.
              </Text>
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
            {autoInvest ? (
            <View style={styles.investPercentSection}>
              <Text style={styles.toggleLabel}>Contribution Investment Percentage</Text>
              <Text style={styles.investPercentSubtitle}>What percentage of your contributions should be invested?</Text>
              {investPercentCustomMode ? (
                <View style={styles.customInvestPercentWrap}>
                  <View style={styles.customAmountInputRow}>
                    <TextInput
                      style={styles.customInvestPercentInput}
                      value={investPercentCustomText}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, "").slice(0, 3);
                        setInvestPercentCustomText(cleaned);
                        const val = parseInt(cleaned, 10);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          setInvestPercent(val);
                        } else if (cleaned === "") {
                          setInvestPercent(0);
                        }
                      }}
                      placeholder="0"
                      placeholderTextColor={Colors.light.textMuted}
                      keyboardType="number-pad"
                      maxLength={3}
                      autoFocus
                    />
                    <Text style={styles.customInvestPercentSuffix}>%</Text>
                  </View>
                  <Text style={styles.customAmountHint}>Enter 0-100</Text>
                  <Pressable
                    style={styles.customBackLink}
                    onPress={() => {
                      setInvestPercentCustomMode(false);
                      setInvestPercentCustomText("");
                      setInvestPercent(100);
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                  >
                    <Feather name="arrow-left" size={14} color={Colors.light.tint} />
                    <Text style={styles.customBackLinkText}>Back to presets</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.investPercentWrap}>
                  {[25, 50, 75, 100].map((pct) => (
                    <Pressable
                      key={pct}
                      style={[styles.investPercentPill, !investPercentCustomMode && investPercent === pct && styles.presetBtnActive]}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        setInvestPercent(pct);
                        setInvestPercentCustomMode(false);
                        setInvestPercentCustomText("");
                      }}
                    >
                      <Text style={[styles.presetBtnText, !investPercentCustomMode && investPercent === pct && styles.presetBtnTextActive]}>
                        {pct}%
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.investPercentPill, styles.customBtn]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setInvestPercentCustomMode(true);
                      setInvestPercentCustomText(investPercent > 0 && investPercent <= 100 && ![25, 50, 75, 100].includes(investPercent) ? String(investPercent) : "");
                    }}
                  >
                    <Feather name="edit-2" size={14} color={Colors.light.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.presetBtnText}>Custom</Text>
                  </Pressable>
                </View>
              )}
            </View>
            ) : null}
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
        {step > 0 ? (
          <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={8}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      <KeyboardAwareScrollViewCompat
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
  skipBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  skipBtnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.tint,
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
  customBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  customAmountWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  customAmountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 8,
  },
  customDollarSign: {
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    color: Colors.light.tint,
    marginRight: 4,
  },
  customAmountInput: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    color: Colors.light.tint,
    paddingVertical: 10,
    textAlign: "left" as const,
  },
  customAmountHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 12,
  },
  customBackLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    marginBottom: 8,
  },
  customBackLinkText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.tint,
  },
  skipContributionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
    marginTop: 8,
  },
  skipContributionText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
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
  questionHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: -6,
    marginBottom: 14,
    lineHeight: 18,
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
  customTickerSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  customTickerToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  customTickerToggleActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  customTickerToggleText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.tint,
  },
  customTickerToggleTextActive: {
    color: Colors.light.white,
  },
  tickerSearchInput: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    marginTop: 16,
  },
  tickerListScroll: {
    maxHeight: 200,
    marginTop: 12,
  },
  tickerListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  tickerListItemSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  tickerListLeft: {
    flex: 1,
  },
  tickerListTicker: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  tickerTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  tickerTypeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
  },
  tickerListName: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  selectedTickersSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  selectedTickersTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
  },
  selectedTickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  selectedTickerLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    width: 48,
  },
  allocationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
  },
  allocationInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  allocationPercent: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: Colors.light.textMuted,
  },
  allocationTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  allocationTotalLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  allocationTotalValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
  },
  allocationTotalValid: {
    color: Colors.light.success,
  },
  allocationTotalInvalid: {
    color: Colors.light.danger,
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
  customInvestPercentWrap: {
    marginTop: 8,
  },
  customInvestPercentRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  customInvestPercentInput: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: Colors.light.tint,
    paddingVertical: 4,
    textAlign: "left" as const,
  },
  customInvestPercentSuffix: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: Colors.light.tint,
    marginLeft: 4,
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
