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
│   ├── components/
│   │   ├── NycWorldCanvas.tsx        # Isolated 60fps 2D Canvas engine (3200x2120 NYC map, AI, bullets, rain, traffic)
│   │   ├── PerimeterHud.tsx          # Low-occlusion (<15% screen) HUD, borough fast-travel, weapon bar, context prompts
│   │   ├── SyndicateDrawers.tsx      # 5-tab modal dossier (Turf, Inner Circle, Skill Tree, Offline Vault, Leaderboard)
│   │   └── TitleAndEndModals.tsx     # Title screen (inline SVG lockup + family selector) & Pause/Victory/Recovery modals
│   └── assets/images/                # Generated painterly 1984 character portraits
```

---

## 4. Core Systems & State Architecture

### A. Game State Machine (`src/App.tsx`)
- `type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER'`
- **Persistence**: Automatically saves to `localStorage` under key `commission_1984_empire_v1`.
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

### C. Combat & Encounter Feel
- **Clamped Delta Time**: `const dt = Math.min(rawDt, 0.05)` prevents physics tunneling on tab switches.
- **Input Separation**: Continuous `heldKeys` (`WASD`, `Shift`, `Space`) are separated from edge-triggered `justPressedKeys` (`E` to interact, `1–4` weapon hotkeys) and cleared on `window.blur`.
- **Enemy Windup Telegraphs**:
  - `brawler` NPCs render a translucent crimson melee arc for `0.48s` before lunging.
  - `soldato` and `capo` gunmen render a dashed red laser-sight line for `0.60s` before firing bursts.
- **Hitstop & Juice**: Heavy melee hits, shotgun blasts, and Capo takedowns trigger a `35ms–75ms` `hitstopTimer` simulation freeze, directional `camera.shake`, white sprite hit-flashes, squash-and-stretch scaling, and pooled shell/blood particles.

---

## 5. Design & UI Guardrails (Maintain on Future Edits)
1. **Low-Occlusion Perimeter UI**: Keep at least 85% of the playfield unobstructed during active play. Never apply `backdrop-filter` (`backdrop-blur-*`) over the active `<canvas>`.
2. **Tabular Numerals**: Always use `font-mono tabular-nums` on currency, timers, health/heat percentages, and leaderboard tables.
3. **Zero Broken Images**: Character portraits in `SyndicateDrawers.tsx` track `onError` in `failedImages` state and fall back to a styled monogram dossier card if an asset fails to load.

---

## 6. Recommended Next Steps / Backlog for Claude
- **Backend Persistence / Multiplayer Wire**: Wire `server.ts` Express routes (`/api/leaderboard`, `/api/syndicate-wars`) if cross-player shared leaderboard persistence or asynchronous turf raids are desired.
- **Interior Mini-Maps / Backroom Heists**: Add enterable interior rooms for *JFK Hangar 7*, *Ravenite Social Club*, and *Midtown Concrete Tower* with stealth/vault-cracking mechanics.
- **Commission Sit-Down Cutscenes**: Expand `NARRATIVE_CHAPTERS` into multi-choice branching dialogue trees where players vote on Five Families sanctions.
- **Rival Family Counter-Raids**: Add periodic rival family retaliation waves against player-owned rackets if `policeHeat` or rival tension is high.
