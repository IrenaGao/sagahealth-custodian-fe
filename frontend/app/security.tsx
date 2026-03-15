import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import Colors from "@/constants/colors";
import { webTopInsetBase, webBottomPadding } from "@/lib/platform";
import { useHSA } from "@/contexts/HSAContext";
import { API_BASE_URL } from "@shared/constants";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? webTopInsetBase : 0;
  const { authFetch, mfaEnabled, setMfaEnabled } = useHSA();

  // MFA state
  const [mfaSetupData, setMfaSetupData] = useState<{ totp_secret: string; qr_code_url: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [showMfaDisable, setShowMfaDisable] = useState(false);

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      const resp = await authFetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || "Failed to update password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      Alert.alert("Success", "Your password has been updated.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setPasswordError(e?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Security</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? webBottomPadding : Platform.OS === "android" ? insets.bottom * 2.8 : undefined }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Password */}
        <Text style={styles.sectionTitle}>Password</Text>
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              setShowPasswordForm((v) => !v);
              setPasswordError(null);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
          >
            <View style={styles.rowLeft}>
              <Feather name="lock" size={18} color={Colors.light.textSecondary} />
              <Text style={styles.rowLabel}>Update Password</Text>
            </View>
            <Feather name={showPasswordForm ? "chevron-up" : "chevron-down"} size={18} color={Colors.light.textMuted} />
          </Pressable>

          {showPasswordForm && (
            <View style={styles.formWrap}>
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
              {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              <Pressable
                style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? <ActivityIndicator size="small" color={Colors.light.white} />
                  : <Text style={styles.actionBtnText}>Update Password</Text>}
              </Pressable>
            </View>
          )}
        </View>

        {/* Two-Factor Authentication */}
        <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
        <View style={styles.card}>
          {!mfaEnabled && !mfaSetupData && (
            <View style={styles.mfaRow}>
              <Text style={styles.mfaStatusText}>
                Status: <Text style={styles.mfaOff}>Off</Text>
              </Text>
              <Pressable
                style={({ pressed }) => [styles.mfaBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={async () => {
                  setMfaLoading(true);
                  setMfaError(null);
                  try {
                    const resp = await authFetch(`${API_BASE_URL}/mfa/setup`, { method: "POST" });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data.detail || "Setup failed");
                    setMfaSetupData(data);
                    setMfaCode("");
                  } catch (e: any) {
                    setMfaError(e?.message || "Failed to start MFA setup");
                  } finally {
                    setMfaLoading(false);
                  }
                }}
                disabled={mfaLoading}
              >
                {mfaLoading
                  ? <ActivityIndicator size="small" color={Colors.light.tint} />
                  : <Text style={styles.mfaBtnText}>Set Up MFA</Text>}
              </Pressable>
            </View>
          )}

          {!mfaEnabled && mfaSetupData && (
            <View style={styles.mfaSetupContainer}>
              <Text style={styles.mfaInstructions}>Scan this QR code with your authenticator app (e.g. Google Authenticator):</Text>
              <View style={styles.qrContainer}>
                <QRCode value={mfaSetupData.qr_code_url} size={180} />
              </View>
              <Text style={styles.mfaInstructions}>Or enter this secret manually:</Text>
              <Text style={styles.mfaSecret}>{mfaSetupData.totp_secret}</Text>
              <Text style={styles.mfaInstructions}>Then enter the 6-digit code to confirm:</Text>
              <TextInput
                style={styles.mfaCodeInput}
                value={mfaCode}
                onChangeText={(t) => setMfaCode(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="number-pad"
                maxLength={6}
              />
              {mfaError && <Text style={styles.errorText}>{mfaError}</Text>}
              <Pressable
                style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={async () => {
                  if (mfaCode.length !== 6) return;
                  setMfaLoading(true);
                  setMfaError(null);
                  try {
                    const resp = await authFetch(`${API_BASE_URL}/mfa/enable`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code: mfaCode }),
                    });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data.detail || "Enable failed");
                    setMfaEnabled(true);
                    setMfaSetupData(null);
                    setMfaCode("");
                  } catch (e: any) {
                    setMfaError(e?.message || "Invalid code");
                  } finally {
                    setMfaLoading(false);
                  }
                }}
                disabled={mfaCode.length !== 6 || mfaLoading}
              >
                {mfaLoading
                  ? <ActivityIndicator size="small" color={Colors.light.white} />
                  : <Text style={styles.actionBtnText}>Enable MFA</Text>}
              </Pressable>
              <Pressable onPress={() => { setMfaSetupData(null); setMfaError(null); }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          {mfaEnabled && !showMfaDisable && (
            <View style={styles.mfaRow}>
              <Text style={styles.mfaStatusText}>
                Status: <Text style={styles.mfaOn}>On</Text>
              </Text>
              <Pressable
                style={({ pressed }) => [styles.mfaBtn, styles.mfaBtnDanger, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => { setShowMfaDisable(true); setMfaDisableCode(""); setMfaError(null); }}
              >
                <Text style={[styles.mfaBtnText, { color: Colors.light.danger }]}>Disable MFA</Text>
              </Pressable>
            </View>
          )}

          {mfaEnabled && showMfaDisable && (
            <View style={styles.mfaSetupContainer}>
              <Text style={styles.mfaInstructions}>Enter your current TOTP code to disable MFA:</Text>
              <TextInput
                style={styles.mfaCodeInput}
                value={mfaDisableCode}
                onChangeText={(t) => setMfaDisableCode(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              {mfaError && <Text style={styles.errorText}>{mfaError}</Text>}
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, { opacity: pressed ? 0.8 : 1 }]}
                onPress={async () => {
                  if (mfaDisableCode.length !== 6) return;
                  setMfaLoading(true);
                  setMfaError(null);
                  try {
                    const resp = await authFetch(`${API_BASE_URL}/mfa/disable`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code: mfaDisableCode }),
                    });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data.detail || "Disable failed");
                    setMfaEnabled(false);
                    setShowMfaDisable(false);
                    setMfaDisableCode("");
                  } catch (e: any) {
                    setMfaError(e?.message || "Invalid code");
                  } finally {
                    setMfaLoading(false);
                  }
                }}
                disabled={mfaDisableCode.length !== 6 || mfaLoading}
              >
                {mfaLoading
                  ? <ActivityIndicator size="small" color={Colors.light.white} />
                  : <Text style={styles.actionBtnText}>Confirm Disable</Text>}
              </Pressable>
              <Pressable onPress={() => { setShowMfaDisable(false); setMfaError(null); }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PasswordInput({ label, value, onChangeText, show, onToggle }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={Colors.light.textMuted}
          autoCapitalize="none"
        />
        <Pressable onPress={onToggle} style={styles.eyeBtn}>
          <Feather name={show ? "eye-off" : "eye"} size={18} color={Colors.light.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontFamily: "DMSans_700Bold", fontSize: 28, color: Colors.light.text },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.light.text },
  formWrap: { paddingBottom: 16, gap: 4 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontFamily: "DMSans_500Medium", fontSize: 13, color: Colors.light.textSecondary, marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 12,
  },
  eyeBtn: { padding: 4 },
  errorText: { fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.light.danger, marginTop: 4 },
  actionBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  actionBtnDanger: { backgroundColor: Colors.light.danger },
  actionBtnText: { fontFamily: "DMSans_600SemiBold", fontSize: 15, color: Colors.light.white },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelBtnText: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.light.textMuted },
  // MFA styles
  mfaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  mfaStatusText: { fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.light.text },
  mfaOff: { fontFamily: "DMSans_600SemiBold", color: Colors.light.textMuted },
  mfaOn: { fontFamily: "DMSans_600SemiBold", color: Colors.light.tint },
  mfaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.light.tint },
  mfaBtnDanger: { borderColor: Colors.light.danger },
  mfaBtnText: { fontFamily: "DMSans_600SemiBold", fontSize: 14, color: Colors.light.tint },
  mfaSetupContainer: { paddingVertical: 12, gap: 12 },
  mfaInstructions: { fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  qrContainer: { alignItems: "center", padding: 16, backgroundColor: Colors.light.background, borderRadius: 12 },
  mfaSecret: { fontFamily: "DMSans_700Bold", fontSize: 14, color: Colors.light.text, letterSpacing: 2, textAlign: "center", backgroundColor: Colors.light.background, padding: 12, borderRadius: 10 },
  mfaCodeInput: { backgroundColor: Colors.light.background, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 12, padding: 14, fontFamily: "DMSans_700Bold", fontSize: 24, color: Colors.light.text, textAlign: "center", letterSpacing: 8 },
});
