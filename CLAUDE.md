# Engineering Handoff — The Commission: New York 1984

## 1. Project Overview
**The Commission: New York 1984** is a 2D open-world crime syndicate, turf war, and racket tycoon web game built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and an isolated **60fps HTML5 `<canvas>` simulation engine** with procedural **Web Audio API** sound synthesis.

The narrative and mechanics are grounded in the 1980s American Mafia ("Five Families" Commission Trial & Concrete Club era) across New York City's five boroughs, blending:
- **Active 2D Open-World Combat**: Real-time street combat against any NPC (Rival Soldati, Brawler Enforcers, Turf Capos, Contraband Couriers, Civilians, and NYPD Task Force squads) with windup telegraphs, hitstop, and camera shake.
- **Tycoon Racket & Territory Management**: 15 historical rackets across 5 dynamic risk-reward boroughs, upgraded from Level 1 to Level 5.
- **Stardew Valley-Style Social & Favor Mechanics**: 6 Inner-Circle contacts with 0–100 Omertà Respect (10 Hearts), favorite contraband gifts, 40/80 Respect Alliance perks, Sit-Down dialogues, and Favor Token trades.
- **Idle & Offline Progression**: Real-time 1-second tribute ticks, physical cash envelopes waiting outside rackets in the 2D world, and wall-clock `localStorage` offline progression (`lastSaveTimestamp` delta) with a Returning Boss Offline Tribute collector and time-skip simulator (`+4h` / `+12h`).
- **Three Pillars Skill Tree & Global Leaderboard**: 15 skill nodes across *Enforcer*, *Earner*, and *Consigliere* branches, plus a live Commission Wire global leaderboard.

---

