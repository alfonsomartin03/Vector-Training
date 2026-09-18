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

import { PowerDurationChart } from "../components/power/PowerDurationChart";
import {
  LactateModal,
  PowerProfileModal,
  Vo2MaxModal,
} from "../components/power/PowerDataModals";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useAthleteData } from "../hooks/useAthleteData";
import {
  saveLactateTest,
  saveVo2MaxTest,
  updatePowerProfile,
} from "../lib/athlete";
import type {
  LactateTestInput,
  PowerProfileUpdate,
  Vo2MaxTestInput,
} from "../lib/athlete";
import { buildAthleteModel } from "../lib/physiology/athleteModel";
import type { LactateTest } from "../types/athlete";

export default function PowerPage() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { athlete, setAthlete, isLoading, error } = useAthleteData(
    user?.id,
    "Unable to load your power model.",
    "Failed to load power data:"
  );
  const [editor, setEditor] = useState<"power" | "vo2" | "lactate" | null>(null);
  const compact = width < 760;

  const model = useMemo(
    () => (athlete ? buildAthleteModel(athlete) : null),
    [athlete]
  );
  const profile = athlete?.profile;
  const powerProfile = athlete?.powerProfile ?? null;
  const vo2MaxTest = athlete?.vo2MaxTest ?? null;
  const lactateTest = athlete?.lactateTest ?? null;
  const weight = Number(profile?.weight_kg);
  const firstInitial = (profile?.first_name ?? "A").charAt(0).toUpperCase() || "A";

  async function handlePowerSave(values: PowerProfileUpdate) {
    if (!user) return;
    const saved = await updatePowerProfile(user.id, values);
    setAthlete((current) =>
      current ? { ...current, powerProfile: saved } : current
    );
  }

  async function handleVo2Save(values: Vo2MaxTestInput) {
    if (!user) return;
    const saved = await saveVo2MaxTest(user.id, values);
    setAthlete((current) =>
      current ? { ...current, vo2MaxTest: saved } : current
    );
  }

  async function handleLactateSave(values: LactateTestInput) {
    if (!user) return;
    const saved = await saveLactateTest(user.id, values);
    setAthlete((current) =>
      current ? { ...current, lactateTest: saved } : current
    );
  }

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
            <Pressable style={styles.avatar} onPress={() => router.push("/profile")}>
              <Text style={styles.avatarText}>{firstInitial}</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>POWER &amp; PHYSIOLOGY</Text>
            <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>
              Your performance model.
            </Text>
            <Text style={styles.subtitle}>
              Measured data where you have it. Transparent estimates where you don’t.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.metrics, compact ? styles.stack : undefined]}>
            <MetricCard
              label="Critical Power"
              value={isLoading ? "..." : model ? `${Math.round(model.cpWatts)} W` : "—"}
              detail={
                model ? `${(model.cpWatts / model.inputs.weightKg).toFixed(2)} W/kg` : "Needs 3 efforts"
              }
              source="Modeled"
            />
            <MetricCard
              label="W′"
              value={isLoading ? "..." : model ? `${model.wPrimeKj.toFixed(1)} kJ` : "—"}
              detail="Severe-domain capacity"
              source="Modeled"
            />
            <MetricCard
              label="VO₂max"
              value={isLoading ? "..." : model ? model.vo2Max.toFixed(1) : "—"}
              detail="mL/kg/min"
              source={model?.vo2MaxSource === "measured" ? "Measured" : "Estimated"}
              emphasized={model?.vo2MaxSource === "measured"}
            />
            <MetricCard
              label="Lactate thresholds"
              value={formatThresholdSummary(lactateTest)}
              detail={lactateTest ? formatDate(lactateTest.test_date) : "No lab data"}
              source={lactateTest ? "Measured" : "Missing"}
              emphasized={Boolean(lactateTest)}
            />
          </View>

          <SectionHeader
            eyebrow="POWER-DURATION MODEL"
            title="Current capabilities"
            aside={model ? "Tap a measured point to inspect" : undefined}
          />

          <View style={styles.chartCard}>
            {isLoading ? (
              <EmptyState title="Loading power model…" />
            ) : model ? (
              <PowerDurationChart model={model} />
            ) : (
              <EmptyState
                title="Not enough valid power data"
                description="Add descending 1, 5 and 12-minute maximal efforts to generate the modeled curve."
                action="Enter CP test results"
                onPress={() => setEditor("power")}
              />
            )}

            <View style={styles.chartFooter}>
              <Meta label="MODEL" value="Morton 3-parameter" />
              <Meta label="LAST UPDATED" value={formatDate(powerProfile?.recorded_at)} />
              <Meta label="OBSERVATIONS" value={powerProfile ? "1m · 5m · 12m" : "None"} />
            </View>
          </View>

          <SectionHeader eyebrow="CRITICAL POWER TEST" title="Inputs and protocol" />
          <View style={[styles.splitGrid, compact ? styles.stack : undefined]}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>CURRENT INPUTS</Text>
                  <Text style={styles.cardTitle}>Maximal efforts</Text>
                </View>
                <StatusPill label={powerProfile ? "Complete" : "Required"} active={Boolean(powerProfile)} />
              </View>

              <DataRow label="1 minute" value={formatWatts(powerProfile?.one_minute_watts)} />
              <DataRow label="5 minutes" value={formatWatts(powerProfile?.five_minute_watts)} />
              <DataRow label="12 minutes" value={formatWatts(powerProfile?.twelve_minute_watts)} last />

              <ActionButton label="Edit power data" onPress={() => setEditor("power")} />
            </View>

            <View style={styles.protocolCard}>
              <Text style={styles.cardEyebrow}>SUPPORTED PROTOCOL</Text>
              <Text style={[styles.cardTitle, styles.protocolCardTitle]}>
                One ride. Three maximal efforts.
              </Text>
              <ProtocolStep number="01" title="Prepare" text="Arrive rested, fuel normally and warm up for at least 20 minutes." />
              <ProtocolStep number="02" title="Test" text="Complete maximal 1, 5 and 12-minute efforts in the same ride." />
              <ProtocolStep number="03" title="Recover" text="Ride easily for 10–15 minutes between efforts, then cool down." />
              <Text style={styles.protocolNote}>
                Vector models CP and W′ from these field efforts. They are estimates—not laboratory measurements.
              </Text>
            </View>
          </View>

          <SectionHeader eyebrow="MEASURED PHYSIOLOGY" title="Laboratory data" />
          <View style={[styles.splitGrid, compact ? styles.stack : undefined]}>
            <View style={styles.labCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardEyebrow}>VO₂MAX &amp; CPET</Text>
                  <Text style={styles.cardTitle}>
                    {vo2MaxTest ? `${model?.vo2Max.toFixed(1) ?? "—"} mL/kg/min` : "Add a measured value"}
                  </Text>
                </View>
                <StatusPill label={vo2MaxTest ? "Measured" : "Estimated"} active={Boolean(vo2MaxTest)} />
              </View>
              <Text style={styles.cardDescription}>
                A laboratory result overrides the five-minute power estimate and preserves its source, date and test body mass.
              </Text>
              {vo2MaxTest ? (
                <View style={styles.dataBlock}>
                  <DataRow label="Absolute VO₂" value={formatValue(vo2MaxTest.absolute_vo2_l_min, "L/min")} />
                  <DataRow label="VT1 / VT2" value={formatPair(vo2MaxTest.vt1_power_watts, vo2MaxTest.vt2_power_watts, "W")} />
                  <DataRow label="Body mass at test" value={formatValue(vo2MaxTest.body_mass_kg, "kg")} />
                  <DataRow label="Maximum aerobic power" value={formatValue(vo2MaxTest.max_aerobic_power_watts, "W")} />
                  <DataRow label="Source" value={vo2MaxTest.source} />
                  <DataRow label="Test date" value={formatDate(vo2MaxTest.test_date)} last />
                </View>
              ) : (
                <Text style={styles.emptyCopy}>No measured VO₂max has been recorded.</Text>
              )}
              <ActionButton
                label={vo2MaxTest ? "Update VO₂max data" : "Add VO₂max data"}
                onPress={() => setEditor("vo2")}
              />
            </View>

            <View style={styles.labCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardEyebrow}>LACTATE THRESHOLDS</Text>
                  <Text style={styles.cardTitle}>
                    {lactateTest ? formatThresholdSummary(lactateTest) : "Add LT1 or LT2"}
                  </Text>
                </View>
                <StatusPill label={lactateTest ? "Measured" : "No data"} active={Boolean(lactateTest)} />
              </View>
              <Text style={styles.cardDescription}>
                Record LT1 and LT2 independently, with optional heart rate and blood-lactate concentration.
              </Text>
              {lactateTest ? (
                <View style={styles.dataBlock}>
                  <DataRow label="LT1" value={formatLactatePoint(lactateTest, "lt1")} />
                  <DataRow label="LT2" value={formatLactatePoint(lactateTest, "lt2")} />
                  <DataRow label="Source" value={lactateTest.source} />
                  <DataRow label="Test date" value={formatDate(lactateTest.test_date)} last />
                </View>
              ) : (
                <Text style={styles.emptyCopy}>No measured lactate thresholds have been recorded.</Text>
              )}
              <ActionButton
                label={lactateTest ? "Update lactate data" : "Add lactate data"}
                onPress={() => setEditor("lactate")}
              />
            </View>
          </View>

          <View style={styles.explainer}>
            <View style={styles.explainerMarker} />
            <View style={styles.explainerCopy}>
              <Text style={styles.cardEyebrow}>HOW VECTOR USES YOUR DATA</Text>
              <Text style={styles.explainerTitle}>Measured values take priority.</Text>
              <Text style={styles.cardDescription}>
                Your power observations generate CP, W′ and the curve above. A measured VO₂max replaces the estimate; measured LT1 and LT2 remain clearly labeled laboratory observations. Source and date stay visible so modeled and measured physiology are never confused.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav />

      {editor === "power" ? (
        <PowerProfileModal
          visible
          current={powerProfile}
          onClose={() => setEditor(null)}
          onSave={handlePowerSave}
        />
      ) : null}
      {editor === "vo2" ? (
        <Vo2MaxModal
          visible
          current={vo2MaxTest}
          defaultBodyMass={Number.isFinite(weight) && weight > 0 ? weight : null}
          onClose={() => setEditor(null)}
          onSave={handleVo2Save}
        />
      ) : null}
      {editor === "lactate" ? (
        <LactateModal
          visible
          current={lactateTest}
          onClose={() => setEditor(null)}
          onSave={handleLactateSave}
        />
      ) : null}
    </View>
  );
}

