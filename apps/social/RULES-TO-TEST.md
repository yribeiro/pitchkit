# Rules to test

Hypotheses about what makes a PitchKit reel travel, each with the evidence
behind it and how we'll know if it holds. They are not rules yet: promote one
to "Confirmed" only after our own numbers back it, and record the result.

Measure every test with Instagram's own insights (via vidIQ): **3-second hold
(skip rate)**, **average watch time / % watched**, **shares**, **saves** and
**comments**. Compare against our baseline below, and change one thing at a
time where we can.

## Baseline (our reels so far, as of 4 Oct 2026)

| Post                 | Views | Skip rate | Avg watch | Shares | Saves |
| -------------------- | ----: | --------: | --------: | -----: | ----: |
| Reel 01 — quickstart |   344 |     68.4% |     6.4 s |      2 |     3 |
| Reel 02 — tracking   |   268 |     78.2% |     5.5 s |      5 |     1 |
| Reel 03 — layers     |   241 |     85.4% |     2.9 s |      1 |     1 |
| Post 03 — animated   |   167 |     64.7% |     5.2 s |      0 |     0 |

Takeaway so far: the reel that opened on static text (03) lost the most people
in the first 3 seconds; the one that moved from frame 0 (post 03) kept the most.

## Evidence sources

- **@total.fball** (Total Football, 17.7K followers), top reels analysed with
  vidIQ on 5 Oct 2026: "Inverted Fullback Overload" (3.8M plays, 14 s, silent
  2D board), "The 4-3-3 in 60 Seconds" (331K plays, 1.6K comments, 58 s 3D
  explainer with voiceover and a comment-for-e-book CTA), and "De Zerbi's
  Pressing Trap" (16K plays, slow static open) as the counter-example.
- **vidIQ outlier search** for football tactics / data reels (Oct 2026): the
  analytics reels that broke out were almost all music-only with a rhythmic beat
  from the first frame.
- **Hook research** (Opus, inro, Klap, CapCut, Sovran, GoFaceless, Oct 2026):
  viewers decide in ~3 s; visual hooks beat text hooks; a pattern break every
  8–12 s cut drop-off from 22% to 8% in one 50-video analysis.

## The rules

| #   | Rule to test                                                                                                        | Evidence                                                                               | How to test                                                                        | Success looks like                                     | Status   |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- |
| 1   | **Short loops win reach.** A ~14 s reel that loops seamlessly beats a 30–60 s one on plays.                         | Total Football's 14 s boards: 289K–3.8M plays; their 58 s explainer: 331K.             | Post a 14 s looping cut of reel 04 (Spain replay only) alongside the 38 s cut.     | 14 s cut gets ≥ 2× the plays and > 100% average watch. | Untested |
| 2   | **Motion from frame 0.** No title card first; the board is already moving in the opening half-second.               | 3.8M reel: three passes in 1.5 s. 16K reel: static title, slow first 2 s. Our reel 03. | Same content, two openings: title card first vs. straight into motion.             | Skip rate ≤ 60% (our best is 64.7%).                   | Untested |
| 3   | **A beat every 1.5–2 s.** Something visibly changes (a pass, a label, a highlight) every couple of seconds.         | 3.8M reel: 6 beats in 14 s.                                                            | Count beats per reel before posting; compare watch time for dense vs. sparse cuts. | Average watch time rises with beat density.            | Untested |
| 4   | **One label, at the payoff.** A single bold concept label appears exactly when the action happens, in its zone.     | "INVERTED FULLBACK" lands inside the hatched zone as the run happens.                  | Replace multi-line text with one payoff label (e.g. "LAPORTE ↔ LE NORMAND · 31").  | Higher % watched than text-heavy versions.             | Untested |
| 5   | **Seamless loop.** The last frame flows into the first, so the replay isn't noticed.                                | 3.8M reel's goal → keeper reset; the 16K reel's jarring reset.                         | Design the 14 s cut so the final network fades back into the opening formation.    | Average watch > 100% of length.                        | Untested |
| 6   | **Music only, beat from frame 1.** No voiceover for silent-friendly boards; a rhythmic track starts immediately.    | Outlier search: breakout analytics reels were music-only. 3.8M reel: no voice.         | Same reel with trending audio vs. with voiceover (we have a voiceover take ready). | Music-only version has lower skip rate.                | Untested |
| 7   | **Use trending audio from the in-app picker.** It adds discovery via the audio page.                                | Common practice; "Dai Dai" (official 2026 World Cup song) trending in Sept 2026.       | Post reel 04 with "DAI DAI - PHONK" from Instagram's library.                      | Views from non-followers (Insights: "Reached") > 70%.  | Untested |
| 8   | **Chapter progress bar for anything over ~20 s.** A HUD along the top naming each section.                          | 4-3-3 explainer holds a 58 s runtime with THE SHAPE → THE SIX → … → THE WEAK SPOT.     | Add THE NETWORKS → SPAIN → ENGLAND → THE SHAPE to the 38 s reel 04 cut.            | % watched on the long cut ≥ 40%.                       | Untested |
| 9   | **Metric badges on the pitch.** Real measurements ("14 M", "33M") drawn onto the canvas add authority.              | 4-3-3 explainer's "14 M" / "63 M WIDE" badges; our reel 04 length labels.              | Keep measurement badges; compare saves on reels with vs. without them.             | Saves per 1K views higher with badges.                 | Untested |
| 10  | **Show the weak spot.** Structure: shape → in possession → out of possession → the flaw.                            | 4-3-3 explainer's "THE WEAK SPOT" beat keeps advanced fans to the CTA.                 | End an explainer on the flaw (e.g. "the space beside Rodri").                      | Comments and saves above our baseline.                 | Untested |
| 11  | **Comment-for-reward CTA.** "Comment NETWORK and I'll DM you the code", with a mock DM showing the reward arriving. | 1.6K comments on the 4-3-3 reel from "Comment 433" + free 19-page playbook.            | Needs an automated-DM tool (ManyChat or similar) on the account first.             | ≥ 1% of viewers comment the keyword.                   | Blocked  |
| 12  | **Curiosity hooks over purist labels.** A question or a stake, not a name ("De Zerbi Build-Up").                    | 16K "De Zerbi's Pressing Trap" vs. 3.8M and 331K reels with clear payoffs.             | A/B the first-frame text: label vs. question ("How did Spain pass 2.5× more?").    | Lower skip rate on the question version.               | Untested |
| 13  | **A pattern break every 8–12 s.** A cut, a card, a camera change or a new colour, roughly that often.               | GoFaceless analysis of 50 viral videos (drop-off 22% → 8%).                            | Map breaks on the timeline before posting; reel 04 has cards and a whip-pan.       | Retention curve without a cliff mid-reel.              | Untested |
| 14  | **Different arrow styles for different actions.** Straight for passes, curved and dashed for runs.                  | 3.8M reel conveys layers of movement without clutter.                                  | Use PitchKit's `Arrows` and `Comet` with distinct styles in the next tactics reel. | Qualitative: fewer "what am I looking at" comments.    | Untested |

## Results log

Record each test here when its numbers are in (give it at least 72 hours).

| Date | Rule | Post(s) | Result | Verdict |
| ---- | ---- | ------- | ------ | ------- |
|      |      |         |        |         |
