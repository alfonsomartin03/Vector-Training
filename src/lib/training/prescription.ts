import type { AthleteData } from "../../types/athlete";
import { buildAthleteModel } from "../physiology/athleteModel";
import { classifyTrainingFocus } from "./focus";
import { buildWeeklyTrainingPlan, toLocalDateKey, type WorkoutAssignment } from "./weeklyPlan";
import { buildWorkout, WORKOUT_LIBRARY, type BuiltWorkout, type PowerTarget, type WorkoutId } from "./workouts";

export type Availability = {
  week_start: string;
  weekly_minutes: number;
  max_session_minutes: number;
  recent_weekly_minutes: number;
  rest_days: number[]; // Monday = 0, Sunday = 6
  recovery_week: boolean;
};

export const PRESCRIPTION_VERSION = 1;
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
    explanation: "Suggested starting point, not a proven optimum. Keep volume near your recent four-week average; available time is a ceiling, not a target to fill. Add rest when tired. No automatic week-to-week load increase.",
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
  return `20 min Z2 warm-up; ${sets} set(s) of ${session.parameters.repetitionsPerSet} × ${work.durationSeconds / 60} min at ${targetLabel(work.target, cp, p5)}, with ${template.recovery.durationSeconds / 60} min ${targetLabel(template.recovery.target, cp, p5)} ${template.recoveryAfterLastRepetition ? "after every repetition (including the last)" : "between repetitions only"}.${sets > 1 ? ` ${template.betweenSets.durationSeconds / 60} min Z2 between sets.` : ""} Finish with 20 min Z2 cooldown.`;
}

