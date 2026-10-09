import {
  fetchLineups,
  fetchMatchEvents,
  isGoal,
  passes,
  shots,
} from "@pitchkit/data-providers/statsbomb";
import { Annotate, Arrows, Comet, GoalAngle, Pitch, Scatter } from "@pitchkit/react";

// The 2022 World Cup final, from StatsBomb's free open data.
const FINAL = 3869685;
// Argentina's attacking half, with room for the build-up and the goal.
const crop = { x0: 34, y0: 0, x1: 124, y1: 80 };

// Where an event starts and ends.
type Move = { x: number; y: number; endX: number; endY: number };
const from = { x: (e: Move) => e.x, y: (e: Move) => e.y };
const to = { x2: (e: Move) => e.endX, y2: (e: Move) => e.endY };
// A label just behind the start of its pass, clear of the arrow: pushed back
// along the pass by half its size (about 2.8px a character, 9px tall).
const behind = (e: Move, text: string) => {
  const length = Math.hypot(e.endX - e.x, e.endY - e.y);
  const [dx, dy] = [(e.endX - e.x) / length, (e.endY - e.y) / length];
  const gap = Math.abs(dx) * (text.length * 2.8 + 4) + Math.abs(dy) * 9 + 8;
  return { x: -dx * gap, y: -dy * gap + 3.5 };
};

export default async function DiMariaGoal() {
  const events = await fetchMatchEvents(FINAL);
  const squad = (await fetchLineups(FINAL)).flatMap((team) => team.lineup);
  const player = (id?: number) => squad.find((p) => p.player_id === id)!;

  // Di María's goal, and the last three passes before it.
  const goal = shots(events).find((s) => isGoal(s) && s.player?.name.includes("Di María"))!;
  const buildUp = passes(events)
    .filter((p) => p.possession === goal.possession)
    .slice(-3);
  const shirt = String(player(goal.player?.id).jersey_number);

  // "Messi 35:15"
  const label = (e: (typeof buildUp)[number]) => {
    const { player_nickname, player_name } = player(e.player?.id);
    const name = (player_nickname ?? player_name).split(" ").at(-1);
    return `${name} ${e.minute}:${String(e.second).padStart(2, "0")}`;
  };

  return (
    <Pitch type="statsbomb" crop={crop} appearance={{ stripes: true, goalType: "box" }}>
      <GoalAngle data={[goal]} {...from} />
      <Comet data={[goal]} {...from} {...to} color="#fde047" gradient />
      <Arrows data={buildUp} {...from} {...to} stroke="white" strokeWidth={2.5} headSize={7} />
      <Annotate
        data={buildUp}
        {...from}
        label={label}
        offsetX={(p) => behind(p, label(p)).x}
        offsetY={(p) => behind(p, label(p)).y}
      />
      <Scatter data={[goal]} {...from} r={9} fill="#75aadb" stroke="white" />
      <Annotate data={[goal]} {...from} label={() => shirt} offsetY={3.5} />
    </Pitch>
  );
}
