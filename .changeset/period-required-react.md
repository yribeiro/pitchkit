---
"@pitchkit/react": minor
---

**Breaking:** `<MomentumChart>` and `<RaceChart>` require a period on every event and datum
([#82](https://github.com/yribeiro/pitchkit/issues/82)).

Minutes restart at 45 for the second half, so a first half with stoppage time and the second half
both contain 45'–48'. Second-half events in that overlap were drawn in first-half stoppage time,
and listed in both halves' readouts.

- `<MomentumChart>`: samples are one flat list. `periods` (an array of arrays, one per half) is
  replaced by `data` plus a required `period` accessor, the same shape as the events and as
  `<RaceChart>`; the chart groups the list itself, one panel per period. `periodRanges` is keyed by
  period number (`{ 2: { end: 95 } }`), and a bar's `index` in `useMomentumChart().bars` points
  into `data`. `eventPeriod` is required with `events`. The readout lists only the hovered half's
  events. An event with no panel for its period isn't drawn. `MomentumHover.period` is now the
  1-based period, not a zero-based index.
- `<RaceChart>`: `period` is required. Shots accumulate in match order, by period then minute, and
  each period is drawn after the one before it, as wide as its own minutes. The half-time rule now
  sits where the first half ends rather than at its last shot. `endTime` sets where the last period
  ends. `tooltip` receives the period as a third argument.
- Hooks: `useMomentumChart().scaleX(minute, period)`, `useRaceChart().scaleX(minute, period)` and
  `valueAt(seriesId, time, period)` take the period too. `useRaceChart()` also returns `panels`.

To migrate, tag samples with their period and flatten them, then pass `period={(d) => d.period}`
and `eventPeriod={(e) => e.period}`; StatsBomb's `period` field is already the right number.
The bundled Agent Skill documents both.
