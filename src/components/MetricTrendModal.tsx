import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

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
  profileMetrics?: ProfileMetricSummary[];
  activeMetric?: string;
  priority?: string;
  onClose: () => void;
};

type ProfileMetricSummary = {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: MetricTrendValue | null;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 16, bottom: 16, left: 48 };
const MAX_VISIBLE_POINTS = 8;
const SERIES_COLORS = [theme.colors.accent, "#D68C45"] as const;

export function MetricTrendModal({ visible, title, description, unit, series, profileMetrics, activeMetric, priority, onClose }: Props) {
  const populatedSeries = limitSeriesToLatestPoints(series);
  const totalPointCount = countUniquePoints(series);
  const visiblePointCount = countUniquePoints(populatedSeries);
  const selectedProfileMetric = profileMetrics?.find(metric => metric.id === activeMetric) ?? profileMetrics?.[0];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close trend details"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdropDismiss}
        />
        <View style={styles.dialog}>
          <ScrollView
            contentContainerStyle={styles.dialogContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{profileMetrics ? "PERFORMANCE PROFILE" : "PROGRESS"}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            {profileMetrics ? <View style={styles.adaptivePill}><View style={styles.adaptiveDot} /><Text style={styles.adaptiveText}>Adaptive</Text></View> : null}
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

          {profileMetrics ? (
            <>
              {selectedProfileMetric ? (
                <View style={styles.profileMetrics}>
                  <View style={[styles.profileMetric, styles.profileMetricActive]}>
                    <Text style={[styles.profileMetricLabel, styles.profileMetricLabelActive]}>CURRENT {selectedProfileMetric.label}</Text>
                    <View style={styles.profileMetricReading}>
                      <Text style={styles.profileMetricValue}>{selectedProfileMetric.value}</Text>
                      {selectedProfileMetric.unit ? <Text style={styles.profileMetricUnit}>{selectedProfileMetric.unit}</Text> : null}
                    </View>
                    <MetricTrend trend={selectedProfileMetric.trend} />
                  </View>
                </View>
              ) : null}

              {populatedSeries.length ? (
                <>
                  <View style={styles.chartHeadingRow}>
                    <Text style={styles.chartEyebrow}>{title.toUpperCase()} PROGRESSION</Text>
                    <Text style={styles.chartCount}>{visiblePointCount} {visiblePointCount === 1 ? "record" : "records"}</Text>
                  </View>
                  <TrendBarGraph series={populatedSeries[0]} unit={unit} />
                  <View style={styles.dateRow}>
                    <Text style={styles.dateText}>{formatBoundaryDate(populatedSeries, "oldest")}</Text>
                    <Text style={styles.dateText}>{formatBoundaryDate(populatedSeries, "newest")}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.profileEmpty}><Text style={styles.emptyCopy}>Add another valid measurement to begin showing progression.</Text></View>
              )}

              <View style={styles.priorityFooter}>
                <View>
                  <Text style={styles.priorityLabel}>CURRENT PRIORITY</Text>
                  <Text style={styles.priorityValue}>{priority ?? "Build your athlete profile"}</Text>
                </View>
                <View style={styles.impactPill}><Text style={styles.impactText}>High impact</Text></View>
              </View>
            </>
          ) : populatedSeries.length ? (
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
                {totalPointCount > visiblePointCount ? `Latest ${visiblePointCount} of ${totalPointCount}` : visiblePointCount} recorded {totalPointCount === 1 ? "data point" : "data points"}
              </Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trend data yet</Text>
              <Text style={styles.emptyCopy}>Add a valid measurement to begin tracking this value.</Text>
            </View>
          )}
          </ScrollView>
        </View>
      </View>
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
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const yFor = (value: number) => CHART_PADDING.top + ((chartMaximum - value) / chartRange) * plotHeight;
  const referenceValues = [chartMaximum, (chartMaximum + chartMinimum) / 2, chartMinimum];

  return (
    <View style={styles.chartFrame}>
      <Svg
        accessibilityLabel="Historical trend graph from oldest to newest"
        height="100%"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
      >
        {referenceValues.map((value) => (
          <G key={value}>
            <Line
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={yFor(value)}
              y2={yFor(value)}
              stroke={theme.colors.border}
              strokeDasharray="3 5"
              strokeWidth={1}
            />
            <SvgText
              fill={theme.colors.textSecondary}
              fontSize={10}
              textAnchor="end"
              x={CHART_PADDING.left - 9}
              y={yFor(value) + 3.5}
            >
              {formatReferenceValue(value, rawRange)}
            </SvgText>
          </G>
        ))}

        {series.map((item, seriesIndex) => {
          const chronological = [...item.points].reverse();
          const color = item.color ?? SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
          const xFor = (index: number) => chronological.length === 1
            ? CHART_PADDING.left + plotWidth / 2
            : CHART_PADDING.left + (index / (chronological.length - 1)) * plotWidth;
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

function TrendBarGraph({ series, unit }: { series: TrendGraphSeries; unit: string }) {
  const chronological = [...series.points].reverse();
  const values = chronological.map(point => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const axisPadding = range > 0 ? range * 0.12 : Math.max(Math.abs(maximum) * 0.08, 1);
  const axisMinimum = minimum - axisPadding;
  const axisMaximum = maximum + axisPadding;
  const axisRange = axisMaximum - axisMinimum;
  const referenceValues = [axisMaximum, (axisMaximum + axisMinimum) / 2, axisMinimum];
  const decimals = series.decimals ?? (range < 10 ? 1 : 0);
  const plot = { left: 62, right: 10, top: 28, bottom: 18 };
  const plotWidth = CHART_WIDTH - plot.left - plot.right;
  const plotHeight = CHART_HEIGHT - plot.top - plot.bottom;
  const gap = 18;
  const barWidth = Math.min(78, Math.max(24, (plotWidth - gap * Math.max(0, chronological.length - 1)) / Math.max(chronological.length, 1)));
  const usedWidth = chronological.length * barWidth + Math.max(0, chronological.length - 1) * gap;
  const startX = plot.left + Math.max(0, (plotWidth - usedWidth) / 2);
  const yFor = (value: number) => plot.top + ((axisMaximum - value) / axisRange) * plotHeight;

  return (
    <View style={styles.profileChartFrame}>
      <Svg accessibilityLabel={`${series.label} progression from oldest to newest`} height="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%">
        <SvgText x={plot.left} y={13} fill="#4F5754" fontSize={10} fontWeight="700">{unit || series.label}</SvgText>
        {referenceValues.map(value => (
          <G key={value}>
            <Line x1={plot.left} x2={CHART_WIDTH - plot.right} y1={yFor(value)} y2={yFor(value)} stroke="#C9D0CC" strokeWidth={1} />
            <SvgText x={plot.left - 9} y={yFor(value) + 4} fill="#4F5754" fontSize={11} fontWeight="600" textAnchor="end">
              {value.toFixed(decimals)}
            </SvgText>
          </G>
        ))}
        {chronological.map((point, index) => {
          const y = yFor(point.value);
          const height = plot.top + plotHeight - y;
          const x = startX + index * (barWidth + gap);
          return (
            <G key={`${point.date ?? "undated"}-${index}`}>
              <Rect x={x} y={y} width={barWidth} height={height} rx={7} fill="#C8E3DC" />
              <Line x1={x + 5} x2={x + barWidth - 5} y1={y + 2} y2={y + 2} stroke={theme.colors.accent} strokeLinecap="round" strokeWidth={4} />
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

function limitSeriesToLatestPoints(series: TrendGraphSeries[]) {
  const latestDates = [...new Set(
    series.flatMap((item) => item.points.map((point) => point.date).filter((date): date is string => Boolean(date)))
  )]
    .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())
    .slice(0, MAX_VISIBLE_POINTS);
  const includedDates = new Set(latestDates);

  return series
    .map((item) => ({
      ...item,
      points: latestDates.length
        ? item.points.filter((point) => point.date && includedDates.has(point.date))
        : item.points.slice(0, MAX_VISIBLE_POINTS),
    }))
    .filter((item) => item.points.length > 0);
}

function formatReferenceValue(value: number, range: number) {
  const decimals = range < 10 ? 1 : 0;
  return value.toFixed(decimals);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(17, 19, 21, 0.68)",
  },
  backdropDismiss: { position: "absolute", inset: 0 },
  dialog: {
    width: "100%",
    maxWidth: 820,
    maxHeight: "94%",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D5DAD7",
    backgroundColor: theme.colors.white,
    boxShadow: "0 28px 80px rgba(17, 25, 22, 0.28)",
    overflow: "hidden",
  },
  dialogContent: { padding: 28 },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 16 },
  headerCopy: { flex: 1, minWidth: 160 },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: theme.colors.text, fontSize: 32, fontWeight: "700", letterSpacing: -1.1, marginTop: 5 },
  description: { maxWidth: 610, color: "#4F5754", fontSize: 14, lineHeight: 21, marginTop: 8 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF0EE",
    borderWidth: 1,
    borderColor: "#D8DDDA",
  },
  closeText: { color: theme.colors.text, fontSize: 24, lineHeight: 27 },
  pressed: { opacity: 0.65 },
  adaptivePill: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, backgroundColor: "#DCEFEA", borderWidth: 1, borderColor: "#C7E3DC" },
  adaptiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },
  adaptiveText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  profileMetrics: { marginTop: 26 },
  profileMetric: { width: "100%", padding: 20, borderRadius: 20, borderWidth: 1 },
  profileMetricActive: { backgroundColor: "#F0F8F5", borderColor: "#BBDCD3" },
  profileMetricLabel: { color: "#4F5754", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  profileMetricLabelActive: { color: theme.colors.accent },
  profileMetricReading: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 8 },
  profileMetricValue: { color: theme.colors.text, fontSize: 42, lineHeight: 47, fontWeight: "700", letterSpacing: -1.5 },
  profileMetricUnit: { color: "#4F5754", fontSize: 16, fontWeight: "600" },
  chartHeadingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24 },
  chartEyebrow: { color: "#4F5754", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  chartCount: { color: "#4F5754", fontSize: 11, fontWeight: "600" },
  profileChartFrame: { width: "100%", height: CHART_HEIGHT, marginTop: 6 },
  profileEmpty: { minHeight: 190, alignItems: "center", justifyContent: "center" },
  priorityFooter: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginTop: 24, paddingTop: 21, borderTopWidth: 1, borderTopColor: theme.colors.border },
  priorityLabel: { color: "#4F5754", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  priorityValue: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginTop: 6 },
  impactPill: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: "#DCEFEA", borderWidth: 1, borderColor: "#C7E3DC" },
  impactText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  currentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  currentItem: { flex: 1, minWidth: 170, padding: 14, borderRadius: 16, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder },
  seriesLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  seriesLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: "700" },
  readingRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 6 },
  currentValue: { color: theme.colors.text, fontSize: 25, fontWeight: "700", letterSpacing: -0.8 },
  unit: { color: theme.colors.textSecondary, fontSize: 11 },
  chartFrame: { width: "100%", height: CHART_HEIGHT, marginTop: 20 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  dateText: { color: "#4F5754", fontSize: 11, fontWeight: "600" },
  note: { color: "#4F5754", fontSize: 10, textAlign: "center", marginTop: 10 },
  emptyState: { paddingVertical: 50, alignItems: "center" },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  emptyCopy: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center", marginTop: 7 },
});
