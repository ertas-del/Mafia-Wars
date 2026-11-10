# EV-012: Check is green on the head commit

Run 42782826779 on ertas-del/new/city-map at 05877cf: **success**. Every step passed: install, unit tests, lint, build, dist upload, portrait check, Playwright install, phone-layout check, the shots upload, the city tour, and the city-tour-shots upload.

Earlier red runs, each fixed forward with T-001 reopened:
- 42782393150: lint failed with TS7022 at cityGen.test.ts:116.
- 42782623117: the same error at :117, on the loop counters.
