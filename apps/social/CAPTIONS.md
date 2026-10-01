# PitchKit launch — captions & posting plan

Copy for every piece in `out/` (render with `npm run render --workspace=social`).
Each entry has an Instagram caption, an X post (≤ 280 chars, the image/video
attached), and alt text. Every number below comes from the committed data in
`src/data/`, so it matches the graphic.

Never write the npm package name (`@pitchkit/react`) in a caption or post:
both Instagram and X turn `@pitchkit` into a mention of whoever owns that
handle. The graphics show the install command; the copy points at the link.

Links: Instagram doesn't make caption URLs clickable — say "link in bio" there
and put `https://www.pitchkitjs.com` in the bio. X links are clickable.

## Posting order

Instagram's grid shows the **newest post top-left**. Two ways to run it:

- **Grid drop (all six in one sitting):** post **06 → 01**, a few minutes apart,
  so the grid reads 01–06 left-to-right, top-to-bottom. Then drip the reels
  over the following week.
- **Drip (recommended for reach):** one piece every 2 days, reels in between —
  the algorithm rewards consistency more than a dump. Suggested run:

| Day | Piece                     | Why here                                           |
| --- | ------------------------- | -------------------------------------------------- |
| 1   | Post 01 — intro           | Says what PitchKit is before anything else.        |
| 2   | Reel 01 — quickstart      | Strongest hook; shows it's real code on real data. |
| 4   | Post 02 — code → chart    | Developers screenshot/save code posts.             |
| 6   | Post 03 — the winner      | Football-first; widest audience.                   |
| 7   | Reel 02 — tracking        | The "whoa" piece — tracking data in a browser.     |
| 9   | Post 04 — pass network    | Analyst audience staple.                           |
| 11  | Post 05 — palettes        | Designers / theming crowd.                         |
| 12  | Reel 03 — layer montage   | Breadth recap, loops well.                         |
| 14  | Post 06 — layer catalogue | Closes the set; best "save for later" post.        |

Reels: in the Instagram composer, leave "Also share to feed" on, and pick the
grid cover from the reel's own first frames (reel 01's hook frame and reel 02's
title frame both work as covers). The reels are rendered **without audio** so
you can attach trending audio in-app — reel 03 is cut on a 1.2 s beat (100 BPM,
or 50 half-time), so anything around 100/200 BPM lands on the cuts.

## Hashtags

Pick 5–8 per post; Instagram now weights relevance over volume.

- Core: `#football #footballanalytics #datavisualization #dataviz #reactjs #typescript #opensource`
- Football-data: `#mplsoccer #xg #statsbomb #sportsanalytics #soccer #tactics`
- Dev: `#webdev #javascript #frontend #nextjs`

On X, use at most one or two (`#dataviz`, `#football`) — or none, and tag
@StatsBomb / @SkillCorner where the data is theirs.

---

## Post 01 — intro (`post-01-intro.png`)

**Instagram**

> Football visualised for the web. ⚽️
>
> PitchKit is an open-source React + TypeScript library for football pitch
> charts — mplsoccer's feature set, built for the browser instead of matplotlib.
>
> Shot maps, pass networks, heatmaps, KDEs, Voronoi, tracking data. Every chart
> is a React component, themed with CSS variables, and interactive by default.
>
> That's Spain's pass network from the Euro 2024 final, straight from
> StatsBomb open data.
>
> Docs, gallery & install: link in bio.
>
> #football #footballanalytics #dataviz #reactjs #typescript #opensource

**X**

> Football visualised for the web.
>
> PitchKit is an open-source React + TypeScript library for pitch charts — mplsoccer's feature set, built for the browser.
>
> https://www.pitchkitjs.com

**Alt text:** Dark green graphic with the headline "Football visualised for the web." Below it, Spain's first-half pass network from the Euro 2024 final on a football pitch, and the install command npm i @pitchkit/react.

