<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "implementation-plan",
  "plan_id": "city-map-plan",
  "revision": 1,
  "path": {
    "scope": "repository",
    "value": "spec-driven-development/city-map/plan.md"
  },
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
    "path": {
      "scope": "repository",
      "value": "spec-driven-development/city-map/spec.md"
    },
    "revision": 1,
    "digest": "285c4831b33e945228cf1c40014a03cb6872bdff62d7fafcd1a694782b3a0716"
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
    "exact private symbols or files": [
      "ownership"
    ],
    "internal tactics": [
      "adaptable_values"
    ],
    "worker assignment": [
      "adaptable_values"
    ],
    "evidence-equivalent verification command": [
      "adaptable_values"
    ]
  },
  "tasks": [
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
  ]
}
<!-- sdd-contract-end -->

# Real City Map — Implementation Plan

**Path:** `spec-driven-development/city-map/plan.md` · **Revision:** 1 · **Kind:** implementation-plan · **Schema:** 1 · **Status:** awaiting user approval
**Specification:** `spec-driven-development/city-map/spec.md` revision 1, digest `285c4831b33e945228cf1c40014a03cb6872bdff62d7fafcd1a694782b3a0716`

<!-- sdd-approval-begin -->
**Approval status:** Approved
**Approved revision:** 1
**Approved normative digest:** `16a6a813fe4e6a399b955b263146afa11a341e9423f2de1b9b218eb9aec28bd5`
**Approver:** User in the current session
**Approval timestamp:** 2026-11-09T19:03:04-07:00
<!-- sdd-approval-end -->

## Goal

Deliver FR-001 to FR-020 as a city generator, four parallel slices built on it, one engine integration, a verification pass on the real build, and the user's phone test.

## Preflight

| Fact | Evidence |
|---|---|
| Repository and branch | `ertas-del/Mafia-Wars`, `ertas-del/new/city-map` from `main` at `7411430` |
| Instructions | `CLAUDE.md` guardrails and file layout |
| Tooling | `node --test` on Node 22 for pure modules; lint, build and browser checks run only in CI |
| Design source | The design canvas files in `/tmp/claude-0/-home-claude/73c00684-f51b-5fe6-8d5d-21e5901a1232/scratchpad/nycmap/project/` (`Main.dc.html` turf map at quarter scale of the new world; `BronxScene`, `BronxBuildings`, `BronxLayout`, `Tiles`, `Props`) |
| Track and agents | critical; a fresh Opus worker and a fresh Opus reviewer per task, high effort |
| Landing authority | commit and push the branch; merge into main once Check is green |

## Architecture Change Map

All new code lives in `src/world/`. Declarations such as `LAND: Record<...>` and `BRIDGES: {...}[]` above describe exported shapes; each is a real initialised value in the code. Pure modules import nothing from React, Vite, the DOM or `src/data/nyc1984Data.ts`; tests run with `node --test`, import with the `.ts` extension, start with `/// <reference types="node" />`, and use erasable TypeScript only (no `enum`, no parameter properties).

Pinned interfaces (binding):

