/**
 * How a label sits around a polar chart:
 *
 * - `"tangent"` runs along the rim, at right angles to its axis (mplsoccer's
 *   and most football radars' convention). Packs the most labels per circle.
 * - `"radial"` runs outward along the axis line. Suits long names.
 * - `"horizontal"` stays upright and is anchored by side.
 */
export type LabelRotation = "tangent" | "radial" | "horizontal";

/** The spacing between wrapped lines, in `em`. */
export const LABEL_LINE_HEIGHT = 1.1;

/**
 * Average glyph width in `em`. Text isn't measured (that needs a DOM, and
 * the charts render on the server), so label space is estimated from it.
 */
export const GLYPH_WIDTH = 0.6;

/** Estimated width of `chars` characters at `fontSize`. */
export function textWidth(chars: number, fontSize: number): number {
  return chars * fontSize * GLYPH_WIDTH;
}

/**
 * Room labels need outside the rim, horizontally and vertically: wrapped
 * height for tangent labels, length for radial ones, each in its direction
 * for horizontal ones. Excludes the gap between rim and label.
 */
export function labelMargin(
  labels: readonly (readonly string[])[],
  rotation: LabelRotation,
  fontSize: number,
): { readonly x: number; readonly y: number } {
  const longest = textWidth(Math.max(0, ...labels.flat().map((line) => line.length)), fontSize);
  const tallest =
    Math.max(1, ...labels.map((lines) => lines.length)) * fontSize * LABEL_LINE_HEIGHT;
  return {
    x: rotation === "tangent" ? tallest : longest,
    y: rotation === "radial" ? longest : tallest,
  };
}

/**
 * The clickable box behind a placed label, in the label's own rotated
 * frame: the text's estimated extent plus padding, never smaller than
 * `minTarget` either way (WCAG 2.5.8).
 */
export function labelBox(
  placement: LabelPlacement,
  lines: readonly string[],
  fontSize: number,
  minTarget: number,
): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
  const textHeight = lines.length * fontSize * LABEL_LINE_HEIGHT;
  const width = Math.max(
    minTarget,
    textWidth(Math.max(0, ...lines.map((l) => l.length)), fontSize) + 8,
  );
  const height = Math.max(minTarget, textHeight + 8);
  return {
    x: placement.anchor === "middle" ? -width / 2 : placement.anchor === "start" ? -4 : 4 - width,
    // The first baseline sits at `dy`; the box is centred on the text block.
    y: placement.dy * fontSize - fontSize + 2 - (height - textHeight) / 2,
    width,
    height,
  };
}

/** Everything an SVG `<text>` needs to sit a label outside its axis. */
export interface LabelPlacement {
  /** Degrees, for `rotate()` about the label's anchor point. */
  readonly rotate: number;
  readonly anchor: "start" | "middle" | "end";
  /** `dy` of the first line, in `em`; later lines follow at `LABEL_LINE_HEIGHT`. */
  readonly dy: number;
}

/**
 * Rotation, anchor and first-line offset for a label of `lines` lines at
 * `angle` (radians, clockwise from the top), so it sits outside the chart
 * and never reads upside down: text that would face the wrong way is turned
 * 180° — below the equator for `"tangent"`, left of the centre for
 * `"radial"`. Lines always stack away from the chart.
 */
export function labelPlacement(angle: number, rotation: LabelRotation, lines = 1): LabelPlacement {
  const degrees = ((((angle * 180) / Math.PI) % 360) + 360) % 360;
  const extra = (lines - 1) * LABEL_LINE_HEIGHT;

  if (rotation === "tangent") {
    const flipped = degrees > 90 && degrees < 270;
    return {
      rotate: flipped ? degrees + 180 : degrees,
      anchor: "middle",
      dy: flipped ? 0.75 : -extra,
    };
  }

  if (rotation === "radial") {
    const flipped = degrees > 180;
    return {
      rotate: flipped ? degrees + 90 : degrees - 90,
      anchor: flipped ? "end" : "start",
      dy: 0.35 - extra / 2,
    };
  }

  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    rotate: 0,
    anchor: Math.abs(sin) < 0.2 ? "middle" : sin > 0 ? "start" : "end",
    dy: Math.abs(cos) < 0.5 ? 0.35 - extra / 2 : cos > 0 ? -extra : 0.75,
  };
}

/**
 * Greedy word wrap at `maxChars` per line. A one-character word ("+", "&")
 * stays with the word after it, or the word before it at the end, so a
 * label never breaks into "Tackles +" / "Int". A single word longer than
 * the limit keeps its own line rather than being split.
 */
export function wrapLabel(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const glued: string[] = [];
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i] as string;
    const next = words[i + 1];
    if (word.length === 1 && next !== undefined) {
      words[i + 1] = `${word} ${next}`;
    } else if (word.length === 1 && glued.length > 0) {
      glued[glued.length - 1] += ` ${word}`;
    } else {
      glued.push(word);
    }
  }

  const lines: string[] = [];
  for (const word of glued) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= maxChars) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}
