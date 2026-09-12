import type { SkillCornerMatch } from "./types.js";

/**
 * SkillCorner puts the origin on the centre spot: x runs from `-length/2` to
 * `+length/2`, y from `-width/2` to `+width/2`, both in metres. Chart
 * libraries — PitchKit included — want a corner origin, so the parsers add
 * `pitchX`/`pitchY` alongside the untouched `x`/`y`.
 *
 * The conversion is a **pure translation**, verified against the data rather
 * than assumed:
 *
 * - `y > 0` is the attacking team's **left**, confirmed against the CSV's own
 *   `channel_start` labels (every `wide_left`/`half_space_left` row has `y > 0`
 *   and every `*_right` row `y < 0`, across a full match, with no crossover).
 * - Drawn with the attack running left-to-right in a y-up frame, the
 *   attacker's left is the **top** of the pitch — high y. So y needs no flip,
 *   only the half-width offset.
 *
 * It deliberately uses **the match's own `pitch_length`/`pitch_width`**, which
 * really do differ per stadium in the open dataset (104, 105 and 106 metres all
 * appear). The output is therefore in that match's real metres. Squeezing it
 * onto some fixed pitch is a rendering decision, and is left to the caller.
 */
export interface PitchProjection {
  readonly length: number;
  readonly width: number;
  /** Centre-origin metres in, corner-origin metres out. */
  (x: number, y: number): readonly [number, number];
}

/** Builds the translation for one match. */
export function pitchProjection(match: Pick<SkillCornerMatch, "pitch_length" | "pitch_width">) {
  const length = match.pitch_length;
  const width = match.pitch_width;

  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) {
    throw new RangeError(
      `SkillCorner match has unusable pitch dimensions (${String(length)}x${String(width)}). ` +
        `Expected positive numbers in metres from the match file's pitch_length/pitch_width.`,
    );
  }

  const project = ((x: number, y: number) => [x + length / 2, y + width / 2] as const) as {
    (x: number, y: number): readonly [number, number];
    length: number;
    width: number;
  };

  // `length` is a read-only own property on any function, so it has to be
  // redefined rather than assigned — without this the projection would report
  // its arity (2) instead of the pitch length.
  Object.defineProperty(project, "length", { value: length, writable: false });
  Object.defineProperty(project, "width", { value: width, writable: false });

  return project as PitchProjection;
}

/**
 * Applies a projection to a possibly-missing coordinate pair. Returns nulls
 * unless both halves are real numbers — half a coordinate is not a position.
 */
export function projectOrNull(
  project: PitchProjection,
  x: number | null | undefined,
  y: number | null | undefined,
): readonly [number | null, number | null] {
  if (typeof x !== "number" || typeof y !== "number") return [null, null];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [null, null];
  const [px, py] = project(x, y);
  return [px, py];
}

/**
 * Which way a team attacks in a given period, resolved from the match's
 * `home_team_side`.
 *
 * Needed because tracking coordinates are absolute and swap at half time,
 * unlike the dynamic-events file. Returns `undefined` for a period the match
 * file doesn't describe rather than guessing a direction.
 */
export function attackingSideOf(
  match: SkillCornerMatch,
  teamId: number,
  period: number,
): "left_to_right" | "right_to_left" | undefined {
  // The literal is re-stated on each branch rather than narrowed from `raw`:
  // `Known<T>` keeps a `string & Record<never, never>` arm that could itself be
  // either literal, so no comparison ever narrows the value down to the pair.
  const raw = match.home_team_side[period - 1];
  const homeSide: "left_to_right" | "right_to_left" | undefined =
    raw === "left_to_right"
      ? "left_to_right"
      : raw === "right_to_left"
        ? "right_to_left"
        : undefined;
  if (homeSide === undefined) return undefined;

  if (teamId === match.home_team.id) return homeSide;
  return homeSide === "left_to_right" ? "right_to_left" : "left_to_right";
}
