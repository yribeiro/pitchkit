# PitchKit

React-first football pitch visualisation library (mplsoccer for the web). **Not** to be
confused with React Native (the mobile framework) — say "React-first" in any user-facing
copy, never "React-native" ([PR #49](https://github.com/yribeiro/pitchkit/pull/49)).

**Full PRD:** [PitchKit PRD in Notion](https://app.notion.com/p/38d49fa8a69281d2aa01fb727686aa5b)
(private, under the "PitchKit — mplsoccer for the Web" idea page). It used to be `docs/PRD.md`;
it was moved out of the repo on 2026-09-15 and is **not** on GitHub any more. Read it before
any architectural work — section references below (§7.4, §8.7, §11 …) point at that page.

Per-release detail lives in `packages/*/CHANGELOG.md`; don't duplicate it here.

## Architecture decisions (settled)

- Hybrid SVG (interactive marks) + Canvas (heatmaps/KDE) rendering.
- Monorepo: npm workspaces + Turborepo, packages under `@pitchkit/*`.
- `@pitchkit/core` has zero React dependency; `@pitchkit/react` is a thin binding.
- **`@pitchkit/react` is the only supported rendering surface.** Core's SVG painters
  (`render/svg/paint-*.ts`, `svgRenderer`) are internal-only, kept solely for the
  `packages/core/examples/index.html` dev harness — new marks ship React-only
  ([issue #6](https://github.com/yribeiro/pitchkit/issues/6), resolved).
- Theming = CSS variables only (shadcn-style), no JS theme objects.
- Responsive is the default (no prop); explicit width/height is the opt-out.
- **Distribution split** (PRD §7.4/§8.4): the marks (`<Pitch>`, `<Scatter>`, `<Arrows>`,
  `<Comet>`, `<Heatmap>`, …) are "plumbing" — correctness-critical rendering, published to
  npm. Composite **recipes** (pass network, shot map, …) and **theme presets** are
  opinionated compositions a user should own, so they ship as **shadcn registry items**
  (`npx shadcn add pass-map`) with `@pitchkit/react` auto-installed underneath. Note the
  registry infrastructure **does not exist yet** — `apps/docs` has only an internal examples
  registry for its own gallery, not a consumable `registry.json`, which blocks
  [#23](https://github.com/yribeiro/pitchkit/issues/23)/[#24](https://github.com/yribeiro/pitchkit/issues/24).

## Status

- **Milestone 1 — MVP: ✅ complete** (pitch styling/theming, SVG mark layers, Canvas heatmap,
  `@pitchkit/react`, Tailwind integration, docs site + showcase website).
- **Milestone 3 — publishing: largely complete**, pulled forward ahead of M2 to claim the
  namespace. All three packages are on npm; docs live at
  [pitchkitjs.com](https://pitchkitjs.com). Only release _automation_ is outstanding
  ([#36](https://github.com/yribeiro/pitchkit/issues/36)).
- **Milestone 2 — v1.0 parity push: in progress.** This plus #36 is all that remains.

Landed in M2 so far: geometric overlays (Flow, Polygon, Convex Hull, Voronoi, Goal Angle);
density overlays (`<PositionalHeatmap>`, `<Hexbin>`, `<KDE>`, sharing `createColorScale` from
`color/scale.ts`); `appearance.linesOnTop` (mplsoccer's `line_zorder`, off by default);
`@pitchkit/data-providers`; the `skillcorner` pitch type; and the `/docs/data` section.

Still open for M2: radar/pizza charts ([#21](https://github.com/yribeiro/pitchkit/issues/21)),
goal view ([#22](https://github.com/yribeiro/pitchkit/issues/22)), attack/territory and
pass-map recipes ([#23](https://github.com/yribeiro/pitchkit/issues/23),
[#24](https://github.com/yribeiro/pitchkit/issues/24)), pan/zoom
([#26](https://github.com/yribeiro/pitchkit/issues/26)), real StatsBomb data in the **gallery
specifically** ([#27](https://github.com/yribeiro/pitchkit/issues/27) —
`apps/docs/components/examples/shot-map-gallery.tsx` is still hardcoded, even though
`/docs/data` and `examples/react-nextjs` fetch live), Metrica loaders
([#30](https://github.com/yribeiro/pitchkit/issues/30)), and the second half of
[#59](https://github.com/yribeiro/pitchkit/issues/59) — richer SkillCorner visualisations
(off-ball runs as `<Arrows>`/`<Comet>`, phases of play, pressure density, passing options with
`xpass_completion`). Every selector #59 needs already exists and is tested; what's left is
presentation only. Its other half (a real `skillcorner` pitch type in core) shipped in
[PR #62](https://github.com/yribeiro/pitchkit/pull/62).

Also open and **not** milestone-scoped: [#2](https://github.com/yribeiro/pitchkit/issues/2)
(Opta pitch renders square instead of 105×68) — root cause is recorded in PRD §11's
Milestone 3 notes.

**AX cluster, all open, all descending from
[#40](https://github.com/yribeiro/pitchkit/issues/40)** (itself still open — only `AGENTS.md`
remains; the bundled Agent Skill and `llms*.txt` shipped):
[#41](https://github.com/yribeiro/pitchkit/issues/41) audits `Scene` for JSON-serialisability
and SSR/headless rendering; [#42](https://github.com/yribeiro/pitchkit/issues/42) is
**evaluate-then-maybe-build** on a PitchKit MCP server, deliberately not a commitment (an MCP
server is an ongoing-maintenance runtime surface, unlike #40's static files);
[#43](https://github.com/yribeiro/pitchkit/issues/43) is an agent eval harness, and is
explicitly a prerequisite for trusting #41/#42's results.

## Load-bearing facts (get these wrong and things break silently)

### SkillCorner dataset

Each of these was verified against the live repository, not assumed — **re-verify before
"correcting" any of them**:

- **Tracking is Git LFS**, so `raw.githubusercontent.com` serves a ~130-byte pointer stub
  instead of data. Hence two base URLs; `SKILLCORNER_LFS_BASE_URL` points at
  `media.githubusercontent.com`. Not a typo — a test asserts them apart.
- **Tracking is ~90 MB/match** at 10 fps. `streamTracking` is an async generator whose `break`
  aborts the download (measured: the demo pulls 1.9 MB of 86.5 MB); `fetchTrackingWindow` does
  an HTTP `Range` read with a byte-offset estimate.
- **The two files use opposite x conventions.** Tracking is absolute and swaps ends at half
  time; dynamic-event `x` is normalised so positive always points at the goal being attacked.
  Confusing them mirrors half a match silently. `attackingSideOf` resolves the former.
- **Pitch dimensions vary per match** (104/105/106 × 68), so `pitchX`/`pitchY` translate by
  that match's own `pitch_length`/`pitch_width` and stay in real metres. `y > 0` is the
  attacking team's left, which is "up" on a y-up pitch — a pure translation, no flip.

### Center-origin coordinates in core

SkillCorner data plots with its **raw `x`/`y`** via `<Pitch type="skillcorner">`. The
`toUefaX`/`toUefaY` fudge that used to live in `examples/react-nextjs` is **deleted** — don't
reintroduce a coordinate workaround in a caller.

- **`toExtentFrame`/`fromExtentFrame` (`transform/canonical.ts`) are the load-bearing piece.**
  They map a provider's coordinates onto `0..length` × `0..width` and back, and are **identity
  functions for every corner-origin provider** — the entire reason statsbomb/opta/uefa are
  untouched. A test asserts that identity directly; keep it.
- The offset is needed in **more places than the transform**, and each omission fails
  _silently_: `scene/geometry.ts`, the default crop in `pixel-transform.ts`, `cropForHalf`,
  and the four density modules (`heatmap/bins`, `heatmap/positional`, `hexbin/bins`,
  `kde/density`) whose `if (x < 0 || x > dimensions.length) return;` bounds checks would
  discard a center-origin pitch's whole defending half. **If you add a module that reasons
  about a `0..length` box, convert through the extent frame first.**
- `getPitchDimensions(type, { length, width })` and `<Pitch dimensions>` handle SkillCorner's
  real 104–106 m pitches. **Markings deliberately do not scale** — a penalty area is 16.5 m on
  any pitch — so only the outline, halfway line and goal lines move. Overriding a normalized
  grid (Opta) throws.
- `packages/react/src/skill-doc.test.ts` asserts the bundled Agent Skill's pitch-type table
  matches the registry exactly, so adding a pitch type fails CI until `SKILL.md` catches up.
  That is intentional.

### Docs decisions that look like bugs but aren't

- **Data docs live at a top-level `/docs/data` section**, which **reverses
  [#29](https://github.com/yribeiro/pitchkit/issues/29)**'s decision to park loader docs under
  _Configuration_ until 2–3 providers existed. That reasoning was about volume; the section
  exists for positioning (Configuration is Tailwind setup and agent-skill install — the wrong
  frame for a headline capability). Don't "restore" the old placement on the issue text alone.
- Those pages **fetch live from StatsBomb open data in the browser**, scoped to Euro 2024
  (competition 55 / season 282 — all 51 matches have 360), and **both auto-load on match
  selection** (events ~3 MB, 360 ~10 MB, since it fetches the events file too). 360 originally
  sat behind a "Load tracking data" button; that was deliberately dropped, because a click
  between the page and the visualisation undercuts the "one call" point the pages exist to
  make. Don't reintroduce it as a payload optimisation.
- Both entry points in `packages/data-providers/src` carry a TSDoc `@module` tag. Without it
  TypeDoc names multi-entry-point modules by source path and API URLs come out as
  `/docs/api/data-providers/packages/data-providers/src/statsbomb/...`.
- **The hero shows StatsBomb / SkillCorner / UEFA, not Opta**
  (`apps/docs/components/hero-pitch.tsx`). Opta is still a supported pitch type and #2 is
  still open — the swap was a shop-window decision, explicitly not a fix.
- **`<title>` and the visible `<h1>` deliberately say different things**
  ([PR #67](https://github.com/yribeiro/pitchkit/pull/67)): the title is keyword-bearing for
  cold search ("React & TypeScript football visualisation library"), the `<h1>` is the brand
  line ("Football visualised for the web."). Same split for `description` (keywords) versus
  `og:`/`twitter:` (hero copy, so a shared link previews as the page it opens). **Not drift —
  don't "fix" it by making them match.** `TAGLINE`/`SUBHEAD`/`SEARCH_DESCRIPTION` live in
  `apps/docs/lib/site.ts` and are read by the hero, the metadata and the OG image alike,
  because those three had already drifted into three taglines once.
- The homepage FAQ (`apps/docs/app/(home)/page.tsx`) is the only part written for people who
  _don't_ already know mplsoccer — it's what targets cold search queries. It renders as plain
  `<details>` (in the DOM without JS, for crawlers) **and** as `FAQPage` JSON-LD from the same
  array; keep both generated from that one source, since structured data that disagrees with
  the visible page gets discounted. `apps/docs/app/robots.ts` names AI crawlers explicitly
  even though the wildcard already allows them — `Google-Extended`/`Applebot-Extended` are
  opt-_out_ tokens, where silence is ambiguous.

### Things with no test or tooling to catch drift

- **The brand mark's geometry is duplicated across five files with nothing linking them** (two
  brand SVGs, the favicon cut, two generated-image components, the React logo component). See
  [CONTRIBUTING.md](./CONTRIBUTING.md)'s "Brand assets" section before touching anything
  logo-shaped; a change to one will not propagate.
- **Prose that enumerates packages, pitch types or dependencies drifts, and nothing checks
  it.** Instances caught so far: all three READMEs carrying a stale "`0.1.x` is the first
  public release" line plus "zero dependencies" claims that `csv-parse` had falsified;
  `llms.txt` listing the coordinate systems as "StatsBomb, Opta, UEFA" (no SkillCorner) and
  describing two packages rather than three; the root `package.json` still saying
  "React-native" long after [PR #49](https://github.com/yribeiro/pitchkit/pull/49). When you
  add a package, pitch type or dependency, grep the whole repo for the old list — `README.md`,
  `packages/*/README.md`, `apps/docs/lib/llms.ts`, `package.json` descriptions, and the
  bundled skill. (The skill's pitch-type table is the one surface a test _does_ guard.)
- **A PR touching `packages/react/skills/` still needs a changeset.**
  [PR #63](https://github.com/yribeiro/pitchkit/pull/63) shipped without one and the fix sat
  unreleased on `main`; it's easy to file skill-content fixes as "just docs."

## Releases are manual

`.github/workflows/release.yml` is `disabled_manually` — it failed with `ENEEDAUTH` (no
`NPM_TOKEN`), so every release so far was published by hand. Tracked in
[#36](https://github.com/yribeiro/pitchkit/issues/36); preferred fix is npm Trusted Publishing
(OIDC) rather than a stored token. Until then:

```bash
npx changeset && npm run version-packages && npm run release && git push origin main --follow-tags
```

(commit between `version-packages` and `release`; `release` needs an OTP.)

**Two distinct auth failures have bitten this flow — don't confuse them.** `E403 "Two-factor
authentication or granular access token ... is required"` means the npm account has no 2FA at
all (fixed once by enabling 2FA set to "Authorization and Writes"). `E401 "authentication
token seems to be invalid"` means the stored login expired — just `npm login` again. The
`E404 "not in this registry"` errors that follow an E401 are noise: npm returns 404 rather
than 403 on unauthenticated `PUT`s to scoped packages. Also, `npm login` cannot open a browser
from WSL (`sensible-browser` fails) — copy the printed URL into a Windows browser by hand; the
terminal picks up the session when you finish.

## Deployment

`apps/docs` **auto-deploys on every push to `main`** via Vercel's GitHub App. There is no
deploy workflow and no `vercel.json` in this repo — don't go looking for one. PRs get preview
deployments. Deploys are independent of `ci.yml`, so a red CI run won't block production.
Vercel Web Analytics **and** PostHog (`posthog-provider.tsx`, `posthog-js`) are both wired up
in `apps/docs/app/layout.tsx` — two tools side by side, not one replacing the other.

### Recurring bug: Vercel `apps/docs` build ENOENT on generated files

`apps/docs` depends on two gitignored, generated inputs — `components/examples/registry.ts`
and `content/docs/api/`. This has broken the Vercel build **twice**, because each fix only
made the _npm_ invocation generate them: first as `predev`/`prebuild` lifecycle hooks (Vercel
doesn't go through npm's pre-hook convention), then inlined into the `"dev"`/`"build"` scripts
themselves ([PR #53](https://github.com/yribeiro/pitchkit/pull/53)) — still broken, because
Vercel's Next.js preset runs `next build` **directly**, bypassing `package.json`'s `"build"`.

The actual fix: **`next.config.ts` runs both generator scripts itself** (via `execFileSync`;
they're still runnable standalone through the npm `"generate"` script). `next.config.ts` is
the one place Next.js always loads no matter what invoked it. If this ENOENT resurfaces, check
`next.config.ts` hasn't been split apart from those calls — don't just re-chain npm scripts.

## Environment gotcha: CRLF from Windows-tool `git pull`/`checkout`

Pulling or checking out through a Windows-native shell tool (git-bash/MINGW, not real WSL
bash) can land freshly-fetched files on disk as CRLF even though git's objects are LF —
`core.autocrlf=true` is a common Windows git default. `git status` shows these as modified,
typically a huge insertions==deletions diff across many files. Confirm with
`git diff --ignore-space-at-eol --stat`: empty output means pure line-ending noise, safe to
discard with `git checkout -- .` (never commit it). This caused 4 spurious
`install-skill.test.mjs` failures in exactly this scenario (its frontmatter parser splits on a
literal `"---\n"`, which doesn't match `"---\r\n"`). Prefer running `git` through real WSL
bash — same underlying reason as the PRD's note on running `npm`/`node` through WSL rather
than Windows-native tooling.

## Security posture

38 open Dependabot alerts (2 critical, 22 high, 13 medium, 1 low) and 7 open Dependabot PRs —
but scope matters before reacting: **the published packages are clean.** `@pitchkit/core` has
zero runtime dependencies, `@pitchkit/react` depends only on `core`, and
`@pitchkit/data-providers` depends on `csv-parse` alone (itself dependency-free) and on
neither of the others — so nobody installing from npm is exposed. **`csv-parse` is the
project's only third-party runtime dependency anywhere**, added for SkillCorner's CSV files;
the old "zero runtime dependencies" line no longer covers all three packages, so don't restate
it. Every alert lives in `apps/docs` or `examples/*`, all `private: true`. The ones that
genuinely matter are those affecting the **live** docs site: `next` (11 alerts, critical) and
`sharp` (2, high). Everything else is dev-only tooling. See PRD §10.
