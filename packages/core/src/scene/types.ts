import type { PitchDimensions } from "../dimensions/types.js";
import type { Viewport } from "../transform/types.js";

/**
 * A visual property of a layer: either a static value applied to every
 * datum, or a function of the datum (and its index) computing it per-mark.
 * Mirrors the PRD's `x={d => d.location[0]}` ergonomics (§8.7) — every
 * visual prop accepts either form via the same prop name.
 */
export type Accessor<T, V> = V | ((d: T, i: number) => V);

/**
 * Scatter marks: one circle per datum, positioned in the scene's own
 * provider coordinates (not pre-converted — that's a consumer concern via
 * `createStandardizeTransform`).
 */
export interface ScatterLayer<T = unknown> {
  readonly type: "scatter";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly r?: Accessor<T, number>;
  readonly fill?: Accessor<T, string>;
  readonly fillOpacity?: Accessor<T, number>;
  readonly stroke?: Accessor<T, string>;
  readonly strokeWidth?: Accessor<T, number>;
}

/** Text labels: one `<text>` per datum, offset from its anchor point in pixels. */
export interface AnnotateLayer<T = unknown> {
  readonly type: "annotate";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly label: Accessor<T, string>;
  readonly offsetX?: Accessor<T, number>;
  readonly offsetY?: Accessor<T, number>;
  /** Applied as the `<text>` element's `class` attribute; styling escape hatch (PRD §8.7). */
  readonly className?: string;
}

/**
 * Directional marks: one straight line + arrowhead per datum, from
 * `(x, y)` to `(x2, y2)` in provider coordinates (e.g. pass direction).
 */
export interface ArrowsLayer<T = unknown> {
  readonly type: "arrows";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly x2: Accessor<T, number>;
  readonly y2: Accessor<T, number>;
  readonly stroke?: Accessor<T, string>;
  readonly strokeWidth?: Accessor<T, number>;
  readonly strokeOpacity?: Accessor<T, number>;
  /** Arrowhead size in pixels. */
  readonly headSize?: Accessor<T, number>;
}

/**
 * Tapered "comet" lines: one filled shape per datum, narrow at
 * `(x, y)` and wide at `(x2, y2)`, optionally fading in via a gradient.
 * SVG can't vary a `<line>`'s stroke-width along its length, so this is
 * painted as a filled quadrilateral instead.
 */
export interface CometLayer<T = unknown> {
  readonly type: "comet";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly x2: Accessor<T, number>;
  readonly y2: Accessor<T, number>;
  readonly color?: Accessor<T, string>;
  readonly startWidth?: Accessor<T, number>;
  readonly endWidth?: Accessor<T, number>;
  /** Fades opacity from 0 at the start to 1 at the end via a linear gradient. */
  readonly gradient?: boolean;
}

/**
 * Binned aggregate marks: divides the pitch into a `binsX` x `binsY` grid
 * and colors each cell by point count (default) or, if `weight` is given,
 * the sum of that weight per cell (e.g. total xG per zone). Rendered via
 * the Canvas path (PRD §8.1) — SVG's per-element DOM cost doesn't scale to
 * dense raster data the way a handful of `fillRect` calls does.
 */
export interface HeatmapLayer<T = unknown> {
  readonly type: "heatmap";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  /** Omitted = count of points per bin; provided = sum of this per bin. */
  readonly weight?: Accessor<T, number>;
  readonly binsX?: number;
  readonly binsY?: number;
  /** Color at the lowest bin value in the scene's data. */
  readonly colorMin?: string;
  /** Color at the highest bin value in the scene's data. */
  readonly colorMax?: string;
}

/**
 * The discriminated union of all layer kinds a Scene can draw. Milestone 1
 * adds Scatter/Annotate, then Arrows/Comet, then Heatmap here. Heatmap is
 * the one variant the SVG renderer deliberately skips — see
 * `render/canvas/render-heatmap.ts`, which is the only renderer that reads
 * it, using the same Scene/PixelTransform as everything else.
 *
 * Erased to `any` rather than `unknown` here deliberately: each accessor
 * function's parameter type makes every `*Layer<T>` invariant in `T` under
 * `strictFunctionTypes`, so a concrete `ScatterLayer<MyDatum>` could never
 * widen to `ScatterLayer<unknown>` for storage in this heterogeneous array.
 * Individual layer constructors (and the painters, called generically
 * per-layer) stay fully typed in `T`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Layer =
  ScatterLayer<any> | AnnotateLayer<any> | ArrowsLayer<any> | CometLayer<any> | HeatmapLayer<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** How many vertical grass stripes to paint; `true` picks a sensible default. */
export type PitchStripes = boolean | number;

/** Visual treatment of the goal markings. */
export type GoalType = "line" | "box";

/**
 * Non-coordinate visual treatment of the pitch surface (PRD §8.7's
 * "grass/stripes, line colour/width/alpha, goal types" styling knobs).
 * Deliberately separate from `PitchDimensions` (a fact about the provider's
 * coordinate system) and from CSS variables (the colours themselves) — this
 * only toggles which shapes get painted.
 */
export interface PitchAppearance {
  readonly stripes?: PitchStripes;
  readonly goalType?: GoalType;
}

/**
 * A Scene is the renderer-independent description of one pitch render:
 * which provider coordinate system, how it's displayed, and what's drawn
 * on it (PRD §8.3). Pure data — layers don't own DOM.
 */
export interface Scene {
  readonly dimensions: PitchDimensions;
  readonly viewport: Viewport;
  readonly appearance?: PitchAppearance;
  readonly layers: readonly Layer[];
}
