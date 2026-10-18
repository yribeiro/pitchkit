import { useEffect, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { pitchTokens } from "@pitchkit/core";
import type { Viewport } from "@pitchkit/core";
import { CARD_RED, CARD_YELLOW } from "./chart-tokens.js";
import { usePitchContext } from "./context.js";
import { BALL_PATH, BALL_VIEWBOX, BOOT_PATH, BOOT_TRANSFORM } from "./avatar-icons.js";

export type PlayerCard = "yellow" | "second-yellow" | "red";
export type PlayerSubstitution = "on" | "off";

export interface PlayerAvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Where the photo's centre sits, in the pitch's `type` units. */
  readonly x: number;
  readonly y: number;
  /** Shown under the photo, and the source of the initials when there is no photo. */
  readonly name: string;
  /** The shirt number, shown before the name. */
  readonly number?: number | string;
  /** A second yellow draws the yellow behind the red. */
  readonly card?: PlayerCard;
  /** `"on"` for a substitute who came on, `"off"` for a player who was replaced. */
  readonly subbed?: PlayerSubstitution;
  /** The count is shown from two up. */
  readonly goals?: number;
  readonly assists?: number;
  /**
   * The photo, as a plain `<img loading="lazy">`. For an optimised image
   * (`next/image`, a CDN component), pass it as `children` instead.
   */
  readonly src?: string;
  /**
   * The photo's diameter in pixels. Leave it unset to scale with the pitch,
   * or set `--pitch-avatar-size` in CSS.
   */
  readonly size?: number;
  /**
   * Replaces the photo. It fills a round, `position: relative` box the size
   * of the photo, so `<Image fill sizes="64px" />` from `next/image` works as is.
   */
  readonly children?: ReactNode;
}

const AVATAR_BG = `var(${pitchTokens.avatarBg}, #d4d8dd)`;
const AVATAR_RING = `var(${pitchTokens.avatarRing}, #ffffff)`;
const AVATAR_TEXT = `var(${pitchTokens.avatarText}, #ffffff)`;
const AVATAR_MUTED = `var(${pitchTokens.avatarMuted}, rgba(255, 255, 255, 0.7))`;
const ICON = `var(${pitchTokens.avatarIcon}, #111827)`;
/** Behind the ball's panels, so a dark ball still reads as a football on dark grass. */
const BALL_FILL = `var(${pitchTokens.avatarBall}, #ffffff)`;
const INITIALS = `var(${pitchTokens.avatarInitials}, #1f2937)`;
// The badges sit straight on the grass or the photo with no backing, so a
// thin halo in a contrasting colour, plus a soft shadow, is what separates
// them from whatever is behind. Dark icons get a light halo by default.
const ICON_HALO = `var(${pitchTokens.avatarIconHalo}, rgba(255, 255, 255, 0.9))`;
const ICON_SHADOW = `drop-shadow(0 0 0.75px ${ICON_HALO}) drop-shadow(0 0 0.75px ${ICON_HALO}) drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.35))`;
const SUB_ON = `var(${pitchTokens.subOn}, #22c55e)`;
const SUB_OFF = `var(${pitchTokens.subOff}, #ef4444)`;
/** The arrow that didn't happen: the down arrow for a player who came on. */
const SUB_IDLE = `var(${pitchTokens.subIdle}, #ffffff)`;

// Every size inside the avatar is a fraction of these two, so one CSS
// variable (or the `size` prop) rescales the whole thing without a re-render.
const SIZE = "var(--pk-avatar-size)";
const BADGE = "var(--pk-avatar-badge)";

/**
 * The photo's diameter when neither `size` nor `--pitch-avatar-size` says:
 * a tenth of the pitch's shorter side, so eleven fit across a pitch in
 * either orientation, held between a tappable minimum and a ceiling.
 */
export function defaultAvatarSize(viewport: Pick<Viewport, "width" | "height">): number {
  const side = Math.min(viewport.width, viewport.height);
  return Math.round(Math.min(72, Math.max(24, side * 0.1)));
}

/** "B. Díaz" → "BD", "Bono" → "B". */
export function playerInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0] as string;
  const last = words[words.length - 1] as string;
  return (words.length === 1 ? first.charAt(0) : first.charAt(0) + last.charAt(0)).toUpperCase();
}

