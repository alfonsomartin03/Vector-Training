import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { router } from "expo-router";
import {
  useMemo,
} from "react";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

import { useAthleteData } from "../hooks/useAthleteData";
import { buildAthleteModel } from "../lib/physiology/athleteModel";

export default function DashboardPage() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const isMobile = width < 700;

  const { athlete, isLoading, error } = useAthleteData(
    user?.id,
    "Unable to load your athlete profile.",
    "Failed to load dashboard athlete:"
  );

  const model = useMemo(() => {
    if (!athlete) {
      return null;
    }

    return buildAthleteModel(athlete);
  }, [athlete]);

  const profile = athlete?.profile;

  const firstName =
    profile?.first_name?.trim() || "Athlete";

  const firstInitial =
    firstName.charAt(0).toUpperCase();

  const greeting = getGreeting();

  const lastUpdated =
    formatRecordedDate(
      model?.recordedAt ?? null
    );

  const cpWattsPerKg =
    model
      ? model.cpWatts /
        model.inputs.weightKg
      : null;

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <View
          style={[
            styles.container,
            isMobile
              ? styles.containerMobile
              : undefined,
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              onPress={() =>
                router.push("/")
              }
            >
              <Text style={styles.logo}>
                VECTOR
              </Text>
            </Pressable>

            <Pressable
              style={styles.profileCircle}
              onPress={() =>
                router.push("/profile")
              }
            >
              <Text
                style={styles.profileInitial}
              >
                {firstInitial}
              </Text>
            </Pressable>
          </View>

          {/* WELCOME */}
          <View style={styles.welcome}>
            <Text
              style={styles.welcomeOverline}
            >
              {greeting}
            </Text>

            <Text
              style={styles.welcomeTitle}
            >
              Welcome back, {firstName}.
            </Text>

            <Text
              style={styles.welcomeSubtitle}
            >
              {isLoading
                ? "Loading your current physiology."
                : model
                  ? "Your current physiology model is ready."
                  : "Add maximal power efforts to build your physiology model."}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* PROFILE HEADER */}
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={styles.sectionOverline}
              >
                CURRENT PROFILE
              </Text>

              <Text
                style={styles.sectionTitle}
              >
                Your physiology
              </Text>
            </View>

            {model ? (
              <View style={styles.updatedPill}>
                <View
                  style={styles.updatedDot}
                />

                <Text
                  style={styles.updatedText}
                >
                  {lastUpdated}
                </Text>
              </View>
            ) : null}
          </View>

          {/* METRICS */}
          <View
            style={[
              styles.metricsGrid,
              isMobile
                ? styles.metricsGridMobile
                : undefined,
            ]}
          >
            <MetricCard
              label="Critical Power"
              value={
                isLoading
                  ? "..."
                  : model
                    ? `${Math.round(
                        model.cpWatts
                      )}`
                    : "—"
              }
              unit="W"
              secondary={
                cpWattsPerKg != null
                  ? `${cpWattsPerKg.toFixed(
                      2
                    )} W/kg`
                  : undefined
              }
              onPress={() =>
                router.push("/power")
              }
            />

            <MetricCard
              label="W′"
              value={
                isLoading
                  ? "..."
                  : model
                    ? model.wPrimeKj.toFixed(
                        1
                      )
                    : "—"
              }
              unit="kJ"
              secondary={
                model
                  ? "Anaerobic work capacity"
                  : undefined
              }
              onPress={() =>
                router.push("/power")
              }
            />

            <MetricCard
              label={model?.vo2MaxSource === "measured" ? "VO₂max" : "Est. VO₂max"}
              value={
                isLoading
                  ? "..."
                  : model
                    ? model.vo2Max.toFixed(1)
                    : "—"
              }
              unit=""
              secondary={
                model
                  ? `${model.vo2MaxSource === "measured" ? "Measured" : "Estimated"} · mL/kg/min`
                  : undefined
              }
              onPress={() =>
                router.push("/power")
              }
            />
          </View>

          {/* MODEL STATUS */}
          <View style={styles.directionCard}>
            <View style={styles.directionTop}>
              <View style={styles.directionHeading}>
                <Text
                  style={
                    styles.directionOverline
                  }
                >
                  VECTOR MODEL
                </Text>

                <Text
                  style={styles.directionTitle}
                >
                  {model
                    ? "Current profile"
                    : "Profile incomplete"}
                </Text>
              </View>

              <View
                style={styles.directionIcon}
              >
                <Text
                  style={styles.directionArrow}
                >
                  {model ? "↗" : "—"}
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.directionDescription
              }
            >
              {model
                ? `Vector currently estimates your Critical Power at ${Math.round(
                    model.cpWatts
                  )} W with ${model.wPrimeKj.toFixed(
                    1
                  )} kJ of W′. Your physiology model is derived from your recorded maximal power efforts.`
                : "Vector needs valid maximal power efforts before it can construct your physiology model."}
            </Text>

            <View
              style={styles.directionFooter}
            >
              <Text
                style={
                  styles.directionFooterLabel
                }
              >
                Model
              </Text>

              <Text
                style={
                  styles.directionFooterValue
                }
              >
                {model
                  ? "Morton 3-parameter power-duration model"
                  : "Waiting for power data"}
              </Text>
            </View>
          </View>

          {/* TRAINING HEADER */}
          <View style={styles.trainingHeader}>
            <View>
              <Text
                style={styles.sectionOverline}
              >
                TRAINING
              </Text>

              <Text
                style={styles.sectionTitle}
              >
                What’s next
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push("/training")
              }
            >
              <Text style={styles.viewWeek}>
                View training →
              </Text>
            </Pressable>
          </View>

          {/* TRAINING PLACEHOLDER */}
          <View style={styles.trainingCard}>
            <View style={styles.trainingIcon}>
              <Text
                style={
                  styles.trainingIconText
                }
              >
                ↗
              </Text>
            </View>

            <View
              style={styles.trainingContent}
            >
              <Text
                style={
                  styles.trainingCardOverline
                }
              >
                TRAINING ENGINE
              </Text>

              <Text
                style={styles.trainingCardTitle}
              >
                Training recommendations
              </Text>

              <Text
                style={
                  styles.trainingCardDescription
                }
              >
                Your physiology data will be
                used to build individualized
                training once your training
                model is configured.
              </Text>

              <Pressable
                style={
                  styles.trainingButton
                }
                onPress={() =>
                  router.push("/training")
                }
              >
                <Text
                  style={
                    styles.trainingButtonText
                  }
                >
                  View training
                </Text>

                <Text
                  style={
                    styles.trainingButtonArrow
                  }
                >
                  →
                </Text>
              </Pressable>
            </View>
          </View>

          {/* VECTOR INSIGHT */}
          <View style={styles.insight}>
            <View
              style={styles.insightMarker}
            />

            <View
              style={styles.insightContent}
            >
              <Text
                style={
                  styles.insightOverline
                }
              >
                VECTOR INSIGHT
              </Text>

              <Text
                style={styles.insightText}
              >
                {model ? (
                  <>
                    Your current model estimates{" "}
                    <Text
                      style={
                        styles.insightHighlight
                      }
                    >
                      {Math.round(
                        model.cpWatts
                      )} W
                    </Text>{" "}
                    of Critical Power and{" "}
                    <Text
                      style={
                        styles.insightHighlight
                      }
                    >
                      {model.wPrimeKj.toFixed(
                        1
                      )} kJ
                    </Text>{" "}
                    of W′. As Vector collects
                    historical profiles, this
                    area can identify meaningful
                    changes in your physiology.
                  </>
                ) : (
                  "Add valid power data to begin building your Vector physiology profile."
                )}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Helper Components                             */
