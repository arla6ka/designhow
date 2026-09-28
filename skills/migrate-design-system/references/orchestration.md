# Orchestration

How one coordinator keeps tens of workers moving without losing track of any of them. Read this before Frame, and again after any restart.

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

**Coordinator.** One agent, for the whole run. It frames the run, writes briefs, saves each return's status line and file list to `inbox/` or `verdicts/` (never the whole text), drains, keeps the tables current, lands clean merges, and decides. It owns the shared dev server and keeps it up until every worker has returned, and it never ends its turn with workers in flight. Who writes product code follows the coordinator rule under Boundaries in `SKILL.md`. The coordinator never edits tests, baselines or the system. With subagents, any code change, conflicted merge included, becomes a unit with a brief, because a coordinator that fixes things stops draining and every worker behind it goes idle.

**Shared-layer owner.** One agent during the Shared layer phase and at no other time. It owns the system package, lockfile, providers, global CSS, token wiring, shared wrappers, and lint config. When a worker reports a shared gap later, the coordinator opens a new shared unit and runs it alone. Surfaces that depend on it wait.

**Lever builder.** One agent during Build the lever. It writes the codemod and `lever/RECIPE.md`, then hands them over read only.

**Worker.** One surface, one branch, one worktree, one attempt. It reads its brief, runs the codemod, finishes by hand what the codemod left, runs its checks, commits to its own branch, and returns its report as its final message. It cannot ask questions, so anything the brief leaves out, it will guess.

**Verifier.** Checks one surface at one commit and returns one verdict. It did not write the code. Where the checks involve judgment, such as explaining a visual diff or running `design-review`, its model comes from another family than the worker's.

**Mapper.** Runs `token-mapping` for one surface during Inventory and writes `mapping/<surface>.md`. It edits nothing.

Keep it to two levels, the coordinator and the agents it spawns. Add a middle layer of track leads only if a single drain can no longer process everything in flight, which starts at roughly ten concurrent agents. Each extra layer re-reads everything, and a lead that blocks hides its workers from you.

## The rolling window

Start with 3 to 5 workers after the pilot and grow toward 10 while drains keep up and the verified rate holds, never above the cap in `frame.md`. When one finishes, start the next ready surface at the next drain. Do not run fixed batches. A batch waits for its slowest member, while a window refills as soon as a slot opens.

A surface is ready when its dependencies are `landed`, it has no open gate, its mapping has no unresolved rows, and every brief field can be filled.

Under `design-system-boss`, only one step that writes to the repo runs at a time before migration clearance. After clearance, this skill's rolling window governs: parallel workers on disjoint surfaces and paths, each verified. A migration unit may then run beside another step's writers, such as the build's spec workers, when their file lists share no path. Log the overlap in `decisions.tsv` with both lists.

When this skill runs as a step agent under another coordinator, such as `design-system-boss`, it is a nested coordinator. It runs every worker and verifier in the foreground or blocks on it, and never ends its turn with a background worker live, because the host orphans or kills that worker when the step agent hands back. Spawn each wave as foreground calls in one message, so its workers still run side by side and the drain comes after the whole wave returns.

Two surfaces that share a file cannot run at the same time. Either one surface takes the file and the other waits, or the file moves to the shared layer. Asking two workers to be careful with the same file is not a plan.

## Drains

A finished worker is a queue event. Note it and keep going. Process the queue in a batch, called a drain, at these points:

- after finishing a brief, a landing, or a gate
- when a timer fires, about every 15 minutes during fan-out
- before any report to a person

Each drain does the same steps in one pass:

1. List `inbox/` and `verdicts/` files not yet recorded in the tables.
2. Classify each one as reported, verified, failed, lost, or noise.
3. Update `surfaces.tsv`, `ledger.tsv`, and `agents.tsv`. Queue a verifier for each report that needs one.
4. Land any surface that has a `verified` row at its current commit and merges cleanly, one commit per surface. Append a `reopened` row for every verified surface whose paths the landing touched. After each landing, apply the report's allowlist shrink candidates in a commit of their own: `check-system.mjs --shrink-allowlist` for `scripts/check-allowlist.json`, and delete the `allowlist.tsv` rows that match nothing. The coordinator is the allowlist's only writer.
5. Regenerate `status.md`.
6. Spawn the next wave in one message, up to the cap.
7. End with three lines: counts by state, what changed, open gates.

Once per wave, read one brief you sent in it against `references/worker-brief.md`. Do this while the wave runs, not before it. A brief with an empty or vague field stops the next refill until the template or the step that filled it is fixed. Brief quality drops late in long runs, and one sample per wave catches it early.

