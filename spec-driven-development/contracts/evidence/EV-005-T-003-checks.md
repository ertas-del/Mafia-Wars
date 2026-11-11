# EV-005: T-003 checks (commit 73c6079)

## Tests and type checks
- 88 of 88 unit tests pass.
- tsc is clean over all of src with stubs. After integration with T-002 it is still clean.

## Worker smoke run
The build was an esbuild build with a temporary contracted view. That view was not committed. The run reported 0 page errors.

- **No contract:** 60 s among all five crews at heat 0 caused 0 damage. One hit made the target back off.
- **Contract:**
  - Three hits put a contract on Bellini. Its soldati, brawlers and courier attacked, while Moretti stayed peaceful.
  - A squad closed from 560 px to 30 px.
  - Squads were held back during grace and the open window.
- **NYPD:** they were peaceful at heat 54, attacked at 55, and went back to patrol at 54.
- **Sit-down:**
  - The prompt showed the price and the risk. It reported "not alone" when a hired ally was within 400 px.
  - Enforcer bodyguards held back 522–660 px.
- **Attack tally:** a kill reported 0 hits and 1 kill, and one shotgun blast reported 1 hit.
- **Frame time:** 16.67 ms.

The worker's ten screenshots were viewed by the reviewer.
