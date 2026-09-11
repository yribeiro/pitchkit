import { isActor, isKeeper, isOpponent, isTeammate } from "./predicates.js";
import type {
  StatsBombCarry,
  StatsBombEvent,
  StatsBombGenericEvent,
  StatsBombPass,
  StatsBombShot,
  StatsBombThreeSixtyFrame,
  StatsBombThreeSixtyPlayer,
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

/**
 * Join 360 frames to the events they belong to — `frame.event_uuid` equals
 * the matching `StatsBombEvent.id`. Build this once with the frames array
 * and reuse it via `.get(event.id)`; that's far cheaper than `.find()`-ing
 * the frames array per event when scrubbing through a whole match's worth
 * of them.
 *
 * ```ts
 * const frames = indexThreeSixtyByEvent(await fetchMatchThreeSixty(matchId));
 * const frame = frames.get(event.id); // undefined if this event has no 360 coverage
 * ```
 */
export function indexThreeSixtyByEvent(
  frames: readonly StatsBombThreeSixtyFrame[],
): Map<string, StatsBombThreeSixtyFrame> {
  return new Map(frames.map((frame) => [frame.event_uuid, frame]));
}

/** Every tracked player on the acting player's side, including the actor. */
export function teammatesIn(frame: StatsBombThreeSixtyFrame): StatsBombThreeSixtyPlayer[] {
  return frame.freeze_frame.filter(isTeammate);
}

/** Every tracked player on the other side. */
export function opponentsIn(frame: StatsBombThreeSixtyFrame): StatsBombThreeSixtyPlayer[] {
  return frame.freeze_frame.filter(isOpponent);
}

/**
 * The player who performed the frame's event — undefined only for
 * malformed data, since StatsBomb always marks exactly one actor per frame.
 */
export function actorIn(frame: StatsBombThreeSixtyFrame): StatsBombThreeSixtyPlayer | undefined {
  return frame.freeze_frame.find(isActor);
}

/** The tracked goalkeeper in this frame, if the camera could see one. */
export function keeperIn(frame: StatsBombThreeSixtyFrame): StatsBombThreeSixtyPlayer | undefined {
  return frame.freeze_frame.find(isKeeper);
}

/**
 * `visible_area` as point pairs for a PitchKit `Polygon` layer, rather than
 * StatsBomb's flat `[x0, y0, x1, y1, ...]` encoding.
 */
export function visibleAreaPolygon(
  frame: StatsBombThreeSixtyFrame,
): ReadonlyArray<readonly [number, number]> {
  const points: Array<readonly [number, number]> = [];
  for (let i = 0; i + 1 < frame.visible_area.length; i += 2) {
    const x = frame.visible_area[i];
    const y = frame.visible_area[i + 1];
    if (x !== undefined && y !== undefined) points.push([x, y]);
  }
  return points;
}
