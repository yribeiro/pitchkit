import { parse as parseCsv } from "csv-parse/browser/esm/sync";
import { DataProviderError } from "../errors.js";
import type { MetricaEvent, MetricaFrame, MetricaPoint, MetricaTrackedPlayer } from "./types.js";

/**
 * Pure parsers: already-loaded CSV text in, typed shapes out. No network, so
 * these are the half you use when the files are already on disk.
 */

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

/**
 * Metrica write a missing number as the literal `NaN` and a missing string as
 * an empty cell. Both become `null`: `NaN` is not something a caller should
 * have to remember to test for with `Number.isNaN`.
 */
function num(value: string | undefined): number | null {
  if (value === undefined || value === "" || value === "NaN") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function str(value: string | undefined): string | null {
  return value === undefined || value === "" ? null : value;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** The columns of `RawEventsData.csv`, in the file's own order. */
const EVENT_NUMBER_COLUMNS = [
  "Period",
  "Start Frame",
  "Start Time [s]",
  "End Frame",
  "End Time [s]",
  "Start X",
  "Start Y",
  "End X",
  "End Y",
] as const;

const EVENT_STRING_COLUMNS = ["Team", "Type", "Subtype", "From", "To"] as const;

/**
 * Parse a `RawEventsData.csv` file.
 *
 * Each row keeps Metrica's headers as its keys, with numbers as numbers and
 * every `NaN` or empty cell as `null`. Columns this package doesn't know about
 * pass through as strings. The only additions are `x`/`y`/`endX`/`endY`,
 * present only where the position is.
 */
export function parseEvents(csv: string): MetricaEvent[] {
  if (typeof csv !== "string" || csv.trim() === "") {
    throw new DataProviderError("schema", "Expected a Metrica events CSV, but got no text.");
  }

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(csv, {
      columns: true,
      skipEmptyLines: true,
      cast: false,
      relaxColumnCount: true,
    }) as Record<string, string>[];
  } catch (cause) {
    throw new DataProviderError("parse", "Could not read the Metrica events CSV.", { cause });
  }

  const first = rows[0];
  if (first && !("Type" in first && "Start Frame" in first)) {
    throw new DataProviderError(
      "schema",
      `Expected a Metrica events CSV with "Type" and "Start Frame" columns, but the header is ` +
        `${Object.keys(first).slice(0, 4).join(", ")}. Check the URL points at a RawEventsData ` +
        `file rather than a tracking file.`,
    );
  }

  return rows.map((row) => {
    const event: Record<string, unknown> = { ...row };
    for (const column of EVENT_STRING_COLUMNS) event[column] = str(row[column]);
    for (const column of EVENT_NUMBER_COLUMNS) event[column] = num(row[column]);

    const startX = event["Start X"];
    const startY = event["Start Y"];
    if (typeof startX === "number" && typeof startY === "number") {
      event.x = startX;
      event.y = startY;
    }
    const endX = event["End X"];
    const endY = event["End Y"];
    if (typeof endX === "number" && typeof endY === "number") {
      event.endX = endX;
      event.endY = endY;
    }
    return event as unknown as MetricaEvent;
  });
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/**
 * Where each player's columns sit in one team's tracking file.
 *
 * The file opens with three header rows. Row one names the team over each
 * player's x column, row two the jersey number, and row three the player
 * (`Player11`), with the y column always the next one along and left blank.
 * The ball's pair comes last, under `Ball`.
 */
export interface TrackingLayout {
  readonly players: readonly {
    readonly column: number;
    readonly team: string;
    readonly player: string;
    readonly jersey: number | null;
  }[];
  /** The ball's x column, or `-1` if the file has none. */
  readonly ballColumn: number;
  readonly columnCount: number;
}

/** The number of header rows a tracking file opens with. */
export const TRACKING_HEADER_ROWS = 3;

/**
 * Tracking files are split on commas directly rather than through csv-parse:
 * they are about 145,000 rows of numbers each, never quoted, and a full CSV
 * parser costs several times as long for no gain.
 */
function cells(line: string): string[] {
  return line.replace(/\r$/, "").split(",");
}

/** Read the three header rows of one team's tracking file. */
export function parseTrackingLayout(headerRows: readonly string[]): TrackingLayout {
  const [teams, jerseys, names] = headerRows.map(cells);
  if (!teams || !jerseys || !names || names[0] !== "Period" || names[1] !== "Frame") {
    throw new DataProviderError(
      "schema",
      `Expected a Metrica tracking CSV, whose third header row starts "Period,Frame,Time [s]", ` +
        `but got ${JSON.stringify(headerRows[TRACKING_HEADER_ROWS - 1]?.slice(0, 40) ?? "")}. ` +
        `Check the URL points at a RawTrackingData file rather than an events file.`,
    );
  }

  const players: TrackingLayout["players"][number][] = [];
  let ballColumn = -1;
  for (let column = 3; column < names.length; column += 2) {
    const name = names[column];
    if (name === undefined || name === "") continue;
    if (name === "Ball") {
      ballColumn = column;
      continue;
    }
    players.push({
      column,
      team: teams[column] ?? "",
      player: name,
      jersey: num(jerseys[column]),
    });
  }
  return { players, ballColumn, columnCount: names.length };
}

/** One team's half of a frame, before the two files are merged. */
export interface TeamFrame {
  readonly Period: number;
  readonly Frame: number;
  readonly "Time [s]": number;
  readonly ball: MetricaPoint | null;
  readonly players: MetricaTrackedPlayer[];
}

function point(x: string | undefined, y: string | undefined): MetricaPoint | null {
  const px = num(x);
  const py = num(y);
  return px === null || py === null ? null : { x: px, y: py };
}

/**
 * Parse one data row of a team's tracking file, or return `null` if the line
 * is not a complete row (blank, or the cut-off end of a ranged read).
 */
export function parseTrackingRow(line: string, layout: TrackingLayout): TeamFrame | null {
  const row = cells(line);
  if (row.length < layout.columnCount) return null;

  const period = num(row[0]);
  const frame = num(row[1]);
  const time = num(row[2]);
  if (period === null || frame === null || time === null) return null;

  const players: MetricaTrackedPlayer[] = [];
  for (const slot of layout.players) {
    const at = point(row[slot.column], row[slot.column + 1]);
    if (at) {
      players.push({ team: slot.team, player: slot.player, jersey: slot.jersey, ...at });
    }
  }
  const ball =
    layout.ballColumn === -1 ? null : point(row[layout.ballColumn], row[layout.ballColumn + 1]);

  return { Period: period, Frame: frame, "Time [s]": time, ball, players };
}

/**
 * Join the two teams' halves of one frame.
 *
 * The files are row-aligned, so a mismatch means two files from different
 * games, or a ranged read that went wrong. Either way the result would be
 * nonsense, so it throws rather than guessing.
 */
export function mergeTeamFrames(home: TeamFrame, away: TeamFrame): MetricaFrame {
  if (home.Frame !== away.Frame) {
    throw new DataProviderError(
      "schema",
      `The two Metrica tracking files are out of step: frame ${home.Frame} in one, ` +
        `${away.Frame} in the other. Check both URLs are for the same game.`,
    );
  }
  return {
    Period: home.Period,
    Frame: home.Frame,
    "Time [s]": home["Time [s]"],
    // Both files carry the same ball columns; take whichever has it.
    ball: home.ball ?? away.ball,
    players: [...home.players, ...away.players],
  };
}

function parseTeamTracking(csv: string, which: string): TeamFrame[] {
  if (typeof csv !== "string" || csv.trim() === "") {
    throw new DataProviderError(
      "schema",
      `Expected the ${which} team's Metrica tracking CSV, but got no text.`,
    );
  }
  const lines = csv.split("\n");
  const layout = parseTrackingLayout(lines.slice(0, TRACKING_HEADER_ROWS));
  const frames: TeamFrame[] = [];
  for (let i = TRACKING_HEADER_ROWS; i < lines.length; i++) {
    const frame = parseTrackingRow(lines[i] ?? "", layout);
    if (frame) frames.push(frame);
  }
  return frames;
}

/**
 * Parse a game's two tracking files into merged frames.
 *
 * A whole file is about 32 MB and 145,000 frames, so this holds a lot in
 * memory. In a browser, `streamTracking` or `fetchTrackingWindow` are usually
 * the better fit.
 */
export function parseTracking(homeCsv: string, awayCsv: string): MetricaFrame[] {
  const home = parseTeamTracking(homeCsv, "home");
  const away = parseTeamTracking(awayCsv, "away");
  if (home.length !== away.length) {
    throw new DataProviderError(
      "schema",
      `The two Metrica tracking files have different lengths (${home.length} and ${away.length} ` +
        `frames). Check both are complete and for the same game.`,
    );
  }
  return home.map((frame, i) => mergeTeamFrames(frame, away[i] as TeamFrame));
}
