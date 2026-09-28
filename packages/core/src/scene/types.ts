import type { PitchDimensions } from "../dimensions/types.js";
import type { Viewport } from "../transform/types.js";

/**
 * A visual property of a layer: either a static value applied to every
 * datum, or a function of the datum (and its index) computing it per-mark.
 * The `x={d => d.location[0]}` accessor ergonomics (docs/architecture.md#theming-and-styling) — every
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
  /** Applied as every `<circle>`'s `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
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
  /** Applied as the `<text>` element's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
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
  /** Applied as both the shaft's and arrowhead's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
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
  /** Applied as every `<polygon>`'s `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
}

/**
 * Binned aggregate marks: divides the pitch into a `binsX` x `binsY` grid
 * and colors each cell by point count (default) or, if `weight` is given,
 * the sum of that weight per cell (e.g. total xG per zone). Rendered via
 * the Canvas path (docs/architecture.md#rendering-svg-and-canvas) — SVG's per-element DOM cost doesn't scale to
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
 * Which Juego de Posición layout to bin into: the full 20-zone grid, the
 * five lateral bands only, or the six vertical columns only. Mirrors
 * mplsoccer's `positional` argument.
 */
export type PositionalLayout = "full" | "horizontal" | "vertical";

/**
 * Like `HeatmapLayer`, but binned into Juego de Posición *zones* derived
 * from the pitch markings (penalty areas, six-yard boxes, halfway line)
 * rather than a uniform `binsX` x `binsY` grid — mplsoccer's
 * `bin_statistic_positional` + `heatmap_positional`. Also Canvas-rendered.
 */
