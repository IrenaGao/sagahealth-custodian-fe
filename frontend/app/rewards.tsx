import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { webTopInsetBase, webBottomPadding } from "@/lib/platform";
import { useHSA } from "@/contexts/HSAContext";
import { LoyaltySection } from "./(tabs)/accounts";

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? webTopInsetBase : 0;
  const { balance } = useHSA();

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Rewards</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? webBottomPadding : Platform.OS === "android" ? insets.bottom * 2.8 : undefined }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LoyaltySection balance={balance} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
