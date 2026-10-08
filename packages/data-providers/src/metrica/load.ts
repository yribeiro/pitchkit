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
  /** Bytes read from the start of the file, for the layout and a first estimate. */
  readonly headBytes: number;
  /** Bytes read before the estimated start and after the estimated end. */
  readonly padBytes: number;
  /** Requests allowed for the window itself, after the head. */
  readonly maxAttempts: number;
}

const DEFAULT_TUNING: WindowTuning = {
  // Room for the three header rows and about 70 data rows.
  headBytes: 16 * 1024,
  // Measured: estimating from the first rows alone lands up to 440 KB short
  // late in a file, because a substitute's columns are `NaN,NaN` until they
  // come on and rows grow. No affordable padding covers that, so the first
  // read is allowed to miss: it measures where it landed, and the next read,
  // interpolated from that, is within a few rows. The padding only has to
  // cover those.
  padBytes: 8 * 1024,
  maxAttempts: 8,
};

const encoder = new TextEncoder();

function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/** A row's frame number and the byte offset its line starts at. */
interface Anchor {
  readonly frame: number;
  readonly offset: number;
}

interface RangeRead {
  readonly text: string;
  /** False when the host ignored `Range` and sent the whole file. */
  readonly ranged: boolean;
}

/**
 * GET one byte range, or `null` if it starts past the end of the file (416).
 *
 * Only the `bytes=start-end` form, and nothing read from the response but its
 * status and body. Both are deliberate, for browsers: GitHub's raw host sends
 * no `Access-Control-Expose-Headers`, so `Content-Range` reads as `null` from
 * script, and a suffix range (`bytes=-2048`) is not CORS-safelisted, so it
 * triggers a preflight that the host answers with a 403.
 */
async function readRange(
  url: string,
  start: number,
  end: number,
  options: LoadOptions,
): Promise<RangeRead | null> {
  try {
    const response = await request(url, options, { headers: { Range: `bytes=${start}-${end}` } });
    return { text: await response.text(), ranged: response.status === 206 };
  } catch (error) {
    if (error instanceof DataProviderError && error.status === 416) return null;
    throw error;
  }
}

/**
 * The complete rows in a ranged read, with each row's byte offset.
 *
 * A read usually begins and ends mid-row. The leading fragment is dropped,
 * and so is the trailing one unless the read stopped at the end of the file:
 * a row cut inside its last number would otherwise parse, slightly wrong.
 */
function rowsOf(
  text: string,
  start: number,
  requested: number,
  layout: TrackingLayout,
  dataStart: number,
): { rows: TeamFrame[]; anchors: Anchor[]; atEnd: boolean } {
  const lines = text.split("\n");
  const atEnd = byteLength(text) < requested;
  let offset = start;
  const rows: TeamFrame[] = [];
  const anchors: Anchor[] = [];
  lines.forEach((line, i) => {
    const lineStart = offset;
    offset += byteLength(line) + 1;
    if (i === 0 && start > dataStart) return;
    if (i === lines.length - 1 && !atEnd) return;
    const row = parseTrackingRow(line, layout);
    if (row) {
      rows.push(row);
      anchors.push({ frame: row.Frame, offset: lineStart });
    }
  });
  return { rows, anchors, atEnd };
}

/**
 * Where a frame's row should start, from the anchors measured so far:
 * interpolated between the two either side of it, or extrapolated from the
 * last two before it.
 */
function estimateOffset(anchors: readonly Anchor[], frame: number): number {
  let below: Anchor | undefined;
  let above: Anchor | undefined;
  for (const anchor of anchors) {
    if (anchor.frame <= frame && (!below || anchor.frame > below.frame)) below = anchor;
    if (anchor.frame >= frame && (!above || anchor.frame < above.frame)) above = anchor;
  }
  if (below && above && above.frame > below.frame) {
    const rate = (above.offset - below.offset) / (above.frame - below.frame);
    return below.offset + (frame - below.frame) * rate;
  }
  const near = below ?? above;
  if (!near) return 0;
  // Extrapolate at the rate between the anchor nearest the frame and the one
  // furthest from it, the widest baseline available.
  const far = anchors.reduce((a, b) =>
    Math.abs(b.frame - near.frame) > Math.abs(a.frame - near.frame) ? b : a,
  );
  if (far.frame === near.frame) return near.offset;
  const rate = (near.offset - far.offset) / (near.frame - far.frame);
  return near.offset + (frame - near.frame) * rate;
}

