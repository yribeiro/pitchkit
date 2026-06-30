import type { PitchDimensions } from "../dimensions/types.js";
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
  const centerX = length / 2;
  const centerY = width / 2;

  const penaltyArea = (fromLeft: boolean): Rect => ({
    x: fromLeft ? 0 : length - markings.penaltyAreaLength,
    y: centerY - markings.penaltyAreaWidth / 2,
    width: markings.penaltyAreaLength,
    height: markings.penaltyAreaWidth,
  });

  const sixYardBox = (fromLeft: boolean): Rect => ({
    x: fromLeft ? 0 : length - markings.sixYardLength,
    y: centerY - markings.sixYardWidth / 2,
    width: markings.sixYardLength,
    height: markings.sixYardWidth,
  });

  const penaltySpot = (fromLeft: boolean): Point => [
    fromLeft ? markings.penaltySpotDistance : length - markings.penaltySpotDistance,
    centerY,
  ];

  const penaltyArc = (fromLeft: boolean): Arc => {
    const spot = penaltySpot(fromLeft);
    const boxEdgeX = fromLeft ? markings.penaltyAreaLength : length - markings.penaltyAreaLength;
    const dx = Math.abs(boxEdgeX - spot[0]);
    const dy = Math.sqrt(Math.max(markings.centerCircleRadius ** 2 - dx ** 2, 0));
    return {
      center: spot,
      radius: markings.centerCircleRadius,
      start: [boxEdgeX, centerY - dy],
      end: [boxEdgeX, centerY + dy],
    };
  };

  const cornerArc = (cornerX: number, cornerY: number): Arc => {
    const xSign = cornerX === 0 ? 1 : -1;
    const ySign = cornerY === 0 ? 1 : -1;
    return {
      center: [cornerX, cornerY],
      radius: markings.cornerArcRadius,
      start: [cornerX + xSign * markings.cornerArcRadius, cornerY],
      end: [cornerX, cornerY + ySign * markings.cornerArcRadius],
    };
  };

  const goal = (fromLeft: boolean): Line => {
    const x = fromLeft ? 0 : length;
    return {
      from: [x, centerY - markings.goalWidth / 2],
      to: [x, centerY + markings.goalWidth / 2],
    };
  };

  return {
    outline: { x: 0, y: 0, width: length, height: width },
    halfwayLine: { from: [centerX, 0], to: [centerX, width] },
    centerCircle: { center: [centerX, centerY], radius: markings.centerCircleRadius },
    centerSpot: [centerX, centerY],
    penaltyAreas: [penaltyArea(true), penaltyArea(false)],
    sixYardBoxes: [sixYardBox(true), sixYardBox(false)],
    penaltySpots: [penaltySpot(true), penaltySpot(false)],
    penaltyArcs: [penaltyArc(true), penaltyArc(false)],
    cornerArcs: [
      cornerArc(0, 0),
      cornerArc(length, 0),
      cornerArc(0, width),
      cornerArc(length, width),
    ],
    goals: [goal(true), goal(false)],
  };
}
