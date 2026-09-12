import { parse as parseCsv } from "csv-parse/browser/esm/sync";
import { DataProviderError } from "../errors.js";
import { pitchProjection, projectOrNull } from "./coordinates.js";
import type { PitchProjection } from "./coordinates.js";
import type {
  SkillCornerEvent,
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchSummary,
  SkillCornerPhase,
  SkillCornerTrackedPlayer,
} from "./types.js";

/**
 * Pure parsers: already-loaded text or JSON in, typed shapes out. No network,
 * so these are the half you use when the files are already on disk, bundled,
 * or came from your own cache.
 *
 * Every row is returned **spread** rather than rebuilt, so columns this
 * package doesn't model — and ones SkillCorner adds later — survive untouched.
 * The only additions are the corner-origin `pitch*` coordinates.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Describes what we actually got, for error messages that help. */
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

// ---------------------------------------------------------------------------
// CSV cell coercion
// ---------------------------------------------------------------------------

/**
 * SkillCorner's CSVs write missing values as an empty cell, and booleans as
 * Python's `True`/`False`. Everything arrives as a string, so each typed field
 * is coerced explicitly — a blanket "looks numeric" pass would turn ids and
 * `time_start` values like `"00:01.9"` into the wrong thing.
 */
function str(row: Record<string, string>, key: string): string | null {
  const value = row[key];
  return value === undefined || value === "" ? null : value;
}

