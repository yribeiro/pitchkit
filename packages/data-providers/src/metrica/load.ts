import { DataProviderError } from "../errors.js";
import type { LoadOptions } from "../fetch-json.js";
import { fetchText, request, streamLines } from "../http.js";
import {
  mergeTeamFrames,
  parseEvents,
  parseTracking,
  parseTrackingLayout,
  parseTrackingRow,
  TRACKING_HEADER_ROWS,
} from "./parse.js";
import type { TeamFrame, TrackingLayout } from "./parse.js";
import type { MetricaEvent, MetricaFrame } from "./types.js";

/**
 * Loaders for Metrica Sports' sample data: two anonymised games of
 * synchronised tracking (25 fps) and event data, published as CSV.
 *
 * @see https://github.com/metrica-sports/sample-data
 *
 * Metrica ask that anything public made from the data acknowledges them as
 * the source. The repository carries no licence file.
 */

/** Where the sample games live. Served with CORS and `Range` support. */
export const METRICA_SAMPLE_DATA_BASE_URL =
  "https://raw.githubusercontent.com/metrica-sports/sample-data/master/data";

/**
 * The games these loaders read. Sample Game 3 is in a different format (FIFA
 * EPTS tracking with XML metadata, and JSON events) and isn't supported.
 */
export const METRICA_SAMPLE_GAMES = [1, 2] as const;

export interface MetricaLoadOptions extends LoadOptions {
  /** Override for a mirror or a local copy of the repository's `data` dir. */
  readonly baseUrl?: string;
}

/** A game's two tracking files, one per team. */
export interface MetricaTrackingUrls {
  readonly home: string;
  readonly away: string;
}

function base(options: MetricaLoadOptions): string {
  return (options.baseUrl ?? METRICA_SAMPLE_DATA_BASE_URL).replace(/\/$/, "");
}

function gameDir(game: number, options: MetricaLoadOptions): string {
  return `${base(options)}/Sample_Game_${game}/Sample_Game_${game}`;
}

export function eventsUrl(game: number, options: MetricaLoadOptions = {}): string {
  return `${gameDir(game, options)}_RawEventsData.csv`;
}

