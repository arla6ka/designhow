---
name: design-system-boss
description: Use for vague design system asks, like "our UI is a mess, fix it", "we need a design system" or "break down every screen". Triages the app, then runs the design.how skills in order.
---

# Design system boss

The entry point for design system work. The ask is usually one loose sentence. This skill triages the app, picks a route through the five design.how skills, runs each step through subagents where the host has them, keeps one state file, and hands back one report. It owns the route, the budget and the record. The sibling skills own the work, and each is called through its "When a coordinator calls it" section.

The five are `build-design-system`, `migrate-design-system`, `token-mapping`, `design-review` and `component-docs`. Point briefs at them by name. Their rules stay in their own files.

Any system this run builds or changes follows Geist's information architecture (https://vercel.com/geist/introduction), as written down in `build-design-system/references/system-structure.md`. Check results against that file. Do not restate it here or in a brief.

## Output

Done means the route's last step has returned, every step has a verdict in `.design-system/boss/state.md`, and the handoff report is written from files.

Checkable:

- `triage/signals.tsv` came from `scripts/triage.sh` at the start, and `triage/after/signals.tsv` from the same script at the end.
- The route in the state file is the one the routing table gives for the triage state and intent, or a decision row says why it differs.
- Every step has a row: `done`, `done with gaps`, `stopped` with the sibling's stop shape, `skipped: <reason>`, or `not started: budget`.
- Every verdict names the file that proves it, and was checked on that file, not on the sibling's summary.
- When the run built or changed a system, every row of the "Done, page by page" table in `system-structure.md` was checked on the repo.
- Every gate from every sibling record appears once in the report, with its default and its source path.
- `git status` before and after is saved, and no path changed outside the scopes the steps were given.

Needs a person: every gate, clearing a migration to edit code, and anything version control cannot undo.

The report has five parts. `references/state.md` shows the full shape.

1. Where it stood. The triage numbers and state, before and after.
2. What ran. Each step, its verdict and its record path.
3. What exists. Paths for the token source, components, docs pages, twins, `llms.txt`, registry and checks, marked against the Geist structure.
4. Gates. Merged across records, each with its default and what reverses it.
5. Next. One step, written as a prompt the person can paste, with the budget it needs.

If it stops, return the condition, what finished with paths, the state file path, and the smallest reply that unblocks it, such as "Say which app: apps/web or apps/admin."

## Inputs

| Input | If missing |
|---|---|
| The ask, however vague | Required. "Our UI is a mess" is enough to start |
| The repo | Stop. Read-only access limits the run to the Audit and Review routes |
| Target app, in a monorepo | The one question. Triage every app while waiting |
| Intent | Read it from the ask's words with `references/triage.md`. If two routes fit and differ by a whole phase, that is the one question |
| Budget | Ask in the Frame message. With no answer, one working session, 4 workers in flight, and no migration edits |
| The five sibling skills | Look beside this folder, then in `.agents/skills/` and `.claude/skills/`. A missing one stops only the steps that need it, and the report names it |
| Subagents, nested subagents, a browser | Probe them per `references/delegation.md`. Without subagents, run every step in sequence |
| AGENTS.md or CLAUDE.md | Their rules win over this file. Pass them into every brief |

## Procedure

Open a task list whose first items are the route's steps from `references/routes.md`, copied word for word. A step you drop stays on the list as `skip: <reason>`.

1. **Triage.** If `.design-system/boss/state.md` exists, resume from it per `references/state.md` and skip to the first unfinished step. Otherwise run `scripts/triage.sh`, save `git status --porcelain` to `triage/git-before.txt`, and read AGENTS.md or CLAUDE.md. Classify the app's state and the ask's intent with `references/triage.md`. Done when the state file names both, each with the signal that decided it.
2. **Route.** Take the route from the table below. Copy its steps into the state file, split the budget across them, and write the standing orders from `references/delegation.md`. Done when every step has a budget slice and a write scope.
3. **Frame.** Send one message: the three or four numbers that decided the state, the route, the budget, and at most one question with the default you apply if nobody answers. Start the read-only steps without waiting. Done when the question and its default are in the state file.
4. **Run the steps.** Brief each one from `references/delegation.md`. Only one step that writes to the repo runs at a time. Read-only steps may run side by side. When a step returns, save its final message under `returns/`, check its claim on the files it names, and write the verdict. Done per step when its row has a verdict and an evidence path.
5. **Clear the migration.** `migrate-design-system` edits code only after its audit `plan.md` exists and a person has confirmed three things in one reply: moving the app is wanted, the migration budget, and the defaults on any open build gate that changes a token value or a component API. Pass the budget into its frame. Without that reply, the route ends at the plan. Done when the state file holds the reply, or the route is marked ended at the plan.
6. **Close.** Rerun `scripts/triage.sh` into `triage/after/`, save `git status` again, and write the report into the state file. Done when all five parts are filled from files and the report is your final message.

At about 70% of the budget, start nothing new. Let running steps finish, record them, and close.

## Routing table

The state comes from triage: `none` (no token source), `drifting` (a source exists and the code ignores much of it), `settled` (tokens and canonical components that the code follows), `documented` (settled, with docs in the Geist structure). `references/routes.md` has each route's exact steps and what passes between them.

| State | The ask leans to | Route |
|---|---|---|
| none | build, set up, break down screens | Build: `build-design-system`, then `migrate-design-system` audit |
| none or drifting | fix it, clean it all up | Full: build, migrate audit, clearance, migrate, `design-review` on the final build |
| drifting | clean up values, stop hardcoding | Values: `token-mapping` against the existing tokens. Gaps over the threshold lead to build, otherwise to migrate audit |
| settled | move, roll out, adopt | Adopt: migrate audit, clearance, migrate, `design-review` on the final build |
| settled | docs | Document: `build-design-system` started from the existing tokens and components |
| any | one named component | Component: `component-docs` |
| any | ship, handoff, is this ready | Review: `design-review` per flow, plus `token-mapping` on the same files when tokens exist |
| any | how bad is it, audit | Audit: `token-mapping` when tokens exist, then migrate audit. Nothing outside the run folders changes |

When the ask and the state disagree, the state wins and the Frame says so. "Migrate us" with state `none` routes to Build, because there is nothing to migrate onto yet.

## Boundaries

May decide:

- The route, whenever the table gives one.
- The budget split, which read-only steps run side by side, and one retry of a failed step.
- Defaults for any sibling input the ask left out.
- Skipping a step whose output already exists and is current, with that record's path.

Stop and ask:

- No repo, or read-only access on a route that writes.
- Uncommitted changes in a path a writing step would touch. Leave them where they are.
- Clearing the migration, per step 5.
- A sibling returns `stopped` and the next step needs its output.

Never:

- Write product code while subagents exist. Code comes from the siblings' workers, and `references/delegation.md` covers hosts without subagents.
- Deploy, publish, merge to main or force-push.
- Discard work this run did not create. Other branches, uncommitted changes and files outside a step's scope stay as found, so no stash, reset, clean or checkout over them.
- Invent brand. New colors, fonts, logos, product names or a new visual direction are gates, even when the ask says "make it modern".
- Loosen a sibling's predicate, edit a baseline or check to pass, or edit a sibling skill's files.

## Final checks

- Every number in the report traces to `triage/`, `returns/` or a sibling record.
- Writing steps never overlapped. Each ran inside its scope.
- Migration edits started only with step 5's reply saved.
- The before and after `git status` differ only inside the scopes the steps were given.
- Next names one step, the skill that runs it, and its budget.
