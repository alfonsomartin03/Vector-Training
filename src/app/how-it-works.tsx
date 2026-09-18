import { ScrollView, StyleSheet, Text, View } from "react-native";

import { MarketingHeader } from "../components/MarketingHeader";
import { theme } from "../constants/theme";

export default function HowItWorksPage() {
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
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>

          <Text style={styles.title}>
            From performance data to training direction.
          </Text>

          <Text style={styles.body}>
            Vector builds an athlete profile from your performance data,
            identifies strengths and potential limiters, and uses that
            information to guide your current training priority.
          </Text>

          <Text style={styles.body}>
            As your fitness changes, your profile can be reassessed so your
            training direction changes with you.
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
