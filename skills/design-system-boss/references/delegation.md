# Delegation

The boss runs the route and never the work. It writes briefs, reads what comes back, checks it on the files, and records a verdict.

## Contents

- Who writes product code
- What the host can do
- Three ways to run a step
- A coordinator with no shell
- The dev server and live workers
- Without worktrees
- Saving a return
- Standing orders
- The step brief
- Checking a return
- Retries and silence

## Who writes product code

- The boss never writes product code when it can spawn subagents.
- On a host without subagents, the boss takes a sibling's seat and follows that sibling's own coordinator rules, recorded as one decision row.
- A sibling run directly follows its own rule.

## What the host can do

Find out before step 2, and write the answer in the state file.

- **Subagents.** Can this agent start another agent with its own context? Try one read-only helper, such as a triage scout for a second app.
- **Nesting.** Can that agent start agents of its own? Some hosts allow it and some do not. When unsure, assume not.
- **Isolation.** Can each agent get its own branch or worktree? Writing workers need it.
- **Browser.** Can an agent open the running app and take screenshots? The build pilot, baselines and every design review depend on it. Probe with `agent-browser --version`, then one `open` and `screenshot` of the dev server, per `build-design-system/references/browser.md`. Fall back to the repo's Playwright setup, and record which one answered.

## Three ways to run a step

**Nested host.** Each step goes to one step agent, which loads the sibling skill and becomes its coordinator. That agent spawns the sibling's workers. The tree stops at three levels: boss, step agent, worker. The boss sees only the step agent's final message and the files. The step agent is a sibling run, so it follows that sibling's own coordinator rules.

**Flat host.** Agents can start but cannot start their own. Short steps still go to one step agent: `token-mapping`, `design-review`, `component-docs`, and `migrate-design-system` in audit mode. For `build-design-system` and an editing migration, the boss holds the sibling's coordinator seat so it can spawn that sibling's workers directly, with one decision row per seat, "Boss holds the build seat: flat host". Per "Who writes product code", whatever that sibling's coordinator would write in product code goes to a worker, the first family and the token source included. In the migrate seat that means a verifier agent per surface and one commit per surface. It keeps each seat's record in the sibling's file and its own state in `state.md`. The ordered track is in `coordinator-path.md`, "Flat host: the build and migrate seats".

**No subagents.** One agent runs everything in order, taking each sibling's seat per "Who writes product code". It updates `state.md` before and after each step so a crash loses one step at most. The route, briefs and verdicts stay the same.

## A coordinator with no shell

Some hosts give the coordinator file tools and subagents but no shell. Then every shell step goes to a worker: `triage.sh` before and after, `git status` saves, the dev server, check reruns, the clean-clone check and pixel diffs. Each brief names the exact command and asks for its full output and exit code as the final message. The coordinator saves that output under `triage/` or `returns/` and judges it there, as it would its own run. A worker that owns the dev server keeps it up until the last browser step returns. Record "no shell: shell steps delegated" as a decision row. With no shell and no subagents, the run stops at triage and says which commands to run.

Read-only work fans out on any host that has subagents: a triage scout per app, a `design-review` per flow, a `component-docs` per component. Before migration clearance, writing steps never overlap, whatever the host. After clearance, `migrate-design-system`'s rolling window governs: parallel workers on disjoint surfaces and paths, each verified. Disjoint means the steps' file lists share no path, checked as in "Without worktrees" below.

**Never hand back or end your turn with live workers.** A step's return reaches only the agent that started it, and on many hosts a background agent dies with its parent, so a turn that ends early loses every running step. Worse, a worker that outlives its coordinator keeps writing into a repo nobody is checking. Wait for each spawned step with a blocking or foreground call before you close or hand back. If the host cannot wait on background agents, or they die with the parent, run the steps in sequence instead. If the host forces a handback anyway, write a Live workers section in `state.md` first: each live worker, its brief path, its scope and what it was doing.

## The dev server and live workers

The coordinator owns the dev server. It starts one server before the first step that needs a browser, names its port in every brief, and keeps it running until every worker has returned. It never stops the server while a worker is live.

Next 16 refuses a second `next dev` in the same folder, so a worker never starts a dev server in the coordinator's checkout. If the shared server is down, the worker returns `Status: blocked: server down` at once. The coordinator restarts the server and sends the same brief again. A worker in its own APFS clone or worktree may run its own server there, when the host allows one, and its return names the port.

## Without worktrees

Writing workers need isolation. When the host cannot give each one its own branch or worktree, as happens when the app is not the host's primary repo, pick one:

- Run writing workers in sequence, one at a time in the shared checkout.
- Run them side by side only on disjoint file sets. Write each worker's file list in its SCOPE before the spawn, check the lists share no path, and after each return compare `git status --porcelain` against its list. A path outside the list fails the return. A shared file, such as one stylesheet for every component, is split first or goes to one worker.

Record the choice as a decision row.

## Saving a return

- The coordinator saves each worker's status line and file list to `returns/<step>.md`, not the whole text. A retry saves to `returns/<step>.2.md`.
- Workers may write artifacts inside their own scope.
- No brief's RETURN path points into `.design-system/boss/`, which only the coordinator writes.

The full report lives in the sibling's record (`.design-system/run.md`, `.migration/<run>/`). A sibling that returns text only, such as `design-review` or `component-docs`, writes no report file, and the coordinator saves its text where the route says, such as `.design-system/review/<surface>-review.md`. The file list names it. The verdict rests on those files, never on a summary.

