import { resolve } from "../../scene/resolve.js";
import type { AnnotateLayer } from "../../scene/types.js";
import type { PixelTransform } from "../../transform/types.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Paints an AnnotateLayer as one `<text>` per datum, offset in pixel space from its anchor. */
export function paintAnnotateLayer<T>(
  svg: SVGSVGElement,
  doc: Document,
  layer: AnnotateLayer<T>,
  transform: PixelTransform,
): void {
  const group = doc.createElementNS(SVG_NS, "g") as SVGGElement;
  group.setAttribute("data-pitchkit-layer", "annotate");
  svg.appendChild(group);

  layer.data.forEach((d, i) => {
    const x = resolve(layer.x, d, i);
    const y = resolve(layer.y, d, i);
    const [px, py] = transform.toPixel([x, y]);
    const offsetX = layer.offsetX !== undefined ? resolve(layer.offsetX, d, i) : 0;
    const offsetY = layer.offsetY !== undefined ? resolve(layer.offsetY, d, i) : 0;

    const el = doc.createElementNS(SVG_NS, "text");
    el.setAttribute("x", String(px + offsetX));
    el.setAttribute("y", String(py + offsetY));
    el.setAttribute("data-pitchkit-mark", "annotate");
    el.setAttribute(
      "style",
      "fill: var(--pitch-lines, rgba(255, 255, 255, 0.8)); font-size: 10px; text-anchor: middle;",
    );
    if (layer.className) {
      el.setAttribute("class", layer.className);
    }
    el.textContent = resolve(layer.label, d, i);

    group.appendChild(el);
  });
}
