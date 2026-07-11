import type { PitchDimensions } from "../../dimensions/types.js";
import type { Arc, Circle, Line, PitchGeometry, Rect } from "../../scene/geometry.js";
import type { GoalType, PitchAppearance, PitchStripes } from "../../scene/types.js";
import type { PixelTransform, Point } from "../../transform/types.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULT_STRIPE_COUNT = 12;

function createSvgEl<K extends keyof SVGElementTagNameMap>(
  doc: Document,
  tag: K,
): SVGElementTagNameMap[K] {
  return doc.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
}

/**
 * Maps a `data-pitchkit-part` to its default presentation as an inline
 * `style` attribute referencing themeable CSS variables with built-in
 * fallbacks (PRD §8.7). Consumers retheme by setting the `--pitch-*`
 * variables — never by overriding these shapes' fill/stroke directly.
 */
function partStyle(part: string): string {
  const lineStroke = "stroke: var(--pitch-lines, rgba(255, 255, 255, 0.8));";
  const lineWidth = "stroke-width: var(--pitch-line-width, 1.5);";

  switch (part) {
    case "outline":
      return `fill: var(--pitch-surface, #1a472a); ${lineStroke} ${lineWidth}`;
    case "stripe":
      return "fill: var(--pitch-stripe, rgba(255, 255, 255, 0.04)); stroke: none;";
    case "center-spot":
    case "penalty-spot":
      return "fill: var(--pitch-lines, rgba(255, 255, 255, 0.8)); stroke: none;";
    default:
      return `fill: none; ${lineStroke} ${lineWidth}`;
  }
}

function applyPartStyle(el: SVGElement, part: string): void {
  el.setAttribute("data-pitchkit-part", part);
  el.setAttribute("style", partStyle(part));
}

function appendRect(
  parent: SVGGElement,
  doc: Document,
  rect: Rect,
  transform: PixelTransform,
  part: string,
): void {
  const cornerA = transform.toPixel([rect.x, rect.y]);
  const cornerB = transform.toPixel([rect.x + rect.width, rect.y + rect.height]);
  const x = Math.min(cornerA[0], cornerB[0]);
  const y = Math.min(cornerA[1], cornerB[1]);

  const el = createSvgEl(doc, "rect");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("width", String(Math.abs(cornerB[0] - cornerA[0])));
  el.setAttribute("height", String(Math.abs(cornerB[1] - cornerA[1])));
  applyPartStyle(el, part);
  parent.appendChild(el);
}

function appendLine(
  parent: SVGGElement,
  doc: Document,
  line: Line,
  transform: PixelTransform,
  part: string,
): void {
  const [x1, y1] = transform.toPixel(line.from);
  const [x2, y2] = transform.toPixel(line.to);

  const el = createSvgEl(doc, "line");
  el.setAttribute("x1", String(x1));
  el.setAttribute("y1", String(y1));
  el.setAttribute("x2", String(x2));
  el.setAttribute("y2", String(y2));
  applyPartStyle(el, part);
  parent.appendChild(el);
}

function appendCircle(
  parent: SVGGElement,
  doc: Document,
  circle: Circle,
  transform: PixelTransform,
  part: string,
): void {
  const [cx, cy] = transform.toPixel(circle.center);

  const el = createSvgEl(doc, "circle");
  el.setAttribute("cx", String(cx));
  el.setAttribute("cy", String(cy));
  el.setAttribute("r", String(circle.radius * transform.scale));
  applyPartStyle(el, part);
  parent.appendChild(el);
}

function appendPointMarker(
  parent: SVGGElement,
  doc: Document,
  point: Point,
  transform: PixelTransform,
  part: string,
): void {
  const [cx, cy] = transform.toPixel(point);

  const el = createSvgEl(doc, "circle");
  el.setAttribute("cx", String(cx));
  el.setAttribute("cy", String(cy));
  el.setAttribute("r", "2");
  applyPartStyle(el, part);
  parent.appendChild(el);
}

function appendArc(
  parent: SVGGElement,
  doc: Document,
  arc: Arc,
  transform: PixelTransform,
  part: string,
): void {
  const center = transform.toPixel(arc.center);
  const start = transform.toPixel(arc.start);
  const end = transform.toPixel(arc.end);
  const radius = arc.radius * transform.scale;
  const sweep = arcSweepFlag(center, start, end);

  const el = createSvgEl(doc, "path");
  el.setAttribute(
    "d",
    `M ${start[0]} ${start[1]} A ${radius} ${radius} 0 0 ${sweep} ${end[0]} ${end[1]}`,
  );
  applyPartStyle(el, part);
  parent.appendChild(el);
}

