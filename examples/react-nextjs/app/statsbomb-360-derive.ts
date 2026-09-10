import { indexThreeSixtyByEvent } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombEvent, StatsBombThreeSixtyFrame } from "@pitchkit/data-providers/statsbomb";
import { hasLocation, shortName, teamsIn } from "./statsbomb-derive";

/**
 * Turning a match's events + 360 frames into a scrubbable timeline, and
 * keeping team colours stable while doing it.
 *
 * `teammate`/`opponent` in a 360 frame are relative to *whichever team
 * performed that specific event* — so as the timeline moves from a home-team
 * event to an away-team one, "teammate" flips sides. Left as-is, that makes
 * a Voronoi diagram change colour scheme every time possession changes,
 * which reads as flickering rather than two teams controlling space. Every
 * function here exists to convert that relative framing into the match's
 * actual two team names, once, so a colour always means the same team.
 */

export interface FrameEntry {
  readonly event: StatsBombEvent;
  readonly frame: StatsBombThreeSixtyFrame;
}

/**
 * Every event with both a location and a 360 frame, in chronological order —
 * the sequence a slider scrubs through.
 *
 * `index` is StatsBomb's own field: play order within the match, not this
 * array's position. Sorting by it (rather than trusting file order) is what
 * makes "left = kickoff, right = full time" actually true.
 */
export function threeSixtyTimeline(
  events: readonly StatsBombEvent[],
  frames: readonly StatsBombThreeSixtyFrame[],
): FrameEntry[] {
  const frameByEvent = indexThreeSixtyByEvent(frames);
  const entries: FrameEntry[] = [];
  for (const event of events) {
    if (!hasLocation(event)) continue;
    const frame = frameByEvent.get(event.id);
    if (frame) entries.push({ event, frame });
  }
  return entries.sort((a, b) => a.event.index - b.event.index);
}

/** The match's two team names, in a stable order for the life of the timeline. */
export function matchTeams(events: readonly StatsBombEvent[]): [string, string] {
  const [a, b] = teamsIn(events);
  return [a ?? "Team A", b ?? "Team B"];
}

/**
 * The real team a tracked player belongs to — resolving `teammate: boolean`
 * against the entry's own event, rather than leaving it relative.
 */
export function realTeamOf(
  player: { readonly teammate: boolean },
  entry: FrameEntry,
  teams: readonly [string, string],
): string {
  const eventTeam = entry.event.team.name;
  if (player.teammate) return eventTeam;
  return teams[0] === eventTeam ? teams[1] : teams[0];
}

/**
 * "45+2'" style clock from an event's minute, matching broadcast convention.
 * Display resolution is minutes; `second` drives ordering only, via `index`.
 */
export function clockLabel(entry: FrameEntry): string {
  const { minute } = entry.event;
  if (minute < 45) return `${minute}'`;
  if (minute < 90) return minute === 45 ? `45'` : `45+${minute - 45}'`;
  if (minute < 105) return minute === 90 ? `90'` : `90+${minute - 90}'`;
  return `${minute}'`;
}

/** A short human label for the timeline's current event, for the readout above the slider. */
export function eventLabel(entry: FrameEntry): string {
  const player = shortName(entry.event.player?.name);
  return `${entry.event.type.name} — ${player} (${entry.event.team.name})`;
}