function num(row: Record<string, string>, key: string): number | null {
  const value = row[key];
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(row: Record<string, string>, key: string): boolean | null {
  const value = row[key];
  if (value === undefined || value === "") return null;
  if (value === "True" || value === "true") return true;
  if (value === "False" || value === "false") return false;
  return null;
}

function readCsv(text: string, what: string): Record<string, string>[] {
  if (typeof text !== "string" || text.trim() === "") {
    throw new DataProviderError("schema", `Expected a SkillCorner ${what} CSV, but got no text.`);
  }
  try {
    return parseCsv(text, {
      columns: true,
      skipEmptyLines: true,
      // Leave every cell a string; the coercion above is per-column and
      // deliberate, and `cast: true` would mangle ids and timestamps.
      cast: false,
      relaxColumnCount: true,
    }) as Record<string, string>[];
  } catch (cause) {
    throw new DataProviderError("parse", `Could not read the SkillCorner ${what} CSV.`, { cause });
  }
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

/** Parse the top-level `matches.json` index. */
export function parseMatches(json: unknown): SkillCornerMatchSummary[] {
  if (!Array.isArray(json)) {
    throw new DataProviderError(
      "schema",
      `Expected SkillCorner's matches index (a JSON array), but got ${describe(json)}.`,
    );
  }
  return json.map((row, index) => {
    if (!isRecord(row) || typeof row.id !== "number") {
      throw new DataProviderError(
        "schema",
        `matches[${index}] is not a SkillCorner match summary: expected an object with a numeric "id", but got ${describe(row)}.`,
      );
    }
    return row as unknown as SkillCornerMatchSummary;
  });
}

/** Parse a match metadata file. */
export function parseMatch(json: unknown): SkillCornerMatch {
  if (!isRecord(json) || typeof json.id !== "number") {
    throw new DataProviderError(
      "schema",
      `Expected a SkillCorner match file (an object with a numeric "id"), but got ${describe(json)}. ` +
        `Check the URL points at {id}_match.json rather than the matches index.`,
    );
  }
  if (typeof json.pitch_length !== "number" || typeof json.pitch_width !== "number") {
    throw new DataProviderError(
      "schema",
      `SkillCorner match ${String(json.id)} has no pitch_length/pitch_width. ` +
        `Those dimensions are required to place coordinates, which are metres from the centre spot.`,
    );
  }
  return json as unknown as SkillCornerMatch;
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/**
 * Parse one line of a tracking file.
 *
 * Exported because the streaming loaders parse line by line, and because a
 * caller reading the file their own way shouldn't have to reimplement this.
 */
export function parseTrackingFrame(json: unknown, project: PitchProjection): SkillCornerFrame {
  if (!isRecord(json) || typeof json.frame !== "number") {
    throw new DataProviderError(
      "schema",
      `Not a SkillCorner tracking frame: expected an object with a numeric "frame", but got ${describe(json)}.`,
    );
  }

  const ball = isRecord(json.ball_data) ? json.ball_data : {};
  const ballX = typeof ball.x === "number" ? ball.x : null;
  const ballY = typeof ball.y === "number" ? ball.y : null;
  const [ballPitchX, ballPitchY] = projectOrNull(project, ballX, ballY);

  const players: SkillCornerTrackedPlayer[] = [];
  if (Array.isArray(json.player_data)) {
    for (const entry of json.player_data) {
      if (!isRecord(entry)) continue;
      if (typeof entry.x !== "number" || typeof entry.y !== "number") continue;
      const [pitchX, pitchY] = project(entry.x, entry.y);
      players.push({ ...entry, pitchX, pitchY } as unknown as SkillCornerTrackedPlayer);
    }
  }

  return {
    ...json,
    ball_data: { x: ballX, y: ballY, z: null, is_detected: null, ...ball },
    player_data: players,
    ballPitchX,
    ballPitchY,
  } as unknown as SkillCornerFrame;
}

/**
 * Parse a whole tracking file (JSONL — one frame per line).
 *
 * A full match is roughly **90 MB and 60,000 frames**, so prefer
 * `streamTracking` or `fetchTrackingWindow` unless you genuinely want all of
 * it in memory at once.
 */
export function parseTracking(text: string, match: SkillCornerMatch): SkillCornerFrame[] {
  const project = pitchProjection(match);
  const frames: SkillCornerFrame[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    frames.push(parseTrackingFrame(parseJsonLine(trimmed), project));
  }
  return frames;
}

function parseJsonLine(line: string): unknown {
  try {
    return JSON.parse(line);
  } catch (cause) {
    throw new DataProviderError(
      "parse",
      `A tracking line was not valid JSON. SkillCorner tracking files are JSONL — one frame per line — ` +
        `so a truncated read (a byte range that cut a line in half) shows up exactly like this.`,
      { cause },
    );
  }
}

// ---------------------------------------------------------------------------
// Dynamic events
// ---------------------------------------------------------------------------

/** Parse a match's dynamic-events CSV. */
export function parseDynamicEvents(text: string, match: SkillCornerMatch): SkillCornerEvent[] {
  const project = pitchProjection(match);
  return readCsv(text, "dynamic events").map((row) => {
    const [pitchX, pitchY] = projectOrNull(project, num(row, "x_start"), num(row, "y_start"));
    const [pitchEndX, pitchEndY] = projectOrNull(project, num(row, "x_end"), num(row, "y_end"));

    return {
      ...row,
      event_id: row.event_id ?? "",
      index: num(row, "index") ?? 0,
      match_id: num(row, "match_id") ?? match.id,
      event_type: row.event_type ?? "",
      event_subtype: str(row, "event_subtype"),

      frame_start: num(row, "frame_start") ?? 0,
      frame_end: num(row, "frame_end"),
      time_start: str(row, "time_start"),
      time_end: str(row, "time_end"),
      minute_start: num(row, "minute_start"),
      second_start: num(row, "second_start"),
      duration: num(row, "duration"),
      period: num(row, "period"),

      team_id: num(row, "team_id"),
      team_shortname: str(row, "team_shortname"),
      attacking_side: str(row, "attacking_side"),
      player_id: num(row, "player_id"),
      player_name: str(row, "player_name"),
      player_position: str(row, "player_position"),

      x_start: num(row, "x_start"),
      y_start: num(row, "y_start"),
      x_end: num(row, "x_end"),
      y_end: num(row, "y_end"),
      channel_start: str(row, "channel_start"),
      third_start: str(row, "third_start"),
      channel_end: str(row, "channel_end"),
      third_end: str(row, "third_end"),
      penalty_area_start: bool(row, "penalty_area_start"),
      penalty_area_end: bool(row, "penalty_area_end"),

      pitchX,
      pitchY,
      pitchEndX,
      pitchEndY,

      phase_index: num(row, "phase_index"),
      lead_to_shot: bool(row, "lead_to_shot"),
      lead_to_goal: bool(row, "lead_to_goal"),
      xthreat: num(row, "xthreat"),

      // Per-type fields. Harmless on rows that don't carry the column —
      // they coerce to null — and it keeps the narrowed types honest.
      carry: bool(row, "carry"),
      one_touch: bool(row, "one_touch"),
      is_header: bool(row, "is_header"),
      pass_outcome: str(row, "pass_outcome"),
      pass_distance: num(row, "pass_distance"),
      pass_angle: num(row, "pass_angle"),
      targeted: bool(row, "targeted"),
      received: bool(row, "received"),
      dangerous: bool(row, "dangerous"),
      difficult_pass_target: bool(row, "difficult_pass_target"),
      xpass_completion: num(row, "xpass_completion"),
      distance_covered: num(row, "distance_covered"),
      speed_avg: num(row, "speed_avg"),
      speed_avg_band: str(row, "speed_avg_band"),
      break_defensive_line: bool(row, "break_defensive_line"),
      intended_run_behind: bool(row, "intended_run_behind"),
      interplayer_distance: num(row, "interplayer_distance"),
      pressing_chain: bool(row, "pressing_chain"),
      angle_of_engagement: num(row, "angle_of_engagement"),
    } as unknown as SkillCornerEvent;
  });
}

// ---------------------------------------------------------------------------
// Phases of play
// ---------------------------------------------------------------------------

/** Parse a match's phases-of-play CSV. */
export function parsePhasesOfPlay(text: string, match: SkillCornerMatch): SkillCornerPhase[] {
  return readCsv(text, "phases of play").map((row) => ({
    ...row,
    index: num(row, "index") ?? 0,
    match_id: num(row, "match_id") ?? match.id,
    frame_start: num(row, "frame_start") ?? 0,
    frame_end: num(row, "frame_end") ?? 0,
    time_start: str(row, "time_start"),
    time_end: str(row, "time_end"),
    minute_start: num(row, "minute_start"),
    second_start: num(row, "second_start"),
    duration: num(row, "duration"),
    period: num(row, "period"),
    attacking_side: str(row, "attacking_side"),
    team_in_possession_id: num(row, "team_in_possession_id"),
    team_in_possession_shortname: str(row, "team_in_possession_shortname"),
    team_in_possession_phase_type: str(row, "team_in_possession_phase_type"),
    team_out_of_possession_phase_type: str(row, "team_out_of_possession_phase_type"),
    team_possession_lead_to_shot: bool(row, "team_possession_lead_to_shot"),
    team_possession_lead_to_goal: bool(row, "team_possession_lead_to_goal"),
    x_start: num(row, "x_start"),
    y_start: num(row, "y_start"),
    x_end: num(row, "x_end"),
    y_end: num(row, "y_end"),
    team_in_possession_width_start: num(row, "team_in_possession_width_start"),
    team_in_possession_length_start: num(row, "team_in_possession_length_start"),
  })) as unknown as SkillCornerPhase[];
}
