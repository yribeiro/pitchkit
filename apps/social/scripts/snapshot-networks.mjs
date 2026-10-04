/**
 * Snapshot for the pass-network reel: Spain's and England's first-half pass
 * networks in the Euro 2024 final, with every completed pass in order so the
 * reel can build each network pass by pass.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:networks --workspace=social
 *
 * A node sits at the player's average position over their passes and
 * receptions (the usual pass-network convention). Coordinates are StatsBomb
 * units with each team attacking left to right. The window is the first half
 * for both sides, so the two are like for like (Spain's first change came at
 * half time).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchLineups,
  fetchMatchEvents,
  isComplete,
  passes,
} from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const round = (n, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;

const MATCH = 3943043;
const events = await fetchMatchEvents(MATCH);
const lineups = await fetchLineups(MATCH);
const nickname = new Map(
  lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.player_nickname ?? p.player_name])),
);

function network(team) {
  const xi = events.find((e) => e.type.name === "Starting XI" && e.team.name === team);
  const nodes = new Map(
    xi.tactics.lineup.map((l) => [
      l.player.id,
      {
        id: l.player.id,
        name: nickname.get(l.player.id) ?? l.player.name,
        jersey: l.jersey_number,
        position: l.position.name,
        sx: 0,
        sy: 0,
        n: 0,
      },
    ]),
  );
  const all = passes(events).filter((p) => p.team.name === team && p.period === 1);
  const done = all
    .filter(isComplete)
    .filter((p) => p.pass.recipient && nodes.has(p.player?.id) && nodes.has(p.pass.recipient.id));
  for (const p of all) {
    const n = nodes.get(p.player?.id);
    if (!n) continue;
    n.sx += p.x;
    n.sy += p.y;
    n.n += 1;
  }
  for (const p of done) {
    const n = nodes.get(p.pass.recipient.id);
    n.sx += p.endX;
    n.sy += p.endY;
    n.n += 1;
  }
  const pairs = new Map();
  for (const p of done) {
    const a = p.player.id;
    const b = p.pass.recipient.id;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    pairs.set(key, {
      a: Math.min(a, b),
      b: Math.max(a, b),
      count: (pairs.get(key)?.count ?? 0) + 1,
    });
  }
  const top = [...pairs.values()].sort((x, y) => y.count - x.count)[0];
  const busiest = [...nodes.values()].sort((x, y) => y.n - x.n)[0];
  return {
    team,
    attempted: all.length,
    completed: all.filter(isComplete).length,
    nodes: [...nodes.values()].map(({ sx, sy, n, ...rest }) => ({
      ...rest,
      x: round(sx / n),
      y: round(sy / n),
      touches: n,
    })),
    // Every completed pass between two starters, in match order.
    passes: done.map((p) => ({
      t: round(p.minute + p.second / 60, 2),
      from: p.player.id,
      to: p.pass.recipient.id,
    })),
    topPair: { a: top.a, b: top.b, count: top.count },
    busiest: { id: busiest.id, involvements: busiest.n },
  };
}

const data = { matchId: MATCH, spain: network("Spain"), england: network("England") };
writeFileSync(join(OUT, "pass-networks.json"), JSON.stringify(data));
for (const t of [data.spain, data.england]) {
  const nm = (id) => t.nodes.find((n) => n.id === id)?.name;
  console.log(
    t.team,
    `attempted ${t.attempted}, completed ${t.completed}, starter-to-starter ${t.passes.length}`,
    `top pair ${nm(t.topPair.a)} ↔ ${nm(t.topPair.b)} ${t.topPair.count}`,
    `busiest ${nm(t.busiest.id)} ${t.busiest.involvements}`,
  );
}
