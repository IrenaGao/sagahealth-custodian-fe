import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useHSA, getLoyaltyTier } from "@/contexts/HSAContext";

type MainCategory = "products" | "apps" | "services";

const mainCategories: { id: MainCategory; label: string; icon: string; iconSet: "feather" | "ion" }[] = [
  { id: "products", label: "Products", icon: "shopping-bag", iconSet: "feather" },
  { id: "apps", label: "Apps", icon: "smartphone", iconSet: "feather" },
  { id: "services", label: "Services", icon: "heart", iconSet: "feather" },
];

interface ServiceItem {
  id: string;
  name: string;
  provider: string;
  mainCategory: MainCategory;
  subCategory: string;
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
    id: "p1",
    name: "Allergy Relief 24-Hour",
    provider: "HealthShield Pharma",
    mainCategory: "products",
    subCategory: "OTC Medications",
    price: "$18.99",
    rating: 4.7,
    reviews: 1420,
    icon: "package",
    iconColor: Colors.light.tint,
    iconBg: Colors.light.tintLight,
    hsaEligible: true,
    featured: true,
  },
  {
    id: "p2",
    name: "Adjustable Dumbbells Set",
    provider: "FitGear Pro",
    mainCategory: "products",
    subCategory: "Fitness Equipment",
    price: "$189",
    rating: 4.8,
    reviews: 834,
    icon: "activity",
    iconColor: Colors.light.accent,
    iconBg: Colors.light.accentLight,
    hsaEligible: false,
  },
  {
    id: "p3",
    name: "First Aid Kit - Premium",
    provider: "MedReady",
    mainCategory: "products",
    subCategory: "HSA Eligible",
    price: "$34.99",
    rating: 4.9,
    reviews: 2103,
    icon: "shield",
    iconColor: Colors.light.danger,
    iconBg: Colors.light.dangerLight,
    hsaEligible: true,
  },
  {
    id: "p4",
    name: "Digital Thermometer",
    provider: "ThermoScan",
    mainCategory: "products",
    subCategory: "HSA Eligible",
    price: "$24.99",
    rating: 4.6,
    reviews: 567,
    icon: "thermometer",
    iconColor: Colors.light.info,
    iconBg: Colors.light.infoLight,
    hsaEligible: true,
  },
  {
    id: "p5",
    name: "Resistance Bands Set",
    provider: "FlexFit",
    mainCategory: "products",
    subCategory: "Fitness Equipment",
    price: "$29.99",
    rating: 4.5,
    reviews: 389,
    icon: "activity",
    iconColor: Colors.light.accent,
    iconBg: Colors.light.accentLight,
    hsaEligible: false,
  },
  {
    id: "p6",
    name: "Pain Relief Cream",
    provider: "NaturalCare",
    mainCategory: "products",
    subCategory: "OTC Medications",
    price: "$12.49",
    rating: 4.4,
    reviews: 912,
    icon: "package",
    iconColor: Colors.light.tint,
    iconBg: Colors.light.tintLight,
    hsaEligible: true,
  },
  {
    id: "a1",
    name: "Flo - Women's Health",
    provider: "Flo Health Inc.",
    mainCategory: "apps",
    subCategory: "Women's Health",
    price: "$9.99/mo",
    rating: 4.9,
    reviews: 45200,
    icon: "heart",
    iconColor: "#E91E8C",
    iconBg: "#FDE8F4",
    hsaEligible: true,
    featured: true,
  },
  {
    id: "a2",
    name: "BetterHelp Therapy",
    provider: "BetterHelp",
    mainCategory: "apps",
    subCategory: "Therapy",
    price: "$65/week",
    rating: 4.7,
    reviews: 32100,
    icon: "message-circle",
    iconColor: Colors.light.tint,
    iconBg: Colors.light.tintLight,
    hsaEligible: true,
  },
  {
    id: "a3",
    name: "Hinge Health - PT",
    provider: "Hinge Health",
    mainCategory: "apps",
    subCategory: "Physical Therapy",
    price: "Free w/ plan",
    rating: 4.8,
    reviews: 12300,
    icon: "user",
    iconColor: Colors.light.info,
    iconBg: Colors.light.infoLight,
    hsaEligible: true,
  },
  {
    id: "a4",
    name: "Calm - Meditation",
    provider: "Calm.com",
    mainCategory: "apps",
    subCategory: "Therapy",
    price: "$14.99/mo",
    rating: 4.8,
    reviews: 67800,
    icon: "sun",
    iconColor: "#8B5CF6",
    iconBg: "#F3F0FF",
    hsaEligible: false,
  },
  {
    id: "s1",
    name: "Equinox Membership",
    provider: "Equinox",
    mainCategory: "services",
    subCategory: "Gym",
    price: "$185/mo",
    rating: 4.6,
    reviews: 5670,
    icon: "activity",
    iconColor: Colors.light.accent,
    iconBg: Colors.light.accentLight,
    hsaEligible: false,
    featured: true,
  },
  {
    id: "s2",
    name: "CorePower Yoga",
    provider: "CorePower Studios",
    mainCategory: "services",
    subCategory: "Yoga",
    price: "$159/mo",
    rating: 4.8,
    reviews: 3420,
    icon: "sun",
    iconColor: "#8B5CF6",
    iconBg: "#F3F0FF",
    hsaEligible: false,
  },
  {
    id: "s3",
    name: "Club Pilates Session",
    provider: "Club Pilates",
    mainCategory: "services",
    subCategory: "Pilates",
    price: "$30/class",
    rating: 4.7,
    reviews: 2190,
    icon: "heart",
    iconColor: "#E91E8C",
    iconBg: "#FDE8F4",
    hsaEligible: false,
  },
  {
    id: "s4",
    name: "Teeth Cleaning & Exam",
    provider: "BrightSmile Dental",
    mainCategory: "services",
    subCategory: "Dental",
    price: "$120",
    rating: 4.9,
    reviews: 512,
    icon: "smile",
    iconColor: Colors.light.info,
    iconBg: Colors.light.infoLight,
    hsaEligible: true,
  },
  {
    id: "s5",
    name: "Comprehensive Eye Exam",
    provider: "VisionFirst Optometry",
    mainCategory: "services",
    subCategory: "Vision",
    price: "$89",
    rating: 4.7,
    reviews: 198,
    icon: "eye",
    iconColor: Colors.light.tint,
    iconBg: Colors.light.tintLight,
    hsaEligible: true,
  },
  {
    id: "s6",
    name: "F45 Training",
    provider: "F45 Fitness",
    mainCategory: "services",
    subCategory: "Fitness",
    price: "$60/week",
    rating: 4.6,
    reviews: 4300,
    icon: "zap",
    iconColor: Colors.light.accent,
    iconBg: Colors.light.accentLight,
    hsaEligible: false,
  },
];

