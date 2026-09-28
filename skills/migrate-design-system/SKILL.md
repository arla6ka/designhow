---
name: migrate-design-system
description: Use when an app has to move onto a design system that already exists, such as "migrate the app to our design system", "launch subagents to move every screen onto the new components", a design system rollout, or an adoption audit. Not for making the system, which is build-design-system.
---

# Migrate to a design system

The system is settled: tokens chosen, canonical components shipped, docs readable. It may come from `build-design-system` or anywhere else. One coordinator splits the app into surfaces, meaning each route, screen or feature area a user can reach with its states, and runs worker agents one surface at a time with behavior unchanged. The same skill runs as a read-only audit that ends at a plan.

It never designs the system. A missing token or component is a request to the system's owner. It does not change product behavior, merge to main or deploy unless the standing orders grant it. Because it spawns many agents, no editing worker starts before `frame.md` states a budget.

## When a coordinator calls it

A coordinator, such as a router skill or `build-design-system`'s handoff, may pass the system location, scope, pilot, budget or an existing run folder. Use what it gives and default the rest from Inputs. Park questions in `gates.md` instead of asking mid-run. End by returning the final report, `plan.md` in audit mode, or the stop shape below as your final message.

## Done

Done means the predicate in `frame.md` holds on the final integration commit, proved from the run folder.

- The inventory script's output on the final commit is attached: zero legacy imports, zero raw values outside `allowlist.tsv`, zero legacy files.
- Every row in `surfaces.tsv` is `landed` with a `verified` ledger row at the final integration commit. A verdict at a surface's own branch commit does not count.
- The rule that blocks new legacy usage fails CI at error level on a planted violation.
- `baselines/MANIFEST.sha256` still matches, and the forbidden-path check passed on every landed diff.
- Every spawned agent has a terminal row in `agents.tsv`, nothing was redone without a row, and every row in `decisions.tsv` points at evidence that resolves.
- Every fix that recurred became a check, or the report says why it could not.
- Every gate is closed or listed with its default. Open gates, deleting an export used outside the repo, merging to main and deploying are left to a person.

The final report comes from the tables: the predicate with the script's counts, surfaces by state, verdicts, what was abandoned and why, checks added to CI, open gates with defaults, and the run folder path. In audit mode the result is `plan.md` (format in `references/inventory.md`), and nothing outside the run folder changes.

If it stops, return the condition that stopped it, quoting the rule. Give the count verified so far from the ledger, the run folder path and first action on resume, and the smallest reply that unblocks it, such as "Pick option A or B for gate 3."

## Inputs

| Input | Required | If missing |
|---|---|---|
| The target system: token source, component package or folder, docs, and a version or commit | Yes | Look for it before asking: `.design-system/run.md` with a handoff, `registry.json`, a `tokens/` source, `packages/ui` or `components/ui`, a `/system` docs route. Name what you found in `frame.md` and pin its current commit. Stop and point to `build-design-system` only when nothing is found, or when two candidates disagree and no project rule picks one. Migrating onto a moving target means every verdict goes stale. |
| The app repo, able to build and run locally or in CI | Yes | Stop if it cannot build. If it builds but cannot run, offer audit mode only, since nothing can be verified. |
| Scope: surfaces or folders in and out | No | Everything the inventory finds, listed in `frame.md` for the person to trim |
| Pilot surface | No | The surface with the most system components and a failure state, per step 5. Recorded in `frame.md` |
| Budget in wall-clock time or spend | No | Ask once. With no answer, cap the run at one working day and say so in `frame.md`. |
| Parity mode, `exact` or `mapped` (see `references/verification.md`) | No | `mapped` when system values differ from legacy values, `exact` when they match |
| A platform that runs parallel agents | No | Run the same phases with one agent in sequence. Keep every file and check. |
| The system owner, reachable for gates | No | Gates park with their default, and the surfaces behind them wait |
| An existing visual or end-to-end test harness | No | Build baseline capture during Baselines, in the CI environment |
| Project instructions (AGENTS.md, CLAUDE.md) | No | Standing orders say none were found |

Right-size as soon as the inventory has counts. If it shows fewer than about five surfaces, or one agent could finish inside the budget, drop the window, inbox, and briefs. Run the phases yourself in order. Keep the inventory, baselines, ledger, and done predicate, because those are what make the result checkable.

## Procedure

Expect a vague request, such as "launch subagents and move every screen onto the design system." Find the system, default every row in the table above, and present `frame.md` once with the pilot and budget you chose and one question for each row with no safe default. Inventory is read-only and starts while the person reads it.

The coordinator reads `references/orchestration.md` and `references/run-folder.md` before Frame. It never edits product code, tests, baselines, or the system. Each phase ends at an exit condition that a file in the run folder can prove.

1. **Frame.** Create `.migration/<run>/` from `references/run-folder.md`. Write `frame.md` with the done predicate as counts, the scope, the target system version, parity mode, budget, window cap, the surfaces allowed to look broken mid-run, and the branch that collects the work. Write `standing-orders.md` before any spawn. Present the frame once. Reversible prep continues while the person reads it. Exit when every field in `frame.md` is filled or has a stated default.

