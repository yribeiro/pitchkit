import { resolve } from "../../scene/resolve.js";
import type { ArrowsLayer } from "../../scene/types.js";
import type { PixelTransform, Point } from "../../transform/types.js";
import { computeArrowHeadCorners } from "../arrow-geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULT_STROKE = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_STROKE_WIDTH = 1.5;
const DEFAULT_HEAD_SIZE = 6;

/**
 * Paints an ArrowsLayer as one shaft `<line>` + arrowhead `<polygon>` per
 * datum. The head angle is computed from the already-transformed pixel-space
 * endpoints (not provider coordinates), so it points correctly regardless of
 * any axis flip/swap the pixel transform applied (orientation, yDirection) —
 * consistent with `arcSweepFlag`'s approach in `paint-pitch.ts`.
 */
export function paintArrowsLayer<T>(
  svg: SVGSVGElement,
  doc: Document,
  layer: ArrowsLayer<T>,
  transform: PixelTransform,
): void {
  const group = doc.createElementNS(SVG_NS, "g") as SVGGElement;
  group.setAttribute("data-pitchkit-layer", "arrows");
  svg.appendChild(group);

  layer.data.forEach((d, i) => {
    const start: Point = transform.toPixel([resolve(layer.x, d, i), resolve(layer.y, d, i)]);
    const end: Point = transform.toPixel([resolve(layer.x2, d, i), resolve(layer.y2, d, i)]);

    const stroke = resolve(layer.stroke ?? DEFAULT_STROKE, d, i);
    const strokeWidth = resolve(layer.strokeWidth ?? DEFAULT_STROKE_WIDTH, d, i);
    const strokeOpacity =
      layer.strokeOpacity !== undefined ? resolve(layer.strokeOpacity, d, i) : undefined;
    const headSize = resolve(layer.headSize ?? DEFAULT_HEAD_SIZE, d, i);

    const opacityStyle = strokeOpacity !== undefined ? ` opacity: ${strokeOpacity};` : "";

    const shaft = doc.createElementNS(SVG_NS, "line");
    shaft.setAttribute("x1", String(start[0]));
    shaft.setAttribute("y1", String(start[1]));
    shaft.setAttribute("x2", String(end[0]));
    shaft.setAttribute("y2", String(end[1]));
    shaft.setAttribute("data-pitchkit-mark", "arrow-shaft");
    shaft.setAttribute("style", `stroke: ${stroke}; stroke-width: ${strokeWidth};${opacityStyle}`);
    group.appendChild(shaft);

    const [headPointA, headPointB] = computeArrowHeadCorners(start, end, headSize);

    const head = doc.createElementNS(SVG_NS, "polygon");
    head.setAttribute(
      "points",
      `${end[0]},${end[1]} ${headPointA[0]},${headPointA[1]} ${headPointB[0]},${headPointB[1]}`,
    );
    head.setAttribute("data-pitchkit-mark", "arrow-head");
    head.setAttribute("style", `fill: ${stroke};${opacityStyle}`);
    group.appendChild(head);
  });
}
