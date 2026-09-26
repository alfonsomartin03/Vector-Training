import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
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
import { MetricTrend } from "../components/MetricTrend";
import { MetricTrendModal } from "../components/MetricTrendModal";
import { useAuth } from "../context/AuthContext";
import { useAthleteData } from "../hooks/useAthleteData";
import { buildAthleteModel } from "../lib/physiology/athleteModel";
import {
  buildAthleteProgress,
  buildAthleteProgressHistory,
  type MetricTrend as MetricTrendValue,
} from "../lib/physiology/progress";
import { getTrainingFocusDisplay } from "../lib/training/focus";
import { useTrainingAvailability } from "../hooks/useTrainingAvailability";
import { useTrainingHistory } from "../hooks/useTrainingHistory";
import { prescribeWeek, weekKey } from "../lib/training/prescription";
import {
  buildWeeklyTrainingPlan,
  resolveDayWorkout,
} from "../lib/training/weeklyPlan";

export default function DashboardPage() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const compact = width < 700;
  const { athlete, isLoading, error } = useAthleteData(
    user?.id,
    "Unable to load your athlete profile.",
    "Failed to load dashboard athlete:"
  );
  const model = useMemo(
    () => (athlete ? buildAthleteModel(athlete) : null),
    [athlete]
  );
  const progress = useMemo(
    () => (athlete ? buildAthleteProgress(athlete) : null),
    [athlete]
  );
  const progressHistory = useMemo(
    () => (athlete ? buildAthleteProgressHistory(athlete) : null),
    [athlete]
  );
  const [selectedMetric, setSelectedMetric] = useState<DashboardMetric | null>(null);
  const availability = useTrainingAvailability(user?.id, weekKey());
  const trainingHistory = useTrainingHistory(user?.id);
  const prescription = useMemo(() => prescribeWeek(
    athlete,
    availability.availability,
    new Date(),
    new Date(),
    { completedWorkouts: trainingHistory.completedWorkouts, powerMaxima: trainingHistory.powerMaxima },
  ), [athlete, availability.availability, trainingHistory.completedWorkouts, trainingHistory.powerMaxima]);
  const week = buildWeeklyTrainingPlan(new Date(), prescription.assignments);
  const today = week.days.find((day) => day.isToday) ?? week.days[0];
  const todayWorkout = resolveDayWorkout(today);
  const focus = getTrainingFocusDisplay(prescription.trainingFocus ?? athlete?.profile.training_focus);
  const firstName = athlete?.profile.first_name?.trim() || "Athlete";
  const firstInitial = firstName.charAt(0).toUpperCase();
  const completedThisWeek = week.days.filter(day =>
    trainingHistory.completedWorkouts.some(item => item.scheduled_date === day.dateKey)
  ).length;

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.container, compact ? styles.containerCompact : undefined]}>
          <AppHeader initial={firstInitial} />

          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>{getGreeting()}</Text>
            <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : undefined]}>
              Ready for what’s next, {firstName}?
            </Text>
            <Text style={styles.heroSubtitle}>{formatFullDate(today.date)} · Your training and physiology, distilled.</Text>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {availability.error ? <Text accessibilityRole="alert">{availability.error}</Text> : !availability.loading && !availability.availability ? <Pressable onPress={() => router.push("/training")}><Text>Set your weekly availability on Training to generate a plan →</Text></Pressable> : null}

          <View style={[styles.dashboardLead, compact ? styles.stack : undefined]}>
            <Pressable
              onPress={() => router.push("/training")}
              style={({ pressed }) => [styles.workoutCard, pressed ? styles.pressed : undefined]}
            >
              <View style={styles.workoutCardGlow} />
              <View style={styles.workoutTopline}>
                <View>
                  <Text style={styles.workoutEyebrow}>TODAY · {todayWorkout.detail.toUpperCase()}</Text>
                  <Text style={styles.workoutDate}>{formatFullDate(today.date)}</Text>
                </View>
                <View style={styles.workoutIcon}><Text style={styles.workoutIconText}>⌁</Text></View>
              </View>
              <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
              <Text style={styles.workoutDescription} numberOfLines={3}>{todayWorkout.description}</Text>
              <View style={styles.workoutActionRow}>
                <Text style={styles.workoutStatus}>{today.workout ? "Planned for today" : "Recovery day"}</Text>
                <Text style={styles.workoutAction}>Open workout  ↗</Text>
              </View>
            </Pressable>

            <View style={styles.weekCard}>
              <View style={styles.weekCardHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>THIS WEEK</Text>
                  <Text style={styles.weekCardTitle}>Your rhythm</Text>
                </View>
                <Text style={styles.weekRange}>{formatWeekRange(week.startDate, week.endDate)}</Text>
              </View>
              <View style={styles.weekStats}>
                <DashboardStat value={`${prescription.trainingDays}`} label="rides" />
                <DashboardStat value={`${completedThisWeek}`} label="complete" />
                <DashboardStat value={(prescription.totalMinutes / 60).toFixed(1)} label="hours" />
              </View>
              <View style={styles.weekFocus}>
                <View style={styles.weekFocusMark}><Text style={styles.weekFocusMarkText}>✦</Text></View>
                <View style={styles.weekFocusCopy}>
                  <Text style={styles.weekFocusLabel}>CURRENT FOCUS</Text>
                  <Text style={styles.weekFocusValue}>{isLoading ? "Loading…" : focus.title}</Text>
                </View>
              </View>
              <Pressable onPress={() => router.push("/training")} style={styles.weekLink}>
                <Text style={styles.weekLinkText}>View training calendar</Text><Text style={styles.weekLinkArrow}>→</Text>
              </Pressable>
            </View>
          </View>

          <SectionHeader
            eyebrow="CURRENT PROFILE"
            title="Your physiology"
            aside={model ? formatRecordedDate(model.recordedAt) : undefined}
          />

          <View style={[styles.metrics, compact ? styles.stack : undefined]}>
            <MetricCard
              label="Critical Power"
              value={isLoading ? "..." : model ? `${Math.round(model.cpWatts)}` : "—"}
              unit="W"
              detail={model ? `${model.cpWattsPerKg.toFixed(2)} W/kg` : "Add power data"}
              trend={progress?.criticalPower ?? null}
              onPress={() => setSelectedMetric("criticalPower")}
            />
            <MetricCard
              label="W′"
              value={isLoading ? "..." : model ? model.wPrimeKj.toFixed(1) : "—"}
              unit="kJ"
              detail={model ? "Work capacity above CP" : "Add power data"}
              trend={progress?.wPrime ?? null}
              onPress={() => setSelectedMetric("wPrime")}
            />
            <MetricCard
              label="VO₂max"
              value={isLoading ? "..." : model ? model.vo2Max.toFixed(1) : "—"}
              unit=""
              detail={
                model
                  ? `${model.vo2MaxSource === "measured" ? "Measured" : "Estimated"} · mL/kg/min`
                  : "Add power or lab data"
              }
              trend={progress?.vo2Max ?? null}
              onPress={() => setSelectedMetric("vo2Max")}
            />
          </View>

          <SectionHeader eyebrow="QUICK ACCESS" title="Keep moving" />
          <View style={[styles.quickGrid, compact ? styles.stack : undefined]}>
            <QuickLink
              symbol="⌁"
              title="Training week"
              detail="Review all seven days"
              onPress={() => router.push("/training")}
            />
            <QuickLink
              symbol="↗"
              title="Power & zones"
              detail="Curve, CP inputs and ride targets"
              onPress={() => router.push("/power")}
            />
            <QuickLink
              symbol="○"
              title="Athlete profile"
              detail="Update body mass and test data"
              onPress={() => router.push("/profile")}
            />
          </View>
        </View>
      </ScrollView>

      <AppBottomNav active="home" />
      {selectedMetric ? (
        <MetricTrendModal
          visible
          title={DASHBOARD_METRICS[selectedMetric].title}
          description={DASHBOARD_METRICS[selectedMetric].description}
          unit={DASHBOARD_METRICS[selectedMetric].unit}
          series={[{
            label: DASHBOARD_METRICS[selectedMetric].seriesLabel,
            points: progressHistory?.[selectedMetric] ?? [],
            trend: progress?.[selectedMetric] ?? null,
            decimals: DASHBOARD_METRICS[selectedMetric].decimals,
          }]}
          profileMetrics={[
            { id: "criticalPower", label: "CRITICAL POWER", value: model ? `${Math.round(model.cpWatts)}` : "—", unit: "W", trend: progress?.criticalPower ?? null },
            { id: "wPrime", label: "W′", value: model ? model.wPrimeKj.toFixed(1) : "—", unit: "kJ", trend: progress?.wPrime ?? null },
            { id: "vo2Max", label: model?.vo2MaxSource === "measured" ? "VO₂MAX" : "EST. VO₂MAX", value: model ? model.vo2Max.toFixed(1) : "—", unit: "", trend: progress?.vo2Max ?? null },
          ]}
          activeMetric={selectedMetric}
          priority={focus.title}
          onClose={() => setSelectedMetric(null)}
        />
      ) : null}
    </View>
  );
}

