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
  "plan": null,
  "current_state": "AWAITING_SPEC_APPROVAL",
  "effective_tasks": [],
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
    }
  ],
  "tasks": [],
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
    }
  ]
}
<!-- sdd-contract-end -->

# Street Cast Execution Ledger

## Bindings

Specification revision 1 was approved; PATCH-001 makes revision 2, presented with plan revision 1 for one approval.

## Authority

The user authorized commits and a push of the feature branch. A merge into main is authorized once Check is green and the whole-change review passes. Repository settings, Pages and releases stay the user's, and the Mafia-game repository is read only.

## Workflow History

Preflight and clarification are done; specification revision 1 is approved and planning has begun.

## Task State

No tasks until the plan is approved.

## Amendments

None.

## Evidence

Requirements FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011 are not implemented; criteria AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007 are pending.

## Landing State

Nothing is implemented.
