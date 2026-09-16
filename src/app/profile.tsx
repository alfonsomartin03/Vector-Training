import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { useEffect, useState } from "react";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

import { getAthleteData } from "../lib/athlete";
import { AthleteData } from "../types/athlete";

import { estimateVo2Max } from "../lib/physiology/vo2Max";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAthlete(null);
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    async function loadAthlete() {
      try {
        setIsLoadingProfile(true);
        setProfileError(null);

        const athleteData = await getAthleteData(user!.id);

        if (isMounted) {
          setAthlete(athleteData);
        }
      } catch (error) {
        console.error("Failed to load athlete profile:", error);

        if (isMounted) {
          setProfileError(
            "Unable to load your athlete profile."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadAthlete();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const profile = athlete?.profile;
  const powerProfile = athlete?.powerProfile;

  const estimatedVo2Max =
    profile?.weight_kg != null &&
    powerProfile?.five_minute_watts != null
      ? estimateVo2Max(
          Number(powerProfile.five_minute_watts),
          Number(profile.weight_kg)
        )
      : null;

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Athlete";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    "A";

  const firstInitial =
    firstName.charAt(0).toUpperCase() || "A";

  const sport =
    profile?.primary_sport
      ? formatLabel(profile.primary_sport)
      : "—";

  const athleteLevel =
    profile?.training_history
      ? formatLabel(profile.training_history)
      : "—";

  const bodyMass =
    profile?.weight_kg != null
      ? `${Number(profile.weight_kg).toFixed(1)} kg`
      : "—";

  const trainingVolume =
    formatWeeklyVolume(profile?.weekly_volume);

  const profileSubtitle =
    sport !== "—" && athleteLevel !== "—"
      ? `${sport} · ${athleteLevel}`
      : sport !== "—"
        ? sport
        : athleteLevel;

  async function handleSignOut() {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSignOutError(null);

      await signOut();

      router.replace("/login");
    } catch (error) {
      console.error("Sign out failed:", error);

      setSignOutError(
        "Unable to sign out. Please try again."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.push("/")}>
                        <Text style={styles.logo}>VECTOR</Text>
                        </Pressable>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstInitial}
              </Text>
            </View>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.largeAvatar}>
              <Text style={styles.largeAvatarText}>
                {initials}
              </Text>
            </View>

            <View>
              <Text style={styles.name}>
                {isLoadingProfile ? "Loading..." : fullName}
              </Text>

              <Text style={styles.profileSub}>
                {isLoadingProfile ? "Loading athlete profile..." : profileSubtitle}
              </Text>
            </View>
          </View>

          <View style={styles.quickStats}>
            <QuickStat
              label="Body mass"
              value={isLoadingProfile ? "..." : bodyMass}
            />

            <QuickStat
              label="Training"
              value={isLoadingProfile ? "..." : trainingVolume}
            />

            <QuickStat
              label="Est. VO₂max"
              value={
                isLoadingProfile
                  ? "..."
                  : estimatedVo2Max != null
                    ? `${estimatedVo2Max.toFixed(1)} mL/kg/min`
                    : "—"
              }
            />
          </View>

          <Text style={styles.sectionTitle}>
            Athlete
          </Text>

          <View style={styles.card}>
            <Row
              label="Primary sport"
              value={isLoadingProfile ? "..." : sport}
            />

            <Row
              label="Athlete level"
              value={isLoadingProfile ? "..." : athleteLevel}
            />

            <Row
              label="Weekly training"
              value={isLoadingProfile ? "..." : trainingVolume}
            />

            <Row
              label="Max efforts confirmed"
              value={
                isLoadingProfile
                  ? "..."
                  : powerProfile?.maximal_efforts_confirmed
                    ? "Yes"
                    : "No"
              }
              last
            />
          </View>

          <Text style={styles.sectionTitle}>
            Current model
          </Text>

          <View style={styles.modelCard}>
            <View style={styles.modelMetric}>
              <Text style={styles.modelLabel}>
                1 MIN POWER
              </Text>

              <Text style={styles.modelValue}>
                {isLoadingProfile
                  ? "..."
                  : powerProfile
                    ? `${powerProfile.one_minute_watts} W`
                    : "—"}
              </Text>
            </View>

            <View style={styles.modelDivider} />

            <View style={styles.modelMetric}>
              <Text style={styles.modelLabel}>
                5 MIN POWER
              </Text>

              <Text style={styles.modelValue}>
                {isLoadingProfile
                  ? "..."
                  : powerProfile
                    ? `${powerProfile.five_minute_watts} W`
                    : "—"}
              </Text>
            </View>

            <View style={styles.modelDivider} />

            <View style={styles.modelMetric}>
              <Text style={styles.modelLabel}>
                12 MIN POWER
              </Text>

              <Text style={styles.modelValue}>
                {isLoadingProfile
                  ? "..."
                  : powerProfile
                    ? `${powerProfile.twelve_minute_watts} W`
                    : "—"}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Connections
          </Text>

          <View style={styles.card}>
            <Connection
              name="Strava"
              status="Coming soon"
            />

            <Connection
              name="Garmin"
              status="Coming soon"
            />

            <Connection
              name="Apple Health"
              status="Coming soon"
              last
            />
          </View>

          <Text style={styles.sectionTitle}>
            Account
          </Text>

          <View style={styles.card}>
            <Row
              label="Email"
              value={user?.email ?? "-"}
            />

            <Row
              label="Password"
              value="••••••••"
            />

            <Pressable
              style={[
                styles.signOut,
                isSigningOut ? styles.signOutDisabled : undefined,
              ]}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text style={styles.signOutText}>
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Text>
            </Pressable>

            {signOutError ? (
              <Text style={styles.signOutError}>
                {signOutError}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function formatWeeklyVolume(
  volume: string | null | undefined
) {
  switch (volume) {
    case "1-5":
      return "1–5 h/wk";

    case "6-12":
      return "6–12 h/wk";

    case "12+":
      return "12+ h/wk";

    default:
      return "—";
  }
}

type QuickStatProps = {
  label: string;
  value: string;
};

function QuickStat({
  label,
  value,
}: QuickStatProps) {
  return (
    <View style={styles.quickStat}>
      <Text style={styles.quickLabel}>
        {label}
      </Text>

      <Text style={styles.quickValue}>
        {value}
      </Text>
    </View>
  );
}

type RowProps = {
  label: string;
  value: string;
  last?: boolean;
};

function Row({
  label,
  value,
  last,
}: RowProps) {
  return (
    <View
      style={[
        styles.row,
        last ? styles.rowLast : undefined,
      ]}
    >
      <Text style={styles.rowLabel}>
        {label}
      </Text>

      <Text style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

type ConnectionProps = {
  name: string;
  status: string;
  last?: boolean;
};

function Connection({
  name,
  status,
  last,
}: ConnectionProps) {
  return (
    <View
      style={[
        styles.connection,
        last ? styles.rowLast : undefined,
      ]}
    >
      <View>
        <Text style={styles.connectionName}>
          {name}
        </Text>

        <Text style={styles.connectionStatus}>
          {status}
        </Text>
      </View>

      <View style={styles.connectionDot} />
    </View>
  );
}

function BottomNav() {
  return (
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        <Nav
          symbol="⌂"
          label="Home"
          onPress={() => router.push("/dashboard")}
        />

        <Nav
          symbol="⌁"
          label="Training"
          onPress={() => router.push("/training")}
        />

        <Nav
          symbol="↗"
          label="Power"
          onPress={() => router.push("/power")}
        />

        <Nav
          symbol="○"
          label="Profile"
          active
          onPress={() => router.push("/profile")}
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
        active ? styles.navItemActive : undefined,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.navSymbol,
          active ? styles.navSymbolActive : undefined,
        ]}
      >
        {symbol}
      </Text>

      <Text
        style={[
          styles.navLabel,
          active ? styles.navLabelActive : undefined,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scrollContent: {
    paddingBottom: 140,
  },

  container: {
    width: "100%",
    maxWidth: 950,
    alignSelf: "center",
    paddingHorizontal: 24,
  },

  header: {
    height: 90,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontWeight: "700",
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingTop: 44,
    paddingBottom: 38,
  },

  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.text,
  },

  largeAvatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: "600",
  },

  name: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -1,
  },

  profileSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  location: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  quickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 48,
  },

  quickStat: {
    flex: 1,
    minWidth: 180,
    padding: 18,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  quickLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },

  quickValue: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 5,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 28,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    overflow: "hidden",
  },

  row: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  rowLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  rowValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "500",
  },

  modelCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 25,
  },

  modelMetric: {
    flex: 1,
    alignItems: "center",
  },

  modelDivider: {
    width: 1,
    backgroundColor: "#303534",
  },

  modelLabel: {
    color: "#808784",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  modelValue: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 6,
  },

  goalCard: {
    padding: 23,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
  },

  goalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  goalEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
  },

  goalTitle: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "600",
    marginTop: 6,
  },

  goalArrow: {
    color: theme.colors.accent,
    fontSize: 24,
  },

  goalDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
  },

  connection: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  connectionName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },

  connectionStatus: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },

  signOut: {
    minHeight: 61,
    alignItems: "center",
    justifyContent: "center",
  },

  signOutDisabled: {
  opacity: 0.5,
},

signOutError: {
  color: "#A64E4E",
  fontSize: 11,
  textAlign: "center",
  paddingHorizontal: 20,
  paddingBottom: 16,
},

  signOutText: {
    color: "#A64E4E",
    fontSize: 12,
    fontWeight: "600",
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
    padding: 7,
    borderRadius: 24,
    backgroundColor: "#FFFFFFF2",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  navItem: {
    minWidth: 80,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  navItemActive: {
    backgroundColor: theme.colors.accentSoft,
  },

  navSymbol: {
    color: theme.colors.textSecondary,
    fontSize: 18,
  },

  navSymbolActive: {
    color: theme.colors.accent,
  },

  navLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  navLabelActive: {
    color: theme.colors.text,
    fontWeight: "600",
  },

  profileError: {
    backgroundColor: "#FDECEC",
    borderRadius: theme.radius.md,
    padding: 14,
    marginTop: 20,
  },

  profileErrorText: {
    color: "#A64E4E",
    fontSize: 12,
  },
});
