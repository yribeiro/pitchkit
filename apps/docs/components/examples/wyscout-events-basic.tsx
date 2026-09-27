"use client";

import { useEffect, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import {
  fetchMatch,
  indexPlayersById,
  isGoal,
  shotGoalZone,
  shots,
} from "@pitchkit/data-providers/wyscout";
import type { WyscoutEvent, WyscoutPlayer } from "@pitchkit/data-providers/wyscout";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, WYSCOUT_MATCHES, selectClass } from "./wyscout-live";

const dimensions = getPitchDimensions("wyscout");

/** The curated shortlist over a line of status text. */
function MatchSelector({
  value,
  onChange,
  status,
}: {
  value: number;
  onChange: (matchId: number) => void;
  status: string;
}) {
  return (
    <>
      <select
        aria-label="Wyscout match"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={selectClass}
      >
        {WYSCOUT_MATCHES.map((match) => (
          <option key={match.id} value={match.id}>
            {match.label}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
  );
}

interface Loaded {
  readonly shots: readonly WyscoutEvent[];
  readonly players: Map<number, WyscoutPlayer>;
}

/**
 * A shot map built from a real Wyscout match, fetched in the browser.
 *
 * `shots(events)` first, `.filter(isGoal)` after — in that order. Wyscout
 * tags a goal on the conceding keeper's save as well as on the shot that
 * scored it, so filtering the *whole* feed for the goal tag counts each one
 * twice. Narrowing to shots first is what keeps the count honest.
 */
export function WyscoutEventsBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // Keyed by the match it belongs to, so "still loading" is derived rather
  // than a second state field.
  const [result, setResult] = useState<{ key: number; value: Loaded } | undefined>();
  const [failed, setFailed] = useState(false);

  const loaded = result?.key === matchId ? result.value : undefined;

  useEffect(() => {
    fetchMatch(matchId)
      .then((match) => {
        setResult({
          key: matchId,
          value: { shots: shots(match.events), players: indexPlayersById(match) },
        });
      })
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
            ? "Couldn't reach Wyscout open data."
            : loaded === undefined
              ? "Fetching the match (~480 KB)…"
              : `${loaded.shots.length} shots · ${loaded.shots.filter(isGoal).length} goals`
        }
      />

      <VerticalPitch type="wyscout" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
        <Scatter
          data={loaded?.shots ?? []}
          x={(shot) => shot.x}
          y={(shot) => shot.y}
          r={(shot) => (isGoal(shot) ? 6 : 4)}
          fill={(shot) =>
            isGoal(shot) ? "var(--pitch-marker-goal)" : "var(--pitch-marker-primary)"
          }
          fillOpacity={(shot) => (isGoal(shot) ? 0.95 : 0.55)}
          stroke="white"
          strokeWidth={(shot) => (isGoal(shot) ? 2 : 1)}
          tooltip={(shot) => {
            const player = loaded?.players.get(shot.playerId)?.shortName ?? "Unknown";
            // No end coordinate on a shot — where it went is a tag, read
            // through shotGoalZone, not positions[1]. See "Reading the
            // fields" below.
            const outcome = isGoal(shot) ? "Goal" : (shotGoalZone(shot) ?? "Blocked");
            return `${player} — ${outcome}`;
          }}
        />
      </VerticalPitch>
    </div>
  );
}
