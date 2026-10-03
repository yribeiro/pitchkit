---
"@pitchkit/core": minor
---

Add the wedge geometry `<PizzaChart>` is built on, to the `polar/` module: `wedgeAngles` (a slice's
span, inset by a gap), `splitWedge` (one sub-wedge per series), `annularSectorPath` (a slice with the
hole cut out; coordinates rounded to two decimals) and `overlayOrder` (largest first, so a smaller
overlaid slice stays visible), with the `Wedge` type.

Held at 100% coverage with the rest of `polar/`.
