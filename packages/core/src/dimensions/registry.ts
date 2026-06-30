import type { PitchDimensions, PitchTypeId } from "./types.js";
import { statsbombDimensions } from "./statsbomb.js";
import { optaDimensions } from "./opta.js";
import { uefaDimensions } from "./uefa.js";

export const PITCH_DIMENSIONS: Readonly<Record<PitchTypeId, PitchDimensions>> = {
  statsbomb: statsbombDimensions,
  opta: optaDimensions,
  uefa: uefaDimensions,
};

export function getPitchDimensions(pitchType: PitchTypeId): PitchDimensions {
  const dimensions = PITCH_DIMENSIONS[pitchType];
  if (!dimensions) {
    throw new Error(`Unknown pitch type: ${String(pitchType)}`);
  }
  return dimensions;
}
