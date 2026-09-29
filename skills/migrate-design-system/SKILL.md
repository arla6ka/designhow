---
name: migrate-design-system
description: Use when an app has to move onto a design system that already exists, such as "migrate the app to our design system", "launch subagents to move every screen onto the new components", a design system rollout, or an adoption audit. When design-system-boss is installed and nobody has checked the system's states and specs, the boss triages first, audits included, since a migration copies a weak system's gaps onto every screen. Not for making the system, which is build-design-system.
---

# Migrate to a design system

The system is settled: tokens chosen, canonical components shipped, docs readable. One coordinator splits the app into surfaces and runs worker agents one surface at a time, with behavior unchanged. The same skill runs as an audit that ends at a plan. Surface, run branch, identical-value swap, decision, gate, clearance and footprint mean what `build-design-system/references/run-record.md` (Terms) says.

It never designs the system. A missing token or component is a request to the system's owner. It does not change product behavior or deploy unless the standing orders grant it. No editing worker starts before `frame.md` states a budget.

## The run branch

A writing run works on its run branch, `ds/<yyyy-mm-dd>-migrate` or the one a coordinator passes. Surfaces land there one per commit, each verified. Decided gate defaults land there too, codemods on non-pilot surfaces and color moves included, so Next is a plain merge.

Migration beyond decided defaults needs clearance. Adoption asks such as "the screens ignore it", or "fix it" aimed at a mess, count as clearance within the session budget (`design-system-boss/references/triage.md` lists them). A visible change needs a gate or decision behind it, before and after captures, and a montage row in `.design-system/review/` (`references/verification.md`).

## When a coordinator calls it

A coordinator, such as a router skill or the build's handoff, may pass the system location, scope, pilot, budget or an existing run folder. Use what it gives, default the rest from Inputs, and park questions in `gates.md` instead of asking mid-run. Under `design-system-boss`, concurrency follows `references/orchestration.md`, and a boss that takes this seat on a host without subagents records that as one decision row. End with the final report, `plan.md` in audit mode, or the stop shape below.

Audit mode writes only the run folder and `scripts/migration-inventory.mjs`, and needs neither a settled system nor a running app. Beside `build-design-system` or harden work, it starts once the token commit lands, pinned to it, and re-pins itself before handoff (`references/inventory.md`, Audit mode and plan.md).

## Done

Done means the predicate in `frame.md` holds on the final integration commit, proved from the run folder.

- The inventory script's `--check` exits 0 there: zero legacy imports, zero raw values outside `allowlist.tsv`, zero palette uses when `frame.md` counts them, zero legacy files.
- Every row in `surfaces.tsv` is `landed` with a `verified` or `self-verified` ledger row at that commit. A verdict at a surface's own branch commit does not count, nor does a reopened row.
- The rule that blocks new legacy usage fails CI on a planted violation, and exits 0 at every handoff with the remaining findings in its committed ignore list (`references/inventory.md`). A red check at handoff is a failed run.
- `baselines/MANIFEST.sha256` still matches, and the forbidden-path check passed on every landed diff.
- Every spawned agent has a terminal row in `agents.tsv`, nothing was redone without one, and every `decisions.tsv` row points at evidence that resolves.
- Every fix that recurred became a check, or the report says why it could not.
- Every gate is closed or listed with its default.

Success is what the person asked for, in their words, and the first surface that changes answers their complaint. Every claim that something is fixed, passes or works names the command that proved it and its result from this session.

The final message, with no process narration:
1. Which surfaces changed and which did not, and why. Every count comes from `close.md` (`references/run-folder.md`), including `Verified: N of M by an independent agent`. Name what is still raw instead of saying "every screen". List self-verified surfaces on their own line, every non-empty behavior delta, and the montage path.
2. Checks: each command and its exit code.
3. At most 3 gates, each with the default the run branch already applies.
4. `Next:` one plain prompt that clears every gate at once: a merge, or a merge with named reversals, such as `Merge ds/2026-03-12-migrate, but keep the blue Sign in button (reverse G-04).` Add the budget for surfaces left. It never asks for a step the run could have done. If the close commit failed, Next starts with "First commit the run record (`git add .migration .design-system && git commit`), then merge."

