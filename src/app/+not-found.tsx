import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

export default function NotFoundPage() {
  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>404 · OFF COURSE</Text>
      <Text accessibilityRole="header" style={styles.title}>This route does not exist.</Text>
      <Text style={styles.body}>The page may have moved, or the address may be incorrect. Your training data has not been affected.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.button}>
        <Text style={styles.buttonText}>Return to Vector</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.colors.background },
  eyebrow: { color: theme.colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { marginTop: 16, maxWidth: 650, color: theme.colors.text, fontSize: 44, lineHeight: 50, fontWeight: "700", textAlign: "center" },
  body: { marginTop: 16, maxWidth: 560, color: theme.colors.textSecondary, fontSize: 17, lineHeight: 26, textAlign: "center" },
  button: { minHeight: 48, justifyContent: "center", marginTop: 28, paddingHorizontal: 22, borderRadius: 15, backgroundColor: theme.colors.darkSurface, boxShadow: theme.shadows.soft },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: "700" },
});
