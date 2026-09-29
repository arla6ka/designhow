---
name: migrate-design-system
description: Use when an app has to move onto a design system that already exists, such as "migrate the app to our design system", "move every screen onto the new components", a rollout, or an adoption audit. When design-system-boss is installed and nobody has checked the system's specs, the boss triages first, since a migration copies a weak system's gaps everywhere. Not for making the system.
---

# Migrate to a design system

The system is settled. One coordinator splits the app into surfaces and runs worker agents one surface at a time, with behavior unchanged. The same skill runs as an audit that ends at a plan. Sibling skill paths start at `<skills>`. Surface, run branch, identical-value swap, decision, gate, clearance, footprint and `<skills>` mean what `build-design-system/references/run-record.md` (Terms) says.

It never designs the system. A missing token or component is a request to the system's owner. It does not change product behavior or deploy unless the standing orders grant it. No editing worker starts before `frame.md` states a budget.

A writing run lands every surface, and every decided gate default, on the run branch (`ds/<yyyy-mm-dd>-migrate` unless one is named), so Next is a plain merge. Moving surfaces beyond identical-value swaps and decided defaults needs clearance, and each visible change needs a gate or decision, before and after captures and a montage row (`references/verification.md`).

## When a coordinator calls it

A coordinator may pass the system location, scope, pilot, budget or a run folder. Use what it gives, default the rest from Inputs, and park questions in `gates.md`. A boss that takes this seat on a host without subagents records that as one decision row. The reply starts with the status line, then `Commit: <run branch head>`, then the final report, `plan.md` in audit mode, or the stop shape below. Audit mode can run beside the build (`references/inventory.md`, Audit mode and plan.md).

## Done

Done means the predicate in `frame.md` holds on the final integration commit, proved from the run folder.

- The inventory script's `--check` exits 0 there: zero legacy imports, zero raw values outside `allowlist.tsv`, zero palette uses when `frame.md` counts them, zero legacy files.
- Every row in `queue.tsv` is `landed` with a `verified` or `self-verified` ledger row at that commit. A verdict at a surface's branch commit or a reopened row does not count.
- The rule that blocks new legacy usage fails CI on a planted violation, and exits 0 at every handoff with the remaining findings in its committed ignore list (`references/inventory.md`). A red check at handoff is a failed run.
- `baselines/MANIFEST.sha256` still matches, and the forbidden-path check passed on every landed diff.
- Every spawned agent has a terminal row in `agents.tsv`, and every `decisions.tsv` row points at evidence that resolves.
- Every fix that recurred became a check, or the report says why it could not.
- Every gate is `applied`, `open` and listed with its default, or `decided` and listed as not landed with its reason.

The first commit that changes a surface fixes the complaint quoted in `frame.md` (run-record, Frame), and every claim names its command (standing order 6).

The final message is the four-part handoff in run-record (Handoff report), with migrate's counts and Next from `close.md` (`references/run-folder.md`, close.md).

If it stops, return the rule that stopped it, the count verified so far, the run folder path, the first action on resume, and the smallest reply that unblocks it.

## Inputs

| Input | Required | If missing |
|---|---|---|
| The target system: token source, components, docs, and a version or commit | Yes | Find it per `references/inventory.md` (Finding the target system) and pin the commit in `frame.md` |
| The app repo, able to build and run | Yes | Stop if it cannot build, except in audit mode. If it cannot run, offer audit mode only, since nothing can be verified. |
| Scope | No | Everything the inventory finds, listed in `frame.md` for the person to trim |
| Pilot surface | No | The one the person complained about, else the one with the most system components and a failure state |
| Budget | No | The session, stated in `frame.md` |
| Widths and themes | No | The app's narrowest and widest widths, default 390 and 1280, and every theme it ships |
| Parity mode, `exact` or `mapped` | No | `mapped` when system values differ from legacy ones (`references/verification.md`) |
| Parallel agents with worktree isolation | No | `references/platforms.md` |
| A visual test harness | No | `capture.mjs`, run in the CI environment |

Project instructions (AGENTS.md, CLAUDE.md) seed the standing orders. With about five surfaces or fewer, one worker runs the phases in sequence, still with the inventory, baselines, ledger and predicate, because a window costs more than it saves.

## Procedure

Default every row above and present `frame.md` once, asking only where no default is safe. Inventory is read-only and starts meanwhile. Read `references/orchestration.md` and `references/run-folder.md` before Frame. Each exit condition is proved by a run-folder file.

