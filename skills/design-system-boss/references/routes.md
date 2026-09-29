# Routes

Each route is a list of steps. Copy the chosen route's steps into the task list and the state file exactly as written here. Each step names the skill, what it receives, and when it counts as done. Every skill is called through its "When a coordinator calls it" section.

These rules hold on every route:

- A step that writes to the repo works on the run branch, `ds/<yyyy-mm-dd>-<route>`, and starts only after the step before it has a verdict. Read-only steps may run side by side. Merging the run branch is the person's call.
- Decided gate defaults land on the run branch (`SKILL.md`, The branch model). A gate is decided when its row has a default, and every gate from a sibling record does.
- The migrate audit is read-only. On Build and Harden it starts right after the build's token commit, side by side with the rest of the build, so the person always wakes up to a plan. A route with a minimal footprint writes no audit plan. The state file's edit list is its plan, and a missing `plan.md` is not a failure there. It pins that commit. At close, the boss reconciles the audit's gates with the build's or harden's gates. If the build changed a token, component API or file the plan names after the pin, the pin is stale: rerun the audit pinned to the final commit, or re-pin it and redo the affected rows, and record which.
- A token swap where the token has exactly the raw literal's value may land on every route without clearance, in build, harden or a swap step the boss briefs. Each route needs a 0% pixel diff from `<skills>/build-design-system/scripts/pixdiff.mjs` (`<skills>` is `.agents/skills/` or `.claude/skills/`), saved per route. Other component swaps outside the pilot need clearance, unless a decided gate default names them.
- The repo works after the run. The check scripts, check-spec, the docs generator and the docs live in the repo (`scripts/`, `docs/`), copied from the skill at setup. `.design-system/` holds only the run record. The check passes on a clean clone. On a minimal footprint nothing is vendored, the repo's own checks are the check, and `.design-system/` goes in `.git/info/exclude`, not `.gitignore`.
- On a writing route, a cheap CSS fix a `design-review` finding names, such as an overflow at 390 or a control height off the scale, lands on the run branch as a decision when existing tokens cover it. It is not a follow-up. It goes to a worker with captures and a trace row, per `build-design-system/references/coordinator-path.md`, "Sibling skills under this coordinator".
- On Full and Harden, horizontal overflow at 390 in shared layout, such as the shell, the nav or a layout every route renders, is a decided default. Its fix lands on the run branch as a decision, with `document.documentElement.scrollWidth` at 390 before and after in its trace row.
- A step's output passes to the next by path. Never paste a summary of it in place of the file.
- Every brief names the foundation from triage and the base reference it loads (`base-shadcn.md`, `base-library.md` or `base-raw.md` in `build-design-system/references/`). The foundation changes where tokens live and how drift is measured. It never changes the steps.

## Three jobs, four foundations

Most asks are one of three jobs. The route follows the job.

| Job | Route |
|---|---|
| A big app with no system. Build one from it, then move every surface | Build, then Full |
| A big app with a weak system. Harden it, then converge the app onto it | Harden, then Full from clearance |
| No app yet. Start from brand bits or defaults | Seed |

The foundation changes what each step reads and writes, and each base reference covers its own case. On shadcn, the canonical pieces are the `components/ui` files and legacy is product markup that bypasses them. On a package library, the system wraps the library and its theme object is the token source. On the team's own package, the package is the target and the app pins a version or commit of it. On raw code, the build picks a canonical implementation per family. For Seed with no foundation, the default is shadcn.

A system built on shadcn ships as a namespaced shadcn registry (`@team/...`). In a monorepo it lives in a workspace `packages/ui` instead. Nothing publishes to npm unless a person asks, and that is a stop.

## Budget

Budget is set by phase caps, not a formula. Take the session from the person, else from the host, else 2 hours, and give each phase its cap as a share of it. Write the caps and their clock times into the state file before the Frame.

