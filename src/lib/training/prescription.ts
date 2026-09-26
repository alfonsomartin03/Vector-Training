import type { AthleteData, PowerProfile } from "../../types/athlete";
import { buildAthleteModel } from "../physiology/athleteModel";
import { classifyTrainingFocus, type TrainingFocusAssessment, type TrainingFocusTag } from "./focus";
import type { CompletedWorkout, TrainingHistoryContext } from "./history";
import { buildWeeklyTrainingPlan, toLocalDateKey, type WorkoutAssignment } from "./weeklyPlan";
import { buildWorkout, WORKOUT_LIBRARY, type BuiltWorkout, type PowerTarget, type WorkoutId, type WorkoutParameters } from "./workouts";

export type Availability = {
  week_start: string;
  weekly_minutes: number;
  max_session_minutes: number;
  recent_weekly_minutes: number;
  rest_days: number[];
  recovery_week: boolean;
};

export type PrescriptionResult = {
  version: number;
  assignments: Record<string, WorkoutAssignment>;
  messages: string[];
  totalMinutes: number;
  qualityMinutes: number;
  qualitySessions: number;
  trainingDays: number;
  recoveryWeek: boolean;
  recoveryReason: "athlete_selected" | "scheduled" | "fatigue" | null;
  needsRetest: boolean;
  powerDataAgeDays: number | null;
  trainingFocus: TrainingFocusAssessment | null;
};

export const PRESCRIPTION_VERSION = 2;
export const POWER_RETEST_DAYS = 84;
const DAY_MS = 86_400_000;
const QUALITY_SHARE_LIMIT = 0.2;

const PROGRESSION_STEPS: Record<Exclude<WorkoutId, "endurance">, readonly WorkoutParameters[]> = {
  lt1: [
    { repetitionsPerSet: 1, sets: 1 },
    { repetitionsPerSet: 2, sets: 1 },
    { repetitionsPerSet: 3, sets: 1 },
  ],
  "sweet-spot": [
    { repetitionsPerSet: 2, sets: 1 },
    { repetitionsPerSet: 3, sets: 1 },
    { repetitionsPerSet: 4, sets: 1 },
  ],
  threshold: [
    { repetitionsPerSet: 2, sets: 1 },
    { repetitionsPerSet: 3, sets: 1 },
    { repetitionsPerSet: 4, sets: 1 },
    { repetitionsPerSet: 5, sets: 1 },
  ],
  "vo2-long": [
    { repetitionsPerSet: 2, sets: 1 },
    { repetitionsPerSet: 3, sets: 1 },
    { repetitionsPerSet: 4, sets: 1 },
    { repetitionsPerSet: 5, sets: 1 },
  ],
  "vo2-30-15": [
    { repetitionsPerSet: 9, sets: 1 },
    { repetitionsPerSet: 13, sets: 1 },
    { repetitionsPerSet: 10, sets: 2 },
    { repetitionsPerSet: 13, sets: 2 },
  ],
};

export function weekKey(date: Date = new Date()) {
  return toLocalDateKey(buildWeeklyTrainingPlan(date).startDate);
}

