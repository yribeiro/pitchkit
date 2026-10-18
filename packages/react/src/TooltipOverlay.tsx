import type { TooltipState } from "./context.js";
import { TOOLTIP_BG, TOOLTIP_TEXT } from "./chart-tokens.js";

/**
 * Layer components set tooltip state on hover whenever a `tooltip` prop was
 * passed, without inspecting what the accessor returned. An accessor that
 * returns nothing for a given datum — `(d) => d.isKeeper ? "Goalkeeper" : undefined`,
 * a common shape — means "nothing to say about this one", so skip the
 * overlay entirely rather than painting an empty, text-less box.
 */
export function hasTooltipContent(tooltip: TooltipState | null): tooltip is TooltipState {
  const content = tooltip?.content;
  return content !== null && content !== undefined && content !== false && content !== "";
}

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
