/**
 * A ring between radii `r0` and `r1` as one path, drawn with
 * `fill-rule="evenodd"`; a disc when `r0` is 0. Bands are drawn as rings
 * rather than stacked discs so a translucent fill never doubles up where
 * two discs overlap.
 */
export function ringPath(cx: number, cy: number, r0: number, r1: number): string {
  const circle = (r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  return r0 > 0 ? `${circle(r1)}${circle(r0)}` : circle(r1);
}
