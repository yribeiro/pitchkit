"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { PitchAppearance } from "@pitchkit/core";
import {
  DataProviderError,
  fetchCompetitions,
  fetchMatches,
  loadEvents,
  matchEventsUrl,
} from "@pitchkit/data-providers/statsbomb";
import type {
  StatsBombCompetition,
  StatsBombEvent,
  StatsBombMatch,
} from "@pitchkit/data-providers/statsbomb";
import { StatsBombVisuals } from "./StatsBombVisuals";
import { teamsIn } from "./statsbomb-derive";

/** Men's World Cup 2022 — a recognisable default to land on. */
const DEFAULT_COMPETITION_ID = 43;
const DEFAULT_SEASON_ID = 106;

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  margin: "0 0 0.6rem",
};
const selectStyle: CSSProperties = {
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.3rem 0.4rem",
  fontSize: "0.78rem",
  maxWidth: "22rem",
};
const urlInputStyle: CSSProperties = {
  flex: "1 1 26rem",
  minWidth: 0,
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.4rem 0.5rem",
  fontSize: "0.72rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const buttonStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#eee",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.4rem 0.9rem",
  cursor: "pointer",
};
const labelStyle: CSSProperties = { fontSize: "0.72rem", color: "#888", minWidth: "4.5rem" };
const statusStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#bbb",
  margin: "0 0 1rem",
  lineHeight: 1.5,
};
const errorStyle: CSSProperties = {
  ...statusStyle,
  color: "#fca5a5",
  background: "#2a1717",
  border: "1px solid #5b2626",
  borderRadius: 6,
  padding: "0.6rem 0.8rem",
};

