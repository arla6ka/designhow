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
.design-system/found-not-fixed.tsv  found-not-fixed rows past the report's 30, the same file the build writes
.design-system/pr.md       the PR body, on a minimal footprint only, untracked
.design-system/run.md      the build's record. The boss writes the skeleton, then the build's coordinator is its only writer
.design-system/scripts/    scripts a rerun needs (inventory scripts, the states module, rendered-type), committed
.design-system/tmp/<worker>/  one-off probes and logs per worker, gitignored, deleted at close
.design-system/review/
  <surface>-{before,after}-<width>.png   captures for every changed surface, gitignored
  *.probe.json             the probe beside each capture, tracked
  surfaces.tsv             surface, route, states and tier, the montage's input, tracked
  traces.tsv               one row per changed surface, tracked
  open-gates.tsv           findings the montage warns on under an open gate, tracked
  <surface>-review.md      review reports the boss saves from returned text, tracked
  index.html               one montage index, before beside after, tracked
```

Sibling records live where the siblings put them, `.design-system/run.md` for the build and `.migration/<run>/` for a migration. What is committed, gitignored or excluded follows the footprint (`build-design-system/references/coordinator-path.md`, Start). When the person wants only product changes committed, `.design-system/` and `.migration/` go in `.git/info/exclude` as on a minimal footprint, and what the team needs later still goes in the repo.

When the route runs the build, the boss writes the `.design-system/run.md` skeleton before any brief names it, from `build-design-system/references/run-record.md`. It holds the File shape headings, the Frame with the run branch, budget and clearance, the standing orders (`run-record.md`'s list, then the boss lines from `delegation.md`), and the gates known so far. Phases, Ledger and Handoff stay empty. From the first build brief on, the build's coordinator seat owns the file.

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
Question: none. "Fix it" does not name a migration, so the run ends check-first and offers it.
Bans: "no uppercase labels" (the person, 10:03), in the standing orders word for word.
Design source: none named.
Answer:

## Route
Full. Steps copied from references/routes.md on 2026-03-12 10:05.
Branch: ds/2026-03-12-full, from main at 7dc8f3d. main gets no commits. Merging is the person's call.
Clearance: none. Check-first, with the migration offered at handoff.

## Budget
Session 2h (host), from 10:02. Workers: 5 docs, 2 code (memory pressure 34% free, backend stopped). Phase caps from routes.md:
- triage and Frame 5%, 6m (10:08)
- build 35%, 42m (10:50), audit beside it
- decided defaults 15%, 18m (11:08), reserved
- migration 30%, 36m (11:44), to docs and found-not-fixed with no clearance
- close 15%, 18m (12:02), never cut
No new writing step after 11:26 (70%), except decided defaults. Read-only steps may run past it.

## Standing orders
1. ... (run-record.md's list, then delegation.md's boss lines, then project rules and bans)

## Steps
| # | Step | Skill | Status | Record | Verdict | Evidence |
|---|---|---|---|---|---|---|
| 1 | Build | build-design-system | done | .design-system/run.md | partial | returns/build.md, `npm run check` exit 0 in run.md#ledger |
| 2 | Migrate audit | migrate-design-system | doing | .migration/q4/ | | |
| 3 | Late defaults | migrate-design-system | skipped (none late) | | | plan.md#gates, reconciled |
| 4 | Check the build | boss | todo | | | |
| 5 | Clearance | person | default (unanswered) | | | check-first, offer in the report |

## Decisions
| When | Decision | Why | Evidence |
|---|---|---|---|
| 10:04 | Route Full, not Build | ask says "fix it", state drifting | triage/signals.tsv |
| 10:06 | Boss holds the build seat: flat host | a probe agent could not start its own. Workers write all product code | briefs/probe.1.md |

## Gates
| ID | Question | Default | Status | Commit | From |
|---|---|---|---|---|---|
| G-01 | Merge 14 body grays into text.default? | merge | default (unanswered) | 4f5e6d7 | .design-system/run.md G-01 |

## Resume
Next action: save step 2's status line to returns/migrate-audit.md and check plan.md.

## Report
```

