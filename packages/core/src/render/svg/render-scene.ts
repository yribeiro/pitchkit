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
 *
 * @internal Resolves issue #6: `@pitchkit/react` re-emits its own JSX rather
 * than calling this (JSX is what makes output SSR-able), so this function's
 * only first-party consumer is the `packages/core/examples/index.html` dev
 * harness. It is kept — and exported from `@pitchkit/core` so that harness
 * keeps working — as an internal building block, not a supported public API
 * for framework-agnostic/vanilla-JS consumption. React is the only
 * officially supported rendering surface for marks; do not add painters for
 * new Milestone 2 mark types (hexbin, KDE, flow, polygon, hull, Voronoi,
 * goal angle) — ship those React-only. `canvasRenderer` (heatmaps) is
 * unaffected and remains fully supported.
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

/**
 * Concrete `Renderer` implementation backed by the SVG renderer.
 *
 * @internal See the note on `renderSceneToSVGElement` above — internal
 * building-block surface, not a supported public consumption path.
 */
export const svgRenderer: Renderer<SVGSVGElement> = {
  render: (scene: Scene) => renderSceneToSVGElement(scene),
};
