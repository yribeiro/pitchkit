import { DataProviderError } from "../errors.js";
import { fetchJson } from "../fetch-json.js";
import type { LoadOptions } from "../fetch-json.js";
import { fetchText, request } from "../http.js";
import { pitchProjection } from "./coordinates.js";
import {
  parseDynamicEvents,
  parseMatch,
  parseMatches,
  parsePhasesOfPlay,
  parseTracking,
  parseTrackingFrame,
} from "./parse.js";
import type {
  SkillCornerEvent,
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchSummary,
  SkillCornerPhase,
} from "./types.js";

/**
 * Loaders for SkillCorner's open data — 20 A-League 2024/25 matches of
 * broadcast tracking, dynamic events and phases of play.
 *
 * @see https://github.com/SkillCorner/opendata
 *
 * The data is MIT-licensed but SkillCorner ask to be credited; do that in
 * anything you publish from it.
 */

/** Where the small files live. */
export const SKILLCORNER_OPEN_DATA_BASE_URL =
  "https://raw.githubusercontent.com/SkillCorner/opendata/master/data";

/**
 * Where the **tracking** files live — a different host, deliberately.
 *
 * Tracking files are stored with Git LFS, and `raw.githubusercontent.com`
 * serves an LFS *pointer* for those (a ~130-byte text stub naming an oid),
 * not the data. The real bytes come from the `media.` host. This is not a
 * typo: parsing a match's tracking from the raw host fails with "not valid
 * JSON" on a file that looks fine in the browser, which is a miserable thing
 * to debug, so the two are separate constants.
 */
export const SKILLCORNER_LFS_BASE_URL =
  "https://media.githubusercontent.com/media/SkillCorner/opendata/master/data";

export interface SkillCornerLoadOptions extends LoadOptions {
  /** Override for a mirror or a local copy of the repository's `data` dir. */
  readonly baseUrl?: string;
  /** Override for the LFS host serving tracking files. */
  readonly lfsBaseUrl?: string;
}

function base(options: SkillCornerLoadOptions): string {
  return (options.baseUrl ?? SKILLCORNER_OPEN_DATA_BASE_URL).replace(/\/$/, "");
}

function lfsBase(options: SkillCornerLoadOptions): string {
  return (options.lfsBaseUrl ?? options.baseUrl ?? SKILLCORNER_LFS_BASE_URL).replace(/\/$/, "");
}

export function matchesUrl(options: SkillCornerLoadOptions = {}): string {
  return `${base(options)}/matches.json`;
}

export function matchUrl(matchId: number, options: SkillCornerLoadOptions = {}): string {
  return `${base(options)}/matches/${matchId}/${matchId}_match.json`;
}

export function dynamicEventsUrl(matchId: number, options: SkillCornerLoadOptions = {}): string {
  return `${base(options)}/matches/${matchId}/${matchId}_dynamic_events.csv`;
}

export function phasesOfPlayUrl(matchId: number, options: SkillCornerLoadOptions = {}): string {
  return `${base(options)}/matches/${matchId}/${matchId}_phases_of_play.csv`;
}

export function trackingUrl(matchId: number, options: SkillCornerLoadOptions = {}): string {
  return `${lfsBase(options)}/matches/${matchId}/${matchId}_tracking_extrapolated.jsonl`;
}

// ---------------------------------------------------------------------------
// Load from any URL — the primitives
// ---------------------------------------------------------------------------

/**
 * Two tiers, the same split as the StatsBomb module: `loadX(url)` takes any
 * URL — a mirror, your own bucket, a local static server — and is the
 * primitive; `fetchX(id)` is sugar that builds the open-data URL for you.
 *
 * Everything that reads coordinates also takes the `match`, because those are
 * metres from the centre spot and placing them needs that match's own pitch
 * dimensions. Files already on disk don't need any of this — hand their text
 * straight to `parseDynamicEvents` and friends.
 */

/** Fetch and parse a matches index from any URL. */
export async function loadMatches(
  url: string,
  options?: LoadOptions,
): Promise<SkillCornerMatchSummary[]> {
  return parseMatches(await fetchJson(url, options));
}

