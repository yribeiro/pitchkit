import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { CHART_MUTED, CHART_TEXT, GRID } from "./chart-tokens.js";
import type { PolarSelection } from "./polar-types.js";

/**
 * Selection state that is uncontrolled by default and controlled when the
 * caller passes `selected`, the usual React pattern for an input.
 */
export function usePolarSelection(
  selected: PolarSelection | null | undefined,
  onSelectedChange: ((selection: PolarSelection | null) => void) | undefined,
): [PolarSelection | null, (selection: PolarSelection | null) => void] {
  const [internal, setInternal] = useState<PolarSelection | null>(null);
  const isControlled = selected !== undefined;

  function set(selection: PolarSelection | null) {
    if (!isControlled) setInternal(selection);
    onSelectedChange?.(selection);
  }

  return [isControlled ? selected : internal, set];
}

/**
 * The detail view a polar chart swaps itself for: a header with a Back
 * button and the metric's name, then whatever the caller rendered, in the
 * chart's own box so the page doesn't jump.
 *
 * Opening moves focus to the heading, so a screen reader announces where
 * it landed; Escape and Back both close. The chart restores focus to the
 * label or slice that opened it.
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
        <h3 ref={headingRef} tabIndex={-1} style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
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
