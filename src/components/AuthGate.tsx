import { router, useSegments } from "expo-router";
import { type ReactNode, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

type AuthGateProps = {
  children: ReactNode;
};

const PUBLIC_ROUTES = new Set([
  "",
  "about",
  "how-it-works",
  "login",
  "privacy",
  "register",
  "science",
  "terms",
]);

export function AuthGate({ children }: AuthGateProps) {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // Do not make routing decisions until Supabase has checked
    // whether a persisted session exists.
    if (loading) return;

    const currentRoute = segments[0] ?? "";

    const isPublicRoute = PUBLIC_ROUTES.has(currentRoute);

    /*
     * User is NOT authenticated and attempts to access
     * a protected athlete route.
     */
    if (!session && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    /*
     * User IS authenticated and visits login.
     *
     * There is no reason to show the login screen again,
     * so send them to their dashboard.
     */
    if (session && currentRoute === "login") {
      router.replace("/dashboard");
    }
  }, [session, loading, segments]);

  /*
   * While Supabase restores the session, don't briefly render
   * a protected screen or redirect incorrectly.
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
