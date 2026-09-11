import type { ReactNode } from "react";

import {
  Pressable,
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
  const isTablet = width < 1024;
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
          <Pressable onPress={() => router.push("/")}>
            <Text style={styles.logo}>VECTOR</Text>
          </Pressable>

          {!isMobile ? (
            <View style={styles.nav}>
              <NavLink
                title="How it works"
                onPress={() => router.push("/how-it-works")}
              />

              <NavLink
                title="The science"
                onPress={() => router.push("/science")}
              />

              <NavLink
                title="About"
                onPress={() => router.push("/about")}
              />
            </View>
          ) : null}

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
            isTablet ? styles.heroTablet : undefined,
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
              Vector analyzes how you perform across multiple physiological
              dimensions, identifies what is holding you back, and turns that
              information into focused training.
            </Text>

            <View
              style={[
                styles.heroActions,
                isMobile ? styles.heroActionsMobile : undefined,
              ]}
            >
              <Button
                title="Build your profile"
                onPress={() => router.push("/register")}
              />

              <Button
                title="See how Vector works"
                variant="secondary"
                onPress={() => router.push("/how-it-works")}
              />
            </View>

            <Text style={styles.heroNote}>
              Built for cyclists who want to understand what to train next,
              not just collect more metrics.
            </Text>
          </View>

          {/* Profile visual */}
          <View
            style={[
              styles.heroVisual,
              isTablet ? styles.heroVisualTablet : undefined,
            ]}
          >
            <View style={styles.visualTopRow}>
              <View>
                <Text style={styles.visualLabel}>
                  ATHLETE PROFILE
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

            <View
              style={[
                styles.metricsRow,
                isMobile ? styles.metricsRowMobile : undefined,
              ]}
            >
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
                  CURRENT PRIORITY
                </Text>

                <Text style={styles.visualFooterValue}>
                  Aerobic development
                </Text>
              </View>

              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>
                  High impact
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Problem / philosophy */}
        <View style={styles.centerSection}>
          <Text style={styles.sectionEyebrow}>
            WHY VECTOR
          </Text>

          <Text
            style={[
              styles.centerTitle,
              isMobile ? styles.sectionTitleMobile : undefined,
            ]}
          >
            Fitness is more than one number.
          </Text>

          <Text style={styles.centerBody}>
            Two riders can have the same FTP and need completely different
            training. Vector looks beyond a single threshold to understand
            how your strengths and weaknesses fit together.
          </Text>
        </View>

        {/* What Vector does */}
        <View
          style={[
            styles.featureGrid,
            isTablet ? styles.featureGridTablet : undefined,
          ]}
        >
          <FeatureCard
            number="01"
            eyebrow="PROFILE"
            title="Understand your performance"
          >
            Build a picture of your current capabilities using your power
            profile and athlete data instead of relying on one isolated
            performance metric.
          </FeatureCard>

          <FeatureCard
            number="02"
            eyebrow="ANALYZE"
            title="Find what is holding you back"
          >
            Vector compares different parts of your performance to identify
            the area with the greatest opportunity for improvement.
          </FeatureCard>

          <FeatureCard
            number="03"
            eyebrow="TRAIN"
            title="Focus on what matters"
          >
            Turn your profile into a clear training priority so your sessions
            target the adaptation most likely to improve your performance.
          </FeatureCard>
        </View>

        {/* How it works */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>
            HOW IT WORKS
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              isMobile ? styles.sectionTitleMobile : undefined,
            ]}
          >
            From performance data to a training direction.
          </Text>

          <Text style={styles.sectionBody}>
            Vector is designed to answer a simple question: based on the
            athlete you are today, where should your training effort go next?
          </Text>
        </View>

        <View
          style={[
            styles.process,
            isTablet ? styles.processTablet : undefined,
          ]}
        >
          <ProcessItem
            number="01"
            title="Establish"
          >
            Complete your athlete profile and provide the performance data
            needed to establish your current baseline.
          </ProcessItem>

          <ProcessItem
            number="02"
            title="Model"
          >
            Vector evaluates your power-duration capabilities and other
            relevant performance indicators.
          </ProcessItem>

          <ProcessItem
            number="03"
            title="Prioritize"
          >
            Your profile is translated into strengths, weaknesses, and a
            primary area of focus.
          </ProcessItem>

          <ProcessItem
            number="04"
            title="Adapt"
          >
            As your performance changes, your profile and training priorities
            can change with it.
          </ProcessItem>
        </View>

        {/* Beyond FTP */}
        <View
          style={[
            styles.splitSection,
            isTablet ? styles.splitSectionTablet : undefined,
          ]}
        >
          <View style={styles.splitCopy}>
            <Text style={styles.sectionEyebrow}>
              A BETTER PERFORMANCE MODEL
            </Text>

            <Text
              style={[
                styles.sectionTitle,
                isMobile ? styles.sectionTitleMobile : undefined,
              ]}
            >
              Look beyond FTP.
            </Text>

            <Text style={styles.sectionBody}>
              Threshold power is useful, but it cannot explain every kind of
              cyclist. Vector combines multiple characteristics of your
              performance to build a more complete view of the athlete.
            </Text>

            <Pressable
              onPress={() => router.push("/science")}
              style={styles.textLink}
            >
              <Text style={styles.textLinkText}>
                Explore the methodology →
              </Text>
            </Pressable>
          </View>

          <View style={styles.modelCard}>
            <ModelRow
              label="Critical Power"
              description="Your sustainable high-intensity aerobic power."
            />

            <ModelRow
              label="W′"
              description="Your finite work capacity above critical power."
            />

            <ModelRow
              label="Power profile"
              description="How your capabilities change across different durations."
            />

            <ModelRow
              label="Aerobic profile"
              description="Additional context for understanding aerobic development."
              last
            />
          </View>
        </View>

        {/* Training output */}
        <View style={styles.outputSection}>
          <View style={styles.centerSectionCompact}>
            <Text style={styles.sectionEyebrow}>
              LESS DATA. MORE DIRECTION.
            </Text>

            <Text
              style={[
                styles.centerTitle,
                isMobile ? styles.sectionTitleMobile : undefined,
              ]}
            >
              The analysis should lead somewhere.
            </Text>

            <Text style={styles.centerBody}>
              Vector is not designed to leave you staring at another
              dashboard. The goal is to turn performance data into a clear
              decision about what deserves your attention.
            </Text>
          </View>

          <View
            style={[
              styles.outputGrid,
              isTablet ? styles.outputGridTablet : undefined,
            ]}
          >
            <OutputCard
              label="STRENGTH"
              value="Anaerobic capacity"
              detail="A capability you can preserve while focusing training elsewhere."
            />

            <OutputCard
              label="LIMITER"
              value="Aerobic power"
              detail="The area currently restricting further performance development."
            />

            <OutputCard
              label="PRIORITY"
              value="VO₂ development"
              detail="The adaptation that should receive focused training attention."
            />
          </View>
        </View>

        {/* Adaptation */}
        <View
          style={[
            styles.splitSection,
            isTablet ? styles.splitSectionTablet : undefined,
          ]}
        >
          <View style={styles.adaptiveVisual}>
            <View style={styles.adaptiveHeader}>
              <Text style={styles.adaptiveLabel}>
                TRAINING DIRECTION
              </Text>

              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  Updated
                </Text>
              </View>
            </View>

            <Text style={styles.adaptiveTitle}>
              Your training changes when you do.
            </Text>

            <View style={styles.adaptiveFlow}>
              <FlowItem
                label="Previous priority"
                value="VO₂ development"
              />

              <Text style={styles.flowArrow}>
                →
              </Text>

              <FlowItem
                label="New priority"
                value="Durability"
              />
            </View>
          </View>

          <View style={styles.splitCopy}>
            <Text style={styles.sectionEyebrow}>
              ADAPTIVE BY DESIGN
            </Text>

            <Text
              style={[
                styles.sectionTitle,
                isMobile ? styles.sectionTitleMobile : undefined,
              ]}
            >
              Training priorities should not be permanent.
            </Text>

            <Text style={styles.sectionBody}>
              When one weakness improves, something else may become the next
              constraint. Reassessing your performance allows Vector to keep
              your training aligned with the athlete you are becoming.
            </Text>
          </View>
        </View>

        {/* Transparency note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteEyebrow}>
            BUILT FOR INFORMED TRAINING
          </Text>

          <Text style={styles.noteText}>
            Vector uses performance modeling to help guide training decisions.
            Estimates derived from cycling data are not intended to replace
            laboratory physiological testing or professional medical advice.
          </Text>
        </View>

        {/* CTA */}
        <View
          style={[
            styles.cta,
            isMobile ? styles.ctaMobile : undefined,
          ]}
        >
          <Text
            style={[
              styles.ctaTitle,
              isMobile ? styles.ctaTitleMobile : undefined,
            ]}
          >
            Stop guessing what to train next.
          </Text>

          <Text style={styles.ctaBody}>
            Build your athlete profile and let Vector turn your performance
            data into a direction.
          </Text>

          <View
            style={[
              styles.heroActions,
              isMobile ? styles.heroActionsMobile : undefined,
            ]}
          >
            <Button
              title="Get started"
              onPress={() => router.push("/register")}
            />

            <Button
              title="Learn how it works"
              variant="secondary"
              onPress={() => router.push("/how-it-works")}
            />
          </View>
        </View>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            isMobile ? styles.footerMobile : undefined,
          ]}
        >
          <View>
            <Text style={styles.footerLogo}>
              VECTOR
            </Text>

            <Text style={styles.footerTagline}>
              Training, in the right direction.
            </Text>
          </View>

          <View
            style={[
              styles.footerLinks,
              isMobile ? styles.footerLinksMobile : undefined,
            ]}
          >
            <NavLink
              title="How it works"
              onPress={() => router.push("/how-it-works")}
            />

            <NavLink
              title="Science"
              onPress={() => router.push("/science")}
            />

            <NavLink
              title="About"
              onPress={() => router.push("/about")}
            />

            <NavLink
              title="Privacy"
              onPress={() => router.push("/privacy")}
            />
          </View>
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

