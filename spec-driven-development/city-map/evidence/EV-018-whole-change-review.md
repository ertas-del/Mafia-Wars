# EV-018: Whole-change review before the merge into main (Sonnet, effort high)

**Verdict:** PASS. There are no correctness, security, privacy, data-integrity or acceptance failures. Unit tests pass 47/47, and the type check of the world and input modules is clean.

## What the review confirmed
- **Requirements:** every FR and AC-001 to AC-013 is backed by its evidence. AC-014 (the phone test) is pending, as expected.
- **Integration seams:** the shared prompt type and the ferry wiring work. The save merge was run against the real INITIAL_RACKETS with old, partial and ghost-id saves. The cache is capped at 24, the city is disposed on unmount, and the tour hook is present only with ?tour.
- **Clean-up:** none of the old 3200×2120 code is left behind, and the CLAUDE.md text matches the code.
- **Secrets:** none found.
- **Memory:** the piece cache uses about 25 MB of canvas memory.
- **Names:** this change adds no real crime-figure names.

## Non-blocking findings
- The ledger prose was stale. Fixed in this commit.
- The FerryBridge cast in App.tsx is now redundant but still type-safe. Left as is.
- Local worktree and scratchpad paths appear in the plan and ledger. They are harmless.
- The pre-existing name "The Chin" Gigante at NycWorldCanvas.tsx:479 remains. Replacing it is a follow-up that also covers other real-name NPCs.
