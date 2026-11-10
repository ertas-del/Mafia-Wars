# EV-017: Fresh review of T-009 (Sonnet, effort high)

**Verdict:** PASS, no blocking findings. The 47 of 47 unit tests pass.

## Contract
- One shared flow field around the player, radius 40, rebuilt every 0.5 s and cleared on teleport.
- Chasers and allies steer by flowDirection, with a straight-line fallback and the stuck rule.
- Patrols stay within 5 cells of their origin.
- Uptown and Staten Island each hold 6 civilians, who respawn in their own area.
- 40 cars run on spawnTraffic and stepTraffic, 4 of them police, with livery and facing their direction of travel.

## T-005 fixes, all verified
- Ring baking is throttled, and visible pieces always bake.
- A failing piece is skipped without blocking the others.
- Everything is disposed on unmount.
- snap() falls back to a station.
- The ferry stops while paused. Run-tested: takeFerry followed by Pause leaves the player unmoved, and the crossing completes after Resume.

## Reviewer smoke runs
- A 30 s soak produced 0 page errors.
- Counts stay bounded at 52 NPCs, 40 cars and 24 pieces.
- 0 of 1,920 car samples were off road.
- The chase routes around the building.

## Beyond-contract changes, accepted
- A line of sight is required for windup and lunge.
- The NYPD chase radius is 640 px, because they spawn at 420 px.
- Respawned citizens are civilians.
