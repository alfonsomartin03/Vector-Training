import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

import { router } from "expo-router";
import { theme } from "../constants/theme";

export default function DashboardPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.container,
            isMobile ? styles.containerMobile : undefined,
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable onPress={() => router.push("/")}>
            <Text style={styles.logo}>VECTOR</Text>
            </Pressable>

            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>A</Text>
            </View>
          </View>

          {/* WELCOME */}
          <View style={styles.welcome}>
            <Text style={styles.welcomeOverline}>GOOD AFTERNOON</Text>

            <Text style={styles.welcomeTitle}>
              Welcome back, User.
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Your fitness is moving in the right direction.
            </Text>
          </View>

          {/* PROFILE HEADER */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionOverline}>
                CURRENT PROFILE
              </Text>

              <Text style={styles.sectionTitle}>
                Your physiology
              </Text>
            </View>

            <View style={styles.updatedPill}>
              <View style={styles.updatedDot} />
              <Text style={styles.updatedText}>Updated today</Text>
            </View>
          </View>

          {/* METRICS */}
          <View
            style={[
              styles.metricsGrid,
              isMobile ? styles.metricsGridMobile : undefined,
            ]}
          >
            <MetricCard
              label="Critical Power"
              value="291"
              unit="W"
              trend="+2.4%"
              trendLabel="30 days"
              bars={[42, 44, 43, 48, 52, 57, 61, 66]}
            />

            <MetricCard
              label="W′"
              value="18.7"
              unit="kJ"
              trend="+0.8%"
              trendLabel="30 days"
              bars={[54, 51, 53, 55, 56, 58, 59, 61]}
            />

            <MetricCard
              label="Est. VO₂max"
              value="64.1"
              unit=""
              trend="+1.3"
              trendLabel="30 days"
              bars={[44, 45, 48, 47, 51, 54, 56, 59]}
            />
          </View>

          {/* CURRENT DIRECTION */}
          <View style={styles.directionCard}>
            <View style={styles.directionTop}>
              <View>
                <Text style={styles.directionOverline}>
                  CURRENT DIRECTION
                </Text>

                <Text style={styles.directionTitle}>
                  Aerobic development
                </Text>
              </View>

              <View style={styles.directionIcon}>
                <Text style={styles.directionArrow}>↗</Text>
              </View>
            </View>

            <Text style={styles.directionDescription}>
              Your aerobic ceiling is currently the strongest
              opportunity for improvement. Vector is prioritizing
              training that raises sustainable aerobic power while
              preserving your anaerobic capacity.
            </Text>

            <View style={styles.directionFooter}>
              <Text style={styles.directionFooterLabel}>
                Training focus
              </Text>

              <Text style={styles.directionFooterValue}>
                VO₂ development + aerobic volume
              </Text>
            </View>
          </View>

          {/* TRAINING HEADER */}
          <View style={styles.trainingHeader}>
            <View>
              <Text style={styles.sectionOverline}>TRAINING</Text>

              <Text style={styles.sectionTitle}>
                What's next
              </Text>
            </View>

            <Pressable onPress={() => {}}>
              <Text style={styles.viewWeek}>
                View week →
              </Text>
            </Pressable>
          </View>

          {/* WORKOUTS */}
          <View style={styles.workouts}>
            <Pressable
              style={styles.todayWorkout}
              onPress={() => {}}
            >
              <View style={styles.workoutDateColumn}>
                <Text style={styles.workoutDay}>TODAY</Text>
                <Text style={styles.workoutDate}>08</Text>
              </View>

              <View style={styles.workoutDivider} />

              <View style={styles.workoutMain}>
                <View style={styles.workoutTop}>
                  <View>
                    <Text style={styles.workoutType}>
                      AEROBIC DEVELOPMENT
                    </Text>

                    <Text style={styles.workoutTitle}>
                      5 × 4 min VO₂
                    </Text>
                  </View>

                  <View style={styles.priorityPill}>
                    <Text style={styles.priorityText}>
                      Key session
                    </Text>
                  </View>
                </View>

                <Text style={styles.workoutDescription}>
                  Five controlled severe-domain efforts designed
                  to accumulate time near maximal aerobic uptake.
                </Text>

                <View style={styles.workoutStats}>
                  <WorkoutStat
                    label="Duration"
                    value="1h 20m"
                  />

                  <WorkoutStat
                    label="Work"
                    value="5 × 4m"
                  />

                  <WorkoutStat
                    label="Target"
                    value="340–355 W"
                  />
                </View>

                <View style={styles.intervalPreview}>
                  <IntervalBlock width={34} height={18} />

                  <IntervalBlock
                    width={10}
                    height={8}
                    recovery
                  />

                  <IntervalBlock width={24} height={40} />

                  <IntervalBlock
                    width={10}
                    height={8}
                    recovery
                  />

                  <IntervalBlock width={24} height={40} />

                  <IntervalBlock
                    width={10}
                    height={8}
                    recovery
                  />

                  <IntervalBlock width={24} height={40} />

                  <IntervalBlock
                    width={10}
                    height={8}
                    recovery
                  />

                  <IntervalBlock width={24} height={40} />

                  <IntervalBlock
                    width={10}
                    height={8}
                    recovery
                  />

                  <IntervalBlock width={24} height={40} />

                  <IntervalBlock width={44} height={16} />
                </View>
              </View>

              <Text style={styles.workoutArrow}>→</Text>
            </Pressable>

            {/* TOMORROW */}
            <View style={styles.tomorrowWorkout}>
              <View style={styles.workoutDateColumn}>
                <Text style={styles.tomorrowDay}>
                  TOMORROW
                </Text>

                <Text style={styles.tomorrowDate}>09</Text>
              </View>

              <View style={styles.workoutDivider} />

              <View style={styles.restMain}>
                <Text style={styles.restLabel}>
                  RECOVERY
                </Text>

                <Text style={styles.restTitle}>
                  Rest day
                </Text>

                <Text style={styles.restDescription}>
                  No structured training. Let today's work turn
                  into adaptation.
                </Text>
              </View>

              <View style={styles.restCircle}>
                <Text style={styles.restSymbol}>—</Text>
              </View>
            </View>
          </View>

          {/* VECTOR INSIGHT */}
          <View style={styles.insight}>
            <View style={styles.insightMarker} />

            <View style={styles.insightContent}>
              <Text style={styles.insightOverline}>
                VECTOR INSIGHT
              </Text>

              <Text style={styles.insightText}>
                Your Critical Power has risen approximately{" "}
                <Text style={styles.insightHighlight}>7 W</Text>{" "}
                over the last 30 days while W′ has remained
                stable — a useful sign that aerobic development
                is occurring without sacrificing high-intensity
                capacity.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

    <BottomNav active="home"/>
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
  trend: string;
  trendLabel: string;
  bars: number[];
};

function MetricCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  bars,
}: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>

        {unit ? (
          <Text style={styles.metricUnit}>
            {unit}
          </Text>
        ) : null}
      </View>

      <View style={styles.metricTrendRow}>
        <Text style={styles.metricTrend}>
          ↑ {trend}
        </Text>

        <Text style={styles.metricTrendPeriod}>
          {trendLabel}
        </Text>
      </View>

      <View style={styles.miniChart}>
        {bars.map((height, index) => (
          <View
            key={index}
            style={[
              styles.miniBar,
              {
                height,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type WorkoutStatProps = {
  label: string;
  value: string;
};

function WorkoutStat({
  label,
  value,
}: WorkoutStatProps) {
  return (
    <View>
      <Text style={styles.workoutStatLabel}>
        {label}
      </Text>

      <Text style={styles.workoutStatValue}>
        {value}
      </Text>
    </View>
  );
}

type IntervalBlockProps = {
  width: number;
  height: number;
  recovery?: boolean;
};

function IntervalBlock({
  width,
  height,
  recovery,
}: IntervalBlockProps) {
  return (
    <View
      style={[
        styles.intervalBlock,
        recovery
          ? styles.intervalRecovery
          : undefined,
        {
          width,
          height,
        },
      ]}
    />
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
          onPress={() => router.push("/dashboard")}
        />

        <Nav
          symbol="⌁"
          label="Training"
          active={active === "training"}
          onPress={() => router.push("/training")}
        />

        <Nav
          symbol="↗"
          label="Power"
          active={active === "power"}
          onPress={() => router.push("/power")}
        />

        <Nav
          symbol="○"
          label="Profile"
          active={active === "profile"}
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

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.textSecondary,
    fontSize: 17,
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },

  sectionOverline: {
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  updatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },

  updatedText: {
    color: theme.colors.textSecondary,
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
    minHeight: 205,
    padding: 22,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
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
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  metricTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  metricTrend: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },

  metricTrendPeriod: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  miniChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    marginTop: 20,
  },

  miniBar: {
    flex: 1,
    minWidth: 6,
    maxWidth: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.accentSoft,
    borderTopWidth: 2,
    borderTopColor: theme.colors.accent,
  },

  directionCard: {
    marginTop: 18,
    padding: 28,
    borderRadius: 22,
    backgroundColor: theme.colors.text,
  },

  directionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  workouts: {
    gap: 12,
  },

  todayWorkout: {
    minHeight: 210,
    flexDirection: "row",
    alignItems: "stretch",
    padding: 24,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tomorrowWorkout: {
    minHeight: 145,
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 22,
    backgroundColor: "#F1F2F0",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  workoutDateColumn: {
    width: 72,
  },

  workoutDay: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  tomorrowDay: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  workoutDate: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "600",
    marginTop: 6,
  },

  tomorrowDate: {
    color: theme.colors.textSecondary,
    fontSize: 34,
    fontWeight: "600",
    marginTop: 6,
  },

  workoutDivider: {
    width: 1,
    marginRight: 24,
    backgroundColor: theme.colors.border,
  },

  workoutMain: {
    flex: 1,
  },

  workoutTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  workoutType: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  workoutTitle: {
    color: theme.colors.text,
    fontSize: 23,
    fontWeight: "600",
    marginTop: 5,
  },

  priorityPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.accentSoft,
  },

  priorityText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
  },

  workoutDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 620,
  },

  workoutStats: {
    flexDirection: "row",
    gap: 36,
    marginTop: 18,
  },

  workoutStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  workoutStatValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },

  intervalPreview: {
    height: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    marginTop: 22,
  },

  intervalBlock: {
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },

  intervalRecovery: {
    backgroundColor: theme.colors.accentSoft,
  },

  workoutArrow: {
    alignSelf: "center",
    marginLeft: 18,
    color: theme.colors.accent,
    fontSize: 24,
  },

  restMain: {
    flex: 1,
  },

  restLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  restTitle: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "600",
    marginTop: 5,
  },

  restDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 7,
  },

  restCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

  restSymbol: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },

  insight: {
    flexDirection: "row",
    marginTop: 22,
    padding: 24,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
  },

  insightMarker: {
    width: 3,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
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
    color: theme.colors.textSecondary,
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
    lineHeight: 20,
  },

  navSymbolActive: {
    color: theme.colors.accent,
  },

  navLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
    marginTop: 3,
  },

  navLabelActive: {
    color: theme.colors.text,
    fontWeight: "600",
  },
});