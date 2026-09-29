---
name: design-system-boss
description: Use for vague whole-app design system asks on an app that already ships UI, like "our UI is a mess, fix it", "we need a design system", "every page looks like a different product", "half the screens ignore our components" or "we hardcode colors everywhere, clean it up", for "make the buttons consistent for an upstream PR", for "write docs for our whole design system", and for broad review, audit or ship asks, like "check the app before I ship", "are we using colors consistently across the app" or "how far are we from our design system". Triages the app, then runs the design.how skills in order. One named screen or flow goes to design-review, one component's docs to component-docs, and an empty repo to build-design-system.
---

# Design system boss

The entry point for design system work. The boss triages the app, picks a route, runs each step through subagents where it can, keeps one state file, and hands back one report. The five siblings do the work: `build-design-system`, `migrate-design-system`, `token-mapping`, `design-review` and `component-docs`. Call each through its "When a coordinator calls it" section.

Read `references/coordinator-path.md` first. It lists the steps and the one file to open at each.

Surface, run branch, identical-value swap, decision, gate, clearance and footprint mean what `build-design-system/references/run-record.md` (Terms) says.

## Output

Done means the route's last step has returned, every step has a verdict in `.design-system/boss/state.md`, and the report is written from files. Success is what the person asked for, in their words, and the first visible change answers that complaint. Every claim that something is fixed, passes or works names the command that proved it and its result from this session.

**The branch model.** Every writing run works on a run branch. When the person names a branch for this work, that branch is the run branch and no other is cut. Otherwise the run cuts its own and never commits to the branch it started on. Every decided gate default lands there with before and after captures, codemods on non-pilot screens and color moves included, so Next is a plain merge. Moving surfaces beyond that needs clearance. Commits stay local until the person asks for a push or a PR in this session, and a PR named as the end goal is not that ask. Merging is always the person's call.

Checkable:

- `triage/signals.tsv` and `triage/after/signals.tsv` came from `scripts/triage.sh`, at the start and at the end.
- The route in the state file is the one the routing table gives, or a decision row says why it differs.
- Every step has a verdict naming the file that proves it.
- Every gate from every sibling record is in the state file's Gates table, with its default, source path and the run-branch commit that applied it.
- On a writing route, the starting branch has no new commits unless the person named it, nothing was pushed unasked, and every changed surface has its captures in `.design-system/review/` and a montage row. The check exits 0 on a clean clone of the run branch, after the repo's own prerequisites for its typecheck, with existing violations in a committed allowlist. On a minimal footprint the repo's own lint, typecheck and build are the check. A red check is a failed run.
- No worker is still running when the boss hands back.
- `git status` before and after is saved, and nothing changed outside the steps' scopes. `.design-system/tmp/` is gone, and every untracked path is committed or named in a decision row.

Only a person merges the run branch, reverses a gate, or does anything version control cannot undo.

Your final chat message is the state file's Report section, verbatim, in about 200 words so it fits one screen. Every count comes from `.design-system/close.md`, and it links no gitignored file.

1. What changed. One plain sentence that answers the ask, then which screens changed and which didn't, and why, with units. Name what is still raw and where, never "every screen".
2. Checks: each command and its exit code from this session, or `n/a (read-only route)`.
3. Up to 3 applied gates that change what a screen shows or does, nearest the complaint first, each with its default. Count the rest.
4. Next: one prompt the person can paste that clears every gate at once, usually a merge with named reversals. When surfaces wait on clearance, add `To move the other N screens too, reply "Go, <budget>".` It never asks for a step the run could do.

`references/state.md` (The handoff report) has the format and an example.

If it stops, return the condition, what finished, the state file path, and the smallest reply that unblocks it, such as "Say which app: apps/web or apps/admin."

## Inputs

| Input | If missing |
|---|---|
| The ask | Required. "Our UI is a mess" is enough |
| The repo | Stop without one. Read-only access allows only Audit and Review |
| Target app, in a monorepo | The one question. Triage every app meanwhile |
| Intent | Read it from the ask's words with `references/triage.md`. Two routes that differ by a whole phase make the one question |
| Budget | Ask in the Frame. With no answer, the host's session, else 2 hours, split by the phase caps in `references/routes.md` |
| The sibling skills | Look beside this folder, then in `.agents/skills/` and `.claude/skills/`. A missing one stops only its steps, and the report names it |
| Subagents, nesting, a browser, a shell | Probe per `references/delegation.md`. Without subagents, run steps in sequence |
| AGENTS.md or CLAUDE.md | Their rules win over this file. Pass them into every brief |

