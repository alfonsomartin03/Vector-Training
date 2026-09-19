/**
 * W′ Balance Model
 *
 * W′ represents the finite amount of work an athlete can perform
 * above Critical Power (CP).
 *
 * When power exceeds CP:
 *   W′ is depleted.
 *
 * When power falls below CP:
 *   W′ recovers.
 *
 * This module tracks the athlete's remaining W′ throughout
 * a power time series.
 */

export type WPrimeBalancePoint = {
  timeSeconds: number;
  powerWatts: number;

  wPrimeBalanceJoules: number;
  wPrimeBalanceKj: number;

  wPrimePercent: number;
};

export type PowerSample = {
  timeSeconds: number;
  powerWatts: number;
};

export type WPrimeBalanceOptions = {
  cpWatts: number;
  wPrimeJoules: number;

  /**
   * Controls how quickly W′ recovers below CP.
   *
   * This is currently a simplified recovery model.
   * It can later be replaced with a more advanced
   * Skiba-style recovery model.
   */
  recoveryTimeConstantSeconds?: number;
};

const DEFAULT_RECOVERY_TIME_CONSTANT = 300;

/**
 * Calculate the amount of W′ expended during a period
 * above Critical Power.
 *
 * Work above CP:
 *
 *     W′ expenditure = (Power - CP) × time
 */
export function calculateWPrimeExpenditure(
  powerWatts: number,
  cpWatts: number,
  durationSeconds: number
): number {
  if (
    !Number.isFinite(powerWatts) ||
    !Number.isFinite(cpWatts) ||
    !Number.isFinite(durationSeconds)
  ) {
    throw new Error(
      "Power, Critical Power, and duration must be finite numbers."
    );
  }

  if (durationSeconds < 0) {
    throw new Error(
      "Duration cannot be negative."
    );
  }

  if (powerWatts <= cpWatts) {
    return 0;
  }

  return (
    (powerWatts - cpWatts) *
    durationSeconds
  );
}

/**
 * Calculate W′ recovery while riding below CP.
 *
 * This uses an exponential recovery model:
 *
 * recovery =
 *   (W′max - W′balance)
 *   ×
 *   (1 - e^(-dt / tau))
 *
 * tau controls the rate of recovery.
 */
export function calculateWPrimeRecovery(
  currentWPrimeJoules: number,
  maximumWPrimeJoules: number,
  durationSeconds: number,
  recoveryTimeConstantSeconds =
    DEFAULT_RECOVERY_TIME_CONSTANT
): number {
  if (
    !Number.isFinite(currentWPrimeJoules) ||
    !Number.isFinite(maximumWPrimeJoules) ||
    !Number.isFinite(durationSeconds) ||
    !Number.isFinite(recoveryTimeConstantSeconds)
  ) {
    throw new Error(
      "W′ recovery inputs must be finite numbers."
    );
  }

  if (
    maximumWPrimeJoules <= 0 ||
    durationSeconds < 0 ||
    recoveryTimeConstantSeconds <= 0
  ) {
    throw new Error(
      "Invalid W′ recovery parameters."
    );
  }

  const remainingCapacity =
    maximumWPrimeJoules -
    currentWPrimeJoules;

  if (remainingCapacity <= 0) {
    return 0;
  }

  const recoveryFraction =
    1 -
    Math.exp(
      -durationSeconds /
        recoveryTimeConstantSeconds
    );

  return (
    remainingCapacity *
    recoveryFraction
  );
}

/**
 * Calculate W′ balance across an entire power time series.
 *
 * Samples should be ordered chronologically.
 *
 * The athlete begins with their full W′ capacity.
 */
export function calculateWPrimeBalance(
  samples: PowerSample[],
  options: WPrimeBalanceOptions
): WPrimeBalancePoint[] {
  const {
    cpWatts,
    wPrimeJoules,
    recoveryTimeConstantSeconds =
      DEFAULT_RECOVERY_TIME_CONSTANT,
  } = options;

  if (
    !Number.isFinite(cpWatts) ||
    cpWatts <= 0
  ) {
    throw new Error(
      "Critical Power must be greater than zero."
    );
  }

  if (
    !Number.isFinite(wPrimeJoules) ||
    wPrimeJoules <= 0
  ) {
    throw new Error(
      "W′ must be greater than zero."
    );
  }

  if (
    !Number.isFinite(
      recoveryTimeConstantSeconds
    ) ||
    recoveryTimeConstantSeconds <= 0
  ) {
    throw new Error(
      "Recovery time constant must be greater than zero."
    );
  }

  if (samples.length === 0) {
    return [];
  }

  const sortedSamples = [...samples].sort(
    (a, b) =>
      a.timeSeconds - b.timeSeconds
  );

  let currentWPrime =
    wPrimeJoules;

  const results: WPrimeBalancePoint[] = [];

  for (
    let index = 0;
    index < sortedSamples.length;
    index++
  ) {
    const sample =
      sortedSamples[index];

    if (
      !Number.isFinite(sample.timeSeconds) ||
      !Number.isFinite(sample.powerWatts) ||
      sample.timeSeconds < 0 ||
      sample.powerWatts < 0
    ) {
      throw new Error(
        "Power samples contain invalid values."
      );
    }

    /*
     * The first observation has no previous time
     * interval to integrate.
     */
    if (index > 0) {
      const previousSample =
        sortedSamples[index - 1];

      const durationSeconds =
        sample.timeSeconds -
        previousSample.timeSeconds;

      if (durationSeconds > 0) {
        /*
         * Treat the previous sample's power as the
         * power maintained during this interval.
         */
        const intervalPower =
          previousSample.powerWatts;

        if (intervalPower > cpWatts) {
          const expenditure =
            calculateWPrimeExpenditure(
              intervalPower,
              cpWatts,
              durationSeconds
            );

          currentWPrime -=
            expenditure;
        } else if (
          intervalPower < cpWatts
        ) {
          const recovery =
            calculateWPrimeRecovery(
              currentWPrime,
              wPrimeJoules,
              durationSeconds,
              recoveryTimeConstantSeconds
            );

          currentWPrime +=
            recovery;
        }

        /*
         * W′ balance cannot exceed its maximum
         * capacity or fall below zero.
         */
        currentWPrime = Math.max(
          0,
          Math.min(
            wPrimeJoules,
            currentWPrime
          )
        );
      }
    }

    results.push({
      timeSeconds:
        sample.timeSeconds,

      powerWatts:
        sample.powerWatts,

      wPrimeBalanceJoules:
        currentWPrime,

      wPrimeBalanceKj:
        currentWPrime / 1000,

      wPrimePercent:
        (currentWPrime /
          wPrimeJoules) *
        100,
    });
  }

  return results;
}

/**
 * Return the lowest W′ balance reached during
 * a power time series.
 */
export function getMinimumWPrimeBalance(
  balance: WPrimeBalancePoint[]
): WPrimeBalancePoint | null {
  if (balance.length === 0) {
    return null;
  }

  return balance.reduce(
    (minimum, point) =>
      point.wPrimeBalanceJoules <
      minimum.wPrimeBalanceJoules
        ? point
        : minimum
  );
}