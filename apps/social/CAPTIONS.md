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
| —   | Reel 04 — set-ups         | Euro 2024 follow-up; motion from frame 0.          |
| 14  | Post 06 — layer catalogue | Closes the set; best "save for later" post.        |

Reels: in the Instagram composer, leave "Also share to feed" on, and pick the
grid cover from the reel's own first frames (reel 01's hook frame and reel 02's
title frame both work as covers). The reels are rendered **without audio** so
you can attach trending audio in-app — reel 03 is cut on a 1.4 s beat (~85 BPM,
or 170 BPM double-time), so anything around 85 or 170 BPM lands on the cuts.

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
> Spain 2–1 England, Euro 2024 final. Every number is real: 16 v 9 shots, 56 v 36 final-third pressures, 34 v 12 forward carries, and Spain held 68% of the pitch six seconds before Williams scored.
>
> StatsBomb open data. Docs & install: link in bio. Follow for a new football chart every few days.
>
> #dataviz #footballanalytics #euro2024 #reactjs #statsbomb #opensource

**X**

> 11 chart layers, one pitch. Every number is real, from the Euro 2024 final: 56 v 36 pressures in the final third, 34 v 12 forward carries, Palmer's equaliser from an 18° angle.
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

## Reel 04 — How did Spain and England set up? (`reel-04-networks.mp4`, 38 s)

Opens (0–2 s) on a title card in big block capitals, "Let's check out pass
networks" (the last two words in PitchKit green), already half-written on the
first frame. Then "How did Spain and England set up at Euro 2024?" rises in
over both finished first-half pass networks side by side, with the
completed-pass counters rolling up underneath; at about 3.8 s they lock and
the "Spain passed 2.5X more" banner slams in with a shake. Then the chapters. Each chapter first builds the starting 4-2-3-1 unit by
unit (back four with the keeper, then 2, then 3, then 1, each count shown
in the margin beside its line), then replays the half over 7 s: every player drifts smoothly to where they actually
played, partnerships fade in and thicken and the pass counter climbs; it holds
on the strongest link, and a whip-pan carries Spain into England. A second
title card ("Let's measure the shape") leads into the outro, which measures
both finished shapes, then the same end card as reels 01–03. For the grid
cover, pick the banner frame (~4 s).

**Instagram**

```
How did Spain and England set up in the Euro 2024 final? ⚽️

Both first-half pass networks, replayed from the 4-2-3-1 team sheet to where each player actually played.

Spain completed 283 passes to England's 112. Their strongest link: Laporte ↔ Le Normand, 31 passes. England's: Walker ↔ Stones, 9.

And the shape: Spain's last defender sat 9 m higher up the pitch.

Which setup would you rather play in? 👇

StatsBomb open data. Drawn with PitchKit, the free React-first football chart library. Link in bio.

#dataviz #footballanalytics #euro2024 #passnetwork #statsbomb #reactjs #opensource
```

**X**

```
How did Spain and England set up in the Euro 2024 final?

First-half pass networks, replayed from the 4-2-3-1 team sheet. Spain 283 completed passes, England 112. Strongest links: Laporte ↔ Le Normand (31), Walker ↔ Stones (9). Spain's last defender sat 9 m higher.

Open-source, React-first. Data: @StatsBomb open data.

https://www.pitchkitjs.com
```

**Alt text:** The video opens on the words "Let's check out pass networks", then asks "How did Spain and England set up at Euro 2024?" over two football pitches side by side, Spain in blue and England in orange, each showing the team's finished first-half pass network: every starting player is a numbered circle at their average position, joined by lines whose thickness shows how often each pair combined. Counters roll up to 283 completed passes for Spain and 112 for England, and a banner reads "Spain passed 2.5X more". Each half is then replayed full screen with player names: the circles first build both teams' 4-2-3-1 starting formation line by line (four defenders, two holding midfielders, three attacking midfielders, one striker) and then drift into their average positions while the lines thicken. Spain's thickest line is Laporte to Le Normand, 31 passes; England's is Walker to Stones, 9. A second title card reads "Let's measure the shape", and it ends on both networks side by side with each shape measured: 33 metres from Spain's furthest player forward to their last defender and 52 metres wide, against 30 metres and 50 metres for England, labelled "Spain length 33m" and "England length 30m". It closes on the PitchKit end card: the logo, "Football visualised for the web.", the npm install command and pitchkitjs.com.

Facts behind it (all in `src/data/pass-networks.json`, from `npm run snapshot:networks`):

| Claim                       | Detail                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 283 vs 112 completed passes | First half, completed passes between starting XI players (attempted: 327 v 149). 283 / 112 = 2.53 → "2.5X"                                                                                       |
| Laporte ↔ Le Normand, 31    | Both directions combined; Spain's top pair                                                                                                                                                       |
| Walker ↔ Stones, 9          | Both directions combined; England's top pair                                                                                                                                                     |
| 4-2-3-1                     | StatsBomb's starting formation for both teams; slot coordinates are a generic team sheet (`SLOTS` in the snapshot script)                                                                        |
| Circle positions            | Average of each player's pass and reception locations; while it replays, a blend that starts at the team-sheet slot and ends on the true average; circles closer than 7.5 units are nudged apart |
| Spain 33 m × 52 m           | Furthest forward Yamal (83.6) to last defender Le Normand (45.5) = 38.1 units; Cucurella to Carvajal = 60.6 units                                                                                |
| England 30 m × 50 m         | Furthest forward Saka (69.8) to last defender Guehi (35.6) = 34.2 units; Shaw to Walker = 58.9 units                                                                                             |
| Last defender 9 m higher    | Le Normand 39.8 m from Spain's goal line, Guehi 31.1 m from England's                                                                                                                            |
| Metres                      | StatsBomb's 120 × 80 frame scaled to the Olympiastadion's 105 × 68 m pitch; average positions, goalkeepers excluded                                                                              |
| Timing                      | Each pass and touch counts at its real match minute, easing in over ~0.8 s; each chapter replays the half in 7 s                                                                                 |

