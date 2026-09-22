import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

import { theme } from "../constants/theme";
import type { MetricHistoryPoint, MetricTrend as MetricTrendValue } from "../lib/physiology/progress";
import { MetricTrend } from "./MetricTrend";

export type TrendGraphSeries = {
  label: string;
  points: MetricHistoryPoint[];
  trend: MetricTrendValue | null;
  color?: string;
  decimals?: number;
};

type Props = {
  visible: boolean;
  title: string;
  description: string;
  unit: string;
  series: TrendGraphSeries[];
  onClose: () => void;
};

const CHART_WIDTH = 520;
const CHART_HEIGHT = 190;
const CHART_PADDING = 20;
const SERIES_COLORS = [theme.colors.accent, "#D68C45"] as const;

export function MetricTrendModal({ visible, title, description, unit, series, onClose }: Props) {
  const populatedSeries = series.filter((item) => item.points.length > 0);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Close trend details"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityRole="none"
          onPress={(event) => event.stopPropagation()}
          style={styles.dialog}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>PROGRESS</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : undefined]}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {populatedSeries.length ? (
            <>
              <View style={styles.currentGrid}>
                {populatedSeries.map((item, index) => (
                  <View key={item.label} style={styles.currentItem}>
                    <View style={styles.seriesLabelRow}>
                      <View style={[styles.legendDot, { backgroundColor: item.color ?? SERIES_COLORS[index % SERIES_COLORS.length] }]} />
                      <Text style={styles.seriesLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.readingRow}>
                      <Text style={styles.currentValue}>{item.points[0].value.toFixed(item.decimals ?? 0)}</Text>
                      <Text style={styles.unit}>{unit}</Text>
                    </View>
                    <MetricTrend trend={item.trend} compact />
                  </View>
                ))}
              </View>

              <TrendGraph series={populatedSeries} />
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{formatBoundaryDate(populatedSeries, "oldest")}</Text>
                <Text style={styles.dateText}>{formatBoundaryDate(populatedSeries, "newest")}</Text>
              </View>
              <Text style={styles.note}>
                {countUniquePoints(populatedSeries)} recorded {countUniquePoints(populatedSeries) === 1 ? "data point" : "data points"}
              </Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trend data yet</Text>
              <Text style={styles.emptyCopy}>Add a valid measurement to begin tracking this value.</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TrendGraph({ series }: { series: TrendGraphSeries[] }) {
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const rawRange = maximum - minimum;
  const padding = rawRange > 0 ? rawRange * 0.16 : Math.max(Math.abs(maximum) * 0.08, 1);
  const chartMinimum = minimum - padding;
  const chartMaximum = maximum + padding;
  const chartRange = chartMaximum - chartMinimum;
  const plotWidth = CHART_WIDTH - CHART_PADDING * 2;
  const plotHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const yFor = (value: number) => CHART_PADDING + ((chartMaximum - value) / chartRange) * plotHeight;

  return (
    <View style={styles.chartFrame}>
      <Svg
        accessibilityLabel="Historical trend graph from oldest to newest"
        height="100%"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
      >
        {[0.25, 0.5, 0.75].map((position) => (
          <Line
            key={position}
            x1={CHART_PADDING}
            x2={CHART_WIDTH - CHART_PADDING}
            y1={CHART_PADDING + plotHeight * position}
            y2={CHART_PADDING + plotHeight * position}
            stroke={theme.colors.border}
            strokeWidth={1}
          />
        ))}

        {series.map((item, seriesIndex) => {
          const chronological = [...item.points].reverse();
          const color = item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
          const xFor = (index: number) => chronological.length === 1
            ? CHART_WIDTH / 2
            : CHART_PADDING + (index / (chronological.length - 1)) * plotWidth;
          const path = chronological.map((point, index) => (
            `${index === 0 ? "M" : "L"} ${xFor(index).toFixed(2)} ${yFor(point.value).toFixed(2)}`
          )).join(" ");

          return (
            <G key={item.label}>
              {chronological.length > 1 ? (
                <Path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />
              ) : null}
              {chronological.map((point, index) => (
                <Circle
                  key={`${point.date ?? "undated"}-${index}`}
                  cx={xFor(index)}
                  cy={yFor(point.value)}
                  fill={index === chronological.length - 1 ? color : theme.colors.surface}
                  r={index === chronological.length - 1 ? 6 : 4.5}
                  stroke={color}
                  strokeWidth={2.5}
                />
              ))}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function formatBoundaryDate(series: TrendGraphSeries[], boundary: "oldest" | "newest") {
  const timestamps = series
    .flatMap((item) => item.points)
    .map((point) => point.date ? new Date(point.date).getTime() : Number.NaN)
    .filter(Number.isFinite);
  if (!timestamps.length) return "Date unavailable";
  const timestamp = boundary === "oldest" ? Math.min(...timestamps) : Math.max(...timestamps);
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(timestamp));
}

function countUniquePoints(series: TrendGraphSeries[]) {
  return new Set(series.flatMap((item) => item.points.map((point, index) => point.date ?? `${item.label}-${index}`))).size;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(17, 19, 21, 0.48)",
  },
  dialog: {
    width: "100%",
    maxWidth: 620,
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.18)",
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
  headerCopy: { flex: 1 },
  eyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.7, marginTop: 5 },
  description: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 7 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  closeText: { color: theme.colors.text, fontSize: 24, lineHeight: 27 },
  pressed: { opacity: 0.65 },
  currentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  currentItem: { flex: 1, minWidth: 170, padding: 14, borderRadius: 14, backgroundColor: theme.colors.background },
  seriesLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  seriesLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: "700" },
  readingRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 6 },
  currentValue: { color: theme.colors.text, fontSize: 25, fontWeight: "700", letterSpacing: -0.8 },
  unit: { color: theme.colors.textSecondary, fontSize: 11 },
  chartFrame: { width: "100%", height: CHART_HEIGHT, marginTop: 20 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  dateText: { color: theme.colors.textSecondary, fontSize: 9 },
  note: { color: theme.colors.textSecondary, fontSize: 9, textAlign: "center", marginTop: 10 },
  emptyState: { paddingVertical: 50, alignItems: "center" },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  emptyCopy: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center", marginTop: 7 },
});
