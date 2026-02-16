import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useHSA, Receipt, getLoyaltyTier, loyaltyTiers, LoyaltyTier } from "@/contexts/HSAContext";

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
  onReimburse,
}: {
  visible: boolean;
  onClose: () => void;
  totalUnreimbursed: number;
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

  const handleReimburse = () => {
    if (!isValid) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onReimburse(effectiveAmount);
    onClose();
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
  onAutoReimburse,
  onAddReceipt,
}: {
  receipts: Receipt[];
  totalUnreimbursed: number;
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
        <Pressable style={dashStyles.addBtn} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAddReceipt(); }}>
          <Feather name="plus" size={18} color={Colors.light.white} />
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
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

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        settStyles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}
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

function AddReceiptModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (receipt: { title: string; amount: number; date: string; category: string; status: "pending"; provider: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    if (!title || !amount) return;
    onAdd({
      title,
      amount: parseFloat(amount),
      date: new Date().toISOString().split("T")[0],
      category: "medical",
      status: "pending",
      provider: provider || "Unknown Provider",
    });
    setTitle("");
    setAmount("");
    setProvider("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Add Receipt</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

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

          <Pressable
            style={({ pressed }) => [
              modalStyles.addBtn,
              { opacity: pressed ? 0.8 : 1, backgroundColor: (!title || !amount) ? Colors.light.border : Colors.light.tint },
            ]}
            onPress={handleAdd}
            disabled={!title || !amount}
          >
            <Text style={modalStyles.addBtnText}>Add Receipt</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
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
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  field: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
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
  addBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  addBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.white,
  },
});

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { balance, receipts, transactions, contributionYTD, contributionLimit, addReceipt, autoReimburse, userName, totalUnreimbursed } = useHSA();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const contributions = transactions.filter((t) => t.type === "contribution");

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
            onAutoReimburse={autoReimburse}
            onAddReceipt={() => setShowAddReceipt(true)}
          />
        )}

        {activeTab === 1 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
            <View style={styles.contribSummary}>
              <View style={styles.contribBox}>
                <Text style={styles.contribLabel}>YTD Contributions</Text>
                <Text style={styles.contribValue}>${contributionYTD.toLocaleString()}</Text>
              </View>
              <View style={styles.contribBox}>
                <Text style={styles.contribLabel}>Remaining</Text>
                <Text style={[styles.contribValue, { color: Colors.light.tint }]}>
                  ${(contributionLimit - contributionYTD).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contribution History</Text>
              {contributions.map((tx) => (
                <ContributionItem key={tx.id} tx={tx} />
              ))}
            </View>
          </Animated.View>
        )}

        {activeTab === 2 && (
          <LoyaltySection balance={balance} />
        )}

        {activeTab === 3 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              <SettingsRow icon="user" label="Account Holder" value={userName || "Alex"} />
              <SettingsRow icon="credit-card" label="HSA Card" value="****4829" />
              <SettingsRow icon="calendar" label="Plan Year" value="2026" />
              <SettingsRow icon="shield" label="Account Type" value="Individual" />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <SettingsRow icon="bell" label="Notifications" />
              <SettingsRow icon="lock" label="Security" />
              <SettingsRow icon="file-text" label="Documents" />
              <SettingsRow icon="help-circle" label="Help & Support" />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal</Text>
              <SettingsRow icon="book" label="Terms of Service" />
              <SettingsRow icon="shield" label="Privacy Policy" />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <AddReceiptModal
        visible={showAddReceipt}
        onClose={() => setShowAddReceipt(false)}
        onAdd={addReceipt}
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
  contribSummary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  contribBox: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  contribLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  contribValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
});
