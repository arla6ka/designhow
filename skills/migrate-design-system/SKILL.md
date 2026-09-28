---
name: migrate-design-system
description: Use when an app has to move onto a design system that already exists, such as "migrate the app to our design system", "launch subagents to move every screen onto the new components", a design system rollout, or an adoption audit. When design-system-boss is installed and nobody has checked the system's states and specs, the boss triages first, audits included, since a migration copies a weak system's gaps onto every screen. Not for making the system, which is build-design-system.
---

# Migrate to a design system

The system is settled: tokens chosen, canonical components shipped, docs readable. One coordinator splits the app into surfaces, meaning each route, screen or feature area a user can reach with its states, and runs worker agents one surface at a time with behavior unchanged. The same skill runs as an audit that ends at a plan.

It never designs the system. A missing token or component is a request to the system's owner. It does not change product behavior or deploy unless the standing orders grant it. No editing worker starts before `frame.md` states a budget.

## The run branch

Every writing run works on its own branch cut from HEAD, `ds/<yyyy-mm-dd>-migrate` when run directly or the one a coordinator passes. It never commits to the branch it started on. Surfaces migrate one per commit on the run branch, each verified. Apply every decided gate default there, including codemods on non-pilot surfaces and color moves, so Next is a plain merge. Migration beyond decided defaults still needs clearance. A visible change is allowed when it traces to a gate or decision and has before and after captures and a montage row in `.design-system/review/` (`references/verification.md`). Merging is always the person's call.

Clearance means the budget to migrate more surfaces. Adoption asks such as "the screens ignore it", or "fix it" aimed at a mess, count as clearance within the session budget. The list is in `design-system-boss/references/triage.md`.

## When a coordinator calls it

A coordinator, such as a router skill or the build's handoff, may pass the system location, scope, pilot, budget or an existing run folder. Use what it gives and default the rest from Inputs. Park questions in `gates.md` instead of asking mid-run. A boss that takes this seat on a host without subagents follows the coordinator rule under Boundaries, recorded as one decision row. Under `design-system-boss`, concurrency follows `references/orchestration.md`. End by returning the final report, `plan.md` in audit mode, or the stop shape below as your final message.

Audit mode writes only the run folder and `scripts/migration-inventory.mjs`, and needs neither a settled system nor a running app. Beside `build-design-system` or harden work, start it right after the token commit lands and pin that commit. The run re-pins the plan itself before handoff and before the first edit brief (`references/inventory.md`), never leaving it to the Next prompt.

## Done

Done means the predicate in `frame.md` holds on the final integration commit, proved from the run folder.

- The inventory script's output on the final commit is attached: zero legacy imports, zero raw values outside `allowlist.tsv`, zero palette uses when `frame.md` counts them, zero legacy files.
- Every row in `surfaces.tsv` is `landed` with a `verified` or `self-verified` ledger row at the final integration commit (`references/verification.md`). A verdict at a surface's own branch commit does not count, and neither does a reopened row. A landed surface still `queued` or `in-flight` in `surfaces.tsv` fails the close.
- The rule that blocks new legacy usage fails CI at error level on a planted violation.
- `baselines/MANIFEST.sha256` still matches, and the forbidden-path check passed on every landed diff.
- Every spawned agent has a terminal row in `agents.tsv`, nothing was redone without a row, and every row in `decisions.tsv` points at evidence that resolves.
- Every fix that recurred became a check, or the report says why it could not.
- Every gate is closed or listed with its default. Open gates, deleting an export used outside the repo, merging into the person's branch and deploying are left to a person.

Success is what the person asked for, in their words, and the first surface that changes answers their complaint. Every claim that something is fixed, passes or works names the command that proved it and its result from this session.

At every handoff, partial or not, the blocking rule exits 0, with every remaining finding in its committed ignore list (`references/inventory.md`). A red check at handoff is a failed run.

The final message takes this order, with no process narration:
1. Which surfaces changed and which did not, and why, in plain words. Every count, before and after, allowlisted and left, landed and `Verified: N of M by an independent agent`, comes from `close.md` (`references/run-folder.md`). Name what is still raw instead of saying "every screen". Put the self-verified surfaces on their own line, every non-empty behavior delta, and the montage path.
2. Checks: each command and its exit code.
3. At most 3 gates, each with the default the run branch already applies.
4. `Next:` one plain-language prompt that clears every gate at once. It is a merge, or a merge with named gate reversals, such as `Merge ds/2026-03-12-migrate, but keep the blue Sign in button (reverse G-04).` Add the budget for any surfaces left. It never asks for a step the run could have done, and carries no process dispute. If the close commit failed, the message says so and Next starts with it: "First commit the run record (`git add .migration .design-system && git commit`), then merge."

