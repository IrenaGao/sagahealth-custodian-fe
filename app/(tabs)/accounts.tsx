import React, { useState } from "react";
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

function ReceiptCard({
  receipt,
  onSubmit,
}: {
  receipt: Receipt;
  onSubmit: () => void;
}) {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: Colors.light.accent, bg: Colors.light.accentLight, label: "Pending" },
    submitted: { color: Colors.light.info, bg: Colors.light.infoLight, label: "Submitted" },
    approved: { color: Colors.light.success, bg: Colors.light.successLight, label: "Approved" },
    denied: { color: Colors.light.danger, bg: Colors.light.dangerLight, label: "Denied" },
  };

  const status = statusConfig[receipt.status];

  return (
    <View style={rcStyles.card}>
      <View style={rcStyles.top}>
        <View style={rcStyles.info}>
          <Text style={rcStyles.title}>{receipt.title}</Text>
          <Text style={rcStyles.provider}>{receipt.provider}</Text>
          <Text style={rcStyles.date}>{formatDate(receipt.date)}</Text>
        </View>
        <View style={rcStyles.rightCol}>
          <Text style={rcStyles.amount}>${receipt.amount.toFixed(2)}</Text>
          <View style={[rcStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[rcStyles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
      {receipt.status === "pending" && (
        <Pressable
          style={({ pressed }) => [
            rcStyles.submitBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSubmit();
          }}
        >
          <Feather name="send" size={14} color={Colors.light.white} />
          <Text style={rcStyles.submitText}>Submit for Reimbursement</Text>
        </Pressable>
      )}
    </View>
  );
}

const rcStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  provider: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  date: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  submitText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.white,
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
  const { balance, receipts, transactions, contributionYTD, contributionLimit, addReceipt, submitReimbursement } = useHSA();
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
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
            <View style={styles.receiptHeader}>
              <Text style={styles.sectionTitle}>Your Receipts</Text>
              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddReceipt(true);
                }}
              >
                <Feather name="plus" size={18} color={Colors.light.white} />
              </Pressable>
            </View>

            {receipts.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={40} color={Colors.light.textMuted} />
                <Text style={styles.emptyTitle}>No receipts yet</Text>
                <Text style={styles.emptySubtitle}>Add your medical receipts to track reimbursements</Text>
              </View>
            ) : (
              receipts.map((r) => (
                <ReceiptCard
                  key={r.id}
                  receipt={r}
                  onSubmit={() => submitReimbursement(r.id)}
                />
              ))
            )}
          </Animated.View>
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
              <SettingsRow icon="user" label="Account Holder" value="Alex Johnson" />
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
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: "center",
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
