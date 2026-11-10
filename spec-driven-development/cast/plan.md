<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "implementation-plan",
  "plan_id": "cast-plan",
  "revision": 1,
  "path": {"scope": "repository", "value": "spec-driven-development/cast/plan.md"},
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
    "path": {"scope": "repository", "value": "spec-driven-development/cast/spec.md"},
    "revision": 2,
    "digest": "a645a6dfdcceb58ef7e0a766f280993d13a921d58ec3f42f5b80838fe80d37c9"
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
      "covers": {"requirements": ["FR-001", "FR-002", "FR-008", "FR-009"], "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004"]},
      "depends_on": [],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/world/cast.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/world/characterSprite.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/world/tagLayout.ts"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "src/world/cast.test.ts"}, "mode": "exclusive"}
      ],
      "consumes": ["approved specification", "ertas-del/Mafia-game noirPresets.ts and Character2DModelPreview.tsx at b4c8784"],
      "produces": ["cast, characterSprite and tagLayout pinned interfaces"],
      "verification_ids": ["EV-001"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-002",
      "covers": {"requirements": ["FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010"], "acceptance_criteria": ["AC-005"]},
      "depends_on": ["T-001"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "src/components/NycWorldCanvas.tsx"}, "mode": "exclusive"}
      ],
      "consumes": ["cast, characterSprite and tagLayout pinned interfaces"],
      "produces": ["engine drawing every body and the player from cached figures"],
      "verification_ids": ["EV-002"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-003",
      "covers": {"requirements": ["FR-011"], "acceptance_criteria": ["AC-005", "AC-006"]},
      "depends_on": ["T-002"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "CLAUDE.md"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/cast/evidence/ci-run.md"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/cast/evidence/tour-shots.md"}, "mode": "exclusive"},
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/cast/evidence/whole-change-review.md"}, "mode": "exclusive"}
      ],
      "consumes": ["pushed branch head"],
      "produces": ["green Check, tour screenshots, whole-change review, merge into main"],
      "verification_ids": ["EV-003", "EV-004", "EV-005"],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-004",
      "covers": {"requirements": ["FR-004", "FR-005", "FR-006", "FR-007", "FR-008"], "acceptance_criteria": ["AC-007"]},
      "depends_on": ["T-003"],
      "ownership": [
        {"type": "file", "path": {"scope": "repository", "value": "spec-driven-development/cast/evidence/phone-check.md"}, "mode": "exclusive"}
      ],
      "consumes": ["deployed or locally served build on the user's phone"],
      "produces": ["user's written confirmation"],
      "verification_ids": ["EV-006"],
      "parallel_group": null,
      "commit_required": false
    }
  ]
}
<!-- sdd-contract-end -->

# The 50-Character Street Cast — Implementation Plan

**Path:** `spec-driven-development/cast/plan.md` · **Revision:** 1 · **Kind:** implementation plan · **Schema:** 1

<!-- sdd-approval-begin -->
**Approval status:** Awaiting user approval
**Approved revision:** Not approved
**Approved normative digest:** Not approved
**Approver:** Not approved
**Approval timestamp:** Not approved
<!-- sdd-approval-end -->

## Goal

Deliver specification revision 2. That revision adds PATCH-001, the Santoro and Russo renames, and is approved together with this plan. The work is in three parts:
1. Pure, tested modules for the 50 characters, their code-drawn figures and the tag layout.
2. The engine drawing every person from those figures.
3. Green CI, then a merge into main.

## Preflight

- **Branch and baseline:** branch `ertas-del/new/cast` in worktree `/home/claude/wt/cast`, from `main` at `77f738f`.
- **Track:** standard.
- **Subagents:** Opus, at high effort.
- **Authority:** commits and pushes on the branch are authorized. Merging into main is authorized once Check is green and the whole-change review passes. Repository settings and the Mafia-game repository are out of bounds.

## Architecture Change Map

| Area | Change |
|---|---|
| `src/world/cast.ts` (new) | Holds the 50 characters, pool assignment and unnamed trait sets. |
| `src/world/characterSprite.ts` (new) | A canvas port of `street-3q` that draws and bakes the figures. |
| `src/world/tagLayout.ts` (new) | Places the name tags so they never overlap. |
| `src/components/NycWorldCanvas.tsx` | Gets its names from the pool. Draws people from baked figures. Replaces the old tag drawing with the layout. Deletes the real-name list. |
| `CLAUDE.md` | A paragraph describing the cast. |

