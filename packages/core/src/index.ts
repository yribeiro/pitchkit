export type {
  PitchTypeId,
  PitchOrigin,
  YDirection,
  PitchMarkings,
  PitchDimensions,
} from "./dimensions/types.js";
export { getPitchDimensions, PITCH_DIMENSIONS } from "./dimensions/registry.js";
export type { PitchDimensionOverrides } from "./dimensions/registry.js";

export type {
  Point,
  Orientation,
  CropWindow,
  ViewportPadding,
  Viewport,
  PixelTransform,
} from "./transform/types.js";
export { createPixelTransform } from "./transform/pixel-transform.js";
export { displayUnitScale } from "./transform/canonical.js";
export { createStandardizeTransform } from "./transform/standardize.js";
export { cropForHalf } from "./transform/half.js";

export type {
  Layer,
  Scene,
  PitchAppearance,
  PitchStripes,
  GoalType,
  Accessor,
  ScatterLayer,
  AnnotateLayer,
  ArrowsLayer,
  CometLayer,
  HeatmapLayer,
  PositionalLayout,
  PositionalHeatmapLayer,
  HexbinLayer,
  KdeLayer,
  PolygonLayer,
  ConvexHullLayer,
  VoronoiLayer,
  GoalAngleLayer,
  FlowLayer,
} from "./scene/types.js";
export type { Rect, Line, Circle, Arc, PitchGeometry } from "./scene/geometry.js";
export { computePitchGeometry } from "./scene/geometry.js";
export { resolve } from "./scene/resolve.js";
export {
  resolveStripeCount,
  computeStripeBands,
  goalBoxDepth,
  computeGoalBox,
} from "./scene/appearance.js";

export type { HeatmapBin } from "./heatmap/bins.js";
export { computeHeatmapBins } from "./heatmap/bins.js";
export type { PositionalZone, PositionalBin } from "./heatmap/positional.js";
export { computePositionalZones, computePositionalBins } from "./heatmap/positional.js";
export type { HexBin } from "./hexbin/bins.js";
export { computeHexBins, hexCorners } from "./hexbin/bins.js";
export type { KdeGrid } from "./kde/density.js";
export { computeKdeGrid, silvermanBandwidth } from "./kde/density.js";
export { createColorScale } from "./color/scale.js";

export type { Renderer } from "./render/renderer.js";
// renderSceneToSVGElement/svgRenderer are internal building blocks kept for
// the packages/core/examples/index.html dev harness, not a supported public
// consumption path — see the @internal notes in render/svg/render-scene.ts
// (resolves issue #6). Use @pitchkit/react for actual rendering.
export { renderSceneToSVGElement, svgRenderer } from "./render/svg/render-scene.js";
export type { RenderHeatmapOptions } from "./render/canvas/render-heatmap.js";
export {
  renderDensityLayersToCanvas,
  renderHeatmapLayersToCanvas,
  canvasRenderer,
} from "./render/canvas/render-heatmap.js";
export { arcSweepFlag, arcPathData } from "./render/arc-sweep.js";
export { computeArrowHeadCorners, ARROW_HEAD_HALF_ANGLE } from "./render/arrow-geometry.js";
export { computeCometQuad } from "./render/comet-geometry.js";

export { computePolygonCentroid } from "./geometry/polygon.js";
export { computeConvexHull } from "./geometry/convex-hull.js";
export { clipPolygonByHalfPlane, computeVoronoiCells } from "./geometry/voronoi.js";
export { computeGoalAngle, selectGoal } from "./geometry/goal-angle.js";
export type { FlowVector, FlowBin } from "./geometry/flow.js";
export { computeFlowBins } from "./geometry/flow.js";

export type { ChartPadding, ChartFrame, LinearScale } from "./chart/types.js";
export { createLinearScale } from "./chart/linear-scale.js";
export { niceTicks, matchMinuteTicks } from "./chart/ticks.js";
export { computeChartFrame } from "./chart/frame.js";

export type { RaceEvent, RacePoint, RaceSeriesData } from "./race/cumulative.js";
export { computeCumulativeSeries, valueAtTime, resolveEndTime } from "./race/cumulative.js";
export { stepPath, stepAreaPath } from "./race/step-path.js";

export type { MomentumSample, MomentumBar, MomentumRange } from "./momentum/bars.js";
export {
  computeMomentumBars,
  clipMomentumBars,
  barAtMinute,
  medianBarWidth,
  unevenBarWidths,
} from "./momentum/bars.js";
export type { MomentumPanel } from "./momentum/layout.js";
export {
  nominalPeriodRange,
  resolvePeriodRange,
  layoutMomentumPanels,
  momentumExtent,
  minuteToX,
} from "./momentum/layout.js";
export { stackOffsets } from "./momentum/stack.js";

export { pitchTokens } from "./theme/tokens.js";
export { partStyle } from "./theme/part-style.js";