## Post 02 — code → chart (`post-02-code.png`)

**Instagram**

> A real shot map in 14 lines. 👇
>
> 1. `fetchMatchEvents(3943043)` pulls the Euro 2024 final from StatsBomb open data
> 2. `shots()` + `.filter()` keep Spain's attempts
> 3. `<VerticalPitch>` + `<Scatter>` draw them — size is xG, orange is a goal
>
> 16 shots, 1.79 xG, 2 goals. No backend, no chart config, no matplotlib export.
>
> Save this for your next analytics side project. Docs in bio.
>
> #reactjs #typescript #dataviz #footballanalytics #xg #webdev

**X**

> Match ID → shot map, in 14 lines of React.
>
> fetchMatchEvents(3943043) → shots() → <Scatter> on a <VerticalPitch>.
>
> Spain in the Euro 2024 final: 16 shots, 1.79 xG, 2 goals. Data: @StatsBomb open data.
>
> https://www.pitchkitjs.com

**Alt text:** A code editor showing 14 lines of TypeScript/JSX that load the Euro 2024 final from StatsBomb and plot Spain's shots with PitchKit. Below, the resulting half-pitch shot map with 16 shots sized by expected goals, two goals in orange, and the stats 16 shots, 1.79 xG, 2 goals.

## Post 03 — the winner (`post-03-winner.png`)

**Instagram**

> 86'. Carvajal → Laporte → Fabián → Olmo → Oyarzabal → Cucurella → Oyarzabal.
>
> Spain's winner in the Euro 2024 final, rebuilt from event data: every pass as
> an arrow, every carry as a comet trail, and the shot's freeze frame — where
> each player StatsBomb could see was standing at the moment of the strike.
> 0.28 xG.
>
> Four PitchKit components: <Arrows>, <Comet>, <Scatter>, <GoalAngle>.
>
> #football #euro2024 #footballanalytics #tactics #dataviz #statsbomb

**X**

> Oyarzabal's Euro 2024 winner, rebuilt from event data.
>
> 9 actions from Spain's half, plus the shot's freeze frame — every player on camera when it was struck. 0.28 xG.
>
> <Arrows> + <Comet> + <Scatter> + <GoalAngle>. Data: @StatsBomb.

**Alt text:** A football pitch showing the sequence of passes (white arrows) and carries (green trails) that led to Mikel Oyarzabal's 86th-minute winner for Spain against England in the Euro 2024 final, with red and white dots marking Spanish and English players' positions at the moment of the shot.

## Post 04 — pass network (`post-04-network.png`)

**Instagram**

> How Spain moved the ball in the first half of the Euro 2024 final.
>
> Circle size = how involved each player was, line width = completed passes
> between the pair (3+). Laporte (14) ↔ Le Normand (3) is the thickest link on
> the pitch (31 passes), then Le Normand ↔ Carvajal (24) — Spain built through
> the right side of their back line, with Rodri (16) at the base of midfield
> before he went off at half-time.
>
> A pass network is plain data prep + three PitchKit layers:
> <Scatter>, <Arrows>, <Annotate>.
>
> #passnetwork #footballanalytics #tactics #spain #euro2024 #dataviz

**X**

> Spain's first-half pass network, Euro 2024 final.
>
> Node = involvement, edge = completed passes between the pair. Built with three PitchKit layers on @StatsBomb open data.
>
> https://www.pitchkitjs.com/gallery

**Alt text:** Spain's pass network from the first half of the Euro 2024 final: eleven numbered circles placed at each player's average position, connected by green lines whose thickness shows how often the pair passed to each other, with a key listing each shirt number and player.

> The pass counts in this caption come from `src/data/spain-pass-network.json`;
> if you re-run the snapshot, re-check them.

## Post 05 — palettes (`post-05-palettes.png`)

**Instagram**

