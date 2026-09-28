# Delegation

The boss runs the route and never the work. It writes briefs, reads what comes back, checks it on the files, and records a verdict. Every line of product code comes from a sibling skill's own workers.

## Contents

- What the host can do
- Three ways to run a step
- Standing orders
- The step brief
- Checking a return
- Retries and silence

## What the host can do

Find out before step 2, and write the answer in the state file.

- **Subagents.** Can this agent start another agent with its own context? Try one read-only helper, such as a triage scout for a second app.
- **Nesting.** Can that agent start agents of its own? Some hosts allow it and some do not. When unsure, assume not.
- **Isolation.** Can each agent get its own branch or worktree? Writing workers need it.
- **Browser.** Can an agent open the running app and take screenshots? The build pilot, baselines and every design review depend on it.

## Three ways to run a step

**Nested host.** Each step goes to one step agent, which loads the sibling skill and becomes its coordinator. That agent spawns the sibling's workers. The tree stops at three levels: boss, step agent, worker. The boss sees only the step agent's final message and the files.

**Flat host.** Agents can start but cannot start their own. Short steps still go to one step agent: `token-mapping`, `design-review`, `component-docs`, and `migrate-design-system` in audit mode. For `build-design-system` and an editing migration, the boss takes the sibling's coordinator seat. It loads that skill, follows its procedure, and spawns its workers directly. Where the sibling tells its coordinator to do a unit by hand, such as the build's first component family, the boss sends that unit to a single worker, alone, before any fan-out. The pattern still gets set once, in sequence, and the boss still writes no product code. While in the seat, the boss keeps the sibling's record in the sibling's file and its own state in `state.md`.

**No subagents.** One agent runs everything in order. It writes code only inside the step it is running, and updates `state.md` before and after each step so a crash loses one step at most. The route, briefs and verdicts stay the same.

Read-only work fans out on any host that has subagents: a triage scout per app, a `design-review` per flow, a `component-docs` per component. Writing steps never overlap, whatever the host.

## Standing orders

Numbered, one rule each, written into the state file at step 2 and pasted whole into every brief and every retry. Add a line whenever you catch yourself repeating an instruction.

```
0. (empty; write STOP: <reason> here to halt every new brief)
1. Write only inside this step's SCOPE. .design-system/boss/ belongs to the coordinator.
2. Use only the colors, fonts, shadows, gradients, motion, logos and product names the app already has.
3. Baselines, fixtures and checks stay as written. Fix the code instead.
4. Leave uncommitted changes and branches you did not create exactly as they are.
5. No deploy, publish, merge to main, force-push, stash, reset or clean.
6. Put questions in your own record as gates with a default, then finish the run.
7. Return your status line and report as your final message.
```

Project rules from AGENTS.md or CLAUDE.md go under these as their own lines, quoted with their file.

## The step brief

One brief per step, saved as `briefs/<step>.<attempt>.md` before the spawn. A field you cannot fill means the step is not ready.

```
SKILL        <sibling skill name>. Load it and follow its "When a coordinator calls it" section.
GOAL         <one sentence: the artifact this step must return>
INPUTS       <paths from earlier steps, from routes.md "What passes between steps">
MODE         <audit or edit, for migrate-design-system; otherwise omit>
BUDGET       <wall-clock time and worker cap for this step>
SCOPE        <paths this step may write, including the sibling's own record folder>
STOP         Return the sibling's stop shape as your final message. Do not work around it.
RETURN       The sibling's status line and report, or the path of its handoff, as your final message.
STANDING     <standing orders, pasted whole>
```

Pass inputs as paths. Paste them only for an agent that cannot read the repo. Leave the sibling's rules out of the brief, because the skill carries them and a paraphrase drifts.

For `migrate-design-system` in edit mode, BUDGET is the figure from the clearance reply, and the brief says so. That skill refuses to start editing workers without a budget in its frame, and the boss is where that budget comes from.

## Checking a return

Save the final message as `returns/<step>.<attempt>.md`. Then check the claim on the files. A summary is a claim.

| Sibling | Check |
|---|---|
| `build-design-system` | Its Handoff section exists. Rerun the check command it names. Walk the "Done, page by page" table in `system-structure.md` |
| `migrate-design-system`, audit | `plan.md` exists and its counts match `inventory/counts.txt` |
| `migrate-design-system`, edit | Rerun its inventory `--check` on the final commit. Read `surfaces.tsv` for rows not `landed` |
| `token-mapping`, `design-review`, `component-docs` | The status line is present and its counts match the report body |

Verdicts are `done`, `done with gaps` (each gap named), `stopped` (the sibling's condition quoted) and `failed` (the check that failed, with its output). A verdict with no evidence path does not go in the state file.

## Retries and silence

- A step that failed a check gets one retry, with the failing output pasted into its brief. A second failure stops the route at that step.
- A step that went quiet is judged by what it left: commits on its branch, its record file, its return. Never message it to ask how it is going. Past its budget with nothing new, mark it `stopped: no return` and move on to close.
- A stop from a sibling is an answer, not a failure. Record it, and continue only with steps that do not need its output.