```ts
// src/world/cityData.ts — pure data, no images
export const WORLD_W = 6400, WORLD_H = 4240, CELL = 32;
export type Pt = { x: number; y: number };
export type GameBoroughId = 'manhattan_south' | 'midtown_concrete' | 'bronx_terminal' | 'brooklyn_docks' | 'queens_cargo';
export type AreaId = GameBoroughId | 'uptown' | 'staten_island';
export const LAND: Record<'manhattan' | 'bronx' | 'queens' | 'brooklyn' | 'staten_island' | 'new_jersey' | 'randalls', Pt[]>;
export const MANHATTAN_SPLIT_Y: { uptownBelow: number; midtownBelow: number }; // 1800 and 2480
export function boroughOutline(id: GameBoroughId): Pt[];
export const BRIDGES: { id: string; name: string; points: Pt[]; open: boolean }[];
export const FERRY_TERMINALS: { battery: Pt; stGeorge: Pt };
export const STATIONS: Record<GameBoroughId, Pt>;
export const START_POINT: Pt;
export const RACKET_IDS: readonly [...15 racket ids from nyc1984Data.ts]; export type RacketId = typeof RACKET_IDS[number];
export const CONTACT_IDS: readonly [...6 contact ids]; export type ContactId = typeof CONTACT_IDS[number];
export const RACKET_PLACEMENT: Record<RacketId, { x: number; y: number; width: number; height: number }>;
export const CONTACT_PLACEMENT: Record<ContactId, Pt>;
export const NEIGHBOURHOOD_LABELS: { name: string; x: number; y: number; area: AreaId | null }[];

// src/world/cityGen.ts
export const CellKind = { WATER: 0, OFFLIMITS: 1, ROAD: 2, SIDEWALK: 3, ALLEY: 4, PARK: 5, PIER: 6, PLAZA: 7, BRIDGE: 8, BUILDING: 9, BARRIER: 10 } as const;
// City.cols = WORLD_W / CELL = 200; City.rows = Math.ceil(WORLD_H / CELL) = 133; the half row past y 4240 is WATER
export interface Building { id: number; cx: number; cy: number; cw: number; ch: number; area: AreaId | null; style: string; palette: number; windows: number; storefront: string; roof: number; sign: string; racketId?: string }
export interface City { seed: number; cols: number; rows: number; kinds: Uint8Array; buildingAt: Int32Array; areaAt: Uint8Array; buildings: Building[]; lamps: Pt[] }
export function generateCity(seed?: number): City;
export function signatureOf(b: Building): string;
export function mulberry32(seed: number): () => number;
export function kindAt(city: City, x: number, y: number): number;
export function isWalkable(city: City, x: number, y: number): boolean;
export function isDrivable(city: City, x: number, y: number): boolean;
export function areaAtPoint(city: City, x: number, y: number): AreaId | null;
export function nearestWalkable(city: City, x: number, y: number, maxCells?: number): Pt | null;
export function randomWalkableIn(city: City, area: AreaId, rand: () => number): Pt;
export function moveWithCollision(city: City, x: number, y: number, dx: number, dy: number, radius: number): Pt;
export function blocksBullet(city: City, x: number, y: number): boolean;

// src/world/pathfind.ts
export interface FlowField { cx: number; cy: number; radius: number; dist: Int16Array }
export function buildFlowField(city: City, targetX: number, targetY: number, radiusCells: number): FlowField;
export function flowDirection(field: FlowField, city: City, x: number, y: number): { dx: number; dy: number } | null;
export interface StuckTracker { lastX: number; lastY: number; still: number }
export function createStuckTracker(x: number, y: number): StuckTracker;
export function updateStuck(t: StuckTracker, x: number, y: number, dt: number, trying: boolean): boolean; // true after 2 s without progress

// src/world/traffic.ts
export interface Car { x: number; y: number; dir: 0 | 1 | 2 | 3; speed: number; color: string; isPolice: boolean }
export function spawnTraffic(city: City, count: number, rand: () => number): Car[];
export function stepTraffic(cars: Car[], city: City, dt: number, rand: () => number): void;

// src/world/chunkCache.ts and cityRender.ts
export const CHUNK = 512, MAX_CHUNKS = 24;
export function createChunkCache<T>(max: number, make: (cx: number, cy: number) => T, dispose?: (t: T) => void): { get(cx: number, cy: number): T; size(): number };
export function drawCityChunk(ctx: CanvasRenderingContext2D, city: City, chunkX: number, chunkY: number): void;
export function drawCityOverlay(ctx: CanvasRenderingContext2D, city: City, view: { x: number; y: number; w: number; h: number }, timeSec: number): void;

// src/world/saveMerge.ts
export function mergeSavedById<T extends { id: string }>(defaults: T[], saved: Partial<T>[] | undefined, keep: (keyof T)[]): T[];

// src/world/bridgeTypes.ts (T-001)
export type InteractPrompt = { type: 'racket' | 'contact' | 'npc' | 'ferry'; label: string; sublabel: string; id: string };

// Ferry and tour (canvas and App)
// prompt type gains 'ferry' (id 'battery' | 'st_george'); canvas bridge gains takeFerry(): void;
// HUD gains onTakeFerry prop; with ?tour the canvas sets window.__cityTour = { teleport(x: number, y: number): void; frameTimeMs(): number }
```

