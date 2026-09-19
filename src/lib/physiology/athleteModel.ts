import type { AthleteData } from "../../types/athlete";

import {
    calculateCriticalPowerFromProfile,
    type CriticalPowerModel,
} from "./criticalPower";

import {
    type DisplayPowerCurvePoint,
    generateDisplayPowerCurve,
} from "./powerCurve";

import {
  classifyAthleteFitness,
  type AthleteFitnessLevel,
} from "./fitnessClassification";
import { estimateVo2Max } from "./vo2Max";

export type AthleteModel = {
  cpWatts: number;

  wPrimeJoules: number;
  wPrimeKj: number;

  pMaxWatts: number;
  timeAsymptoteSeconds: number;

  vo2Max: number;
  vo2MaxSource: "measured" | "estimated";
  vo2MaxRecordedAt: string | null;

  /** Internal-only classification for workout intensity selection. */
  fitnessLevel: AthleteFitnessLevel;
  cpWattsPerKg: number;

  powerCurve: DisplayPowerCurvePoint[];

  inputs: {
    oneMinuteWatts: number;
    fiveMinuteWatts: number;
    twelveMinuteWatts: number;
    weightKg: number;
  };

  recordedAt: string | null;
};

export function buildAthleteModel(
  athlete: AthleteData
): AthleteModel | null {
  const profile = athlete.profile;
  const powerProfile = athlete.powerProfile;

  if (!profile || !powerProfile) {
    return null;
  }

  const weightKg = Number(
    profile.weight_kg
  );

  const oneMinuteWatts = Number(
    powerProfile.one_minute_watts
  );

  const fiveMinuteWatts = Number(
    powerProfile.five_minute_watts
  );

  const twelveMinuteWatts = Number(
    powerProfile.twelve_minute_watts
  );

  /*
   * Validate the source data before attempting
   * any physiological calculations.
   */
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(oneMinuteWatts) ||
    !Number.isFinite(fiveMinuteWatts) ||
    !Number.isFinite(twelveMinuteWatts) ||
    weightKg <= 0 ||
    oneMinuteWatts <= 0 ||
    fiveMinuteWatts <= 0 ||
    twelveMinuteWatts <= 0
  ) {
    return null;
  }

  /*
   * Morton 3-parameter Critical Power model.
   *
   * Returns:
   *
   * CP
   * W′
   * Pmax
   * negative time asymptote
   */
  let criticalPowerModel: CriticalPowerModel;

  try {
    criticalPowerModel =
      calculateCriticalPowerFromProfile(
        oneMinuteWatts,
        fiveMinuteWatts,
        twelveMinuteWatts
      );
  } catch (error) {
    console.error(
      "Unable to calculate Critical Power model:",
      error
    );

    return null;
  }

  /*
   * Defensive validation.
   *
   * If the CP solver ever returns a malformed
   * result, do not allow NaN/undefined values
   * to propagate into the UI.
   */
  if (
    !Number.isFinite(
      criticalPowerModel.cpWatts
    ) ||
    !Number.isFinite(
      criticalPowerModel.wPrimeJoules
    ) ||
    !Number.isFinite(
      criticalPowerModel.pMaxWatts
    ) ||
    !Number.isFinite(
      criticalPowerModel.timeAsymptoteSeconds
    )
  ) {
    console.error(
      "Critical Power model returned invalid parameters:",
      criticalPowerModel
    );

    return null;
  }

  /*
   * VO₂max estimate.
   */
  const estimatedVo2Max = estimateVo2Max(
    fiveMinuteWatts,
    weightKg
  );

  if (estimatedVo2Max === null) {
    return null;
  }

  const measuredRelativeVo2Max = Number(
    athlete.vo2MaxTest?.relative_vo2max
  );
  const measuredAbsoluteVo2 = Number(
    athlete.vo2MaxTest?.absolute_vo2_l_min
  );
  const measuredBodyMass = Number(
    athlete.vo2MaxTest?.body_mass_kg
  );

  const derivedRelativeVo2Max =
    Number.isFinite(measuredAbsoluteVo2) &&
    measuredAbsoluteVo2 > 0 &&
    Number.isFinite(measuredBodyMass) &&
    measuredBodyMass > 0
      ? (measuredAbsoluteVo2 * 1000) / measuredBodyMass
      : null;

  const hasMeasuredVo2Max =
    Number.isFinite(measuredRelativeVo2Max) &&
    measuredRelativeVo2Max > 0;

  const vo2Max = hasMeasuredVo2Max
    ? measuredRelativeVo2Max
    : derivedRelativeVo2Max ?? estimatedVo2Max;

  const fitnessClassification = classifyAthleteFitness({
    vo2Max,
    cpWatts: criticalPowerModel.cpWatts,
    weightKg,
  });

  /*
   * Generate Morton's modeled
   * power-duration curve.
   */
  const powerCurve =
    generateDisplayPowerCurve(
      criticalPowerModel
    );

  return {
    cpWatts:
      criticalPowerModel.cpWatts,

    wPrimeJoules:
      criticalPowerModel.wPrimeJoules,

    wPrimeKj:
      criticalPowerModel.wPrimeKj,

    pMaxWatts:
      criticalPowerModel.pMaxWatts,

    timeAsymptoteSeconds:
      criticalPowerModel.timeAsymptoteSeconds,

    vo2Max,
    vo2MaxSource:
      hasMeasuredVo2Max || derivedRelativeVo2Max != null
        ? "measured"
        : "estimated",
    vo2MaxRecordedAt: athlete.vo2MaxTest?.test_date ?? null,

    fitnessLevel: fitnessClassification.level,
    cpWattsPerKg: fitnessClassification.cpWattsPerKg,

    powerCurve,

    inputs: {
      oneMinuteWatts,
      fiveMinuteWatts,
      twelveMinuteWatts,
      weightKg,
    },

    recordedAt:
      powerProfile.recorded_at ?? null,
  };
}
