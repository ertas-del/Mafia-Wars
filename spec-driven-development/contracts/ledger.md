<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "execution-ledger",
  "workflow_id": "contracts",
  "path": {
    "scope": "repository",
    "value": "spec-driven-development/contracts/ledger.md"
  },
  "required_sections": [
    "Bindings",
    "Authority",
    "Workflow History",
    "Task State",
    "Amendments",
    "Evidence",
    "Landing State"
  ],
  "specification": {
    "path": {
      "scope": "repository",
      "value": "spec-driven-development/contracts/spec.md"
    },
    "revision": 1,
    "digest": "5458ebbc0d3f3a5aad143b86fa8645ac212a8982430b9ff9e24ffa324d68f5c9"
  },
  "plan": {
    "path": {
      "scope": "repository",
      "value": "spec-driven-development/contracts/plan.md"
    },
    "revision": 1,
    "digest": "ac173d913db67516f494e0a29ace7c9d07926582bd4b35414d5a0a77b792dec5"
  },
  "current_state": "AWAITING_PLAN_APPROVAL",
  "effective_tasks": [
    {
      "id": "T-001",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-002",
          "FR-004",
          "FR-005",
          "FR-006",
          "FR-007",
          "FR-008",
          "FR-009",
          "FR-010",
          "FR-011",
          "FR-012"
        ],
        "acceptance_criteria": [
          "AC-001",
          "AC-002",
          "AC-003"
        ]
      },
      "depends_on": [],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/contracts.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/contracts.test.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/bridgeTypes.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "approved specification"
      ],
      "produces": [
        "contracts pinned interface",
        "bridgeTypes InteractPrompt with 'sitdown' and the canvas contract props and callbacks types"
      ],
      "verification_ids": [
        "EV-001",
        "EV-002"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-002",
      "covers": {
        "requirements": [
          "FR-004",
          "FR-006",
          "FR-007",
          "FR-008",
          "FR-009",
          "FR-010",
          "FR-011",
          "FR-013"
        ],
        "acceptance_criteria": [
          "AC-006"
        ]
      },
      "depends_on": [
        "T-001"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/App.tsx"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/components/SyndicateDrawers.tsx"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/components/PerimeterHud.tsx"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/components/TitleAndEndModals.tsx"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/data/nyc1984Data.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "contracts pinned interface",
        "canvas contract props and callbacks types"
      ],
      "produces": [
        "App state, save field, dossier section, HUD chip, betrayal recovery screen"
      ],
      "verification_ids": [
        "EV-003",
        "EV-004"
      ],
      "parallel_group": "wave-2",
      "commit_required": true
    },
    {
      "id": "T-003",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-002",
          "FR-003",
          "FR-007",
          "FR-009",
          "FR-012"
        ],
        "acceptance_criteria": [
          "AC-006"
        ]
      },
      "depends_on": [
        "T-001"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/components/NycWorldCanvas.tsx"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "contracts pinned interface",
        "canvas contract props and callbacks types"
      ],
      "produces": [
        "engine hostility, hit attribution, squads, safe passage, sit-down spot and prompt, wake-up teleport, test hooks"
      ],
      "verification_ids": [
        "EV-005",
        "EV-006"
      ],
      "parallel_group": "wave-2",
      "commit_required": true
    },
    {
      "id": "T-004",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-003",
          "FR-006",
          "FR-007",
          "FR-008",
          "FR-009",
          "FR-013",
          "FR-014"
        ],
        "acceptance_criteria": [
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007"
        ]
      },
      "depends_on": [
        "T-002",
        "T-003"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "CLAUDE.md"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "scripts/contracts-smoke.mjs"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/contracts/evidence/smoke.md"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/contracts/evidence/ci-run.md"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/contracts/evidence/whole-change-review.md"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "integrated branch head"
      ],
      "produces": [
        "hook-driven smoke runs, green Check, viewed tour shots, whole-change review, landing"
      ],
      "verification_ids": [
        "EV-007",
        "EV-008",
        "EV-009",
        "EV-010"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-005",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-002",
          "FR-003",
          "FR-006",
          "FR-007",
          "FR-008",
          "FR-009",
          "FR-010"
        ],
        "acceptance_criteria": [
          "AC-008"
        ]
      },
      "depends_on": [
        "T-004"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/contracts/evidence/phone-check.md"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "deployed build on the user's phone"
      ],
      "produces": [
        "user's written confirmation"
      ],
      "verification_ids": [
        "EV-011"
      ],
      "parallel_group": null,
      "commit_required": false
    }
  ],
  "amendments": [],
  "completion_evidence": {
    "final_verification": [],
    "blocking_findings": [],
    "documentation": "pending"
  },
  "authority": {
    "sources": [
      "user answers in the current session",
      "repository instructions: CLAUDE.md",
      "track: critical — the save data changes and the spec has 14 requirements",
      "subagents: opus, effort high — user answer at preflight"
    ],
    "permitted_external_effects": [
      "local repository edits and commits on branch ertas-del/new/contracts",
      "push of branch ertas-del/new/contracts"
    ],
    "prohibited_external_effects": [
      "merge into main without the user's go-ahead",
      "repository settings, visibility, Pages settings and releases"
    ]
  },
  "lifecycle": {
    "workspace_resolved_before_artifacts": true,
    "ledger_external": false,
    "approved_artifacts_retained": true,
    "cutoff_snapshot": {
      "required": false,
      "path": null,
      "event": null
    }
  },
  "landing": {
    "implemented": "not-yet",
    "verified": "not-yet",
    "committed": "not-yet",
    "merged": "not-yet",
    "pushed": "not-yet",
    "deployed": "not-yet",
    "emulator_tested": "not-required",
    "device_tested": "not-yet",
    "released": "not-authorized"
  },
  "workflow_transitions": [
    {
      "sequence": 1,
      "event_sequence": 1,
      "from": null,
      "to": "PREFLIGHT",
      "evidence": "Worktree /home/claude/wt/contracts on ertas-del/new/contracts from main at fd372b8; CLAUDE.md read"
    },
    {
      "sequence": 2,
      "event_sequence": 2,
      "from": "PREFLIGHT",
      "to": "CLARIFICATION",
      "evidence": "User asked for contract-only combat; subagents Opus, effort high"
    },
    {
      "sequence": 3,
      "event_sequence": 3,
      "from": "CLARIFICATION",
      "to": "SPEC_DRAFT",
      "evidence": "User answers on trigger, hunters, clearing, NYPD, saving, sit-downs, price, grudge, betrayal, losses and backup"
    },
    {
      "sequence": 4,
      "event_sequence": 4,
      "from": "SPEC_DRAFT",
      "to": "AWAITING_SPEC_APPROVAL",
      "evidence": "spec.md revision 1 validated, critic-reviewed and presented"
    },
    {
      "sequence": 5,
      "event_sequence": 6,
      "from": "AWAITING_SPEC_APPROVAL",
      "to": "PLAN_DRAFT",
      "evidence": "user answered 'I approve'"
    },
    {
      "sequence": 6,
      "event_sequence": 7,
      "from": "PLAN_DRAFT",
      "to": "AWAITING_PLAN_APPROVAL",
      "evidence": "plan.md revision 1 validated, critic-reviewed and presented"
    }
  ],
  "artifact_events": [
    {
      "event_sequence": 5,
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 1,
      "digest": "5458ebbc0d3f3a5aad143b86fa8645ac212a8982430b9ff9e24ffa324d68f5c9",
      "approver": "User in the current session",
      "timestamp": "2026-11-10T16:40:58-07:00"
    }
  ],
  "tasks": [
    {
      "id": "T-001",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-002",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-001"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-003",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-001"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-004",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-002",
        "T-003"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-005",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-004"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    }
  ],
  "acceptance_evidence": [
    {
      "criterion": "AC-001",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-002",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-003",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-004",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-005",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-006",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-007",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-008",
      "status": "pending",
      "evidence": []
    }
  ]
}
<!-- sdd-contract-end -->

# Contracts Execution Ledger

## Bindings

Specification revision 1 is approved; plan revision 1 is presented for approval.

## Authority

Commits and a push of the feature branch are authorized. A merge into main needs the user's go-ahead. Repository settings and Pages stay the user's.

## Workflow History

Preflight and clarification are done; specification revision 1 is approved and planning has begun.

## Task State

T-001, T-002, T-003, T-004 and T-005 are PENDING until plan approval.

## Amendments

None.

## Evidence

Planned evidence: EV-001, EV-002, EV-003, EV-004, EV-005, EV-006, EV-007, EV-008, EV-009, EV-010, EV-011. Requirements FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014 are not implemented; criteria AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008 are pending.

## Landing State

Nothing is implemented.
