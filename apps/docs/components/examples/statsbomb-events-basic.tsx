"use client";

import { useEffect, useMemo, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import { fetchMatchEvents, isGoal, isOnTarget, shots } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";
import { docsAppearance } from "./docs-appearance";
import {
  DEFAULT_MATCH_ID,
  ExampleControls,
  ExampleError,
  ExampleLabel,
  ExampleSelect,
  ExampleStatus,
  describeError,
  matchLabel,
  useEuroMatches,
} from "./statsbomb-live";

const dimensions = getPitchDimensions("statsbomb");

/**
 * A shot map built from a real Euro 2024 match, fetched in the browser.
 *
 * The whole data path is the three lines inside `load()`: fetch the match,
 * narrow to shots, then read StatsBomb's own fields straight off them —
 * `shot.statsbomb_xg`, `shot.outcome.name` — with `x`/`y` already lifted
 * into place by the parser for the `<Scatter>` accessors.
 */
export function StatsbombEventsBasic() {
  const { matches, error: matchesError } = useEuroMatches();
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // Keyed by the match it belongs to, so "still loading" is derived rather
  // than a second state field — which also keeps the effect below from
  // having to reset state synchronously in its body.
  const [result, setResult] = useState<{ key: number; shots: StatsBombShot[] } | undefined>();
  const [team, setTeam] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const allShots = result?.key === matchId ? result.shots : undefined;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const events = await fetchMatchEvents(matchId);
      return shots(events);
    }

    load()
      .then((loaded) => {
        if (cancelled) return;
        setResult({ key: matchId, shots: loaded });
        setTeam(loaded[0]?.team.name);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const teams = useMemo(
    () => [...new Set((allShots ?? []).map((shot) => shot.team.name))],
    [allShots],
  );
  const visible = (allShots ?? []).filter((shot) => shot.team.name === team);

  return (
    <div>
      <ExampleControls>
        <ExampleLabel>Match</ExampleLabel>
        <ExampleSelect
          label="Euro 2024 match"
          value={matchId}
          disabled={matches.length === 0}
          onChange={(value) => {
            setError(undefined);
            setMatchId(Number(value));
          }}
        >
          {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
          {matches.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {matchLabel(match)}
            </option>
          ))}
        </ExampleSelect>
        {teams.length > 1 && (
          <ExampleSelect label="Team" value={team ?? ""} onChange={setTeam}>
            {teams.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </ExampleSelect>
        )}
      </ExampleControls>

      {(error ?? matchesError) !== undefined && (
        <ExampleError>{error ?? matchesError}</ExampleError>
      )}

      {error === undefined && allShots === undefined && (
        <ExampleStatus>Fetching the match from StatsBomb open data (~3 MB)…</ExampleStatus>
      )}

      {allShots !== undefined && team !== undefined && (
        <ExampleStatus>
          {visible.length} shots · {visible.filter(isGoal).length} goals ·{" "}
          {visible.filter(isOnTarget).length} on target ·{" "}
          {visible.reduce((sum, shot) => sum + shot.shot.statsbomb_xg, 0).toFixed(2)} xG
        </ExampleStatus>
      )}

      <VerticalPitch type="statsbomb" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
        <Scatter
          data={visible}
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
            `${shot.player?.name ?? "Unknown"} — ${shot.shot.outcome.name}, ${shot.shot.statsbomb_xg.toFixed(2)} xG`
          }
        />
      </VerticalPitch>
    </div>
  );
}
