import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

function ContributionRing({ current, limit }: { current: number; limit: number }) {
  const percent = Math.min((current / limit) * 100, 100);
  const remaining = limit - current;

  return (
    <View style={ringStyles.container}>
      <View style={ringStyles.outer}>
        <View style={ringStyles.track}>
          <View
            style={[
              ringStyles.fill,
              {
                width: `${percent}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={ringStyles.info}>
        <Text style={ringStyles.label}>Annual Limit</Text>
        <Text style={ringStyles.amount}>${remaining.toLocaleString()} remaining</Text>
        <Text style={ringStyles.detail}>
          ${current.toLocaleString()} of ${limit.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  outer: {
    marginBottom: 12,
  },
  track: {
    height: 8,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  info: {
    gap: 2,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  amount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  detail: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});

function QuickAction({
  icon,
  label,
  color,
  bgColor,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        qaStyles.container,
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[qaStyles.iconWrap, { backgroundColor: bgColor }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={qaStyles.label}>{label}</Text>
    </Pressable>
  );
}

const qaStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});

function TransactionItem({ tx }: { tx: { type: string; amount: number; description: string; date: string } }) {
  const iconMap: Record<string, { name: string; color: string; bg: string }> = {
    contribution: { name: "arrow-down-circle", color: Colors.light.tint, bg: Colors.light.tintLight },
    reimbursement: { name: "refresh-cw", color: Colors.light.info, bg: Colors.light.infoLight },
    investment: { name: "trending-up", color: "#8B5CF6", bg: "#F3F0FF" },
    purchase: { name: "shopping-bag", color: Colors.light.accent, bg: Colors.light.accentLight },
  };

  const icon = iconMap[tx.type] || iconMap.purchase;
  const isPositive = tx.amount > 0;

  return (
    <View style={txStyles.row}>
      <View style={[txStyles.icon, { backgroundColor: icon.bg }]}>
        <Feather name={icon.name as any} size={16} color={icon.color} />
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.desc}>{tx.description}</Text>
        <Text style={txStyles.date}>{formatDate(tx.date)}</Text>
      </View>
      <Text style={[txStyles.amount, { color: isPositive ? Colors.light.tint : Colors.light.text }]}>
        {isPositive ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
      </Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const txStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { balance, investedBalance, cashBalance, contributionYTD, contributionLimit, transactions } = useHSA();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Alex</Text>
          </View>
          <Pressable style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.light.text} />
          </Pressable>
        </View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(100).duration(500) : undefined}>
          <LinearGradient
            colors={[Colors.light.navy, Colors.light.navyLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceSplit}>
                <Feather name="trending-up" size={14} color={Colors.light.tintMuted} />
                <Text style={styles.splitLabel}>Invested</Text>
                <Text style={styles.splitValue}>${investedBalance.toLocaleString()}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceSplit}>
                <Feather name="dollar-sign" size={14} color={Colors.light.tintMuted} />
                <Text style={styles.splitLabel}>Cash</Text>
                <Text style={styles.splitValue}>${cashBalance.toLocaleString()}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(200).duration(500) : undefined}>
          <View style={styles.quickActions}>
            <QuickAction
              icon="plus-circle"
              label="Contribute"
              color={Colors.light.tint}
              bgColor={Colors.light.tintLight}
              onPress={() => {}}
            />
            <QuickAction
              icon="camera"
              label="Scan Receipt"
              color={Colors.light.accent}
              bgColor={Colors.light.accentLight}
              onPress={() => {}}
            />
            <QuickAction
              icon="send"
              label="Reimburse"
              color={Colors.light.info}
              bgColor={Colors.light.infoLight}
              onPress={() => {}}
            />
            <QuickAction
              icon="activity"
              label="Auto Invest"
              color="#8B5CF6"
              bgColor="#F3F0FF"
              onPress={() => {}}
            />
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(300).duration(500) : undefined}>
          <ContributionRing current={contributionYTD} limit={contributionLimit} />
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(400).duration(500) : undefined}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            <View style={styles.txList}>
              {transactions.slice(0, 5).map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: Colors.light.text,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 40,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceSplit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  splitValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  balanceDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 12,
  },
  quickActions: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  seeAll: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.tint,
  },
  txList: {},
});