/** Deterministic, conservative draft. No inferred recovery/readiness or automatic progression. */
export function prescribeWeek(athlete: AthleteData | null, availability: Availability | null, reference = new Date(), assessedAt = new Date()) {
  const assignments: Record<string, WorkoutAssignment> = {};
  const messages: string[] = [];
  const calendar = buildWeeklyTrainingPlan(reference);
  const empty = () => ({ version: PRESCRIPTION_VERSION, assignments, messages, totalMinutes: 0, qualityMinutes: 0, qualitySessions: 0, trainingDays: 0 });
  if (!athlete || !availability) { messages.push("Save your availability to generate a weekly plan."); return empty(); }
  const invalid = validateAvailability(availability);
  if (invalid || availability.week_start > weekKey(reference)) { messages.push(invalid ?? "Availability is not yet effective."); return empty(); }
  const recommendation = recommendAvailability(athlete, availability.recent_weekly_minutes);
  // Recheck freshness now, rather than trusting a persisted tag indefinitely.
  const assessment = classifyTrainingFocus(athlete, new Date(Math.max(assessedAt.getTime(), reference.getTime())));
  const experienced = ["intermediate", "advanced", "pro"].includes(athlete.profile.training_history ?? "");
  const tier = !experienced || recommendation.level === "beginner" ? 0 : recommendation.level === "amateur" ? 1 : 2;
  const baseline = availability.recent_weekly_minutes || 180;
  let budget = Math.min(availability.weekly_minutes, baseline, tier === 0 ? 360 : tier === 1 ? 600 : 900);
  if (availability.recovery_week) budget *= 0.6;
  budget = Math.floor(budget);
  const available = calendar.days.map((_, i) => i).filter(i => !availability.rest_days.includes(i));
  // Always preserve at least one full rest day, even if none was selected.
  if (available.length === 7) { available.shift(); messages.push("Monday reserved for recovery: at least one rest day is retained."); }
  const maxQuality = assessment.tag && !availability.recovery_week && availability.recent_weekly_minutes >= 180
    ? (tier > 0 && budget >= 300 && available.length >= 4 ? 2 : 1) : 0;
  if (!assessment.tag) messages.push("Current confirmed maximal tests are needed for intervals; endurance only for now.");
  if (!availability.recent_weekly_minutes) messages.push("No recent volume recorded: using a conservative 3-hour endurance ceiling. Start shorter if returning from a break.");
  if (availability.recovery_week) messages.push("Recovery week: endurance only, with a 40% reduction from the normal volume ceiling.");
  const cycle = Math.floor(Date.UTC(calendar.startDate.getFullYear(), calendar.startDate.getMonth(), calendar.startDate.getDate()) / 604800) % 2;
  const primary: WorkoutId = assessment.tag === "aerobic_ceiling" ? (cycle ? "vo2-30-15" : "vo2-long") : assessment.tag === "sustainable_power" ? (cycle ? "threshold" : "sweet-spot") : (cycle ? "vo2-long" : "sweet-spot");
  const secondary: WorkoutId = assessment.tag === "sustainable_power" ? "lt1" : "threshold";
  const sessions = new Map<number, BuiltWorkout>();
  let qualityMinutes = 0;
  const qualityDays: number[] = [];
  // Fixed eligible interval weekdays also guarantee separation across repeated weeks.
  for (const day of [1, 4]) {
    if (qualityDays.length >= maxQuality || !available.includes(day)) continue;
    const id = qualityDays.length === 0 ? primary : secondary;
    const reps = id === "vo2-30-15" ? 13 : id === "lt1" ? [1, 1, 2][tier] : id === "vo2-long" ? [2, 3, 4][tier] : id === "threshold" ? [2, 3, 4][tier] : [1, 2, 3][tier];
    const session = buildWorkout(id, { repetitionsPerSet: reps, sets: id === "vo2-30-15" && tier === 2 ? 2 : 1 });
    // Long VO2 targets cannot exceed 95% of the athlete's tested five-minute power.
    const adjusted: BuiltWorkout = id === "vo2-long" && assessment.cpWatts && assessment.fiveMinuteWatts ? {
      ...session, steps: session.steps.map(step => step.role === "work" ? { ...step, target: { kind: "cp-fraction", fraction: Math.min(1.2, 0.95 * assessment.fiveMinuteWatts! / assessment.cpWatts!) } } : step),
    } : session;
    const minutes = adjusted.durationSeconds / 60;
    const work = adjusted.workSeconds / 60;
    if (minutes <= availability.max_session_minutes && minutes <= budget && qualityMinutes + work <= budget * 0.2) {
      sessions.set(day, adjusted); qualityDays.push(day); qualityMinutes += work;
    }
  }
  let used = [...sessions.values()].reduce((n, w) => n + w.durationSeconds / 60, 0);
  // Spread easy sessions first, then grow them in library-supported 30-minute steps.
  for (const day of available) {
    if (!sessions.has(day) && used + 60 <= budget && availability.max_session_minutes >= 60) {
      sessions.set(day, buildWorkout("endurance")); used += 60;
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [day, session] of sessions) {
      if (session.templateId === "endurance" && used + 30 <= budget && session.durationSeconds / 60 + 30 <= availability.max_session_minutes) {
        sessions.set(day, buildWorkout("endurance", { durationMinutes: session.durationSeconds / 60 + 30 })); used += 30; changed = true;
      }
    }
  }
  // Underfilled calendars must not become intensity-heavy simply because easy rides did not fit.
  while (qualityMinutes > used * 0.2 && qualityDays.length) {
    const day = qualityDays.pop()!;
    const removed = sessions.get(day)!;
    sessions.delete(day);
    qualityMinutes -= removed.workSeconds / 60;
    used -= removed.durationSeconds / 60;
    if (used + 60 <= budget && availability.max_session_minutes >= 60) {
      const durationMinutes = 60 + 30 * Math.floor((Math.min(budget - used, availability.max_session_minutes) - 60) / 30);
      sessions.set(day, buildWorkout("endurance", { durationMinutes }));
      used += durationMinutes;
    }
    messages.push("A focused session was replaced or omitted because the available easy volume could not support a balanced week.");
  }
  for (const [day, session] of sessions) {
    const date = calendar.days[day].dateKey;
    const dose = session.templateId === "endurance" ? "Continuous Z2" : `${session.parameters.sets} set(s) × ${session.parameters.repetitionsPerSet} repetitions`;
    assignments[date] = { id: `${date}-${session.templateId}`, title: session.name, detail: dose, focusId: assessment.tag ?? "endurance", durationMinutes: session.durationSeconds / 60,
      description: describeWorkout(session, assessment.cpWatts, assessment.fiveMinuteWatts), workout: session };
  }
  const totalMinutes = [...sessions.values()].reduce((n, w) => n + w.durationSeconds / 60, 0);
  if (totalMinutes < availability.weekly_minutes) messages.push("Unused time is intentional: recent volume, recovery, full workout duration and session limits take priority. Endurance rides require at least 60 minutes; interval sessions retain the full 20-minute warm-up and cooldown.");
  if (qualityDays.length < maxQuality) messages.push("Fewer interval sessions fit this week. Intervals are offered on Tuesday/Friday for recovery spacing; rest-day choices always take priority.");
  messages.push("This is a suggested week, not a medical or readiness assessment. Stop for pain or illness; choose a recovery week when fatigued. Changes regenerate the whole displayed week, not a completion history.");
  return { version: PRESCRIPTION_VERSION, assignments, messages: [...new Set(messages)], totalMinutes, qualityMinutes, qualitySessions: qualityDays.length, trainingDays: sessions.size };
}
