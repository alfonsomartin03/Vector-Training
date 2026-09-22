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
import { WorkoutDetails } from "../components/WorkoutDetails";
import { useTrainingAvailability } from "../hooks/useTrainingAvailability";
import { useTrainingHistory } from "../hooks/useTrainingHistory";
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [dailyPlanOpen, setDailyPlanOpen] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const reference = new Date();
  reference.setDate(reference.getDate() + weekOffset * 7);
  const selectedWeek = weekKey(reference);
  const availability = useTrainingAvailability(user?.id, selectedWeek);
  const history = useTrainingHistory(user?.id);
  const prescription = useMemo(() => prescribeWeek(
    athlete,
    availability.availability,
    new Date(`${selectedWeek}T12:00:00`),
    new Date(),
    { completedWorkouts: history.completedWorkouts, powerMaxima: history.powerMaxima },
  ), [athlete, availability.availability, history.completedWorkouts, history.powerMaxima, selectedWeek]);
  const focus = getTrainingFocusDisplay(prescription.trainingFocus ?? athlete?.profile.training_focus);
  const focusTitle = isLoading ? "Loading…" : error ? "Focus unavailable" : focus.title;
  const week = useMemo(
    () => buildWeeklyTrainingPlan(new Date(`${selectedWeek}T12:00:00`), prescription.assignments),
    [selectedWeek, prescription.assignments]
  );
  const displayWeek = { ...week, days: week.days.map(day => ({ ...day, isToday: day.dateKey === toLocalDateKey(new Date()) })) };
  const today = displayWeek.days.find((day) => day.isToday) ?? displayWeek.days[0];
  const [selectedDateKey, setSelectedDateKey] = useState(today.dateKey);
  const selectedDay =
    displayWeek.days.find((day) => day.dateKey === selectedDateKey) ?? today;
  const selectedCompletion = history.completedWorkouts.find(item => item.scheduled_date === selectedDay.dateKey) ?? null;

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

          <View style={styles.weekOverview}>
            <View style={styles.weekOverviewTop}>
              <View>
                <Text style={styles.sectionEyebrow}>WEEK OVERVIEW</Text>
                <Text style={styles.weekOverviewTitle}>{weekOffset === 0 ? "This week" : "Next week"}</Text>
              </View>
              <Text style={styles.weekText}>{formatWeekRange(week.startDate, week.endDate)}</Text>
            </View>

            <View style={styles.weekTabs}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: weekOffset === 0 }}
                disabled={availability.saving}
                onPress={() => setWeekOffset(0)}
                style={[styles.weekTab, weekOffset === 0 ? styles.weekTabActive : undefined]}
              >
                <Text style={[styles.weekTabText, weekOffset === 0 ? styles.weekTabTextActive : undefined]}>This week</Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: weekOffset === 1 }}
                disabled={availability.saving}
                onPress={() => setWeekOffset(1)}
                style={[styles.weekTab, weekOffset === 1 ? styles.weekTabActive : undefined]}
              >
                <Text style={[styles.weekTabText, weekOffset === 1 ? styles.weekTabTextActive : undefined]}>Next week</Text>
              </Pressable>
            </View>

            <View style={styles.overviewStats}>
              <OverviewStat
                label="CURRENT FOCUS"
                value={focusTitle}
                detail={isLoading ? "Loading your athlete profile…" : error ?? focus.description}
              />
              <OverviewStat
                label="AVAILABILITY"
                value={availability.loading ? "Loading…" : availability.error ? "Unavailable" : availability.availability ? `${availability.availability.weekly_minutes / 60} h · ${availability.availability.rest_days.length} rest days` : "Not set"}
                detail="Time and preferred recovery days"
              />
              <OverviewStat
                label="PLANNED LOAD"
                value={`${Math.round(prescription.totalMinutes)} min · ${prescription.trainingDays} rides`}
                detail={prescription.recoveryWeek ? "Recovery week · endurance only" : `${prescription.qualitySessions} focused sessions · ${prescription.qualityMinutes} work min`}
              />
            </View>

            {prescription.needsRetest ? (
              <View accessibilityRole="alert" style={styles.retestCard}>
                <View style={styles.retestCopy}>
                  <Text style={styles.retestTitle}>Power retest due</Text>
                  <Text style={styles.retestText}>It has been 84 days without a new supported power maximum. Focused progression is paused until your 1-, 5-, and 12-minute values are refreshed.</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => router.push("/power")} style={styles.retestAction}>
                  <Text style={styles.retestActionText}>Update power data →</Text>
                </Pressable>
              </View>
            ) : null}

            {prescription.messages.length ? (
              <View style={styles.overviewMessages}>
                {prescription.messages.map((message) => (
                  <Text key={message} style={styles.overviewMessage}>• {message}</Text>
                ))}
              </View>
            ) : null}
            {history.error ? <Text accessibilityRole="alert" style={styles.overviewMessage}>• {history.error}</Text> : null}

            {availability.error ? (
              <Pressable accessibilityRole="button" onPress={availability.reload} style={styles.overviewAction}>
                <Text style={styles.overviewActionText}>Retry availability</Text>
              </Pressable>
            ) : athlete ? (
              <Pressable accessibilityRole="button" onPress={() => setAvailabilityOpen(true)} style={styles.overviewAction}>
                <Text style={styles.overviewActionText}>Edit weekly availability →</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.sectionHeader, styles.calendarHeader]}>
            <View>
              <Text style={styles.sectionEyebrow}>CURRENT CALENDAR</Text>
              <Text style={styles.sectionTitle}>Daily schedule</Text>
            </View>
            <Text style={styles.weekText}>Select a day to view its plan</Text>
          </View>

          <View style={styles.week}>
            {displayWeek.days.map((day) => (
              <Day
                key={day.dateKey}
                day={day}
                selected={day.dateKey === selectedDay.dateKey}
                onPress={() => {
                  setSelectedDateKey(day.dateKey);
                  setDailyPlanOpen(true);
                }}
              />
            ))}
          </View>

          <View style={styles.planningNote}>
            <View style={styles.planningMarker} />
            <View style={styles.planningCopy}>
              <Text style={styles.sectionEyebrow}>PRESCRIPTION FOUNDATION</Text>
              <Text style={styles.planningTitle}>Focus shapes the week.</Text>
              <Text style={styles.planningText}>
                The planner targets the gap between sustained and five-minute power, then adjusts each workout from completed sessions. Successful work progresses gradually; difficult sessions hold or reduce the next dose, and recovery weeks follow sustained loading. New supported activity maxima refresh the model automatically; otherwise a retest is requested after 84 days.
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
      <Modal visible={dailyPlanOpen} transparent animationType="fade" onRequestClose={() => setDailyPlanOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.workoutModalCard}>
            <View style={styles.workoutModalHeader}>
              <View style={styles.workoutModalHeading}>
                <Text style={styles.sectionEyebrow}>
                  {selectedDay.isToday ? "TODAY" : formatFullDate(selectedDay.date).toUpperCase()}
                </Text>
                <Text style={styles.workoutModalTitle}>Daily plan</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close daily plan"
                onPress={() => setDailyPlanOpen(false)}
                style={({ pressed }) => [styles.workoutModalClose, pressed ? styles.pressed : undefined]}
              >
                <Text style={styles.workoutModalCloseText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.workoutModalContent}>
              <DailyPlan
                day={selectedDay}
                focusTitle={focusTitle}
                cp={prescription.trainingFocus?.cpWatts ?? null}
                p5={prescription.trainingFocus?.fiveMinuteWatts ?? null}
                completed={Boolean(selectedCompletion)}
                saving={history.savingDate === selectedDay.dateKey}
                completionError={completionError}
                onComplete={async () => {
                  if (!selectedDay.workout) return;
                  setCompletionError(null);
                  try { await history.markCompleted(selectedDay.dateKey, selectedDay.workout); }
                  catch (error) { setCompletionError(error instanceof Error ? error.message : "Unable to record workout."); }
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OverviewStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.overviewStat}>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text numberOfLines={2} style={styles.overviewDetail}>{detail}</Text>
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

function DailyPlan({ day, focusTitle, cp, p5, completed, saving, completionError, onComplete }: {
  day: TrainingDayPlan;
  focusTitle: string;
  cp: number | null;
  p5: number | null;
  completed: boolean;
  saving: boolean;
  completionError: string | null;
  onComplete: () => Promise<void>;
}) {
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
            {isRestDay ? "NO WORKOUT ASSIGNED" : completed ? "COMPLETED" : "SUGGESTED"}
          </Text>
        </View>
      </View>

      {workout.workout ? <WorkoutDetails workout={workout.workout} cp={cp} p5={p5} /> : <Text style={styles.sessionDescription}>{workout.description}</Text>}

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
        {!isRestDay && workout.selectionReason ? <Meta label="PROGRESSION" value={workout.selectionReason} /> : null}
      </View>
      {!isRestDay ? (
        <Pressable
          accessibilityRole="button"
          disabled={completed || saving}
          onPress={onComplete}
          style={({ pressed }) => [styles.completionButton, completed ? styles.completionButtonDone : undefined, pressed ? styles.pressed : undefined]}
        >
          <Text style={styles.completionButtonText}>{completed ? "Workout completed" : saving ? "Saving…" : "Mark workout completed"}</Text>
        </Pressable>
      ) : null}
      {completionError ? <Text accessibilityRole="alert" style={styles.completionError}>{completionError}</Text> : null}
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 640, maxHeight: "90%", backgroundColor: theme.colors.surface, borderRadius: 20, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  modalClose: { padding: 14 },
  workoutModalCard: {
    width: "100%",
    maxWidth: 900,
    maxHeight: "92%",
    overflow: "hidden",
    backgroundColor: theme.colors.background,
    borderRadius: 22,
  },
  workoutModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  workoutModalHeading: { flex: 1 },
  workoutModalTitle: { color: theme.colors.text, fontSize: 22, fontWeight: "700", marginTop: 4 },
  workoutModalClose: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  workoutModalCloseText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  workoutModalContent: { padding: 18, paddingBottom: 26 },
  page: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 140 },
  container: {
    width: "100%",
    maxWidth: 1050,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  header: {
    height: 68,
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
  hero: { paddingTop: 8, paddingBottom: 18 },
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
  weekOverview: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  weekOverviewTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
  },
  weekOverviewTitle: { color: theme.colors.text, fontSize: 25, fontWeight: "700", marginTop: 4 },
  weekTabs: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    marginTop: 17,
    padding: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  weekTab: { minHeight: 38, justifyContent: "center", paddingHorizontal: 15, borderRadius: 9 },
  weekTabActive: { backgroundColor: theme.colors.text },
  weekTabText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600" },
  weekTabTextActive: { color: theme.colors.white },
  overviewStats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  overviewStat: {
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 108,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
  },
  overviewLabel: { color: theme.colors.accent, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  overviewValue: { color: theme.colors.text, fontSize: 16, fontWeight: "700", marginTop: 7 },
  overviewDetail: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 5 },
  retestCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E7B7A8",
    backgroundColor: "#FFF4F0",
  },
  retestCopy: { flex: 1, minWidth: 240 },
  retestTitle: { color: "#8B3E2F", fontSize: 13, fontWeight: "800" },
  retestText: { color: "#7A5148", fontSize: 11, lineHeight: 17, marginTop: 4 },
  retestAction: { minHeight: 40, justifyContent: "center", paddingHorizontal: 13, borderRadius: 9, backgroundColor: theme.colors.surface },
  retestActionText: { color: "#8B3E2F", fontSize: 11, fontWeight: "700" },
  overviewMessages: { gap: 4, marginTop: 12 },
  overviewMessage: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  overviewAction: {
    alignSelf: "flex-start",
    minHeight: 42,
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: theme.colors.accentSoft,
  },
  overviewActionText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  sectionHeader: {
    marginTop: 42,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
  },
  calendarHeader: { marginTop: 28 },
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
  completionButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 17,
    borderRadius: 11,
    backgroundColor: theme.colors.text,
  },
  completionButtonDone: { backgroundColor: theme.colors.accent },
  completionButtonText: { color: theme.colors.white, fontSize: 12, fontWeight: "700" },
  completionError: { color: "#A33A3A", fontSize: 12, marginTop: 10 },
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
