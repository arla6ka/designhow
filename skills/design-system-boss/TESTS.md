# Tests: design system boss

Setup, how to phrase the ask and the baseline table are in `../TESTING.md`. Compare each case with the boss off and the five siblings installed. Most cases stop after triage, the Frame or the first step.

The cases assume these practice repos, kept in git and shaped to your stack:

- **Bare** has about 15 routes, no token file, a few hundred raw colors and three button implementations.
- **Drifting** has a DTCG token source, adoption under half, two input families and a `src/ui` layer with thin states.
- **Settled** has tokens, a shared component folder, a registry and high adoption, with no docs pages.
- **Fresh shadcn** is a new shadcn project with every stock component added, one route and nothing else.
- **Weak shadcn** is Fresh shadcn with a dozen routes, a legacy `Modal` and `PrimaryButton` in `components/custom`, palette classes and raw hex values in product code, and no specs.
- **Library** uses a package component library with a theme object, about 10 routes and two `Button` wrappers.
- **Upstream** is an open-source app the person does not own.
- **Small router app** has a client-side router config with 5 routes, 9 files in `src/pages`, a shared `src/components` folder, raw colors in the pages, and under 3,000 lines of UI code.

## Which cases apply

Every case applies to every setup, except Host shapes (the host each part names), Live workers (hosts with background or nested agents) and PR footprint (repos the person does not own).

## Done means

- `triage/signals.tsv` and `triage/after/signals.tsv` exist and came from the script.
- The state file names a state, an intent, the deciding signals, a route and a budget.
- Every step has a verdict with an evidence path that opens.
- At most one routing question went out before the first step, beside the standing questions, each with its default applied.
- The report's numbers are rows in `close.md` and match the files they cite.
- `git status` changed only inside the scopes the steps were given.
- A person is left merging, reversing gates, accepting the migration offer, and deploying.

## Baseline

Run with the boss switched off and the five siblings installed, on Bare, with this prompt:

```
Our UI is a mess. Launch subagents to break down all the screens and fix it.
```

Then run Fix-it ask, Vague build ask and Pre-ship review both ways and compare.

Watch for a skill picked from the prompt's wording without looking at the repo, several questions before any work, a migration with no budget, two skills writing the same files at once, a coordinator editing components itself, a new palette, a success claim without a count, and no record a second session could resume from.

## Vague build ask

**Input:** Bare, and "Launch subagents to break down all screens in the app, we need to build a design system."

**Expect:** triage runs first, the state is `none` and the intent build. The Frame gives the numbers, the Build route, the budget, and at most one question with a default. `build-design-system` runs as one step, its per-screen inventory fanned out to read-only workers, and `migrate-design-system` runs in audit mode only. Next is a merge plus the offer, sized in surfaces and families.

**Fails if:** the boss asks for paths, the migration edits anything, or the report states a number no file holds.

## Fix-it ask

**Input:** Drifting, and "Our UI is a mess, fix it." with a budget of 8 hours. Then the same repo with "clean the app up". Then "move every screen onto one system", with the same budget.

**Expect:** state `drifting`, route Full for all three. The first two name no migration, so each ends check-first: tokens, one component per family, the pilot on the system, decided defaults, docs, the ratcheting CI check and the AGENTS.md index. Their reports end with the ranked found-not-fixed table, and Next offers the migration with the surfaces left and their families. The third is clearance, so the state file names the ask as source and 8 hours as budget, and `migrate-design-system` moves the other screens, then `ui-review` reads the final captures.

**Fails if:** "fix it" or "clean the app up" edits a screen beyond the pilot and the safe moves, the offer has no size, the third run ends at the plan, migration edits start before `plan.md` exists, or the build and the migration write at the same time.

## Messy values

**Input:** Drifting, and "we have hardcoded colors everywhere", once with a token set that covers most values and once with one so thin that `token-mapping` reports gaps over its threshold. Then Weak shadcn with "we're on shadcn but everything drifted, people hardcode colors everywhere, clean it up and make it consistent".

**Expect:** `token-mapping` runs first. The covering set goes on to migrate audit and the thin set to the build, each passing the report by path in a decision row. On Weak shadcn the route is Values, then Harden (`harden_dirs` names `components/ui` and there are no specs). "Make it consistent" names no migration, so the run ends check-first with the offer. The first writing step's GOAL is the identical-value swaps, and the Frame names their count.

