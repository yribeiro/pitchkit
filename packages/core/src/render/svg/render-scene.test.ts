import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { PitchTypeId } from "../../dimensions/types.js";
import type { AnnotateLayer, ScatterLayer, Scene } from "../../scene/types.js";
import { renderSceneToSVGElement } from "./render-scene.js";

const PITCH_TYPES = Object.keys(PITCH_DIMENSIONS) as PitchTypeId[];

function buildScene(pitchType: PitchTypeId): Scene {
  return {
    dimensions: PITCH_DIMENSIONS[pitchType],
    viewport: { width: 600, height: 400, orientation: "horizontal" },
    layers: [],
  };
}

describe("renderSceneToSVGElement", () => {
  it.each(PITCH_TYPES)("%s: root svg has the requested viewport size", (pitchType) => {
    const svg = renderSceneToSVGElement(buildScene(pitchType));
    expect(svg.getAttribute("width")).toBe("600");
    expect(svg.getAttribute("height")).toBe("400");
    expect(svg.getAttribute("viewBox")).toBe("0 0 600 400");
  });

  it.each(PITCH_TYPES)("%s: contains exactly the expected pitch-part elements", (pitchType) => {
    const svg = renderSceneToSVGElement(buildScene(pitchType));

    const countOf = (part: string): number =>
      svg.querySelectorAll(`[data-pitchkit-part="${part}"]`).length;

    expect(countOf("surface")).toBe(1);
    expect(countOf("outline")).toBe(1);
    expect(countOf("halfway-line")).toBe(1);
    expect(countOf("center-circle")).toBe(1);
    expect(countOf("center-spot")).toBe(1);
    expect(countOf("penalty-area")).toBe(2);
    expect(countOf("six-yard-box")).toBe(2);
    expect(countOf("penalty-spot")).toBe(2);
    expect(countOf("penalty-arc")).toBe(2);
    expect(countOf("corner-arc")).toBe(4);
    expect(countOf("goal")).toBe(2);
  });

  it("surface carries a CSS-variable-themed style by default", () => {
    const svg = renderSceneToSVGElement(buildScene("statsbomb"));
    const surface = svg.querySelector('[data-pitchkit-part="surface"]');
    expect(surface?.getAttribute("style")).toContain("var(--pitch-surface");
  });

  it("paints the stroke-only outline border after the stripes so opaque stripes can't mask it", () => {
    const scene: Scene = { ...buildScene("statsbomb"), appearance: { stripes: true } };
    const svg = renderSceneToSVGElement(scene);
    const parts = Array.from(svg.querySelectorAll("[data-pitchkit-part]")).map((el) =>
      el.getAttribute("data-pitchkit-part"),
    );

    const outlineIndex = parts.indexOf("outline");
    expect(parts.indexOf("surface")).toBeLessThan(parts.indexOf("stripe"));
    expect(outlineIndex).toBeGreaterThan(parts.lastIndexOf("stripe"));
    expect(outlineIndex).toBe(parts.length - 1);

    const outline = svg.querySelector('[data-pitchkit-part="outline"]');
    expect(outline?.getAttribute("style")).toContain("fill: none");
  });

  it.each([true, 6, 0, false] as const)(
    "stripes: %s paints the expected number of stripe bands",
    (stripes) => {
      const scene: Scene = { ...buildScene("statsbomb"), appearance: { stripes } };
      const svg = renderSceneToSVGElement(scene);
      const stripeCount = svg.querySelectorAll('[data-pitchkit-part="stripe"]').length;

      if (stripes === true) {
        expect(stripeCount).toBe(6); // half of the default 12-band count
      } else if (stripes === 6) {
        expect(stripeCount).toBe(3);
      } else {
        expect(stripeCount).toBe(0);
      }
    },
  );

  it("goalType 'line' (default) renders 2 goal lines and no goal-box", () => {
    const svg = renderSceneToSVGElement(buildScene("statsbomb"));
    expect(svg.querySelectorAll('[data-pitchkit-part="goal"]').length).toBe(2);
    expect(svg.querySelectorAll('[data-pitchkit-part="goal-box"]').length).toBe(0);
  });

  it("goalType 'box' renders 2 goal-box rects and no goal lines", () => {
    const scene: Scene = { ...buildScene("statsbomb"), appearance: { goalType: "box" } };
    const svg = renderSceneToSVGElement(scene);
    expect(svg.querySelectorAll('[data-pitchkit-part="goal"]').length).toBe(0);
    expect(svg.querySelectorAll('[data-pitchkit-part="goal-box"]').length).toBe(2);
  });

  it("dispatches scatter and annotate layers and paints them after the pitch", () => {
    const datum = { x: 10, y: 10 };
    const scatterLayer: ScatterLayer<typeof datum> = {
      type: "scatter",
      data: [datum],
      x: (d) => d.x,
      y: (d) => d.y,
    };
    const annotateLayer: AnnotateLayer<typeof datum> = {
      type: "annotate",
      data: [datum],
      x: (d) => d.x,
      y: (d) => d.y,
      label: () => "A",
    };
    const scene: Scene = {
      ...buildScene("statsbomb"),
      layers: [scatterLayer, annotateLayer],
    };
    const svg = renderSceneToSVGElement(scene);

    expect(svg.querySelectorAll('[data-pitchkit-mark="scatter"]').length).toBe(1);
    expect(svg.querySelectorAll('[data-pitchkit-mark="annotate"]').length).toBe(1);

    const children = Array.from(svg.children);
    const pitchIndex = children.findIndex(
      (el) => el.getAttribute("data-pitchkit-layer") === "pitch",
    );
    const scatterIndex = children.findIndex(
      (el) => el.getAttribute("data-pitchkit-layer") === "scatter",
    );
    const annotateIndex = children.findIndex(
      (el) => el.getAttribute("data-pitchkit-layer") === "annotate",
    );

    expect(pitchIndex).toBeLessThan(scatterIndex);
    expect(scatterIndex).toBeLessThan(annotateIndex);
  });
});