type FeatureCardProps = {
  number: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

function FeatureCard({
  number,
  eyebrow,
  title,
  children,
}: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureTop}>
        <Text style={styles.featureNumber}>
          {number}
        </Text>

        <Text style={styles.featureEyebrow}>
          {eyebrow}
        </Text>
      </View>

      <Text style={styles.featureTitle}>
        {title}
      </Text>

      <Text style={styles.featureBody}>
        {children}
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

type ModelRowProps = {
  label: string;
  description: string;
  last?: boolean;
};

function ModelRow({
  label,
  description,
  last = false,
}: ModelRowProps) {
  return (
    <View
      style={[
        styles.modelRow,
        last ? styles.modelRowLast : undefined,
      ]}
    >
      <Text style={styles.modelLabel}>
        {label}
      </Text>

      <Text style={styles.modelDescription}>
        {description}
      </Text>
    </View>
  );
}

type OutputCardProps = {
  label: string;
  value: string;
  detail: string;
};

function OutputCard({
  label,
  value,
  detail,
}: OutputCardProps) {
  return (
    <View style={styles.outputCard}>
      <Text style={styles.outputLabel}>
        {label}
      </Text>

      <Text style={styles.outputValue}>
        {value}
      </Text>

      <Text style={styles.outputDetail}>
        {detail}
      </Text>
    </View>
  );
}

type FlowItemProps = {
  label: string;
  value: string;
};

function FlowItem({
  label,
  value,
}: FlowItemProps) {
  return (
    <View style={styles.flowItem}>
      <Text style={styles.flowLabel}>
        {label}
      </Text>

      <Text style={styles.flowValue}>
        {value}
      </Text>
    </View>
  );
}

type NavLinkProps = {
  title: string;
  onPress: () => void;
};

function NavLink({
  title,
  onPress,
}: NavLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navLink,
        pressed ? styles.navLinkPressed : undefined,
      ]}
    >
      <Text style={styles.navLinkText}>
        {title}
      </Text>
    </Pressable>
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
    gap: 24,
  },

  logo: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 4,
  },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
    marginLeft: "auto",
    marginRight: 10,
  },

  navLink: {
    paddingVertical: 10,
  },

  navLinkPressed: {
    opacity: 0.65,
  },

  navLinkText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  hero: {
    minHeight: 680,
    flexDirection: "row",
    alignItems: "center",
    gap: 80,
    paddingVertical: 70,
  },

  heroTablet: {
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
    maxWidth: 590,
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

  heroNote: {
    maxWidth: 530,
    marginTop: 22,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
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

  heroVisualTablet: {
    width: "100%",
  },

  visualTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  visualLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 6,
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

  metricsRowMobile: {
    gap: 10,
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

  bar1: { height: 30 },
  bar2: { height: 45 },
  bar3: { height: 52 },
  bar4: { height: 69 },
  bar5: { height: 63 },
  bar6: { height: 82 },
  bar7: { height: 96 },
  bar8: { height: 108 },

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
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
  },

  visualFooterValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
  },

  priorityBadgeText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
  },

  centerSection: {
    maxWidth: 760,
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 120,
    paddingBottom: 70,
  },

  centerSectionCompact: {
    maxWidth: 760,
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 50,
  },

  sectionHeader: {
    maxWidth: 760,
    paddingTop: 130,
    paddingBottom: 60,
  },

  sectionEyebrow: {
    marginBottom: 16,
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  centerTitle: {
    color: theme.colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    letterSpacing: -1.8,
    textAlign: "center",
  },

  centerBody: {
    marginTop: 22,
    maxWidth: 680,
    color: theme.colors.textSecondary,
    fontSize: 18,
    lineHeight: 30,
    textAlign: "center",
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

  featureGrid: {
    flexDirection: "row",
    gap: 18,
    paddingBottom: 40,
  },

  featureGridTablet: {
    flexDirection: "column",
  },

  featureCard: {
    flex: 1,
    minHeight: 265,
    padding: 28,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  featureTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  featureNumber: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  featureEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  featureTitle: {
    marginTop: 42,
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "600",
    letterSpacing: -0.4,
  },

  featureBody: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 23,
  },

  process: {
    flexDirection: "row",
    gap: 36,
    paddingBottom: 130,
  },

  processTablet: {
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

  splitSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 90,
    paddingVertical: 120,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  splitSectionTablet: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 55,
  },

  splitCopy: {
    flex: 1,
  },

  textLink: {
    alignSelf: "flex-start",
    marginTop: 28,
    paddingVertical: 6,
  },

  textLinkText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },

  modelCard: {
    flex: 1,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modelRow: {
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  modelRowLast: {
    borderBottomWidth: 0,
  },

  modelLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },

  modelDescription: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  outputSection: {
    paddingVertical: 120,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  outputGrid: {
    flexDirection: "row",
    gap: 18,
  },

  outputGridTablet: {
    flexDirection: "column",
  },

  outputCard: {
    flex: 1,
    padding: 28,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  outputLabel: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  outputValue: {
    marginTop: 18,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
  },

  outputDetail: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  adaptiveVisual: {
    flex: 1,
    padding: 30,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  adaptiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  adaptiveLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  adaptiveTitle: {
    marginTop: 36,
    maxWidth: 360,
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -1,
  },

  adaptiveFlow: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  flowItem: {
    flex: 1,
  },

  flowLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },

  flowValue: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  flowArrow: {
    color: theme.colors.accent,
    fontSize: 22,
  },

  noteSection: {
    paddingVertical: 55,
    paddingHorizontal: 32,
    marginBottom: 110,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },

  noteEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 12,
  },

  noteText: {
    maxWidth: 780,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 23,
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

  ctaMobile: {
    paddingHorizontal: 28,
    paddingVertical: 60,
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
    maxWidth: 580,
    marginTop: 18,
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 27,
  },

  footer: {
    minHeight: 180,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 40,
  },

  footerMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 50,
  },

  footerLogo: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 3,
  },

  footerTagline: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },

  footerLinksMobile: {
    flexWrap: "wrap",
    gap: 18,
  },
});