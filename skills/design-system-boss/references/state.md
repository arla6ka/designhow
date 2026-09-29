# State

One file, `.design-system/boss/state.md`, written only by the boss. A person reads the run from it without the transcript, and a fresh agent picks it up from it after a crash. The siblings keep their own records, which the state file links and never copies.

## Contents

- The run folder
- The state file
- Rules
- Resuming
- Live workers
- The close file
- The handoff report

## The run folder

```
.design-system/boss/
  state.md                 the boss, the only writer
  triage/                  scripts/triage.sh, at the start
  triage/after/            the same script, at close
  triage/git-before.txt    git status --porcelain, at the start
  triage/git-after.txt     the same, at close
  briefs/<step>.<n>.md     the boss, before each spawn
  returns/<step>.md        each step's status line and file list
.design-system/close.md    every count the report quotes, written at close, the same file the build writes
.design-system/pr.md       the PR body, on a minimal footprint only, untracked
.design-system/run.md      the build's record. The boss writes the skeleton, then the build's coordinator is its only writer
.design-system/tmp/        scratch for every agent, gitignored, deleted at close
.design-system/review/
  <surface>-{before,after}-<width>.png   captures for every changed surface, gitignored
  *.probe.json             the probe beside each capture, tracked
  surfaces.tsv             surface, route and states, the montage's input, tracked
  traces.tsv               one row per changed surface, tracked
  open-gates.tsv           findings the montage warns on under an open gate, tracked
  <surface>-review.md      review reports the boss saves from returned text, tracked
  index.html               one montage index, before beside after, tracked
```

Sibling records live where the siblings put them, `.design-system/run.md` for the build and `.migration/<run>/` for a migration. The run commits its records, `review/` included. `.gitignore` lists only `.design-system/review/**/*.png` and `.design-system/tmp/`, so captures stay out of commits and the traces, reports and montage page stay in. On a minimal footprint all of `.design-system/` and `.migration/` stays untracked, listed in `.git/info/exclude`. The check, check-spec, the docs generator and the docs live in the repo's `scripts/` and `docs/`, so the repo works once these folders are gone.

When the route runs the build, the boss writes the `.design-system/run.md` skeleton before any brief names it, from `build-design-system/references/run-record.md`. It holds the File shape headings, the Frame with the run branch, budget and clearance, the standing orders (the boss's list with the build's lines under it), and the gates known so far. Phases, Ledger and Handoff stay empty. From the first build brief on, the build's coordinator seat owns the file.

## The state file

```markdown
# Design system run: <app>

## Ask
> our UI is a mess, fix it
Received 2026-03-12 10:02.

## Triage
State: drifting (adoption_pct 41, families_with_2plus 3)
Intent: full ("fix it")
Host: flat subagents, worktrees yes, browser yes
Signals: triage/signals.tsv
Question: none. "Fix it" on a mess counts as clearance, so the migration runs within the budget.
Answer:

## Route
Full. Steps copied from references/routes.md on 2026-03-12 10:05.
Branch: ds/2026-03-12-full, from main at 7dc8f3d. main gets no commits. Merging is the person's call.
Clearance: the ask ("make it look like one thing"), within the session budget.

## Budget
Session 2h (host), 4 workers in flight. Phase caps from routes.md:
triage and Frame 6m (10:08) · build 48m (10:56), audit beside it · migration 36m (11:32) ·
review 12m, beside the migration · close 18m, never cut.
No new writing step after 11:26. Read-only steps may run past it.

## Standing orders
0. (empty)
1. ...

## Steps
| # | Step | Skill | State | Record | Verdict | Evidence |
|---|---|---|---|---|---|---|
| 1 | Build | build-design-system | done | .design-system/run.md | done with gaps | returns/build.md, `npm run check` exit 0 in run.md#ledger |
| 2 | Migrate audit | migrate-design-system | in progress | .migration/q4/ | | |
| 3 | Check the build | boss | done | state.md#decisions | done with gaps | page table: 11 of 12 rows met, brand page has no typeface license |
| 4 | Clearance | person | not started | | | |

## Decisions
| When | Decision | Why | Evidence |
|---|---|---|---|
| 10:04 | Route Full, not Build | ask says "fix it", state drifting | triage/signals.tsv |
| 10:06 | Boss holds the build seat: flat host | a probe agent could not start its own. Workers write all product code | briefs/probe.1.md |

## Gates
| ID | From | Question | Default | Reverses by | Status |
|---|---|---|---|---|---|
| G-01 | .design-system/run.md G-01 | Merge 14 body grays into text.default? | merge | keep them as listed exceptions | applied on ds/2026-03-12-full |

## Resume
Next action: save step 2's status line to returns/migrate-audit.md and check plan.md.

## Report
```

Step states are `not started`, `in progress`, `done`, `done with gaps`, `stopped: <condition>`, `failed: <check>`, `skipped: <reason>` and `not started: budget`.

Gate IDs are `G-NN`, the form the montage reads. The From column names the record and the sibling's own ID. When two records use the same ID, the later one gets the next free `G-NN` here, and its From cell keeps the original.

## Rules

- One writer. Step agents report, and the boss records.
- A decision gets its row when it is made.
- Every row points at a file. A row with no evidence path is a claim.
- Steps, Budget and Resume update in place. Decisions and Gates only grow.
- The Resume line names the single next action, so a crash at any point leaves a way back in.

