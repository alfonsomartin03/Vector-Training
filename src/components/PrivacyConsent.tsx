import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

const CONSENT_KEY = "vector.analytics-consent.v1";
type Consent = "accepted" | "declined";

export async function openPrivacyChoices() {
  await AsyncStorage.removeItem(CONSENT_KEY);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.dispatchEvent(new Event("vector:privacy-choices"));
  }
}

function startAnalytics() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const domain = process.env.EXPO_PUBLIC_ANALYTICS_DOMAIN?.trim();
  const scriptUrl = process.env.EXPO_PUBLIC_ANALYTICS_SCRIPT_URL?.trim() || "https://plausible.io/js/script.js";
  if (!domain || document.querySelector("script[data-vector-analytics]")) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = scriptUrl;
  script.dataset.domain = domain;
  script.dataset.vectorAnalytics = "true";
  document.head.appendChild(script);
}

export function PrivacyConsent() {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    const showChoices = () => setConsent(null);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("vector:privacy-choices", showChoices);
    }

    AsyncStorage.getItem(CONSENT_KEY)
      .then((stored) => {
        const value = stored === "accepted" || stored === "declined" ? stored : null;
        setConsent(value);
        if (value === "accepted") startAnalytics();
      })
      .catch(() => setConsent(null));

    return () => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("vector:privacy-choices", showChoices);
      }
    };
  }, []);

  async function choose(value: Consent) {
    setConsent(value);
    await AsyncStorage.setItem(CONSENT_KEY, value);
    if (value === "accepted") startAnalytics();
  }

  if (Platform.OS !== "web" || consent !== null) return null;

  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>Your privacy choices</Text>
        <Text style={styles.body}>
          Vector uses necessary browser storage for sign-in. With your permission, privacy-friendly analytics help us understand site usage. We do not sell personal data.
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/privacy")}>
          <Text style={styles.link}>Read the privacy policy</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => choose("declined")} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Necessary only</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => choose("accepted")} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Allow analytics</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    zIndex: 1000,
    left: 16,
    right: 16,
    bottom: 16,
    maxWidth: 900,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 18,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  copy: { flex: 1, minWidth: 240 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  body: { marginTop: 5, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
  link: { marginTop: 7, color: "#176B59", fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  primaryButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: theme.colors.text },
  secondaryButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  primaryText: { color: theme.colors.white, fontWeight: "700" },
  secondaryText: { color: theme.colors.text, fontWeight: "700" },
});
