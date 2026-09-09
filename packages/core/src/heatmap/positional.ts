import type { PitchDimensions } from "../dimensions/types.js";
import type { Rect } from "../scene/geometry.js";
import { resolve } from "../scene/resolve.js";
import type { PositionalHeatmapLayer, PositionalLayout } from "../scene/types.js";

/**
 * One Juego de Posición zone: a rectangle in provider coordinates plus
 * mplsoccer's name for it, so a consumer can label or key off a zone
 * without re-deriving the layout.
 */
export interface PositionalZone extends Rect {
  readonly name: string;
}

/** A zone plus the statistic accumulated inside it. */
export interface PositionalBin extends PositionalZone {
  readonly value: number;
}

/**
 * The six x-edges (7 boundaries) of the Juego de Posición grid, ported
 * verbatim from mplsoccer's `juego_de_posicion()`: the two penalty-area
 * lines, the halfway line, and the midpoints between each penalty area
 * line and halfway. Deliberately *not* even sixths — the columns are
 * derived from the pitch markings, which is the whole point of a
 * positional heatmap versus the uniform grid `computeHeatmapBins` uses.
 */
function positionalX(dimensions: PitchDimensions): number[] {
  const { length, markings } = dimensions;
  const penaltyAreaLeft = markings.penaltyAreaLength;
  const penaltyAreaRight = length - markings.penaltyAreaLength;
  const center = length / 2;
  return [
    0,
    penaltyAreaLeft,
    penaltyAreaLeft + (center - penaltyAreaLeft) / 2,
    center,
    center + (penaltyAreaRight - center) / 2,
    penaltyAreaRight,
    length,
  ];
}

/**
 * The five lateral bands (6 boundaries): the touchlines, the penalty-area
 * edges and the six-yard-box edges. mplsoccer builds this by taking its
 * sorted y-markings and dropping the goalposts; the sorted-and-deduped
 * form below is the same set of values, expressed against our
 * `PitchMarkings` (widths measured about the pitch's centre line) rather
 * than mplsoccer's absolute top/bottom constants.
 */
function positionalY(dimensions: PitchDimensions): number[] {
  const { width, markings } = dimensions;
  const center = width / 2;
  return [
    0,
    center - markings.penaltyAreaWidth / 2,
    center - markings.sixYardWidth / 2,
    center + markings.sixYardWidth / 2,
    center + markings.penaltyAreaWidth / 2,
    width,
  ];
}

function rect(x0: number, x1: number, y0: number, y1: number, name: string): PositionalZone {
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, name };
}

/**
 * Builds the Juego de Posición ("positional play") zones that mplsoccer's
 * `bin_statistic_positional` bins into — 20 zones for the default `"full"`
 * layout, 5 for `"horizontal"`, 6 for `"vertical"`. Ported from
 * mplsoccer's `positional_zones()` so analysts get the layout they already
 * know rather than an invented one.
 *
 * The `"full"` layout is not a grid: the two flank bands are split into
 * all six columns, the three central bands only span penalty-area line to
 * penalty-area line, and each penalty area is a single wide zone covering
 * those three central bands. The zones still tile the pitch exactly.
 *
 * Names follow mplsoccer (`top-1`, `middle-2-1`, `penalty-left`, ...), and
 * "top" means the top of the pitch *as displayed*, so which band earns
 * that name depends on the provider's `yDirection` — matching mplsoccer's
 * own `invert_y` branch.
 */
export function computePositionalZones(
  dimensions: PitchDimensions,
  layout: PositionalLayout = "full",
): PositionalZone[] {
  const px = positionalX(dimensions);
  const py = positionalY(dimensions);
  const edge = (values: number[], i: number): number => values[i] as number;

  const bands: Array<readonly [number, number]> = [];
  for (let i = 0; i < 5; i += 1) bands.push([edge(py, i), edge(py, i + 1)]);
  // Order the bands from the top of the pitch as displayed: with y-down
  // that's already the array order, with y-up it's the reverse.
  const ordered = dimensions.yDirection === "down" ? bands : [...bands].reverse();

  if (layout === "horizontal") {
    return ordered.map(([y0, y1], row) =>
      rect(edge(px, 0), edge(px, 6), Math.min(y0, y1), Math.max(y0, y1), `horizontal-${row + 1}`),
    );
  }

  if (layout === "vertical") {
    return Array.from({ length: 6 }, (_, col) =>
      rect(edge(px, col), edge(px, col + 1), edge(py, 0), edge(py, 5), `vertical-${col + 1}`),
    );
  }

  const bandTop = ordered[0] as readonly [number, number];
  const bandBottom = ordered[4] as readonly [number, number];
  const middle = ordered.slice(1, 4);

  const zones: PositionalZone[] = [];
  for (const [band, name] of [
    [bandTop, "top"],
    [bandBottom, "bottom"],
  ] as const) {
    const y0 = Math.min(band[0], band[1]);
    const y1 = Math.max(band[0], band[1]);
    for (let col = 0; col < 6; col += 1) {
      zones.push(rect(edge(px, col), edge(px, col + 1), y0, y1, `${name}-${col + 1}`));
    }
  }
  middle.forEach((band, row) => {
    const y0 = Math.min(band[0], band[1]);
    const y1 = Math.max(band[0], band[1]);
    zones.push(rect(edge(px, 1), edge(px, 3), y0, y1, `middle-${row + 1}-1`));
    zones.push(rect(edge(px, 3), edge(px, 5), y0, y1, `middle-${row + 1}-2`));
  });
  zones.push(rect(edge(px, 0), edge(px, 1), edge(py, 1), edge(py, 4), "penalty-left"));
  zones.push(rect(edge(px, 5), edge(px, 6), edge(py, 1), edge(py, 4), "penalty-right"));
  return zones;
}

/**
 * Half-open containment (`[lo, hi)`) so a point on a shared internal edge
 * lands in exactly one zone, with the far pitch edge closed so a point
 * sitting exactly on the touchline/byline isn't dropped — the same
 * convention `computeHeatmapBins` gets for free from `Math.floor` plus its
 * last-bin clamp.
 */
function within(value: number, lo: number, hi: number, max: number): boolean {
  return value >= lo && (value < hi || (hi === max && value === max));
}

/**
 * Buckets each datum into the Juego de Posición zone that contains it,
 * by point count or by summed `weight` — mplsoccer's
 * `bin_statistic_positional`.
 *
 * Zones tile the pitch without overlapping, so the first containing zone
 * wins; points outside the pitch extent are ignored (same rule as
 * `computeHeatmapBins`) and points exactly on the far edge land in the
 * last zone that touches them rather than being dropped.
 */
export function computePositionalBins<T>(
  layer: PositionalHeatmapLayer<T>,
  dimensions: PitchDimensions,
): PositionalBin[] {
  const zones = computePositionalZones(dimensions, layer.layout ?? "full");
  const values: number[] = new Array(zones.length).fill(0);

  layer.data.forEach((d, i) => {
    const x = resolve(layer.x, d, i);
    const y = resolve(layer.y, d, i);
    if (x < 0 || x > dimensions.length || y < 0 || y > dimensions.width) return;

    const index = zones.findIndex(
      (zone) =>
        within(x, zone.x, zone.x + zone.width, dimensions.length) &&
        within(y, zone.y, zone.y + zone.height, dimensions.width),
    );
    if (index === -1) return;

    const amount = layer.weight !== undefined ? resolve(layer.weight, d, i) : 1;
    values[index] = (values[index] ?? 0) + amount;
  });

  return zones.map((zone, i) => ({ ...zone, value: values[i] ?? 0 }));
}