export interface PositionalHeatmapLayer<T = unknown> {
  readonly type: "positionalHeatmap";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  /** Omitted = count of points per zone; provided = sum of this per zone. */
  readonly weight?: Accessor<T, number>;
  /** Defaults to `"full"`, the 20-zone layout. */
  readonly layout?: PositionalLayout;
  readonly colorMin?: string;
  readonly colorMax?: string;
  /** Stroke colour for zone outlines; omitted = no outlines. */
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

/**
 * Hexagonally-binned density (mplsoccer's `hexbin`): the same aggregation
 * as `HeatmapLayer` over a hexagonal lattice, which packs more evenly than
 * a square grid and so shows less axis-aligned banding. Canvas-rendered.
 */
export interface HexbinLayer<T = unknown> {
  readonly type: "hexbin";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  /** Omitted = count of points per hexagon; provided = sum of this per hexagon. */
  readonly weight?: Accessor<T, number>;
  /** Hexagon columns across the pitch length; the cell size follows from it. */
  readonly binsX?: number;
  readonly colorMin?: string;
  readonly colorMax?: string;
  /** Stroke colour for hexagon outlines; omitted = no outlines. */
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

/**
 * A smooth 2D kernel density estimate (mplsoccer's `kdeplot`), evaluated
 * on a grid and painted as a continuous surface. Unlike the binned
 * layers, low-density areas fade out rather than being filled with
 * `colorMin`, so the pitch stays visible underneath. Canvas-rendered.
 */
export interface KdeLayer<T = unknown> {
  readonly type: "kde";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  /** Omitted = every point counts equally; provided = each point's contribution is scaled by this. */
  readonly weight?: Accessor<T, number>;
  /** Grid cells per axis the estimate is sampled on; higher = smoother, slower. */
  readonly resolution?: number;
  /** Kernel bandwidth in provider units; omitted = Silverman's rule of thumb per axis. */
  readonly bandwidth?: number;
  readonly colorMin?: string;
  readonly colorMax?: string;
  /** Opacity at the densest cell; density fades linearly to fully transparent at zero. */
  readonly maxOpacity?: number;
}

/**
 * The discriminated union of all layer kinds a Scene can draw. Milestone 1
 * adds Scatter/Annotate, then Arrows/Comet, then Heatmap here; Milestone 2
 * adds the remaining density layers (positional heatmap, hexbin, KDE).
 * Those four density variants are the ones the SVG renderer deliberately
 * skips — see `render/canvas/render-heatmap.ts`, the only renderer that
 * reads them, using the same Scene/PixelTransform as everything else.
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
  | ScatterLayer<any>
  | AnnotateLayer<any>
  | ArrowsLayer<any>
  | CometLayer<any>
  | HeatmapLayer<any>
  | PositionalHeatmapLayer<any>
  | HexbinLayer<any>
  | KdeLayer<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Geometric overlay layers (issue #20): flow, polygon, convex hull, Voronoi,
 * goal angle. These follow the same shape convention as every layer above
 * (`data`, accessor props, optional `className`) but are **not** members of
 * the `Layer` union below — per issue #6's resolution, new marks ship
 * React-only with no core SVG/Canvas painter, so there's no renderer here
 * that would ever switch on their `type`. They're exported standalone for
 * `@pitchkit/react`'s components to build their prop types from
 * (`Omit<PolygonLayer<T>, "type">`, etc.), the same way `Comet`/`Annotate`
 * do for their own (painter-backed) layer types.
 */

/** An arbitrary closed shape: one polygon per datum, from a list of vertices in provider coordinates. */
export interface PolygonLayer<T = unknown> {
  readonly type: "polygon";
  readonly data: readonly T[];
  readonly points: Accessor<T, ReadonlyArray<readonly [number, number]>>;
  readonly fill?: Accessor<T, string>;
  readonly fillOpacity?: Accessor<T, number>;
  readonly stroke?: Accessor<T, string>;
  readonly strokeWidth?: Accessor<T, number>;
  /** Applied as every polygon's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
}

/** The convex hull of a point set (e.g. a player's touches), rendered as a single filled polygon. */
export interface ConvexHullLayer<T = unknown> {
  readonly type: "convexHull";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly fill?: string;
  readonly fillOpacity?: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  /** Applied as the resulting polygon's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
}

/** Voronoi tessellation over a point set (e.g. player positions), clipped to the pitch outline. */
export interface VoronoiLayer<T = unknown> {
  readonly type: "voronoi";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly fill?: Accessor<T, string>;
  readonly fillOpacity?: Accessor<T, number>;
  readonly stroke?: Accessor<T, string>;
  readonly strokeWidth?: Accessor<T, number>;
  /** Applied as every cell's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
}

/** The angle subtended at each point by a goal mouth, rendered as a wedge from the point to both posts. */
export interface GoalAngleLayer<T = unknown> {
  readonly type: "goalAngle";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  /** Which goal to measure against; `"nearest"` (the default) picks by distance. */
  readonly goal?: Accessor<T, "left" | "right" | "nearest">;
  readonly fill?: Accessor<T, string>;
  readonly fillOpacity?: Accessor<T, number>;
  readonly stroke?: Accessor<T, string>;
  readonly strokeWidth?: Accessor<T, number>;
  /** Applied as every wedge's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
}

/**
 * Aggregated movement/pass data, binned by start location into a grid and
 * rendered as one arrow per occupied bin, sized/colored by that bin's
 * volume (mplsoccer's `flow`).
 */
export interface FlowLayer<T = unknown> {
  readonly type: "flow";
  readonly data: readonly T[];
  readonly x: Accessor<T, number>;
  readonly y: Accessor<T, number>;
  readonly x2: Accessor<T, number>;
  readonly y2: Accessor<T, number>;
  readonly binsX?: number;
  readonly binsY?: number;
  /** Color at the lowest bin count in the layer's data. */
  readonly colorMin?: string;
  /** Color at the highest bin count in the layer's data. */
  readonly colorMax?: string;
  /** Arrow stroke width at the lowest bin count. */
  readonly strokeWidthMin?: number;
  /** Arrow stroke width at the highest bin count. */
  readonly strokeWidthMax?: number;
  /** Applied as every arrow's `class` attribute; styling escape hatch (docs/architecture.md#theming-and-styling). */
  readonly className?: string;
}

/** How many vertical grass stripes to paint; `true` picks a sensible default. */
export type PitchStripes = boolean | number;

/** Visual treatment of the goal markings. */
export type GoalType = "line" | "box";

/**
 * Non-coordinate visual treatment of the pitch surface (the stripes and goal-type
 * styling knobs; see docs/architecture.md#theming-and-styling).
 * Deliberately separate from `PitchDimensions` (a fact about the provider's
 * coordinate system) and from CSS variables (the colours themselves) — this
 * only toggles which shapes get painted.
 */
export interface PitchAppearance {
  readonly stripes?: PitchStripes;
  readonly goalType?: GoalType;
  /**
   * Paint the pitch markings *above* the layers rather than below them —
   * mplsoccer's `line_zorder`. Off by default, so SVG marks (a scatter
   * dot on the penalty spot, an arrow crossing the halfway line) sit on
   * top of the lines, which is what you want for discrete marks.
   *
   * Turn it on for the density layers: an opaque `heatmap`/
   * `positionalHeatmap`/`hexbin`/`kde` fill covers the whole pitch and
   * would otherwise hide the markings underneath it — the same masking
   * problem opaque stripes caused for the outline in issue #14, one
   * level up.
   *
   * Only the *markings* move; the grass surface and stripes always stay
   * at the bottom.
   */
  readonly linesOnTop?: boolean;
}

/**
 * A Scene is the renderer-independent description of one pitch render:
 * which provider coordinate system, how it's displayed, and what's drawn
 * on it (docs/architecture.md#scene-and-layers). Pure data — layers don't own DOM.
 */
export interface Scene {
  readonly dimensions: PitchDimensions;
  readonly viewport: Viewport;
  readonly appearance?: PitchAppearance;
  readonly layers: readonly Layer[];
}
