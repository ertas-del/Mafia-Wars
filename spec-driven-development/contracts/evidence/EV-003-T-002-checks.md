# EV-003: T-002 checks (commits b51c7ec and 7c483fd)

- **Unit tests:** 88 of 88 pass. The controller re-ran them.
- **Type check:** tsc over all of src, using typed React stubs, is clean in the worktree and again after integration (scratchpad tc-contracts-app).
- **Worker smoke run:** an esbuild build with a temporary local stub, which was not committed. 18 of 18 checks pass with 0 page errors.
  - Contracts load and reload from the save.
  - The contract chips show.
  - Requesting a sit-down works, and a second request is refused.
  - Refusals are given for being short of cash and for not being alone.
  - An honoured sit-down clears the contract.
  - A betrayal applies the exact losses.
  - A missed window adds $1,000; a window that closes during a pause reopens without charge.
  - A malformed save loads empty.
- **Screenshots:** viewed by the controller. They show the dossier Contracts section, which is unstyled because the esbuild build has no Tailwind.
