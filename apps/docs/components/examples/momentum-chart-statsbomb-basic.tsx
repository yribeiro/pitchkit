"use client";

import { useEffect, useState } from "react";
import { MomentumChart } from "@pitchkit/react";
import type { MomentumEventKind } from "@pitchkit/react";
import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombEvent } from "@pitchkit/data-providers/statsbomb";
import { DEFAULT_MATCH_ID, controlClass, matchLabel, useEuroMatches } from "./statsbomb-live";

/**
 * Match momentum from a real Euro 2024 match, fetched in the browser.
 *
 * StatsBomb does not publish a momentum number, so this derives one, and
 * says so: on-ball events in the attacking third, per minute, home minus
 * away, smoothed over three minutes. It is a stand-in for pressure, not
 * anyone's official metric.
 *
 * The attacking third is `x >= 80` for every team, because StatsBomb
 * orients each team to attack towards x = 120 in both halves.
 */
const ON_BALL = new Set([
  "Pass",
  "Carry",
  "Shot",
  "Dribble",
  "Ball Receipt*",
  "Duel",
  "Interception",
  "Ball Recovery",
  "Clearance",
  "Miscontrol",
  "Dispossessed",
]);

interface Sample {
  minute: number;
  period: number;
  value: number;
}

interface MatchEvent {
  minute: number;
  period: number;
  side: "home" | "away";
  kind: MomentumEventKind;
  label: string;
}

/** One flat list of samples, each tagged with its period, like the events it came from. */
function deriveMomentum(events: readonly StatsBombEvent[], home: string): Sample[] {
  const samples: Sample[] = [];

  // Period 5 is the penalty shootout; it has no place on a match clock.
  for (let period = 1; period <= 4; period++) {
    const inPeriod = events.filter((e) => e.period === period);
    if (inPeriod.length === 0) continue;

    const counts = new Map<number, number>();
    for (const e of inPeriod) {
      if (!ON_BALL.has(e.type.name) || e.x === undefined || e.x < 80) continue;
      counts.set(e.minute, (counts.get(e.minute) ?? 0) + (e.team.name === home ? 1 : -1));
    }
    if (counts.size === 0) continue;

    const first = Math.min(...inPeriod.map((e) => e.minute));
    const last = Math.max(...counts.keys());
    const raw = Array.from({ length: last - first + 1 }, (_, i) => counts.get(first + i) ?? 0);

    raw.forEach((_, i) => {
      const window = raw.slice(Math.max(0, i - 1), i + 2);
      const mean = window.reduce((sum, v) => sum + v, 0) / window.length;
      samples.push({ minute: first + i, period, value: Math.round(mean * 10) / 10 });
    });
  }
  return samples;
}

/** Goals and bookings. Bookings live at `foul_committed.card` in StatsBomb's feed. */
function pickEvents(events: readonly StatsBombEvent[], home: string): MatchEvent[] {
  const picked: MatchEvent[] = [];

  for (const shot of shots(events)) {
    if (shot.period <= 4 && isGoal(shot)) {
      picked.push({
        minute: shot.minute + shot.second / 60,
        period: shot.period,
        side: shot.team.name === home ? "home" : "away",
        kind: "goal",
        label: `Goal, ${shot.player?.name ?? shot.team.name}`,
      });
    }
  }

  for (const e of events) {
    const card = (e as { foul_committed?: { card?: { name: string } } }).foul_committed?.card?.name;
    if (!card || e.period > 4) continue;
    picked.push({
      minute: e.minute + e.second / 60,
      period: e.period,
      side: e.team.name === home ? "home" : "away",
      kind: card === "Yellow Card" ? "yellow-card" : "red-card",
      label: `${card}, ${e.player?.name ?? e.team.name}`,
    });
  }
  return picked;
}

export function MomentumChartStatsbombBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [result, setResult] = useState<
    { key: number; events: readonly StatsBombEvent[] } | undefined
  >();
  const [failed, setFailed] = useState(false);
  const matches = useEuroMatches();

  const loaded = result?.key === matchId ? result.events : undefined;

  useEffect(() => {
    fetchMatchEvents(matchId)
      .then((events) => setResult({ key: matchId, events }))
      .catch(() => setFailed(true));
  }, [matchId]);

  const match = matches.find((m) => m.match_id === matchId);
  const home = match?.home_team.home_team_name ?? "";
  const away = match?.away_team.away_team_name ?? "";

  const samples = loaded && home ? deriveMomentum(loaded, home) : [];
  const marks = loaded && home ? pickEvents(loaded, home) : [];

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
            : "Derived from attacking-third on-ball events, smoothed over three minutes."}
      </p>

      <MomentumChart
        data={samples}
        time={(d) => d.minute}
        period={(d) => d.period}
        value={(d) => d.value}
        teams={{ home, away }}
        events={marks}
        eventTime={(e) => e.minute}
        eventPeriod={(e) => e.period}
        eventSide={(e) => e.side}
        eventKind={(e) => e.kind}
        eventLabel={(e) => e.label}
      />
    </div>
  );
}