## 2. Tech Stack & Commands
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` in `src/index.css`)
- **Typography**:
  - Display: `Cinzel` (`--font-display`)
  - UI / Body: `Plus Jakarta Sans` (`--font-sans`)
  - Telemetry / Numerals: `JetBrains Mono` (`--font-mono`, `tabular-nums`)
- **Commands**:
  - `npm run dev` — Starts Vite dev server on port `3000`
  - `npm run build` — Production build (`vite build`)
  - `npm run lint` — TypeScript check (`tsc --noEmit`)
- **CI**: `.github/workflows/check.yml` ("Check") runs `npm install --legacy-peer-deps`, `npm run lint` and `npm run build` on every push and pull request, uploads `dist/` as an artifact named `dist`, then runs a portrait check (exactly four hashed portrait `.jpg` files in `dist/assets`, each referenced from the bundle) and `scripts/phone-layout-check.mjs` (Playwright Chromium at 915×412 touch: title, play, five dossier tabs, pause; fails on horizontal overflow or any control under 44 px; screenshots uploaded as `phone-layout-shots`). The install flag works around a pre-existing esbuild peer conflict with Vite 8. Check also runs every `src/**/*.test.ts` (found with `find`) right after install, and after the phone-layout check runs `scripts/city-tour.mjs`: opens the build with `?tour`, travels to each borough and takes the Staten Island ferry, fails on page errors or a canvas with fewer than 8 colours, prints `CITY_TOUR_REPORT {json}` and six `CITY_SHOT <n> <index> <chunk>` base64 JPEG lines, and uploads `city-tour-shots`. Unit tests locally: `find src -name '*.test.ts' | xargs node --test`.
- **Hosting**: `.github/workflows/pages.yml` ("Deploy to GitHub Pages") builds with `--base` set to the repository name (currently `/Mafia-Wars/`) on every push to `main` or a manual run, and deploys to https://ertas-del.github.io/Mafia-Wars/. Pages must be set to "GitHub Actions" under repo Settings → Pages.

---

## 3. File Architecture
```text
/
├── index.html                        # Entry HTML, Google Fonts (Cinzel, Plus Jakarta Sans, JetBrains Mono)
├── metadata.json                     # App metadata
├── src/
│   ├── main.tsx                      # React root mount
│   ├── index.css                     # Tailwind v4 setup, font variables, custom dark scrollbars
│   ├── App.tsx                       # Root Game State Machine, economy/idle loop, save/load, offline math
│   ├── audio/
│   │   └── soundEngine.ts            # Procedural Web Audio API synth (gunshots, melee, cash, turf horn, siren)
│   ├── data/
│   │   └── nyc1984Data.ts            # Static definitions: 5 Families, 5 Boroughs, 15 Rackets, 6 Contacts, 15 Skills, 4 Weapons, 5 Narrative Acts
│   ├── input/                        # Phone input: touchMode, touchSticks, haptics, fullscreen (+ *.test.ts)
│   ├── world/                        # Pure city modules (+ *.test.ts): cityData (6400×4240 geography, bridges, ferry, stations, racket/contact placement), cityGen (seeded 32 px grid, unique buildings), city/ (grid, ground, names), cityRender + chunkCache (512 px pieces, max 24), pathfind (flow field + stuck rule), traffic (lane cars), saveMerge, bridgeTypes, cast + characterSprite + tagLayout (the 50-character street cast), contracts (grudges, contracts, sit-downs)
│   ├── components/
│   │   ├── NycWorldCanvas.tsx        # Isolated 60fps 2D Canvas engine (6400×4240 generated city, AI, bullets, rain, traffic)
│   │   ├── PerimeterHud.tsx          # Low-occlusion (<15% screen) HUD, borough fast-travel, weapon bar, context prompts
│   │   ├── SyndicateDrawers.tsx      # 5-tab modal dossier (Turf, Inner Circle, Skill Tree, Offline Vault, Leaderboard)
│   │   ├── RotateCard.tsx            # "Turn your phone sideways" overlay shown in portrait during play
│   │   └── TitleAndEndModals.tsx     # Title screen (inline SVG lockup + family selector) & Pause/Victory/Recovery modals
│   └── assets/images/                # Generated painterly 1984 character portraits (imported as modules in nyc1984Data.ts)
├── scripts/phone-layout-check.mjs    # CI phone-layout check
├── scripts/city-tour.mjs             # CI city tour (borough + ferry screenshots)
├── scripts/contracts-smoke.mjs       # Local contracts smoke run through the ?tour hooks
└── .github/workflows/                # check.yml (CI) and pages.yml (GitHub Pages deploy)
```

---

## 4. Core Systems & State Architecture

### A. Game State Machine (`src/App.tsx`)
- `type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER'`
- **Persistence**: Automatically saves to `localStorage` under key `commission_1984_empire_v1`.
- **Phone play**: In touch mode (`data-input="touch"`), Start and Resume call `enterPhoneFullscreen()` (fullscreen plus landscape lock, errors caught, not awaited); leaving fullscreen during PLAYING sets PAUSED; portrait during PLAYING shows `RotateCard` and pauses the canvas and the one-second tick through `isPortraitBlocked`, without a new `GameState`.
- **Offline Progression Calculation**:
  - On mount, compares `Date.now()` against `parsed.lastSaveTimestamp`.
  - If `elapsedSec >= 45` (capped at 24 hours), computes `offlineCash` and `offlineCrates` based on owned rackets and the `earn_4` (*Cayman Islands Numbered Accounts*) multiplier, populating `offlineReport`.
  - Players can also trigger `handleSimulateOfflineHours(4 | 12)` in the **Offline Vault** tab to test returning-boss rewards immediately.

### B. 60fps Canvas Simulation Bridge (`src/components/NycWorldCanvas.tsx`)
- **React Isolation**: The `<canvas>` runs inside a single `useEffect` `requestAnimationFrame` loop. React props are mirrored into a mutable `stateRef` so React state updates (like cash ticks or HUD toasts) never re-mount or stutter the 60fps loop.
- **Imperative Bridge (`bridgeRef`)**: Exposes methods from the canvas engine to React UI:
  - `teleportToBorough(boroughId)` / `teleportToCoords(x, y)`
  - `spawnTurfDefenseWave(racket)` — Teleports player outside a rival racket and spawns 1 defending Turf Capo + 2 Enforcers with `racketGuardId`. Defeating the Capo triggers `onTurfCapoDefeated(racketId)` and transfers ownership to `'player'`.
  - `spawnAlliedHitSquad()` — Spawns 2 allied bodyguards (`role: 'ally'`) that follow the player and shoot hostile NPCs.
  - `triggerHealEffect(text)`

