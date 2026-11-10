<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "specification",
  "specification_id": "city-map",
  "revision": 1,
  "path": {"scope": "repository", "value": "spec-driven-development/city-map/spec.md"},
  "required_sections": [
    "Context and Evidence",
    "Decisions and Assumptions",
    "Goals and Non-Goals",
    "Workflows",
    "Requirements",
    "Acceptance Criteria",
    "Error and Recovery",
    "Constraints",
    "Risks and Alternatives",
    "Readiness Review"
  ],
  "requirements": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-012", "FR-013", "FR-014", "FR-015", "FR-016", "FR-017", "FR-018", "FR-019", "FR-020"],
  "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008", "AC-009", "AC-010", "AC-011", "AC-012", "AC-013", "AC-014"]
}
<!-- sdd-contract-end -->

# Real City Map — Specification

**Path:** `spec-driven-development/city-map/spec.md` · **Revision:** 1 · **Kind:** specification · **Schema:** 1

<!-- sdd-approval-begin -->
**Approval status:** Awaiting user approval
**Approved revision:** Not approved
**Approved normative digest:** Not approved
**Approver:** Not approved
**Approval timestamp:** Not approved
<!-- sdd-approval-end -->

## Context and Evidence

The request is to replace the game's placeholder map with a real, drawn New York: every borough built from 2D graphics, nothing repeated. Repository `ertas-del/Mafia-Wars`, branch `ertas-del/new/city-map` from `main` at `7411430`. Repository instructions are `CLAUDE.md`. The look and layout come from the "NYC 1984 Game Map" design canvas made in this session (turf map, tile kit, props kit, Bronx scene, Bronx buildings, Bronx layout).

Current-state evidence:

- The world is 3200 × 2120 (`WORLD_WIDTH`, `WORLD_HEIGHT`, `src/components/NycWorldCanvas.tsx:135`), drawn at one world pixel per screen pixel, so a phone in landscape sees about 915 × 412 of it.
- The five game boroughs are rectangles: `NYC_BOROUGHS[].bounds` and `spawnPoint` in `src/data/nyc1984Data.ts:232-296`. Manhattan is two of them (`manhattan_south`, `midtown_concrete`). The canvas uses `bounds` for street NPC spawns and respawns (`:397`, `:1074`), turf waves and teleports (`:460`, `:476`), and current-borough detection (`:835`).
- The ground is drawn as five dark rectangles with a 90 px line grid, two crossing grey road bars and a horizontal road (`:1285-1380`). Nothing blocks movement except the world edge clamp (`:809`).
- Rackets have world `x`, `y`, `width`, `height` (`nyc1984Data.ts` from line 305) and are drawn as boxes with a door; the interact prompt sits under the door (`NycWorldCanvas.tsx:889`). Contacts have `worldX`, `worldY` (`nyc1984Data.ts:74`).
- The save (`commission_1984_empire_v1`, `src/App.tsx:253-270`) stores the whole `rackets` and `contacts` arrays. On load, rackets are restored wholesale, positions included (`App.tsx:208`); contacts are already merged by id keeping only `respect` (`App.tsx:209-214`). No player position is saved; the start point is fixed in the canvas (`NycWorldCanvas.tsx:296-310`).
- `src/data/nyc1984Data.ts:1-4` imports four `.jpg` portraits, so that module cannot be loaded by `node --test`.
- The Check workflow (`.github/workflows/check.yml`) runs install, lint, build, the portrait check and the phone-layout check, but no unit tests.
- On a 915 × 412 screen the HUD's five borough buttons are hidden (`PerimeterHud.tsx:161`); the dossier Turf tab's five "Travel Here" buttons (`SyndicateDrawers.tsx:289-300`) remain. The HUD prompt opens the Turf dossier for anything that is not a contact (`PerimeterHud.tsx:349-353`).
- NPCs move straight toward targets with no pathfinding (patrol wander and chase, `NycWorldCanvas.tsx:1100-1235`); street cars drive straight lines and wrap around the world edge (`:1244`).
- Interact prompts are typed `'racket' | 'contact' | 'npc'` (`NycWorldCanvas.tsx:102`); `E` or the HUD prompt opens the matching drawer.
- Package installs are blocked in this session, so the game cannot be built or run here. Pure modules can be tested with `node --test` on Node 22; CI builds, type-checks and runs the phone-layout check on every push.

