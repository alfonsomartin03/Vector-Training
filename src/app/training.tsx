import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";
import { theme } from "../constants/theme";

export default function TrainingPage() {
  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>VECTOR</Text>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              TRAINING
            </Text>

            <Text style={styles.title}>
              This week's direction.
            </Text>

            <Text style={styles.subtitle}>
              Training is currently focused on raising your aerobic ceiling.
            </Text>
          </View>

          <View style={styles.focusCard}>
            <View style={styles.focusContent}>
              <Text style={styles.focusEyebrow}>
                CURRENT FOCUS
              </Text>

              <Text style={styles.focusTitle}>
                Aerobic development
              </Text>

              <Text style={styles.focusDescription}>
                Build maximal aerobic power while maintaining the aerobic
                volume supporting your current Critical Power.
              </Text>
            </View>

            <View style={styles.focusScore}>
              <Text style={styles.focusScoreNumber}>
                72%
              </Text>

              <Text style={styles.focusScoreLabel}>
                weekly load
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              This week
            </Text>

            <Text style={styles.weekText}>
              Sep 7 – Sep 13
            </Text>
          </View>

          <View style={styles.week}>
            <Day
              day="MON"
              date="07"
              title="Endurance"
              detail="1h 30m · Z2"
              completed
            />

            <Day
              day="TUE"
              date="08"
              title="5 × 4 min VO₂"
              detail="1h 20m · Key session"
              active
            />

            <Day
              day="WED"
              date="09"
              title="Rest day"
              detail="Recovery"
              muted
            />

            <Day
              day="THU"
              date="10"
              title="Aerobic endurance"
              detail="2h 00m · Z2"
            />

            <Day
              day="FRI"
              date="11"
              title="Threshold"
              detail="3 × 12 min · CP development"
            />

            <Day
              day="SAT"
              date="12"
              title="Durability"
              detail="3h 30m · Endurance"
            />

            <Day
              day="SUN"
              date="13"
              title="Recovery"
              detail="1h 00m · Easy"
              muted
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Today's session
            </Text>
          </View>

          <View style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <View>
                <Text style={styles.sessionEyebrow}>
                  AEROBIC DEVELOPMENT
                </Text>

                <Text style={styles.sessionTitle}>
                  5 × 4 min VO₂
                </Text>
              </View>

              <View style={styles.keyPill}>
                <Text style={styles.keyText}>
                  Key session
                </Text>
              </View>
            </View>

            <Text style={styles.sessionDescription}>
              Controlled severe-domain work designed to maximize time near
              your aerobic ceiling without excessive anaerobic contribution.
            </Text>

            <View style={styles.stats}>
              <Stat label="Duration" value="1h 20m" />
              <Stat label="Target" value="340–355 W" />
              <Stat label="Work" value="20 min" />
              <Stat label="Fuel" value="60–80 g/h" />
            </View>

            <View style={styles.workoutGraph}>
              <Block width={54} height={20} />
              <Block width={26} height={52} />
              <Block width={14} height={12} recovery />
              <Block width={26} height={52} />
              <Block width={14} height={12} recovery />
              <Block width={26} height={52} />
              <Block width={14} height={12} recovery />
              <Block width={26} height={52} />
              <Block width={14} height={12} recovery />
              <Block width={26} height={52} />
              <Block width={68} height={18} />
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="training" />
    </View>
  );
}

type DayProps = {
  day: string;
  date: string;
  title: string;
  detail: string;
  active?: boolean;
  muted?: boolean;
  completed?: boolean;
};

