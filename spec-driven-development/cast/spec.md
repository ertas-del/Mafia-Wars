<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "specification",
  "specification_id": "cast",
  "revision": 2,
  "path": {"scope": "repository", "value": "spec-driven-development/cast/spec.md"},
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
  "requirements": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011"],
  "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004", "AC-005", "AC-006", "AC-007"]
}
<!-- sdd-contract-end -->

# The 50-Character Street Cast — Specification

**Path:** `spec-driven-development/cast/spec.md` · **Revision:** 2 · **Kind:** specification · **Schema:** 1

<!-- sdd-approval-begin -->
**Approval status:** Awaiting user approval
**Approved revision:** Not approved
**Approved normative digest:** Not approved
**Approver:** Not approved
**Approval timestamp:** Not approved
<!-- sdd-approval-end -->

## Context and Evidence

The request is to bring the 50 characters from the user's other repository, `ertas-del/Mafia-game`, into the game in `ertas-del/Mafia-Wars`. They replace the old street cast, which uses real mobsters' names, and the change also fixes name tags that pile on top of each other in a crowd. The work is on branch `ertas-del/new/cast` from `main` at `77f738f`. The repository instructions are `CLAUDE.md`.

### Source: `ertas-del/Mafia-game` (read at `b4c8784`)
- `src/data/noirPresets.ts:310-330` defines `BibleCharacterEntry`. Each entry has `num`, `id`, `name`, `role`, `bio` and `familyId`. It also has these traits: `headgear`, `eyewear`, `outfit`, `heldItem`, `build`, `facialHairOrScar`, `hairColorHex`, `primaryGarmentHex` and `secondaryGarmentHex`. Each entry also carries photo-crop fields and two image prompts.
- The 50 entries are split by family: Corvini 10, Bellini 8, Valenti 8, Moretti 8, Rastelli 8, and 8 "outside the families". The outside group includes an NYPD organised-crime detective, a beat cop, a federal agent, a lawyer, a fence, an informant, a numbers banker and a freelance heavy.
- The five family ids are the same as Mafia-Wars' `FamilyId` (`src/data/nyc1984Data.ts:19`).
- `src/components/Character2DModelPreview.tsx` draws each character as React SVG in two modes. `portrait` is head and shoulders in a 100 × 100 box. `street-3q` is a full body, three-quarter view facing the camera, in a 100 × 120 box. The drawing is built from the traits and the family colour.
- In that app, `NoirStreetSandbox.tsx:525,535` passes `preset=` where the component expects `traits=`, so the page crashes on load. That bug belongs to the other repository and is out of scope here.

### Target: `ertas-del/Mafia-Wars` at `77f738f`
- `src/components/NycWorldCanvas.tsx:473-486` holds a list of 12 NPC names, almost all of them real 1980s mobsters. Examples are Vinnie "The Chin" Gigante, Sonny "Red" Indelicato and Gaspipe Casso. Street NPCs draw their names from this list.
- Every person is drawn top-down as circles: a coat disc, a hat disc, a family trait mark and a gun bar (`:1824-1995`). The player gets a dark disc, a red hat and a gold ring (`:2026-2059`).
- Every non-civilian NPC always shows a family tag line, for example "♛ BELLINI · BRASS LEDGER". It also shows its name and a health bar when it is engaged, damaged, a Capo or a courier (`:1998-2023`). In a crowd these overlap, as seen in tour shot 5 of `spec-driven-development/city-map/evidence/city-shots/`.
- Each game borough spawns 8 NPCs: one courier, one citizen and six family NPCs, either soldati or brawlers (`:488-540`). Their family is the borough's controlling family. Turf waves add a Capo and two button men from the racket's owner family (`:735-760`). The NYPD spawn as "NYPD Organized Crime Task Force" (`:1289`). Allies are "Made Bodyguard" or "Corvini Cadillac Enforcer" (`:791`, `:1259`). Uptown and Staten Island residents are unnamed citizens (`:443-446`).
- The 6 Inner Circle contacts already have invented names. Their ids (`contact_castellano`, `contact_gallo`, `contact_persico`) and their portrait file names are kept, per decision D4.
- Pure modules in `src/world/` are tested with `node --test`. CI runs lint, build, the unit tests, the phone-layout check and the city tour, which saves six screenshots to the log.

