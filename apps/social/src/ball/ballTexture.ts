/**
 * A football's panel pattern as an equirectangular canvas texture: black
 * pentagons over the 12 vertices of an icosahedron, white hexagons over its 20
 * face centres — a truncated icosahedron, drawn per pixel rather than modelled.
 *
 * The pentagon/hexagon seam sits where the angular distance to the nearest
 * pentagon centre, as a fraction of a pentagon's apothem (16.5°), equals the
 * same for the nearest hexagon (20.9°). Those two angles come from the solid's
 * edge length and circumradius, and sum to the 37.4° between neighbouring
 * centres.
 */
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

const PHI = (1 + Math.sqrt(5)) / 2;
const norm = (v: number[]) => {
  const l = Math.hypot(v[0]!, v[1]!, v[2]!);
  return [v[0]! / l, v[1]! / l, v[2]! / l] as const;
};

const PENT = (() => {
  const out: (readonly [number, number, number])[] = [];
  for (const a of [-1, 1])
    for (const b of [-PHI, PHI]) {
      out.push(norm([0, a, b]), norm([a, b, 0]), norm([b, 0, a]));
    }
  return out;
})();

const HEX = (() => {
  const out: (readonly [number, number, number])[] = [];
  for (const x of [-1, 1])
    for (const y of [-1, 1]) for (const z of [-1, 1]) out.push(norm([x, y, z]));
  for (const a of [-1, 1])
    for (const b of [-1, 1]) {
      out.push(
        norm([0, a / PHI, b * PHI]),
        norm([a / PHI, b * PHI, 0]),
        norm([b * PHI, 0, a / PHI]),
      );
    }
  return out;
})();

const PENT_APOTHEM = (16.5 * Math.PI) / 180;
const HEX_APOTHEM = (20.9 * Math.PI) / 180;

let cached: { color: CanvasTexture; bump: CanvasTexture } | undefined;

export function ballTextures() {
  if (cached) return cached;
  const W = 1024;
  const H = 512;
  const color = document.createElement("canvas");
  color.width = W;
  color.height = H;
  const bump = document.createElement("canvas");
  bump.width = W;
  bump.height = H;
  const cctx = color.getContext("2d")!;
  const bctx = bump.getContext("2d")!;
  const cimg = cctx.createImageData(W, H);
  const bimg = bctx.createImageData(W, H);

  for (let j = 0; j < H; j++) {
    const lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    for (let i = 0; i < W; i++) {
      const lon = ((i + 0.5) / W) * Math.PI * 2;
      const x = cl * Math.cos(lon);
      const y = sl;
      const z = cl * Math.sin(lon);

      let bestP = 0;
      for (const p of PENT) bestP = Math.max(bestP, x * p[0] + y * p[1] + z * p[2]);
      let best1 = 0;
      let best2 = 0;
      for (const h of HEX) {
        const d = x * h[0] + y * h[1] + z * h[2];
        if (d > best1) {
          best2 = best1;
          best1 = d;
        } else if (d > best2) best2 = d;
      }
      const ap = Math.acos(Math.min(1, bestP)) / PENT_APOTHEM;
      const ah = Math.acos(Math.min(1, best1)) / HEX_APOTHEM;
      const ah2 = Math.acos(Math.min(1, best2)) / HEX_APOTHEM;

      const pentagon = ap < ah;
      // Distance to a seam, in the same normalised units: pentagon/hexagon, or
      // hexagon/hexagon.
      const seam = pentagon ? ah - ap : ah2 - ah;
      const line = Math.max(0, 1 - seam / 0.09);

      let r = pentagon ? 38 : 244;
      let g = pentagon ? 40 : 244;
      let b = pentagon ? 48 : 240;
      const k = line * 0.78;
      r = r * (1 - k) + 70 * k;
      g = g * (1 - k) + 72 * k;
      b = b * (1 - k) + 76 * k;

      const o = (j * W + i) * 4;
      cimg.data[o] = r;
      cimg.data[o + 1] = g;
      cimg.data[o + 2] = b;
      cimg.data[o + 3] = 255;
      const h = 255 - Math.round(line * 190);
      bimg.data[o] = h;
      bimg.data[o + 1] = h;
      bimg.data[o + 2] = h;
      bimg.data[o + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  bctx.putImageData(bimg, 0, 0);

  const colorTex = new CanvasTexture(color);
  colorTex.colorSpace = SRGBColorSpace;
  colorTex.anisotropy = 8;
  colorTex.minFilter = LinearFilter;
  const bumpTex = new CanvasTexture(bump);
  cached = { color: colorTex, bump: bumpTex };
  return cached;
}
