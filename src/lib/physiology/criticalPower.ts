/**
 * Morton 3-Parameter Critical Power Model
 *
 * Based on:
 * Morton RH. A 3-parameter critical power model.
 * Ergonomics. 1996;39(4):611-619.
 *
 * Model:
 *
 *     t = W′ / (P - CP) + k
 *
 * where k < 0.
 *
 * Equivalent power-duration form:
 *
 *     P(t) = CP + W′ / (t - k)
 *
 * The third physiological parameter is maximal
 * instantaneous power:
 *
 *     Pmax = CP - W′ / k
 */

export type PowerEffort = {
  durationSeconds: number;
  powerWatts: number;
};

export type CriticalPowerModel = {
  cpWatts: number;

  wPrimeJoules: number;
  wPrimeKj: number;

  pMaxWatts: number;

  /**
   * Negative time asymptote of Morton's model.
   */
  timeAsymptoteSeconds: number;

  effortsUsed: number;

  /**
   * Kept nullable because with exactly three observations
   * and three fitted parameters, R² is not useful as a
   * measure of model confidence.
   */
  rSquared: number | null;
};

/**
 * Solve Morton's 3-parameter model from exactly
 * three maximal efforts.
 *
 * Vector currently uses:
 *
 * 1 minute
 * 5 minutes
 * 12 minutes
 */
export function calculateCriticalPowerFromProfile(
  oneMinuteWatts: number,
  fiveMinuteWatts: number,
  twelveMinuteWatts: number
): CriticalPowerModel {
  return calculateThreeParameterCriticalPower([
    {
      durationSeconds: 60,
      powerWatts: oneMinuteWatts,
    },
    {
      durationSeconds: 300,
      powerWatts: fiveMinuteWatts,
    },
    {
      durationSeconds: 720,
      powerWatts: twelveMinuteWatts,
    },
  ]);
}

/**
 * Fit Morton's three-parameter CP model.
 *
 * For three observations:
 *
 *     P = CP + W′ / (t - k)
 *
 * We solve analytically for k, then derive
 * W′, CP, and Pmax.
 */
export function calculateThreeParameterCriticalPower(
  efforts: PowerEffort[]
): CriticalPowerModel {
  if (efforts.length !== 3) {
    throw new Error(
      "The current Morton 3-parameter solver requires exactly three maximal efforts."
    );
  }

  const sorted = [...efforts].sort(
    (a, b) =>
      a.durationSeconds -
      b.durationSeconds
  );

  for (const effort of sorted) {
    if (
      !Number.isFinite(
        effort.durationSeconds
      ) ||
      !Number.isFinite(
        effort.powerWatts
      ) ||
      effort.durationSeconds <= 0 ||
      effort.powerWatts <= 0
    ) {
      throw new Error(
        "All maximal efforts must contain valid positive duration and power values."
      );
    }
  }

  const [effort1, effort2, effort3] =
    sorted;

  const t1 =
    effort1.durationSeconds;

  const t2 =
    effort2.durationSeconds;

  const t3 =
    effort3.durationSeconds;

  const p1 =
    effort1.powerWatts;

  const p2 =
    effort2.powerWatts;

  const p3 =
    effort3.powerWatts;

  /*
   * From:
   *
   * P = CP + W′ / (t - k)
   *
   * subtract pairs of observations:
   *
   * P1 - P2 =
   * W′ [1/(t1-k) - 1/(t2-k)]
   *
   * P2 - P3 =
   * W′ [1/(t2-k) - 1/(t3-k)]
   *
   * Taking their ratio eliminates both CP and W′,
   * allowing k to be solved directly.
   */

  const powerDifference12 =
    p1 - p2;

  const powerDifference23 =
    p2 - p3;

  if (
    powerDifference12 <= 0 ||
    powerDifference23 <= 0
  ) {
    throw new Error(
      "Power must decrease as effort duration increases for the Morton model to be fitted."
    );
  }

  const ratio =
    powerDifference12 /
    powerDifference23;

  /*
   * Ratio:
   *
   * R =
   * (t2-t1)(t3-k)
   * -----------------
   * (t3-t2)(t1-k)
   *
   * Solve for k.
   */

  const a =
    ratio * (t3 - t2);

  const b =
    t2 - t1;

  const denominator =
    b - a;

  if (
    Math.abs(denominator) <
    Number.EPSILON
  ) {
    throw new Error(
      "Unable to solve the Morton model from these efforts."
    );
  }

  const timeAsymptoteSeconds =
    (
      b * t3 -
      a * t1
    ) /
    denominator;

  /*
   * Morton's model requires a negative
   * time asymptote.
   */
  if (
    !Number.isFinite(
      timeAsymptoteSeconds
    ) ||
    timeAsymptoteSeconds >= 0
  ) {
    throw new Error(
      "These efforts do not produce a physiologically valid Morton 3-parameter model."
    );
  }

  /*
   * Solve W′ using observations 1 and 2.
   */
  const inverseDifference =
    1 /
      (
        t1 -
        timeAsymptoteSeconds
      ) -
    1 /
      (
        t2 -
        timeAsymptoteSeconds
      );

  const wPrimeJoules =
    powerDifference12 /
    inverseDifference;

  /*
   * Solve CP.
   */
  const cpWatts =
    p1 -
    wPrimeJoules /
      (
        t1 -
        timeAsymptoteSeconds
      );

  /*
   * At t = 0:
   *
   * Pmax = CP - W′ / k
   *
   * Because k is negative, Pmax > CP.
   */
  const pMaxWatts =
    cpWatts -
    wPrimeJoules /
      timeAsymptoteSeconds;

  if (
    !Number.isFinite(cpWatts) ||
    !Number.isFinite(
      wPrimeJoules
    ) ||
    !Number.isFinite(pMaxWatts) ||
    cpWatts <= 0 ||
    wPrimeJoules <= 0 ||
    pMaxWatts <= cpWatts
  ) {
    throw new Error(
      "The supplied efforts produced an invalid Morton 3-parameter model."
    );
  }

  return {
    cpWatts,

    wPrimeJoules,

    wPrimeKj:
      wPrimeJoules / 1000,

    pMaxWatts,

    timeAsymptoteSeconds,

    effortsUsed: 3,

    rSquared: null,
  };
}

/**
 * Predict maximal power at a duration using
 * Morton's three-parameter model.
 *
 * P(t) = CP + W′ / (t - k)
 */
export function predictPowerAtDuration(
  model: Pick<
    CriticalPowerModel,
    | "cpWatts"
    | "wPrimeJoules"
    | "timeAsymptoteSeconds"
  >,
  durationSeconds: number
): number {
  if (
    !Number.isFinite(
      durationSeconds
    ) ||
    durationSeconds < 0
  ) {
    throw new Error(
      "Duration cannot be negative."
    );
  }

  return (
    model.cpWatts +
    model.wPrimeJoules /
      (
        durationSeconds -
        model.timeAsymptoteSeconds
      )
  );
}