**Fails if:** the next skill is chosen before the mapping report exists, the report is summarized into the brief, the weak app gets Build and a second component layer, or the run ends with hardcoded colors on screen and no count.

## One component

**Input:** Settled, and "document the Select."

**Expect:** route Component. Only `component-docs` runs, with no triage question. The entry lands in the repo's entry folder or in `returns/component-docs.entry.md`, with its path in the state file.

**Fails if:** any other sibling runs, or the entry lands somewhere the state file does not name.

## Pre-ship review

**Input:** Settled, and "check the invite flow before I ship." Then a repo with no branch diff, and "check it before I ship, and tell me if our colors are consistent."

**Expect:** route Review, with `ui-review` on the flow and `token-mapping` on its files side by side. With no flow named, `ui-review` runs on the top routes, stated as the default, and `token-mapping` answers by role, with `palette_pct` apart from `adoption_pct`. `git status` matches before outside `.design-system/boss/`, and the check line reads "n/a (read-only route)".

**Fails if:** anything in the repo changes, review findings are "fixed", the boss hands back with steps running, or palette classes count as raw in one skill and as token use in the other.

## Audit only

**Input:** Drifting, and "how bad is it? don't change anything."

**Expect:** route Audit. `token-mapping`, then migrate audit. Nothing changes outside `.design-system/boss/` and `.migration/`. Next names the route that would fix it and its budget.

**Fails if:** a lint rule, token file or component appears.

## Migration clearance

**Input:** Settled, and "migrate everything to our design system", with no budget. Then "half the screens ignore our components" and "nobody follows it". Then "our components have no rules, make them solid".

**Expect:** "migrate everything" is clearance within the session budget. The audit runs, then `migrate-design-system` edits on the run branch, one surface per commit with captures, and the Question line reads none. The complaints route Adopt but name no migration, so they land the decided defaults, end at the plan, and Next is a merge plus the sized offer. The last ask routes Harden and ends check-first the same way.

**Fails if:** "migrate everything" ends at the plan, a complaint or the harden ask edits a surface beyond identical swaps and decided defaults, or a budget beyond the session is invented.

## Ask against state

**Input:** Bare with "migrate the app onto our design system". Weak shadcn with "migrate every screen onto our components" and with "make it look like one thing". Drifting with "our screens are missing loading and error states". Weak shadcn with "set up a proper design system so the team stops drifting", then again with `harden_dirs` none. Bare with "every page looks like a different product". A shipped app with 2 routes and 6 components, with "we need a design system".

**Expect:** Bare migrate goes to Build, and the one question offers to stop at the audit. A weak system hardens first, then Full from clearance, with the Frame saying why in one line. "Missing states" routes to Harden. The build ask on a drifting layer routes to Harden, and to Build with no `harden_dirs`. The visual ask is intent full, gives no clearance, and ends check-first. The small shipped app routes to Build. Each routing picks one table row.

**Fails if:** the small shipped app gets Seed, migrate runs before a system exists, a weak system is migrated before it is hardened, intent is matched by meaning with no row, the state file cites two rows, or a second component layer appears beside `components/ui`.

## Unrelated work

**Input:** Bare, with an uncommitted edit to the global stylesheet and an unmerged branch `feature/billing`. Then a clean checkout of a teammate's branch, the ask naming no branch.

**Expect:** triage records both. Before the build writes, the boss asks, because the checkout is dirty, with the default applied: the run branch in its own worktree from HEAD. On the teammate's branch it asks the same way. With no answer, the defaults stand as `default (unanswered)` and head the report. Nothing is stashed, reset or cleaned. `feature/billing`, the teammate's branch and the dirty file are untouched at close.

**Fails if:** the edit is lost, stashed or committed by the run, a branch the run did not create moves, or the run waits for the answer.

## Brand trap

**Input:** Drifting, and "our UI is a mess, make it look modern." Then Drifting with a brand kit whose colors and type the app does not use, and "rebuild the UI on our brand kit".

**Expect:** the route is Full. With no design source, the standing orders forbid new colors, fonts and motion in every brief, and "modern" becomes a gate with the default "keep the current look". With the brand kit, the host's question tool asks in place or a new folder and how closely to follow the kit, and the run follows the answer. The pilot, baselines, pixel diffs, the check and the docs generator run against the layer being built. A new folder's handoff lists its adoption blockers.

**Fails if:** without a design source, any value appears that triage did not find in the repo, or with one, the new look lands before the person answered.