| Surface | Current evidence | Change | Task |
|---|---|---|---|
| City data | rectangles in `nyc1984Data.ts:232-296` | `cityData.ts`: outlines from the turf map times 4, bridges, ferry, stations, racket and contact placement, labels, parks, piers, special areas | T-001 |
| City generation | none | `cityGen.ts`: cell grid, block layout (alley row on top, one building row facing south, sidewalk, road), unique buildings and signs per borough style set, lamps, helpers, collision | T-001 |
| Rendering | rectangles at `NycWorldCanvas.tsx:1285-1380` | `cityRender.ts` draws tiles and three-quarter buildings per 512 piece; `chunkCache.ts` LRU; the engine keeps a one-piece ring around the view drawn ahead, at most one new piece per frame | T-002, T-005 |
| Movement | straight lines | `pathfind.ts` flow field and stuck rule; `traffic.ts` lane driving | T-003 |
| Data and save | positions in data and save | `nyc1984Data.ts` reads outlines and positions from `cityData.ts`; `App.tsx` merges saved rackets via `saveMerge.ts`; ferry prompt type and HUD branch | T-004 |
| Engine core | old map, no collision | `NycWorldCanvas.tsx`: world size, piece drawing, collision, bullets, spawns, borough detection, ferry, tour hook | T-005 |
| Engine movement | straight-line AI and wrapping cars | `NycWorldCanvas.tsx`: flow-field chasing, stuck rule, Uptown and Staten Island civilians, lane traffic | T-009 |
| CI | no unit tests | Check runs `node --test "src/**/*.test.ts"` and `scripts/city-tour.mjs` | T-006 |

## Binding Fields

Task deliverables and coverage; the spec's constraints (guardrails, no images, no new runtime dependencies, save key unchanged, pure modules); verification EV-001 to EV-015; external effects limited to pushing the branch and merging into main once Check is green; the pinned interfaces above.

## Adaptable Fields

Private symbols and extra files inside an owned boundary (may update `ownership`); internal tactics, worker assignment and evidence-equivalent commands (may update `adaptable_values`). Any amendment records reason and risk and revalidates coverage, dependencies, ownership, interfaces, concurrency and verification. Anything else returns to plan approval.

## Risks and Resolved Assumptions

| Entry | Evidence | Tasks | If wrong | Mitigation | Impact |
|---|---|---|---|---|---|
| Phone performance | 6400 × 4240 city, S26 | T-002, T-005 | stutter | pieces drawn once and cached; only visible pieces drawn; tour prints frame time | high |
| Canvas code cannot be run here | no node_modules | T-002, T-005 | runtime errors appear only in CI | T-002 smoke-tests every draw path against a recording fake context; CI tour fails on page errors | medium |
| Racket placement must match generated lots | T-001 owns both | T-001, T-004 | racket in a wall | T-001 test AC-005; T-004 only reads the data | medium |
| T-004 and T-005 both change the prompt type | `NycWorldCanvas.tsx:102`, `App.tsx:78` | T-004, T-005 | type error until both land | pinned union; CI runs after T-005 | low |
| Tour depends on the hook T-005 adds | FR-020 | T-006, T-005 | tour fails | pinned hook shape; tour runs only after integration | low |

## Requirement Coverage

| Requirement | Task |
|---|---|
| FR-001 | T-001 (constants), T-005 (engine) |
| FR-002, FR-004, FR-005 | T-001 |
| FR-003 | T-004 (data), T-005 (detection) |
| FR-006, FR-007 | T-001 (generation), T-002 (drawing) |
| FR-008 | T-001 |
| FR-009 | T-005 (with T-001 helpers) |
| FR-010 | T-005 (spawns), T-009 (unclaimed civilians) |
| FR-011, FR-012 | T-003 (logic), T-009 (use) |
| FR-013 | T-004 (App and HUD), T-005 (canvas) |
| FR-014, FR-015 | T-002 (drawing), T-005 (use) |
| FR-016 | T-001 (labels), T-002 (drawing) |
| FR-017 | T-004 |
| FR-018, FR-020 | T-005 |
| FR-019 | T-006 |

## Verification Coverage

| Criterion | Task | Evidence | Proof |
|---|---|---|---|
| AC-001, AC-002, AC-003, AC-004, AC-005 | T-001 | EV-001 | `node --test src/world/cityGen.test.ts` passes |
| AC-009 | T-002 | EV-003 | `node --test src/world/cityRender.test.ts` passes, including a draw smoke test of every piece against a recording fake context |
| AC-007, AC-008 | T-003 | EV-005 | `node --test src/world/movement.test.ts` passes |
| AC-006 | T-004 | EV-007 | `node --test src/world/saveMerge.test.ts` passes |
| AC-010 | T-005, T-009 | EV-011, EV-017 | fresh reviewers' readings of the two engine diffs |
| AC-011 | T-006, T-007 | EV-009, EV-012 | reviewer reads the workflow; Check run on the branch head is green |
| AC-012 | T-007 | EV-013 | `CITY_TOUR_REPORT` line from the Check log copied into evidence |
| AC-013 | T-007 | EV-014 | controller rebuilds the six screenshots from the Check log and records what each shows |
| AC-014 | T-008 | EV-015 | user's written confirmation |