### B2. The City (`src/world/`)
- **Generation**: `generateCity(1984)` is seeded and deterministic (32 px cells, `CellKind` grid); every building has a unique look (`lookOf`) and a unique sign name; names are invented (no real crime-family surnames). Staten Island is walkable with no rackets; the George Washington Bridge is closed (BARRIER).
- **Data**: borough `outline`, `bounds` and `spawnPoint`, and racket and contact positions come from `cityData.ts` (`nyc1984Data.ts` imports only that plus the portraits). Saved rackets merge by id through `mergeSavedById`, keeping only `ownerFamily`, `level` and `uncollectedCash`.
- **Drawing**: `drawCityChunk` bakes 512 px pieces (piece-local pixels) into a cache of at most 24, requested through `chunksForView` (visible first, then the ring as far as 24 allows); visible pieces bake one per frame, ring pieces only on frames under 20 ms. `drawCityOverlay` adds lamp and neon glow in world coordinates. Bridges are smooth decks built from the BRIDGE cells and never cover a building.
- **Engine**: all bodies move through `moveWithCollision`; bullets die on `blocksBullet`; spawns and teleports go through `randomWalkableIn`/`nearestWalkable` (falling back to a station); `areaAtPoint` drives the borough callback, which never fires for Uptown or Staten Island. Chasers and allies share one flow field around the player (radius 40 cells, rebuilt every 0.5 s) with a 2 s stuck rule; hostile windups need a clear line; Uptown and Staten Island keep 6 civilians each; 40 lane cars (4 police) come from `spawnTraffic`/`stepTraffic`.
- **Ferry**: the prompt (`InteractPrompt` type `ferry`, label contains "ferry") shows near `FERRY_TERMINALS`; E or bridge `takeFerry()` crosses with a fade, and never while paused.
- **Tour hook**: `window.__cityTour = { teleport, frameTimeMs, slowestChunkMs }` exists only with `?tour`.

### B3. The Street Cast (`src/world/cast.ts`, `characterSprite.ts`, `tagLayout.ts`)
- **Cast**: 50 invented characters (10 Corvini, 8 each for Bellini, Valenti, Moretti and Rastelli, 8 outside the families) copied from the `ertas-del/Mafia-game` character bible, with no real crime-figure surnames (a denylist test guards this). `NycWorldCanvas` takes names from one `createCastPool()` per mount: each borough's family NPCs are distinct members of its controlling family, turf Capos and button men come from the racket owner's family, the two outside cops head NYPD squads, and the other outsiders appear as named citizens; a member is released when its NPC dies or despawns. `assignCast` falls back to `genericTraits` (civilian, officer, ally, player).
- **Figures**: `drawCharacter` draws a full-body, three-quarter, camera-facing figure in a 100×120 box from traits; never side-on or top-down. The engine bakes each look once (`bakeCharacter` at scale about 0.42, about 44 px tall, at most 160 cached), anchors it at the feet (`FIGURE_FOOT`), mirrors it by facing, sorts bodies by y, and draws the weapon from `FIGURE_GRIP`. The player is a figure in the chosen family's look with a gold ring. Tracers are drawn a few px above the simulated bullet (`SHOT_LIFT`).
- **Tags**: name tags go only through `layoutTags` (at most 4, never overlapping, engaged first, then the nearest named NPC within 160 px). Tests: `node --test src/world/cast.test.ts`.

