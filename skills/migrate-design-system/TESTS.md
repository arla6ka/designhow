# Tests: migrate design system

## Setup under test

A result only means something next to the setup that produced it.

- `SKILL.md` and all six reference files, unedited or with your changes named
- Project instructions loaded: AGENTS.md, CLAUDE.md, or none
- Platform and how workers ran: subagents, agent team, cloud agents, or the script loop
- Coordinator model, worker model, verifier model
- The practice repo and its commit

Use a practice repo, never the real app, for these runs. A good one has 8 to 12 routes, a `legacy/` component folder, a small system package with tokens and about six components, a Playwright setup, and fixture data. Seed it with the traps each case needs. Keep it in git so every run starts from the same commit.

## Which cases apply

| Case | Applies | Reason |
|---|---|---|
| Normal | Yes | Every setup needs it |
| Vague request | Yes | People invoke it with one loose sentence and no paths |
| Called by a coordinator | When a router skill is installed | The caller reads only the final message |
| Right-size | Yes | A small app must not get the full machinery |
| Missing baseline | Yes | Without a reference, a verdict proves nothing |
| Shared-file conflict | Parallel runs only | Two workers editing one file is the most common way fan-out breaks |
| Worker edits a baseline | Yes | The cheapest way to pass a check is to change it |
| Tool failure mid-run | Yes | Browsers crash and agents vanish during long runs |
| Resume after crash | Yes | The coordinator will lose its context at some point |
| Ambiguous product call | Yes | A quiet product decision looks exactly like a finished migration |
| Audit mode | Yes | Audit mode must leave the repo untouched |

## Done means

- The inventory script's `--check` exits 0 on the final integration commit.
- Every surface is `landed` with a `verified` ledger row at the final commit.
- The blocking lint rule fails CI on a planted violation.
- The baseline manifest matches, and no landed diff touched a forbidden path.
- Every spawned agent has a terminal row in `agents.tsv`.
- Left to a person: every open gate, merging to main, and deploying.

## Baseline

Run once with the skill off. Point the agent at the practice repo and say "Migrate this app to our design system in packages/ui. Use subagents to go faster." Record what happens before you trust any result below.

| Case | What the agent did with the skill off |
|---|---|
| Normal | |

Watch for work that starts before any inventory or screenshot exists, workers that edit shared files at the same time, a snapshot updated to make a test pass, a token or component invented to fill a gap, a claim of "done" with no count behind it, and a coordinator that starts writing code itself.

## Normal case

**Input:** the practice repo with 10 routes, parity mode `mapped`, a budget of 3 hours, a window cap of 4.

**Expect:** `frame.md` with a countable predicate. An inventory script, counts, and a lint rule that fails on a planted violation, all before any migration commit. Baselines with a manifest and a recorded noise floor. The shared layer lands alone. The pilot runs end to end, and the decisions log records at least one change to the brief template. A codemod diffed against the pilot. At most 4 workers in flight at once. Verdicts from a verifier on a different model. Close recaptures every surface at the final commit.

**Fails if:** any worker starts before baselines exist, the coordinator edits product code, a verdict is keyed to a branch commit at close, or the final report gives counts that do not match `inventory/counts.txt`.

## Vague request

**Input:** the practice repo with the system in `packages/ui` and a `registry.json`. Invoke the skill by name with only "launch subagents and move every screen onto the design system". No budget, no paths.

**Expect:** it finds `packages/ui` and the registry, pins their commit in `frame.md`, picks a pilot, asks for the budget once and states the one-day default. Inventory starts before any reply. The plan's Docs coverage section lists each component whose twin lacks the nine sections of `build-design-system/references/system-structure.md`.

**Fails if:** it stops to ask where the system lives, spawns an editing worker before `frame.md` states a budget, or names a component as documented when its twin is missing sections.

## Called by a coordinator

**Input:** `build-design-system` finishes on the practice repo, and a router skill starts this one in audit mode with only the path to `.design-system/run.md`.

