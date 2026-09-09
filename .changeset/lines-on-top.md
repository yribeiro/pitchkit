---
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Add `appearance.linesOnTop` to `<Pitch>` — mplsoccer's `line_zorder`.

Paints the pitch markings above the layer children instead of below them, so an opaque density
fill (`<Heatmap>`, `<PositionalHeatmap>`, `<Hexbin>`, `<KDE>`) no longer covers the markings it
sits on. Off by default, so discrete SVG marks still paint over the lines. Only the markings move
— the grass surface and stripes stay at the bottom either way.
