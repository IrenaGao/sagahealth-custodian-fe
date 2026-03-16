import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { PropsWithChildren, useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, View } from "react-native";

// Prevent iOS Accessibility "Larger Text" from scaling the app's fonts.
// defaultProps doesn't work in React 19, so we patch the forwardRef render fn instead.
function disableFontScaling(component: any) {
  if (component?.render) {
    const original = component.render;
    component.render = (props: any, ref: any) =>
      original({ allowFontScaling: false, ...props }, ref);
  }
}
disableFontScaling(Text);
disableFontScaling(TextInput);
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileWebFrame } from "@/components/MobileWebFrame";
import { queryClient } from "@/lib/query-client";
import { HSAProvider, useHSA } from "@/contexts/HSAContext";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: PropsWithChildren) {
  const { sessionToken, isLoading } = useHSA();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const publicSegments = ["login", "email-otp-verify", "onboarding"];
    const isPublic = publicSegments.includes(segments[0] as string);
    if (!sessionToken && !isPublic) {
      router.replace("/login");
    } else if (sessionToken && (segments[0] === "login" || segments[0] === "email-otp-verify")) {
      router.replace("/dashboard");
    }
  }, [sessionToken, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={authGateStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E5E3F" />
      </View>
    );
  }

  return <>{children}</>;
}

const authGateStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="nearby-services" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="documents" options={{ headerShown: false }} />
        <Stack.Screen name="trade" options={{ headerShown: false }} />
        <Stack.Screen name="rewards" options={{ headerShown: false }} />
        <Stack.Screen name="contributions" options={{ headerShown: false }} />
        <Stack.Screen name="reimbursement" options={{ headerShown: false }} />
        <Stack.Screen name="account-details" options={{ headerShown: false }} />
        <Stack.Screen name="security" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="email-otp-verify" options={{ headerShown: false }} />
      </Stack>
    </AuthGate>
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
