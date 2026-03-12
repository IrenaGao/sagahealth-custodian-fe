import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

export default function EmailOTPVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { verifyEmailOtp } = useHSA();
  const { preAuthToken } = useLocalSearchParams<{ preAuthToken: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = code.length === 6;

  const handleVerify = async () => {
    if (!canSubmit || !preAuthToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyEmailOtp(preAuthToken, code);
      if (result.mfaRequired) {
        router.replace({ pathname: "/mfa-verify", params: { preAuthToken: result.preAuthToken } });
      }
      // auth gate handles redirect to /(tabs) on sessionToken set
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit verification code to your email address. It expires in 10 minutes.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={Colors.light.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [{ opacity: pressed && canSubmit ? 0.9 : 1, transform: [{ scale: pressed && canSubmit ? 0.98 : 1 }] }]}
          onPress={handleVerify}
          disabled={!canSubmit || loading}
        >
          <LinearGradient
            colors={canSubmit ? [Colors.light.tint, Colors.light.tintDark] : [Colors.light.border, Colors.light.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.light.white} />
            ) : (
              <Text style={[styles.btnText, !canSubmit && { color: Colors.light.textMuted }]}>Verify</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.replace("/login")} style={styles.linkBtn}>
          <Text style={styles.linkText}>Back to login</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    gap: 8,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.light.text,
  },
  codeInput: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
    letterSpacing: 8,
  },
  errorText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.danger,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.tint,
  },
});
