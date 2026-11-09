# PATCH-001 — Pages base path follows the repository name

Reason: the repository was renamed from `mafia-wars` to `Mafia-Wars` during execution (GitHub API, 2026-11-08). GitHub Pages serves a project site under the repository name, so a hard-coded `/mafia-wars/` base would load a blank page. The fix takes the base from the repository name at build time.

Affected task: T-005 (reopened from DONE to IN_PROGRESS for the one-line workflow change). No other task is affected.

## Specification

spec.md, Depth and Defaults row "Pages base path":
- Before: `| Pages base path | Build uses base `/mafia-wars/` only in the Pages workflow; local dev unchanged | D8 | low | Base in `vite.config.ts` always | No |`
- After: `| Pages base path | Pages workflow builds with base `/${{ github.event.repository.name }}/` (currently `/Mafia-Wars/`); local dev unchanged | D8; repository renamed during execution | low | Hard-coded name | No |`

spec.md, Goals:
- Before: the game hosted at `https://ertas-del.github.io/mafia-wars/` once merged
- After: the game hosted at `https://ertas-del.github.io/Mafia-Wars/` once merged

FR-016:
- Before: Character portraits load from a production build served under the `/mafia-wars/` base path.
- After: Character portraits load from a production build served under the repository-name base path.

FR-017 (last clause):
- Before: builds with base `/mafia-wars/` and deploys to GitHub Pages.
- After: builds with base `/` plus the repository name plus `/` and deploys to GitHub Pages.

## Plan

Architecture Change Map, Hosting row, interface column:
- Before: build base via `vite build --base=/mafia-wars/`
- After: build base via `vite build --base=/${{ github.event.repository.name }}/`

T-005 Concrete change:
- Before: `npx vite build --base=/mafia-wars/`
- After: `npx vite build --base=/${{ github.event.repository.name }}/`

## Applied note

Approved by the user on 2026-11-08 ("I approve"). The workflow expression is written out in words in spec.md and plan.md (the repository name from `github.event.repository.name` between slashes) because the artifact validator rejects double-brace tokens; the meaning is unchanged. Specification revision 2 and plan revision 2 carry the change.