## Decisions and Assumptions

Confirmed user decisions (this session):

- D1 Real in-game map for all boroughs, drawn as 2D graphics, with no duplicate buildings.
- D2 Double the world to 6400 × 4240.
- D3 Buildings are solid; people and cars use streets, sidewalks, alleys, parks, piers and bridges.
- D4 Staten Island is walkable with real streets, reached by the Verrazzano or the ferry, unclaimed, with no rackets.
- D5 The layout follows the design canvas: Manhattan one long island split into Corvini downtown and Bellini midtown with Uptown unclaimed; the Bronx, Queens and Brooklyn in their real places; New Jersey off the map; the named bridges as the crossings.
- D6 Helpers run Opus at high effort; merge into main once every check passes.

Open questions: none.

### Depth and Defaults

| Component or default | Chosen depth or value | Basis | Impact | Alternative not taken | Can the product's user override it? |
|---|---|---|---|---|---|
| "No duplicates" | Each building's look signature is the tuple of its discrete choices: style, footprint width × height in cells, palette entry, window pattern, storefront type, roof item set and sign name, excluding position and id. No two buildings in the city, the 15 racket landmarks included, share a signature, and no two signs share a name | D1; exact rule agent judgment | high | Every building hand-drawn as its own picture, which needs an outside art tool | No |
| Graphics source | Every tile and building drawn by code at load time from seeded rules in the style of the design canvas; no image files | agent judgment | high | Painted image assets from Ludo or an asset site, which this session cannot make | No |
| Street direction | Streets run straight across and down in every borough; coastlines follow the real shapes | agent judgment | high | Tilted street grids like real Manhattan, which makes walls and walking much harder | No |
| Old saves | Rackets keep `ownerFamily`, `level` and `uncollectedCash` from the save, contacts keep `respect`; positions, sizes and every other field always come from the new map data | agent judgment | high | Wipe old saves | No |
| Unclaimed areas | Uptown, Staten Island and the ferry piers count as "no borough": the HUD keeps showing the last borough you were in and no borough-based modifiers apply there (fights still add heat as anywhere) | agent judgment | medium | Make them a sixth game borough | No |
| Map scale | The design canvas turf map times 4 | D2, D5 | medium | Redraw the coastlines from scratch | No |
| Ground grid | 32 px cells; a city block is 6 to 10 cells a side; avenues 3 cells wide, side streets 2, sidewalks 1, alleys 1 | agent judgment | medium | Free-form shapes with no grid | No |
| Building view | Three-quarter view: the roof on top, the front face toward the street below it, all inside the building's own footprint so characters never pass behind one | design canvas; agent judgment | medium | True overlapping depth, which needs per-object sorting | No |
| Borough styles | Lower Manhattan: tenements, cobbled Little Italy, Financial District stone; Midtown: towers, theatres, neon around 42nd St; Uptown: brownstones; the Bronx: tenements, Arthur Ave shops, warehouses; Brooklyn: brownstones, piers, warehouses; Queens: rowhouses, airport hangars, lounges; Staten Island: small houses, greenbelt | design canvas; agent judgment | medium | One style city-wide | No |
| Shop names | Built from invented name parts per borough and trade (for example family surname plus trade), checked unique; no real business names | agent judgment | medium | Hand-written list | No |
| Enemy movement | Enemies chasing you follow a path around buildings, refreshed about twice a second; patrols walk the sidewalks | D3; agent judgment | medium | Straight-line chase that gets stuck on walls | No |
| Traffic | About 40 cars on road lanes, turning at junctions and crossing bridges; one in ten a police car; cars no longer wrap around the world edge | agent judgment | medium | Keep straight wrapping lines | No |
| Ferry | Terminals at the Battery and St. George; walk up and press E or tap the prompt to cross with a short fade | D4; agent judgment | medium |
| Racket placement | A racket's `boroughId` decides its borough; it stands in the neighbourhood its name gives when that lies in the borough, otherwise at the nearest fitting lot inside the borough (the Garment Center racket sits at the north edge of Lower Manhattan) | agent judgment | low | Move the racket to Midtown in the data | No |
| Tour hook | With `?tour` in the page address only, the page exposes a small teleport call for the automated city tour; without it nothing changes | agent judgment | low | Script the tour by steering the touch stick | No | A boat you ride in real time | No |
| Bridges | Brooklyn, Williamsburg, Queensboro, Triborough (three arms), Verrazzano; walkable and drivable, 3 cells wide; the George Washington Bridge blocked at a barrier | D5 | medium | More bridges | No |
| Fast travel | The five borough buttons land you at a subway station in that borough | design canvas | low | Land at the borough centre | No |
| Labels | Neighbourhood names from the design canvas painted faintly on the ground at each district centre | design canvas | low | No labels | No |
| Street lighting | Street lamps along sidewalks every few blocks with warm light pools; neon signs on storefronts | design canvas | low | Unlit streets | No |
| Drawing speed | The city is drawn once into 512 × 512 pieces as you approach them, keeping at most 24 in memory | agent judgment | low | Draw every building every frame | No |
| Street NPC count | 8 per game borough as today, plus 6 civilians each in Uptown and Staten Island | agent judgment | low | Scale NPCs with area | No |

