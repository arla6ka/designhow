# migrate-design-system

Moves an app onto a design system that already exists, one surface at a time, with one coordinator agent running many workers. It builds a script-backed inventory, checks every legacy call site's props and behaviors against the system, captures baselines before touching anything, lands the shared layer first, proves the recipe on a pilot, turns it into a codemod, then fans out. Each surface lands only after a separate verifier checks it against its baseline. The run ends when the inventory counts reach zero and every surface is verified on the final commit. It can also run as a read-only audit that ends at a plan.

Where old and new components share one import path, it finds legacy by diffing each file against the team's registry, not by path.

It uses the other skills in this repo. `token-mapping` builds each surface's migration list, `ui-review` is part of each verdict, and `component-docs` documents any component the system owner adds to close a gap.

## What the scripts touch

This skill ships no scripts. The agent writes `scripts/migration-inventory.mjs` into your repo to the interface in `references/inventory.md`, and runs the rest from `build-design-system`.

- `migration-inventory.mjs` reads the source tree and the run folder, and writes only `inventory/` in `.migration/<run>/`.
- `capture.mjs` opens the local dev server in a headless browser and writes PNG and JSON captures under `.design-system/review/` or the folder the brief names. `pixdiff.mjs` and `montage.mjs` read those captures and write their reports beside them.
- `check-system.mjs` and `check-spec.mjs` read the repo. `--shrink-allowlist` rewrites `scripts/check-allowlist.json`.
- Shell: `git` creates the run branch unless you name one, one branch and worktree per worker, and one commit per landed surface. Nothing merges or pushes unless you ask. `run-window.sh` in `references/platforms.md` starts your agent CLI once per surface.
- Network: the dependency install in each worktree, and whatever your agent CLI calls. The scripts call nothing beyond the dev server.

## Use as-is

Ask for a migration by name ("migrate every screen onto our system") and give a budget, or let the session be the budget. Any other ask, such as "clean the app up", runs audit mode, which ends at `plan.md` and a ranked list of what it found, and offers the migration with its size. The run works on its own branch, `ds/<yyyy-mm-dd>-migrate`, and merging it into yours is always your call. The coordinator looks for the system itself (a `build-design-system` handoff, `registry.json`, a token source or a UI package) and writes what it found, plus every other default, into `frame.md` for you to check. For a first try, ask for audit mode, read `plan.md`, then start the real run from it.

The model can invoke it so a router or `build-design-system`'s handoff can start it, and no editing worker starts before `frame.md` states a budget. To start it only by hand, add `disable-model-invocation: true` to the frontmatter.

## Replace first

1. The inventory script and `legacy.txt` patterns in `references/inventory.md`. The examples assume a TypeScript app styled with CSS and utility classes. Match your stack.
2. The widths, themes and masks in `references/verification.md`. Capture in your CI image.
3. The standing orders and forbidden paths in `references/run-folder.md`. Name your real shared files.
4. The platform section in `references/platforms.md` that matches your setup.
5. The window and budget defaults in `references/orchestration.md`, once a pilot tells you how long a surface takes.

## Invariants

Each prevents a failure that shows up at scale. Change one only when its stated reason doesn't apply to you.

- Full mode only on an ask that names it. A migration nobody asked for moves every screen at once and leaves a diff too large to review.
- One coordinator rule, stated once under Boundaries in `SKILL.md`. It exists because while the coordinator fixes code, no worker return gets processed and free slots stay empty.
- Inventory by script. A search the model runs by hand gives a different count each time, so "done" means nothing.
- Block new legacy usage before migrating. Otherwise feature work adds it back as fast as workers remove it.
- Baselines first, and never edited. A worker that can edit the baseline can make any diff pass.
- One writer per file, in the repo and in the run folder. Instructions to take turns do not stop two agents overwriting each other.
- Shared layer alone, before fan-out. Workers that each patch the theme provider leave one version of it per worker.
- A verifier that did not write the code, keyed to a commit. A new commit voids the verdict, and close re-verifies every surface on the final commit.
- Gaps go to the system owner. A worker that invents a component leaves the migration with a new legacy component.
- State lives in files. The coordinator will lose its context, and the next one resumes from the run folder alone.

## Optional tools

A browser that captures screenshots and accessibility trees is close to required for implementation runs. Your existing visual test setup comes first, then `capture.mjs` and a browser tool, per `build-design-system/references/browser.md`. Without one, the skill runs audit mode only. ast-grep makes the inventory and lint rule one file. A second model family for verifiers catches mistakes the worker's model is blind to. Parallel agents are optional, and the skill runs the same phases in sequence without them.

## Check after changing

Run `TESTS.md` on a practice repo. At minimum, confirm that a worker who updates a snapshot fails the forbidden-path check, that two surfaces sharing a file never run in parallel, and that a fresh coordinator resumes from the run folder without redoing landed work.

## Adapt this skill

Use the prompt in `../ADAPTING.md` with this skill's topics: where the system lives, its version and owner; what a surface is in your app; what counts as legacy and which raw values may stay; which files are shared; how CI runs the app, with which widths and themes; exact or mapped parity; your agent platform and how many agents you can afford; and who answers gates. Leave the phase order, the one-writer rule, the anti-tamper rules and the verdict states alone unless an answer contradicts one.
