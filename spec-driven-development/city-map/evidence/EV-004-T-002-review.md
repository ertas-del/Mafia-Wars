# EV-004: Fresh reviews of T-002 (Sonnet, effort high)

## Round 1: BLOCKING
64 of 307 BRIDGE cell centres lay outside the drawn deck, so characters would have been shown walking on water. The plan's wording on the 1920×1080 ring also could not be met (see patches/PATCH-001.md, approved).

Fixes in a2cf8ca:
- Each deck polygon is built from the BRIDGE cells.
- A test checks that all four corners of every BRIDGE cell are covered.
- Midtown towers have taller fronts and setback roofs.

## Round 2, fresh reviewer: PASS
- An independent script found all 307 BRIDGE cells covered.
- No deck polygon self-intersects.
- The cache stays at or below 24 with LRU eviction.
- There is no DOM access at module load.
- save() and restore() calls are balanced.
- Overlay cost is 0.002–0.07 ms per frame at 915×412.

One non-blocking finding: the Brooklyn and Queensboro deck ends overlapped building cells. Fixed in f1790c1, which adds a test that no deck covers any BUILDING cell.
