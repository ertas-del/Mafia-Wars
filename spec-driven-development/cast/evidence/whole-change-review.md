# EV-005: Whole-change review before the merge into main (Opus, effort high)

**Verdict:** PASS. None of the findings is a correctness, privacy or acceptance failure.

## What the reviewer confirmed
- **Requirements and evidence:** FR-001 to FR-011 and AC-001 to AC-006 are delivered and backed by their evidence. Unit tests pass 63 of 63.
- **Engine scope:** collision, AI, combat numbers, NPC counts, the save, the ?tour hook and input are all unchanged.
- **Cast pool:** it cannot leak or duplicate. It is created once per mount, initialisation releases all members first, turf guards are released before removal, and a dead NPC's member is released after its replacement is dressed.
- **Figure cache:** capped at 160 entries with LRU eviction, and freed on unmount.
- **Combat visuals:** hit flash, squash, windup arcs and the laser line all work.
- **Figure drawing:** every figure faces the camera in three-quarter view; none is side-on. Detail beyond `street-3q` is borrowed from the portrait view, as FR-002 requires.
- **Documentation:** CLAUDE.md B3 is accurate. No secrets or personal data.

## Non-blocking findings
1. The evidence files were untracked. Committed in 8f937a1.
2. The ledger prose was stale. Updated in the landing commit.
3. Follow-ups:
   - tagLayout allocates small arrays every frame.
   - The tag width is cached before the web font loads.
   - pushTag sets ctx.font without save/restore.
   - The test comment that mentions "jittered sizes" is inaccurate.
   - Contacts are still drawn as discs.
   - The "NPC TRAIT" text is stale.
4. Names, raised with the user:
   - Lombardo, Calabrese, Lupo and Morello are common surnames that real figures also had. The spec accepts them.
   - "Rastelli" is an existing family name on main and was a real Bonanno boss. Two cast members carry it.
