import { STANDARD_INTERVAL_BLOCKS, step } from "../blocks";
import type { IntervalTemplate } from "../types";

export const sweetSpot = {
  ...STANDARD_INTERVAL_BLOCKS,
  id: "sweet-spot",
  version: 1,
  name: "Sweet spot",
  description: "Four 15-minute intervals at 90% CP with five-minute Z2 recoveries.",
  notes: ["The target is explicitly CP-based; it does not use FTP."],
  work: step("work", 15 * 60, { kind: "cp-fraction", fraction: 0.9 }),
  recovery: step("recovery", 5 * 60),
  repetitionsPerSet: { default: 4, min: 1, step: 1 },
} as const satisfies IntervalTemplate;
