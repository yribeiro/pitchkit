/**
 * A team's pass network, built pass by pass: each completed pass is a ball
 * travelling from passer to receiver, the link between them thickens when it
 * lands, and a player's disc appears with their first involvement and grows
 * with every touch. The pitch is upright (attacking up the screen).
 *
 * Everything is a pure function of `minute`, the match clock.
 */
import { Arrows, Comet, Pitch, Scatter, usePitch } from "@pitchkit/react";
import { Upright } from "../charts";
import { PitchStage } from "../components/Chrome";
import type { TeamNetwork } from "../data";
import { appearance, FONT } from "../theme";

const PAD = { top: 6, right: 6, bottom: 6, left: 6 };

/** Screen height of an upright pitch of this screen width. */
export const uprightHeight = (width: number) =>
  Math.round(((width - PAD.top - PAD.bottom) * 120) / 80 + PAD.left + PAD.right);

/** Radius of a player's disc before scaling. */
const DISC = 19;
/** Name label size before scaling. */
const LABEL = 21;

/** Closest two discs may sit, in pitch units, before they are nudged apart. */
const MIN_GAP = 6.5;

const layouts = new WeakMap<TeamNetwork, Map<number, { x: number; y: number }>>();

/**
 * Where each disc is drawn: the player's average position, nudged apart
 * where two would overlap (Mainoo and Foden average 3 yards apart).
 */
export function discPositions(net: TeamNetwork) {
  const cached = layouts.get(net);
  if (cached) return cached;
  const pos = net.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));
  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i]!;
        const b = pos[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d >= MIN_GAP) continue;
        const push = (MIN_GAP - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
    }
  }
  const map = new Map(pos.map((p) => [p.id, { x: p.x, y: p.y }]));
  layouts.set(net, map);
  return map;
}

/** Total involvements per player over the whole half. */
function finalInvolvements(net: TeamNetwork) {
  const inv = new Map<number, number>();
  for (const p of net.passes) {
    inv.set(p.from, (inv.get(p.from) ?? 0) + 1);
    inv.set(p.to, (inv.get(p.to) ?? 0) + 1);
  }
  return inv;
}

const growth = (involvements: number) => 0.95 + Math.sqrt(involvements / 90) * 0.75;

const surname = (name: string) => {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};

export interface NetworkState {
  /** Passes landed so far per pair, keyed "a-b" with a < b. */
  pairs: Map<string, { a: number; b: number; count: number }>;
  /** Involvements so far (passes made + received) per player. */
  involved: Map<number, number>;
  /** Minute of each player's first involvement. */
  firstSeen: Map<number, number>;
  landed: number;
  inFlight: { from: number; to: number; u: number }[];
}

/** Replays the passes up to `minute`; `flight` is how long a ball is in the air, in match minutes. */
export function networkAt(net: TeamNetwork, minute: number, flight: number): NetworkState {
  const pairs = new Map<string, { a: number; b: number; count: number }>();
  const involved = new Map<number, number>();
  const firstSeen = new Map<number, number>();
  const inFlight: NetworkState["inFlight"] = [];
  let landed = 0;
  for (const p of net.passes) {
    const depart = p.t - flight;
    if (depart > minute) break;
    if (!firstSeen.has(p.from)) firstSeen.set(p.from, depart);
    if (p.t > minute) {
      inFlight.push({ from: p.from, to: p.to, u: (minute - depart) / flight });
      continue;
    }
    if (!firstSeen.has(p.to)) firstSeen.set(p.to, p.t);
    landed += 1;
    const a = Math.min(p.from, p.to);
    const b = Math.max(p.from, p.to);
    const key = `${a}-${b}`;
    pairs.set(key, { a, b, count: (pairs.get(key)?.count ?? 0) + 1 });
    involved.set(p.from, (involved.get(p.from) ?? 0) + 1);
    involved.set(p.to, (involved.get(p.to) ?? 0) + 1);
  }
  return { pairs, involved, firstSeen, landed, inFlight };
}