Rejected alternatives: keeping the 3200 × 2120 world (D2); walk-through buildings (D3); Staten Island as a sixth borough or left off (D4).

## Goals and Non-Goals

Goals: a believable, fully drawn 1984 New York at 6400 × 4240 with real borough shapes, water and bridges; solid buildings with every building and sign unique; the 15 rackets and 6 contacts in their real neighbourhoods; characters and cars that move sensibly on the new streets; old saves keep working; smooth on the S26.

Non-goals: painted image assets; interiors; a minimap; Staten Island rackets or a sixth family; changes to combat numbers, economy, skills, the dossier or touch controls; renaming the existing street NPCs (noted under Risks).

## Workflows

1. **Arrive.** The player starts or fast-travels into a borough and appears at a subway station on a sidewalk, surrounded by drawn buildings, shopfronts, street lamps and parked cars.
2. **Walk the city.** The player walks streets and sidewalks; buildings and water stop them and they slide along walls; they cross rivers only on bridges, or on the ferry to Staten Island.
3. **Find a racket.** Each racket is its own landmark building with its sign; standing at its door shows the existing prompt.
4. **Fight.** Rival soldati chase the player around corners; bullets hit walls; cars keep to their lanes.
5. **Load an old save.** Owned rackets and contact respect come back; everything stands at its new place on the map.

## Requirements

