<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "execution-ledger",
  "workflow_id": "touch-controls",
  "path": {
    "scope": "repository",
    "value": "spec-driven-development/touch-controls/ledger.md"
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
      "value": "spec-driven-development/touch-controls/spec.md"
    },
    "revision": 3,
    "digest": "f176509737d43af72080f9ccb5e6709be8d64496a563edc59f18568379ca6c73"
  },
  "plan": {
    "path": {
      "scope": "repository",
      "value": "spec-driven-development/touch-controls/plan.md"
    },
    "revision": 3,
    "digest": "f1b25a0dcc9b8d3993f4e5495973cd8d4fceb1958f89f5170dde06a3b4fe8fe3"
  },
  "artifact_events": [
    {
      "event_sequence": 5,
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 1,
      "digest": "500a2e90cd6c2b34acf061be354f7935293b3e48170004ad04f627c4463f2c51",
      "approver": "User in the current session",
      "timestamp": "2026-11-08T17:14:13-07:00"
    },
    {
      "event": "APPROVED",
      "artifact_kind": "implementation-plan",
      "revision": 1,
      "digest": "88d6c508b4c063de9f0ad04d85f7196602f918a3daa28802bf7012f6b1ec75fe",
      "approver": "User in the current session",
      "timestamp": "2026-11-08T17:27:56-07:00",
      "event_sequence": 8
    },
    {
      "event": "INVALIDATED",
      "artifact_kind": "implementation-plan",
      "revision": 1,
      "digest": "88d6c508b4c063de9f0ad04d85f7196602f918a3daa28802bf7012f6b1ec75fe",
      "reason": "patches/PATCH-001.md: dependent on specification revision 1",
      "event_sequence": 37
    },
    {
      "event": "INVALIDATED",
      "artifact_kind": "specification",
      "revision": 1,
      "digest": "500a2e90cd6c2b34acf061be354f7935293b3e48170004ad04f627c4463f2c51",
      "reason": "patches/PATCH-001.md: Pages base path follows repository name",
      "event_sequence": 38
    },
    {
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 2,
      "digest": "a38eba7da0fdfd8ed5c6a35789fbc15b0735c44b4955e09d52f389500a2562b0",
      "approver": "User in the current session",
      "timestamp": "2026-11-08T18:37:28-07:00",
      "event_sequence": 41
    },
    {
      "event": "APPROVED",
      "artifact_kind": "implementation-plan",
      "revision": 2,
      "digest": "86bb4e4995c6eb76ed3b21607d110e3b51c0d046b90ded1d6ea71c29c9d9dd0e",
      "approver": "User in the current session",
      "timestamp": "2026-11-08T18:37:28-07:00",
      "event_sequence": 44
    },
    {
      "event": "INVALIDATED",
      "artifact_kind": "implementation-plan",
      "revision": 2,
      "digest": "86bb4e4995c6eb76ed3b21607d110e3b51c0d046b90ded1d6ea71c29c9d9dd0e",
      "reason": "patches/PATCH-002.md: checks move into CI; dependent on specification revision 2",
      "event_sequence": 64
    },
    {
      "event": "INVALIDATED",
      "artifact_kind": "specification",
      "revision": 2,
      "digest": "a38eba7da0fdfd8ed5c6a35789fbc15b0735c44b4955e09d52f389500a2562b0",
      "reason": "patches/PATCH-002.md: AC-006, AC-008 and FR-017 change",
      "event_sequence": 65
    },
    {
      "event": "APPROVED",
      "artifact_kind": "specification",
      "revision": 3,
      "digest": "f176509737d43af72080f9ccb5e6709be8d64496a563edc59f18568379ca6c73",
      "approver": "User in the current session",
      "timestamp": "2026-11-08T19:03:17-07:00",
      "event_sequence": 68
    },
    {
      "event": "APPROVED",
      "artifact_kind": "implementation-plan",
      "revision": 3,
      "digest": "f1b25a0dcc9b8d3993f4e5495973cd8d4fceb1958f89f5170dde06a3b4fe8fe3",
      "approver": "User in the current session",
      "timestamp": "2026-11-08T19:03:17-07:00",
      "event_sequence": 71
    }
  ],
  "current_state": "EXECUTING",
  "workflow_transitions": [
    {
      "sequence": 1,
      "event_sequence": 1,
      "from": null,
      "to": "PREFLIGHT",
      "evidence": "Cloned ertas-del/mafia-wars at f7099f9; created branch ertas-del/new/touch-controls; read CLAUDE.md"
    },
    {
      "sequence": 2,
      "event_sequence": 2,
      "from": "PREFLIGHT",
      "to": "CLARIFICATION",
      "evidence": "User chose phone touch controls; subagents opus at high effort"
    },
    {
      "sequence": 3,
      "event_sequence": 3,
      "from": "CLARIFICATION",
      "to": "SPEC_DRAFT",
      "evidence": "Three question rounds answered: twin-stick, landscape only, auto on touch, push branch, floating sticks, auto fullscreen, full phone scope, light haptics with own toggle, public repo plus Pages, CI check"
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
      "evidence": "User approved specification revision 1 via structured question"
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
      "evidence": "User replied 'Start coding' to the plan approval question; digest rechecked"
    },
    {
      "sequence": 8,
      "event_sequence": 10,
      "from": "READY",
      "to": "EXECUTING",
      "evidence": "Wave 1 (T-001, T-003, T-004, T-005) dispatch begins"
    },
    {
      "sequence": 9,
      "event_sequence": 36,
      "from": "EXECUTING",
      "to": "CHANGE_CONTROL",
      "evidence": "repository renamed to Mafia-Wars; hard-coded Pages base path; patches/PATCH-001.md"
    },
    {
      "sequence": 10,
      "event_sequence": 39,
      "from": "CHANGE_CONTROL",
      "to": "SPEC_DRAFT",
      "evidence": "patches/PATCH-001.md applied to spec.md revision 2"
    },
    {
      "sequence": 11,
      "event_sequence": 40,
      "from": "SPEC_DRAFT",
      "to": "AWAITING_SPEC_APPROVAL",
      "evidence": "patches/PATCH-001.md presented with exact before and after text"
    },
    {
      "sequence": 12,
      "event_sequence": 42,
      "from": "AWAITING_SPEC_APPROVAL",
      "to": "PLAN_DRAFT",
      "evidence": "patches/PATCH-001.md applied to plan.md revision 2"
    },
    {
      "sequence": 13,
      "event_sequence": 43,
      "from": "PLAN_DRAFT",
      "to": "AWAITING_PLAN_APPROVAL",
      "evidence": "patches/PATCH-001.md covers both artifacts in one question"
    },
    {
      "sequence": 14,
      "event_sequence": 45,
      "from": "AWAITING_PLAN_APPROVAL",
      "to": "READY",
      "evidence": "user replied 'I approve' to the PATCH-001 question"
    },
    {
      "sequence": 15,
      "event_sequence": 46,
      "from": "READY",
      "to": "EXECUTING",
      "evidence": "T-005 continues with the base-path change; T-003 in review"
    },
    {
      "sequence": 16,
      "event_sequence": 63,
      "from": "EXECUTING",
      "to": "CHANGE_CONTROL",
      "evidence": "artifact download refused by network allowlist (run 42547040055); patches/PATCH-002.md"
    },
    {
      "sequence": 17,
      "event_sequence": 66,
      "from": "CHANGE_CONTROL",
      "to": "SPEC_DRAFT",
      "evidence": "patches/PATCH-002.md applied to spec.md revision 3"
    },
    {
      "sequence": 18,
      "event_sequence": 67,
      "from": "SPEC_DRAFT",
      "to": "AWAITING_SPEC_APPROVAL",
      "evidence": "patches/PATCH-002.md presented with exact before and after text"
    },
    {
      "sequence": 19,
      "event_sequence": 69,
      "from": "AWAITING_SPEC_APPROVAL",
      "to": "PLAN_DRAFT",
      "evidence": "patches/PATCH-002.md applied to plan.md revision 3"
    },
    {
      "sequence": 20,
      "event_sequence": 70,
      "from": "PLAN_DRAFT",
      "to": "AWAITING_PLAN_APPROVAL",
      "evidence": "patches/PATCH-002.md covers both artifacts in one question"
    },
    {
      "sequence": 21,
      "event_sequence": 72,
      "from": "AWAITING_PLAN_APPROVAL",
      "to": "READY",
      "evidence": "user replied 'Go for gold' to the PATCH-002 question"
    },
    {
      "sequence": 22,
      "event_sequence": 73,
      "from": "READY",
      "to": "EXECUTING",
      "evidence": "T-006 dispatch"
    }
  ],
  "effective_tasks": [
    {
      "id": "T-001",
      "covers": {
        "requirements": [
          "FR-001",
          "FR-002",
          "FR-003",
          "FR-004",
          "FR-005",
          "FR-006",
          "FR-007"
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
            "value": "src/components/NycWorldCanvas.tsx"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/input/touchSticks.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/input/touchSticks.test.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/input/touchMode.ts"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "approved specification",
        "existing canvas input loop"
      ],
      "produces": [
        "touch twin-stick play",
        "touchMode module and html data-input attribute"
      ],
      "verification_ids": [
        "EV-001",
        "EV-002"
      ],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-003",
      "covers": {
        "requirements": [
          "FR-008",
          "FR-012",
          "FR-013"
        ],
        "acceptance_criteria": [
          "AC-004"
        ]
      },
      "depends_on": [],
      "ownership": [
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
            "value": "src/components/SyndicateDrawers.tsx"
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
            "value": "src/index.css"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "index.html"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "approved specification",
        "pinned data-input attribute"
      ],
      "produces": [
        "phone-fit HUD, title, drawers and modals",
        "touch Tailwind variant"
      ],
      "verification_ids": [
        "EV-003"
      ],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-004",
      "covers": {
        "requirements": [
          "FR-009",
          "FR-010",
          "FR-011"
        ],
        "acceptance_criteria": [
          "AC-005"
        ]
      },
      "depends_on": [],
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
            "value": "src/input/fullscreen.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/components/RotateCard.tsx"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "approved specification",
        "pinned data-input attribute"
      ],
      "produces": [
        "fullscreen, orientation lock, portrait card and fullscreen-exit pause"
      ],
      "verification_ids": [
        "EV-004"
      ],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-005",
      "covers": {
        "requirements": [
          "FR-016",
          "FR-017"
        ],
        "acceptance_criteria": [
          "AC-010"
        ]
      },
      "depends_on": [],
      "ownership": [
        {
          "type": "directory",
          "path": {
            "scope": "repository",
            "value": ".github/workflows"
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
        "approved specification",
        "package.json scripts"
      ],
      "produces": [
        "check workflow with dist artifact",
        "Pages workflow",
        "bundled portraits"
      ],
      "verification_ids": [
        "EV-005"
      ],
      "parallel_group": "wave-1",
      "commit_required": true
    },
    {
      "id": "T-002",
      "covers": {
        "requirements": [
          "FR-014",
          "FR-015"
        ],
        "acceptance_criteria": [
          "AC-007"
        ]
      },
      "depends_on": [
        "T-001",
        "T-003",
        "T-004"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/input/haptics.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/input/haptics.test.ts"
          },
          "mode": "exclusive"
        },
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "src/components/NycWorldCanvas.tsx"
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
            "value": "src/App.tsx"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "T-001 canvas",
        "T-003 HUD layout",
        "T-004 App"
      ],
      "produces": [
        "vibration feedback and toggle"
      ],
      "verification_ids": [
        "EV-006"
      ],
      "parallel_group": null,
      "commit_required": true
    },
    {
      "id": "T-006",
      "covers": {
        "requirements": [],
        "acceptance_criteria": [
          "AC-006",
          "AC-008",
          "AC-009"
        ]
      },
      "depends_on": [
        "T-001",
        "T-002",
        "T-003",
        "T-004",
        "T-005"
      ],
      "ownership": [
        {
          "type": "directory",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/touch-controls/evidence"
          },
          "mode": "exclusive"
        },
        {
          "type": "git-index",
          "name": "feature-branch",
          "mode": "exclusive"
        },
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
            "value": "scripts/phone-layout-check.mjs"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "integrated feature branch",
        "CI run logs"
      ],
      "produces": [
        "green CI run",
        "915x412 phone-fit report and screenshots",
        "portrait bundle check"
      ],
      "verification_ids": [
        "EV-007",
        "EV-008",
        "EV-009"
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
          "AC-012"
        ]
      },
      "depends_on": [
        "T-006"
      ],
      "ownership": [
        {
          "type": "file",
          "path": {
            "scope": "repository",
            "value": "spec-driven-development/touch-controls/evidence/device-test.md"
          },
          "mode": "exclusive"
        }
      ],
      "consumes": [
        "user merge to main",
        "Pages deployment",
        "user's S26"
      ],
      "produces": [
        "user's device confirmation"
      ],
      "verification_ids": [
        "EV-010"
      ],
      "parallel_group": null,
      "commit_required": false
    }
  ],
  "tasks": [
    {
      "id": "T-001",
      "state": "DONE",
      "owner": "worker (opus, effort high)",
      "dependencies": [],
      "worktree": "/home/claude/wt/T-001",
      "branch": "wt/T-001",
      "baseline": "b72a6f5",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 11,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [],
          "evidence": "no dependencies; worktree at b72a6f5"
        },
        {
          "sequence": 2,
          "event_sequence": 15,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "wave-1 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 19,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "worker commit 274e935 on wt/T-001; scope limited to four owned files"
        },
        {
          "sequence": 4,
          "event_sequence": 20,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "evidence": "EV-001: controller ran node --test src/input/touchSticks.test.ts, 6 pass 0 fail"
        },
        {
          "sequence": 5,
          "event_sequence": 21,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "evidence": "EV-002: fresh opus reviewer PASS, no blocking findings"
        },
        {
          "sequence": 6,
          "event_sequence": 30,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-001",
          "review_evidence": "EV-002",
          "commit": "15a8385",
          "evidence": "merged into feature branch"
        },
        {
          "sequence": 7,
          "event_sequence": 31,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "merged at 15a8385; CLAUDE.md lines written at 5617f0d"
        }
      ],
      "evidence": [
        "EV-001",
        "EV-002"
      ]
    },
    {
      "id": "T-003",
      "state": "DONE",
      "owner": "worker (opus, effort high)",
      "dependencies": [],
      "worktree": "/home/claude/wt/T-003",
      "branch": "wt/T-003",
      "baseline": "b72a6f5",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 12,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [],
          "evidence": "no dependencies; worktree at b72a6f5"
        },
        {
          "sequence": 2,
          "event_sequence": 16,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "wave-1 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 35,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "worker commit e50aedb on wt/T-003; scope limited to five owned files"
        },
        {
          "sequence": 4,
          "event_sequence": 52,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "evidence": "controller confirmed fix 57b1793 adds the two classes only; rendered proof is EV-008 in T-006"
        },
        {
          "sequence": 5,
          "event_sequence": 53,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "evidence": "EV-003: fresh opus reviewer found one blocking finding (B1-B5 touch size); fix round 1 applied the prescribed class; all else PASS"
        },
        {
          "sequence": 6,
          "event_sequence": 54,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-003",
          "review_evidence": "EV-003",
          "commit": "22cdfaf",
          "evidence": "merged into feature branch"
        },
        {
          "sequence": 7,
          "event_sequence": 55,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "merged at 22cdfaf; CLAUDE.md guardrail written at 85d7e02"
        }
      ],
      "evidence": [
        "EV-003"
      ]
    },
    {
      "id": "T-004",
      "state": "DONE",
      "owner": "worker (opus, effort high)",
      "dependencies": [],
      "worktree": "/home/claude/wt/T-004",
      "branch": "wt/T-004",
      "baseline": "b72a6f5",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 13,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [],
          "evidence": "no dependencies; worktree at b72a6f5"
        },
        {
          "sequence": 2,
          "event_sequence": 17,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "wave-1 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 22,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "worker commits de26248 and fix 7547695 on wt/T-004; scope limited to three owned files"
        },
        {
          "sequence": 4,
          "event_sequence": 23,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "evidence": "controller read the fix diff: isTouchDevice removed, Start and Resume gated on isTouchModeAttr exactly as the reviewer prescribed"
        },
        {
          "sequence": 5,
          "event_sequence": 24,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "evidence": "EV-004: fresh opus reviewer found one blocking finding (touchscreen laptop fullscreen); fix round 1 applied the prescribed minimal fix; all other paths PASS"
        },
        {
          "sequence": 6,
          "event_sequence": 32,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-004",
          "review_evidence": "EV-004",
          "commit": "5cd5023",
          "evidence": "merged into feature branch"
        },
        {
          "sequence": 7,
          "event_sequence": 33,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "merged at 5cd5023; CLAUDE.md line written at 5617f0d"
        }
      ],
      "evidence": [
        "EV-004"
      ]
    },
    {
      "id": "T-005",
      "state": "DONE",
      "owner": "worker (opus, effort high)",
      "dependencies": [],
      "worktree": "/home/claude/wt/T-005",
      "branch": "wt/T-005",
      "baseline": "b72a6f5",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 14,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [],
          "evidence": "no dependencies; worktree at b72a6f5"
        },
        {
          "sequence": 2,
          "event_sequence": 18,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "wave-1 dispatch"
        },
        {
          "sequence": 3,
          "event_sequence": 25,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "worker commit 82d2abb on wt/T-005; scope limited to owned files"
        },
        {
          "sequence": 4,
          "event_sequence": 26,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "evidence": "controller confirmed scope and that all portraitUrl values use imports; build proof deferred to EV-007 and EV-009 in T-006 per plan"
        },
        {
          "sequence": 5,
          "event_sequence": 27,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "evidence": "EV-005: fresh opus reviewer PASS"
        },
        {
          "sequence": 6,
          "event_sequence": 28,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-005",
          "review_evidence": "EV-005",
          "commit": "b3c90f2",
          "evidence": "merged into feature branch"
        },
        {
          "sequence": 7,
          "event_sequence": 29,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "merged at b3c90f2; CLAUDE.md text written at 5617f0d"
        },
        {
          "sequence": 8,
          "event_sequence": 34,
          "event": "REOPENED",
          "from": "DONE",
          "to": "IN_PROGRESS",
          "invalid_evidence": "EV-005",
          "reason": "CI Check run 42546340972 failed at npm install: pre-existing ERESOLVE between devDependency esbuild ^0.25.0 and vite 8 peerOptional esbuild ^0.27 || ^0.28; workflow fix lies in T-005's owned files"
        },
        {
          "sequence": 9,
          "event_sequence": 47,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "fix commits cee3747 (legacy-peer-deps install, upload guard) and f2af8ed (repo-name base per PATCH-001)"
        },
        {
          "sequence": 10,
          "event_sequence": 48,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "evidence": "Check run 42546510855 succeeded on 72e325c: install, lint and build pass"
        },
        {
          "sequence": 11,
          "event_sequence": 49,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "evidence": "EV-005 PASS on original workflows; three fix lines are the user-approved PATCH-001 and the CI-proven install flag, and go to the whole-change reviewer"
        },
        {
          "sequence": 12,
          "event_sequence": 50,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-005",
          "review_evidence": "EV-005",
          "commit": "f2af8ed",
          "evidence": "fast-forwarded into feature branch"
        },
        {
          "sequence": 13,
          "event_sequence": 51,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "merged at f2af8ed and pushed"
        }
      ],
      "evidence": [
        "EV-005"
      ]
    },
    {
      "id": "T-002",
      "state": "DONE",
      "owner": "worker (opus, effort high)",
      "dependencies": [
        "T-001",
        "T-003",
        "T-004"
      ],
      "worktree": "/home/claude/wt/T-002",
      "branch": "wt/T-002",
      "baseline": "85d7e02",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 56,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001",
            "T-003",
            "T-004"
          ],
          "evidence": "all three dependencies DONE and merged"
        },
        {
          "sequence": 2,
          "event_sequence": 57,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "dispatch after wave 1"
        },
        {
          "sequence": 3,
          "event_sequence": 58,
          "from": "IN_PROGRESS",
          "to": "IMPLEMENTED",
          "evidence": "worker commit 6a21eeb on wt/T-002; scope limited to five owned files"
        },
        {
          "sequence": 4,
          "event_sequence": 59,
          "from": "IMPLEMENTED",
          "to": "VERIFIED",
          "evidence": "EV-006: controller ran node --test src/input/*.test.ts, 12 pass 0 fail (haptics 6, sticks 6)"
        },
        {
          "sequence": 5,
          "event_sequence": 60,
          "from": "VERIFIED",
          "to": "REVIEWED",
          "evidence": "fresh opus reviewer PASS; shotgun has no hitstop so FR-014 met as written"
        },
        {
          "sequence": 6,
          "event_sequence": 61,
          "from": "REVIEWED",
          "to": "COMMITTED",
          "verification_evidence": "EV-006",
          "review_evidence": "EV-006",
          "commit": "9a69960",
          "evidence": "merged into feature branch"
        },
        {
          "sequence": 7,
          "event_sequence": 62,
          "from": "COMMITTED",
          "to": "DONE",
          "evidence": "merged at 9a69960; CLAUDE.md haptics line written"
        }
      ],
      "evidence": [
        "EV-006"
      ]
    },
    {
      "id": "T-006",
      "state": "IN_PROGRESS",
      "owner": "worker (opus, effort high)",
      "dependencies": [
        "T-001",
        "T-002",
        "T-003",
        "T-004",
        "T-005"
      ],
      "worktree": "/home/claude/wt/T-006",
      "branch": "wt/T-006",
      "baseline": "8c0a398",
      "transitions": [
        {
          "sequence": 1,
          "event_sequence": 74,
          "from": "PENDING",
          "to": "READY",
          "dependencies_done": [
            "T-001",
            "T-002",
            "T-003",
            "T-004",
            "T-005"
          ],
          "evidence": "all code tasks DONE and merged; branch pushed and Check green at bdaf080"
        },
        {
          "sequence": 2,
          "event_sequence": 75,
          "from": "READY",
          "to": "IN_PROGRESS",
          "evidence": "dispatch for EV-008 and EV-009 CI steps"
        }
      ],
      "evidence": []
    },
    {
      "id": "T-007",
      "state": "PENDING",
      "owner": "unassigned",
      "dependencies": [
        "T-006"
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
      "track: critical — adds CI and a GitHub Pages deployment workflow (release behavior) and carries more than twelve requirements",
      "subagents: opus, effort high — user answer at preflight"
    ],
    "permitted_external_effects": [
      "local repository edits and commits on branch ertas-del/new/touch-controls",
      "push of branch ertas-del/new/touch-controls to origin"
    ],
    "prohibited_external_effects": [
      "merge into main",
      "push to main",
      "changing repository visibility or settings",
      "running a deployment",
      "publishing a GitHub release"
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
    "merged": "not-authorized",
    "pushed": "not-yet",
    "deployed": "not-authorized",
    "emulator_tested": "not-required",
    "device_tested": "not-yet",
    "released": "not-authorized"
  }
}
<!-- sdd-contract-end -->

# Touch Controls Execution Ledger

## Bindings

The specification and plan bindings are recorded in the contract.

## Authority

The user authorized commits on the feature branch and a push of that branch. Merging into main, which deploys the game, is the user's own step, as are making the repository public and choosing GitHub Actions as the Pages source.

## Workflow History

Both artifacts are approved; execution has begun with wave 1.

## Task State

T-001, T-002, T-003, T-004, T-005, T-006 and T-007 are PENDING until plan approval.

## Amendments

None.

## Evidence

Requirements FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017 are not yet implemented; criteria AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 are pending; planned evidence is EV-001, EV-002, EV-003, EV-004, EV-005, EV-006, EV-007, EV-008, EV-009 and EV-010.

## Landing State

Nothing is implemented. Push of the feature branch is authorized; merge, deployment and release are the user's.
