import { endurance } from "./templates/endurance";
import { lt1 } from "./templates/lt1";
import { sweetSpot } from "./templates/sweetSpot";
import { threshold } from "./templates/threshold";
import { vo2Long } from "./templates/vo2Long";
import { vo2Micro } from "./templates/vo2Micro";
import type { WorkoutId, WorkoutTemplate } from "./types";

export const WORKOUT_LIBRARY = {
  endurance,
  lt1,
  "sweet-spot": sweetSpot,
  threshold,
  "vo2-long": vo2Long,
  "vo2-30-15": vo2Micro,
} as const satisfies Readonly<Record<WorkoutId, WorkoutTemplate>>;
