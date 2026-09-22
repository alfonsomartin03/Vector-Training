import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "../constants/theme";
import { isStrongPassword, MIN_PASSWORD_LENGTH } from "../lib/accountValidation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = useMemo(
    () => isStrongPassword(password) && password === confirmation,
    [confirmation, password],
  );

  async function updatePassword() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("This reset link may have expired. Request a new link from the login page.");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
        <Text accessibilityRole="header" style={styles.title}>Choose a new password.</Text>
        <Text style={styles.body}>Use at least {MIN_PASSWORD_LENGTH} characters with uppercase, lowercase, a number, and a symbol.</Text>
        <Text style={styles.label}>New password</Text>
        <TextInput accessibilityLabel="New password" secureTextEntry autoCapitalize="none" autoComplete="new-password" value={password} onChangeText={setPassword} maxLength={128} style={styles.input} />
        <Text style={styles.label}>Confirm new password</Text>
        <TextInput accessibilityLabel="Confirm new password" secureTextEntry autoCapitalize="none" autoComplete="new-password" value={confirmation} onChangeText={setConfirmation} onSubmitEditing={updatePassword} maxLength={128} style={styles.input} />
        {confirmation && confirmation !== password ? <Text accessibilityRole="alert" style={styles.error}>Passwords do not match.</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={!valid || busy} onPress={updatePassword} style={[styles.button, (!valid || busy) && styles.disabled]}>
          {busy ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.buttonText}>Update password</Text>}
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}><Text style={styles.link}>Back to login</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: theme.colors.background },
  card: { width: "100%", maxWidth: 520, padding: 28, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, backgroundColor: theme.colors.surface },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  title: { marginTop: 12, color: theme.colors.text, fontSize: 34, lineHeight: 40, fontWeight: "700" },
  body: { marginTop: 10, marginBottom: 24, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21 },
  label: { marginBottom: 7, color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" },
  input: { minHeight: 52, marginBottom: 18, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, color: theme.colors.text, backgroundColor: theme.colors.background },
  error: { marginBottom: 12, color: "#A33A3A", fontSize: 13, lineHeight: 19 },
  button: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: theme.colors.text },
  disabled: { opacity: 0.45 },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: "700" },
  link: { marginTop: 18, color: "#176B59", textAlign: "center", fontWeight: "700" },
});
