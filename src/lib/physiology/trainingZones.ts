export type CriticalPowerZone = {
  id: "recovery" | "endurance" | "tempo" | "threshold" | "severe" | "anaerobic";
  number: number;
  name: string;
  percentLabel: string;
  minWatts: number;
  maxWatts: number | null;
  purpose: string;
};

type ZoneDefinition = Pick<
  CriticalPowerZone,
  "id" | "number" | "name" | "percentLabel" | "purpose"
> & {
  upperFraction: number | null;
};

const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: "recovery",
    number: 1,
    name: "Recovery",
    percentLabel: "≤55% CP",
    upperFraction: 0.55,
    purpose: "Easy spinning and active recovery",
  },
  {
    id: "endurance",
    number: 2,
    name: "Endurance",
    percentLabel: "56–75% CP",
    upperFraction: 0.75,
    purpose: "Aerobic base and long steady riding",
  },
  {
    id: "tempo",
    number: 3,
    name: "Tempo",
    percentLabel: "76–90% CP",
    upperFraction: 0.9,
    purpose: "Sustained aerobic pressure",
  },
  {
    id: "threshold",
    number: 4,
    name: "Threshold",
    percentLabel: "91–100% CP",
    upperFraction: 1,
    purpose: "Work near critical power",
  },
  {
    id: "severe",
    number: 5,
    name: "Severe",
    percentLabel: "101–120% CP",
    upperFraction: 1.2,
    purpose: "VO₂-focused intervals above CP",
  },
  {
    id: "anaerobic",
    number: 6,
    name: "Anaerobic",
    percentLabel: ">120% CP",
    upperFraction: null,
    purpose: "Short, high-power efforts",
  },
];

/**
 * Convert an athlete's critical power into contiguous, whole-watt training
 * ranges. Keeping this calculation outside the UI lets future workout
 * builders use the exact same zone boundaries.
 */
export function buildCriticalPowerZones(cpWatts: number): CriticalPowerZone[] {
  if (!Number.isFinite(cpWatts) || cpWatts <= 0) {
    throw new Error("Critical Power must be a positive number.");
  }

  let nextMinimum = 0;

  return ZONE_DEFINITIONS.map((definition) => {
    const maxWatts =
      definition.upperFraction == null
        ? null
        : Math.round(cpWatts * definition.upperFraction);
    const zone: CriticalPowerZone = {
      id: definition.id,
      number: definition.number,
      name: definition.name,
      percentLabel: definition.percentLabel,
      minWatts: nextMinimum,
      maxWatts,
      purpose: definition.purpose,
    };

    if (maxWatts != null) {
      nextMinimum = maxWatts + 1;
    }

    return zone;
  });
}