/**
 * Picks the SVG arc sweep-flag from the already-transformed pixel-space
 * points, rather than assuming a fixed direction. The pixel transform may
 * have flipped or swapped axes (yDirection, orientation), which would
 * otherwise silently mirror the arc onto the wrong side.
 */
function arcSweepFlag(center: Point, start: Point, end: Point): 0 | 1 {
  const startAngle = Math.atan2(start[1] - center[1], start[0] - center[0]);
  const endAngle = Math.atan2(end[1] - center[1], end[0] - center[0]);
  let delta = endAngle - startAngle;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  return delta > 0 ? 1 : 0;
}

function resolveStripeCount(stripes: PitchStripes | undefined): number {
  if (!stripes) return 0;
  if (stripes === true) return DEFAULT_STRIPE_COUNT;
  return Math.max(0, Math.floor(stripes));
}

/** Paints alternating vertical grass bands across the outline, under the markings. */
function appendStripes(
  parent: SVGGElement,
  doc: Document,
  outline: Rect,
  transform: PixelTransform,
  stripeCount: number,
): void {
  if (stripeCount < 2) return;
  const bandWidth = outline.width / stripeCount;

  for (let i = 0; i < stripeCount; i += 2) {
    const band: Rect = {
      x: outline.x + i * bandWidth,
      y: outline.y,
      width: bandWidth,
      height: outline.height,
    };
    appendRect(parent, doc, band, transform, "stripe");
  }
}

/**
 * Paints a small goal-frame box just outside the pitch boundary, behind the
 * goal line. The depth is a visual approximation (scaled off the corner-arc
 * radius, itself a small provider-unit constant) rather than a regulation
 * goal-depth figure, since this is a styling flourish, not a measured mark.
 */
function appendGoalBox(
  parent: SVGGElement,
  doc: Document,
  goal: Line,
  transform: PixelTransform,
  isLeft: boolean,
  depth: number,
): void {
  const lineX = goal.from[0];
  const x = isLeft ? lineX - depth : lineX;
  const y = Math.min(goal.from[1], goal.to[1]);
  const height = Math.abs(goal.to[1] - goal.from[1]);

  appendRect(parent, doc, { x, y, width: depth, height }, transform, "goal-box");
}

function appendGoals(
  parent: SVGGElement,
  doc: Document,
  goals: PitchGeometry["goals"],
  transform: PixelTransform,
  goalType: GoalType,
  goalDepth: number,
): void {
  if (goalType === "box") {
    appendGoalBox(parent, doc, goals[0], transform, true, goalDepth);
    appendGoalBox(parent, doc, goals[1], transform, false, goalDepth);
    return;
  }

  for (const line of goals) {
    appendLine(parent, doc, line, transform, "goal");
  }
}

/** Walks a PitchGeometry, transforms each shape via `transform`, and appends SVG elements. */
export function paintPitchGeometry(
  svg: SVGSVGElement,
  geometry: PitchGeometry,
  transform: PixelTransform,
  doc: Document,
  dimensions: PitchDimensions,
  appearance: PitchAppearance = {},
): void {
  const group = createSvgEl(doc, "g");
  group.setAttribute("data-pitchkit-layer", "pitch");
  svg.appendChild(group);

  appendRect(group, doc, geometry.outline, transform, "outline");
  appendStripes(group, doc, geometry.outline, transform, resolveStripeCount(appearance.stripes));

  appendLine(group, doc, geometry.halfwayLine, transform, "halfway-line");
  appendCircle(group, doc, geometry.centerCircle, transform, "center-circle");
  appendPointMarker(group, doc, geometry.centerSpot, transform, "center-spot");

  for (const rect of geometry.penaltyAreas) {
    appendRect(group, doc, rect, transform, "penalty-area");
  }
  for (const rect of geometry.sixYardBoxes) {
    appendRect(group, doc, rect, transform, "six-yard-box");
  }
  for (const point of geometry.penaltySpots) {
    appendPointMarker(group, doc, point, transform, "penalty-spot");
  }
  for (const arc of geometry.penaltyArcs) {
    appendArc(group, doc, arc, transform, "penalty-arc");
  }
  for (const arc of geometry.cornerArcs) {
    appendArc(group, doc, arc, transform, "corner-arc");
  }

  const goalDepth = dimensions.markings.cornerArcRadius * 3;
  appendGoals(group, doc, geometry.goals, transform, appearance.goalType ?? "line", goalDepth);
}
