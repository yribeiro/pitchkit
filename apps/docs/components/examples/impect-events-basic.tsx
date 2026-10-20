"use client";

import { useEffect, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import {
  fetchMatchEvents,
  hasLocation,
  isGoal,
  isOwnGoal,
  matchSeconds,
  score,
  shots,
} from "@pitchkit/data-providers/impect";
import type { ImpectEvent } from "@pitchkit/data-providers/impect";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, matchLabel, selectClass, useImpectSeason } from "./impect-live";

const dimensions = getPitchDimensions("impect");

/** Match-clock seconds as "48:47". */
function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * What the chart needs from a match: its located shots, and the goal and
 * own-goal events `score` counts. A few dozen events, where the whole match
 * is about 3,000, so keeping one per match visited stays cheap.
 */
interface MatchSummary {
  readonly shots: (ImpectEvent & { readonly x: number; readonly y: number })[];
  readonly goals: ImpectEvent[];
}

function summarise(events: readonly ImpectEvent[]): MatchSummary {
  return {
    shots: shots(events).filter(hasLocation),
    goals: events.filter((event) => event.actionType === "GOAL" || isOwnGoal(event)),
  };
}

/**
 * A shot map from a real Bundesliga 2023/24 match, fetched in the browser
 * from Impect's open data.
 *
 * `x`/`y` are Impect's adjusted coordinates, where the shooting team attacks
 * towards +x, so both teams' shots land in the one half drawn here.
 */
export function ImpectEventsBasic() {
  const { season, failed: seasonFailed } = useImpectSeason();
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // One summary per match visited, so going back to a match doesn't
  // download its ~5 MB of events again.
  const [summaries, setSummaries] = useState<ReadonlyMap<number, MatchSummary>>(new Map());
  const [failedMatch, setFailedMatch] = useState<number>();

  useEffect(() => {
    if (summaries.has(matchId)) return;
    // Cancelled when the match changes, so a slow earlier download can't
    // finish last and leave the chart showing nothing.
    const controller = new AbortController();
    fetchMatchEvents(matchId, { signal: controller.signal })
      .then((events) => {
        setSummaries((previous) => new Map(previous).set(matchId, summarise(events)));
        setFailedMatch(undefined);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedMatch(matchId);
      });
    return () => controller.abort();
  }, [matchId, summaries]);

  const summary = summaries.get(matchId);
  const match = season?.matches.find((m) => m.id === matchId);
  const squadName = (id: number | null) =>
    (id !== null && season?.squads.get(id)?.name) || "Unknown";
  // Until the match list is in, there's no telling home from away.
  const fill = (shot: ImpectEvent) =>
    match && shot.squadId !== match.homeSquadId
      ? "var(--pitch-marker-goal)"
      : "var(--pitch-marker-primary)";

  let status = "Fetching the match from Impect's open data (~5 MB)…";
  if (failedMatch === matchId) status = "Couldn't reach Impect's open data.";
  else if (summary) {
    status = `${summary.shots.length} shots`;
    if (match) {
      // The match list carries no score, and own goals aren't shots.
      const { home, away } = score(summary.goals, match);
      const ownGoals = summary.goals.filter(isOwnGoal).length;
      status += ` · ${home}–${away}${ownGoals ? ` (${ownGoals} own goal${ownGoals > 1 ? "s" : ""})` : ""}`;
    } else if (seasonFailed) {
      status += " · couldn't load the match list, so no score";
    }
  }

  return (
    <div>
      <select
        aria-label="Bundesliga 2023/24 match"
        value={matchId}
        disabled={!season}
        onChange={(event) => setMatchId(Number(event.target.value))}
        className={selectClass}
      >
        {!season && (
          <option value={DEFAULT_MATCH_ID}>
            {seasonFailed ? "Couldn't load the match list" : "Loading matches…"}
          </option>
        )}
        {season?.matches.map((m) => (
          <option key={m.id} value={m.id}>
            {matchLabel(m, season)}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>

      <VerticalPitch type="impect" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
        <Scatter
          data={summary?.shots ?? []}
          x={(shot) => shot.x}
          y={(shot) => shot.y}
          r={(shot) => (isGoal(shot) ? 7 : 4.5)}
          fill={fill}
          fillOpacity={(shot) => (isGoal(shot) ? 0.95 : 0.55)}
          stroke="white"
          strokeWidth={(shot) => (isGoal(shot) ? 2 : 1)}
          tooltip={(shot) =>
            `${clock(matchSeconds(shot))} ${squadName(shot.squadId)} — ${shot.action ?? "shot"}${isGoal(shot) ? ", goal" : ""}`
          }
        />
      </VerticalPitch>
    </div>
  );
}