Everything else stays in the run folder, and the message names its path. In audit mode the result is `plan.md` (format in `references/inventory.md`), nothing outside the run folder and the inventory script changes, and the same four parts summarize it.

If it stops, return the condition that stopped it, quoting the rule. Give the count verified so far from the ledger, the run folder path and first action on resume, and the smallest reply that unblocks it, such as "Pick option A or B for G-03."

## Inputs

| Input | Required | If missing |
|---|---|---|
| The target system: token source, component package or folder, docs, and a version or commit | Yes | Look first: `.design-system/run.md`, `registry.json`, `tokens/`, `packages/ui` or `components/ui`, a `/system` route, or `components.json`. Read the foundation's base reference in `build-design-system/references/`. Name it in `frame.md` and pin its commit. Every check the run calls is the repo's vendored copy under `scripts/` (`check-system.mjs`, `check-spec.mjs`, `gen-docs.mjs`). Captures, pixdiff and the montage run from `<skills>/build-design-system/scripts/` (`<skills>` is `.agents/skills/` or `.claude/skills/`). A check the repo lacks is a gap for the owner. Stop and point to `build-design-system` only when nothing is found, or when two candidates disagree and no project rule picks one. |
| The app repo, able to build and run locally or in CI | Yes | Stop if it cannot build, except in audit mode, which only reads files. If it builds but cannot run, offer audit mode only, since nothing can be verified. |
| Scope: surfaces or folders in and out | No | Everything the inventory finds, listed in `frame.md` for the person to trim |
| Pilot surface | No | The surface the person named or complained about. Otherwise the one with the most system components and a failure state, per step 5. Recorded in `frame.md` |
| Budget in wall-clock time or spend | No | The session. Say so in `frame.md`. |
| Parity mode, `exact` or `mapped` (see `references/verification.md`) | No | `mapped` when system values differ from legacy values, `exact` when they match |
| A platform that runs parallel agents, with worktree isolation | No | Without agents, see the coordinator rule under Boundaries. Without isolation, run in sequence or only on surfaces with disjoint paths (`references/platforms.md`). Keep every file and check. |
| The system owner, reachable for gates | No | Gates park with their default, and the surfaces behind them wait |
| An existing visual or end-to-end test harness | No | Capture baselines with `capture.mjs` during Baselines, in the CI environment |
| Project instructions (AGENTS.md, CLAUDE.md) | No | Standing orders say none were found |

Right-size once the inventory has counts. Under about five surfaces, drop the window and run the phases in sequence through one worker. Keep the inventory, baselines, ledger and done predicate.

## Procedure

Expect a vague request. Default every row above and present `frame.md` once, with the pilot and budget you chose and one question per row with no safe default. Inventory is read-only and starts meanwhile.

The coordinator reads `references/orchestration.md` and `references/run-folder.md` before Frame. Each phase exits on a condition a run-folder file proves.

1. **Frame.** Create `.migration/<run>/` from `references/run-folder.md`. Write `frame.md` with the done predicate as counts, the scope, the target system version, parity mode, budget, window cap, the surfaces allowed to look broken mid-run, and the run branch. Write `standing-orders.md` before any spawn. Scratch files from every agent go in `.design-system/tmp/`, added to `.gitignore`. Exit when every field in `frame.md` is filled or has a stated default.

2. **Inventory.** Have one agent build or reuse a script that lists every legacy import, raw value, and legacy file, and assigns each to a surface (`references/inventory.md`). Reconcile `legacy.txt` with the build's `registry.json` first: anything the build kept is not legacy. Run `token-mapping` per surface on its raw values. Ambiguous rows and gaps become gates, not guesses. The same agent then adds the lint rule blocking new legacy usage. Exit when the script's counts sit in `inventory/counts.txt`, every finding has a surface, and the blocking rule fails on a planted violation. In audit mode, write the script to the repo's `scripts/` with `--help` and the allowlist format, so the edit run reuses it. Add no lint rule, write `plan.md`, and stop here.

3. **Baselines.** One agent captures a screenshot and a probe with `capture.mjs` for every surface, state, viewport, and theme in `surfaces.tsv`. Capture twice for the noise floor and write `baselines/MANIFEST.sha256`, per `references/verification.md`. Measure every trap's before state into `baselines/traps.tsv` in the same pass. A state that cannot be reached safely is marked `not captured`, never faked. Exit when every surface has a baseline row or a stated reason.

4. **Shared layer.** One agent, working alone and in sequence, lands the shared changes every surface needs: the system package and lockfile, theme provider, global CSS, token wiring, shared wrappers, and the lint config from Inventory. On shadcn, every `shadcn add` runs here. `--overwrite` on a customized file is a gate. Nobody else touches those files afterwards. After each edit here, run the runtime checks in `references/verification.md`: every route at HTTP 200, and a dev server restart after `@theme` or global CSS edits. When the owner adds a component, `component-docs` writes its entry before any brief names it. Exit when the shared layer has landed on the run branch and every baseline still matches, or its diffs are explained.

