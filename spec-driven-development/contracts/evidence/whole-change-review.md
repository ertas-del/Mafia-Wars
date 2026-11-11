# EV-009: Whole-change review (Opus, effort high)

## First pass, at 10063fa: BLOCKING
The reviewer found a soft-lock. Sal's hired crew never leaves the player, so the alone check refused every sit-down for the rest of the session.

Everything else checked out:
- The integration seam lined up: the `contracts` prop, the callbacks, `wakeAt`, `chooseSitDown`, the cumulative debug clock, `graceUntil`, `heat`, and the one-attempt guard.
- All 15 racket doors and all 5 stations are walkable, and none needed snapping.
- A save from current main with no contracts field loads empty. Offline progression and the rackets merge are unchanged.
- 88 tests pass, tsc is clean, and the Tailwind smoke build passes 9 of 9.
- The guardrails and the CLAUDE.md B4 section are accurate.

## Resolution
- The user approved PATCH-001, which adds a "send your crew home" prompt and a readable price and risk line.
- The patch was delivered in bd7303a. A fresh reviewer passed it; see patch-001-checks.md.
- Check run 42936973345 on 6729a0d is green.

## Non-blocking notes carried forward for AC-008 tuning
- Pausing at the end of each sit-down window keeps reopening it, so a player can hold safe passage indefinitely.
- Enforcer bodyguards' kills raise the grudge and the betrayal risk.
- The integrated run's NYPD-at-55 screenshot was taken while a Corvini contract was also active. The exact 54/55 line is proven by the unit test and EV-005.
