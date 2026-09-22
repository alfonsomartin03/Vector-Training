import { router, useSegments } from "expo-router";
import { type ReactNode, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

type AuthGateProps = {
  children: ReactNode;
};

const PROTECTED_ROUTES = new Set(["admin", "dashboard", "power", "profile", "training"]);

export function AuthGate({ children }: AuthGateProps) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[0] ?? "";
  const isProtectedRoute = PROTECTED_ROUTES.has(currentRoute);

  useEffect(() => {
    // Do not make routing decisions until Supabase has checked
    // whether a persisted session exists.
    if (loading) return;

    /*
     * User is NOT authenticated and attempts to access
     * a protected athlete route.
     */
    if (!session && isProtectedRoute) {
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
  }, [session, loading, currentRoute, isProtectedRoute]);

  /*
   * While Supabase restores the session, don't briefly render
   * a protected screen or redirect incorrectly.
   */
  // Never mount a protected route without a verified session. Apart from
  // preventing a private-screen flash, this keeps its data hooks from issuing
  // requests while the redirect is still pending.
  if (loading || (!session && isProtectedRoute) || (session && currentRoute === "login")) {
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
