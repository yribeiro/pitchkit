import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchTypeId } from "../dimensions/types.js";
import { cropForHalf } from "./half.js";

const PITCH_TYPES: PitchTypeId[] = ["statsbomb", "opta", "uefa"];

describe("cropForHalf", () => {
  it.each(PITCH_TYPES)(
    "%s: crops to the attacking (right) half in provider coordinates",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const crop = cropForHalf(dims);

      expect(crop.x0).toBe(dims.length / 2);
      expect(crop.x1).toBe(dims.length);
      expect(crop.y0).toBe(0);
      expect(crop.y1).toBe(dims.width);
    },
  );

  it.each(PITCH_TYPES)("%s: spans exactly half the pitch length", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const crop = cropForHalf(dims);

    expect(crop.x1 - crop.x0).toBeCloseTo(dims.length / 2, 10);
    expect(crop.y1 - crop.y0).toBe(dims.width);
  });
});
