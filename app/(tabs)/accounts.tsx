import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, router } from "expo-router";
import Colors from "@/constants/colors";
import { useHSA, Receipt, LinkedCard, LinkedBankAccount, getLoyaltyTier, loyaltyTiers, LoyaltyTier } from "@/contexts/HSAContext";

function SegmentedControl({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (idx: number) => void;
}) {
  return (
    <View style={segStyles.container}>
      {tabs.map((tab, idx) => (
        <Pressable
          key={tab}
          style={[segStyles.tab, active === idx && segStyles.tabActive]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            onChange(idx);
          }}
        >
          <Text style={[segStyles.text, active === idx && segStyles.textActive]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.light.borderLight,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  textActive: {
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
});

const categoryConfig: Record<string, { icon: string; color: string; bg: string }> = {
  medical: { icon: "heart", color: "#C85A54", bg: "#FEF2F0" },
  pharmacy: { icon: "package", color: "#2E5E3F", bg: "#E8F0E4" },
  vision: { icon: "eye", color: "#4A8BA8", bg: "#E8F3F8" },
  dental: { icon: "smile", color: "#D4A574", bg: "#FFF5EC" },
  "mental health": { icon: "sun", color: "#8B5CF6", bg: "#F3EEFF" },
};

function getCategoryInfo(cat: string) {
  return categoryConfig[cat] || { icon: "file-text", color: Colors.light.textMuted, bg: Colors.light.borderLight };
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: Colors.light.accent, bg: Colors.light.accentLight, label: "Pending" },
  unreimbursed: { color: Colors.light.info, bg: Colors.light.infoLight, label: "Unreimbursed" },
  paid: { color: Colors.light.success, bg: Colors.light.successLight, label: "Paid" },
};

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const status = statusConfig[receipt.status] || statusConfig.pending;
  const catInfo = getCategoryInfo(receipt.category);

  return (
    <View style={rcStyles.card}>
      <View style={rcStyles.top}>
        <View style={[rcStyles.catIcon, { backgroundColor: catInfo.bg }]}>
          <Feather name={catInfo.icon as any} size={16} color={catInfo.color} />
        </View>
        <View style={rcStyles.info}>
          <Text style={rcStyles.title}>{receipt.title}</Text>
          <Text style={rcStyles.provider}>{receipt.provider}</Text>
        </View>
        <View style={rcStyles.rightCol}>
          <Text style={rcStyles.amount}>${receipt.amount.toFixed(2)}</Text>
          <View style={[rcStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[rcStyles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const rcStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  provider: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
  },
});

function CategoryBar({ category, amount, total }: { category: string; amount: number; total: number }) {
  const catInfo = getCategoryInfo(category);
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <View style={catBarStyles.row}>
      <View style={catBarStyles.labelRow}>
        <View style={[catBarStyles.dot, { backgroundColor: catInfo.color }]} />
        <Text style={catBarStyles.label}>{label}</Text>
        <Text style={catBarStyles.amount}>${amount.toFixed(0)}</Text>
      </View>
      <View style={catBarStyles.track}>
        <View style={[catBarStyles.fill, { width: `${pct}%`, backgroundColor: catInfo.color }]} />
      </View>
    </View>
  );
}

const catBarStyles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.text,
  },
  amount: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  track: {
    height: 6,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});

function PeriodToggle({ mode, onChange }: { mode: "monthly" | "yearly"; onChange: (m: "monthly" | "yearly") => void }) {
  return (
    <View style={periodStyles.container}>
      {(["monthly", "yearly"] as const).map((m) => (
        <Pressable
          key={m}
          style={[periodStyles.btn, mode === m && periodStyles.btnActive]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            onChange(m);
          }}
        >
          <Text style={[periodStyles.text, mode === m && periodStyles.textActive]}>
            {m === "monthly" ? "Monthly" : "Yearly"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const periodStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.light.borderLight,
    borderRadius: 8,
    padding: 2,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnActive: {
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  textActive: {
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
});

function AutoReimburseModal({
  visible,
  onClose,
  totalUnreimbursed,
  cashBalance,
  onReimburse,
}: {
  visible: boolean;
  onClose: () => void;
  totalUnreimbursed: number;
  cashBalance: number;
  onReimburse: (amount: number) => void;
}) {
  const presets = useMemo(() => {
    const options: number[] = [];
    if (totalUnreimbursed >= 100) options.push(100);
    if (totalUnreimbursed >= 250) options.push(250);
    if (totalUnreimbursed >= 500) options.push(500);
    if (totalUnreimbursed >= 1000) options.push(1000);
    options.push(totalUnreimbursed);
    return [...new Set(options)];
  }, [totalUnreimbursed]);

  const [selectedAmount, setSelectedAmount] = useState(presets[0] || 0);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const insets = useSafeAreaInsets();

  const effectiveAmount = useCustom ? (parseFloat(customAmount) || 0) : selectedAmount;
  const isValid = effectiveAmount > 0 && effectiveAmount <= totalUnreimbursed;
  const exceedsCash = effectiveAmount > cashBalance;
  const sellAmount = exceedsCash ? effectiveAmount - cashBalance : 0;

  const handleReimburse = () => {
    if (!isValid) return;
    if (exceedsCash) {
      Alert.alert(
        "Investment Sell Required",
        `Your cash balance is $${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}. To reimburse $${effectiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}, $${sellAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} will need to come from selling your investments proportionally.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onReimburse(effectiveAmount);
              onClose();
            },
          },
        ]
      );
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onReimburse(effectiveAmount);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={reimburseModalStyles.overlay}>
        <View style={[reimburseModalStyles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={reimburseModalStyles.header}>
            <Text style={reimburseModalStyles.headerTitle}>Auto-Reimburse</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          <Text style={reimburseModalStyles.desc}>
            Choose how much to reimburse from your ${totalUnreimbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })} unreimbursed balance. Oldest receipts are reimbursed first.
          </Text>

          <View style={reimburseModalStyles.presetRow}>
            {presets.map((amt) => {
              const isAll = amt === totalUnreimbursed;
              const isSelected = !useCustom && selectedAmount === amt;
              return (
                <Pressable
                  key={amt}
                  style={[reimburseModalStyles.presetBtn, isSelected && reimburseModalStyles.presetBtnActive]}
                  onPress={() => { setUseCustom(false); setSelectedAmount(amt); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                >
                  <Text style={[reimburseModalStyles.presetText, isSelected && reimburseModalStyles.presetTextActive]}>
                    {isAll ? "All" : `$${amt}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[reimburseModalStyles.customRow, useCustom && reimburseModalStyles.customRowActive]}
            onPress={() => setUseCustom(true)}
          >
            <Text style={reimburseModalStyles.customLabel}>Custom amount</Text>
            <View style={reimburseModalStyles.customInputWrap}>
              <Text style={reimburseModalStyles.dollarSign}>$</Text>
              <TextInput
                style={reimburseModalStyles.customInput}
                placeholder="0.00"
                value={customAmount}
                onChangeText={(t) => { setUseCustom(true); setCustomAmount(t); }}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </Pressable>

          {useCustom && effectiveAmount > totalUnreimbursed && (
            <Text style={reimburseModalStyles.errorText}>
              Amount exceeds your unreimbursed balance
            </Text>
          )}

          {isValid && exceedsCash && (
            <View style={reimburseModalStyles.warningCard}>
              <Feather name="alert-triangle" size={16} color="#B45309" />
              <Text style={reimburseModalStyles.warningText}>
                ${sellAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} will come from selling investments (cash balance: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              reimburseModalStyles.reimburseBtn,
              { opacity: pressed ? 0.8 : 1, backgroundColor: isValid ? Colors.light.tint : Colors.light.border },
            ]}
            onPress={handleReimburse}
            disabled={!isValid}
          >
            <Feather name="dollar-sign" size={16} color={Colors.light.white} />
            <Text style={reimburseModalStyles.reimburseBtnText}>
              Reimburse ${effectiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const reimburseModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  desc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  presetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.borderLight,
    minWidth: 70,
    alignItems: "center",
  },
  presetBtnActive: {
    backgroundColor: Colors.light.tint,
  },
  presetText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  presetTextActive: {
    color: Colors.light.white,
  },
  customRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  customRowActive: {
    borderColor: Colors.light.tint,
  },
  customLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  customInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dollarSign: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  customInput: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    minWidth: 60,
    textAlign: "right",
    paddingVertical: 0,
  },
  errorText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.danger,
    marginBottom: 8,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  warningText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: "#92400E",
    flex: 1,
  },
  reimburseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  reimburseBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
});

function ReceiptsDashboard({
  receipts,
  totalUnreimbursed,
  cashBalance,
  onAutoReimburse,
  onAddReceipt,
}: {
  receipts: Receipt[];
  totalUnreimbursed: number;
  cashBalance: number;
  onAutoReimburse: (amount: number) => void;
  onAddReceipt: () => void;
}) {
  const [periodMode, setPeriodMode] = useState<"monthly" | "yearly">("monthly");
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [showAutoReimburse, setShowAutoReimburse] = useState(false);

  const periods = useMemo(() => {
    if (periodMode === "monthly") {
      const monthMap = new Map<string, Receipt[]>();
      receipts.forEach((r) => {
        const d = new Date(r.date + "T00:00:00");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(key)) monthMap.set(key, []);
        monthMap.get(key)!.push(r);
      });
      const sorted = [...monthMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
      return sorted.map(([key, recs]) => {
        const [y, m] = key.split("-");
        const dt = new Date(parseInt(y), parseInt(m) - 1, 1);
        const label = dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return { key, label, receipts: recs.sort((a, b) => b.date.localeCompare(a.date)) };
      });
    } else {
      const yearMap = new Map<string, Receipt[]>();
      receipts.forEach((r) => {
        const d = new Date(r.date + "T00:00:00");
        const key = String(d.getFullYear());
        if (!yearMap.has(key)) yearMap.set(key, []);
        yearMap.get(key)!.push(r);
      });
      const sorted = [...yearMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
      return sorted.map(([key, recs]) => ({
        key,
        label: key,
        receipts: recs.sort((a, b) => b.date.localeCompare(a.date)),
      }));
    }
  }, [receipts, periodMode]);

  const currentPeriod = periods[selectedPeriodIdx] || periods[0];
  const periodReceipts = currentPeriod?.receipts || [];

  const totalSpent = periodReceipts.reduce((s, r) => s + r.amount, 0);
  const periodUnreimbursed = periodReceipts
    .filter((r) => r.status === "unreimbursed")
    .reduce((s, r) => s + r.amount, 0);
  const periodPaid = periodReceipts
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.amount, 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    periodReceipts.forEach((r) => {
      map.set(r.category, (map.get(r.category) || 0) + r.amount);
    });
    return [...map.entries()]
      .map(([cat, amt]) => ({ category: cat, amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodReceipts]);

  const goLeft = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedPeriodIdx((i) => Math.min(i + 1, periods.length - 1));
  };
  const goRight = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedPeriodIdx((i) => Math.max(i - 1, 0));
  };

  if (!currentPeriod) return null;

  return (
    <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
      <View style={dashStyles.shoeboxCard}>
        <View style={dashStyles.shoeboxTop}>
          <View style={dashStyles.shoeboxIconWrap}>
            <Feather name="archive" size={20} color={Colors.light.tint} />
          </View>
          <View style={dashStyles.shoeboxInfo}>
            <Text style={dashStyles.shoeboxLabel}>Shoebox Balance</Text>
            <Text style={dashStyles.shoeboxHint}>Unreimbursed across all time</Text>
          </View>
        </View>
        <Text style={dashStyles.shoeboxAmount}>${totalUnreimbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        <Text style={dashStyles.shoeboxGrowth}>
          Keeping receipts unreimbursed lets your HSA grow tax-free
        </Text>
        {totalUnreimbursed > 0 && (
          <Pressable
            style={({ pressed }) => [dashStyles.reimburseBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowAutoReimburse(true);
            }}
          >
            <Feather name="dollar-sign" size={14} color={Colors.light.tint} />
            <Text style={dashStyles.reimburseBtnText}>Auto-Reimburse</Text>
          </Pressable>
        )}
      </View>

      <View style={dashStyles.periodNav}>
        <PeriodToggle mode={periodMode} onChange={(m) => { setPeriodMode(m); setSelectedPeriodIdx(0); }} />
        <Pressable
          style={({ pressed }) => [dashStyles.addReceiptBtn, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAddReceipt(); }}
        >
          <Feather name="plus" size={15} color={Colors.light.white} />
          <Text style={dashStyles.addReceiptBtnText}>Add Receipts</Text>
        </Pressable>
      </View>

      <View style={dashStyles.periodSelector}>
        <Pressable onPress={goLeft} disabled={selectedPeriodIdx >= periods.length - 1} style={{ opacity: selectedPeriodIdx >= periods.length - 1 ? 0.3 : 1 }}>
          <Feather name="chevron-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={dashStyles.periodLabel}>{currentPeriod.label}</Text>
        <Pressable onPress={goRight} disabled={selectedPeriodIdx <= 0} style={{ opacity: selectedPeriodIdx <= 0 ? 0.3 : 1 }}>
          <Feather name="chevron-right" size={22} color={Colors.light.text} />
        </Pressable>
      </View>

      <View style={dashStyles.summaryRow}>
        <View style={dashStyles.summaryCard}>
          <Text style={dashStyles.summaryLabel}>Total Spent</Text>
          <Text style={dashStyles.summaryValue}>${totalSpent.toFixed(0)}</Text>
        </View>
        <View style={dashStyles.summaryCard}>
          <Text style={dashStyles.summaryLabel}>Unreimbursed</Text>
          <Text style={[dashStyles.summaryValue, { color: Colors.light.info }]}>${periodUnreimbursed.toFixed(0)}</Text>
        </View>
        <View style={dashStyles.summaryCard}>
          <Text style={dashStyles.summaryLabel}>Paid</Text>
          <Text style={[dashStyles.summaryValue, { color: Colors.light.success }]}>${periodPaid.toFixed(0)}</Text>
        </View>
      </View>

      {categoryBreakdown.length > 0 && (
        <View style={dashStyles.catCard}>
          <Text style={dashStyles.catTitle}>Spending by Category</Text>
          {categoryBreakdown.map((c) => (
            <CategoryBar key={c.category} category={c.category} amount={c.amount} total={totalSpent} />
          ))}
        </View>
      )}

      <View style={dashStyles.receiptListHeader}>
        <Text style={dashStyles.receiptListTitle}>Receipts</Text>
        <Text style={dashStyles.receiptCount}>{periodReceipts.length} items</Text>
      </View>
      {periodReceipts.length === 0 ? (
        <View style={dashStyles.emptyState}>
          <Feather name="file-text" size={36} color={Colors.light.textMuted} />
          <Text style={dashStyles.emptyTitle}>No receipts this period</Text>
        </View>
      ) : (
        periodReceipts.map((r) => (
          <ReceiptCard key={r.id} receipt={r} />
        ))
      )}

      <AutoReimburseModal
        visible={showAutoReimburse}
        onClose={() => setShowAutoReimburse(false)}
        totalUnreimbursed={totalUnreimbursed}
        cashBalance={cashBalance}
        onReimburse={onAutoReimburse}
      />
    </Animated.View>
  );
}

const dashStyles = StyleSheet.create({
  shoeboxCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.tint + "20",
  },
  shoeboxTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  shoeboxIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  shoeboxInfo: {
    gap: 2,
  },
  shoeboxLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  shoeboxHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  shoeboxAmount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    color: Colors.light.tint,
    marginBottom: 6,
  },
  shoeboxGrowth: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  reimburseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 12,
  },
  reimburseBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.tint,
  },
  periodNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addReceiptBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.white,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 16,
  },
  periodLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    minWidth: 160,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  summaryValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  catCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  catTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 14,
  },
  receiptListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  receiptListTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.text,
  },
  receiptCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});

