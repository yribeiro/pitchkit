import { DataProviderError } from "../errors.js";
import type {
  StatsBombCompetition,
  StatsBombEvent,
  StatsBombLineup,
  StatsBombMatch,
} from "./types.js";

/**
 * Pure parsers: already-loaded JSON in, typed shapes out. No network, so
 * they're the half you use when the JSON is already on disk, in a bundle, or
 * came from your own cache.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Describes what we actually got, for error messages that help. An object of
 * the wrong shape is the common case — someone pasted a matches URL into an
 * events field — so name its keys rather than just saying "object".
 */
function describe(value: unknown): string {
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

function expectArray(json: unknown, what: string): unknown[] {
  if (!Array.isArray(json)) {
    throw new DataProviderError(
      "schema",
      `Expected a StatsBomb ${what} file (a JSON array), but got ${describe(json)}.`,
    );
  }
  return json;
}

/** Reads the leading numbers out of a StatsBomb `location`-style array. */
function coordinatesOf(value: unknown): readonly number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
}

/**
 * Parse a match's events file.
 *
 * Every event is returned as StatsBomb wrote it, **spread** rather than
 * rebuilt — so fields this package doesn't model (and ones StatsBomb adds
 * later) survive untouched. The only additions are the lifted coordinates:
 * `x`/`y` from `location`, and `endX`/`endY`/`endZ` from the `end_location`
 * of a shot, pass or carry.
 *
 * Narrowing the returned union goes through the guards — `shots(events)`,
 * `isShot(event)` — **not** through `event.type.name === "Shot"`. TypeScript
 * only narrows on top-level literal discriminants, and StatsBomb's
 * discriminant is nested one level down inside `type`, so a hand-rolled
 * comparison runs correctly but fails to typecheck.
 */
export function parseEvents(json: unknown): StatsBombEvent[] {
  return expectArray(json, "events").map((row, index) => parseEvent(row, index));
}

function parseEvent(row: unknown, index: number): StatsBombEvent {
  if (!isRecord(row) || typeof row.id !== "string" || !isRecord(row.type)) {
    throw new DataProviderError(
      "schema",
      `events[${index}] is not a StatsBomb event: expected an object with "id" and "type" fields, but got ${describe(row)}. ` +
        `Check the URL points at a match's events file rather than a matches, lineups or competitions file.`,
    );
  }

  const event: Record<string, unknown> = { ...row };

  const [x, y] = coordinatesOf(row.location);
  if (x !== undefined) event.x = x;
  if (y !== undefined) event.y = y;

  // End coordinates are lifted for the three event types this package types
  // explicitly. Anything else keeps its own `end_location` untouched under
  // its sub-object, reachable via the generic event's index signature.
  const detail = row.shot ?? row.pass ?? row.carry;
  if (isRecord(detail)) {
    const [endX, endY, endZ] = coordinatesOf(detail.end_location);
    if (endX !== undefined) event.endX = endX;
    if (endY !== undefined) event.endY = endY;
    // Only present when the shot left the ground — StatsBomb writes a
    // 2-element end location otherwise.
    if (endZ !== undefined) event.endZ = endZ;
  }

  return event as unknown as StatsBombEvent;
}

/**
 * Parse `competitions.json`. Rows are competition **and season** pairs, so
 * the same competition appears once per season of it that is available.
 */
export function parseCompetitions(json: unknown): StatsBombCompetition[] {
  const rows = expectArray(json, "competitions");
  for (const [index, row] of rows.entries()) {
    if (!isRecord(row) || typeof row.competition_id !== "number") {
      throw new DataProviderError(
        "schema",
        `competitions[${index}] is not a StatsBomb competition: expected an object with a numeric "competition_id", but got ${describe(row)}.`,
      );
    }
  }
  return rows as StatsBombCompetition[];
}

/** Parse a `matches/{competition_id}/{season_id}.json` file. */
export function parseMatches(json: unknown): StatsBombMatch[] {
  const rows = expectArray(json, "matches");
  for (const [index, row] of rows.entries()) {
    if (!isRecord(row) || typeof row.match_id !== "number") {
      throw new DataProviderError(
        "schema",
        `matches[${index}] is not a StatsBomb match: expected an object with a numeric "match_id", but got ${describe(row)}.`,
      );
    }
  }
  return rows as StatsBombMatch[];
}

/** Parse a match's `lineups/{match_id}.json` file (one entry per team). */
export function parseLineups(json: unknown): StatsBombLineup[] {
  const rows = expectArray(json, "lineups");
  for (const [index, row] of rows.entries()) {
    if (!isRecord(row) || !Array.isArray(row.lineup)) {
      throw new DataProviderError(
        "schema",
        `lineups[${index}] is not a StatsBomb lineup: expected an object with a "lineup" array, but got ${describe(row)}.`,
      );
    }
  }
  return rows as StatsBombLineup[];
}
