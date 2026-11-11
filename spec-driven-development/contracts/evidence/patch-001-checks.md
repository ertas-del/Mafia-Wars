# PATCH-001 fix-forward (commit bd7303a): checks and fresh review

## Checks
- **Unit tests:** 88 of 88 pass.
- **Type check:** tsc with the integrated stub config is clean.
- **Smoke runs:** done on esbuild builds with Tailwind compiled in.
  - The committed `scripts/contracts-smoke.mjs` passes 9 of 9.
  - The scratch crew smoke also passes 9 of 9. It hires Sal's crew at the spot, sees the "[E] Send your crew home" prompt and taps it. It confirms that no sit-down or payment happened and that the crew stays gone, then sits with E and the sit-down is honoured.
- **Phone layout:** at 915×412 the prompt is 44 px tall, nothing overflows, and the "$5,000 · 24% risk" line is shown in full. The controller looked at the screenshots.

## Fresh review (Opus, effort high): PASS
- The prompt and the refusal use the same `isAlone()` test.
- Dismissing the crew removes every hired ally and frees their cast members. It never calls `onSitDownChosen`.
- Enforcer bodyguards are untouched.
- A refusal for "not alone" can always be cleared now. No other soft-lock was found.
- The guardrails still hold.

### Minor notes
- Dismissing shows floating text on the canvas rather than a HUD toast.
- A HUD tap plays the click sound twice. This was already the case before the patch.
