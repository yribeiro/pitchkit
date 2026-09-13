import type { PitchDimensions } from "../dimensions/types.js";
import { fromExtentFrame } from "./canonical.js";
import type { CropWindow } from "./types.js";

/**
 * Crop window for the attacking (right-hand) half of the pitch, in the
 * provider's own coordinates.
 *
 * Built in the extent frame and converted back out, so it lands correctly for
 * center-origin providers too — halving `length` alone would put the crop in
 * the wrong place on a grid that starts at `-length/2`. `createPixelTransform`
 * normalizes the corners regardless of yDirection, so y stays full-height.
 */
export function cropForHalf(dimensions: PitchDimensions): CropWindow {
  const [x0, y0] = fromExtentFrame(dimensions, [dimensions.length / 2, 0]);
  const [x1, y1] = fromExtentFrame(dimensions, [dimensions.length, dimensions.width]);
  return { x0, y0, x1, y1 };
}