function MetricCard({
  label,
  value,
  detail,
  source,
  emphasized,
}: {
  label: string;
  value: string;
  detail: string;
  source: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={[styles.sourceDot, emphasized ? styles.sourceDotActive : undefined]} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
      <Text style={[styles.metricSource, emphasized ? styles.metricSourceActive : undefined]}>
        {source}
      </Text>
    </View>
  );
}

function SectionHeader({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {aside ? <Text style={styles.sectionAside}>{aside}</Text> : null}
    </View>
  );
}

function DataRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.dataRow, last ? styles.dataRowLast : undefined]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ProtocolStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <View style={styles.protocolStep}>
      <Text style={styles.protocolNumber}>{number}</Text>
      <View style={styles.protocolCopy}>
        <Text style={styles.protocolTitle}>{title}</Text>
        <Text style={styles.protocolText}>{text}</Text>
      </View>
    </View>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.statusPill, active ? styles.statusPillActive : undefined]}>
      <Text style={[styles.statusText, active ? styles.statusTextActive : undefined]}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, pressed ? styles.pressed : undefined]}
    >
      <Text style={styles.actionText}>{label}</Text>
      <Text style={styles.actionArrow}>→</Text>
    </Pressable>
  );
}

function EmptyState({
  title,
  description,
  action,
  onPress,
}: {
  title: string;
  description?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
      {action && onPress ? (
        <Pressable onPress={onPress} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{action}</Text>
        </Pressable>
      ) : null}
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
          const active = route === "/power";
          return (
            <Pressable
              key={route}
              onPress={() => router.push(route)}
              style={[styles.navItem, active ? styles.navItemActive : undefined]}
            >
              <Text style={[styles.navSymbol, active ? styles.navSymbolActive : undefined]}>{symbol}</Text>
              <Text style={[styles.navLabel, active ? styles.navLabelActive : undefined]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatWatts(value: string | number | null | undefined) {
  return value == null ? "—" : `${Math.round(Number(value))} W`;
}

function formatValue(value: string | number | null | undefined, unit: string) {
  return value == null ? "—" : `${value} ${unit}`;
}

function formatPair(
  first: string | number | null | undefined,
  second: string | number | null | undefined,
  unit: string
) {
  if (first == null && second == null) return "—";
  return `${first == null ? "—" : first} / ${second == null ? "—" : second} ${unit}`;
}

function formatThresholdSummary(test: LactateTest | null) {
  if (!test) return "—";
  const available = [test.lt1_power_watts != null ? "LT1" : null, test.lt2_power_watts != null ? "LT2" : null].filter(Boolean);
  return available.join(" + ") || "—";
}

function formatLactatePoint(
  test: LactateTest,
  point: "lt1" | "lt2"
) {
  const power = test[`${point}_power_watts`];
  const heartRate = test[`${point}_heart_rate_bpm`];
  const lactate = test[`${point}_lactate_mmol`];
  if (power == null) return "—";
  return [
    `${power} W`,
    heartRate == null ? null : `${heartRate} bpm`,
    lactate == null ? null : `${lactate} mmol/L`,
  ].filter(Boolean).join(" · ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 140 },
  container: { width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: 24 },
  header: {
    height: 90,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { color: theme.colors.text, fontSize: 18, fontWeight: "800", letterSpacing: 4 },
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
  avatarText: { color: theme.colors.text, fontWeight: "700" },
  hero: { paddingTop: 42, paddingBottom: 45 },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: theme.colors.text, fontSize: 42, fontWeight: "700", letterSpacing: -1.6, marginTop: 10 },
  titleCompact: { fontSize: 34 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 10 },
  errorCard: { padding: 14, borderRadius: 12, backgroundColor: "#FFF0F0", marginBottom: 18 },
  errorText: { color: "#A33A3A", fontSize: 13 },
  metrics: { flexDirection: "row", gap: 12 },
  stack: { flexDirection: "column" },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 155,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  metricTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: "600" },
  sourceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.border },
  sourceDotActive: { backgroundColor: theme.colors.accent },
  metricValue: { color: theme.colors.text, fontSize: 27, fontWeight: "700", marginTop: 16 },
  metricDetail: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },
  metricSource: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: "700", letterSpacing: 0.6, marginTop: "auto" },
  metricSourceActive: { color: theme.colors.accent },
  sectionHeader: {
    marginTop: 68,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
  },
  sectionEyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  sectionTitle: { color: theme.colors.text, fontSize: 27, fontWeight: "700", marginTop: 6 },
  sectionAside: { color: theme.colors.textSecondary, fontSize: 11, textAlign: "right" },
  chartCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chartFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 38,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metaLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  metaValue: { color: theme.colors.text, fontSize: 11, fontWeight: "600", marginTop: 4 },
  splitGrid: { flexDirection: "row", gap: 18, alignItems: "stretch" },
  card: {
    flex: 1,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  protocolCard: {
    flex: 1.25,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#111315",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  cardHeaderCopy: { flex: 1 },
  cardEyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  cardTitle: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginTop: 7 },
  cardDescription: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 21, marginTop: 14 },
  dataBlock: { marginTop: 18 },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dataRowLast: { borderBottomWidth: 0 },
  dataLabel: { color: theme.colors.textSecondary, fontSize: 12 },
  dataValue: { flex: 1, color: theme.colors.text, fontSize: 12, fontWeight: "600", textAlign: "right" },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pressed: { opacity: 0.62 },
  actionText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  actionArrow: { color: theme.colors.accent, fontSize: 17 },
  protocolStep: { flexDirection: "row", gap: 14, marginTop: 20 },
  protocolCardTitle: { color: theme.colors.white },
  protocolNumber: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", marginTop: 2 },
  protocolCopy: { flex: 1 },
  protocolTitle: { color: theme.colors.white, fontSize: 13, fontWeight: "700" },
  protocolText: { color: "#AEB4B1", fontSize: 12, lineHeight: 19, marginTop: 4 },
  protocolNote: { color: "#8F9692", fontSize: 10, lineHeight: 16, marginTop: 22 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.background },
  statusPillActive: { backgroundColor: theme.colors.accentSoft },
  statusText: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: "700" },
  statusTextActive: { color: theme.colors.accent },
  labCard: {
    flex: 1,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  emptyCopy: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 20 },
  emptyState: { minHeight: 270, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyDescription: { maxWidth: 480, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8 },
  emptyAction: { borderRadius: 12, backgroundColor: theme.colors.accent, paddingHorizontal: 17, paddingVertical: 11, marginTop: 18 },
  emptyActionText: { color: theme.colors.white, fontSize: 12, fontWeight: "700" },
  explainer: {
    flexDirection: "row",
    gap: 18,
    marginTop: 50,
    padding: 24,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
  },
  explainerMarker: { width: 4, borderRadius: 2, backgroundColor: theme.colors.accent },
  explainerCopy: { flex: 1 },
  explainerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginTop: 7 },
  navWrapper: { position: "absolute", bottom: 18, left: 0, right: 0, alignItems: "center", paddingHorizontal: 18 },
  nav: {
    width: "100%",
    maxWidth: 540,
    flexDirection: "row",
    padding: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.08)",
  },
  navItem: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 13, gap: 3 },
  navItemActive: { backgroundColor: theme.colors.accentSoft },
  navSymbol: { color: theme.colors.textSecondary, fontSize: 16 },
  navSymbolActive: { color: theme.colors.accent },
  navLabel: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: "600" },
  navLabelActive: { color: theme.colors.accent },
});
