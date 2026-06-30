import type { PitchDimensions } from "../dimensions/types.js";
import { fromCanonicalFrame, toCanonicalFrame } from "./canonical.js";
import type { PixelTransform, Point, Viewport } from "./types.js";

const ZERO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Builds the provider-coordinates -> pixel-space transform for a single
 * render. This is PitchKit's "internal scale + transform pipeline" (PRD
 * §8.2): every layer calls toPixel() and inherits this single source of
 * truth, so pitch geometry and data marks always stay aligned.
 */
export function createPixelTransform(
  dimensions: PitchDimensions,
  viewport: Viewport,
): PixelTransform {
  const crop = viewport.crop ?? { x0: 0, y0: 0, x1: dimensions.length, y1: dimensions.width };
  const padding = viewport.padding ?? ZERO_PADDING;

  // Resolve the crop window into the canonical frame (real provider units,
  // top-left origin, y-down) so the rest of the math is provider-agnostic.
  const cropCornerA = toCanonicalFrame(dimensions, [crop.x0, crop.y0]);
  const cropCornerB = toCanonicalFrame(dimensions, [crop.x1, crop.y1]);

  // toCanonicalFrame doesn't guarantee min/max ordering relative to the
  // crop's own x0/y0 vs x1/y1 (depends on yDirection), so normalize here.
  const canonicalMinX = Math.min(cropCornerA[0], cropCornerB[0]);
  const canonicalMaxX = Math.max(cropCornerA[0], cropCornerB[0]);
  const canonicalMinY = Math.min(cropCornerA[1], cropCornerB[1]);
  const canonicalMaxY = Math.max(cropCornerA[1], cropCornerB[1]);

  const extentX = canonicalMaxX - canonicalMinX;
  const extentY = canonicalMaxY - canonicalMinY;

  // Orientation swaps which canonical axis maps to the viewport's physical
  // width vs height.
  const displayWidthExtent = viewport.orientation === "vertical" ? extentY : extentX;
  const displayHeightExtent = viewport.orientation === "vertical" ? extentX : extentY;

  const availableWidth = viewport.width - padding.left - padding.right;
  const availableHeight = viewport.height - padding.top - padding.bottom;

  // Uniform scale only — pitches must never be stretched independently on
  // each axis.
  const scale = Math.min(
    availableWidth / displayWidthExtent,
    availableHeight / displayHeightExtent,
  );

  const renderedWidth = displayWidthExtent * scale;
  const renderedHeight = displayHeightExtent * scale;

  const offsetX = padding.left + (availableWidth - renderedWidth) / 2;
  const offsetY = padding.top + (availableHeight - renderedHeight) / 2;

  function toPixel(point: Point): Point {
    const [canonicalX, canonicalY] = toCanonicalFrame(dimensions, point);
    const relX = canonicalX - canonicalMinX;
    const relY = canonicalY - canonicalMinY;

    const [physX, physY] = viewport.orientation === "vertical" ? [relY, relX] : [relX, relY];

    return [offsetX + physX * scale, offsetY + physY * scale];
  }

  function toProvider(point: Point): Point {
    const [px, py] = point;
    const physX = (px - offsetX) / scale;
    const physY = (py - offsetY) / scale;

    const [relX, relY] = viewport.orientation === "vertical" ? [physY, physX] : [physX, physY];

    const canonicalX = canonicalMinX + relX;
    const canonicalY = canonicalMinY + relY;

    return fromCanonicalFrame(dimensions, [canonicalX, canonicalY]);
  }

  return { toPixel, toProvider, scale };
}