### Pinned interfaces (binding)

**`cast.ts`**
```ts
type CastFamily = 'corvini'|'bellini'|'valenti'|'moretti'|'rastelli'|'outside'
interface CharacterTraits { headgear; eyewear; outfit; heldItem; build; facialHairOrScar; hairColorHex; primaryGarmentHex; secondaryGarmentHex }
```
The first six traits are string unions copied from Mafia-game; the three colour traits are hex strings.
```ts
interface CastMember { id; num; name; role; bio; familyId: CastFamily; traits: CharacterTraits }
CAST: readonly CastMember[]          // 50 entries
createCastPool(): { take(familyId: CastFamily, filter?: (m) => boolean): CastMember | null; release(id: string): void; inUse(): ReadonlySet<string> }
genericTraits(kind: 'civilian'|'officer'|'ally'|'player', seed: number, familyId?: CastFamily): CharacterTraits
```

**`characterSprite.ts`**
```ts
FIGURE_W = 100; FIGURE_H = 120                                  // local drawing box
drawCharacter(ctx, traits, accentHex): void                     // draws in the 0..100 × 0..120 box, camera-facing three-quarter view
bakeCharacter(traits, accentHex, makeCanvas: (w, h) => CanvasLike | null, scale): CanvasLike | null
traitSignature(traits): string
```

**`tagLayout.ts`**
```ts
layoutTags(reqs: { id; x; y; w; h; priority: number }[], max = 4): { id; x; y }[]
```
Higher priority is placed first. Lower-priority tags move upward to clear the ones already placed, or are dropped. The result never holds more than `max` tags and no two of them overlap.

## Binding Fields

The binding items are:
- the task deliverables and coverage;
- the approved constraints;
- the verification obligations;
- the landing boundary;
- the pinned interfaces.

## Adaptable Fields

The worker may decide:
- private helper names and internal drawing tactics;
- the exact figure scale, as long as figures are about 44 px tall in the world;
- the cache-key scheme;
- the worker assignment.

## Risks and Resolved Assumptions

- **Trait values.** The trait unions in Mafia-game are the source of truth. The worker copies them exactly, and AC-001 checks that every character uses only those values.
- **Mirroring.** Mirroring is done with `ctx.scale(-1, 1)` at draw time, so each figure is baked once, not twice.
- **Hit flash.** It is a white silhouette pass using `source-atop` on a small reusable scratch canvas, or a second baked flash image per figure. The worker picks one; the cost is bounded either way.

## Requirement Coverage

| Requirement | Task |
|---|---|
| FR-001, FR-002, FR-009 | T-001 |
| FR-008 | T-001 (layout), T-002 (use) |
| FR-003, FR-004, FR-005, FR-006, FR-007, FR-010 | T-002 |
| FR-011 | T-003 |

## Verification Coverage

| Criterion | Task | Evidence | Proof |
|---|---|---|---|
| AC-001, AC-002, AC-003, AC-004 | T-001 | EV-001 | `node --test src/world/cast.test.ts` passes |
| AC-005 | T-002, T-003 | EV-002, EV-005 | Controller smoke run of the esbuild build. Fresh whole-change reviewer. |
| AC-006 | T-003 | EV-003, EV-004 | Check is green on the branch head. The tour screenshots are rebuilt from the log and viewed. |
| AC-007 | T-004 | EV-006 | The user's written confirmation. |

## Dependency Graph

T-001, then T-002, then T-003, then T-004. Every task is sequential because T-002 consumes T-001's interfaces. Nothing runs as a wave.

## Task Contracts

### T-001

- **Deliverable.** Pure, tested cast, figure and tag-layout modules.
- **Covers.** FR-001, FR-002, FR-008, FR-009; AC-001, AC-002, AC-003, AC-004.
- **Dependencies.** None.
- **Ownership.** `src/world/cast.ts`, `src/world/characterSprite.ts`, `src/world/tagLayout.ts`, `src/world/cast.test.ts`.
- **Interfaces consumed.** From Mafia-game at `b4c8784`:
  - `src/data/noirPresets.ts`: the 50 bible entries, trait unions and family colours;
  - `src/components/Character2DModelPreview.tsx`, `street-3q` mode.
