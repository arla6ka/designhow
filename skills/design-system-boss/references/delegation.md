# Delegation

The boss writes briefs, checks what comes back on the files, and records a verdict.

## Contents

- Who writes product code
- What the host can do
- Machine budget
- Three ways to run a step
- A coordinator with no shell
- The dev server
- Without worktrees
- Saving a return
- Standing orders
- The step brief
- Checking a return
- Retries and silence

## Who writes product code

The boss never writes product code when it can spawn subagents. On a host without subagents, it takes a sibling's seat and follows that sibling's coordinator rules, recorded as one decision row. A sibling run directly follows its own rule.

## What the host can do

Find out before the first brief, and write the answers in the state file.

- **Subagents.** Can this agent start another agent with its own context? Try one read-only helper, such as a triage scout for a second app.
- **Nesting.** Can that agent start agents of its own? Some hosts allow it and some do not. When unsure, assume not.
- **Isolation.** Can each agent get its own branch or worktree? Writing workers need it.
- **Browser.** Can an agent open the running app and take screenshots? The build pilot, baselines and every design review depend on it. Probe with one open and one screenshot of the dev server through a browser tool, per `build-design-system/references/browser.md`, and record which tool answered.
- **Headroom.** Memory pressure, from `memory_pressure -Q` on macOS or `free -m` on Linux. It sizes the window (Machine budget, below).

## Machine budget

The window by worker kind, the memory rule, the service stops and the command locks are in `build-design-system/references/coordinator-path.md` (Machine budget). It is the ceiling for every sibling, the migration's rolling window included. The boss records the reading and the window as a decision row in `state.md` and rechecks before each new wave. When the person names a model for workers, use it and record it. Otherwise pick by role, per `build-design-system/references/worker-brief.md`: the cheapest model that can read the whole scope for read-only surveys, the strongest for code, rules and the second review.

## Three ways to run a step

**Nested host.** Each step goes to one step agent, which loads the sibling skill, becomes its coordinator and spawns its workers. The tree stops at three levels: boss, step agent, worker. The build step agent is the coordinator, so it writes the token source and the first family. The boss sees only the step agent's final message and the files.

**Flat host.** Agents cannot start their own. Short steps still go to one step agent: `token-mapping`, `ui-review`, `component-docs`, and `migrate-design-system` in audit mode. For `build-design-system` and an editing migration, the boss holds the sibling's coordinator seat so it can spawn that sibling's workers directly, with one decision row per seat. Any product code that coordinator would write goes to a worker. The token source and the first family go to the one worker the boss names (`build-design-system/references/coordinator-path.md`). In the migrate seat that means a verifier per surface and one commit per surface. The ordered track is in `coordinator-path.md`, "Flat host: the build and migrate seats".

**No subagents.** One agent runs everything in order, taking each sibling's seat. It updates `state.md` before and after each step so a crash loses one step at most. The route, briefs and verdicts stay the same.

## A coordinator with no shell

Some hosts give the coordinator file tools and subagents but no shell. Then every shell step goes to a worker: `triage.sh` before and after, `git status` saves, the dev server, check reruns, the clean-clone check and pixel diffs. Each brief names the exact command and asks for its full output and exit code. The coordinator saves that output under `triage/` or `returns/` and judges it as its own. A worker that owns the dev server keeps it up until the last browser step returns. Record "no shell: shell steps delegated" as a decision row. With no shell and no subagents, the run stops at triage and says which commands to run.

Read-only work fans out on any host with subagents: a triage scout per app, a `ui-review` per flow, a `component-docs` per component. Writing steps follow `SKILL.md` (step 6 and Clear the migration), and disjoint means file lists that share no path, checked as in "Without worktrees" below.

Workers run in the foreground whenever the coordinator is itself a subagent (`coordinator-path.md`, top). If the host forces a handback anyway, write the Running workers section in `state.md` first (`state.md`, Live workers).

## The dev server

Who starts the dev server, and what a worker does when it does not answer, is in `build-design-system/references/coordinator-path.md` (Dev server and retries). The boss names the port in every brief and keeps the server up until every worker has returned.

## Without worktrees

Writing workers need isolation. When the host cannot give each its own branch or worktree, such as when the app is not the host's primary repo, pick one:

- Run writing workers in sequence, one at a time in the shared checkout.
- Run them side by side only on disjoint file sets. Write each worker's file list in its SCOPE before the spawn, check the lists share no path, and after each return compare `git status --porcelain` against its list. A path outside the list fails the return. A shared file, such as one stylesheet for every component, is split first or goes to one worker.

Record the choice as a decision row.

## Saving a return

- The coordinator saves each worker's status line, `Commit: <sha>` line and file list to `returns/<step>.md`, not the whole text. A retry saves to `returns/<step>.2.md`.
- Workers may write artifacts inside their own scope.
- No brief's RETURN path points into `.design-system/boss/`, which only the coordinator writes.