Everything else stays in the run folder, and the message names its path. In audit mode the result is `plan.md` (`references/inventory.md`), summarized in the same four parts.

If it stops, return the rule that stopped it, the count verified so far, the run folder path, the first action on resume, and the smallest reply that unblocks it, such as "Pick option A or B for G-03."

## Inputs

| Input | Required | If missing |
|---|---|---|
| The target system: token source, components, docs, and a version or commit | Yes | Look for `.design-system/run.md`, `registry.json`, a token source, a UI package or folder, a `/system` route, or the foundation's config file. Read the foundation's base reference in `build-design-system/references/`. Pin the commit in `frame.md`. Stop and point to `build-design-system` only when nothing is found, or two candidates disagree and no project rule picks one. |
| The app repo, able to build and run | Yes | Stop if it cannot build, except in audit mode. If it cannot run, offer audit mode only, since nothing can be verified. |
| Scope | No | Everything the inventory finds, listed in `frame.md` for the person to trim |
| Pilot surface | No | The one the person complained about, else the one with the most system components and a failure state |
| Budget | No | The session, stated in `frame.md` |
| Widths and themes | No | The narrowest and widest widths the app supports, default 390 and 1280 (a small phone and a laptop), and every theme it ships |
| Parity mode, `exact` or `mapped` | No | `mapped` when system values differ from legacy ones (`references/verification.md`) |
| Parallel agents with worktree isolation | No | See the coordinator rule under Boundaries, and `references/platforms.md` without isolation |
| A visual or end-to-end test harness | No | `capture.mjs`, run in the CI environment |

Checks run from the repo's own `scripts/` (`check-system.mjs`, `check-spec.mjs`, `gen-docs.mjs`), so they pass on a clean clone. A missing check is a gap for the owner. Captures, pixdiff and the montage run from `<skills>/build-design-system/scripts/`, where `<skills>` is `.agents/skills/` or `.claude/skills/`. Project instructions (AGENTS.md, CLAUDE.md) seed the standing orders.

Right-size once the inventory has counts. With a handful of surfaces (about five), a window costs more than it saves, so one worker runs the phases in sequence, still with the inventory, baselines, ledger and predicate.

## Procedure

Expect a vague request. Default every row above and present `frame.md` once, asking only where no default is safe. Inventory is read-only and starts meanwhile. Read `references/orchestration.md` and `references/run-folder.md` before Frame. Each phase exits on a condition a run-folder file proves.

1. **Frame.** Create `.migration/<run>/` (`references/run-folder.md`). Write `frame.md` with the done predicate as counts, scope, system version, parity mode, widths and themes, budget, window cap, the surfaces allowed to look broken mid-run, and the run branch. Write `standing-orders.md` before any spawn. Exit when every field is filled or has a stated default.

2. **Inventory.** One agent builds or reuses a script that lists every legacy import, raw value and legacy file, and assigns each to a surface (`references/inventory.md`). Anything the build's registry kept is not legacy. `token-mapping` runs per surface on its raw values. Ambiguous rows and gaps become gates, not guesses. The same agent adds the lint rule blocking new legacy usage. Exit when `inventory/counts.txt` has the counts, every finding has a surface, and the rule fails on a planted violation. In audit mode, add no lint rule, write `plan.md`, and stop.

3. **Baselines.** One agent captures a screenshot and probe of every surface, state, width and theme, plus a no-change control capture for the noise floor, and writes the manifest. It measures every trap's before state in the same pass (`references/verification.md`). A state that cannot be reached safely is marked `not captured`, never faked. Exit when every surface has a baseline or a stated reason.

4. **Shared layer.** One agent, alone, lands what every surface needs: the system package and lockfile, theme provider, global styles, token wiring, shared wrappers, and the lint config. Any command that pulls components from the system's registry or generator runs only here, and one that overwrites a customized file is a gate (see the foundation's base reference). Nobody touches these files afterwards. After each edit, run the runtime checks in `references/verification.md`, because a type check misses breaks that show only when a route renders. When the owner adds a component, `component-docs` documents it before any brief names it. Exit when the layer has landed and every baseline still matches, or its diffs are explained.

