import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { ArrowsLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import { paintArrowsLayer } from "./paint-arrows.js";

const SVG_NS = "http://www.w3.org/2000/svg";

interface Pass {
  from: [number, number];
  to: [number, number];
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

describe("paintArrowsLayer", () => {
  it("paints one shaft and one head per datum", () => {
    const svg = makeSvg();
    const data: Pass[] = [
      { from: [10, 10], to: [50, 50] },
      { from: [60, 40], to: [90, 25] },
    ];
    const layer: ArrowsLayer<Pass> = {
      type: "arrows",
      data,
      x: (d) => d.from[0],
      y: (d) => d.from[1],
      x2: (d) => d.to[0],
      y2: (d) => d.to[1],
    };
    paintArrowsLayer(svg, document, layer, makeTransform());

    expect(svg.querySelectorAll('[data-pitchkit-mark="arrow-shaft"]').length).toBe(data.length);
    expect(svg.querySelectorAll('[data-pitchkit-mark="arrow-head"]').length).toBe(data.length);
  });

  it("positions the shaft endpoints at the transformed coordinates", () => {
    const svg = makeSvg();
    const transform = makeTransform();
    const layer: ArrowsLayer<Pass> = {
      type: "arrows",
      data: [{ from: [60, 40], to: [90, 25] }],
      x: (d) => d.from[0],
      y: (d) => d.from[1],
      x2: (d) => d.to[0],
      y2: (d) => d.to[1],
    };
    paintArrowsLayer(svg, document, layer, transform);

    const [expectedX1, expectedY1] = transform.toPixel([60, 40]);
    const [expectedX2, expectedY2] = transform.toPixel([90, 25]);
    const shaft = svg.querySelector('[data-pitchkit-mark="arrow-shaft"]');
    expect(Number(shaft?.getAttribute("x1"))).toBeCloseTo(expectedX1, 5);
    expect(Number(shaft?.getAttribute("y1"))).toBeCloseTo(expectedY1, 5);
    expect(Number(shaft?.getAttribute("x2"))).toBeCloseTo(expectedX2, 5);
    expect(Number(shaft?.getAttribute("y2"))).toBeCloseTo(expectedY2, 5);
  });

  it("the arrowhead polygon's tip sits at the end point", () => {
    const svg = makeSvg();
    const transform = makeTransform();
    const layer: ArrowsLayer<Pass> = {
      type: "arrows",
      data: [{ from: [60, 40], to: [90, 25] }],
      x: (d) => d.from[0],
      y: (d) => d.from[1],
      x2: (d) => d.to[0],
      y2: (d) => d.to[1],
    };
    paintArrowsLayer(svg, document, layer, transform);

    const [expectedX2, expectedY2] = transform.toPixel([90, 25]);
    const head = svg.querySelector('[data-pitchkit-mark="arrow-head"]');
    const points = head?.getAttribute("points") ?? "";
    const [tipX, tipY] = points.split(" ")[0]!.split(",").map(Number);
    expect(tipX).toBeCloseTo(expectedX2, 5);
    expect(tipY).toBeCloseTo(expectedY2, 5);
  });

  it("resolves stroke/strokeWidth accessors and falls back to themed defaults", () => {
    const svg = makeSvg();
    const layer: ArrowsLayer<Pass> = {
      type: "arrows",
      data: [{ from: [10, 10], to: [50, 50] }],
      x: (d) => d.from[0],
      y: (d) => d.from[1],
      x2: (d) => d.to[0],
      y2: (d) => d.to[1],
      stroke: "red",
      strokeWidth: 3,
    };
    paintArrowsLayer(svg, document, layer, makeTransform());
    const shaft = svg.querySelector('[data-pitchkit-mark="arrow-shaft"]');
    expect(shaft?.getAttribute("style")).toContain("stroke: red");
    expect(shaft?.getAttribute("style")).toContain("stroke-width: 3");

    const svgDefault = makeSvg();
    const defaultLayer: ArrowsLayer<Pass> = {
      type: "arrows",
      data: [{ from: [10, 10], to: [50, 50] }],
      x: (d) => d.from[0],
      y: (d) => d.from[1],
      x2: (d) => d.to[0],
      y2: (d) => d.to[1],
    };
    paintArrowsLayer(svgDefault, document, defaultLayer, makeTransform());
    const defaultShaft = svgDefault.querySelector('[data-pitchkit-mark="arrow-shaft"]');
    expect(defaultShaft?.getAttribute("style")).toContain("var(--pitch-marker-primary");
  });

  it("wraps marks in a g[data-pitchkit-layer='arrows']", () => {
    const svg = makeSvg();
    const layer: ArrowsLayer<Pass> = {
      type: "arrows",
      data: [{ from: [10, 10], to: [50, 50] }],
      x: (d) => d.from[0],
      y: (d) => d.from[1],
      x2: (d) => d.to[0],
      y2: (d) => d.to[1],
    };
    paintArrowsLayer(svg, document, layer, makeTransform());
    expect(svg.querySelectorAll('[data-pitchkit-layer="arrows"]').length).toBe(1);
  });
});
