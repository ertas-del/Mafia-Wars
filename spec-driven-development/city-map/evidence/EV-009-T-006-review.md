# EV-009: Fresh review of T-006 (Sonnet, effort high)

**Verdict:** PASS, no blocking findings.

**Checks**
- **Workflow:** the YAML is valid and the steps run in the correct order. The upload uses always(). Node 22.x strips TypeScript types by default.
- **Test step:** the find-based unit-test step was run locally and passed. It fails if it finds no test files.
- **Tour script:** it follows the contract: six shots of 915×412 at JPEG quality 60, CITY_SHOT lines of about 4 KB, a CITY_TOUR_REPORT line, a fail on page errors or a blank canvas, and frame-time output.
- **Selectors:** all confirmed against the TitleAndEndModals, PerimeterHud and SyndicateDrawers sources.
- **Robustness:** the cityData import works, the server listens on port 0, and the browser is closed in a finally block.

**Non-blocking findings**
- **Blank-city threshold, fixed by the controller:** it was ≤1 colour; it is now <8 distinct colours.
- **Ferry prompt, handed to T-009:** the tour finds the ferry prompt with /ferry/i, so the prompt's label must contain "ferry".
- **Start timing, accepted:** the tour waits a fixed 1.5 s after Start and tolerates the auto-pause.
