---
"@pitchkit/core": minor
"@pitchkit/react": minor
---

Add `<GoalView>`, the goal mouth seen from in front, for plotting where shots crossed the line.

It is a root beside `<Pitch>` with its own goal-mouth coordinates: `type="statsbomb"` takes a
StatsBomb shot's `end_location[1]` and `[2]` (`endY`/`endZ` from `@pitchkit/data-providers`) as they
are, and `type="metric"` takes metres from the middle of the goal. Posts, crossbar and net are drawn to
scale, and the ground recedes in perspective to the six-yard line, penalty spot and penalty area for a
sense of distance. Width and height markers are on by default and toggled with
`appearance.widthMarker` and `appearance.heightMarker`; `appearance.units` labels them in metres or
yards and feet.

Shots are drawn with `<GoalShots>` (`y`, `z` and the usual `<Scatter>` accessors); one outside the view
is pinned just inside its edge and marked `data-pitchkit-clamped`. `useGoalView()` gives custom marks
the same mapping. `@pitchkit/core` adds the maths under `goal/` (`GOAL_FRAMES`, `computeGoalLayout`,
`goalPoint`, `projectGround`, `computeGoalGeometry`) and three theme tokens: `--pitch-goal-backdrop`,
`--pitch-goal-net` and `--pitch-goal-frame`. The bundled Agent Skill documents all of it.
