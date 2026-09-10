# PitchKit

React-native football pitch visualisation library (mplsoccer for the web).

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

Open issues covering the rest of M2: radar/pizza charts
([#21](https://github.com/yribeiro/pitchkit/issues/21)), goal view
([#22](https://github.com/yribeiro/pitchkit/issues/22)), attack/territory and pass-map
recipes ([#23](https://github.com/yribeiro/pitchkit/issues/23),
[#24](https://github.com/yribeiro/pitchkit/issues/24)), interactive pan/zoom
([#26](https://github.com/yribeiro/pitchkit/issues/26)), and StatsBomb/data-provider
loaders ([#27](https://github.com/yribeiro/pitchkit/issues/27),
[#29](https://github.com/yribeiro/pitchkit/issues/29),
[#30](https://github.com/yribeiro/pitchkit/issues/30)). Also open: a longstanding bug,
[#2](https://github.com/yribeiro/pitchkit/issues/2) (Opta pitch renders square instead of
105×68), not milestone-scoped — root cause is in PRD §11's Milestone 3 notes.

Note the recipe issues ([#23](https://github.com/yribeiro/pitchkit/issues/23)/[#24](https://github.com/yribeiro/pitchkit/issues/24))
depend on shadcn registry infrastructure that **does not exist yet** — `apps/docs` has only
an internal examples registry for its own gallery, not a consumable `registry.json`.

**Milestone 3 — publishing, largely complete (2026-09-08), pulled forward ahead of M2.**
It was originally deferred until after M2's parity push, but was brought forward to claim the
namespace and get the library installable:

- **Published to npm:** [`@pitchkit/core`](https://www.npmjs.com/package/@pitchkit/core)
  and [`@pitchkit/react`](https://www.npmjs.com/package/@pitchkit/react), under the
  `pitchkit` npm org. `0.1.0` released 2026-09-08 (verified from a clean StackBlitz project
  installing off the registry); **`0.2.0` released 2026-09-09** — density overlays
  (`<PositionalHeatmap>`, `<Hexbin>`, `<KDE>`) and `appearance.linesOnTop`.
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

## Security posture (2026-09-09)

37 open Dependabot alerts (2 critical, 22 high) and 7 open Dependabot PRs — but scope matters
before reacting: **the published packages are clean.** `@pitchkit/core` has zero runtime
dependencies and `@pitchkit/react` depends only on `core`, so nobody installing from npm is
exposed. Every alert lives in `apps/docs` or `examples/*`, all of which are `private: true`.
The ones that genuinely matter are those affecting the **live** docs site: `next` (11 alerts,
critical) and `sharp` (2, high). Everything else is dev-only tooling. See PRD §10.
