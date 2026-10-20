import { pitchTokens } from "@pitchkit/core";

/**
 * The chart tokens every non-pitch chart reads, with the fallback each one
 * renders when the variable is unset. One table, so a default changes in one
 * place (docs/decisions.md D8, D23).
 */

/**
 * Categorical defaults, in fixed slot order so colour follows the entity
 * and never its rank. Slot 1 is the same hex as `--pitch-marker-primary`,
 * so charts and pitches agree out of the box. The set is validated for
 * colourblind separation rather than picked by eye; past six, fold the
 * tail into an "Other" series rather than generating a seventh hue.
 */
const token = (name: string, fallback: string) => `var(${name}, ${fallback})`;

export const SERIES_COLORS = [
  token(pitchTokens.series1, "#3b82f6"),
  token(pitchTokens.series2, "#eb6834"),
  token(pitchTokens.series3, "#1baf7a"),
  token(pitchTokens.series4, "#eda100"),
  token(pitchTokens.series5, "#e87ba4"),
  token(pitchTokens.series6, "#008300"),
] as const;

/** The series colour for slot `index`, wrapping past the sixth. */
export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] as string;
}

/** Whatever is behind the chart: rings and halos knock out to it. */
export const CHART_SURFACE = token(pitchTokens.chartSurface, "#ffffff");
export const CHART_TEXT = token(pitchTokens.chartText, "#12170f");
export const CHART_MUTED = token(pitchTokens.chartMuted, "#7b8474");
/** Controls a chart draws itself, such as the radar's Back button. Green-700 on white text is 5:1. */
export const CHART_ACCENT = token(pitchTokens.chartAccent, "#15803d");
export const CHART_ACCENT_TEXT = token(pitchTokens.chartAccentText, "#ffffff");
export const AXIS = token(pitchTokens.axis, "#c6cebc");
export const GRID = token(pitchTokens.grid, "#e5eade");
export const CARD_YELLOW = token(pitchTokens.cardYellow, "#facc15");
export const CARD_RED = token(pitchTokens.cardRed, "#ef4444");
/** `<PlayerAvatar>`'s colours; its cards use the two above. */
export const AVATAR_BG = token(pitchTokens.avatarBg, "#d4d8dd");
export const AVATAR_RING = token(pitchTokens.avatarRing, "#ffffff");
export const AVATAR_TEXT = token(pitchTokens.avatarText, "#ffffff");
export const AVATAR_MUTED = token(pitchTokens.avatarMuted, "rgba(255, 255, 255, 0.7)");
export const AVATAR_ICON = token(pitchTokens.avatarIcon, "#111827");
export const AVATAR_ICON_HALO = token(pitchTokens.avatarIconHalo, "rgba(255, 255, 255, 0.9)");
/** Behind the ball's panels, so a dark ball still reads as a football on dark grass. */
export const AVATAR_BALL = token(pitchTokens.avatarBall, "#ffffff");
export const AVATAR_INITIALS = token(pitchTokens.avatarInitials, "#1f2937");
export const SUB_ON = token(pitchTokens.subOn, "#22c55e");
export const SUB_OFF = token(pitchTokens.subOff, "#ef4444");
export const SUB_ARROW = token(pitchTokens.subArrow, "#ffffff");
/** Shared by the pitch tooltip and the chart readout. */
export const TOOLTIP_BG = token(pitchTokens.tooltipBg, "rgba(17, 17, 17, 0.92)");
export const TOOLTIP_TEXT = token(pitchTokens.tooltipColor, "#fff");

/** What colours a part: a CSS colour, a class, or both. */
export interface Paint {
  readonly color: string | undefined;
  readonly className: string | undefined;
}

/**
 * The paint rule every chart shares (D8, D9): the caller's colour or class,
 * else slot `slot`'s colour. A class alone is left to recolour the part.
 */
export function resolvePaint(
  custom: { color?: string | undefined; className?: string | undefined } | undefined,
  slot: number,
): Paint {
  return {
    className: custom?.className,
    color: custom?.color ?? (custom?.className ? undefined : seriesColor(slot)),
  };
}
