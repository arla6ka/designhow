---
name: design-system-boss
description: Use for vague whole-app design system asks on an app that already ships UI, like "our UI is a mess, fix it", "we need a design system", "every page looks like a different product", "half the screens ignore our components" or "we hardcode colors everywhere, clean it up", for "make the buttons consistent for an upstream PR", for "write docs for our whole design system", and for broad review, audit or ship asks, like "check the app before I ship", "are we using colors consistently across the app" or "how far are we from our design system". Triages the app, then runs the design.how skills in order. One named screen or flow goes to design-review, one component's docs to component-docs, and an empty repo to build-design-system.
---

# Design system boss

The entry point for design system work. This skill triages the app, picks a route through the five design.how skills, runs each step through subagents where the host has them, keeps one state file, and hands back one report. It owns the route, the budget, the run branch and the record. The five sibling skills own the work: `build-design-system`, `migrate-design-system`, `token-mapping`, `design-review` and `component-docs`. Call each through its "When a coordinator calls it" section.

Read `references/coordinator-path.md` first. It lists the steps in order and the one file to open at each. Open other files only when it says so.

## Output

Done means the route's last step has returned, every step has a verdict in `.design-system/boss/state.md`, and the handoff report is written from files.

Success is what the person asked for, in their words. The first visible change answers that complaint, before any docs or infrastructure. Every claim that something is fixed, passes or works names the command that proved it and its result from this session. A trap marked fixed carries measured before and after numbers.

**The branch model.** Every writing run works on its own branch, `ds/<yyyy-mm-dd>-<route>`, created at the start from the current HEAD. It never commits to the branch it started on. Apply every decided gate default on the run branch. That includes codemods on non-pilot screens and color moves, each captured before and after, so Next is a plain merge. Migration beyond decided defaults still needs clearance. Captures go to `.design-system/review/<surface>-{before,after}-{390,1280}.png`, gitignored, beside a tracked montage index and `traces.tsv`. Merging is always the person's call.

Checkable:

- `triage/signals.tsv` came from `scripts/triage.sh` at the start, and `triage/after/signals.tsv` from the same script at the end. Both count product code only.
- The route in the state file is the one the routing table gives, or a decision row says why it differs.
- Every step has a verdict row per `references/state.md`, naming the file that proves it, checked on that file.
- Every gate from every sibling record is in the state file's Gates table, with its default, its source path, and the run-branch commit that applied it.
- On a writing route, the starting branch has no new commits, and every changed surface has its four captures and a montage row. The check exits 0 on a clean clone of the run branch, with `next typegen` first on Next 16. Existing violations go in a committed allowlist. On a minimal footprint the repo's own lint, typecheck and build are the check, and nothing is vendored. A red check is a failed run.
- No worker is still running when the boss hands back.
- `git status` before and after is saved, and no path changed outside the scopes the steps were given. `.design-system/tmp/` is gone, and every untracked path is committed or named in a decision row.

Needs a person: merging the run branch, reversing any gate, and anything version control cannot undo.

Your final chat message is the report, about 200 words at most: the four parts of the state file's Report section, verbatim, in order. Every count, left or allowlisted, comes from `.design-system/close.md`. It links no gitignored file.

1. What changed. One plain sentence that answers the ask. Then which screens changed and which didn't, and why, with numbers and units. Name what is still raw and where, never "every screen".
2. Checks: each command and its exit code from this session, or `n/a (read-only route)`.
3. At most 3 gates the run branch applied that change what a screen shows or does, each with its default. Count the rest, with the Gates table's path.
4. Next: one plain-language prompt the person can paste. It clears every gate at once, usually as a merge with named reversals. When surfaces wait on clearance, add one sentence after the merge: `To move the other N screens too, reply "Go, <budget>".` It never asks the person for a step the run could do, like re-pinning a plan.

`references/state.md`, The handoff report, has the format, an example and what the report leaves out.

If it stops, return the condition, what finished with paths, the state file path, and the smallest reply that unblocks it, such as "Say which app: apps/web or apps/admin."

## Inputs

| Input | If missing |
|---|---|
| The ask, however vague | Required. "Our UI is a mess" is enough to start |
| The repo | Stop without one. With read-only access, run only the Audit and Review routes |
| Target app, in a monorepo | The one question. Triage every app while waiting |
| Intent | Read it from the ask's words with `references/triage.md`. A complaint the person named beats a generic verb. If two routes fit and differ by a whole phase, that is the one question, and its default is the route that answers the named complaint |
| Budget | Ask in the Frame. With no answer, the host's session, else 2 hours, split by the phase caps in `references/routes.md` |
| The five sibling skills | Look beside this folder, then in `.agents/skills/` and `.claude/skills/`. A missing one stops only the steps that need it, and the report names it |
| Subagents, nested subagents, a browser, a shell | Probe them per `references/delegation.md`. Without subagents, run every step in sequence |
| AGENTS.md or CLAUDE.md | Their rules win over this file. Pass them into every brief |

## Procedure

