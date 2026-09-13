import type { PitchDimensions, PitchTypeId } from "./types.js";
import { statsbombDimensions } from "./statsbomb.js";
import { optaDimensions } from "./opta.js";
import { uefaDimensions } from "./uefa.js";
import { skillcornerDimensions } from "./skillcorner.js";

export const PITCH_DIMENSIONS: Readonly<Record<PitchTypeId, PitchDimensions>> = {
  statsbomb: statsbombDimensions,
  opta: optaDimensions,
  uefa: uefaDimensions,
  skillcorner: skillcornerDimensions,
};

/**
 * The real extent of one particular pitch, for providers whose coordinates are
 * metres on an actual pitch rather than a fixed grid.
 *
 * Only meaningful for non-normalised types: SkillCorner's open data spans 104
 * to 106 m, because those are the stadiums' real sizes. Overriding a
 * normalised grid (Opta's 0-100) would be meaningless and is rejected.
 */
export interface PitchDimensionOverrides {
  readonly length?: number;
  readonly width?: number;
}

export function getPitchDimensions(
  pitchType: PitchTypeId,
  overrides?: PitchDimensionOverrides,
): PitchDimensions {
  const dimensions = PITCH_DIMENSIONS[pitchType];
  if (!dimensions) {
    throw new Error(`Unknown pitch type: ${String(pitchType)}`);
  }

  const length = overrides?.length ?? dimensions.length;
  const width = overrides?.width ?? dimensions.width;
  if (length === dimensions.length && width === dimensions.width) return dimensions;

  if (dimensions.normalized) {
    throw new Error(
      `Pitch type "${pitchType}" uses a normalized grid (${dimensions.length}x${dimensions.width}), ` +
        `so overriding its extent has no meaning. Override only providers whose coordinates are real units.`,
    );
  }
  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) {
    throw new Error(
      `Pitch dimensions must be positive numbers, got ${String(length)}x${String(width)}.`,
    );
  }

  // Markings are deliberately carried over untouched: a penalty area is 16.5 m
  // deep whether the pitch is 104 or 106 m long, so only the outline, halfway
  // line and goal lines move.
  return { ...dimensions, length, width };
}
