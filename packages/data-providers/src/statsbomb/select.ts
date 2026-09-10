import type {
  StatsBombCarry,
  StatsBombEvent,
  StatsBombGenericEvent,
  StatsBombPass,
  StatsBombShot,
} from "./types.js";

/**
 * Type guards and selectors — the kloppy-style "give me the shots" accessors,
 * and **the only way to narrow** a `StatsBombEvent`.
 *
 * StatsBomb's discriminant lives one level down, in `type.name`, and
 * TypeScript only narrows unions on *top-level* literal discriminants. So
 * this compiles but does not narrow:
 *
 * ```ts
 * if (event.type.name === "Shot") {
 *   event.shot.statsbomb_xg; // ✗ Property 'shot' does not exist on type 'StatsBombEvent'
 * }
 * ```
 *
 * and this is the equivalent that does:
 *
 * ```ts
 * if (isShot(event)) {
 *   event.shot.statsbomb_xg; // ✓
 * }
 * ```
 *
 * Renaming the discriminant to a top-level field would fix the narrowing, but
 * only by inventing a field StatsBomb doesn't have — which this package
 * deliberately doesn't do.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Guards check the sub-object is really there, not just that the type name
 * matches, so a narrowed event is never lying about what it carries.
 */
function hasDetail(event: StatsBombEvent, typeName: string, key: string): boolean {
  return event.type.name === typeName && isRecord((event as StatsBombGenericEvent)[key]);
}

export function isShot(event: StatsBombEvent): event is StatsBombShot {
  return hasDetail(event, "Shot", "shot");
}

export function isPass(event: StatsBombEvent): event is StatsBombPass {
  return hasDetail(event, "Pass", "pass");
}

export function isCarry(event: StatsBombEvent): event is StatsBombCarry {
  return hasDetail(event, "Carry", "carry");
}

/** Every shot in the feed, narrowed. */
export function shots(events: readonly StatsBombEvent[]): StatsBombShot[] {
  return events.filter(isShot);
}

/** Every pass in the feed, narrowed — completed and not. See `isComplete`. */
export function passes(events: readonly StatsBombEvent[]): StatsBombPass[] {
  return events.filter(isPass);
}

/** Every carry in the feed, narrowed. */
export function carries(events: readonly StatsBombEvent[]): StatsBombCarry[] {
  return events.filter(isCarry);
}

/**
 * Escape hatch for the event types this package doesn't model explicitly —
 * `ofType(events, "Duel")`, `ofType(events, "Goal Keeper")`, and so on.
 *
 * The result is typed as a generic event, whose index signature reaches the
 * type-specific sub-object (`duel`, `goalkeeper`, ...) as `unknown`. Nothing
 * in a feed is ever unreachable; it just isn't typed for you.
 */
export function ofType(
  events: readonly StatsBombEvent[],
  typeName: string,
): StatsBombGenericEvent[] {
  return events.filter((event) => event.type.name === typeName) as StatsBombGenericEvent[];
}