## Decisions and Assumptions

Confirmed user decisions, all made in this session:
- **D1:** Every street person is drawn as a full-body, three-quarter, camera-facing figure built from the Mafia-game character traits. This replaces the dots, and no one is drawn side-on or top-down.
- **D2:** The player is drawn in the same style, dressed in the chosen family's look, with a gold ring so they stand out.
- **D3:** In this game's copy, the surnames Vitale, Amato, Carbone, Santoro and Russo are replaced with invented ones. Nicknames and roles stay.
- **D4:** The contacts' hidden ids and portrait file names are left as they are. There is no save change.
- **D5:** Builders and reviewers run on Opus at high effort.

### Depth and Defaults

These are my choices. They are ordered by impact.

| Choice | Default | Impact |
|---|---|---|
| **Who wears the 50** | Each borough's six family NPCs are distinct members of that borough's controlling family. A respawn takes a member who is not currently on the street. Turf-wave Capos and button men come from the racket owner's family. The two outside cops are used for NYPD squads; further NYPD get a generic uniformed officer. The other six outside characters appear one each as named citizens in a game borough. | high |
| **Name tags** | The always-on family tag line goes. A tag shows name, family and health only for NPCs that are engaged, damaged, a Capo or a courier, plus the one nearest NPC within 160 px. At most 4 tags are drawn at once, laid out so that none overlap. | high |
| Figure size | Bodies are drawn about 44 px tall, which is roughly the old 30 px disc plus the head and legs. Collision radius is unchanged. | medium |
| Facing | Figures always face the camera. They mirror left or right to match their movement or aim. The held weapon points along the aim. | medium |
| Unnamed people | Uptown and Staten Island residents, the generic officers and the allies are figures built from a seeded mix of civilian or family traits. They have no name tag unless engaged. | medium |
| Player look | A dark overcoat and fedora in the chosen family's colour, the family's signature mark, and a gold ring underfoot. | medium |
| Replacement surnames | Lorenzo "The Ledger" Ravasi, Frankie "Photo Finish" Cardella, Johnny "Runway" Lomarco, Gino "Velvet" Fiorella and Mikey "Nine Lives" Castagna. | low |
| What is copied | id, number, name, role, bio, family and traits only. Photo crops, image prompts and the photos themselves are not copied. | low |

## Goals and Non-Goals

### Goals
- Make the street feel populated by the 50 named people of the character bible.
- Remove every real mobster's name from the street cast.
- Make crowds readable.

### Non-goals
- Animation frames: walking cycles.
- Painted portraits for the 50.
- Changes to the contacts, the dossier or saves.
- Fixing the Mafia-game repository.

## Workflows

1. **Walking a borough:** the player sees that borough's family members standing and patrolling as full-body figures. Walking up to one shows their name and family on a tag above them.
2. **A fight:** each attacker shows a tag with name and health. Tags never overlap. Windup arcs and laser lines still telegraph attacks.
3. **Turf takeover:** the Capo and button men are named members of the defending family.

## Requirements

