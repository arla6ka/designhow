# Orchestration

How one coordinator keeps tens of workers moving without losing any. Read it before Frame and after any restart.

## Contents

- Roles
- The rolling window
- Drains
- Liveness
- Retries by failure mode
- Sample, tune, sweep for the long tail
- Budget and stopping
- Pause and resume
- Escalation
- Turning fixes into checks

## Roles

**Coordinator.** One agent for the whole run. It frames, writes briefs, saves each return's status line and file list (never the whole text), drains, keeps the tables current, lands clean merges, and decides. It keeps the shared dev server up until every worker has returned, and never ends its turn with workers in flight. It never edits tests, baselines or the system. With subagents, any code change, a conflicted merge included, becomes a unit with a brief (the coordinator rule in `SKILL.md`), because a coordinator that fixes things stops draining and every worker behind it goes idle.

**Shared-layer owner.** One agent, during the Shared layer phase only. A shared gap reported later becomes a new shared unit that runs alone while the surfaces that depend on it wait.

**Lever builder.** One agent during Build the lever. It writes the codemod and `lever/RECIPE.md`, then hands them over read only.

**Worker.** One surface, one branch, one worktree, one attempt. It runs the codemod, finishes by hand what the codemod left, runs its checks, commits to its own branch, and returns its report as its final message. It cannot ask questions, so it guesses at anything the brief leaves out.

**Verifier.** Checks one surface at one commit and returns one verdict. It did not write the code. Where the checks involve judgment, such as explaining a visual diff or running `design-review`, its model comes from another family than the worker's.

**Mapper.** Runs `token-mapping` for one surface during Inventory and writes `mapping/<surface>.md`. It edits nothing.

Keep two levels, the coordinator and the agents it spawns. Add track leads only when one drain can no longer keep up, around ten concurrent agents. Each extra layer re-reads everything, and a lead that blocks hides its workers.

## The rolling window

After the pilot, start a small window and grow it while drains keep up and the verified rate holds, never above the cap in `frame.md`. The default is 3 to 5 at first, growing toward 10. Small at first because the brief has only survived one surface. Around ten because past that one coordinator stops draining in time. Go lower on a host with tight rate limits, when few surfaces have disjoint paths, or when the machine is short of memory, since each worker compiles and captures (`design-system-boss/references/delegation.md`, Machine budget).

When a worker finishes, start the next ready surface at the next drain. Do not run fixed batches. A batch waits for its slowest member, while a window refills as soon as a slot opens.

A surface is ready when its dependencies are `landed`, it has no open gate, its mapping has no unresolved rows, and every brief field can be filled. When the surfaces are near-identical and the codemod covers them, the pilot can run as an ordinary unit with its checks inline, and the window opens as soon as it lands.

Two surfaces that share a file cannot run at the same time. Either one surface takes the file and the other waits, or the file moves to the shared layer. Asking two workers to be careful with the same file is not a plan.

Under `design-system-boss`, only one step that writes to the repo runs at a time before migration clearance. After clearance, this window governs: parallel workers on disjoint surfaces and paths, each verified. A migration unit may then run beside another step's writers, such as the build's spec workers, when their file lists share no path. Log the overlap in `decisions.tsv` with both lists.

As a step agent under another coordinator, this skill is a nested coordinator. It never ends its turn with a background worker live, because the host orphans or kills that worker when the step agent hands back. Spawn each wave as foreground calls in one message, so its workers still run side by side and the drain comes after the whole wave returns.

## Drains

A finished worker is a queue event. Note it, keep going, and process the queue in a batch, called a drain:

- after finishing a brief, a landing or a gate
- on a timer during fan-out, by default about every 15 minutes, often enough that a free slot never sits idle for long
- before any report to a person

Each drain does the same steps in one pass:

1. List `inbox/` and `verdicts/` files not yet recorded in the tables.
2. Classify each as reported, verified, failed, lost, or noise.
3. Update `surfaces.tsv`, `ledger.tsv` and `agents.tsv`. Queue a verifier for each report that needs one.
4. Land each surface with a `verified` row at its current commit that merges cleanly, one commit per surface, and append a `reopened` row for every verified surface whose paths the landing touched. Then, in a commit of its own, apply the report's allowlist shrink candidates (`check-system.mjs --shrink-allowlist` for `scripts/check-allowlist.json`) and delete `allowlist.tsv` rows that match nothing. The coordinator is the allowlists' only writer.
5. Regenerate `status.md`.
6. Spawn the next wave in one message, up to the cap.
7. End with three lines: counts by state, what changed, open gates.

