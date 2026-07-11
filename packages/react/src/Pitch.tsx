import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { computePitchGeometry, createPixelTransform, getPitchDimensions } from "@pitchkit/core";
import type {
  CropWindow,
  Orientation,
  PitchAppearance,
  PitchTypeId,
  Viewport,
  ViewportPadding,
} from "@pitchkit/core";
import { PitchContext } from "./context.js";
import type { TooltipState } from "./context.js";
import { PitchGeometryShapes } from "./pitch-geometry.js";
import { TooltipOverlay } from "./TooltipOverlay.js";
import { useResizeObserver } from "./use-resize-observer.js";

export interface PitchProps {
  type: PitchTypeId;
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
// until the first client measurement (PRD §8.6's "explicit aspect ratio on
// first paint, ResizeObserver refine after hydration").
const NOMINAL_WIDTH = 600;

/**
 * The root pitch component: owns the coordinate system, is responsive by
 * default (fills its container via ResizeObserver — explicit width/height
 * is the opt-out), and provides the pixel transform to layer-component
 * children via context.
 */
export function Pitch({
  type,
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
  const dimensions = getPitchDimensions(type);
  const [containerRef, measuredSize] = useResizeObserver<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const isExplicitSize = explicitWidth !== undefined && explicitHeight !== undefined;

  const pitchAspect =
    orientation === "vertical"
      ? dimensions.width / dimensions.length
      : dimensions.length / dimensions.width;
  const fallbackSize = { width: NOMINAL_WIDTH, height: Math.round(NOMINAL_WIDTH / pitchAspect) };

  const size = isExplicitSize
    ? { width: explicitWidth, height: explicitHeight }
    : (measuredSize ?? fallbackSize);

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
        <PitchGeometryShapes
          geometry={geometry}
          transform={transform}
          dimensions={dimensions}
          appearance={appearance}
        />
        <PitchContext.Provider value={{ dimensions, viewport, transform, setTooltip }}>
          {children}
        </PitchContext.Provider>
      </svg>
      {tooltip && <TooltipOverlay tooltip={tooltip} />}
    </div>
  );
}
