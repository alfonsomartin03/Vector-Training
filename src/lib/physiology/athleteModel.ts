import type { AthleteData } from "../../types/athlete";

import {
    calculateCriticalPowerFromProfile,
    type CriticalPowerModel,
} from "./criticalPower";

import {
    type DisplayPowerCurvePoint,
    generateDisplayPowerCurve,
} from "./powerCurve";

import { estimateVo2Max } from "./vo2Max";

export type AthleteModel = {
  cpWatts: number;

  wPrimeJoules: number;
  wPrimeKj: number;

  pMaxWatts: number;
  timeAsymptoteSeconds: number;

  vo2Max: number;

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
  const vo2Max = estimateVo2Max(
    fiveMinuteWatts,
    weightKg
  );

  if (vo2Max === null) {
    return null;
  }

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