> One chart. Four looks. 🎨
>
> Every shot from the Euro 2024 final (Spain 16, England 9) in Newsprint,
> Analyst navy, Dracula and Gruvbox. Same components, same data — only the CSS
> variables change.
>
> PitchKit theming is CSS variables (or Tailwind classes). No JS theme objects,
> so it drops straight into your design system.
>
> Which one's yours? 👇
>
> #dataviz #design #tailwindcss #reactjs #football #uidesign

**X**

> Same shot map, four palettes — Newsprint, Analyst navy, Dracula, Gruvbox.
>
> PitchKit is themed with CSS variables (or Tailwind), not JS theme objects.
>
> Which one are you shipping?

**Alt text:** Four versions of the same full-pitch shot map from the Euro 2024 final, each in a different colour palette: cream Newsprint, dark blue Analyst navy, purple-grey Dracula and warm dark Gruvbox, each labelled ESP 2–1 ENG.

## Post 06 — layer catalogue (`post-06-layers.png`)

**Instagram**

> 13 layers. One <Pitch>. 📦
>
> Scatter, Arrows, Comet, Heatmap, Hexbin, KDE, Flow, Voronoi, Convex hull —
> plus PositionalHeatmap, GoalAngle, Polygon and Annotate. All nine charts here
> are one component each, on one match: Spain v England, Euro 2024 final.
>
> Save this as a cheat sheet. Everything's in the docs — link in bio.
>
> #dataviz #footballanalytics #reactjs #mplsoccer #opensource #typescript

**X**

> 13 chart layers, one <Pitch>.
>
> Heatmap, Hexbin, KDE, Flow, Voronoi, Convex hull, Comet… every chart here is a single PitchKit component on the Euro 2024 final.
>
> https://www.pitchkitjs.com/docs

**Alt text:** A three-by-three grid of small football pitches, each labelled with a PitchKit component name — Scatter, Arrows, Comet, Heatmap, Hexbin, KDE, Flow, Voronoi and ConvexHull — and each showing that chart type drawn from the Euro 2024 final.

---

## Reel 01 — quickstart (`reel-01-quickstart.mp4`, 22 s)

**Instagram**

> Palmer's equaliser in the Euro 2024 final — rebuilt from a match ID in 4 steps.
>
> 1️⃣ Load the match (3,304 events from StatsBomb open data)
> 2️⃣ Draw the pitch
> 3️⃣ Isolate the move: Pickford → Bellingham → Palmer → Saka → Bellingham → Palmer
> 4️⃣ Mark the goal — a 0.04 xG finish
>
> The full walkthrough is the PitchKit Quickstart. Link in bio.
>
> #football #euro2024 #reactjs #dataviz #footballanalytics #coding

**X**

> Palmer's Euro 2024 equaliser, rebuilt from a match ID in 4 steps with PitchKit:
>
> load the match → draw the pitch → isolate the move → mark the goal.
>
> A 0.04 xG finish, 6 actions from Pickford's pass.
>
> Quickstart: https://www.pitchkitjs.com/docs/quickstart

**On-screen text is burned in; no voiceover needed.**

## Reel 02 — tracking (`reel-02-tracking.mp4`, 24 s)

Opens on a 2.8 s hook — "Ever wanted to watch the beautiful game from above?"
over the pitch at a broadcast-camera tilt, which swings flat to top-down as the
text clears. At ~11.6 s it drops into slow-mo (a "SLOW-MO 0.4×" title, a push-in
on the attacking end, a vignette and a ring on the ball) for the last 2.2 s
before the shot; the GOAL card lands at ~17 s. Build the audio through the
slow-mo and time its drop on the GOAL card.

**Instagram**

