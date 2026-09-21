import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";
import { useMemo, useState } from "react";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

import {
  updatePowerProfile,
} from "../lib/athlete";
import { useAthleteData } from "../hooks/useAthleteData";

import { buildAthleteModel } from "../lib/physiology/athleteModel";
import { getTrainingFocusDisplay } from "../lib/training/focus";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const {
    athlete,
    setAthlete,
    refreshAthlete,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useAthleteData(
    user?.id,
    "Unable to load your athlete profile.",
    "Failed to load athlete profile:"
  );

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Power editor state
  const [isEditingPower, setIsEditingPower] = useState(false);
  const [isSavingPower, setIsSavingPower] = useState(false);
  const [powerError, setPowerError] = useState<string | null>(null);

  const [oneMinutePower, setOneMinutePower] = useState("");
  const [fiveMinutePower, setFiveMinutePower] = useState("");
  const [twelveMinutePower, setTwelveMinutePower] = useState("");

  const profile = athlete?.profile;
  const focus = getTrainingFocusDisplay(profile?.training_focus);
  const powerProfile = athlete?.powerProfile;

  const athleteModel = useMemo(
    () => (athlete ? buildAthleteModel(athlete) : null),
    [athlete]
  );

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Athlete";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "A";

  const firstInitial = firstName.charAt(0).toUpperCase() || "A";

  const sport = profile?.primary_sport
    ? formatLabel(profile.primary_sport)
    : "—";

  const athleteLevel = profile?.training_history
    ? formatLabel(profile.training_history)
    : "—";

  const bodyMass =
    profile?.weight_kg != null
      ? `${Number(profile.weight_kg).toFixed(1)} kg`
      : "—";

  const trainingVolume = formatWeeklyVolume(profile?.weekly_volume);

  const profileSubtitle =
    sport !== "—" && athleteLevel !== "—"
      ? `${sport} · ${athleteLevel}`
      : sport !== "—"
        ? sport
        : athleteLevel;

  function handleOpenPowerEditor() {
    if (!powerProfile) return;

    setOneMinutePower(String(powerProfile.one_minute_watts ?? ""));
    setFiveMinutePower(String(powerProfile.five_minute_watts ?? ""));
    setTwelveMinutePower(String(powerProfile.twelve_minute_watts ?? ""));

    setPowerError(null);
    setIsEditingPower(true);
  }

  function handleClosePowerEditor() {
    if (isSavingPower) return;

    setPowerError(null);
    setIsEditingPower(false);
  }

  async function handleSavePower() {
    if (!user) return;

    const oneMinute = Number(oneMinutePower);
    const fiveMinute = Number(fiveMinutePower);
    const twelveMinute = Number(twelveMinutePower);

    if (
      !Number.isFinite(oneMinute) ||
      !Number.isFinite(fiveMinute) ||
      !Number.isFinite(twelveMinute) ||
      oneMinute <= 0 ||
      fiveMinute <= 0 ||
      twelveMinute <= 0
    ) {
      setPowerError("Enter valid power values greater than 0.");
      return;
    }

    try {
      setIsSavingPower(true);
      setPowerError(null);

      const updatedPowerProfile = await updatePowerProfile(user.id, {
        one_minute_watts: oneMinute,
        five_minute_watts: fiveMinute,
        twelve_minute_watts: twelveMinute,
      });

      setAthlete((current) => {
        if (!current) return current;

        return {
          ...current,
          powerProfile: updatedPowerProfile,
        };
      });

      await refreshAthlete();
      setIsEditingPower(false);
    } catch (error) {
      console.error("Failed to update power profile:", error);

      setPowerError(
        "Unable to update your power profile. Please try again."
      );
    } finally {
      setIsSavingPower(false);
    }
  }

  async function handleSignOut() {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSignOutError(null);

      await signOut();

      router.replace("/login");
    } catch (error) {
      console.error("Sign out failed:", error);

      setSignOutError("Unable to sign out. Please try again.");
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
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.push("/")}>
              <Text style={styles.logo}>VECTOR</Text>
            </Pressable>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstInitial}</Text>
            </View>
          </View>

          {/* Profile header */}
          <View style={styles.profileHeader}>
            <View style={styles.largeAvatar}>
              <Text style={styles.largeAvatarText}>{initials}</Text>
            </View>

            <View>
              <Text style={styles.name}>
                {isLoadingProfile ? "Loading..." : fullName}
              </Text>

              <Text style={styles.profileSub}>
                {isLoadingProfile
                  ? "Loading athlete profile..."
                  : profileSubtitle}
              </Text>
            </View>
          </View>

          {profileError ? (
            <View style={styles.profileError}>
              <Text style={styles.profileErrorText}>
                {profileError}
              </Text>
            </View>
          ) : null}

          {/* Quick stats */}
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
              label={athleteModel?.vo2MaxSource === "measured" ? "VO₂max" : "Est. VO₂max"}
              value={
                isLoadingProfile
                  ? "..."
                  : athleteModel
                    ? `${athleteModel.vo2Max.toFixed(1)} mL/kg/min`
                    : "—"
              }
            />
          </View>

          {/* Athlete */}
          <Text style={styles.sectionTitle}>Athlete</Text>

          <View style={styles.card}>
            <Row
              label="Current focus"
              value={isLoadingProfile ? "..." : profileError ? "Focus unavailable" : focus.title}
            />
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

          {/* Current model */}
          <View style={styles.modelSectionHeader}>
            <Text style={styles.modelSectionTitle}>
              Current model
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed ? styles.editButtonPressed : undefined,
                !powerProfile || isLoadingProfile
                  ? styles.editButtonDisabled
                  : undefined,
              ]}
              onPress={handleOpenPowerEditor}
              disabled={!powerProfile || isLoadingProfile}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.modelCard}>
            <View style={styles.modelMetric}>
              <Text style={styles.modelLabel}>1 MIN POWER</Text>

              <Text style={styles.modelValue}>
                {isLoadingProfile
                  ? "..."
                  : powerProfile?.one_minute_watts != null
                    ? `${powerProfile.one_minute_watts} W`
                    : "—"}
              </Text>
            </View>

            <View style={styles.modelDivider} />

            <View style={styles.modelMetric}>
              <Text style={styles.modelLabel}>5 MIN POWER</Text>

              <Text style={styles.modelValue}>
                {isLoadingProfile
                  ? "..."
                  : powerProfile?.five_minute_watts != null
                    ? `${powerProfile.five_minute_watts} W`
                    : "—"}
              </Text>
            </View>

            <View style={styles.modelDivider} />

            <View style={styles.modelMetric}>
              <Text style={styles.modelLabel}>12 MIN POWER</Text>

              <Text style={styles.modelValue}>
                {isLoadingProfile
                  ? "..."
                  : powerProfile?.twelve_minute_watts != null
                    ? `${powerProfile.twelve_minute_watts} W`
                    : "—"}
              </Text>
            </View>
          </View>

          {/* Connections */}
          <Text style={styles.sectionTitle}>Connections</Text>

          <View style={styles.card}>
            <Connection name="Strava" status="Coming soon" />
            <Connection name="Garmin" status="Coming soon" />
            <Connection
              name="Apple Health"
              status="Coming soon"
              last
            />
          </View>

          {/* Account */}
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <Row
              label="Email"
              value={user?.email ?? "—"}
            />

            <Row
              label="Password"
              value="••••••••"
            />

            <Pressable
              style={[
                styles.signOut,
                isSigningOut
                  ? styles.signOutDisabled
                  : undefined,
              ]}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text style={styles.signOutText}>
                {isSigningOut
                  ? "Signing out..."
                  : "Sign out"}
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

      {/* Power editor modal */}
      <Modal
        visible={isEditingPower}
        transparent
        animationType="fade"
        onRequestClose={handleClosePowerEditor}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  Update power profile
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter your current maximal efforts.
                </Text>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={handleClosePowerEditor}
                disabled={isSavingPower}
              >
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>

            <PowerInput
              label="1 minute power"
              value={oneMinutePower}
              onChangeText={setOneMinutePower}
            />

            <PowerInput
              label="5 minute power"
              value={fiveMinutePower}
              onChangeText={setFiveMinutePower}
            />

            <PowerInput
              label="12 minute power"
              value={twelveMinutePower}
              onChangeText={setTwelveMinutePower}
            />

            {powerError ? (
              <Text style={styles.powerError}>
                {powerError}
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleClosePowerEditor}
                disabled={isSavingPower}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  isSavingPower
                    ? styles.saveButtonDisabled
                    : undefined,
                ]}
                onPress={handleSavePower}
                disabled={isSavingPower}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingPower
                    ? "Saving..."
                    : "Save changes"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

type PowerInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

function PowerInput({
  label,
  value,
  onChangeText,
}: PowerInputProps) {
  return (
    <View style={styles.powerInputGroup}>
      <Text style={styles.powerInputLabel}>
        {label}
      </Text>

      <View style={styles.powerInputWrapper}>
        <TextInput
          style={styles.powerInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={
            theme.colors.textSecondary
          }
          selectTextOnFocus
        />

        <Text style={styles.powerUnit}>W</Text>
      </View>
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
          onPress={() =>
            router.push("/dashboard")
          }
        />

        <Nav
          symbol="⌁"
          label="Training"
          onPress={() =>
            router.push("/training")
          }
        />

        <Nav
          symbol="↗"
          label="Power"
          onPress={() =>
            router.push("/power")
          }
        />

        <Nav
          symbol="○"
          label="Profile"
          active
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
    color: theme.colors.text,
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

  modelSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },

  modelSectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
  },

  editButton: {
    minWidth: 58,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 14,
  },

  editButtonPressed: {
    opacity: 0.7,
  },

  editButtonDisabled: {
    opacity: 0.4,
  },

  editButtonText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
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

  profileError: {
    backgroundColor: "#FDECEC",
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 24,
  },

  profileErrorText: {
    color: "#A64E4E",
    fontSize: 12,
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

  // Power editor modal

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  modalHeaderText: {
    flex: 1,
    paddingRight: 20,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  modalClose: {
    color: theme.colors.textSecondary,
    fontSize: 26,
    lineHeight: 28,
  },

  powerInputGroup: {
    marginBottom: 16,
  },

  powerInputLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
  },

  powerInputWrapper: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 14,
  },

  powerInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: 12,
  },

  powerUnit: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },

  powerError: {
    color: "#A64E4E",
    fontSize: 11,
    marginBottom: 14,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },

  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
  },

  saveButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
});