```sh
cat > .design-system/boss/returns/build.md <<'RETURN'
done with gaps: 6 families canonical, check exit 0, 2 gates open
files: .design-system/run.md#handoff, src/ui/, docs/system/, scripts/check-system.mjs
RETURN
```

## Standing orders

Numbered, one rule each, written into the state file at step 2 and pasted whole into every brief and every retry. Add a line whenever you catch yourself repeating an instruction.

```
0. (empty; write STOP: <reason> here to halt every new brief)
1. Write only inside this step's SCOPE, and write your artifacts there too. .design-system/boss/ belongs to the coordinator.
2. Use only the colors, fonts, shadows, gradients, motion, logos and product names the app already has.
3. Baselines, fixtures and checks stay as written. Fix the code instead.
4. Leave uncommitted changes and branches you did not create exactly as they are.
5. Commit only to the run branch <branch>. No merge, deploy, publish, force-push, stash, reset or clean.
6. Put questions in your own record as gates with a default, then finish the run.
7. Your final message starts with your status line, then the list of files you wrote, then your report. Write no report file. A sibling that keeps a record (run.md, a migration run folder) keeps writing it.
8. If you coordinate your own workers, as migrate or build run as a step agent do, run each one in the foreground or block on it until it returns. Never return or end your turn while any worker of yours is still running. When you hand back, the host kills or orphans it.
9. The dev server at <port> belongs to the coordinator. If it is down, return `Status: blocked: server down` at once. Never start a second dev server in this checkout.
10. Every claim that something is fixed, passes or works names the command that proved it and its result from this session.
11. Swap a raw literal for a token of exactly the same value on any route once pixdiff shows 0% for that route. Apply every decided gate default on the run branch, codemods on non-pilot screens and color moves included. Any other visible change needs clearance. Every visible change traces to a gate or decision, lands one surface per commit, and has before and after captures in .design-system/review/. A diff with no explanation stays out and becomes a gate.
12. What the team needs after the run (check scripts, check-spec, docs generator, docs) goes in the repo, never only in .design-system/ or a skill folder. On a minimal footprint nothing is vendored, and the repo's own lint, typecheck and build are the check.
13. Scratch files (probe scripts, one-off captures, logs) go in .design-system/tmp/, which is gitignored, or listed in .git/info/exclude on a minimal footprint, and deleted at close. Never in the repo root, scripts/ or a record folder.
14. The allowlists (scripts/check-allowlist.json, a migration's allowlist.tsv) belong to the coordinator. Never edit them. Report shrink candidates in your final message, and the coordinator shrinks the list after landing each surface.
```

Project rules from AGENTS.md or CLAUDE.md go under these as their own lines, quoted with their file.

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
RETURN       Final message: the sibling's status line, then the files written, then the report as text
STANDING     <standing orders, pasted whole>
```

Pass inputs as paths. Paste them only for an agent that cannot read the repo. Leave the sibling's rules out of the brief, because the skill carries them and a paraphrase drifts.

For `migrate-design-system` in edit mode, BUDGET is the figure from the clearance reply, and the brief says so. That skill refuses to start editing workers without a budget in its frame, and the boss is where that budget comes from.

## Checking a return

The status line and file list are saved as `returns/<step>.md` per "Saving a return". Open a step's files only after its final message returns, since a live worker may still be rewriting them. Then check the claim on the files. A summary is a claim.

| Sibling | Check |
|---|---|
| `build-design-system` | Its Handoff section exists. Rerun the check command it names on a clean clone (run `next typegen` first on Next 16) and see it exit 0, with any allowlist committed. The check reads nothing from `.design-system/` or a skill folder. Rerun the spec check from the repo's `scripts/`. Walk the "Done, page by page" table in `system-structure.md`. Every trap in the pilot's files is fixed with before and after numbers, or gated with its measurement. Every design-review finding on the pilot that existing tokens and components can fix is fixed, and the rest are gated. A red check is `failed` |
| `migrate-design-system`, audit | `plan.md` exists and its counts match `inventory/counts.txt`. Its pin is the token commit or later. `scripts/migration-inventory.mjs --help` exits 2 and changes no file. No path in `legacy.txt` is a `registry.json` entry or a kept product composition. Before the first edit brief, and again at close, its gates agree with the build's, or it was re-pinned |
| `migrate-design-system`, edit | Rerun its inventory `--check` on the final commit. Read `surfaces.tsv` for rows not `landed` |
| `token-mapping`, `design-review`, `component-docs` | The status line is present and its counts match the report body |

Verdicts are `done`, `done with gaps` (each gap named), `stopped` (the sibling's condition quoted) and `failed` (the check that failed, with its output). A verdict with no evidence path does not go in the state file.

## Retries and silence

- A step that failed a check gets one retry, with the failing output pasted into its brief. A second failure stops the route at that step.
- A step that went quiet is judged by what it left: commits on its branch, its record file, its return. Never message it to ask how it is going. Past its budget with nothing new, mark it `stopped: no return` and move on to close.
- A step agent that hands back while its own workers still run is not done. Copy each live worker its report names into the Live workers section of `state.md`, with its brief path. Wait for each one's notification. If one is gone, rerun its brief as a fresh spawn. Verify the step only once none is live, and never count it `done` before then.
- A stop from a sibling is an answer, not a failure. Record it, and continue only with steps that do not need its output.
