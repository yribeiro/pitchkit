---
"@pitchkit/react": patch
---

Document the Wyscout data provider in the bundled Agent Skill.

The `wyscout` pitch type landed in a prior release, but the skill's data-loading
sections — the package-split table, the frontmatter description, and Recipe 5 —
still only described StatsBomb and SkillCorner. Recipe 5 now includes a Wyscout
example and its two load-bearing traps (a goal tagged twice; a shot with no end
coordinate). `skill-doc.test.ts`'s import guard is extended to the
`data-providers/wyscout` subpath, so a recipe importing something that
subpath doesn't export fails the build the same way it already does for the
other two providers.
