import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import Colors from "@/constants/colors";
import { webTopInsetBase, webBottomPadding } from "@/lib/platform";
import { API_BASE_URL } from "@shared/constants";
import { useHSA } from "@/contexts/HSAContext";
import { LinkedBankAccountsModal } from "./(tabs)/accounts";

export default function AccountDetailsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? webTopInsetBase : 0;
  const {
    userName,
    userEmail, setUserEmail,
    userPhone, setUserPhone,
    userPhoneExtension, setUserPhoneExtension,
    userAddress, setUserAddress,
    linkedBankAccounts,
    addLinkedBankAccount,
    removeLinkedBankAccount,
    setPrimaryBankAccount,
    authFetch,
  } = useHSA();

  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [editField, setEditField] = useState<"email" | "phone" | "address" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [extensionEnabled, setExtensionEnabled] = useState(false);
  const [extensionValue, setExtensionValue] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // userPhone is stored as raw 10-digit string to match Lynx API phoneNumber field
  const formatPhoneNumber = (digits: string): string => {
    const d = digits.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const fieldConfig = {
    email: { label: "Email", placeholder: "your@email.com", keyboardType: "email-address" as const, current: userEmail || "" },
    phone: { label: "Phone Number", placeholder: "(555) 000-0000", keyboardType: "phone-pad" as const, current: formatPhoneNumber(userPhone) },
    address: { label: "Address", placeholder: "123 Main St, City, ST 12345", keyboardType: "default" as const, current: userAddress },
  };

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setEditValue(formatPhoneNumber(digits));
  };

  const openEdit = (field: "email" | "phone" | "address") => {
    setEditValue(fieldConfig[field].current);
    if (field === "phone") {
      setExtensionEnabled(!!userPhoneExtension);
      setExtensionValue(userPhoneExtension || "");
    }
    // Generate idempotency key at the moment the user opens the edit modal so
    // retries from the same edit session reuse the same key.
    setIdempotencyKey(uuidv4());
    setEditField(field);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const saveEdit = async () => {
    if (editField === "email") {
      setUserEmail(editValue);
      await authFetch(`${API_BASE_URL}/member/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: editValue.trim(), idempotencyKey }),
      });
    }
    if (editField === "phone") {
      const rawPhone = editValue.replace(/\D/g, "");
      const rawExt = extensionEnabled ? extensionValue.replace(/\D/g, "") : "";
      setUserPhone(rawPhone);
      setUserPhoneExtension(rawExt);
      await authFetch(`${API_BASE_URL}/member/phone`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: rawPhone,
          ...(rawExt ? { phoneExtension: parseInt(rawExt, 10) } : {}),
          idempotencyKey,
        }),
      });
    }
    if (editField === "address") {
      setUserAddress(editValue);
      const parts = editValue.split(",").map((s) => s.trim());
      const line1 = parts[0] ?? "";
      const city = parts[1] ?? "";
      const stateZip = parts[2] ?? "";
      const [stateProvince, postalCode] = stateZip.split(" ").filter(Boolean);
      await authFetch(`${API_BASE_URL}/member/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line1, city, stateProvince: stateProvince ?? "", postalCode: postalCode ?? "", idempotencyKey }),
      });
    }
    setEditField(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Account Details</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? webBottomPadding : Platform.OS === "android" ? insets.bottom * 2.8 : undefined }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.section}>
          <DetailRow icon="user" label="Account Holder" value={userName || "Alex"} />
          <DetailRow icon="calendar" label="Plan Year" value="2026" />
          <DetailRow icon="shield" label="Account Type" value="Individual" />
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              setShowBankAccounts(true);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
          >
            <View style={styles.left}>
              <Feather name="link" size={18} color={Colors.light.textSecondary} />
              <Text style={styles.label}>Linked Accounts</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.value}>{linkedBankAccounts.length} bank{linkedBankAccounts.length !== 1 ? "s" : ""}</Text>
              <Feather name="chevron-right" size={18} color={Colors.light.textMuted} />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <EditableRow
            icon="mail"
            label="Email"
            value={userEmail || "Not set"}
            onPress={() => openEdit("email")}
          />
          <EditableRow
            icon="phone"
            label="Phone Number"
            value={userPhone ? (userPhoneExtension ? `${formatPhoneNumber(userPhone)} ext. ${userPhoneExtension}` : formatPhoneNumber(userPhone)) : "Not set"}
            onPress={() => openEdit("phone")}
          />
          <EditableRow
            icon="map-pin"
            label="Address"
            value={userAddress || "Not set"}
            onPress={() => openEdit("address")}
            last
          />
        </View>
      </ScrollView>

      <LinkedBankAccountsModal
        visible={showBankAccounts}
        onClose={() => setShowBankAccounts(false)}
        accounts={linkedBankAccounts}
        onAdd={addLinkedBankAccount}
        onRemove={removeLinkedBankAccount}
        onSetPrimary={setPrimaryBankAccount}
      />

      <Modal visible={editField !== null} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={modalStyles.overlay} keyboardVerticalOffset={0}>
          <View style={[modalStyles.container, { paddingBottom: insets.bottom + 20 }]}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>
                {editField ? `Edit ${fieldConfig[editField].label}` : ""}
              </Text>
              <Pressable onPress={() => setEditField(null)}>
                <Feather name="x" size={24} color={Colors.light.text} />
              </Pressable>
            </View>

            <TextInput
              style={modalStyles.input}
              value={editValue}
              onChangeText={editField === "phone" ? handlePhoneChange : setEditValue}
              placeholder={editField ? fieldConfig[editField].placeholder : ""}
              placeholderTextColor={Colors.light.textMuted}
              keyboardType={editField ? fieldConfig[editField].keyboardType : "default"}
              autoFocus
              autoCapitalize={editField === "email" ? "none" : "words"}
            />

            {editField === "phone" && (
              <View style={modalStyles.extensionRow}>
                <View style={modalStyles.extensionLabel}>
                  <Text style={modalStyles.extensionLabelText}>Has extension</Text>
                </View>
                <Switch
                  value={extensionEnabled}
                  onValueChange={(val) => {
                    setExtensionEnabled(val);
                    if (!val) setExtensionValue("");
                  }}
                  trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                  thumbColor={Colors.light.white}
                />
              </View>
            )}

            {editField === "phone" && extensionEnabled && (
              <TextInput
                style={[modalStyles.input, { marginTop: 12 }]}
                value={extensionValue}
                onChangeText={(text) => setExtensionValue(text.replace(/\D/g, ""))}
                placeholder="Extension (e.g. 123)"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="number-pad"
              />
            )}

            <Pressable
              style={({ pressed }) => [
                modalStyles.saveBtn,
                { opacity: pressed ? 0.8 : 1, backgroundColor: editValue.trim() ? Colors.light.tint : Colors.light.border },
              ]}
              onPress={saveEdit}
            >
              <Text style={modalStyles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Feather name={icon as any} size={18} color={Colors.light.textSecondary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function EditableRow({ icon, label, value, onPress, last }: { icon: string; label: string; value: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, last && styles.rowLast, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <Feather name={icon as any} size={18} color={Colors.light.textSecondary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.value, { maxWidth: 180 }]} numberOfLines={1}>{value}</Text>
        <Feather name="chevron-right" size={18} color={Colors.light.textMuted} />
      </View>
    </Pressable>
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
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: Colors.light.white,
  },
  extensionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  extensionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  extensionLabelText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
});
