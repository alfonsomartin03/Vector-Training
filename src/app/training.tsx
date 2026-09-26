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
import { AppBottomNav } from "../components/AppBottomNav";
import { AppHeader } from "../components/AppHeader";
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
  const firstInitial = (athlete?.profile.first_name ?? "A").charAt(0).toUpperCase() || "A";
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
  const completedThisWeek = displayWeek.days.filter(day =>
    history.completedWorkouts.some(item => item.scheduled_date === day.dateKey)
  ).length;
  const weeklyTarget = availability.availability?.weekly_minutes ?? prescription.totalMinutes;
  const plannedShare = weeklyTarget > 0
    ? Math.min(100, Math.round((prescription.totalMinutes / weeklyTarget) * 100))
    : 0;

  function openWeek(offset: number) {
    const nextOffset = Math.max(0, Math.min(5, offset));
    const nextReference = new Date();
    nextReference.setDate(nextReference.getDate() + nextOffset * 7);
    setWeekOffset(nextOffset);
    setSelectedDateKey(
      nextOffset === 0
        ? toLocalDateKey(new Date())
        : weekKey(nextReference)
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <AppHeader initial={firstInitial} />

          <View style={[styles.hero, compact ? styles.heroCompact : undefined]}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>TRAINING CALENDAR</Text>
              <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>Your road ahead.</Text>
              <Text style={styles.subtitle}>{formatWeekRange(week.startDate, week.endDate)} · {focusTitle}</Text>
            </View>
            <View style={styles.calendarControls}>
              {weekOffset !== 0 ? (
                <Pressable accessibilityRole="button" onPress={() => openWeek(0)} style={styles.todayButton}>
                  <Text style={styles.todayButtonText}>Today</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous week"
                accessibilityState={{ disabled: weekOffset === 0 }}
                disabled={weekOffset === 0 || availability.saving}
                onPress={() => openWeek(weekOffset - 1)}
                style={[styles.arrowButton, weekOffset === 0 ? styles.arrowButtonDisabled : undefined]}
              >
                <Text style={styles.arrowButtonText}>‹</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next week"
                disabled={availability.saving}
                onPress={() => openWeek(weekOffset + 1)}
                style={styles.arrowButton}
              >
                <Text style={styles.arrowButtonText}>›</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.plannerTop, compact ? styles.plannerTopCompact : undefined]}>
            <View style={styles.daySpotlight}>
              <View style={styles.spotlightGlow} />
              <View style={styles.spotlightTop}>
                <View>
                  <Text style={styles.glassEyebrow}>{selectedDay.isToday ? "TODAY" : "SELECTED DAY"}</Text>
                  <Text style={styles.spotlightDate}>{formatLongDate(selectedDay.date)}</Text>
                </View>
                <View style={styles.spotlightDateBadge}>
                  <Text style={styles.spotlightDateNumber}>{selectedDay.date.getDate()}</Text>
                </View>
              </View>
              <Text style={styles.spotlightTitle}>{resolveDayWorkout(selectedDay).title}</Text>
              <Text style={styles.spotlightDetail} numberOfLines={2}>
                {selectedDay.workout?.description ?? "A quiet day to absorb the work and arrive fresh for what’s next."}
              </Text>
              <View style={styles.spotlightFooter}>
                <View style={styles.spotlightMetaGroup}>
                  <Text style={styles.spotlightMeta}>{selectedDay.workout ? formatDuration(selectedDay.workout.durationMinutes ?? 0) : "Recovery"}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.spotlightMeta}>{selectedCompletion ? "Completed" : selectedDay.workout ? "Planned" : "No ride"}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDailyPlanOpen(true)}
                  style={({ pressed }) => [styles.spotlightAction, pressed ? styles.pressed : undefined]}
                >
                  <Text style={styles.spotlightActionText}>{selectedDay.workout ? "View workout" : "View day"}  ↗</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.weekPulse}>
              <View style={styles.weekPulseTop}>
                <View>
                  <Text style={styles.sectionEyebrow}>WEEK AT A GLANCE</Text>
                  <Text style={styles.weekPulseTitle}>{weekOffset === 0 ? "This week" : weekOffset === 1 ? "Next week" : `Week +${weekOffset}`}</Text>
                </View>
                <Text style={styles.weekPulseMinutes}>{formatHours(prescription.totalMinutes)}</Text>
              </View>
              <View style={styles.loadTrack}>
                <View style={[styles.loadFill, { width: `${plannedShare}%` }]} />
              </View>
              <View style={styles.loadLabels}>
                <Text style={styles.loadCaption}>{plannedShare}% of available time planned</Text>
                <Text style={styles.loadCaption}>{weeklyTarget ? formatHours(weeklyTarget) : "No target"}</Text>
              </View>
              <View style={styles.pulseStats}>
                <MiniStat value={`${prescription.trainingDays}`} label="rides" />
                <MiniStat value={`${prescription.qualitySessions}`} label="focused" />
                <MiniStat value={`${completedThisWeek}`} label="done" />
              </View>
              <View style={styles.focusRow}>
                <View style={styles.focusIcon}><Text style={styles.focusIconText}>⌁</Text></View>
                <View style={styles.focusCopy}>
                  <Text style={styles.focusLabel}>TRAINING FOCUS</Text>
                  <Text style={styles.focusValue}>{focusTitle}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.calendarSurface}>
            <View style={[styles.calendarSurfaceHeader, compact ? styles.calendarSurfaceHeaderCompact : undefined]}>
              <View>
                <Text style={styles.sectionEyebrow}>WEEK PLAN</Text>
                <Text style={styles.sectionTitle}>Seven-day rhythm</Text>
              </View>
              <Text style={styles.weekText}>Tap any day to preview it</Text>
            </View>

            <ScrollView horizontal={compact} showsHorizontalScrollIndicator={false} contentContainerStyle={compact ? styles.weekScrollContent : undefined}>
              <View style={[styles.week, compact ? styles.weekCompact : undefined]}>
                {displayWeek.days.map((day) => (
                  <Day
                    key={day.dateKey}
                    day={day}
                    compact={compact}
                    completed={history.completedWorkouts.some(item => item.scheduled_date === day.dateKey)}
                    selected={day.dateKey === selectedDay.dateKey}
                    onPress={() => setSelectedDateKey(day.dateKey)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.horizonSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>PLAN AHEAD</Text>
                <Text style={styles.sectionTitle}>Four-week horizon</Text>
              </View>
              {athlete ? (
                <Pressable accessibilityRole="button" onPress={() => setAvailabilityOpen(true)} style={styles.editAvailabilityButton}>
                  <Text style={styles.editAvailabilityText}>Adjust availability</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.horizonGrid}>
              {[0, 1, 2, 3].map(offset => {
                const horizonDate = new Date();
                horizonDate.setDate(horizonDate.getDate() + offset * 7);
                const horizonWeek = buildWeeklyTrainingPlan(horizonDate);
                const active = weekOffset === offset;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={offset}
                    onPress={() => openWeek(offset)}
                    style={({ pressed }) => [styles.horizonCard, active ? styles.horizonCardActive : undefined, pressed ? styles.pressed : undefined]}
                  >
                    <View style={styles.horizonTop}>
                      <Text style={[styles.horizonLabel, active ? styles.horizonLabelActive : undefined]}>{offset === 0 ? "CURRENT" : offset === 1 ? "NEXT" : `WEEK +${offset}`}</Text>
                      <Text style={[styles.horizonArrow, active ? styles.horizonArrowActive : undefined]}>↗</Text>
                    </View>
                    <Text style={[styles.horizonRange, active ? styles.horizonRangeActive : undefined]}>{formatCompactWeekRange(horizonWeek.startDate, horizonWeek.endDate)}</Text>
                    <Text style={[styles.horizonDetail, active ? styles.horizonDetailActive : undefined]}>
                      {active ? `${prescription.trainingDays} rides · ${formatHours(prescription.totalMinutes)}` : "Open to review your plan"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}><Text style={styles.insightIconText}>✦</Text></View>
            <View style={styles.planningCopy}>
              <Text style={styles.sectionEyebrow}>WHY THIS PLAN</Text>
              <Text style={styles.planningTitle}>{prescription.recoveryWeek ? "Space to recover, by design." : "Load builds around your life."}</Text>
              <Text style={styles.planningText}>
                {isLoading ? "Reading your latest training profile…" : error ?? focus.description} Your completed sessions, available time, and recovery spacing shape what appears next.
              </Text>
              {prescription.messages.length ? <Text style={styles.insightMessage}>{prescription.messages[0]}</Text> : null}
              {history.error ? <Text accessibilityRole="alert" style={styles.insightMessage}>{history.error}</Text> : null}
              {availability.error ? (
                <Pressable accessibilityRole="button" onPress={availability.reload} style={styles.inlineAction}>
                  <Text style={styles.inlineActionText}>Retry availability</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      <AppBottomNav active="training" />
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

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function Day({
  day,
  compact,
  completed,
  selected,
  onPress,
}: {
  day: TrainingDayPlan;
  compact: boolean;
  completed: boolean;
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
        compact ? styles.dayCompact : undefined,
        day.workout == null ? styles.dayRest : undefined,
        selected ? styles.daySelected : undefined,
        pressed ? styles.pressed : undefined,
      ]}
    >
      <View style={styles.dayTop}>
        <Text style={[styles.dayName, day.isToday || selected ? styles.dayNameToday : undefined]}>
          {formatDayName(day.date)}
        </Text>
        {completed ? <View style={styles.completedMark}><Text style={styles.completedMarkText}>✓</Text></View> : null}
      </View>
      <Text style={[styles.dateNumber, selected ? styles.dateNumberSelected : undefined]}>{day.date.getDate()}</Text>
      <View style={[styles.dayTypeMark, day.workout ? styles.dayTypeRide : styles.dayTypeRest]} />
      <View style={styles.dayContent}>
        <Text numberOfLines={2} style={styles.dayTitle}>{workout.title}</Text>
        <Text numberOfLines={1} style={styles.dayDetail}>
          {workout.durationMinutes ? formatDuration(workout.durationMinutes) : "Reset & recover"}
        </Text>
      </View>
      {day.isToday ? <Text style={styles.todayText}>TODAY</Text> : <Text style={[styles.dayHint, selected ? styles.dayHintSelected : undefined]}>Preview</Text>}
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

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
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

function formatCompactWeekRange(startDate: Date, endDate: Date) {
  const start = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(startDate);
  const end = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(endDate);
  return `${start} – ${end}`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} hours`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 150 },
  container: { width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center", paddingHorizontal: theme.layout.pagePadding },
  hero: { paddingTop: 18, paddingBottom: 26, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 20 },
  heroCompact: { alignItems: "flex-start", flexWrap: "wrap" },
  heroCopy: { flex: 1 },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: theme.colors.text, fontSize: 42, fontWeight: "700", letterSpacing: -1.8, marginTop: 8 },
  titleCompact: { fontSize: 34 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 8 },
  calendarControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  todayButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: 16, borderRadius: 14, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder },
  todayButtonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
  arrowButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.soft },
  arrowButtonDisabled: { opacity: 0.35, boxShadow: "none" },
  arrowButtonText: { color: theme.colors.text, fontSize: 27, lineHeight: 29, fontWeight: "400" },
  plannerTop: { flexDirection: "row", alignItems: "stretch", gap: 16 },
  plannerTopCompact: { flexDirection: "column" },
  daySpotlight: { flex: 1.55, minHeight: 278, overflow: "hidden", padding: 24, borderRadius: 28, backgroundColor: theme.colors.darkSurface, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", boxShadow: theme.shadows.raised },
  spotlightGlow: { position: "absolute", width: 260, height: 260, right: -85, top: -110, borderRadius: 130, backgroundColor: "rgba(23,107,89,0.46)" },
  spotlightTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },
  glassEyebrow: { color: "#A9D8CC", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  spotlightDate: { color: "rgba(255,255,255,0.72)", fontSize: 14, marginTop: 6 },
  spotlightDateBadge: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  spotlightDateNumber: { color: "#FFFFFF", fontSize: 23, fontWeight: "700" },
  spotlightTitle: { color: "#FFFFFF", fontSize: 29, lineHeight: 34, fontWeight: "700", letterSpacing: -0.8, marginTop: 25 },
  spotlightDetail: { color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 620 },
  spotlightFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: "auto", paddingTop: 22 },
  spotlightMetaGroup: { flexDirection: "row", alignItems: "center", gap: 9 },
  spotlightMeta: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "600" },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#75B9A8" },
  spotlightAction: { minHeight: 42, justifyContent: "center", paddingHorizontal: 16, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.94)" },
  spotlightActionText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  weekPulse: { flex: 1, minWidth: 290, minHeight: 278, padding: 22, borderRadius: 28, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.insetLike },
  weekPulseTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  weekPulseTitle: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginTop: 5 },
  weekPulseMinutes: { color: theme.colors.text, fontSize: 25, fontWeight: "700" },
  loadTrack: { height: 8, overflow: "hidden", borderRadius: 4, backgroundColor: theme.colors.border, marginTop: 20 },
  loadFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },
  loadLabels: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 8 },
  loadCaption: { color: theme.colors.textSecondary, fontSize: 11 },
  pulseStats: { flexDirection: "row", marginTop: 19, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(125,139,160,0.16)" },
  miniStat: { flex: 1, alignItems: "center" },
  miniStatValue: { color: theme.colors.text, fontSize: 20, fontWeight: "700" },
  miniStatLabel: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 3 },
  focusRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  focusIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accentSoft },
  focusIconText: { color: theme.colors.accent, fontSize: 18, fontWeight: "700" },
  focusCopy: { flex: 1 },
  focusLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  focusValue: { color: theme.colors.text, fontSize: 13, fontWeight: "700", marginTop: 3 },
  calendarSurface: { marginTop: 18, padding: 22, borderRadius: 28, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.soft },
  calendarSurfaceHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18 },
  calendarSurfaceHeaderCompact: { alignItems: "flex-start" },
  sectionHeader: { marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 18 },
  sectionEyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 1.25 },
  sectionTitle: { color: theme.colors.text, fontSize: 23, fontWeight: "700", letterSpacing: -0.5, marginTop: 6 },
  weekText: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "right" },
  weekScrollContent: { paddingRight: 10 },
  week: { flexDirection: "row", gap: 9 },
  weekCompact: { width: 805 },
  day: { flex: 1, minWidth: 0, minHeight: 184, padding: 13, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 19 },
  dayCompact: { width: 106, flexGrow: 0 },
  dayRest: { backgroundColor: "rgba(247,248,246,0.68)" },
  daySelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentGlass, boxShadow: "0 10px 22px rgba(23,107,89,0.14)" },
  pressed: { opacity: 0.68 },
  dayTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayName: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  dayNameToday: { color: theme.colors.accent },
  completedMark: { width: 19, height: 19, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#DFF3EA" },
  completedMarkText: { color: "#237454", fontSize: 10, fontWeight: "800" },
  dateNumber: { color: theme.colors.text, fontSize: 26, fontWeight: "700", marginTop: 8 },
  dateNumberSelected: { color: theme.colors.accent },
  dayTypeMark: { width: 24, height: 4, borderRadius: 2, marginTop: 10 },
  dayTypeRide: { backgroundColor: theme.colors.accent },
  dayTypeRest: { backgroundColor: theme.colors.border },
  dayContent: { flex: 1, paddingTop: 13 },
  dayTitle: { color: theme.colors.text, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  dayDetail: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 5 },
  todayText: { color: theme.colors.accent, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  dayHint: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: "600" },
  dayHintSelected: { color: theme.colors.accent },
  horizonSection: { marginTop: 34 },
  editAvailabilityButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 14, borderRadius: 13, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder },
  editAvailabilityText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  horizonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  horizonCard: { flexGrow: 1, flexBasis: 210, minHeight: 126, padding: 17, borderRadius: 20, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.insetLike },
  horizonCardActive: { backgroundColor: theme.colors.darkSurface, borderColor: theme.colors.darkSurface, boxShadow: theme.shadows.raised },
  horizonTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  horizonLabel: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  horizonLabelActive: { color: "#A9D8CC" },
  horizonArrow: { color: theme.colors.textSecondary, fontSize: 14 },
  horizonArrowActive: { color: "#FFFFFF" },
  horizonRange: { color: theme.colors.text, fontSize: 17, fontWeight: "700", marginTop: 14 },
  horizonRangeActive: { color: "#FFFFFF" },
  horizonDetail: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 7 },
  horizonDetailActive: { color: "rgba(255,255,255,0.62)" },
  retestCard: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 26, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#E7B7A8", backgroundColor: "#FFF4F0" },
  retestCopy: { flex: 1, minWidth: 240 },
  retestTitle: { color: "#8B3E2F", fontSize: 13, fontWeight: "800" },
  retestText: { color: "#7A5148", fontSize: 11, lineHeight: 17, marginTop: 4 },
  retestAction: { minHeight: 40, justifyContent: "center", paddingHorizontal: 13, borderRadius: 11, backgroundColor: "#FFFFFF" },
  retestActionText: { color: "#8B3E2F", fontSize: 11, fontWeight: "700" },
  insightCard: { flexDirection: "row", gap: 16, marginTop: 34, padding: 22, borderRadius: 22, backgroundColor: theme.colors.accentGlass, borderWidth: 1, borderColor: theme.colors.glassBorder },
  insightIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.78)" },
  insightIconText: { color: theme.colors.accent, fontSize: 18 },
  planningCopy: { flex: 1 },
  planningTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginTop: 6 },
  planningText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  insightMessage: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 9 },
  inlineAction: { alignSelf: "flex-start", marginTop: 12, minHeight: 38, justifyContent: "center", paddingHorizontal: 13, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.78)" },
  inlineActionText: { color: theme.colors.accent, fontSize: 11, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(17,25,40,0.48)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 640, maxHeight: "90%", backgroundColor: theme.colors.background, borderRadius: 24, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  modalClose: { padding: 14 },
  workoutModalCard: { width: "100%", maxWidth: 900, maxHeight: "92%", overflow: "hidden", backgroundColor: theme.colors.background, borderRadius: 26 },
  workoutModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18, paddingHorizontal: 22, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.glassStrong },
  workoutModalHeading: { flex: 1 },
  workoutModalTitle: { color: theme.colors.text, fontSize: 22, fontWeight: "700", marginTop: 4 },
  workoutModalClose: { minHeight: 42, justifyContent: "center", paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border },
  workoutModalCloseText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  workoutModalContent: { padding: 18, paddingBottom: 26 },
  sessionCard: { padding: 24, borderRadius: 22, backgroundColor: theme.colors.glassStrong, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.soft },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", gap: 18 },
  sessionHeading: { flex: 1 },
  sessionEyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  sessionTitle: { color: theme.colors.text, fontSize: 24, fontWeight: "700", marginTop: 6 },
  statusPill: { backgroundColor: theme.colors.accentSoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, alignSelf: "flex-start" },
  statusText: { color: theme.colors.accent, fontSize: 8, fontWeight: "800" },
  sessionDescription: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 21, marginTop: 13, maxWidth: 700 },
  sessionMeta: { flexDirection: "row", flexWrap: "wrap", gap: 38, marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderTopColor: theme.colors.border },
  completionButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", marginTop: 20, paddingHorizontal: 17, borderRadius: 12, backgroundColor: theme.colors.darkSurface },
  completionButtonDone: { backgroundColor: theme.colors.accent },
  completionButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  completionError: { color: "#A33A3A", fontSize: 12, marginTop: 10 },
  metaLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  metaValue: { color: theme.colors.text, fontSize: 12, fontWeight: "600", marginTop: 4 },
});
