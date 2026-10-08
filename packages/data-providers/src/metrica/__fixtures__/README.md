# Metrica fixtures

Real data, trimmed. Nothing here is synthesised — a fixture invented to make a
test pass stops being evidence of anything.

Test-only: `package.json`'s `files: ["dist"]` keeps them out of the tarball.

## Provenance

All from `metrica-sports/sample-data`, `data/Sample_Game_{1,2}/`.

| File                              | Source                                        | Trimming                                                      |
| --------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `events-game1-sample.csv`         | `Sample_Game_1_RawEventsData.csv`             | 56 of 1,745 rows: the opening 40, then one per case below     |
| `events-game2-sample.csv`         | `Sample_Game_2_RawEventsData.csv`             | 3 of 1,935 rows: the penalty, its shot, and a `Player 26` row |
| `tracking-game1-home-sample.csv`  | `Sample_Game_1_RawTrackingData_Home_Team.csv` | The 3 header rows and frames 2250-2400 (151 of 145,006)       |
| `tracking-game1-away-sample.csv`  | `Sample_Game_1_RawTrackingData_Away_Team.csv` | The same frames                                               |
| `tracking-game1-home-kickoff.csv` | `Sample_Game_1_RawTrackingData_Home_Team.csv` | The 3 header rows and frames 1-3, the opening kick-off        |
| `tracking-game1-away-kickoff.csv` | `Sample_Game_1_RawTrackingData_Away_Team.csv` | The same frames                                               |
| `tracking-game2-away-header.csv`  | `Sample_Game_2_RawTrackingData_Away_Team.csv` | The 3 header rows and the first 3 frames with `Player 26` on  |

## Why these rows

**Events.** The opening 40 rows hold the first kick-off (whose `End Frame` is
`0`), passes, lost balls, recoveries, aerial challenges, a throw-in, and the
opening goal (`HEAD-ON TARGET-GOAL`, frame 2289). Then the first row of each
of these, so a test can pin each predicate against a real event:

- **The own goal**, a Home `BALL OUT` qualified `WOODWORK-GOAL`. It is Sample
  Game 1's only away goal, and `shots(events).filter(isGoal)` doesn't see it.
- A second-half goal, a saved shot, a blocked shot, a shot off the woodwork, a
  shot off target, and the keeper's `RECOVERY` / `SAVED`.
- A yellow card, a corner kick, a free kick, a throw-in.
- A goal kick, which is a `PASS` qualified `GOAL KICK` rather than a set piece,
  a cross, and a pass qualified `THROUGH BALL-DEEP BALL`.
- Both sides of a foul (`TACKLE-FAULT-WON`, `TACKLE-FAULT-LOST`), a
  `FAULT RECEIVED`, and a `BALL LOST` clearance.

Game 2's three rows cover the one penalty, and the away player spelled
`Player 26`, with a space, in both the events and tracking files.

**Tracking.** Frames 2250-2400 span the opening goal (2289-2309) and the
stoppage after it, so the ball is tracked in some frames and `NaN` in others.
Home's three substitutes are `NaN` throughout, as they are until they come on.
The window starts at frame 2250 rather than 1, which also tests that a ranged
read corrects an offset estimate that is far off. It also catches Home camped in
the Away half before the goal, which is why `attackingDirection` asks for a
kick-off frame: frames 1-3 are that kick-off, with every player in their own half.

## Refreshing

The rows are selected by a script against the full files, not by hand. If a
case disappears because the source changed, fix the selection, don't hand-edit
the CSV.
