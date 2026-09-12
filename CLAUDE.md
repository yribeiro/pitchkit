# PitchKit

React-first football pitch visualisation library (mplsoccer for the web). **Not** to be
confused with React Native (the mobile framework) — say "React-first" in any user-facing
copy, not "React-native" ([PR #49](https://github.com/yribeiro/pitchkit/pull/49) reworded
this everywhere after it read as the wrong framework at a glance).

Full PRD: see `docs/PRD.md` — read this before any architectural work.

## Key decisions already made

- Hybrid SVG (interactive marks) + Canvas (heatmaps/KDE) rendering
- Monorepo: npm workspaces + Turborepo, packages under `@pitchkit/*`
- `@pitchkit/core` has zero React dependency; `@pitchkit/react` is a thin binding
- `@pitchkit/react` is the only officially supported rendering surface; core's SVG painters
  (`render/svg/paint-*.ts`, `svgRenderer`) are internal-only, kept solely for the
  `packages/core/examples/index.html` dev harness — new marks ship React-only
  ([issue #6](https://github.com/yribeiro/pitchkit/issues/6), resolved)
- Theming = CSS variables only (shadcn-style), no JS theme objects
- Responsive is the default (no prop); explicit width/height is the opt-out
- **Distribution split (resolved, see PRD §7.4/§8.4):** `@pitchkit/core` and `@pitchkit/react`
  (the marks — `<Pitch>`, `<Scatter>`, `<Arrows>`, `<Comet>`, `<Heatmap>`, etc.) are "plumbing"
  — correctness-critical rendering, published to npm like any dependency. Composite **recipes**
  (pass network, shot map, pass map, …) and **theme presets** are the opposite — opinionated
  compositions/styling a user should own outright — so they ship as **shadcn registry items**
  (`npx shadcn add pass-map`), copying real source into the consumer's repo with
  `@pitchkit/react` auto-installed underneath as a dependency, not as npm packages themselves.

## Current phase

**Milestone 1 — MVP ✅ Complete.** Every checklist item in PRD roadmap section 11 is done
and merged into `main`: pitch styling/theming, SVG mark layers, Canvas heatmap,
`@pitchkit/react` (`<Pitch>`, layer components, `<Heatmap>`, tooltips, `usePitch()`,
review apps `examples/react-vite/` and `examples/react-nextjs/`) via
[PR #5](https://github.com/yribeiro/pitchkit/pull/5); [issue #7](https://github.com/yribeiro/pitchkit/issues/7)
(Tailwind integration) via [PR #13](https://github.com/yribeiro/pitchkit/pull/13);
[issue #6](https://github.com/yribeiro/pitchkit/issues/6) (SVG painters scoping) via
[PR #16](https://github.com/yribeiro/pitchkit/pull/16); docs site skeleton via
[PR #18](https://github.com/yribeiro/pitchkit/pull/18); and the shadcn-style showcase
website via [PR #32](https://github.com/yribeiro/pitchkit/pull/32) (2026-09-06).

**Milestone 2 — v1.0 (parity push), now in progress.** Landed so far:

- Geometric overlays — Flow, Polygon, Convex Hull, Voronoi, Goal Angle — via
  [PR #25](https://github.com/yribeiro/pitchkit/pull/25).
- Density overlays — `<PositionalHeatmap>` (Juego de Posición zones), `<Hexbin>`, `<KDE>` —
  via [PR #39](https://github.com/yribeiro/pitchkit/pull/39), closing
  [#19](https://github.com/yribeiro/pitchkit/issues/19). `createColorScale` moved to
  `color/scale.ts` (public export unchanged) now four layers share it, and
  `renderHeatmapLayersToCanvas` is an alias for the broader
  `renderDensityLayersToCanvas`.
- `appearance.linesOnTop` (mplsoccer's `line_zorder`) — paints markings above layer children
  so opaque density fills don't cover them. Off by default.

- **`@pitchkit/data-providers`** — new package, first published at `0.1.0`
  (see Milestone 3 below), closing [#29](https://github.com/yribeiro/pitchkit/issues/29) via
  [PR #50](https://github.com/yribeiro/pitchkit/pull/50).
  `@pitchkit/data-providers/statsbomb` takes a match id straight to chart-ready data:
  `fetchMatchEvents(id)` → `shots()`/`passes()`/`carries()` → predicates like `isGoal` compose
  with `.filter()`. Keeps StatsBomb's own field names/values (not re-spelled), adds only the
  lifted `x`/`y`/`endX`/`endY`/`endZ` coordinates a PitchKit accessor needs. Zero runtime
  deps, no dependency on `core` or `react`. **This supersedes the PRD's original
  `@pitchkit/data-statsbomb` naming** (§7.4/§8.4/§8.10, now corrected) — named for the
  provider family since [#30](https://github.com/yribeiro/pitchkit/issues/30) plans
  SkillCorner/Metrica loaders under the same package.

Open issues covering the rest of M2: radar/pizza charts
([#21](https://github.com/yribeiro/pitchkit/issues/21)), goal view
([#22](https://github.com/yribeiro/pitchkit/issues/22)), attack/territory and pass-map
recipes ([#23](https://github.com/yribeiro/pitchkit/issues/23),
[#24](https://github.com/yribeiro/pitchkit/issues/24)), interactive pan/zoom
([#26](https://github.com/yribeiro/pitchkit/issues/26)), real StatsBomb samples in the
docs/gallery ([#27](https://github.com/yribeiro/pitchkit/issues/27) — the gallery still uses
hardcoded data, only `examples/react-nextjs` uses the new package so far), and tracking-data
loaders ([#30](https://github.com/yribeiro/pitchkit/issues/30)). Also open: a longstanding
bug, [#2](https://github.com/yribeiro/pitchkit/issues/2) (Opta pitch renders square instead
of 105×68), not milestone-scoped — root cause is in PRD §11's Milestone 3 notes.

Note the recipe issues ([#23](https://github.com/yribeiro/pitchkit/issues/23)/[#24](https://github.com/yribeiro/pitchkit/issues/24))
depend on shadcn registry infrastructure that **does not exist yet** — `apps/docs` has only
an internal examples registry for its own gallery, not a consumable `registry.json`.

**Milestone 3 — publishing, largely complete (2026-09-08), pulled forward ahead of M2.**
It was originally deferred until after M2's parity push, but was brought forward to claim the
namespace and get the library installable:

- **Published to npm:** [`@pitchkit/core`](https://www.npmjs.com/package/@pitchkit/core),
  [`@pitchkit/react`](https://www.npmjs.com/package/@pitchkit/react), and
  [`@pitchkit/data-providers`](https://www.npmjs.com/package/@pitchkit/data-providers),
  under the `pitchkit` npm org.
  - `0.1.0` — 2026-09-08. First publish, verified from a clean StackBlitz project installing
    off the registry.
  - `0.2.0` (both packages) — 2026-09-09. Density overlays (`<PositionalHeatmap>`,
    `<Hexbin>`, `<KDE>`) and `appearance.linesOnTop`. Also the first release whose tarballs
    carry the READMEs/LICENSE — `0.1.0` predated them.
  - **`0.3.0` (`@pitchkit/react` only — `core` untouched)** — 2026-09-10. Ships a bundled
    **Agent Skill** inside the tarball (`skills/pitchkit/`): `SKILL.md` (mental model,
    build-breaking gotchas, four worked recipes) plus `references/api.md` (full prop
    tables). A new `pitchkit` bin: `npx @pitchkit/react skills install [--dir] [--force]`
    symlinks it into the consumer's project (default `.claude/skills/`), so `npm update`
    moves the skill with the version actually installed — no stale API. This is the Skill
    slice of [issue #40](https://github.com/yribeiro/pitchkit/issues/40) ("AX: ship
    `llms.txt`, `AGENTS.md`, and a bundled Agent Skill"). Shipped via
    [PR #46](https://github.com/yribeiro/pitchkit/pull/46).
  - **`@pitchkit/data-providers@0.1.0` (new package, first publish) — version-bumped, not
    yet confirmed live on the registry as of this writing.** `@pitchkit/data-providers/statsbomb`:
    `fetchMatchEvents(id)` → `shots()`/`passes()`/`carries()`, predicates (`isGoal`,
    `isComplete`, …) compose via `.filter()`, lifted `x`/`y`/`endX`/`endY`/`endZ` for
    PitchKit accessors, StatsBomb's own field names otherwise untouched. Zero runtime deps,
    no dependency on `core`/`react`. Closes
    [#29](https://github.com/yribeiro/pitchkit/issues/29) via
    [PR #50](https://github.com/yribeiro/pitchkit/pull/50).
- **`llms.txt`, `llms-full.txt`, `llms-api.txt`, per-page Markdown** — via
  [PR #48](https://github.com/yribeiro/pitchkit/pull/48) (2026-09-10), `apps/docs/app/llms*`
  routes. Another #40 slice. **#40 is still open — only `AGENTS.md` remains.**
- **Brand identity** — via [PR #47](https://github.com/yribeiro/pitchkit/pull/47)
  (2026-09-10): the PitchKit mark (two penalty areas + halfway line + centre circle,
  reading as `[ ]`), applied across the README header, docs nav, favicon, and generated
  OG/Twitter images. **The mark's geometry is duplicated across five files with nothing
  linking them** (two brand SVGs, the favicon cut, two generated-image components, the
  React logo component) — see [CONTRIBUTING.md](./CONTRIBUTING.md)'s "Brand assets"
  section before touching anything logo-shaped; a change to one will not propagate and no
  test catches the drift.
- **Positioning reworded again, "React-native" → "React-first"** — via
  [PR #49](https://github.com/yribeiro/pitchkit/pull/49) (2026-09-10). "React-native" (PR
  #45) reads at a glance as *React Native*, the mobile framework — wrong association for a
  web-only library. This file's own opening line was one of the stragglers, now fixed.
- **Docs site live:** [pitchkitjs.com](https://pitchkitjs.com) — interactive hero, `/gallery`,
  docs, API reference. **Auto-deploys on every push to `main`** via Vercel's GitHub App —
  there is no deploy workflow or `vercel.json` in this repo, so don't go looking for one; PRs
  get preview deployments too. Deploys are independent of `ci.yml` (a red CI run won't block
  production). Vercel Web Analytics is wired up in `apps/docs/app/layout.tsx`.
- **Repo hygiene done:** MIT `LICENSE` (root + both packages), root + per-package READMEs,
  `CONTRIBUTING.md`, issue/PR templates, npm metadata.
- **Release automation NOT done.** `.github/workflows/release.yml` (changesets/action) is
  `disabled_manually` — it failed with `ENEEDAUTH` since no `NPM_TOKEN` was configured, so
  both `0.1.0` and `0.2.0` were published by hand. Tracked in
  [issue #36](https://github.com/yribeiro/pitchkit/issues/36); preferred fix is npm Trusted
  Publishing (OIDC) rather than a stored token. **Until that's resolved, releases are manual:**
  `npx changeset` → `npm run version-packages` → commit → `npm run release` (needs an OTP) →
  `git push origin main --follow-tags`.
- **Two distinct auth failures have bitten this manual flow — don't confuse them:**
  `E403 "Two-factor authentication or granular access token ... is required"` means the npm
  account has no 2FA enabled at all (fixed once, by enabling 2FA set to "Authorization and
  Writes"). `E401 "authentication token seems to be invalid"` means the stored login has
  simply expired — just `npm login` again. The `E404 "not in this registry"` errors that
  follow an E401 are noise: npm returns 404 rather than 403 on unauthenticated `PUT`s to
  scoped packages. Also note `npm login` cannot open a browser from WSL
  (`sensible-browser` fails) — copy the printed login URL into a Windows browser by hand;
  the terminal picks up the session when you finish.

Remaining: **Milestone 2 — v1.0 parity push** (see above), plus the release automation in
issue #36.

## Environment gotcha: CRLF from Windows-tool `git pull`/`checkout`

If you pull or check out files using a Windows-native shell tool (git-bash/MINGW, not real
WSL bash) against this repo, files that were just fetched can land on disk as CRLF even
though git's stored objects are LF — `core.autocrlf=true` is a common Windows git default,
and it converts on checkout. `git status` **will show these as modified** (not silently
normalized), typically as a huge insertions==deletions diff across many files. Confirm with
`git diff --ignore-space-at-eol --stat` — empty output means it's pure line-ending noise, not
real changes, and it's safe to discard with `git checkout -- .` (never commit it). This isn't
hypothetical: it caused 4 spurious test failures in `install-skill.test.mjs` in this exact
scenario (its frontmatter parser splits on a literal `"---\n"`, which doesn't match
`"---\r\n"`). Prefer running `git pull`/`checkout` through real WSL bash to avoid it happening at all —
same underlying reason as the PRD's existing note (§11 progress notes) on running
`npm`/`node` through WSL rather than Windows-native tooling: this repo's tooling assumes a
Linux-native checkout.

## Recurring bug: Vercel `apps/docs` build ENOENT on generated files

`apps/docs` depends on two gitignored, generated inputs — `components/examples/registry.ts`
(`scripts/generate-examples-registry.mjs`) and `content/docs/api/` (`scripts/generate-api-docs.mjs`).
This has broken the Vercel build **twice** with `ENOENT: no such file or directory, lstat
'.../registry.ts'` because each fix only made the *npm* invocation generate them:

1. Originally wired as `predev`/`prebuild` npm lifecycle hooks — but whatever invokes the
   Vercel build there doesn't go through npm's pre-hook convention, so they silently never
   ran.
2. [PR #53](https://github.com/yribeiro/pitchkit/pull/53) inlined generation into the
   `"dev"`/`"build"` npm scripts themselves (`"build": "npm run generate && next build"`).
   Still broke, because Vercel's Next.js framework preset runs `next build` **directly**
   against this app's Root Directory when no `vercel.json`/dashboard override says
   otherwise — bypassing `package.json`'s `"build"` script (and therefore the generate
   step) entirely.

The actual fix: `next.config.ts` runs both generator scripts itself (via `execFileSync`,
unchanged otherwise — still runnable standalone through the npm `"generate"` script too).
`next.config.ts` is the one place Next.js always loads no matter what command or tool
invoked it, so this can't be bypassed by a differently-configured build command again. If
this ENOENT resurfaces, check `next.config.ts` hasn't been split apart from those calls —
don't just re-chain npm scripts.

## Security posture (2026-09-10)

38 open Dependabot alerts (2 critical, 22 high, 13 medium, 1 low) and 7 open Dependabot PRs —
but scope matters before reacting: **the published packages are clean.** `@pitchkit/core` has
zero runtime dependencies, `@pitchkit/react` depends only on `core`, and
`@pitchkit/data-providers` has zero runtime deps and doesn't depend on either — so nobody
installing from npm is exposed. Every alert lives in `apps/docs` or `examples/*`, all of which
are `private: true`. The ones that genuinely matter are those affecting the **live** docs
site: `next` (11 alerts, critical) and `sharp` (2, high). Everything else is dev-only tooling.
See PRD §10.