| Phase | Cap |
|---|---|
| Triage, route and Frame | 5% |
| Build, harden or seed, with the pilot. On a chained route, Values' `token-mapping` step counts here too | 35%, or 65% on a route with no migration |
| Migrate audit | inside the build's cap, side by side |
| Decided defaults | 15%, reserved up front on every writing route |
| Migration, when cleared | 30% |
| `design-review`, `token-mapping`, `component-docs` | 10%, side by side with other work |
| Close: after-triage, clean-clone check, captures, montage, report | 15%, never cut |

A phase that finishes early passes its time to the next. A phase at its cap starts nothing new and closes what is running. At about 70% of the session no new writing step starts, except the decided-defaults step. It has its own reserved share, it is cheap, and it is the step that makes screens change, so it starts at its turn whatever the clock says. When the session is short, cut the build's scope, never close. Brief the build or harden in this order, and write the planned cut into the Frame:

1. The change that answers the named complaint, including the value-identical swaps on every route.
2. The token source, then the AGENTS.md block right after it. The block is never cut.
3. Specs for the families the pilot touches, and their generated twins, `llms.txt` and index. Generated docs are never cut. The other families become a listed follow-up.
4. The pilot screen. Every trap in the pilot's own files is fixed, or gated with its measurement.
5. An HTML docs site, only as a follow-up.

## Build

For an app with no system, or one where the ask is to make one.

1. `build-design-system`. Receives the target app, the pilot if the ask named one, its phase cap and the order from Budget, and the triage folder as a first read. Done when it returns its handoff report, or its stop shape, and `.design-system/run.md` has a Handoff section.
2. `migrate-design-system`, audit mode, side by side with step 1. Starts once the build's token commit exists, pinned to that commit. Receives the inventory, the triage folder and the families the build is making. Done when `.migration/<run>/plan.md` exists and its gates are reconciled with the build's at close.
3. Check the build. Walk the "Done, page by page" table in `build-design-system/references/system-structure.md` against the repo. The generated twins, `llms.txt`, the index and the AGENTS.md block are required rows. HTML pages are met or listed as follow-up. Clone the run branch into a temp folder, install, run `next typegen` first on Next 16, and see the check exit 0 there. Run `tsc --noEmit` there too: check fixtures use a non-compiled extension such as `.tsx.fixture`, or sit in a folder tsconfig excludes, so an error from a fixture fails this step. Done when each table row is marked met or not met with a path. The handoff's migration map, codemod command and counts by route are added to the clearance message beside `plan.md`.
4. Apply decided defaults. `migrate-design-system`, edit mode, whose budget is the Gates table's decided defaults the build did not land and nothing more: the codemod on non-pilot screens, color moves, renames. One surface per commit, each with before and after captures and a verifier. Done when every decided default reads `applied on <branch>` with its commit, or a gate row says why it could not land.

The route ends here without clearance. With it, including an adoption ask, it continues as Full from clearance.

## Harden

For a weak system, where components exist but states, rules and docs are thin and the app diverges from them.

1. `build-design-system`, harden mode. Receives the foundation, the triage folder, the component layer's path, its phase cap and the order from Budget. Done when `.design-system/run.md` has a Handoff section, and the spec check it names passes on every spec it wrote.
2. `migrate-design-system`, audit mode, side by side with step 1, as Build step 2. The stray-code list harden writes goes into the clearance message beside `plan.md`.
3. Check the system, as Build step 3, and rerun the spec check.
4. Apply decided defaults, as Build step 4. The stray-code moves harden gated with a default land here.

The route ends here without clearance. With it, including an adoption ask, it continues as Full from clearance.

## Seed

For an app with no UI yet. The system starts from whatever brand material exists, or from shadcn defaults. This route is `build-design-system` in seed mode plus the boss's check, so an agent that called that skill directly ran the same thing.

1. `build-design-system`, seed mode. Receives the brand material triage found (logo files, a font, a color in a README or a slide), the foundation (default shadcn on Tailwind v4), and the budget. Done when the handoff lists every brand value as a gate with its default, and the spec check passes on the seed components.
2. Check the system, as Build step 3.

Nothing to migrate. Next is the first screen built on the seed, with `design-review` on it.

## Full

