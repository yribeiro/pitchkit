# PitchKit brand assets

The mark is two penalty areas, the halfway line and the centre circle — which read
simultaneously as `[ ]` code brackets. Both readings are literally true: a penalty area
drawn without its goal line (the touchline already provides it) _is_ a square bracket.

## Files

| File                        | Colour         | Use                                                          |
| --------------------------- | -------------- | ------------------------------------------------------------ |
| `pitchkit-mark.svg`         | `currentColor` | The canonical master. Anywhere CSS can set a colour.         |
| `pitchkit-mark-emerald.svg` | `#10b981`      | GitHub READMEs, where `currentColor` has nothing to inherit. |
| `pitchkit-lockup-light.svg` | `#059669` / `#1f2328` | Mark + wordmark on one line, for the README on GitHub's light theme. |
| `pitchkit-lockup-dark.svg`  | `#34d399` / `#e6edf3` | Same lockup for GitHub's dark theme, paired via `<picture>`.         |

Two more cuts live in the docs app because they are build outputs, not source:
`apps/docs/app/icon.svg` (favicon, stroke 3.5) and `apps/docs/app/apple-icon.tsx` /
`apps/docs/app/opengraph-image.tsx` (generated PNGs). In React, import
`PitchKitMark` from `apps/docs/components/pitchkit-logo.tsx` rather than inlining the paths.

## Construction

Drawn on a **48-unit grid at stroke 3**, so it rasterises to whole pixels at 16, 24 and
32px. Everything is centred on (24, 24) and symmetric about both axes.

- The halfway-line stubs are tangent to the circle at `y=18` and `y=30` — they meet it
  exactly, with no gap and no overlap. If you change the circle radius, change the stubs.
- **The favicon is a separate cut at stroke 3.5.** Browsers rasterise `icon.svg` at 16px,
  where a stroke-3 hairline lands on a half-pixel and renders grey. Do not unify these.

## Rules

- **Keep `currentColor`.** One file inherits the nav's colour, flips with the theme
  toggle, and knocks out on a solid accent — no light/dark variants to keep in sync. That
  is the same discipline as the library's CSS-variable-only theming ([docs/architecture.md](../../docs/architecture.md#theming-and-styling)).
- **Don't add elements.** Four widely-spaced strokes are the entire reason the mark
  survives 16px. Variants that add a fifth (globe meridians, angle brackets, a slash
  through the circle) were explored and each one blurs in a tab strip.
- **Clear space:** at least the width of one bracket arm (6 units) on all sides.
- **Minimum size:** 16px. Below that, use the wordmark alone.
- **Accent on "Kit".** In the wordmark the accent lands on the camel-case break — the one
  place a second colour carries information rather than decoration.

## Why the README wordmark is an image

GitHub's markdown sanitiser strips `style` attributes, so there is no way to colour the
"Kit" in plain HTML. The lockup therefore ships as SVG, in a `<picture>` pair so it tracks
the reader's GitHub theme.

Its wordmark is set in a **system-font stack**, not a webfont: GitHub renders README SVGs
through an `<img>`, which blocks external font loading. The `viewBox` is deliberately wider
than the text needs — a wider fallback face (DejaVu on Linux, say) must have room to grow
into rather than be clipped.
