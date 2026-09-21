import type { AthleteData } from "../../types/athlete";
import { calculateCriticalPowerFromProfile } from "../physiology/criticalPower";
import type { WorkoutId } from "./workouts";

export type TrainingFocusTag = "sustainable_power" | "aerobic_ceiling" | "balanced";

export const FOCUS_POLICY = {
  version: 1,
  sustainableBelow: 0.75,
  ceilingAbove: 0.85,
  maxTestAgeDays: 90,
} as const;

export const TRAINING_FOCUSES: Record<TrainingFocusTag, {
  title: string;
  description: string;
  workoutIds: readonly WorkoutId[];
}> = {
  sustainable_power: {
    title: "Sustainable power",
    description: "Emphasize endurance, LT1, sweet spot and threshold work to develop sustained power, while retaining some VO₂ work.",
    workoutIds: ["endurance", "lt1", "sweet-spot", "threshold"],
  },
  aerobic_ceiling: {
    title: "Aerobic ceiling",
    description: "Emphasize appropriately dosed VO₂ intervals alongside endurance riding, while maintaining threshold work.",
    workoutIds: ["endurance", "vo2-long", "vo2-30-15"],
  },
  balanced: {
    title: "Balanced development",
    description: "Develop endurance, sustained power and VO₂ capacity together; this comparison does not suggest a clear emphasis.",
    workoutIds: ["endurance", "lt1", "sweet-spot", "threshold", "vo2-long", "vo2-30-15"],
  },
};

export type TrainingFocusAssessment = {
  version: number;
  tag: TrainingFocusTag | null;
  status: "provisional" | "needs_data";
  reason: string;
  cpToFiveMinuteRatio: number | null;
  cpWatts: number | null;
  fiveMinuteWatts: number | null;
  powerProfileId: string | null;
  powerRecordedAt: string | null;
};

/** A coaching heuristic, not measured fractional VO₂ utilization or a proven limiter. */
export function classifyTrainingFocus(
  athlete: Pick<AthleteData, "powerProfile">,
  now: Date = new Date(),
): TrainingFocusAssessment {
  const power = athlete.powerProfile;
  const result: TrainingFocusAssessment = {
    version: FOCUS_POLICY.version,
    tag: null,
    status: "needs_data",
    reason: "Add confirmed maximal 1-, 5- and 12-minute cycling efforts to establish your focus.",
    cpToFiveMinuteRatio: null,
    cpWatts: null,
    fiveMinuteWatts: null,
    powerProfileId: power?.id ?? null,
    powerRecordedAt: power?.recorded_at ?? null,
  };
  if (!power?.maximal_efforts_confirmed) return result;
  const recorded = power.recorded_at ? Date.parse(power.recorded_at) : NaN;
  const age = (now.getTime() - recorded) / 86_400_000;
  if (!Number.isFinite(age) || age < 0 || age > FOCUS_POLICY.maxTestAgeDays) {
    return { ...result, reason: "Update your maximal power test: a dated test from the last 90 days is needed for a current focus." };
  }
  let cpWatts: number;
  const fiveMinuteWatts = Number(power.five_minute_watts);
  try {
    cpWatts = calculateCriticalPowerFromProfile(
      Number(power.one_minute_watts), fiveMinuteWatts, Number(power.twelve_minute_watts),
    ).cpWatts;
  } catch {
    return { ...result, reason: "Review your maximal efforts: they do not produce a valid critical-power model." };
  }
  const ratio = cpWatts / fiveMinuteWatts;
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 1) return result;
  const tag: TrainingFocusTag = ratio < FOCUS_POLICY.sustainableBelow
    ? "sustainable_power"
    : ratio > FOCUS_POLICY.ceilingAbove ? "aerobic_ceiling" : "balanced";
  const comparison = tag === "sustainable_power"
    ? "There is a relatively large gap between your sustained and five-minute power."
    : tag === "aerobic_ceiling"
      ? "Your sustained power is relatively close to your five-minute power."
      : "Your sustained and five-minute power sit within our balanced comparison band.";
  return {
    ...result, tag, status: "provisional", cpWatts, fiveMinuteWatts,
    cpToFiveMinuteRatio: ratio,
    reason: `${comparison} This is a provisional training emphasis, not a confirmed physiological limiter.`,
  };
}

export function getTrainingFocusDisplay(assessment?: TrainingFocusAssessment | null) {
  if (!assessment?.tag) {
    return {
      title: "Establish your focus",
      description: assessment?.reason ?? "Add current maximal power-test results to establish your training focus.",
    };
  }
  const focus = TRAINING_FOCUSES[assessment.tag];
  return { title: focus.title, description: `${assessment.reason} ${focus.description}` };
}