Never read a worker's diff during a drain. A diff that needs reading is a verifier's job.

## Liveness

Judge a worker by what it left behind, such as commits on its branch and the final message it returned. Its transcript, its log updates, and its own claims do not count. Never resume or message a worker to ask how it is doing, since that restarts it or pulls it off task. Never extend a worker's job with follow-up messages either. A retry or a new scope is a fresh spawn with a full brief, because instructions added in follow-ups get dropped on the next restart.

Each row in `agents.tsv` has an expected finish time. A worker past that time with no new side effect is presumed lost. Write `inbox/<surface>.<n>.lost.md` with its last side effect and retry per the table below. If it turns up later, check its branch against the current run branch and ledger before accepting anything. Anything useful it did goes into a new brief. Its branch never merges unchecked.

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

After two failed retries, mark the surface `abandoned` with the reason and replan. Split it, hand it to a person with the last attempt as a starting point, or defer it through a gate. Do not keep spending on the same brief.

Apply the same limit to your own tooling. After three tool failures in a row, write `RESUME.md` and stop, rather than looping.

## Sample, tune, sweep for the long tail

When failures start to repeat, stop refilling the window. Pick 5 to 10 failed surfaces and read their reports and verdicts side by side. Find the shared cause, which is usually a codemod rule, a missing mapping row, or a shared component gap. Fix it once in the codemod, the brief template, or the shared layer. Then rerun every failed surface. Most of a large migration lands early, and the last few percent are where a hand-tuned retry per surface burns the budget.

When spawning would produce bad work everywhere, such as a broken shared layer, a wrong mapping, or dead CI, put `STOP: <reason>` on line 0 of `standing-orders.md`. Workers already running may finish. Then fix the cause, clear the line, and resume.

## Budget and stopping

The budget in `frame.md` is the session unless the person named one, and an adoption ask counts as clearance within it. At about 70% of the budget, stop spawning workers. Finish verifying and landing what is in flight, then close. A decision row never replaces a verifier. Short on budget, an unverified surface stays `checks-only` and the report counts it. When budget remains at close, spend it on verifiers for every `checks-only`, `self-verified` and `reopened` surface before declaring done. A run that spends its whole budget spawning ends with many branches and nothing landed. Report what remains as rows in `surfaces.tsv`, never as a paragraph.

## Pause and resume

To pause, finish the current drain, spawn nothing, and let in-flight workers write their reports or mark them lost. Commit any worker output that exists only in a worktree to its own branch. Write `RESUME.md`. Take no irreversible step to pause.

To resume, a new coordinator reads `standing-orders.md`, `RESUME.md`, `surfaces.tsv`, `ledger.tsv`, and `agents.tsv`, in that order. It treats them as true. It does not redo verified work to feel sure. Then it checks the facts that can drift. Does each `in-flight` branch exist, and what is its head? Does the run branch head match the last landing? Does the baseline manifest still match? It reattaches work by branch name, because agent ids do not survive a restart. Then it runs one drain and continues.

Every step must be safe to run twice. The codemod leaves migrated code alone. Landing checks whether the commit is already on the branch. Ledger rows are keyed by surface and commit, so a repeated drain changes nothing.

## Escalation

Reaches a person, collected in `gates.md` and reported together, never one message per item:

- Anything irreversible. Merging into the person's branch, deploying, force-pushing a shared branch, deleting an export used outside the repo, or deleting data.
- Product and taste calls. A new token or component, a visual change the mapping does not explain, a change that removes, renames or restructures existing semantics, or any behavior change. A change that only adds semantics is a decision, not a gate (`build-design-system/references/traps.md`, Adds-only accessibility changes). A mapped visual change is a gate too, and its default lands on the run branch with captures, like every decided default.
- A standing order that the code contradicts.
- A dead end that survived one replan.

Each gate gets options and a default before anyone is asked, and work routes around it.

Never reaches a person: retries, flaky test triage, lint and format fixes, splitting a surface, which surface runs next, window size, and "should I keep going". Decide, log it in `decisions.tsv`, and continue.

When a worker finds something outside its surface, it goes in the report as a follow-up. Fix it only if it blocks the migration. At twenty workers, a small scope leak turns into twenty unrequested changes.

## Turning fixes into checks

When the same correction shows up in two reports or verdicts, turn it into something that runs by itself, and choose the strongest option that fits. First, a lint or ast-grep rule that fails CI. Next, a codemod step. Next, a check in the verifier's script. A new standing-orders line comes last, because it only works if every agent reads and obeys it. Log each one in `decisions.tsv`, and list them in the final report.