/** A DataProviderError already says what went wrong; anything else may not. */
function describeError(error: unknown): string {
  if (error instanceof DataProviderError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong loading that URL.";
}

function competitionKey(competition: StatsBombCompetition): string {
  return `${competition.competition_id}:${competition.season_id}`;
}

function competitionLabel(competition: StatsBombCompetition): string {
  return `${competition.country_name} — ${competition.competition_name} ${competition.season_name}`;
}

function matchLabel(match: StatsBombMatch): string {
  return `${match.match_date}  ${match.home_team.home_team_name} ${match.home_score}–${match.away_score} ${match.away_team.away_team_name}`;
}

interface StatsBombPanelProps {
  appearance: PitchAppearance;
  colorMin: string;
  colorMax: string;
}

/**
 * Browse StatsBomb's open data and plot a whole match.
 *
 * The three-step picker is the shape of the data itself: `competitions.json`
 * rows are competition *and season* pairs, so picking one gives you both ids
 * that `fetchMatches` needs, and a match id then gives you the events file.
 *
 * Everything fetches **in the browser**, deliberately. raw.githubusercontent.com
 * sends `Access-Control-Allow-Origin: *`, so no proxy is needed — and doing it
 * here rather than in a route handler avoids handing a server an arbitrary
 * user-supplied URL to fetch, which would be an SSRF footgun. The cost is a
 * ~3 MB events download, hence the explicit loading state.
 */
export function StatsBombPanel({ appearance, colorMin, colorMax }: StatsBombPanelProps) {
  const [competitions, setCompetitions] = useState<StatsBombCompetition[]>([]);
  const [competition, setCompetition] = useState<string>(
    `${DEFAULT_COMPETITION_ID}:${DEFAULT_SEASON_ID}`,
  );
  // Keyed by the competition it belongs to, so "still loading" is derived
  // rather than a second state field — which also keeps the effect below from
  // having to setState synchronously in its body.
  const [matchIndex, setMatchIndex] = useState<
    { readonly key: string; readonly matches: StatsBombMatch[] } | undefined
  >();
  const matchesLoading = matchIndex?.key !== competition;
  const matches = matchIndex?.key === competition ? matchIndex.matches : [];

  const [url, setUrl] = useState(matchEventsUrl(3857276));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [events, setEvents] = useState<readonly StatsBombEvent[] | undefined>();
  const [team, setTeam] = useState<string | undefined>();

  // The competitions index is only ~35 KB, so it's cheap to have ready.
  useEffect(() => {
    let cancelled = false;
    fetchCompetitions()
      .then((rows) => {
        if (!cancelled) setCompetitions(rows);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Whenever a competition+season is picked, list its matches.
  useEffect(() => {
    const [competitionId, seasonId] = competition.split(":").map(Number);
    if (competitionId === undefined || seasonId === undefined) return;

    let cancelled = false;
    fetchMatches(competitionId, seasonId)
      .then((rows) => {
        if (cancelled) return;
        const sorted = [...rows].sort((a, b) => a.match_date.localeCompare(b.match_date));
        setMatchIndex({ key: competition, matches: sorted });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        // Still key it to this competition, so the picker leaves its
        // loading state rather than spinning forever on a failure.
        setMatchIndex({ key: competition, matches: [] });
        setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [competition]);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setError(undefined);
    try {
      // One call does fetch + parse. Everything downstream is array work.
      const parsed = await loadEvents(target);
      setEvents(parsed);
      setTeam(teamsIn(parsed)[0]);
    } catch (cause) {
      setError(describeError(cause));
      setEvents(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  function selectMatch(matchId: string) {
    const target = matchEventsUrl(Number(matchId));
    setUrl(target);
    void load(target);
  }

  const teams = useMemo(() => (events ? teamsIn(events) : []), [events]);

  const sortedCompetitions = useMemo(
    () => [...competitions].sort((a, b) => competitionLabel(a).localeCompare(competitionLabel(b))),
    [competitions],
  );

  return (
    <section style={{ marginTop: "2.5rem" }}>
      <h2>@pitchkit/data-providers — plot a real match</h2>
      <p>
        Pick a competition and match from StatsBomb&apos;s open data, or paste any events URL. One{" "}
        <code>loadEvents(url)</code> call feeds every chart below.
      </p>

      <div style={rowStyle}>
        <span style={labelStyle}>Competition</span>
        <select
          style={selectStyle}
          value={competition}
          onChange={(event) => setCompetition(event.target.value)}
          aria-label="Competition and season"
          disabled={competitions.length === 0}
        >
          {competitions.length === 0 && <option>Loading competitions…</option>}
          {sortedCompetitions.map((row) => (
            <option key={competitionKey(row)} value={competitionKey(row)}>
              {competitionLabel(row)}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "0.7rem", color: "#666" }}>
          {competitions.length > 0 && `${competitions.length} competition-seasons available`}
        </span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Match</span>
        <select
          style={selectStyle}
          defaultValue=""
          onChange={(event) => selectMatch(event.target.value)}
          aria-label="Match"
          disabled={matchesLoading || matches.length === 0}
        >
          <option value="" disabled>
            {matchesLoading ? "Loading matches…" : `Choose one of ${matches.length} matches…`}
          </option>
          {matches.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {matchLabel(match)}
            </option>
          ))}
        </select>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Events URL</span>
        <input
          type="url"
          style={urlInputStyle}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void load(url);
          }}
          aria-label="StatsBomb events JSON URL"
          spellCheck={false}
        />
        <button type="button" style={buttonStyle} onClick={() => void load(url)} disabled={loading}>
          {loading ? "Loading…" : "Load"}
        </button>
        {teams.length > 1 && (
          <select
            style={selectStyle}
            value={team ?? ""}
            onChange={(event) => setTeam(event.target.value)}
            aria-label="Team"
          >
            {teams.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error !== undefined && <p style={errorStyle}>{error}</p>}

      {loading && <p style={statusStyle}>Fetching… a full match is around 3 MB.</p>}

      {!loading && error === undefined && events === undefined && (
        <p style={statusStyle}>Choose a match above, or press Load for the URL shown.</p>
      )}

      {events !== undefined && team !== undefined && (
        <>
          <p style={statusStyle}>
            {events.length} events parsed · showing <strong>{team}</strong>
          </p>
          <StatsBombVisuals
            events={events}
            team={team}
            appearance={appearance}
            colorMin={colorMin}
            colorMax={colorMax}
          />
        </>
      )}
    </section>
  );
}