function MainCategoryTab({
  cat,
  active,
  onPress,
}: {
  cat: typeof mainCategories[0];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[tabStyles.tab, active && tabStyles.tabActive]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress();
      }}
    >
      <Feather
        name={cat.icon as any}
        size={16}
        color={active ? Colors.light.white : Colors.light.textSecondary}
      />
      <Text style={[tabStyles.text, active && tabStyles.textActive]}>{cat.label}</Text>
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.light.tint,
  },
  text: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  textActive: {
    color: Colors.light.white,
  },
});

function SubCategoryPill({
  label,
  active,
  onPress,
}: {
  label: string;
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
      <Text style={[pillStyles.text, active && pillStyles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pillActive: {
    backgroundColor: Colors.light.navy,
    borderColor: Colors.light.navy,
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
            <Text style={cardStyles.badgeText}>HSA</Text>
          </View>
        )}
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>{service.name}</Text>
      <Text style={cardStyles.provider}>{service.provider}</Text>
      <Text style={cardStyles.subCat}>{service.subCategory}</Text>
      <View style={cardStyles.bottom}>
        <Text style={cardStyles.price}>{service.price}</Text>
        <View style={cardStyles.ratingRow}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={cardStyles.rating}>{service.rating}</Text>
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
    minHeight: 190,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
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
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
    color: Colors.light.tint,
  },
  name: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  provider: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 2,
  },
  subCat: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: Colors.light.info,
    marginBottom: 10,
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
        <Feather name={service.icon as any} size={22} color={service.iconColor} />
      </View>
      <View style={featStyles.info}>
        <Text style={featStyles.name} numberOfLines={1}>{service.name}</Text>
        <Text style={featStyles.provider}>{service.provider}</Text>
        <View style={featStyles.row}>
          <Text style={featStyles.price}>{service.price}</Text>
          {service.hsaEligible && (
            <View style={featStyles.hsaBadge}>
              <Text style={featStyles.hsaText}>HSA</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const featStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    width: 220,
    marginRight: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
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
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: Colors.light.tint,
  },
  hsaBadge: {
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hsaText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
    color: Colors.light.tint,
  },
});

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { balance, loyaltyPoints } = useHSA();
  const loyalty = getLoyaltyTier(balance);
  const [activeMain, setActiveMain] = useState<MainCategory>("products");
  const [activeSub, setActiveSub] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const isSearching = searchQuery.trim().length > 0;
  const query = searchQuery.trim().toLowerCase();

  const searchResults = isSearching
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.provider.toLowerCase().includes(query) ||
          s.subCategory.toLowerCase().includes(query)
      )
    : [];

  const filteredByMain = services.filter((s) => s.mainCategory === activeMain);
  const subCategories = ["All", ...Array.from(new Set(filteredByMain.map((s) => s.subCategory)))];
  const filteredServices =
    activeSub === "All" ? filteredByMain : filteredByMain.filter((s) => s.subCategory === activeSub);
  const featuredServices = filteredByMain.filter((s) => s.featured);

  const handleMainChange = (cat: MainCategory) => {
    setActiveMain(cat);
    setActiveSub("All");
  };

  const rows: ServiceItem[][] = [];
  for (let i = 0; i < filteredServices.length; i += 2) {
    rows.push(filteredServices.slice(i, i + 2));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.stickyHeader}>
        <View style={styles.loyaltyBanner}>
          <View style={styles.loyaltyLeft}>
            {loyalty.current && (
              <View style={[styles.loyaltyIconWrap, { backgroundColor: loyalty.current.color + "18" }]}>
                <Ionicons
                  name={loyalty.current.name === "Diamond" ? "diamond" : loyalty.current.name === "Gold" ? "star" : loyalty.current.name === "Platinum" ? "ribbon" : "shield-checkmark"}
                  size={18}
                  color={loyalty.current.color}
                />
              </View>
            )}
            <View>
              <Text style={[styles.loyaltyTierName, { color: loyalty.current?.color || Colors.light.text }]}>
                {loyalty.current?.name || "Member"}{loyalty.current ? ` · ${loyalty.current.pointsMultiplier}x` : ""}
              </Text>
              <Text style={styles.loyaltySubtext}>Points on purchase</Text>
            </View>
          </View>
          <View style={styles.loyaltyPointsWrap}>
            <Ionicons name="star" size={14} color="#F0D68A" />
            <Text style={styles.loyaltyPointsNum}>{loyaltyPoints.toLocaleString()}</Text>
            <Text style={styles.loyaltyPointsLabel}>pts</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.light.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, apps & services..."
            placeholderTextColor={Colors.light.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {isSearching && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {isSearching ? (
          <>
            <Text style={styles.sectionLabel}>
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery.trim()}"
            </Text>
            {(() => {
              const sRows: ServiceItem[][] = [];
              for (let i = 0; i < searchResults.length; i += 2) {
                sRows.push(searchResults.slice(i, i + 2));
              }
              return sRows.map((row, idx) => (
                <View key={idx} style={styles.gridRow}>
                  {row.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                  {row.length === 1 && <View style={{ flex: 1, marginHorizontal: 6 }} />}
                </View>
              ));
            })()}
          </>
        ) : (
        <>
        <View style={styles.mainTabRow}>
          {mainCategories.map((cat) => (
            <MainCategoryTab
              key={cat.id}
              cat={cat}
              active={activeMain === cat.id}
              onPress={() => handleMainChange(cat.id)}
            />
          ))}
        </View>

        {activeMain === "services" && (
          <Pressable
            style={({ pressed }) => [
              styles.mapBanner,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/nearby-services");
            }}
          >
            <View style={styles.mapBannerIcon}>
              <Ionicons name="map" size={22} color={Colors.light.white} />
            </View>
            <View style={styles.mapBannerText}>
              <Text style={styles.mapBannerTitle}>Find Nearby Services</Text>
              <Text style={styles.mapBannerSub}>Explore gyms, studios & clinics near you</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.light.tint} />
          </Pressable>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subRow}
          style={styles.subScroll}
        >
          {subCategories.map((sub) => (
            <SubCategoryPill
              key={sub}
              label={sub}
              active={activeSub === sub}
              onPress={() => setActiveSub(sub)}
            />
          ))}
        </ScrollView>

        {activeSub === "All" && featuredServices.length > 0 && (
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
          {activeSub === "All"
            ? mainCategories.find((c) => c.id === activeMain)?.label
            : activeSub}
        </Text>

        {rows.map((row, idx) => (
          <View key={idx} style={styles.gridRow}>
            {row.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
            {row.length === 1 && <View style={{ flex: 1, marginHorizontal: 6 }} />}
          </View>
        ))}
        </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  stickyHeader: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 14,
    paddingTop: 8,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    padding: 0,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  loyaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  loyaltyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  loyaltyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loyaltyTierName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
  loyaltySubtext: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  loyaltyPointsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loyaltyPointsNum: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: "#F0D68A",
  },
  loyaltyPointsLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  mainTabRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.borderLight,
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  mapBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.tintLight,
  },
  mapBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  mapBannerText: {
    flex: 1,
    gap: 2,
  },
  mapBannerTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  mapBannerSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  subScroll: {
    marginBottom: 16,
  },
  subRow: {
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