export function validateAvailability(value: Availability): string | null {
  const date = new Date(`${value.week_start}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.week_start) || !Number.isFinite(date.getTime()) || weekKey(date) !== value.week_start) return "Choose a Monday-starting calendar week.";
  if (![value.weekly_minutes, value.recent_weekly_minutes].every(n => Number.isInteger(n) && n >= 0 && n <= 1800)) return "Weekly hours must be between 0 and 30, in whole minutes.";
  if (!Number.isInteger(value.max_session_minutes) || value.max_session_minutes < 30 || value.max_session_minutes > 360) return "Maximum ride length must be 30–360 minutes.";
  if (!Array.isArray(value.rest_days) || new Set(value.rest_days).size !== value.rest_days.length || !value.rest_days.every(n => Number.isInteger(n) && n >= 0 && n <= 6)) return "Choose valid, distinct rest days.";
  if (typeof value.recovery_week !== "boolean") return "Choose a recovery preference.";
  return null;
}

export function availabilityForWeek(rows: Availability[], week: string) {
  return rows.filter(row => row.week_start <= week).sort((a, b) => b.week_start.localeCompare(a.week_start))[0] ?? null;
}

export function recommendAvailability(athlete: AthleteData | null, recentMinutes = 0) {
  const level = athlete ? buildAthleteModel(athlete)?.fitnessLevel ?? "beginner" : "beginner";
  const experienced = ["intermediate", "advanced", "pro"].includes(athlete?.profile.training_history ?? "");
  const conservative = level === "beginner" || !experienced;
  const volumeCap = conservative ? 360 : level === "amateur" ? 600 : 900;
  const validRecent = Number.isFinite(recentMinutes) && recentMinutes > 0 && recentMinutes <= 1800;
  return {
    weeklyMinutes: validRecent ? Math.min(recentMinutes, volumeCap) : 180,
    restDays: conservative ? 3 : 2,
    maxSessionMinutes: conservative ? 90 : 120,
    level,
    explanation: "The starting dose stays near your recent four-week average. Completed sessions can raise the next loading week gradually, while scheduled recovery weeks reduce volume.",
  };
}

export function targetLabel(target: PowerTarget, cp: number | null, p5: number | null): string {
  if (target.kind === "zone") return target.position === "top" ? "upper Z2 (not measured LT1)" : target.zone.toUpperCase();
  if (target.kind === "five-minute-max") return p5 ? `${Math.round(p5)} W (5-minute power)` : "5-minute power";
  return cp ? `${Math.round(cp * target.fraction)} W (${Math.round(target.fraction * 100)}% CP)` : `${Math.round(target.fraction * 100)}% CP`;
}

function describeWorkout(session: BuiltWorkout, cp: number | null, p5: number | null) {
  const template = WORKOUT_LIBRARY[session.templateId];
  if (template.structure === "continuous") return `${session.durationSeconds / 60} minutes of continuous Z2 riding. No separate warm-up or cooldown.`;
  const work = session.steps.find(step => step.role === "work")!;
  const sets = session.parameters.sets ?? 1;
  return `20 min Z2 warm-up; ${sets} set(s) of ${session.parameters.repetitionsPerSet} × ${formatStepDuration(work.durationSeconds)} at ${targetLabel(work.target, cp, p5)}, with ${formatStepDuration(template.recovery.durationSeconds)} ${targetLabel(template.recovery.target, cp, p5)} ${template.recoveryAfterLastRepetition ? "after every repetition (including the last)" : "between repetitions only"}.${sets > 1 ? ` ${formatStepDuration(template.betweenSets.durationSeconds)} Z2 between sets.` : ""} Finish with 20 min Z2 cooldown.`;
}

export function prescribeWeek(
  athlete: AthleteData | null,
  availability: Availability | null,
  reference = new Date(),
  assessedAt = reference,
  context: TrainingHistoryContext = {},
): PrescriptionResult {
  const assignments: Record<string, WorkoutAssignment> = {};
  const messages: string[] = [];
  const calendar = buildWeeklyTrainingPlan(reference);
  const empty = (): PrescriptionResult => ({
    version: PRESCRIPTION_VERSION, assignments, messages, totalMinutes: 0, qualityMinutes: 0,
    qualitySessions: 0, trainingDays: 0, recoveryWeek: false, recoveryReason: null,
    needsRetest: false, powerDataAgeDays: null, trainingFocus: null,
  });
  if (!athlete || !availability) { messages.push("Save your availability to generate a weekly plan."); return empty(); }
  const invalid = validateAvailability(availability);
  if (invalid || availability.week_start > weekKey(reference)) { messages.push(invalid ?? "Availability is not yet effective."); return empty(); }

  const planningDate = new Date(Math.max(assessedAt.getTime(), reference.getTime()));
  const effectiveAthlete = applyActivityPowerMaxima(athlete, context, planningDate);
  const assessment = classifyTrainingFocus(effectiveAthlete, planningDate);
  const model = buildAthleteModel(effectiveAthlete);
  const recommendation = recommendAvailability(effectiveAthlete, availability.recent_weekly_minutes);
  const completed = completedBefore(context.completedWorkouts ?? [], calendar.startDate);
  const ageDays = ageInDays(effectiveAthlete.powerProfile?.recorded_at, planningDate);
  const needsRetest = ageDays !== null && ageDays >= POWER_RETEST_DAYS;
  if (needsRetest) messages.push("No new supported power maximum has been detected in 84 days. Complete a fresh 1-, 5- and 12-minute test before resuming focused progression.");

  const experienced = ["intermediate", "advanced", "pro"].includes(effectiveAthlete.profile.training_history ?? "");
  const tier = !experienced || recommendation.level === "beginner" ? 0 : recommendation.level === "amateur" ? 1 : 2;
  const recoveryReason = determineRecoveryReason(availability, completed, calendar.startDate);
  const recoveryWeek = recoveryReason !== null;
  const budget = calculateWeeklyBudget(availability, completed, recoveryWeek, calendar.startDate);
  const available = calendar.days.map((_, index) => index).filter(index => !availability.rest_days.includes(index));
  if (available.length === 7) { available.shift(); messages.push("Monday reserved for recovery: at least one full rest day is retained."); }

  if (!assessment.tag) messages.push(needsRetest ? "Focused intervals are paused until power data is current." : "Current confirmed maximal efforts are needed for targeted progression; endurance only for now.");
  if (!availability.recent_weekly_minutes && !completed.length) messages.push("No recent training history is available, so the plan starts with a conservative three-hour ceiling.");
  if (recoveryReason === "athlete_selected") messages.push("Recovery week selected: focused intervals are removed and volume is reduced by 40%.");
  if (recoveryReason === "scheduled") messages.push("Scheduled recovery week: three completed loading weeks trigger a lower-volume endurance week.");
  if (recoveryReason === "fatigue") messages.push("Recovery week triggered by recent high exertion or low completion. Resume progression after an easier week.");

  const sessions = new Map<number, { workout: BuiltWorkout; progressionLevel: number; reason: string }>();
  let qualityMinutes = 0;
  const qualityDays: number[] = [];
  const hasTrainingBaseline = availability.recent_weekly_minutes > 0 || completed.length > 0;
  const maxQuality = assessment.tag && hasTrainingBaseline && !recoveryWeek && budget >= 180
    ? (tier > 0 && budget >= 300 && available.length >= 4 ? 2 : 1)
    : 0;
  const selectedWorkouts = chooseFocusedWorkouts(assessment.tag, calendar.startDate);
  const qualityCandidates = chooseQualityDays(available);

  for (let index = 0; index < maxQuality && index < selectedWorkouts.length && index < qualityCandidates.length; index++) {
    const id = selectedWorkouts[index];
    const day = qualityCandidates[index];
    const progression = resolveProgression(id, tier, completed);
    const fitted = buildFittingFocusedWorkout(id, progression.level, availability.max_session_minutes, budget, qualityMinutes, model?.cpWatts ?? null, model?.inputs.fiveMinuteWatts ?? null);
    if (!fitted) continue;
    sessions.set(day, { workout: fitted.workout, progressionLevel: fitted.level, reason: progression.reason });
    qualityDays.push(day);
    qualityMinutes += fitted.workout.workSeconds / 60;
  }

  let used = [...sessions.values()].reduce((total, item) => total + item.workout.durationSeconds / 60, 0);
  for (const day of available) {
    if (!sessions.has(day) && used + 60 <= budget && availability.max_session_minutes >= 60) {
      sessions.set(day, { workout: buildWorkout("endurance"), progressionLevel: 0, reason: recoveryWeek ? "Recovery volume" : "Aerobic support" });
      used += 60;
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [day, item] of sessions) {
      if (item.workout.templateId === "endurance" && used + 30 <= budget && item.workout.durationSeconds / 60 + 30 <= availability.max_session_minutes) {
        sessions.set(day, { ...item, workout: buildWorkout("endurance", { durationMinutes: item.workout.durationSeconds / 60 + 30 }) });
        used += 30;
        changed = true;
      }
    }
  }

  while (qualityMinutes > used * QUALITY_SHARE_LIMIT && qualityDays.length) {
    const day = qualityDays.pop()!;
    const removed = sessions.get(day)!;
    sessions.delete(day);
    qualityMinutes -= removed.workout.workSeconds / 60;
    used -= removed.workout.durationSeconds / 60;
    if (used + 60 <= budget && availability.max_session_minutes >= 60) {
      const durationMinutes = 60 + 30 * Math.floor((Math.min(budget - used, availability.max_session_minutes) - 60) / 30);
      sessions.set(day, { workout: buildWorkout("endurance", { durationMinutes }), progressionLevel: 0, reason: "Aerobic balance" });
      used += durationMinutes;
    }
    messages.push("A focused session was replaced because the available endurance volume could not support a balanced week.");
  }

  for (const [day, item] of sessions) {
    const date = calendar.days[day].dateKey;
    const session = item.workout;
    const dose = session.templateId === "endurance" ? "Continuous Z2" : `${session.parameters.sets} set(s) × ${session.parameters.repetitionsPerSet} repetitions`;
    assignments[date] = {
      id: `${date}-${session.templateId}`,
      title: session.name,
      detail: dose,
      focusId: assessment.tag ?? "endurance",
      durationMinutes: session.durationSeconds / 60,
      description: describeWorkout(session, assessment.cpWatts, assessment.fiveMinuteWatts),
      workout: session,
      progressionLevel: item.progressionLevel,
      prescriptionVersion: PRESCRIPTION_VERSION,
      recoveryWeek,
      selectionReason: item.reason,
    };
  }
  const totalMinutes = [...sessions.values()].reduce((total, item) => total + item.workout.durationSeconds / 60, 0);
  if (totalMinutes < availability.weekly_minutes) messages.push("Unused time is intentional: progression, recent completed load, recovery spacing and session limits take priority over filling every available minute.");
  if (qualityDays.length < maxQuality) messages.push("Fewer focused sessions fit safely this week; recovery spacing and the easy-volume balance take priority.");
  messages.push("Plans adapt from recorded completion, exertion and new supported power maxima. They are training suggestions, not a medical or readiness assessment; stop for pain or illness.");
  return {
    version: PRESCRIPTION_VERSION,
    assignments,
    messages: [...new Set(messages)],
    totalMinutes,
    qualityMinutes,
    qualitySessions: qualityDays.length,
    trainingDays: sessions.size,
    recoveryWeek,
    recoveryReason,
    needsRetest,
    powerDataAgeDays: ageDays,
    trainingFocus: assessment,
  };
}

function applyActivityPowerMaxima(athlete: AthleteData, context: TrainingHistoryContext, at: Date): AthleteData {
  if (!athlete.powerProfile) return athlete;
  const power = athlete.powerProfile;
  const values: Record<60 | 300 | 720, number> = {
    60: Number(power.one_minute_watts),
    300: Number(power.five_minute_watts),
    720: Number(power.twelve_minute_watts),
  };
  let newestEvidence = validTimestamp(power.recorded_at);
  const observations = [...(context.powerMaxima ?? [])]
    .filter(item => [60, 300, 720].includes(item.duration_seconds) && validTimestamp(item.observed_at) !== null && Date.parse(item.observed_at) <= at.getTime())
    .sort((first, second) => Date.parse(first.observed_at) - Date.parse(second.observed_at));
  for (const observation of observations) {
    const duration = observation.duration_seconds as 60 | 300 | 720;
    if (Number.isFinite(observation.watts) && observation.watts > values[duration]) {
      values[duration] = observation.watts;
      newestEvidence = Math.max(newestEvidence ?? 0, Date.parse(observation.observed_at));
    }
  }
  const effective: PowerProfile = {
    ...power,
    one_minute_watts: values[60],
    five_minute_watts: values[300],
    twelve_minute_watts: values[720],
    recorded_at: newestEvidence === null ? power.recorded_at : new Date(newestEvidence).toISOString(),
  };
  return { ...athlete, powerProfile: effective };
}

function determineRecoveryReason(availability: Availability, history: CompletedWorkout[], weekStart: Date): PrescriptionResult["recoveryReason"] {
  if (availability.recovery_week) return "athlete_selected";
  const recent = history.filter(item => Date.parse(item.completed_at) >= weekStart.getTime() - 21 * DAY_MS);
  if (recent.filter(item => (item.perceived_exertion ?? 0) >= 9 || item.completion_ratio < 0.75).length >= 2) return "fatigue";
  const weeks = [...new Map(history.map(item => [weekKey(new Date(`${item.scheduled_date}T12:00:00`)), item])).entries()]
    .sort(([first], [second]) => second.localeCompare(first));
  let loadingWeeks = 0;
  let expectedWeek = weekKey(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7));
  for (const [recordedWeek, item] of weeks) {
    if (recordedWeek !== expectedWeek) break;
    if (item.recovery_week) break;
    loadingWeeks++;
    if (loadingWeeks >= 3) return "scheduled";
    const expectedDate = new Date(`${expectedWeek}T12:00:00`);
    expectedWeek = weekKey(new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate() - 7));
  }
  return null;
}

function calculateWeeklyBudget(availability: Availability, history: CompletedWorkout[], recoveryWeek: boolean, weekStart: Date) {
  const priorWeek = weekKey(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7));
  const prior = history.filter(item => weekKey(new Date(`${item.scheduled_date}T12:00:00`)) === priorWeek);
  const priorPlanned = prior.reduce((total, item) => total + item.planned_duration_minutes, 0);
  const priorCompleted = prior.reduce((total, item) => total + item.completed_duration_minutes, 0);
  const statedBaseline = availability.recent_weekly_minutes || 180;
  const historyCoverage = priorPlanned / statedBaseline;
  const hasRepresentativeWeek = prior.length >= 2 || historyCoverage >= 0.5;
  const reliableCompletion = hasRepresentativeWeek && priorPlanned > 0 ? priorCompleted / priorPlanned : null;
  const baseline = reliableCompletion === null
    ? statedBaseline
    : reliableCompletion < 0.85
      ? Math.min(statedBaseline, priorCompleted)
      : Math.max(statedBaseline, priorCompleted);
  const progressionMultiplier = reliableCompletion !== null && reliableCompletion >= 0.85 ? 1.05 : 1;
  // Availability is the ceiling. Recent training still prevents an abrupt
  // increase, but fitness classification must not silently replace the
  // schedule and training history entered by the athlete.
  let budget = Math.min(availability.weekly_minutes, baseline * progressionMultiplier);
  if (recoveryWeek) budget *= 0.6;
  return Math.max(0, Math.floor(budget));
}

function chooseFocusedWorkouts(focus: TrainingFocusTag | null, weekStart: Date): Exclude<WorkoutId, "endurance">[] {
  const cycle = Math.floor(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()) / (7 * DAY_MS));
  if (focus === "sustainable_power") return cycle % 2 ? ["threshold", "lt1"] : ["sweet-spot", "threshold"];
  if (focus === "aerobic_ceiling") return cycle % 2 ? ["vo2-30-15", "threshold"] : ["vo2-long", "threshold"];
  return cycle % 2 ? ["vo2-long", "lt1"] : ["sweet-spot", "vo2-30-15"];
}

function chooseQualityDays(available: number[]) {
  const preferred = [1, 4, 2, 5, 3, 6, 0].filter(day => available.includes(day));
  const selected: number[] = [];
  for (const day of preferred) {
    if (selected.every(existing => Math.abs(existing - day) >= 2)) selected.push(day);
  }
  return selected;
}

function resolveProgression(id: Exclude<WorkoutId, "endurance">, tier: number, history: CompletedWorkout[]) {
  const steps = PROGRESSION_STEPS[id];
  const initial = Math.min(tier, steps.length - 1);
  const previous = history
    .filter(item => item.template_id === id)
    .sort((first, second) => Date.parse(second.completed_at) - Date.parse(first.completed_at))[0];
  if (!previous) return { level: initial, reason: "Initial dose matched to current athlete level" };
  const previousLevel = Math.max(0, Math.min(previous.progression_level, steps.length - 1));
  const hard = previous.completion_ratio < 0.75 || (previous.perceived_exertion ?? 0) >= 9;
  const successful = previous.completion_ratio >= 0.9 && (previous.perceived_exertion === null || previous.perceived_exertion <= 8);
  if (hard) return { level: Math.max(0, previousLevel - 1), reason: "Dose reduced after a difficult or incomplete session" };
  if (successful) return { level: Math.min(steps.length - 1, previousLevel + 1), reason: "Progressed after successful completion" };
  return { level: previousLevel, reason: "Dose held until the current step is completed consistently" };
}

function buildFittingFocusedWorkout(
  id: Exclude<WorkoutId, "endurance">,
  requestedLevel: number,
  maxSessionMinutes: number,
  weeklyBudget: number,
  qualityMinutes: number,
  cp: number | null,
  p5: number | null,
) {
  for (let level = requestedLevel; level >= 0; level--) {
    let workout = buildWorkout(id, PROGRESSION_STEPS[id][level]);
    if (id === "vo2-long" && cp && p5) {
      workout = {
        ...workout,
        steps: workout.steps.map(step => step.role === "work"
          ? { ...step, target: { kind: "cp-fraction", fraction: Math.min(1.2, 0.95 * p5 / cp) } }
          : step),
      };
    }
    const duration = workout.durationSeconds / 60;
    const work = workout.workSeconds / 60;
    if (duration <= maxSessionMinutes && duration <= weeklyBudget && qualityMinutes + work <= weeklyBudget * QUALITY_SHARE_LIMIT) return { workout, level };
  }
  return null;
}

function completedBefore(history: readonly CompletedWorkout[], date: Date) {
  return history
    .filter(item => Number.isFinite(Date.parse(item.completed_at)) && Date.parse(item.completed_at) < date.getTime())
    .map(item => ({ ...item }));
}

function ageInDays(value: string | null | undefined, at: Date) {
  const timestamp = validTimestamp(value);
  if (timestamp === null) return null;
  return Math.max(0, (at.getTime() - timestamp) / DAY_MS);
}

function validTimestamp(value: string | null | undefined) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatStepDuration(seconds: number) {
  return seconds < 60 ? `${seconds} sec` : `${seconds / 60} min`;
}
