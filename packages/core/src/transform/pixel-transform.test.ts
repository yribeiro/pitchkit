import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchDimensions, PitchTypeId } from "../dimensions/types.js";
import { displayUnitScale, fromExtentFrame } from "./canonical.js";
import { createPixelTransform } from "./pixel-transform.js";
import type { Point, Viewport } from "./types.js";

// Derived from the registry rather than hardcoded, so a provider added later
// is held to these invariants automatically. A hardcoded list here is how
// skillcorner went uncovered for a release.
const PITCH_TYPES = Object.keys(PITCH_DIMENSIONS) as PitchTypeId[];

/**
 * The pitch's on-screen extent, in the units the transform actually scales:
 * metres for a percentage grid, the provider's own units otherwise.
 */
function displayExtent(dims: PitchDimensions): Point {
  const [unitScaleX, unitScaleY] = displayUnitScale(dims);
  return [dims.length * unitScaleX, dims.width * unitScaleY];
}

// Built in the extent frame and converted back, so these stay correct for a
// center-origin grid where the provider's own corner is not (0, 0).
function topLeftProviderCorner(dims: PitchDimensions): Point {
  return fromExtentFrame(dims, [0, dims.yDirection === "down" ? 0 : dims.width]);
}

function bottomRightProviderCorner(dims: PitchDimensions): Point {
  return fromExtentFrame(dims, [dims.length, dims.yDirection === "down" ? dims.width : 0]);
}

describe("createPixelTransform", () => {
  it.each(PITCH_TYPES)(
    "%s: top-left/bottom-right provider corners map to pixel extremes when viewport matches pitch aspect",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const [displayLength, displayWidth] = displayExtent(dims);
      const viewport: Viewport = {
        width: displayLength * 5,
        height: displayWidth * 5,
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
      const [displayLength, displayWidth] = displayExtent(dims);
      const viewport: Viewport = { width: 400, height: 400, orientation: "horizontal" };
      const transform = createPixelTransform(dims, viewport);

      const expectedScale = Math.min(400 / displayLength, 400 / displayWidth);
      expect(transform.scale).toBeCloseTo(expectedScale, 6);

      const renderedWidth = displayLength * expectedScale;
      const renderedHeight = displayWidth * expectedScale;
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

  // Nothing asserted a rendered aspect ratio before, which is how
  // https://github.com/yribeiro/pitchkit/issues/2 (Opta rendering square)
  // survived: every existing test scaled by `length`/`width`, the very
  // numbers that were wrong.
  it.each(PITCH_TYPES)("%s: renders at the real pitch's proportions", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const transform = createPixelTransform(dims, {
      width: 600,
      height: 400,
      orientation: "horizontal",
    });

    const [left, top] = transform.toPixel(topLeftProviderCorner(dims));
    const [right, bottom] = transform.toPixel(bottomRightProviderCorner(dims));
    const renderedAspect = Math.abs(right - left) / Math.abs(bottom - top);

    // StatsBomb's 120x80 is an abstract grid, not a measurement, and has
    // always rendered at its own 1.5 — changing that would move every
    // existing chart. Every other provider should land on the real pitch's
    // 105:68, and a percentage grid only does so once its units are
    // converted to metres.
    const expected =
      pitchType === "statsbomb"
        ? dims.length / dims.width
        : dims.realLengthMeters / dims.realWidthMeters;
    expect(renderedAspect).toBeCloseTo(expected, 4);
  });

  it.each(PITCH_TYPES)("%s: scales both axes equally, so a circle stays a circle", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const transform = createPixelTransform(dims, {
      width: 600,
      height: 400,
      orientation: "horizontal",
    });
    const [unitScaleX, unitScaleY] = displayUnitScale(dims);

    // A marking radius is a single number multiplied by `transform.scale`
    // (see CircleShape / ArcShape in @pitchkit/react), so the moment pixels
    // per unit differ between the axes, every circle becomes an ellipse.
    const origin = transform.toPixel(fromExtentFrame(dims, [0, 0]));
    const alongX = transform.toPixel(fromExtentFrame(dims, [dims.length, 0]));
    const alongY = transform.toPixel(fromExtentFrame(dims, [0, dims.width]));

    const pixelsPerDisplayUnitX = Math.abs(alongX[0] - origin[0]) / (dims.length * unitScaleX);
    const pixelsPerDisplayUnitY = Math.abs(alongY[1] - origin[1]) / (dims.width * unitScaleY);

    expect(pixelsPerDisplayUnitX).toBeCloseTo(pixelsPerDisplayUnitY, 6);
    expect(pixelsPerDisplayUnitX).toBeCloseTo(transform.scale, 6);
  });

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
