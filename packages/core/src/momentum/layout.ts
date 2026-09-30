import { createLinearScale } from "../chart/linear-scale.js";
import type { LinearScale } from "../chart/types.js";
import type { MomentumRange } from "./bars.js";
import { niceTicks } from "../chart/ticks.js";

/**
 * Where each period nominally starts and ends, in match minutes.
 *
 * Regulation halves, then the two extra-time periods, then 15-minute
 * blocks for anything beyond (a feed with a replay, say). Stoppage time is
 * not here: it is inside the feed's own minute numbering, so a real first
 * half runs to 47' as readily as 45', and `resolvePeriodRange` extends the
 * nominal end to the data.
 */
export function nominalPeriodRange(index: number): MomentumRange {
  const nominal: readonly MomentumRange[] = [
    { start: 0, end: 45 },
    { start: 45, end: 90 },
    { start: 90, end: 105 },
    { start: 105, end: 120 },
  ];
  const known = nominal[index];
  if (known !== undefined) return known;

  const start = 120 + 15 * (index - nominal.length);
  return { start, end: start + 15 };
}

/**
 * A period's range: its nominal one, extended if the data runs past it.
 *
 * Taking the end from the data, floored at the nominal end, means a half
 * with eight minutes of stoppage time is drawn eight minutes wider, and a
 * quiet one still shows a full 45. `latestEnd` is the end of the last bar,
 * or `undefined` for a period with no data.
 */
export function resolvePeriodRange(index: number, latestEnd: number | undefined): MomentumRange {
  const nominal = nominalPeriodRange(index);
  if (latestEnd === undefined || !Number.isFinite(latestEnd)) return nominal;
  return { start: nominal.start, end: Math.max(nominal.end, Math.ceil(latestEnd)) };
}

/** One period's slot in the chart, and the scale that maps its minutes into it. */
export interface MomentumPanel {
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly x0: number;
  readonly x1: number;
  /** Match minute -> pixel, within this panel only. */
  readonly scale: LinearScale;
}

/**
 * Lays periods out left to right across `x0`..`x1`, separated by `gap`.
 *
 * **Each panel's width is proportional to its minutes**, so a minute is the
 * same width in every period and a half with long stoppage time is wider
 * rather than squeezed. If every range is empty the panels split the width
 * equally, so a chart with no data still has somewhere to be.
 *
 * The gap is clamped so it can never push a panel's width negative: a
 * chart narrower than its own gaps collapses to zero-width panels rather
 * than drawing itself inside out.
 */
export function layoutMomentumPanels(
  ranges: readonly MomentumRange[],
  x0: number,
  x1: number,
  gap: number,
): MomentumPanel[] {
  if (ranges.length === 0) return [];

  const spans = ranges.map((range) => Math.max(range.end - range.start, 0));
  const totalSpan = spans.reduce((sum, span) => sum + span, 0);
  const available = Math.max(x1 - x0 - gap * (ranges.length - 1), 0);

  let cursor = x0;
  return ranges.map((range, index) => {
    const share = totalSpan > 0 ? (spans[index] as number) / totalSpan : 1 / ranges.length;
    const width = available * share;
    const panel: MomentumPanel = {
      index,
      start: range.start,
      end: range.end,
      x0: cursor,
      x1: cursor + width,
      scale: createLinearScale([range.start, range.end], [cursor, cursor + width]),
    };
    cursor += width + gap;
    return panel;
  });
}

/**
 * The half-height of the value axis: the largest magnitude in the data,
 * rounded up to a round number.
 *
 * Symmetric about zero, because a bar's direction is its meaning — home up,
 * away down — and an axis that gave one side more room would make equal
 * pressure look unequal. A chart whose values are all zero gets 1, so the
 * zero line has somewhere to sit.
 */
export function momentumExtent(values: readonly number[]): number {
  // One NaN in `Math.max` makes the whole result NaN, which here would
  // collapse the axis to 1 and draw every bar past the edge of the plot.
  // Non-finite values are skipped, as the bars skip them.
  const largest = values.reduce(
    (max, value) => (Number.isFinite(value) ? Math.max(max, Math.abs(value)) : max),
    0,
  );
  if (largest <= 0) return 1;

  const ticks = niceTicks(0, largest);
  const step = (ticks[1] as number) - (ticks[0] as number);
  return Math.ceil(largest / step) * step;
}
