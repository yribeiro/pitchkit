import { indexPlayersById } from "@pitchkit/data-providers/skillcorner";
import type {
  SkillCornerFrame,
  SkillCornerMatch,
  SkillCornerMatchPlayer,
  SkillCornerMatchSummary,
  SkillCornerTrackedPlayer,
} from "@pitchkit/data-providers/skillcorner";

/**
 * App-local derivations for the SkillCorner demo.
 *
 * Everything here is **this demo's** presentation logic, deliberately kept out
 * of `@pitchkit/data-providers` — most of all `toUefa` below, which is a
 * rendering fudge rather than anything true about the data.
 */

/**
 * Squash a match's real pitch onto UEFA's fixed 105x68 so `<Pitch type="uefa">`
 * can draw it.
 *
 * **This is a hack, and it lives here on purpose.** SkillCorner's coordinates
 * are real metres on a pitch that is 104, 105 or 106 m long depending on the
 * stadium, and PitchKit has no pitch type that takes dimensions. Scaling to
 * 105x68 moves a touchline position by up to ~0.5 m — invisible in a demo,
 * wrong in an analysis.
 *
 * The loader deliberately does not do this: `pitchX`/`pitchY` stay in the
 * match's own metres, and a proper `skillcorner` pitch type in
 * `@pitchkit/core` is tracked separately. When that lands, delete this
 * function rather than promoting it.
 */
export const UEFA_LENGTH = 105;
export const UEFA_WIDTH = 68;

export function toUefaX(pitchX: number, match: SkillCornerMatch): number {
  return pitchX * (UEFA_LENGTH / match.pitch_length);
}

export function toUefaY(pitchY: number, match: SkillCornerMatch): number {
  return pitchY * (UEFA_WIDTH / match.pitch_width);
}

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
