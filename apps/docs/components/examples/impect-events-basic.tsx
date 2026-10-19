"use client";

import { useEffect, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import {
  fetchMatchEvents,
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
 * A shot map from a real Bundesliga 2023/24 match, fetched in the browser
 * from Impect's open data.
 *
 * `x`/`y` are Impect's adjusted coordinates, where the shooting team attacks
 * towards +x, so both teams' shots land in the one half drawn here.
 */
export function ImpectEventsBasic() {
  const season = useImpectSeason();
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // Keyed by the match it belongs to, so "still loading" is derived rather
  // than a second state field.
  const [result, setResult] = useState<{ key: number; events: ImpectEvent[] }>();
  const [failedMatch, setFailedMatch] = useState<number>();

  useEffect(() => {
    // ~5 MB of events: fetched once per match, then narrowed in memory.
    fetchMatchEvents(matchId)
      .then((events) => setResult({ key: matchId, events }))
      .catch(() => setFailedMatch(matchId));
  }, [matchId]);

  const events = result?.key === matchId ? result.events : undefined;
  const match = season?.matches.find((m) => m.id === matchId);
  const matchShots = events ? shots(events) : [];
  const homeId = match?.homeSquadId;
  const squadName = (id: number | null) =>
    (id !== null && season?.squads.get(id)?.name) || "Unknown";

  let status = "Fetching the match from Impect's open data (~5 MB)…";
  if (failedMatch === matchId) status = "Couldn't reach Impect's open data.";
  else if (events && match) {
    // The match list carries no score, and own goals aren't shots.
    const { home, away } = score(events, match);
    const ownGoals = events.filter(isOwnGoal).length;
    status = `${matchShots.length} shots · ${home}–${away}${ownGoals ? ` (${ownGoals} own goal${ownGoals > 1 ? "s" : ""})` : ""}`;
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
        {!season && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
        {season?.matches.map((m) => (
          <option key={m.id} value={m.id}>
            {matchLabel(m, season)}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>

      <VerticalPitch type="impect" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
        <Scatter
          data={matchShots}
          x={(shot) => shot.x ?? 0}
          y={(shot) => shot.y ?? 0}
          r={(shot) => (isGoal(shot) ? 7 : 4.5)}
          fill={(shot) =>
            shot.squadId === homeId ? "var(--pitch-marker-primary)" : "var(--pitch-marker-goal)"
          }
          fillOpacity={(shot) => (isGoal(shot) ? 0.95 : 0.55)}
          stroke="white"
          strokeWidth={(shot) => (isGoal(shot) ? 2 : 1)}
          tooltip={(shot) =>
            `${clock(matchSeconds(shot))} ${squadName(shot.squadId)} — ${shot.action}${isGoal(shot) ? ", goal" : ""}`
          }
        />
      </VerticalPitch>
    </div>
  );
}