export function NetworkPitch({
  net,
  color,
  width,
  minute,
  flight,
  showNames = true,
  highlight = 0,
}: {
  net: TeamNetwork;
  color: string;
  /** Screen width; the pitch is upright, so it is the pitch's width. */
  width: number;
  minute: number;
  flight: number;
  showNames?: boolean;
  /** 0..1: pulse the team's strongest link. */
  highlight?: number;
}) {
  const height = uprightHeight(width);
  const s = width / 720;
  const state = networkAt(net, minute, flight);
  const positions = discPositions(net);
  const node = (id: number) => positions.get(id)!;
  const edges = [...state.pairs.values()];
  const balls = state.inFlight.map((b) => {
    const f = node(b.from);
    const t = node(b.to);
    const at = (u: number) => [f.x + (t.x - f.x) * u, f.y + (t.y - f.y) * u] as const;
    return { head: at(b.u), tail: at(Math.max(0, b.u - 0.45)) };
  });
  const top = net.topPair;
  const topNow = state.pairs.get(`${top.a}-${top.b}`);

  return (
    <PitchStage>
      <Upright width={width} height={height}>
        <Pitch type="statsbomb" width={height} height={width} padding={PAD} appearance={appearance}>
          <Arrows
            data={edges}
            x={(e) => node(e.a).x}
            y={(e) => node(e.a).y}
            x2={(e) => node(e.b).x}
            y2={(e) => node(e.b).y}
            stroke={color}
            strokeWidth={(e) => Math.min(1.5 + e.count * 0.5, 17) * s}
            strokeOpacity={(e) => Math.min(0.28 + e.count * 0.05, 0.92)}
            headSize={0}
          />
          {highlight > 0 && topNow && (
            <Arrows
              data={[topNow]}
              x={(e) => node(e.a).x}
              y={(e) => node(e.a).y}
              x2={(e) => node(e.b).x}
              y2={(e) => node(e.b).y}
              stroke="white"
              strokeWidth={(Math.min(1.5 + topNow.count * 0.5, 17) + 6 * highlight) * s}
              strokeOpacity={0.35 + 0.55 * highlight}
              headSize={0}
            />
          )}
          <Comet
            data={balls}
            x={(b) => b.tail[0]}
            y={(b) => b.tail[1]}
            x2={(b) => b.head[0]}
            y2={(b) => b.head[1]}
            color="white"
            gradient
            endWidth={6 * s}
          />
          <Scatter
            data={balls}
            x={(b) => b.head[0]}
            y={(b) => b.head[1]}
            r={5.5 * s}
            fill="white"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={1.5 * s}
          />
          <Discs
            net={net}
            state={state}
            minute={minute}
            flight={flight}
            color={color}
            s={s}
            showNames={showNames}
            emphasis={highlight > 0 ? [top.a, top.b] : []}
            highlight={highlight}
          />
        </Pitch>
      </Upright>
    </PitchStage>
  );
}

