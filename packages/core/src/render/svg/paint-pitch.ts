import type { Arc, Circle, Line, PitchGeometry, Rect } from "../../scene/geometry.js";
import type { PixelTransform, Point } from "../../transform/types.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgEl<K extends keyof SVGElementTagNameMap>(
  doc: Document,
  tag: K,
): SVGElementTagNameMap[K] {
  return doc.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
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
  el.setAttribute("data-pitchkit-part", part);
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
  el.setAttribute("data-pitchkit-part", part);
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
  el.setAttribute("data-pitchkit-part", part);
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
  el.setAttribute("data-pitchkit-part", part);
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
  el.setAttribute("data-pitchkit-part", part);
  parent.appendChild(el);
}

/** Walks a PitchGeometry, transforms each shape via `transform`, and appends SVG elements. */
export function paintPitchGeometry(
  svg: SVGSVGElement,
  geometry: PitchGeometry,
  transform: PixelTransform,
  doc: Document,
): void {
  const group = createSvgEl(doc, "g");
  group.setAttribute("data-pitchkit-layer", "pitch");
  svg.appendChild(group);

  appendRect(group, doc, geometry.outline, transform, "outline");
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
  for (const line of geometry.goals) {
    appendLine(group, doc, line, transform, "goal");
  }
}
