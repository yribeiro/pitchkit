import { DataProviderError } from "../errors.js";
import type {
  WyscoutCompetition,
  WyscoutEvent,
  WyscoutMatch,
  WyscoutMatchPlayer,
  WyscoutPosition,
  WyscoutTeam,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Describes what actually arrived, for an error message worth reading. */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `an array of ${value.length}`;
  if (isRecord(value)) {
    const keys = Object.keys(value).slice(0, 4);
    return keys.length > 0 ? `an object with keys ${keys.join(", ")}` : "an empty object";
  }
  return typeof value;
}

function expectArray(json: unknown, what: string): unknown[] {
  if (!Array.isArray(json)) {
    throw new DataProviderError(
      "schema",
      `Expected an array of ${what}, but got ${describe(json)}.`,
    );
  }
  return json;
}

/**
 * Event types whose second position is never a real location.
 *
 * Verified across six matches (9,765 events): a `Shot` carried a sentinel end
 * in 148 of 148 cases, `Interruption` in 348 of 348, `Offside` in 32 of 32 —
 * while a `Pass` carried a real one in 5,077 of 5,127. Wyscout records where a
 * shot *went* in its goal-mouth tags (1201-1223), not in a coordinate, so
 * lifting `endX`/`endY` here would put every shot on a corner flag.
 *
 * Deliberately keyed on the event type rather than on the value: `(100, 100)`
 * is a sentinel for a goal kick and a genuine position for a corner, so no
 * value-based test can separate them.
 */
const NO_END_LOCATION: ReadonlySet<string> = new Set(["Shot", "Interruption", "Offside"]);

function parsePosition(value: unknown): WyscoutPosition | undefined {
  if (!isRecord(value)) return undefined;
  const { x, y } = value;
  if (typeof x !== "number" || typeof y !== "number") return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

function parseEvent(row: unknown, index: number): WyscoutEvent {
  if (!isRecord(row) || typeof row.id !== "number" || typeof row.eventName !== "string") {
    throw new DataProviderError(
      "schema",
      `events[${index}] is not a Wyscout event: expected an object with "id" and "eventName" ` +
        `fields, but got ${describe(row)}. Check the URL points at a match file rather than a ` +
        `competitions, teams or players file.`,
    );
  }

  const positions = Array.isArray(row.positions)
    ? row.positions.map(parsePosition).filter((p): p is WyscoutPosition => p !== undefined)
    : [];

  const event: Record<string, unknown> = { ...row, positions };

  const start = positions[0];
  if (start) {
    event.x = start.x;
    event.y = start.y;
  }

  const end = positions[1];
  if (end && !NO_END_LOCATION.has(row.eventName)) {
    event.endX = end.x;
    event.endY = end.y;
  }

  return event as unknown as WyscoutEvent;
}

/** Parses an array of raw event objects. Pure — no network. */
export function parseEvents(json: unknown): WyscoutEvent[] {
  return expectArray(json, "Wyscout events").map(parseEvent);
}

/**
 * Parses a whole per-match file: `{ events, teams, players }`.
 *
 * Teams and players are passed through as-is; only the events are walked, to
 * lift their coordinates.
 */
export function parseMatch(json: unknown): WyscoutMatch {
  if (!isRecord(json) || !Array.isArray(json.events)) {
    throw new DataProviderError(
      "schema",
      `Expected a Wyscout match file with an "events" array, but got ${describe(json)}. ` +
        `Check the URL points at a per-match file rather than the competitions or players index.`,
    );
  }

  return {
    events: parseEvents(json.events),
    teams: isRecord(json.teams) ? (json.teams as WyscoutMatch["teams"]) : {},
    players: isRecord(json.players) ? (json.players as WyscoutMatch["players"]) : {},
  };
}

export function parseCompetitions(json: unknown): WyscoutCompetition[] {
  return expectArray(json, "Wyscout competitions").map((row, index) => {
    if (!isRecord(row) || typeof row.wyId !== "number") {
      throw new DataProviderError(
        "schema",
        `competitions[${index}] is not a Wyscout competition: expected an object with a ` +
          `"wyId" field, but got ${describe(row)}.`,
      );
    }
    return row as unknown as WyscoutCompetition;
  });
}

export function parseTeams(json: unknown): WyscoutTeam[] {
  return expectArray(json, "Wyscout teams").map((row, index) => {
    if (!isRecord(row) || typeof row.wyId !== "number") {
      throw new DataProviderError(
        "schema",
        `teams[${index}] is not a Wyscout team: expected an object with a "wyId" field, ` +
          `but got ${describe(row)}.`,
      );
    }
    return row as unknown as WyscoutTeam;
  });
}

/**
 * Parses a team's squad list out of a per-match file's `players` map.
 *
 * Entries that aren't `{ playerId, player }` pairs are dropped rather than
 * throwing: a squad list is labelling, and losing one substitute should not
 * cost you the match.
 */
export function parseMatchPlayers(json: unknown): WyscoutMatchPlayer[] {
  return expectArray(json, "Wyscout squad entries").filter(
    (row): row is WyscoutMatchPlayer => isRecord(row) && typeof row.playerId === "number",
  );
}