- **Interfaces produced.** The ones pinned above.
- **Concrete change.**
  1. Copy each entry's id, number, name, role, bio, family and traits. Rename the five surnames in D3 to the replacements in the Depth and Defaults table.
  2. Port the `street-3q` SVG shapes to Canvas 2D path calls, one part at a time.
  3. Build `genericTraits` from seeded picks over the trait unions.
  4. Write the pool so it hands out unused members of a family, with `null` once the family is exhausted.
  5. Write the tag layout.
  6. Write `cast.test.ts` for AC-001 to AC-004 exactly as worded in the spec.
- **Verification.** EV-001: `node --test src/world/cast.test.ts` and all existing tests pass. Global `tsc` with the world tsconfig is clean.
- **Documentation and rollback.** The worker proposes the CLAUDE.md lines. Revert the commit to roll back.
- **Delegation.** A fresh Opus worker at high effort. The task is expected to exceed 300 lines.
- **Commit boundary.** One commit.
- **Done.** EV-001 passes, and the controller has checked scope and run the tests once.

### T-002

- **Deliverable.** The engine draws every person and the player from cached figures, and tags never overlap.
- **Covers.** FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010; AC-005.
- **Dependencies.** T-001.
- **Ownership.** `src/components/NycWorldCanvas.tsx`.
- **Interfaces consumed.** T-001's pinned interfaces.
- **Concrete change.**
  - **Naming.**
    - Delete the real-name list.
    - Each `WorldNpc` gets an optional `castId` and a traits key.
    - Street family NPCs, turf Capos and button men take members from one pool per mount. The six outside characters go one each into game boroughs as named citizens. The two outside cops head NYPD spawns. Everything else gets `genericTraits`.
    - Release the member on death or despawn, and take again on respawn.
  - **Figures.**
    - Bake each figure lazily into a small cache keyed by trait signature and accent, at about 44 px tall.
    - Draw each person anchored at their feet, mirrored by facing, with the held weapon pointing along `angle`.
    - Keep the hit flash, the squash, the windup arc and the laser line.
    - The player is a figure built from the family's look, with a gold ring.
  - **Tags.** Remove the always-on family tag. Build tag requests for engaged, damaged, Capo and courier NPCs, plus the nearest NPC within 160 px. Draw what `layoutTags` returns: name, family and health bar.
  - **Leave unchanged.** Collision, AI, combat, counts and the save.
- **Verification.** EV-002:
  - all unit tests pass;
  - the esbuild smoke run has 0 page errors;
  - canvas screenshots show figures in at least three boroughs plus a crowd with tags not overlapping;
  - a temporary debug check confirms that no two living NPCs share a `castId`.
- **Delegation.** A fresh Opus worker at high effort, because the change replaces about 300 lines of drawing.
- **Commit boundary.** One commit.
- **Done.** EV-002 passes.

### T-003

- **Deliverable.** A verified branch merged into main.
- **Covers.** FR-011; AC-005, AC-006.
- **Dependencies.** T-002.
- **Ownership.** `CLAUDE.md` and the evidence files `ci-run.md`, `tour-shots.md` and `whole-change-review.md`.
- **Concrete change.**
  1. Add the CLAUDE.md paragraph.
  2. Push the branch.
  3. Read the Check log.
  4. Rebuild the six tour JPEGs and view them.
  5. Run a fresh Opus whole-change reviewer.
  6. Merge into main.
- **Verification.**
  - EV-003: Check run green on the head.
  - EV-004: the screenshots, viewed and described.
  - EV-005: the whole-change review passes.
- **Done.** All three pass and the merge is pushed.

### T-004

- **Deliverable.** The user's phone check.
- **Covers.** FR-004, FR-005, FR-006, FR-007, FR-008; AC-007.
- **Ownership.** The evidence file `phone-check.md`.
- **Dependencies.** T-003. It also needs the user to enable Pages, or another way to get the build onto the phone.
- **Verification.** EV-006: the user's written confirmation.
- **Done.** The user confirms.

## Execution and Landing

The tasks run in order, T-001 to T-004. Verification runs once per boundary. Ledger writes happen twice per task.

Landing goes in this order:
1. Commit and push the branch.
2. Merge into main once Check is green and the whole-change review passes.
3. The deploy follows when Pages is enabled.
4. The workflow parks for T-004.

## Plan Readiness Review

- The plan is bound to specification revision 2 and its digest.
- Every FR and AC is covered, and no task covers an unknown id.
- The tasks are slices. T-001 is a whole deliverable with its own tests.
- Every EV has a command or a named reviewer.
- Nothing is implemented before plan approval.
