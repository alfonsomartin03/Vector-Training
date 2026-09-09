import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";
import { theme } from "../constants/theme";

export default function PowerPage() {
  const curve = [
    { label: "5s", power: 1280, height: 170 },
    { label: "15s", power: 1015, height: 148 },
    { label: "1m", power: 635, height: 108 },
    { label: "3m", power: 420, height: 82 },
    { label: "5m", power: 375, height: 72 },
    { label: "10m", power: 320, height: 60 },
    { label: "20m", power: 295, height: 52 },
    { label: "40m", power: 278, height: 47 },
  ];

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
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              POWER PROFILE
            </Text>

            <Text style={styles.title}>
              Your performance model.
            </Text>

            <Text style={styles.subtitle}>
              A living model of your aerobic and anaerobic capabilities.
            </Text>
          </View>

          <View style={styles.metrics}>
            <Metric
              label="Critical Power"
              value="291 W"
              change="+7 W"
            />

            <Metric
              label="W′"
              value="18.7 kJ"
              change="+0.2 kJ"
            />

            <Metric
              label="Est. VO₂max"
              value="64.1"
              change="+1.3"
            />
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                POWER-DURATION CURVE
              </Text>

              <Text style={styles.sectionTitle}>
                Current capabilities
              </Text>
            </View>

            <Text style={styles.period}>
              Last 90 days
            </Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {curve.map((item) => (
                <View
                  key={item.label}
                  style={styles.chartColumn}
                >
                  <Text style={styles.powerValue}>
                    {item.power}
                  </Text>

                  <View
                    style={[
                      styles.bar,
                      {
                        height: item.height,
                      },
                    ]}
                  />

                  <Text style={styles.duration}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.chartFooter}>
              <View>
                <Text style={styles.chartFooterLabel}>
                  MODEL
                </Text>

                <Text style={styles.chartFooterValue}>
                  2-parameter CP
                </Text>
              </View>

              <View>
                <Text style={styles.chartFooterLabel}>
                  LAST UPDATED
                </Text>

                <Text style={styles.chartFooterValue}>
                  Today
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.lowerGrid}>
            <View style={styles.confidenceCard}>
              <Text style={styles.cardEyebrow}>
                MODEL CONFIDENCE
              </Text>

              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceNumber}>
                  87%
                </Text>

                <View style={styles.confidencePill}>
                  <Text style={styles.confidencePillText}>
                    High
                  </Text>
                </View>
              </View>

              <View style={styles.progressBackground}>
                <View style={styles.progressFill} />
              </View>

              <Text style={styles.cardDescription}>
                Your current power data provide strong coverage across
                most durations used by the model.
              </Text>
            </View>

            <View style={styles.testCard}>
              <Text style={styles.cardEyebrow}>
                NEXT USEFUL TEST
              </Text>

              <Text style={styles.testTitle}>
                10-minute effort
              </Text>

              <Text style={styles.cardDescription}>
                Additional data between 8–12 minutes would improve
                confidence in your current CP estimate.
              </Text>

              <View style={styles.testBottom}>
                <Text style={styles.testImpact}>
                  Model impact · Moderate
                </Text>

                <Text style={styles.testArrow}>
                  →
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightEyebrow}>
              VECTOR INSIGHT
            </Text>

            <Text style={styles.insightTitle}>
              Your aerobic profile is improving.
            </Text>

            <Text style={styles.insightDescription}>
              Critical Power has increased while W′ remains nearly
              unchanged, suggesting recent gains are predominantly aerobic
              rather than coming from greater anaerobic contribution.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

type MetricProps = {
  label: string;
  value: string;
  change: string;
};

function Metric({
  label,
  value,
  change,
}: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <Text style={styles.metricChange}>
        ↑ {change} · 30 days
      </Text>
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
          active
          onPress={() => router.push("/power")}
        />

        <Nav
          symbol="○"
          label="Profile"
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

  metrics: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },

  metric: {
    flex: 1,
    minWidth: 210,
    padding: 22,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  metricValue: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "700",
    marginTop: 7,
  },

  metricChange: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },

  sectionHeader: {
    marginTop: 55,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  sectionEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "600",
    marginTop: 5,
  },

  period: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  chartCard: {
    padding: 26,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  chart: {
    height: 230,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  chartColumn: {
    flex: 1,
    alignItems: "center",
  },

  powerValue: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    marginBottom: 6,
  },

  bar: {
    width: "48%",
    maxWidth: 34,
    minWidth: 15,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },

  duration: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 8,
  },

  chartFooter: {
    flexDirection: "row",
    gap: 45,
    marginTop: 26,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  chartFooterLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    letterSpacing: 1,
  },

  chartFooterValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  lowerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },

  confidenceCard: {
    flex: 1,
    minWidth: 300,
    padding: 24,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  testCard: {
    flex: 1,
    minWidth: 300,
    padding: 24,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
  },

  cardEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },

  confidenceNumber: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "700",
  },

  confidencePill: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  confidencePillText: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
  },

  progressBackground: {
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    marginTop: 18,
  },

  progressFill: {
    width: "87%",
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
  },

  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 16,
  },

  testTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 9,
  },

  testBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  testImpact: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },

  testArrow: {
    color: theme.colors.accent,
    fontSize: 20,
  },

  insightCard: {
    marginTop: 12,
    padding: 26,
    borderRadius: 20,
    backgroundColor: theme.colors.text,
  },

  insightEyebrow: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  insightTitle: {
    color: theme.colors.white,
    fontSize: 23,
    fontWeight: "600",
    marginTop: 8,
  },

  insightDescription: {
    color: "#B8C0BD",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 720,
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