const HEX_COLOR_RE = /^#([0-9a-f]{6})$/i;

function parseHexColor(hex: string): [number, number, number] {
  const value = HEX_COLOR_RE.exec(hex)?.[1];
  if (!value) {
    throw new Error(`createColorScale only supports 6-digit hex colors, got: ${hex}`);
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Builds a `value -> color` function that linearly interpolates between two
 * 6-digit hex colors across `[minValue, maxValue]`. Hand-rolled rather than
 * a colormap dependency, to preserve @pitchkit/core's zero-runtime-dependency
 * invariant. Values outside the domain are clamped to the nearest end color.
 */
export function createColorScale(
  minValue: number,
  maxValue: number,
  colorMin: string,
  colorMax: string,
): (value: number) => string {
  const [r0, g0, b0] = parseHexColor(colorMin);
  const [r1, g1, b1] = parseHexColor(colorMax);
  const range = maxValue - minValue;

  return (value: number): string => {
    const t = range === 0 ? 0 : Math.min(Math.max((value - minValue) / range, 0), 1);
    const r = Math.round(lerp(r0, r1, t));
    const g = Math.round(lerp(g0, g1, t));
    const b = Math.round(lerp(b0, b1, t));
    return `rgb(${r}, ${g}, ${b})`;
  };
}
