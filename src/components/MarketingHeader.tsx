import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { theme } from "../constants/theme";
import Button from "./ui/Button";

const LINKS = [
  { title: "How it works", route: "/how-it-works" },
  { title: "The science", route: "/science" },
  { title: "About", route: "/about" },
] as const;

export function MarketingHeader() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.logo}>VECTOR</Text>
      </Pressable>

      {width >= 768 ? (
        <View style={styles.nav}>
          {LINKS.map(({ title, route }) => (
            <Pressable
              key={route}
              onPress={() => router.push(route)}
              style={({ pressed }) => [
                styles.navLink,
                pressed ? styles.navLinkPressed : undefined,
              ]}
            >
              <Text style={styles.navLinkText}>{title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Button
        title="Log in"
        variant="secondary"
        onPress={() => router.push("/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  logo: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 4,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
    marginLeft: "auto",
    marginRight: 10,
  },
  navLink: {
    paddingVertical: 10,
  },
  navLinkPressed: {
    opacity: 0.65,
  },
  navLinkText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