## Mid-run ask

**Input:** during a Full run's build step, "review the settings page", then "also add a dark theme".

**Expect:** the review runs against the starting branch and writes nothing to docs/system. The dark theme queues after the run or becomes a gate.

**Fails if:** either ask writes to the run branch while the build writes.

## Resume

**Input:** stop the boss during the Full route's migrate audit. Start a fresh agent with the skill and the repo only.

**Expect:** it reads `state.md`, finds the audit in progress, opens `.migration/<run>/`, and resumes by the sibling's own rules. The build is not rerun.

**Fails if:** triage reruns as a new decision, the build runs again, or anything from the old conversation is needed.

## Host shapes

**Input:** Bare and "every page looks like a different product. make it look like one thing", on four hosts: flat (agents cannot start agents), no subagents, no shell for the coordinator, and a nested repo the host cannot give worktrees for.

**Expect:**

- Flat. One decision row per seat, and the boss follows "Flat host: the build and migrate seats", opening only its Open column. The one worker the boss names writes the token source and the first family, and `git log` shows no product-code commit by the boss.
- No subagents. The same route in sequence, with `state.md` updated before and after each step.
- No shell. Workers run triage, `git status`, the dev server, checks and pixdiffs, and return full output with exit codes.
- No worktrees. A decision row picks sequence or disjoint file lists, and each return's `git status --porcelain` stays inside its list.

**Fails if:** the boss writes product code on a host that can spawn, a seat has no decision row, the route changes because the host is smaller, a check claim has no exit code, or two writers share a path.

## Missing sibling

**Input:** Drifting with `token-mapping` removed, and "we have hardcoded colors everywhere."

**Expect:** the Values route stops at step 1, and the report names the missing skill and its install command. Triage output is still delivered.

**Fails if:** the boss does the mapping itself, or picks another route to avoid the gap without a decision row.

## Triage tool failure

**Input:** Bare, with `rg` not on the path.

**Expect:** the script exits with its message. The boss runs the `grep` fallbacks from `references/triage.md`, saves them in `triage/`, and records the fallback.

**Fails if:** the state is chosen without saved counts.

## Stock shadcn is not drift

**Input:** Fresh shadcn, and "we need a design system."

**Expect:** `foundation` is `shadcn`, `families_with_2plus` is 0, adoption counts `tw_semantic`, and raw values inside `components/ui` land in `ui_raw_lines`. The state is `empty`, and the route is Seed.

**Fails if:** Dialog, AlertDialog, Sheet and Drawer count as four dialogs, or the route is Build.

## Triage signals

**Input:** `triage.sh` on each practice repo with uncommitted skill folders added and output outside the repo. Then on a repo after a finished run. Then on Weak shadcn with one route moved off `components/custom/Button`.

**Expect:** `shared_ui_dirs` finds the layer by name, barrel and imports, never a folder inside the route tree. Adoption leaves out the layer and the token source. `git_uncommitted` ignores skill folders. The run's own scaffolding adds nothing to any count, and `scaffold_files_skipped` says how much was left out. `stray_dirs` names `components/custom`, whose raw lines count as product code before and after the move. `raw_family_copies` counts native elements that copy a component's classes, never the component's own file. Private route folders are not routes. A raw color inside an arbitrary value counts. Two runs give the same signals, and the repo stays clean.

**Fails if:** the system's own `var()` uses count as adoption, a stray counts as the layer, an after-number rises from the run's own output, or a product file is dropped.

## Triage bugs

**Input:** `triage.sh --self-test`. Then by hand: a component file declared `export default async function`; a repo after a finished run, with specs in `docs/system`; Small router app; Weak shadcn after a run that turned `PrimaryButton` into a wrapper that renders `Button`.

**Expect:** the self-test ends `all as expected`. The async component is in `components.tsv`. `component_specs` counts the run's specs, so the re-triage no longer reads the layer as weak. On Small router app, `routes` is 5 from the router config, `shared_ui_dirs` is `src/components` and never `src`, and `raw_color_lines` counts the pages' colors. After the merge, the Button family counts 1 and `wrappers.tsv` names `PrimaryButton`.

**Fails if:** the self-test fails, a `pages/` folder outside a file-based router counts as routes, the source root is the layer, or `families_with_2plus` rises after a run that merged a family.

## Small app

**Input:** Small router app, and "our UI is a mess, fix it."

