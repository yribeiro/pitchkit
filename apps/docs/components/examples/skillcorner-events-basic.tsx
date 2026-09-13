"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Comet, Pitch, Scatter } from "@pitchkit/react";
import {
  fetchDynamicEvents,
  fetchMatch,
  fetchMatches,
  hasPath,
  isSprint,
  offBallRuns,
} from "@pitchkit/data-providers/skillcorner";
import type {
  SkillCornerMatch,
  SkillCornerMatchSummary,
  SkillCornerOffBallRun,
} from "@pitchkit/data-providers/skillcorner";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, buttonClass, matchLabel, selectClass } from "./skillcorner-live";

const TEAM_COLORS = ["var(--pitch-marker-primary)", "var(--pitch-marker-goal)"] as const;

interface Loaded {
  readonly match: SkillCornerMatch;
  readonly runs: readonly SkillCornerOffBallRun[];
}

/**
 * Load a match's dynamic events and narrow them to off-ball runs.
 *
 * `fetchDynamicEvents` takes the *match*, not just its id, because the CSV's
 * coordinates are metres from the centre spot and placing them needs that
 * pitch's real dimensions. `offBallRuns` is the narrowing selector — the same
 * shape as StatsBomb's `shots()`/`passes()`.
 */
async function loadRuns(matchId: number, signal: AbortSignal): Promise<Loaded> {
  const match = await fetchMatch(matchId, { signal });
  const events = await fetchDynamicEvents(match, { signal });
  // `hasPath` keeps only runs with both a start and an end, which is what a
  // <Comet> needs to draw.
  return { match, runs: offBallRuns(events).filter(hasPath) };
}

function useRuns(matchId: number) {
  const [loaded, setLoaded] = useState<{ key: number; value: Loaded } | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadRuns(matchId, controller.signal)
      .then((value) => setLoaded({ key: matchId, value }))
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [matchId]);

  return { loaded: loaded?.key === matchId ? loaded.value : undefined, failed };
}

/** Match picker, any extra controls, and the status line. */
function MatchPicker({
  value,
  onChange,
  status,
  children,
}: {
  value: number;
  onChange: (id: number) => void;
  status: ReactNode;
  children?: ReactNode;
}) {
  const [matches, setMatches] = useState<SkillCornerMatchSummary[]>([]);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          aria-label="SkillCorner match"
          value={value}
          disabled={matches.length === 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className={selectClass}
        >
          {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {matchLabel(match)}
            </option>
          ))}
        </select>
        {children}
      </div>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
  );
}

/**
 * Off-ball runs from a real SkillCorner match, drawn as comets that taper
 * from where the run began to where it ended.
 *
 * Event coordinates are normalised to the attacking direction, so every run
 * points the same way regardless of which half it happened in.
 */
export function SkillcornerEventsBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [sprintsOnly, setSprintsOnly] = useState(false);
  const { loaded, failed } = useRuns(matchId);

  const runs = (loaded?.runs ?? []).filter((run) => !sprintsOnly || isSprint(run));
  const color = (run: SkillCornerOffBallRun) =>
    run.team_id === loaded?.match.home_team.id ? TEAM_COLORS[0] : TEAM_COLORS[1];

  return (
    <div>
      <MatchPicker
        value={matchId}
        onChange={setMatchId}
        status={
          failed
            ? "Couldn't reach SkillCorner open data."
            : loaded === undefined
              ? "Fetching dynamic events (~4 MB)…"
              : `${runs.length} off-ball runs`
        }
      >
        <button
          type="button"
          className={buttonClass}
          disabled={loaded === undefined}
          onClick={() => setSprintsOnly((was) => !was)}
        >
          {sprintsOnly ? "All runs" : "Sprints only"}
        </button>
      </MatchPicker>

      <Pitch
        type="skillcorner"
        dimensions={
          loaded && { length: loaded.match.pitch_length, width: loaded.match.pitch_width }
        }
        appearance={docsAppearance}
      >
        <Comet
          data={runs}
          x={(run) => run.x_start ?? 0}
          y={(run) => run.y_start ?? 0}
          x2={(run) => run.x_end ?? 0}
          y2={(run) => run.y_end ?? 0}
          color={color}
          startWidth={0.3}
          endWidth={1.4}
          gradient
          tooltip={(run) =>
            `${run.player_name ?? "Unknown"} — ${run.event_subtype?.replace(/_/g, " ") ?? "run"}, ${
              run.distance_covered?.toFixed(0) ?? "?"
            } m`
          }
        />
        <Scatter
          data={runs}
          x={(run) => run.x_end ?? 0}
          y={(run) => run.y_end ?? 0}
          r={1.2}
          fill={color}
          fillOpacity={0.9}
        />
      </Pitch>
    </div>
  );
}
