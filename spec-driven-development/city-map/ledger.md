<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "execution-ledger",
  "workflow_id": "city-map",
  "path": {
    "scope": "repository",
    "value": "spec-driven-development/city-map/ledger.md"
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
      "value": "spec-driven-development/city-map/spec.md"
    },
    "revision": 1,
    "digest": "285c4831b33e945228cf1c40014a03cb6872bdff62d7fafcd1a694782b3a0716"
  },
  "plan": null,
  "artifact_events": [],
  "current_state": "AWAITING_SPEC_APPROVAL",
  "workflow_transitions": [
    {
      "sequence": 1,
      "event_sequence": 1,
      "from": null,
      "to": "PREFLIGHT",
      "evidence": "Branch ertas-del/new/city-map from main at 7411430; CLAUDE.md read"
    },
    {
      "sequence": 2,
      "event_sequence": 2,
      "from": "PREFLIGHT",
      "to": "CLARIFICATION",
      "evidence": "User asked for the real in-game map with 2D graphics for all boroughs, no duplicates"
    },
    {
      "sequence": 3,
      "event_sequence": 3,
      "from": "CLARIFICATION",
      "to": "SPEC_DRAFT",
      "evidence": "User answers: double world size, solid buildings, Staten Island walkable with no rackets, Opus high, merge to main when green"
    },
    {
      "sequence": 4,
      "event_sequence": 4,
      "from": "SPEC_DRAFT",
      "to": "AWAITING_SPEC_APPROVAL",
      "evidence": "spec.md revision 1 validated with --allow-unapproved after critic review"
    }
  ],
  "effective_tasks": [],
  "tasks": [],
  "amendments": [],
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
    },
    {
      "criterion": "AC-009",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-010",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-011",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-012",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-013",
      "status": "pending",
      "evidence": []
    },
    {
      "criterion": "AC-014",
      "status": "pending",
      "evidence": []
    }
  ],
  "completion_evidence": {
    "final_verification": [],
    "blocking_findings": [],
    "documentation": "pending"
  },
  "authority": {
    "sources": [
      "user answers in the current session",
      "repository instructions: CLAUDE.md",
      "track: critical — changes the save data contract and carries more than twelve requirements",
      "subagents: opus, effort high — user answer at preflight"
    ],
    "permitted_external_effects": [
      "local repository edits and commits on branch ertas-del/new/city-map",
      "push of branch ertas-del/new/city-map to origin",
      "merge of ertas-del/new/city-map into main and push of main once every check passes"
    ],
    "prohibited_external_effects": [
      "changing repository visibility or settings",
      "publishing a GitHub release",
      "paid services or new runtime dependencies"
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
  }
}
<!-- sdd-contract-end -->

# City Map Execution Ledger

## Bindings

The specification binding is recorded in the contract; no plan exists yet.

## Authority

The user authorized commits and a push of the feature branch, and a merge into main once every check passes. Repository settings and releases stay the user's.

## Workflow History

Preflight and one clarification round are complete; the specification awaits approval.

## Task State

No tasks exist before plan approval.

## Amendments

None.

## Evidence

Requirements FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020 are not yet implemented; criteria AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 are pending.

## Landing State

Nothing is implemented. Push and merge into main are authorized once checks pass.