**Expect:** triage reads `small_app yes`. A decision row records the fast path. Each writing step runs as one agent with no fan-out, the migrate audit runs after the build, and the two-agent tests, review lenses and parity pass read `skipped (small app)`. The route, captures, check, gates and close are the same as on a large app.

**Fails if:** the boss fans out workers, reads references for steps the route does not run, or drops the captures or the check.

## Unattended run

**Input:** Drifting, a monorepo with two apps, a brand kit, and "we need a design system, follow our brand kit", run headless with nobody answering.

**Expect:** the Frame asks the target, bans and design-source questions with defaults applied (the app with the most routes, none, reference only). Nobody answers, so each reads `default (unanswered)` in the Gates table, and so does every sibling gate. The run never pauses. The report lists every unanswered default first, before any answered gate, each with the reply that overturns it.

**Fails if:** the run waits or stops on a question with a default, a default is recorded as the person's answer, or the report buries an unanswered default.

## Route order

**Input:** Drifting, "fix it", where the build gates a color merge with the default "merge" and the migrate audit's reconciliation adds one more decided default.

**Expect:** the build lands its decided defaults in its safe-moves phase, before its docs phase writes any spec. Build step 3 lands the late default, then regenerates docs and reruns `check-spec.mjs` with freshness on. The check in step 4 passes on the final commit.

**Fails if:** a spec commit comes before a decided default it describes, or `check-spec.mjs` reports a stale cite at close.

## Seed and library

**Input:** an empty repo with a README naming a brand color, run once through the boss with "set up a design system" and once calling `build-design-system` directly. Then Library and "our UI is a mess, fix it."

**Expect:** both empty-repo runs do the build's seed mode with the same inputs, `foundation` reads `none (default: shadcn)`, and the brand color is a gate. On Library, `foundation` is `library:<package>`, the one question asks whether the team keeps the library with "keep it and wrap it" as the default, and the theme is the token source.

**Fails if:** the two entries produce different steps, a palette is invented, a DTCG source appears beside the library theme, or product code imports a new library.

## Live workers

**Input:** any writing route. Force a handback while two build workers run. Then a nested host where a migrate step agent hands back before its workers return.

**Expect:** before handing back, `state.md` has a Running workers section with each worker's brief, scope and task. On a normal close the boss waits and the section is absent. The shared dev server stays up until the last worker returns. A worker in the shared checkout that finds it down returns `blocked: server down`, and one in its own worktree starts its own server on port base+n. A step with live workers is not `done` until each returns or its brief reruns. When the person changes a decision mid-run, the boss sends each affected worker an amendment with the person's words pasted.

**Fails if:** the boss asks a worker how it is going, hands back with no Running workers rows, stops the dev server while a worker is live, a worker starts a second dev server in the same checkout, or a step is verified while a worker is live.

## Run branch

**Input:** Bare, "our UI is a mess, fix it", pre-cleared with "Go, 3h", with migrate workers in flight up to the machine budget. Then Weak shadcn with "set up a proper design system so the team stops drifting" and no clearance.

**Expect:** the run creates `ds/<yyyy-mm-dd>-full` from HEAD before its first write and records the starting branch. Identical-value swaps land on every route with a 0% pixdiff saved. Decided defaults land on every screen they reach before the build writes its docs, one surface per commit with captures and a montage row, and each gate reads `default (unanswered)` or `done` with its commit. Before clearance one writing step runs at a time, and after it parallel writers share no path. Only the coordinator shrinks the allowlist, in its own commit. Without clearance, nothing else moves.

**Fails if:** the starting branch gains a commit, a visible change has no gate or decision, a surface lacks captures, a worker commit touches an allowlist, Next asks for anything but a merge, or the run merges.

## Named branch

**Input:** Bare, with the first message "work only on my branch design-pass, local commits only, I'll open the PR later", and the branch checked out. Then "work on my current branch" in the person's saved memory instead of the message.

**Expect:** a decision row reads "run branch: design-pass, the person's own". Every commit lands on `design-pass`, no `ds/` branch exists at close, and nothing is pushed. The report says nothing was pushed, and Next is a merge or a review of the branch, never a push.

**Fails if:** another branch is cut, a push or PR happens, or a brief tells a worker to push.

## Standing questions

**Input:** Drifting, a brand kit folder, and "we need a design system, follow our brand kit, and ask me questions first."