## Procedure

Follow `references/coordinator-path.md`. Copy the route's steps from `references/routes.md` word for word. A dropped step stays listed as `skip: <reason>`.

- **Run the steps.** Brief each one from `references/delegation.md`. Before clearance, only one step that writes to the repo runs at a time. After it, `migrate-design-system`'s rolling window governs: parallel workers on disjoint surfaces and paths, each verified. Save each return's status line and file list, check its claim on the files, and write the verdict with an evidence path.
- **Clear the migration.** What counts is in `build-design-system/references/coordinator-path.md` (Clearance) and `references/triage.md` (The ask's intent). A reply to the Frame counts too. With clearance, `migrate-design-system` edits only after its audit `plan.md` exists, re-pinned and reconciled with the build's `registry.json` before the first edit brief. Without it, the route ends after the decided defaults, at the plan. The state file names the clearance source and budget, or the plan as the end.

## Routing table

State, **weak** and intent come from `references/triage.md`. Rows match the intent, not raw words. `references/routes.md` has each route's steps.

| State | The ask leans to | Route |
|---|---|---|
| empty | anything | Seed: `build-design-system` in seed mode |
| none | build, set up, break down screens | Build: `build-design-system`, then `migrate-design-system` audit |
| drifting | build, set up | Harden, stated in the Frame. With no `harden_dirs`, Build |
| any, with a PR or upstream in the ask | named families, like "the buttons and headings" | Named families: those families only, minimal footprint, never Harden. Wins over every row below |
| drifting or settled, weak | fix it, make it consistent, make it look like one thing, harden, missing states, move, adopt | Harden, then Full from clearance. A values intent runs Values first. Wins over later rows |
| none, drifting or settled, not weak | harden, missing states | Harden. With no `harden_dirs`, Build |
| none or drifting, not weak | looks like different products, make it look like one thing, make it consistent | Full. A visual, cross-page ask counts as clearance |
| none or drifting, not weak | fix it, clean it all up | Full. "Fix it" on a mess is clearance |
| settled or documented, not weak | fix it, clean it up | Adopt |
| drifting, not weak | clean up values, stop hardcoding | Values: `token-mapping` first, then build or migrate audit by its result |
| settled | move, roll out, adopt, make it look like one thing, make it consistent | Adopt |
| settled | docs | Document |
| any | one named component | Component: `component-docs` |
| any | ship, handoff, is this ready, is it consistent, check | Review: `design-review` per flow, plus `token-mapping` when tokens exist or the ask is about consistency |
| any | how bad is it, audit | Audit: `token-mapping` when tokens exist, then migrate audit. Product code stays read-only |

When the ask mentions a PR or upstream, or the repo looks like someone else's, the route runs as `<route>, minimal footprint`. `build-design-system/references/coordinator-path.md` (Start) says what that leaves out. It needs no migrate audit plan and closes per `references/routes.md` (Minimal footprint close).

When the ask and the state disagree, the state wins and the Frame says so. "Migrate us" on state `none` is Build. A weak system hardens first, since a migration copies its gaps onto every screen.

## Boundaries

May decide:

- The route the table gives, the run branch, the phase split, which read-only steps run side by side, and one retry of a failed step.
- Defaults for any sibling input the ask left out, applied on the run branch.
- Skipping a step whose output exists and is current, citing its record.

Stop and ask:

- No repo, or read-only access on a route that writes.
- Uncommitted changes in a path a writing step would touch. Leave them as they are.
- A sibling returns `stopped` and the next step needs its output.

Never:

- Write product code when it can spawn subagents. On a host without subagents, the boss takes a sibling's seat and follows that sibling's coordinator rules, recorded as one decision row.
- Hand back with live workers. If the host forces it, record each in `state.md`.
- Commit to a branch the person did not name for the work, push unasked, merge the run branch, deploy, publish or force-push.
- Discard work this run did not create: no stash, reset, clean or checkout over other branches, uncommitted changes or files outside a step's scope.
- Invent brand. New colors, fonts, logos, product names or a new visual direction are gates, even when the ask says "make it modern".
- Loosen a sibling's predicate, edit a baseline or check to pass, or edit a sibling skill.

## Final checks

- Every number in the report is a row in `close.md` with its unit and source.
- Every identical-value swap has a 0% `pixdiff.mjs` result.
- Every trap in the pilot's files is fixed with numbers or gated with its measurement.
