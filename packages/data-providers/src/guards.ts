/**
 * Shape checks the providers' parsers share. Internal: not exported from the
 * package entry points.
 */

/** A plain object: not `null`, and not an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Describes what we actually got, for error messages that help. An object of
 * the wrong shape is the common case — someone pasted a matches URL into an
 * events field — so name its keys rather than just saying "object".
 */
export function describe(value: unknown): string {
  if (Array.isArray(value)) return `an array of ${value.length}`;
  if (value === null) return "null";
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return "an empty object";
    const shown = keys.slice(0, 4).join(", ");
    return `an object with keys: ${shown}${keys.length > 4 ? ", ..." : ""}`;
  }
  return typeof value;
}
