import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function RegisterPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your profile</Text>

      <Text
        style={styles.back}
        onPress={() => router.back()}
      >
        ← Back
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8F6",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111315",
  },

  back: {
    marginTop: 24,
    fontSize: 16,
    color: "#2FB89D",
  },
});