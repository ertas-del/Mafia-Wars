<!-- sdd-contract-begin -->
{
  "schema_version": 1,
  "artifact_kind": "specification",
  "specification_id": "contracts",
  "revision": 1,
  "path": {"scope": "repository", "value": "spec-driven-development/contracts/spec.md"},
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
  "requirements": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-012", "FR-013", "FR-014"],
  "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008"]
}
<!-- sdd-contract-end -->

# Contracts and Sit-Downs — Specification

**Path:** `spec-driven-development/contracts/spec.md` · **Revision:** 1 · **Kind:** specification · **Schema:** 1

<!-- sdd-approval-begin -->
**Approval status:** Awaiting user approval
**Approved revision:** Not approved
**Approved normative digest:** Not approved
**Approver:** Not approved
**Approval timestamp:** Not approved
<!-- sdd-approval-end -->

## Context and Evidence

The request: change combat so that you only get shot when someone has put a contract on your head. Everyone is safe by default. If you shoot someone, their family can come after you.

The work is on branch `ertas-del/new/contracts`, from `main` at `fd372b8`.

### Evidence in the code

- **Who attacks today.** In `src/components/NycWorldCanvas.tsx:1929-1936`, an NPC is hostile by default if any of these holds:
  - it guards a racket (`racketGuardId`);
  - it is NYPD;
  - it belongs to another family, is not a courier, and is within 175 px. This rule is off while the Street Ceasefire perk is active (`hasStreetCeasefire`).

  A hostile NPC chases within 240 px (640 px for NYPD), then telegraphs with a windup and attacks (`:1941-1948`).
- **NYPD spawns.** Squads spawn when `policeHeat > 55` (`:1723`).
- **Player death.** When HP reaches 0, `App.tsx` `handlePlayerDamaged` sets `GAME_OVER`, which shows the Recovery modal (`App.tsx:504-518`).
- **Save data.** The save is `SavedEmpireState` under key `commission_1984_empire_v1` (`App.tsx:36-50`, `:253-290`). It stores cash, skill points, respect XP, rackets, contacts and other fields.
- **Existing sit-downs.** The Inner Circle already has "Sit-Down" dialogues with contacts (`SyndicateDrawers.tsx:464-540`). Those are unrelated to the family sit-downs here.
- **Turf takeovers.** A takeover spawns a Capo and two button men from the owner family (`spawnTurfDefenseWave`). Killing the Capo transfers the racket.
- **Cast.** Each family NPC is a named cast member, which gives every NPC a `familyId`.
- **Inner Circle respect.** Contacts carry a 0–100 respect score. Several perks unlock at 40.

## Decisions and Assumptions

### Confirmed by the user in this session

- **D1.** Peace is the default. People only shoot you if there is a contract on you.
- **D2.** Grudges build up. Three hits, or one kill, puts a contract out.
- **D3.** While a contract is active, that family's crew attacks on sight, and hit squads are sent after you.
- **D4.** A contract never times out. It ends only when it is paid off at a sit-down. The user called all three offered endings "cool" but said "no timer, it only resets when payment has been made". The spec therefore reads this as payment only, so killing the Capo does not end a contract.
- **D5.** You request a sit-down. The family names a meeting spot in their turf, at a time up to 20 minutes away. You walk there and sit.
- **D6.** At the sit-down they can whack you instead. The chance rises with your grudge against them and falls with your respect (your respect XP), and you see the risk before you sit. If they whack you, you lose respect, skill ("attribute") points and 50% of your money.
- **D7.** You must come alone. Bringing bodyguards gets the sit-down refused.
- **D8.** The NYPD only come after you when your heat is high.
- **D9.** Grudges, contracts and scheduled sit-downs are saved.
- **D10.** The price of a contract grows with the damage you do.
- **D11.** Builders and reviewers run on Opus at high effort.

### Depth and Defaults

These are my choices, ordered by impact.

