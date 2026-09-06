import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { CometLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import { paintCometLayer } from "./paint-comet.js";

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

function baseLayer(data: Pass[]): CometLayer<Pass> {
  return {
    type: "comet",
    data,
    x: (d) => d.from[0],
    y: (d) => d.from[1],
    x2: (d) => d.to[0],
    y2: (d) => d.to[1],
  };
}

describe("paintCometLayer", () => {
  it("paints one filled polygon per datum", () => {
    const svg = makeSvg();
    const data: Pass[] = [
      { from: [10, 10], to: [50, 50] },
      { from: [60, 40], to: [90, 25] },
    ];
    paintCometLayer(svg, document, baseLayer(data), makeTransform());

    const marks = svg.querySelectorAll('[data-pitchkit-mark="comet"]');
    expect(marks.length).toBe(data.length);
    marks.forEach((mark) => {
      expect(mark.tagName).toBe("polygon");
      expect(mark.getAttribute("points")?.split(" ").length).toBe(4);
    });
  });

  it("uses the static colour fill when gradient is not enabled", () => {
    const svg = makeSvg();
    const layer: CometLayer<Pass> = {
      ...baseLayer([{ from: [10, 10], to: [50, 50] }]),
      color: "red",
    };
    paintCometLayer(svg, document, layer, makeTransform());

    const mark = svg.querySelector('[data-pitchkit-mark="comet"]');
    expect(mark?.getAttribute("style")).toContain("fill: red");
    expect(svg.querySelector("defs")).toBeNull();
  });

  it("paints a linearGradient def and references it via fill when gradient is enabled", () => {
    const svg = makeSvg();
    const layer: CometLayer<Pass> = {
      ...baseLayer([{ from: [10, 10], to: [50, 50] }]),
      gradient: true,
    };
    paintCometLayer(svg, document, layer, makeTransform());

    const gradient = svg.querySelector("linearGradient");
    expect(gradient).not.toBeNull();
    const gradientId = gradient?.getAttribute("id");
    expect(gradientId).toBeTruthy();

    const mark = svg.querySelector('[data-pitchkit-mark="comet"]');
    expect(mark?.getAttribute("style")).toContain(`fill: url(#${gradientId})`);

    const stops = gradient?.querySelectorAll("stop") ?? [];
    expect(stops.length).toBe(2);
    expect(stops[0]?.getAttribute("stop-opacity")).toBe("0");
    expect(stops[1]?.getAttribute("stop-opacity")).toBe("1");
  });

  it("generates distinct gradient ids across multiple gradient comets", () => {
    const svg = makeSvg();
    const layer: CometLayer<Pass> = {
      ...baseLayer([
        { from: [10, 10], to: [50, 50] },
        { from: [60, 40], to: [90, 25] },
      ]),
      gradient: true,
    };
    paintCometLayer(svg, document, layer, makeTransform());

    const ids = Array.from(svg.querySelectorAll("linearGradient")).map((g) => g.getAttribute("id"));
    expect(new Set(ids).size).toBe(2);
  });

  it("applies className when provided", () => {
    const svg = makeSvg();
    const layer: CometLayer<Pass> = {
      ...baseLayer([{ from: [10, 10], to: [50, 50] }]),
      className: "demo-comet",
    };
    paintCometLayer(svg, document, layer, makeTransform());

    const mark = svg.querySelector('[data-pitchkit-mark="comet"]');
    expect(mark?.getAttribute("class")).toBe("demo-comet");
  });

  it("wraps marks in a g[data-pitchkit-layer='comet']", () => {
    const svg = makeSvg();
    paintCometLayer(svg, document, baseLayer([{ from: [10, 10], to: [50, 50] }]), makeTransform());
    expect(svg.querySelectorAll('[data-pitchkit-layer="comet"]').length).toBe(1);
  });
});
