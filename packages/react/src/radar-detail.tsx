import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { CHART_ACCENT, CHART_ACCENT_TEXT, CHART_MUTED, CHART_TEXT } from "./chart-tokens.js";
import type { RadarSelection } from "./radar-types.js";

/**
 * The radar's selection: uncontrolled by default, controlled when the
 * caller passes `selected` (the usual React pattern for an input).
 *
 * It also owns focus return: when the detail view closes, focus goes back
 * to the label that opened it, found by its `data-pitchkit-metric`.
 */
export function useRadarSelection(
  containerRef: RefObject<HTMLElement | null>,
  selected: RadarSelection | null | undefined,
  onSelectedChange: ((selection: RadarSelection | null) => void) | undefined,
): {
  selection: RadarSelection | null;
  open: (selection: RadarSelection) => void;
  close: () => void;
} {
  const [internal, setInternal] = useState<RadarSelection | null>(null);
  const opener = useRef<RadarSelection | null>(null);
  const selection = selected !== undefined ? selected : internal;

  function set(next: RadarSelection | null) {
    if (selected === undefined) setInternal(next);
    onSelectedChange?.(next);
  }

  useEffect(() => {
    const from = opener.current;
    if (selection !== null || from === null) return;
    opener.current = null;
    const target = Array.from(
      containerRef.current?.querySelectorAll<SVGElement>("[data-pitchkit-metric]") ?? [],
    ).find((el) => el.getAttribute("data-pitchkit-metric") === from.metricId);
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
 * The detail view the radar swaps itself for: a header with a Back
 * button and the metric's name, then whatever the caller rendered, in the
 * chart's own box so the page doesn't jump.
 *
 * Opening moves focus to the heading, so a screen reader announces where
 * it landed; Escape and Back both close, and `useRadarSelection` returns
 * focus to whatever opened it.
 */
export function RadarDetailView({
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
      data-pitchkit-part="radar-detail"
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
          data-pitchkit-part="radar-back"
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            font: "inherit",
            fontSize: 12,
            fontWeight: 600,
            color: CHART_ACCENT_TEXT,
            background: CHART_ACCENT,
            border: "none",
            borderRadius: 6,
            padding: "3px 10px 3px 6px",
            cursor: "pointer",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M7.5 2.5 4 6l3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
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
