---
"@pitchkit/data-providers": patch
---

The Wyscout and Impect parsers' schema errors now word an unexpected object the way StatsBomb's and SkillCorner's do: `an object with keys: a, b, c, d, ...`, with an ellipsis when there are more than four keys. The providers now share one internal copy of these checks.
