import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { theme } from "../../constants/theme";
import { generateDetailedPowerCurve } from "../../lib/physiology/powerCurve";
import type { AthleteModel } from "../../lib/physiology/athleteModel";

type Observation = {
  durationSeconds: number;
  label: string;
  powerWatts: number;
};

type Props = {
  model: AthleteModel;
};

const WIDTH = 900;
const HEIGHT = 310;
const PADDING = { top: 28, right: 24, bottom: 52, left: 58 };
const X_TICKS = [60, 300, 720, 1800, 3600] as const;

export function PowerDurationChart({ model }: Props) {
  const observations = useMemo<Observation[]>(
    () => [
      {
        durationSeconds: 60,
        label: "1 minute",
        powerWatts: model.inputs.oneMinuteWatts,
      },
      {
        durationSeconds: 300,
        label: "5 minutes",
        powerWatts: model.inputs.fiveMinuteWatts,
      },
      {
        durationSeconds: 720,
        label: "12 minutes",
        powerWatts: model.inputs.twelveMinuteWatts,
      },
    ],
    [model]
  );
  const [selectedDuration, setSelectedDuration] = useState(300);
  const selected =
    observations.find((point) => point.durationSeconds === selectedDuration) ??
    observations[1];

  const curve = useMemo(
    () => generateDetailedPowerCurve(model, 60, 3600, 80),
    [model]
  );

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const minimumPower = Math.floor((model.cpWatts * 0.9) / 50) * 50;
  const maximumPower =
    Math.ceil(
      Math.max(
        ...curve.map((point) => point.powerWatts),
        ...observations.map((point) => point.powerWatts)
      ) / 50
    ) * 50;
  const powerRange = Math.max(100, maximumPower - minimumPower);
  const logMinimum = Math.log(60);
  const logMaximum = Math.log(3600);

  const xFor = (duration: number) =>
    PADDING.left +
    ((Math.log(duration) - logMinimum) / (logMaximum - logMinimum)) *
      plotWidth;
  const yFor = (power: number) =>
    PADDING.top + ((maximumPower - power) / powerRange) * plotHeight;

  const curvePath = curve
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${xFor(point.durationSeconds).toFixed(2)} ${yFor(
        point.powerWatts
      ).toFixed(2)}`;
    })
    .join(" ");
  const areaPath = `${curvePath} L ${xFor(3600)} ${PADDING.top + plotHeight} L ${xFor(
    60
  )} ${PADDING.top + plotHeight} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
    Math.round((maximumPower - progress * powerRange) / 10) * 10
  );

  return (
    <View>
      <View style={styles.inspector}>
        <View>
          <Text style={styles.inspectorLabel}>SELECTED OBSERVATION</Text>
          <Text style={styles.inspectorValue}>{selected.label}</Text>
        </View>
        <View style={styles.inspectorReading}>
          <Text style={styles.inspectorPower}>{Math.round(selected.powerWatts)}</Text>
          <Text style={styles.inspectorUnit}>W</Text>
        </View>
      </View>

      <View style={styles.svgFrame}>
        <Svg
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          accessibilityLabel="Power-duration curve with measured 1, 5 and 12-minute observations"
        >
          <Defs>
            <LinearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.accent} stopOpacity="0.22" />
              <Stop offset="1" stopColor={theme.colors.accent} stopOpacity="0.01" />
            </LinearGradient>
          </Defs>

          {yTicks.map((power) => (
            <G key={power}>
              <Line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={yFor(power)}
                y2={yFor(power)}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 12}
                y={yFor(power) + 4}
                fill={theme.colors.textSecondary}
                fontSize={11}
                textAnchor="end"
              >
                {power}
              </SvgText>
            </G>
          ))}

          {X_TICKS.map((duration) => (
            <G key={duration}>
              <Line
                x1={xFor(duration)}
                x2={xFor(duration)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="3 5"
              />
              <SvgText
                x={xFor(duration)}
                y={HEIGHT - 25}
                fill={theme.colors.textSecondary}
                fontSize={11}
                textAnchor="middle"
              >
                {formatDuration(duration)}
              </SvgText>
            </G>
          ))}

          <Path d={areaPath} fill="url(#curveFill)" />
          <Path
            d={curvePath}
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {observations.map((point) => {
            const active = point.durationSeconds === selected.durationSeconds;

            return (
              <Circle
                key={point.durationSeconds}
                cx={xFor(point.durationSeconds)}
                cy={yFor(point.powerWatts)}
                r={active ? 11 : 9}
                fill={theme.colors.surface}
                stroke={theme.colors.accent}
                strokeWidth={active ? 5 : 4}
              />
            );
          })}

          <SvgText
            x={16}
            y={HEIGHT / 2}
            fill={theme.colors.textSecondary}
            fontSize={11}
            textAnchor="middle"
            transform={`rotate(-90 16 ${HEIGHT / 2})`}
          >
            POWER (W)
          </SvgText>
          <SvgText
            x={WIDTH / 2}
            y={HEIGHT - 3}
            fill={theme.colors.textSecondary}
            fontSize={11}
            textAnchor="middle"
          >
            DURATION
          </SvgText>
        </Svg>
      </View>

      <View style={styles.observationControls}>
        {observations.map((point) => {
          const active = point.durationSeconds === selected.durationSeconds;

          return (
            <Pressable
              key={point.durationSeconds}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedDuration(point.durationSeconds)}
              style={({ pressed }) => [
                styles.observationButton,
                active ? styles.observationButtonActive : undefined,
                pressed ? styles.observationButtonPressed : undefined,
              ]}
            >
              <Text
                style={[
                  styles.observationButtonLabel,
                  active ? styles.observationButtonLabelActive : undefined,
                ]}
              >
                {point.label}
              </Text>
              <Text style={styles.observationButtonValue}>
                {Math.round(point.powerWatts)} W
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.curveSwatch} />
          <Text style={styles.legendText}>Modeled curve</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.pointSwatch} />
          <Text style={styles.legendText}>Measured maximal effort</Text>
        </View>
      </View>
    </View>
  );
}

function formatDuration(seconds: number) {
  return seconds < 3600 ? `${seconds / 60}m` : `${seconds / 3600}h`;
}

const styles = StyleSheet.create({
  inspector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.accentSoft,
  },
  inspectorLabel: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  inspectorValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },
  inspectorReading: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  inspectorPower: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "700",
  },
  inspectorUnit: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  svgFrame: {
    width: "100%",
    overflow: "hidden",
    marginTop: 12,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 4,
  },
  observationControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  observationButton: {
    flex: 1,
    minWidth: 120,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  observationButtonActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  observationButtonPressed: {
    opacity: 0.68,
  },
  observationButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  observationButtonLabelActive: {
    color: theme.colors.accent,
  },
  observationButtonValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  curveSwatch: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  pointSwatch: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
});
