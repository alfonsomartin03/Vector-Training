import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../constants/theme";
import { accountRequest } from "../lib/accounts";

export function AccountDeletePanel({ userId, email, self = false, disabled = false, onBusyChange, onDeleted }: {
  userId: string;
  email: string | null;
  self?: boolean;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onDeleted: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const expected = email ?? userId;

  async function remove() {
    if (busy || disabled || confirmation !== expected || !password) return;
    setBusy(true);
    onBusyChange?.(true);
    setError(null);
    try {
      await accountRequest({ action: self ? "delete-self" : "delete-user", ...(self ? {} : { userId }), confirmation, password });
      setDeleted(true);
      setPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Deletion failed. Please retry.");
      setBusy(false);
      onBusyChange?.(false);
      return;
    }
    // A refresh/sign-out failure must not report that a successful deletion failed.
    try { await onDeleted(); } catch { setError("The account was deleted. Sign out or reload to continue."); }
    finally { setBusy(false); onBusyChange?.(false); }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{self ? "Delete your account" : "Delete this account"}</Text>
      <Text style={styles.copy}>Permanently remove the account, athlete profile, power and laboratory test history, and owned files. This cannot be undone.</Text>
      {deleted ? <Text accessibilityRole="alert" style={styles.copy}>The account and its active data have been deleted.</Text> : open ? <>
        <Text style={styles.copy}>Type {expected} to confirm.</Text>
        <TextInput accessibilityLabel="Account deletion confirmation" autoCapitalize="none" autoCorrect={false} value={confirmation} onChangeText={setConfirmation} editable={!busy && !disabled} style={styles.input} />
        <Text style={styles.copy}>{self ? "Your current password" : "Your admin account password"}</Text>
        <TextInput accessibilityLabel="Current password for deletion" secureTextEntry textContentType="password" autoCapitalize="none" value={password} onChangeText={setPassword} editable={!busy && !disabled} style={styles.input} />
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy || disabled || confirmation !== expected || !password} onPress={remove} style={[styles.button, (busy || disabled || confirmation !== expected || !password) && styles.disabled]}>
            <Text style={styles.buttonText}>{busy ? "Deleting…" : "Permanently delete account"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy || disabled} onPress={() => { setOpen(false); setPassword(""); setConfirmation(""); setError(null); }} style={styles.cancel}><Text>Cancel</Text></Pressable>
        </View>
      </> : <Pressable accessibilityRole="button" disabled={disabled} onPress={() => setOpen(true)} style={styles.cancel}><Text style={styles.danger}>Delete account…</Text></Pressable>}
      {error ? <Text accessibilityRole="alert" style={styles.danger}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: "#E7C8C8", borderRadius: 14, backgroundColor: "#FFF9F9" },
  title: { fontSize: 18, fontWeight: "700", color: theme.colors.text },
  copy: { fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, backgroundColor: "white", color: theme.colors.text },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  button: { backgroundColor: "#A52B2B", borderRadius: 8, padding: 14 },
  buttonText: { color: "white", fontWeight: "700" },
  cancel: { paddingVertical: 12, paddingHorizontal: 4 },
  danger: { color: "#A52B2B", lineHeight: 21 },
  disabled: { opacity: 0.45 },
});
