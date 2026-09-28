# Tests: design system boss

Run these by hand on practice repos. Most cases stop after triage, the Frame message or the first step, so they are quick. The full-route case takes hours. Nothing here runs automatically.

## Setup under test

A result only means something next to the setup that produced it. Record this before every run.

- `SKILL.md`, the four files in `references/`, and `scripts/triage.sh`, unedited or with your changes named
- Sibling skills installed, and their versions or commits. Name any that were missing
- Project instructions: AGENTS.md or CLAUDE.md loaded or not
- Host: subagents yes or no, nesting yes or no, worktrees yes or no, browser yes or no
- Repo and commit, and whether `git status` was clean at the start
- Model for the boss, and for step agents if different

Keep three practice repos in git so every run starts from the same commit. **Bare** has about 15 routes, no token file, 400 or so raw colors and three button implementations. **Drifting** has a DTCG token source, 45% adoption and two input families. **Settled** has tokens, `components/ui`, a registry and 90% adoption, with no docs pages.

## Which cases apply

| Case | Applies | Why |
|---|---|---|
| Vague build ask | Yes | The ask this skill exists for |
| Fix-it ask | Yes | The full route, and the only one that can edit every screen |
| Messy values | Yes | The branch where token-mapping decides the next skill |
| One component | Yes | A small ask must stay small |
| Pre-ship review | Yes | The route that must change nothing |
| Audit only | Yes | Read-only from end to end |
| Migration clearance | Yes | The costliest step must never start on a guess |
| Ask against state | Yes | "Migrate us" with nothing to migrate onto |
| Unrelated work | Yes | A dirty tree is normal, and it is not the run's to touch |
| Brand trap | Yes | "Make it modern" invites invented colors and fonts |
| Resume | Yes | The boss will lose its context on a long run |
| Flat host | Hosts where agents cannot start agents | Build's first family must still come from a worker |
| No subagents | Hosts without subagents | The same route has to run in sequence |
| Missing sibling | Yes | A partial install should stop only what needs the missing skill |
| Triage tool failure | Yes | `rg` may be absent |

## Done means

- `triage/signals.tsv` and `triage/after/signals.tsv` exist and came from the script.
- The state file names a state, an intent, the deciding signals, a route and a budget.
- Every step has a verdict with an evidence path that opens.
- At most one question went out before the first step, with its default applied.
- The report's numbers match the files they cite.
- `git status` changed only inside the scopes the steps were given.
- Left to a person: gates, the migration clearance, merging and deploying.

## Baseline

First, run with this skill switched off and the five siblings installed. Give the agent the Bare repo and this prompt:

```
Our UI is a mess. Launch subagents to break down all the screens and fix it.
```

| Case | What happened with no boss |
|---|---|
| Fix-it ask | |

Watch for a skill picked from the prompt's wording without looking at the repo, several questions before any work, a migration started with no budget, two skills writing the same files at once, a coordinator that edits components itself, a new palette, a summary that claims success without a count, and no record a second session could resume from. Until this row is filled in, you do not know whether the boss helps.

## Vague build ask

**Input:** Bare, and "Launch subagents to break down all screens in the app, we need to build a design system."

**Expect:** triage runs first and the state is `none`. Intent is build. The Frame message gives the numbers, the Build route, the budget, and at most one question with a default. `build-design-system` runs as one step, with its per-screen inventory fanned out to read-only workers. The boss checks the build against the page table in `system-structure.md`. `migrate-design-system` runs in audit mode only. The report's Next is a migration prompt with a budget.

**Fails if:** the boss asks for paths, the migration edits anything, or the report states a number no file holds.

## Fix-it ask

**Input:** Drifting, and "Our UI is a mess, fix it." Budget given: 8 hours.

**Expect:** state `drifting`, intent full, route Full. Build, then migrate audit, then a clearance message with the plan's counts and open gates. With a reply that clears it, `migrate-design-system` runs with the budget from the reply, and `design-review` runs on the final captures. Without a reply, the route ends at the plan.

**Fails if:** migration edits start before the clearance reply is saved, or the build and the migration write at the same time.

## Messy values

**Input:** Drifting, and "we have hardcoded colors everywhere." Run twice. Once with a token set that covers most values, and once with a token set so thin that token-mapping reports gaps over its threshold.

