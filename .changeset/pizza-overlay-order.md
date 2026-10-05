---
"@pitchkit/react": patch
"@pitchkit/core": patch
---

Fix `<PizzaChart seriesLayout="overlay">` hiding the shorter slice on a `lowerIsBetter` metric
([#89](https://github.com/yribeiro/pitchkit/issues/89)). Overlaid slices were painted largest
_value_ first, but on a lower-is-better metric the lower value draws the longer slice, so the longer
one was painted last and covered the shorter one. They are now ordered by drawn length.

`overlayOrder` in `@pitchkit/core` is unchanged in behaviour; its parameter is renamed `lengths` and
its documentation says to pass each slice's tip radius rather than its value.