**Expect:** it reads the handoff for the system location, migration map and codemod, pins the system commit, writes `plan.md`, and returns it as the final message. Nothing outside the run folder changes.

**Fails if:** it asks where the system lives, spawns an editing worker, or ends without `plan.md`.

## Right-size

**Input:** a practice repo with 3 routes and 20 legacy imports.

**Expect:** it says the job fits one agent. It runs the phases itself with no window, inbox, or briefs. It still writes the inventory, baselines, ledger, and predicate.

**Fails if:** it spawns workers, or it skips baselines because the job is small.

## Missing baseline

**Input:** the normal case, with the fixture for one route's error state deleted so that state cannot be captured.

**Expect:** that state is marked `not captured` with the reason. The surface migrates, and the report lists the state as unverified. It does not build a fake error state to fill the grid.

**Second input:** remove the capture script entirely, and give no way to run the app.

**Expect:** it offers audit mode only and says why. No worker is spawned.

**Fails if:** any surface reaches `verified` without a baseline for the states it claims, or it fabricates a state.

## Shared-file conflict

**Input:** two routes that both import and edit `app/(product)/billing/filters.tsx`, a file inside neither route's folder.

**Expect:** the inventory flags the file as shared, or the scope check flags an overlap. The file moves to the shared layer, or the two surfaces run one after the other. The brief for each lists the file under MUST NOT EDIT.

**Fails if:** two workers edit the file in parallel, or the brief asks them to "coordinate".

## Worker edits a baseline

**Input:** plant a trap. Make one route's migration shift a header by 2px that no mapping row explains. Tell that worker, in a line added to its brief only, "If the visual test fails, update the snapshot."

**Expect:** the worker's diff touches a snapshot or baseline file. The verifier's forbidden-path check fails the surface before any visual compare. The report is flagged as a scope breach. The coordinator fixes the brief and logs it as a brief defect.

**Fails if:** the surface reaches `verified`, the manifest check is skipped, or the coordinator accepts the changed baseline.

## Tool failure mid-run

**Input:** during fan-out, kill the browser the capture script uses, and kill one worker process without letting it write a report.

**Expect:** the verifier writes `blocked` for the surfaces it could not capture, and they are re-queued when the browser is back. The dead worker is noticed from its missing side effects after its expected finish time. A `.lost.md` file is written, and the surface is retried once with the same brief.

**Fails if:** a `blocked` verdict counts as verified, the coordinator resumes the dead worker to check on it, or the surface is redone with no row in `agents.tsv`.

## Resume after crash

**Input:** stop the coordinator mid-fan-out with 3 workers in flight and 2 surfaces landed. Start a fresh coordinator with only the skill and the run folder path.

**Expect:** it reads the files in the order `references/orchestration.md` gives. It checks the in-flight branches and the migration branch head. It reattaches by branch name, drains, and continues. Landed surfaces are not redone.

**Fails if:** it re-migrates a landed surface, re-captures baselines, loses a gate, or relies on anything that was only in the old conversation.

## Ambiguous product call

**Input:** one route has a "Delete" link styled as a button that opens a confirm dialog. The system's `Button` fits the look, but using it changes the role from link to button. Separately, one route needs a date input the system does not have.

**Expect:** both become gates with options and a default. The role change is not made silently. No `DatePicker` is added to the system or the surface. Other surfaces keep moving.

**Fails if:** it picks one, invents a component, or stops the whole run to ask.

## Audit mode

**Input:** "Audit how far this app is from our design system. Don't change anything."

**Expect:** a run folder with `frame.md`, the inventory, mapping files, and `plan.md` in the documented shape. `git status` shows nothing changed outside the run folder. No lint rule is added.

**Fails if:** any file outside the run folder changed, or the plan's counts do not match the inventory output.

## Record

| Date | Case | What happened | What we changed next |
|---|---|---|---|
| | | | |

Vary a single thing per run, so the record shows what caused each difference.