/** What the badges say, in words, for a screen reader: "2 goals, yellow card". */
export function describePlayerEvents({
  goals,
  assists,
  card,
  subbed,
}: Pick<PlayerAvatarProps, "goals" | "assists" | "card" | "subbed">): string {
  const parts: string[] = [];
  const g = count(goals);
  const a = count(assists);
  if (g) parts.push(`${g} ${g === 1 ? "goal" : "goals"}`);
  if (a) parts.push(`${a} ${a === 1 ? "assist" : "assists"}`);
  if (card === "yellow") parts.push("yellow card");
  if (card === "second-yellow") parts.push("second yellow card");
  if (card === "red") parts.push("red card");
  if (subbed === "on") parts.push("substituted on");
  if (subbed === "off") parts.push("substituted off");
  return parts.join(", ");
}

/** A whole, positive count, or 0 for anything else. */
function count(n: number | undefined): number {
  return n !== undefined && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * A player's photo, number and name at a point on the pitch, with badges
 * for cards, substitution, goals and assists: the lineup graphic of a
 * match centre.
 *
 * It is HTML, not SVG, so the photo can be any image component. It renders
 * into an overlay `<Pitch>` stacks over its `<svg>`, which means it paints
 * after hydration and not on the server, like the Canvas layers (D30).
 */
export function PlayerAvatar({
  x,
  y,
  name,
  number,
  card,
  subbed,
  goals,
  assists,
  src,
  size,
  children,
  className,
  style,
  ...rest
}: PlayerAvatarProps) {
  const { transform, viewport, overlay: overlayRef } = usePitchContext();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // The overlay mounts after this component's own commit (it follows the
  // <svg> this sits in), so it is read in a passive effect, which runs once
  // every ref in the tree is attached. Only the avatar re-renders for it.
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    setOverlay(overlayRef.current);
  }, [overlayRef]);

  if (!overlay) return null;

  const [px, py] = transform.toPixel([x, y]);
  const autoSize = defaultAvatarSize(viewport);
  const goalCount = count(goals);
  const assistCount = count(assists);
  const summary = describePlayerEvents({ goals, assists, card, subbed });
  // `{photo && <Image … />}` passes false or "" when there is no photo, which
  // should fall back like no children at all.
  const hasChildren =
    children !== undefined && children !== null && children !== false && children !== "";
  const showImage = !hasChildren && src !== undefined && src !== failedSrc;

  const rootStyle = {
    "--pk-avatar-size":
      size !== undefined ? `${size}px` : `var(${pitchTokens.avatarSize}, ${autoSize}px)`,
    "--pk-avatar-badge": `max(14px, calc(${SIZE} * 0.4))`,
    position: "absolute",
    // Percentages of the overlay, which is the same box as the SVG's
    // viewBox: a resize moves the avatar before React re-renders it.
    left: `${(px / viewport.width) * 100}%`,
    top: `${(py / viewport.height) * 100}%`,
    // Centre the photo, not the photo and label together, on the point.
    transform: `translate(-50%, calc(${SIZE} / -2))`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "max-content",
    maxWidth: `calc(${SIZE} * 2.6)`,
    pointerEvents: "auto",
    ...style,
  } as CSSProperties;

  return createPortal(
    <div data-pitchkit-mark="player-avatar" className={className} style={rootStyle} {...rest}>
      <div
        data-pitchkit-part="avatar-photo"
        style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            overflow: "hidden",
            background: AVATAR_BG,
            boxShadow: `0 0 0 2px ${AVATAR_RING}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {hasChildren ? (
            children
          ) : showImage ? (
            <img
              src={src}
              alt=""
              width={size ?? autoSize}
              height={size ?? autoSize}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => setFailedSrc(src)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <span
              data-pitchkit-part="avatar-initials"
              aria-hidden
              style={{
                fontSize: `calc(${SIZE} * 0.36)`,
                fontWeight: 700,
                color: INITIALS,
                lineHeight: 1,
              }}
            >
              {playerInitials(name)}
            </span>
          )}
        </div>

        {(card || subbed) && (
          <BadgeColumn side="left">
            {card && (
              <Badge part="avatar-card">
                <CardIcon card={card} />
              </Badge>
            )}
            {subbed && (
              <Badge part="avatar-sub">
                <SubIcon subbed={subbed} />
              </Badge>
            )}
          </BadgeColumn>
        )}

        {(goalCount > 0 || assistCount > 0) && (
          <BadgeColumn side="right">
            {goalCount > 0 && (
              <Badge part="avatar-goals" count={goalCount}>
                <Glyph viewBox={BALL_VIEWBOX}>
                  <circle cx={11.8} cy={12} r={11.6} fill={BALL_FILL} />
                  <path d={BALL_PATH} fill="currentColor" fillRule="evenodd" />
                </Glyph>
              </Badge>
            )}
            {assistCount > 0 && (
              <Badge part="avatar-assists" count={assistCount}>
                <Glyph>
                  <path
                    d={BOOT_PATH}
                    transform={BOOT_TRANSFORM}
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </Glyph>
              </Badge>
            )}
          </BadgeColumn>
        )}
      </div>

      <div
        data-pitchkit-part="avatar-label"
        style={{
          marginTop: `calc(${SIZE} * 0.1)`,
          fontSize: `max(10px, calc(${SIZE} * 0.24))`,
          fontWeight: 600,
          lineHeight: 1.15,
          textAlign: "center",
          overflowWrap: "break-word",
          color: AVATAR_TEXT,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
        }}
      >
        {number !== undefined && (
          <span data-pitchkit-part="avatar-number" style={{ color: AVATAR_MUTED }}>
            {number}{" "}
          </span>
        )}
        <span data-pitchkit-part="avatar-name">{name}</span>
        {summary && <span style={VISUALLY_HIDDEN}>, {summary}</span>}
      </div>
    </div>,
    overlay,
  );
}

const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/** A stack of badges overlapping the photo's left or right edge. */
function BadgeColumn({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: `calc(${BADGE} * -0.2)`,
        [side === "left" ? "right" : "left"]: `calc(100% - ${BADGE} * 0.45)`,
        display: "flex",
        flexDirection: "column",
        alignItems: side === "left" ? "flex-end" : "flex-start",
        gap: 2,
      }}
    >
      {children}
    </div>
  );
}

/**
 * One icon, with its count tucked into its bottom-right corner from two up.
 * No backing: the icon sits on the grass or the photo's edge, lifted by a
 * shadow.
 */
function Badge({ part, count, children }: { part: string; count?: number; children: ReactNode }) {
  return (
    <span
      data-pitchkit-part={part}
      data-count={count}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: BADGE,
        height: BADGE,
        color: ICON,
        filter: ICON_SHADOW,
      }}
    >
      {children}
      {count !== undefined && count > 1 && (
        <span
          data-pitchkit-part="avatar-count"
          style={{
            position: "absolute",
            right: `calc(${BADGE} * -0.22)`,
            bottom: `calc(${BADGE} * -0.18)`,
            fontSize: `calc(${BADGE} * 0.56)`,
            fontWeight: 800,
            lineHeight: 1,
            color: ICON,
            textShadow: `0 0 2px ${ICON_HALO}, 0 0 1px ${ICON_HALO}`,
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
}

/** An icon on the 24-unit grid, filling its badge. */
function Glyph({
  viewBox = "0 0 24 24",
  color,
  children,
}: {
  viewBox?: string;
  color?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      style={{
        width: `calc(${BADGE} * 0.88)`,
        height: `calc(${BADGE} * 0.88)`,
        color,
        flexShrink: 0,
        overflow: "visible",
      }}
    >
      {children}
    </svg>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function CardIcon({ card }: { card: PlayerCard }) {
  if (card === "second-yellow") {
    return (
      <Glyph>
        <rect x={4} y={2.5} width={10} height={16} rx={2} fill={CARD_YELLOW} />
        <rect x={10} y={5.5} width={10} height={16} rx={2} fill={CARD_RED} />
      </Glyph>
    );
  }
  return (
    <Glyph>
      <rect
        x={6.5}
        y={3}
        width={11}
        height={18}
        rx={2}
        fill={card === "red" ? CARD_RED : CARD_YELLOW}
      />
    </Glyph>
  );
}

/**
 * One icon for both directions, as match centres draw it: an arrow up and an
 * arrow down side by side. The one that happened takes its colour (green up
 * for on, red down for off) and the other stays plain, so direction and
 * colour both say which.
 */
function SubIcon({ subbed }: { subbed: PlayerSubstitution }) {
  return (
    <Glyph>
      <path {...STROKE} stroke={subbed === "on" ? SUB_ON : SUB_IDLE} d="M7.5 20V5M3.5 9l4-4 4 4" />
      <path
        {...STROKE}
        stroke={subbed === "off" ? SUB_OFF : SUB_IDLE}
        d="M16.5 4v15M12.5 15l4 4 4-4"
      />
    </Glyph>
  );
}