EV-002, EV-004, EV-006 and EV-008 are the fresh reviewers' readings of T-001 to T-004; EV-010 and EV-016 are the unit-test runs after T-005 and T-009.

## Dependency Graph

T-001 first, because every other task consumes its interface. Then wave 2, in parallel with disjoint files: T-002, T-003, T-004, T-006. Then T-005, then T-009, both editing the engine and so sequential. Then T-007 on the pushed branch, then T-008 after the merge and deploy. Wave commits are integrated locally and nothing is pushed until T-009 is merged, because T-004 calls `takeFerry`, which T-005 adds to the bridge type. The controller integrates in the order T-001, T-002, T-003, T-004, T-006, T-005 and is the only writer of `CLAUDE.md`.

## Task Contracts

### T-001

**Deliverable:** A deterministic, fully tested city: land and water, streets, bridges, parks and piers, unique buildings and signs, racket and contact placement, and the helpers everything else uses.
**Covers:** FR-001, FR-002, FR-004, FR-005, FR-006, FR-007, FR-008, FR-016; AC-001, AC-002, AC-003, AC-004, AC-005.
**Dependencies and readiness:** none.
**Ownership:** `src/world/cityData.ts`, `src/world/cityGen.ts`, `src/world/cityGen.test.ts`, `src/world/bridgeTypes.ts`, optional helpers under `src/world/city/`.
**Interfaces consumed:** design canvas coordinates; racket ids, names and `boroughId`, contact ids (read from `nyc1984Data.ts` by hand, not imported).
**Interfaces produced:** cityData, cityGen and bridgeTypes as pinned.
**Concrete change:** Outlines are the turf map's points times 4. Cells are classified by point-in-polygon. Each land area gets an axis-aligned grid with avenues every few blocks, alleys, sidewalks, parks, piers, rail yards, Hunts Point market and the JFK cargo area. Bridges are rasterised 3 cells wide along their polylines; the George Washington Bridge ends in BARRIER cells. Building lots are cut from each block's building row with seeded widths; each building gets style, palette, window pattern, storefront, roof set and sign from its area's style set, retrying until its signature is unused; sign names are built from invented part lists and checked unique. Racket placement rects are chosen to be lots in the right borough near the turf-map pins, with the door below on a sidewalk; contacts sit on sidewalks.
**Verification:** EV-001: `node --test src/world/cityGen.test.ts` passes, guarding AC-001 to AC-005 as written in the spec, plus a test that reads `src/data/nyc1984Data.ts` as plain text and checks its racket and contact ids equal `RACKET_IDS` and `CONTACT_IDS`.
**Documentation, migration, and rollback:** worker reports lines for CLAUDE.md; revert to roll back.
**Delegation and integration:** fresh Opus worker in its own worktree; fresh Opus reviewer (EV-002).
**Commit boundary:** one commit, merged by the controller.
**Done:** EV-001 and EV-002 pass; merged.

### T-002

**Deliverable:** The city drawn: tiles, three-quarter buildings with fronts, signs, neon, roofs, lamps and labels, in cached 512 pieces plus a per-frame glow overlay.
**Covers:** FR-006, FR-014, FR-015, FR-016; AC-009.
**Dependencies and readiness:** T-001 merged.
**Ownership:** `src/world/cityRender.ts`, `src/world/chunkCache.ts`, `src/world/cityRender.test.ts`.
**Interfaces consumed:** cityGen.
**Interfaces produced:** drawCityChunk, drawCityOverlay, createChunkCache as pinned.
**Concrete change:** Port the look of the design canvas (tile kit, props, Bronx buildings) to canvas 2D drawing per building style and per borough; buildings straddling a piece edge are drawn into each piece; no images, no DOM access at module load.
**Verification:** EV-003: `node --test src/world/cityRender.test.ts` passes: the cache never exceeds 24 and evicts least recently used; the pieces needed for a 915 × 412 and a 1920 × 1080 view plus a one-piece ring never exceed 24; every piece of the generated city draws against a recording fake context without throwing. EV-004: fresh reviewer.
**Documentation, migration, and rollback:** worker reports a CLAUDE.md line; revert to roll back.
**Delegation and integration:** fresh Opus worker; fresh Opus reviewer.
**Commit boundary:** one commit.
**Done:** EV-003 and EV-004 pass; merged.

