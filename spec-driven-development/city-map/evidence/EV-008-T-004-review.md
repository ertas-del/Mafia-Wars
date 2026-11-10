# EV-008: Fresh review of T-004 (Sonnet, effort high)

**Verdict:** PASS, with no blocking findings.

**Contract:** met. nyc1984Data imports only cityData and the four portraits. Ids match RACKET_IDS and CONTACT_IDS. Outline, bounds and spawnPoint come from cityData. The save key is unchanged.

**Merge:** App uses the exact keep list from the plan. A missing save and a non-array save both handled. Unknown ids are dropped and the defaults are copied. Offline math reads the merged rackets.

**Ferry:** onTakeFerry is called only for 'ferry' prompts. Other prompt types are unchanged, and the button keeps touch:min-h-11. The optional FerryBridge cast compiles both before and after T-005.

**Non-blocking findings, fixed by the controller in 3e835bf:**
- A saved null field overwrote its default. It now uses `!= null`.
- New test: non-array saves and null fields.

**Handoff to T-005:**
- Widen the prompt union at NycWorldCanvas:102.
- Add takeFerry.
- Switch to outline-based borough detection and walkable spawns.
- Enlarge the world size.
- Draw the borough floor from the outline, or replace it with the renderer.
