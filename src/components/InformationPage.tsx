import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { theme } from "../constants/theme";
import { MarketingHeader } from "./MarketingHeader";

export type InformationSummary = {
  number: string;
  title: string;
  text: string;
};

export function InformationPage({
  eyebrow,
  title,
  intro,
  summaries,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  summaries: InformationSummary[];
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 720;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <MarketingHeader />

        <View style={[styles.hero, compact ? styles.heroCompact : undefined]}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>{title}</Text>
          <Text style={styles.intro}>{intro}</Text>
        </View>

        <View style={[styles.summaryGrid, compact ? styles.summaryGridCompact : undefined]}>
          {summaries.map((summary) => (
            <View key={summary.number} style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{summary.number}</Text>
              <Text style={styles.summaryTitle}>{summary.title}</Text>
              <Text style={styles.summaryText}>{summary.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.body}>{children}</View>
      </View>
    </ScrollView>
  );
}

export function InformationSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function InformationParagraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function InformationBullet({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletMarker} />
      <View style={styles.bulletCopy}>
        <Text style={styles.bulletTitle}>{title}</Text>
        <Text style={styles.bulletText}>{text}</Text>
      </View>
    </View>
  );
}

export function InformationCallout({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.callout}>
      <View style={styles.calloutMarker} />
      <View style={styles.calloutCopy}>
        <Text style={styles.calloutEyebrow}>{eyebrow}</Text>
        <Text style={styles.calloutTitle}>{title}</Text>
        <Text style={styles.calloutText}>{text}</Text>
      </View>
    </View>
  );
}

export function InformationReference({ children }: { children: ReactNode }) {
  return <Text style={styles.reference}>{children}</Text>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { alignItems: "center", paddingBottom: 90 },
  container: { width: "100%", maxWidth: theme.layout.contentMaxWidth, paddingHorizontal: theme.layout.pagePadding },
  hero: { maxWidth: 850, paddingTop: 74, paddingBottom: 48 },
  heroCompact: { paddingTop: 48, paddingBottom: 36 },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    maxWidth: 820,
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  titleCompact: { fontSize: 36, lineHeight: 42 },
  intro: {
    maxWidth: 740,
    marginTop: 18,
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 27,
  },
  summaryGrid: { flexDirection: "row", gap: 14, marginBottom: 58 },
  summaryGridCompact: { flexDirection: "column" },
  summaryCard: {
    flex: 1,
    minHeight: 170,
    padding: 21,
    borderRadius: 22,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    boxShadow: theme.shadows.insetLike,
  },
  summaryNumber: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  summaryTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginTop: 18 },
  summaryText: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 8 },
  body: { width: "100%", maxWidth: 850 },
  section: {
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  sectionContent: { marginTop: 16, gap: 14 },
  paragraph: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 23 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 13 },
  bulletMarker: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: theme.colors.accent,
  },
  bulletCopy: { flex: 1 },
  bulletTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  bulletText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 21, marginTop: 3 },
  callout: {
    flexDirection: "row",
    gap: 16,
    marginTop: 28,
    padding: 22,
    borderRadius: 22,
    backgroundColor: theme.colors.accentGlass,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  calloutMarker: { width: 4, borderRadius: 2, backgroundColor: theme.colors.accent },
  calloutCopy: { flex: 1 },
  calloutEyebrow: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  calloutTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginTop: 6 },
  calloutText: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 7 },
  reference: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
  },
});
