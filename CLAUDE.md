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
  **360 optical tracking** landed next via
  [PR #52](https://github.com/yribeiro/pitchkit/pull/52) — `fetchMatchThreeSixty(id)`,
  `indexThreeSixtyByEvent` to join frames onto events by `event_uuid`, freeze-frame selectors
  and `visibleAreaPolygon`.

- **`@pitchkit/data-providers/skillcorner`** — the second provider module: 20 A-League
  2024/25 matches of broadcast tracking, dynamic events and phases of play. Partially
  addresses [#30](https://github.com/yribeiro/pitchkit/issues/30) (Metrica is still open).
  Four facts about this dataset are load-bearing and were each verified against the live
  repository, not assumed — **re-verify before "correcting" any of them**:
  - **Tracking is Git LFS**, so `raw.githubusercontent.com` serves a ~130-byte pointer stub
    instead of data. Hence two base URLs; `SKILLCORNER_LFS_BASE_URL` points at
    `media.githubusercontent.com`. This is not a typo, and a test asserts them apart.
  - **Tracking is ~90 MB/match** at 10 fps. `streamTracking` is an async generator whose
    `break` aborts the download (measured: the demo pulls **1.9 MB of 86.5 MB, 2.2%**);
    `fetchTrackingWindow` does an HTTP `Range` read with a byte-offset estimate.
  - **The two files use opposite x conventions.** Tracking is absolute and swaps ends at
    half time; dynamic-event `x` is normalised so positive always points at the goal being
    attacked. Confusing them mirrors half a match silently. `attackingSideOf` resolves the
    former. Verified: team mean-x flips sign between periods exactly as `home_team_side`
    says, while attacking-third rows are `x > 0` in both halves.
  - **Pitch dimensions vary per match** (104/105/106 × 68), so `pitchX`/`pitchY` translate
    by that match's own `pitch_length`/`pitch_width` and stay in its real metres. `y > 0` is
    the attacking team's left (confirmed against every `wide_left`/`half_space_left` row of
    a full match), which is "up" on a y-up pitch, so the transform is a pure translation
    with no flip.

  Adding this module brought in **`csv-parse`** — see the security-posture note below; it is
  the project's first and only third-party runtime dependency.

- **`skillcorner` pitch type + center-origin support in core.** SkillCorner data now plots with
  its **raw `x`/`y`** — `<Pitch type="skillcorner">` shares its centre-origin metre grid. The
  `toUefaX`/`toUefaY` fudge that used to live in `examples/react-nextjs` is **deleted**; don't
  reintroduce a coordinate workaround in a caller.
  - **`toExtentFrame`/`fromExtentFrame` (`transform/canonical.ts`) are the load-bearing piece.**
    They map a provider's coordinates onto `0..length` × `0..width` and back, and are **identity
    functions for every corner-origin provider** — which is the entire reason statsbomb/opta/uefa
    are untouched. A test asserts that identity directly; keep it.
  - The offset was needed in **more places than the transform**, and each omission fails
    _silently_: `scene/geometry.ts` (markings would be double-shifted), the default crop in
    `pixel-transform.ts`, `cropForHalf`, and the four density modules
    (`heatmap/bins`, `heatmap/positional`, `hexbin/bins`, `kde/density`) whose
    `if (x < 0 || x > dimensions.length) return;` bounds checks discard a center-origin pitch's
    whole defending half. If you add a module that reasons about a `0..length` box, convert
    through the extent frame first.
  - `getPitchDimensions(type, { length, width })` and `<Pitch dimensions>` handle SkillCorner's
    real 104–106 m pitches. **Markings deliberately do not scale** — a penalty area is 16.5 m on
    any pitch — so only the outline, halfway line and goal lines move. Overriding a normalized
    grid (Opta) throws.
  - `packages/react/src/skill-doc.test.ts` asserts the bundled Agent Skill's pitch-type table
    matches the registry exactly, so adding a pitch type fails CI until `SKILL.md` catches up.
    That is intentional.

- **`@pitchkit/data-providers/wyscout` + a `wyscout` pitch type, and [#2](https://github.com/yribeiro/pitchkit/issues/2)
  (Opta renders square) is now genuinely fixed, not just closed** — via
  [PR #72](https://github.com/yribeiro/pitchkit/pull/72). Published in `core@0.4.0`/
  `react@0.5.0`/`data-providers@0.4.0` (see Milestone 3 below) — #2 had already been
  bulk-closed on GitHub weeks earlier with no code behind it (see the CRLF/security-posture
  era of this file's history); this is the release where the closure became true.
  - **The root cause of #2, fixed for both percentage grids at once.** Opta and Wyscout are
    both `0..100` on _both_ axes, but `createPixelTransform` derived a pitch's on-screen shape
    from `length`/`width` directly, so a 100×100 grid always rendered as a square. `x` spans
    105 m of grass and `y` only 68 m — `PitchDimensions` has carried `realLengthMeters`/
    `realWidthMeters` since the start and **nothing read them**. `displayUnitScale`
    (`transform/canonical.ts`) now converts a normalized grid's units to metres before
    anything derives shape, gated on `normalized` so StatsBomb/UEFA/SkillCorner render
    byte-identically (`unitScale` is `1` on both axes for them). Measured at 600×400: opta
    1.0000 → 1.5441, wyscout 1.5441 from the start.
  - **Nine test files hardcoded their pitch-type list** (`["statsbomb", "opta", "uefa"]` or
    similar), so `skillcorner` had gone silently uncovered in six of them since it shipped.
    Now all derive from `Object.keys(PITCH_DIMENSIONS)`, which immediately surfaced four real
    gaps: `scene/geometry.test.ts`'s outline/goal/corner-arc/penalty-arc assertions and
    `transform/standardize.test.ts`'s geographic corners all assumed the pitch's minimum
    corner is `(0, 0)` — wrong for a center-origin grid. Fixed by deriving the minimum corner
    from `dimensions.origin` instead of assuming it.
  - **Wyscout is not Opta under another name**, even though both are `0..100` on both axes:
    Wyscout's origin is top-left with y increasing downward, Opta's is bottom-left with y
    increasing upward (confirmed against mplsoccer's `wyscout_dims()`/`opta_dims()`). Plotting
    one on the other's type mirrors the pitch vertically, and nothing errors.
  - **Wyscout events are only browser-fetchable from a third-party mirror.** The official
    release (the Pappalardo et al. dataset, figshare, CC BY 4.0) ships events as a single
    77 MB `events.zip` covering all 1,941 matches. `koenvo/wyscout-soccer-match-event-dataset`
    splits that archive per match (~480 KB each) with no field renamed, which is what makes it
    an acceptable source under "the provider's data stays the provider's." The small reference
    files (competitions, teams, players, tag vocabulary) are fetched from figshare directly —
    two base URLs, the same shape as SkillCorner's raw/LFS split. There is **no `fetchMatches`**
    — the mirror publishes no JSON index, only a generated Markdown table — so the docs example
    ships a curated shortlist instead, scoped to `apps/docs`.
  - **A goal is tagged twice.** Wyscout's `GOAL` tag (101) sits on the scoring action _and_ on
    the conceding keeper's `Save attempt` — measured across six full matches (9,765 events):
    15 shots, 19 save attempts, 3 free kicks. `shots(events).filter(isGoal)` counts each goal
    once; filtering the whole feed does not. Both `select.ts` and the docs page say so.
  - **A shot has no end coordinate.** `positions[1]` was a placeholder in 148 of 148 shots —
    likewise `Interruption` (348/348) and `Offside` (32/32) — while a pass carried a real one
    in 5,077 of 5,127. Wyscout records where a shot went in its goal-mouth tags (1201–1223)
    instead; `shotGoalZone` reads them. The exclusion is keyed on **event type, not value**:
    `(100, 100)` is a placeholder for a goal kick and a genuine corner-flag position for a
    corner, so no value-based test could separate them — verify this against a fresh sample
    before "simplifying" it to a coordinate check.
  - Predicates read Wyscout's tags (`hasTag` + `WYSCOUT_TAGS`) rather than inventing fields —
    the same "interpretation lives in functions" principle as StatsBomb's predicates.

- **Data docs** — a top-level **Data** nav section (`/docs/data` → Overview, then StatsBomb
  split into Events and 360, SkillCorner into Tracking / Dynamic Events / Phases of Play, and
  Wyscout into a single Events page — one file is right for one file type), plus a homepage
  feature card, README section, and the package finally wired into the generated API
  reference. **This reverses
  [#29](https://github.com/yribeiro/pitchkit/issues/29)'s recorded decision** to park the
  loader docs under _Configuration_ until 2–3 providers existed: that reasoning was about
  volume, whereas the section exists for positioning (Configuration is Tailwind setup and
  agent-skill install — the wrong frame for a headline capability). Don't "restore" the old
  placement on the strength of the issue text alone.
  - The docs examples on those pages **fetch live from StatsBomb open data in the browser**,
    scoped to Euro 2024 (competition 55 / season 282 — all 51 matches have 360). **Both
    auto-load on match selection** — events ~3 MB, 360 ~10 MB (it fetches the events file
    too, to join frames onto). 360 originally sat behind a "Load tracking data" button for
    exactly that reason; that was deliberately dropped, because a click between the page and
    the visualisation undercuts the "one call" point these pages exist to make. Don't
    reintroduce it as a payload optimisation.
  - Both entry points in `packages/data-providers/src` carry a TSDoc `@module` tag. Without
    it TypeDoc names multi-entry-point modules by source path and the API URLs come out as
    `/docs/api/data-providers/packages/data-providers/src/statsbomb/...`.

Open issues covering the rest of M2: radar/pizza charts
([#21](https://github.com/yribeiro/pitchkit/issues/21)), goal view
([#22](https://github.com/yribeiro/pitchkit/issues/22)), attack/territory and pass-map
recipes ([#23](https://github.com/yribeiro/pitchkit/issues/23),
[#24](https://github.com/yribeiro/pitchkit/issues/24)), interactive pan/zoom
([#26](https://github.com/yribeiro/pitchkit/issues/26)), real StatsBomb samples in the
**gallery specifically** ([#27](https://github.com/yribeiro/pitchkit/issues/27) —
`apps/docs/components/examples/shot-map-gallery.tsx` still uses hardcoded data; the new
`/docs/data` pages and `examples/react-nextjs` fetch live StatsBomb data, but the gallery
itself doesn't yet), and tracking-data loaders beyond StatsBomb+SkillCorner+Wyscout
([#30](https://github.com/yribeiro/pitchkit/issues/30) — Metrica is still open). Also open:
[#59](https://github.com/yribeiro/pitchkit/issues/59) (follow-up to #58's
SkillCorner loader) — **half done, still open for its second half.** Its "real
`skillcorner` pitch type in `core`" half shipped via [PR #62](https://github.com/yribeiro/pitchkit/pull/62)
(see the Milestone 2 entry above), including deleting the `toUefaX`/`toUefaY` squash-fudge
as that half's issue text required. What's left, and why #59 is still open: **richer
SkillCorner visualisations** — off-ball runs (`offBallRuns`) as `<Arrows>`/`<Comet>`,
phases of play, pressure/on-ball-engagement density, passing options with
`xpass_completion` — all backed by selectors that already exist and are tested; this
remaining half is presentation work only.

Note the recipe issues ([#23](https://github.com/yribeiro/pitchkit/issues/23)/[#24](https://github.com/yribeiro/pitchkit/issues/24))
depend on shadcn registry infrastructure that **does not exist yet** — `apps/docs` has only
an internal examples registry for its own gallery, not a consumable `registry.json`.

**AX follow-on cluster (all open, all descend from #40):**
[#41](https://github.com/yribeiro/pitchkit/issues/41) audits `Scene` for JSON-serialisability
and SSR/headless rendering against a published "AI-friendly charting library" rubric;
[#42](https://github.com/yribeiro/pitchkit/issues/42) is an **evaluate-then-maybe-build** on a
PitchKit MCP server (deliberately not a commitment — an MCP server is an ongoing-maintenance
runtime surface, unlike #40's static files); [#43](https://github.com/yribeiro/pitchkit/issues/43)
is an agent eval harness to measure AX changes empirically rather than by feel, and is
explicitly a prerequisite for trusting #41/#42's results.

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
  - **`@pitchkit/data-providers@0.1.0`** (new package, first publish) — 2026-09-10.
    `@pitchkit/data-providers/statsbomb`: `fetchMatchEvents(id)` →
    `shots()`/`passes()`/`carries()`, predicates (`isGoal`, `isComplete`, …) compose via
    `.filter()`, lifted `x`/`y`/`endX`/`endY`/`endZ` for PitchKit accessors, StatsBomb's own
    field names otherwise untouched. Zero runtime deps, no dependency on `core`/`react`.
    Closes [#29](https://github.com/yribeiro/pitchkit/issues/29) via
    [PR #50](https://github.com/yribeiro/pitchkit/pull/50).
  - **`@pitchkit/react@0.3.1`** (patch) **+ `@pitchkit/data-providers@0.2.0`** (minor;
    `core` untouched) — 2026-09-12. `react`: fixes an empty tooltip box rendering when a
    `tooltip` accessor returns a falsy value (`null`/`undefined`/`false`/`""`) for a given
    datum, across every mark that takes the prop. `data-providers`: adds StatsBomb **360
    tracking data** — `fetchMatchThreeSixty(id)`, `indexThreeSixtyByEvent` to join frames
    onto events by `event_uuid`, freeze-frame role predicates (`isTeammate`, `isOpponent`,
    `isActor`, `isKeeper`) and selectors (`teammatesIn`, `opponentsIn`, `visibleAreaPolygon`),
    plus a typed `match_status_360` so callers can check per-match availability before
    fetching. Via [PR #52](https://github.com/yribeiro/pitchkit/pull/52) (data) and
    [PR #54](https://github.com/yribeiro/pitchkit/pull/54) (the tooltip fix rode along with
    that PR's docs work).
  - **`@pitchkit/data-providers@0.3.0`** (minor; `core`/`react` untouched) — 2026-09-13.
    Adds `@pitchkit/data-providers/skillcorner` — see the Milestone 2 entry above for the
    load-bearing dataset facts (Git LFS, ~90 MB/match, opposite x-conventions, per-match
    pitch dimensions). Also brings in `csv-parse`, the project's first runtime dependency
    anywhere — see Security posture below. Via
    [PR #58](https://github.com/yribeiro/pitchkit/pull/58).
  - **`@pitchkit/core@0.3.0` + `@pitchkit/react@0.4.0`** (both minor;
    `data-providers` untouched) — 2026-09-13. The `"skillcorner"` pitch type and
    center-origin coordinate system support generally (see the Milestone 2 entry above for
    the `toExtentFrame`/`fromExtentFrame` mechanics and the four density-module bounds-check
    gotcha). Widens the public `PitchTypeId` union — additive for callers, but an exhaustive
    `switch` over it gains a case. Via [PR #62](https://github.com/yribeiro/pitchkit/pull/62).
  - **`@pitchkit/react@0.4.1`** (patch; `core`/`data-providers` untouched) — 2026-09-13.
    Fixes the bundled Agent Skill contradicting itself: it listed `"skillcorner"` under
    "things that do not exist" while also documenting it in the pitch-type table, so an
    agent reading top-down would refuse a feature `0.3.0`/`0.4.0` had already shipped. Also
    adds `@pitchkit/data-providers` to the skill (previously near-invisible — no
    package-table row, absent from frontmatter). Via
    [PR #63](https://github.com/yribeiro/pitchkit/pull/63) — **that PR shipped without a
    changeset**, so the fix sat unreleased on `main` until this pass added one
    retroactively. When reviewing a PR that touches `packages/react/skills/`, check for a
    changeset explicitly; it's easy to file skill-content fixes as "just docs."
  - **`@pitchkit/core@0.3.1` + `@pitchkit/react@0.4.2` + `@pitchkit/data-providers@0.3.1`**
    (all three patch) — 2026-09-22. Reworded npm `description`/`keywords` on all three for
    discoverability. Also a follow-up to [PR #69](https://github.com/yribeiro/pitchkit/pull/69)
    below: every `pitchkitjs.com` link in the READMEs and the bundled Agent Skill now points
    at `https://www.pitchkitjs.com`, the host actually served (the apex 308-redirects) —
    #69 fixed the docs site's own links but explicitly left the published packages for a
    follow-up release, since a redirect-following client was never actually broken, only an
    agent fetching a `SKILL.md` link verbatim.
  - **`@pitchkit/core@0.4.0` + `@pitchkit/react@0.5.0` + `@pitchkit/data-providers@0.4.0`**
    (all minor) — 2026-09-27. The Wyscout open-data provider and the `"wyscout"` pitch type
    (see the Milestone 2 entry above for the full writeup), which also fixed the long-standing
    normalized-grid bug behind [#2](https://github.com/yribeiro/pitchkit/issues/2) — Opta and
    Wyscout now render as real 105:68 rectangles instead of squares, via
    `displayUnitScale` deriving shape from `realLengthMeters`/`realWidthMeters`.
    StatsBomb/UEFA/SkillCorner render byte-identically (`unitScale` is `1` for them). Via
    [PR #72](https://github.com/yribeiro/pitchkit/pull/72) (provider + fix) and
    [PR #73](https://github.com/yribeiro/pitchkit/pull/73) (docs, and the bundled Agent
    Skill's Wyscout section).
  - **`@pitchkit/react@0.5.1`** (patch; `core`/`data-providers` untouched) — 2026-09-27.
    Lists `--pitch-marker-goal` (the `<GoalAngle>` wedge fill) in the bundled Agent Skill's
    theming variable table — an audit finding from
    [PR #74](https://github.com/yribeiro/pitchkit/pull/74) (see the docs-polish entry
    below), which also caught two tooltip variables missing from the *docs site's* own
    theming table (a docs-only fix, no changeset).
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
  #45) reads at a glance as _React Native_, the mobile framework — wrong association for a
  web-only library. This file's own opening line was one of the stragglers, now fixed.
- **Docs polish** — a dedicated agents/AI section plus a "Build with AI" entry point
  ([PR #57](https://github.com/yribeiro/pitchkit/pull/57)), a shortened hero tagline
  ("Football visualised for the web.", [PR #60](https://github.com/yribeiro/pitchkit/pull/60)),
  and a colour logo strip above the prompts ([PR #61](https://github.com/yribeiro/pitchkit/pull/61)).
- **Styling docs section** — `/docs/styling`, directly above Data in the nav, consolidating
  what used to be spread across Guides → Theming, Configuration → Tailwind and a standalone
  Styling page. Three pages: **Theming** (the `--pitch-*` variables, moved from
  `guides/theming`), **Tailwind** (moved from `configuration/tailwind`; the Configuration
  section no longer exists) and **Pitch Palettes** (`styling/palettes.mdx`). The Guides →
  Recipes page was deleted — its examples still live on `/gallery`. Old URLs, including
  their `.md` variants, are redirected in `apps/docs/next.config.ts`.
  - Pitch Palettes has one live example (`styling-shot-map-basic.tsx`): every shot from the
    Euro 2024 final, fetched from StatsBomb open data, with a switcher across four palettes
    (Newsprint, Analyst navy, Dracula, Gruvbox). The palette colours live in an `@theme`
    block in `apps/docs/app/globals.css`, which is what makes
    `pitch-surface-dracula-background`, `fill-gruvbox-red/30` etc. exist. Every class string
    is a full literal; Tailwind only generates classes it finds verbatim in source.
- **Hero rebuilt as a gallery carousel** — via [PR #70](https://github.com/yribeiro/pitchkit/pull/70)
  (2026-09-20), replacing the old click-to-plot toy pitch with three real gallery
  visualisations (shot map, pass network, Voronoi) auto-cycling on a countdown, pause
  control, and hover-to-focus on the shot map. **Surfaced a real library gap, worth
  knowing before anyone else hits it:** there is no public way to react to a mark being
  hovered — `usePitch()` deliberately withholds `setTooltip`, so the hover-focus effect
  reads `data-pitchkit-mark` off the bubbled DOM event instead. If interactive recipes
  become a pattern, an `onHover` accessor (or exposing `setTooltip`) would remove the need
  for that lookup. Worth a GitHub issue if interactive recipes become a real theme.
- **Quickstart rebuilt as a guided real-match chart** — via
  [PR #71](https://github.com/yribeiro/pitchkit/pull/71) (2026-09-24): a hardcoded
  two-shot array replaced with a four-step build of Palmer's Euro 2024 final equaliser
  (load the match → draw the pitch → isolate the possession → plot arrows/comets/marker),
  fetched live in-browser like the `/docs/data` examples, with the source clip embedded
  (`youtube-nocookie.com`, lazy-loaded — the site's first third-party iframe). Also renamed
  the homepage CTA "Get started" → "Quickstart".
- **Styling consolidated into one nav section** — via
  [PR #74](https://github.com/yribeiro/pitchkit/pull/74) (2026-09-27): Theming (moved from
  Guides) and Tailwind (moved from Configuration, now removed) join a new **Pitch Palettes**
  page under a single **Styling** section, directly above Data. Palettes shows every shot
  from the Euro 2024 final, loaded live from StatsBomb, across four themes (Newsprint,
  Analyst navy, Dracula, Gruvbox), each just Tailwind classes against an `@theme` block in
  `globals.css` — no new theming mechanism. Guides → Recipes is removed (examples live on
  `/gallery` already); old URLs (including `.md` variants) redirect. An audit pass here
  found the docs site's own theming table missing `--pitch-marker-goal` and two tooltip
  variables, and the Tailwind page not listing all eight `className`-aware layers — both
  fixed alongside the same gap in the bundled Agent Skill (`react@0.5.1` above).
- **SEO / AI-search pass.** Target queries: "react library for football", "football web
  application library", "typescript football visualisations", "charting library for
  football", "visualisation library football". The load-bearing decisions:
  - **`<title>` and the visible hero deliberately say different things.** The `<title>` is
    "PitchKit — React & TypeScript football visualisation library" (what people search for);
    the `<h1>` is still "Football visualised for the web." (the brand line from
    [PR #60](https://github.com/yribeiro/pitchkit/pull/60)/[PR #65](https://github.com/yribeiro/pitchkit/pull/65)).
    This is not drift — **don't "fix" it by making them match.** Likewise `description` is
    keyword-bearing while `og:`/`twitter:` carry the hero copy, so a shared link previews as
    the page it opens.
  - `TAGLINE`, `SUBHEAD` and `SEARCH_DESCRIPTION` live in `apps/docs/lib/site.ts`. The hero,
    the page metadata and the generated OG image all read them, because those three had
    already drifted into three different taglines once.
  - The homepage FAQ section (`FAQ` in `apps/docs/app/(home)/page.tsx`) is the part that
    actually targets the queries — the rest of the site is written for people who already
    know mplsoccer. It renders as plain `<details>` (in the DOM with no JS, for crawlers)
    **and** as `FAQPage` JSON-LD from the same array; structured data that disagrees with
    the visible page gets discounted, so keep them generated from the one source.
  - `apps/docs/app/robots.ts` names the AI crawlers explicitly. The wildcard already allows
    them; the point is that `Google-Extended`/`Applebot-Extended` are opt-*out* tokens where
    silence is ambiguous.
  - **Follow-up bug, fixed by [PR #69](https://github.com/yribeiro/pitchkit/pull/69)
    (2026-09-13):** `SITE_URL` was the apex (`https://pitchkitjs.com`), but Vercel serves
    from `www` and 308-redirects the apex there — so every canonical, `og:url`, sitemap
    entry, and every link inside `llms.txt` pointed at a redirecting URL. Fine for Google
    (it resolves redirecting canonicals) but not for an agent crawler that doesn't follow
    redirects, which is the exact audience `llms.txt` exists for. `SITE_URL` now points at
    `www` directly. The published packages' own `pitchkitjs.com` links (READMEs,
    `SKILL.md`) had the same bug and were fixed in the `0.3.1`/`0.4.2`/`0.3.1` release
    below, one release later than the docs site itself.
- **Docs site live:** [pitchkitjs.com](https://pitchkitjs.com) — interactive hero, `/gallery`,
  docs, API reference. **Auto-deploys on every push to `main`** via Vercel's GitHub App —
  there is no deploy workflow or `vercel.json` in this repo, so don't go looking for one; PRs
  get preview deployments too. Deploys are independent of `ci.yml` (a red CI run won't block
  production). Vercel Web Analytics **and** PostHog (`posthog-js`, via
  [PR #64](https://github.com/yribeiro/pitchkit/pull/64), `apps/docs/components/posthog-provider.tsx`)
  are both wired up in `apps/docs/app/layout.tsx` — two analytics tools side by side, not a
  replacement of one by the other.
- **Repo hygiene done:** MIT `LICENSE` (root + both packages), root + per-package READMEs,
  `CONTRIBUTING.md`, issue/PR templates, npm metadata.
- **READMEs had drifted, fixed 2026-09-13.** All three carried a stable "`0.1.x` is the
  first public release" claim from launch day, long past `0.1.x`, plus two "zero
  dependencies" lines for `@pitchkit/data-providers` that `csv-parse` had already falsified.
  Reworded the version claim to a durable "pre-`1.0`" framing that won't need editing every
  release. **Check root `README.md`, `packages/*/README.md` for staleness whenever a
  dependency or version changes** — nothing currently enforces they stay in sync with
  `package.json` or the changelog.
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
'.../registry.ts'` because each fix only made the _npm_ invocation generate them:

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

## Security posture (re-verified 2026-09-27, unchanged since 2026-09-10)

38 open Dependabot alerts (2 critical, 22 high, 13 medium, 1 low) and 7 open Dependabot PRs —
but scope matters before reacting: **the published packages are clean.** `@pitchkit/core` has
zero runtime dependencies, `@pitchkit/react` depends only on `core`, and
`@pitchkit/data-providers` depends on `csv-parse` alone (itself dependency-free) and on
neither of the others — so nobody installing from npm is exposed. **`csv-parse` is the
project's only third-party runtime dependency anywhere**, added for SkillCorner's CSV files;
the "zero runtime dependencies" line that used to cover all three packages no longer does, so
don't restate it. Every alert lives in `apps/docs` or `examples/*`, all of which
are `private: true`. The ones that genuinely matter are those affecting the **live** docs
site: `next` (11 alerts, critical) and `sharp` (2, high). Everything else is dev-only tooling.
See PRD §10.