**Expect:** the Frame carries the bans question with the common bans offered and none selected, the design source question with "reference only" applied, and a batch of up to six multiple-choice questions, each with its recommended option first and applied. Read-only steps start without waiting. Two bans the person states later become standing orders word for word and `bans` entries in the check config.

**Fails if:** the run waits on an answer, fidelity to the brand kit is assumed, or a ban lives only in chat.

## Machine budget

**Input:** any fan-out route on a machine short of memory, then a host crash mid-fan-out and a resume.

**Expect:** the window follows `build-design-system/references/coordinator-path.md` (Machine budget) as a decision row, and the resume reads the machine again before anything starts.

**Fails if:** the window is one fixed number or exceeds that budget.

## Returns as status and files

**Input:** any writing route with a step whose report runs past 50 lines. Count the files the coordinator opens before its first brief.

**Expect:** `returns/<step>.md` holds the status line and file list only. The full report sits in the sibling's record, or where the boss saved text-only output. No brief's RETURN path points into `.design-system/boss/`. The coordinator opens `references/coordinator-path.md` first, then only the file and section each step names.

**Fails if:** a whole report is pasted into `returns/`, a verdict rests on a status line with no file checked, a worker writes inside `.design-system/boss/`, or the coordinator reads every reference and sibling skill before briefing.

## Repo works after the run

**Input:** any writing route, run to the end. Clone HEAD into a temp folder with no `.design-system/` and no skill folders, install, run the repo's typecheck prerequisites, and run the check.

**Expect:** the check, check-spec and docs generator run from `scripts/` and exit 0. Twins, `llms.txt`, the index and the AGENTS.md block exist even on a short budget. `.gitignore` adds only `.design-system/review/**/*.png` and `.design-system/tmp/`. Scratch lands in `tmp/` and close deletes it. `triage/git-after.txt` shows no untracked path that is neither committed nor named in a decision row.

**Fails if:** a check path points into `.design-system/` or a skill folder, generated docs were cut, a PNG is committed, or an untracked path goes unexplained.

## PR footprint

**Input:** Upstream, and an ask that names two component families and an upstream PR. The branch sits on a commit upstream does not have.

**Expect:** the route is `Named families, minimal footprint`, with no Harden step. The edit list starts from `triage/raw-families.tsv`, one decision row per family, each file with an importer count. Nothing is vendored, `.gitignore` is untouched, and no audit plan is required. One commit per family. The check line names the repo's own lint, typecheck and build. `.design-system/pr.md` exists, untracked, and Next starts with the rebase onto the upstream tip.

**Fails if:** a spec or check script lands in the diff, a family the ask did not name changes, a hunk sits in an export nothing imports, `pr.md` is missing or committed, or Next opens the PR from the branch as it is.

## Phase caps

**Input:** Bare with no budget given, and "our UI is a mess, fix it", on a 2-hour session where the build runs to its cap.

**Expect:** the Budget section takes the host's session, else 2 hours, and gives each phase its cap from `routes.md` as a clock time. The migrate audit runs beside the build. Past the writing cutoff no new writing step starts, except decided defaults, whose share is reserved up front. Close keeps its share.

**Fails if:** the build runs to the end and `plan.md` never exists, decided defaults are cut for the cutoff or taken from close, or a step is sized from a formula.

## Final message

**Input:** the Fix-it ask run to the end, once with a person reading and once as a scheduled run with nobody answering. The run applies 10 gates, 3 of them color moves, and leaves some raw values.

**Expect:** the final message is the Report section verbatim. Its first line answers the ask, then which screens changed and which did not, and why. Then each check with its exit code, the gates, and one Next prompt that clears every gate at once, such as `Merge ds/<date>-full, but keep the blue Sign in button (reverse G-04).`, followed by the sized migration offer. With a person reading, the gates are up to 3 applied ones chosen from the named complaint (here the color moves). With nobody answering, every `default (unanswered)` row comes first, the Frame goes into What changed, and the run never waited. It ends with one Found, not fixed table, ranked by severity, at most 30 rows, the rest in `.design-system/found-not-fixed.tsv`. Every count is a row in `close.md` with its unit.

**Fails if:** the message names a route or an unused skill, narrates the process, points at `state.md` for Next, asks for a step the run could do, says "every screen" while Still raw lists a file, links a PNG or anything in `tmp/`, gives a gate slot to an unrelated gate, hides an unanswered default behind an answered one, keeps a second follow-up list outside the table, or the check is red.
