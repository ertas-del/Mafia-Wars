# PATCH-001: Let the player send a hired crew away at a sit-down

**Reason.** The whole-change review found a soft-lock. The spec calls the hired hit squad "the temporary allies", but the squad from Sal's favour trade never leaves. It follows the player everywhere, even through `wakeAt`, and nothing in the game can dismiss it. Because the alone check refuses any sit-down with that squad nearby, a player who has hired one can never end a contract until they reload the page.

The same review found that the street prompt cuts off the price and risk on a 915×412 phone screen.

**Affected tasks:**
- T-003, the engine: dismissing the crew and the canvas label at the spot.
- T-002, the HUD: the compact prompt.
- T-001 and its tests are untouched.

## Specification

Depth and Defaults, the "Alone check" row:
- **Before:** A hired hit squad (the temporary allies) within 400 px refuses the sit-down, and the prompt says why. Permanent bodyguards from the Enforcer skill wait at a distance on their own during a sit-down window, so they never block it.
- **After:** A hired hit squad within 400 px refuses the sit-down. In that case the prompt at the spot offers "[E] Send your crew home" instead of the sit-down. Pressing it, or tapping it, dismisses the hired crew for good, and the next prompt is the sit-down itself. Permanent bodyguards from the Enforcer skill wait at a distance on their own during a sit-down window, so they never block it.

FR-007:
- **Before:** At the spot, during the window, an interact prompt offers the sit-down with its price and risk. It is refused when the player cannot pay or is not alone.
- **After:** At the spot, during the window, an interact prompt offers the sit-down with its price and risk, readable on a 915×412 screen. It is refused when the player cannot pay. When the player is not alone, the prompt offers to send the hired crew home first.

## Plan

T-003, Concrete change, "The sit-down spot" bullet, this sentence is added:
- **After:** When a hired ally is within 400 px, the prompt becomes "[E] Send your crew home". E or `chooseSitDown()` removes every hired ally (`allyKind: 'hired'`) for good, and shows a toast. The canvas label at the spot shows the price and the risk.

T-002, Concrete change, "HUD" bullet, this sentence is added:
- **After:** The sit-down prompt puts the price and the risk on their own short line ("$5,000 · 24% risk"), so they are not cut off on the phone layout.

## Applied note

The user approved this patch on 2026-11-10, choosing "Send them home" and then "Approve the patch". It is carried by specification revision 2 and plan revision 2.
