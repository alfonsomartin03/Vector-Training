import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

export function AppHeader({ initial }: { initial: string }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="link" onPress={() => router.push("/")}>
        <Text style={styles.logo}>VECTOR</Text>
      </Pressable>
      <Pressable accessibilityLabel="Open athlete profile" accessibilityRole="button" onPress={() => router.push("/profile")} style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: theme.layout.appHeaderHeight, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { color: theme.colors.text, fontSize: 18, fontWeight: "800", letterSpacing: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.soft },
  avatarText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
});
