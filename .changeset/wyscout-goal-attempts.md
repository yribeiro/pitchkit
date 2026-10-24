---
"@pitchkit/data-providers": minor
"@pitchkit/react": patch
---

Wyscout: `goalAttempts` and `goalsFor`, because `shots(events).filter(isGoal)`
missed goals.

Wyscout records a penalty and a direct free kick as `Free Kick` events, not
`Shot`s, and an own goal as tag 102 rather than 101. So the documented
`shots(events).filter(isGoal)` missed all three, finding 4 of the 6 goals in
the 2018 World Cup final. `goalAttempts(events)` returns every `Shot` plus
each `Free Kick` whose `subEventName` is `"Penalty"` or `"Free kick shot"`.
`goalsFor(events, teamId)` gives a team's score: its attempts tagged 101
outside a shootout, plus the other side's own goals. `shots()` is unchanged.

The bundled Agent Skill's Wyscout reference now uses both.
