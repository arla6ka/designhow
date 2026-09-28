# migrate-design-system

Moves an app onto a design system that already exists, one surface at a time, with one coordinator agent running many workers. It builds a script-backed inventory, captures baselines before touching anything, lands the shared layer first, proves the recipe on a pilot, turns it into a codemod, then fans out. Each surface lands only after a separate verifier checks it against its baseline. The run ends when the inventory counts reach zero and every surface is verified on the final commit. It can also run as a read-only audit that ends at a plan.

It uses the other skills in this repo. `token-mapping` builds each surface's migration list, `design-review` is part of each verdict, and `component-docs` documents any component the system owner adds to close a gap.

## Use as-is

Ask for a migration and give a budget. A loose request is fine. The coordinator looks for the system itself (a `build-design-system` handoff, `registry.json`, a token source or a UI package) and writes what it found, plus every other default, into `frame.md` for you to check. For a first try, ask for audit mode, read `plan.md`, then start the real run from it.

The skill is model-invocable, so a router skill or `build-design-system`'s handoff can start it. Its description triggers only on moving an app onto an existing system, not on general UI talk. It spawns many agents and spends real money, so the cost guard sits in the procedure. Inventory and audit are read-only, and no editing worker starts before `frame.md` states a budget. If you would rather start it only by hand, add `disable-model-invocation: true` to the frontmatter. A router can then no longer call it.

## Replace first

1. The inventory script and `legacy.txt` patterns in `references/inventory.md`. The examples assume TypeScript, CSS, and Tailwind. Match your stack.
2. The capture script, viewports, themes, and masks in `references/verification.md`. Capture in your CI image.
3. The standing orders and forbidden paths in `references/run-folder.md`. Name your real shared files.
4. The platform section in `references/platforms.md` that matches your setup.
5. The window cap and budget defaults in `SKILL.md`, once a pilot tells you how long a surface takes.

## Invariants

Each of these prevents a failure that shows up at scale. Keep them unless your setup really differs.

- The coordinator never writes product code. When it starts fixing things, it stops draining, and every worker behind it waits.
- Inventory by script. A search the model runs by hand gives a different count each time, so "done" means nothing.
- Block new legacy usage before migrating. Otherwise feature work adds it back as fast as workers remove it.
- Baselines first, and never edited. A reference the worker can change is not a reference.
- One writer per file, in the repo and in the run folder. Instructions to take turns do not stop two agents overwriting each other.
- Shared layer alone, before fan-out. Twenty workers each patching the theme provider produce twenty versions of it.
- A verifier that did not write the code, keyed to a commit. A new commit voids the verdict, and close re-verifies every surface on the final commit.
- Gaps go to the system owner. A worker that invents a component leaves the migration with a new legacy component.
- State lives in files. The coordinator will lose its context, and the next one resumes from the run folder alone.

## Optional tools

A browser automation tool with screenshot and accessibility-tree capture (Playwright, or your existing visual test setup) is close to required for implementation runs. Without one, the skill runs audit mode only. ast-grep makes the inventory and lint rule one file. A second model family for verifiers catches mistakes the worker's model is blind to. Parallel agents are optional, and the skill runs the same phases in sequence without them.

## Check after changing

Run `TESTS.md` on a practice repo. At minimum, confirm that a worker who updates a snapshot fails the forbidden-path check, that two surfaces sharing a file never run in parallel, and that a fresh coordinator resumes from the run folder without redoing landed work.

## Adapt this skill

Give an agent this prompt with the skill folder attached.

```
I want to fit the attached migrate-design-system skill to our app and our agents.

Interview me, one question per turn. Cover:
- where our design system lives, its version, and who owns it
- how our app is structured (routes, feature folders, packages) and what a surface should be
- what counts as legacy for us, and which raw values are allowed to stay
- which files are shared and must never go to a worker
- how we run the app and tests in CI, and which viewports and themes we support
- whether our migration should look identical (exact) or adopt new values (mapped)
- which agent platform we use and how many agents we can afford at once
- who answers gates, and what may merge without a person

Rules for you while we do this:
- Leave the phase order, the one-writer rule, the anti-tamper rules, and the verdict states alone unless an answer of mine contradicts one.
- Use only paths, commands and names I give you or that you read from our repo. Mark anything else UNDECIDED.

When the interview ends, split your proposed edits into behavior changes (what the skill stops on, checks, allows, or hands to a person) and wording changes. Show both lists and edit nothing until I say go.
```
