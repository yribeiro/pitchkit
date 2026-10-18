import type { PitchDimensions } from "../../dimensions/types.js";
import {
  computeGoalBox,
  computeStripeBands,
  pitchGoalBoxDepth,
  resolveStripeCount,
} from "../../scene/appearance.js";
import type { Arc, Circle, Line, PitchGeometry, Rect } from "../../scene/geometry.js";
import type { GoalType, PitchAppearance } from "../../scene/types.js";
import type { PixelTransform, Point } from "../../transform/types.js";
import { partStyle } from "../../theme/part-style.js";
import { arcPathData, arcSweepFlag } from "../arc-sweep.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgEl<K extends keyof SVGElementTagNameMap>(
  doc: Document,
  tag: K,
): SVGElementTagNameMap[K] {
  return doc.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
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
  el.setAttribute("d", arcPathData(radius, start, end, sweep));
  applyPartStyle(el, part);
  parent.appendChild(el);
}

/** Paints alternating vertical grass bands across the outline, under the markings. */
function appendStripes(
  parent: SVGGElement,
  doc: Document,
  outline: Rect,
  transform: PixelTransform,
  stripeCount: number,
): void {
  for (const band of computeStripeBands(outline, stripeCount)) {
    appendRect(parent, doc, band, transform, "stripe");
  }
}

/**
 * Paints a small goal-frame box just outside the pitch boundary, behind the
 * goal line.
 */
function appendGoalBox(
  parent: SVGGElement,
  doc: Document,
  goal: Line,
  transform: PixelTransform,
  isLeft: boolean,
  depth: number,
): void {
  appendRect(parent, doc, computeGoalBox(goal, isLeft, depth), transform, "goal-box");
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

  appendRect(group, doc, geometry.outline, transform, "surface");
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

  const depth = pitchGoalBoxDepth(dimensions);
  appendGoals(group, doc, geometry.goals, transform, appearance.goalType ?? "line", depth);

  // The stroke-only border paints last: SVG strokes are centered on the path,
  // so the inner half of an earlier-painted border would be masked by opaque
  // stripes (issue #14).
  appendRect(group, doc, geometry.outline, transform, "outline");
}
