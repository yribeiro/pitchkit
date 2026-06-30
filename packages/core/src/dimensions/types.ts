/** The provider coordinate systems supported in this milestone. */
export type PitchTypeId = "statsbomb" | "opta" | "uefa";

/** Which corner of the pitch sits at provider coordinate (0, 0). */
export type PitchOrigin = "top-left" | "bottom-left" | "center";

/** Does increasing y move toward the bottom or top of the pitch (in a standard top-down view)? */
export type YDirection = "down" | "up";

/**
 * Pitch markings in provider units. Sourced from mplsoccer's published per-provider
 * constants (not derived from real-world meters) because real event/tracking data sets
 * are published against these exact landmark positions — deriving our own values would
 * silently misalign rendered markings against real provider data.
 */
export interface PitchMarkings {
  readonly penaltyAreaLength: number;
  readonly penaltyAreaWidth: number;
  readonly sixYardLength: number;
  readonly sixYardWidth: number;
  readonly centerCircleRadius: number;
  readonly penaltySpotDistance: number;
  readonly cornerArcRadius: number;
  readonly goalWidth: number;
}

/**
 * Encodes a provider's coordinate system: extent, origin corner, y-axis direction,
 * and whether coordinates are normalized (e.g. Opta's 0-100 scale), per PRD §8.2.
 *
 * Display orientation (horizontal/vertical) is deliberately NOT part of this model —
 * it's a Viewport/display concern, not a fact about the provider's coordinate system.
 */
export interface PitchDimensions {
  readonly pitchType: PitchTypeId;
  /** Full pitch extent in provider units (along the x-axis). */
  readonly length: number;
  /** Full pitch extent in provider units (along the y-axis). */
  readonly width: number;
  readonly origin: PitchOrigin;
  readonly yDirection: YDirection;
  /** True for percentage-style normalized grids (e.g. Opta's 0-100). */
  readonly normalized: boolean;
  /**
   * Approximate real-world pitch size this provider's grid is calibrated against.
   * Used only for documentation / sanity-check conversions — not an exact per-axis
   * scale for every provider (e.g. Opta's circle_diameter constant is not axis-aware,
   * so width-axis conversions of circular markings are approximate by design).
   */
  readonly realLengthMeters: number;
  readonly realWidthMeters: number;
  readonly markings: PitchMarkings;
}
