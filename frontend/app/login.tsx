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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useHSA } from "@/contexts/HSAContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useHSA();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= 8;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const result = await login(email.trim(), password);
      if (result.mfaRequired) {
        router.push({ pathname: "/mfa-verify", params: { preAuthToken: result.preAuthToken } });
      }
      // auth gate handles redirect to /(tabs) on sessionToken set
    } catch (e: any) {
      setError(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your SagaHealth HSA</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={Colors.light.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={Colors.light.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [{ opacity: pressed && canSubmit ? 0.9 : 1, transform: [{ scale: pressed && canSubmit ? 0.98 : 1 }] }]}
          onPress={handleLogin}
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
              <Text style={[styles.btnText, !canSubmit && { color: Colors.light.textMuted }]}>Sign In</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.replace("/onboarding")} style={styles.linkBtn}>
          <Text style={styles.linkText}>New user? Enroll here</Text>
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
