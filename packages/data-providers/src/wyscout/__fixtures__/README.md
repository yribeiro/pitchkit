# Wyscout fixtures

Real data, trimmed. Nothing here is synthesised — a fixture invented to make a
test pass stops being evidence of anything.

Test-only: `package.json`'s `files: ["dist"]` keeps them out of the tarball.

## Provenance

| File                        | Source                                                                                                          | Trimming                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `match-2499841-sample.json` | `koenvo/wyscout-soccer-match-event-dataset` `processed/files/2499841.json` (Huddersfield Town v Manchester City) | 27 of 1,593 events; both teams kept whole; squads cut to 2 players per side    |
| `competitions.json`         | figshare `ndownloader.figshare.com/files/15073685`                                                              | None — the real file is 1.4 KB and covers all seven competitions              |

## Why these 27 events

One per case the parsers, selectors and predicates need to be held to. The
selection is scripted against the full match rather than hand-picked, so
re-running it reproduces the same set.

- **A goal (tag 101) — on a `Save attempt`.** This is the fixture's most
  important row. Wyscout tags a goal on the conceding keeper's save as well as
  on the scoring action; across six matches tag 101 sat on 15 shots, 19 save
  attempts and 3 free kicks. A test pins that `shots(...).filter(isGoal)`
  counts each goal once while the unfiltered feed does not.
- **Shots with goal-mouth tags** (1215, 1216) and a **blocked** shot (2101) —
  where a shot went is a tag, not a coordinate.
- **Both shot end-position placeholders**, `(100, 100)` and `(0, 0)`, so the
  test that `endX`/`endY` are absent on shots covers both spellings.
- **A goal kick whose start is `(100, 100)`** and **a corner whose start is
  also `(100, 100)`** — the pair that proves a sentinel cannot be detected by
  value. The goal kick's is a placeholder; the corner's is a real corner flag.
- Accurate (1801) and inaccurate (1802) passes, a key pass (302), a through
  ball (901), a counter attack (1901), an interception (1401).
- All three duel outcomes: won (703), lost (701), neutral (702).
- A foul carrying a yellow card (1702), and a foul carrying no tags at all.
- An `Interruption` and an `Offside`, the other two types whose end position
  is always a placeholder.
- One second-half event, so `matchSeconds` ordering across periods is exercised.

## Refreshing

Re-run the selection script against a freshly fetched match. If a case
disappears because the source changed, fix the script — don't hand-edit the
JSON.
