---
name: design-system-boss
description: Use for vague whole-app design system asks on an app that already ships UI, like "our UI is a mess, fix it", "we need a design system", "we hardcode colors everywhere", "make the buttons consistent for an upstream PR", "document our whole design system" or "check the app before I ship". Triages the app, then runs the design.how skills in order. One named screen goes to design-review, one component to component-docs, an empty repo to build-design-system.
---

# Design system boss

The boss triages the app, picks a route, runs each step through subagents where it can, keeps one state file, and hands back one report. The five siblings do the work: `build-design-system`, `migrate-design-system`, `token-mapping`, `design-review` and `component-docs`, each called through its "When a coordinator calls it" section.

Read `references/coordinator-path.md` first. It lists each step and the file to open.

Sibling paths start at `<skills>`. Terms such as surface, gate and clearance mean what `build-design-system/references/run-record.md` (Terms) says, and its standing orders bind the boss too.

## Output

Done means the route's last step has returned, every step has a verdict in `.design-system/boss/state.md`, and the report is written from files. Checkable:

- `triage/signals.tsv` and `triage/after/signals.tsv` came from `scripts/triage.sh`, and the route is the routing table's, or a decision row says why it differs.
- Every step has a verdict naming the file that proves it. Every number in the report is a row in `close.md` with its unit and source.
- Every gate from every sibling record is in the state file's Gates table (`references/state.md`, The state file).
- On a writing route, the check exits 0 on a clean clone of the run branch, or the repo's own lint, typecheck and build do on a minimal footprint. Every changed surface has captures and a montage row, every identical-value swap has its proof, and every pilot trap is fixed with numbers or gated with its measurement. `git status` before and after is saved, `.design-system/tmp/` is gone, and every untracked path is committed or named in a decision row.

Your final chat message is the state file's Report section, verbatim (`references/state.md`, The handoff report).

If it stops, return the condition, what finished, the state file path, and the smallest reply that unblocks it, such as "Say which app: apps/web or apps/admin."

## Inputs

| Input | If missing |
|---|---|
| The ask | Required. "Our UI is a mess" is enough |
| The repo | Stop without one. Read-only access allows only Audit and Review |
| Target app, in a monorepo | The one question. Triage every app meanwhile |
| Intent | From the ask's words, per `references/triage.md` |
| Budget | The Frame's `Go, <budget>` reply, else the host's session, else 2 hours, split per `references/routes.md` (Budget) |
| The sibling skills | In `<skills>`. A missing one stops only its steps, and the report names it |
| Subagents, a browser, a shell | Probe per `references/delegation.md` |
| AGENTS.md or CLAUDE.md, the person's words, saved memory | They win over every skill default, branch and push policy included. "Work on my current branch" makes it the run branch. Pass them into every brief |

## Procedure

Follow `references/coordinator-path.md`. Copy the route's steps from `references/routes.md` word for word. A dropped step stays listed as `skip: <reason>`.

1. **Triage and frame.** Steps 1 to 10. Done when the state file names the state, intent, route, run branch, budget and host, and the Frame is sent or in the report.
2. **Run the steps.** Brief each from `references/delegation.md`. Before clearance, one writing step runs at a time. After it, migrate's rolling window runs inside the machine budget on disjoint paths. Done when every step has a verdict with an evidence path.
3. **Clear the migration.** A reply to the Frame counts, and a fallback intent never does. With clearance, migrate edits only after its audit `plan.md` is re-pinned and reconciled with the build's `registry.json`. Done when the state file names the clearance source and budget, or the plan as the end.
4. **Close.** Steps 15 and 16. Done when Checkable holds and the report is sent.
5. **An ask mid-run.** Handle it per `references/routes.md` (the rules at the top).

## Routing table

State, **weak** and intent come from `references/triage.md`. `references/routes.md` has each route's steps.

| State | Intent | Route |
|---|---|---|
| empty | any | Seed |
| none, or drifting and not weak | build | Build |
| drifting, weak | build | Harden, stated in the Frame |
| any, with a PR or upstream in the ask | named families | Named families, minimal footprint. Wins over every row below |
| drifting or settled, weak | full, harden, adopt | Harden, then Full from step 5. A values intent runs Values first. Wins over later rows |
| none, drifting or settled, not weak | harden | Harden. With no `harden_dirs`, Build |
| none or drifting, not weak | full | Full |
| settled or documented, not weak | full, adopt | Adopt |
| drifting, not weak | values | Values |
| settled | docs | Document |
| any | component | Component |
| any | review | Review |
| any | audit | Audit |

When the ask mentions a PR or upstream, or the repo looks like someone else's, the route runs as `<route>, minimal footprint` (Footprint in run-record Terms). When the ask and the state disagree, the state wins and the Frame says so. "Migrate us" on state `none` is Build.

## Boundaries

May decide:

- The route, run branch, phase split, which read-only steps run side by side, and one retry of a failed step.
- Defaults for any sibling input the ask left out.
- Skipping a step whose output is current, citing its record.

Stop and ask:

- No repo, or read-only access on a route that writes.
- A dirty checkout or someone else's branch on a writing route. Never stash.
- A sibling returns its stop shape and the next step needs its output.

Never:

- Write product code when it can spawn subagents (`references/delegation.md`, Who writes product code).
- Set a new visual direction the person did not choose through the design-source question (`references/triage.md`, Standing questions). "Make it modern" with no design source becomes a gate with the default "keep the current look".
- Loosen a sibling's predicate or edit a sibling skill.
