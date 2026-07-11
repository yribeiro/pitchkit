import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Measures a ref'd element's content box, updating on resize via
 * ResizeObserver. This is the mechanism behind <Pitch>'s "responsive by
 * default" behaviour (PRD §8.6) — no `responsive` prop, just no
 * width/height.
 *
 * Returns `null` until the first measurement (SSR, or before mount) —
 * callers render a fallback (or nothing) until a size is available.
 */
export function useResizeObserver<T extends Element>(): [RefObject<T | null>, Size | null] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
