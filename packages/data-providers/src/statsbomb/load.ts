import { fetchJson } from "../fetch-json.js";
import type { LoadOptions } from "../fetch-json.js";
import { parseCompetitions, parseEvents, parseLineups, parseMatches } from "./parse.js";
import type {
  StatsBombCompetition,
  StatsBombEvent,
  StatsBombLineup,
  StatsBombMatch,
} from "./types.js";

/**
 * The network half: fetch a file and parse it in one call.
 *
 * Two tiers. `loadX(url)` takes any URL — a local mirror, your own cache, a
 * file you host — and is the primitive. `fetchX(id)` is sugar that builds the
 * public open-data URL for you, which is what makes a one-liner shot map
 * possible.
 *
 * All of it runs on the global `fetch`, so there are no runtime dependencies,
 * and it works unchanged in a browser, in Node 18+, and in a Server
 * Component. Pass your own `fetch` to wrap it (Next.js caching, a proxy
 * agent, or a stub in tests).
 *
 * **Licensing.** The open-data repo is StatsBomb's, released under their own
 * user agreement, and using it obliges you to credit StatsBomb. This package
 * ships no data of its own — it only fetches from the URL you give it.
 */

/** Raw file root of StatsBomb's public open-data repository. */
export const STATSBOMB_OPEN_DATA_BASE_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data";

export interface StatsBombLoadOptions extends LoadOptions {
  /**
   * Root to build open-data URLs against. Point it at a mirror, a proxy, or
   * a pinned commit instead of `master`.
   */
  readonly baseUrl?: string;
}

function root(options: StatsBombLoadOptions): string {
  return (options.baseUrl ?? STATSBOMB_OPEN_DATA_BASE_URL).replace(/\/+$/, "");
}

/** The open-data URL of one match's events file. */
export function matchEventsUrl(matchId: number, options: StatsBombLoadOptions = {}): string {
  return `${root(options)}/events/${matchId}.json`;
}

/** Fetch and parse an events file from any URL. */
export async function loadEvents(url: string, options?: LoadOptions): Promise<StatsBombEvent[]> {
  return parseEvents(await fetchJson(url, options));
}

/** Fetch and parse a competitions file from any URL. */
export async function loadCompetitions(
  url: string,
  options?: LoadOptions,
): Promise<StatsBombCompetition[]> {
  return parseCompetitions(await fetchJson(url, options));
}

/** Fetch and parse a matches file from any URL. */
export async function loadMatches(url: string, options?: LoadOptions): Promise<StatsBombMatch[]> {
  return parseMatches(await fetchJson(url, options));
}

/** Fetch and parse a lineups file from any URL. */
export async function loadLineups(url: string, options?: LoadOptions): Promise<StatsBombLineup[]> {
  return parseLineups(await fetchJson(url, options));
}

/**
 * Every competition-and-season pair available in open data (80 of them at
 * the time of writing). Each row pairs a `competition_id` with a
 * `season_id`; both are needed to list that season's matches.
 */
export async function fetchCompetitions(
  options: StatsBombLoadOptions = {},
): Promise<StatsBombCompetition[]> {
  return loadCompetitions(`${root(options)}/competitions.json`, options);
}

/** Every match in one season of one competition. */
export async function fetchMatches(
  competitionId: number,
  seasonId: number,
  options: StatsBombLoadOptions = {},
): Promise<StatsBombMatch[]> {
  return loadMatches(`${root(options)}/matches/${competitionId}/${seasonId}.json`, options);
}

/**
 * Every event in one match.
 *
 * These files are large — a typical match is around 3 MB — so prefer
 * fetching once and caching, and expect a visible wait on a cold load.
 */
export async function fetchMatchEvents(
  matchId: number,
  options: StatsBombLoadOptions = {},
): Promise<StatsBombEvent[]> {
  return loadEvents(matchEventsUrl(matchId, options), options);
}

/** Both teams' lineups for one match. */
export async function fetchLineups(
  matchId: number,
  options: StatsBombLoadOptions = {},
): Promise<StatsBombLineup[]> {
  return loadLineups(`${root(options)}/lineups/${matchId}.json`, options);
}