> Ever wanted to watch the beautiful game from above? 🛰️
>
> This is real broadcast tracking of N. Moreno's goal for Auckland FC v
> Newcastle Jets (A-League, 30 Nov 2024) — 22 players at 10 frames a second,
> from SkillCorner's open data. The shaded cells show which team controls
> which space, recalculated every frame.
>
> Faded dots are players the camera couldn't see (SkillCorner extrapolates
> them). A full match is ~90 MB of tracking; PitchKit streams just the window
> you need, straight into a React component.
>
> Docs & install: link in bio.
>
> #trackingdata #footballanalytics #aleague #dataviz #reactjs #skillcorner #football

**X**

> Ever wanted to watch the beautiful game from above?
>
> Real broadcast tracking of an A-League goal from @SkillCorner's open data: 22 players at 10 fps, with a live <Voronoi> of who owns which space. Rendered in the browser with PitchKit.
>
> https://www.pitchkitjs.com/docs/data

**Alt text:** A football pitch tilted like a TV camera view swings flat to a top-down view, then 22 players shown as blue and orange dots move in real time, with the pitch divided into shaded cells showing which team controls each area, building up to Auckland FC's goal and a "GOAL" caption.

## Reel 03 — 11 layers, one pitch (`reel-03-layers.mp4`, 20 s)

Hook "11 layers. One <Pitch>." (1.7 s), then 11 beats of 1.4 s each (to ~17.1 s),
then the end card. Every beat is a real finding from the final, one PitchKit
layer each; the numbers on the chips come from `src/data/layers-reel.json`
(`npm run snapshot:layers`). Cuts land every 1.4 s — a ~85 bpm groove (or a
170 bpm track at half time) hits every one.

**Instagram**

> 11 layers. One <Pitch>. ⚡️
>
> Spain 2–1 England, Euro 2024 final — and every beat is a real finding drawn with one PitchKit component:
>
> • 16 v 9 shots
> • 56 v 36 final-third pressures
> • 15 v 5 key passes
> • 34 v 12 forward carries
> • 14,234 tracked player positions
> • Yamal and Williams, opposite flanks
> • England went more direct: 17% of passes gained 15+ units, Spain's 12%
> • Six seconds before Williams scored, Spain held 68% of the pitch
> • Spain's shape sat 11 units higher
> • Goals from 19°, 18° and 43°
>
> StatsBomb open data. (The 360 tracking only covers players the broadcast camera saw.) Docs & install: link in bio. Follow for a new football chart every few days.
>
> #dataviz #footballanalytics #euro2024 #reactjs #statsbomb #opensource #football

**X**

> 11 chart layers, one pitch. Every beat is a real finding from the Euro 2024 final: 56 v 36 pressures in the final third, 34 v 12 forward carries, Palmer's equaliser from an 18° angle.
>
> Open-source, React-first. Data: @StatsBomb open data.
>
> https://www.pitchkitjs.com

**Alt text:** A fast montage of eleven football pitch charts from the Euro 2024 final, each labelled with a PitchKit component and a short statistic: shots, key passes, forward carries, tracked player positions, pressing, two wingers' touches, pass destinations by zone, pass flow, the space on the pitch six seconds before Williams scored, each team's average shape, and the angles three goals were scored from. It ends on the PitchKit logo.

Facts behind the chips (all in `layers-reel.json`; re-check if you re-run the snapshot):

