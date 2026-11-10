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
  "plan": {
    "path": {
      "scope": "repository",
      "value": "spec-driven-development/city-map/plan.md"
    },
    "revision": 1,
    "digest": "16a6a813fe4e6a399b955b263146afa11a341e9423f2de1b9b218eb9aec28bd5"
  },
  "artifact_events": [
    {
      "event_sequence": 5,
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 1,
      "digest": "285c4831b33e945228cf1c40014a03cb6872bdff62d7fafcd1a694782b3a0716",
      "approver": "User in the current session",
      "timestamp": "2026-11-09T18:56:09-07:00"
    },
    {
      "event_sequence": 8,
      "event": "APPROVED",
      "artifact_kind": "implementation-plan",
      "revision": 1,
      "digest": "16a6a813fe4e6a399b955b263146afa11a341e9423f2de1b9b218eb9aec28bd5",
      "approver": "User in the current session",
      "timestamp": "2026-11-09T19:03:04-07:00"
    }
  ],
  "current_state": "EXECUTING",
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
    },
    {
      "sequence": 5,
      "event_sequence": 6,
      "from": "AWAITING_SPEC_APPROVAL",
      "to": "PLAN_DRAFT",
      "evidence": "User replied 'I approve all' to the specification approval question"
    },
    {
      "sequence": 6,
      "event_sequence": 7,
      "from": "PLAN_DRAFT",
      "to": "AWAITING_PLAN_APPROVAL",
      "evidence": "plan.md revision 1 validated with --allow-unapproved-plan after critic review"
    },
    {
      "sequence": 7,
      "event_sequence": 9,
      "from": "AWAITING_PLAN_APPROVAL",
      "to": "READY",
      "evidence": "User replied 'I approve, use sonnet as a subagent'"
    },
    {
      "sequence": 8,
      "event_sequence": 10,
      "from": "READY",
      "to": "EXECUTING",
      "evidence": "T-001 dispatch begins"
    }
  ],
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
          "FR-016"
        ],
        "acceptance_criteria": [
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005"
        ]
      },
      "depends_on": [],
      "ownership": [
        {
          "type": "directory",
          "path": {
            "scope": "repository",
            "value": "src/world/city"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/cityData.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/cityGen.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/cityGen.test.ts"
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
        "approved specification",
        "design canvas coordinates"
      ],
      "produces": [
        "cityData and cityGen pinned interfaces",
        "bridgeTypes InteractPrompt union with 'ferry'"
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
          "FR-006",
          "FR-014",
          "FR-015",
          "FR-016"
        ],
        "acceptance_criteria": [
          "AC-009"
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
            "value": "src/world/cityRender.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/chunkCache.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/cityRender.test.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "cityGen interface"
      ],
      "produces": [
        "drawCityChunk, drawCityOverlay, createChunkCache"
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
          "FR-011",
          "FR-012"
        ],
        "acceptance_criteria": [
          "AC-007",
          "AC-008"
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
            "value": "src/world/pathfind.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/traffic.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/movement.test.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "cityGen interface"
      ],
      "produces": [
        "flow field, stuck tracker, traffic step"
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
          "FR-003",
          "FR-013",
          "FR-017"
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
            "value": "src/data/nyc1984Data.ts"
          },
          "mode": "exclusive"
        },
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
            "value": "src/components/PerimeterHud.tsx"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/saveMerge.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/world/saveMerge.test.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "cityData interface"
      ],
      "produces": [
        "borough outlines and positions read from cityData, save merge, ferry prompt plumbing in App and HUD"
      ],
      "verification_ids": [
        "EV-007",
        "EV-008"
      ],
      "parallel_group": "wave-2",
      "commit_required": true
    },
    {
      "id": "T-006",
      "covers": {
        "requirements": [
          "FR-019"
        ],
        "acceptance_criteria": [
          "AC-011"
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
            "value": ".github/workflows/check.yml"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "scripts/city-tour.mjs"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "cityData ferry and station points",
        "pinned tour hook"
      ],
      "produces": [
        "unit-test step and city-tour step in Check"
      ],
      "verification_ids": [
        "EV-009"
      ],
      "parallel_group": "wave-2",
      "commit_required": true
    },
    {
      "id": "T-005",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-003",
          "FR-009",
          "FR-010",
          "FR-013",
          "FR-014",
          "FR-015",
          "FR-018",
          "FR-020"
        ],
        "acceptance_criteria": [
          "AC-010"
        ]
      },
      "depends_on": [
        "T-001",
        "T-002",
        "T-003",
        "T-004",
        "T-006"
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
        "all world modules",
        "App ferry callback"
      ],
      "produces": [
        "engine on the new city: drawing, collision, spawns, borough detection, ferry, tour hook"
      ],
      "verification_ids": [
        "EV-010",
        "EV-011"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-009",
      "covers": {
        "requirements": [
          "FR-010",
          "FR-011",
          "FR-012"
        ],
        "acceptance_criteria": [
          "AC-010"
        ]
      },
      "depends_on": [
        "T-005"
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
        "T-005 engine",
        "pathfind and traffic"
      ],
      "produces": [
        "chasing around buildings, stuck rule, unclaimed-area civilians, lane traffic in the engine"
      ],
      "verification_ids": [
        "EV-016",
        "EV-017"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-007",
      "covers": {
        "requirements": [],
        "acceptance_criteria": [
          "AC-011",
          "AC-012",
          "AC-013"
        ]
      },
      "depends_on": [
        "T-001",
        "T-002",
        "T-003",
        "T-004",
        "T-005",
        "T-006",
        "T-009"
      ],
      "ownership": [
        {
          "type": "directory",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/city-map/evidence"
          },
          "mode": "exclusive"
        },
        {
          "type": "git-index",
          "name": "feature-branch",
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "integrated feature branch",
        "Check run logs and artifacts list"
      ],
      "produces": [
        "green Check run, city-tour report, screenshot review"
      ],
      "verification_ids": [
        "EV-012",
        "EV-013",
        "EV-014"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-008",
      "covers": {
        "requirements": [],
        "acceptance_criteria": [
          "AC-014"
        ]
      },
      "depends_on": [
        "T-007"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/city-map/evidence/device-test.md"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "merged main",
        "Pages deployment",
        "user's S26"
      ],
      "produces": [
        "user's device confirmation"
      ],
      "verification_ids": [
        "EV-015"
      ],
      "parallel_group": null,
      "commit_required": false
    }
  ],
  "tasks": [
    {
      "id": "T-001",
      "state": "DONE",
      "owner": "worker (sonnet, effort high)",
      "dependencies": [],
      "worktree": "/home/claude/wt/C-001",
      "branch": "wt/C-001",
      "baseline": "c6fb069",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 11,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [],
          "evidence": "no dependencies; worktree at c6fb069"
        },
        {
          "sequence": 2,
          "event_sequence": 12,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-001 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 13,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "commits f629abb, 2e13e0d, 98d6d59, a47a6a3"
        },
        {
          "sequence": 4,
          "event_sequence": 14,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-001",
          "evidence": "evidence/EV-001-cityGen-tests.txt: 22 pass, 0 fail"
        },
        {
          "sequence": 5,
          "event_sequence": 15,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "EV-002",
          "evidence": "evidence/EV-002-T-001-review.md: PASS on round 2"
        },
        {
          "sequence": 6,
          "event_sequence": 16,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "commit": "4584558",
          "evidence": "merged wt/C-001 into ertas-del/new/city-map",
          "verification_evidence": "EV-001",
          "review_evidence": "EV-002"
        },
        {
          "sequence": 7,
          "event_sequence": 17,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "EV-001 and EV-002 pass; merged",
          "verification_evidence": "EV-001",
          "review_evidence": "EV-002",
          "commit": "4584558"
        }
      ],
      "evidence": [
        "EV-001",
        "EV-002"
      ]
    },
    {
      "id": "T-002",
      "state": "IN_PROGRESS",
      "owner": "Sonnet worker",
      "dependencies": [
        "T-001"
      ],
      "worktree": "/home/claude/wt/C-002",
      "branch": "wt/C-002",
      "baseline": "8e98a70",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 18,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001"
          ],
          "evidence": "T-001 merged at 4584558"
        },
        {
          "sequence": 2,
          "event_sequence": 19,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-002 dispatch"
        }
      ],
      "evidence": []
    },
    {
      "id": "T-003",
      "state": "DONE",
      "owner": "Sonnet worker",
      "dependencies": [
        "T-001"
      ],
      "worktree": "/home/claude/wt/C-003",
      "branch": "wt/C-003",
      "baseline": "8e98a70",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 20,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001"
          ],
          "evidence": "T-001 merged at 4584558"
        },
        {
          "sequence": 2,
          "event_sequence": 21,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-003 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 36,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "commit 2d71d69"
        },
        {
          "sequence": 4,
          "event_sequence": 37,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-005",
          "evidence": "evidence/EV-005-movement-tests.txt passes"
        },
        {
          "sequence": 5,
          "event_sequence": 38,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "EV-006",
          "evidence": "evidence/EV-006-T-003-review.md: PASS"
        },
        {
          "sequence": 6,
          "event_sequence": 39,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-005",
          "review_evidence": "EV-006",
          "commit": "8987d86",
          "evidence": "merged wt/C-003"
        },
        {
          "sequence": 7,
          "event_sequence": 40,
          "from": "COMMITTED",
          "to": "DONE",
          "verification_evidence": "EV-005",
          "review_evidence": "EV-006",
          "commit": "8987d86",
          "evidence": "EV-005 and EV-006 pass; merged"
        }
      ],
      "evidence": [
        "EV-005",
        "EV-006"
      ]
    },
    {
      "id": "T-004",
      "state": "DONE",
      "owner": "Sonnet worker",
      "dependencies": [
        "T-001"
      ],
      "worktree": "/home/claude/wt/C-004",
      "branch": "wt/C-004",
      "baseline": "8e98a70",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 22,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001"
          ],
          "evidence": "T-001 merged at 4584558"
        },
        {
          "sequence": 2,
          "event_sequence": 23,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-004 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 26,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "commits f1eb2d4, 3e835bf"
        },
        {
          "sequence": 4,
          "event_sequence": 27,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-007",
          "evidence": "evidence/EV-007-saveMerge-tests.txt passes"
        },
        {
          "sequence": 5,
          "event_sequence": 28,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "EV-008",
          "evidence": "evidence/EV-008-T-004-review.md: PASS"
        },
        {
          "sequence": 6,
          "event_sequence": 29,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-007",
          "review_evidence": "EV-008",
          "commit": "65bbe15",
          "evidence": "merged wt/C-004"
        },
        {
          "sequence": 7,
          "event_sequence": 30,
          "from": "COMMITTED",
          "to": "DONE",
          "verification_evidence": "EV-007",
          "review_evidence": "EV-008",
          "commit": "65bbe15",
          "evidence": "EV-007 and EV-008 pass; merged"
        }
      ],
      "evidence": [
        "EV-007",
        "EV-008"
      ]
    },
    {
      "id": "T-006",
      "state": "DONE",
      "owner": "Sonnet worker",
      "dependencies": [
        "T-001"
      ],
      "worktree": "/home/claude/wt/C-006",
      "branch": "wt/C-006",
      "baseline": "8e98a70",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 24,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001"
          ],
          "evidence": "T-001 merged at 4584558"
        },
        {
          "sequence": 2,
          "event_sequence": 25,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "T-006 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 31,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "commits 660aef1 plus blank-threshold fix"
        },
        {
          "sequence": 4,
          "event_sequence": 32,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "verification_evidence": "EV-009",
          "evidence": "node --check passes; local find|node --test run passes; the CI run itself is EV-012/EV-013 under T-007"
        },
        {
          "sequence": 5,
          "event_sequence": 33,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "review_evidence": "EV-009",
          "evidence": "evidence/EV-009-T-006-review.md: PASS"
        },
        {
          "sequence": 6,
          "event_sequence": 34,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-009",
          "review_evidence": "EV-009",
          "commit": "1495d66",
          "evidence": "merged wt/C-006"
        },
        {
          "sequence": 7,
          "event_sequence": 35,
          "from": "COMMITTED",
          "to": "DONE",
          "verification_evidence": "EV-009",
          "review_evidence": "EV-009",
          "commit": "1495d66",
          "evidence": "EV-009 passes; merged"
        }
      ],
      "evidence": [
        "EV-009"
      ]
    },
    {
      "id": "T-005",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-001",
        "T-002",
        "T-003",
        "T-004",
        "T-006"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-009",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-005"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-007",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-001",
        "T-002",
        "T-003",
        "T-004",
        "T-005",
        "T-006",
        "T-009"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    },
    {
      "id": "T-008",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-007"
      ],
      "worktree": "not yet created",
      "branch": "not yet created",
      "baseline": "not yet recorded",
      "transitions": [],
      "evidence": []
    }
  ],
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
      "subagents: sonnet, effort high — user instruction at plan approval, replacing opus"
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

The specification and plan bindings are recorded in the contract.

## Authority

The user authorized commits and a push of the feature branch, and a merge into main once every check passes. Repository settings and releases stay the user's.

## Workflow History

Both artifacts are approved; execution has begun with T-001. At plan approval the user switched every worker and reviewer to Sonnet at high effort.

## Task State

T-001, T-002, T-003, T-004, T-006, T-005, T-009, T-007, T-008 are PENDING until plan approval.

## Amendments

None.

## Evidence

Requirements FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020 are not yet implemented; criteria AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 are pending; planned evidence is EV-001, EV-002, EV-003, EV-004, EV-005, EV-006, EV-007, EV-008, EV-009, EV-010, EV-011, EV-012, EV-013, EV-014, EV-015, EV-016, EV-017.

## Landing State

Nothing is implemented. Push and merge into main are authorized once checks pass.