| Choice | Default | Impact |
|---|---|---|
| **What "whacked" costs** | You go down. A betrayal Recovery screen lists the losses, and you wake at full health at your home borough's station. You lose: 50% of your cash; 25% of your respect XP (never below 0); and half your unspent skill points, rounded up. Learned skills are never removed. None of the ordinary Recovery penalties apply on top (10% cash, a $500 floor, heat reset). The contract stays. Its price goes up by $2,500. | high |
| **Hitting someone with no contract** | They don't fight back. They break off and back away, and the hit counts toward the grudge. Hostility is checked again at every step of an attack, so anyone who stops being hostile (a paid contract, or heat falling below the line) goes straight back to patrolling, even mid-windup. Your allies only shoot people who are hostile to you. | high |
| **What counts as a hit** | One attack on one person counts once: all the pellets of one shotgun blast, or one knuckle swing that catches two people, scores one hit on each. A kill scores 3 in total, not 3 plus the hit that killed. | high |
| **Turf takeovers** | The guards of a takeover you start attack you as they do now. Hits and kills on them count toward that family's grudge like any others, so taking a racket by force usually puts a contract out. | high |
| **Grudge and price numbers** | A hit adds 1 grudge point and a kill adds 3. At 3 points, a contract goes out. The price starts at $5,000. While a contract is active, each further hit adds $1,500 and each kill adds $4,000. | high |
| **Betrayal risk** | 25%, plus 5% for each of that family's members you have killed since their grudge started, minus 1% for each 100 respect XP (at most 20%), minus 10% with Street Ceasefire. The result is held between 5% and 75%. | high |
| **Sit-down timing** | The meeting time is random, between 1 and 20 minutes after the request, by the real clock, so it also counts down while the game is closed. You have a 3-minute window to arrive. If the window opened or closed while the game was closed, it opens fresh for 3 minutes when you come back. During the window that family holds fire and sends no squads (safe passage). Missing a window you were playing through adds $1,000 to the price, and you can request again. One request per family at a time. | high |
| Hit squads | While a family has a contract on you, a squad of 2 to 3 of its members spawns off-screen near you every 90 to 150 seconds of play. At most one squad per family is alive at a time. | medium |
| NYPD heat line | NYPD attack only while heat is 55 or more, the line at which squads already spawn. Below it they patrol. | medium |
| Meeting spot | The door of one of that family's rackets, in its home borough when it has one. Otherwise its home borough's station. The spot is marked on the street. | medium |
| Who counts | The player's bullets and melee count, and so do the player's allied bodyguards. Your own family is under the same rules. Hurting civilians adds heat as it does now, but no grudge. | medium |
| Where you see it | A new Contracts section in the dossier's Turf tab. It shows, for each family, its grudge, contract, price, betrayal risk, and the sit-down countdown and spot, with a Request button. A small HUD chip for each active contract shows the family colour and the next sit-down countdown. | medium |
| Alone check | A hired hit squad (the temporary allies) within 400 px refuses the sit-down, and the prompt says why. Permanent bodyguards from the Enforcer skill wait at a distance on their own during a sit-down window, so they never block it. | medium |
| Dying under a contract | An ordinary death keeps the usual Recovery, but you wake at your home borough's station, the contract stays, and no squads come for 30 seconds. | medium |
| Test hooks | With `?tour` only, the existing `window.__cityTour` also offers: set heat, add grudge points, advance the sit-down clock, and spawn a squad now. These hooks drive the smoke runs. | low |
| Street Ceasefire perk | It no longer stops families attacking, because peace is now the default. It lowers the betrayal risk instead. | low |

## Goals and Non-Goals

### Goals

- Walking the city is safe until you choose violence.
- Violence has a lasting, readable cost.
- Peace has to be bought at a tense sit-down.

### Non-goals

- Cutscenes or dialogue trees for the sit-down.
- Rival families fighting each other.
- Changes to the Inner Circle sit-downs or favours.
- Making contracts expire with time.

## Workflows

1. **Peaceful walk.** The player walks through every borough. Nobody attacks, unless their heat is 55 or more, in which case the NYPD do.
2. **Violence.**
   - The player shoots a Rastelli soldier twice and gets a "Rastelli grudge 2/3" toast.
   - A third hit sends out a contract. A toast and a HUD chip appear.
   - Every Rastelli on the street now attacks, and squads come.
3. **Peace talks.**
   - The player opens the dossier and taps Request sit-down for the Rastellis. A reply comes back: "Meet at Arthur Ave Pastry Social, in 7 minutes."
   - At the time, the player walks there alone. The prompt reads "[E] Sit down with the Rastelli family — pay $8,000 — risk 30%".
   - If the family honours the deal, the money is paid and the contract and grudge are cleared.
   - If they betray the player, the Recovery screen shows the losses and the contract stays.

## Requirements

