import { fetchJson } from "../fetch-json.js";
import type { LoadOptions } from "../fetch-json.js";
import { parseCompetitions, parseMatch, parseTeams } from "./parse.js";
import type {
  WyscoutCompetition,
  WyscoutEvent,
  WyscoutMatch,
  WyscoutTeam,
} from "./types.js";

/**
 * The network half: fetch a file and parse it in one call.
 *
 * Two tiers, as elsewhere in this package. `loadX(url)` takes any URL — a
 * local mirror, your own cache, a file you host — and is the primitive.
 * `fetchX(...)` is sugar that builds the open-data URL for you.
 *
 * **Two hosts, on purpose.** Wyscout's open data is published on figshare as
 * the Pappalardo et al. dataset, where the small reference files are plain
 * JSON but the events are a single 77 MB `events.zip` covering all 1,941
 * matches — not something a browser can open. Per-match event files come
 * instead from a mirror that splits that archive by `matchId` without
 * renaming a field, so the data is Wyscout's own either way. Reference data
 * is fetched from figshare directly, because there a first-party source is
 * one request away.
 *
 * **Licensing.** The dataset is CC BY 4.0 and asks to be cited as Pappalardo
 * et al., *A public data set of spatio-temporal match events in soccer
 * competitions* (Scientific Data, 2019). This package ships no data of its
 * own — it only fetches from the URL you give it.
 */

/** Per-match event files, split out of the official archive by `matchId`. */
export const WYSCOUT_EVENTS_BASE_URL =
  "https://raw.githubusercontent.com/koenvo/wyscout-soccer-match-event-dataset/main/processed/files";

/** figshare's file endpoint, where the official reference files live. */
export const WYSCOUT_REFERENCE_BASE_URL = "https://ndownloader.figshare.com/files";

/**
 * figshare addresses files by an opaque numeric id rather than by name, so
 * the id cannot be derived from the filename and has to be recorded.
 */
export const WYSCOUT_REFERENCE_FILE_IDS = {
  competitions: "15073685",
  teams: "15073697",
  players: "15073721",
  coaches: "15073868",
  referees: "15074030",
} as const;

export type WyscoutReferenceFile = keyof typeof WYSCOUT_REFERENCE_FILE_IDS;

export interface WyscoutLoadOptions extends LoadOptions {
  /** Root to build per-match event URLs against. Point it at your own mirror. */
  readonly baseUrl?: string;
  /** Root for the figshare reference files. Falls back to `baseUrl` if unset. */
  readonly referenceBaseUrl?: string;
}

function eventsRoot(options: WyscoutLoadOptions): string {
  return (options.baseUrl ?? WYSCOUT_EVENTS_BASE_URL).replace(/\/+$/, "");
}

function referenceRoot(options: WyscoutLoadOptions): string {
  return (options.referenceBaseUrl ?? options.baseUrl ?? WYSCOUT_REFERENCE_BASE_URL).replace(
    /\/+$/,
    "",
  );
}

/** URL of one match's event file. ~480 KB. */
export function matchUrl(matchId: number, options: WyscoutLoadOptions = {}): string {
  return `${eventsRoot(options)}/${matchId}.json`;
}

/** URL of one of figshare's reference files. */
export function referenceUrl(
  file: WyscoutReferenceFile,
  options: WyscoutLoadOptions = {},
): string {
  return `${referenceRoot(options)}/${WYSCOUT_REFERENCE_FILE_IDS[file]}`;
}

/** Parses a match file from any URL. */
export async function loadMatch(url: string, options?: LoadOptions): Promise<WyscoutMatch> {
  return parseMatch(await fetchJson(url, options));
}

/** Parses just the events out of a match file at any URL. */
export async function loadMatchEvents(
  url: string,
  options?: LoadOptions,
): Promise<readonly WyscoutEvent[]> {
  return (await loadMatch(url, options)).events;
}

export async function loadCompetitions(
  url: string,
  options?: LoadOptions,
): Promise<WyscoutCompetition[]> {
  return parseCompetitions(await fetchJson(url, options));
}

export async function loadTeams(url: string, options?: LoadOptions): Promise<WyscoutTeam[]> {
  return parseTeams(await fetchJson(url, options));
}

/**
 * A whole match — events, both teams, and their squads — in one call.
 *
 * ~480 KB. The teams and players travel with the events, so there is no
 * second request to label a chart.
 */
export async function fetchMatch(
  matchId: number,
  options: WyscoutLoadOptions = {},
): Promise<WyscoutMatch> {
  return loadMatch(matchUrl(matchId, options), options);
}

/** Just the events, for when the squads aren't needed. */
export async function fetchMatchEvents(
  matchId: number,
  options: WyscoutLoadOptions = {},
): Promise<readonly WyscoutEvent[]> {
  return loadMatchEvents(matchUrl(matchId, options), options);
}

/** The seven competitions the dataset covers. ~1 KB, straight from figshare. */
export async function fetchCompetitions(
  options: WyscoutLoadOptions = {},
): Promise<WyscoutCompetition[]> {
  return loadCompetitions(referenceUrl("competitions", options), options);
}

/** Every team in the dataset. ~27 KB. */
export async function fetchTeams(options: WyscoutLoadOptions = {}): Promise<WyscoutTeam[]> {
  return loadTeams(referenceUrl("teams", options), options);
}
