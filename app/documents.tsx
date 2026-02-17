import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";

interface Document {
  id: string;
  title: string;
  category: "tax" | "statement";
  date: string;
  fileSize: string;
  description: string;
}

const DOCUMENTS: Document[] = [
  { id: "d1", title: "2025 Form 1099-SA", category: "tax", date: "2026-01-31", fileSize: "124 KB", description: "Distribution statement for tax year 2025" },
  { id: "d2", title: "2025 Form 5498-SA", category: "tax", date: "2026-01-31", fileSize: "98 KB", description: "Contribution information for tax year 2025" },
  { id: "d3", title: "2025 Year-End Summary", category: "tax", date: "2026-01-15", fileSize: "256 KB", description: "Annual account activity and tax summary" },
  { id: "d4", title: "2024 Form 1099-SA", category: "tax", date: "2025-01-31", fileSize: "118 KB", description: "Distribution statement for tax year 2024" },
  { id: "d5", title: "2024 Form 5498-SA", category: "tax", date: "2025-01-31", fileSize: "94 KB", description: "Contribution information for tax year 2024" },
  { id: "d6", title: "January 2026 Statement", category: "statement", date: "2026-02-01", fileSize: "185 KB", description: "Monthly account statement" },
  { id: "d7", title: "December 2025 Statement", category: "statement", date: "2026-01-01", fileSize: "192 KB", description: "Monthly account statement" },
  { id: "d8", title: "November 2025 Statement", category: "statement", date: "2025-12-01", fileSize: "178 KB", description: "Monthly account statement" },
  { id: "d9", title: "October 2025 Statement", category: "statement", date: "2025-11-01", fileSize: "165 KB", description: "Monthly account statement" },
  { id: "d10", title: "September 2025 Statement", category: "statement", date: "2025-10-01", fileSize: "171 KB", description: "Monthly account statement" },
  { id: "d11", title: "August 2025 Statement", category: "statement", date: "2025-09-01", fileSize: "158 KB", description: "Monthly account statement" },
];

const CATEGORIES = [
  { key: "all", label: "All", icon: "folder" },
  { key: "tax", label: "Tax Documents", icon: "file-text" },
  { key: "statement", label: "Statements", icon: "bar-chart-2" },
] as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getCategoryColor(category: string) {
  switch (category) {
    case "tax": return { bg: "#FEF3C7", fg: "#B45309" };
    case "statement": return { bg: "#DBEAFE", fg: "#2563EB" };
    default: return { bg: Colors.light.borderLight, fg: Colors.light.textMuted };
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "tax": return "file-text";
    case "statement": return "bar-chart-2";
    default: return "file";
  }
}

function DocumentRow({ doc, index }: { doc: Document; index: number }) {
  const colors = getCategoryColor(doc.category);
  const icon = getCategoryIcon(doc.category);

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      doc.title,
      `${doc.description}\n\nFile size: ${doc.fileSize}\nDate: ${formatDate(doc.date)}`,
      [
        { text: "Close", style: "cancel" },
        { text: "Download", onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Downloaded", `${doc.title} has been saved to your device.`);
        }},
      ]
    );
  };

  return (
    <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(index * 40).duration(350) : undefined}>
      <Pressable
        style={({ pressed }) => [s.docRow, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
        onPress={handlePress}
      >
        <View style={[s.docIcon, { backgroundColor: colors.bg }]}>
          <Feather name={icon as any} size={18} color={colors.fg} />
        </View>
        <View style={s.docInfo}>
          <Text style={s.docTitle} numberOfLines={1}>{doc.title}</Text>
          <Text style={s.docMeta}>{formatDate(doc.date)}  {doc.fileSize}</Text>
        </View>
        <Feather name="download" size={18} color={Colors.light.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const filtered = activeCategory === "all"
    ? DOCUMENTS
    : DOCUMENTS.filter((d) => d.category === activeCategory);

  const grouped = filtered.reduce<Record<string, Document[]>>((acc, doc) => {
    const d = new Date(doc.date + "T00:00:00");
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const da = new Date(a[1][0].date);
    const db = new Date(b[1][0].date);
    return db.getTime() - da.getTime();
  });

  return (
    <View style={[s.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={s.header}>
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace("/(tabs)/accounts"); } }} hitSlop={12} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={s.headerTitle}>Documents</Text>
        <View style={s.backBtn} />
      </View>

      <View style={s.catRow}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              style={[s.catPill, isActive && s.catPillActive]}
              onPress={() => { setActiveCategory(cat.key); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            >
              <Feather name={cat.icon as any} size={14} color={isActive ? Colors.light.white : Colors.light.textMuted} />
              <Text style={[s.catPillText, isActive && s.catPillTextActive]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 30 }]}
      >
        <View style={s.countRow}>
          <Text style={s.countText}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</Text>
        </View>

        {sortedGroups.map(([group, docs], gi) => (
          <View key={group} style={s.groupSection}>
            <Text style={s.groupTitle}>{group}</Text>
            <View style={s.groupCard}>
              {docs.map((doc, di) => (
                <React.Fragment key={doc.id}>
                  <DocumentRow doc={doc} index={gi * 5 + di} />
                  {di < docs.length - 1 && <View style={s.divider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Feather name="folder" size={40} color={Colors.light.borderLight} />
            <Text style={s.emptyTitle}>No documents found</Text>
            <Text style={s.emptyDesc}>There are no documents in this category yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  catRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
  },
  catPillActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  catPillText: { fontFamily: "DMSans_500Medium", fontSize: 13, color: Colors.light.textMuted },
  catPillTextActive: { color: Colors.light.white },
  scrollContent: { paddingHorizontal: 20 },
  countRow: { marginTop: 8, marginBottom: 12 },
  countText: { fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.light.textMuted },
  groupSection: { marginBottom: 20 },
  groupTitle: { fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.light.textSecondary, marginBottom: 8 },
  groupCard: { backgroundColor: Colors.light.card, borderRadius: 14, paddingHorizontal: 16, overflow: "hidden" },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  docIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: { flex: 1, gap: 2 },
  docTitle: { fontFamily: "DMSans_500Medium", fontSize: 14, color: Colors.light.text },
  docMeta: { fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.light.textMuted },
  divider: { height: 1, backgroundColor: Colors.light.borderLight },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontFamily: "DMSans_600SemiBold", fontSize: 16, color: Colors.light.textSecondary },
  emptyDesc: { fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.light.textMuted },
});
