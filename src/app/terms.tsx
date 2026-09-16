import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

export default function TermsPage() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>TERMS</Text>

        <Text style={styles.title}>Training guidance, not medical advice.</Text>

        <Text style={styles.body}>
          Vector provides cycling performance analysis and training guidance
          for informational purposes.
        </Text>

        <Text style={styles.body}>
          Vector is not a medical service and should not replace professional
          medical, health, or physiological advice.
        </Text>
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
    maxWidth: 850,
    paddingHorizontal: 24,
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