- **FR-001** A pure module holds the 50 characters, copied from the Mafia-game bible as described in D3 and the "What is copied" default. Each character has a stable id, name, role, bio, family and traits.
- **FR-002** A pure drawing function draws a full-body, three-quarter, camera-facing figure on a 2D canvas from a character's traits. It reproduces headgear, eyewear, outfit, held item, build, facial hair or scar, hair and garment colours, and the family colour, following `street-3q` in `Character2DModelPreview.tsx`. It also accepts unnamed trait sets.
- **FR-003** Each figure is drawn once into an off-screen image and reused every frame. Drawing a frame never redraws the figure from its traits.
- **FR-004** Street family NPCs, turf-wave Capos and button men take cast members as described in the "Who wears the 50" default. Two living NPCs are never the same character.
- **FR-005** NYPD, allies, Uptown and Staten Island residents and named citizens follow the "Who wears the 50" and "Unnamed people" defaults.
- **FR-006** The player is drawn as a figure in the chosen family's look with a gold ring (D2).
- **FR-007** Figures mirror toward movement or aim and show the held weapon. The existing hit flash, squash, windup arc and laser line still work.
- **FR-008** Name tags follow the "Name tags" default. A layout function places them so that no two overlap.
- **FR-009** The old list of real names is removed. The cast contains none of the surnames in the denylist test (AC-001).
- **FR-010** Collision, combat numbers, NPC counts, AI and saves are unchanged.
- **FR-011** The Check workflow still passes, including the city tour.

## Acceptance Criteria

- **AC-001** (FR-001, FR-009) Unit tests show:
  - the cast has 50 unique ids and 50 unique names;
  - the per-family counts are 10, 8, 8, 8, 8 and 8;
  - every trait value is one of the allowed values;
  - no name contains a surname from a denylist of real crime figures. The denylist includes Vitale, Amato, Carbone, Santoro, Russo, Gigante, Gotti, Castellano, Persico, Indelicato, Ruggiero, Casso, Gambino, Genovese, Lucchese, Bonanno and Colombo.
- **AC-002** (FR-002) Unit tests draw every cast member, plus unnamed civilian, officer, ally and player trait sets, onto a recording fake context. The tests show that:
  - nothing throws;
  - every save is matched by a restore;
  - each cast member's trait tuple is unique.
- **AC-003** (FR-004) Unit tests of the cast assignment function show that it returns distinct members of the asked family until all are in use, and then returns a generic member.
- **AC-004** (FR-008) Unit tests of the tag layout show:
  - ten tags requested at nearly the same spot come out with at most 4 shown;
  - no two shown tags overlap;
  - engaged NPCs are kept ahead of the nearest-NPC tag.
- **AC-005** (FR-003, FR-005, FR-006, FR-007, FR-010) A fresh whole-change review of the engine shows:
  - every body and the player draw from cached figures;
  - the real-name list is gone;
  - tags go through the layout;
  - collision, combat and saves are untouched.
- **AC-006** (FR-011, FR-002, FR-008) Check passes on the pushed branch. The controller rebuilds the city-tour screenshots from the log and confirms that full-body figures are visible and no tags overlap.
- **AC-007** (FR-004 to FR-008) The user plays on the S26 and confirms that the figures read well, faces point at the camera, and tags stay clear in a fight.

## Error and Recovery

- If an off-screen image cannot be made, the figure is drawn directly that frame and retried later.
- If an unknown trait value appears, the nearest default part is used and nothing throws.

## Constraints

- No new runtime dependencies.
- No images: the figures are code-drawn.
- The CLAUDE.md guardrails apply, in particular the 60fps loop isolation and the four portrait JPEGs.
- Pure modules use `.ts` imports and erasable syntax only, so `node --test` can run them.

## Risks and Alternatives

- **Phone performance:** about 60 cached images of roughly 50 × 60 px are drawn with `drawImage`. This is cheaper than today's per-body path drawing.
- **Other surnames:** some common surnames in the 50 also belong to real people of the era. The five in D3 are renamed. Any others are common names and stay.
- **Alternative rejected:** rasterizing the SVG component through `Image` and data URLs. It is asynchronous, harder to test, and pulls React into the engine.

## Readiness Review

- All requirements trace to acceptance criteria.
- All decisions trace to user answers or the Depth and Defaults table.
- No data contract changes.
- Track: standard. The change has 11 requirements and none of the critical classes.
