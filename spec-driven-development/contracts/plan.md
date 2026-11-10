<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "implementation-plan",
  "plan_id": "contracts-plan",
  "revision": 1,
  "path": {"scope": "repository", "value": "spec-driven-development/contracts/plan.md"},
  "required_sections": [
    "Goal",
    "Preflight",
    "Architecture Change Map",
    "Binding Fields",
    "Adaptable Fields",
    "Risks and Resolved Assumptions",
    "Requirement Coverage",
    "Verification Coverage",
    "Dependency Graph",
    "Task Contracts",
    "Execution and Landing",
    "Plan Readiness Review"
  ],
  "specification": {
    "path": {"scope": "repository", "value": "spec-driven-development/contracts/spec.md"},
    "revision": 1,
    "digest": "5458ebbc0d3f3a5aad143b86fa8645ac212a8982430b9ff9e24ffa324d68f5c9"
  },
  "binding_fields": [
    "task deliverables and coverage",
    "approved constraints and boundaries",
    "verification obligations",
    "external effects and landing boundary",
    "pinned interfaces"
  ],
  "adaptable_fields": [
    "exact private symbols or files",
    "internal tactics",
    "worker assignment",
    "evidence-equivalent verification command"
  ],
  "adaptation_rules": {
    "exact private symbols or files": ["ownership"],
    "internal tactics": ["adaptable_values"],
    "worker assignment": ["adaptable_values"],
    "evidence-equivalent verification command": ["adaptable_values"]
  },
  "tasks": [
    {
      "id": "T-001",
      "covers": {"requirements": ["FR-001", "FR-002", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-012"], "acceptance_criteria": ["AC-001", "AC-002", "AC-003"]},
      "depends_on": [],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/world/contracts.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/world/contracts.test.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/world/bridgeTypes.ts"}, "mode": "exclusive"}
      ],
      "consumes": ["approved specification"],
      "produces": ["contracts pinned interface", "bridgeTypes InteractPrompt with 'sitdown' and the canvas contract props and callbacks types"],
      "verification_ids": ["EV-001", "EV-002"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-002",
      "covers": {"requirements": ["FR-004", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-013"], "acceptance_criteria": ["AC-006"]},
      "depends_on": ["T-001"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/App.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/SyndicateDrawers.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/PerimeterHud.tsx"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/components/TitleAndEndModals.tsx"}, "mode": "exclusive"}
      ],
      "consumes": ["contracts pinned interface", "canvas contract props and callbacks types"],
      "produces": ["App state, save field, dossier section, HUD chip, betrayal recovery screen"],
      "verification_ids": ["EV-003", "EV-004"],
      "parallel_group": "wave-2",
      "commit_required": true
    },
    {
      "id": "T-003",
      "covers": {"requirements": ["FR-001", "FR-002", "FR-003", "FR-007", "FR-009", "FR-012"], "acceptance_criteria": ["AC-006"]},
      "depends_on": ["T-001"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/components/NycWorldCanvas.tsx"}, "mode": "exclusive"}
      ],
      "consumes": ["contracts pinned interface", "canvas contract props and callbacks types"],
      "produces": ["engine hostility, hit attribution, squads, safe passage, sit-down spot and prompt, wake-up teleport, test hooks"],
      "verification_ids": ["EV-005", "EV-006"],
      "parallel_group": "wave-2",
      "commit_required": true
    },
    {
      "id": "T-004",
      "covers": {"requirements": ["FR-001", "FR-003", "FR-006", "FR-007", "FR-008", "FR-009", "FR-013", "FR-014"], "acceptance_criteria": ["AC-004", "AC-005", "AC-006", "AC-007"]},
      "depends_on": ["T-002", "T-003"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "CLAUDE.md"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/contracts/evidence/smoke.md"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/contracts/evidence/ci-run.md"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/contracts/evidence/whole-change-review.md"}, "mode": "exclusive"}
      ],
      "consumes": ["integrated branch head"],
      "produces": ["hook-driven smoke runs, green Check, viewed tour shots, whole-change review, landing"],
      "verification_ids": ["EV-007", "EV-008", "EV-009", "EV-010"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-005",
      "covers": {"requirements": ["FR-001", "FR-002", "FR-003", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010"], "acceptance_criteria": ["AC-008"]},
      "depends_on": ["T-004"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/contracts/evidence/phone-check.md"}, "mode": "exclusive"}
      ],
      "consumes": ["deployed build on the user's phone"],
      "produces": ["user's written confirmation"],
      "verification_ids": ["EV-011"],
      "parallel_group": null,
      "commit_required": false
    }
  ]
}
<!-- sdd-contract-end -->

# Contracts and Sit-Downs — Implementation Plan

**Path:** `spec-driven-development/contracts/plan.md` · **Revision:** 1 · **Kind:** implementation plan · **Schema:** 1

<!-- sdd-approval-begin -->
**Approval status:** Awaiting user approval
**Approved revision:** Not approved
**Approved normative digest:** Not approved
**Approver:** Not approved
**Approval timestamp:** Not approved
<!-- sdd-approval-end -->

## Goal

Deliver specification revision 1. The plan has three parts:

1. Build every rule as one pure, tested module.
2. Wire that module into the app and the engine as a parallel pair of tasks.
3. Prove the result with smoke runs driven by test hooks, a green Check run and a whole-change review.

## Preflight

- **Branch:** `ertas-del/new/contracts`, in worktree `/home/claude/wt/contracts`, based on `main` at `fd372b8`.
- **Track:** critical. It changes the save data and has 14 requirements.
- **Subagents:** Opus at high effort.
- **Authority:** commits and pushes on the branch are allowed. Merging into main is decided by the user's answer at plan approval.

## Architecture Change Map

| Area | Change |
|---|---|
| `src/world/contracts.ts` (new) | The whole rulebook: grudges, contracts, prices, risk, hostility, sit-down scheduling and windows, outcomes, losses, and parsing of saved data. |
| `src/world/bridgeTypes.ts` | Adds an `InteractPrompt` type `'sitdown'`, and the types for the canvas contract props and callbacks. |
| `src/App.tsx` | Holds the contracts state and saves it as an optional `contracts` field. Feeds hit reports to `recordHarm`. Runs the sit-down and the betrayal recovery. Moves the player to the home station after a death under contract. |
| `src/components/SyndicateDrawers.tsx` | Adds a Contracts section in the Turf tab. |
| `src/components/PerimeterHud.tsx` | Adds one contract chip per family, and the sit-down prompt button. |
| `src/components/TitleAndEndModals.tsx` | Adds the betrayal Recovery variant that lists the losses. |
| `src/components/NycWorldCanvas.tsx` | Takes hostility from `isHostile`. Reports hits and kills. Spawns squads, holds safe passage, marks the sit-down spot and its prompt, holds the bodyguards back, adds `wakeAt`, and adds the `?tour` hooks. |
| `CLAUDE.md` | Adds a contracts paragraph. |

### Pinned interfaces (binding)

`contracts.ts`:
```ts
type FamilyKey = 'corvini'|'bellini'|'valenti'|'moretti'|'rastelli'
interface SitDown { meetAt: number; windowEnd: number; spot: { x: number; y: number; label: string } }
interface FamilyGrudge { points: number; contract: boolean; price: number; kills: number; sitDown: SitDown | null }
interface ContractsState { v: 1; families: Record<FamilyKey, FamilyGrudge> }
CONTRACT_POINTS = 3; HIT_POINTS = 1; KILL_POINTS = 3; BASE_PRICE = 5000; HIT_PRICE = 1500; KILL_PRICE = 4000
BETRAYAL_PRICE = 2500; MISSED_PRICE = 1000; NYPD_HEAT_LINE = 55; WINDOW_MS = 180000; GRACE_MS = 30000
emptyContracts(): ContractsState
parseContracts(raw: unknown): ContractsState                    // never throws; malformed -> empty
recordHarm(s, family, harm: { hits: number; kills: number }): { state: ContractsState; contractStarted: boolean }
isHostile(f: { role; familyId; playerFamily; isTakeoverGuard: boolean; heat: number; now: number; s: ContractsState }): boolean
betrayalRisk(s, family, p: { respectXp: number; ceasefire: boolean }): number      // 0.05..0.75
requestSitDown(s, family, now, rand: () => number, spot): { state; ok: boolean; reason?: string }
windowState(s, family, now): 'none'|'waiting'|'open'|'lapsed'
resumeAfterAbsence(s, lastSeen: number, now: number): ContractsState   // reopens windows that passed while closed
expireLapsed(s, now): { state; lapsed: FamilyKey[] }                   // adds MISSED_PRICE for windows lapsed while playing
attemptSitDown(s, family, p: { now; cash; alone: boolean; respectXp; ceasefire; rand: () => number }):
  { outcome: 'refused'; reason: 'window'|'cash'|'alone' } | { outcome: 'honoured'; state; cost } | { outcome: 'betrayed'; state }
betrayalLosses(p: { cash; respectXp; skillPoints }): { cash; respectXp; skillPoints }   // amounts lost
```

`bridgeTypes.ts` adds `'sitdown'` to `InteractPrompt.type`, and these canvas types:
```ts
ContractsView = { state: ContractsState; heat: number; nowOffsetMs: number }   // prop
onFamilyHarmed(family: FamilyKey, harm: { hits: number; kills: number }): void   // callback
onSitDownChosen(family: FamilyKey, alone: boolean): void                        // callback
wakeAt(x: number, y: number): void                                              // bridge
```

## Binding Fields

The binding fields are:
- task deliverables and coverage;
- the approved constraints;
- the verification obligations;
- the landing boundary;
- the pinned interfaces.

## Adaptable Fields

These may change without re-approval:
- private helpers;
- how attack ids are tracked inside the engine;
- the squad spawn tactics;
- the visual style of the sit-down marker and chip, provided the guardrails still hold.

## Risks and Resolved Assumptions

- **Parallel wave edits the same props.** T-002 and T-003 both work against the props types pinned in `bridgeTypes.ts`. The controller merges them together and runs one type check and one smoke run before anything is pushed.
- **Debug clock.** The `?tour` hook "advance clock" sets `nowOffsetMs`. App and engine use `Date.now() + nowOffsetMs` everywhere a contract time is read, so the hook can move time forward.
- **Respect XP.** The value used is the existing `respectXp`, which starts at 120.

## Requirement Coverage

| Requirement | Tasks |
|---|---|
| FR-001, FR-002, FR-003 | T-001 (rules), T-003 (engine) |
| FR-004, FR-005 | T-001, T-002 |
| FR-006, FR-007, FR-008, FR-009, FR-010 | T-001, T-002, T-003 |
| FR-011 | T-001 (parse), T-002 (save) |
| FR-012 | T-001, T-003 |
| FR-013 | T-002 |
| FR-014 | T-004 |

## Verification Coverage

| Criterion | Task | Evidence | Proof |
|---|---|---|---|
| AC-001, AC-002, AC-003 | T-001 | EV-001 | `node --test src/world/contracts.test.ts` passes |
| AC-006 | T-001, T-002, T-003 | EV-002, EV-004, EV-006 | A fresh reviewer for each task |
| AC-006 | T-002, T-003 | EV-003, EV-005 | The worker's smoke screenshots plus the controller's single run of all tests and the type check |
| AC-004, AC-005 | T-004 | EV-007 | A smoke run on the integrated build, driven by the hooks, recorded in `evidence/smoke.md` |
| AC-007 | T-004 | EV-008 | Check is green on the head, and the tour screenshots have been viewed |
| AC-006 | T-004 | EV-009 | A fresh whole-change reviewer |
| (landing) | T-004 | EV-010 | The merge record |
| AC-008 | T-005 | EV-011 | The user's written confirmation |

## Dependency Graph

1. T-001 runs first.
2. T-002 and T-003 then run in parallel as wave 2, on separate worktrees with disjoint files.
3. T-004 follows.
4. T-005 runs after the landing.

## Task Contracts

### T-001

- **Deliverable:** the pure contracts rulebook and the shared types.
- **Covers:** FR-001, FR-002, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012; AC-001, AC-002, AC-003.
- **Ownership:** `src/world/contracts.ts`, `src/world/contracts.test.ts`, `src/world/bridgeTypes.ts`.
- **Concrete change:** implement the pinned interface exactly as the spec's Depth and Defaults table words it. Time comes in as `now` and randomness as `rand`, so tests control both.
- **Verification:** EV-001 runs the tests for AC-001 to AC-003 exactly as worded, plus a clean type check. EV-002 is a fresh Opus reviewer.
- **Delegation:** a fresh Opus worker, then a fresh Opus reviewer.
- **Done when:** EV-001 and EV-002 pass.

### T-002

- **Deliverable:** contracts in the app: the save, the dossier section, the HUD chip and the recovery flows.
- **Covers:** FR-004, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-013; AC-006.
- **Ownership:** `src/App.tsx`, `src/components/SyndicateDrawers.tsx`, `src/components/PerimeterHud.tsx`, `src/components/TitleAndEndModals.tsx`.
- **Concrete change:**
  - **Saving and loading.** Contracts state lives in App and is saved as an optional field. On load it goes through `parseContracts` and then `resumeAfterAbsence(lastSaveTimestamp)`.
  - **Hits.** `onFamilyHarmed` passes each hit to `recordHarm` and shows a grudge or contract toast.
  - **Time tick.** A 1-second tick runs `expireLapsed`.
  - **Requesting a sit-down.** The dossier's Request button calls `requestSitDown` with a spot chosen from the family's rackets or home station.
  - **Sitting down.** `onSitDownChosen` runs `attemptSitDown` with the shared random function.
    - Honoured: the cost is paid and a toast shows.
    - Betrayed: `betrayalLosses` is applied, the betrayal Recovery variant shows, and the player wakes at the home station.
    - Refused: a toast gives the reason.
  - **Ordinary death under a contract.** The usual Recovery runs, and the player is woken at the home station with 30 seconds of grace.
  - **HUD.** One chip per family with an active contract, plus the sit-down prompt button. Controls use `touch:min-h-11`, and numbers use `font-mono tabular-nums`.
  - **Engine wiring.** App passes `ContractsView` to the canvas and wires the callbacks.
- **Verification:**
  - EV-003: all unit tests pass; the global type check with stubs is clean apart from the canvas props that T-003 adds; the worker's esbuild smoke screenshots show the dossier section, the chip and the betrayal screen.
  - EV-004: a fresh Opus reviewer.
- **Delegation:** a fresh Opus worker, in worktree `/home/claude/wt/contracts-app`.
- **Done when:** EV-003 and EV-004 pass.

### T-003

- **Deliverable:** peace, grudges, squads and sit-downs on the street.
- **Covers:** FR-001, FR-002, FR-003, FR-007, FR-009, FR-012; AC-006.
- **Ownership:** `src/components/NycWorldCanvas.tsx`.
- **Concrete change:**
  - **Hostility.** Replace `isHostileByDefault` with `isHostile`, checked at patrol, windup and cooldown. When an NPC stops being hostile it goes back to patrol.
  - **When there is no contract.** A hit NPC without a contract backs away instead of winding up. Allies target only hostile NPCs.
  - **Hit and kill reports.** Each attack gets an id. One report per attack per NPC goes to `onFamilyHarmed`, and a kill reports `{hits: 0, kills: 1}`.
  - **Squads and safe passage.** While a family has a contract and no open window, a squad of 2 or 3 spawns every 90 to 150 s of play, with at most one per family. During that family's window it holds fire and sends no squads.
  - **Bodyguards.** Enforcer bodyguards hold back at least 500 px during any open window.
  - **The sit-down spot.** The spot is marked. Within 60 px during the window, a `'sitdown'` prompt shows the price and risk, and E or a tap calls `onSitDownChosen`, passing whether the player is alone.
  - **Waking.** Add `wakeAt` to the bridge.
  - **Test hooks.** Only with `?tour`, `__cityTour` also gets `setHeat`, `addGrudge`, `advanceClock` and `spawnSquad`. Advancing the clock moves `nowOffsetMs` through a callback to App.
- **Verification:**
  - EV-005: all unit tests pass; the type check is clean in the file; the esbuild smoke run shows 0 page errors, peaceful walking and a squad hunting after `addGrudge`.
  - EV-006: a fresh Opus reviewer.
- **Delegation:** a fresh Opus worker, in worktree `/home/claude/wt/contracts-engine`.
- **Done when:** EV-005 and EV-006 pass.

### T-004

- **Deliverable:** a verified, integrated branch, landed as the user allows.
- **Covers:** FR-001, FR-003, FR-006, FR-007, FR-008, FR-009, FR-013, FR-014; AC-004, AC-005, AC-006, AC-007.
- **Ownership:** `CLAUDE.md` and the evidence files `smoke.md`, `ci-run.md` and `whole-change-review.md`.
- **Concrete change:**
  1. Merge T-002 and T-003, then run the tests and type check once.
  2. Run the hook-driven smoke scripts for AC-004 and AC-005, and view their screenshots.
  3. Update `CLAUDE.md`.
  4. Push, then read Check and rebuild the tour shots.
  5. Get a fresh whole-change review.
  6. Land.
- **Verification:**
  - EV-007: the smoke runs.
  - EV-008: Check is green and the shots are viewed.
  - EV-009: the whole-change review passes.
  - EV-010: the landing record.
- **Done when:** all of these pass and the landing is complete.

### T-005

- **Deliverable:** the user's phone check.
- **Covers:** FR-001, FR-002, FR-003, FR-006, FR-007, FR-008, FR-009, FR-010; AC-008.
- **Ownership:** the evidence file `phone-check.md`.
- **Verification:** EV-011, the user's written confirmation.

## Execution and Landing

T-001 runs first, then the wave of T-002 and T-003, then T-004, then T-005. Verification runs once at each boundary.

Landing happens in this order:
1. The branch is committed and pushed.
2. It is merged into main if the user allows it at plan approval, once Check is green and the whole-change review passes. Otherwise it is parked as a pushed branch.
3. Pages deploys automatically on the merge.

## Plan Readiness Review

- The plan is bound to spec revision 1 and its digest.
- Every FR and AC is covered.
- The wave's file ownership is disjoint, and the shared types are pinned in `bridgeTypes.ts` by T-001.
- Every piece of evidence has a command or a named reviewer.
