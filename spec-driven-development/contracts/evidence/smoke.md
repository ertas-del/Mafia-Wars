# EV-007: Contracts smoke run on the integrated branch (AC-004, AC-005)

**Command:** `node scripts/contracts-smoke.mjs <build> <shots>`

**Build:** the esbuild smoke build of ertas-del/new/contracts at 1135210, which has no Tailwind. Run in headless Chromium at 915×412 with `?tour`.

**Result:** all 9 checks passed and there were 0 page errors.

## AC-004: peace, grudges and squads
- **peace-60s:** at heat 0, the player spent 60 s walking among the Lower Manhattan crew. HP stayed at 140/140.
- **contract-started:** `addGrudge('corvini', 3)` put a contract on the player at $5,000.
- **other-family-peace:** Moretti stayed at peace, with grudge 0.
- **squad-hunts:** a Corvini squad was spawned and brought HP from 140 to 129.
- **NYPD at heat 55:** checked by screenshot. The page showed HP 31/140, CRITICAL, after heat was set to 55. The exact line between 54 and 55 is covered by the unit test and by the T-003 worker's run.

## AC-005: the sit-down
The player requested a sit-down from the dossier, the clock was fast-forwarded to the window, and the player was teleported to the spot. The prompt read: "[E] Sit down with the Corvini family — pay $5,000 — risk 24%".
- **honoured-clears:** cash went from $8,500 to $3,500. Grudge, contract and price were all cleared.
- **betrayed-keeps-contract:** the betrayal screen listed −$100,000 cash (50% of $200,000), −30 respect XP (25% of 120) and −1 skill point (half of 2, rounded up). The contract stayed open at a new price of $7,500. "Wake Up at the Station" returned the player to play.

## Screenshots
The controller viewed `1-peace`, `2-squad`, `3-heat55`, `4-dossier-requested`, `5-sitdown-prompt`, `6-betrayed` and `7-woke`. Because the build has no Tailwind, the HTML overlays are unstyled, but the text confirms each state.
