/**
 * Tick generation. Two functions, because football's x-axis is a clock and
 * a clock does not want "nice" round numbers derived from its extent — an
 * axis reading 0, 20, 40, 60, 80 is arithmetically tidy and unreadable to
 * anyone who thinks in halves.
 */

/** The 1-2-5 progression, the standard set of human-readable step sizes. */
const STEP_MULTIPLES = [1, 2, 5, 10];

/**
 * Round, evenly spaced ticks spanning `min`..`max`, at roughly `count` of
 * them. Used for the value axis (cumulative xG), where the extent is data
 * dependent and any round number will do.
 *
 * Returns `[min]` for a degenerate range rather than looping forever on a
 * zero step.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max <= min) return [min];

  const rawStep = (max - min) / Math.max(count, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalised = rawStep / magnitude;
  // `magnitude` is 10^floor(log10(rawStep)), so `normalised` is always in
  // [1, 10) and the list's trailing 10 always matches — no fallback needed.
  const multiple = STEP_MULTIPLES.find((m) => normalised <= m) as number;
  const step = multiple * magnitude;

  const ticks: number[] = [];
  const first = Math.ceil(min / step) * step;
  // Accumulating `first + i * step` rather than `t += step` keeps floating
  // point error from compounding across the axis, which otherwise shows up
  // as a tick labelled "0.30000000000000004".
  for (let i = 0; first + i * step <= max + step * 1e-9; i += 1) {
    ticks.push(roundToStep(first + i * step, step));
  }
  return ticks;
}

/**
 * Strips the floating-point dust a multiplication leaves behind, to the
 * precision the step itself implies.
 */
function roundToStep(value: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(value.toFixed(decimals));
}

/**
 * Clock ticks for a match axis: every `interval` minutes from kick-off up
 * to `endTime`.
 *
 * The default of 15 gives 0/15/30/45/60/75/90, which is how football is
 * actually discussed. Extra time extends the same progression (105, 120)
 * rather than restarting, because `endTime` comes from the data.
 */
export function matchMinuteTicks(endTime: number, interval = 15): number[] {
  if (!Number.isFinite(endTime) || endTime < 0 || interval <= 0) return [];

  const ticks: number[] = [];
  for (let minute = 0; minute <= endTime; minute += interval) {
    ticks.push(minute);
  }
  return ticks;
}