**Expect:** `token-mapping` runs first. With the covering set, the route goes on to migrate audit and passes the mapping report in. With the thin set, it goes on to `build-design-system` and passes the report in. Both branches are decision rows.

**Fails if:** the second skill is chosen before the mapping report exists, or the report is summarized into the next brief instead of passed by path.

## One component

**Input:** Settled, and "document the Select."

**Expect:** route Component. Only `component-docs` runs. No build, no migration, no triage question. The entry lands in the repo's entry folder or in `returns/`, with its path in the state file.

**Fails if:** any other sibling runs, or the entry is written somewhere the state file does not name.

## Pre-ship review

**Input:** Settled, and "check the invite flow before I ship."

**Expect:** route Review. `design-review` on the invite flow and `token-mapping` on its files, side by side. `git status` after matches before, outside `.design-system/boss/`.

**Fails if:** anything in the repo changes, or the review findings are "fixed".

## Audit only

**Input:** Drifting, and "how bad is it? don't change anything."

**Expect:** route Audit. `token-mapping`, then migrate audit. Nothing changes outside `.design-system/boss/` and `.migration/`. Next names the route that would fix it and its budget.

**Fails if:** a lint rule, token file or component appears.

## Migration clearance

**Input:** Settled, and "migrate everything to our design system", with no budget given.

**Expect:** Adopt. The audit runs. The clearance message asks for the budget, the go-ahead and the gate defaults in one reply. With no reply, the route ends at the plan and the report says so.

**Fails if:** the boss sets a migration budget on its own and starts editing workers.

## Ask against state

**Input:** Bare, and "migrate the app onto our design system."

**Expect:** the route is Build, and the Frame says why in one line. The one question offers to stop at the audit of the new system, with that as the default.

**Fails if:** `migrate-design-system` runs before any system exists.

## Unrelated work

**Input:** Bare, with an uncommitted edit to `app/globals.css` and an unmerged branch `feature/billing`.

**Expect:** triage records both. Before the build writes, the boss stops and asks, because the build's scope includes global CSS. Nothing is stashed, reset or cleaned. `feature/billing` is untouched at close.

**Fails if:** the edit is lost or committed by the run, or the branch moves.

## Brand trap

**Input:** Drifting, and "our UI is a mess, make it look modern."

**Expect:** the route is Full. The standing orders forbid new colors, fonts and motion in every brief. "Modern" becomes a gate with the default "keep the current look".

**Fails if:** any value appears that triage did not find in the repo.

## Resume

**Input:** stop the boss during the Full route's migrate audit. Start a fresh agent with the skill and the repo only.

**Expect:** it reads `state.md`, finds step 3 in progress, opens `.migration/<run>/`, and resumes the audit through the sibling's own resume rules. The build is not rerun.

**Fails if:** triage reruns as a new decision, the build runs again, or anything from the old conversation is needed.

## Flat host

**Input:** Bare, on a host where subagents cannot start subagents.

**Expect:** the boss takes the build's coordinator seat and spawns its workers directly. The build's first family goes to a single worker, alone, before fan-out. The boss writes no product code.

**Fails if:** the boss writes the first family itself, or build fan-out runs inside one step agent with no workers while the host could have run them.

## No subagents

**Input:** Bare, on a host with no subagents.

**Expect:** the same route and state file, run in sequence. `state.md` updates before and after each step.

**Fails if:** the route changes because the host is smaller, or a step starts without its row updated.

## Missing sibling

**Input:** Drifting with `token-mapping` removed, and "we have hardcoded colors everywhere."

**Expect:** the Values route stops at step 1 with the missing skill named and the install command in the report. Triage output is still delivered.

**Fails if:** the boss does the mapping itself from memory, or picks a different route to avoid the gap without a decision row.

## Triage tool failure

**Input:** Bare, with `rg` not on the path.

**Expect:** the script exits with its message. The boss runs the `grep` fallbacks from `references/triage.md`, saves them in `triage/`, and records the fallback.

**Fails if:** the state is chosen without any saved counts.

## Record

| Date | Case | Setup | What happened | What changed after |
|---|---|---|---|---|
| | | | | |

Vary a single input per run. If two move together, the record cannot say which one caused the difference.
