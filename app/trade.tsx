import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useHSA, InvestmentHolding, PORTFOLIO_PRESETS } from "@/contexts/HSAContext";

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

type TradeMode = "buy" | "sell" | "mix";

export default function TradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    holdings,
    cashBalance,
    investedBalance,
    portfolioIndex,
    buyProportional,
    sellProportional,
    buyHolding,
    buyNewTicker,
    sellHolding,
    applyPortfolioPreset,
  } = useHSA();

  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(portfolioIndex);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [selectedNewTicker, setSelectedNewTicker] = useState<{ ticker: string; name: string } | null>(null);
  const [tickerSearch, setTickerSearch] = useState("");
  const amountInputRef = useRef<TextInput>(null);

  const hasCustomHoldings = !holdings.some((h) => h.id === "1" || h.id === "2" || h.id === "3");
  const selectedHolding =
    selectedHoldingId && selectedHoldingId !== "__proportional__" && selectedHoldingId !== "__new__"
      ? holdings.find((h) => h.id === selectedHoldingId)
      : null;
  const selectedTickerDisplay = selectedHolding
    ? selectedHolding.ticker
    : selectedNewTicker
      ? selectedNewTicker.ticker
      : null;
  const isProportionalSelection = selectedHoldingId === "__proportional__";
  const amount = parseFloat(amountText) || 0;
  const maxAmount =
    tradeMode === "buy"
      ? cashBalance
      : isProportionalSelection
        ? investedBalance
        : selectedHolding
          ? selectedHolding.balance
          : investedBalance;
  const mixHasChange = hasCustomHoldings ? true : selectedPresetIndex !== portfolioIndex;
  const showTickerSelection = tradeMode !== "mix";
  const isValid =
    tradeMode === "mix"
      ? mixHasChange
      : isProportionalSelection
        ? amount > 0 && amount <= maxAmount
        : showTickerSelection
          ? (selectedHoldingId !== null || selectedNewTicker !== null) && amount > 0 && amount <= maxAmount
          : amount > 0 && amount <= maxAmount;

  const resetAndGoBack = () => {
    router.back();
  };

  const handleConfirm = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (tradeMode === "mix") {
      applyPortfolioPreset(selectedPresetIndex);
      setStep("success");
    } else if (isProportionalSelection) {
      const success = tradeMode === "buy" ? buyProportional(amount) : sellProportional(amount);
      if (success) setStep("success");
      else Alert.alert("Trade Failed", "Unable to complete the trade. Please check your balance and try again.");
    } else if (selectedNewTicker && tradeMode === "buy") {
      const success = buyNewTicker(selectedNewTicker.ticker, selectedNewTicker.name, amount);
      if (success) setStep("success");
      else Alert.alert("Trade Failed", "Unable to complete the trade. Please check your balance and try again.");
    } else if (selectedHoldingId) {
      const success = tradeMode === "buy" ? buyHolding(selectedHoldingId, amount) : sellHolding(selectedHoldingId, amount);
      if (success) setStep("success");
      else Alert.alert("Trade Failed", "Unable to complete the trade. Please check your balance and try again.");
    }
  };

  useEffect(() => {
    if (tradeMode !== "mix" && !hasCustomHoldings && !selectedHoldingId && !selectedNewTicker) {
      setSelectedHoldingId("__proportional__");
    }
  }, [tradeMode, hasCustomHoldings]);

  const handleQuickAmount = (pct: number) => {
    const val = Math.floor(maxAmount * pct * 100) / 100;
    setAmountText(val.toFixed(2));
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (step === "success") resetAndGoBack();
            else if (step === "confirm") setStep("form");
            else router.back();
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Feather name="arrow-left" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Trade</Text>
        <View style={styles.headerSpacer} />
      </View>

      {step === "success" ? (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color={Colors.light.white} />
          </View>
          <Text style={styles.successTitle}>
            {tradeMode === "mix" ? "Mix Updated" : "Trade Complete"}
          </Text>
          <Text style={styles.successDesc}>
            {tradeMode === "mix"
              ? "Your portfolio allocation has been updated"
              : selectedTickerDisplay
                ? `${tradeMode === "buy" ? "Bought" : "Sold"} $${amount.toFixed(2)} of ${selectedTickerDisplay}`
                : `${tradeMode === "buy" ? "Invested" : "Sold"} $${amount.toFixed(2)} across your portfolio`}
          </Text>
          <Pressable style={styles.doneBtn} onPress={resetAndGoBack}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      ) : step === "confirm" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.confirmScroll}>
          <Text style={styles.sheetTitle}>
            {tradeMode === "mix" ? "Confirm New Mix" : "Confirm Trade"}
          </Text>
          <View style={styles.confirmCard}>
            {tradeMode === "mix" ? (
              <>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Portfolio</Text>
                  <Text style={styles.confirmValue}>
                    {(hasCustomHoldings ? "Custom" : PORTFOLIO_PRESETS[portfolioIndex].label)} → {PORTFOLIO_PRESETS[selectedPresetIndex].label}
                  </Text>
                </View>
                <View style={styles.confirmDivider} />
                {hasCustomHoldings ? (
                  <Text style={styles.confirmValue}>
                    {PORTFOLIO_PRESETS[selectedPresetIndex].stocks}% Stocks, {PORTFOLIO_PRESETS[selectedPresetIndex].bonds}% Bonds, {PORTFOLIO_PRESETS[selectedPresetIndex].cash}% Cash
                  </Text>
                ) : (
                  holdings.map((h, i) => {
                    const preset = PORTFOLIO_PRESETS[selectedPresetIndex];
                    const newAlloc = h.id === "1" ? preset.stocks : h.id === "2" ? preset.bonds : preset.cash;
                    return (
                      <View key={h.id}>
                        <View style={styles.confirmRow}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View style={[styles.holdingDot, { backgroundColor: h.color }]} />
                            <Text style={styles.confirmLabel}>{h.ticker}</Text>
                          </View>
                          <Text style={styles.confirmValue}>
                            {h.allocation}% → {newAlloc}%
                          </Text>
                        </View>
                        {i < holdings.length - 1 && <View style={styles.confirmDivider} />}
                      </View>
                    );
                  })
                )}
              </>
            ) : (
              <>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Type</Text>
                  <View style={[styles.confirmBadge, { backgroundColor: tradeMode === "buy" ? Colors.light.successLight : Colors.light.dangerLight }]}>
                    <Text style={[styles.confirmBadgeText, { color: tradeMode === "buy" ? Colors.light.success : Colors.light.danger }]}>
                      {tradeMode === "buy" ? "Buy" : "Sell"}
                    </Text>
                  </View>
                </View>
                {(selectedHolding || selectedNewTicker) && (
                  <>
                    <View style={styles.confirmDivider} />
                    <View style={styles.confirmRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={[styles.holdingDot, { backgroundColor: selectedHolding?.color ?? Colors.light.border }]} />
                        <Text style={styles.confirmLabel}>{selectedTickerDisplay}</Text>
                      </View>
                    </View>
                  </>
                )}
                {isProportionalSelection && (
                  <>
                    <View style={styles.confirmDivider} />
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmLabel}>Distribution</Text>
                      <Text style={styles.confirmValue}>{PORTFOLIO_PRESETS[portfolioIndex].label}</Text>
                    </View>
                  </>
                )}
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Amount</Text>
                  <Text style={styles.confirmAmount}>${amount.toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>
          <View style={styles.confirmBtns}>
            <Pressable style={styles.backBtnLarge} onPress={() => setStep("form")}>
              <Feather name="arrow-left" size={20} color={Colors.light.text} />
            </Pressable>
            <Pressable
              style={[styles.executeBtn, { backgroundColor: tradeMode === "mix" ? Colors.light.accent : tradeMode === "buy" ? Colors.light.tint : Colors.light.danger }]}
              onPress={handleConfirm}
            >
              <Text style={styles.executeBtnText}>
                {tradeMode === "mix" ? "Apply Changes" : tradeMode === "buy" ? "Confirm Buy" : "Confirm Sell"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.tabRow}>
            {([
              { mode: "buy" as TradeMode, icon: "trending-up", label: "Buy", activeColor: Colors.light.success },
              { mode: "sell" as TradeMode, icon: "trending-down", label: "Sell", activeColor: Colors.light.danger },
              { mode: "mix" as TradeMode, icon: "sliders", label: "Change Mix", activeColor: Colors.light.accent },
            ] as const).map((t) => (
              <Pressable
                key={t.mode}
                style={[styles.tab, tradeMode === t.mode && { backgroundColor: t.activeColor }]}
                onPress={() => {
                  setTradeMode(t.mode);
                  setAmountText("");
                  setTickerSearch("");
                  if (t.mode === "mix") {
                    setSelectedPresetIndex(portfolioIndex);
                    setSelectedHoldingId(null);
                    setSelectedNewTicker(null);
                  } else if (!hasCustomHoldings) {
                    setSelectedHoldingId("__proportional__");
                    setSelectedNewTicker(null);
                  } else {
                    setSelectedHoldingId(null);
                    setSelectedNewTicker(null);
                  }
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                testID={`trade-tab-${t.mode}`}
              >
                <Feather name={t.icon as any} size={16} color={tradeMode === t.mode ? Colors.light.white : t.activeColor} />
                <Text style={[styles.tabText, tradeMode === t.mode && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          >
            {tradeMode === "mix" ? (
            <>
              <Text style={styles.fieldLabel}>Select Portfolio Mix</Text>
              <Text style={[styles.availableText, { marginBottom: 12 }]}>
                Your current mix: {holdings.some((h) => h.id === "1" || h.id === "2" || h.id === "3") ? PORTFOLIO_PRESETS[portfolioIndex].label : "Custom"}
              </Text>
              <View style={styles.mixSliderContainer}>
                <View style={styles.mixSliderLine} />
                <View style={styles.mixSliderDots}>
                  {PORTFOLIO_PRESETS.map((_, i) => {
                    const active = selectedPresetIndex === i;
                    const isBig = i === 0 || i === 2 || i === 4;
                    const dotSize = active
                      ? isBig ? { width: 32, height: 32, borderRadius: 16 } : { width: 16, height: 16, borderRadius: 8 }
                      : isBig ? { width: 28, height: 28, borderRadius: 14 } : { width: 12, height: 12, borderRadius: 6 };
                    return (
                      <Pressable
                        key={i}
                        style={styles.mixSliderDotWrap}
                        onPress={() => {
                          setSelectedPresetIndex(i);
                          if (Platform.OS !== "web") Haptics.selectionAsync();
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
              <View style={styles.mixSliderLabels}>
                <Text style={styles.mixSliderLabelText}>Conservative</Text>
                <Text style={styles.mixSliderLabelText}>Aggressive</Text>
              </View>
              <Text style={styles.mixPortfolioLabel}>{PORTFOLIO_PRESETS[selectedPresetIndex].label}</Text>
              <Text style={styles.mixPortfolioBreakdown}>
                {PORTFOLIO_PRESETS[selectedPresetIndex].stocks}% Stocks, {PORTFOLIO_PRESETS[selectedPresetIndex].bonds}% Bonds, {PORTFOLIO_PRESETS[selectedPresetIndex].cash}% Cash
              </Text>
              <Pressable
                style={[styles.reviewBtn, { backgroundColor: Colors.light.accent }, !isValid && styles.reviewBtnDisabled]}
                onPress={() => {
                  if (isValid) setStep("confirm");
                }}
                disabled={!isValid}
                testID="trade-review-btn"
              >
                <Text style={styles.reviewBtnText}>Review Changes</Text>
              </Pressable>
            </>
          ) : (
            <>
              {showTickerSelection && (
                <>
                  <Text style={styles.fieldLabel}>{tradeMode === "buy" ? "Search ticker to buy" : "Search ticker to sell"}</Text>
                  <TextInput
                    style={styles.tickerSearchInput}
                    value={tickerSearch}
                    onChangeText={setTickerSearch}
                    placeholder="Search by symbol (e.g. VOO, AAPL)"
                    placeholderTextColor={Colors.light.textMuted}
                    autoCapitalize="characters"
                  />
                  <ScrollView style={styles.tickerSearchScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {!hasCustomHoldings && (
                      <Pressable
                        style={[styles.holdingSelectCard, isProportionalSelection && styles.holdingSelectCardActive]}
                        onPress={() => {
                          setSelectedHoldingId(isProportionalSelection ? null : "__proportional__");
                          setSelectedNewTicker(null);
                          setAmountText("");
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                        }}
                      >
                        <View style={[styles.holdingDot, { backgroundColor: isProportionalSelection ? Colors.light.tint : Colors.light.border }]} />
                        <View style={styles.holdingSelectInfo}>
                          <Text style={[styles.holdingSelectTicker, isProportionalSelection && { color: Colors.light.tint }]}>
                            {PORTFOLIO_PRESETS[portfolioIndex].label}
                          </Text>
                          <Text style={styles.holdingSelectName}>
                            {tradeMode === "buy" ? "Invest across your portfolio" : "Sell across your portfolio"}
                          </Text>
                        </View>
                        {isProportionalSelection && <Ionicons name="checkmark-circle" size={22} color={Colors.light.tint} />}
                      </Pressable>
                    )}
                    {(tradeMode === "sell"
                      ? holdings.filter((h) => h.balance > 0 && h.ticker !== "Stocks" && h.ticker !== "Bonds" && h.ticker !== "Cash" && (h.ticker.toLowerCase().includes(tickerSearch.toLowerCase()) || h.name.toLowerCase().includes(tickerSearch.toLowerCase())))
                      : [
                          ...holdings.filter((h) => h.ticker !== "Stocks" && h.ticker !== "Bonds" && h.ticker !== "Cash" && (h.ticker.toLowerCase().includes(tickerSearch.toLowerCase()) || h.name.toLowerCase().includes(tickerSearch.toLowerCase()))),
                          ...AVAILABLE_TICKERS.filter(
                            (t) =>
                              !holdings.some((h) => h.ticker === t.ticker) &&
                              (t.ticker.toLowerCase().includes(tickerSearch.toLowerCase()) || t.name.toLowerCase().includes(tickerSearch.toLowerCase()))
                          ),
                        ]
                    ).map((item) => {
                      const isHolding = "id" in item;
                      const h = isHolding ? (item as InvestmentHolding) : null;
                      const t = !isHolding ? (item as (typeof AVAILABLE_TICKERS)[0]) : null;
                      const isSelected = h ? selectedHoldingId === h.id : selectedNewTicker?.ticker === t?.ticker;
                      const canSell = h && tradeMode === "sell" && h.balance > 0;
                      const disabled = tradeMode === "sell" && h && h.balance <= 0;
                      return (
                        <Pressable
                          key={h ? h.id : t!.ticker}
                          style={[styles.holdingSelectCard, isSelected && styles.holdingSelectCardActive, disabled && styles.holdingSelectCardDisabled]}
                          onPress={() => {
                            if (disabled) return;
                            if (h) {
                              setSelectedHoldingId(isSelected ? null : h.id);
                              setSelectedNewTicker(null);
                            } else if (t) {
                              setSelectedNewTicker(isSelected ? null : { ticker: t.ticker, name: t.name });
                              setSelectedHoldingId(null);
                            }
                            setAmountText("");
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                          }}
                        >
                          <View style={[styles.holdingDot, { backgroundColor: h ? h.color : Colors.light.border }]} />
                          <View style={styles.holdingSelectInfo}>
                            <Text style={[styles.holdingSelectTicker, isSelected && { color: Colors.light.tint }]}>{h ? h.ticker : t!.ticker}</Text>
                            <Text style={styles.holdingSelectName} numberOfLines={1}>
                              {h ? h.name : t!.name}
                            </Text>
                            {tradeMode === "sell" && h && <Text style={styles.holdingSelectBalance}>${h.balance.toLocaleString()}</Text>}
                          </View>
                          {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.light.tint} />}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </>
          )}
          </ScrollView>

          {(tradeMode !== "mix" && (selectedHoldingId || selectedNewTicker || isProportionalSelection)) && (
            <View style={[styles.amountBar, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.amountBarInner}>
                <View style={styles.amountInputRow}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    ref={amountInputRef}
                    style={styles.amountInput}
                    value={amountText}
                    onChangeText={(text) => setAmountText(text.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="decimal-pad"
                    testID="trade-amount-input"
                  />
                </View>
                <Text style={styles.availableTextCompact}>
                  {tradeMode === "buy"
                    ? `Available: $${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : selectedHolding
                      ? `Max: $${selectedHolding.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `Balance: $${investedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
                <View style={styles.quickRow}>
                  {isProportionalSelection
                    ? [0.25, 0.5, 0.75].map((pct) => (
                        <Pressable key={pct} style={styles.quickBtn} onPress={() => handleQuickAmount(pct)}>
                          <Text style={styles.quickBtnText}>{`${pct * 100}%`}</Text>
                        </Pressable>
                      ))
                    : [0.25, 0.5, 0.75, 1].map((pct) => (
                        <Pressable
                          key={pct}
                          style={styles.quickBtn}
                          onPress={() => {
                            const base = tradeMode === "buy" ? cashBalance : selectedHolding?.balance ?? 0;
                            const val = Math.floor(base * pct * 100) / 100;
                            setAmountText(val.toFixed(2));
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                          }}
                        >
                          <Text style={styles.quickBtnText}>{pct === 1 ? "Max" : `${pct * 100}%`}</Text>
                        </Pressable>
                      ))}
                  {isProportionalSelection && (
                    <Pressable
                      style={styles.quickBtn}
                      onPress={() => {
                        setAmountText("");
                        amountInputRef.current?.focus();
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.quickBtnText}>Custom</Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.reviewBtn,
                    { backgroundColor: tradeMode === "buy" ? Colors.light.tint : Colors.light.danger },
                    !isValid && styles.reviewBtnDisabled,
                  ]}
                  onPress={() => {
                    if (isValid) setStep("confirm");
                  }}
                  disabled={!isValid}
                  testID="trade-review-btn"
                >
                  <Text style={styles.reviewBtnText}>
                    Review {tradeMode === "buy" ? "Buy" : "Sell"}
                    {selectedTickerDisplay ? ` ${selectedTickerDisplay}` : ""}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sheetTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.borderLight,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 11,
  },
  tabText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  tabTextActive: {
    color: Colors.light.white,
  },
  fieldLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  holdingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  amountBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  amountBarInner: {
    gap: 8,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  dollarSign: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
    paddingVertical: 8,
  },
  availableText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 16,
  },
  availableTextCompact: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
  },
  quickBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  reviewBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  reviewBtnDisabled: {
    opacity: 0.4,
  },
  reviewBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
  confirmScroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  confirmContainer: {
    paddingBottom: 10,
  },
  confirmCard: {
    backgroundColor: Colors.light.borderLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  confirmLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  confirmValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  confirmAmount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  confirmBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmBadgeText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 12,
  },
  backBtnLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  executeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  executeBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: 8,
  },
  successDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.textMuted,
    marginBottom: 32,
  },
  doneBtn: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
  },
  doneBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
  mixSliderContainer: {
    height: 48,
    justifyContent: "center",
    marginBottom: 8,
  },
  mixSliderLine: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },
  mixSliderDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  mixSliderDotWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  mixSliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  mixSliderLabelText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  mixPortfolioLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 18,
    color: Colors.light.tint,
    textAlign: "center",
    marginBottom: 6,
  },
  mixPortfolioBreakdown: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 16,
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
    marginBottom: 12,
  },
  tickerSearchScroll: {
    maxHeight: 200,
    marginBottom: 12,
  },
  holdingSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  holdingSelectCardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  holdingSelectCardDisabled: {
    opacity: 0.5,
  },
  holdingSelectInfo: {
    flex: 1,
  },
  holdingSelectTicker: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  holdingSelectName: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  holdingSelectBalance: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
});
