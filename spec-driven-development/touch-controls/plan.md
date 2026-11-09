<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "implementation-plan",
  "plan_id": "touch-controls-plan",
  "revision": 1,
  "path": {"scope": "repository", "value": "spec-driven-development/touch-controls/plan.md"},
  "required_sections": ["Goal", "Preflight", "Architecture Change Map", "Binding Fields", "Adaptable Fields", "Risks and Resolved Assumptions", "Requirement Coverage", "Verification Coverage", "Dependency Graph", "Task Contracts", "Execution and Landing", "Plan Readiness Review"],
  "specification": {
    "path": {"scope": "repository", "value": "spec-driven-development/touch-controls/spec.md"},
    "revision": 1,
    "digest": "500a2e90cd6c2b34acf061be354f7935293b3e48170004ad04f627c4463f2c51"
  },
  "binding_fields": ["task deliverables and coverage", "approved constraints and boundaries", "verification obligations", "external effects and landing boundary", "pinned interfaces"],
  "adaptable_fields": ["exact private symbols or files", "internal tactics", "worker assignment", "evidence-equivalent verification command"],
  "adaptation_rules": {
    "exact private symbols or files": ["ownership"],
    "internal tactics": ["adaptable_values"],
    "worker assignment": ["adaptable_values"],
    "evidence-equivalent verification command": ["adaptable_values"]
  },
  "tasks": [
    {
      "id": "T-001",
      "covers": {"requirements": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007"], "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004"]},
      "depends_on": [],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/components/NycWorldCanvas.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/input/touchSticks.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/input/touchSticks.test.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/input/touchMode.ts"}, "mode": "exclusive"}
      ],
      "consumes": ["approved specification", "existing canvas input loop"],
      "produces": ["touch twin-stick play", "touchMode module and html data-input attribute"],
      "verification_ids": ["EV-001", "EV-002"],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-003",
      "covers": {"requirements": ["FR-008", "FR-012", "FR-013"], "acceptance_criteria": ["AC-004"]},
      "depends_on": [],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/components/PerimeterHud.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/SyndicateDrawers.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/TitleAndEndModals.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/index.css"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "index.html"}, "mode": "exclusive"}
      ],
      "consumes": ["approved specification", "pinned data-input attribute"],
      "produces": ["phone-fit HUD, title, drawers and modals", "touch Tailwind variant"],
      "verification_ids": ["EV-003"],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-004",
      "covers": {"requirements": ["FR-009", "FR-010", "FR-011"], "acceptance_criteria": ["AC-005"]},
      "depends_on": [],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/App.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/input/fullscreen.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/RotateCard.tsx"}, "mode": "exclusive"}
      ],
      "consumes": ["approved specification", "pinned data-input attribute"],
      "produces": ["fullscreen, orientation lock, portrait card and fullscreen-exit pause"],
      "verification_ids": ["EV-004"],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-005",
      "covers": {"requirements": ["FR-016", "FR-017"], "acceptance_criteria": ["AC-010"]},
      "depends_on": [],
      "ownership": [
        {"type": "directory", "path": {"scope": "repository", "value": ".github/workflows"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/data/nyc1984Data.ts"}, "mode": "exclusive"}
      ],
      "consumes": ["approved specification", "package.json scripts"],
      "produces": ["check workflow with dist artifact", "Pages workflow", "bundled portraits"],
      "verification_ids": ["EV-005"],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-002",
      "covers": {"requirements": ["FR-014", "FR-015"], "acceptance_criteria": ["AC-007"]},
      "depends_on": ["T-001", "T-003", "T-004"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/input/haptics.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/input/haptics.test.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/NycWorldCanvas.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/PerimeterHud.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/App.tsx"}, "mode": "exclusive"}
      ],
      "consumes": ["T-001 canvas", "T-003 HUD layout", "T-004 App"],
      "produces": ["vibration feedback and toggle"],
      "verification_ids": ["EV-006"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-006",
      "covers": {"requirements": [], "acceptance_criteria": ["AC-006", "AC-008", "AC-009"]},
      "depends_on": ["T-001", "T-002", "T-003", "T-004", "T-005"],
      "ownership": [
        {"type": "directory", "path": {"scope": "repository", "value": "spec-driven-development/touch-controls/evidence"}, "mode": "exclusive"},
        {"type": "git-index", "name": "feature-branch", "mode": "exclusive"}
      ],
      "consumes": ["integrated feature branch", "CI run and dist artifact"],
      "produces": ["green CI run", "915x412 phone-fit report and screenshots", "portrait bundle check"],
      "verification_ids": ["EV-007", "EV-008", "EV-009"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-007",
      "covers": {"requirements": [], "acceptance_criteria": ["AC-011", "AC-012"]},
      "depends_on": ["T-006"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/touch-controls/evidence/device-test.md"}, "mode": "exclusive"}
      ],
      "consumes": ["user merge to main", "Pages deployment", "user's S26"],
      "produces": ["user's device confirmation"],
      "verification_ids": ["EV-010"],
      "parallel_group": null,
      "commit_required": false
    }
  ]
}
<!-- sdd-contract-end -->

# Touch Controls and Phone Play — Implementation Plan

**Path:** `spec-driven-development/touch-controls/plan.md` · **Revision:** 1 · **Kind:** implementation-plan · **Schema:** 1 · **Status:** awaiting user approval
**Specification:** `spec-driven-development/touch-controls/spec.md` revision 1, digest `500a2e90cd6c2b34acf061be354f7935293b3e48170004ad04f627c4463f2c51`

<!-- sdd-approval-begin -->
**Approval status:** Approved
**Approved revision:** 1
**Approved normative digest:** `88d6c508b4c063de9f0ad04d85f7196602f918a3daa28802bf7012f6b1ec75fe`
**Approver:** User in the current session
**Approval timestamp:** 2026-11-08T17:27:56-07:00
<!-- sdd-approval-end -->

## Goal

Deliver FR-001 to FR-017 as six code tasks and one device-test task: four independent slices in one parallel wave, haptics after them, then build verification on the pushed branch, then the user's phone test after merge.

## Preflight

| Fact | Evidence |
|---|---|
| Repository | `ertas-del/mafia-wars`, shallow clone at `/home/claude/mafia-wars` |
| Branch and baseline | `ertas-del/new/touch-controls` from `main` at `f7099f9`; clean apart from this feature folder |
| User work | None in the working tree |
| Instructions | `CLAUDE.md` guardrails (85% clear playfield, no backdrop blur on canvas, tabular numerals, portrait fallback) |
| Tooling | `npm run lint` and `npm run build` from `package.json`, runnable only in CI; `node --test` with Node 22 type stripping (checked by the plan critic), `gh`, Playwright 1.63 and `/usr/bin/google-chrome` here; `http-server` global for serving `dist/` |
| Track and agents | critical; every task to a fresh Opus worker at high effort and a fresh Opus reviewer at high effort |
| Landing authority | commit and push `ertas-del/new/touch-controls`; merge, Pages settings, visibility and deployment are the user's |

## Architecture Change Map

| Surface | Current evidence | Change | Interface | Task |
|---|---|---|---|---|
| Touch mode | none | `src/input/touchMode.ts`: `isTouchMode()`, `subscribeTouchMode(fn)`, listeners on `touchstart` (on) and `keydown` (off), sets `document.documentElement.dataset.input` to `touch` or `keyboard` | pinned: attribute `data-input="touch"` on `<html>` | T-001 produces; T-003, T-004 consume |
| Stick logic | none | pure `src/input/touchSticks.ts`: stick state per touch id, deflection, dead zone 0.15, radius 60, sprint at 0.85, aim angle, attack flag; no DOM, React or Vite imports | `TouchSticks` class or functions used by the canvas | T-001 |
| Canvas input | `NycWorldCanvas.tsx` key and mouse handlers, movement block near line 662, facing at 685, attack at 692 | touch listeners on the canvas (`passive: false`, `preventDefault`), sticks drive movement, sprint, facing and attack when touch mode is on; sticks drawn last; cleared on cancel, blur and pause | private | T-001 |
| Phone layout | Tailwind classes, `md:` breakpoints only | `@custom-variant touch` keyed on the attribute and a short-viewport variant (`max-height: 500px`) in `index.css`; compact HUD; scrollable drawers and modals; viewport meta adds `viewport-fit=cover` and disables user scaling | CSS only | T-003 |
| Start, resume, portrait | `onStartGame` and `onResume` set state in `App.tsx` lines 770, 882; canvas `isPaused` prop at 745 | `src/input/fullscreen.ts` request helpers with errors caught; Start and Resume call them in touch mode; `fullscreenchange` exit during PLAYING sets PAUSED; portrait plus touch mode renders `RotateCard` and adds to the `isPaused` expression without changing `GameState` | private | T-004 |
| Haptics | hitstop at canvas ~600 and ~893, `onPlayerDamaged`, `onTurfCapoDefeated` | pure `src/input/haptics.ts` with pulse queue and toggle storage; canvas calls it on hitstop (skipped on Capo kills); App calls it on damage and Capo defeat; HUD toggle beside mute | `pulse(kind)`, `isVibrationSupported()`, `getVibrationEnabled()`, `setVibrationEnabled(on)` | T-002 |
| Hosting | string portrait paths `nyc1984Data.ts` 597-722, no workflows | portraits imported as modules; `.github/workflows/check.yml` and `pages.yml` | build base via `vite build --base=/mafia-wars/` | T-005 |

## Binding Fields

Task deliverables and coverage; the specification's constraints and boundaries (CLAUDE.md guardrails, no save-format change, no new runtime dependencies, keyboard and mouse unchanged outside touch mode); verification obligations EV-001 to EV-010; external effects limited to pushing the feature branch; the pinned interfaces in the change map.

## Adaptable Fields

Exact private symbols or files inside an owned boundary (may update `ownership`); internal tactics, worker assignment, and an evidence-equivalent verification command (each may update `adaptable_values`). Any amendment records reason and risk and revalidates coverage, dependencies, ownership, interfaces, concurrency and verification. Anything else returns to plan approval.

## Risks and Resolved Assumptions

| Entry | Evidence | Tasks | If wrong | Mitigation | Impact |
|---|---|---|---|---|---|
| UI tasks cannot be type-checked or rendered here, so wave-1 compile errors surface only in CI | no `node_modules`; installs blocked | T-001, T-003, T-004, T-002 | a red CI run | T-006 fixes forward and reopens the owning task | medium |
| Pre-existing `tsc` errors may exist on `main` | never run in CI | T-006 | CI red for reasons outside this change | minimal fixes, recorded in T-006 evidence | low |
| Touch mode as an `<html>` attribute plus a Tailwind custom variant, rather than React context | planner judgment | T-001, T-003, T-004 | layout code must be reworked to a hook | attribute is one line to read anywhere | medium |
| Portrait pause added to the canvas `isPaused` expression rather than a new `GameState` | planner judgment; `App.tsx:745` | T-004 | save and state machine untouched either way | none needed | low |
| Haptics wait for the wave because they edit three wave-owned files | planner judgment | T-002 | a later finish by one task | none needed | low |
| Pushing the integrated branch triggers CI on GitHub | spec AC-009; authority permits branch push | T-006 | none | n/a | low |

## Requirement Coverage

| Requirement | Task | Deliverable |
|---|---|---|
| FR-001 to FR-007 | T-001 | touch mode and twin-stick play in the canvas |
| FR-008, FR-012, FR-013 | T-003 | phone-fit HUD, title, drawers, modals |
| FR-009, FR-010, FR-011 | T-004 | fullscreen, orientation, rotate card, fullscreen-exit pause |
| FR-014, FR-015 | T-002 | haptics and toggle |
| FR-016, FR-017 | T-005 | bundled portraits and two workflows |

## Verification Coverage

| Criterion | Task | Evidence | Proof |
|---|---|---|---|
| AC-001, AC-002 | T-001 | EV-001 | `node --test` passes on the stick tests |
| AC-003, AC-004 | T-001 | EV-002 | reviewer's diff reading of the canvas touch handling |
| AC-004 | T-003 | EV-003 | reviewer's diff reading of HUD 44 px sizing |
| AC-005 | T-004 | EV-004 | reviewer's diff reading of App and helpers |
| AC-010 | T-005 | EV-005 | reviewer's reading of both workflow files |
| AC-007 | T-002 | EV-006 | `node --test` passes on the haptics tests |
| AC-009 | T-006 | EV-007 | `gh run list` shows the check workflow successful on the branch head |
| AC-006 | T-006 | EV-008 | Playwright report with no overflow and no short controls, plus screenshots |
| AC-008 | T-006 | EV-009 | hashed portrait files in `dist/assets` and referenced from the bundle |
| AC-011, AC-012 | T-007 | EV-010 | user's written confirmation after playing on the S26 |

## Dependency Graph

T-001, T-003, T-004 and T-005 have no dependencies and form `wave-1`; their files are disjoint and the only shared contract, the `data-input` attribute, is pinned above. T-002 is ready when T-001, T-003 and T-004 are DONE, because it edits the canvas, HUD and App they produced. T-006 is ready when all code tasks are DONE and the branch is pushed. T-007 is ready when T-006 is DONE and the user has merged to `main` and Pages has deployed. The controller is the integration owner and the only writer of `CLAUDE.md`, adding each task's reported lines when it merges that task: each wave worker commits in its own worktree branched from the feature branch head, and the controller merges them into the feature branch in the order T-005, T-001, T-003, T-004.

## Task Contracts

### T-001

**Deliverable:** On a touch screen the boss walks, sprints, aims and attacks with two floating thumbsticks; keyboard and mouse play is unchanged outside touch mode.
**Covers:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; AC-001, AC-002, AC-003, AC-004 (canvas half).
**Dependencies and readiness:** none; worktree at the feature branch head.
**Ownership:** `src/components/NycWorldCanvas.tsx`, `src/input/touchSticks.ts`, `src/input/touchSticks.test.ts`, `src/input/touchMode.ts`.
**Interfaces consumed:** existing `heldKeys`, `mouse`, `player.angle`, `triggerPlayerAttack`, `isPaused`.
**Interfaces produced:** `touchMode.ts` with the pinned attribute; stick API used only inside the canvas.
**Concrete change:** Pure stick module with the spec's numbers. `touchMode.ts` registers window `touchstart` (capture, passive) and `keydown` once and updates the attribute. Canvas adds `touchstart/move/end/cancel` with `passive: false` and calls `preventDefault` on every canvas touch event whatever happens to the stick (third touches, paused, dead zone), so Android sends no follow-up mouse events; in touch mode the attack check also ignores `mouse.isDown` and `mouse.justClicked`. It ignores touches whose target is not the canvas (HUD buttons sit above it), assigns left or right half by start x, clears sticks on cancel, blur and pause. In the movement block, touch mode uses the move vector (scaled, not normalized to 1) and sprint flag; facing uses the aim angle and is no longer overwritten by the mouse; attack fires while aim is beyond the dead zone. Draws base and knob in screen space after the world. Canvas element gets `touch-action: none`.
**Verification:** EV-001: from the repository root, `node --test src/input/touchSticks.test.ts` passes on Node 22 (type stripping; imports use the `.ts` extension, modules use erasable syntax only, no `enum` or parameter properties, and each test file starts with `/// <reference types="node" />` so CI lint resolves `node:test`); the test file guards dead zone, scaling, sprint threshold, id binding, two sticks, ignored third touch, cancel clearing, aim angle, attack flag and retained facing. EV-002: fresh reviewer confirms keyboard and mouse paths are unchanged outside touch-mode branches, `preventDefault` on every canvas touch event, no mouse attack in touch mode, `touch-action: none`, and sticks drawn only while held.
**Documentation, migration, and rollback:** worker reports two lines for CLAUDE.md's Combat section, which the controller writes at integration; no migration; revert the commit to roll back.
**Delegation and integration:** fresh Opus worker, high effort, own worktree; fresh Opus reviewer; controller integrates.
**Commit boundary:** one commit in the worker's worktree, merged by the controller.
**Done:** EV-001 passes, reviewer has no blocking finding, merged with its CLAUDE.md lines.

### T-003

**Deliverable:** Every screen fits a 915×412 phone in landscape: compact HUD, scrolling drawers and modals, 44 px controls in touch mode, touch hint on the title.
**Covers:** FR-008, FR-012, FR-013; AC-004.
**Dependencies and readiness:** none; consumes the pinned attribute by name only.
**Ownership:** `src/components/PerimeterHud.tsx`, `src/components/SyndicateDrawers.tsx`, `src/components/TitleAndEndModals.tsx`, `src/index.css`, `index.html`.
**Interfaces consumed:** `data-input="touch"` on `<html>`.
**Interfaces produced:** Tailwind variants `touch:` and `short:` (max-height 500px) in `index.css`.
**Concrete change:** Add the two variants. HUD: under `short:` shrink padding and type, collapse secondary readouts, keep the top cluster to one row and the weapon bar and dock along the edges so the middle stays clear; `touch:min-h-11` on every control. Drawers and modals: `max-h-[100dvh] overflow-y-auto`, no fixed widths wider than the viewport, tab bar scrolls horizontally inside itself only. Title: shows touch instructions under Tailwind's built-in `pointer-coarse:` variant and hides the keyboard line there, so the hint is right before the first tap. Viewport meta gains `viewport-fit=cover, user-scalable=no`. No backdrop blur over the canvas.
**Verification:** EV-003: fresh reviewer checks every control has a touch 44 px class, no element exceeds viewport width at 915 px, and the guardrails hold. Rendered proof is EV-008 in T-006.
**Documentation, migration, and rollback:** worker reports one guardrail line on the variants for the controller to write into CLAUDE.md; revert to roll back.
**Delegation and integration:** fresh Opus worker, high effort, own worktree; fresh Opus reviewer; controller integrates.
**Commit boundary:** one commit, merged by the controller.
**Done:** reviewer has no blocking finding, merged with its CLAUDE.md line.

### T-004

**Deliverable:** On a phone, Start goes fullscreen and sideways, portrait shows a rotate card and pauses, leaving fullscreen pauses, Resume returns to fullscreen.
**Covers:** FR-009, FR-010, FR-011; AC-005.
**Dependencies and readiness:** none; reads touch mode from the pinned attribute.
**Ownership:** `src/App.tsx`, `src/input/fullscreen.ts`, `src/components/RotateCard.tsx`.
**Interfaces consumed:** `onStartGame` and `onResume` call sites, canvas `isPaused` prop.
**Interfaces produced:** `enterPhoneFullscreen()` returning a promise that never rejects.
**Concrete change:** Helper requests fullscreen on `document.documentElement` then `screen.orientation.lock('landscape')`, each in try/catch, only when touch mode is on. Start and Resume call it before setting state. A `fullscreenchange` listener sets PAUSED when fullscreen ends during PLAYING in touch mode. A `matchMedia('(orientation: portrait)')` listener plus touch mode drives `RotateCard` over everything during PLAYING and is OR-ed into the canvas `isPaused` prop and into the guard of the one-second income tick (`App.tsx` near line 290), so the whole simulation stops. Keyboard Esc and existing flows unchanged.
**Verification:** EV-004: fresh reviewer traces each path in the diff, including a refused request still starting the game.
**Documentation, migration, and rollback:** worker reports one state-machine line for the controller to write into CLAUDE.md; revert to roll back.
**Delegation and integration:** fresh Opus worker, high effort, own worktree; fresh Opus reviewer; controller integrates.
**Commit boundary:** one commit, merged by the controller.
**Done:** reviewer has no blocking finding, merged with its CLAUDE.md line.

### T-005

**Deliverable:** CI that proves the game compiles and builds, a Pages workflow that publishes `main`, and portraits that survive the build.
**Covers:** FR-016, FR-017; AC-010.
**Dependencies and readiness:** none.
**Ownership:** `.github/workflows/`, `src/data/nyc1984Data.ts`.
**Interfaces consumed:** `package.json` scripts.
**Interfaces produced:** artifact named `dist` on every check run.
**Concrete change:** Import the four portrait files and use the imported URLs for `portraitUrl`. `check.yml`: on push and pull_request, Node 22, `npm install`, `npm run lint`, `npm run build`, upload `dist`. `pages.yml`: on push to `main` and `workflow_dispatch`, permissions `pages: write` and `id-token: write`, `npm install`, `npx vite build --base=/mafia-wars/`, `actions/configure-pages`, `actions/upload-pages-artifact`, and a deploy job with `environment: github-pages` running `actions/deploy-pages`.
**Verification:** EV-005: fresh reviewer checks triggers, permissions, base path and that every portrait reference is an import. Build proof is EV-007 and EV-009.
**Documentation, migration, and rollback:** worker reports the CLAUDE.md commands-section text naming both workflows and the Pages URL, written by the controller; revert to roll back.
**Delegation and integration:** fresh Opus worker, high effort, own worktree; fresh Opus reviewer; controller integrates first.
**Commit boundary:** one commit, merged by the controller.
**Done:** reviewer has no blocking finding, merged with its CLAUDE.md text.

### T-002

**Deliverable:** The phone buzzes on damage, heavy hits and Capo takedowns, with a remembered on/off switch beside mute.
**Covers:** FR-014, FR-015; AC-007.
**Dependencies and readiness:** T-001, T-003, T-004 DONE and merged.
**Ownership:** `src/input/haptics.ts`, `src/input/haptics.test.ts`, `src/components/NycWorldCanvas.tsx`, `src/components/PerimeterHud.tsx`, `src/App.tsx`.
**Interfaces consumed:** hitstop sites in the canvas, `onPlayerDamaged`, `onTurfCapoDefeated`, HUD mute button.
**Interfaces produced:** the haptics API in the change map.
**Concrete change:** Pure module with injectable `vibrate` and storage so it tests in Node; 40/25/80 ms; 100 ms window where a longer pulse replaces a shorter one; storage key `commission_1984_vibration_v1`, default on. Canvas pulses on hitstop except Capo kills; App pulses on damage and Capo defeat; HUD toggle with the touch 44 px class, hidden when unsupported.
**Verification:** EV-006: `node --test src/input/haptics.test.ts` under the same rules as EV-001, guarding durations, window replacement, default, persistence and no calls when off or unsupported; fresh reviewer reads the call sites.
**Documentation, migration, and rollback:** worker reports one CLAUDE.md line for the controller to write; no save change; revert to roll back.
**Delegation and integration:** fresh Opus worker, high effort, worktree from the post-wave head; fresh Opus reviewer; sequential because it edits three wave-owned files.
**Commit boundary:** one commit, merged by the controller.
**Done:** EV-006 passes, reviewer has no blocking finding, merged.

### T-006

**Deliverable:** Proof on real build output that the change compiles, builds, fits a phone screen and ships the portraits.
**Covers:** AC-006, AC-008, AC-009.
**Dependencies and readiness:** all code tasks DONE and merged.
**Ownership:** the feature folder's `evidence/` directory and the feature branch index.
**Interfaces consumed:** CI run and its `dist` artifact.
**Interfaces produced:** retained evidence files.
**Concrete change:** Push the branch; wait for the check run. EV-007: `gh run list --branch ertas-del/new/touch-controls` shows success for the head commit; a red run is diagnosed, fixed in the owning task's files (that task reopens) and re-pushed. EV-008: `gh run download` the `dist` artifact into scratch, serve it with `http-server`, run a Playwright script with `/usr/bin/google-chrome` at 915×412, `hasTouch`, `isMobile`, landscape; set `data-input="touch"`; visit title, start play, open each of the five dossier tabs, and pause; assert `scrollWidth <= clientWidth` and every visible button at least 44 px tall; save screenshots and a JSON report to `evidence/`. Victory and game-over are covered by the T-003 review. EV-009: list hashed `.jpg` files in `dist/assets` and grep the bundle for their names.
**Documentation, migration, and rollback:** not applicable beyond evidence.
**Delegation and integration:** fresh Opus worker for EV-008's script and run, with a fresh Opus reviewer of its report; the controller runs EV-007 and EV-009 and owns pushes.
**Commit boundary:** one commit adding evidence, pushed.
**Done:** all three evidence items pass and are committed and pushed.

### T-007

**Deliverable:** The user confirms play and layout on the S26.
**Covers:** AC-011, AC-012.
**Dependencies and readiness:** T-006 DONE; the user has made the repository public, set Pages to GitHub Actions, merged to `main`, and the Pages run succeeded.
**Ownership:** `evidence/device-test.md`.
**Interfaces consumed:** the live site.
**Interfaces produced:** the user's confirmation.
**Concrete change:** The controller gives the user a short checklist; EV-010 records the user's answers verbatim in `evidence/device-test.md`.
**Verification:** EV-010 as above; failures reopen the owning task through fix forward.
**Documentation, migration, and rollback:** none.
**Delegation and integration:** the user performs it; the controller records it.
**Commit boundary:** recorded in the next branch or follow-up, since `main` is the user's.
**Done:** the user confirms every checklist item.

## Execution and Landing

Wave 1 dispatches T-001, T-003, T-004 and T-005 together, each in its own git worktree under `/home/claude/wt/`; the controller merges them, then runs T-002, then T-006. Verification runs once per boundary: each task's EV at acceptance, CI at T-006, and one fresh whole-change reviewer before the final push. Expected landing states: implemented, verified (EV-001 to EV-009), committed and pushed on `ertas-del/new/touch-controls`; merged, deployed and device-tested are the user's and stay `not-authorized` for the controller; released is not required. The workflow parks in `EXECUTING` after T-006 until the user merges and tests, because AC-011 and AC-012 exist only on the deployed site.

## Plan Readiness Review

- Binding: spec revision 1 and digest match.
- Grounding: commands come from `package.json`, global tools verified present, landing from the user's answers.
- Traceability: all FR-001 to FR-017 and AC-001 to AC-012 covered once or more; no unknown IDs.
- Tasks are slices; no prerequisite task below the minimum slice; the one shared contract is pinned.
- DAG acyclic; wave-1 ownership disjoint; T-002 sequenced with its reason.
- Every EV has a command or a named reviewer.
- No implementation before plan approval.
