import type { Point } from "../transform/types.js";

/**
 * An SVG path through `points` as a step function, holding each value
 * until the next point's x and then jumping.
 *
 * This is what d3 calls `curveStepAfter`, Recharts `stepAfter` and
 * Observable Plot `step-after`, and it is the only correct interpolation
 * for a running total: anything that slopes between points draws xG
 * accruing during minutes when no shot was taken. There is deliberately no
 * `curve` option for that reason.
 *
 * Returns geometry as a `d` string, the same contract as `arcPathData` —
 * core owns the maths, `@pitchkit/react` owns the element.
 *
 * Zero-length segments are skipped, so two events in the same minute emit
 * one `V` rather than an `H0 V`, and the full-time anchor (which shares the
 * last real point's y) contributes only its `H`.
 */
export function stepPath(points: readonly Point[]): string {
  const first = points[0];
  if (first === undefined) return "";

  const commands: string[] = [`M${round(first[0])} ${round(first[1])}`];
  let [currentX, currentY] = first;

  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i] as Point;

    if (round(x) !== round(currentX)) {
      commands.push(`H${round(x)}`);
      currentX = x;
    }
    if (round(y) !== round(currentY)) {
      commands.push(`V${round(y)}`);
      currentY = y;
    }
  }

  return commands.join(" ");
}

/**
 * The same step, closed down to `baselineY` — the optional shading under
 * the line (`appearance.area`).
 *
 * Built from `stepPath` rather than duplicating the step logic, so the
 * area can never disagree with the line it sits under.
 */
export function stepAreaPath(points: readonly Point[], baselineY: number): string {
  const line = stepPath(points);
  if (line === "") return "";

  // `line` is non-empty, so points[0] exists.
  const [firstX] = points[0] as Point;
  return `${line} V${round(baselineY)} H${round(firstX)} Z`;
}

/**
 * Two decimal places: enough for sub-pixel accuracy at any realistic chart
 * size, and it keeps the server-rendered markup from carrying seventeen
 * digits of float noise per command.
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
