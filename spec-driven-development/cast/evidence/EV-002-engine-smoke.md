# EV-002: Engine smoke run for T-002 (commit 0ad78ba)

**Test environment:** esbuild build with stubs (no Tailwind), headless Chromium at 915×412, URL `?tour`, plus a scratch-only debug copy.

**Results:**
- **Unit tests:** 63 of 63 pass.
- **Type check:** global tsc with React stubs reports 0 errors in NycWorldCanvas.tsx.
- **Page errors:** 0 in both builds.
- **Figures:** visible in all five game boroughs, Uptown and Staten Island.
- **Player:** drawn as a figure in the family look with the gold ring.
- **Crowd fight:** 6–7 tags requested, 4 shown, 0 overlaps in two samples. The controller viewed ev-crowd-a.png.
- **Cast ids:** across 8 checkpoints (4 kill rounds, turf guard kills and a cop kill), no living NPC shared a castId, and the pool matched the living NPCs.
- **Named roles:** the outside cops lead NYPD squads, and the turf Capo comes from the owner's family.
- **People-drawing cost:** 0.3 ms median and 0.4 ms p95 with 16 bodies. At 4× CPU throttle: 1.0 ms median and 2.9 ms p95.

**Accepted deviations:**
- Five of the six outside citizens are on the street at a time. The sixth rotates in on a respawn, because each borough has one citizen slot.
- Tracers are drawn at hand height. The simulated bullet itself is unchanged.
- The nearest-NPC tag goes only to a named NPC.

**Follow-ups:**
- The six contacts are still drawn as discs.
- The arrival banner text "NPC TRAIT" is stale.
- Racket and contact world labels (not NPC tags) can still overlap each other near a racket door.
