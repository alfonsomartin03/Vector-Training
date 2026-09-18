import { ScrollView, StyleSheet, Text, View } from "react-native";

import { MarketingHeader } from "../components/MarketingHeader";
import { theme } from "../constants/theme";

export default function SciencePage() {
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
          <Text style={styles.eyebrow}>THE SCIENCE</Text>

          <Text style={styles.title}>
            Performance is more than one number.
          </Text>

          <Text style={styles.body}>
            Vector uses multiple characteristics of cycling performance,
            including critical power, W′, power-duration capabilities, and
            aerobic indicators to build a broader athlete profile.
          </Text>

          <Text style={styles.body}>
            Field-based estimates are used to guide training decisions and are
            not a replacement for direct laboratory physiological testing.
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
