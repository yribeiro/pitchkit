# PitchKit launch — captions & posting plan

Copy for every piece in `out/` (render with `npm run render --workspace=social`).
Each entry has an Instagram caption, an X post (≤ 280 chars, the image/video
attached), and alt text. Every number below comes from the committed data in
`src/data/`, so it matches the graphic.

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
> npm i @pitchkit/react — docs & gallery: link in bio.
>
> #football #footballanalytics #dataviz #reactjs #typescript #opensource

**X**

> Football visualised for the web.
>
> PitchKit is an open-source React + TypeScript library for pitch charts — mplsoccer's feature set, built for the browser.
>
> npm i @pitchkit/react
> https://www.pitchkitjs.com

**Alt text:** Dark green graphic with the PitchKit logo and the headline "Football visualised for the web." Below it, Spain's first-half pass network from the Euro 2024 final on a football pitch, and the install command npm i @pitchkit/react.

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

## Reel 02 — tracking (`reel-02-tracking.mp4`, 22 s)

**Instagram**

> 22 players. Every frame. In the browser. 🛰️
>
> Broadcast tracking of N. Moreno's goal for Auckland FC v Newcastle Jets
> (A-League, 30 Nov 2024), from SkillCorner's open data — played back through
> PitchKit with a live Voronoi of which team controls which space.
>
> Faded dots are players the camera couldn't see (SkillCorner extrapolates
> them). A full match is ~90 MB of tracking; PitchKit streams just the window
> you need.
>
> #trackingdata #footballanalytics #aleague #dataviz #reactjs #skillcorner

**X**

> Broadcast tracking data, rendered live in the browser.
>
> A goal from @SkillCorner's open A-League data: 22 players at 10 fps, with a <Voronoi> of who owns which space.
>
> https://www.pitchkitjs.com/docs/data

## Reel 03 — layer montage (`reel-03-layers.mp4`, 21 s)

**Instagram**

> One match. Every layer. Four themes. ⚡️
>
> Scatter → Arrows → Comet → Heatmap → Hexbin → KDE → PositionalHeatmap → Flow
> → Voronoi → ConvexHull → GoalAngle, then Newsprint, Analyst navy, Dracula and
> Gruvbox.
>
> Everything is a React component. npm i @pitchkit/react
>
> #dataviz #reactjs #footballanalytics #opensource #webdev #football

**X**

> 11 chart layers and 4 themes in 21 seconds — all on one match, all from one React library.
>
> npm i @pitchkit/react
> https://www.pitchkitjs.com
