import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather } from "@expo/vector-icons";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useHSA, getLoyaltyTier } from "@/contexts/HSAContext";

const sagaLogo = require("@/assets/images/saga-logo.png");

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

const HOME_CHART_WIDTH = Dimensions.get("window").width - 80;
const HOME_CHART_HEIGHT = 150;

type HomePeriod = "1D" | "1W" | "1M" | "YTD" | "1Y";

interface HomeChartPoint {
  value: number;
  label: string;
}

function generateHomeChartData(period: HomePeriod): HomeChartPoint[] {
  const seed = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
  };
  const seededRandom = (s: number, i: number) => {
    const x = Math.sin(s + i * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  const s = seed(period);
  switch (period) {
    case "1D": {
      const pts: HomeChartPoint[] = [];
      let val = 12400;
      const hours = ["9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p"];
      for (let i = 0; i < hours.length; i++) {
        val += (seededRandom(s, i) - 0.45) * 60;
        pts.push({ value: Math.round(val), label: hours[i] });
      }
      return pts;
    }
    case "1W": {
      const pts: HomeChartPoint[] = [];
      let val = 12200;
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      for (let i = 0; i < days.length; i++) {
        val += (seededRandom(s, i) - 0.4) * 80;
        pts.push({ value: Math.round(val), label: days[i] });
      }
      return pts;
    }
    case "1M": {
      const pts: HomeChartPoint[] = [];
      let val = 11800;
      for (let i = 1; i <= 30; i += 3) {
        val += (seededRandom(s, i) - 0.38) * 100;
        pts.push({ value: Math.round(val), label: `${i}` });
      }
      return pts;
    }
    case "YTD": {
      const pts: HomeChartPoint[] = [];
      let val = 10800;
      const months = ["Jan", "Feb"];
      const weeksPerMonth = [4, 2];
      let idx = 0;
      for (let m = 0; m < months.length; m++) {
        for (let w = 0; w < weeksPerMonth[m]; w++) {
          val += (seededRandom(s, idx) - 0.35) * 150;
          pts.push({ value: Math.round(val), label: w === 0 ? months[m] : "" });
          idx++;
        }
      }
      return pts;
    }
    case "1Y": {
      const pts: HomeChartPoint[] = [];
      let val = 8500;
      const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
      for (let i = 0; i < months.length; i++) {
        val += (seededRandom(s, i) - 0.32) * 300;
        pts.push({ value: Math.round(val), label: months[i] });
      }
      return pts;
    }
  }
}

function getHomeChangeInfo(data: HomeChartPoint[]) {
  if (data.length < 2) return { change: 0, percent: 0, isPositive: true };
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const percent = (change / first) * 100;
  return { change, percent, isPositive: change >= 0 };
}

const homePeriods: HomePeriod[] = ["1D", "1W", "1M", "YTD", "1Y"];

const homePeriodLabel: Record<HomePeriod, string> = {
  "1D": "Today",
  "1W": "Past Week",
  "1M": "Past Month",
  "YTD": "Year to Date",
  "1Y": "Past Year",
};

function HomePerformanceChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<HomePeriod>("1M");
  const chartData = useMemo(() => generateHomeChartData(selectedPeriod), [selectedPeriod]);
  const changeInfo = useMemo(() => getHomeChangeInfo(chartData), [chartData]);

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = { top: 16, bottom: 36, left: 10, right: 10 };
  const chartW = HOME_CHART_WIDTH - padding.left - padding.right;
  const chartH = HOME_CHART_HEIGHT - padding.top - padding.bottom;
  const lineColor = changeInfo.isPositive ? Colors.light.tint : Colors.light.danger;

  const pts = chartData.map((d, i) => ({
    x: padding.left + (i / (chartData.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
  }));

  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
    linePath += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
  }

  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${padding.top + chartH}` +
    ` L ${pts[0].x} ${padding.top + chartH} Z`;

  const gridLines = 3;
  const gridValues: number[] = [];
  for (let i = 0; i <= gridLines; i++) {
    gridValues.push(minVal + (range / gridLines) * i);
  }

  const labelStep = Math.max(1, Math.floor(chartData.length / 5));

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.chartHeader}>
        <Text style={chartStyles.title}>Performance</Text>
        <View style={chartStyles.chartChangeRow}>
          <Ionicons
            name={changeInfo.isPositive ? "arrow-up" : "arrow-down"}
            size={14}
            color={changeInfo.isPositive ? Colors.light.success : Colors.light.danger}
          />
          <Text style={[chartStyles.chartChangeText, { color: changeInfo.isPositive ? Colors.light.success : Colors.light.danger }]}>
            {changeInfo.isPositive ? "+" : ""}${Math.abs(changeInfo.change).toFixed(0)} ({changeInfo.isPositive ? "+" : ""}{changeInfo.percent.toFixed(2)}%)
          </Text>
        </View>
      </View>
      <Text style={chartStyles.periodLabel}>{homePeriodLabel[selectedPeriod]}</Text>

      <View style={chartStyles.chartContainer}>
        <Svg width={HOME_CHART_WIDTH} height={HOME_CHART_HEIGHT}>
          <Defs>
            <SvgGradient id="homeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity="0.2" />
              <Stop offset="1" stopColor={lineColor} stopOpacity="0.02" />
            </SvgGradient>
          </Defs>
          {gridValues.map((gv, i) => {
            const y = padding.top + chartH - ((gv - minVal) / range) * chartH;
            return (
              <Line
                key={i}
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke={Colors.light.borderLight}
                strokeWidth={1}
              />
            );
          })}
          <Path d={areaPath} fill="url(#homeAreaGrad)" />
          <Path d={linePath} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle
            cx={pts[pts.length - 1].x}
            cy={pts[pts.length - 1].y}
            r={4}
            fill={lineColor}
            stroke={Colors.light.card}
            strokeWidth={2}
          />
          {chartData.map((d, i) =>
            i % labelStep === 0 && d.label ? (
              <SvgText
                key={i}
                x={pts[i].x}
                y={HOME_CHART_HEIGHT - 6}
                fontSize={10}
                fill={Colors.light.textMuted}
                textAnchor="middle"
                fontFamily="DMSans_400Regular"
              >
                {d.label}
              </SvgText>
            ) : null
          )}
        </Svg>
      </View>

      <View style={chartStyles.periodRow}>
        {homePeriods.map((p) => (
          <Pressable
            key={p}
            style={[chartStyles.periodPill, selectedPeriod === p && chartStyles.periodPillActive]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setSelectedPeriod(p);
            }}
          >
            <Text style={[chartStyles.periodPillText, selectedPeriod === p && chartStyles.periodPillTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  chartChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chartChangeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
  },
  periodLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.light.borderLight,
    borderRadius: 24,
    padding: 4,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodPillActive: {
    backgroundColor: Colors.light.tint,
  },
  periodPillText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  periodPillTextActive: {
    color: Colors.light.white,
  },
});

function useGreeting() {
  const [greeting, setGreeting] = useState("");
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    (async () => {
      const LAST_OPEN_KEY = "saga_last_open";
      const now = Date.now();
      const lastOpen = await AsyncStorage.getItem(LAST_OPEN_KEY);
      await AsyncStorage.setItem(LAST_OPEN_KEY, now.toString());

      if (lastOpen) {
        const diff = now - parseInt(lastOpen, 10);
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        if (diff > twoDaysMs) {
          setGreeting("Welcome back");
          return;
        }
      }

      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    })();
  }, []);

  return greeting;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { balance, investedBalance, cashBalance, contributionYTD, contributionLimit, transactions, loyaltyPoints, userName, hasCompletedOnboarding, isLoading } = useHSA();
  const loyalty = getLoyaltyTier(balance);
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const greeting = useGreeting();

  useEffect(() => {
    if (!isLoading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [isLoading, hasCompletedOnboarding]);

  if (isLoading || !hasCompletedOnboarding) {
    return <View style={[styles.container, { paddingTop: insets.top + webTopInset }]} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{userName || "Alex"}</Text>
              {loyalty.current && (
                <View style={[styles.tierBadge, { backgroundColor: loyalty.current.color + "14", borderColor: loyalty.current.color + "30" }]}>
                  <Ionicons
                    name={loyalty.current.name === "Diamond" ? "diamond" : loyalty.current.name === "Gold" ? "star" : loyalty.current.name === "Platinum" ? "ribbon" : "shield-checkmark"}
                    size={11}
                    color={loyalty.current.color}
                  />
                  <Text style={[styles.tierText, { color: loyalty.current.color }]}>
                    {loyalty.current.name}
                  </Text>
                </View>
              )}
            </View>
            {greeting ? (
              <Text style={styles.greetingText}>{greeting}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerPointsBox}>
          <View style={styles.headerPointsRow}>
            <Ionicons name="star" size={16} color="#F0D68A" />
            <Text style={styles.headerPointsNum}>{loyaltyPoints.toLocaleString()}</Text>
            <Text style={styles.headerPointsLabel}>pts</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
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

            <View style={styles.contribDivider} />
            <View style={styles.contribSection}>
              <View style={styles.contribHeader}>
                <Text style={styles.contribLabel}>Annual Contributions</Text>
                <Text style={styles.contribRemaining}>
                  ${(contributionLimit - contributionYTD).toLocaleString()} left
                </Text>
              </View>
              <View style={styles.contribTrack}>
                <View style={[styles.contribFill, { width: `${Math.min((contributionYTD / contributionLimit) * 100, 100)}%` }]} />
              </View>
              <View style={styles.contribFooter}>
                <Text style={styles.contribDetail}>
                  ${contributionYTD.toLocaleString()} of ${contributionLimit.toLocaleString()}
                </Text>
                <Text style={styles.contribPercent}>
                  {Math.round((contributionYTD / contributionLimit) * 100)}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(200).duration(500) : undefined}>
          <HomePerformanceChart />
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(300).duration(500) : undefined}>
          <View style={styles.quickActions}>
            <QuickAction
              icon="plus-circle"
              label="Contribute"
              color={Colors.light.tint}
              bgColor={Colors.light.tintLight}
              onPress={() => router.push({ pathname: "/(tabs)/accounts", params: { tab: "1" } })}
            />
            <QuickAction
              icon="award"
              label="Rewards"
              color={Colors.light.accent}
              bgColor={Colors.light.accentLight}
              onPress={() => router.push({ pathname: "/(tabs)/accounts", params: { tab: "2" } })}
            />
            <QuickAction
              icon="send"
              label="Reimburse"
              color={Colors.light.info}
              bgColor={Colors.light.infoLight}
              onPress={() => router.push({ pathname: "/(tabs)/accounts", params: { tab: "0" } })}
            />
            <QuickAction
              icon="activity"
              label="Invest"
              color="#8B5CF6"
              bgColor="#F3F0FF"
              onPress={() => router.push("/(tabs)/investments")}
            />
          </View>
        </Animated.View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(400).duration(500) : undefined}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable onPress={() => router.push("/(tabs)/accounts")}>
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
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingLeft: 4,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  tierBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  memberSince: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  greetingText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  headerPointsBox: {
    alignItems: "center" as const,
    backgroundColor: Colors.light.navy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 3,
  },
  headerPointsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
  },
  headerPointsNum: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: "#F0D68A",
  },
  headerPointsLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  headerMemberSince: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceTopRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  pointsBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pointsValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    color: "#F0D68A",
  },
  pointsLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
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
  contribDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 20,
    marginBottom: 16,
  },
  contribSection: {
    gap: 8,
  },
  contribHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contribLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  contribRemaining: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  contribTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  contribFill: {
    height: "100%",
    backgroundColor: Colors.light.tintMuted,
    borderRadius: 3,
  },
  contribFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contribDetail: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  contribPercent: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
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
