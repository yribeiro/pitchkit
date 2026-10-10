# social

Instagram / X launch content for PitchKit — six wall posts and three reels —
rendered with [Remotion](https://www.remotion.dev) from **real PitchKit charts on
real match data**. Every pitch in these graphics is `@pitchkit/react`, the same
components a user installs; nothing is mocked up in a design tool.

Private workspace (`"private": true`), never published.

| Id                        | Format              | What                                                                                                                                                                  |
| ------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post-01-intro`           | 1080×1350 PNG       | Brand intro over Spain's pass network                                                                                                                                 |
| `post-02-code`            | 1080×1350 PNG       | 14 lines of code → the shot map they draw                                                                                                                             |
| `post-03-winner`          | 1080×1350 PNG       | Oyarzabal's Euro 2024 winner + shot freeze frame                                                                                                                      |
| `post-04-network`         | 1080×1350 PNG       | Spain's first-half pass network                                                                                                                                       |
| `post-05-palettes`        | 1080×1350 PNG       | One shot map in four palettes                                                                                                                                         |
| `post-06-layers`          | 1080×1350 PNG       | 3×3 catalogue of layer components                                                                                                                                     |
| `wall-mosaic`             | 3240×2880 PNG       | One picture cut into six 1080×1440 grid tiles (`mosaic/tile-1…6.png` in the bucket)                                                                                   |
| `carousel-01…08`          | 8 × 1080×1350 PNG   | "Analyse any corner kick": a saveable 5-step how-to on SkillCorner data                                                                                               |
| `linkedin-*`              | 4 × 1200×1200 PNG   | Hexbin, PositionalHeatmap, Voronoi and Flow, for LinkedIn                                                                                                             |
| `post-03-winner-animated` | 1080×1350 MP4, 13 s | Post 03 as a loop: opens on the 360 freeze frame and goal angle, turns back to the horizontal pitch, draws the build-up, then turns vertical again                    |
| `experiment-ball-intro`   | 1080×1920 MP4, 9 s  | Experiment: a 3D football (Three.js via @remotion/three) comes out of the horizon, whips past the camera, then a PitchKit pitch draws in. Render with `--gl=angle`    |
| `reel-01-quickstart`      | 1080×1920 MP4, 22 s | Palmer's equaliser built in 4 steps (mirrors the docs Quickstart)                                                                                                     |
| `reel-02-tracking`        | 1080×1920 MP4, 24 s | SkillCorner tracking of a goal with a live Voronoi                                                                                                                    |
| `reel-03-layers`          | 1080×1920 MP4, 20 s | 11 layers, each drawing a real finding from the final, with stat chips                                                                                                |
| `reel-04-networks`        | 1080×1920 MP4, 38 s | How Spain and England set up in the Euro 2024 final: finished pass networks, then each half replays from the 4-2-3-1 team sheet, then each shape is measured          |
| `reel-04-networks-loop`   | 1080×1920 MP4, 14 s | Reel 04 as a seamless loop: Spain's tilted 4-2-3-1 team sheet swings flat as the half replays, holds on the strongest link, then rewinds and tilts back               |
| `reel-05-wc-final`        | 1080×1920 MP4, 34 s | The 2022 World Cup final as a story: France's 0 shots, Mbappé's 95 seconds, Messi, the hat-trick, the shootout, one momentum chart, a comment CTA                     |
| `reel-06-live-final`      | 1080×1920 MP4, 45 s | The 2022 final as a live 3D 360 time-lapse: players as numbered spheres, the space they control, a scoreboard, and a MomentumChart growing below                      |
| `reel-06-network-final`   | 1080×1920 MP4, 39 s | Reel 06 at the pace of a game: players drift to their recent average touch position, a camera swoop and goal angle at each goal, and the flag on the pitch at the end |
| `reel-06-goals-final`     | 1080×1920 MP4, 39 s | Every goal of the 2022 final and the three moves before it on StatsBomb 360: bird's-eye build-ups with Voronoi and goal angles, a cold open on Di María's goal        |
| `reel-07-claude`          | 1080×1920 MP4, 30 s | "Football analysis is for coders. Not anymore.": a real prompt, the code Claude wrote with PitchKit's agent skill, and the chart it draws, in three steps             |

Captions, X copy, alt text and a posting schedule are in [CAPTIONS.md](./CAPTIONS.md).
What we think makes a reel travel, and how we test it, is in [RULES-TO-TEST.md](./RULES-TO-TEST.md); the research behind the hooks is in [HOOKS.md](./HOOKS.md). `node scripts/make-sfx.mjs` regenerates the sound effects in `public/sfx/`.

## Usage

```sh
npm run build --workspace=@pitchkit/core --workspace=@pitchkit/react
npm run studio --workspace=social   # live preview + scrubbing
npm run render --workspace=social   # everything → apps/social/out/
npm run render --workspace=social -- reel-02   # just ids containing "reel-02"
```

Renders go to `out/` (gitignored), then live in `gs://pitchkit-assets` (layout in
`scripts/assets.mjs`). Run `npm run assets -- upload <id>` (or `upload --all`) after
rendering, `download <id>` to fetch and `list` to browse. Credentials come from the
gitignored `.env.local`: `GOOGLE_APPLICATION_CREDENTIALS` (a key file outside the repo)
or `GCS_SERVICE_ACCOUNT_JSON`, plus `GCS_BUCKET`. Covers are rendered as
`out/<id>-cover.png`. Set `REMOTION_BROWSER` to a local
Chrome/Chromium headless shell to skip Remotion's own browser download.

## Data

`src/data/*.json` are committed snapshots, so a render is deterministic and
offline. Regenerate them with:

```sh
npm run build --workspace=@pitchkit/data-providers
npm run snapshot --workspace=social          # posts, tracking reel
npm run snapshot:layers --workspace=social   # reel 03's per-layer findings
npm run snapshot:corners --workspace=social  # the corner-kick carousel
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
