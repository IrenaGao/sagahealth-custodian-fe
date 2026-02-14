import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";

const categories = [
  { id: "all", label: "All", icon: "grid" },
  { id: "medical", label: "Medical", icon: "heart" },
  { id: "dental", label: "Dental", icon: "smile" },
  { id: "vision", label: "Vision", icon: "eye" },
  { id: "pharmacy", label: "Pharmacy", icon: "package" },
  { id: "therapy", label: "Therapy", icon: "message-circle" },
  { id: "fitness", label: "Fitness", icon: "activity" },
];

interface ServiceItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  hsaEligible: boolean;
  featured?: boolean;
}

const services: ServiceItem[] = [
  {
    id: "s1",
    name: "Annual Health Checkup",
    provider: "CityHealth Clinic",
    category: "medical",
    price: "$150",
    rating: 4.8,
    reviews: 324,
    icon: "heart",
    iconColor: Colors.light.danger,
    iconBg: Colors.light.dangerLight,
    hsaEligible: true,
    featured: true,
  },
  {
    id: "s2",
    name: "Teeth Cleaning & Exam",
    provider: "BrightSmile Dental",
    category: "dental",
    price: "$120",
    rating: 4.9,
    reviews: 512,
    icon: "smile",
    iconColor: Colors.light.info,
    iconBg: Colors.light.infoLight,
    hsaEligible: true,
  },
  {
    id: "s3",
    name: "Comprehensive Eye Exam",
    provider: "VisionFirst Optometry",
    category: "vision",
    price: "$89",
    rating: 4.7,
    reviews: 198,
    icon: "eye",
    iconColor: "#8B5CF6",
    iconBg: "#F3F0FF",
    hsaEligible: true,
  },
  {
    id: "s4",
    name: "Prescription Delivery",
    provider: "MedExpress Pharmacy",
    category: "pharmacy",
    price: "Varies",
    rating: 4.6,
    reviews: 876,
    icon: "package",
    iconColor: Colors.light.accent,
    iconBg: Colors.light.accentLight,
    hsaEligible: true,
    featured: true,
  },
  {
    id: "s5",
    name: "Online Therapy Session",
    provider: "MindWell",
    category: "therapy",
    price: "$85/session",
    rating: 4.9,
    reviews: 1243,
    icon: "message-circle",
    iconColor: Colors.light.tint,
    iconBg: Colors.light.tintLight,
    hsaEligible: true,
  },
  {
    id: "s6",
    name: "Personal Training (4 sessions)",
    provider: "FitLife Wellness",
    category: "fitness",
    price: "$280",
    rating: 4.5,
    reviews: 167,
    icon: "activity",
    iconColor: Colors.light.accent,
    iconBg: Colors.light.accentLight,
    hsaEligible: false,
  },
  {
    id: "s7",
    name: "Chiropractic Adjustment",
    provider: "AlignWell Chiro",
    category: "medical",
    price: "$65",
    rating: 4.7,
    reviews: 432,
    icon: "heart",
    iconColor: Colors.light.danger,
    iconBg: Colors.light.dangerLight,
    hsaEligible: true,
  },
  {
    id: "s8",
    name: "Prescription Sunglasses",
    provider: "LensPlus Optical",
    category: "vision",
    price: "From $149",
    rating: 4.4,
    reviews: 89,
    icon: "eye",
    iconColor: "#8B5CF6",
    iconBg: "#F3F0FF",
    hsaEligible: true,
  },
  {
    id: "s9",
    name: "Meditation & Mindfulness",
    provider: "CalmSpace",
    category: "therapy",
    price: "$12/month",
    rating: 4.8,
    reviews: 2105,
    icon: "message-circle",
    iconColor: Colors.light.tint,
    iconBg: Colors.light.tintLight,
    hsaEligible: false,
  },
  {
    id: "s10",
    name: "Orthodontics Consultation",
    provider: "SmileDirect",
    category: "dental",
    price: "Free",
    rating: 4.3,
    reviews: 567,
    icon: "smile",
    iconColor: Colors.light.info,
    iconBg: Colors.light.infoLight,
    hsaEligible: true,
  },
];