### T-003

**Deliverable:** Enemies that find their way around buildings, an unstick rule, and traffic that keeps to roads and crosses bridges.
**Covers:** FR-011, FR-012; AC-007, AC-008.
**Dependencies and readiness:** T-001 merged.
**Ownership:** `src/world/pathfind.ts`, `src/world/traffic.ts`, `src/world/movement.test.ts`.
**Interfaces consumed:** cityGen.
**Interfaces produced:** pathfind and traffic as pinned.
**Concrete change:** Breadth-first flow field over walkable cells within a radius of the target; direction from the lowest neighbour. Cars move along road and bridge cells in their direction, choosing a drivable turn at junctions with the seeded random function.
**Verification:** EV-005: `node --test src/world/movement.test.ts` passes for AC-007 and AC-008 as written. EV-006: fresh reviewer.
**Documentation, migration, and rollback:** worker reports a CLAUDE.md line; revert to roll back.
**Delegation and integration:** fresh Opus worker; fresh Opus reviewer.
**Commit boundary:** one commit.
**Done:** EV-005 and EV-006 pass; merged.

### T-004

**Deliverable:** Game data on the new map, old saves that land safely, and the ferry prompt wired through App and the HUD.
**Covers:** FR-003, FR-013, FR-017; AC-006.
**Dependencies and readiness:** T-001 merged.
**Ownership:** `src/data/nyc1984Data.ts`, `src/App.tsx`, `src/components/PerimeterHud.tsx`, `src/world/saveMerge.ts`, `src/world/saveMerge.test.ts`.
**Interfaces consumed:** cityData.
**Interfaces produced:** borough `outline`, `bounds` and `spawnPoint` from cityData; racket and contact positions from cityData, typed against `RacketId` and `ContactId`; `mergeSavedById`; App and HUD prompt state typed as `InteractPrompt` from bridgeTypes; HUD `onTakeFerry` prop calling `bridgeRef.current.takeFerry()`.
**Concrete change:** `nyc1984Data.ts` imports only from `cityData.ts`; App restores rackets through `mergeSavedById(INITIAL_RACKETS, parsed.rackets, ['ownerFamily', 'level', 'uncollectedCash'])`; the HUD prompt button calls `onTakeFerry` when the prompt type is `'ferry'`.
**Verification:** EV-007: `node --test src/world/saveMerge.test.ts` passes for AC-006. EV-008: fresh reviewer.
**Documentation, migration, and rollback:** worker reports a CLAUDE.md line; revert to roll back.
**Delegation and integration:** fresh Opus worker; fresh Opus reviewer.
**Commit boundary:** one commit.
**Done:** EV-007 and EV-008 pass; merged.

### T-006

**Deliverable:** Check runs every unit test and a city tour of the real build.
**Covers:** FR-019; AC-011.
**Dependencies and readiness:** T-001 merged (for coordinates).
**Ownership:** `.github/workflows/check.yml`, `scripts/city-tour.mjs`.
**Interfaces consumed:** ferry terminal and station points; pinned tour hook.
**Interfaces produced:** `CITY_TOUR_REPORT` log line and `city-tour-shots` artifact.
**Concrete change:** Add `node --test "src/**/*.test.ts"` after install. Add the tour after the phone-layout check: serve `dist/`, open with `?tour`, start a game, open the dossier Turf tab and press each Travel Here in order with a screenshot after each, teleport to the Battery terminal with `window.__cityTour.teleport`, take the ferry through the prompt, screenshot Staten Island; fail on page errors or a blank city (sampled canvas pixels all one colour); print average frame time from `window.__cityTour.frameTimeMs()` and the slowest piece draw time; save each of the six screenshots as a 915 × 412 JPEG at about 60% quality and print it base64-encoded in the log as `CITY_SHOT <n> <index> <chunk>` lines of about 4 KB, so the controller can rebuild it from `gh run view --log`.
**Verification:** EV-009: fresh reviewer reads the workflow and script; the run itself is EV-012 and EV-013.
**Documentation, migration, and rollback:** worker reports the CLAUDE.md CI line; revert to roll back.
**Delegation and integration:** fresh Opus worker; fresh Opus reviewer.
**Commit boundary:** one commit.
**Done:** EV-009 passes; merged.

### T-005

