<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "specification",
  "specification_id": "touch-controls",
  "revision": 3,
  "path": {"scope": "repository", "value": "spec-driven-development/touch-controls/spec.md"},
  "required_sections": [
    "Context and Evidence",
    "Decisions and Assumptions",
    "Goals and Non-Goals",
    "Workflows",
    "Requirements",
    "Acceptance Criteria",
    "Error and Recovery",
    "Constraints",
    "Risks and Alternatives",
    "Readiness Review"
  ],
  "requirements": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-012", "FR-013", "FR-014", "FR-015", "FR-016", "FR-017"],
  "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008", "AC-009", "AC-010", "AC-011", "AC-012"]
}
<!-- sdd-contract-end -->

# Touch Controls and Phone Play — Specification

**Path:** `spec-driven-development/touch-controls/spec.md` · **Revision:** 3 · **Kind:** specification · **Schema:** 1

<!-- sdd-approval-begin -->
**Approval status:** Approved
**Approved revision:** 3
**Approved normative digest:** `f176509737d43af72080f9ccb5e6709be8d64496a563edc59f18568379ca6c73`
**Approver:** User in the current session
**Approval timestamp:** 2026-11-08T19:03:17-07:00
<!-- sdd-approval-end -->

## Context and Evidence

The request is to make The Commission: New York 1984 playable on the user's Android phone (Samsung S26, Chrome), and to host it so the phone can open it. Repository `ertas-del/mafia-wars`, base commit `f7099f9` on `main`, work on branch `ertas-del/new/touch-controls`. Repository instructions are `CLAUDE.md`.

Current-state evidence:

- Play input is keyboard and mouse only. `src/components/NycWorldCanvas.tsx` keeps `heldKeys`, `justPressedKeys` and a `mouse` object; movement reads `KeyW/A/S/D` and arrows, sprint reads `ShiftLeft/ShiftRight`, attack fires on `Space` or `mouse.isDown`/`mouse.justClicked`, facing is `atan2` toward the mouse world position, interact is `KeyE`, weapons are `Digit1`–`Digit4`. No touch or pointer handling exists.
- The HUD (`src/components/PerimeterHud.tsx`) already has tappable buttons for weapons (`onEquipOrBuyWeapon`), the near-interactable prompt (opens the same drawer and focus through `onOpenDrawer` as `KeyE` does through `onOpenRacketModal`/`onOpenContactSitDown` in `src/App.tsx`), mute (`onToggleMute`), pause (`onPause`), borough fast-travel, and the dossier dock; the drawers have a Return to Street button and the pause screen a Resume button, so every key used during play except movement, sprint, aim and attack already has a tappable equivalent.
- `src/App.tsx` owns `GameState` (`TITLE_MENU | PLAYING | PAUSED | VICTORY | GAME_OVER`), keyboard shortcuts (Enter/Space start, Tab dossier, Esc pause), and the save key `commission_1984_empire_v1`. `isMuted` is not persisted.
- The canvas sizes itself to `window.innerWidth`/`innerHeight` on `resize`. `index.html` has a basic viewport meta.
- Character portraits are referenced as string paths `/src/assets/images/*.jpg` in `src/data/nyc1984Data.ts`; a production build does not ship those files, so portraits fall back to monograms once hosted.
- The repository is private with no GitHub Pages and no workflows. `package.json` has `lint` (`tsc --noEmit`) and `build` (`vite build`); there is no lockfile. Gemini/Express dependencies are unused by `src/`.
- Package installs are blocked in this session, so the game cannot be built or run here; global `tsc`, Node 22 and Chrome with Playwright exist but without the project's dependencies.

## Decisions and Assumptions

Confirmed user decisions (this session):

