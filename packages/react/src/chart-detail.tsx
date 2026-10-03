import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { CHART_ACCENT, CHART_ACCENT_TEXT, CHART_MUTED, CHART_TEXT } from "./chart-tokens.js";

/** What every chart's selection has: the metric, and the series for charts that select one. */
interface Selection {
  readonly metricId: string;
  readonly seriesId?: string;
}

/**
 * A chart's selection: uncontrolled by default, controlled when the caller
 * passes `selected` (the usual React pattern for an input).
 *
 * It also owns focus return: when the detail view closes, focus goes back
 * to the element that opened it, found by its `data-pitchkit-metric` (and
 * `data-pitchkit-series`, when the selection names a series).
 */
export function useDetailSelection<S extends Selection>(
  containerRef: RefObject<HTMLElement | null>,
  selected: S | null | undefined,
  onSelectedChange: ((selection: S | null) => void) | undefined,
): {
  selection: S | null;
  open: (selection: S) => void;
  close: () => void;
} {
  const [internal, setInternal] = useState<S | null>(null);
  const opener = useRef<S | null>(null);
  const selection = selected !== undefined ? selected : internal;

  function set(next: S | null) {
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
 * The detail view a chart swaps itself for: a header with a Back
 * button and the metric's name, then whatever the caller rendered, in the
 * chart's own box so the page doesn't jump.
 *
 * Opening moves focus to the heading, so a screen reader announces where
 * it landed; Escape and Back both close, and `useDetailSelection` returns
 * focus to whatever opened it.
 */
export function DetailView({
  chart,
  title,
  subtitle,
  onClose,
  children,
}: {
  /** Prefixes the `data-pitchkit-part` names, as `radar-detail` and `radar-back`. */
  chart: "radar" | "pizza";
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
      data-pitchkit-part={`${chart}-detail`}
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
          data-pitchkit-part={`${chart}-back`}
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
          // Pushed to the far edge so the values sit opposite the title, not run on from it.
          <span style={{ marginLeft: "auto", fontSize: 12, color: CHART_MUTED }}>{subtitle}</span>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
