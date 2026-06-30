import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchDimensions, PitchTypeId } from "../dimensions/types.js";
import { createPixelTransform } from "./pixel-transform.js";
import type { Point, Viewport } from "./types.js";

const PITCH_TYPES: PitchTypeId[] = ["statsbomb", "opta", "uefa"];

function topLeftProviderCorner(dims: PitchDimensions): Point {
  return dims.yDirection === "down" ? [0, 0] : [0, dims.width];
}

function bottomRightProviderCorner(dims: PitchDimensions): Point {
  return dims.yDirection === "down" ? [dims.length, dims.width] : [dims.length, 0];
}

describe("createPixelTransform", () => {
  it.each(PITCH_TYPES)(
    "%s: top-left/bottom-right provider corners map to pixel extremes when viewport matches pitch aspect",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const viewport: Viewport = {
        width: dims.length * 5,
        height: dims.width * 5,
        orientation: "horizontal",
      };
      const transform = createPixelTransform(dims, viewport);

      const [topLeftX, topLeftY] = transform.toPixel(topLeftProviderCorner(dims));
      expect(topLeftX).toBeCloseTo(0, 5);
      expect(topLeftY).toBeCloseTo(0, 5);

      const [bottomRightX, bottomRightY] = transform.toPixel(bottomRightProviderCorner(dims));
      expect(bottomRightX).toBeCloseTo(viewport.width, 5);
      expect(bottomRightY).toBeCloseTo(viewport.height, 5);

      expect(transform.scale).toBeCloseTo(5, 5);
    },
  );

  it.each(PITCH_TYPES)(
    "%s: scale is uniform and the render is centered when viewport aspect != pitch aspect",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const viewport: Viewport = { width: 400, height: 400, orientation: "horizontal" };
      const transform = createPixelTransform(dims, viewport);

      const expectedScale = Math.min(400 / dims.length, 400 / dims.width);
      expect(transform.scale).toBeCloseTo(expectedScale, 6);

      const renderedWidth = dims.length * expectedScale;
      const renderedHeight = dims.width * expectedScale;
      const offsetX = (400 - renderedWidth) / 2;
      const offsetY = (400 - renderedHeight) / 2;

      const [topLeftX, topLeftY] = transform.toPixel(topLeftProviderCorner(dims));
      expect(topLeftX).toBeCloseTo(offsetX, 5);
      expect(topLeftY).toBeCloseTo(offsetY, 5);
    },
  );

  it.each(PITCH_TYPES)(
    "%s: orientation 'vertical' swaps which axis fills the viewport's height",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const viewport: Viewport = { width: 400, height: 600, orientation: "vertical" };
      const transform = createPixelTransform(dims, viewport);

      // In vertical orientation the pitch's length axis maps to the
      // viewport's height, so two points differing only by the full pitch
      // length should differ mostly in pixel Y, not pixel X.
      const a = transform.toPixel([0, dims.width / 2]);
      const b = transform.toPixel([dims.length, dims.width / 2]);

      expect(Math.abs(b[1] - a[1])).toBeGreaterThan(Math.abs(b[0] - a[0]));
    },
  );

  it.each(PITCH_TYPES)("%s: round-trips toProvider(toPixel(p)) for sample points", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const viewport: Viewport = {
      width: 437,
      height: 311,
      orientation: "horizontal",
      padding: { top: 10, right: 5, bottom: 15, left: 20 },
    };
    const transform = createPixelTransform(dims, viewport);

    const samplePoints: Point[] = [
      [0, 0],
      [dims.length, 0],
      [0, dims.width],
      [dims.length, dims.width],
      [dims.length / 2, dims.width / 2],
      [dims.length * 0.27, dims.width * 0.81],
    ];

    for (const point of samplePoints) {
      const pixel = transform.toPixel(point);
      const [rx, ry] = transform.toProvider(pixel);
      expect(rx).toBeCloseTo(point[0], 5);
      expect(ry).toBeCloseTo(point[1], 5);
    }
  });

  it.each(PITCH_TYPES)(
    "%s: round-trips toProvider(toPixel(p)) under orientation 'vertical' too",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const viewport: Viewport = { width: 400, height: 600, orientation: "vertical" };
      const transform = createPixelTransform(dims, viewport);

      const samplePoints: Point[] = [
        [0, 0],
        [dims.length, dims.width],
        [dims.length * 0.4, dims.width * 0.6],
      ];

      for (const point of samplePoints) {
        const pixel = transform.toPixel(point);
        const [rx, ry] = transform.toProvider(pixel);
        expect(rx).toBeCloseTo(point[0], 5);
        expect(ry).toBeCloseTo(point[1], 5);
      }
    },
  );

  it("a crop window narrower than the full pitch projects points outside the crop outside the viewport bounds", () => {
    const dims = PITCH_DIMENSIONS.statsbomb;
    const viewport: Viewport = {
      width: 300,
      height: 300,
      orientation: "horizontal",
      crop: { x0: 0, y0: 0, x1: dims.markings.penaltyAreaLength, y1: dims.width },
    };
    const transform = createPixelTransform(dims, viewport);

    // The center spot lies well outside the cropped penalty-area window.
    const [centerX] = transform.toPixel([dims.length / 2, dims.width / 2]);
    expect(centerX).toBeGreaterThan(viewport.width);
  });
});
