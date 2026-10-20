import { Children, useEffect, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { pitchTokens } from "@pitchkit/core";
import type { Viewport } from "@pitchkit/core";
import {
  AVATAR_BALL,
  AVATAR_BG,
  AVATAR_ICON,
  AVATAR_ICON_HALO,
  AVATAR_INITIALS,
  AVATAR_MUTED,
  AVATAR_RING,
  AVATAR_TEXT,
  CARD_RED,
  CARD_YELLOW,
  SUB_ARROW,
  SUB_OFF,
  SUB_ON,
} from "./chart-tokens.js";
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

// The badges sit straight on the grass or the photo with no backing, so a
// thin halo in a contrasting colour, plus a soft shadow, is what separates
// them from whatever is behind. Dark icons get a light halo by default.
const ICON_SHADOW = `drop-shadow(0 0 0.75px ${AVATAR_ICON_HALO}) drop-shadow(0 0 0.75px ${AVATAR_ICON_HALO}) drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.35))`;

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
  // By code point, not UTF-16 unit, so a name starting outside the Basic
  // Multilingual Plane ("𠮷田") gives its whole first character.
  const initial = (word: string) => Array.from(word)[0] ?? "";
  return (words.length === 1 ? initial(first) : initial(first) + initial(last)).toUpperCase();
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

/**
 * Whether (`x`, `y`) falls outside the pitch's `crop`. The SVG viewport clips
 * marks there; the HTML overlay can't clip without also cutting off avatars
 * whose label spills past a touchline, so an avatar off the shown part of the
 * pitch is not drawn at all.
 */
function outsideCrop(viewport: Pick<Viewport, "crop">, x: number, y: number): boolean {
  const crop = viewport.crop;
  if (!crop) return false;
  const [x0, x1] = crop.x0 < crop.x1 ? [crop.x0, crop.x1] : [crop.x1, crop.x0];
  const [y0, y1] = crop.y0 < crop.y1 ? [crop.y0, crop.y1] : [crop.y1, crop.y0];
  return x < x0 || x > x1 || y < y0 || y > y1;
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

  if (!overlay || outsideCrop(viewport, x, y)) return null;

  const [px, py] = transform.toPixel([x, y]);
  const autoSize = defaultAvatarSize(viewport);
  const goalCount = count(goals);
  const assistCount = count(assists);
  const summary = describePlayerEvents({ goals, assists, card, subbed });
  // `{photo && <Image … />}` passes false, "" or an array of them when there
  // is no photo, which should fall back like no children at all.
  const hasChildren = Children.toArray(children).some((child) => child !== "");
  const showImage = !hasChildren && src !== undefined && src !== failedSrc;

  const rootStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "max-content",
    maxWidth: `calc(${SIZE} * 2.6)`,
    // The root's box is wider than what it draws, so it lets pointer events
    // through to the SVG marks below; only the photo and the label's text
    // take them.
    pointerEvents: "none",
    ...style,
    "--pk-avatar-size":
      size !== undefined ? `${size}px` : `var(${pitchTokens.avatarSize}, ${autoSize}px)`,
    "--pk-avatar-badge": `max(14px, calc(${SIZE} * 0.4))`,
    position: "absolute",
    // Percentages of the overlay, which is the same box as the SVG's
    // viewBox: a resize moves the avatar before React re-renders it.
    left: `${(px / viewport.width) * 100}%`,
    top: `${(py / viewport.height) * 100}%`,
    // Centre the photo, not the photo and label together, on the point. A
    // caller's own transform (a hover scale, say) is applied after it, so
    // positioning always wins over `style`.
    transform: `translate(-50%, calc(${SIZE} / -2))${style?.transform ? ` ${style.transform}` : ""}`,
  } as CSSProperties;

  return createPortal(
    <div data-pitchkit-mark="player-avatar" className={className} style={rootStyle} {...rest}>
      <div
        data-pitchkit-part="avatar-photo"
        style={{
          position: "relative",
          width: SIZE,
          height: SIZE,
          flexShrink: 0,
          pointerEvents: "auto",
        }}
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
                color: AVATAR_INITIALS,
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
                  <circle cx={11.8} cy={12} r={11.6} fill={AVATAR_BALL} />
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
        <span style={{ pointerEvents: "auto" }}>
          {number !== undefined && (
            <span data-pitchkit-part="avatar-number" style={{ color: AVATAR_MUTED }}>
              {number}{" "}
            </span>
          )}
          <span data-pitchkit-part="avatar-name">{name}</span>
        </span>
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
        color: AVATAR_ICON,
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
            color: AVATAR_ICON,
            textShadow: `0 0 2px ${AVATAR_ICON_HALO}, 0 0 1px ${AVATAR_ICON_HALO}`,
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
}

/** An icon on the 24-unit grid, filling its badge. */
function Glyph({ viewBox = "0 0 24 24", children }: { viewBox?: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      style={{
        width: `calc(${BADGE} * 0.88)`,
        height: `calc(${BADGE} * 0.88)`,
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
 * A rounded square in the substitution's colour, green on and red off, with
 * a diagonal arrow through it: bottom left to top right for a player coming
 * on, top right to bottom left for one going off. Colour and direction both
 * say which.
 */
function SubIcon({ subbed }: { subbed: PlayerSubstitution }) {
  return (
    <Glyph>
      <rect x={3} y={3} width={18} height={18} rx={4.5} fill={subbed === "on" ? SUB_ON : SUB_OFF} />
      <path
        {...STROKE}
        stroke={SUB_ARROW}
        d={subbed === "on" ? "M8 16 16 8M10 8h6v6" : "M16 8 8 16M8 10v6h6"}
      />
    </Glyph>
  );
}
