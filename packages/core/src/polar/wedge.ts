import { axisAngle, polarPoint } from "./angle.js";

/** An angular span, in radians clockwise from the top. */
export interface Wedge {
  readonly start: number;
  readonly end: number;
}

/**
 * The span of slice `index` of `count`, each slice starting on its axis
 * angle, inset by `gap` radians at both edges so neighbours don't touch.
 * A gap wider than the slice collapses it to its middle rather than
 * inverting it.
 */
export function wedgeAngles(index: number, count: number, gap = 0): Wedge {
  const start = axisAngle(index, count);
  const end = axisAngle(index + 1, count);
  const inset = Math.min(gap, (end - start) / 2);
  return { start: start + inset, end: end - inset };
}

/**
 * Splits a wedge into `parts` equal sub-wedges, each inset by `gap`
 * radians, for drawing several series side by side within one slice.
 */
export function splitWedge(wedge: Wedge, parts: number, gap = 0): Wedge[] {
  const count = Math.max(Math.round(parts), 1);
  const width = (wedge.end - wedge.start) / count;
  const inset = Math.min(gap, width / 2);
  return Array.from({ length: count }, (_, k) => ({
    start: wedge.start + k * width + inset,
    end: wedge.start + (k + 1) * width - inset,
  }));
}

/** Two decimals, with no `-0` or `e-16` dust in the markup. */
const px = (value: number) => String(+value.toFixed(2));

/**
 * The SVG path of the slice between radii `r0` and `r1` and angles
 * `start`..`end`: a pizza slice with the hole cut out of its point.
 */
export function annularSectorPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  { start, end }: Wedge,
): string {
  const large = end - start > Math.PI ? 1 : 0;
  const [ox0, oy0] = polarPoint(cx, cy, r1, start).map(px);
  const [ox1, oy1] = polarPoint(cx, cy, r1, end).map(px);
  const [ix1, iy1] = polarPoint(cx, cy, r0, end).map(px);
  const [ix0, iy0] = polarPoint(cx, cy, r0, start).map(px);
  const [outer, inner] = [px(r1), px(r0)];
  return (
    `M${ox0} ${oy0}A${outer} ${outer} 0 ${large} 1 ${ox1} ${oy1}` +
    `L${ix1} ${iy1}A${inner} ${inner} 0 ${large} 0 ${ix0} ${iy0}Z`
  );
}

/**
 * Draw order for series sharing one wedge: largest first, so each smaller
 * slice sits on top of the larger one behind it and stays visible. Ties
 * keep series order; a missing value draws nothing, so is left out.
 */
export function overlayOrder(values: readonly (number | undefined)[]): number[] {
  return values
    .flatMap((value, index) => (value === undefined ? [] : [{ value, index }]))
    .sort((a, b) => b.value - a.value || a.index - b.index)
    .map(({ index }) => index);
}

/** The angle down the middle of a wedge. */
export function wedgeMid(wedge: Wedge): number {
  return (wedge.start + wedge.end) / 2;
}

/**
 * The angle of lane `lane` of `lanes` across a wedge, so overlaid series
 * each keep their own strip.
 */
export function wedgeLane(wedge: Wedge, lane: number, lanes: number): number {
  return wedge.start + ((lane + 0.5) * (wedge.end - wedge.start)) / lanes;
}

/**
 * Where a value box sits on a slice: just inside its tip, or clear of the
 * hole when the slice is short. `undefined` when the wedge there has less
 * than `minArc` of arc to hold the box.
 */
export function valueBoxSpot(
  wedge: Wedge,
  angle: number,
  tip: number,
  inner: number,
  height: number,
  minArc = 0,
): { readonly angle: number; readonly radius: number } | undefined {
  const radius = Math.max(tip - (height - 2), inner + height);
  return (wedge.end - wedge.start) * radius < minArc ? undefined : { angle, radius };
}
