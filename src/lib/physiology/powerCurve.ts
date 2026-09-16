import {
    CriticalPowerModel,
    predictPowerAtDuration,
} from "./criticalPower";

/**
 * A single modeled point on the athlete's
 * power-duration curve.
 */
export type PowerCurvePoint = {
  durationSeconds: number;
  powerWatts: number;
};

/**
 * A chart/display-ready power curve point.
 */
export type DisplayPowerCurvePoint =
  PowerCurvePoint & {
    label: string;
  };

/**
 * Standard durations displayed by Vector.
 *
 * We start at 60 seconds because the simple
 * two-parameter CP model should not be used
 * as a sprint-power model.
 */
export const DEFAULT_POWER_CURVE_DURATIONS = [
  60,   // 1 minute
  120,  // 2 minutes
  180,  // 3 minutes
  300,  // 5 minutes
  480,  // 8 minutes
  720,  // 12 minutes
  1200, // 20 minutes
  1800, // 30 minutes
  2400, // 40 minutes
  3600, // 60 minutes
] as const;

/**
 * Generate modeled power values for a collection
 * of durations using:
 *
 * P(t) = CP + W′ / t
 */
export function generatePowerCurve(
  model: Pick<
    CriticalPowerModel,
    "cpWatts" | "wPrimeJoules"
  >,
  durationsSeconds: readonly number[] =
    DEFAULT_POWER_CURVE_DURATIONS
): PowerCurvePoint[] {
  return durationsSeconds.map(
    (durationSeconds) => {
      if (
        !Number.isFinite(
          durationSeconds
        ) ||
        durationSeconds <= 0
      ) {
        throw new Error(
          "Power curve durations must be greater than zero."
        );
      }

      return {
        durationSeconds,

        powerWatts:
          predictPowerAtDuration(
            model,
            durationSeconds
          ),
      };
    }
  );
}

/**
 * Generate chart-ready power curve data.
 *
 * This adds readable labels and rounds power
 * to the nearest watt for presentation.
 */
export function generateDisplayPowerCurve(
  model: Pick<
    CriticalPowerModel,
    "cpWatts" | "wPrimeJoules"
  >,
  durationsSeconds: readonly number[] =
    DEFAULT_POWER_CURVE_DURATIONS
): DisplayPowerCurvePoint[] {
  return generatePowerCurve(
    model,
    durationsSeconds
  ).map((point) => ({
    durationSeconds:
      point.durationSeconds,

    powerWatts:
      Math.round(
        point.powerWatts
      ),

    label:
      formatDuration(
        point.durationSeconds
      ),
  }));
}

/**
 * Generate a smooth curve for a future line chart.
 *
 * Logarithmic spacing gives us more resolution
 * at short durations where the curve changes
 * rapidly while avoiding excessive points at
 * longer durations.
 */
export function generateDetailedPowerCurve(
  model: Pick<
    CriticalPowerModel,
    "cpWatts" | "wPrimeJoules"
  >,
  minimumDurationSeconds = 60,
  maximumDurationSeconds = 3600,
  numberOfPoints = 50
): PowerCurvePoint[] {
  if (
    !Number.isFinite(
      minimumDurationSeconds
    ) ||
    !Number.isFinite(
      maximumDurationSeconds
    ) ||
    minimumDurationSeconds <= 0 ||
    maximumDurationSeconds <=
      minimumDurationSeconds
  ) {
    throw new Error(
      "Invalid duration range for power curve."
    );
  }

  if (
    !Number.isInteger(
      numberOfPoints
    ) ||
    numberOfPoints < 2
  ) {
    throw new Error(
      "Power curve must contain at least two points."
    );
  }

  const minimumLog =
    Math.log(
      minimumDurationSeconds
    );

  const maximumLog =
    Math.log(
      maximumDurationSeconds
    );

  const points:
    PowerCurvePoint[] = [];

  for (
    let index = 0;
    index < numberOfPoints;
    index++
  ) {
    const progress =
      index /
      (numberOfPoints - 1);

    const logDuration =
      minimumLog +
      progress *
        (
          maximumLog -
          minimumLog
        );

    const durationSeconds =
      Math.exp(logDuration);

    points.push({
      durationSeconds,

      powerWatts:
        predictPowerAtDuration(
          model,
          durationSeconds
        ),
    });
  }

  return points;
}

/**
 * Convert seconds into a compact,
 * human-readable duration.
 */
export function formatDuration(
  durationSeconds: number
): string {
  if (
    !Number.isFinite(
      durationSeconds
    ) ||
    durationSeconds <= 0
  ) {
    return "—";
  }

  if (durationSeconds < 60) {
    return `${Math.round(
      durationSeconds
    )} sec`;
  }

  if (durationSeconds < 3600) {
    const minutes =
      durationSeconds / 60;

    return Number.isInteger(
      minutes
    )
      ? `${minutes} min`
      : `${minutes.toFixed(
          1
        )} min`;
  }

  const hours =
    durationSeconds / 3600;

  return Number.isInteger(hours)
    ? `${hours} hr`
    : `${hours.toFixed(1)} hr`;
}