/**
 * One team's rows for a window of frames, read with `Range` requests.
 *
 * A CSV has no index, so the window's offset is estimated. The head of the
 * file gives the column layout and a first rate in bytes per frame. Each read
 * after that records where its rows actually start, and the next estimate
 * interpolates between those measured points. On the sample files the second
 * read lands; where it can't (a jump in frame numbering), bisection does.
 */
async function readTeamWindow(
  url: string,
  fromFrame: number,
  toFrame: number,
  options: LoadOptions,
  tuning: WindowTuning,
): Promise<TeamFrame[]> {
  const head = await readRange(url, 0, tuning.headBytes - 1, options);
  if (!head) return [];
  const headLines = head.text.split("\n");
  const layout = parseTrackingLayout(headLines.slice(0, TRACKING_HEADER_ROWS));
  const inWindow = (row: TeamFrame) => row.Frame >= fromFrame && row.Frame <= toFrame;

  // A host that ignores `Range` sends the whole file back with a 200. That is
  // the answer already, so read it rather than failing.
  if (!head.ranged) {
    return headLines
      .slice(TRACKING_HEADER_ROWS)
      .map((line) => parseTrackingRow(line, layout))
      .filter((row): row is TeamFrame => row !== null && inWindow(row));
  }

  const dataStart = byteLength(headLines.slice(0, TRACKING_HEADER_ROWS).join("\n")) + 1;
  const first = rowsOf(head.text, 0, tuning.headBytes, layout, dataStart);
  const anchors = [...first.anchors];
  const lastInHead = first.rows[first.rows.length - 1];
  if (first.atEnd || (lastInHead && lastInHead.Frame >= toFrame)) {
    return first.rows.filter(inWindow);
  }

  // The first byte offset known to be past the end of the file.
  let pastEnd = Number.POSITIVE_INFINITY;
  // Interpolation is right first time on a well-formed file, but a jump in
  // frame numbering defeats it, so after a miss the next read bisects the
  // bracket instead. Alternating keeps the speed of one and the guarantee of
  // the other.
  let bisect = false;
  let rows: TeamFrame[] = [];
  for (let attempt = 0; attempt < tuning.maxAttempts; attempt++) {
    let lo = dataStart;
    let hi = pastEnd;
    for (const anchor of anchors) {
      if (anchor.frame < fromFrame) lo = Math.max(lo, anchor.offset);
      if (anchor.frame > fromFrame) hi = Math.min(hi, anchor.offset);
    }
    const guess =
      bisect && Number.isFinite(hi) ? (lo + hi) / 2 : estimateOffset(anchors, fromFrame);
    const target = Math.min(Math.max(guess, lo), Number.isFinite(hi) ? hi - 1 : guess);
    const start = Math.max(dataStart, Math.floor(target) - tuning.padBytes);
    const span = Math.max(estimateOffset(anchors, toFrame + 1) - target, 0);
    const end = start + Math.ceil(span) + 2 * tuning.padBytes;

    const read = await readRange(url, start, end, options);
    if (!read) {
      pastEnd = Math.min(pastEnd, start);
      bisect = true;
      continue;
    }
    const got = rowsOf(read.text, start, end - start + 1, layout, dataStart);
    anchors.push(...got.anchors);
    rows = got.rows.filter(inWindow);

    const firstRow = got.rows[0];
    const lastRow = got.rows[got.rows.length - 1];
    const coversStart =
      start === dataStart || (firstRow !== undefined && firstRow.Frame <= fromFrame);
    const coversEnd = got.atEnd || (lastRow !== undefined && lastRow.Frame >= toFrame);
    if (coversStart && coversEnd) break;
    bisect = !bisect;
  }
  return rows;
}

/**
 * Read a window of a sample game's frames without downloading either whole
 * file, using HTTP `Range` requests.
 *
 * Six seconds around a goal is 150 frames. Measured against GitHub, reading
 * them takes about six requests and 220 KB, against 65 MB for the whole game.
 * Only plain `bytes=start-end` ranges are sent and no response header is
 * read, so it works cross-origin in a browser too.
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
): Promise<MetricaFrame[]> {
  return readTrackingWindow(urls, options, DEFAULT_TUNING);
}

/** `loadTrackingWindow` with its request sizing exposed. Internal; for the tests. */
export async function readTrackingWindow(
  urls: MetricaTrackingUrls,
  options: TrackingWindowOptions,
  tuning: WindowTuning,
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