**Deliverable:** The playable city in the engine.
**Covers:** FR-001, FR-003, FR-009, FR-010, FR-013, FR-014, FR-015, FR-018, FR-020; AC-010.
**Dependencies and readiness:** T-001, T-002, T-003, T-004 and T-006 merged.
**Ownership:** `src/components/NycWorldCanvas.tsx`.
**Interfaces consumed:** every world module; ferry callback; tour hook shape.
**Interfaces produced:** `takeFerry()` on the bridge; `window.__cityTour` with `?tour`.
**Concrete change:** Replace world constants with `WORLD_W`, `WORLD_H`; generate the city once per mount; draw visible pieces from the cache then the overlay, replacing the old ground drawing, with a one-piece ring drawn ahead at most one new piece per frame; player, NPC and ally movement through `moveWithCollision`; bullets removed when `blocksBullet`; every spawn through `randomWalkableIn`, `nearestWalkable` and `STATIONS`; borough detection with `areaAtPoint` and no callback outside game boroughs; prompt typed as `InteractPrompt`, ferry prompt, E and `takeFerry` with a short fade; `LiveSimulationBridge` gains `takeFerry`; the tour hook only with `?tour`, including slowest piece draw time. Existing NPC wander and car code stays as is for T-009. Keyboard, mouse and touch paths unchanged.
**Verification:** EV-010: `node --test "src/**/*.test.ts"` still passes. EV-011: fresh reviewer checks the AC-010 points this task owns.

### T-009

**Deliverable:** Enemies and cars that move sensibly in the new city.
**Covers:** FR-010, FR-011, FR-012; AC-010.
**Dependencies and readiness:** T-005 merged.
**Ownership:** `src/components/NycWorldCanvas.tsx`.
**Interfaces consumed:** pathfind and traffic modules; T-005's engine.
**Interfaces produced:** none new.
**Concrete change:** Chasing NPCs and allies follow a shared flow field rebuilt about twice a second around the player, with the stuck rule; patrols walk sidewalks near their origin; 6 civilians each spawn and respawn in Uptown and Staten Island; the old wrapping cars are replaced by `spawnTraffic` and `stepTraffic` with about 40 cars, one in ten police.
**Verification:** EV-016: `node --test "src/**/*.test.ts"` passes. EV-017: fresh reviewer checks the AC-010 points this task owns.
**Documentation, migration, and rollback:** worker reports CLAUDE.md lines; revert to roll back.
**Delegation and integration:** fresh Opus worker; fresh Opus reviewer.
**Commit boundary:** one commit.
**Done:** EV-016 and EV-017 pass; merged.
**Documentation, migration, and rollback:** worker reports CLAUDE.md lines; revert to roll back.
**Delegation and integration:** fresh Opus worker; fresh Opus reviewer.
**Commit boundary:** one commit.
**Done:** EV-010 and EV-011 pass; merged.

### T-007

**Deliverable:** Proof on the real build.
**Covers:** AC-011, AC-012, AC-013.
**Dependencies and readiness:** T-001 to T-006 and T-009 merged; branch pushed.
**Ownership:** the feature folder's `evidence/` and the branch index.
**Concrete change:** Push; EV-012: `gh run list` shows Check green on the head commit (a red run is fixed forward in the owning task's files, which reopens it). EV-013: copy the `CITY_TOUR_REPORT` and `PHONE_LAYOUT_REPORT` lines from the log into evidence. EV-014: the controller rebuilds the six JPEGs from the `CITY_SHOT` log lines, views them, and records what each shows in evidence. A fresh whole-change reviewer reads the full diff before merge.
**Done:** all three evidence items recorded; whole-change review has no blocking finding; merged into main.

### T-008

**Deliverable:** The user's phone test.
**Covers:** AC-014.
**Dependencies and readiness:** merged and deployed.
**Concrete change:** EV-015: the controller gives the user a checklist and records the answers in `evidence/device-test.md`.
**Done:** the user confirms each item.

## Execution and Landing

T-001 runs alone; wave 2 dispatches T-002, T-003, T-004 and T-006 together in separate worktrees; T-005 and then T-009 follow; then T-007. Nothing is pushed until T-009 is merged. Verification runs once per boundary. Landing: implemented, verified, committed and pushed on the branch; merged into main once Check is green and the whole-change review passes; deployment follows automatically when Pages is enabled; the workflow parks for T-008.

## Plan Readiness Review

- Bound to spec revision 1 and its digest.
- Every FR and AC is covered; no unknown ids.
- Tasks are slices; T-001 is a full deliverable consumed by an actual wave.
- Wave-2 ownership is disjoint; T-005 is sequenced because it consumes all four.
- Every EV has a command or a named reviewer.
- No implementation before plan approval.
