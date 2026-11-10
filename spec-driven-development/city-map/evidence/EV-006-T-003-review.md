# EV-006: Fresh review of T-003 (Sonnet, effort high)

Verdict: PASS, with no blocking findings.

## AC coverage
- **AC-007:** tested literally. A straight-line walker is shown to fail, and the flow-field walker then arrives through the gap. The stuck rule fires at 2 s and picks a walkable new target.
- **AC-008:** 40 cars run 2,000 steps with zero off-road steps. A real bridge crossing is recorded only when a car enters a bridge from outside and exits at least 6 cells away.

## Reviewer scratch runs
- **Deadlock:** 20,000 steps on seeds 1984, 7 and 99 produced 0 off-road steps and no deadlocks.
- **Large time steps:** dt of 1, 5 and 60 s produced 0 off-road steps and no NaN values.
- **Pathfinding:** 300 random paths all arrived, with no corner cutting.
- **Cost:** traffic takes about 0.011 ms per frame for 40 cars. A flow-field rebuild takes 0.21 ms at radius 40.

## Non-blocking findings
- One vacuous assertion in the "never wrap" test.
- Crossing cars pass through each other at junctions (a note for T-009).
- Walkability lookups could read `kinds` directly.
- The 5 ms performance threshold is loose.
