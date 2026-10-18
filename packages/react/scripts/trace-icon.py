"""Trace a generated black-on-white icon into an SVG path.

Usage: python3 trace-icon.py SRC OUT [--mirror] [--disc] [--height H]
  --mirror  average the ink with its left-right mirror (symmetric icons)
  --disc    clip the ink to the circle that best fits it (balls)
  --height  the output's height in units; width follows the ink's aspect

Needs `pip install potracer numpy pillow`. Not part of the build: it was run
once to make the paths in src/avatar-icons.ts, as

  trace-icon.py ball.webp ball.svg --mirror --disc
  trace-icon.py boot.webp boot.svg --height 12

The SVG's path `d` is what goes into the TypeScript constant.
"""
import sys
import numpy as np
import potrace
from PIL import Image

args = sys.argv[1:]
src, out = args[0], args[1]
mirror, disc = "--mirror" in args, "--disc" in args
height = float(args[args.index("--height") + 1]) if "--height" in args else 24.0

a = np.array(Image.open(src).convert("L")).astype(float) / 255
ink = 1 - a
ys, xs = np.nonzero(ink > 0.5)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
ink = ink[y0:y1, x0:x1]
if mirror:
    ink = (ink + ink[:, ::-1]) / 2
dark = ink >= 0.5
if disc:
    h, w = dark.shape
    r = (h + w) / 4
    yy, xx = np.mgrid[0:h, 0:w]
    dark &= (xx + 0.5 - w / 2) ** 2 + (yy + 0.5 - h / 2) ** 2 <= r * r

pad = 4
dark = np.pad(dark, pad)
h, w = dark.shape
scale = height / (h - 2 * pad)
path = potrace.Bitmap(~dark).trace(turdsize=60, alphamax=1.0, opticurve=True, opttolerance=0.4)


def p(pt):
    return f"{(pt.x - pad) * scale:.1f} {(pt.y - pad) * scale:.1f}"


d = []
for curve in path:
    d.append(f"M{p(curve.start_point)}")
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f"L{p(seg.c)}L{p(seg.end_point)}")
        else:
            d.append(f"C{p(seg.c1)} {p(seg.c2)} {p(seg.end_point)}")
    d.append("Z")
vw = (w - 2 * pad) * scale
open(out, "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.2f} {height:g}">'
    f'<path fill-rule="evenodd" d="{"".join(d)}"/></svg>'
)
print(out, f"viewBox 0 0 {vw:.2f} {height:g},", len("".join(d)), "chars,", len(path), "curves")
