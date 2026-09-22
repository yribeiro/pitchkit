---
"@pitchkit/core": patch
"@pitchkit/react": patch
"@pitchkit/data-providers": patch
---

Reword the published `description` and broaden `keywords` so the packages are
discoverable by what they are ("React football visualisation library",
TypeScript, charting) rather than only by what they're like ("mplsoccer's
feature set"). Metadata only — no code or API change.

Also points every `pitchkitjs.com` link in the READMEs and the bundled Agent
Skill (`SKILL.md`) at `https://www.pitchkitjs.com`, the host the site is
actually served from — the apex 308-redirects there. A browser or a redirect-
following crawler was never affected, but an agent fetching a link verbatim
(the exact use case `SKILL.md` is written for) got a bodyless redirect
instead of the page. Follow-up to [PR #69](https://github.com/yribeiro/pitchkit/pull/69),
which fixed the docs site's own links but flagged the published packages as
still outstanding.