/* -------------------------------------------------------------------------- */

type MetricCardProps = {
  label: string;
  value: string;
  unit: string;
  secondary?: string;
  onPress?: () => void;
};

function MetricCard({
  label,
  value,
  unit,
  secondary,
  onPress,
}: MetricCardProps) {
  return (
    <Pressable
      style={styles.metricCard}
      onPress={onPress}
    >
      <View
        style={styles.metricCardHeader}
      >
        <Text style={styles.metricLabel}>
          {label}
        </Text>

        <Text style={styles.metricArrow}>
          →
        </Text>
      </View>

      <View
        style={styles.metricValueRow}
      >
        <Text style={styles.metricValue}>
          {value}
        </Text>

        {unit ? (
          <Text style={styles.metricUnit}>
            {unit}
          </Text>
        ) : null}
      </View>

      <Text
        style={styles.metricSecondary}
      >
        {secondary ?? "Current estimate"}
      </Text>

      <View style={styles.metricLine}>
        <View
          style={styles.metricLineAccent}
        />
      </View>
    </Pressable>
  );
}

type NavKey =
  | "home"
  | "training"
  | "power"
  | "profile";

type BottomNavProps = {
  active: NavKey;
};

function BottomNav({
  active,
}: BottomNavProps) {
  return (
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        <Nav
          symbol="⌂"
          label="Home"
          active={active === "home"}
          onPress={() =>
            router.push("/dashboard")
          }
        />

        <Nav
          symbol="⌁"
          label="Training"
          active={
            active === "training"
          }
          onPress={() =>
            router.push("/training")
          }
        />

        <Nav
          symbol="↗"
          label="Power"
          active={active === "power"}
          onPress={() =>
            router.push("/power")
          }
        />

        <Nav
          symbol="○"
          label="Profile"
          active={
            active === "profile"
          }
          onPress={() =>
            router.push("/profile")
          }
        />
      </View>
    </View>
  );
}