function Day({
  day,
  date,
  title,
  detail,
  active,
  muted,
  completed,
}: DayProps) {
  return (
    <View
      style={[
        styles.day,
        active ? styles.dayActive : undefined,
        muted ? styles.dayMuted : undefined,
      ]}
    >
      <View style={styles.dayDate}>
        <Text
          style={[
            styles.dayName,
            active ? styles.activeDay : undefined,
          ]}
        >
          {day}
        </Text>

        <Text style={styles.dateNumber}>
          {date}
        </Text>
      </View>

      <View style={styles.dayContent}>
        <Text style={styles.dayTitle}>
          {title}
        </Text>

        <Text style={styles.dayDetail}>
          {detail}
        </Text>
      </View>

      {completed ? (
        <Text style={styles.completed}>
          ✓
        </Text>
      ) : null}

      {active ? (
        <Text style={styles.arrow}>
          →
        </Text>
      ) : null}
    </View>
  );
}

type StatProps = {
  label: string;
  value: string;
};

function Stat({
  label,
  value,
}: StatProps) {
  return (
    <View>
      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

type BlockProps = {
  width: number;
  height: number;
  recovery?: boolean;
};

function Block({
  width,
  height,
  recovery,
}: BlockProps) {
  return (
    <View
      style={[
        styles.block,
        recovery ? styles.recoveryBlock : undefined,
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

function BottomNav({
  active,
}: {
  active: NavKey;
}) {
  return (
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        <Nav
          label="Home"
          symbol="⌂"
          active={active === "home"}
          onPress={() => router.push("/dashboard")}
        />

        <Nav
          label="Training"
          symbol="⌁"
          active={active === "training"}
          onPress={() => router.push("/training")}
        />

        <Nav
          label="Power"
          symbol="↗"
          active={active === "power"}
          onPress={() => router.push("/power")}
        />

        <Nav
          label="Profile"
          symbol="○"
          active={active === "profile"}
          onPress={() => router.push("/profile")}
        />
      </View>
    </View>
  );
}

type NavProps = {
  label: string;
  symbol: string;
  active?: boolean;
  onPress: () => void;
};

function Nav({
  label,
  symbol,
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
    maxWidth: 1050,
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

  hero: {
    paddingTop: 42,
    paddingBottom: 45,
  },

  eyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  title: {
    color: theme.colors.text,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1.5,
    marginTop: 10,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 10,
  },

  focusCard: {
    backgroundColor: theme.colors.text,
    borderRadius: 22,
    padding: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 30,
  },

  focusContent: {
    flex: 1,
  },

  focusEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
  },

  focusTitle: {
    color: theme.colors.white,
    fontSize: 25,
    fontWeight: "600",
    marginTop: 7,
  },

  focusDescription: {
    color: "#B6BEBA",
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 620,
    marginTop: 12,
  },

  focusScore: {
    alignItems: "flex-end",
  },

  focusScoreNumber: {
    color: theme.colors.white,
    fontSize: 30,
    fontWeight: "600",
  },

  focusScoreLabel: {
    color: "#777F7B",
    fontSize: 10,
    marginTop: 3,
  },

  sectionHeader: {
    marginTop: 55,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "600",
  },

  weekText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  week: {
    gap: 8,
  },

  day: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 15,
  },

  dayActive: {
    borderColor: theme.colors.accent,
  },

  dayMuted: {
    backgroundColor: "#F1F2F0",
  },

  dayDate: {
    width: 62,
  },

  dayName: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  activeDay: {
    color: theme.colors.accent,
  },

  dateNumber: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 2,
  },

  dayContent: {
    flex: 1,
  },

  dayTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  dayDetail: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  completed: {
    color: theme.colors.accent,
    fontSize: 18,
  },

  arrow: {
    color: theme.colors.accent,
    fontSize: 20,
    marginLeft: 12,
  },

  sessionCard: {
    padding: 26,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  sessionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  sessionEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  sessionTitle: {
    color: theme.colors.text,
    fontSize: 25,
    fontWeight: "600",
    marginTop: 6,
  },

  keyPill: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  keyText: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
  },

  sessionDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 14,
    maxWidth: 700,
  },

  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 38,
    marginTop: 25,
  },

  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    textTransform: "uppercase",
  },

  statValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  workoutGraph: {
    height: 60,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 30,
  },

  block: {
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },

  recoveryBlock: {
    backgroundColor: theme.colors.accentSoft,
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
});