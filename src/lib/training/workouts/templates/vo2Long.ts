import { STANDARD_INTERVAL_BLOCKS, step } from "../blocks";
import type { IntervalTemplate } from "../types";

export const vo2Long = {
  ...STANDARD_INTERVAL_BLOCKS,
  id: "vo2-long",
  version: 1,
  name: "VO2 five-minute intervals",
  description: "Five five-minute intervals at 120% CP with five-minute Z2 recoveries.",
  notes: ["120% CP and five repetitions are library defaults, not an individualized prescription. Rider-specific power and dose selection belong in the prescription layer."],
  work: step("work", 5 * 60, { kind: "cp-fraction", fraction: 1.2 }),
  recovery: step("recovery", 5 * 60),
  repetitionsPerSet: { default: 5, min: 1, step: 1 },
} as const satisfies IntervalTemplate;