type DashboardMetric = "criticalPower" | "wPrime" | "vo2Max";

const DASHBOARD_METRICS: Record<DashboardMetric, {
  title: string;
  description: string;
  unit: string;
  seriesLabel: string;
  decimals: number;
}> = {
  criticalPower: {
    title: "Critical Power",
    description: "Your modeled sustainable power across recorded maximal-effort tests.",
    unit: "W",
    seriesLabel: "CP",
    decimals: 0,
  },
  wPrime: {
    title: "W′",
    description: "Your modeled work capacity above critical power over time.",
    unit: "kJ",
    seriesLabel: "W′",
    decimals: 1,
  },
  vo2Max: {
    title: "VO₂max",
    description: "Measured VO₂max history when available, otherwise your power-based estimate.",
    unit: "mL/kg/min",
    seriesLabel: "VO₂max",
    decimals: 1,
  },
};

function SectionHeader({
  eyebrow,
  title,
  aside,
  action,
  onPress,
}: {
  eyebrow: string;
  title: string;
  aside?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onPress ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : aside ? (
        <Text style={styles.sectionAside}>{aside}</Text>
      ) : null}
    </View>
  );
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  trend,
  onPress,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
  trend: MetricTrendValue | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`View ${label} trend`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.metricCard, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricArrow}>⌁</Text>
      </View>
      <View style={styles.metricReading}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.metricDetail}>{detail}</Text>
      {value !== "—" && value !== "..." ? <MetricTrend trend={trend} /> : null}
    </Pressable>
  );
}

