---
"@pitchkit/react": minor
---

**Breaking:** `<MomentumChart>` and `<RaceChart>` require a period on every event and datum
([#82](https://github.com/yribeiro/pitchkit/issues/82)).

Minutes restart at 45 for the second half, so a first half with stoppage time and the second half
both contain 45'–48'. Second-half events in that overlap were drawn in first-half stoppage time,
and listed in both halves' readouts.

- `<MomentumChart>`: `eventPeriod` is required with `events` (1 for the first half; period _n_ is
  drawn in `periods[n - 1]`). The readout lists only the hovered half's events. An event with no
  panel for its period isn't drawn. `MomentumHover.period` is now the 1-based period, not a
  zero-based index.
- `<RaceChart>`: `period` is required. Shots accumulate in match order, by period then minute, and
  each period is drawn after the one before it, as wide as its own minutes. The half-time rule now
  sits where the first half ends rather than at its last shot. `endTime` sets where the last period
  ends. `tooltip` receives the period as a third argument.
- Hooks: `useMomentumChart().scaleX(minute, period)`, `useRaceChart().scaleX(minute, period)` and
  `valueAt(seriesId, time, period)` take the period too. `useRaceChart()` also returns `panels`.

To migrate StatsBomb data, pass `period={(s) => s.period}` and `eventPeriod={(e) => e.period}`.
The bundled Agent Skill documents both.
