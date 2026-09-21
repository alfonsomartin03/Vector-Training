import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useAthleteData } from "../hooks/useAthleteData";
import { getTrainingFocusDisplay } from "../lib/training/focus";
import { useTrainingAvailability } from "../hooks/useTrainingAvailability";
import { TrainingAvailabilityEditor } from "../components/TrainingAvailabilityEditor";
import { prescribeWeek, weekKey } from "../lib/training/prescription";
import {
  buildWeeklyTrainingPlan,
  resolveDayWorkout,
  toLocalDateKey,
  type TrainingDayPlan,
} from "../lib/training/weeklyPlan";

export default function TrainingPage() {
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const { user } = useAuth();
  const { athlete, isLoading, error } = useAthleteData(
    user?.id, "Unable to load your training focus.", "Failed to load training focus:",
  );
  const focus = getTrainingFocusDisplay(athlete?.profile.training_focus);
  const focusTitle = isLoading ? "Loading…" : error ? "Focus unavailable" : focus.title;
  const [weekOffset, setWeekOffset] = useState(0);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const reference = new Date();
  reference.setDate(reference.getDate() + weekOffset * 7);
  const selectedWeek = weekKey(reference);
  const availability = useTrainingAvailability(user?.id, selectedWeek);
  const prescription = useMemo(() => prescribeWeek(athlete, availability.availability, new Date(`${selectedWeek}T12:00:00`)), [athlete, availability.availability, selectedWeek]);
  const week = useMemo(
    () => buildWeeklyTrainingPlan(new Date(`${selectedWeek}T12:00:00`), prescription.assignments),
    [selectedWeek, prescription.assignments]
  );
  const displayWeek = { ...week, days: week.days.map(day => ({ ...day, isToday: day.dateKey === toLocalDateKey(new Date()) })) };
  const today = displayWeek.days.find((day) => day.isToday) ?? displayWeek.days[0];
  const [selectedDateKey, setSelectedDateKey] = useState(today.dateKey);
  const selectedDay =
    displayWeek.days.find((day) => day.dateKey === selectedDateKey) ?? today;

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
            <Pressable style={styles.avatar} onPress={() => router.push("/profile")}>
              <Text style={styles.avatarText}>A</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TRAINING</Text>
            <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>
              This week’s direction.
            </Text>
            <Text style={styles.subtitle}>
              A clear view of your focus and daily plan.
            </Text>
          </View>

          <View style={[styles.focusCard, compact ? styles.focusCardCompact : undefined]}>
            <View style={styles.focusContent}>
              <Text style={styles.focusEyebrow}>CURRENT FOCUS</Text>
              <Text style={styles.focusTitle}>{focusTitle}</Text>
              <Text style={styles.focusDescription}>
                {isLoading ? "Loading your athlete profile…" : error ?? focus.description}
              </Text>
            </View>
            <View style={styles.focusPill}>
              <Text style={styles.focusPillText}>{athlete?.profile.training_focus?.tag && !error ? "PROVISIONAL FOCUS" : "ASSESSMENT"}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Pressable accessibilityRole="button" disabled={availability.saving} onPress={() => setWeekOffset(0)}><Text>This week</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={availability.saving} onPress={() => setWeekOffset(1)}><Text>Next week</Text></Pressable>
            <Text>{selectedWeek}</Text>
          </View>
          {availability.loading ? <Text>Loading availability…</Text> : availability.error ? <View><Text accessibilityRole="alert">{availability.error}</Text><Pressable accessibilityRole="button" onPress={availability.reload}><Text>Retry availability</Text></Pressable></View> : athlete ? <Pressable accessibilityRole="button" onPress={() => setAvailabilityOpen(true)} style={styles.availabilityButton}>
            <Text style={styles.dayTitle}>{availability.availability ? `${availability.availability.weekly_minutes / 60} h available · ${availability.availability.rest_days.length} preferred rest days` : "Set your weekly availability"}</Text>
            <Text style={styles.dayDetail}>Edit availability →</Text>
          </Pressable> : null}
          <View style={styles.planningNote}><View style={styles.planningCopy}>
            <Text style={styles.planningTitle}>Suggested stimulus</Text>
            <Text style={styles.planningText}>{Math.round(prescription.totalMinutes)} min · {prescription.trainingDays} rides · {7 - prescription.trainingDays} rest days · {prescription.qualitySessions} focused sessions ({prescription.qualityMinutes} work min)</Text>
            {prescription.messages.map(message => <Text key={message} style={styles.planningText}>{message}</Text>)}
          </View></View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>CURRENT CALENDAR</Text>
              <Text style={styles.sectionTitle}>{weekOffset === 0 ? "This week" : "Next week"}</Text>
            </View>
            <Text style={styles.weekText}>
              {formatWeekRange(week.startDate, week.endDate)}
            </Text>
          </View>

          <View style={styles.week}>
            {displayWeek.days.map((day) => (
              <Day
                key={day.dateKey}
                day={day}
                selected={day.dateKey === selectedDay.dateKey}
                onPress={() => setSelectedDateKey(day.dateKey)}
              />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                {selectedDay.isToday
                  ? "TODAY"
                  : formatFullDate(selectedDay.date).toUpperCase()}
              </Text>
              <Text style={styles.sectionTitle}>Daily plan</Text>
            </View>
          </View>

          <DailyPlan day={selectedDay} focusTitle={focusTitle} />

          <View style={styles.planningNote}>
            <View style={styles.planningMarker} />
            <View style={styles.planningCopy}>
              <Text style={styles.sectionEyebrow}>PRESCRIPTION FOUNDATION</Text>
              <Text style={styles.planningTitle}>Focus shapes the week.</Text>
              <Text style={styles.planningText}>
                Your focus compares sustained power with five-minute power. Your fitness level, recent volume and availability shape these suggestions. This is a regenerated planning view, not a log of completed workouts. Z2 targets remain zone-based; upper Z2 is not a measured LT1.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="training" />
      <Modal visible={availabilityOpen && !!athlete} transparent animationType="fade" onRequestClose={() => { if (!availability.saving) setAvailabilityOpen(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.dayTitle}>Availability · week of {selectedWeek}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close availability without saving" disabled={availability.saving} onPress={() => setAvailabilityOpen(false)} style={styles.modalClose}><Text>Close</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
              {availabilityOpen && athlete ? <TrainingAvailabilityEditor key={`${user?.id}:${selectedWeek}`} athlete={athlete} value={availability.availability} week={selectedWeek} saving={availability.saving}
                onSave={async value => { await availability.save(value); setAvailabilityOpen(false); }} /> : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Day({
  day,
  selected,
  onPress,
}: {
  day: TrainingDayPlan;
  selected: boolean;
  onPress: () => void;
}) {
  const workout = resolveDayWorkout(day);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.day,
        day.workout == null ? styles.dayRest : undefined,
        selected ? styles.daySelected : undefined,
        pressed ? styles.pressed : undefined,
      ]}
    >
      <View style={styles.dayDate}>
        <Text style={[styles.dayName, day.isToday ? styles.dayNameToday : undefined]}>
          {formatDayName(day.date)}
        </Text>
        <Text style={styles.dateNumber}>{day.date.getDate()}</Text>
      </View>

      <View style={styles.dayContent}>
        <Text style={styles.dayTitle}>{workout.title}</Text>
        <Text style={styles.dayDetail}>{workout.detail}</Text>
      </View>

      {day.isToday ? (
        <View style={styles.todayPill}>
          <Text style={styles.todayText}>TODAY</Text>
        </View>
      ) : null}
      <Text style={[styles.arrow, selected ? styles.arrowSelected : undefined]}>→</Text>
    </Pressable>
  );
}

function DailyPlan({ day, focusTitle }: { day: TrainingDayPlan; focusTitle: string }) {
  const workout = resolveDayWorkout(day);
  const isRestDay = day.workout == null;

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionTop}>
        <View style={styles.sessionHeading}>
          <Text style={styles.sessionEyebrow}>
            {isRestDay ? "RECOVERY" : focusTitle.toUpperCase()}
          </Text>
          <Text style={styles.sessionTitle}>{workout.title}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {isRestDay ? "NO WORKOUT ASSIGNED" : "SUGGESTED"}
          </Text>
        </View>
      </View>

      <Text style={styles.sessionDescription}>{workout.description}</Text>

      <View style={styles.sessionMeta}>
        <Meta label="DATE" value={formatFullDate(day.date)} />
        <Meta label="TYPE" value={isRestDay ? "Rest Day" : workout.detail} />
        <Meta
          label="DURATION"
          value={
            workout.durationMinutes == null
              ? "—"
              : formatDuration(workout.durationMinutes)
          }
        />
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

type NavKey = "home" | "training" | "power" | "profile";

function BottomNav({ active }: { active: NavKey }) {
  const items = [
    ["⌂", "Home", "/dashboard", "home"],
    ["⌁", "Training", "/training", "training"],
    ["↗", "Power", "/power", "power"],
    ["○", "Profile", "/profile", "profile"],
  ] as const;

  return (
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        {items.map(([symbol, label, route, key]) => (
          <Pressable
            key={route}
            onPress={() => router.push(route)}
            style={[styles.navItem, active === key ? styles.navItemActive : undefined]}
          >
            <Text
              style={[
                styles.navSymbol,
                active === key ? styles.navSymbolActive : undefined,
              ]}
            >
              {symbol}
            </Text>
            <Text
              style={[
                styles.navLabel,
                active === key ? styles.navLabelActive : undefined,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function formatDayName(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" })
    .format(date)
    .toUpperCase();
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatWeekRange(startDate: Date, endDate: Date) {
  const start = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(startDate);
  const end = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(endDate);
  return `${start} – ${end}`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

const styles = StyleSheet.create({
  availabilityButton: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 640, maxHeight: "90%", backgroundColor: theme.colors.surface, borderRadius: 20, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  modalClose: { padding: 14 },
  page: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 140 },
  container: {
    width: "100%",
    maxWidth: 1050,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  header: {
    height: 82,
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
  avatarText: { color: theme.colors.text, fontWeight: "700" },
  hero: { paddingTop: 18, paddingBottom: 25 },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: theme.colors.text,
    fontSize: 31,
    fontWeight: "700",
    letterSpacing: -1.1,
    marginTop: 7,
  },
  titleCompact: { fontSize: 27 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 7 },
  focusCard: {
    backgroundColor: theme.colors.text,
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  focusCardCompact: { flexDirection: "column" },
  focusContent: { flex: 1 },
  focusEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  focusTitle: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 7,
  },
  focusDescription: {
    color: "#B6BEBA",
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 650,
    marginTop: 9,
  },
  focusPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "#24302D",
  },
  focusPillText: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  sectionHeader: {
    marginTop: 42,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 5,
  },
  weekText: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "right" },
  week: { gap: 8 },
  day: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 15,
    padding: 14,
  },
  dayRest: { backgroundColor: "#FAFBF9" },
  daySelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  pressed: { opacity: 0.68 },
  dayDate: { width: 62 },
  dayName: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  dayNameToday: { color: theme.colors.accent },
  dateNumber: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  dayContent: { flex: 1 },
  dayTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  dayDetail: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
  todayPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: theme.colors.surface,
  },
  todayText: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  arrow: { color: theme.colors.textSecondary, fontSize: 18, marginLeft: 12 },
  arrowSelected: { color: theme.colors.accent },
  sessionCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", gap: 18 },
  sessionHeading: { flex: 1 },
  sessionEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sessionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },
  statusPill: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: { color: theme.colors.accent, fontSize: 8, fontWeight: "800" },
  sessionDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    maxWidth: 700,
  },
  sessionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 38,
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metaLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  planningNote: {
    flexDirection: "row",
    gap: 16,
    marginTop: 38,
    padding: 22,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
  },
  planningMarker: { width: 4, borderRadius: 2, backgroundColor: theme.colors.accent },
  planningCopy: { flex: 1 },
  planningTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  planningText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
  navWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
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
  navItemActive: { backgroundColor: theme.colors.accentSoft },
  navSymbol: { color: theme.colors.textSecondary, fontSize: 18 },
  navSymbolActive: { color: theme.colors.accent },
  navLabel: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 3 },
  navLabelActive: { color: theme.colors.text, fontWeight: "600" },
});
