import type { PitchDimensions } from "../dimensions/types.js";
import type { CropWindow } from "./types.js";

/**
 * Crop window for the attacking (right-hand) half of the pitch, in the
 * provider's own coordinates. Every supported provider's x-axis increases
 * left-to-right starting at 0 (see `canonical.ts`), so halving `length` is
 * provider-agnostic; y is left full-height since `createPixelTransform`
 * normalizes crop corners via the canonical frame regardless of yDirection.
 */
export function cropForHalf(dimensions: PitchDimensions): CropWindow {
  return {
    x0: dimensions.length / 2,
    y0: 0,
    x1: dimensions.length,
    y1: dimensions.width,
  };
}
