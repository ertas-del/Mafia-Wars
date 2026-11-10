# PATCH-001: The one-piece ring is trimmed to fit 24 on large screens

Reason: a 1920 × 1080 view covers up to 20 pieces of 512 px. Adding a full one-piece ring around it takes 30 or more, so the plan's T-002 check, "view plus a one-piece ring never exceed 24", cannot be met. The renderer keeps every visible piece and trims the ring, nearest pieces first, so the total never exceeds 24. A 915 × 412 phone view still gets its full ring. The spec is unchanged: AC-009 only requires that the cache never holds more than 24 pieces.

Affected tasks: T-002 (verification wording only, code unchanged) and T-005 (the engine requests pieces through `chunksForView`).

## Plan

Architecture Change Map, Rendering row:
- Before: the engine keeps a one-piece ring around the view drawn ahead, at most one new piece per frame
- After: the engine keeps a one-piece ring around the view drawn ahead, as far as the 24-piece cap allows (requested through `chunksForView`), at most one new piece per frame

T-002 Verification, EV-003:
- Before: the pieces needed for a 915 × 412 and a 1920 × 1080 view plus a one-piece ring never exceed 24
- After: the visible pieces for a 915 × 412 and a 1920 × 1080 view are never dropped and the requested set never exceeds 24; a 915 × 412 view gets its full one-piece ring

T-005 Concrete change:
- Before: with a one-piece ring drawn ahead at most one new piece per frame
- After: with a one-piece ring drawn ahead, as far as the 24-piece cap allows, through `chunksForView`, at most one new piece per frame

## Applied note

The user approved this on 2026-11-09 with the answer "Approve" to the plan-patch question. It is carried by plan revision 2. The specification is unchanged at revision 1.