function QuickLink({
  symbol,
  title,
  detail,
  onPress,
}: {
  symbol: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{symbol}</Text>
      </View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickDetail}>{detail}</Text>
      </View>
      <Text style={styles.quickArrow}>→</Text>
    </Pressable>
  );
}

function DashboardStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.dashboardStat}>
      <Text style={styles.dashboardStatValue}>{value}</Text>
      <Text style={styles.dashboardStatLabel}>{label}</Text>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function formatRecordedDate(recordedAt: string | null) {
  if (!recordedAt) return "Current model";
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return "Current model";
  return `Updated ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
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
  }).format(endDate);
  return `${start} – ${end}`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 145 },
  container: {
    width: "100%",
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: theme.layout.pagePadding,
  },
  containerCompact: { paddingHorizontal: theme.layout.pagePadding },
  hero: { paddingTop: 18, paddingBottom: 30 },
  heroEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
    letterSpacing: -1.1,
    marginTop: 7,
  },
  heroTitleCompact: { fontSize: 34, lineHeight: 40 },
  heroSubtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 7 },
  errorCard: {
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: { color: "#A64E4E", fontSize: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
    marginTop: 36,
    marginBottom: 16,
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 5,
  },
  sectionAside: { color: theme.colors.textSecondary, fontSize: 11, textAlign: "right" },
  sectionAction: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  dashboardLead: { flexDirection: "row", alignItems: "stretch", gap: 16 },
  metrics: { flexDirection: "row", gap: 13 },
  stack: { flexDirection: "column" },
  metricCard: {
    flex: 1,
    minHeight: 168,
    padding: 20,
    borderRadius: 22,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    boxShadow: theme.shadows.insetLike,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: "600" },
  metricArrow: { color: theme.colors.accent, fontSize: 16 },
  metricReading: { flexDirection: "row", alignItems: "baseline", marginTop: 13 },
  metricValue: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1.3,
  },
  metricUnit: { color: theme.colors.textSecondary, fontSize: 13, marginLeft: 5 },
  metricDetail: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },
  workoutCard: {
    flex: 1.45,
    minHeight: 290,
    overflow: "hidden",
    borderRadius: 28,
    padding: 24,
    backgroundColor: theme.colors.darkSurface,
    boxShadow: theme.shadows.raised,
  },
  workoutCardGlow: { position: "absolute", width: 260, height: 260, borderRadius: 130, right: -90, top: -120, backgroundColor: "rgba(23,107,89,0.48)" },
  workoutTopline: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },
  workoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  workoutIconText: { color: "#A9D8CC", fontSize: 24 },
  workoutEyebrow: {
    color: "#A9D8CC",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  workoutDate: { color: "rgba(255,255,255,0.60)", fontSize: 12, marginTop: 6 },
  workoutTitle: { color: theme.colors.white, fontSize: 29, lineHeight: 34, fontWeight: "700", letterSpacing: -0.7, marginTop: 34 },
  workoutDescription: { color: "#B6BEBA", fontSize: 13, lineHeight: 20, marginTop: 9, maxWidth: 680 },
  workoutActionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: "auto", paddingTop: 24 },
  workoutStatus: { color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: "600" },
  workoutAction: { color: theme.colors.white, fontSize: 12, fontWeight: "700", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.10)" },
  weekCard: { flex: 1, minWidth: 0, minHeight: 290, padding: 22, borderRadius: 28, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.insetLike },
  weekCardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  weekCardTitle: { color: theme.colors.text, fontSize: 21, fontWeight: "700", marginTop: 6 },
  weekRange: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 2 },
  weekStats: { flexDirection: "row", marginTop: 24, paddingVertical: 17, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border },
  dashboardStat: { flex: 1, alignItems: "center" },
  dashboardStatValue: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  dashboardStatLabel: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 3 },
  weekFocus: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 17 },
  weekFocusMark: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accentSoft },
  weekFocusMarkText: { color: theme.colors.accent, fontSize: 16 },
  weekFocusCopy: { flex: 1 },
  weekFocusLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  weekFocusValue: { color: theme.colors.text, fontSize: 13, fontWeight: "700", marginTop: 3 },
  weekLink: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 16 },
  weekLinkText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  weekLinkArrow: { color: theme.colors.accent, fontSize: 17 },
  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    boxShadow: theme.shadows.soft,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentSoft,
  },
  quickIconText: { color: theme.colors.accent, fontSize: 16 },
  quickCopy: { flex: 1 },
  quickTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  quickDetail: { color: theme.colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 4 },
  quickArrow: { color: theme.colors.accent, fontSize: 16 },
  pressed: { opacity: 0.68 },
});
