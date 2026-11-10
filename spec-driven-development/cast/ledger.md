<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "execution-ledger",
  "workflow_id": "cast",
  "path": {
    "scope": "repository",
    "value": "spec-driven-development/cast/ledger.md"
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
      "value": "spec-driven-development/cast/spec.md"
    },
    "revision": 2,
    "digest": "a645a6dfdcceb58ef7e0a766f280993d13a921d58ec3f42f5b80838fe80d37c9"
  },
  "plan": {
    "path": {
      "scope": "repository",
      "value": "spec-driven-development/cast/plan.md"
    },
    "revision": 1,
    "digest": "0ee435d2f597b808db421a198addf482c21dd8a34e90eb188510db93efa8d5b0"
  },
  "current_state": "EXECUTING",
  "effective_tasks": [
    {
      "id": "T-001",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-002",
          "FR-008",
          "FR-009"
        ],
        "acceptance_criteria": [
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004"
        ]
      },
      "depends_on": [],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/cast.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/characterSprite.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/tagLayout.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/cast.test.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "approved specification",
        "ertas-del/Mafia-game noirPresets.ts and Character2DModelPreview.tsx at b4c8784"
      ],
      "produces": [
        "cast, characterSprite and tagLayout pinned interfaces"
      ],
      "verification_ids": [
        "EV-001"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-002",
      "covers": {
        "requirements": [
          "FR-003",
          "FR-004",
          "FR-005",
          "FR-006",
          "FR-007",
          "FR-008",
          "FR-009",
          "FR-010"
        ],
        "acceptance_criteria": [
          "AC-005"
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
        "cast, characterSprite and tagLayout pinned interfaces"
      ],
      "produces": [
        "engine drawing every body and the player from cached figures"
      ],
      "verification_ids": [
        "EV-002"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-003",
      "covers": {
        "requirements": [
          "FR-011"
        ],
        "acceptance_criteria": [
          "AC-005",
          "AC-006"
        ]
      },
      "depends_on": [
        "T-002"
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
            "value": "spec-driven-development/cast/evidence/ci-run.md"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/cast/evidence/tour-shots.md"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/cast/evidence/whole-change-review.md"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "pushed branch head"
      ],
      "produces": [
        "green Check, tour screenshots, whole-change review, merge into main"
      ],
      "verification_ids": [
        "EV-003",
        "EV-004",
        "EV-005"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-004",
      "covers": {
        "requirements": [
          "FR-004",
          "FR-005",
          "FR-006",
          "FR-007",
          "FR-008"
        ],
        "acceptance_criteria": [
          "AC-007"
        ]
      },
      "depends_on": [
        "T-003"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/cast/evidence/phone-check.md"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "deployed or locally served build on the user's phone"
      ],
      "produces": [
        "user's written confirmation"
      ],
      "verification_ids": [
        "EV-006"
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
      "track: standard — 11 requirements, no save, schema, security or interface change",
      "subagents: opus, effort high — user answer at preflight"
    ],
    "permitted_external_effects": [
      "local repository edits and commits on branch ertas-del/new/cast",
      "push of branch ertas-del/new/cast",
      "merge into main once Check is green and the whole-change review passes (user answer before planning)"
    ],
    "prohibited_external_effects": [
      "repository settings, visibility, Pages settings and releases",
      "writes to ertas-del/Mafia-game"
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
    "deployed": "not-authorized",
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
      "evidence": "Worktree /home/claude/wt/cast on ertas-del/new/cast from main at 77f738f; CLAUDE.md read"
    },
    {
      "sequence": 2,
      "event_sequence": 2,
      "from": "PREFLIGHT",
      "to": "CLARIFICATION",
      "evidence": "User asked to bring in the 50 Mafia-game characters; subagents Opus, effort high"
    },
    {
      "sequence": 3,
      "event_sequence": 3,
      "from": "CLARIFICATION",
      "to": "SPEC_DRAFT",
      "evidence": "User answers: full-body sprites, player sprite in family look, rename Vitale/Amato/Carbone, leave contact ids"
    },
    {
      "sequence": 4,
      "event_sequence": 4,
      "from": "SPEC_DRAFT",
      "to": "AWAITING_SPEC_APPROVAL",
      "evidence": "spec.md revision 1 validated and presented"
    },
    {
      "sequence": 5,
      "event_sequence": 6,
      "from": "AWAITING_SPEC_APPROVAL",
      "to": "PLAN_DRAFT",
      "evidence": "user answered 'I approve the spec'; also asked to swap Santoro and Russo (to ride with plan approval as a patch) and granted merge into main when green"
    },
    {
      "sequence": 6,
      "event_sequence": 8,
      "from": "PLAN_DRAFT",
      "to": "SPEC_DRAFT",
      "evidence": "PATCH-001 applied to spec.md as revision 2"
    },
    {
      "sequence": 7,
      "event_sequence": 9,
      "from": "SPEC_DRAFT",
      "to": "AWAITING_SPEC_APPROVAL",
      "evidence": "spec.md revision 2 presented; plan.md revision 1 (digest 0ee435d2f597b808db421a198addf482c21dd8a34e90eb188510db93efa8d5b0) presented alongside, bound after the spec approval"
    },
    {
      "sequence": 8,
      "event_sequence": 11,
      "from": "AWAITING_SPEC_APPROVAL",
      "to": "PLAN_DRAFT",
      "evidence": "user answered 'I approve both'"
    },
    {
      "sequence": 9,
      "event_sequence": 12,
      "from": "PLAN_DRAFT",
      "to": "AWAITING_PLAN_APPROVAL",
      "evidence": "plan.md revision 1 presented with spec revision 2"
    },
    {
      "sequence": 10,
      "event_sequence": 14,
      "from": "AWAITING_PLAN_APPROVAL",
      "to": "READY",
      "evidence": "user answered 'I approve both'"
    },
    {
      "sequence": 11,
      "event_sequence": 15,
      "from": "READY",
      "to": "EXECUTING",
      "evidence": "T-001 dispatch"
    }
  ],
  "artifact_events": [
    {
      "event_sequence": 5,
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 1,
      "digest": "3bd4a3e80c9ae2be8d29832ce127a780c2f6483759f02adbf2c7133b6b25dc6a",
      "approver": "User in the current session",
      "timestamp": "2026-11-10T12:13:12-07:00"
    },
    {
      "event_sequence": 7,
      "event": "INVALIDATED",
      "artifact_kind": "specification",
      "revision": 1,
      "digest": "3bd4a3e80c9ae2be8d29832ce127a780c2f6483759f02adbf2c7133b6b25dc6a",
      "reason": "patches/PATCH-001.md: also rename Santoro and Russo, asked at spec approval; rides with plan approval"
    },
    {
      "event_sequence": 10,
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 2,
      "digest": "a645a6dfdcceb58ef7e0a766f280993d13a921d58ec3f42f5b80838fe80d37c9",
      "approver": "User in the current session",
      "timestamp": "2026-11-10T15:04:56-07:00"
    },
    {
      "event_sequence": 13,
      "event": "APPROVED",
      "artifact_kind": "implementation-plan",
      "revision": 1,
      "digest": "0ee435d2f597b808db421a198addf482c21dd8a34e90eb188510db93efa8d5b0",
      "approver": "User in the current session",
      "timestamp": "2026-11-10T15:04:56-07:00"
    }
  ],
  "tasks": [
    {
      "id": "T-001",
      "state": "DONE",
      "owner": "Opus worker, effort high",
      "dependencies": [],
      "worktree": "/home/claude/wt/cast",
      "branch": "ertas-del/new/cast",
      "baseline": "5ce659e",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 16,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [],
          "evidence": "no dependencies"
        },
        {
          "sequence": 2,
          "event_sequence": 17,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-001 dispatched to a fresh Opus worker"
        },
        {
          "sequence": 3,
          "event_sequence": 18,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "commit 98988d5: cast.ts, characterSprite.ts, tagLayout.ts, cast.test.ts"
        },
        {
          "sequence": 4,
          "event_sequence": 19,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-001",
          "evidence": "controller run: evidence/EV-001-cast-tests.txt passes; all 63 unit tests pass; contact sheet viewed (evidence/cast-contact-sheet.png)"
        },
        {
          "sequence": 5,
          "event_sequence": 20,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "controller scope check (standard track; whole-change review under T-003)",
          "evidence": "only the four owned files changed; deviations accepted: renamed ids, assignCast fallback beside the pinned take, extra exports"
        },
        {
          "sequence": 6,
          "event_sequence": 21,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-001",
          "review_evidence": "controller scope check",
          "commit": "98988d5",
          "evidence": "committed on ertas-del/new/cast"
        },
        {
          "sequence": 7,
          "event_sequence": 22,
          "from": "COMMITTED",
          "to": "DONE",
          "verification_evidence": "EV-001",
          "review_evidence": "controller scope check",
          "commit": "98988d5",
          "evidence": "EV-001 passes; scope checked"
        }
      ],
      "evidence": [
        "EV-001"
      ]
    },
    {
      "id": "T-002",
      "state": "DONE",
      "owner": "Opus worker, effort high",
      "dependencies": [
        "T-001"
      ],
      "worktree": "/home/claude/wt/cast",
      "branch": "ertas-del/new/cast",
      "baseline": "98988d5",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 23,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001"
          ],
          "evidence": "T-001 done at 98988d5"
        },
        {
          "sequence": 2,
          "event_sequence": 24,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-002 dispatched to a fresh Opus worker"
        },
        {
          "sequence": 3,
          "event_sequence": 25,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "commit 0ad78ba: NycWorldCanvas.tsx only"
        },
        {
          "sequence": 4,
          "event_sequence": 26,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-002",
          "evidence": "evidence/EV-002-engine-smoke.md; controller reran all unit tests (63 pass) and viewed the crowd shot"
        },
        {
          "sequence": 5,
          "event_sequence": 27,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "controller scope check (standard track; whole-change review under T-003)",
          "evidence": "one file changed; real-name list removed (0 matches)"
        },
        {
          "sequence": 6,
          "event_sequence": 28,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-002",
          "review_evidence": "controller scope check",
          "commit": "0ad78ba",
          "evidence": "committed on ertas-del/new/cast"
        },
        {
          "sequence": 7,
          "event_sequence": 29,
          "from": "COMMITTED",
          "to": "DONE",
          "verification_evidence": "EV-002",
          "review_evidence": "controller scope check",
          "commit": "0ad78ba",
          "evidence": "EV-002 passes"
        }
      ],
      "evidence": [
        "EV-002"
      ]
    },
    {
      "id": "T-003",
      "state": "REVIEWED",
      "owner": "controller",
      "dependencies": [
        "T-002"
      ],
      "worktree": "/home/claude/wt/cast",
      "branch": "ertas-del/new/cast",
      "baseline": "0ad78ba",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 30,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-002"
          ],
          "evidence": "T-002 done at 0ad78ba"
        },
        {
          "sequence": 2,
          "event_sequence": 31,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "controller updating CLAUDE.md and pushing for Check"
        },
        {
          "sequence": 3,
          "event_sequence": 32,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "branch pushed; Check run 42915911604 green"
        },
        {
          "sequence": 4,
          "event_sequence": 33,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-003, EV-004",
          "evidence": "evidence/ci-run.md and evidence/tour-shots.md recorded"
        },
        {
          "sequence": 5,
          "event_sequence": 34,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "EV-005",
          "evidence": "evidence/whole-change-review.md: PASS"
        }
      ],
      "evidence": []
    },
    {
      "id": "T-004",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-003"
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
      "status": "verified",
      "evidence": [
        "EV-001"
      ]
    },
    {
      "criterion": "AC-002",
      "status": "verified",
      "evidence": [
        "EV-001"
      ]
    },
    {
      "criterion": "AC-003",
      "status": "verified",
      "evidence": [
        "EV-001"
      ]
    },
    {
      "criterion": "AC-004",
      "status": "verified",
      "evidence": [
        "EV-001"
      ]
    },
    {
      "criterion": "AC-005",
      "status": "verified",
      "evidence": [
        "EV-002",
        "EV-005"
      ]
    },
    {
      "criterion": "AC-006",
      "status": "verified",
      "evidence": [
        "EV-003",
        "EV-004"
      ]
    },
    {
      "criterion": "AC-007",
      "status": "pending",
      "evidence": []
    }
  ]
}
<!-- sdd-contract-end -->

# Street Cast Execution Ledger

## Bindings

Specification revision 2 (with PATCH-001) and plan revision 1 are approved.

## Authority

The user authorized commits and a push of the feature branch. A merge into main is authorized once Check is green and the whole-change review passes. Repository settings, Pages and releases stay the user's, and the Mafia-game repository is read only.

## Workflow History

Preflight and clarification are done; both artifacts are approved and execution has begun.

## Task State

T-001 and T-002 are DONE. T-003 lands the change on main. T-004, the user's phone test, follows.

## Amendments

None.

## Evidence

Evidence: EV-001 (cast tests), EV-002 (engine smoke run), EV-003 (Check green), EV-004 (tour screenshots), EV-005 (whole-change review) are recorded; EV-006 (phone check) is pending. Requirements FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011 are implemented; criteria AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 are verified and AC-007 is pending the user's phone test.

## Landing State

Check run 42915911604 is green and the whole-change review passed; the merge into main is authorized.
