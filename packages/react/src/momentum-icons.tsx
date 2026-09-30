import type { MomentumEventKind, MomentumSide } from "./momentum-types.js";

export const SIDE_COLOR: Record<MomentumSide, string> = {
  home: "var(--pitch-series-1, #3b82f6)",
  away: "var(--pitch-series-2, #eb6834)",
};
export const CARD_RED = "var(--pitch-card-red, #ef4444)";
export const CARD_YELLOW = "var(--pitch-card-yellow, #facc15)";

/**
 * Whether an icon's own colour already says which team it is for. A card is
 * yellow or red whoever was booked, so it needs the team said another way.
 */
export function colorSaysTeam(kind: MomentumEventKind): boolean {
  return kind !== "yellow-card" && kind !== "red-card" && kind !== "own-goal";
}

/**
 * An icon's colour. Red for the two kinds whose meaning is their colour,
 * yellow for a yellow card, and the team's otherwise.
 */
export function iconColor(kind: MomentumEventKind, side: MomentumSide): string {
  if (kind === "red-card" || kind === "own-goal") return CARD_RED;
  if (kind === "yellow-card") return CARD_YELLOW;
  return SIDE_COLOR[side];
}

/** What an event is called when the caller hasn't said. */
export function kindLabel(kind: MomentumEventKind): string {
  const labels: Record<MomentumEventKind, string> = {
    goal: "Goal",
    "own-goal": "Own goal",
    "missed-penalty": "Missed penalty",
    "yellow-card": "Yellow card",
    "red-card": "Red card",
    substitution: "Substitution",
    var: "VAR",
  };
  return labels[kind];
}

/**
 * The event icons, drawn for PitchKit on a 24-unit grid in the mark's own
 * language: round caps, one stroke weight, no fills except the cards. They
 * paint in `currentColor`, so the chart sets the colour and a consumer's
 * CSS can override it.
 *
 * Kept in a 24-unit box so they scale from a 14px chart marker to a 14px
 * readout glyph without redrawing. They are deliberately ours rather than
 * another site's artwork: a chart library is the wrong place to redistribute
 * someone else's icons.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A football: the ball, its centre panel, and five seams to the rim. */
function Ball({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const k = r / 9.5;
  const at = (x: number, y: number) =>
    `${(cx + (x - 12) * k).toFixed(2)} ${(cy + (y - 12) * k).toFixed(2)}`;
  return (
    <g {...STROKE}>
      <circle cx={cx} cy={cy} r={r} />
      <path
        d={`M${at(12, 8.2)}L${at(15.6, 10.8)}L${at(14.2, 15)}L${at(9.8, 15)}L${at(8.4, 10.8)}Z`}
      />
      <path
        d={[
          `M${at(12, 8.2)}L${at(12, 2.6)}`,
          `M${at(15.6, 10.8)}L${at(20.6, 9.2)}`,
          `M${at(14.2, 15)}L${at(17.2, 19.4)}`,
          `M${at(9.8, 15)}L${at(6.8, 19.4)}`,
          `M${at(8.4, 10.8)}L${at(3.4, 9.2)}`,
        ].join("")}
      />
    </g>
  );
}

/** The shape of each icon, in its own 24-unit box. */
export function MomentumIconShape({ kind }: { kind: MomentumEventKind }) {
  switch (kind) {
    case "goal":
      return <Ball cx={12} cy={12} r={9.5} />;

    case "own-goal":
      // The ball, and an arrow turning back on itself: it went the wrong way.
      return (
        <g>
          <Ball cx={15.5} cy={15.5} r={6} />
          <path {...STROKE} d="M20 4.5H9A4.5 4.5 0 0 0 4.5 9v4" />
          <path {...STROKE} d="M2.2 10.8 4.5 13.1l2.3-2.3" />
        </g>
      );

    case "missed-penalty":
      return (
        <g>
          <Ball cx={12} cy={12} r={9.5} />
          <path {...STROKE} d="M3.5 20.5 20.5 3.5" strokeWidth={2.25} />
        </g>
      );

    case "yellow-card":
    case "red-card":
      return <rect x={6.5} y={3} width={11} height={18} rx={2} fill="currentColor" />;

    case "substitution":
      return (
        <g {...STROKE}>
          <path d="M17 20V5M13 9l4-4 4 4" />
          <path d="M7 4v15M3 15l4 4 4-4" />
        </g>
      );

    case "var":
      return (
        <g {...STROKE}>
          <rect x={3} y={5} width={18} height={14} rx={2} />
          <path d="M8 9.5l4 6 4-6" />
        </g>
      );
  }
}

/** An icon placed in a chart: centred on (`x`, `y`), `size` pixels square. */
export function MomentumIcon({
  kind,
  x,
  y,
  size,
  color,
}: {
  kind: MomentumEventKind;
  x: number;
  y: number;
  size: number;
  color: string;
}) {
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`}
      style={{ color }}
    >
      <MomentumIconShape kind={kind} />
    </g>
  );
}

/** The same icon as a standalone `<svg>`, for use inside a readout. */
export function MomentumGlyph({
  kind,
  size = 14,
  color,
}: {
  kind: MomentumEventKind;
  size?: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ color, flexShrink: 0 }}
    >
      <MomentumIconShape kind={kind} />
    </svg>
  );
}
