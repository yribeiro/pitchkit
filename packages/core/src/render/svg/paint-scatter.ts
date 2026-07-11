import { resolve } from "../../scene/resolve.js";
import type { ScatterLayer } from "../../scene/types.js";
import type { PixelTransform } from "../../transform/types.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULT_RADIUS = 4;
const DEFAULT_FILL = "var(--pitch-marker-primary, #3b82f6)";

/** Paints a ScatterLayer as one `<circle>` per datum, styled via resolved accessors. */
export function paintScatterLayer<T>(
  svg: SVGSVGElement,
  doc: Document,
  layer: ScatterLayer<T>,
  transform: PixelTransform,
): void {
  const group = doc.createElementNS(SVG_NS, "g") as SVGGElement;
  group.setAttribute("data-pitchkit-layer", "scatter");
  svg.appendChild(group);

  layer.data.forEach((d, i) => {
    const x = resolve(layer.x, d, i);
    const y = resolve(layer.y, d, i);
    const [cx, cy] = transform.toPixel([x, y]);
    const r = resolve(layer.r ?? DEFAULT_RADIUS, d, i);

    const el = doc.createElementNS(SVG_NS, "circle");
    el.setAttribute("cx", String(cx));
    el.setAttribute("cy", String(cy));
    el.setAttribute("r", String(r));
    el.setAttribute("data-pitchkit-mark", "scatter");

    const fill = resolve(layer.fill ?? DEFAULT_FILL, d, i);
    const stroke = layer.stroke !== undefined ? resolve(layer.stroke, d, i) : "none";

    let style = `fill: ${fill}; stroke: ${stroke};`;
    if (layer.fillOpacity !== undefined) {
      style += ` fill-opacity: ${resolve(layer.fillOpacity, d, i)};`;
    }
    if (layer.strokeWidth !== undefined) {
      style += ` stroke-width: ${resolve(layer.strokeWidth, d, i)};`;
    }
    el.setAttribute("style", style);

    group.appendChild(el);
  });
}
