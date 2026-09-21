import { STANDARD_INTERVAL_BLOCKS, step } from "../blocks";
import type { IntervalTemplate } from "../types";

export const threshold = {
  ...STANDARD_INTERVAL_BLOCKS,
  id: "threshold",
  version: 1,
  name: "Threshold",
  description: "Five eight-minute intervals at 100% CP with four-minute Z2 recoveries.",
  notes: [],
  work: step("work", 8 * 60, { kind: "cp-fraction", fraction: 1 }),
  recovery: step("recovery", 4 * 60),
  repetitionsPerSet: { default: 5, min: 1, step: 1 },
} as const satisfies IntervalTemplate;