The full report lives in the sibling's record (`.design-system/run.md`, `.migration/<run>/`). For a sibling that returns text only, such as `ui-review` or `component-docs`, the coordinator saves the text where the route says, such as `.design-system/review/<surface>-review.md`. The verdict rests on those files, never on a summary.

```sh
cat > .design-system/boss/returns/build.md <<'RETURN'
partial: 6 families canonical, check exit 0, 2 gates open
Commit: 4be21c0
files: .design-system/run.md#handoff, src/ui/, docs/system/, scripts/check-system.mjs
RETURN
```

## Standing orders

Paste the list in `build-design-system/references/run-record.md` (Standing orders) whole into every brief and retry. To halt every new brief, write `STOP: <reason>` as its first line, the form that file gives. The boss adds one line of its own:

```
- .design-system/boss/ belongs to the coordinator. Write nothing there.
```

Project rules from AGENTS.md or CLAUDE.md go under these as their own lines, quoted with their file. The person's bans follow, quoted word for word with the time they were stated.

## The step brief

One brief per step, saved as `briefs/<step>.<attempt>.md` before the spawn. A field you cannot fill means the step is not ready.

```
SKILL        <sibling skill name>. Load it and follow its "When a coordinator calls it" section.
GOAL         <one sentence: the artifact this step must return>
INPUTS       <paths from earlier steps, from routes.md "What passes between steps">
MODE         <audit or edit, for migrate-design-system; otherwise omit>
BUDGET       <this step's phase cap from routes.md "Budget", as a clock time, and the worker cap>
ORDER        <for build or harden: the order from routes.md "Budget", starting with the named complaint>
SCOPE        <paths this step may write, including the sibling's own record folder. Without worktrees, the exact file list>
STOP         Return the sibling's stop shape as your final message. Do not work around it.
RETURN       Final message: the sibling's status line, then `Commit: <sha>` (the last commit, or `none`), then the files written, then the report as text
STANDING     <standing orders, pasted whole>
```

Pass inputs as paths, pasted only for an agent that cannot read the repo. Leave the sibling's rules out of the brief, because the skill carries them and a paraphrase drifts.

For `migrate-design-system` in edit mode, BUDGET is the figure from the clearance reply, and the brief says so. That skill refuses to start editing workers without one.

## Checking a return

Open a step's files only after its final message returns, since a live worker may still be rewriting them. Then check the claim on the files. A summary is a claim. A review names the commit it read in its first line, and before acting on it, mark the findings that later commits touched as stale.

| Sibling | Check |
|---|---|
| `build-design-system` | Its Handoff section exists. Rerun the check command it names on a clean clone, after the repo's own typecheck prerequisites, and see it exit 0, with any allowlist committed. The check reads nothing from `.design-system/` or a skill folder. Rerun the spec check from the repo's `scripts/`. Walk the "Done, page by page" table in `system-structure.md`. Every trap in the pilot's files is fixed with before and after numbers, or gated with its measurement. Every ui-review finding on the pilot that existing tokens and components can fix is fixed, and the rest are gated. A red check is `failed` |
| `migrate-design-system`, audit | `plan.md` exists and its counts match `inventory/counts.txt`. Its pin is the token commit or later. `scripts/migration-inventory.mjs --help` exits 2 and changes no file. No path in `legacy.txt` is a `registry.json` entry or a kept product composition. Before the first edit brief, and again at close, its gates agree with the build's, or it was re-pinned |
| `migrate-design-system`, edit | Rerun its inventory `--check` on the final commit. Read `.migration/<run>/queue.tsv` for rows not `done` |
| `token-mapping`, `ui-review`, `component-docs` | The status line is present and its counts match the report body |

Verdicts use the worker statuses in `build-design-system/references/run-record.md` (Terms): `done`, `partial` (each gap named), `blocked` (the sibling's stop condition quoted, a `Status: stopped: <condition>` line included) and `failed` (the check that failed, with its output). A verdict with no evidence path does not go in the state file.

## Retries and silence

- A step that failed a check gets one retry, with the failing output pasted into its brief. A second failure stops the route at that step.
- Worker retries inside a step, and the stop on one cause failing two units, follow `build-design-system/references/coordinator-path.md` (Dev server and retries). In a seat the boss holds, a unit that fails its retry splits or becomes a gate, never boss-written code.
- Judge a quiet step by what it left: commits on its branch, its record file, its return. Past its budget with nothing new, mark it `blocked (no return)` and move on to close.
- The boss messages a running step or worker for two reasons only. An amendment carries a changed decision or the person's words, pasted. A STOP names which of the worker's own edits to revert. Never ask how it is going.
- A step agent that hands back while its own workers still run is not done. Copy each live worker its report names into the Running workers section of `state.md`, with its brief path, and wait for each one. If one seems gone, list the live agents first, then rerun its brief as a fresh spawn. Verify the step only once none is live.
- Record a sibling's stop as its verdict and run only steps that don't need its output.
