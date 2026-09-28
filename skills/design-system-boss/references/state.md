# State

One file, `.design-system/boss/state.md`, written only by the boss. It is how a person reads the run without the transcript, and how a fresh agent picks it up after a crash. The sibling skills keep their own records. The state file links to them and does not copy them.

## Contents

- The run folder
- The state file
- Rules
- Resuming
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
  returns/<step>.<n>.md    the boss, copying each step's final message
```

Sibling records live where the siblings put them: `.design-system/run.md` for the build and `.migration/<run>/` for a migration. Whether to commit any of this is the team's call. Most keep it as the record of the run.

## The state file

```markdown
# Design system run: <app>

## Ask
> our UI is a mess, fix it
Received 2026-09-28 10:02.

## Triage
State: drifting (adoption_pct 41, families_with_2plus 3)
Intent: full ("fix it")
Host: flat subagents, worktrees yes, browser yes
Signals: triage/signals.tsv
Question: "Should I also move every screen after the plan?" Default applied: no.
Answer:

## Route
Full. Steps copied from references/routes.md on 2026-09-28 10:05.

## Budget
Total: one working session (8h), 4 workers in flight. Stop starting steps at 5h 36m.
build 5h · migrate audit 1h · review 1h · migrate edit: not cleared

## Standing orders
0. (empty)
1. ...

## Steps
| # | Step | Skill | State | Record | Verdict | Evidence |
|---|---|---|---|---|---|---|
| 1 | Build | build-design-system | done | .design-system/run.md | done with gaps | returns/build.1.md, check output in run.md#ledger |
| 2 | Check the build | boss | done | state.md#decisions | done with gaps | page table: 11 of 12 rows met, brand page has no typeface license |
| 3 | Migrate audit | migrate-design-system | in progress | .migration/q4/ | | |
| 4 | Clearance | person | not started | | | |

## Decisions
| When | Decision | Why | Evidence |
|---|---|---|---|
| 10:04 | Route Full, not Build | ask says "fix it", state drifting | triage/signals.tsv |

## Gates
| ID | From | Question | Default | Reverses by | Status |
|---|---|---|---|---|---|
| B-G-01 | .design-system/run.md | Merge 14 body grays into text.default? | merge | keep them as listed exceptions | open |

## Resume
Next action: drain step 3's return from returns/migrate-audit.1.md.

## Report
```

Step states are `not started`, `in progress`, `done`, `done with gaps`, `stopped: <condition>`, `failed: <check>`, `skipped: <reason>` and `not started: budget`.

Gate IDs keep the sibling's own ID with a prefix for the source (`B-` build, `M-` migration, `T-` token-mapping, `R-` review, `C-` component-docs), so a person can find the original row.

## Rules

- One writer. Step agents never edit `state.md`. They report, and the boss records.
- Write as it happens. A decision gets its row when it is made.
- Every row points at a file. A row with no evidence path is a claim.
- Steps, Budget and Resume update in place. Decisions and Gates only grow.
- The Resume line always names the single next action, so a crash at any point leaves a way back in.

## Resuming

A fresh agent with this skill and the repo does this, in order:

1. Read `state.md`: the Ask, the Route, the Standing orders, then the Steps table.
2. Take the first step not marked done, skipped or stopped. Open its record path.
3. If that sibling record exists, the sibling resumes from it by its own rules. Brief a new step agent with the same brief file and a note that a record exists, or take the coordinator seat again on a flat host.
4. Check the facts that drift: the branch heads a step reported, and whether `git status` still matches the last saved one outside the run's scopes. Record any difference as a decision before going on.
5. Leave finished steps alone. Recheck only the one claim the next step builds on.

## The handoff report

Written into the Report section and returned as the final message. Numbers come from files, never from memory.

```markdown
## Report

### Where it stood
State drifting to settled. Adoption 41% to 88%. Raw color lines 412 to 61.
Button families 3 to 1. (triage/signals.tsv, triage/after/signals.tsv)

### What ran
Full route. Build done with gaps (.design-system/run.md). Migrate audit done
(.migration/q4/plan.md). Clearance given 14:20, budget 6h. Migrate stopped:
budget, 22 of 31 surfaces landed (.migration/q4/surfaces.tsv).
Review done, 0 Blocking on the three flows (returns/review.*.md).

### What exists
Tokens tokens/ · components components/ui/ · docs /system with twins ·
llms.txt · registry.json · checks in npm run check.
Geist structure: 11 of 12 page-table rows met. Brand page lacks the typeface license.

### Gates
B-G-01 open, default merge. M-Gate-4 open, default keep the legacy DatePicker on 2 surfaces.

### Next
"Use migrate-design-system to finish the 9 open surfaces in .migration/q4/,
budget 3 hours." It needs M-Gate-4 answered first.
```
