/**
 * A team's pass network, replayed through the half. Every player's disc starts
 * at kick-off in their team-sheet slot (the starting formation) and morphs
 * towards their average position as it takes in each touch, settling exactly
 * where the finished network has it at full time. Partnerships fade in and
 * thicken gradually as passes add up. Every pass eases in over most of a
 * second, so the whole thing moves slowly and smoothly rather than ticking
 * pass by pass. The pitch is upright (attacking up the screen).
 *
 * Everything is a pure function of `minute`, the match clock; pass `FULL_TIME`
 * for the finished network.
 */
import { Arrows, Pitch, usePitch } from "@pitchkit/react";
import { Upright } from "../charts";
import { PitchStage } from "../components/Chrome";
import type { TeamNetwork } from "../data";
import { appearance, FONT } from "../theme";

const PAD = { top: 6, right: 6, bottom: 6, left: 6 };

/** Screen height of an upright pitch of this screen width. */
export const uprightHeight = (width: number) =>
  Math.round(((width - PAD.top - PAD.bottom) * 120) / 80 + PAD.left + PAD.right);

/**
 * The units of a 4-2-3-1 team sheet, back to front, by StatsBomb position
 * name. The keeper comes on with the back line.
 */
const UNITS = [
  ["Goalkeeper", "Back"],
  ["Defensive Midfield"],
  ["Wing", "Attacking Midfield"],
  ["Forward"],
] as const;

const unitOf = (position: string) =>
  UNITS.findIndex((words) => words.some((w) => position.includes(w)));

/**
 * The outfield units of the starting formation, back to front: how many
 * players and how far up the pitch the unit stands on the team sheet.
 */
export function formationUnits(net: TeamNetwork) {
  return UNITS.map((_, u) => {
    const members = net.nodes.filter(
      (n) => unitOf(n.position) === u && n.position !== "Goalkeeper",
    );
    return {
      count: members.length,
      x: members.reduce((sum, n) => sum + n.slot[0], 0) / members.length,
    };
  });
}

/** Screen y, from the top of an upright pitch of this width, of pitch x (StatsBomb units). */
export const uprightY = (width: number, x: number) => {
  const height = uprightHeight(width);
  return height - PAD.left - (x / 120) * (height - PAD.left - PAD.right);
};

/** A minute after every pass: the finished network. */
export const FULL_TIME = Infinity;

/** Radius of a player's disc before scaling. */
const DISC = 19;
/** Name label size before scaling. */
const LABEL = 21;

/** Closest two discs may sit, in pitch units, before they are nudged apart. */
const MIN_GAP = 7.5;

// Animation timings, in frames; `pace` converts them to match minutes.
/** A new pass or touch eases into widths, sizes and positions over this long. */
const EASE_IN = 24;
/**
 * How many touches' worth of weight the team-sheet slot carries at kick-off.
 * It fades to nothing by the end of the half, so the replay always lands on
 * the true average positions.
 */
const SLOT_WEIGHT = 6;

type Point = { x: number; y: number };