2. **Inventory.** Have one agent build or reuse a script that lists every legacy import, raw value, and legacy file, and assigns each to a surface (`references/inventory.md`). A search the model runs by hand is not an inventory. Run `token-mapping` per surface on its raw values. Ambiguous rows and gaps become gates, not guesses. Then the same agent adds the lint rule that blocks new legacy usage, so the count can only fall. Exit when the script's counts sit in `inventory/counts.txt`, every finding has a surface, and the blocking rule fails on a planted violation. In audit mode, keep the script inside the run folder, add no lint rule, write `plan.md`, and stop here.

3. **Baselines.** One agent builds the capture script and captures a screenshot and an accessibility snapshot for every surface, state, viewport, and theme in `surfaces.tsv`. Capture in the same environment CI uses, with fixed data, a frozen clock, and animation off. Capture twice and record the noise floor. Write `baselines/MANIFEST.sha256`. A state that cannot be reached safely is marked `not captured` with the reason, never faked. Exit when every surface has a baseline row or a stated reason.

4. **Shared layer.** One agent, working alone and in sequence, lands the shared changes every surface needs: the system package and lockfile, theme provider, global CSS, token wiring, shared wrappers, and the lint config from Inventory. Nobody else touches those files for the rest of the run. Gaps go to the system owner as gates. When the owner adds a component, `component-docs` writes its entry before any brief names it. Workers learn a component's API from its `.md` twin, so a twin missing the sections listed under Docs coverage in `references/inventory.md` is a gap for the owner. Exit when the shared layer has landed on the migration branch and every baseline still matches, or its diffs are explained.

5. **Pilot.** Pick one surface with several components and a failure state. Brief it from `references/worker-brief.md` and run it end to end: worker, verifier, ledger row, landing. The pilot exists to break the brief, the checks, and the surface size while that costs one agent. Fix what it exposed in the template before fan-out. When the surfaces are near-identical and the codemod covers them, run the first one as an ordinary unit with its checks inline and fan out as soon as it lands. Exit when the pilot is `verified` and landed, and the template changes are logged.

6. **Build the lever.** Turn the pilot's recipe into a codemod or script. Run it on the pilot's starting commit and diff the result against the hand migration. What it reproduces stays in the codemod. The rest becomes the worker's part of the brief. Rerunning it on migrated code must change nothing. Put the codemod and `lever/RECIPE.md` outside every worker's write scope. Exit when that diff is recorded and a second run is a no-op.

7. **Fan out.** Keep a rolling window of 5 to 10 workers in flight, never above the cap in `frame.md`. Each worker gets one surface, its own branch and worktree, and a brief with every field filled. A field you cannot fill means the surface is not ready, so do not spawn it. Refill as workers finish. Stop spawning at about 70% of the budget and land what is verified.

8. **Verify each surface.** A verifier that did not write the code checks visual diff, accessibility snapshot, behavior, and runs `design-review` on the after-captures (`references/verification.md`). Use a different model family for the verifier where judgment is involved. A cheap single command stays with the worker, and the coordinator spot-checks the output. Any diff that touches baselines, tests, or thresholds fails the surface automatically. Exit per surface when the ledger has a verdict for its current commit.

9. **Integrate continuously.** Land each verified surface on the migration branch as its own small change, in order, from the first verdict on. The coordinator may land a clean merge itself. A conflict becomes a unit for a worker. After each landing, run the cheap checks at the new commit and update the ledger. A red integration build stops landing until it is green again.

10. **Delete legacy.** When the inventory shows zero callers of a legacy module, one unit deletes the module, its adapter, and its allowlist rows in one change. The lint rule then bans the path outright. Anything that may be imported from outside the repo waits at a gate.

11. **Close.** Drain the inbox. Give every agent spawned during the run a final state in `agents.tsv`. Recapture every surface at the final integration commit and prove the predicate there. Audit `decisions.tsv` against what actually happened, and have a different model family review the trail. Turn each fix that recurred twice or more into a lint rule, codemod step, or check (`references/orchestration.md`). Leave the run folder in place as the record.

Retries, liveness, pause and resume, and the escalation list live in `references/orchestration.md`. The platform mapping for Claude Code, Codex, Cursor, and a plain script loop lives in `references/platforms.md`.

## Boundaries

Decide and log, without asking: the surface split and order, window size under the cap, retries and splits, which verifier runs, clean landings, and brief or codemod fixes the evidence supports.

Stop and ask, parked in `gates.md` with a default while other work continues:

- A token or component the system lacks.
- A visual change the mapping does not explain, or any change to the accessibility tree.
- A behavior change of any size, including one that looks like a fix.
- A standing order that the code contradicts.
- A dead end that survived one replan.
- Deleting an export used outside the repo, merging to main, force-pushing a shared branch, or deploying.

Never:

- Let the coordinator write product code, or let a worker write outside its brief's scope.
- Let two workers edit the same file, or let any worker touch the shared layer after its phase.
- Edit, regenerate, or loosen a baseline, test, threshold, or harness config to make a check pass.
- Invent a token, component, prop, or variant to fill a gap.
- Count `checks-only`, `blocked`, or a self-report as verified.
- Resume a worker to ask how it is doing. Read its side effects instead.
- Keep a legacy module or adapter alive after its last caller moved, except behind a gate with an owner and a removal date.
- Relax the done predicate to declare the run finished.
