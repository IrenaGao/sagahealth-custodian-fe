import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import Colors from "@/constants/colors";
import { API_BASE_URL } from "@shared/constants";
import { useHSA } from "@/contexts/HSAContext";

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readFileAsBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error("Failed to read file"));
    xhr.responseType = "blob";
    xhr.open("GET", uri);
    xhr.send();
  });
}

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const { authFetch } = useHSA();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function pickFile() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const newFiles: PickedFile[] = result.assets.map((a) => ({
      uri: a.uri,
      name: a.name,
      mimeType: a.mimeType ?? "application/octet-stream",
      size: a.size,
    }));
    setAttachments((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existingNames.has(f.name))];
    });
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!body.trim()) {
      Alert.alert("Message required", "Please describe your issue before submitting.");
      return;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      // Step 1: Create ticket and get upload URLs
      const res = await authFetch(`${API_BASE_URL}/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          attachments: attachments.map((f) => ({
            filename: f.name,
            content_type: f.mimeType,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json() as {
        ticket_id: number;
        attachments: { id: number; upload_url: string }[];
      };

      // Step 2: Upload each file to its upload URL
      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        const info = data.attachments[i];

        const blob = await readFileAsBlob(file.uri);
        // Use authFetch when uploading to our own backend (dev); plain fetch for S3 presigned URLs (prod)
        const uploadFn = info.upload_url.startsWith(API_BASE_URL) ? authFetch : fetch;
        const uploadRes = await uploadFn(info.upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.mimeType },
          body: blob,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Step 3: Confirm the upload (no-op in dev, marks uploaded in prod)
        await authFetch(
          `${API_BASE_URL}/support/tickets/${data.ticket_id}/attachments/${info.id}/confirm`,
          { method: "POST" }
        );
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Ticket submitted",
        "We've received your message and will get back to you shortly.",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Submission failed", err?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={s.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)/accounts");
          }}
          hitSlop={12}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>Describe your issue</Text>
          <TextInput
            style={s.bodyInput}
            placeholder="Tell us what's going on and how we can help..."
            placeholderTextColor={Colors.light.textMuted}
            multiline
            numberOfLines={6}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Attachments</Text>
          <Text style={s.sectionHint}>Attach images or PDF files that help explain the issue.</Text>

          {attachments.map((file, i) => (
            <View key={`${file.name}-${i}`} style={s.attachmentRow}>
              <View style={s.attachmentIcon}>
                <Feather
                  name={file.mimeType === "application/pdf" ? "file-text" : "image"}
                  size={18}
                  color={Colors.light.tint}
                />
              </View>
              <View style={s.attachmentInfo}>
                <Text style={s.attachmentName} numberOfLines={1}>{file.name}</Text>
                {file.size != null && (
                  <Text style={s.attachmentSize}>{formatBytes(file.size)}</Text>
                )}
              </View>
              <Pressable
                onPress={() => removeAttachment(i)}
                hitSlop={8}
                style={s.removeBtn}
              >
                <Feather name="x" size={16} color={Colors.light.textMuted} />
              </Pressable>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [s.addAttachmentBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={pickFile}
          >
            <Feather name="paperclip" size={16} color={Colors.light.tint} />
            <Text style={s.addAttachmentText}>Add attachment</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [s.submitBtn, submitting && s.submitBtnDisabled, { opacity: pressed && !submitting ? 0.85 : 1 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.light.white} size="small" />
          ) : (
            <>
              <Feather name="send" size={16} color={Colors.light.white} />
              <Text style={s.submitBtnText}>Submit ticket</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 24 },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sectionHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: -4,
  },
  bodyInput: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: 12,
    padding: 14,
    minHeight: 140,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentInfo: { flex: 1 },
  attachmentName: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  attachmentSize: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  removeBtn: { padding: 4 },
  addAttachmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: 10,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addAttachmentText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: Colors.light.tint,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: Colors.light.tintMuted },
  submitBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.light.white,
  },
});
