import type { CSSProperties, RefObject } from "react";
import { useResizeObserver } from "./use-resize-observer.js";
import type { Size } from "./use-resize-observer.js";

/** The width a chart assumes before it has been measured (SSR, first paint). */
const NOMINAL_WIDTH = 720;
/** Below this, a chart's box gets taller: a wide ratio on a phone leaves no plot. */
const NARROW_WIDTH = 420;

export interface ChartBoxOptions {
  readonly width: number | undefined;
  readonly height: number | undefined;
  /** The caller's `aspectRatio`, which wins over both defaults. */
  readonly aspectRatio: number | undefined;
  readonly wideRatio: number;
  readonly narrowRatio: number;
}

export interface ChartBox {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  /** The pixel size to lay out against: explicit, measured, or the nominal fallback. */
  readonly size: Size;
  readonly isNarrow: boolean;
  /** The root `<div>`'s sizing style. */
  readonly style: CSSProperties;
}

/**
 * Responsive sizing shared by every non-pitch chart (D4): fills its
 * container by default, with `width` and `height` together as the opt-out.
 *
 * Measured width drives the ratio, so the box gets taller on a phone. Width
 * never depends on height here (the container is a block filling its
 * parent), so this cannot oscillate with the ResizeObserver. Before the
 * first measurement the chart lays out at a nominal size, which is what
 * keeps a server render complete rather than empty.
 */
export function useChartBox({
  width,
  height,
  aspectRatio: explicitRatio,
  wideRatio,
  narrowRatio,
}: ChartBoxOptions): ChartBox {
  const [containerRef, measured] = useResizeObserver<HTMLDivElement>();
  const isExplicit = width !== undefined && height !== undefined;
  const isNarrow = (isExplicit ? width : (measured?.width ?? NOMINAL_WIDTH)) < NARROW_WIDTH;
  const aspectRatio = explicitRatio ?? (isNarrow ? narrowRatio : wideRatio);

  const size = isExplicit
    ? { width, height }
    : (measured ?? { width: NOMINAL_WIDTH, height: Math.round(NOMINAL_WIDTH / aspectRatio) });

  return {
    containerRef,
    size,
    isNarrow,
    style: {
      position: "relative",
      width: isExplicit ? width : "100%",
      height: isExplicit ? height : undefined,
      aspectRatio: isExplicit ? undefined : aspectRatio,
    },
  };
}
