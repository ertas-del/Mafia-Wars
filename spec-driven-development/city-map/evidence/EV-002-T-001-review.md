# EV-002: Fresh review of T-001 (Sonnet, effort high)

Round 1: BLOCKING. There were no north–south avenues (walk ratio 18.8), the GWB span was walkable, the look-uniqueness check included the sign name, and real surnames were present.
Fix: 98d6d59 (worker), then a47a6a3 (controller: Vitale, Escobar and Guzman replaced).

Round 2 (fresh reviewer): PASS, with no blocking findings.
- Worst station-to-racket walk is 2.35× straight-line (bound 3× + 12).
- 373 junction cells, about 64 distinct intersections. Non-blocking: the test counts cells, not clusters.
- The GWB closed span is BARRIER; every BRIDGE cell is reachable.
- Looks and signs are unique across 30 seeds; racket footprints are checked per cell.
- Determinism confirmed; no throws across 30 seeds; every racket and contact door is reachable from START_POINT.
- Accepted deviations: Midtown rows 10 deep (within the spec's 6–10); Manhattan inner streets off-centre; racket lots 168–198 px from pins.
- Follow-up outside scope: the contact ids contact_castellano, contact_gallo and contact_persico come from nyc1984Data.ts.
