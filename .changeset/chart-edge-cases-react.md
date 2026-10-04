---
"@pitchkit/react": patch
---

Fix four chart edge cases from [#83](https://github.com/yribeiro/pitchkit/issues/83):

- `<MomentumChart>`: a stack of event icons no longer slides back onto the icon before it.
- `<MomentumChart>`: an event whose minute isn't a finite number is dropped, as the bars drop such
  samples, instead of being drawn at `NaN` (where browsers put it in the top-left corner, over the
  legend).
- `<RaceChart>`: data after an explicit `endTime` is dropped, from the line and from the total, so
  the line stays inside the plot and the end label matches it.
- `<RaceChart>`: the default readout floors the minute, as `<MomentumChart>` does, so at 44.6' it
  says 44' rather than naming a 45' shot it hasn't counted yet.
