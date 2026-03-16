import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

export default function DashboardRedirect() {
  const { completeOnboarding, lynxData, lynxDataLoading, userName } = useHSA();

  useEffect(() => {
    if (lynxDataLoading) return;
    const name = lynxData
      ? `${lynxData.firstName} ${lynxData.lastName}`.trim()
      : userName;
    completeOnboarding(name || undefined);
    router.replace("/(tabs)");
  }, [lynxDataLoading, lynxData, userName, completeOnboarding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
