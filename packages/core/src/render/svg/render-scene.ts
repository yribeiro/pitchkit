import { computePitchGeometry } from "../../scene/geometry.js";
import type { Layer, Scene } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import type { PixelTransform } from "../../transform/types.js";
import type { Renderer } from "../renderer.js";
import { paintAnnotateLayer } from "./paint-annotate.js";
import { paintArrowsLayer } from "./paint-arrows.js";
import { paintCometLayer } from "./paint-comet.js";
import { paintPitchGeometry } from "./paint-pitch.js";
import { paintScatterLayer } from "./paint-scatter.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Dispatches a single Layer to its painter by its discriminant `type`. */
function paintLayer(
  svg: SVGSVGElement,
  doc: Document,
  layer: Layer,
  transform: PixelTransform,
): void {
  switch (layer.type) {
    case "scatter":
      paintScatterLayer(svg, doc, layer, transform);
      return;
    case "annotate":
      paintAnnotateLayer(svg, doc, layer, transform);
      return;
    case "arrows":
      paintArrowsLayer(svg, doc, layer, transform);
      return;
    case "comet":
      paintCometLayer(svg, doc, layer, transform);
      return;
  }
}

/**
 * Walks a Scene and builds an SVGSVGElement via DOM APIs (not string
 * templating) — runs under happy-dom in tests and a real DOM in the
 * browser with the same code path, and extends cleanly to interactive
 * marks (event listeners need real nodes) in Milestone 1.
 */
export function renderSceneToSVGElement(scene: Scene, doc: Document = document): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  svg.setAttribute("width", String(scene.viewport.width));
  svg.setAttribute("height", String(scene.viewport.height));
  svg.setAttribute("viewBox", `0 0 ${scene.viewport.width} ${scene.viewport.height}`);

  const transform = createPixelTransform(scene.dimensions, scene.viewport);
  const geometry = computePitchGeometry(scene.dimensions);
  paintPitchGeometry(svg, geometry, transform, doc, scene.dimensions, scene.appearance);

  // Layers render in array order, on top of the pitch.
  for (const layer of scene.layers) {
    paintLayer(svg, doc, layer, transform);
  }

  return svg;
}

/** Concrete `Renderer` implementation backed by the SVG renderer. */
export const svgRenderer: Renderer<SVGSVGElement> = {
  render: (scene: Scene) => renderSceneToSVGElement(scene),
};
