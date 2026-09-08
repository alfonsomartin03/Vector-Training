import type { ReactNode } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { router } from "expo-router";

import Button from "../components/ui/Button";
import { theme } from "../constants/theme";

export default function LandingPage() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isLarge = width >= 1200;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.container,
          isLarge ? styles.containerLarge : undefined,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VECTOR</Text>

          <Button
            title="Log in"
            variant="secondary"
            onPress={() => router.push("/login")}
          />
        </View>

        {/* Hero */}
        <View
          style={[
            styles.hero,
            isMobile ? styles.heroMobile : undefined,
          ]}
        >
          <View style={styles.heroCopy}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>
                Adaptive cycling training
              </Text>
            </View>

            <Text
              style={[
                styles.heroTitle,
                isMobile ? styles.heroTitleMobile : undefined,
              ]}
            >
              Training, in the{" "}
              <Text style={styles.heroAccent}>
                right direction.
              </Text>
            </Text>

            <Text
              style={[
                styles.heroSubtitle,
                isMobile ? styles.heroSubtitleMobile : undefined,
              ]}
            >
              Vector understands how you perform, identifies what needs work,
              and builds training around your actual physiology.
            </Text>

            <View
              style={[
                styles.heroActions,
                isMobile ? styles.heroActionsMobile : undefined,
              ]}
            >
              <Button
                title="Get started"
                onPress={() => router.push("/dashboard")}
              />

              <Button
                title="Learn how it works"
                variant="secondary"
              />
            </View>
          </View>

          {/* Hero profile visual */}
          <View
            style={[
              styles.heroVisual,
              isMobile ? styles.heroVisualMobile : undefined,
            ]}
          >
            <View style={styles.visualTopRow}>
              <View>
                <Text style={styles.visualLabel}>
                  Current profile
                </Text>

                <Text style={styles.visualTitle}>
                  Built around you.
                </Text>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  Adaptive
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Metric
                label="Critical Power"
                value="291"
                unit="W"
                trend="+2.4%"
              />

              <Metric
                label="W′"
                value="18.7"
                unit="kJ"
                trend="+0.8%"
              />

              <Metric
                label="Est. VO₂max"
                value="66.2"
                unit=""
                trend="+1.3"
              />
            </View>

            <View style={styles.graph}>
              <View style={styles.graphLine1} />
              <View style={styles.graphLine2} />
              <View style={styles.graphLine3} />

              <View style={[styles.bar, styles.bar1]} />
              <View style={[styles.bar, styles.bar2]} />
              <View style={[styles.bar, styles.bar3]} />
              <View style={[styles.bar, styles.bar4]} />
              <View style={[styles.bar, styles.bar5]} />
              <View style={[styles.bar, styles.bar6]} />
              <View style={[styles.bar, styles.bar7]} />
              <View style={[styles.bar, styles.bar8]} />
            </View>

            <View style={styles.visualFooter}>
              <View>
                <Text style={styles.visualFooterLabel}>
                  Current priority
                </Text>

                <Text style={styles.visualFooterValue}>
                  Aerobic development
                </Text>
              </View>

              <Text style={styles.visualFooterArrow}>
                →
              </Text>
            </View>
          </View>
        </View>

        {/* Philosophy section */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            THE VECTOR APPROACH
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              isMobile ? styles.sectionTitleMobile : undefined,
            ]}
          >
            Built around the athlete, not a single number.
          </Text>

          <Text style={styles.sectionBody}>
            Your training should reflect how you actually perform.
            Vector uses multiple dimensions of your power profile to
            determine what matters most right now — without making you
            interpret a wall of data.
          </Text>
        </View>

        {/* Process */}
        <View
          style={[
            styles.process,
            isMobile ? styles.processMobile : undefined,
          ]}
        >
          <ProcessItem
            number="01"
            title="Measure"
          >
            Build your power profile using real performance data.
          </ProcessItem>

          <ProcessItem
            number="02"
            title="Understand"
          >
            Identify the current limiter and strongest opportunity.
          </ProcessItem>

          <ProcessItem
            number="03"
            title="Train"
          >
            Receive training designed around the adaptation you need.
          </ProcessItem>

          <ProcessItem
            number="04"
            title="Adapt"
          >
            Your recommendations evolve as your fitness changes.
          </ProcessItem>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Text
            style={[
              styles.ctaTitle,
              isMobile ? styles.ctaTitleMobile : undefined,
            ]}
          >
            Your training should know where you're going.
          </Text>

          <Text style={styles.ctaBody}>
            Build your profile and let Vector determine the next step.
          </Text>

          <Button
            title="Build your profile"
            onPress={() => router.push("/register")}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            VECTOR
          </Text>

          <Text style={styles.footerText}>
            Training, in the right direction.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

type MetricProps = {
  label: string;
  value: string;
  unit: string;
  trend: string;
};

