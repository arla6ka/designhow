# Orchestration

How one coordinator keeps tens of workers moving without losing any. Read it before Frame and after any restart.

## Contents

- Roles
- The rolling window
- Drains
- Liveness
- Retries by failure mode
- Repeated failures
- Budget and stopping
- Pause and resume
- Escalation
- Turning fixes into checks

## Roles

**Coordinator.** One agent for the whole run. It frames, writes briefs, saves each return's status line and file list (never the whole text), runs drains, keeps the tables current, lands clean merges, and decides. It alone starts the shared dev server and browser (`build-design-system/references/coordinator-path.md`, Dev server and retries), and never ends its turn with workers in flight (`SKILL.md`, the foreground rule). It never edits tests, baselines or the system. With subagents, any code change, a conflicted merge included, becomes a unit with a brief (the coordinator rule in `SKILL.md`), because while the coordinator fixes code, no worker return gets processed.

**Shared-layer owner.** One agent, during the Shared layer phase only. A shared gap reported later becomes a new shared unit that runs alone while the surfaces that depend on it wait.

**Codemod builder.** One agent during Build the codemod. It writes the codemod and `codemod/RECIPE.md`, then hands them over read only.

**Worker.** One surface, one branch, one worktree, one attempt. It runs the codemod, finishes by hand what the codemod left, runs its checks, commits to its own branch, and returns its report as its final message. It cannot ask questions, so it guesses at anything the brief leaves out.

**Verifier.** Checks one surface at one commit and returns one verdict. It did not write the code. Where the checks involve judgment, such as explaining a visual diff or running `ui-review`, its model comes from another family than the worker's.

**Mapper.** Runs `token-mapping` for one surface during Inventory and writes `mapping/<surface>.md`. It edits nothing. Its `Status: stopped: <condition>` counts as `blocked` (`build-design-system/references/run-record.md`, Terms).

**Parity agent.** One agent during Parity. It reads each legacy call site and the system component that replaces it, and writes `parity.tsv` (`references/inventory.md`, Functional parity). It edits nothing else.

Keep two levels, the coordinator and the agents it spawns. Add track leads only when one drain can no longer keep up. Each extra layer re-reads everything, and a lead that blocks hides its workers.

## The rolling window

After the pilot, the window starts at the browser row of the machine budget in `build-design-system/references/coordinator-path.md` (Machine budget) and never exceeds the budget or the cap in `frame.md`. It starts there because the brief has only survived one surface. Grow it inside the budget while drains keep up and the verified rate holds. Go lower on a host with tight rate limits or when few surfaces have disjoint paths.

When a worker finishes, start the next ready surface at the next drain. Do not run fixed batches. A batch waits for its slowest member, while a window refills as soon as a slot opens.

A surface is ready when its dependencies are `done`, it has no gate still reading `gate`, its mapping has no unresolved rows, and every brief field can be filled. No surface is ready while a `gap: blocking` parity row is open (`references/inventory.md`, Functional parity). When the surfaces are near-identical and the codemod covers them, the pilot can run as an ordinary unit with its checks inline, and the window opens as soon as it lands.

Two surfaces that share a file cannot run at the same time. Either one surface takes the file and the other waits, or the file moves to the shared layer.

Under `design-system-boss`, only one step that writes to the repo runs at a time before migration clearance. After clearance, this window governs: parallel workers on disjoint surfaces and paths, each verified. A migration unit may then run beside another step's writers, such as the build's spec workers, when their file lists share no path. Log the overlap in `decisions.tsv` with both lists.

## Drains

A finished worker is a queue event. Note it, keep going, and process the queued worker returns in one batch. That batch is a drain, the only time tables change:

- after finishing a brief, a landing or a gate
- on a timer during fan-out, by default every 15 minutes
- before any report to a person

Each drain does the same steps in one pass:

1. List `inbox/` and `verdicts/` files not yet recorded in the tables.
2. Classify each as reported, verified, failed, lost, or noise.
3. Update `queue.tsv`, `ledger.tsv` and `agents.tsv`. Queue a verifier for each report that needs one. A follow-up that two or more reports list as outside their scope becomes a coordinator task: a unit, a gate, or a KNOWN FAILING line in the next briefs.
4. Land each surface with a `verified` row at its current commit that merges cleanly, one commit per surface, and append a `reopened` row for every verified surface whose paths the landing touched. Then, in a commit of its own, apply the report's allowlist shrink candidates (`check-system.mjs --shrink-allowlist` for `scripts/check-allowlist.json`) and delete `allowlist.tsv` rows that match nothing. The coordinator is the allowlists' only writer.
5. Regenerate `status.md`, and every generated file the wave's landings feed, such as generated docs, in a commit of its own.
6. Spawn the next wave in one message, up to the cap.
7. End with three lines: counts by state, what changed, open gates.

Check one brief per wave against the template in `references/worker-brief.md`, while the wave runs. An empty or vague field stops the next refill until the template or the step that filled it is fixed. The template carries a version line. When a decision or the template changes, rewrite the stale line in place in the template and every brief not yet spawned, send running workers an amendment (Liveness), and bump the version. Never append a correction below the line it contradicts.