## Live workers

Empty at a normal close, since the boss waits for every worker. If the host forces a handback while workers run, fill it first, one row per worker, so the next agent knows what may still be writing.

```markdown
## Live workers
| Worker | Brief | Scope | Doing | Started |
|---|---|---|---|---|
| build: Dialog | briefs/build-dialog.1.md | src/ui/Dialog.*, docs/system/dialog.md | keyboard walk on /customers | 11:42 |
```

A fresh agent checks each row's scope with `git status` before trusting a file in it.

## Resuming

A fresh agent with this skill and the repo does this, in order:

1. Read the Ask, the Route, the Standing orders, then the Steps table.
2. Take the first step not marked done, skipped or stopped, and open its record path.
3. If that sibling record exists, the sibling resumes from it by its own rules. Brief a new step agent with the same brief file and a note that a record exists, or hold the seat again per `delegation.md`, "Who writes product code".
4. Check the facts that drift: the run branch exists and is checked out, its head matches what the last step reported, and `git status` outside the run's scopes matches the last save. Record any difference as a decision first.
5. Leave finished steps alone. Recheck only the one claim the next step builds on.

## The close file

`.design-system/close.md` is the one file the report takes its counts from. The boss writes it at close, after `triage/after/` and the clean-clone check, and takes in the build's close rows and the migration's `.migration/<run>/close.md`, which stays the migration's own record. No count in the report changes without changing here first. One row per count, each with its unit and source file or command.

```markdown
# Close: ds/2026-03-12-full at 4be21c0

| Count | Unit | Before | After | Source |
|---|---|---|---|---|
| raw_color_lines | lines | 80 | 12 | triage/signals.tsv, triage/after/signals.tsv |
| tw_arbitrary | occurrences | 27 | 1 | the same |
| screens changed | routes | | 7 of 8 | .design-system/review/traces.tsv |
| surfaces verified | surfaces | | 6 of 7 by an independent agent | .migration/q4/ledger.tsv |
| allowlisted | violations | | 14 | scripts/check-allowlist.json |
| gates applied | gates | | 8 | state.md#gates |

## Still raw
- src/billing/InvoiceList.tsx: 9 lines, the invoice status colors (gate G-06)
- components/Chart.tsx: 3 lines, chart series colors, follow-up
```

When `montage.mjs` exits 0 with warnings on open gates, the close file gets a `## Montage warnings` list, one line per warning with its gate id, copied from the montage output, and the montage row reads `0, N warnings on open gates`. An exit 1 means a change nobody explained, and the run is not done.

"Still raw" comes from `triage/after/raw-colors.txt`, grouped by file, with the reason each stayed. An empty list says `none`.

## The handoff report

Written into the Report section from `close.md`. The final chat message is its four parts verbatim, headings dropped, in about 200 words. Every count comes from `close.md`, never from memory, with its unit. It links only tracked files, such as `close.md`, `review/index.html` and `review/traces.tsv`, never a PNG or anything in `tmp/`. On a minimal footprint, where nothing under `.design-system/` is tracked, it names `index.html` as a local file. No route names, no skill names the person did not use, no process narration and no skill friction.

- **What changed** opens with one plain sentence that answers the ask, and names what is still raw and where, never "every screen". Then which screens changed and which didn't, and why, such as "7 of 8 screens changed; /help looks the same because it already matched", or "No screen looks different yet: this run built the system and a plan, and moving screens needs your go-ahead." With no live reader, the Frame goes here too.
- **Gates** lists up to 3 applied gates that change what a screen shows or does, so the person sees the ones they may want to reverse. Gates that bear on the complaint go first, such as the color moves on a hardcoded-colors ask, then the rest by how many screens they touch.
- **Next** is one plain-language prompt that clears every gate at once, usually a merge with named reversals. When surfaces wait on clearance, one sentence follows the merge: `To move the other N screens too, reply "Go, <budget>".` It never asks the person to do a step the run could have done, like re-pinning a plan or rerunning a check, and carries no process dispute, which goes in the state file. On a minimal footprint, Next opens the PR with `.design-system/pr.md` as its body, after a rebase when the base carries commits upstream doesn't have, per `references/routes.md` (Minimal footprint close).

```markdown
## Report

### What changed
7 of 8 screens now use one button, one input and one set of grays, on ds/2026-03-12-full.
/help looks the same because it already used the shared pieces. Raw color lines in product
code went from 80 to 12: 9 in /billing and 3 in components/Chart.tsx. Before and after:
.design-system/review/index.html.

### Checks
npm run check (clean clone of ds/2026-03-12-full): exit 0, 14 existing violations in scripts/check-allowlist.json (committed)
node scripts/check-spec.mjs docs/system: exit 0, 6 specs
npm run build: exit 0

### Gates the branch applied
G-04: the blue Sign in button is now the black primary. Default: black.
G-01: 14 body grays merged into text.default. Default: merge.
6 more in state.md#gates.

### Next
"Merge ds/2026-03-12-full, but keep the blue Sign in button (reverse G-04)."
```

On a read-only route, Checks reads `n/a (read-only route)`, What changed says no screen changed because the ask was to look, and Next is the smallest writing ask that follows.
