"use client";

import { useEffect, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, controlClass, matchLabel, useEuroMatches } from "./statsbomb-live";

const dimensions = getPitchDimensions("statsbomb");

/** Every Euro 2024 fixture, in kickoff order, over a line of status text. */
function MatchSelector({
  value,
  onChange,
  status,
}: {
  value: number;
  onChange: (matchId: number) => void;
  status: string;
}) {
  const matches = useEuroMatches();

  return (
    <>
      <select
        aria-label="Euro 2024 match"
        value={value}
        disabled={matches.length === 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`w-full min-w-0 sm:w-auto sm:max-w-xs ${controlClass}`}
      >
        {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
        {matches.map((match) => (
          <option key={match.match_id} value={match.match_id}>
            {matchLabel(match)}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
  );
}

/**
 * A shot map built from a real Euro 2024 match, fetched in the browser.
 *
 * The data path is two lines: fetch the match, narrow to shots. After that
 * you're reading StatsBomb's own fields — `shot.statsbomb_xg`,
 * `shot.outcome.name` — with `x`/`y` already lifted into place for the
 * `<Scatter>` accessors.
 */
export function StatsbombEventsBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // Keyed by the match it belongs to, so "still loading" is derived rather
  // than a second state field.
  const [result, setResult] = useState<{ key: number; shots: StatsBombShot[] } | undefined>();
  const [failed, setFailed] = useState(false);

  const loaded = result?.key === matchId ? result.shots : undefined;

  useEffect(() => {
    fetchMatchEvents(matchId)
      .then((events) => setResult({ key: matchId, shots: shots(events) }))
      .catch(() => setFailed(true));
  }, [matchId]);

  return (
    <div>
      <MatchSelector
        value={matchId}
        onChange={(next) => {
          setFailed(false);
          setMatchId(next);
        }}
        status={
          failed
            ? "Couldn't reach StatsBomb open data."
            : loaded === undefined
              ? "Fetching the match from StatsBomb open data (~3 MB)…"
              : `${loaded.length} shots · ${loaded.filter(isGoal).length} goals`
        }
      />

      <VerticalPitch type="statsbomb" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
        <Scatter
          data={loaded ?? []}
          x={(shot) => shot.x}
          y={(shot) => shot.y}
          r={(shot) => 3 + Math.sqrt(shot.shot.statsbomb_xg) * 11}
          fill={(shot) =>
            isGoal(shot) ? "var(--pitch-marker-goal)" : "var(--pitch-marker-primary)"
          }
          fillOpacity={(shot) => (isGoal(shot) ? 0.95 : 0.55)}
          stroke="white"
          strokeWidth={(shot) => (isGoal(shot) ? 2 : 1)}
          tooltip={(shot) =>
            `${shot.player?.name ?? "Unknown"} (${shot.team.name}) — ${shot.shot.outcome.name}, ${shot.shot.statsbomb_xg.toFixed(2)} xG`
          }
        />
      </VerticalPitch>
    </div>
  );
}