type NavProps = {
  symbol: string;
  label: string;
  active?: boolean;
  onPress: () => void;
};

function Nav({
  symbol,
  label,
  active,
  onPress,
}: NavProps) {
  return (
    <Pressable
      style={[
        styles.navItem,
        active
          ? styles.navItemActive
          : undefined,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.navSymbol,
          active
            ? styles.navSymbolActive
            : undefined,
        ]}
      >
        {symbol}
      </Text>

      <Text
        style={[
          styles.navLabel,
          active
            ? styles.navLabelActive
            : undefined,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "GOOD MORNING";
  }

  if (hour < 18) {
    return "GOOD AFTERNOON";
  }

  return "GOOD EVENING";
}

function formatRecordedDate(
  recordedAt: string | null
) {
  if (!recordedAt) {
    return "Current";
  }

  const date = new Date(recordedAt);

  if (Number.isNaN(date.getTime())) {
    return "Current";
  }

  const today = new Date();

  const isToday =
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate();

  if (isToday) {
    return "Updated today";
  }

  return `Updated ${date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  )}`;
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  scrollContent: {
    paddingBottom: 150,
  },

  container: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 32,
  },

  containerMobile: {
    paddingHorizontal: 18,
  },

  header: {
    height: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },

  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  profileInitial: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  welcome: {
    paddingTop: 48,
    paddingBottom: 64,
  },

  welcomeOverline: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  welcomeTitle: {
    color: theme.colors.text,
    fontSize: 42,
    lineHeight: 47,
    fontWeight: "700",
    letterSpacing: -1.6,
  },

  welcomeSubtitle: {
    color:
      theme.colors.textSecondary,
    fontSize: 17,
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: "#FDECEC",
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 24,
  },

  errorText: {
    color: "#A64E4E",
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },

  sectionOverline: {
    color:
      theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 6,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: -0.7,
  },

  updatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  updatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.accent,
  },

  updatedText: {
    color:
      theme.colors.textSecondary,
    fontSize: 11,
  },

  metricsGrid: {
    flexDirection: "row",
    gap: 14,
  },

  metricsGridMobile: {
    flexDirection: "column",
  },

  metricCard: {
    flex: 1,
    minHeight: 190,
    padding: 22,
    borderRadius: 20,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  metricCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
  },

  metricArrow: {
    color: theme.colors.accent,
    fontSize: 16,
  },

  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },

  metricValue: {
    color: theme.colors.text,
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1.6,
  },

  metricUnit: {
    marginLeft: 5,
    color:
      theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  metricSecondary: {
    color:
      theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  metricLine: {
    height: 4,
    marginTop: 24,
    borderRadius: 999,
    backgroundColor:
      theme.colors.accentSoft,
    overflow: "hidden",
  },

  metricLineAccent: {
    width: "34%",
    height: "100%",
    borderRadius: 999,
    backgroundColor:
      theme.colors.accent,
  },

  directionCard: {
    marginTop: 18,
    padding: 28,
    borderRadius: 22,
    backgroundColor:
      theme.colors.text,
  },

  directionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  directionHeading: {
    flex: 1,
    paddingRight: 20,
  },

  directionOverline: {
    color: "#AEB6B3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  directionTitle: {
    color: theme.colors.white,
    fontSize: 27,
    fontWeight: "600",
    marginTop: 7,
    letterSpacing: -0.7,
  },

  directionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24332F",
  },

  directionArrow: {
    color: theme.colors.accent,
    fontSize: 24,
  },

  directionDescription: {
    maxWidth: 720,
    marginTop: 22,
    color: "#BFC5C2",
    fontSize: 15,
    lineHeight: 24,
  },

  directionFooter: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2A2E2E",
  },

  directionFooterLabel: {
    color: "#808785",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  directionFooterValue: {
    marginTop: 4,
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "500",
  },

  trainingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 70,
    marginBottom: 20,
  },

  viewWeek: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },

  trainingCard: {
    minHeight: 190,
    flexDirection: "row",
    padding: 26,
    borderRadius: 22,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  trainingIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      theme.colors.accentSoft,
    marginRight: 20,
  },

  trainingIconText: {
    color: theme.colors.accent,
    fontSize: 21,
  },

  trainingContent: {
    flex: 1,
  },

  trainingCardOverline: {
    color:
      theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  trainingCardTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 5,
  },

  trainingCardDescription: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
    maxWidth: 620,
  },

  trainingButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },

  trainingButtonText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  trainingButtonArrow: {
    color: theme.colors.accent,
    fontSize: 17,
  },

  insight: {
    flexDirection: "row",
    marginTop: 22,
    padding: 24,
    borderRadius: 18,
    backgroundColor:
      theme.colors.accentSoft,
  },

  insightMarker: {
    width: 3,
    borderRadius: 999,
    backgroundColor:
      theme.colors.accent,
    marginRight: 18,
  },

  insightContent: {
    flex: 1,
  },

  insightOverline: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  insightText: {
    marginTop: 7,
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  insightHighlight: {
    color: theme.colors.text,
    fontWeight: "700",
  },

  navWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 22,
    alignItems: "center",
    paddingHorizontal: 18,
  },

  nav: {
    width: "100%",
    maxWidth: 520,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: "#FFFFFFF2",
    borderWidth: 1,
    borderColor: "#E1E4E1",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },

  navItem: {
    minWidth: 80,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  navItemActive: {
    backgroundColor:
      theme.colors.accentSoft,
  },

  navSymbol: {
    color:
      theme.colors.textSecondary,
    fontSize: 18,
    lineHeight: 20,
  },

  navSymbolActive: {
    color: theme.colors.accent,
  },

  navLabel: {
    color:
      theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
    marginTop: 3,
  },

  navLabelActive: {
    color: theme.colors.text,
    fontWeight: "600",
  },
});
