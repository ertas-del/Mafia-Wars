# EV-006: Fresh review of T-003 (Opus, effort high)

**Verdict: PASS.** No blocking findings. Every point in the T-003 contract was checked one by one, and the wiring was confirmed against App at 7c483fd.

**Contract points confirmed:**
- Hostility is decided only by isHostile, and NPCs drop back to patrol when it stops holding.
- Attack ids and tallyAttack report correctly; there is no leak and no double report.
- Squads, safe passage, bodyguards, the spot and prompt, wakeAt, chooseSitDown and the hooks all behave as contracted.

**Courier choice:** a 10-damage shove, judged sensible because couriers carry no weapon.

**Non-blocking findings (follow-ups):**
- There are small per-frame allocations.
- The sit-down label can cover name tags.
- Ally bullets can graze bystanders. That adds grudge points, as the spec says allies' hits count.
- The spawnSquad hook needs one render after addGrudge.
- The shove damage is a new number, to be recorded in CLAUDE.md.
