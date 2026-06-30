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
});