## Carousel 01 — Analyse any corner kick (`carousel-01-cover.png` … `carousel-08-save.png`)

Eight 1080×1350 slides, one carousel. Built to be saved: a numbered how-to, a
real code snippet, and a five-question checklist. Every position is a real
SkillCorner tracking frame (Auckland FC v Newcastle Jets, `npm run
snapshot:corners`). Post all eight in order; slide 1 is the cover.

**Instagram**

> 5 steps to analyse any corner kick 📌
>
> Free SkillCorner tracking data + PitchKit:
>
> 1. Find the corners
> 2. Freeze the kick
> 3. Follow one player
> 4. Do it for every corner
> 5. Ask the same 5 questions
>
> Auckland took 4 corners against Newcastle. All 4 ended in a shot. Save this for your next match. Code + docs: link in bio.
>
> #footballanalytics #dataviz #soccerdata #reactjs #opensource #skillcorner

**X** (4 images: slides 1, 4, 5, 6)

> Analysing a corner kick doesn't have to be hard. Free SkillCorner tracking data + PitchKit: find the corners, freeze the kick, follow one player, do it for every corner.
>
> Open-source, React-first. Data: @SkillCorner open data.
>
> https://www.pitchkitjs.com

**Alt text**

1. Cover: "5 steps: analyse any corner kick", over a football pitch showing players waiting in the penalty area at a corner.
2. "Free tracking data": 10 matches, 10 frames a second, free.
3. A code snippet that finds corner kicks in SkillCorner's events: 4 corners.
4. A football pitch frozen at a corner kick: 6 Auckland attackers (blue) and 10 Newcastle defenders (orange) in the penalty area.
5. A pitch showing one player's paths from two corners: L. Gillion starts on the edge of the box at 71' and out wide at 92', and shoots both times.
6. A pitch with four lines from each corner flag to the spot of the shot it led to: 4 corners, 4 shots.
7. A checklist of five questions to ask of any corner, with this match's answers.
8. Save this: try it on your next match, an npm install command and pitchkitjs.com.

Facts behind the slides (all in `corners.json`; re-check if you re-run the snapshot):

| Slide | Claim                                                                                                                           | Caveat                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 2     | 10 matches of A-League 2024/25 broadcast tracking, 10 fps, free (SkillCorner/opendata)                                          |                                                                                              |
| 3     | 4 Auckland corners taken at the flag (`corner_for`, x > 44, \|y\| > 22)                                                         | The match has 8 corner phases; the other 4 don't record the kick itself, so they're left out |
| 4     | 62' corner: 6 Auckland v 10 Newcastle in the penalty area at the kick                                                           | Players the camera didn't see are extrapolated (drawn fainter)                               |
| 5     | L. Gillion shot after both the 71' (3.4 s) and 92' (4.9 s) corners                                                              | At 92' it was a short-corner chain (Moreno, Gallegos, Gillion)                               |
| 6     | 4 of 4 corners ended in a shot, 3.4–12.8 s after the kick                                                                       | Tiny sample; straight line is kick to shot, not the ball's route                             |
| 7     | 3–6 attackers v 9–10 defenders; corners from the attacker's left 3×, right 1×; 4 shots by 3 players (Pijnaker, May, Gillion ×2) |                                                                                              |

## LinkedIn images (`linkedin-hexbin|positional|voronoi|flow|momentum.png`, 1200×1200)

Square so a multi-image LinkedIn post never crops them. Each shows one layer on
the Euro 2024 final, with the component name, one stat and the line of code
that draws it. Hexbin, PositionalHeatmap and Voronoi use the same data as reel
03 (the Voronoi is the 360 frame six seconds before Williams' goal, with the
cells run stronger for a small feed image). Flow is drawn from Spain's real
completed forward passes (211 that gain 5+ units), not reel 03's illustrative
pattern. Momentum is `<MomentumChart>`, with momentum **derived** by the docs
recipe (attacking-third on-ball events, Spain minus England per minute,
three-minute smoothing; `npm run snapshot:layers`). It is not an official
metric, and the image says so.

**Alt text**

1. Hexbin: a football pitch covered in hexagons, brighter yellow where Spain pressed more, with the caption "56 v 36 final-third pressures".
2. PositionalHeatmap: a football pitch divided into zones shaded blue by where Spain's passes landed, with the central zone brightest; 11% landed in the top zone.
3. Voronoi: a pitch split into cells around each tracked player, blue for Spain and orange for England, six seconds before Williams' goal; Spain controls 68%.
4. Flow: a pitch with one arrow per zone showing the average direction of Spain's 211 forward passes, thicker and more orange where there were more.
5. Momentum: two bar charts, one per half, with Spain's pressure in blue above a zero line and England's in orange below it, and icons beneath marking the three goals and four yellow cards.

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
