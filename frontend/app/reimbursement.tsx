import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { webTopInsetBase, webBottomPadding } from "@/lib/platform";
import { useHSA } from "@/contexts/HSAContext";
import { ReceiptsDashboard, AddReceiptModal } from "./(tabs)/accounts";

export default function ReimbursementScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? webTopInsetBase : 0;
  const { receipts, cashBalance, totalUnreimbursed, autoReimburse, addReceipt } = useHSA();
  const [showAddReceipt, setShowAddReceipt] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={Colors.light.text} />
      </Pressable>
      <Text style={styles.title}>Reimbursement</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? webBottomPadding : Platform.OS === "android" ? insets.bottom * 2.8 : undefined }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ReceiptsDashboard
          receipts={receipts}
          totalUnreimbursed={totalUnreimbursed}
          cashBalance={cashBalance}
          onAutoReimburse={autoReimburse}
          onAddReceipt={() => setShowAddReceipt(true)}
        />
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
  backBtn: {
    padding: 4,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
