import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileWebFrame } from "@/components/MobileWebFrame";
import { queryClient } from "@/lib/query-client";
import { HSAProvider } from "@/contexts/HSAContext";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="nearby-services" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="documents" options={{ headerShown: false }} />
      <Stack.Screen name="trade" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // On the top-level web window (desktop), hand off to the iframe wrapper.
  // Skip it on real mobile browsers so the app renders full-screen natively.
  const isMobileUA =
    typeof window !== "undefined" &&
    /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (Platform.OS === "web" && !isMobileUA && typeof window !== "undefined" && window.self === window.top) {
    return <MobileWebFrame />;
  }

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <HSAProvider>
              <RootLayoutNav />
            </HSAProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
