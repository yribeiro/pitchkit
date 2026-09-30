/**
 * One momentum sample, already resolved from the caller's accessors.
 *
 * Core takes plain numbers rather than `Accessor`s for the same reason
 * `race/` does: accessors are a React-binding ergonomic, and keeping them
 * out means this module never imports the pitch-shaped `scene/` types.
 */
export interface MomentumSample {
  /** Match minute the sample starts at. Fractional is fine. */
  readonly time: number;
  /** Signed: positive is the home side's pressure, negative the away side's. */
  readonly value: number;
}

/** A sample turned into a bar spanning a stretch of match minutes. */
export interface MomentumBar {
  readonly start: number;
  readonly end: number;
  readonly value: number;
  /** Index into the caller's original array, so a readout can find its datum. */
  readonly index: number;
}

export interface MomentumRange {
  readonly start: number;
  readonly end: number;
}

/**
 * Turns samples at arbitrary intervals into bars.
 *
 * **A bar runs from its sample's minute to the next sample's minute.** That
 * is what makes uneven intervals draw honestly: a sample taken every minute
 * draws a thin bar and one taken every five draws a wide one, and neither
 * leaves a gap or an overlap. A fixed-width bar centred on each minute
 * would do both on uneven data.
 *
 * The last bar has no next sample to end at, so it takes the median
 * interval of the rest. The median rather than the mean, so one long gap
 * in an otherwise regular series doesn't inflate the final bar. A single
 * sample has no interval to measure and gets one minute.
 *
 * Two samples at the same minute collapse to the later one: the earlier
 * would span zero minutes and is dropped. Non-finite samples are dropped
 * rather than propagated, so one `NaN` in a feed loses that interval, not
 * the match.
 *
 * `range` clips bars to a period, so a last bar can't run past full time
 * and a stray sample from outside the period draws nothing.
 */
export function computeMomentumBars(
  samples: readonly MomentumSample[],
  range?: MomentumRange,
): MomentumBar[] {
  const usable = samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => Number.isFinite(sample.time) && Number.isFinite(sample.value));

  // Ties broken by original index keeps the sort stable across engines, so
  // "the later sample wins" means the later one in the caller's array.
  usable.sort((a, b) => a.sample.time - b.sample.time || a.index - b.index);

  const fallback = medianInterval(usable.map(({ sample }) => sample.time));

  const bars: MomentumBar[] = [];
  usable.forEach(({ sample, index }, i) => {
    const next = usable[i + 1];
    let start = sample.time;
    let end = next === undefined ? start + fallback : next.sample.time;

    if (range !== undefined) {
      start = Math.max(start, range.start);
      end = Math.min(end, range.end);
    }
    if (end > start) bars.push({ start, end, value: sample.value, index });
  });

  return bars;
}

/**
 * The median gap between distinct, sorted times; one minute when there are
 * fewer than two to measure.
 */
function medianInterval(times: readonly number[]): number {
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i += 1) {
    const gap = (times[i] as number) - (times[i - 1] as number);
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 1;

  gaps.sort((a, b) => a - b);
  const middle = gaps.length >> 1;
  return gaps.length % 2 === 1
    ? (gaps[middle] as number)
    : ((gaps[middle - 1] as number) + (gaps[middle] as number)) / 2;
}

/**
 * The median width of a period's bars, in minutes; `undefined` for none.
 *
 * Lets a caller compare periods: a first half sampled every five minutes
 * beside a second half sampled every two draws bars of visibly different
 * widths in one chart, which is almost always a data-prep slip rather than
 * intent.
 */
export function medianBarWidth(bars: readonly MomentumBar[]): number | undefined {
  if (bars.length === 0) return undefined;
  const widths = bars.map((bar) => bar.end - bar.start).sort((a, b) => a - b);
  const middle = widths.length >> 1;
  return widths.length % 2 === 1
    ? (widths[middle] as number)
    : ((widths[middle - 1] as number) + (widths[middle] as number)) / 2;
}

/**
 * The bar covering `minute`, if any.
 *
 * Half-open (`start <= minute < end`), so a minute exactly on a boundary
 * belongs to the bar that starts there rather than to two bars. Binary
 * search, because the readout calls it on every pointer move.
 */
export function barAtMinute(bars: readonly MomentumBar[], minute: number): MomentumBar | undefined {
  let lo = 0;
  let hi = bars.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const bar = bars[mid] as MomentumBar;
    if (minute < bar.start) hi = mid - 1;
    else if (minute >= bar.end) lo = mid + 1;
    else return bar;
  }
  return undefined;
}
