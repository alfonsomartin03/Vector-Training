import type { PowerTarget, WorkoutStep } from "./types";

export const Z2 = { kind: "zone", zone: "z2" } as const satisfies PowerTarget;

export function step(
  role: WorkoutStep["role"],
  durationSeconds: number,
  target: PowerTarget = Z2,
): WorkoutStep {
  return { role, durationSeconds, target };
}

export const STANDARD_WARMUP = step("warmup", 20 * 60);
export const STANDARD_COOLDOWN = step("cooldown", 20 * 60);

export const STANDARD_INTERVAL_BLOCKS = {
  structure: "intervals",
  warmup: STANDARD_WARMUP,
  cooldown: STANDARD_COOLDOWN,
  sets: { default: 1, min: 1, step: 1 },
  betweenSets: step("recovery", 5 * 60),
  recoveryAfterLastRepetition: false,
} as const;
