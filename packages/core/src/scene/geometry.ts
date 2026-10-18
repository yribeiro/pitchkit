import type { PitchDimensions } from "../dimensions/types.js";
import { displayUnitScale } from "../transform/canonical.js";
import type { Point } from "../transform/types.js";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Line {
  readonly from: Point;
  readonly to: Point;
}

export interface Circle {
  readonly center: Point;
  readonly radius: number;
}

/**
 * Described by center/radius plus explicit start/end points (rather than
 * angles) so the renderer can feed coordinates straight through the same
 * toPixel() transform as every other shape, and so SVG's arc path command
 * (which takes endpoints, not angles) needs no extra conversion.
 */
export interface Arc {
  readonly center: Point;
  readonly radius: number;
  readonly start: Point;
  readonly end: Point;
}

export interface PitchGeometry {
  readonly outline: Rect;
  readonly halfwayLine: Line;
  readonly centerCircle: Circle;
  readonly centerSpot: Point;
  /** [left, right] */
  readonly penaltyAreas: readonly [Rect, Rect];
  /** [left, right] */
  readonly sixYardBoxes: readonly [Rect, Rect];
  /** [left, right] */
  readonly penaltySpots: readonly [Point, Point];
  /** [left, right] */
  readonly penaltyArcs: readonly [Arc, Arc];
  /** [top-left, top-right, bottom-left, bottom-right] in provider-native (0,0)-(length,width) terms */
  readonly cornerArcs: readonly [Arc, Arc, Arc, Arc];
  /** [left, right] */
  readonly goals: readonly [Line, Line];
}

/**
 * Computes pitch markings in provider coordinates from a PitchDimensions
 * model. Pure geometry — knows nothing about pixels/viewports, which keeps
 * it independently testable and reusable by a future Canvas renderer.
 */
export function computePitchGeometry(dimensions: PitchDimensions): PitchGeometry {
  const { length, width, markings } = dimensions;

  // The pitch's minimum corner in the provider's own coordinates: (0, 0) for
  // every corner-origin grid, but (-length/2, -width/2) for a center-origin
  // one like SkillCorner's. Markings are emitted in provider-native
  // coordinates because that is what `transform.toPixel` expects — the same
  // frame the caller's own data arrives in.
  const minX = dimensions.origin === "center" ? -length / 2 : 0;
  const minY = dimensions.origin === "center" ? -width / 2 : 0;
  const maxX = minX + length;
  // Radii are in metres on every grid (see `PitchMarkings`), so wherever one
  // meets a grid coordinate it goes through the unit scale first. Identity
  // for grids already in real units; on a percentage grid it is what keeps
  // an arc's endpoints on its own circle.
  const [unitX, unitY] = displayUnitScale(dimensions);
  const centerX = minX + length / 2;
  const centerY = minY + width / 2;

  const penaltyArea = (fromLeft: boolean): Rect => ({
    x: fromLeft ? minX : maxX - markings.penaltyAreaLength,
    y: centerY - markings.penaltyAreaWidth / 2,
    width: markings.penaltyAreaLength,
    height: markings.penaltyAreaWidth,
  });

  const sixYardBox = (fromLeft: boolean): Rect => ({
    x: fromLeft ? minX : maxX - markings.sixYardLength,
    y: centerY - markings.sixYardWidth / 2,
    width: markings.sixYardLength,
    height: markings.sixYardWidth,
  });

  const penaltySpot = (fromLeft: boolean): Point => [
    fromLeft ? minX + markings.penaltySpotDistance : maxX - markings.penaltySpotDistance,
    centerY,
  ];

  const penaltyArc = (fromLeft: boolean): Arc => {
    const spot = penaltySpot(fromLeft);
    const boxEdgeX = fromLeft
      ? minX + markings.penaltyAreaLength
      : maxX - markings.penaltyAreaLength;
    const dxMetres = Math.abs(boxEdgeX - spot[0]) * unitX;
    const dyMetres = Math.sqrt(Math.max(markings.centerCircleRadius ** 2 - dxMetres ** 2, 0));
    const dy = dyMetres / unitY;
    return {
      center: spot,
      radius: markings.centerCircleRadius,
      start: [boxEdgeX, centerY - dy],
      end: [boxEdgeX, centerY + dy],
    };
  };

  // Takes which corner rather than its coordinates: comparing against a
  // literal 0 stopped identifying the left/top corner once the origin moved.
  const cornerArc = (isLeft: boolean, isFirstY: boolean): Arc => {
    const cornerX = isLeft ? minX : maxX;
    const cornerY = isFirstY ? minY : minY + width;
    const xSign = isLeft ? 1 : -1;
    const ySign = isFirstY ? 1 : -1;
    return {
      center: [cornerX, cornerY],
      radius: markings.cornerArcRadius,
      start: [cornerX + (xSign * markings.cornerArcRadius) / unitX, cornerY],
      end: [cornerX, cornerY + (ySign * markings.cornerArcRadius) / unitY],
    };
  };

  const goal = (fromLeft: boolean): Line => {
    const x = fromLeft ? minX : maxX;
    return {
      from: [x, centerY - markings.goalWidth / 2],
      to: [x, centerY + markings.goalWidth / 2],
    };
  };

  return {
    outline: { x: minX, y: minY, width: length, height: width },
    halfwayLine: { from: [centerX, minY], to: [centerX, minY + width] },
    centerCircle: { center: [centerX, centerY], radius: markings.centerCircleRadius },
    centerSpot: [centerX, centerY],
    penaltyAreas: [penaltyArea(true), penaltyArea(false)],
    sixYardBoxes: [sixYardBox(true), sixYardBox(false)],
    penaltySpots: [penaltySpot(true), penaltySpot(false)],
    penaltyArcs: [penaltyArc(true), penaltyArc(false)],
    cornerArcs: [
      cornerArc(true, true),
      cornerArc(false, true),
      cornerArc(true, false),
      cornerArc(false, false),
    ],
    goals: [goal(true), goal(false)],
  };
}
