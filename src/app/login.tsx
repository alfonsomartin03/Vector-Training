import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { theme } from "../constants/theme";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    // Prevent multiple login requests
    if (isLoading) return;

    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    // Basic validation
    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInError) {
        console.error("Login error:", signInError);

        setError(
          signInError.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : signInError.message
        );

        return;
      }

      if (!data.session) {
        setError("Unable to create a login session.");
        return;
      }

      // Successful login
      router.replace("/dashboard");
    } catch (err) {
      console.error("Unexpected login error:", err);

      setError(
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View
        style={[
          styles.container,
          isMobile ? styles.containerMobile : undefined,
        ]}
      >
        {!isMobile ? (
          <View style={styles.brandSide}>
            <Pressable onPress={() => router.push("/")}>
              <Text style={styles.logo}>VECTOR</Text>
            </Pressable>

            <View style={styles.brandMessage}>
              <Text style={styles.eyebrow}>
                TRAINING, IN THE RIGHT DIRECTION.
              </Text>

              <Text style={styles.brandTitle}>
                Know what to train next.
              </Text>

              <Text style={styles.brandDescription}>
                Vector turns your performance data into clear,
                individualized training decisions.
              </Text>
            </View>

            <Text style={styles.brandFooter}>
              Adaptive cycling training
            </Text>
          </View>
        ) : null}

        <View style={styles.formSide}>
          <View style={styles.form}>
            {isMobile ? (
              <Pressable onPress={() => router.push("/")}>
                <Text style={styles.mobileLogo}>VECTOR</Text>
              </Pressable>
            ) : null}

            <Text style={styles.title}>Welcome back.</Text>

            <Text style={styles.subtitle}>
              Sign in to continue your training.
            </Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#A0A5A3"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0A5A3"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable
              style={styles.forgotButton}
              onPress={() => {}}
              disabled={isLoading}
            >
              <Text style={styles.forgotText}>
                Forgot your password?
              </Text>
            </Pressable>

            {/* Authentication error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign in */}
            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                (pressed || isLoading) &&
                  styles.signInButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.signInText}>Sign in</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />

              <Text style={styles.dividerText}>or</Text>

              <View style={styles.divider} />
            </View>

            <Pressable
              style={styles.createButton}
              onPress={() => router.push("/register")}
              disabled={isLoading}
            >
              <Text style={styles.createText}>
                Create an account
              </Text>
            </Pressable>

            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/")}
              disabled={isLoading}
            >
              <Text style={styles.backText}>
                ← Back to Vector
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    flexDirection: "row",
  },

  containerMobile: {
    flexDirection: "column",
  },

  brandSide: {
    flex: 1,
    backgroundColor: theme.colors.text,
    padding: 48,
    justifyContent: "space-between",
  },

  logo: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },

  brandMessage: {
    maxWidth: 520,
  },

  eyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },

  brandTitle: {
    color: theme.colors.white,
    fontSize: 52,
    lineHeight: 57,
    fontWeight: "700",
    letterSpacing: -2,
    marginTop: 16,
  },

  brandDescription: {
    color: "#AEB5B2",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 20,
  },

  brandFooter: {
    color: "#767D7A",
    fontSize: 12,
  },

  formSide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  form: {
    width: "100%",
    maxWidth: 420,
  },

  mobileLogo: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 70,
  },

  title: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1.2,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 10,
    marginBottom: 38,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 14,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 24,
  },

  forgotText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  errorContainer: {
    backgroundColor: "#FDECEC",
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
  },

  errorText: {
    color: "#A63D40",
    fontSize: 12,
    lineHeight: 18,
  },

  signInButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text,
  },

  signInButtonDisabled: {
    opacity: 0.65,
  },

  signInText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },

  dividerText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginHorizontal: 12,
  },

  createButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  createText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  backButton: {
    alignSelf: "center",
    marginTop: 30,
  },

  backText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});