/** The players as discs with their squad numbers, kept upright against the pitch's rotation. */
function Discs({
  net,
  state,
  minute,
  flight,
  color,
  s,
  showNames,
  emphasis,
  highlight,
}: {
  net: TeamNetwork;
  state: NetworkState;
  minute: number;
  flight: number;
  color: string;
  s: number;
  showNames: boolean;
  emphasis: number[];
  highlight: number;
}) {
  const { transform } = usePitch();
  const positions = discPositions(net);
  const labels = placeLabels(net, positions, transform.toPixel, s);
  return (
    <g data-pitchkit-mark="discs">
      {net.nodes.map((n) => {
        const seen = state.firstSeen.get(n.id);
        if (seen === undefined) return null;
        // Pop in over a little under one flight, with a small overshoot.
        const age = Math.min((minute - seen) / (flight * 0.8), 1);
        const pop =
          age >= 1 ? 1 : Math.sin(age * Math.PI * 0.5) * (1 + 0.25 * Math.sin(age * Math.PI));
        const inv = state.involved.get(n.id) ?? 0;
        const grow = growth(inv);
        const boost = emphasis.includes(n.id) ? 1 + 0.18 * highlight : 1;
        const k = 1.15 * s * pop * grow * boost;
        const at = positions.get(n.id)!;
        const [px, py] = transform.toPixel([at.x, at.y]);
        const label = labels.get(n.id)!;
        return (
          // The pitch is turned -90° on screen, so +90° here keeps numbers upright.
          <g key={n.id} transform={`translate(${px} ${py}) rotate(90)`}>
            <g transform={`scale(${k})`}>
              <circle
                r={DISC}
                fill={color}
                stroke={emphasis.includes(n.id) ? "white" : "rgba(4,10,7,0.95)"}
                strokeWidth={emphasis.includes(n.id) ? 2 + 2 * highlight : 2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONT.display}
                fontSize={22}
                fill="#04100a"
              >
                {n.jersey}
              </text>
            </g>
            {showNames && pop > 0.6 && (
              <text
                x={label.dx(k)}
                y={label.dy(k)}
                textAnchor={label.anchor}
                fontFamily={FONT.display}
                fontSize={LABEL * s}
                letterSpacing={0.6 * s}
                fill="white"
                stroke="rgba(4,10,7,0.9)"
                strokeWidth={4 * s}
                paintOrder="stroke"
                opacity={Math.min((pop - 0.6) / 0.4, 1)}
              >
                {surname(n.name).toUpperCase()}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

type Side = "below" | "above" | "right" | "left";

/**
 * Picks a side for each surname so labels don't sit on other discs or each
 * other, placing the busiest players first. Worked out once at full size, so
 * a label never jumps sides while the network builds.
 *
 * The pitch is turned -90° on screen, so a pitch pixel (px, py) is at screen
 * (py, -px); the disc groups are counter-rotated, so their local axes are
 * screen axes.
 */
function placeLabels(
  net: TeamNetwork,
  positions: Map<number, { x: number; y: number }>,
  toPixel: (p: readonly [number, number]) => readonly [number, number],
  s: number,
) {
  const fs = LABEL * s;
  const inv = finalInvolvements(net);
  type Box = { x0: number; y0: number; x1: number; y1: number };
  const discs = new Map<number, Box & { cx: number; cy: number }>();
  for (const n of net.nodes) {
    const p = positions.get(n.id)!;
    const [px, py] = toPixel([p.x, p.y]);
    const k = 1.15 * s * growth(inv.get(n.id) ?? 0);
    const cx = py;
    const cy = -px;
    discs.set(n.id, {
      cx,
      cy,
      x0: cx - DISC * k,
      x1: cx + DISC * k,
      y0: cy - DISC * k,
      y1: cy + DISC * k,
    });
  }
  const overlap = (a: Box, b: Box) =>
    Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
    Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

  const placed: Box[] = [];
  const result = new Map<
    number,
    { anchor: "middle" | "start" | "end"; dx: (k: number) => number; dy: (k: number) => number }
  >();
  const order = [...net.nodes].sort((a, b) => (inv.get(b.id) ?? 0) - (inv.get(a.id) ?? 0));
  for (const n of order) {
    const sh = discs.get(n.id)!;
    const w = surname(n.name).length * fs * 0.56;
    const sides: { side: Side; box: Box }[] = [
      {
        side: "below",
        box: { x0: sh.cx - w / 2, x1: sh.cx + w / 2, y0: sh.y1 + 2 * s, y1: sh.y1 + 2 * s + fs },
      },
      {
        side: "above",
        box: { x0: sh.cx - w / 2, x1: sh.cx + w / 2, y0: sh.y0 - 2 * s - fs, y1: sh.y0 - 2 * s },
      },
      {
        side: "right",
        box: { x0: sh.x1 + 3 * s, x1: sh.x1 + 3 * s + w, y0: sh.cy - fs / 2, y1: sh.cy + fs / 2 },
      },
      {
        side: "left",
        box: { x0: sh.x0 - 3 * s - w, x1: sh.x0 - 3 * s, y0: sh.cy - fs / 2, y1: sh.cy + fs / 2 },
      },
    ];
    let best = sides[0]!;
    let bestScore = Infinity;
    sides.forEach((c, i) => {
      let score = i * 4 * s * s;
      for (const [id, other] of discs) if (id !== n.id) score += overlap(c.box, other);
      for (const p of placed) score += overlap(c.box, p) * 2;
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    });
    placed.push(best.box);
    const baseline = 0.36 * fs;
    result.set(
      n.id,
      best.side === "below"
        ? { anchor: "middle", dx: () => 0, dy: (kk) => DISC * kk + 3 * s + fs * 0.85 }
        : best.side === "above"
          ? { anchor: "middle", dx: () => 0, dy: (kk) => -DISC * kk - 3 * s - fs * 0.15 }
          : best.side === "right"
            ? { anchor: "start", dx: (kk) => DISC * kk + 4 * s, dy: () => baseline }
            : { anchor: "end", dx: (kk) => -DISC * kk - 4 * s, dy: () => baseline },
    );
  }
  return result;
}
