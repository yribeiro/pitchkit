import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchTypeId } from "../dimensions/types.js";
import { cropForHalf } from "./half.js";

const PITCH_TYPES = Object.keys(PITCH_DIMENSIONS) as PitchTypeId[];

describe("cropForHalf", () => {
  it.each(PITCH_TYPES)(
    "%s: crops to the attacking (right) half in provider coordinates",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const crop = cropForHalf(dims);

      // Expressed against the pitch's own minimum corner rather than zero,
      // so this holds for a center-origin grid too.
      const minX = dims.origin === "center" ? -dims.length / 2 : 0;
      const minY = dims.origin === "center" ? -dims.width / 2 : 0;

      expect(crop.x0).toBe(minX + dims.length / 2);
      expect(crop.x1).toBe(minX + dims.length);
      expect(crop.y0).toBe(minY);
      expect(crop.y1).toBe(minY + dims.width);
    },
  );

  it.each(PITCH_TYPES)("%s: spans exactly half the pitch length", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const crop = cropForHalf(dims);

    expect(crop.x1 - crop.x0).toBeCloseTo(dims.length / 2, 10);
    expect(crop.y1 - crop.y0).toBe(dims.width);
  });
});
