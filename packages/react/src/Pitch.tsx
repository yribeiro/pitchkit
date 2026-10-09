import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  computePitchGeometry,
  createPixelTransform,
  displayUnitScale,
  getPitchDimensions,
} from "@pitchkit/core";
import type {
  CropWindow,
  Orientation,
  PitchAppearance,
  PitchDimensionOverrides,
  PitchTypeId,
  Viewport,
  ViewportPadding,
} from "@pitchkit/core";
import { PitchContext } from "./context.js";
import type { TooltipState } from "./context.js";
import { PitchGeometryShapes, PitchMarkingShapes, PitchSurfaceShapes } from "./pitch-geometry.js";
import { TooltipOverlay, hasTooltipContent } from "./TooltipOverlay.js";
import { useResizeObserver } from "./use-resize-observer.js";

export interface PitchProps {
  type: PitchTypeId;
  /**
   * The real extent of this particular pitch, for providers whose coordinates
   * are metres on an actual pitch rather than a fixed grid.
   *
   * SkillCorner is the case that needs it: their pitches really are 104 to
   * 106 m long, and the data is in real metres, so passing the match's own
   * `pitch_length`/`pitch_width` draws the touchlines where they actually
   * were. Markings don't move — a penalty area is 16.5 m deep on any pitch.
   *
   * Leave it unset for grid-based providers; overriding a normalized grid
   * (Opta's 0-100) throws rather than silently rescaling.
   */
  dimensions?: PitchDimensionOverrides;
  /** @default "horizontal" */
  orientation?: Orientation;
  /** Fixed pixel size — the opt-out from the responsive default. Provide both, or neither. */
  width?: number;
  height?: number;
  crop?: CropWindow;
  padding?: ViewportPadding;
  appearance?: PitchAppearance;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

// A nominal size (matching the pitch's own aspect ratio) used only for the
// very first render, before ResizeObserver has measured the real
// container — SSR included, since there's no DOM to measure server-side.
// Picking a fallback with the *correct aspect ratio* means the SVG content
// is never distorted, even though its absolute pixel scale may be off
// until the first client measurement ("explicit aspect ratio on first
// paint, ResizeObserver refine after hydration": docs/architecture.md#responsive-and-multi-device).
const NOMINAL_WIDTH = 600;

/**
 * The root pitch component: owns the coordinate system, is responsive by
 * default (fills its container via ResizeObserver — explicit width/height
 * is the opt-out), and provides the pixel transform to layer-component
 * children via context.
 */
export function Pitch({
  type,
  dimensions: dimensionOverrides,
  orientation = "horizontal",
  width: explicitWidth,
  height: explicitHeight,
  crop,
  padding,
  appearance,
  className,
  style,
  children,
}: PitchProps) {
  const dimensions = getPitchDimensions(type, dimensionOverrides);
  const [containerRef, measuredSize] = useResizeObserver<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const isExplicitSize = explicitWidth !== undefined && explicitHeight !== undefined;

  // The container's aspect ratio must match what's actually being shown —
  // the cropped extent, not the full pitch — otherwise a half-pitch crop
  // renders inside a box sized for the whole pitch, leaving room for the
  // other half's markings (which the transform maps just outside the
  // crop, but not outside the oversized container) to bleed into view.
  // `crop`'s x0/x1/y0/y1 are already in the provider's own units (same
  // space as `dimensions.length`/`width`), and x never gets axis-swapped
  // by yDirection (see `canonical.ts`), so a plain abs-difference gives
  // the right extent without needing the canonical-frame conversion.
  //
  // The unit scale converts a percentage grid's units to metres, exactly as
  // `createPixelTransform` does — without it the container would stay square
  // for Opta and Wyscout while the pitch drawn inside it was not.
  const [unitScaleX, unitScaleY] = displayUnitScale(dimensions);
  const cropExtentX = (crop ? Math.abs(crop.x1 - crop.x0) : dimensions.length) * unitScaleX;
  const cropExtentY = (crop ? Math.abs(crop.y1 - crop.y0) : dimensions.width) * unitScaleY;
  const pitchAspect =
    orientation === "vertical" ? cropExtentY / cropExtentX : cropExtentX / cropExtentY;
  const fallbackSize = { width: NOMINAL_WIDTH, height: Math.round(NOMINAL_WIDTH / pitchAspect) };

  const size = isExplicitSize
    ? { width: explicitWidth, height: explicitHeight }
    : (measuredSize ?? fallbackSize);

  const linesOnTop = appearance?.linesOnTop ?? false;
  const viewport: Viewport = { width: size.width, height: size.height, orientation, crop, padding };
  const transform = createPixelTransform(dimensions, viewport);
  const geometry = computePitchGeometry(dimensions);

  return (
    <div
      ref={isExplicitSize ? undefined : containerRef}
      className={className}
      style={{
        position: "relative",
        width: isExplicitSize ? explicitWidth : "100%",
        height: isExplicitSize ? explicitHeight : undefined,
        aspectRatio: isExplicitSize ? undefined : pitchAspect,
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        style={{ display: "block" }}
      >
        {/* With `linesOnTop` the markings are emitted *after* the children
            so an opaque density layer can't hide them; the grass surface
            stays underneath either way. Default keeps the single combined
            group, so nothing about the existing DOM changes. */}
        {linesOnTop ? (
          <PitchSurfaceShapes geometry={geometry} transform={transform} appearance={appearance} />
        ) : (
          <PitchGeometryShapes
            geometry={geometry}
            transform={transform}
            dimensions={dimensions}
            appearance={appearance}
          />
        )}
        <PitchContext.Provider value={{ dimensions, viewport, transform, setTooltip }}>
          {children}
        </PitchContext.Provider>
        {linesOnTop && (
          <PitchMarkingShapes
            geometry={geometry}
            transform={transform}
            dimensions={dimensions}
            appearance={appearance}
          />
        )}
      </svg>
      {hasTooltipContent(tooltip) && <TooltipOverlay tooltip={tooltip} />}
    </div>
  );
}