- **FR-001.** A family NPC never attacks the player unless that family has an active contract on the player. This covers soldati, brawlers, couriers, Capos and citizens of any family, including the player's own, and someone the player has just hit (see "Hitting someone with no contract"). The one exception is the guards of a turf takeover the player started. NYPD attack only when heat is at or above the NYPD heat line. Hostility is decided by one pure function and checked again at every attack step.
- **FR-002.** Grudge points and the contract trigger follow D2 and the grudge numbers default. They count hits and kills by the player and the player's allies on members of that family.
- **FR-003.** While a contract is active, every member of that family attacks on sight with the existing chase and windup behaviour, and hit squads spawn as in the hit squads default.
- **FR-004.** The contract price follows the grudge and price numbers default. It also goes up for a betrayal and for a missed sit-down, as those defaults state.
- **FR-005.** The betrayal risk is computed by the betrayal risk formula and shown to the player before sitting.
- **FR-006.** The player can request a sit-down with a family that has an active contract. The family sets the time and spot as described in the sit-down timing and meeting spot defaults.
- **FR-007.** At the spot, during the window, an interact prompt offers the sit-down with its price and risk. It is refused when the player cannot pay or is not alone.
- **FR-008.** When the family honours the deal, the price is taken and that family's contract, grudge and kill count are cleared.
- **FR-009.** When the family betrays the player, the losses and the wake-up follow the "what whacked costs" default, and the contract stays. An ordinary death under a contract follows the "dying under a contract" default.
- **FR-010.** A missed window lapses as described in the sit-down timing default.
- **FR-011.** Grudges, contracts, kill counts and scheduled sit-downs are saved in the existing save under the same key. A save without them loads with no grudges.
- **FR-012.** All of these rules live in a pure, tested module, including the hostility decision and hit counting. The engine and the app only call it. The test hooks follow the "test hooks" default.
- **FR-013.** The dossier and the HUD show the state as described in the "where you see it" default. The HUD addition keeps the 85% clear-playfield guardrail.
- **FR-014.** Check still passes, including the phone-layout check and the city tour.

## Acceptance Criteria

- **AC-001** (FR-001, FR-002, FR-004, FR-005, FR-012). Unit tests on the pure module show:
  - three hits, or one kill, starts a contract;
  - two hits do not;
  - one shotgun blast scores one hit, and a kill scores 3 in total;
  - the hostility decision for: a family with and without a contract, the player's own family, a courier, a takeover guard, a person just hit, NYPD at heat 54 and 55, and a family during its safe-passage window;
  - the price follows the stated numbers, including the betrayal and missed-window increases;
  - the risk formula matches the numbers and stays within its 5–75% bounds.
- **AC-002** (FR-006, FR-007, FR-008, FR-009, FR-010, FR-012). Unit tests with an injected clock and random source show:
  - a request schedules a meeting 1 to 20 minutes out at a valid spot;
  - a second request for the same family is refused;
  - the sit-down is refused outside the window, when the player is short of cash, and when an ally is near;
  - the honoured outcome clears the family;
  - the betrayed outcome returns the stated losses and raises the price;
  - a lapsed window adds $1,000.
- **AC-003** (FR-011). Unit tests show that the state survives serialising and reloading, and that an old save with no contracts field loads with empty state.
- **AC-004** (FR-001, FR-003). A smoke run of the built game, driven by the test hooks, shows:
  - with heat under 55 and no contracts, no NPC damages the player during 60 seconds of walking among family crews;
  - hitting one person once does not make them attack;
  - after three hits on one family's members, that family's NPCs attack and a squad spawned through the hook hunts the player;
  - another family stays peaceful;
  - with heat set to 55, the NYPD attack.
- **AC-005** (FR-006, FR-007, FR-008, FR-009, FR-013). A smoke run with a debug clock shows a full sit-down that is honoured, and another that is betrayed. Screenshots show the dossier section, the HUD chip and the street prompt.
- **AC-006** (FR-001, FR-003, FR-011, FR-012, FR-013). A fresh reviewer of each task, and a fresh whole-change reviewer, confirm:
  - the engine uses only the module's decisions;
  - takeover guards are the only exception to peace;
  - the save field is optional and merged safely;
  - the HUD stays low-occlusion.
- **AC-007** (FR-014). Check is green on the branch head. The tour screenshots are rebuilt and viewed.
- **AC-008** (FR-001 to FR-010). The user plays on the S26 and confirms that peace, grudges and sit-downs feel right.

## Error and Recovery

- A save with malformed contracts data loads with empty contracts and does not throw.
- If a meeting spot cannot be found, the family's home station is used.
- If the player is in the Recovery screen when a window opens or closes, the window still follows the clock.

## Constraints

- No new dependencies. Pure modules use `.ts` imports and erasable syntax.
- The save key is unchanged and the new save field is optional.
- The 60fps loop isolation, the touch controls and the CLAUDE.md guardrails all hold. In particular, every new control gets `touch:min-h-11`, and numbers use `font-mono tabular-nums`.

## Risks and Alternatives

- **Takeovers become costly.** Taking a racket now usually starts a contract. That is intended by "if you shoot someone their family can come after you". The numbers default can be tuned later.
- **A long countdown.** A 20-minute wait is long on a phone. Because the countdown runs on the real clock, the player can close the game and come back.
- **Rejected alternative: a play-time countdown.** It would stall whenever the game is closed.

## Readiness Review

- Every requirement traces to an acceptance criterion.
- Every decision traces to a user answer or to the Depth and Defaults table.
- This is the critical track, because the save data changes and there are 14 requirements.
