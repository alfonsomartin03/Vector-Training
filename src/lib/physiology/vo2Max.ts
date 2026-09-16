/**
 * Estimates VO₂max from 5-minute cycling power.
 *
 * Formula:
 * VO₂max = 16.6 + (8.87 × 5-minute W/kg)
 *
 * Returns VO₂max in mL/kg/min.
 */
export function estimateVo2Max(
  fiveMinuteWatts: number,
  weightKg: number
): number | null {
  if (
    !Number.isFinite(fiveMinuteWatts) ||
    !Number.isFinite(weightKg) ||
    fiveMinuteWatts <= 0 ||
    weightKg <= 0
  ) {
    return null;
  }

  const fiveMinuteWattsPerKg =
    fiveMinuteWatts / weightKg;

  return 16.6 + 8.87 * fiveMinuteWattsPerKg;
}