Never read a worker's diff during a drain. A diff that needs reading is a verifier's job.

## Liveness

Judge a worker by what it left behind: commits on its branch and the final message it returned. Its transcript, log and claims do not count. Never ask a worker how it is doing, since that pulls it off task, and never extend its job with follow-ups. A new scope is a fresh spawn with a full brief.

On a host that can message a running agent, the coordinator sends two kinds of message, each logged in `decisions.tsv`:

- An amendment: a changed decision or the person's words, pasted in full, with the brief line it replaces. The coordinator rewrites that line in `briefs/<surface>.<n>.md` as well, so a retry carries it.
- `STOP`, naming which of the worker's own edits to revert, by file or commit. The worker reverts them, commits, and returns its report as `partial`.

Without messaging, or when the worker returned first, the amendment goes into the retry's brief and the coordinator does not land the edits a STOP would revert.

Each row in `agents.tsv` has an expected finish time. A worker past it with no new side effect, and absent from the host's list of live agents, is presumed lost. List live agents before relaunching any missing step. Write `inbox/<surface>.<n>.lost.md` with its last side effect and retry per the table below. If it turns up later, anything useful it did goes into a new brief. Its branch never merges unchecked.

Account for every spawn at close. A lost worker whose surface someone else quietly redid hides both the cost and the gap.

## Retries by failure mode

A failed worker gets one retry with a sharper brief, then its surface splits or becomes a gate (`build-design-system/references/coordinator-path.md`, Dev server and retries). The table says what the retry changes.

| What happened | The one retry |
|---|---|
| Ran out of time or context | Split the surface by state or sub-route instead, and brief each part |
| Network failure or a crashed browser | Same brief, once |
| The agent's own tool calls keep erroring | Same brief, once, on a different model |
| A check failed | Respawn with the failing output and the current file contents in the brief |
| Worked outside its scope or ignored a standing order | Fix the brief or the standing orders first, then respawn. Log it as a brief defect. |
| A shared gap | Park the surface behind a shared unit or a gate. It is not a retry. |
| Unknown | Once |

When the retry fails, split the surface, or mark it `blocked (<reason>)` and defer it through a gate that carries the last attempt. It goes on the found-not-fixed list.

The same limit applies to your own tooling. After three tool failures in a row, write `RESUME.md` and stop rather than loop.

## Repeated failures

When the same cause fails two surfaces, stop refilling for that cause (`build-design-system/references/coordinator-path.md`, Dev server and retries). Read the failed surfaces' reports and verdicts side by side, up to 10. The shared cause is usually a codemod rule, a missing mapping row or a shared component gap. Fix the shared cause before retrying any one surface, then rerun every failed surface.

When spawning would produce bad work everywhere, such as a broken shared layer, a wrong mapping or dead CI, write `STOP: <reason>` as the first line of `standing-orders.md`. Running workers may finish. Fix the cause, clear the line, resume.

## Budget and stopping

The budget in `frame.md` is the session unless the person named one. Stop spawning when about 70% is spent, by default, because verifying, landing and closing take roughly the rest. Stop earlier when verification has been slow. Finish what is in flight, then close.

A decision row never replaces a verifier, and budget left at close goes to verifiers first (`references/verification.md`, Verdict states). Report what remains as rows in `queue.tsv`, never as a paragraph.

## Pause and resume

To pause, finish the current drain, spawn nothing, and let in-flight workers return or mark them lost. Commit worker output that exists only in a worktree to its own branch, and write `RESUME.md`. Take no irreversible step to pause.

To resume, a new coordinator reads `standing-orders.md`, `RESUME.md`, `queue.tsv`, `ledger.tsv` and `agents.tsv`, in that order, and treats them as true. Don't rerun a step marked done. Recheck only the claims the next step uses, the facts that can drift: each `in-flight` branch and its head, the run branch head against the last landing, and the baseline manifest. It reattaches work by branch name, because agent ids do not survive a restart. Then it runs one drain and continues.

Every step must be safe to run twice. The codemod leaves migrated code alone, landing checks whether the commit is already on the branch, and ledger rows are keyed by surface and commit.

## Escalation

What reaches a person is the gate list under Boundaries in `SKILL.md`, collected in `gates.md` and reported together, never one message per item. Each gate gets options and a default before anyone is asked, and work routes around it. A change that only adds semantics is a decision, not a gate (`build-design-system/references/traps.md`, Adds-only accessibility changes).

Never reaches a person: retries, flaky test triage, lint and format fixes, splitting a surface, which surface runs next, window size, and "should I keep going". Decide, log it in `decisions.tsv`, and continue.

When a worker finds something outside its surface, it goes in the report as a follow-up. Fix it only if it blocks the migration.

## Turning fixes into checks

When the same correction shows up in two reports or verdicts, make it run by itself, choosing the strongest option that fits: a lint or ast-grep rule that fails CI, then a codemod step, then a verifier check. A standing-orders line comes last, because it works only if every agent obeys it. Log each in `decisions.tsv` and list them in the final report.
