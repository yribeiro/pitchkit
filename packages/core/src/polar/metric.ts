/**
 * A metric's scale on a polar chart: the value at the centre ring and the
 * value at the rim. PitchKit computes no statistics — the range is the
 * caller's, as are the values placed on it.
 */
export interface PolarRange {
  /** @default 0 */
  readonly min?: number;
  /** @default 100 */
  readonly max?: number;
  /**
   * Flips the axis so the better value is always outward: a player with few
   * turnovers reaches the rim, not the centre.
   */
  readonly lowerIsBetter?: boolean;
}

/** Where a value sits on its axis: 0 at the centre ring, 1 at the rim. */
export interface NormalisedValue {
  readonly t: number;
  /** The value was outside `min`..`max` and has been pulled onto the axis. */
  readonly clamped: boolean;
}

/**
 * Places `value` on its metric's axis, applying the lower-is-better flip
 * and clamping to the axis. `undefined` for a missing or non-finite value,
 * which draws nothing rather than a zero.
 *
 * A range with no width (`min === max`) puts every value on the middle
 * ring, since there is no direction to place it in.
 */
export function normaliseMetric(
  value: number | null | undefined,
  range: PolarRange,
): NormalisedValue | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  const min = range.min ?? 0;
  const max = range.max ?? 100;
  if (max === min) return { t: 0.5, clamped: false };

  const raw = (value - min) / (max - min);
  const oriented = range.lowerIsBetter ? 1 - raw : raw;
  const t = Math.min(Math.max(oriented, 0), 1);
  return { t, clamped: t !== oriented };
}

/**
 * The value at each ring boundary, from the centre ring (index 0) to the
 * rim (index `rings`). A lower-is-better axis counts down outwards, so the
 * labels agree with where the values are drawn.
 */
export function ringValues(range: PolarRange, rings: number): number[] {
  const min = range.min ?? 0;
  const max = range.max ?? 100;
  const [inner, outer] = range.lowerIsBetter ? [max, min] : [min, max];
  const count = Math.max(Math.round(rings), 1);
  return Array.from({ length: count + 1 }, (_, k) => inner + ((outer - inner) * k) / count);
}
