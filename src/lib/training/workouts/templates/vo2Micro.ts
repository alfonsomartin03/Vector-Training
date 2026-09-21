import { STANDARD_INTERVAL_BLOCKS, step } from "../blocks";
import type { IntervalTemplate } from "../types";

export const vo2Micro = {
  ...STANDARD_INTERVAL_BLOCKS,
  id: "vo2-30-15",
  version: 1,
  name: "VO2 30/15 intervals",
  description: "Two sets of 13 repetitions: 30 seconds at five-minute maximum power, 15 seconds at Z2.",
  notes: ["Each set includes all 13 off phases. Five additional minutes of Z2 separate sets."],
  work: step("work", 30, { kind: "five-minute-max" }),
  recovery: step("recovery", 15),
  repetitionsPerSet: { default: 13, min: 1, step: 1 },
  sets: { default: 2, min: 1, step: 1 },
  recoveryAfterLastRepetition: true,
} as const satisfies IntervalTemplate;
