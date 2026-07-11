import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { ScatterLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import { paintScatterLayer } from "./paint-scatter.js";

const SVG_NS = "http://www.w3.org/2000/svg";

interface Datum {
  x: number;
  y: number;
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

describe("paintScatterLayer", () => {
  it("paints one circle per datum at its transformed position", () => {
    const svg = makeSvg();
    const data: Datum[] = [
      { x: 10, y: 10 },
      { x: 60, y: 40 },
      { x: 110, y: 70 },
    ];
    const layer: ScatterLayer<Datum> = {
      type: "scatter",
      data,
      x: (d) => d.x,
      y: (d) => d.y,
    };
    const transform = makeTransform();
    paintScatterLayer(svg, document, layer, transform);

    const circles = svg.querySelectorAll('[data-pitchkit-mark="scatter"]');
    expect(circles.length).toBe(data.length);

    circles.forEach((circle, i) => {
      const datum = data[i]!;
      const [expectedX, expectedY] = transform.toPixel([datum.x, datum.y]);
      expect(Number(circle.getAttribute("cx"))).toBeCloseTo(expectedX, 5);
      expect(Number(circle.getAttribute("cy"))).toBeCloseTo(expectedY, 5);
    });
  });

  it("resolves accessor props (r, fill) per-datum and applies defaults otherwise", () => {
    const svg = makeSvg();
    const data: Datum[] = [
      { x: 10, y: 10 },
      { x: 60, y: 40 },
    ];
    const layer: ScatterLayer<Datum> = {
      type: "scatter",
      data,
      x: (d) => d.x,
      y: (d) => d.y,
      r: (d, i) => 4 + i,
      fill: (d, i) => (i === 0 ? "red" : "blue"),
    };
    paintScatterLayer(svg, document, layer, makeTransform());

    const circles = svg.querySelectorAll('[data-pitchkit-mark="scatter"]');
    expect(circles[0]?.getAttribute("r")).toBe("4");
    expect(circles[1]?.getAttribute("r")).toBe("5");
    expect(circles[0]?.getAttribute("style")).toContain("fill: red");
    expect(circles[1]?.getAttribute("style")).toContain("fill: blue");
  });

  it("falls back to the themed default radius and fill when unset", () => {
    const svg = makeSvg();
    const layer: ScatterLayer<Datum> = {
      type: "scatter",
      data: [{ x: 10, y: 10 }],
      x: (d) => d.x,
      y: (d) => d.y,
    };
    paintScatterLayer(svg, document, layer, makeTransform());

    const circle = svg.querySelector('[data-pitchkit-mark="scatter"]');
    expect(circle?.getAttribute("r")).toBe("4");
    expect(circle?.getAttribute("style")).toContain("var(--pitch-marker-primary");
  });

  it("wraps marks in a g[data-pitchkit-layer='scatter']", () => {
    const svg = makeSvg();
    const layer: ScatterLayer<Datum> = {
      type: "scatter",
      data: [{ x: 10, y: 10 }],
      x: (d) => d.x,
      y: (d) => d.y,
    };
    paintScatterLayer(svg, document, layer, makeTransform());

    expect(svg.querySelectorAll('[data-pitchkit-layer="scatter"]').length).toBe(1);
  });
});
