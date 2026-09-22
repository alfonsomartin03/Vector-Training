import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

export type AppSection = "home" | "training" | "power" | "profile";

const ITEMS = [
  ["⌂", "Home", "/dashboard", "home"],
  ["⌁", "Training", "/training", "training"],
  ["↗", "Power", "/power", "power"],
  ["○", "Profile", "/profile", "profile"],
] as const;

export function AppBottomNav({ active }: { active: AppSection }) {
  return (
    <View style={styles.wrapper}>
      <View accessibilityRole="tablist" style={styles.nav}>
        {ITEMS.map(([symbol, label, route, key]) => {
          const selected = active === key;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              key={route}
              onPress={() => router.push(route)}
              style={[styles.item, selected && styles.itemActive]}
            >
              <Text aria-hidden style={[styles.symbol, selected && styles.symbolActive]}>{symbol}</Text>
              <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, bottom: 18, alignItems: "center", paddingHorizontal: 18 },
  nav: {
    width: "100%", maxWidth: 520, minHeight: 68, flexDirection: "row", alignItems: "center",
    justifyContent: "space-around", padding: 7, borderRadius: 24, backgroundColor: "#FFFFFFF2",
    borderWidth: 1, borderColor: theme.colors.border, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
  item: { minWidth: 80, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  itemActive: { backgroundColor: theme.colors.accentSoft },
  symbol: { color: theme.colors.textSecondary, fontSize: 18 },
  symbolActive: { color: theme.colors.accent },
  label: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 3 },
  labelActive: { color: theme.colors.text, fontWeight: "600" },
});
