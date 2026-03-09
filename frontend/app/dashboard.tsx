import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

export default function DashboardRedirect() {
  const { completeOnboarding } = useHSA();

  useEffect(() => {
    completeOnboarding("Alex");
    router.replace("/(tabs)");
  }, [completeOnboarding]);

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
