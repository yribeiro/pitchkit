import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { PitchTypeId } from "../../dimensions/types.js";
import type { Scene } from "../../scene/types.js";
import { renderSceneToSVGElement } from "./render-scene.js";

const PITCH_TYPES: PitchTypeId[] = ["statsbomb", "opta", "uefa"];

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

  it("outline carries a CSS-variable-themed style by default", () => {
    const svg = renderSceneToSVGElement(buildScene("statsbomb"));
    const outline = svg.querySelector('[data-pitchkit-part="outline"]');
    expect(outline?.getAttribute("style")).toContain("var(--pitch-surface");
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
});