- FR-001 The world is 6400 × 4240; every world-size constant, edge clamp and camera limit uses it.
- FR-002 Land and water follow the design canvas turf map scaled by 4: Manhattan, the Bronx, Queens, Brooklyn and Staten Island as land; the Hudson, East River, Harlem River, Upper Bay, Jamaica Bay and Long Island Sound as water; New Jersey drawn as off-limits land. Manhattan is split into Lower Manhattan (`manhattan_south`), Midtown (`midtown_concrete`) and unclaimed Uptown along the lines on the design canvas.
- FR-003 Each game borough in `NYC_BOROUGHS` gains an outline polygon matching its land; its `bounds` becomes that outline's bounding box; current-borough detection uses the outline; outside every game borough (Uptown, Staten Island) the last game borough stays current and no borough-change callback fires.
- FR-004 The ground is a grid of 32 px cells, each one of: water, off-limits, road, sidewalk, alley, park, pier, plaza, bridge or building. Roads form straight blocks with avenues and side streets, sidewalks line every road, and the named parks, piers, rail yards, Hunts Point market and the JFK cargo area sit in their places from the design canvas.
- FR-005 The Brooklyn, Williamsburg, Queensboro, Triborough (three arms) and Verrazzano bridges join their shores as walkable, drivable bridge cells; the George Washington Bridge is drawn but blocked by a barrier at its Manhattan end.
- FR-006 Every building lot holds one building generated from its borough's style set, drawn in three-quarter view inside its footprint. No two buildings in the city have the same look (style, size, colours, windows, storefront and roof items together), and the same seed always produces the same city.
- FR-007 Storefronts carry invented names that are unique across the city; no sign uses a real business name.
- FR-008 Each of the 15 rackets is a landmark building with its own name sign inside its data `boroughId`, in the neighbourhood its name gives when that lies in the borough and otherwise at the nearest fitting lot, with its door on a sidewalk; its interaction point, cash envelopes and guard spawns are on walkable cells beside the door. The 6 contacts stand on walkable cells in their boroughs.
- FR-009 Buildings, water, off-limits land and the blocked bridge stop the player, NPCs and allies, who slide along edges instead of sticking; bullets stop when they hit a building.
- FR-010 Every spawn and placement (start, fast travel, street NPCs and respawns, turf defence waves, hit squads, police, teleports) lands on a walkable cell in the intended borough or area; fast travel lands at that borough's subway station. Uptown and Staten Island each keep 6 civilians, who spawn and respawn in their own area.
- FR-011 Chasing enemies follow a path around buildings to the player, refreshed about twice a second; patrols walk sidewalks near their origin; any NPC that has not moved for 2 seconds while trying to picks a new walkable target.
- FR-012 About 40 cars drive on road and bridge cells only, keep to lanes, turn at junctions and never wrap around the world; one in ten is a police car.
- FR-013 The ferry runs between terminals at the Battery and St. George: standing at a terminal shows a new `'ferry'` type of interact prompt, "Take the ferry"; pressing E, or tapping the HUD prompt (a new ferry branch beside the contact and racket ones), moves the player to the other terminal with a short fade through a call the canvas exposes.
- FR-014 The city is drawn into 512 × 512 pieces when first needed and at most 24 are kept; each frame draws only the visible pieces under the characters.
- FR-015 Street lamps with warm light pools stand along sidewalks, storefront neon signs glow, and the existing rain still falls.
- FR-016 Neighbourhood names from the design canvas are painted faintly on the ground at their district centres.
- FR-017 Loading a save merges rackets by id like contacts: every field comes from the current data except `ownerFamily`, `level` and `uncollectedCash`, which come from the save; ids missing from the save use the default data; contacts keep their existing merge.
- FR-018 Keyboard, mouse and touch controls, combat, the HUD, the dossier and the economy behave as before apart from the new positions.
- FR-019 The Check workflow runs `node --test` over every `*.test.ts` file under `src/` and fails if any test fails; CLAUDE.md names that command.
- FR-020 With `?tour` in the page address the game exposes `window.__cityTour` with a teleport-to-point call and a frame-time reading; without it nothing is exposed and nothing changes.

## Acceptance Criteria

