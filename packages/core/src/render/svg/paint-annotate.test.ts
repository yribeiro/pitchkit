import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { AnnotateLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import { paintAnnotateLayer } from "./paint-annotate.js";

const SVG_NS = "http://www.w3.org/2000/svg";

interface Datum {
  x: number;
  y: number;
  name: string;
}

function makeSvg(): SVGSVGElement {
  return document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
}

function makeTransform() {
  return createPixelTransform(PITCH_DIMENSIONS.statsbomb, {
    width: 600,
    height: 400,
    orientation: "horizontal",
  });
}

describe("paintAnnotateLayer", () => {
  it("paints one text element per datum with the resolved label", () => {
    const svg = makeSvg();
    const data: Datum[] = [
      { x: 10, y: 10, name: "GK" },
      { x: 60, y: 40, name: "CM" },
    ];
    const layer: AnnotateLayer<Datum> = {
      type: "annotate",
      data,
      x: (d) => d.x,
      y: (d) => d.y,
      label: (d) => d.name,
    };
    paintAnnotateLayer(svg, document, layer, makeTransform());

    const texts = svg.querySelectorAll('[data-pitchkit-mark="annotate"]');
    expect(texts.length).toBe(2);
    expect(texts[0]?.textContent).toBe("GK");
    expect(texts[1]?.textContent).toBe("CM");
  });

  it("applies offsetX/offsetY in pixel space on top of the transformed position", () => {
    const svg = makeSvg();
    const transform = makeTransform();
    const layer: AnnotateLayer<Datum> = {
      type: "annotate",
      data: [{ x: 60, y: 40, name: "CM" }],
      x: (d) => d.x,
      y: (d) => d.y,
      label: (d) => d.name,
      offsetX: 5,
      offsetY: -14,
    };
    paintAnnotateLayer(svg, document, layer, transform);

    const [expectedX, expectedY] = transform.toPixel([60, 40]);
    const text = svg.querySelector('[data-pitchkit-mark="annotate"]');
    expect(Number(text?.getAttribute("x"))).toBeCloseTo(expectedX + 5, 5);
    expect(Number(text?.getAttribute("y"))).toBeCloseTo(expectedY - 14, 5);
  });

  it("applies className when provided", () => {
    const svg = makeSvg();
    const layer: AnnotateLayer<Datum> = {
      type: "annotate",
      data: [{ x: 10, y: 10, name: "GK" }],
      x: (d) => d.x,
      y: (d) => d.y,
      label: (d) => d.name,
      className: "demo-label",
    };
    paintAnnotateLayer(svg, document, layer, makeTransform());

    const text = svg.querySelector('[data-pitchkit-mark="annotate"]');
    expect(text?.getAttribute("class")).toBe("demo-label");
  });

  it("wraps marks in a g[data-pitchkit-layer='annotate']", () => {
    const svg = makeSvg();
    const layer: AnnotateLayer<Datum> = {
      type: "annotate",
      data: [{ x: 10, y: 10, name: "GK" }],
      x: (d) => d.x,
      y: (d) => d.y,
      label: (d) => d.name,
    };
    paintAnnotateLayer(svg, document, layer, makeTransform());

    expect(svg.querySelectorAll('[data-pitchkit-layer="annotate"]').length).toBe(1);
  });
});
