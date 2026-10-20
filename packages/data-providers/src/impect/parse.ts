import { DataProviderError } from "../errors.js";
import type {
  ImpectEvent,
  ImpectIteration,
  ImpectLineups,
  ImpectMatchSummary,
  ImpectPlayer,
  ImpectSquad,
} from "./types.js";

/**
 * Pure parsers: already-loaded JSON in, typed shapes out. No network, so
 * these are the half you use when the files are already on disk.
 *
 * Rows are passed through as Impect wrote them. Only events are walked, to
 * lift their coordinates.
 */

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

/**
 * Checks a file is an array of objects carrying `required`, naming the file
 * it should have been when it isn't.
 */
function expectRows<T>(
  json: unknown,
  what: string,
  one: string,
  required: string,
  hint: string,
): T[] {
  if (!Array.isArray(json)) {
    throw new DataProviderError(
      "schema",
      `Expected an array of Impect ${what}, but got ${describe(json)}. ${hint}`,
    );
  }
  return json.map((row, index) => {
    if (!isRecord(row) || !(required in row)) {
      throw new DataProviderError(
        "schema",
        `${what}[${index}] is not an Impect ${one}: expected an object with ` +
          `"${required}", but got ${describe(row)}. ${hint}`,
      );
    }
    return row as T;
  });
}

/** Parses `iterations.json`, the list of competition seasons. */
export function parseIterations(json: unknown): ImpectIteration[] {
  return expectRows(
    json,
    "iterations",
    "iteration",
    "season",
    "Check the URL points at iterations.json.",
  );
}

/** Parses a `matches_{iterationId}.json` file. */
export function parseMatches(json: unknown): ImpectMatchSummary[] {
  return expectRows(
    json,
    "matches",
    "match",
    "homeSquadId",
    "Check the URL points at matches/matches_{iterationId}.json.",
  );
}

/** Parses a `squads_{iterationId}.json` file. */
export function parseSquads(json: unknown): ImpectSquad[] {
  return expectRows(
    json,
    "squads",
    "squad",
    "name",
    "Check the URL points at squads/squads_{iterationId}.json.",
  );
}

/** Parses a `players_{iterationId}.json` file. */
export function parsePlayers(json: unknown): ImpectPlayer[] {
  return expectRows(
    json,
    "players",
    "player",
    "commonname",
    "Check the URL points at players/players_{iterationId}.json.",
  );
}

/** Parses a `lineups_{matchId}.json` file. */
export function parseLineups(json: unknown): ImpectLineups {
  if (!isRecord(json) || !isRecord(json.squadHome) || !isRecord(json.squadAway)) {
    throw new DataProviderError(
      "schema",
      `Expected an Impect lineups file with "squadHome" and "squadAway", but got ` +
        `${describe(json)}. Check the URL points at lineups/lineups_{matchId}.json.`,
    );
  }
  return json as unknown as ImpectLineups;
}

function adjusted(location: unknown): { x: number; y: number } | undefined {
  if (!isRecord(location) || !isRecord(location.adjCoordinates)) return undefined;
  const { x, y } = location.adjCoordinates;
  if (typeof x !== "number" || typeof y !== "number") return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

/**
 * Parses an `events_{matchId}.json` file.
 *
 * Every event keeps all of Impect's fields. The lifted `x`/`y`/`endX`/`endY`
 * are the **adjusted** coordinates, where the acting team attacks towards
 * `+x` in both halves, because that is what a shot or pass map wants. The
 * absolute ones stay at `start.coordinates` and `end.coordinates`.
 */
export function parseEvents(json: unknown): ImpectEvent[] {
  const rows = expectRows<Record<string, unknown>>(
    json,
    "events",
    "event",
    "actionType",
    "Check the URL points at events/events_{matchId}.json.",
  );
  return rows.map((row) => {
    const event: Record<string, unknown> = { ...row };
    const start = adjusted(row.start);
    if (start) {
      event.x = start.x;
      event.y = start.y;
    }
    const end = adjusted(row.end);
    if (end) {
      event.endX = end.x;
      event.endY = end.y;
    }
    return event as unknown as ImpectEvent;
  });
}