Once per wave, while it runs, check one of its briefs against `references/worker-brief.md`. An empty or vague field stops the next refill until the template or the step that filled it is fixed. Brief quality drops late in long runs.

Never read a worker's diff during a drain. A diff that needs reading is a verifier's job.

## Liveness

Judge a worker by what it left behind: commits on its branch and the final message it returned. Its transcript, log and claims do not count. Never message a worker to ask how it is doing, since that restarts it or pulls it off task, and never extend its job with follow-ups. A retry or a new scope is a fresh spawn with a full brief, because follow-up instructions get dropped on the next restart.

Each row in `agents.tsv` has an expected finish time. A worker past it with no new side effect is presumed lost. Write `inbox/<surface>.<n>.lost.md` with its last side effect and retry per the table below. If it turns up later, anything useful it did goes into a new brief. Its branch never merges unchecked.

Account for every spawn at close. A lost worker whose surface someone else quietly redid hides both the cost and the gap.

## Retries by failure mode

| What happened | Next attempt |
|---|---|
| Ran out of time or context | Split the surface by state or sub-route, then respawn each part |
| Network failure or a crashed browser | Same brief, once |
| The agent's own tool calls keep erroring | Same brief, once, on a different model |
| A check failed | Respawn with the failing output and the current file contents in the brief |
| Worked outside its scope or ignored a standing order | Fix the brief or the standing orders first, then respawn. Log it as a brief defect. |
| A shared gap | Park the surface behind a shared unit or a gate. It is not a retry. |
| Unknown | Once |

After two failed retries, mark the surface `abandoned` with the reason and replan: split it, hand it to a person with the last attempt, or defer it through a gate.

The same limit applies to your own tooling. After three tool failures in a row, write `RESUME.md` and stop rather than loop.

## Sample, tune, sweep for the long tail

When failures start to repeat, stop refilling the window. Read a handful of failed surfaces' reports and verdicts side by side (5 to 10 usually shows the pattern). The shared cause is usually a codemod rule, a missing mapping row or a shared component gap. Fix it once, then rerun every failed surface. Most of a large migration lands early, and hand-tuned retries on the last few percent are where the budget burns.

When spawning would produce bad work everywhere, such as a broken shared layer, a wrong mapping or dead CI, put `STOP: <reason>` on line 0 of `standing-orders.md`. Running workers may finish. Fix the cause, clear the line, resume.

## Budget and stopping

The budget in `frame.md` is the session unless the person named one. Stop spawning when about 70% is spent, by default, because verifying, landing and closing take roughly the rest. Stop earlier when verification has been slow. Finish what is in flight, then close. A run that spends its whole budget spawning ends with many branches and nothing landed.

A decision row never replaces a verifier, and budget left at close goes to verifiers first (`references/verification.md`, Verdict states). Report what remains as rows in `surfaces.tsv`, never as a paragraph.

## Pause and resume

To pause, finish the current drain, spawn nothing, and let in-flight workers return or mark them lost. Commit worker output that exists only in a worktree to its own branch, and write `RESUME.md`. Take no irreversible step to pause.

To resume, a new coordinator reads `standing-orders.md`, `RESUME.md`, `surfaces.tsv`, `ledger.tsv` and `agents.tsv`, in that order, and treats them as true. It does not redo verified work to feel sure. It checks only the facts that can drift: each `in-flight` branch and its head, the run branch head against the last landing, and the baseline manifest. It reattaches work by branch name, because agent ids do not survive a restart. Then it runs one drain and continues.

Every step must be safe to run twice. The codemod leaves migrated code alone, landing checks whether the commit is already on the branch, and ledger rows are keyed by surface and commit.

## Escalation

What reaches a person is the gate list under Boundaries in `SKILL.md`, collected in `gates.md` and reported together, never one message per item. Each gate gets options and a default before anyone is asked, and work routes around it. A change that only adds semantics is a decision, not a gate (`build-design-system/references/traps.md`, Adds-only accessibility changes).

Never reaches a person: retries, flaky test triage, lint and format fixes, splitting a surface, which surface runs next, window size, and "should I keep going". Decide, log it in `decisions.tsv`, and continue.

When a worker finds something outside its surface, it goes in the report as a follow-up. Fix it only if it blocks the migration. At twenty workers, a small scope leak turns into twenty unrequested changes.

## Turning fixes into checks

When the same correction shows up in two reports or verdicts, make it run by itself, choosing the strongest option that fits: a lint or ast-grep rule that fails CI, then a codemod step, then a verifier check. A standing-orders line comes last, because it works only if every agent obeys it. Log each in `decisions.tsv` and list them in the final report.