export function trackingUrls(game: number, options: MetricaLoadOptions = {}): MetricaTrackingUrls {
  const dir = gameDir(game, options);
  return {
    home: `${dir}_RawTrackingData_Home_Team.csv`,
    away: `${dir}_RawTrackingData_Away_Team.csv`,
  };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Fetch and parse an events CSV from any URL. */
export async function loadEvents(url: string, options?: LoadOptions): Promise<MetricaEvent[]> {
  return parseEvents(await fetchText(url, options));
}

/** A sample game's events (about 150 KB, under 2,000 rows). */
export async function fetchEvents(
  game: number,
  options: MetricaLoadOptions = {},
): Promise<MetricaEvent[]> {
  return loadEvents(eventsUrl(game, options), options);
}

// ---------------------------------------------------------------------------
// Tracking: whole files
// ---------------------------------------------------------------------------

/**
 * Fetch and parse a game's two tracking files from any URLs, all at once.
 *
 * Each is around 32 MB, so prefer `streamTrackingFrom` or
 * `loadTrackingWindow` unless you want every frame in memory.
 */
export async function loadTracking(
  urls: MetricaTrackingUrls,
  options?: LoadOptions,
): Promise<MetricaFrame[]> {
  const [home, away] = await Promise.all([
    fetchText(urls.home, options),
    fetchText(urls.away, options),
  ]);
  return parseTracking(home, away);
}

/**
 * A sample game's whole tracking data: two files of about 32 MB each, and
 * roughly 145,000 frames. Server-side batch work, mostly; in a browser prefer
 * `streamTracking` or `fetchTrackingWindow`.
 */
export async function fetchTracking(
  game: number,
  options: MetricaLoadOptions = {},
): Promise<MetricaFrame[]> {
  return loadTracking(trackingUrls(game, options), options);
}

// ---------------------------------------------------------------------------
// Tracking: streamed
// ---------------------------------------------------------------------------

/**
 * Stream a sample game's tracking frames, both teams merged, yielding each as
 * it arrives.
 *
 * The two teams' files are read side by side, a row from each per frame.
 * `break`ing out of the loop cancels both downloads.
 *
 * ```ts
 * const opening: MetricaFrame[] = [];
 * for await (const frame of streamTracking(1)) {
 *   opening.push(frame);
 *   if (opening.length >= 250) break; // ten seconds; both downloads stop here
 * }
 * ```
 */
export async function* streamTracking(
  game: number,
  options: MetricaLoadOptions = {},
): AsyncGenerator<MetricaFrame, void, undefined> {
  yield* streamTrackingFrom(trackingUrls(game, options), options);
}

async function readLayout(
  lines: AsyncGenerator<string, void, undefined>,
  url: string,
): Promise<TrackingLayout> {
  const header: string[] = [];
  while (header.length < TRACKING_HEADER_ROWS) {
    const next = await lines.next();
    if (next.done) {
      throw new DataProviderError("schema", `${url} ended inside its header rows.`, { url });
    }
    header.push(next.value);
  }
  return parseTrackingLayout(header);
}

async function nextRow(
  lines: AsyncGenerator<string, void, undefined>,
  layout: TrackingLayout,
): Promise<TeamFrame | null> {
  for (;;) {
    const next = await lines.next();
    if (next.done) return null;
    const row = parseTrackingRow(next.value, layout);
    if (row) return row;
  }
}

/**
 * Stream merged tracking frames from any pair of URLs: the primitive
 * `streamTracking` is sugar over.
 */
export async function* streamTrackingFrom(
  urls: MetricaTrackingUrls,
  options: LoadOptions = {},
): AsyncGenerator<MetricaFrame, void, undefined> {
  const [homeResponse, awayResponse] = await Promise.all([
    request(urls.home, options),
    request(urls.away, options),
  ]);
  const home = streamLines(homeResponse);
  const away = streamLines(awayResponse);

  try {
    const [homeLayout, awayLayout] = await Promise.all([
      readLayout(home, urls.home),
      readLayout(away, urls.away),
    ]);
    for (;;) {
      const [homeRow, awayRow] = await Promise.all([
        nextRow(home, homeLayout),
        nextRow(away, awayLayout),
      ]);
      if (!homeRow && !awayRow) return;
      if (!homeRow || !awayRow) {
        throw new DataProviderError(
          "schema",
          `One Metrica tracking file ended before the other. Check both URLs are for the same game.`,
        );
      }
      yield mergeTeamFrames(homeRow, awayRow);
    }
  } finally {
    // `return()` runs each line reader's own `finally`, which cancels its
    // download. Both, whichever way this generator ends.
    await Promise.all([home.return(undefined), away.return(undefined)]);
  }
}

// ---------------------------------------------------------------------------
// Tracking: a window of frames
// ---------------------------------------------------------------------------

export interface TrackingWindowOptions extends MetricaLoadOptions {
  /** First frame wanted (inclusive). Frames are numbered from 1. */
  readonly fromFrame: number;
  /** Last frame wanted (inclusive). */
  readonly toFrame: number;
}

/**
 * How the window search sizes its requests. Internal, and only a parameter so
 * the tests can exercise the correction path on a small fixture.
 */
export interface WindowTuning {
  /** Bytes read before the estimated start and after the estimated end. */
  readonly padBytes: number;
  /** Requests allowed for the window itself, after the two probes. */
  readonly maxAttempts: number;
}

const DEFAULT_TUNING: WindowTuning = {
  // Measured: in a whole sample file, a frame's actual offset strays at most
  // 80 KB from the uniform estimate, because a substitute's columns are
  // `NaN,NaN` until they come on.
  padBytes: 128 * 1024,
  maxAttempts: 4,
};

const HEADER_PROBE_BYTES = 4096;
const TAIL_PROBE_BYTES = 2048;
const encoder = new TextEncoder();

function byteLength(text: string): number {
  return encoder.encode(text).length;
}

function totalBytes(response: Response): number | null {
  const match = /\/(\d+)\s*$/.exec(response.headers.get("Content-Range") ?? "");
  return match ? Number(match[1]) : null;
}

function rowsInRange(
  lines: readonly string[],
  layout: TrackingLayout,
  fromFrame: number,
  toFrame: number,
): TeamFrame[] {
  const rows: TeamFrame[] = [];
  for (const line of lines) {
    const row = parseTrackingRow(line, layout);
    if (row && row.Frame >= fromFrame && row.Frame <= toFrame) rows.push(row);
  }
  return rows;
}

/**
 * One team's rows for a window of frames, read with `Range` requests.
 *
 * A CSV has no index, so the start offset is estimated. Two small probes
 * first: the head, for the column layout and where the data starts, and the
 * tail, for the last frame number. Together with the file's size those give
 * the average bytes per frame, and an estimate that lands within the padding.
 * If a read still misses the window's edges, the next one is moved by what
 * the last one measured, which on a well-formed file converges at once.
 */
async function readTeamWindow(
  url: string,
  fromFrame: number,
  toFrame: number,
  options: LoadOptions,
  tuning: WindowTuning,
): Promise<TeamFrame[]> {
  const [head, tail] = await Promise.all([
    request(url, options, { headers: { Range: `bytes=0-${HEADER_PROBE_BYTES - 1}` } }),
    request(url, options, { headers: { Range: `bytes=-${TAIL_PROBE_BYTES}` } }),
  ]);
  const headText = await head.text();
  const headLines = headText.split("\n");
  const layout = parseTrackingLayout(headLines.slice(0, TRACKING_HEADER_ROWS));

  // A host that ignores `Range` sends the whole file back with a 200. That is
  // the answer already, so read it rather than failing.
  const total = totalBytes(head);
  if (head.status !== 206 || total === null) {
    await tail.body?.cancel().catch(() => undefined);
    return rowsInRange(headLines.slice(TRACKING_HEADER_ROWS), layout, fromFrame, toFrame);
  }

  const dataStart = byteLength(headLines.slice(0, TRACKING_HEADER_ROWS).join("\n")) + 1;
  const tailLines = (await tail.text()).split("\n").slice(1);
  let lastFrame = 0;
  for (const line of tailLines) {
    const row = parseTrackingRow(line, layout);
    if (row) lastFrame = row.Frame;
  }
  if (lastFrame === 0 || fromFrame > lastFrame) return [];

  const bytesPerFrame = (total - dataStart) / lastFrame;
  let start = Math.max(
    dataStart,
    Math.floor(dataStart + (fromFrame - 1) * bytesPerFrame) - tuning.padBytes,
  );
  let end = Math.min(total - 1, Math.ceil(dataStart + toFrame * bytesPerFrame) + tuning.padBytes);

  let rows: TeamFrame[] = [];
  for (let attempt = 0; attempt < tuning.maxAttempts; attempt++) {
    const response = await request(url, options, { headers: { Range: `bytes=${start}-${end}` } });
    const text = await response.text();
    const lines = text.split("\n");
    // A ranged read usually begins and ends mid-row. Drop both fragments: a
    // row cut inside its last number would otherwise parse, slightly wrong.
    if (start > dataStart) lines.shift();
    if (end < total - 1 && !text.endsWith("\n")) lines.pop();

    const parsed: TeamFrame[] = [];
    for (const line of lines) {
      const row = parseTrackingRow(line, layout);
      if (row) parsed.push(row);
    }
    rows = parsed.filter((row) => row.Frame >= fromFrame && row.Frame <= toFrame);

    const first = parsed[0];
    const last = parsed[parsed.length - 1];
    if (!first || !last) {
      // Nothing usable at all: widen both ways and try again.
      start = Math.max(dataStart, start - tuning.padBytes);
      end = Math.min(total - 1, end + tuning.padBytes);
      continue;
    }
    const measured = parsed.length > 1 ? byteLength(text) / parsed.length : bytesPerFrame;
    const missesStart = first.Frame > fromFrame && start > dataStart;
    const missesEnd = last.Frame < toFrame && end < total - 1;
    if (!missesStart && !missesEnd) break;
    if (missesStart) {
      start = Math.max(
        dataStart,
        Math.floor(start - (first.Frame - fromFrame) * measured) - tuning.padBytes,
      );
    }
    if (missesEnd) {
      end = Math.min(
        total - 1,
        Math.ceil(end + (toFrame - last.Frame) * measured) + tuning.padBytes,
      );
    }
    // A start that overshot past the window entirely also lands here: the
    // first frame read is after `toFrame`, so `missesStart` moves it back.
  }
  return rows;
}

/**
 * Read a window of a sample game's frames without downloading either whole
 * file, using HTTP `Range` requests.
 *
 * Ten seconds of play is 250 frames. Reading them costs a few hundred KB,
 * most of it padding around the estimate, against 65 MB for the whole game.
 *
 * ```ts
 * const goal = shots(await fetchEvents(1)).find(isGoal)!;
 * const frames = await fetchTrackingWindow(1, {
 *   fromFrame: goal["Start Frame"] - 125,
 *   toFrame: goal["End Frame"],
 * });
 * ```
 *
 * If the host ignores `Range` and sends a whole file back, that file is read
 * instead, so the result is the same, only slower.
 */
export async function fetchTrackingWindow(
  game: number,
  options: TrackingWindowOptions,
): Promise<MetricaFrame[]> {
  return loadTrackingWindow(trackingUrls(game, options), options);
}

/** Read a window of frames from any pair of URLs: the primitive behind `fetchTrackingWindow`. */
export async function loadTrackingWindow(
  urls: MetricaTrackingUrls,
  options: TrackingWindowOptions,
  tuning: WindowTuning = DEFAULT_TUNING,
): Promise<MetricaFrame[]> {
  const { fromFrame, toFrame } = options;
  if (!Number.isInteger(fromFrame) || !Number.isInteger(toFrame) || toFrame < fromFrame) {
    throw new DataProviderError(
      "schema",
      `A tracking window needs whole frame numbers with toFrame >= fromFrame, got ${String(fromFrame)}..${String(toFrame)}.`,
    );
  }

  const [home, away] = await Promise.all([
    readTeamWindow(urls.home, fromFrame, toFrame, options, tuning),
    readTeamWindow(urls.away, fromFrame, toFrame, options, tuning),
  ]);
  const awayByFrame = new Map(away.map((row) => [row.Frame, row]));
  const frames: MetricaFrame[] = [];
  for (const row of home) {
    const other = awayByFrame.get(row.Frame);
    if (other) frames.push(mergeTeamFrames(row, other));
  }
  return frames;
}
