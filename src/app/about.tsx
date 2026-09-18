import { ScrollView, StyleSheet, Text, View } from "react-native";

import { MarketingHeader } from "../components/MarketingHeader";
import { theme } from "../constants/theme";

export default function AboutPage() {
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
          <Text style={styles.eyebrow}>ABOUT VECTOR</Text>

          <Text style={styles.title}>
            Training should tell you what to do next.
          </Text>

          <Text style={styles.body}>
            Vector is a cycling performance project focused on turning athlete
            data into clear training priorities.
          </Text>

          <Text style={styles.body}>
            Instead of simply displaying more metrics, Vector aims to help
            athletes understand their strengths, weaknesses, and current
            direction for improvement.
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
