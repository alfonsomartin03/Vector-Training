import type { BuiltWorkout, PowerTarget } from "./workouts";

export function targetFraction(target: PowerTarget, cp: number | null, p5: number | null): number | null {
  if (target.kind === "cp-fraction") return target.fraction;
  if (target.kind === "five-minute-max") return cp && Number.isFinite(cp) && cp > 0 && p5 && Number.isFinite(p5) && p5 > 0 ? p5 / cp : null;
  return target.position === "top" ? 0.75 : target.zone === "z1-z2" ? 0.55 : 0.655;
}

export function workoutPreview(workout: BuiltWorkout, cp: number | null, p5: number | null) {
  const validCp = cp !== null && Number.isFinite(cp) && cp > 0 ? cp : null;
  let elapsed = 0;
  const blocks = workout.steps.map(step => {
    const fraction = targetFraction(step.target, validCp, p5);
    const block = { ...step, startSeconds: elapsed, fraction, watts: validCp && fraction !== null ? validCp * fraction : null };
    elapsed += step.durationSeconds;
    return block;
  });
  const known = blocks.every(block => block.watts !== null);
  const workJoules = blocks.reduce((sum, block) => sum + (block.watts ?? 0) * block.durationSeconds, 0);
  return {
    blocks, durationSeconds: elapsed,
    averageWatts: known && elapsed > 0 ? workJoules / elapsed : null,
    workKj: known ? workJoules / 1000 : null,
    aboveCpKj: known && validCp ? blocks.reduce((sum, block) => sum + Math.max(0, block.watts! - validCp) * block.durationSeconds, 0) / 1000 : null,
    workMinutes: blocks.filter(block => block.role === "work").reduce((sum, block) => sum + block.durationSeconds, 0) / 60,
  };
}

export function previewDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining ? `${minutes}m ${remaining}s` : minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : `${minutes}m`;
}
