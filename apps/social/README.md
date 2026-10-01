# social

Instagram / X launch content for PitchKit — six wall posts and three reels —
rendered with [Remotion](https://www.remotion.dev) from **real PitchKit charts on
real match data**. Every pitch in these graphics is `@pitchkit/react`, the same
components a user installs; nothing is mocked up in a design tool.

Private workspace (`"private": true`), never published.

| Id                   | Format              | What                                                                   |
| -------------------- | ------------------- | ---------------------------------------------------------------------- |
| `post-01-intro`      | 1080×1350 PNG       | Brand intro over Spain's pass network                                  |
| `post-02-code`       | 1080×1350 PNG       | 14 lines of code → the shot map they draw                              |
| `post-03-winner`     | 1080×1350 PNG       | Oyarzabal's Euro 2024 winner + shot freeze frame                       |
| `post-04-network`    | 1080×1350 PNG       | Spain's first-half pass network                                        |
| `post-05-palettes`   | 1080×1350 PNG       | One shot map in four palettes                                          |
| `post-06-layers`     | 1080×1350 PNG       | 3×3 catalogue of layer components                                      |
| `wall-mosaic`        | 3240×2880 PNG       | One picture cut into six 1080×1440 grid tiles (`mosaic-tile-1…6.png`)  |
| `reel-01-quickstart` | 1080×1920 MP4, 22 s | Palmer's equaliser built in 4 steps (mirrors the docs Quickstart)      |
| `reel-02-tracking`   | 1080×1920 MP4, 24 s | SkillCorner tracking of a goal with a live Voronoi                     |
| `reel-03-layers`     | 1080×1920 MP4, 20 s | 11 layers, each drawing a real finding from the final, with stat chips |

Captions, X copy, alt text and a posting schedule are in [CAPTIONS.md](./CAPTIONS.md).

## Usage

```sh
npm run build --workspace=@pitchkit/core --workspace=@pitchkit/react
npm run studio --workspace=social   # live preview + scrubbing
npm run render --workspace=social   # everything → apps/social/out/
npm run render --workspace=social -- reel-02   # just ids containing "reel-02"
```

Renders go to `out/` (gitignored). Set `REMOTION_BROWSER` to a local
Chrome/Chromium headless shell to skip Remotion's own browser download.

## Data

`src/data/*.json` are committed snapshots, so a render is deterministic and
offline. Regenerate them with:

```sh
npm run build --workspace=@pitchkit/data-providers
npm run snapshot --workspace=social          # posts, tracking reel
npm run snapshot:layers --workspace=social   # reel 03's per-layer findings
```

- **StatsBomb open data** — Euro 2024 final (match `3943043`): every shot, the
  possession behind each goal with the shot's freeze frame, Spain's pass
  network up to their first substitution, all Spain passes/carries, Lamine
  Yamal's touches. Names are the lineup file's nicknames ("Rodri", not
  "Rodrigo Hernández Cascante").
- **SkillCorner open data** — Auckland FC v Newcastle Jets (match `1886347`):
  ~19 s of 10 fps tracking around N. Moreno's goal. The snapshot script does
  its own byte-offset probe instead of `fetchTrackingWindow`, whose fixed
  1,400 bytes/frame estimate drifts by megabytes late in a match (this file
  averages ~1,575) and returns no frames.

## Notes

- **Vertical pitches are CSS-rotated horizontal ones** (`Upright` in
  `src/charts.tsx`), not `orientation="vertical"`. The library's vertical mode
  transposes the axes, which mirrors the pitch — the attack runs down the screen
  and a right winger plots on the left.
- Post 02's chart is exactly what its code snippet draws (`SnippetShotMap`) —
  keep them in sync if either changes. It does use `VerticalPitch`, because the
  snippet does.
- `<Annotate>` hard-codes a 10 px inline font size; `PitchStage` overrides it
  with `!important` so labels are legible on a phone.
- Reels are silent on purpose: add trending audio in the Instagram composer.
  Keep text inside `REEL_SAFE` (`src/theme.ts`) — Instagram's caption and
  action rail cover the bottom and right edges.