- AC-001 (FR-001, FR-006) Unit tests show the generator returns a 6400 × 4240 city and the same city for the same seed.
- AC-002 (FR-002, FR-004, FR-005) Unit tests show sample points in each named river and bay are water, each borough's spawn station is walkable, no building cell lies on water, the bridges are bridge cells end to end, and the George Washington Bridge is blocked.
- AC-003 (FR-002, FR-005, FR-013) Unit tests show a walking search from every borough's station reaches every other borough's station and Staten Island over bridges, and the two ferry terminals are walkable.
- AC-004 (FR-006, FR-007) Unit tests show every building's look signature (the discrete tuple defined in Depth and Defaults, racket landmarks included) and every sign name are unique across the whole city, and that signatures contain no position or id.
- AC-005 (FR-008, FR-010) Unit tests show every racket footprint is a building lot inside its borough with a walkable door cell, every contact and spawn result is walkable and in the right borough or area.
- AC-006 (FR-017) Unit tests of the save-merge function show old racket positions and sizes replaced, `ownerFamily`, `level` and `uncollectedCash` kept, and missing ids filled from defaults.
- AC-007 (FR-011) Unit tests show the path search leads around a building to a target behind it, and the stuck rule picks a new walkable target.
- AC-008 (FR-012) A unit test simulating traffic for 2,000 fixed 1/60 s steps with a fixed random seed shows every car always on road or bridge cells and at least one crossing a bridge.
- AC-009 (FR-014) A unit test shows the piece cache never holds more than 24 pieces.
- AC-010 (FR-003, FR-009, FR-010, FR-013, FR-018) Code review shows borough detection by outline, wall and water collision for player, NPCs and allies with sliding, bullets stopped by buildings, every spawn path using the walkable helpers, the ferry prompt wired through E and the HUD, and controls untouched.
- AC-011 (FR-001 to FR-020) The Check workflow passes on the pushed branch: install, type check, build, the unit-test step and the existing phone-layout check.
- AC-012 (FR-006, FR-014, FR-015, FR-016, FR-020) A new Check workflow step plays the real build in Chromium at 915 × 412 with `?tour`, uses the dossier Turf tab's five Travel Here buttons in order to reach each game borough, uses `window.__cityTour` to stand at the Battery ferry terminal and the ferry prompt to cross to Staten Island, saves a screenshot of each of the six, fails if the city area is blank or the page throws, and prints the average frame time measured with `requestAnimationFrame` in the page; the report and screenshots are kept as evidence.
- AC-013 (FR-006, FR-015) The controller reviews the six screenshots and confirms distinct, fully drawn streets in each, with no repeated building visible.
- AC-014 (FR-002 to FR-013, FR-018) The user plays on the S26 after merge and confirms walking, walls, bridges, the ferry, racket doors and smooth movement.

## Error and Recovery

A save that cannot be read starts a new game as today. If a spawn search finds no walkable cell nearby, it falls back to the borough's station. A piece that fails to draw is drawn again next frame; the game never shows a blank city. If a path search fails, the enemy walks straight at the player and the stuck rule takes over.

## Constraints

Keep the CLAUDE.md guardrails: at least 85% of the playfield clear, no backdrop blur over the canvas, tabular numerals, portrait fallbacks. The 60 fps loop is never re-mounted. No new runtime dependencies and no image files; the save key stays `commission_1984_empire_v1`. Generator, path search, traffic, cache and save-merge logic live in pure modules testable with `node --test`; borough outlines, racket and contact positions and station points live in a pure data module that imports no images, which `nyc1984Data.ts` reads from, and no tested module imports `nyc1984Data.ts`. Touch controls and their tests keep passing.

## Risks and Alternatives

The game cannot be built here; CI and the city-tour screenshots are the proof before the user's own test. Drawing a city this size is the biggest performance risk on a phone, which is why pieces are drawn once and cached. Code-drawn buildings will look clean and graphic rather than painted; if the user wants painted art later, the same layout can swap pieces for images. The existing street NPC list includes names of real people (for example `Vinnie "The Chin" Gigante`, `NycWorldCanvas.tsx:387`); it is outside this change but worth replacing with the invented cast in a follow-up, especially once the repository is public.

## Readiness Review

- Material questions resolved: yes.
- Goals, non-goals, workflows, requirements, constraints and criteria agree: yes.
- Every agent-judgment default is in the table: yes.
- Identifiers unique, declared and present: yes.
- Criteria observable or with a named manual method: yes.
- External authority recorded: push and merge into main when green.
