import { StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";
import type { MetricTrend as MetricTrendValue } from "../lib/physiology/progress";

export function MetricTrend({ trend, compact = false }: { trend: MetricTrendValue | null; compact?: boolean }) {
  if (!trend) {
    return <Text style={[styles.baseline, compact ? styles.compactText : undefined]}>First data point</Text>;
  }

  const arrow = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";
  const signedPercent = `${trend.percent > 0 ? "+" : ""}${trend.percent.toFixed(1)}%`;
  const directionLabel = trend.direction === "up" ? "increased" : trend.direction === "down" ? "decreased" : "unchanged";

  return (
    <View
      accessible
      accessibilityLabel={`${directionLabel} ${Math.abs(trend.percent).toFixed(1)} percent from the previous data point`}
      style={[
        styles.badge,
        compact ? styles.compactBadge : undefined,
        trend.direction === "up" ? styles.up : trend.direction === "down" ? styles.down : styles.flat,
      ]}
    >
      <Text style={[
        styles.value,
        compact ? styles.compactText : undefined,
        trend.direction === "up" ? styles.upText : trend.direction === "down" ? styles.downText : styles.flatText,
      ]}>
        {arrow} {signedPercent}
      </Text>
      {!compact ? <Text style={styles.comparison}>vs previous</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 9, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  compactBadge: { marginTop: 5, paddingHorizontal: 6, paddingVertical: 3 },
  up: { backgroundColor: theme.colors.accentSoft },
  down: { backgroundColor: "#FDECEC" },
  flat: { backgroundColor: theme.colors.background },
  value: { fontSize: 12, fontWeight: "800" },
  compactText: { fontSize: 9 },
  upText: { color: theme.colors.accent },
  downText: { color: "#A33A3A" },
  flatText: { color: theme.colors.textSecondary },
  comparison: { color: theme.colors.textSecondary, fontSize: 10 },
  baseline: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 9 },
});