/** Fetch and parse a match metadata file from any URL. */
export async function loadMatch(url: string, options?: LoadOptions): Promise<SkillCornerMatch> {
  return parseMatch(await fetchJson(url, options));
}

/** Fetch and parse a dynamic-events CSV from any URL. */
export async function loadDynamicEvents(
  url: string,
  match: SkillCornerMatch,
  options?: LoadOptions,
): Promise<SkillCornerEvent[]> {
  return parseDynamicEvents(await fetchText(url, options), match);
}

/** Fetch and parse a phases-of-play CSV from any URL. */
export async function loadPhasesOfPlay(
  url: string,
  match: SkillCornerMatch,
  options?: LoadOptions,
): Promise<SkillCornerPhase[]> {
  return parsePhasesOfPlay(await fetchText(url, options), match);
}

/**
 * Fetch and parse a whole tracking file from any URL (~90 MB upstream).
 *
 * Prefer `streamTrackingFrom` or `loadTrackingWindow` unless you really want
 * every frame in memory at once.
 */
export async function loadTracking(
  url: string,
  match: SkillCornerMatch,
  options?: LoadOptions,
): Promise<SkillCornerFrame[]> {
  return parseTracking(await fetchText(url, options), match);
}

// ---------------------------------------------------------------------------
// The small files
// ---------------------------------------------------------------------------

/** The 20-match index (~7 KB). */
export async function fetchMatches(
  options: SkillCornerLoadOptions = {},
): Promise<SkillCornerMatchSummary[]> {
  return loadMatches(matchesUrl(options), options);
}

/** One match's metadata (~30 KB): lineups, periods, pitch dimensions. */
export async function fetchMatch(
  matchId: number,
  options: SkillCornerLoadOptions = {},
): Promise<SkillCornerMatch> {
  return loadMatch(matchUrl(matchId, options), options);
}

/**
 * A match's dynamic events (~4-5 MB, 322 columns).
 *
 * Takes the `match` because coordinates are metres measured from the centre
 * spot, and turning them into plottable ones needs that match's own pitch
 * dimensions.
 */
export async function fetchDynamicEvents(
  match: SkillCornerMatch,
  options: SkillCornerLoadOptions = {},
): Promise<SkillCornerEvent[]> {
  return loadDynamicEvents(dynamicEventsUrl(match.id, options), match, options);
}

/** A match's phases of play (~110 KB). */
export async function fetchPhasesOfPlay(
  match: SkillCornerMatch,
  options: SkillCornerLoadOptions = {},
): Promise<SkillCornerPhase[]> {
  return loadPhasesOfPlay(phasesOfPlayUrl(match.id, options), match, options);
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/** Roughly how many bytes one frame occupies, measured across a full match. */
const APPROX_BYTES_PER_FRAME = 1400;

/**
 * Stream a match's tracking frames, yielding each as it arrives.
 *
 * A full file is around **90 MB and 60,000 frames** at 10 fps, so this is the
 * default way to read one: the async iterator lets a caller stop early, and
 * `break`ing out aborts the underlying response rather than downloading the
 * rest.
 *
 * ```ts
 * const match = await fetchMatch(1874553);
 * const opening: SkillCornerFrame[] = [];
 * for await (const frame of streamTracking(match)) {
 *   if (frame.period !== null) opening.push(frame);
 *   if (opening.length >= 300) break; // 30 seconds; download stops here
 * }
 * ```
 */
export async function* streamTracking(
  match: SkillCornerMatch,
  options: SkillCornerLoadOptions = {},
): AsyncGenerator<SkillCornerFrame, void, undefined> {
  yield* streamTrackingFrom(trackingUrl(match.id, options), match, options);
}

/**
 * Stream tracking frames from any URL — the primitive `streamTracking` is
 * sugar over.
 *
 * Same contract: `break`ing out of the loop cancels the reader, which aborts
 * the download rather than letting the rest arrive unread.
 */
export async function* streamTrackingFrom(
  url: string,
  match: SkillCornerMatch,
  options: LoadOptions = {},
): AsyncGenerator<SkillCornerFrame, void, undefined> {
  const response = await request(url, options);
  const body = response.body;

  if (!body) {
    // No streaming body (a mocked fetch, or a runtime without WHATWG
    // streams) — fall back to reading it whole rather than failing.
    const text = await response.text();
    yield* parseTracking(text, match);
    return;
  }

  const project = pitchProjection(match);
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffered = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      // Everything up to the final newline is complete lines; whatever
      // follows is a partial frame that the next chunk finishes.
      let newline = buffered.indexOf("\n");
      while (newline !== -1) {
        const line = buffered.slice(0, newline).trim();
        buffered = buffered.slice(newline + 1);
        if (line !== "") yield parseTrackingFrame(JSON.parse(line), project);
        newline = buffered.indexOf("\n");
      }
    }
    const tail = buffered.trim();
    if (tail !== "") yield parseTrackingFrame(JSON.parse(tail), project);
  } finally {
    // Runs on `break` too, which is what stops the download.
    await reader.cancel().catch(() => undefined);
  }
}

