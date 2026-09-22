import type {
  AthleteData,
  NumericDatabaseValue,
  Vo2MaxTest,
} from "../../types/athlete";
import { calculateCriticalPowerFromProfile } from "./criticalPower";
import { estimateVo2Max } from "./vo2Max";

export type MetricTrend = {
  current: number;
  previous: number;
  delta: number;
  percent: number;
  direction: "up" | "down" | "flat";
  currentDate: string | null;
  previousDate: string | null;
};

export type AthleteProgress = {
  criticalPower: MetricTrend | null;
  wPrime: MetricTrend | null;
  oneMinutePower: MetricTrend | null;
  fiveMinutePower: MetricTrend | null;
  twelveMinutePower: MetricTrend | null;
  vo2Max: MetricTrend | null;
  absoluteVo2: MetricTrend | null;
  vt1Power: MetricTrend | null;
  vt2Power: MetricTrend | null;
  maxAerobicPower: MetricTrend | null;
  lt1Power: MetricTrend | null;
  lt2Power: MetricTrend | null;
  lt1HeartRate: MetricTrend | null;
  lt2HeartRate: MetricTrend | null;
  lt1Lactate: MetricTrend | null;
  lt2Lactate: MetricTrend | null;
};

export type MetricHistoryPoint = { value: number; date: string | null };

export type AthleteProgressHistory = {
  [K in keyof AthleteProgress]: MetricHistoryPoint[];
};

export function buildAthleteProgress(athlete: AthleteData): AthleteProgress {
  const history = buildAthleteProgressHistory(athlete);

  return {
    criticalPower: trendFromPoints(history.criticalPower),
    wPrime: trendFromPoints(history.wPrime),
    oneMinutePower: trendFromPoints(history.oneMinutePower),
    fiveMinutePower: trendFromPoints(history.fiveMinutePower),
    twelveMinutePower: trendFromPoints(history.twelveMinutePower),
    vo2Max: trendFromPoints(history.vo2Max),
    absoluteVo2: trendFromPoints(history.absoluteVo2),
    vt1Power: trendFromPoints(history.vt1Power),
    vt2Power: trendFromPoints(history.vt2Power),
    maxAerobicPower: trendFromPoints(history.maxAerobicPower),
    lt1Power: trendFromPoints(history.lt1Power),
    lt2Power: trendFromPoints(history.lt2Power),
    lt1HeartRate: trendFromPoints(history.lt1HeartRate),
    lt2HeartRate: trendFromPoints(history.lt2HeartRate),
    lt1Lactate: trendFromPoints(history.lt1Lactate),
    lt2Lactate: trendFromPoints(history.lt2Lactate),
  };
}

export function buildAthleteProgressHistory(athlete: AthleteData): AthleteProgressHistory {
  const powerHistory = athlete.powerHistory?.length
    ? athlete.powerHistory
    : athlete.powerProfile
      ? [athlete.powerProfile]
      : [];
  const vo2History = athlete.vo2MaxHistory?.length
    ? athlete.vo2MaxHistory
    : athlete.vo2MaxTest
      ? [athlete.vo2MaxTest]
      : [];
  const lactateHistory = athlete.lactateHistory?.length
    ? athlete.lactateHistory
    : athlete.lactateTest
      ? [athlete.lactateTest]
      : [];

  const powerModels = powerHistory.flatMap((profile) => {
    try {
      const model = calculateCriticalPowerFromProfile(
        Number(profile.one_minute_watts),
        Number(profile.five_minute_watts),
        Number(profile.twelve_minute_watts),
      );
      return [{ profile, model }];
    } catch {
      return [];
    }
  });

  const currentMeasuredVo2 = relativeVo2(vo2History[0]);
  const weight = Number(athlete.profile.weight_kg);
  const estimatedVo2Points: MetricHistoryPoint[] = Number.isFinite(weight) && weight > 0
    ? powerHistory.flatMap((profile) => {
        const value = estimateVo2Max(Number(profile.five_minute_watts), weight);
        return value === null ? [] : [{ value, date: profile.recorded_at }];
      })
    : [];

  return {
    criticalPower: powerModels.map(({ profile, model }) => ({ value: model.cpWatts, date: profile.recorded_at })),
    wPrime: powerModels.map(({ profile, model }) => ({ value: model.wPrimeKj, date: profile.recorded_at })),
    oneMinutePower: historyFromNumeric(powerHistory, "one_minute_watts", (point) => point.recorded_at),
    fiveMinutePower: historyFromNumeric(powerHistory, "five_minute_watts", (point) => point.recorded_at),
    twelveMinutePower: historyFromNumeric(powerHistory, "twelve_minute_watts", (point) => point.recorded_at),
    vo2Max: currentMeasuredVo2
      ? vo2History.flatMap((test) => {
          const value = relativeVo2(test);
          return value === null ? [] : [{ value, date: test.test_date }];
        })
      : estimatedVo2Points,
    absoluteVo2: historyFromNumeric(vo2History, "absolute_vo2_l_min", (point) => point.test_date),
    vt1Power: historyFromNumeric(vo2History, "vt1_power_watts", (point) => point.test_date),
    vt2Power: historyFromNumeric(vo2History, "vt2_power_watts", (point) => point.test_date),
    maxAerobicPower: historyFromNumeric(vo2History, "max_aerobic_power_watts", (point) => point.test_date),
    lt1Power: historyFromNumeric(lactateHistory, "lt1_power_watts", (point) => point.test_date),
    lt2Power: historyFromNumeric(lactateHistory, "lt2_power_watts", (point) => point.test_date),
    lt1HeartRate: historyFromNumeric(lactateHistory, "lt1_heart_rate_bpm", (point) => point.test_date),
    lt2HeartRate: historyFromNumeric(lactateHistory, "lt2_heart_rate_bpm", (point) => point.test_date),
    lt1Lactate: historyFromNumeric(lactateHistory, "lt1_lactate_mmol", (point) => point.test_date),
    lt2Lactate: historyFromNumeric(lactateHistory, "lt2_lactate_mmol", (point) => point.test_date),
  };
}

function historyFromNumeric<T extends object, K extends keyof T>(
  history: T[],
  key: K,
  date: (point: T) => string | null,
) {
  return history.map((point) => ({
    value: numeric(point[key] as NumericDatabaseValue | null),
    date: date(point),
  })).filter(isDatedValue);
}

function trendFromPoints(points: MetricHistoryPoint[]): MetricTrend | null {
  if (points.length < 2) return null;
  const [current, previous] = points;
  const delta = current.value - previous.value;
  const percent = previous.value === 0 ? 0 : (delta / Math.abs(previous.value)) * 100;
  const tolerance = Math.max(Math.abs(current.value), Math.abs(previous.value), 1) * 1e-9;
  return {
    current: current.value,
    previous: previous.value,
    delta,
    percent,
    direction: Math.abs(delta) <= tolerance ? "flat" : delta > 0 ? "up" : "down",
    currentDate: current.date,
    previousDate: previous.date,
  };
}

function relativeVo2(test: Vo2MaxTest | undefined): number | null {
  if (!test) return null;
  const relative = numeric(test.relative_vo2max);
  if (relative) return relative;
  const absolute = numeric(test.absolute_vo2_l_min);
  const mass = numeric(test.body_mass_kg);
  return absolute && mass ? (absolute * 1000) / mass : null;
}

function numeric(value: NumericDatabaseValue | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isDatedValue(point: { value: number | null; date: string | null }): point is MetricHistoryPoint {
  return point.value !== null;
}
