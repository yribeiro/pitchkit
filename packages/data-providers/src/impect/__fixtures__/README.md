# Impect fixtures

**Hand-made, not trimmed from real data.** This is the one provider whose
fixtures break the package's rule that fixtures are real data, and the reason
is legal, not convenience: Impect's terms of use forbid editing,
reproducing or redistributing their data, and committing an excerpt here would
do all three. See
[their terms](https://github.com/ImpectAPI/open-data/blob/main/LICENSE.pdf).

Test-only: `package.json`'s `files: ["dist"]` keeps them out of the tarball.

## What they are

Small files in Impect's exact field shapes, with invented ids, names, times
and positions: one match between "Home FC" (squad 1) and "Away FC" (squad 2),
seventeen events, and the iteration, match, squad, player and lineup files to
go with it. They encode the facts the loaders depend on, each of which was
measured against Impect's real files (see `docs/architecture.md`, "Impect"):

- **Two coordinate frames.** `coordinates` are absolute, and the teams swap
  ends at half time. `adjCoordinates` turn each event so the **acting** team
  attacks towards `+x`. Event 4, an away clearance during a home attack, is
  mirrored to the away side's direction, not the attacker's.
- **The second half's clock starts at 10,000 seconds** (`gameTimeInSec`).
- **A goal is two events:** the `SHOT` with `result: "SUCCESS"`, then a `GOAL`
  marker with no position.
- **An own goal is an `OWN_GOAL` event credited to the side that conceded,**
  with no position. The sample match finishes 2-1, where counting `GOAL`
  events alone gives 2-0.
- **Set pieces are their own action types** (`KICK_OFF`, `CORNER`,
  `THROW_IN`) but carry a `pass` object, so `passes()` doesn't return them.
- A penalty is a `SHOT` with `action: "PENALTY_KICK"`, a pass can be
  `NEUTRAL`, a shot may have no `targetPoint`, and `FOUL`, `NO_VIDEO` and
  `FINAL_WHISTLE` have no position (the last two no squad either).

## Keeping them honest

Because they aren't real, these files can't catch a change in Impect's
format. The architecture doc records how each fact was measured; re-measure
against the live files when Impect publish a new data version.
