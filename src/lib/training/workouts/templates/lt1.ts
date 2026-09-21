import { STANDARD_INTERVAL_BLOCKS, step } from "../blocks";
import type { IntervalTemplate } from "../types";

export const lt1 = {
  ...STANDARD_INTERVAL_BLOCKS,
  id: "lt1",
  version: 1,
  name: "LT1 / upper endurance",
  description: "Three 30-minute upper-Z2 intervals with two-minute easy recoveries.",
  notes: ["Upper Z2 is the requested template target, not a measured LT1 value. A later prescription policy can use measured LT1 data."],
  work: step("work", 30 * 60, { kind: "zone", zone: "z2", position: "top" }),
  recovery: step("recovery", 2 * 60, { kind: "zone", zone: "z1-z2" }),
  repetitionsPerSet: { default: 3, min: 1, step: 1 },
} as const satisfies IntervalTemplate;
