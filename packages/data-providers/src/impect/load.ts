import { fetchJson } from "../fetch-json.js";
import type { LoadOptions } from "../fetch-json.js";
import {
  parseEvents,
  parseIterations,
  parseLineups,
  parseMatches,
  parsePlayers,
  parseSquads,
} from "./parse.js";
import type {
  ImpectEvent,
  ImpectIteration,
  ImpectLineups,
  ImpectMatchSummary,
  ImpectPlayer,
  ImpectSquad,
} from "./types.js";

/**
 * The network half: fetch a file and parse it in one call.
 *
 * Two tiers, as elsewhere in this package. `loadX(url)` takes any URL — a
 * local copy, your own cache — and is the primitive. `fetchX(...)` is sugar
 * that builds the open-data URL for you.
 *
 * **Licensing.** Impect's open data is not under an open licence. Their
 * terms grant non-commercial, analytical and research use only, forbid
 * redistributing or altering the data, and require Impect to be credited,
 * with their logo, in anything published from it. This package ships none of
 * it: every loader fetches from Impect's own repository when you call it.
 * Read the terms before you build on it.
 *
 * @see https://github.com/ImpectAPI/open-data/blob/main/LICENSE.pdf
 */

/** Where Impect's open data lives. Served with CORS, so it loads in a browser. */
export const IMPECT_OPEN_DATA_BASE_URL =
  "https://raw.githubusercontent.com/ImpectAPI/open-data/main/data";

/** The one iteration in the open data: Bundesliga 2023/24. */
export const IMPECT_BUNDESLIGA_2023_24 = 743;

export interface ImpectLoadOptions extends LoadOptions {
  /** Override for a local copy of the repository's `data` directory. */
  readonly baseUrl?: string;
}

function base(options: ImpectLoadOptions): string {
  return (options.baseUrl ?? IMPECT_OPEN_DATA_BASE_URL).replace(/\/+$/, "");
}

export function iterationsUrl(options: ImpectLoadOptions = {}): string {
  return `${base(options)}/iterations.json`;
}

export function matchesUrl(iterationId: number, options: ImpectLoadOptions = {}): string {
  return `${base(options)}/matches/matches_${iterationId}.json`;
}

export function squadsUrl(iterationId: number, options: ImpectLoadOptions = {}): string {
  return `${base(options)}/squads/squads_${iterationId}.json`;
}

export function playersUrl(iterationId: number, options: ImpectLoadOptions = {}): string {
  return `${base(options)}/players/players_${iterationId}.json`;
}

/** URL of one match's events. About 5-6 MB. */
export function eventsUrl(matchId: number, options: ImpectLoadOptions = {}): string {
  return `${base(options)}/events/events_${matchId}.json`;
}

export function lineupsUrl(matchId: number, options: ImpectLoadOptions = {}): string {
  return `${base(options)}/lineups/lineups_${matchId}.json`;
}

// ---------------------------------------------------------------------------
// Load from any URL — the primitives
// ---------------------------------------------------------------------------

export async function loadIterations(
  url: string,
  options?: LoadOptions,
): Promise<ImpectIteration[]> {
  return parseIterations(await fetchJson(url, options));
}

export async function loadMatches(
  url: string,
  options?: LoadOptions,
): Promise<ImpectMatchSummary[]> {
  return parseMatches(await fetchJson(url, options));
}

export async function loadSquads(url: string, options?: LoadOptions): Promise<ImpectSquad[]> {
  return parseSquads(await fetchJson(url, options));
}

export async function loadPlayers(url: string, options?: LoadOptions): Promise<ImpectPlayer[]> {
  return parsePlayers(await fetchJson(url, options));
}

export async function loadMatchEvents(url: string, options?: LoadOptions): Promise<ImpectEvent[]> {
  return parseEvents(await fetchJson(url, options));
}

export async function loadLineups(url: string, options?: LoadOptions): Promise<ImpectLineups> {
  return parseLineups(await fetchJson(url, options));
}

// ---------------------------------------------------------------------------
// The open data
// ---------------------------------------------------------------------------

/** The competition seasons in the open data (one, under 1 KB). */
export async function fetchIterations(options: ImpectLoadOptions = {}): Promise<ImpectIteration[]> {
  return loadIterations(iterationsUrl(options), options);
}

/**
 * Every match in an iteration: 306 for the Bundesliga, about 180 KB. Pass
 * `IMPECT_BUNDESLIGA_2023_24`. Scores aren't included.
 */
export async function fetchMatches(
  iterationId: number,
  options: ImpectLoadOptions = {},
): Promise<ImpectMatchSummary[]> {
  return loadMatches(matchesUrl(iterationId, options), options);
}

/** The iteration's clubs, which events name by `squadId`. About 10 KB. */
export async function fetchSquads(
  iterationId: number,
  options: ImpectLoadOptions = {},
): Promise<ImpectSquad[]> {
  return loadSquads(squadsUrl(iterationId, options), options);
}

/** The iteration's players, which events name by `player.id`. About 340 KB. */
export async function fetchPlayers(
  iterationId: number,
  options: ImpectLoadOptions = {},
): Promise<ImpectPlayer[]> {
  return loadPlayers(playersUrl(iterationId, options), options);
}

/**
 * One match's events: about 3,000 of them, and 5-6 MB. Fetch once and keep
 * them; don't call this per render.
 */
export async function fetchMatchEvents(
  matchId: number,
  options: ImpectLoadOptions = {},
): Promise<ImpectEvent[]> {
  return loadMatchEvents(eventsUrl(matchId, options), options);
}

/** One match's lineups, substitutions and formations. About 17 KB. */
export async function fetchLineups(
  matchId: number,
  options: ImpectLoadOptions = {},
): Promise<ImpectLineups> {
  return loadLineups(lineupsUrl(matchId, options), options);
}
