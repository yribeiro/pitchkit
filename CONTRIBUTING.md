# Contributing to PitchKit

Thanks for taking an interest. PitchKit is pre-`1.0`, so there's plenty of surface area, and
bug reports are as valuable as code.

For how the library is designed, read [docs/architecture.md](./docs/architecture.md). For why
it is the way it is, read the [decision log](./docs/decisions.md) before changing an area it
covers.

## Getting set up

Requires **Node >= 22** and **npm >= 10**.

```bash
git clone https://github.com/yribeiro/pitchkit.git
cd pitchkit
npm install
npm run build
npm test
```

The repo is an npm-workspaces + Turborepo monorepo:

| Path                      | What it is                                            |
| ------------------------- | ----------------------------------------------------- |
| `packages/core`           | Zero-dependency engine — maths, geometry, scene model |
| `packages/react`          | React bindings — the supported rendering surface      |
| `packages/data-providers` | Open-data loaders (StatsBomb, SkillCorner, Wyscout)   |
| `apps/docs`               | Docs + showcase site (Next.js, Fumadocs)              |
| `examples/react-vite`     | Vite app for eyeballing components in a browser       |
| `examples/react-nextjs`   | Next.js App Router app, used to verify SSR behaviour  |

Useful commands, all from the repo root:

```bash
npm run build       # build every package
npm test            # run all test suites
npm run typecheck   # type-check everything
npm run lint        # lint everything
npm run format      # prettier --write
```

`npm run build` must succeed before `typecheck` will work in a fresh checkout — `@pitchkit/react`
resolves `@pitchkit/core`'s types through its built `dist/`.

## Where code goes

The most important architectural rule: **shared maths lives in `@pitchkit/core`, not in
`@pitchkit/react`.**

`@pitchkit/react` re-emits SVG as JSX rather than reusing core's DOM painters (that's the only
way to get server-renderable output), but it must not reimplement any geometry. If you're
adding a mark type or changing pitch-appearance maths, extract the logic into a pure exported
function in `core` first, then call it from both sides. Look at `render/arrow-geometry.ts` or
`scene/appearance.ts` for the pattern.

New mark types ship **React-only**. Core's SVG painters (`render/svg/paint-*.ts`, `svgRenderer`)
are internal-only, kept solely for the `packages/core/examples/index.html` dev harness — don't
add to them.

### Brand assets

The logo lives in [`assets/brand/`](./assets/brand/) — read that directory's README before
touching anything logo-shaped.

The mark's geometry is necessarily duplicated across five files: the two brand SVGs, the
favicon cut (`apps/docs/app/icon.svg`), the two generated images (`apple-icon.tsx`,
`opengraph-image.tsx`), and the React component. Each needs a different stroke weight or
colour model, and **nothing links them** — a change to one will not propagate, and no test
will catch it. Don't add a sixth: import `PitchKitMark` from
`apps/docs/components/pitchkit-logo.tsx` rather than inlining the paths again.

## Making a change

1. **Open an issue first** for anything non-trivial, so we can agree on the approach before you
   spend time on it. Small fixes can go straight to a PR.
2. Branch off `main`.
3. Write tests. `@pitchkit/core` is held at 100% coverage; keep it there.
4. **Add a changeset** if your change affects a published package:

   ```bash
   npx changeset
   ```

   Pick the affected packages and a bump type (`patch` for fixes, `minor` for features), and
   write a one-line summary — it becomes the changelog entry. Releases are cut from these, so a
   user-facing change without a changeset won't be published.

5. Open a PR. CI runs lint, typecheck, tests and build on every PR; all four need to pass.

## Testing notes

A couple of things that bite people:

- **Canvas has no real 2D context under test.** `happy-dom`'s `<canvas>` returns `null` from
  `getContext("2d")`, so canvas painting is verified against a hand-rolled mock context — see
  `render/canvas/paint-heatmap.test.ts`.
- **Use `fireEvent` for hover tooltips.** `fireEvent.mouseEnter`/`mouseLeave` from
  `@testing-library/react` trigger React's synthetic handlers correctly; a raw
  `dispatchEvent(new MouseEvent("mouseenter"))` does not.

More gotchas, with the reasons behind them, are in
[docs/architecture.md: implementation notes](./docs/architecture.md#implementation-notes).

## Working on Windows

The tooling assumes a Linux-native checkout. On Windows, use WSL for everything, including
`git`:

- **Run `npm` and `node` inside WSL.** `node_modules` installed under WSL carries Linux-only
  optional dependencies (for example `@rollup/rollup-linux-x64-gnu`), so Windows `node.exe`
  fails on `vitest` and `tsup`.
- **Run `git pull` and `checkout` inside WSL too.** With `core.autocrlf=true`, a
  Windows-native git can check files out as CRLF. `git status` then shows a large diff with
  equal insertions and deletions. Confirm with `git diff --ignore-space-at-eol --stat`: if
  that's empty, it's only line endings, so discard it with `git checkout -- .` and never
  commit it. It has caused real test failures: `install-skill.test.mjs` splits frontmatter
  on a literal `"---\n"`.

## Releasing

Maintainers only. Publishing is manual until npm Trusted Publishing is set up
([issue #36](https://github.com/yribeiro/pitchkit/issues/36)):

`main` is protected: changes must go through a pull request, so the version commit does too.
Merge it **before** publishing. `changeset publish` tags the checked-out commit, and a squash
merge rewrites that commit.

```bash
git switch -c release/<summary>
npm run version-packages   # apply pending changesets: bump versions, write changelogs
git commit -am "chore: version packages"
git push -u origin HEAD    # open a PR, squash-merge it
git switch main && git pull
npm run release            # build and publish; needs an npm one-time password
git push origin --follow-tags
```

Then record the release in [docs/roadmap.md](./docs/roadmap.md#release-history), and check
that the root and package READMEs still match the new versions and dependencies. Nothing
checks that automatically.

Two npm auth failures look alike:

- **`E403 … Two-factor authentication or granular access token … is required`**: the account
  has no two-factor authentication. Enable it for "Authorization and Writes".
- **`E401 … authentication token seems to be invalid`**: the login expired. Run
  `npm login` again. The `E404 … not in this registry` errors that follow an E401 are noise.

From WSL, `npm login` can't open a browser; copy the printed URL into a Windows browser.

## Reporting bugs

Include the pitch `type`, the component and props involved, and what you expected versus what
rendered. A minimal reproduction (StackBlitz, CodeSandbox, or a code snippet) makes a bug
dramatically easier to fix.

## Licence

By contributing, you agree that your contributions are licensed under the
[MIT Licence](./LICENSE).
