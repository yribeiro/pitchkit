import type { CSSProperties } from "react";

/**
 * Converts a `"prop: value; prop2: value2;"` CSS string (core's
 * `partStyle()` format, used as-is by the DOM renderer's
 * `setAttribute("style", ...)`) into the camelCase object React's `style`
 * prop requires. React DOM rejects a raw string for `style` — this is the
 * one place that difference has to be bridged, so both renderers can keep
 * consuming the exact same `partStyle()` string without core's API
 * changing shape for React's sake.
 *
 * Only handles simple `prop: value` declarations (no nested at-rules,
 * comments, or `!important`) — that's all `partStyle()` ever produces.
 */
export function parseStyleString(css: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of css.split(";")) {
    const trimmed = declaration.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;
    const prop = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    const camelProp = prop.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    style[camelProp] = value;
  }
  return style as CSSProperties;
}
