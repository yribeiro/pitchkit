/** A 2D point as a tuple, in either provider coordinates or pixel space. */
export type Point = readonly [number, number];

/** Display orientation: which physical axis the pitch's length runs along. */
export type Orientation = "horizontal" | "vertical";

/** A crop window expressed in provider coordinates (not necessarily ordered). */
export interface CropWindow {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export interface ViewportPadding {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface Viewport {
  /** CSS pixel width of the rendering container. */
  readonly width: number;
  /** CSS pixel height of the rendering container. */
  readonly height: number;
  readonly orientation: Orientation;
  /** Undefined = full pitch. */
  readonly crop?: CropWindow;
  /** Pixel padding inside the viewport; defaults to zero on all sides. */
  readonly padding?: ViewportPadding;
}

export interface PixelTransform {
  toPixel(point: Point): Point;
  /** Inverse of toPixel; useful for future hit-testing. */
  toProvider(point: Point): Point;
  /** Uniform pixels-per-provider-unit scale factor actually applied. */
  readonly scale: number;
}