Status words in every table here follow `build-design-system/references/run-record.md` (Terms, Status): `todo`, `doing`, `done`, `blocked (<condition>)`, `skipped (<reason>)`, `gate` and `default (unanswered)`. A step cut by the budget is `skipped (budget)`. Verdict is the return's first word (`done`, `partial`, `blocked`, `failed`). Gate statuses follow Terms (Gate), and Commit names the run-branch commit that applied the default or the answer.

Gate IDs are `G-NN`, the form the montage reads. The From column names the record and the sibling's own ID. When two records use the same ID, the later one gets the next free `G-NN` here, and its From cell keeps the original.

## Rules

- One writer. Step agents report, and the boss records.
- A decision gets its row when it is made.
- Every row points at a file. A row with no evidence path is a claim.
- Steps, Budget and Resume update in place. Decisions and Gates only grow.
- The Resume line names the single next action, so a crash at any point leaves a way back in.

## Live workers

Empty at a normal close, since the boss waits for every worker. If the host forces a handback while workers run, add a Running workers section first, one row per worker, so the next agent knows what may still be writing.

```markdown
## Running workers
| Worker | Brief | Scope | Doing | Started |
|---|---|---|---|---|
| build: Dialog | briefs/build-dialog.1.md | src/ui/Dialog.*, docs/system/dialog.md | keyboard walk on /customers | 11:42 |
```

A fresh agent checks each row's scope with `git status` before trusting a file in it.

## Resuming

A fresh agent with this skill and the repo does this, in order:

1. Read the Ask, the Route, the Standing orders, then the Steps table.
2. Take the first step not marked done, skipped or blocked, and open its record path.
3. If that sibling record exists, the sibling resumes from it by its own rules. Brief a new step agent with the same brief file and a note that a record exists, or hold the seat again per `delegation.md`, "Who writes product code".
4. Check the facts that drift: the run branch exists and is checked out, its head matches what the last step reported, and `git status` outside the run's scopes matches the last save. Record any difference as a decision first.
5. After a crash, read the machine again (`build-design-system/references/coordinator-path.md`, Machine budget) and lower the window before anything starts. Resume a worker whose transcript survived instead of briefing a new one, unless its files are gone, and redo the step that was running in smaller calls.
6. Leave finished steps alone. Recheck only the one claim the next step builds on.

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

The Report section follows the final message in `build-design-system/references/run-record.md` (Handoff report), with its parts in order, headings dropped, every count from `close.md` with its unit, ending with the Found, not fixed table. The boss adds these:

- It links only tracked files, such as `close.md`, `review/index.html` and `review/traces.tsv`, never a PNG or anything in `tmp/`. On a minimal footprint it names `index.html` as a local file.
- Gates opens with every `default (unanswered)` row from the Gates table, the Frame's questions included, so the person can overturn them. Then up to 3 other applied gates that change what a screen shows or does, the ones bearing on the complaint first, then the rest by how many screens they touch.
- A check-first run offers the migration after the merge in Next, sized from `plan.md`: `To move the other N screens too (M families, about <budget>), reply "Go, <budget>".` On a minimal footprint, Next opens the PR per `build-design-system/references/coordinator-path.md` (Minimal footprint).
- Found, not fixed is one table for the whole run, in the run-record format. The boss merges every sibling's rows (the build's handoff, the migrate `plan.md` or `close.md`, `ui-review` findings, `token-mapping` gaps), drops duplicates by route and what, and sorts and caps them as that format says.
- With no live reader, the Frame goes into the first part.
- On a read-only route, Checks reads `n/a (read-only route)`, the first part says no screen changed because the ask was to look, and Next is the smallest writing ask that follows.
