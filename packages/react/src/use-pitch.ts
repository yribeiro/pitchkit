import { usePitchContext } from "./context.js";
import type { PitchContextValue } from "./context.js";

/**
 * Imperative escape hatch: returns the enclosing `<Pitch>`/`<VerticalPitch>`'s
 * dimensions, viewport, and pixel transform. Must be called from a
 * descendant of `<Pitch>` — for advanced cases (custom marks, manual
 * coordinate math) that the built-in layer components don't cover.
 */
export function usePitch(): Pick<PitchContextValue, "dimensions" | "viewport" | "transform"> {
  const { dimensions, viewport, transform } = usePitchContext();
  return { dimensions, viewport, transform };
}
