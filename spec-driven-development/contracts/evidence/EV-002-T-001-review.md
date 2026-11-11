# EV-002: Fresh review of T-001 (Opus, effort high)

## Round 1 (bc886d2): BLOCKING

The rulebook made couriers never hostile. That contradicts FR-003 ("every member of that family attacks on sight") and FR-001's list of covered NPCs.

Everything else matched the spec:
- every pinned export;
- every number in the Depth and Defaults table;
- AC-001 to AC-003, each tested literally;
- parseContracts never threw on hostile input.

## Fix (79add57)

- Removed the courier exclusion. The courier test now covers four cases: under its family's contract, with no contract, under another family's contract, and during safe passage.
- Applied the reviewer's suggestions on save consistency: an active contract is priced at least BASE_PRICE, an empty or non-finite window is dropped, and counts are floored.
- Added NaN guards.

The controller read the fix diff against the reviewer's exact fix and reran the tests: 88 pass. The blocking finding is resolved.

## Handoffs

- T-002: the lastSaveTimestamp stamping (see the scratch handoff notes).
- T-003: how an unarmed courier attacks once its family has a contract on the player.