| Beat              | Claim                                                                                                                                  | Caveat                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Scatter           | 16 v 9 shots (1.79 v 0.73 xG)                                                                                                          | England mirrored to attack the other way                                           |
| Hexbin            | 56 v 36 pressures in the final third                                                                                                   |                                                                                    |
| Arrows            | 15 v 5 key passes (Spain: 2 assists, in orange)                                                                                        |                                                                                    |
| Comet             | 34 v 12 carries gaining 15+ units                                                                                                      |                                                                                    |
| Heatmap           | 14,234 tracked positions, 1,780 moments Spain had the ball                                                                             | 360 only includes players the camera saw                                           |
| KDE               | Yamal 142 touches (88% in the attacking half), Williams 178                                                                            |                                                                                    |
| PositionalHeatmap | 11% of Spain's completed passes landed in their top zone                                                                               |                                                                                    |
| Flow              | 17% v 12% of completed passes gain 15+ units (real stat; the arrows are an illustrative build-up pattern, not England's actual passes) |                                                                                    |
| Voronoi           | The 360 frame 6 s before Williams' goal (Carvajal's pass): Spain's cells cover 68% of the pitch                                        | 19 of 22 players tracked; space beyond the tracked players goes to the nearest one |
| ConvexHull        | Spain's first-half average shape 11 units higher (66.9 v 55.5); areas 1,602 v 1,611                                                    | Average positions from on-ball events, not tracking; both teams drawn attacking up |
| GoalAngle         | 19° (Williams), 18° (Palmer), 43° (Oyarzabal), on an attacking half pitch                                                              | Posts at y 36 and 44; StatsBomb units, not metres                                  |

---

## Wall mosaic — six tiles (`mosaic-tile-1.png` … `mosaic-tile-6.png`)

One 3240×2880 picture (`wall-mosaic.png`) cut into six 1080×1440 (3:4) tiles.
Tile 1 is top-left, tile 6 bottom-right, in reading order.

**Posting order is reversed: 6 first, 1 last.** The grid puts the newest post
top-left, so tile 1 must be the last one up.

- **Unpin first.** A pinned post takes the top-left slot and shifts everything
  by one, which breaks the picture.
- **Post all six in one sitting**, a couple of minutes apart. A grid that's
  part-way through the sequence looks broken.
- **3:4 upload.** In the crop screen choose 3:4 (not 4:5), or the grid crops
  the sides off and the seams no longer meet.
- **After it's up, add posts in threes** — each new post shifts the picture by
  one slot, and it only reads as a whole again on a full row.

Tile captions (short — the picture is the point). Alt text under each.

1. **Top-left** — `Football visualised for the web. ⚽️ Open-source React + TypeScript charts for football data — shot maps, pass networks, heatmaps, tracking. Every mark on this pitch is a PitchKit component, drawn from StatsBomb open data on the Euro 2024 final. Link in bio. #football #footballanalytics #dataviz #reactjs #typescript #opensource`
   — _Alt:_ Left third of a black graphic: the headline "Football visualised" above the left half of a football pitch covered in green hexagons, with England's players and a shot marked at the far end.
2. **Top-middle** — `Spain 2–1 England, Euro 2024 final: every Spain pass, binned into hexagons. Darker = fewer, brighter = more. One <Hexbin> layer. #footballanalytics #dataviz #euro2024`
   — _Alt:_ Middle of the graphic: the end of the word "visualised", and the centre of a football pitch of green hexagons with a white passing sequence.
3. **Top-right** — `PitchKit. Open source, MIT, React-first. Docs and quickstart: link in bio. #opensource #reactjs #typescript`
   — _Alt:_ The PitchKit logo, two penalty areas and a centre circle in green, above the right end of a football pitch.
4. **Bottom-left** — `Cole Palmer, 73'. England's equaliser was a 0.04 xG chance. Orange marks are goals, sized by xG. #euro2024 #xg #footballanalytics`
   — _Alt:_ The left half of a football pitch with Cole Palmer's 73rd-minute goal marked in orange and England's shots in white.
5. **Bottom-middle** — `Oyarzabal's 86' winner: nine actions from Spain's half to the net, drawn as arrows and comet trails. #euro2024 #footballanalytics #dataviz`
   — _Alt:_ The middle of the pitch with white arrows tracing Spain's build-up to their winning goal, and the halfway line and centre circle.
6. **Bottom-right** — `Spain took 16 shots to England's 9, and it took an 86th-minute winner to settle it. Built with PitchKit — link in bio. #football #dataviz #reactjs`
   — _Alt:_ The right end of the pitch: Spain's shots in blue, Williams' and Oyarzabal's goals in orange, and the URL pitchkitjs.com.
