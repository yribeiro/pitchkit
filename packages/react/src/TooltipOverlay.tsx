import type { TooltipState } from "./context.js";
import { TOOLTIP_BG, TOOLTIP_TEXT } from "./chart-tokens.js";

/**
 * Positioned absolutely within `<Pitch>`'s wrapper, offset above the
 * hovered mark. Desktop hover only for this first pass — the touch-vs-hover
 * interaction model (docs/architecture.md#responsive-and-multi-device) is deferred scope.
 */
export function TooltipOverlay({ tooltip }: { tooltip: TooltipState }) {
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
        background: TOOLTIP_BG,
        color: TOOLTIP_TEXT,
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 12,
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
    >
      {tooltip.content}
    </div>
  );
}