### B4. Contracts and Sit-Downs (`src/world/contracts.ts`)
- **Peace by default**: `isHostile` is the only hostility rule; the engine checks it at patrol, windup and cooldown and sends NPCs back to patrol when it stops holding. Family NPCs (couriers and citizens included, the player's own family too) attack only while their family has a contract on the player and no open sit-down window; turf-takeover guards are the one exception; NYPD attack only at heat `>= NYPD_HEAT_LINE` (55), which is also the spawn line. Someone hit without a contract backs away; allies target only hostile NPCs. An unarmed courier under contract shoves for 10 damage with the brawler windup.
- **Grudges**: each shot or swing gets an attack id; when it resolves the engine reports `tallyAttack` totals through `onFamilyHarmed` (one hit per NPC per attack, a kill is 3 points only). 3 points start a contract at $5,000; further hits add $1,500 and kills $4,000. A contracted family sends a squad of 2–3 every 90–150 s of play (one alive per family, none during its window or before `graceUntil`).
- **Sit-downs**: the dossier's Turf tab requests one; the family names a racket door (or its home station) 1–20 real-clock minutes out with a 3-minute window and holds fire in that window. At the spot (60 px) E or bridge `chooseSitDown()` calls `onSitDownChosen`; refused unless able to pay; with a hired ally within 400 px the prompt is "[E] Send your crew home" instead, which removes every hired ally for good (Enforcer bodyguards wait 520 px back and never block). The HUD prompt shows price and risk on their own line. Betrayal risk is 25% + 5% per kill − 1% per 100 respect XP (max 20%) − 10% with Street Ceasefire, clamped 5–75%. Honoured clears the family; betrayed costs 50% cash, 25% respect XP and half the unspent skill points (rounded up), keeps the contract at +$2,500, and wakes the player at the home station with 30 s grace (no ordinary Recovery penalties). An ordinary death under a contract wakes at the home station with 30 s grace. A window missed while playing adds $1,000; one that passes while closed, paused or in Recovery reopens (`contractsSeenAt` in the save).
- **Save and hooks**: the save gains optional `contracts` (read through `parseContracts`, never throws) and `contractsSeenAt`. With `?tour`, `__cityTour` also has `setHeat`, `addGrudge`, `advanceClock` and `spawnSquad`; `scripts/contracts-smoke.mjs` drives them (local, not in CI). Tests: `node --test src/world/contracts.test.ts`.

### C. Combat & Encounter Feel
- **Clamped Delta Time**: `const dt = Math.min(rawDt, 0.05)` prevents physics tunneling on tab switches.
- **Input Separation**: Continuous `heldKeys` (`WASD`, `Shift`, `Space`) are separated from edge-triggered `justPressedKeys` (`E` to interact, `1–4` weapon hotkeys) and cleared on `window.blur`.
- **Touch Mode**: `src/input/touchMode.ts` turns touch mode on at any `touchstart` and off at any `keydown` (mouse never changes it) and mirrors it to `<html data-input="touch|keyboard">`; outside touch mode the keyboard and mouse paths are unchanged.
- **Twin Sticks**: Pure `src/input/touchSticks.ts` (radius 60 px, 15% dead zone, sprint at 85%) runs a floating move stick on the left half and an aim stick on the right half that sets `player.angle` and attacks beyond the dead zone. Canvas touch handlers are `passive:false` and always call `preventDefault`; sticks are drawn in screen space only while held. Tests: `node --test src/input/*.test.ts`.
- **Haptics**: Pure `src/input/haptics.ts` vibrates 40 ms on player damage (App `handlePlayerDamaged`), 25 ms on a hitstop hit or kill (canvas, skipped on Turf Capo kills) and 80 ms on a Capo takedown (App `onTurfCapoDefeated` callback, not dossier buyouts); at most one pulse starts per 100 ms unless a longer one replaces it; the HUD toggle beside mute stores its setting under `commission_1984_vibration_v1` (default on) and is hidden where vibration is unsupported.
- **Enemy Windup Telegraphs**:
  - `brawler` NPCs render a translucent crimson melee arc for `0.48s` before lunging.
  - `soldato` and `capo` gunmen render a dashed red laser-sight line for `0.60s` before firing bursts.
- **Hitstop & Juice**: Heavy melee hits and kills (including Capo takedowns) trigger a `35ms–75ms` `hitstopTimer` simulation freeze, directional `camera.shake`, white sprite hit-flashes, squash-and-stretch scaling, and pooled shell/blood particles.

---

## 5. Design & UI Guardrails (Maintain on Future Edits)
1. **Low-Occlusion Perimeter UI**: Keep at least 85% of the playfield unobstructed during active play. Never apply `backdrop-filter` (`backdrop-blur-*`) over the active `<canvas>`.
2. **Tabular Numerals**: Always use `font-mono tabular-nums` on currency, timers, health/heat percentages, and leaderboard tables.
3. **Zero Broken Images**: Portraits are imported as modules in `nyc1984Data.ts` (a new portrait needs an import, and the CI portrait check expects exactly four `.jpg` files). Character portraits in `SyndicateDrawers.tsx` track `onError` in `failedImages` state and fall back to a styled monogram dossier card if an asset fails to load.
4. **Phone Variants**: `touch:` styles apply once `<html data-input="touch">` is set after the first touch (put `touch:min-h-11` on every control), `short:` applies at viewport height ≤ 500px for the compact phone-landscape layout, and title hints use `pointer-coarse:`.

---

## 6. Recommended Next Steps / Backlog for Claude
- **Backend Persistence / Multiplayer Wire**: Wire `server.ts` Express routes (`/api/leaderboard`, `/api/syndicate-wars`) if cross-player shared leaderboard persistence or asynchronous turf raids are desired.
- **Interior Mini-Maps / Backroom Heists**: Add enterable interior rooms for *JFK Hangar 7*, *Ravenite Social Club*, and *Midtown Concrete Tower* with stealth/vault-cracking mechanics.
- **Commission Sit-Down Cutscenes**: Expand `NARRATIVE_CHAPTERS` into multi-choice branching dialogue trees where players vote on Five Families sanctions.
- **Rival Family Counter-Raids**: Add periodic rival family retaliation waves against player-owned rackets if `policeHeat` or rival tension is high.
