import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Switch,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

function AllocationBar({ holdings }: { holdings: { allocation: number; color: string }[] }) {
  return (
    <View style={alloStyles.track}>
      {holdings.map((h, i) => (
        <View
          key={i}
          style={[
            alloStyles.segment,
            {
              flex: h.allocation,
              backgroundColor: h.color,
              borderTopLeftRadius: i === 0 ? 6 : 0,
              borderBottomLeftRadius: i === 0 ? 6 : 0,
              borderTopRightRadius: i === holdings.length - 1 ? 6 : 0,
              borderBottomRightRadius: i === holdings.length - 1 ? 6 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const alloStyles = StyleSheet.create({
  track: {
    flexDirection: "row",
    height: 10,
    borderRadius: 6,
    overflow: "hidden",
    gap: 2,
  },
  segment: {
    height: "100%",
  },
});

function HoldingCard({
  holding,
}: {
  holding: {
    name: string;
    ticker: string;
    allocation: number;
    balance: number;
    returnPercent: number;
    color: string;
  };
}) {
  const isPositive = holding.returnPercent > 0;
  return (
    <View style={holdStyles.card}>
      <View style={holdStyles.left}>
        <View style={[holdStyles.dot, { backgroundColor: holding.color }]} />
        <View style={holdStyles.info}>
          <Text style={holdStyles.ticker}>{holding.ticker}</Text>
          <Text style={holdStyles.name} numberOfLines={1}>{holding.name}</Text>
        </View>
      </View>
      <View style={holdStyles.right}>
        <Text style={holdStyles.balance}>${holding.balance.toLocaleString()}</Text>
        <View style={holdStyles.returnRow}>
          <Ionicons
            name={isPositive ? "arrow-up" : "arrow-down"}
            size={12}
            color={isPositive ? Colors.light.success : Colors.light.danger}
          />
          <Text
            style={[
              holdStyles.returnText,
              { color: isPositive ? Colors.light.success : Colors.light.danger },
            ]}
          >
            {holding.returnPercent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const holdStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  ticker: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.text,
  },
  name: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  balance: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  returnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  returnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
  },
});

function SettingToggle({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  iconColor,
  iconBg,
}: {
  icon: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={[toggleStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={toggleStyles.info}>
        <Text style={toggleStyles.title}>{title}</Text>
        <Text style={toggleStyles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        trackColor={{ false: Colors.light.border, true: Colors.light.tintMuted }}
        thumbColor={enabled ? Colors.light.tint : "#f4f3f4"}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
});

export default function InvestmentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    investedBalance,
    holdings,
    autoInvestEnabled,
    firstDollarEnabled,
    roundUpEnabled,
    toggleAutoInvest,
    toggleFirstDollar,
    toggleRoundUp,
  } = useHSA();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const totalReturn = holdings.reduce((sum, h) => sum + h.balance * (h.returnPercent / 100), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>Investments</Text>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(100).duration(500) : undefined}>
          <LinearGradient
            colors={[Colors.light.tint, Colors.light.tintDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.portfolioCard}
          >
            <Text style={styles.portLabel}>Portfolio Value</Text>
            <Text style={styles.portValue}>${investedBalance.toLocaleString()}</Text>
            <View style={styles.portReturnRow}>
              <Ionicons name="arrow-up" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.portReturn}>+${totalReturn.toFixed(0)} ({((totalReturn / investedBalance) * 100).toFixed(1)}%)</Text>
              <Text style={styles.portReturnLabel}>all time</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(200).duration(500) : undefined}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Allocation</Text>
            <View style={{ marginVertical: 16 }}>
              <AllocationBar holdings={holdings} />
            </View>
            <View style={styles.legendRow}>
              {holdings.map((h) => (
                <View key={h.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: h.color }]} />
                  <Text style={styles.legendText}>{h.ticker} {h.allocation}%</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(300).duration(500) : undefined}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Holdings</Text>
            {holdings.map((h) => (
              <HoldingCard key={h.id} holding={h} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(400).duration(500) : undefined}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auto-Invest Settings</Text>
            <SettingToggle
              icon="zap"
              title="Auto-Invest"
              subtitle="Automatically invest new contributions"
              enabled={autoInvestEnabled}
              onToggle={toggleAutoInvest}
              iconColor={Colors.light.accent}
              iconBg={Colors.light.accentLight}
            />
            <SettingToggle
              icon="dollar-sign"
              title="First Dollar Investing"
              subtitle="Start investing from your very first dollar"
              enabled={firstDollarEnabled}
              onToggle={toggleFirstDollar}
              iconColor={Colors.light.tint}
              iconBg={Colors.light.tintLight}
            />
            <SettingToggle
              icon="repeat"
              title="Round-Up Investing"
              subtitle="Invest spare change from HSA purchases"
              enabled={roundUpEnabled}
              onToggle={toggleRoundUp}
              iconColor="#8B5CF6"
              iconBg="#F3F0FF"
            />
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
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: Colors.light.text,
    paddingTop: 8,
    marginBottom: 20,
  },
  portfolioCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  portLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  portValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  portReturnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  portReturn: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  portReturnLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 4,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
