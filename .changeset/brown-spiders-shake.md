---
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Add a `"skillcorner"` pitch type, and with it support for **center-origin
coordinate systems** generally.

SkillCorner measures in metres from the centre spot — x from `-52.5` to
`+52.5` — which `PitchOrigin` has always allowed as a value but no code
honoured. Data from `@pitchkit/data-providers/skillcorner` now plots with its
raw `x`/`y`:

```tsx
<Pitch type="skillcorner">
  <Scatter data={frame.player_data} x={(p) => p.x} y={(p) => p.y} />
</Pitch>
```

`getPitchDimensions` and `<Pitch>` also take an optional `{ length, width }`
override, because SkillCorner pitches are real stadium pitches and the open
data spans 104 to 106 m. Markings do not scale with it — a penalty area is
16.5 m deep on any pitch — so only the outline, halfway line and goal lines
move. Overriding a normalized grid (Opta's 0-100) throws rather than silently
rescaling.

Internally this adds `toExtentFrame`/`fromExtentFrame`, which map a provider's
coordinates onto `0..length` by `0..width` and back. They are identity
functions for every corner-origin provider, so **statsbomb, opta and uefa are
unchanged** — but they were needed in more places than the transform: pitch
geometry, the default crop, `cropForHalf`, and the four density modules, whose
bounds checks would otherwise have silently discarded every point in a
center-origin pitch's defending half.

Adding a member to `PitchTypeId` widens a public union — additive for callers,
but an exhaustive `switch` over it gains a case.