- D1 Twin-stick: left thumb moves, pushing to the edge sprints; right thumb drags to aim and attacks while held.
- D2 Landscape only, with a rotate card in portrait.
- D3 Sticks appear on the first touch and hide again when a keyboard key is pressed.
- D4 Floating sticks: each appears where the thumb lands on its half of the screen.
- D5 Tapping Start goes fullscreen and locks landscape; leaving fullscreen pauses; a refused request falls back to the rotate card.
- D6 Everything phone-friendly: play HUD, title screen, dossier drawers, pause, victory and game-over screens.
- D7 Light vibration on taking damage, heavy hits and Capo takedowns, with its own toggle beside the sound mute, remembered between sessions.
- D8 Hosting on GitHub Pages; the user makes the repository public.
- D9 A GitHub Actions check installs, type-checks and builds on every push.
- D10 Landing: push the feature branch; the user tests and merges.
- D11 Helper agents run Opus at high effort.

Nonmaterial assumptions: keyboard and mouse play stays exactly as it is; the S26 in Chrome is the reference device; iPhone Safari lacks fullscreen, orientation lock and vibration, so those features silently do nothing there.

Open questions: none.

### Depth and Defaults

| Component or default | Chosen depth or value | Basis | Impact | Alternative not taken | Can the product's user override it? |
|---|---|---|---|---|---|
| Pages deploys only from `main` (push to main, or a manual run on main) | Feature branch cannot be played on the phone until merged | agent judgment | high | Allow manual deploys from any branch, which needs the user to loosen the Pages environment rule | No (workflow file) |
| Move stick | Floating, analog direction and speed, 60 px radius, 15% dead zone | D1, D4; sizes agent judgment | medium | Fixed 8-way pad | No |
| Sprint | Deflection at or beyond 85% of radius sprints | D1; threshold agent judgment | low | Separate sprint button | No |
| Aim stick | Floating; facing follows drag direction beyond the dead zone; attacks every frame the cooldown allows while beyond the dead zone; on release facing stays at the last aim | D1, D4; release behavior agent judgment | medium | Fire on release only | No |
| Touch-mode exit | Any keydown leaves touch mode; mouse events never do (Android synthesizes them from touches) | D3; mouse rule agent judgment | low | Leave on mouse move too | Yes (touch again) |
| Portrait while playing | Rotate card shown and the simulation paused until landscape | D2; pausing agent judgment | medium | Keep simulating under the card | Yes (rotate) |
| Compact HUD | Applies when the viewport height is 500 px or less; HUD buttons at least 44 px tall in touch mode | D6; breakpoint agent judgment | medium | Width-based breakpoint | No |
| Phone-fit screens | Title, all five dossier tabs, pause, victory and game-over fit 915×412 with vertical scroll and no horizontal scroll | D6 | medium | Play screen only | No |
| Haptic patterns | Damage 40 ms, heavy hit 25 ms, Capo takedown 80 ms; one pulse per 100 ms, a longer one replacing a shorter | D7; durations agent judgment | low | Longer pulses | Yes (toggle) |
| Vibration toggle | Default on, stored under its own key `commission_1984_vibration_v1`, hidden when vibration is unsupported | D7; key and default agent judgment | low | Inside the save payload | Yes |
| Portrait images | Imported as modules so the build bundles them under any base path | agent judgment | medium | Move to `public/` | No |
| CI check | On every push and pull request: `npm install`, `npm run lint`, `npm run build` on Node 22 | D9 | low | Lint only | No |
| Pages base path | Pages workflow builds with base a slash, the repository name from `github.event.repository.name`, and a slash (currently `/Mafia-Wars/`); local dev unchanged | D8; repository renamed during execution | low | Hard-coded name | No |
| Title controls hint | Shows touch instructions when the device reports touch | agent judgment | low | Keyboard hint only | No |

Rejected alternatives: auto-aim fire button and tap-to-move (D1); both orientations (D2); fixed sticks (D4); a GitHub release as hosting, because a release only holds files and cannot serve the game; GitHub Pro, Netlify and Cloudflare hosting (D8).

## Goals and Non-Goals

Goals: full play on an Android phone with thumbs; every screen readable and usable in phone landscape; the game hosted at `https://ertas-del.github.io/Mafia-Wars/` once merged; a CI check proving the code compiles and builds.

