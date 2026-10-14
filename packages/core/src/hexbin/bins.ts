import type { PitchDimensions } from "../dimensions/types.js";
import { resolve } from "../scene/resolve.js";
import { displayUnitScale, fromExtentFrame, toExtentFrame } from "../transform/canonical.js";
import type { HexbinLayer } from "../scene/types.js";

const DEFAULT_BINS_X = 20;

/** √3, the ratio between a pointy-top hexagon's height and its width. */
const SQRT3 = Math.sqrt(3);

/**
 * One hexagonal cell: its centre in provider coordinates plus the
 * statistic accumulated inside it. `radius` is the circumradius (centre to
 * vertex) in display units, which are the provider's own units except on a
 * percentage grid, where they are metres (see `displayUnitScale`). Pass it
 * to `hexCorners` with the same `dimensions` to get the six corners without
 * re-deriving the tiling.
 */
export interface HexBin {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly value: number;
}

/**
 * The six vertices of a pointy-top hexagon, in provider coordinates,
 * starting at the top vertex and going clockwise. Shared by the painter
 * and the tests so "what shape is a hex bin" has one definition.
 *
 * `radius` is in display units. With `dimensions` given, each corner's
 * offset is converted back to provider units per axis, so on a percentage
 * grid (where one x unit and one y unit cover different amounts of grass)
 * the hexagon is regular on screen rather than in grid units (#99).
 * Without it the axes are taken to share a unit.
 */
export function hexCorners(
  centerX: number,
  centerY: number,
  radius: number,
  dimensions?: PitchDimensions,
): Array<readonly [number, number]> {
  const [unitScaleX, unitScaleY] = dimensions ? displayUnitScale(dimensions) : [1, 1];
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return [
      centerX + (radius * Math.cos(angle)) / unitScaleX,
      centerY + (radius * Math.sin(angle)) / unitScaleY,
    ] as const;
  });
}

/**
 * Buckets points into a hexagonal lattice over the pitch — mplsoccer's
 * `hexbin`. Hexagons pack more evenly than squares (every neighbour is
 * equidistant), so dense event data reads with less of the axis-aligned
 * banding a rectangular `Heatmap` shows.
 *
 * Hand-rolled rather than taking `d3-hexbin`, to preserve
 * @pitchkit/core's zero-runtime-dependency invariant — the same call
 * `color/scale.ts` documents. The lattice itself is d3-hexbin's: two
 * interleaved rectangular grids (odd rows offset by half a column), where
 * a point's bin is the nearer of the two candidate centres. Bins with no
 * points are omitted rather than returned with `value: 0`; unlike a
 * rectangular grid, an empty hex has no cell to shade in a tiling that
 * never covers the pitch exactly at its edges anyway.
 *
 * Cell size is driven by `binsX` (hexagon columns across the pitch
 * length), mirroring `Heatmap`'s `binsX`, rather than an absolute radius —
 * so the same layer looks right on a 120x80 StatsBomb pitch and a 100x100
 * Opta one.
 *
 * The lattice is built in display units, not provider units: the pitch
 * transform scales metres uniformly, but on a percentage grid (Opta,
 * Wyscout) one x unit is 1.05 m and one y unit only 0.68 m. A lattice that
 * is regular in grid units would be drawn squashed and would bin points
 * differently from the same pitch in metres (#99). Everywhere else
 * `displayUnitScale` is `[1, 1]` and this changes nothing.
 */
export function computeHexBins<T>(layer: HexbinLayer<T>, dimensions: PitchDimensions): HexBin[] {
  const binsX = layer.binsX ?? DEFAULT_BINS_X;
  const [unitScaleX, unitScaleY] = displayUnitScale(dimensions);
  // Pointy-top hexagons tile with horizontal spacing √3·r and vertical
  // spacing 1.5·r; solving the horizontal one for `binsX` columns gives r.
  const radius = (dimensions.length * unitScaleX) / (binsX * SQRT3);
  const dx = radius * SQRT3;
  const dy = radius * 1.5;

  const totals = new Map<string, number>();

  layer.data.forEach((d, i) => {
    // Into the extent frame first: identity for corner-origin providers, but
    // without it a center-origin grid's negative half fails the bounds check
    // below and is silently dropped.
    const [x, y] = toExtentFrame(dimensions, [resolve(layer.x, d, i), resolve(layer.y, d, i)]);
    if (x < 0 || x > dimensions.length || y < 0 || y > dimensions.width) return;

    const amount = layer.weight !== undefined ? resolve(layer.weight, d, i) : 1;
    const [col, row] = nearestHex(x * unitScaleX, y * unitScaleY, dx, dy);
    const key = `${col},${row}`;
    totals.set(key, (totals.get(key) ?? 0) + amount);
  });

  const bins: HexBin[] = [];
  for (const [key, value] of totals) {
    const [col, row] = key.split(",").map(Number) as [number, number];
    // Back out of display units and the extent frame, to provider-native
    // coordinates for `transform.toPixel`.
    const [x, y] = fromExtentFrame(dimensions, [
      ((col + rowOffset(row)) * dx) / unitScaleX,
      (row * dy) / unitScaleY,
    ]);
    bins.push({ x, y, radius, value });
  }
  return bins;
}

/**
 * Finds the lattice cell whose centre is nearest to `(x, y)`. Rounding
 * each axis independently can miss the true nearest centre (the rows
 * interleave), so both candidate rows are evaluated and the closer centre
 * wins. Only two rows need checking: any row further away is at least as
 * far vertically and, sharing its parity with one of the two, no closer
 * horizontally.
 */
function nearestHex(x: number, y: number, dx: number, dy: number): [number, number] {
  const approxRow = y / dy;
  let best: [number, number] = [0, 0];
  let bestDistance = Infinity;

  for (const row of [Math.floor(approxRow), Math.ceil(approxRow)]) {
    const offset = rowOffset(row);
    const col = Math.round(x / dx - offset);
    const distance = (x - (col + offset) * dx) ** 2 + (y - row * dy) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = [col, row];
    }
  }
  return best;
}

/** Odd rows sit half a column to the right — that offset is what makes the lattice hexagonal. */
function rowOffset(row: number): number {
  return row % 2 === 0 ? 0 : 0.5;
}