function Metric({
  label,
  value,
  unit,
  trend,
}: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>
          {value}
        </Text>

        {unit ? (
          <Text style={styles.metricUnit}>
            {unit}
          </Text>
        ) : null}
      </View>

      <Text style={styles.metricTrend}>
        ↑ {trend}
      </Text>
    </View>
  );
}

type ProcessItemProps = {
  number: string;
  title: string;
  children: ReactNode;
};

function ProcessItem({
  number,
  title,
  children,
}: ProcessItemProps) {
  return (
    <View style={styles.processItem}>
      <Text style={styles.processNumber}>
        {number}
      </Text>

      <Text style={styles.processTitle}>
        {title}
      </Text>

      <Text style={styles.processBody}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    alignItems: "center",
  },

  container: {
    width: "100%",
    maxWidth: 1120,
    paddingHorizontal: 24,
  },

  containerLarge: {
    paddingHorizontal: 0,
  },

  header: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 4,
  },

  hero: {
    minHeight: 680,
    flexDirection: "row",
    alignItems: "center",
    gap: 80,
    paddingVertical: 70,
  },

  heroMobile: {
    minHeight: 0,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 54,
    paddingVertical: 56,
  },

  heroCopy: {
    flex: 1,
  },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 24,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },

  eyebrowText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  heroTitle: {
    maxWidth: 650,
    color: theme.colors.text,
    fontSize: 68,
    lineHeight: 72,
    fontWeight: "700",
    letterSpacing: -3.2,
  },

  heroTitleMobile: {
    fontSize: 48,
    lineHeight: 51,
    letterSpacing: -2,
  },

  heroAccent: {
    color: theme.colors.accent,
  },

  heroSubtitle: {
    maxWidth: 580,
    marginTop: 26,
    color: theme.colors.textSecondary,
    fontSize: 19,
    lineHeight: 30,
  },

  heroSubtitleMobile: {
    fontSize: 17,
    lineHeight: 27,
  },

  heroActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 36,
    alignItems: "center",
  },

  heroActionsMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  heroVisual: {
    width: 410,
    minHeight: 440,
    padding: 28,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  heroVisualMobile: {
    width: "100%",
  },

  visualTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  visualLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 5,
  },

  visualTitle: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "600",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 36,
  },

  metric: {
    flex: 1,
  },

  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },

  metricValue: {
    color: theme.colors.text,
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -1,
  },

  metricUnit: {
    marginLeft: 3,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },

  metricTrend: {
    marginTop: 4,
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "600",
  },

  graph: {
    height: 120,
    marginTop: 40,
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  graphLine1: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 30,
    height: 1,
    backgroundColor: theme.colors.border,
  },

  graphLine2: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 60,
    height: 1,
    backgroundColor: theme.colors.border,
  },

  graphLine3: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 90,
    height: 1,
    backgroundColor: theme.colors.border,
  },

  bar: {
    flex: 1,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: theme.colors.accentSoft,
    borderTopWidth: 2,
    borderTopColor: theme.colors.accent,
  },

  bar1: {
    height: 30,
  },

  bar2: {
    height: 45,
  },

  bar3: {
    height: 52,
  },

  bar4: {
    height: 69,
  },

  bar5: {
    height: 63,
  },

  bar6: {
    height: 82,
  },

  bar7: {
    height: 96,
  },

  bar8: {
    height: 108,
  },

  visualFooter: {
    marginTop: 30,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  visualFooterLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  visualFooterValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  visualFooterArrow: {
    color: theme.colors.accent,
    fontSize: 24,
  },

  section: {
    maxWidth: 760,
    paddingVertical: 110,
  },

  sectionEyebrow: {
    marginBottom: 16,
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    letterSpacing: -1.8,
  },

  sectionTitleMobile: {
    fontSize: 34,
    lineHeight: 39,
  },

  sectionBody: {
    marginTop: 22,
    color: theme.colors.textSecondary,
    fontSize: 18,
    lineHeight: 30,
  },

  process: {
    flexDirection: "row",
    gap: 36,
    paddingBottom: 120,
  },

  processMobile: {
    flexDirection: "column",
    gap: 38,
  },

  processItem: {
    flex: 1,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  processNumber: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  processTitle: {
    marginTop: 18,
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: "600",
  },

  processBody: {
    marginTop: 9,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  cta: {
    alignItems: "flex-start",
    paddingVertical: 90,
    paddingHorizontal: 50,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  ctaTitle: {
    maxWidth: 650,
    color: theme.colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    letterSpacing: -1.8,
  },

  ctaTitleMobile: {
    fontSize: 34,
    lineHeight: 39,
  },

  ctaBody: {
    maxWidth: 560,
    marginTop: 18,
    marginBottom: 30,
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 27,
  },

  footer: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerLogo: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 3,
  },

  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});