5. **Pilot.** Brief the pilot from `references/worker-brief.md` and run it end to end: worker, verifier, ledger row, landing. Fix what it exposed in the template before fan-out. Exit when the pilot is `verified` and landed, and the template changes are logged.

6. **Build the lever.** Turn the pilot's recipe into a codemod. Run it on the pilot's starting commit and diff the result against the hand migration. What it misses goes in the brief. Keep the codemod and `lever/RECIPE.md` outside every worker's write scope. Exit when that diff is recorded and a second run is a no-op.

7. **Fan out.** Run a rolling window of workers under the cap in `frame.md`, sized to the host and to how many surfaces have disjoint paths (`references/orchestration.md` has the default and why). Each worker gets one surface, its own branch and worktree (or the fallback in `references/platforms.md`), and a brief with every field filled. Stop spawning early enough that verifying and landing what is in flight fits in the budget left (default about 70% spent).

8. **Verify each surface.** A verifier that did not write the code checks the visual diff, the rendered checklist, the accessibility snapshot, behavior and its delta, and runs `design-review` on the after-captures (`references/verification.md`). With no subagents, the coordinator self-verifies by the fresh-context checklist there. Exit per surface when the ledger has a verdict for its current commit.

9. **Integrate continuously.** Land each verified surface on the run branch as its own commit with its captures, from the first verdict on. A conflict becomes a unit for a worker. After each landing, run the integration checks, every route at HTTP 200 included. A red integration build stops landing until it is green.

10. **Delete legacy.** When a legacy module has zero callers, one unit deletes it, its adapter and its allowlist rows in one change, and the lint rule bans the path outright. Anything that may be imported from outside the repo waits at a gate.

11. **Close.** Drain the inbox. Recapture every surface at the final integration commit, give each reopened row a new verdict there, and prove the predicate. Budget left goes to verifiers for `checks-only`, `self-verified` and reopened surfaces before declaring done. Write `close.md`, audit `decisions.tsv` against what happened, and turn each recurring fix into a check (`references/orchestration.md`). Clear scratch files (`references/run-folder.md`).

## Boundaries

The coordinator never writes product code when it can spawn subagents. On a host without subagents it runs the phases itself, in sequence, and self-verifies per `references/verification.md`.

Decide and log, without asking: the surface split and order, window size under the cap, retries and splits, which verifier runs, clean landings, and brief or codemod fixes the evidence supports. An identical-value swap needs no clearance on any surface. Prove it with `node <skills>/build-design-system/scripts/pixdiff.mjs` at its default tolerance of 0, showing 0% on every route it touches, and log the output. An accessibility change that only adds semantics lands as a decision (`build-design-system/references/traps.md`, Adds-only accessibility changes).

Park in `gates.md` with a default and keep working. Mapped pixel changes, color moves, component swaps and codemods on non-pilot surfaces are gates whose defaults land on the run branch with captures. These gates default to leaving the code as it is:

- A token or component the system lacks.
- A visual diff nobody can explain, or a change that removes, renames or restructures existing semantics.
- A behavior change of any size, including one that looks like a fix. Unlike build, a migration keeps behavior as found, so no commit changes both what a surface does and how it looks.
- A standing order that the code contradicts.
- A dead end that survived one replan.
- Deleting data or an export used outside the repo, merging into the person's branch, force-pushing a shared branch, or deploying.

Never:

- Break the coordinator rule, or let a worker write outside its brief's scope.
- Let two workers edit the same file, or let any worker touch the shared layer after its phase.
- Edit, regenerate, or loosen a baseline, test, threshold, or harness config to make a check pass.
- Invent a token, component, prop, or variant to fill a gap.
- Count `checks-only`, `blocked`, or a self-report as verified, or let a decision row stand in for a verifier.
- Land two surfaces in one commit.
- Keep a legacy module or adapter alive after its last caller moved, except behind a gate with an owner and a removal date.
- Relax the done predicate to declare the run finished.