Non-goals: gamepad support; iPhone-specific workarounds; a native Android app; new gameplay, balance or content; changes to the save format, offline math or the leaderboard; removing unused dependencies; making the repository public or changing its settings (the user's step).

## Workflows

1. **Start on the phone.** Player opens the Pages URL in Chrome, sees the title screen fitted to the screen with touch instructions, taps Start; the game enters fullscreen, locks landscape and begins.
2. **Fight.** Left thumb lands anywhere on the left half: a stick appears under it, the boss walks in that direction, faster at full push. Right thumb lands on the right half: the boss turns to the drag direction and attacks with the equipped weapon while the thumb stays out of the dead zone. Lifting a thumb removes that stick. Weapons switch by tapping the weapon bar.
3. **Interact.** Walking near a racket or contact shows the existing prompt button; tapping it opens the same drawer as `E`.
4. **Interruptions.** Turning the phone upright shows the rotate card and pauses; turning back resumes. Swiping out of fullscreen pauses; Resume re-enters fullscreen.
5. **Keyboard returns.** On a laptop, pressing any key hides the sticks and keyboard and mouse play as before.

## Requirements

- FR-001 Touch mode turns on at the first touch anywhere in the app and off at any keydown; mouse events never change it. Outside touch mode, keyboard and mouse controls behave exactly as before. In touch mode, stick input replaces key-based movement and mouse-based facing for the player.
- FR-002 During PLAYING in touch mode, a touch that starts on the left half of the screen and not on a HUD control creates a floating move stick at that point; its deflection sets movement direction and speed proportional to deflection beyond a 15% dead zone, with a 60 px radius, and releasing it stops movement.
- FR-003 Move-stick deflection at or beyond 85% of the radius applies sprint exactly as holding Shift does.
- FR-004 A touch that starts on the right half and not on a HUD control creates a floating aim stick; beyond the dead zone it sets the player's facing to the drag direction and requests an attack every frame, subject to the existing weapon cooldowns; releasing it stops attacking and keeps the last facing.
- FR-005 Each stick is bound to the touch identifier that created it; both sticks work at the same time; extra touches are ignored for sticks; a touch cancel or window blur clears both sticks.
- FR-006 Touches on the play screen never trigger the mouse attack path, page scroll, pinch or double-tap zoom, text selection or the long-press menu.
- FR-007 Sticks render as a translucent base and knob only while held, and nothing is drawn when no thumb is down.
- FR-008 In touch mode the weapon bar, interact prompt, mute, vibration, pause and dossier controls stay tappable with hit areas at least 44 px tall.
- FR-009 Tapping Start on a touch device requests fullscreen and a landscape orientation lock; if either is refused, the game starts anyway.
- FR-010 While PLAYING on a touch device in portrait, a rotate card covers the screen and the simulation pauses; landscape removes the card and resumes.
- FR-011 Leaving fullscreen during PLAYING on a touch device enters PAUSED; Resume from the pause screen requests fullscreen again.
- FR-012 With a viewport height of 500 px or less, the HUD uses a compact layout that keeps at least 85% of the playfield unobstructed, clips nothing off screen, and uses no backdrop blur over the canvas.
- FR-013 At 915×412 the title screen, all five dossier tabs, the pause, victory and game-over screens show all content through vertical scrolling only, with no horizontal scrolling and buttons at least 44 px tall.
- FR-014 Where vibration is supported and enabled, the device vibrates 40 ms when the player takes damage, 25 ms on a heavy hit that triggers hitstop, and 80 ms on a Capo takedown (which gives no separate hit pulse). At most one pulse starts per 100 ms, except that a longer pulse replaces a shorter one inside that window.
- FR-015 A vibration toggle beside the sound mute defaults on, persists under `commission_1984_vibration_v1`, and is hidden where vibration is unsupported.
- FR-016 Character portraits load from a production build served under the repository-name base path.
- FR-017 Two GitHub Actions workflows exist: a check that runs `npm install`, `npm run lint` and `npm run build` on every push and pull request, then runs the phone-layout check and the portrait check against the built `dist/`, prints both reports to the run log, fails if either check fails, and uploads `dist/` and the screenshots as run artifacts; and a Pages workflow that on push to `main` or a manual run on `main` builds with base `/` plus the repository name plus `/` and deploys to GitHub Pages.

## Acceptance Criteria

- AC-001 (FR-001, FR-002, FR-003, FR-005) Unit tests, compiled with the global `tsc` and run with `node --test` against pure modules that import no React or Vite code, show dead zone, proportional speed, sprint at 85%, touch-identifier binding, a second simultaneous stick, ignored third touch and clearing on cancel.
- AC-002 (FR-004) Unit tests show facing equals the drag angle beyond the dead zone, attack requested only beyond it, and facing retained after release.
- AC-003 (FR-001) Code review shows every keyboard and mouse path unchanged outside touch mode, sticks replacing key movement and mouse facing inside it, and touch mode toggled only by touchstart and keydown.
- AC-004 (FR-006, FR-007, FR-008) Code review shows touch handlers on the canvas with `preventDefault` and `touch-action: none`, no mouse attack from touches, stick drawing only while held, and touch-mode hit areas of at least 44 px.
- AC-005 (FR-009, FR-010, FR-011) Code review shows fullscreen and orientation requests on Start with failures caught, the portrait card pausing and resuming, and fullscreen exit entering PAUSED with Resume re-requesting.
- AC-006 (FR-012, FR-013) In the Check workflow, `scripts/phone-layout-check.mjs` serves `dist/` and drives Playwright Chromium emulating a 915×412 touch viewport; it visits the title, the HUD in play, all five dossier tabs and the pause screen, finds no horizontal overflow and no visible control under 44 px tall, prints a JSON report to the run log, and uploads screenshots as a run artifact. The report is copied from the log into `evidence/`. Victory and game-over are checked by code review of the same layout classes.
- AC-007 (FR-014, FR-015) Unit tests, run as in AC-001, show the pulse lengths, the 100 ms limit with longer-pulse replacement, the toggle default and persistence, and no calls when unsupported or disabled.
- AC-008 (FR-016) A Check workflow step lists the hashed portrait `.jpg` files in `dist/assets` and confirms each name appears in the JavaScript bundle; its log output is copied into `evidence/`.
- AC-009 (FR-017) The check workflow passes on the pushed feature branch, shown by its GitHub Actions run.
- AC-010 (FR-017) Code review of the Pages workflow shows the triggers, the base path and the official Pages upload and deploy actions.
- AC-011 (FR-002 to FR-011, FR-014) The user plays on the S26 after merging and confirms moving, sprinting, aiming, firing, interacting, rotating, leaving fullscreen and vibration work.
- AC-012 (FR-012, FR-013) The user confirms on the S26 that the HUD, title, dossier and end screens fit and scroll.

## Error and Recovery

Refused fullscreen or orientation lock leaves the game playable with the rotate card as the guard. Unsupported vibration hides the toggle. A lost touch (cancel, blur, app switch) clears both sticks so the boss never keeps walking. A failed CI run blocks nothing on the phone but is fixed before landing.

## Constraints

Keep the CLAUDE.md guardrails: at least 85% of the playfield clear, no backdrop blur over the canvas, `font-mono tabular-nums` on numbers, portrait fallbacks intact. Do not re-mount or stall the 60 fps loop; touch state goes through the same mutable input state as keys. Do not touch the save payload or `vite.config.ts` server settings. No new runtime dependencies.

## Risks and Alternatives

The code cannot be built or run in this session; the CI check (AC-009) and the user's phone test (AC-011, AC-012) are the real proof. The repository has never been type-checked in CI, so pre-existing errors may surface; those are fixed minimally inside this change. Pages needs the user to make the repository public and set Pages to "GitHub Actions" before the first deploy. Because Pages deploys from `main`, the phone test happens after merging; a bad merge is undone by reverting. The four portraits total about 3.5 MB, which the phone downloads once.

## Readiness Review

- Material questions resolved: yes.
- Goals, non-goals, workflows, requirements, constraints and criteria agree: yes.
- No invented requirement fills a gap; every agent-judgment default is in the table: yes.
- Every component has a Depth and Defaults row with a basis: yes.
- Identifiers unique, declared and present: yes.
- Criteria observable or with a named manual method: yes.
- External authority recorded: push of the feature branch only.
