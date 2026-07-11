import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { PitchDimensions, PixelTransform, Viewport } from "@pitchkit/core";

export interface TooltipState {
  readonly content: ReactNode;
  /** Pixel position within the <Pitch> wrapper, not the viewport. */
  readonly x: number;
  readonly y: number;
}

export interface PitchContextValue {
  readonly dimensions: PitchDimensions;
  readonly viewport: Viewport;
  readonly transform: PixelTransform;
  readonly setTooltip: (tooltip: TooltipState | null) => void;
}

export const PitchContext = createContext<PitchContextValue | null>(null);

/**
 * Internal: every layer component (Scatter/Annotate/Arrows/Comet) reads the
 * scene's transform through this. Throws with a specific message rather
 * than silently rendering nothing, since "layer outside <Pitch>" is a
 * usage error a consumer should see immediately, not debug from a blank
 * pitch.
 */
export function usePitchContext(): PitchContextValue {
  const ctx = useContext(PitchContext);
  if (!ctx) {
    throw new Error(
      "@pitchkit/react: this component must be rendered inside <Pitch> or <VerticalPitch>.",
    );
  }
  return ctx;
}
