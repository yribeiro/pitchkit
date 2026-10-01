import { useEffect } from "react";
import type { ReactNode, RefObject } from "react";
import { TOOLTIP_BG, TOOLTIP_TEXT } from "./chart-tokens.js";

/**
 * The crosshair readout shared by every non-pitch chart: a small dark card
 * anchored beside the pointer.
 *
 * Both offsets are percentages because the SVG scales to its container
 * while this overlay does not — a pixel offset computed against the viewBox
 * drifts as soon as the two diverge. `top` anchors to the plot's top, which
 * keeps the card clear of the legend and period labels that live in the
 * padding above it.
 *
 * It flips to the left of the crosshair past the midpoint rather than at
 * 60%: on a phone the readout is a large fraction of the chart's width, and
 * anchoring it to the right of a crosshair past halfway runs it over the
 * chart's edge.
 */
export function ChartReadout({
  left,
  top,
  children,
}: {
  /** Crosshair position as a percentage of the chart's width. */
  left: number;
  /** Plot top as a percentage of the chart's height. */
  top: number;
  children: ReactNode;
}) {
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        transform: left > 50 ? "translateX(-100%)" : "none",
        marginLeft: left > 50 ? -12 : 12,
        pointerEvents: "none",
        background: TOOLTIP_BG,
        color: TOOLTIP_TEXT,
        padding: "6px 10px",
        borderRadius: 4,
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Dismisses a readout on a press anywhere outside the chart.
 *
 * A touch readout has no pointerleave to end it — the pointer stops
 * existing the moment the finger lifts, and clearing on that event would
 * wipe the readout in the same gesture — so without this it would stay up
 * forever. That is exactly how it looks in a browser's device emulation,
 * which reports every pointer as touch. A mouse has usually cleared it via
 * pointerleave long before this fires.
 *
 * The listener is on the document in the capture phase, so a handler that
 * stops propagation can't strand it, and it is attached only while a
 * readout is up.
 */
export function useDismissOnOutsidePress(
  containerRef: RefObject<Element | null>,
  active: boolean,
  dismiss: () => void,
): void {
  useEffect(() => {
    if (!active) return;

    function dismissOnOutsidePress(event: PointerEvent) {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) dismiss();
    }

    document.addEventListener("pointerdown", dismissOnOutsidePress, true);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePress, true);
  }, [active, containerRef, dismiss]);
}