5. **Pilot.** Pick one surface with several components and a failure state. Brief it from `references/worker-brief.md` and run it end to end: worker, verifier, ledger row, landing. Fix what the pilot exposed in the template before fan-out. When the surfaces are near-identical and the codemod covers them, run the first one as an ordinary unit with its checks inline and fan out as soon as it lands. Exit when the pilot is `verified` and landed, and the template changes are logged.

6. **Build the lever.** Turn the pilot's recipe into a codemod or script. Run it on the pilot's starting commit and diff the result against the hand migration. What it misses goes in the brief. Put the codemod and `lever/RECIPE.md` outside every worker's write scope. Exit when that diff is recorded and a second run is a no-op.

7. **Fan out.** Start with 3 to 5 workers after the pilot and grow toward 10 while drains keep up, never above the cap in `frame.md`. Each worker gets one surface, its own branch and worktree (or the fallback in `references/platforms.md`), and a brief with every field filled. A field you cannot fill means the surface is not ready. Save each return as its status line and file list (`references/run-folder.md`). Stop spawning at about 70% of the budget and land what is verified.

8. **Verify each surface.** A verifier that did not write the code checks visual diff, the rendered checklist with contrast on recolored text, accessibility snapshot, behavior and its before/after delta, and runs `design-review` on the after-captures (`references/verification.md`). With no subagents, the coordinator self-verifies by the fresh-context checklist there. A surface nobody verified stays `checks-only`. Exit per surface when the ledger has a verdict for its current commit.

9. **Integrate continuously.** Land each verified surface on the run branch as its own commit with its before and after captures, in order, from the first verdict on. On a flat host, stage it with `git add` on that surface's `paths` from `surfaces.tsv`. A conflict becomes a unit for a worker. After each landing, run the cheap checks at the new commit, every route at HTTP 200 included, and update the ledger. A red integration build stops landing until it is green again.

10. **Delete legacy.** When the inventory shows zero callers of a legacy module, one unit deletes the module, its adapter, and its allowlist rows in one change. The lint rule then bans the path outright. Anything that may be imported from outside the repo waits at a gate.

11. **Close.** Drain the inbox. Give every agent spawned during the run a final state in `agents.tsv`. Recapture every surface at the final integration commit, give each reopened row a new verdict there, and prove the predicate. Budget left goes to verifiers for `checks-only`, `self-verified` and reopened surfaces before declaring done. Write `close.md` from the inventory script and the ledger at the final commit. Audit `decisions.tsv` against what happened. Turn each fix that recurred twice or more into a lint rule, codemod step, or check (`references/orchestration.md`). Delete `.design-system/tmp/`. The untracked-file list from `git status --porcelain` is then empty, or each path has a `decisions.tsv` row.

## Boundaries

The coordinator never writes product code when it can spawn subagents. On a host without subagents it runs the phases itself, in sequence, and self-verifies per `references/verification.md`.

Decide and log, without asking: the surface split and order, window size under the cap, retries and splits, which verifier runs, clean landings, and brief or codemod fixes the evidence supports. A swap of a raw value for a token of the identical value needs no clearance on any surface when `node <skills>/build-design-system/scripts/pixdiff.mjs` at tolerance 0 shows 0% on every route it touches. Log the diff as evidence.

An accessibility change that only adds semantics lands as a decision on the run branch (`build-design-system/references/traps.md`, Adds-only accessibility changes).

Park in `gates.md` with a default and keep working. Every decided default lands on the run branch with captures: mapped pixel changes, color moves, component swaps, codemods on non-pilot surfaces. These gates default to leaving the code as it is:

- A token or component the system lacks.
- A visual diff nobody can explain, or a change that removes, renames or restructures existing semantics.
- A behavior change of any size, including one that looks like a fix. Unlike build, which fixes broken behavior on its pilot, a migration keeps behavior as found, so no commit changes both what a surface does and how it looks.
- A standing order that the code contradicts.
- A dead end that survived one replan.
- Deleting an export used outside the repo, merging into the person's branch, force-pushing a shared branch, or deploying.

Never:

- Break the coordinator rule above, or let a worker write outside its brief's scope.
- Let two workers edit the same file, or let any worker touch the shared layer after its phase.
- Edit, regenerate, or loosen a baseline, test, threshold, or harness config to make a check pass.
- Invent a token, component, prop, or variant to fill a gap.
- Count `checks-only`, `blocked`, or a self-report as verified, or let a decision row stand in for a verifier.
- Land two surfaces in one commit.
- Keep a legacy module or adapter alive after its last caller moved, except behind a gate with an owner and a removal date.
- Relax the done predicate to declare the run finished.
