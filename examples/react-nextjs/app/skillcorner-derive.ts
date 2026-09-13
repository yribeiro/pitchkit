import { indexPlayersById } from "@pitchkit/data-providers/skillcorner";
import type {
  SkillCornerEvent,
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchPlayer,
  SkillCornerMatchSummary,
  SkillCornerTrackedPlayer,
} from "@pitchkit/data-providers/skillcorner";

/**
 * App-local derivations for the SkillCorner demo — this demo's presentation
 * logic, deliberately kept out of `@pitchkit/data-providers`.
 *
 * This file used to carry `toUefaX`/`toUefaY`, which squashed a match's real
 * pitch onto UEFA's fixed 105x68 so `<Pitch type=\"uefa\">` could draw it.
 * `<Pitch type=\"skillcorner\">` now takes SkillCorner's own centre-origin
 * metres directly, so the fudge is gone rather than promoted.
 */

export function matchLabel(match: SkillCornerMatchSummary): string {
  return `${match.home_team.short_name} v ${match.away_team.short_name}`;
}

/** `"00:43:32.00"` → `"43:32"`, dropping the hours and hundredths. */
export function clockLabel(frame: SkillCornerFrame): string {
  const stamp = frame.timestamp;
  if (stamp === null) return "--:--";
  const parts = stamp.split(":");
  if (parts.length < 3) return stamp;
  const minutes = parts[1] ?? "00";
  const seconds = (parts[2] ?? "00").split(".")[0] ?? "00";
  return `${minutes}:${seconds}`;
}

export interface ClipPlayer extends SkillCornerTrackedPlayer {
  readonly player: SkillCornerMatchPlayer | undefined;
  readonly isHome: boolean;
}

// ---------------------------------------------------------------------------
// Dynamic events along the clip
// ---------------------------------------------------------------------------

/**
 * The dynamic events that fall inside a clip's frame range.
 *
 * The two files share a frame counter — an event's `frame_start` is a tracking
 * frame number — so no timestamp matching is needed, which is the whole reason
 * this alignment is reliable rather than approximate.
 */
export function eventsInClip(
  events: readonly SkillCornerEvent[],
  frames: readonly SkillCornerFrame[],
): SkillCornerEvent[] {
  const first = frames[0]?.frame;
  const last = frames[frames.length - 1]?.frame;
  if (first === undefined || last === undefined) return [];
  return events
    .filter((event) => event.frame_start >= first && event.frame_start <= last)
    .sort((a, b) => a.frame_start - b.frame_start);
}

/**
 * Index of the most recent event at or before `frame` — the one "happening
 * now" as the clip plays. `-1` before the first event.
 */
export function activeEventIndex(events: readonly SkillCornerEvent[], frame: number): number {
  let found = -1;
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (event === undefined) break;
    if (event.frame_start > frame) break;
    found = i;
  }
  return found;
}

/** `"18:56.5"` → `"18:56"`. Events carry their own period-relative clock. */
export function eventTime(event: SkillCornerEvent): string {
  const stamp = event.time_start;
  if (stamp === null) return "--:--";
  return stamp.split(".")[0] ?? stamp;
}

/** `"off_ball_run"` → `"off ball run"`, and the subtype when there is one. */
export function eventHeadline(event: SkillCornerEvent): string {
  const type = event.event_type.replace(/_/g, " ");
  return event.event_subtype === null
    ? type
    : `${type} · ${event.event_subtype.replace(/_/g, " ")}`;
}

export interface ClipFrame {
  readonly frame: SkillCornerFrame;
  readonly players: readonly ClipPlayer[];
}

/**
 * Resolves each tracked position to a real player and side.
 *
 * Tracking frames carry only `player_id`, so without this join there is no way
 * to colour two teams — and the join key is `players[].id`, not
 * `trackable_object`, which matches nothing.
 */
export function buildClip(
  frames: readonly SkillCornerFrame[],
  match: SkillCornerMatch,
): ClipFrame[] {
  const players = indexPlayersById(match);
  return frames.map((frame) => ({
    frame,
    players: frame.player_data.map((tracked) => {
      const player = players.get(tracked.player_id);
      return { ...tracked, player, isHome: player?.team_id === match.home_team.id };
    }),
  }));
}

/** How much of a frame is genuinely observed rather than estimated. */
export function detectionRate(frames: readonly SkillCornerFrame[]): number {
  let total = 0;
  let detected = 0;
  for (const frame of frames) {
    for (const player of frame.player_data) {
      total += 1;
      if (player.is_detected) detected += 1;
    }
  }
  return total === 0 ? 0 : detected / total;
}