Follow `references/coordinator-path.md`. Copy the route's steps from `references/routes.md` into a task list word for word. A step you drop stays on the list as `skip: <reason>`. Two rules apply at every step.

- **Run the steps.** Brief each one from `references/delegation.md`. Before migration clearance, only one step that writes to the repo runs at a time. After clearance, `migrate-design-system`'s rolling window governs: parallel workers on disjoint surfaces and paths, each verified. When a step returns, save its status line and file list to `returns/<step>.md`, per "Saving a return" in `references/delegation.md`. Check its claim on the files it names, and write the verdict. Done per step when its row has a verdict and an evidence path.
- **Clear the migration.** Decided gate defaults land on the run branch without it. Clearance is the budget to migrate more surfaces there. Adoption asks, listed in `references/triage.md`, count as clearance within the session budget, and so does a reply to the Frame. Token swaps of exactly the same value, each route at 0% by `pixdiff.mjs`, need no clearance. With clearance, `migrate-design-system` edits after its audit `plan.md` exists, re-pinned and reconciled with the build's `registry.json` before the first edit brief. Without clearance, the route ends after the decided defaults, at the plan. Done when the state file names the clearance source and budget, or marks the route ended at the plan.

## Routing table

The states, **weak** and the ask's intent come from `references/triage.md`. Rows match that intent, not raw words. `references/routes.md` has each route's exact steps.

| State | The ask leans to | Route |
|---|---|---|
| empty | anything | Seed: `build-design-system` in seed mode, the same run as calling that skill directly |
| none | build, set up, break down screens | Build: `build-design-system`, then `migrate-design-system` audit |
| drifting | build, set up | Harden, stated explicitly in the Frame. With no `harden_dirs` there is no layer to harden, so Build |
| any, with a PR or upstream in the ask | named families, like "the buttons and headings" | Named families: adopt those families only, minimal footprint, never Harden. Wins over every row below |
| drifting or settled, weak | fix it, make it consistent, make it look like one thing, harden, missing states, move, adopt | Harden, then Full from clearance. A values intent runs Values, then this. Wins over later rows |
| none, drifting or settled, not weak | harden, missing states | Harden. With no `harden_dirs`, Build |
| none or drifting, not weak | looks like different products, make it look like one thing, make it consistent | Full. The ask is visual and cross-page, so it counts as clearance |
| none or drifting, not weak | fix it, clean it all up | Full. "Fix it" on a mess is clearance |
| settled or documented, not weak | fix it, clean it up | Adopt |
| drifting, not weak | clean up values, stop hardcoding | Values: `token-mapping` first, then build or migrate audit by its result |
| settled | move, roll out, adopt, make it look like one thing, make it consistent | Adopt |
| settled | docs | Document |
| any | one named component | Component: `component-docs` |
| any | ship, handoff, is this ready, is it consistent, check | Review: `design-review` per flow, plus `token-mapping` on the same files when tokens exist or the ask is about consistency |
| any | how bad is it, audit | Audit: `token-mapping` when tokens exist, then migrate audit. Only the run folders and `scripts/migration-inventory.mjs` change |

When the ask mentions a PR or upstream, or the repo looks like someone else's, the route runs with a minimal footprint, named `<route>, minimal footprint` in the Frame and state file. `build-design-system/references/coordinator-path.md` (Start) says what minimal leaves out. It needs no migrate audit plan, and it closes with a PR body per `references/routes.md` (Minimal footprint close).

When the ask and the state disagree, the state wins and the Frame says so. "Migrate us" routes to Build on state `none`, and a weak system always hardens first, since a migration copies its gaps onto every screen.

## Boundaries

May decide:

- The route, whenever the table gives one, and the run branch.
- The phase split, which read-only steps run side by side, and one retry of a failed step.
- Defaults for any sibling input the ask left out, applied on the run branch.
- Skipping a step whose output already exists and is current, with that record's path.

Stop and ask:

- No repo, or read-only access on a route that writes.
- Uncommitted changes in a path a writing step would touch. Leave them where they are.
- A sibling returns `stopped` and the next step needs its output.

Never:

- Write product code when it can spawn subagents. On a host without subagents, the boss takes a sibling's seat and follows that sibling's own coordinator rules, recorded as one decision row. A sibling run directly follows its own rule.
- Hand back or end the turn with live workers. If the host forces it, record each one in `state.md`.
- Commit to the starting branch, merge the run branch, deploy, publish or force-push.
- Discard work this run did not create. Other branches, uncommitted changes and files outside a step's scope stay as found, so no stash, reset, clean or checkout over them.
- Invent brand. New colors, fonts, logos, product names or a new visual direction are gates, even when the ask says "make it modern".
- Loosen a sibling's predicate, edit a baseline or check to pass, or edit a sibling skill's files.

## Final checks

- Every number in the report is a row in `close.md`, and each row names its unit and its source file or command.
- Swaps without clearance each have a 0% pixdiff.
- Every trap in the pilot's files is fixed with numbers or gated with its measurement.
