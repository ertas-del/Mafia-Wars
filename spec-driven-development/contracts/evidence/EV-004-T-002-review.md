# EV-004: Fresh review of T-002 (Opus, effort high)

## Round 1 (b51c7ec): BLOCKING
App passed the view to the canvas as `contractsView`, but the engine reads `contracts`. JSX spreads skip excess-property checks, so the merged build would have type-checked while never seeing a contract.

## Fix (7c483fd)
- The canvas now receives `{...{ contracts: contractsView }}`.
- The callbacks go only in worldCallbacks.
- Return to Title after a betrayal now wakes the player at the station.
- A betrayal wake-up gives 30 s of grace.
- The heal text names the station.

The controller checked the fix: 88 tests pass, and tsc is clean after integration.

## Notes
- The worker's added `contractsSeenAt` is correct. Lapses during a pause or Recovery reopen without charge; lapses during play are charged.
- The 30 s grace after a betrayal goes beyond the spec's minimum, which only required grace after an ordinary death. It is player-friendly and is recorded here.
