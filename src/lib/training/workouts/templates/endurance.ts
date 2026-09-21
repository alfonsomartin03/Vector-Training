import { Z2 } from "../blocks";
import type { EnduranceTemplate } from "../types";

export const endurance = {
  id: "endurance",
  version: 1,
  name: "Endurance",
  description: "Continuous Z2 riding, starting at 60 minutes in 30-minute increments.",
  notes: ["Duration includes the whole ride; no separate warm-up or cooldown."],
  structure: "continuous",
  durationMinutes: { default: 60, min: 60, step: 30 },
  target: Z2,
} as const satisfies EnduranceTemplate;
