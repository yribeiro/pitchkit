import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { CHART_MUTED, CHART_TEXT, GRID } from "./chart-tokens.js";
import type { PolarSelection } from "./polar-types.js";

/**
 * A polar chart's selection: uncontrolled by default, controlled when the
 * caller passes `selected` (the usual React pattern for an input).
 *
 * It also owns focus return. When the detail view closes, focus goes back
 * to the element that opened it, found by its `data-pitchkit-metric` (and,
 * for a pizza slice, `data-pitchkit-series`) inside `containerRef`, so every
 * polar chart gets it by tagging its clickable elements.
 */
export function usePolarSelection(
  containerRef: RefObject<HTMLElement | null>,
  selected: PolarSelection | null | undefined,
  onSelectedChange: ((selection: PolarSelection | null) => void) | undefined,
): {
  selection: PolarSelection | null;
  open: (selection: PolarSelection) => void;
  close: () => void;
} {
  const [internal, setInternal] = useState<PolarSelection | null>(null);
  const opener = useRef<PolarSelection | null>(null);
  const selection = selected !== undefined ? selected : internal;

  function set(next: PolarSelection | null) {
    if (selected === undefined) setInternal(next);
    onSelectedChange?.(next);
  }

  useEffect(() => {
    const from = opener.current;
    if (selection !== null || from === null) return;
    opener.current = null;
    const target = Array.from(
      containerRef.current?.querySelectorAll<SVGElement>("[data-pitchkit-metric]") ?? [],
    ).find(
      (el) =>
        el.getAttribute("data-pitchkit-metric") === from.metricId &&
        (from.seriesId === undefined || el.getAttribute("data-pitchkit-series") === from.seriesId),
    );
    target?.focus();
  }, [selection, containerRef]);

  return {
    selection,
    open: (next) => {
      opener.current = next;
      set(next);
    },
    close: () => set(null),
  };
}

/**
 * The detail view a polar chart swaps itself for: a header with a Back
 * button and the metric's name, then whatever the caller rendered, in the
 * chart's own box so the page doesn't jump.
 *
 * Opening moves focus to the heading, so a screen reader announces where
 * it landed; Escape and Back both close, and `usePolarSelection` returns
 * focus to whatever opened it.
 */
export function PolarDetailView({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const reduceMotion =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      rootRef.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    }
  }, []);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  }

  return (
    <div
      ref={rootRef}
      data-pitchkit-part="polar-detail"
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflow: "auto",
        color: CHART_TEXT,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          data-pitchkit-part="polar-back"
          onClick={onClose}
          style={{
            font: "inherit",
            fontSize: 12,
            color: "inherit",
            background: "transparent",
            border: `1px solid ${GRID}`,
            borderRadius: 6,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        {/* Focused only so a screen reader announces it; not interactive, so no ring. */}
        <h3
          ref={headingRef}
          tabIndex={-1}
          style={{ margin: 0, fontSize: 14, fontWeight: 600, outline: "none" }}
        >
          {title}
        </h3>
        {subtitle !== undefined && (
          <span style={{ fontSize: 12, color: CHART_MUTED }}>{subtitle}</span>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