1. **Frame.** Create `.migration/<run>/` and write `frame.md` and `standing-orders.md` (`references/run-folder.md`). Exit when every field is filled or has a stated default, before any spawn.
2. **Inventory.** One agent builds or reuses the inventory script and the lint rule that blocks new legacy usage, and mappers run `token-mapping` per surface (`references/inventory.md`). Ambiguous rows become gates. Exit when `inventory/counts.txt` has the counts, every finding has a surface, and the rule fails on a planted violation. Audit mode adds no rule, writes `plan.md`, and stops.
3. **Baselines.** One agent captures and measures every surface before any edit (`references/verification.md`, Baselines). Exit when every surface has a baseline or a stated `not captured` reason, and the manifest is written.
4. **Shared layer.** One agent, alone, lands what every surface needs (`references/inventory.md`, The shared layer). Nobody touches those files afterwards. Exit when the layer has landed, the runtime checks pass, and every baseline still matches or its diffs are explained.
5. **Pilot.** Brief the pilot from `references/worker-brief.md` and run it end to end: worker, verifier, ledger row, landing. Fix what it exposed in the template. Exit when the pilot is `verified` and landed, and the template changes are logged.
6. **Build the codemod.** Turn the pilot's recipe into a codemod, run it on the pilot's starting commit and diff the result against the hand migration. What it misses goes in the brief. The codemod and `codemod/RECIPE.md` stay outside every worker's write scope. Exit when that diff is recorded and a second run is a no-op.
7. **Fan out.** Run a rolling window under the cap in `frame.md` (`references/orchestration.md`), one surface per worker, each with its own branch and worktree (or the fallback in `references/platforms.md`) and a brief with every field filled. Exit spawning at about 70% of the budget (`references/orchestration.md`, Budget and stopping).
8. **Verify each surface.** A verifier that did not write the code checks the visual diff, rendered checklist, accessibility snapshot, behavior and its delta, and runs `design-review` (`references/verification.md`). Without subagents the coordinator self-verifies by the checklist there. Exit per surface when the ledger has a verdict for its current commit.
9. **Integrate continuously.** Land each verified surface on the run branch as its own commit with its captures. A conflict becomes a unit for a worker. After each landing, run the integration checks. A red integration build stops landing until it is green.
10. **Delete legacy.** When a legacy module has zero callers, one unit deletes it, its adapter and its allowlist rows in one change, and the lint rule bans the path. Anything imported from outside the repo waits at a gate.
11. **Close.** Run a last drain, recapture every surface at the final integration commit, and give each reopened row a new verdict there. Spend budget left on verifiers for `checks-only`, `self-verified` and reopened surfaces. Write `close.md`, audit `decisions.tsv`, turn each recurring fix into a check (`references/orchestration.md`), and clear scratch files. Exit when the predicate holds or the report names what is left.

## Boundaries

The coordinator never writes product code when it can spawn subagents. On a host without subagents it runs the phases itself, in sequence, and self-verifies per `references/verification.md`.

Decide and log, without asking: the surface split and order, window size under the cap, retries and splits (`build-design-system/references/coordinator-path.md`, Dev server and retries), which verifier runs, clean landings, brief or codemod fixes the evidence supports, identical-value swaps on any surface, gate defaults the build recorded as `decided`, and adds-only accessibility changes (`build-design-system/references/traps.md`, Adds-only accessibility changes).

Park in `gates.md` with a default and keep working. Mapped pixel changes, color moves, component swaps and codemods on non-pilot surfaces are gates whose defaults land on the run branch with captures. These gates default to leaving the code as it is:

- A token or component the system lacks.
- A visual diff nobody can explain, or a change that removes, renames or restructures existing semantics.
- A Blocking `design-review` finding already present in the baseline. The surface still verifies.
- A behavior change of any size, including one that looks like a fix, because a migration keeps behavior as found.
- A standing order that the code contradicts.
- A dead end that survived one replan.
- Deleting data, or an export used outside the repo.

Never:

- Let two workers edit the same file, or let any worker touch the shared layer after its phase.
- Invent a token, component, prop, or variant to fill a gap.
- Count `checks-only`, `blocked`, or a self-report as verified, or let a decision row stand in for a verifier.
- Keep a legacy module or adapter alive after its last caller moved, except behind a gate with an owner and a removal date.
- Relax the done predicate to declare the run finished.
