"use client";

import { useEffect, useState } from "react";
import { RaceChart } from "@pitchkit/react";
import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";
import { DEFAULT_MATCH_ID, controlClass, matchLabel, useEuroMatches } from "./statsbomb-live";

/**
 * An xG race from a real Euro 2024 match, fetched in the browser.
 *
 * One line does the work that matters:
 *
 *     shots(events).filter((s) => s.period <= 4)
 *
 * That filter is not optional. StatsBomb's period 5 is the penalty
 * shootout, and shootout penalties carry xG like any other shot — in the
 * England–Switzerland quarter-final they add 7.05 xG on top of 1.74 from
 * the match itself. Without the filter, every knockout tie that goes to
 * penalties draws a chart several times too tall.
 */
export function RaceChartStatsbombBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [result, setResult] = useState<{ key: number; shots: StatsBombShot[] } | undefined>();
  const [failed, setFailed] = useState(false);
  const matches = useEuroMatches();

  const loaded = result?.key === matchId ? result.shots : undefined;

  useEffect(() => {
    fetchMatchEvents(matchId)
      .then((events) =>
        setResult({ key: matchId, shots: shots(events).filter((s) => s.period <= 4) }),
      )
      .catch(() => setFailed(true));
  }, [matchId]);

  // Home team first, so the two lines keep their colours as you change match.
  const match = matches.find((m) => m.match_id === matchId);
  const teams = match
    ? [match.home_team.home_team_name, match.away_team.away_team_name]
    : [...new Set((loaded ?? []).map((s) => s.team.name))];

  return (
    <div>
      <select
        aria-label="Euro 2024 match"
        value={matchId}
        disabled={matches.length === 0}
        onChange={(event) => {
          setFailed(false);
          setMatchId(Number(event.target.value));
        }}
        className={`w-full min-w-0 pl-2 pr-8 sm:w-auto sm:max-w-xs ${controlClass}`}
      >
        {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
        {matches.map((m) => (
          <option key={m.match_id} value={m.match_id}>
            {matchLabel(m)}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">
        {failed
          ? "Couldn't reach StatsBomb open data."
          : loaded === undefined
            ? "Fetching the match from StatsBomb open data (~3 MB)…"
            : `${loaded.length} shots · ${loaded.filter(isGoal).length} goals`}
      </p>

      <RaceChart
        series={teams.map((team) => ({
          id: team,
          data: (loaded ?? []).filter((s) => s.team.name === team),
        }))}
        time={(s) => s.minute + s.second / 60}
        period={(s) => s.period}
        value={(s) => s.shot.statsbomb_xg}
        emphasise={isGoal}
        tooltip={(rows, minute) => (
          <>
            <div className="font-semibold">{`${Math.round(minute)}'`}</div>
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-1.5">
                <span
                  className="h-0.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: row.color }}
                />
                <span className="opacity-75">{row.label}</span>
                <span className="ml-auto font-semibold tabular-nums">{row.value.toFixed(2)}</span>
              </div>
            ))}
          </>
        )}
      />
    </div>
  );
}
