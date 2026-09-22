import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { MarketingHeader } from "../components/MarketingHeader";
import { openPrivacyChoices } from "../components/PrivacyConsent";
import { theme } from "../constants/theme";

const LAST_UPDATED = "September 18, 2026";

export default function PrivacyPage() {
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
          <Text style={styles.eyebrow}>PRIVACY POLICY</Text>
          <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>
            Your training data belongs to you.
          </Text>
          <Text style={styles.intro}>
            This policy explains what Vector collects, why it is used, and the choices available to you when using the Vector training platform.
          </Text>
          <View style={styles.updatedPill}>
            <View style={styles.updatedDot} />
            <Text style={styles.updatedText}>Last updated {LAST_UPDATED}</Text>
          </View>
        </View>

        <View style={[styles.summaryGrid, compact ? styles.summaryGridCompact : undefined]}>
          <SummaryCard
            number="01"
            title="Purpose limited"
            text="Your data is used to operate Vector and personalize performance analysis and training guidance."
          />
          <SummaryCard
            number="02"
            title="No data sales"
            text="Vector does not sell personal athlete data or use it for third-party behavioral advertising."
          />
          <SummaryCard
            number="03"
            title="You have choices"
            text="You may request access, correction, export, or deletion of your personal information."
          />
        </View>

        <View style={styles.policy}>
          <Section title="1. Information we collect">
            <Paragraph>
              Vector collects information you provide when creating and maintaining an account, including your name, email address, authentication information, date of birth, gender, body mass, primary sport, training history, and weekly training volume.
            </Paragraph>
            <Paragraph>
              To produce athlete-specific analysis, Vector may also store performance and physiological information such as maximal power efforts, Critical Power inputs, workout assignments, laboratory VO₂max or CPET results, lactate-threshold results, test dates, and measurement sources.
            </Paragraph>
            <Paragraph>
              We may collect limited technical information required to provide the service, including session identifiers, device or browser information, error logs, and basic usage events. Vector does not intentionally collect precise location, contacts, or unrelated device content.
            </Paragraph>
          </Section>

          <Section title="2. How we use information">
            <Bullet text="Create and secure your account and maintain your signed-in session." />
            <Bullet text="Calculate and display physiology models, training zones, trends, and workout guidance." />
            <Bullet text="Distinguish measured laboratory data from modeled estimates." />
            <Bullet text="Operate, troubleshoot, protect, and improve the application." />
            <Bullet text="Respond to support, privacy, or account requests." />
          </Section>

          <Section title="3. How information is shared">
            <Paragraph>
              Vector uses service providers to operate the platform. This currently includes Supabase for authentication, database storage, and related infrastructure. Providers may process information only as needed to deliver their services to Vector and are subject to their own security and privacy obligations.
            </Paragraph>
            <Paragraph>
              We may disclose information when required by law, to protect the rights and safety of users or the service, or as part of a merger, financing, acquisition, or sale of assets. If ownership changes, personal information may transfer subject to this policy or advance notice of material changes.
            </Paragraph>
          </Section>

          <Section title="4. Storage, security, and retention">
            <Paragraph>
              Vector uses reasonable administrative and technical safeguards intended to protect personal information. No internet transmission or storage system can be guaranteed completely secure, so we cannot promise absolute security.
            </Paragraph>
            <Paragraph>
              Information is retained while your account is active and for as long as reasonably necessary to operate the service, meet legal obligations, resolve disputes, and enforce agreements. Data may remain temporarily in backups after an account or record is deleted.
            </Paragraph>
          </Section>

          <Section title="5. Your choices and rights">
            <Paragraph>
              Depending on where you live, you may have rights to access, correct, export, restrict, object to, or delete personal information. You may update certain profile and performance information directly within Vector. Additional requests can be submitted through the official support contact published with the application.
            </Paragraph>
            <Paragraph>
              We may need to verify your identity before completing a request. Some information may be retained when required by law or when necessary for security, fraud prevention, or legitimate recordkeeping.
            </Paragraph>
          </Section>

          <Section title="6. Cookies and local storage">
            <Paragraph>
              Vector may use browser or device storage that is necessary to maintain authentication, remember application state, and provide core functionality. We do not currently use this information to serve third-party behavioral advertising.
            </Paragraph>
            <Pressable accessibilityRole="button" onPress={openPrivacyChoices} style={styles.choicesButton}>
              <Text style={styles.choicesButtonText}>Review privacy choices</Text>
            </Pressable>
          </Section>

          <Section title="7. Children’s privacy">
            <Paragraph>
              Vector is not directed to children who are not legally permitted to consent to the processing of their personal information. If we learn that personal information was collected from a child without appropriate authorization, we will take reasonable steps to delete it.
            </Paragraph>
          </Section>

          <Section title="8. International use">
            <Paragraph>
              Vector and its providers may process information in countries other than the one where you live. Those countries may have different data-protection laws. Where required, appropriate safeguards will be used for international transfers.
            </Paragraph>
          </Section>

          <Section title="9. Changes to this policy">
            <Paragraph>
              This policy may be updated as Vector develops. Material changes will be communicated through the application or another appropriate channel. The date at the top identifies the latest revision.
            </Paragraph>
          </Section>

          <Section title="10. Contact">
            <Paragraph>
              Questions or requests about privacy can be sent through the official Vector support channel published with the application or its distribution listing. Please do not include passwords or unnecessary medical information in a support request.
            </Paragraph>
          </Section>

          <View style={styles.notice}>
            <View style={styles.noticeMarker} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>A note about physiology data</Text>
              <Text style={styles.noticeText}>
                Vector’s calculated metrics are performance estimates, not medical diagnoses. Laboratory measurements remain labeled separately from modeled values throughout the platform.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SummaryCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryNumber}>{number}</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { alignItems: "center", paddingBottom: 90 },
  container: { width: "100%", maxWidth: 1120, paddingHorizontal: 24 },
  hero: { maxWidth: 820, paddingTop: 74, paddingBottom: 48 },
  heroCompact: { paddingTop: 48, paddingBottom: 36 },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  titleCompact: { fontSize: 36, lineHeight: 42 },
  intro: {
    maxWidth: 720,
    marginTop: 18,
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 27,
  },
  updatedPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  updatedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.accent },
  updatedText: { color: theme.colors.textSecondary, fontSize: 10 },
  summaryGrid: { flexDirection: "row", gap: 14, marginBottom: 58 },
  summaryGridCompact: { flexDirection: "column" },
  summaryCard: {
    flex: 1,
    minHeight: 170,
    padding: 21,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryNumber: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  summaryTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginTop: 18 },
  summaryText: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 8 },
  policy: { width: "100%", maxWidth: 850 },
  section: {
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: { color: theme.colors.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  sectionBody: { marginTop: 15, gap: 13 },
  paragraph: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 23 },
  choicesButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  choicesButtonText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginTop: 8,
  },
  bulletText: { flex: 1, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  notice: {
    flexDirection: "row",
    gap: 16,
    marginTop: 28,
    padding: 22,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
  },
  noticeMarker: { width: 4, borderRadius: 2, backgroundColor: theme.colors.accent },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  noticeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
});