export interface TrackingWindowOptions extends SkillCornerLoadOptions {
  /** First frame number wanted (inclusive). */
  readonly fromFrame: number;
  /** Last frame number wanted (inclusive). */
  readonly toFrame: number;
}

/**
 * Read a window of frames without downloading the whole file, using an HTTP
 * `Range` request.
 *
 * JSONL has no index, so a frame number can't be turned into an exact byte
 * offset. Frames are near-uniform in size, so this **estimates** the offset,
 * fetches a padded range around it, discards the partial lines at either end,
 * and then filters to the frames actually asked for. If the estimate lands
 * short the result is simply fewer frames than requested — never wrong ones,
 * since every frame carries its own number.
 *
 * Falls back to a full read when the server ignores the `Range` header (a 200
 * instead of a 206), so it stays correct against hosts without range support.
 */
export async function fetchTrackingWindow(
  match: SkillCornerMatch,
  options: TrackingWindowOptions,
): Promise<SkillCornerFrame[]> {
  return loadTrackingWindow(trackingUrl(match.id, options), match, options);
}

/** Read a window of frames from any URL — the primitive behind `fetchTrackingWindow`. */
export async function loadTrackingWindow(
  url: string,
  match: SkillCornerMatch,
  options: TrackingWindowOptions,
): Promise<SkillCornerFrame[]> {
  const { fromFrame, toFrame } = options;
  if (!Number.isInteger(fromFrame) || !Number.isInteger(toFrame) || toFrame < fromFrame) {
    throw new DataProviderError(
      "schema",
      `A tracking window needs whole frame numbers with toFrame >= fromFrame, got ${String(fromFrame)}..${String(toFrame)}.`,
    );
  }

  // A generous pad either side: enough to absorb the size variation between
  // an empty pre-kickoff frame and a busy one with 22 players.
  const pad = 64 * 1024;
  const start = Math.max(0, fromFrame * APPROX_BYTES_PER_FRAME - pad);
  const end = toFrame * APPROX_BYTES_PER_FRAME + pad;

  const response = await request(url, options, { headers: { Range: `bytes=${start}-${end}` } });
  const text = await response.text();
  const ranged = response.status === 206 && start > 0;

  const project = pitchProjection(match);
  const lines = text.split("\n");
  // A ranged read almost certainly begins mid-line; drop that fragment.
  const usable = ranged ? lines.slice(1) : lines;

  const frames: SkillCornerFrame[] = [];
  for (const line of usable) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      // The trailing fragment of a ranged read. Expected, not an error.
      continue;
    }
    const frame = parseTrackingFrame(json, project);
    if (frame.frame >= fromFrame && frame.frame <= toFrame) frames.push(frame);
  }

  return frames.sort((a, b) => a.frame - b.frame);
}

/**
 * The whole tracking file at once (~90 MB).
 *
 * Here for completeness — server-side batch work, mostly. In a browser prefer
 * `streamTracking` or `fetchTrackingWindow`.
 */
export async function fetchTracking(
  match: SkillCornerMatch,
  options: SkillCornerLoadOptions = {},
): Promise<SkillCornerFrame[]> {
  return loadTracking(trackingUrl(match.id, options), match, options);
}
