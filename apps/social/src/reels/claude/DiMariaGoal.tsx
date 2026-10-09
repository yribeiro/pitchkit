import { fetchMatchEvents, isGoal, passes, shots } from "@pitchkit/data-providers/statsbomb";
import { Arrows, Comet, GoalAngle, Pitch } from "@pitchkit/react";

// The 2022 World Cup final, from StatsBomb's free open data.
const FINAL = 3869685;

export default async function DiMariaGoal() {
  const events = await fetchMatchEvents(FINAL);

  // Di María's goal, and the last three passes before it.
  const goal = shots(events)
    .filter(isGoal)
    .find((s) => s.player?.name.includes("Di María"))!;
  const buildUp = passes(events)
    .filter((p) => p.possession === goal.possession)
    .slice(-3);

  return (
    <Pitch type="statsbomb">
      <Arrows
        data={buildUp}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.endX}
        y2={(p) => p.endY}
        stroke="white"
      />
      <GoalAngle data={[goal]} x={(s) => s.x} y={(s) => s.y} />
      <Comet
        data={[goal]}
        x={(s) => s.x}
        y={(s) => s.y}
        x2={(s) => s.endX}
        y2={(s) => s.endY}
        color="#fde047"
        gradient
      />
    </Pitch>
  );
}
