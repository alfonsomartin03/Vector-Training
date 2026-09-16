import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

import { router } from "expo-router";

import Button from "../components/ui/Button";
import { theme } from "../constants/theme";

export default function HowItWorksPage() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/")}>
            <Text style={styles.logo}>VECTOR</Text>
          </Pressable>

          {!isMobile ? (
            <View style={styles.nav}>
              <NavLink
                title="How it works"
                onPress={() => router.push("/how-it-works")}
              />

              <NavLink
                title="The science"
                onPress={() => router.push("/science")}
              />

              <NavLink
                title="About"
                onPress={() => router.push("/about")}
              />
            </View>
          ) : null}

          <Button
            title="Log in"
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </View>

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

type NavLinkProps = {
  title: string;
  onPress: () => void;
};

function NavLink({ title, onPress }: NavLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navLink,
        pressed ? styles.navLinkPressed : undefined,
      ]}
    >
      <Text style={styles.navLinkText}>{title}</Text>
    </Pressable>
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