function ContributionItem({ tx }: { tx: { amount: number; description: string; date: string } }) {
  return (
    <View style={contStyles.row}>
      <View style={contStyles.iconWrap}>
        <Feather name="arrow-down-circle" size={18} color={Colors.light.tint} />
      </View>
      <View style={contStyles.info}>
        <Text style={contStyles.desc}>{tx.description}</Text>
        <Text style={contStyles.date}>{formatDate(tx.date)}</Text>
      </View>
      <Text style={contStyles.amount}>+${tx.amount.toFixed(2)}</Text>
    </View>
  );
}

const contStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  desc: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.text,
  },
  date: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  amount: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.tint,
  },
});

function ContributionsTab({
  contributionYTD,
  contributionLimit,
  contributions,
  addContribution,
}: {
  contributionYTD: number;
  contributionLimit: number;
  contributions: { id: string; amount: number; description: string; date: string }[];
  addContribution: (amount: number) => void;
}) {
  const [showContribModal, setShowContribModal] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState("500");
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [recurringEnabled, setRecurringEnabled] = useState(true);
  const [editingRecurring, setEditingRecurring] = useState(false);

  const remaining = contributionLimit - contributionYTD;
  const progressPercent = Math.min((contributionYTD / contributionLimit) * 100, 100);

  const frequencyLabel = recurringFrequency === "weekly" ? "Weekly" : recurringFrequency === "biweekly" ? "Bi-weekly" : "Monthly";
  const nextDate = useMemo(() => {
    const now = new Date();
    if (recurringFrequency === "weekly") {
      now.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
    } else if (recurringFrequency === "biweekly") {
      now.setDate(now.getDate() + 14 - (now.getDate() % 14));
    } else {
      now.setMonth(now.getMonth() + 1, 1);
    }
    return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [recurringFrequency]);

  const handleSaveRecurring = () => {
    setEditingRecurring(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
      <View style={ctStyles.summaryRow}>
        <View style={ctStyles.summaryBox}>
          <Text style={ctStyles.summaryLabel}>YTD Contributions</Text>
          <Text style={ctStyles.summaryValue}>${contributionYTD.toLocaleString()}</Text>
        </View>
        <View style={ctStyles.summaryBox}>
          <Text style={ctStyles.summaryLabel}>Remaining</Text>
          <Text style={[ctStyles.summaryValue, { color: Colors.light.tint }]}>
            ${remaining.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={ctStyles.progressSection}>
        <View style={ctStyles.progressBar}>
          <View style={[ctStyles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={ctStyles.progressLabels}>
          <Text style={ctStyles.progressText}>
            ${contributionYTD.toLocaleString()} of ${contributionLimit.toLocaleString()}
          </Text>
          <Text style={ctStyles.progressText}>{Math.round(progressPercent)}%</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [ctStyles.newContribBtn, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        onPress={() => setShowContribModal(true)}
      >
        <Feather name="plus" size={18} color={Colors.light.white} />
        <Text style={ctStyles.newContribBtnText}>New Contribution</Text>
      </Pressable>

      <View style={ctStyles.card}>
        <View style={ctStyles.cardHeader}>
          <View style={ctStyles.cardHeaderLeft}>
            <View style={ctStyles.recurringIcon}>
              <Feather name="repeat" size={16} color={Colors.light.tint} />
            </View>
            <Text style={ctStyles.cardTitle}>Recurring Contribution</Text>
          </View>
          {!editingRecurring && (
            <Pressable onPress={() => setEditingRecurring(true)} hitSlop={8}>
              <Feather name="edit-2" size={16} color={Colors.light.textMuted} />
            </Pressable>
          )}
        </View>

        {!editingRecurring ? (
          <View style={ctStyles.recurringInfo}>
            <View style={ctStyles.recurringRow}>
              <Text style={ctStyles.recurringLabel}>Amount</Text>
              <Text style={ctStyles.recurringValue}>${parseFloat(recurringAmount).toLocaleString()}</Text>
            </View>
            <View style={ctStyles.divider} />
            <View style={ctStyles.recurringRow}>
              <Text style={ctStyles.recurringLabel}>Frequency</Text>
              <Text style={ctStyles.recurringValue}>{frequencyLabel}</Text>
            </View>
            <View style={ctStyles.divider} />
            <View style={ctStyles.recurringRow}>
              <Text style={ctStyles.recurringLabel}>Next Contribution</Text>
              <Text style={ctStyles.recurringValue}>{nextDate}</Text>
            </View>
            <View style={ctStyles.divider} />
            <View style={ctStyles.recurringRow}>
              <Text style={ctStyles.recurringLabel}>Status</Text>
              <View style={[ctStyles.statusBadge, { backgroundColor: recurringEnabled ? Colors.light.tintLight : "#FEE2E2" }]}>
                <Text style={[ctStyles.statusText, { color: recurringEnabled ? Colors.light.tint : "#DC2626" }]}>
                  {recurringEnabled ? "Active" : "Paused"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={ctStyles.editSection}>
            <Text style={ctStyles.editLabel}>Amount</Text>
            <View style={ctStyles.editAmountRow}>
              <Text style={ctStyles.editDollar}>$</Text>
              <TextInput
                style={ctStyles.editInput}
                value={recurringAmount}
                onChangeText={setRecurringAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>

            <Text style={[ctStyles.editLabel, { marginTop: 16 }]}>Frequency</Text>
            <View style={ctStyles.freqRow}>
              {(["weekly", "biweekly", "monthly"] as const).map((freq) => {
                const isActive = recurringFrequency === freq;
                const label = freq === "weekly" ? "Weekly" : freq === "biweekly" ? "Bi-weekly" : "Monthly";
                return (
                  <Pressable
                    key={freq}
                    style={[ctStyles.freqBtn, isActive && ctStyles.freqBtnActive]}
                    onPress={() => { setRecurringFrequency(freq); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                  >
                    <Text style={[ctStyles.freqText, isActive && ctStyles.freqTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={ctStyles.toggleRow}>
              <Text style={ctStyles.toggleLabel}>Enable Recurring</Text>
              <Pressable
                style={[ctStyles.toggle, recurringEnabled && ctStyles.toggleActive]}
                onPress={() => { setRecurringEnabled(!recurringEnabled); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
              >
                <Animated.View style={[ctStyles.toggleThumb, recurringEnabled && ctStyles.toggleThumbActive]} />
              </Pressable>
            </View>

            <View style={ctStyles.editActions}>
              <Pressable style={ctStyles.cancelBtn} onPress={() => setEditingRecurring(false)}>
                <Text style={ctStyles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={ctStyles.saveBtn} onPress={handleSaveRecurring}>
                <Feather name="check" size={16} color={Colors.light.white} />
                <Text style={ctStyles.saveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={ctStyles.card}>
        <Text style={ctStyles.cardTitle}>Contribution History</Text>
        {contributions.length === 0 ? (
          <Text style={ctStyles.emptyText}>No contributions yet</Text>
        ) : (
          contributions.map((tx) => (
            <ContributionItem key={tx.id} tx={tx} />
          ))
        )}
      </View>

      <NewContributionModal
        visible={showContribModal}
        onClose={() => setShowContribModal(false)}
        remaining={remaining}
        onContribute={addContribution}
      />
    </Animated.View>
  );
}

function NewContributionModal({
  visible,
  onClose,
  remaining,
  onContribute,
}: {
  visible: boolean;
  onClose: () => void;
  remaining: number;
  onContribute: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const insets = useSafeAreaInsets();
  const parsed = parseFloat(amount) || 0;
  const isValid = parsed > 0 && parsed <= remaining;

  const handleContribute = () => {
    if (!isValid) return;
    if (parsed > remaining * 0.9) {
      Alert.alert(
        "Large Contribution",
        `This will use ${Math.round((parsed / remaining) * 100)}% of your remaining annual limit. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Contribute", onPress: () => { onContribute(parsed); onClose(); setAmount(""); if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
        ]
      );
    } else {
      onContribute(parsed);
      onClose();
      setAmount("");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const presets = useMemo(() => {
    const options = [100, 250, 500, 1000].filter((v) => v <= remaining);
    return options;
  }, [remaining]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={ncStyles.overlay}>
        <View style={[ncStyles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={ncStyles.header}>
            <Text style={ncStyles.title}>New Contribution</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          <Text style={ncStyles.remaining}>
            ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining this year
          </Text>

          <View style={ncStyles.inputWrap}>
            <Text style={ncStyles.dollar}>$</Text>
            <TextInput
              style={ncStyles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.light.textMuted}
              autoFocus
            />
          </View>

          {presets.length > 0 && (
            <View style={ncStyles.presetRow}>
              {presets.map((val) => (
                <Pressable
                  key={val}
                  style={[ncStyles.presetBtn, parsed === val && ncStyles.presetBtnActive]}
                  onPress={() => { setAmount(val.toString()); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                >
                  <Text style={[ncStyles.presetText, parsed === val && ncStyles.presetTextActive]}>${val}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[ncStyles.presetBtn, parsed === remaining && ncStyles.presetBtnActive]}
                onPress={() => { setAmount(remaining.toString()); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
              >
                <Text style={[ncStyles.presetText, parsed === remaining && ncStyles.presetTextActive]}>Max</Text>
              </Pressable>
            </View>
          )}

          {parsed > remaining && (
            <Text style={ncStyles.errorText}>Exceeds annual contribution limit</Text>
          )}

          <Pressable
            style={({ pressed }) => [
              ncStyles.submitBtn,
              { opacity: pressed ? 0.8 : 1, backgroundColor: isValid ? Colors.light.tint : Colors.light.border },
            ]}
            onPress={handleContribute}
            disabled={!isValid}
          >
            <Feather name="arrow-down-circle" size={16} color={Colors.light.white} />
            <Text style={ncStyles.submitBtnText}>
              Contribute ${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const ncStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  container: { backgroundColor: Colors.light.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontFamily: "DMSans_700Bold", fontSize: 20, color: Colors.light.text },
  remaining: { fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.light.textMuted, marginBottom: 20 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 },
  dollar: { fontFamily: "DMSans_700Bold", fontSize: 28, color: Colors.light.text, marginRight: 4 },
  input: { fontFamily: "DMSans_700Bold", fontSize: 28, color: Colors.light.text, flex: 1, paddingVertical: 0 },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.light.background },
  presetBtnActive: { backgroundColor: Colors.light.tint },
  presetText: { fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.light.text },
  presetTextActive: { color: Colors.light.white },
  errorText: { fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.light.danger, marginBottom: 8 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  submitBtnText: { fontFamily: "DMSans_700Bold", fontSize: 16, color: Colors.light.white },
});

const ctStyles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryBox: { flex: 1, backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, gap: 4 },
  summaryLabel: { fontFamily: "DMSans_500Medium", fontSize: 12, color: Colors.light.textMuted },
  summaryValue: { fontFamily: "DMSans_700Bold", fontSize: 22, color: Colors.light.text },
  progressSection: { marginBottom: 16 },
  progressBar: { height: 6, backgroundColor: Colors.light.borderLight, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.light.tint, borderRadius: 3 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressText: { fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.light.textMuted },
  newContribBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.light.tint, borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  newContribBtnText: { fontFamily: "DMSans_700Bold", fontSize: 15, color: Colors.light.white },
  card: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  recurringIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.light.tintLight, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "DMSans_700Bold", fontSize: 17, color: Colors.light.text },
  recurringInfo: { gap: 0 },
  recurringRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  recurringLabel: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.light.textMuted },
  recurringValue: { fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.borderLight },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontFamily: "DMSans_600SemiBold", fontSize: 12 },
  editSection: { marginTop: 4 },
  editLabel: { fontFamily: "DMSans_500Medium", fontSize: 13, color: Colors.light.textMuted, marginBottom: 8 },
  editAmountRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  editDollar: { fontFamily: "DMSans_700Bold", fontSize: 22, color: Colors.light.text, marginRight: 4 },
  editInput: { fontFamily: "DMSans_700Bold", fontSize: 22, color: Colors.light.text, flex: 1, paddingVertical: 0 },
  freqRow: { flexDirection: "row", gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.light.background, alignItems: "center" },
  freqBtnActive: { backgroundColor: Colors.light.tint },
  freqText: { fontFamily: "DMSans_600SemiBold", fontSize: 13, color: Colors.light.text },
  freqTextActive: { color: Colors.light.white },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  toggleLabel: { fontFamily: "DMSans_500Medium", fontSize: 14, color: Colors.light.text },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.light.borderLight, justifyContent: "center", padding: 2 },
  toggleActive: { backgroundColor: Colors.light.tint },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.light.white },
  toggleThumbActive: { alignSelf: "flex-end" },
  editActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.light.background, alignItems: "center" },
  cancelBtnText: { fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.light.textMuted },
  saveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.light.tint },
  saveBtnText: { fontFamily: "DMSans_700Bold", fontSize: 14, color: Colors.light.white },
  emptyText: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.light.textMuted, paddingVertical: 20, textAlign: "center" },
});

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        settStyles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={settStyles.left}>
        <Feather name={icon as any} size={18} color={Colors.light.textSecondary} />
        <Text style={settStyles.label}>{label}</Text>
      </View>
      <View style={settStyles.right}>
        {value && <Text style={settStyles.value}>{value}</Text>}
        <Feather name="chevron-right" size={18} color={Colors.light.textMuted} />
      </View>
    </Pressable>
  );
}

const settStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.text,
  },
  value: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});

const cardBrands: Record<string, { label: string; color: string; icon: string }> = {
  visa: { label: "Visa", color: "#1A1F71", icon: "card" },
  mastercard: { label: "Mastercard", color: "#EB001B", icon: "card" },
  amex: { label: "Amex", color: "#006FCF", icon: "card" },
  discover: { label: "Discover", color: "#FF6600", icon: "card" },
};

function AddCardModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (card: Omit<LinkedCard, "id">) => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [label, setLabel] = useState("");
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "amex" | "discover">("visa");
  const insets = useSafeAreaInsets();

  const detectCardType = (num: string): "visa" | "mastercard" | "amex" | "discover" => {
    const cleaned = num.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "mastercard";
    if (/^3[47]/.test(cleaned)) return "amex";
    if (cleaned.startsWith("6")) return "discover";
    return "visa";
  };

  const formatCardNumber = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    setCardType(detectCardType(text));
  };

  const handleAdd = () => {
    const cleaned = cardNumber.replace(/\s/g, "");
    if (cleaned.length < 4) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({
      type: cardType,
      last4: cleaned.slice(-4),
      label: label || `${cardBrands[cardType].label} ****${cleaned.slice(-4)}`,
      isDefault: false,
    });
    setCardNumber("");
    setLabel("");
    setCardType("visa");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={addCardStyles.overlay} onPress={onClose}>
        <Pressable style={[addCardStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]} onPress={(e) => e.stopPropagation()}>
          <View style={addCardStyles.handle} />
          <Text style={addCardStyles.title}>Link a Card</Text>
          <Text style={addCardStyles.subtitle}>We'll automatically detect HSA-eligible purchases made with this card</Text>

          <View style={addCardStyles.inputGroup}>
            <Text style={addCardStyles.label}>Card Number</Text>
            <View style={addCardStyles.cardInputRow}>
              <Ionicons name="card-outline" size={20} color={cardBrands[cardType].color} />
              <TextInput
                style={addCardStyles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.light.textMuted}
                value={cardNumber}
                onChangeText={handleNumberChange}
                keyboardType="number-pad"
                maxLength={19}
              />
              <Text style={[addCardStyles.brandTag, { color: cardBrands[cardType].color }]}>
                {cardBrands[cardType].label}
              </Text>
            </View>
          </View>

          <View style={addCardStyles.inputGroup}>
            <Text style={addCardStyles.label}>Card Nickname (optional)</Text>
            <TextInput
              style={addCardStyles.inputFull}
              placeholder='e.g. "My Chase Card"'
              placeholderTextColor={Colors.light.textMuted}
              value={label}
              onChangeText={setLabel}
            />
          </View>

          <View style={addCardStyles.infoRow}>
            <Feather name="shield" size={16} color={Colors.light.tint} />
            <Text style={addCardStyles.infoText}>Your card info is encrypted and never stored on our servers</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              addCardStyles.addBtn,
              { opacity: pressed ? 0.85 : 1, backgroundColor: cardNumber.replace(/\s/g, "").length >= 4 ? Colors.light.tint : Colors.light.borderLight },
            ]}
            onPress={handleAdd}
            disabled={cardNumber.replace(/\s/g, "").length < 4}
          >
            <Feather name="link" size={16} color={Colors.light.white} />
            <Text style={addCardStyles.addBtnText}>Link Card</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const addCardStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.borderLight,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  cardInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: Colors.light.text,
    letterSpacing: 1,
  },
  inputFull: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  brandTag: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tint + "10",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  addBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
});

const bankIcons: Record<string, string> = {
  "Chase": "building",
  "Bank of America": "building",
  "Wells Fargo": "building",
  "Citi": "building",
  "Capital One": "building",
  "US Bank": "building",
};

function LinkedBankAccountsModal({
  visible,
  onClose,
  accounts,
  onAdd,
  onRemove,
  onSetPrimary,
}: {
  visible: boolean;
  onClose: () => void;
  accounts: LinkedBankAccount[];
  onAdd: (account: Omit<LinkedBankAccount, "id">) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const resetForm = () => {
    setBankName("");
    setAccountType("checking");
    setRoutingNumber("");
    setAccountNumber("");
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!bankName.trim() || accountNumber.length < 4) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({
      bankName: bankName.trim(),
      accountType,
      last4: accountNumber.slice(-4),
      isPrimary: accounts.length === 0,
    });
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={bankModalStyles.overlay} onPress={handleClose}>
        <Pressable style={[bankModalStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]} onPress={(e) => e.stopPropagation()}>
          <View style={bankModalStyles.handle} />
          <View style={bankModalStyles.headerRow}>
            <Text style={bankModalStyles.title}>Linked Accounts</Text>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={22} color={Colors.light.textMuted} />
            </Pressable>
          </View>

          {showAddForm ? (
            <View>
              <Text style={bankModalStyles.formTitle}>Add Bank Account</Text>
              <View style={bankModalStyles.inputGroup}>
                <Text style={bankModalStyles.label}>Bank Name</Text>
                <TextInput
                  style={bankModalStyles.input}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. Chase, Bank of America"
                  placeholderTextColor={Colors.light.textMuted}
                  testID="bank-name-input"
                />
              </View>
              <View style={bankModalStyles.inputGroup}>
                <Text style={bankModalStyles.label}>Account Type</Text>
                <View style={bankModalStyles.typeRow}>
                  <Pressable
                    style={[bankModalStyles.typePill, accountType === "checking" && bankModalStyles.typePillActive]}
                    onPress={() => {
                      setAccountType("checking");
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[bankModalStyles.typePillText, accountType === "checking" && bankModalStyles.typePillTextActive]}>Checking</Text>
                  </Pressable>
                  <Pressable
                    style={[bankModalStyles.typePill, accountType === "savings" && bankModalStyles.typePillActive]}
                    onPress={() => {
                      setAccountType("savings");
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[bankModalStyles.typePillText, accountType === "savings" && bankModalStyles.typePillTextActive]}>Savings</Text>
                  </Pressable>
                </View>
              </View>
              <View style={bankModalStyles.inputGroup}>
                <Text style={bankModalStyles.label}>Routing Number</Text>
                <TextInput
                  style={bankModalStyles.input}
                  value={routingNumber}
                  onChangeText={(t) => setRoutingNumber(t.replace(/\D/g, "").slice(0, 9))}
                  placeholder="9 digits"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="number-pad"
                  maxLength={9}
                  testID="routing-number-input"
                />
              </View>
              <View style={bankModalStyles.inputGroup}>
                <Text style={bankModalStyles.label}>Account Number</Text>
                <TextInput
                  style={bankModalStyles.input}
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.replace(/\D/g, "").slice(0, 17))}
                  placeholder="Account number"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="number-pad"
                  maxLength={17}
                  secureTextEntry
                  testID="account-number-input"
                />
              </View>
              <View style={bankModalStyles.formBtns}>
                <Pressable style={bankModalStyles.cancelBtn} onPress={resetForm}>
                  <Text style={bankModalStyles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[bankModalStyles.linkBtn, (!bankName.trim() || accountNumber.length < 4 || routingNumber.length < 9) && { opacity: 0.4 }]}
                  onPress={handleAdd}
                  disabled={!bankName.trim() || accountNumber.length < 4 || routingNumber.length < 9}
                  testID="link-bank-btn"
                >
                  <Feather name="link" size={16} color={Colors.light.white} />
                  <Text style={bankModalStyles.linkBtnText}>Link Account</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              {accounts.length === 0 ? (
                <View style={bankModalStyles.emptyState}>
                  <Feather name="inbox" size={36} color={Colors.light.textMuted} />
                  <Text style={bankModalStyles.emptyText}>No bank accounts linked</Text>
                  <Text style={bankModalStyles.emptySubtext}>Link an external bank account to transfer funds</Text>
                </View>
              ) : (
                <View style={bankModalStyles.accountList}>
                  {accounts.map((acct) => (
                    <View key={acct.id} style={bankModalStyles.accountRow}>
                      <View style={bankModalStyles.accountIcon}>
                        <Feather name="home" size={18} color={Colors.light.tint} />
                      </View>
                      <View style={bankModalStyles.accountInfo}>
                        <View style={bankModalStyles.accountNameRow}>
                          <Text style={bankModalStyles.accountName}>{acct.bankName}</Text>
                          {acct.isPrimary && (
                            <View style={bankModalStyles.primaryBadge}>
                              <Text style={bankModalStyles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>
                        <Text style={bankModalStyles.accountDetail}>
                          {acct.accountType === "checking" ? "Checking" : "Savings"} ****{acct.last4}
                        </Text>
                      </View>
                      <View style={bankModalStyles.accountActions}>
                        {!acct.isPrimary && (
                          <Pressable
                            style={bankModalStyles.actionBtn}
                            onPress={() => {
                              onSetPrimary(acct.id);
                              if (Platform.OS !== "web") Haptics.selectionAsync();
                            }}
                          >
                            <Feather name="star" size={16} color={Colors.light.accent} />
                          </Pressable>
                        )}
                        <Pressable
                          style={bankModalStyles.actionBtn}
                          onPress={() => {
                            onRemove(acct.id);
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        >
                          <Feather name="trash-2" size={16} color={Colors.light.danger} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                style={bankModalStyles.addAccountBtn}
                onPress={() => {
                  setShowAddForm(true);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                testID="add-bank-account-btn"
              >
                <Feather name="plus" size={18} color={Colors.light.tint} />
                <Text style={bankModalStyles.addAccountBtnText}>Add Bank Account</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const bankModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.borderLight,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  emptySubtext: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  accountList: {
    gap: 2,
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  primaryBadge: {
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: Colors.light.tint,
  },
  accountDetail: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  accountActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: "dashed",
  },
  addAccountBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.tint,
  },
  formTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
  },
  typePillActive: {
    backgroundColor: Colors.light.tintLight,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  typePillText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  typePillTextActive: {
    color: Colors.light.tint,
  },
  formBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  linkBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
  },
  linkBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.white,
  },
});

function LinkedCardsSection({
  cards,
  onAddCard,
  onRemoveCard,
  onSetDefault,
}: {
  cards: LinkedCard[];
  onAddCard: () => void;
  onRemoveCard: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  return (
    <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
      <View style={lcStyles.header}>
        <View>
          <Text style={lcStyles.sectionTitle}>Linked Cards</Text>
          <Text style={lcStyles.sectionSubtitle}>We auto-detect HSA-eligible purchases</Text>
        </View>
        <Pressable
          style={({ pressed }) => [lcStyles.addBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={onAddCard}
        >
          <Feather name="plus" size={18} color={Colors.light.white} />
        </Pressable>
      </View>

      {cards.length === 0 ? (
        <Pressable
          style={({ pressed }) => [lcStyles.emptyCard, { opacity: pressed ? 0.8 : 1 }]}
          onPress={onAddCard}
        >
          <View style={lcStyles.emptyIconWrap}>
            <Feather name="credit-card" size={28} color={Colors.light.tint} />
          </View>
          <Text style={lcStyles.emptyTitle}>No cards linked yet</Text>
          <Text style={lcStyles.emptyDesc}>Link your credit or debit card so we can automatically find and track your HSA-eligible spending</Text>
          <View style={lcStyles.emptyBtn}>
            <Feather name="plus" size={14} color={Colors.light.tint} />
            <Text style={lcStyles.emptyBtnText}>Link a Card</Text>
          </View>
        </Pressable>
      ) : (
        cards.map((card) => {
          const brand = cardBrands[card.type] || cardBrands.visa;
          return (
            <View key={card.id} style={lcStyles.card}>
              <View style={lcStyles.cardTop}>
                <View style={[lcStyles.cardIconWrap, { backgroundColor: brand.color + "15" }]}>
                  <Ionicons name="card" size={20} color={brand.color} />
                </View>
                <View style={lcStyles.cardInfo}>
                  <Text style={lcStyles.cardLabel}>{card.label}</Text>
                  <Text style={lcStyles.cardNumber}>{brand.label} ****{card.last4}</Text>
                </View>
                {card.isDefault && (
                  <View style={lcStyles.defaultBadge}>
                    <Text style={lcStyles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={lcStyles.cardActions}>
                {!card.isDefault && (
                  <Pressable
                    style={({ pressed }) => [lcStyles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSetDefault(card.id);
                    }}
                  >
                    <Feather name="check-circle" size={14} color={Colors.light.tint} />
                    <Text style={[lcStyles.actionText, { color: Colors.light.tint }]}>Set Default</Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [lcStyles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onRemoveCard(card.id);
                  }}
                >
                  <Feather name="trash-2" size={14} color={Colors.light.danger} />
                  <Text style={[lcStyles.actionText, { color: Colors.light.danger }]}>Remove</Text>
                </Pressable>
              </View>
              <View style={lcStyles.trackingRow}>
                <Feather name="zap" size={12} color={Colors.light.success} />
                <Text style={lcStyles.trackingText}>Auto-tracking HSA-eligible purchases</Text>
              </View>
            </View>
          );
        })
      )}
    </Animated.View>
  );
}

const lcStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderStyle: "dashed",
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.tint + "15",
  },
  emptyBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.tint,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  cardNumber: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: Colors.light.tint + "18",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  defaultText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: Colors.light.tint,
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
  },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.light.success + "10",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  trackingText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: Colors.light.success,
  },
});

function getTierIcon(name: string): string {
  if (name === "Diamond") return "diamond";
  if (name === "Gold") return "star";
  if (name === "Platinum") return "ribbon";
  return "shield-checkmark";
}

function LoyaltySection({ balance }: { balance: number }) {
  const loyalty = getLoyaltyTier(balance);

  return (
    <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
      <View style={loyaltyStyles.currentCard}>
        <View style={loyaltyStyles.currentHeader}>
          <View style={[loyaltyStyles.currentIconWrap, { backgroundColor: loyalty.current ? loyalty.current.color + "20" : Colors.light.tintLight }]}>
            <Ionicons
              name={loyalty.current ? getTierIcon(loyalty.current.name) as any : "shield-checkmark"}
              size={24}
              color={loyalty.current?.color || Colors.light.textMuted}
            />
          </View>
          <View style={loyaltyStyles.currentInfo}>
            <Text style={loyaltyStyles.currentLabel}>Current Tier</Text>
            <Text style={[loyaltyStyles.currentName, { color: loyalty.current?.color || Colors.light.textMuted }]}>
              {loyalty.current?.name || "No Tier"}
            </Text>
          </View>
        </View>
        {loyalty.next && (
          <View style={loyaltyStyles.progressSection}>
            <View style={loyaltyStyles.progressHeader}>
              <Text style={loyaltyStyles.progressLabel}>
                ${(loyalty.next.threshold - balance).toLocaleString()} to {loyalty.next.name}
              </Text>
              <Text style={loyaltyStyles.progressPercent}>
                {Math.round(loyalty.progress * 100)}%
              </Text>
            </View>
            <View style={loyaltyStyles.progressTrack}>
              <View
                style={[
                  loyaltyStyles.progressFill,
                  {
                    width: `${Math.min(loyalty.progress * 100, 100)}%`,
                    backgroundColor: loyalty.next.color,
                  },
                ]}
              />
            </View>
          </View>
        )}
        {!loyalty.next && loyalty.current && (
          <Text style={loyaltyStyles.maxTierText}>You've reached the highest tier!</Text>
        )}
      </View>

      <View style={loyaltyStyles.tiersCard}>
        <Text style={loyaltyStyles.tiersTitle}>All Tiers</Text>
        {loyaltyTiers.map((tier, idx) => {
          const isActive = loyalty.current?.name === tier.name;
          const isReached = balance >= tier.threshold;
          return (
            <View
              key={tier.name}
              style={[
                loyaltyStyles.tierRow,
                idx < loyaltyTiers.length - 1 && loyaltyStyles.tierRowBorder,
              ]}
            >
              <View style={[loyaltyStyles.tierIconWrap, { backgroundColor: isReached ? tier.color + "18" : Colors.light.borderLight }]}>
                <Ionicons
                  name={getTierIcon(tier.name) as any}
                  size={18}
                  color={isReached ? tier.color : Colors.light.textMuted}
                />
              </View>
              <View style={loyaltyStyles.tierInfo}>
                <Text style={[loyaltyStyles.tierName, isActive && { color: tier.color, fontFamily: "DMSans_700Bold" }]}>
                  {tier.name}
                </Text>
                <Text style={loyaltyStyles.tierThreshold}>
                  ${(tier.threshold / 1000).toFixed(0)}K+ balance  ·  {tier.pointsMultiplier}x points
                </Text>
              </View>
              {isActive && (
                <View style={[loyaltyStyles.activeBadge, { backgroundColor: tier.color + "18" }]}>
                  <Text style={[loyaltyStyles.activeBadgeText, { color: tier.color }]}>Current</Text>
                </View>
              )}
              {isReached && !isActive && (
                <Feather name="check-circle" size={18} color={Colors.light.success} />
              )}
              {!isReached && (
                <Feather name="lock" size={16} color={Colors.light.textMuted} />
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const loyaltyStyles = StyleSheet.create({
  currentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  currentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  currentInfo: {
    gap: 2,
  },
  currentLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  currentName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
  },
  progressSection: {
    marginTop: 18,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  progressPercent: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  maxTierText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.success,
    marginTop: 14,
  },
  tiersCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tiersTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  tierRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tierIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tierInfo: {
    flex: 1,
    gap: 2,
  },
  tierName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  tierThreshold: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },
});

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const EXPENSE_CATEGORIES = [
  { value: "medical", label: "Medical" },
  { value: "dental", label: "Dental" },
  { value: "vision", label: "Vision" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "mental_health", label: "Mental Health" },
  { value: "physical_therapy", label: "Physical Therapy" },
  { value: "lab_test", label: "Lab/Testing" },
  { value: "other", label: "Other" },
];

const SIMULATED_SCANS = [
  { title: "Annual Physical Exam", amount: "185.00", provider: "Dr. Sarah Chen", category: "medical", date: new Date().toISOString().split("T")[0] },
  { title: "Dental Cleaning", amount: "120.00", provider: "Bright Smile Dental", category: "dental", date: new Date().toISOString().split("T")[0] },
  { title: "Eye Exam & Contacts", amount: "275.00", provider: "VisionWorks", category: "vision", date: new Date().toISOString().split("T")[0] },
  { title: "Prescription Medication", amount: "45.99", provider: "CVS Pharmacy", category: "pharmacy", date: new Date().toISOString().split("T")[0] },
  { title: "Physical Therapy Session", amount: "150.00", provider: "ActiveCare PT", category: "physical_therapy", date: new Date().toISOString().split("T")[0] },
  { title: "Blood Work Panel", amount: "89.00", provider: "Quest Diagnostics", category: "lab_test", date: new Date().toISOString().split("T")[0] },
];

function AddReceiptModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (receipt: { title: string; amount: number; date: string; category: string; status: "pending"; provider: string }) => void;
}) {
  const [mode, setMode] = useState<"choose" | "manual" | "scan" | "scanned">("choose");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("medical");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [scanning, setScanning] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const resetForm = () => {
    setTitle(""); setAmount(""); setProvider(""); setCategory("medical");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setMode("choose"); setScanning(false); setShowCategoryPicker(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleAdd = () => {
    if (!title || !amount) return;
    onAdd({
      title,
      amount: parseFloat(amount),
      date: receiptDate,
      category,
      status: "pending",
      provider: provider || "Unknown Provider",
    });
    resetForm();
    onClose();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleScanReceipt = async () => {
    try {
      const { launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync, MediaTypeOptions } = await import("expo-image-picker");

      const useCamera = Platform.OS !== "web";
      let result;

      if (useCamera) {
        const { status } = await requestCameraPermissionsAsync();
        if (status !== "granted") {
          result = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.8 });
        } else {
          result = await launchCameraAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.8 });
        }
      } else {
        result = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.8 });
      }

      if (result.canceled) return;

      setScanning(true);
      await new Promise((r) => setTimeout(r, 2000));

      const scan = SIMULATED_SCANS[Math.floor(Math.random() * SIMULATED_SCANS.length)];
      setTitle(scan.title);
      setAmount(scan.amount);
      setProvider(scan.provider);
      setCategory(scan.category);
      setReceiptDate(scan.date);
      setScanning(false);
      setMode("scanned");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setScanning(false);
      Alert.alert("Scan Error", "Unable to scan receipt. Please try again or enter manually.");
    }
  };

  const selectedCategoryLabel = EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || "Medical";
  const canSubmit = title.length > 0 && parseFloat(amount) > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={modalStyles.header}>
            <View style={modalStyles.headerLeft}>
              {mode !== "choose" && (
                <Pressable onPress={() => setMode("choose")} hitSlop={8} style={{ marginRight: 8 }}>
                  <Feather name="arrow-left" size={22} color={Colors.light.text} />
                </Pressable>
              )}
              <Text style={modalStyles.headerTitle}>
                {mode === "choose" ? "Add Receipt" : mode === "scan" || scanning ? "Scan Receipt" : mode === "scanned" ? "Review Scan" : "Enter Receipt"}
              </Text>
            </View>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          {mode === "choose" && (
            <View style={modalStyles.chooseWrap}>
              <Pressable
                style={({ pressed }) => [modalStyles.choiceCard, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                onPress={handleScanReceipt}
              >
                <View style={[modalStyles.choiceIcon, { backgroundColor: "#EEF2FF" }]}>
                  <Feather name="camera" size={24} color="#6366F1" />
                </View>
                <View style={modalStyles.choiceInfo}>
                  <Text style={modalStyles.choiceTitle}>Scan Receipt</Text>
                  <Text style={modalStyles.choiceDesc}>Take a photo and we'll extract the details automatically</Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.light.textMuted} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [modalStyles.choiceCard, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                onPress={() => setMode("manual")}
              >
                <View style={[modalStyles.choiceIcon, { backgroundColor: Colors.light.tintLight }]}>
                  <Feather name="edit-3" size={24} color={Colors.light.tint} />
                </View>
                <View style={modalStyles.choiceInfo}>
                  <Text style={modalStyles.choiceTitle}>Enter Manually</Text>
                  <Text style={modalStyles.choiceDesc}>Type in the receipt details yourself</Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.light.textMuted} />
              </Pressable>
            </View>
          )}

          {scanning && (
            <View style={modalStyles.scanningWrap}>
              <View style={modalStyles.scanAnimation}>
                <Feather name="loader" size={40} color={Colors.light.tint} />
              </View>
              <Text style={modalStyles.scanningTitle}>Analyzing Receipt...</Text>
              <Text style={modalStyles.scanningDesc}>Extracting date, amount, and expense type</Text>
            </View>
          )}

          {(mode === "manual" || mode === "scanned") && !scanning && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {mode === "scanned" && (
                <View style={modalStyles.scannedBanner}>
                  <Feather name="check-circle" size={16} color={Colors.light.tint} />
                  <Text style={modalStyles.scannedText}>Details extracted from your receipt. Review and edit if needed.</Text>
                </View>
              )}

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Service Name</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="e.g., Annual Physical"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Provider</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="e.g., Dr. Smith"
                  value={provider}
                  onChangeText={setProvider}
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Amount ($)</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Date</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="YYYY-MM-DD"
                  value={receiptDate}
                  onChangeText={setReceiptDate}
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Expense Type</Text>
                <Pressable
                  style={modalStyles.categoryPicker}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <Text style={modalStyles.categoryPickerText}>{selectedCategoryLabel}</Text>
                  <Feather name={showCategoryPicker ? "chevron-up" : "chevron-down"} size={18} color={Colors.light.textMuted} />
                </Pressable>
                {showCategoryPicker && (
                  <View style={modalStyles.categoryList}>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.value}
                        style={[modalStyles.categoryItem, category === cat.value && modalStyles.categoryItemActive]}
                        onPress={() => { setCategory(cat.value); setShowCategoryPicker(false); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      >
                        <Text style={[modalStyles.categoryItemText, category === cat.value && modalStyles.categoryItemTextActive]}>
                          {cat.label}
                        </Text>
                        {category === cat.value && <Feather name="check" size={16} color={Colors.light.tint} />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Pressable
                style={({ pressed }) => [
                  modalStyles.addBtn,
                  { opacity: pressed ? 0.8 : 1, backgroundColor: !canSubmit ? Colors.light.border : Colors.light.tint },
                ]}
                onPress={handleAdd}
                disabled={!canSubmit}
              >
                <Feather name="check" size={16} color={Colors.light.white} />
                <Text style={modalStyles.addBtnText}>Add Receipt</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  container: { backgroundColor: Colors.light.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontFamily: "DMSans_700Bold", fontSize: 20, color: Colors.light.text },
  chooseWrap: { gap: 12, marginBottom: 8 },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
  },
  choiceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  choiceInfo: { flex: 1, gap: 2 },
  choiceTitle: { fontFamily: "DMSans_600SemiBold", fontSize: 15, color: Colors.light.text },
  choiceDesc: { fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.light.textMuted },
  scanningWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  scanAnimation: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.light.tintLight, alignItems: "center", justifyContent: "center" },
  scanningTitle: { fontFamily: "DMSans_700Bold", fontSize: 18, color: Colors.light.text },
  scanningDesc: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.light.textMuted },
  scannedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tintLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  scannedText: { fontFamily: "DMSans_500Medium", fontSize: 12, color: Colors.light.tint, flex: 1 },
  field: { marginBottom: 16, gap: 6 },
  label: { fontFamily: "DMSans_500Medium", fontSize: 13, color: Colors.light.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  categoryPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryPickerText: { fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.light.text },
  categoryList: { backgroundColor: Colors.light.background, borderRadius: 12, marginTop: 6, overflow: "hidden" },
  categoryItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 11 },
  categoryItemActive: { backgroundColor: Colors.light.tintLight },
  categoryItemText: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.light.text },
  categoryItemTextActive: { fontFamily: "DMSans_600SemiBold", color: Colors.light.tint },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  addBtnText: { fontFamily: "DMSans_600SemiBold", fontSize: 15, color: Colors.light.white },
});

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { balance, cashBalance, receipts, transactions, contributionYTD, contributionLimit, addReceipt, addContribution, autoReimburse, userName, totalUnreimbursed, linkedCards, addLinkedCard, removeLinkedCard, setDefaultCard, linkedBankAccounts, addLinkedBankAccount, removeLinkedBankAccount, setPrimaryBankAccount, logout } = useHSA();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddReceipt, setShowAddReceipt] = useState(false);

  useEffect(() => {
    if (params.tab) {
      const tabIdx = parseInt(params.tab);
      if (!isNaN(tabIdx) && tabIdx >= 0 && tabIdx <= 3) {
        setActiveTab(tabIdx);
      }
    }
  }, [params.tab]);
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const contributions = transactions.filter((t) => t.type === "contribution");

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>Account</Text>

        <SegmentedControl
          tabs={["Receipts", "Contributions", "Rewards", "Settings"]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 0 && (
          <ReceiptsDashboard
            receipts={receipts}
            totalUnreimbursed={totalUnreimbursed}
            cashBalance={cashBalance}
            onAutoReimburse={autoReimburse}
            onAddReceipt={() => setShowAddReceipt(true)}
          />
        )}

        {activeTab === 1 && (
          <ContributionsTab
            contributionYTD={contributionYTD}
            contributionLimit={contributionLimit}
            contributions={contributions}
            addContribution={addContribution}
          />
        )}

        {activeTab === 2 && (
          <LoyaltySection balance={balance} />
        )}

        {activeTab === 3 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
            <LinkedCardsSection
              cards={linkedCards}
              onAddCard={() => setShowAddCard(true)}
              onRemoveCard={removeLinkedCard}
              onSetDefault={setDefaultCard}
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              <SettingsRow icon="user" label="Account Holder" value={userName || "Alex"} />
              <SettingsRow icon="calendar" label="Plan Year" value="2026" />
              <SettingsRow icon="shield" label="Account Type" value="Individual" />
              <Pressable
                style={({ pressed }) => [settStyles.row, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  setShowBankAccounts(true);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
              >
                <View style={settStyles.left}>
                  <Feather name="link" size={18} color={Colors.light.textSecondary} />
                  <Text style={settStyles.label}>Linked Accounts</Text>
                </View>
                <View style={settStyles.right}>
                  <Text style={settStyles.value}>{linkedBankAccounts.length} bank{linkedBankAccounts.length !== 1 ? "s" : ""}</Text>
                  <Feather name="chevron-right" size={18} color={Colors.light.textMuted} />
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <SettingsRow icon="bell" label="Notifications" />
              <SettingsRow icon="lock" label="Security" />
              <SettingsRow icon="file-text" label="Documents" onPress={() => router.push("/documents")} />
              <SettingsRow icon="help-circle" label="Help & Support" />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <SettingsRow icon="book" label="Terms of Service" />
              <SettingsRow icon="shield" label="Privacy Policy" />
            </View>

            <Pressable
              style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={() => {
                Alert.alert(
                  "Log Out",
                  "Are you sure you want to log out? You'll need to complete onboarding again to access your account.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Log Out",
                      style: "destructive",
                      onPress: () => {
                        logout();
                        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      },
                    },
                  ]
                );
              }}
            >
              <Feather name="log-out" size={18} color={Colors.light.danger} />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      <AddReceiptModal
        visible={showAddReceipt}
        onClose={() => setShowAddReceipt(false)}
        onAdd={addReceipt}
      />

      <AddCardModal
        visible={showAddCard}
        onClose={() => setShowAddCard(false)}
        onAdd={addLinkedCard}
      />

      <LinkedBankAccountsModal
        visible={showBankAccounts}
        onClose={() => setShowBankAccounts(false)}
        accounts={linkedBankAccounts}
        onAdd={addLinkedBankAccount}
        onRemove={removeLinkedBankAccount}
        onSetPrimary={setPrimaryBankAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: Colors.light.text,
    paddingTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.danger,
  },
});
