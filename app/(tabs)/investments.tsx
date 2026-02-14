import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Switch,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line, Text as SvgText } from "react-native-svg";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

const CHART_WIDTH = Dimensions.get("window").width - 80;
const CHART_HEIGHT = 180;

type TimePeriod = "1D" | "1W" | "1M" | "YTD" | "1Y";

interface ChartDataPoint {
  value: number;
  label: string;
}

function generateChartData(period: TimePeriod): ChartDataPoint[] {
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
      const points: ChartDataPoint[] = [];
      let val = 8550;
      const hours = ["9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p"];
      for (let i = 0; i < hours.length; i++) {
        val += (seededRandom(s, i) - 0.45) * 40;
        points.push({ value: Math.round(val), label: hours[i] });
      }
      return points;
    }
    case "1W": {
      const points: ChartDataPoint[] = [];
      let val = 8400;
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      for (let i = 0; i < days.length; i++) {
        val += (seededRandom(s, i) - 0.4) * 60;
        points.push({ value: Math.round(val), label: days[i] });
      }
      return points;
    }
    case "1M": {
      const points: ChartDataPoint[] = [];
      let val = 8200;
      for (let i = 1; i <= 30; i += 3) {
        val += (seededRandom(s, i) - 0.38) * 80;
        points.push({ value: Math.round(val), label: `${i}` });
      }
      return points;
    }
    case "YTD": {
      const points: ChartDataPoint[] = [];
      let val = 7800;
      const months = ["Jan", "Feb"];
      const weeksPerMonth = [4, 2];
      let idx = 0;
      for (let m = 0; m < months.length; m++) {
        for (let w = 0; w < weeksPerMonth[m]; w++) {
          val += (seededRandom(s, idx) - 0.35) * 120;
          points.push({ value: Math.round(val), label: w === 0 ? months[m] : "" });
          idx++;
        }
      }
      return points;
    }
    case "1Y": {
      const points: ChartDataPoint[] = [];
      let val = 6200;
      const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
      for (let i = 0; i < months.length; i++) {
        val += (seededRandom(s, i) - 0.32) * 200;
        points.push({ value: Math.round(val), label: months[i] });
      }
      return points;
    }
  }
}

function getChangeInfo(data: ChartDataPoint[]) {
  if (data.length < 2) return { change: 0, percent: 0, isPositive: true };
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const percent = (change / first) * 100;
  return { change, percent, isPositive: change >= 0 };
}

function PerformanceChart({ data, period }: { data: ChartDataPoint[]; period: TimePeriod }) {
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = { top: 20, bottom: 40, left: 10, right: 10 };
  const chartW = CHART_WIDTH - padding.left - padding.right;
  const chartH = CHART_HEIGHT - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
  }));

  const { isPositive } = getChangeInfo(data);
  const lineColor = isPositive ? Colors.light.tint : Colors.light.danger;

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
    linePath += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
  }

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartH}` +
    ` L ${points[0].x} ${padding.top + chartH} Z`;

  const gridLines = 3;
  const gridValues: number[] = [];
  for (let i = 0; i <= gridLines; i++) {
    gridValues.push(minVal + (range / gridLines) * i);
  }

  const labelStep = Math.max(1, Math.floor(data.length / 5));

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
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

        <Path d={areaPath} fill="url(#areaGrad)" />
        <Path d={linePath} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={lineColor}
          stroke={Colors.light.card}
          strokeWidth={2}
        />

        {data.map((d, i) =>
          i % labelStep === 0 && d.label ? (
            <SvgText
              key={i}
              x={points[i].x}
              y={CHART_HEIGHT - 8}
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
  );
}

function PeriodPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[periodStyles.pill, active && periodStyles.pillActive]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress();
      }}
    >
      <Text style={[periodStyles.text, active && periodStyles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const periodStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: Colors.light.tint,
  },
  text: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  textActive: {
    color: Colors.light.white,
  },
});

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

const periods: TimePeriod[] = ["1D", "1W", "1M", "YTD", "1Y"];

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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");

  const chartData = useMemo(() => generateChartData(selectedPeriod), [selectedPeriod]);
  const changeInfo = useMemo(() => getChangeInfo(chartData), [chartData]);

  const totalReturn = holdings.reduce((sum, h) => sum + h.balance * (h.returnPercent / 100), 0);

  const periodLabel: Record<TimePeriod, string> = {
    "1D": "Today",
    "1W": "Past Week",
    "1M": "Past Month",
    "YTD": "Year to Date",
    "1Y": "Past Year",
  };

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
            colors={[Colors.light.navy, Colors.light.navyLight]}
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

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(150).duration(500) : undefined}>
          <View style={styles.section}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Performance</Text>
              <View style={styles.chartChangeRow}>
                <Ionicons
                  name={changeInfo.isPositive ? "arrow-up" : "arrow-down"}
                  size={14}
                  color={changeInfo.isPositive ? Colors.light.success : Colors.light.danger}
                />
                <Text
                  style={[
                    styles.chartChangeText,
                    { color: changeInfo.isPositive ? Colors.light.success : Colors.light.danger },
                  ]}
                >
                  {changeInfo.isPositive ? "+" : ""}${Math.abs(changeInfo.change).toFixed(0)} ({changeInfo.isPositive ? "+" : ""}{changeInfo.percent.toFixed(2)}%)
                </Text>
              </View>
            </View>
            <Text style={styles.chartPeriodLabel}>{periodLabel[selectedPeriod]}</Text>

            <View style={styles.chartContainer}>
              <PerformanceChart data={chartData} period={selectedPeriod} />
            </View>

            <View style={styles.periodRow}>
              {periods.map((p) => (
                <PeriodPill
                  key={p}
                  label={p}
                  active={selectedPeriod === p}
                  onPress={() => setSelectedPeriod(p)}
                />
              ))}
            </View>
          </View>
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
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  chartPeriodLabel: {
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
