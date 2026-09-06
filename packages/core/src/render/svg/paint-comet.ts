import { resolve } from "../../scene/resolve.js";
import type { CometLayer } from "../../scene/types.js";
import type { PixelTransform, Point } from "../../transform/types.js";
import { computeCometQuad } from "../comet-geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULT_COLOR = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_START_WIDTH = 0.5;
const DEFAULT_END_WIDTH = 4;

/** Monotonically increasing so every gradient `<linearGradient id>` is unique page-wide. */
let gradientIdCounter = 0;

/**
 * Paints a CometLayer as one filled quadrilateral per datum: SVG has no way
 * to vary a `<line>`'s stroke-width along its length, so the tapered shape
 * is built directly from two points offset perpendicular to the line at
 * `startWidth`/`endWidth` and joined into a polygon.
 */
export function paintCometLayer<T>(
  svg: SVGSVGElement,
  doc: Document,
  layer: CometLayer<T>,
  transform: PixelTransform,
): void {
  const group = doc.createElementNS(SVG_NS, "g") as SVGGElement;
  group.setAttribute("data-pitchkit-layer", "comet");
  svg.appendChild(group);

  layer.data.forEach((d, i) => {
    const start: Point = transform.toPixel([resolve(layer.x, d, i), resolve(layer.y, d, i)]);
    const end: Point = transform.toPixel([resolve(layer.x2, d, i), resolve(layer.y2, d, i)]);

    // `color` always has a themed default — needed unconditionally for the
    // gradient's `<stop>` colours below, which have no `className`-based
    // equivalent. The *flat* (non-gradient) fill is the one that backs off
    // that default when `className` is set and no explicit `color` was
    // given, for the same inline-style-beats-class reason as the other
    // painters — an explicit `color` prop still always wins over `className`.
    const color = resolve(layer.color ?? DEFAULT_COLOR, d, i);
    const startWidth = resolve(layer.startWidth ?? DEFAULT_START_WIDTH, d, i);
    const endWidth = resolve(layer.endWidth ?? DEFAULT_END_WIDTH, d, i);

    const corners = computeCometQuad(start, end, startWidth, endWidth);

    let fill: string | undefined = layer.color !== undefined || !layer.className ? color : undefined;
    if (layer.gradient) {
      const gradientId = `pitchkit-comet-gradient-${gradientIdCounter++}`;
      appendFadeGradient(group, doc, gradientId, start, end, color);
      fill = `url(#${gradientId})`;
    }

    const polygon = doc.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", corners.map(([x, y]) => `${x},${y}`).join(" "));
    polygon.setAttribute("data-pitchkit-mark", "comet");
    polygon.setAttribute("style", `${fill !== undefined ? `fill: ${fill}; ` : ""}stroke: none;`);
    if (layer.className) {
      polygon.setAttribute("class", layer.className);
    }
    group.appendChild(polygon);
  });
}

/** Appends a `<linearGradient>` fading from transparent at `start` to opaque `color` at `end`. */
function appendFadeGradient(
  group: SVGGElement,
  doc: Document,
  id: string,
  start: Point,
  end: Point,
  color: string,
): void {
  const defs = doc.createElementNS(SVG_NS, "defs");
  const gradient = doc.createElementNS(SVG_NS, "linearGradient");
  gradient.setAttribute("id", id);
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");
  gradient.setAttribute("x1", String(start[0]));
  gradient.setAttribute("y1", String(start[1]));
  gradient.setAttribute("x2", String(end[0]));
  gradient.setAttribute("y2", String(end[1]));

  const stopStart = doc.createElementNS(SVG_NS, "stop");
  stopStart.setAttribute("offset", "0%");
  stopStart.setAttribute("stop-color", color);
  stopStart.setAttribute("stop-opacity", "0");
  gradient.appendChild(stopStart);

  const stopEnd = doc.createElementNS(SVG_NS, "stop");
  stopEnd.setAttribute("offset", "100%");
  stopEnd.setAttribute("stop-color", color);
  stopEnd.setAttribute("stop-opacity", "1");
  gradient.appendChild(stopEnd);

  defs.appendChild(gradient);
  group.appendChild(defs);
}
