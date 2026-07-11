import type { TooltipState } from "./context.js";

/**
 * Positioned absolutely within `<Pitch>`'s wrapper, offset above the
 * hovered mark. Desktop hover only for this first pass — the PRD's full
 * touch-vs-hover interaction model (§8.6) is deferred scope.
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
        background: "var(--pitch-tooltip-bg, rgba(17, 17, 17, 0.92))",
        color: "var(--pitch-tooltip-color, #fff)",
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
