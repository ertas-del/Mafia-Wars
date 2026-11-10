# EV-011: Fresh review of T-005 (Sonnet, effort high)

**Verdict:** PASS, with no blocking findings. Unit tests: 47 of 47 pass.

## Contract checks
- **World size:** comes from WORLD_W and WORLD_H.
- **Chunk drawing:** pieces come from chunksForView and the cache, with one bake per frame, and the overlay is drawn after them.
- **Collision:** moveWithCollision handles the player, NPCs and allies.
- **Bullets:** removed by blocksBullet, sampled at the half step and the full step.
- **Borough callback:** comes from areaAtPoint and never fires for Uptown or Staten Island.
- **Ferry:** the prompt contains "ferry"; E and takeFerry both cross with a fade, in both directions.
- **Tour hook:** present only with ?tour and cleaned up on unmount.
- **Unchanged:** dt clamp, hitstop and input paths.

## Reviewer smoke test (esbuild build with stubs, headless Chromium)
- **Walls and water:** the player stops 24 px from a wall and 27 px short of the river.
- **Turf defense wave:** spawns the player, the Capo and the guards on walkable cells.
- **Racket doors:** all are walkable and line up with the envelope collection point.
- **Touch:** a drag moves the player.
- **Frame time:** about 16.7 ms. The slowest chunk bake takes 21–33 ms (desktop, headless).

## Non-blocking findings, carried into T-009 (same file)
- Bake ring pieces only when the frame budget allows; always bake visible pieces.
- A piece that keeps failing must not block the pieces after it.
- Clear the chunk cache on unmount.
- snap() should fall back to the borough station.
- The ferry timer should not advance while paused.
- A car with no drivable spawn should be avoided.
