"use client";

import { useState } from "react";
import { GoalShots, GoalView } from "@pitchkit/react";
import type { GoalMarkerUnits } from "@pitchkit/react";

// England 1-1 Switzerland at Euro 2024, the penalty shootout (England won
// 5-3). StatsBomb open data, match 3942227: each kick's `end_location[1]`
// and `[2]`, in yards. Akanji's was saved.
const penalties = [
  { player: "Cole Palmer", team: "England", scored: true, y: 37.3, z: 1.1 },
  { player: "Manuel Akanji", team: "Switzerland", scored: false, y: 42.0, z: 0.2 },
  { player: "Jude Bellingham", team: "England", scored: true, y: 43.4, z: 0.3 },
  { player: "Fabian Schär", team: "Switzerland", scored: true, y: 42.6, z: 0.3 },
  { player: "Bukayo Saka", team: "England", scored: true, y: 43.8, z: 0.2 },
  { player: "Xherdan Shaqiri", team: "Switzerland", scored: true, y: 43.8, z: 0.9 },
  { player: "Ivan Toney", team: "England", scored: true, y: 37.3, z: 0.2 },
  { player: "Zeki Amdouni", team: "Switzerland", scored: true, y: 39.7, z: 0.2 },
  { player: "Trent Alexander-Arnold", team: "England", scored: true, y: 36.9, z: 1.6 },
];

const checkboxClass = "flex items-center gap-1.5 text-xs text-fd-muted-foreground";

/**
 * The width and height markers are each a toggle on `appearance`, and
 * `units` switches their labels between metres and yards and feet.
 */
export function GoalViewMarkersBasic() {
  const [widthMarker, setWidthMarker] = useState(true);
  const [heightMarker, setHeightMarker] = useState(true);
  const [units, setUnits] = useState<GoalMarkerUnits>("metric");

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4">
        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={widthMarker}
            onChange={(event) => setWidthMarker(event.target.checked)}
          />
          Width
        </label>
        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={heightMarker}
            onChange={(event) => setHeightMarker(event.target.checked)}
          />
          Height
        </label>
        <label className={checkboxClass}>
          <input
            type="checkbox"
            checked={units === "imperial"}
            onChange={(event) => setUnits(event.target.checked ? "imperial" : "metric")}
          />
          Yards and feet
        </label>
      </div>
      <GoalView type="statsbomb" appearance={{ widthMarker, heightMarker, units }}>
        <GoalShots
          data={penalties}
          y={(kick) => kick.y}
          z={(kick) => kick.z}
          fill={(kick) =>
            kick.team === "England" ? "var(--pitch-marker-primary)" : "var(--pitch-marker-goal)"
          }
          fillOpacity={(kick) => (kick.scored ? 1 : 0.35)}
          tooltip={(kick) => `${kick.player} (${kick.team}) — ${kick.scored ? "scored" : "saved"}`}
        />
      </GoalView>
    </div>
  );
}
