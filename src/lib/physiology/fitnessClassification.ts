export type AthleteFitnessLevel =
  | "beginner"
  | "amateur"
  | "highly_trained"
  | "elite";

export type FitnessClassification = {
  level: AthleteFitnessLevel;
  cpWattsPerKg: number;
};

export type FitnessClassificationInput = {
  vo2Max: number;
  cpWatts: number;
  weightKg: number;
};

export const FITNESS_THRESHOLDS = {
  highlyTrainedVo2Max: 55,
  eliteVo2Max: 65,
  amateurCpWattsPerKg: 3,
  eliteCpWattsPerKg: 4,
} as const;

/**
 * Internal athlete classification used to scale future workout intensity.
 *
 * The highest qualifying level wins. Thresholds are intentionally strict:
 * "over 65" and "over 4 W/kg" do not include the boundary value itself.
 */
export function classifyAthleteFitness({
  vo2Max,
  cpWatts,
  weightKg,
}: FitnessClassificationInput): FitnessClassification {
  if (!Number.isFinite(vo2Max) || vo2Max <= 0) {
    throw new Error("VO₂max must be a positive number.");
  }

  if (!Number.isFinite(cpWatts) || cpWatts <= 0) {
    throw new Error("Critical Power must be a positive number.");
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error("Body mass must be a positive number.");
  }

  const cpWattsPerKg = cpWatts / weightKg;

  if (
    vo2Max > FITNESS_THRESHOLDS.eliteVo2Max ||
    cpWattsPerKg > FITNESS_THRESHOLDS.eliteCpWattsPerKg
  ) {
    return { level: "elite", cpWattsPerKg };
  }

  if (vo2Max > FITNESS_THRESHOLDS.highlyTrainedVo2Max) {
    return { level: "highly_trained", cpWattsPerKg };
  }

  if (cpWattsPerKg > FITNESS_THRESHOLDS.amateurCpWattsPerKg) {
    return { level: "amateur", cpWattsPerKg };
  }

  return { level: "beginner", cpWattsPerKg };
}