function CategoryPill({
  cat,
  active,
  onPress,
}: {
  cat: typeof categories[0];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[pillStyles.pill, active && pillStyles.pillActive]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress();
      }}
    >
      <Feather
        name={cat.icon as any}
        size={14}
        color={active ? Colors.light.white : Colors.light.textSecondary}
      />
      <Text style={[pillStyles.text, active && pillStyles.textActive]}>{cat.label}</Text>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pillActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  textActive: {
    color: Colors.light.white,
  },
});

function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={cardStyles.top}>
        <View style={[cardStyles.iconWrap, { backgroundColor: service.iconBg }]}>
          <Feather name={service.icon as any} size={20} color={service.iconColor} />
        </View>
        {service.hsaEligible && (
          <View style={cardStyles.badge}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.light.tint} />
            <Text style={cardStyles.badgeText}>HSA Eligible</Text>
          </View>
        )}
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>{service.name}</Text>
      <Text style={cardStyles.provider}>{service.provider}</Text>
      <View style={cardStyles.bottom}>
        <Text style={cardStyles.price}>{service.price}</Text>
        <View style={cardStyles.ratingRow}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={cardStyles.rating}>{service.rating}</Text>
          <Text style={cardStyles.reviews}>({service.reviews})</Text>
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
    minHeight: 180,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: Colors.light.tint,
  },
  name: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  provider: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 12,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  price: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.tint,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: Colors.light.text,
  },
  reviews: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});

function FeaturedCard({ service }: { service: ServiceItem }) {
  return (
    <Pressable
      style={({ pressed }) => [
        featStyles.card,
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={[featStyles.iconWrap, { backgroundColor: service.iconBg }]}>
        <Feather name={service.icon as any} size={24} color={service.iconColor} />
      </View>
      <View style={featStyles.info}>
        <Text style={featStyles.name} numberOfLines={1}>{service.name}</Text>
        <Text style={featStyles.provider}>{service.provider}</Text>
        <View style={featStyles.row}>
          <Text style={featStyles.price}>{service.price}</Text>
          <View style={featStyles.ratingRow}>
            <Ionicons name="star" size={11} color="#FBBF24" />
            <Text style={featStyles.rating}>{service.rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const featStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    width: 240,
    marginRight: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  provider: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  price: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: Colors.light.tint,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: Colors.light.text,
  },
});

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const featuredServices = services.filter((s) => s.featured);
  const filteredServices =
    activeCategory === "all" ? services : services.filter((s) => s.category === activeCategory);

  const rows: ServiceItem[][] = [];
  for (let i = 0; i < filteredServices.length; i += 2) {
    rows.push(filteredServices.slice(i, i + 2));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Marketplace</Text>
          <Pressable style={styles.searchBtn}>
            <Feather name="search" size={20} color={Colors.light.text} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          style={styles.catScroll}
        >
          {categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              cat={cat}
              active={activeCategory === cat.id}
              onPress={() => setActiveCategory(cat.id)}
            />
          ))}
        </ScrollView>

        {activeCategory === "all" && featuredServices.length > 0 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(100).duration(400) : undefined}>
            <Text style={styles.sectionLabel}>Featured</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}
            >
              {featuredServices.map((s) => (
                <FeaturedCard key={s.id} service={s} />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Text style={styles.sectionLabel}>
          {activeCategory === "all" ? "All Services" : categories.find((c) => c.id === activeCategory)?.label}
        </Text>

        {rows.map((row, idx) => (
          <View key={idx} style={styles.gridRow}>
            {row.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
            {row.length === 1 && <View style={{ flex: 1, marginHorizontal: 6 }} />}
          </View>
        ))}
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
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingTop: 8,
    marginBottom: 16,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: Colors.light.text,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  catScroll: {
    marginBottom: 20,
  },
  catRow: {
    gap: 8,
    paddingHorizontal: 6,
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  featuredRow: {
    paddingHorizontal: 6,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: "row",
    marginHorizontal: -6,
  },
});