For "fix it" asks. Build or harden, then migrate, then review.

1. to 4. As Build, or as Harden when triage marked the system weak. The audit already ran beside the build.
5. Clearance, per `SKILL.md` (Clear the migration). An adoption or visual-consistency ask, or "fix it" aimed at a mess, is clearance within the session budget (`references/triage.md`, The ask's intent). Otherwise ask in one message that gives the plan's counts and the open gates, as the one reply `Go, <budget>`. Done when the clearance source is saved, or the route is marked ended at the plan.
6. `migrate-design-system`, on the run branch. Receives the existing run folder, the budget from clearance, and scope and pilot from `plan.md`. Surfaces migrate one per commit, verified, each with before and after captures in `.design-system/review/`. Diffs with no explanation stay out and become gates. Done when it returns its final report, or its stop shape.
7. `design-review`. Receives the final integration captures from the migration run folder for the flows the ask named. With none named, it takes the three surfaces with the most rows in `plan.md`. Done when each flow has a report with its status line. With no clearance, this step is `skipped: no migration ran`, since the build reviewed its own pilot.

## Named families for a PR

For an ask that names component families and a PR or upstream, such as "make the buttons and headings consistent, I want to send this upstream as a PR". It always runs with a minimal footprint and never goes through Harden, because Harden's specs and checks are what minimal leaves out. The ask counts as clearance for the named families and nothing else.

1. Edit list, read-only. One worker starts from `triage/raw-families.tsv` and lists every instance of each named family: the shared component if one exists, raw elements that copy its classes, and the variants that drifted from it. It picks the canonical look per family from evidence, the look most routes already render, and gives every file it lists an importer count from a grep of imports. The list goes in the state file, one decision row per family. Done when every instance has a path, a line and an importer count.
2. Edits. One worker per family on disjoint files, briefed from `references/delegation.md` with the edit list as its plan, one commit per family. The smallest seam wins: a missing prop on the component, never a new abstraction, dependency or token. A file with 0 importers stays out and goes in the PR body's follow-ups. Done when each family has its commit and every changed surface has before and after captures.
3. Check. On a clean clone of the run branch, the repo's own lint, typecheck and build, with `next typegen` first on Next 16, and the repo's formatter in check mode on the changed files. Done when each command's exit code is in the state file.
4. The minimal footprint close, below.

## Minimal footprint close

Every route with a minimal footprint ends with these steps, after the clean-clone check and before `close.md`.

1. Drop dead hunks. For each changed file, grep for importers of its path and of each changed export's name, with the repo's path aliases. A hunk in a file or export that nothing imports renders nowhere, unless the framework loads the file by name (`page`, `layout`, `not-found`, `error`, `loading` in Next.js). Revert those hunks in one commit and list them as follow-ups. Done when every changed file in `git diff <base>...HEAD` has an importer or a framework name.
2. Check the base. The upstream tip is `<remote>/<default branch>` when a remote points at the upstream. With no such remote, it is the newest commit on the starting branch whose author is not the local setup, named in a decision row. `git log --oneline <tip>..<base>` must be empty, where `<base>` is the commit the run branch started from. If it lists commits, record them, and Next says to rebase onto the tip first: `git rebase --onto <tip> <base> <run-branch>`.
3. Write the PR body to `.design-system/pr.md`, which stays untracked under `.git/info/exclude`. It holds a title, then what changed per family in one line each, and why: the ask and the evidence for each canonical choice. Then the before and after numbers from `close.md`, with units. Then every deliberate visual change, each with its surface and its before and after capture paths, including any change a reviewer could argue with, such as a quiet control made heavier. Last come the follow-ups: dead files and what the PR left out on purpose. It never names the skills or the run record.
4. Next is `Open the PR from <run-branch> with .design-system/pr.md as the body.` When step 2 found commits, it starts with `First rebase onto <tip>, since <base> carries <N> commits upstream doesn't have.`

## Values

For a token source the code does not follow.

1. `token-mapping`. Receives the raw value lists from `triage/` and the existing token source. Done when it returns a report with a status line.
2. Branch on the system first, then the status. A weak system, shadcn or the team's own, continues with Harden step 1 whatever the status, because a `not actionable (gap threshold)` result there means the roles are missing, not the system. With clearance, such as "make it consistent" in the ask, Harden continues as Full: Values, then Harden, then Full, the route the routing table's weak row names. Otherwise `not actionable` continues with Build step 1, and `complete` with Adopt step 1. Each gets the report passed in.

A raw color with a nearby role defaults to a new token pair, or to that nearest role, and the gate records it. "Keep raw" is the default only for brand art, such as a wordmark or an illustration (`build-design-system/references/modes.md`, Harden step 2). On the Adopt branch, `migrate-design-system` never adds a token, so the default there is the nearest role, and a color with no role near it stays raw under a gate for the system owner.

The person named raw values, so the first writing step's GOAL is the swaps from the report where the token's value is identical to the raw value, on every route. Name their count in the Frame, and lead the report with how many raw values are left in product code. On the Adopt branch, those swaps run as their own step before the audit, with no clearance, under the swap rule at the top of this file. Other component swaps wait for clearance, unless a decided gate default names them.

## Adopt

For a settled system the app has not moved onto. An ask that names families and a PR runs Named families for a PR instead.

1. `migrate-design-system`, audit mode. Receives the system location and commit that triage found. Done when `plan.md` exists.
2. Clearance, as Full step 5. Decided defaults need none, so they land in step 3 first.
3. `migrate-design-system`, as Full step 6.
4. `design-review`, as Full step 7.

## Document

For a settled system with no docs, or docs outside the target structure.

1. `build-design-system`. Receives the existing token source and component folder with the instruction to start from them. Its inventory will find families already canonical, so most of the work lands in its docs and enforcement phases. An ask for all or full docs adds "document everything" (`build-design-system/references/coordinator-path.md`). Done as Build step 1.
2. Check the docs, as Build step 3.

## Component

For one named component.

1. `component-docs`. Receives the component name. Done when it returns an entry with its status line.
2. Place the entry. If the repo keeps component entries where `system-structure.md` puts them, one worker writes the entry there as its own change. Otherwise the boss saves the returned entry whole to `returns/component-docs.entry.md`, the one return it keeps whole, and Next says where it belongs. Done when the entry's path is in the state file.

## Review

For a screen or flow close to shipping.

1. `design-review`, one run per flow, side by side. Receives the flow, the running build if one starts, and the purpose if the ask gave one. With no flow named, take the top routes from `triage/routes.txt`, which leaves out Next.js private folders. Done when each run returns a report with its status line.
2. `token-mapping`, when a token source exists or the ask is about consistency. Receives the files those flows render. Runs alongside step 1. With no token source, or a palette-only list, it answers with Consistency by role. Done when it returns a report with its status line.

Nothing in the repo changes on this route.

## Audit

For "how bad is it". Product code stays read-only from start to end.

1. `token-mapping`, when a token source exists. As Values step 1.
2. `migrate-design-system`, audit mode, when a token source exists. As Adopt step 1. With no token source there is nothing to audit against, so skip it with that reason and let Next say Build.

Nothing changes outside `.design-system/boss/` and `.migration/`, except the audit's `scripts/migration-inventory.mjs`, which the edit run reuses. It stays an untracked file, and the report names it.

## What passes between steps

| From | Artifact | To |
|---|---|---|
| triage | `triage/signals.tsv`, `raw-colors.txt`, `components.tsv` | every first step, as a first read |
| `token-mapping` | its report | `build-design-system` foundations, or the migration's first mapping |
| `build-design-system` | `.design-system/run.md` handoff, migration map, codemod command, counts by route, and in harden mode the stray-code list | `migrate-design-system`, first for decided defaults |
| `migrate-design-system` audit | `.migration/<run>/plan.md` | the clearance message, then the editing run |
| `migrate-design-system` | final integration commit and captures | `design-review` |
| `component-docs` | the entry and its three blocks | the repo's entry folder, or `returns/component-docs.entry.md` |
