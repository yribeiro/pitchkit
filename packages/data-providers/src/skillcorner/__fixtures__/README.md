# SkillCorner fixtures

Trimmed excerpts of real files from
[SkillCorner/opendata](https://github.com/SkillCorner/opendata) (MIT licensed;
SkillCorner ask to be credited). Real data rather than hand-written samples, so
the tests fail when the parsers disagree with what SkillCorner actually ships.

All from **match 1874553** (Brisbane Roar v Adelaide United, A-League 2024/25)
unless noted, taken on 2026-09-12 from `master`.

| File | Source | Trimmed to |
| --- | --- | --- |
| `matches-sample.json` | `data/matches.json` | whole file (20 matches, 6.6 KB) |
| `match-1874553-sample.json` | `data/matches/1874553/1874553_match.json` | whole file (33 KB) |
| `tracking-1874553-sample.jsonl` | `..._tracking_extrapolated.jsonl` | 123 frames |
| `dynamic-events-1874553-sample.csv` | `..._dynamic_events.csv` | 70 rows, all 322 columns |
| `phases-1874553-sample.csv` | `..._phases_of_play.csv` | 40 rows |

Chosen deliberately:

- **Tracking** keeps the first 3 frames of the file — which are entirely null
  with an empty `player_data`, the pre-kickoff shape — followed by 120
  consecutive in-play frames from period 1. Both shapes are real, and a parser
  that only handles the second one is broken.
- **Dynamic events** hold 20 `player_possession`, 20 `passing_option`, 15
  `off_ball_run` and 15 `on_ball_engagement` rows, so every selector and
  predicate has something to match. All 322 columns are kept, because the
  point of the index signature is that unmodelled columns survive.
- The **match file** is kept whole: `pitch_length`, `pitch_width`,
  `match_periods` and `home_team_side` are all needed to place coordinates, and
  its `players[]` is the join table for tracking's `player_id`.

The tracking file in the real repository is stored with **Git LFS** and served
from `media.githubusercontent.com`, not `raw.githubusercontent.com` — fetching
the raw URL returns a ~130-byte pointer stub. This excerpt was taken via the
media host with an HTTP `Range` request.

## Refreshing

These are excerpts, not a mirror. If SkillCorner change the schema, re-cut them
from the same paths rather than editing by hand — a fixture edited to make a
test pass stops being evidence of anything.
