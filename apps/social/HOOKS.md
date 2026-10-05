# Hook playbook

How viral football and data reels win the first three seconds, and how we
build that in Remotion. The research behind it ran on 5 Oct 2026; turn
anything here into a test in [RULES-TO-TEST.md](./RULES-TO-TEST.md) before
treating it as a rule.

## What the numbers say

- Instagram's **skip rate** (viewers gone inside 3 s) is the metric to beat.
  Accounts of our size average 60–66%; strong hooks get under 40%, and reels
  that hold more than 60% at 3 s reach 5–10× more people than ones under 40%.
  Our reels so far: 64.7–85.4%.
- Reels have the tightest window of any platform: the hook has to land by
  **1.0 s** and promise a payoff by **3.0 s** (TikTok allows ~1.5 s).

## What the outliers do

From vidIQ's outlier search (football tactics and data reels, 100K+ views,
Jun–Oct 2026) and frame-by-frame breakdowns of four of them:

| Reel                                                              | Plays             | What the first second looks like                                                                                                                                                              |
| ----------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @total.fball, "Inverted Fullback Overload" (14 s)                 | 3.8M (60× median) | A bright, cropped 2D pitch already in play: three passes inside 1.5 s. No title. Beat from frame 1.                                                                                           |
| @simulandoarena, "Newcastle x Liverpool" (3.8K followers)         | 2.3M (16× median) | A ball already flying, with a wooden "tok" on every bounce and a score counter that ticks up each time, every 0.4–0.7 s.                                                                      |
| @thetacticsguy, "PSG rotation" (23 s)                             | 2.9M (12× median) | The full XI with names, a 2-word title for 0.4 s, players moving by 0.5 s. A labelled variation ("VARIATION 1: 3-1-6") pops in at 2 s with a whoosh. Glides back to the start: seamless loop. |
| @primevideosportaunz, "Chelsea nearly broke our graph" (bar race) | 2.2M (61× median) | Bars growing by 0.5 s, the year flipping every ~1 s, rank swaps every 1–2 s, archive commentary synced to each jump.                                                                          |
| @footikitaka, Barcelona goal in 3D (34 s)                         | 1M (31× median)   | A tilted 3D pitch with the camera already pulling back as the first pass is struck; a "92'" score bug sets the stakes.                                                                        |
| @fifa, all-time World Cup scorers (bar race)                      | 5.3M (17× median) | Counters already changing on frame 1, music from frame 1, loops.                                                                                                                              |

And @total.fball's own reels (12 most recent):

- The breakouts (3.8M, 289K, 144K) are bright, saturated pitches that fill
  the frame and bleed off the edges, with little or no text.
- The 331K-play "4-3-3 in 60 seconds" is the tilted 3D pitch, with one
  short line over it ("On his own.") and a chapter bar along the top.
- The flops (5–19K) use dark pitches and more text.

## The techniques

1. **In medias res.** Frame 0 is already mid-action: a pass in flight, a
   counter already running, the camera already moving. Never open on a still
   frame or a fade from black. Every outlier above moves before 0.5 s.
2. **Sound on every beat.** A tactile tick, tok or whoosh synced to each
   on-screen event, under the music. This was the main retention driver in
   the 2.3M-play reel from a 3.8K-follower account.
3. **A counter that climbs.** A number ticking up (score, passes, minute,
   spend) gives viewers a reason to stay to the end: the goal-gradient effect.
4. **A change every 0.5–2 s.** A pass, a rank swap, a label, a camera move.
   Bar races swap ranks every 1–2 s; the tactics boards change something
   every 0.75–1.5 s.
5. **The subject is the hook.** The pitch with recognisable players or clubs
   _is_ the first frame, with at most a 2–4 word label ("PSG ROTATION",
   "DEFENDING IN A BACK FOUR"). Statements ("This is why Messi…") also work;
   long questions are rarer among the outliers.
6. **Fill the frame.** A big, bright pitch cropped by the screen edges, not a
   small pitch in a black frame under a header.
7. **A camera that moves.** A tilted 3D pitch, a pull-back or a pan, eased
   and continuous, not snap zooms.
8. **One label at the payoff.** Text arrives exactly when the action it names
   happens ("INVERTED FULLBACK", "1 v 1", "PRESS BROKEN").
9. **Stakes in the frame.** A score bug, a minute ("92'"), a final: why this
   moment matters, readable without sound.
10. **Loop it.** End where it starts, so the replay goes unnoticed and
    average watch time can pass 100%.
11. **Races travel.** Bar chart races are the most reliable data format in
    football short-form (1.7–5.3M on the accounts above). PitchKit's
    `RaceChart` can make them.

## How we build it in Remotion

- **Shift the loop point** instead of opening on the start of the timeline:
  render frame `f` from timeline frame `(f + OPEN_AT) % duration`, with
  `OPEN_AT` a few frames into the first move. The still moment then sits
  just before the loop point, where a returning viewer barely notices it.
  See `OPEN_AT` in `src/reels/NetworksLoopReel.tsx`.
- **Ease so the opening frame is already moving:** use `Easing.out` or a
  quadratic `inOut` for the first move, not a cubic `inOut`, which is
  nearly still for its first quarter.
- **Sound effects as data:** work out cue frames from the same functions
  that drive the picture (for example a tick each time the pass count passes
  a multiple of 10), then place each one with
  `<Sequence from={…}><Audio src={staticFile(…)} /></Sequence>`. A cue that
  runs past the last frame also gets a copy at a negative `from`, so it
  plays across the loop point.
- **Our own sounds:** `node scripts/make-sfx.mjs` synthesises `tick`, `pop`
  and `whoosh` into `public/sfx/`, so there's nothing to license.
  Remotion's bundled ffmpeg has no synthesis filters, which is why it's Node.
- **Camera moves are CSS 3D on the pitch wrapper:**
  `perspective() rotateX() rotateZ() scale()`, with `transformOrigin` below
  the centre so the near end stays in shot.

## Sources

- vidIQ: outlier search for football data and tactics hooks and formats;
  frame-by-frame breakdowns of @simulandoarena, @thetacticsguy,
  @primevideosportaunz and @footikitaka reels; @total.fball's 12 most
  recent reels.
- [Babbleboxx: what's a good Instagram skip rate](https://www.babbleboxx.com/post/instagram-adds-reels-retention-skip-rate-what-influencer-marketers-should-do-next),
  [Retensis: Reels skip rate benchmarks 2026](https://retensis.com/blog/instagram-reels-skip-rate-benchmarks-2026),
  [Reelyze: Reels algorithm 2026](https://getreelyze.com/guides/instagram-reels-algorithm)
- [Kineclip: viral hooks for short-form, 2026](https://kineclip.com/blog/how-to-write-viral-hooks-short-form-2026/),
  [Fobet Media: Reel hooks](https://fobetmedia.com/instagram-reel-hooks/),
  [UGC Copilot: hook formulas](https://ugccopilot.ai/blog/viral-hooks-that-convert/)
- [Why bar chart races go viral](https://data-reel-maker.lovable.app/blog/why-bar-chart-races-go-viral),
  [Built In: bar chart races](https://builtin.com/data-science/bar-chart-races)
- [Open loops in content](https://www.socialync.io/blog/open-loops-in-content-2026),
  [Overseer: hook framework](https://www.overseeros.com/blog/youtube-hook-framework-7-openings-that-keep-viewers-watching)
- [Meer: how TikTok is changing how we talk about football](https://www.meer.com/en/97452-how-tiktok-is-changing-how-we-talk-about-football)
