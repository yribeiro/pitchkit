"use client";

import { useEffect, useState } from "react";
import { GoalShots, GoalView } from "@pitchkit/react";
import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";

// The Euro 2024 final, Spain 2-1 England.
const MATCH_ID = 3943043;

/**
 * Where every shot in the Euro 2024 final crossed the goal line, from
 * StatsBomb open data. `endY` and `endZ` are StatsBomb's own
 * `end_location[1]` and `[2]`, in yards, so they go straight in with
 * `type="statsbomb"`. Blocked shots have no height and are left out.
 */
export function GoalViewBasic() {
  const [loaded, setLoaded] = useState<StatsBombShot[] | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMatchEvents(MATCH_ID)
      .then((events) => setLoaded(shots(events)))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div>
      <p className="my-3 text-xs text-fd-muted-foreground">
        {failed
          ? "Couldn't reach StatsBomb open data."
          : loaded === undefined
            ? "Fetching the Euro 2024 final from StatsBomb open data (~3 MB)…"
            : `${loaded.filter((shot) => shot.endZ !== undefined).length} of ${loaded.length} shots reached the goal line · ${loaded.filter(isGoal).length} goals`}
      </p>
      <GoalView type="statsbomb">
        <GoalShots
          data={loaded ?? []}
          y={(shot) => shot.endY}
          z={(shot) => shot.endZ}
          r={(shot) => 4 + Math.sqrt(shot.shot.statsbomb_xg) * 10}
          fill={(shot) =>
            isGoal(shot) ? "var(--pitch-marker-goal)" : "var(--pitch-marker-primary)"
          }
          fillOpacity={(shot) => (isGoal(shot) ? 1 : 0.7)}
          tooltip={(shot) =>
            `${shot.player?.name ?? "Unknown"} (${shot.team.name}) — ${shot.shot.outcome.name}, ${shot.shot.statsbomb_xg.toFixed(2)} xG`
          }
        />
      </GoalView>
    </div>
  );
}