/** Nudges discs apart where two would overlap (Mainoo and Foden average 3 yards apart). */
function separate(positions: Map<number, Point>) {
  const pos = [...positions].map(([id, p]) => ({ id, x: p.x, y: p.y }));
  for (let iter = 0; iter < 40; iter++) {
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
  return new Map(pos.map((p) => [p.id, { x: p.x, y: p.y }]));
}

const growth = (involvements: number) => 0.95 + Math.sqrt(involvements / 90) * 0.75;

const surname = (name: string) => {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};

export interface Link {
  a: number;
  b: number;
  /** Passes so far, eased: grows smoothly as each one lands. */
  weight: number;
  /** Passes so far, whole. */
  count: number;
}

export interface NetworkState {
  /** Partnerships so far, keyed "a-b" with a < b. */
  links: Map<string, Link>;
  /** Involvements so far (passes made + received), eased, per player. */
  involved: Map<number, number>;
  /** Where each disc is drawn: the running average position, separated. */
  positions: Map<number, Point>;
  /** Completed passes so far. */
  landed: number;
  /** The partnership with the most passes so far. */
  top: Link | undefined;
}

/** Replays the half up to `minute`; `pace` is match minutes per video frame. */
export function networkAt(net: TeamNetwork, minute: number, pace = 1): NetworkState {
  const ease = EASE_IN * pace;
  const links = new Map<string, Link>();
  const involved = new Map<number, number>();
  let landed = 0;
  for (const p of net.passes) {
    if (p.t > minute) break;
    const age = minute - p.t;
    const w = Math.min(age / ease, 1);
    const a = Math.min(p.from, p.to);
    const b = Math.max(p.from, p.to);
    const key = `${a}-${b}`;
    const link = links.get(key) ?? { a, b, weight: 0, count: 0 };
    link.weight += w;
    link.count += 1;
    links.set(key, link);
    landed += 1;
    for (const id of [p.from, p.to]) {
      involved.set(id, (involved.get(id) ?? 0) + w);
    }
  }

  // Each position blends the team-sheet slot with every touch so far (each
  // easing in); the slot's weight fades out over the half.
  const lastTouch = Math.max(...net.nodes.map((n) => n.track.at(-1)?.[0] ?? 0));
  const slotWeight = SLOT_WEIGHT * Math.max(0, 1 - minute / lastTouch);
  const averages = new Map<number, Point>();
  for (const n of net.nodes) {
    let sw = slotWeight;
    let sx = slotWeight * n.slot[0];
    let sy = slotWeight * n.slot[1];
    for (const [t, x, y] of n.track) {
      if (t > minute) break;
      const w = Math.max(Math.min((minute - t) / ease, 1), 1e-3);
      sw += w;
      sx += w * x;
      sy += w * y;
    }
    averages.set(n.id, { x: sx / sw, y: sy / sw });
  }

  let top: Link | undefined;
  for (const l of links.values()) if (!top || l.count > top.count) top = l;
  return { links, involved, positions: separate(averages), landed, top };
}

const finals = new WeakMap<TeamNetwork, NetworkState>();
/** The finished network, worked out once. */
export function finalNetwork(net: TeamNetwork) {
  let state = finals.get(net);
  if (!state) {
    state = networkAt(net, FULL_TIME);
    finals.set(net, state);
  }
  return state;
}

/** The final at the Olympiastadion was played on a 105 × 68 m pitch. */
const METRES_PER_UNIT = { x: 105 / 120, y: 68 / 80 };

/**
 * A team's shape from its average positions: height from the furthest
 * forward outfield player to the last outfield defender, width between the
 * two widest outfield players, in metres.
 */
export function shapeOf(net: TeamNetwork) {
  const outfield = net.nodes.filter((n) => n.position !== "Goalkeeper");
  const furthest = outfield.reduce((a, b) => (b.x > a.x ? b : a));
  const lastDefender = outfield.reduce((a, b) => (b.x < a.x ? b : a));
  const left = outfield.reduce((a, b) => (b.y < a.y ? b : a));
  const right = outfield.reduce((a, b) => (b.y > a.y ? b : a));
  return {
    furthest,
    lastDefender,
    left,
    right,
    height: Math.round((furthest.x - lastDefender.x) * METRES_PER_UNIT.x),
    /** How far up the pitch the last defender sat, from their own goal line. */
    lineHeight: lastDefender.x * METRES_PER_UNIT.x,
    width: Math.round((right.y - left.y) * METRES_PER_UNIT.y),
  };
}

const width_ = (weight: number) => Math.min(1.5 + weight * 0.5, 17);
const opacity_ = (weight: number) => Math.min(0.28 + weight * 0.05, 0.92);

export function NetworkPitch({
  net,
  color,
  width,
  minute = FULL_TIME,
  pace = 1,
  showNames = true,
  highlight = 0,
  measure = 0,
  reveal = UNITS.length,
}: {
  net: TeamNetwork;
  color: string;
  /** Screen width; the pitch is upright, so it is the pitch's width. */
  width: number;
  minute?: number;
  /** Match minutes per video frame. */
  pace?: number;
  showNames?: boolean;
  /** 0..1: pick out the team's strongest link. */
  highlight?: number;
  /** 0..1: draw the shape's height and width on the finished network. */
  measure?: number;
  /**
   * 0..4: how much of the starting formation is on the pitch, unit by unit
   * (back line with the keeper, holding midfield, attacking midfield,
   * striker). Fractions pop the next unit in.
   */
  reveal?: number;
}) {
  const height = uprightHeight(width);
  const s = width / 720;
  const state = minute === FULL_TIME ? finalNetwork(net) : networkAt(net, minute, pace);
  const at = (id: number) => state.positions.get(id)!;
  // Weakest first, so the strong partnerships draw on top.
  const lines = [...state.links.values()]
    .sort((p, q) => p.weight - q.weight)
    .map((l) => {
      const f = at(l.a);
      const t = at(l.b);
      return { x: f.x, y: f.y, x2: t.x, y2: t.y, l };
    });
  const top = net.topPair;
  const topNow = state.links.get(`${top.a}-${top.b}`);

  return (
    <PitchStage>
      <Upright width={width} height={height}>
        <Pitch type="statsbomb" width={height} height={width} padding={PAD} appearance={appearance}>
          <Arrows
            data={lines}
            x={(e) => e.x}
            y={(e) => e.y}
            x2={(e) => e.x2}
            y2={(e) => e.y2}
            stroke={color}
            strokeWidth={(e) => width_(e.l.weight) * s}
            // A new partnership fades in over its first pass.
            strokeOpacity={(e) => opacity_(e.l.weight) * Math.min(e.l.weight, 1)}
            headSize={0}
          />
          {highlight > 0 && topNow && (
            <Arrows
              data={[topNow]}
              x={(l) => at(l.a).x}
              y={(l) => at(l.a).y}
              x2={(l) => at(l.b).x}
              y2={(l) => at(l.b).y}
              stroke="white"
              strokeWidth={(width_(topNow.weight) + 6 * highlight) * s}
              strokeOpacity={0.35 + 0.55 * highlight}
              headSize={0}
            />
          )}
          {measure > 0 && <Shape net={net} positions={state.positions} s={s} t={measure} />}
          <Discs
            net={net}
            state={state}
            reveal={reveal}
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

/**
 * Dimension lines for the team's shape: a vertical one beside the team from
 * the last defender up to the furthest player forward, a horizontal one above it between the
 * two widest players, each with dashed guides back to the players. Lines draw
 * out over the first half of `t`, labels pop in over the second.
 */
function Shape({
  net,
  positions,
  s,
  t,
}: {
  net: TeamNetwork;
  positions: Map<number, Point>;
  s: number;
  t: number;
}) {
  const { transform } = usePitch();
  const shape = shapeOf(net);
  const at = (id: number) => positions.get(id)!;
  const px = (x: number, y: number) => transform.toPixel([x, y]);
  const draw = Math.min(t / 0.6, 1);
  const label = Math.max(0, Math.min((t - 0.5) / 0.4, 1));
  const ink = "rgba(255,255,255,0.95)";

  // Height: a line in pitch-x just outside the widest player on the left of
  // the screen (the quieter flank for both teams), from the last defender to
  // the furthest player forward.
  const yLine = Math.max(at(shape.left.id).y - 4.5, 2.5);
  const xBack = at(shape.lastDefender.id).x;
  const xFront = at(shape.furthest.id).x;
  // Width: a line in pitch-y just ahead of the most advanced player (the top
  // of the screen), between the two widest players.
  const xLine = Math.min(at(shape.furthest.id).x + 7, 116);
  const yLeft = at(shape.left.id).y;
  const yRight = at(shape.right.id).y;

  const seg = (a: readonly [number, number], b: readonly [number, number], u = 1) => {
    const [x1, y1] = px(a[0], a[1]);
    const [x2, y2] = px(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u);
    return { x1, y1, x2, y2 };
  };
  const tick = 2.2;
  const fs = 44 * s;
  // Keep the label inside the pitch: half its width, in pitch units.
  const unit = transform.toPixel([0, 1])[1] - transform.toPixel([0, 0])[1];
  const halfTag = ((4 * fs * 0.5 + 18 * s) / 2 + 4 * s) / Math.abs(unit);
  const midH = px((xBack + xFront) / 2, Math.max(yLine, halfTag));
  const midW = px(xLine, (yLeft + yRight) / 2);

  const Tag = ({ at: [x, y], text }: { at: readonly [number, number]; text: string }) => (
    <g transform={`translate(${x} ${y}) rotate(90) scale(${0.6 + 0.4 * label})`} opacity={label}>
      <rect
        x={-(text.length * fs * 0.5 + 18 * s) / 2}
        y={-fs * 0.68}
        width={text.length * fs * 0.5 + 18 * s}
        height={fs * 1.36}
        rx={8 * s}
        fill="rgba(4,10,7,0.92)"
        stroke={ink}
        strokeWidth={2 * s}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT.display}
        fontSize={fs}
        letterSpacing={0.5 * s}
        fill="white"
      >
        {text}
      </text>
    </g>
  );

  return (
    <g data-pitchkit-mark="shape">
      <g
        stroke={ink}
        strokeWidth={1.6 * s}
        strokeDasharray={`${5 * s} ${5 * s}`}
        opacity={0.6 * draw}
      >
        <line {...seg([xBack, at(shape.lastDefender.id).y], [xBack, yLine])} />
        <line {...seg([xFront, at(shape.furthest.id).y], [xFront, yLine])} />
        <line {...seg([at(shape.left.id).x, yLeft], [xLine, yLeft])} />
        <line {...seg([at(shape.right.id).x, yRight], [xLine, yRight])} />
      </g>
      <g stroke={ink} strokeWidth={3 * s} strokeLinecap="round">
        <line {...seg([xBack, yLine], [xFront, yLine], draw)} />
        <line {...seg([xBack, yLine - tick], [xBack, yLine + tick])} opacity={draw} />
        <line
          {...seg([xFront, yLine - tick], [xFront, yLine + tick])}
          opacity={draw >= 1 ? 1 : 0}
        />
        <line {...seg([xLine, yLeft], [xLine, yRight], draw)} />
        <line {...seg([xLine - tick, yLeft], [xLine + tick, yLeft])} opacity={draw} />
        <line
          {...seg([xLine - tick, yRight], [xLine + tick, yRight])}
          opacity={draw >= 1 ? 1 : 0}
        />
      </g>
      <Tag at={midH} text={`${shape.height} M`} />
      <Tag at={midW} text={`${shape.width} M`} />
    </g>
  );
}

/** The players as discs with their squad numbers, kept upright against the pitch's rotation. */
function Discs({
  net,
  state,
  reveal,
  color,
  s,
  showNames,
  emphasis,
  highlight,
}: {
  net: TeamNetwork;
  state: NetworkState;
  reveal: number;
  color: string;
  s: number;
  showNames: boolean;
  emphasis: number[];
  highlight: number;
}) {
  const { transform } = usePitch();
  const labels = placeLabels(net, finalNetwork(net).positions, transform.toPixel, s);
  const discs = net.nodes.map((n) => {
    // Pop in with the player's unit, with a small overshoot.
    const age = Math.max(0, Math.min(reveal - unitOf(n.position), 1));
    const pop = age >= 1 ? 1 : Math.sin(age * Math.PI * 0.5) * (1 + 0.25 * Math.sin(age * Math.PI));
    const grow = growth(state.involved.get(n.id) ?? 0);
    const boost = emphasis.includes(n.id) ? 1 + 0.18 * highlight : 1;
    const k = 1.15 * s * grow * boost * pop;
    const p = state.positions.get(n.id)!;
    const [px, py] = transform.toPixel([p.x, p.y]);
    // Screen position: the pitch is turned -90°.
    return { n, k, pop, px, py, cx: py, cy: -px };
  });
  // While discs are still moving a name can end up under another disc or
  // name; fade it by how covered it is rather than letting it jump sides.
  const placed = discs.map((d) => {
    const b = labels.get(d.n.id)!.box(d.k);
    return { x0: d.cx + b.x0, x1: d.cx + b.x1, y0: d.cy + b.y0, y1: d.cy + b.y1 };
  });
  const visibility = discs.map((d, i) => {
    const box = placed[i]!;
    const area = (box.x1 - box.x0) * (box.y1 - box.y0);
    let covered = 0;
    discs.forEach((o, j) => {
      if (j === i) return;
      const r = DISC * o.k;
      covered += overlap(box, { x0: o.cx - r, x1: o.cx + r, y0: o.cy - r, y1: o.cy + r });
      // Between two names, the busier player's stays.
      if (o.k > d.k) covered += overlap(box, placed[j]!);
    });
    return 1 - Math.min(covered / (0.3 * area), 1);
  });
  return (
    <g data-pitchkit-mark="discs">
      {discs.map(({ n, k, px, py }, i) => {
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
            {showNames && (
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
                opacity={visibility[i]! * Math.max(0, (discs[i]!.pop - 0.6) / 0.4)}
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
type Box = { x0: number; y0: number; x1: number; y1: number };

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

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
  const inv = finalNetwork(net).involved;
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

  const placed: Box[] = [];
  const result = new Map<
    number,
    {
      anchor: "middle" | "start" | "end";
      dx: (k: number) => number;
      dy: (k: number) => number;
      /** Label box relative to the disc centre, in screen axes, for a disc scale `k`. */
      box: (k: number) => Box;
    }
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
    const r = (kk: number) => DISC * kk;
    result.set(
      n.id,
      best.side === "below"
        ? {
            anchor: "middle",
            dx: () => 0,
            dy: (kk) => r(kk) + 3 * s + fs * 0.85,
            box: (kk) => ({ x0: -w / 2, x1: w / 2, y0: r(kk) + 3 * s, y1: r(kk) + 3 * s + fs }),
          }
        : best.side === "above"
          ? {
              anchor: "middle",
              dx: () => 0,
              dy: (kk) => -r(kk) - 3 * s - fs * 0.15,
              box: (kk) => ({ x0: -w / 2, x1: w / 2, y0: -r(kk) - 3 * s - fs, y1: -r(kk) - 3 * s }),
            }
          : best.side === "right"
            ? {
                anchor: "start",
                dx: (kk) => r(kk) + 4 * s,
                dy: () => baseline,
                box: (kk) => ({
                  x0: r(kk) + 4 * s,
                  x1: r(kk) + 4 * s + w,
                  y0: -fs / 2,
                  y1: fs / 2,
                }),
              }
            : {
                anchor: "end",
                dx: (kk) => -r(kk) - 4 * s,
                dy: () => baseline,
                box: (kk) => ({
                  x0: -r(kk) - 4 * s - w,
                  x1: -r(kk) - 4 * s,
                  y0: -fs / 2,
                  y1: fs / 2,
                }),
              },
    );
  }
  return result;
}
