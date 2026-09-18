import { ScrollView, StyleSheet, Text, View } from "react-native";

import { MarketingHeader } from "../components/MarketingHeader";
import { theme } from "../constants/theme";

export default function PrivacyPage() {
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <MarketingHeader />

        {/* Page content */}
        <View style={styles.main}>
          <Text style={styles.eyebrow}>PRIVACY</Text>

          <Text style={styles.title}>
            Your data matters.
          </Text>

          <Text style={styles.body}>
            Vector may collect account, athlete, and performance information
            required to provide personalized training analysis.
          </Text>

          <Text style={styles.body}>
            Vector does not intend to sell personal athlete data. A complete
            privacy policy will be published as the platform develops.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    alignItems: "center",
  },

  container: {
    width: "100%",
    maxWidth: 1120,
    paddingHorizontal: 24,
  },

  main: {
    maxWidth: 850,
    paddingVertical: 100,
  },

  eyebrow: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  title: {
    marginTop: 16,
    color: theme.colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
  },

  body: {
    marginTop: 24,
    color: theme.colors.textSecondary,
    fontSize: 18,
    lineHeight: 30,
  },
});
