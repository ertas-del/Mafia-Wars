# PATCH-002 — Phone-layout and portrait checks run inside GitHub's build check

Reason: this session cannot download build artifacts. `gh run download` reaches GitHub, but the file itself is served from a storage host the session's network allowlist refuses (HTTP 403 Forbidden, run 42547040055). AC-006 and AC-008 both depended on downloading `dist/` here. The equivalent proof moves into the Check workflow, which builds the game anyway, has normal internet, and prints its results to the run log, which this session can read. As a side benefit, the phone-layout check then guards every future push.

Affected task: T-006 only (T-001 to T-005 are done and untouched). T-006 takes over `.github/workflows/check.yml` from T-005 (sequential handoff after T-005 is DONE) and adds `scripts/phone-layout-check.mjs`. Playwright is installed only inside CI with `npm install --no-save`; `package.json` is unchanged.

## Specification

FR-017, first clause:
- Before: Two GitHub Actions workflows exist: a check that runs `npm install`, `npm run lint` and `npm run build` on every push and pull request; the check also uploads the built `dist/` folder as a run artifact;
- After: Two GitHub Actions workflows exist: a check that runs `npm install`, `npm run lint` and `npm run build` on every push and pull request, then runs the phone-layout check and the portrait check against the built `dist/`, prints both reports to the run log, fails if either check fails, and uploads `dist/` and the screenshots as run artifacts;

AC-006:
- Before: The CI `dist/` artifact is downloaded here with `gh run download`, served locally, and a script run with the global Playwright and system Chrome emulating a 915×412 touch viewport visits ...
- After: In the Check workflow, `scripts/phone-layout-check.mjs` serves `dist/` and drives Playwright Chromium emulating a 915×412 touch viewport; it visits the title, the HUD in play, all five dossier tabs and the pause screen, finds no horizontal overflow and no visible control under 44 px tall, prints a JSON report to the run log, and uploads screenshots as a run artifact. The report is copied from the log into `evidence/`. Victory and game-over are checked by code review of the same layout classes.

AC-008:
- Before: The CI build output contains the four portrait files with hashed names referenced from the bundle.
- After: A Check workflow step lists the hashed portrait `.jpg` files in `dist/assets` and confirms each name appears in the JavaScript bundle; its log output is copied into `evidence/`.

## Plan

T-006 ownership adds `.github/workflows/check.yml` (taken over from T-005) and `scripts/phone-layout-check.mjs`.

T-006 Concrete change, EV-008:
- Before: `gh run download` the `dist` artifact into scratch, serve it with `http-server`, run a Playwright script with `/usr/bin/google-chrome` ... save screenshots and a JSON report to `evidence/`.
- After: add `scripts/phone-layout-check.mjs` and a check-workflow step that installs Playwright Chromium without saving it to `package.json`, runs the script against `dist/` (915×412, `hasTouch`, `isMobile`, landscape, `data-input="touch"`; title, play, five dossier tabs, pause; `scrollWidth <= clientWidth`; every visible button at least 44 px tall), prints the JSON report, fails on a violation, and uploads screenshots; the controller copies the report from `gh run view --log` into `evidence/`.

T-006 Concrete change, EV-009:
- Before: list hashed `.jpg` files in `dist/assets` and grep the bundle for their names.
- After: the same listing and grep run as a check-workflow step; the controller copies its log output into `evidence/`.

Execution and Landing: a fresh Opus worker writes the script and workflow step; a fresh Opus reviewer reads them; the controller pushes and reads the logs.
