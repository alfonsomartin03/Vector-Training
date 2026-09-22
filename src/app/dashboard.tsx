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
  const prescription = useMemo(() => prescribeWeek(athlete, availability.availability), [athlete, availability.availability]);
  const week = buildWeeklyTrainingPlan(new Date(), prescription.assignments);
  const today = week.days.find((day) => day.isToday) ?? week.days[0];
  const todayWorkout = resolveDayWorkout(today);
  const focus = getTrainingFocusDisplay(athlete?.profile.training_focus);
  const firstName = athlete?.profile.first_name?.trim() || "Athlete";
  const firstInitial = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.container, compact ? styles.containerCompact : undefined]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.push("/")}>
              <Text style={styles.logo}>VECTOR</Text>
            </Pressable>
            <Pressable style={styles.avatar} onPress={() => router.push("/profile")}>
              <Text style={styles.avatarText}>{firstInitial}</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>{getGreeting()}</Text>
            <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : undefined]}>
              Welcome back, {firstName}.
            </Text>
            <Text style={styles.heroSubtitle}>Your physiology and training at a glance.</Text>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {availability.error ? <Text accessibilityRole="alert">{availability.error}</Text> : !availability.loading && !availability.availability ? <Pressable onPress={() => router.push("/training")}><Text>Set your weekly availability on Training to generate a plan →</Text></Pressable> : null}

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

          <SectionHeader
            eyebrow="TODAY"
            title="Daily workout"
            aside={formatFullDate(today.date)}
            action="View week →"
            onPress={() => router.push("/training")}
          />

          <Pressable
            onPress={() => router.push("/training")}
            style={({ pressed }) => [
              styles.workoutCard,
              pressed ? styles.pressed : undefined,
            ]}
          >
            <View style={[styles.workoutMain, compact ? styles.workoutMainCompact : undefined]}>
              <View style={styles.workoutIcon}>
                <Text style={styles.workoutIconText}>○</Text>
              </View>
              <View style={styles.workoutCopy}>
                <Text style={styles.workoutEyebrow}>{todayWorkout.detail.toUpperCase()}</Text>
                <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
                <Text style={styles.workoutDescription}>{todayWorkout.description}</Text>
              </View>
              <Text style={styles.workoutArrow}>→</Text>
            </View>

            <View style={[styles.workoutFooter, compact ? styles.workoutFooterCompact : undefined]}>
              <Meta label="STATUS" value={availability.loading ? "Loading plan" : availability.error ? "Plan unavailable" : today.workout ? "Suggested" : "No workout assigned"} />
              <Meta label="CURRENT FOCUS" value={isLoading ? "Loading…" : error ? "Focus unavailable" : focus.title} />
              <Meta label="WEEK" value={formatWeekRange(week.startDate, week.endDate)} />
            </View>
          </Pressable>

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

      <BottomNav />
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function BottomNav() {
  const items = [
    ["⌂", "Home", "/dashboard"],
    ["⌁", "Training", "/training"],
    ["↗", "Power", "/power"],
    ["○", "Profile", "/profile"],
  ] as const;

  return (
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        {items.map(([symbol, label, route]) => {
          const active = route === "/dashboard";
          return (
            <Pressable
              key={route}
              onPress={() => router.push(route)}
              style={[styles.navItem, active ? styles.navItemActive : undefined]}
            >
              <Text style={[styles.navSymbol, active ? styles.navSymbolActive : undefined]}>
                {symbol}
              </Text>
              <Text style={[styles.navLabel, active ? styles.navLabelActive : undefined]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 30,
  },
  containerCompact: { paddingHorizontal: 18 },
  header: {
    height: 82,
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  hero: { paddingTop: 18, paddingBottom: 27 },
  heroEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -1.1,
    marginTop: 7,
  },
  heroTitleCompact: { fontSize: 27, lineHeight: 33 },
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
  metrics: { flexDirection: "row", gap: 13 },
  stack: { flexDirection: "column" },
  metricCard: {
    flex: 1,
    minHeight: 168,
    padding: 20,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    borderRadius: 20,
    padding: 24,
    backgroundColor: theme.colors.text,
  },
  workoutMain: { flexDirection: "row", alignItems: "center", gap: 18 },
  workoutMainCompact: { alignItems: "flex-start" },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24302D",
  },
  workoutIconText: { color: theme.colors.accent, fontSize: 24 },
  workoutCopy: { flex: 1 },
  workoutEyebrow: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  workoutTitle: { color: theme.colors.white, fontSize: 25, fontWeight: "700", marginTop: 5 },
  workoutDescription: { color: "#B6BEBA", fontSize: 12, lineHeight: 19, marginTop: 8, maxWidth: 680 },
  workoutArrow: { color: theme.colors.accent, fontSize: 24 },
  workoutFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 44,
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#2A2E2E",
  },
  workoutFooterCompact: { gap: 24 },
  metaLabel: { color: "#7F8884", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  metaValue: { color: theme.colors.white, fontSize: 11, fontWeight: "600", marginTop: 4 },
  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
