# Coordinator path

Read this page, not every file. At each step, open only what the Open column names.

| # | Step | Open |
|---|---|---|
| 1 | If `.design-system/boss/state.md` exists, resume from it | `references/state.md`, "Resuming" |
| 2 | Run `scripts/triage.sh`, save `git status --porcelain` to `triage/git-before.txt` | `references/triage.md`, "Running the script" |
| 3 | Read AGENTS.md or CLAUDE.md | the repo's own file |
| 4 | Pick the state, the intent and the foundation | `references/triage.md`, "The app's state", "The ask's intent", "The foundation" |
| 5 | Pick the route | `SKILL.md`, "Routing table" |
| 6 | On a writing route, pick the run branch: the one the person named for this work, else a new one from HEAD | `SKILL.md`, "The branch model" |
| 7 | Copy the route's steps and set the phase caps | `references/routes.md`, the route's section and "Budget" |
| 8 | Probe subagents, nesting, browser and shell. On a flat host, switch to the track below after step 10 | `references/delegation.md`, "What the host can do" |
| 9 | Write the state file with the standing orders, the build's `.design-system/run.md` skeleton when the route runs the build, and the ignore entries for the footprint | `references/state.md`, "The state file" and "The run folder"; `references/delegation.md`, "Standing orders" |
| 10 | Send the Frame with the standing questions, or put it in the report when nobody is reading | `references/triage.md`, "The one question" and "Standing questions" |
| 11 | Brief and run each step | `references/delegation.md`, "The step brief"; `SKILL.md`, Procedure, "Run the steps" |
| 12 | Save each return's status line and file list to `returns/<step>.md` | `references/delegation.md`, "Saving a return" |
| 13 | Check each return and write its verdict | `references/delegation.md`, "Checking a return" |
| 14 | Apply decided defaults, then clearance, then migration on the run branch | `references/routes.md`, Build step 4; `SKILL.md`, Procedure, "Clear the migration" |
| 15 | Close: wait for workers, triage into `triage/after/`, clean-clone check, captures and montage, delete `.design-system/tmp/`, `git status` with every untracked path explained. Reconcile the audit's gates and re-pin it if the build moved what it names | `references/routes.md`, the rules at the top; on a minimal footprint, "Minimal footprint close" |
| 16 | Write `close.md`, then the report from it, and send the report as the final message | `references/state.md`, "The close file" and "The handoff report" |

## Flat host: the build and migrate seats

On a flat host, agents cannot start their own, so the boss holds the build and migrate seats. This track replaces steps 11 to 14. Workers still write every line of product code. The boss reads only the Open column. Hand to workers lists files the brief tells the worker to load, which the boss does not read.

Three records, one writer each. `state.md` gets a Steps row and a decision row per seat. The build seat's decisions and gates go in `.design-system/run.md`, the migrate seat's in `.migration/<run>/`, and neither is copied into another.

| # | Step | Open | Hand to workers |
|---|---|---|---|
| F1 | Decision row "Boss holds the build seat: flat host". Load `build-design-system` | `build-design-system/references/coordinator-path.md`, "Start" and "Phase caps". The base reference triage named | |
| F2 | Copy the check scripts per the build's phase 1. Fixtures stay in the skill folder. Phase caps come from `routes.md` "Budget", phase order from the build | `build-design-system/SKILL.md`, "1. Frame" | |
| F3 | Inventory and baselines: read-only workers per screen group. Every pilot trap's before state goes in `run.md` | `build-design-system/references/worker-brief.md`, "The template" | `inventory.md`, `browser.md` "Capture every route in one command" |
| F4 | Foundations: one worker writes the token source, commits it first, then the identical-value swaps | nothing new | `token-architecture.md` or the base reference |
| F5 | Right after the token commit, spawn the migrate audit as one step agent pinned to it | `references/delegation.md`, "The step brief" | `migrate-design-system`, audit mode |
| F6 | Components: the first family's worker, then one worker per family on disjoint paths | nothing new | `component-contract.md`, `traps.md` |
| F7 | Checks: one worker. The check exits 0 before the pilot | `build-design-system/references/checks.md`, "The check has to run" | `checks.md` |
| F8 | Pilot: one worker fixes every trap in the pilot's files, with before and after numbers | nothing new | `browser.md` "Compare after a change" |
| F9 | Docs: spec workers on disjoint families, then four review lenses, the decisions log and one fix wave by file ownership | `build-design-system/references/coordinator-path.md`, "Review, decide, fix" | `system-structure.md`, `spec-template.md` |
| F10 | Build handoff, then check the build as Build step 3 | `build-design-system/references/run-record.md`, "Handoff report"; `system-structure.md`, "Done, page by page" | |
| F11 | Decision row "Boss holds the migrate seat: flat host". Load `migrate-design-system`. Reconcile the audit's gates with the build's, and re-pin if the build moved what `plan.md` names | `migrate-design-system/SKILL.md`, "Procedure" steps 3 to 11 | |
| F12 | Baselines and shared layer: one worker each, in sequence | nothing new | `verification.md` "Baselines", "Integration checks, runtime checks and the final sweep" |
| F13 | Decided defaults first, including the codemod on non-pilot screens and color moves. Then, with clearance, the other surfaces. One worker and one independent verifier per surface, one commit per surface with `git add` on its `paths` | `migrate-design-system/references/worker-brief.md`, "The template"; `verification.md`, "Verifier brief" | the migrate worker brief's own reading list |
| F14 | Migrate close: `.migration/<run>/close.md` from the inventory script and the ledger | `migrate-design-system/references/run-folder.md`, "close.md" | |

Then go back to step 15. When a step fails, open the file its failing output names, and only that one.
