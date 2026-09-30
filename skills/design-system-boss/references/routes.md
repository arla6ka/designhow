# Routes

Each route is a list of steps. Copy the chosen route's steps into the task list and the state file as written. Each step names the skill, what it receives, and when it is done. Every skill is called through its "When a coordinator calls it" section.

These rules hold on every route:

- A writing route ends check-first unless it has clearance: tokens, one component per family, the pilot flow on the system, the safe moves, docs, a ratcheting CI check that warns on new drift (`check-system.mjs --ratchet`), and the AGENTS.md index (`build-design-system/references/coordinator-path.md`, Clearance). Migrating every other screen is Full step 5 on. It runs only when the ask names it (`references/triage.md`, The ask's intent) or the person accepts the handoff's offer. The offer states its size, the surfaces left and the families they use, from `plan.md`.
- A writing step works on the run branch and starts only after the step before it has a verdict. Read-only steps may run side by side.
- Decided gate defaults land on the run branch (`build-design-system/references/run-record.md`, Terms), before any docs are written, so the spec check reads the code the branch ships. A gate is decided when its row has a default, and every gate from a sibling record does.
- The migrate audit is read-only. On Build and Harden it starts right after the build's token commit, pinned to it, and runs beside the rest of the build, so plan.md exists even if the build hits its cap. At close, the boss reconciles the audit's gates with the build's or harden's. If the build changed a token, component API or file the plan names after the pin, the pin is stale. Rerun the audit pinned to the final commit, or re-pin it and redo the affected rows, and record which. A minimal footprint writes no audit plan, since the state file's edit list is its plan.
- Identical-value swaps land on every route without clearance, in build, harden or a swap step the boss briefs, each proven as `build-design-system/references/run-record.md` (Terms) defines, with the proof saved per route. Other component swaps outside the pilot need clearance, unless a decided gate default names them.
- The repo works after the run. The check scripts, check-spec, the docs generator and the docs live in the repo (`scripts/`, `docs/`), and `.design-system/` holds only run records and the rerun scripts in `.design-system/scripts/`, nothing the check reads. The check passes on a clean clone. On a minimal footprint nothing is vendored, the repo's own checks are the check, and `.design-system/` goes in `.git/info/exclude`.
- On a writing route, a cheap CSS fix a `ui-review` finding names lands on the run branch as a decision when existing tokens cover it, per `build-design-system/references/coordinator-path.md` (Sibling skills under this coordinator). It goes to a worker, not a follow-up.
- On Full and Harden, horizontal overflow at the narrow width in shared layout is a decided default, per the same file (Clearance).
- A step's output passes to the next by path. Never paste a summary of it in place of the file.
- A read-only ask (review, document) that arrives mid-run runs against the starting branch and writes nothing to docs/system until the run lands. A writing ask queues after the current run or becomes a gate.
- Every brief names the foundation from triage and the base reference it loads (`build-design-system/references/base-*.md`). The foundation changes where tokens live and how drift is measured, never the steps.

## Jobs and routes

Most asks are one of three jobs, and the route follows the job.

| Job | Route |
|---|---|
| A big app with no system. Build one from it, check-first | Build. Full when the ask names the migration |
| A big app with a weak system. Harden it, then converge the app onto it | Harden, then Full from step 5 on clearance |
| No app yet. Start from brand material or defaults | Seed |

The foundation changes what each step reads and writes, and each base reference covers its own case, including how the system ships. On a package library, the system wraps the library and its theme object is the token source. On the team's own package, the package is the target and the app pins a version of it. On raw code, the build picks a canonical implementation per family. For Seed with no foundation, the default is shadcn. Nothing publishes to a package registry unless a person asks, and that is a stop.

## Budget

Phase caps set the budget, not a formula. Take the session from the person, else the host, else 2 hours, and give each phase its share. Write the caps as clock times into the state file before the Frame. Under the boss, the build uses these caps, not its own. The shares are defaults. Move them once a few runs show where the time goes.

| Phase | Cap |
|---|---|
| Triage, route and Frame | 5% |
| Build, harden or seed, with the pilot. On a chained route, Values' `token-mapping` step counts here too | 35%, or 65% on a route with no migration |
| Migrate audit | inside the build's cap, side by side |
| Decided defaults | 15%, reserved up front on every writing route, spent in the build's safe moves before its docs, then Build step 3 |
| Migration, when cleared | 30%. Without clearance, it goes to docs and the found-not-fixed list |
| `ui-review`, `token-mapping`, `component-docs` | 10%, side by side with other work |
| Close: after-triage, clean-clone check, captures, montage, report | 15%, never cut |

A phase that finishes early passes its time on. A phase at its cap starts nothing new and closes what is running. Past 70% of the session no new writing step starts, which leaves close its time. The decided-defaults step is the exception. It has its own reserved share, it is cheap, and it is what makes screens change, so it starts at its turn. When the session is short, cut the build's scope, never close. The build settles its formats before any fan-out and runs its phases in the order `build-design-system/references/coordinator-path.md` (Lock before fan-out) gives. Brief the build or harden in this order, and write the planned cut into the Frame:

1. The change that answers the named complaint, including the value-identical swaps on every route.
2. The token source, then the AGENTS.md block right after it. The block is never cut.
3. Specs for the families the pilot touches, and their generated twins, `llms.txt` and index. Generated docs are never cut. The other families become found-not-fixed rows.
4. The pilot screen. Every trap in the pilot's own files is fixed, or gated with its measurement.
5. An HTML docs site, only as a follow-up, unless the person reviews in a browser. Then it is the live showcase (`build-design-system/references/system-structure.md`), grown one page per family as each lands, and never cut.

## Small app

When triage reads `small_app yes` (8 routes or fewer and `ui_lines` under 3,000), the route keeps its steps but not its fan-out. Record "small app: one coordinator, no fan-out" as a decision row. Each writing step goes to one step agent that runs every phase itself, per `build-design-system/references/coordinator-path.md` (Small app). The migrate audit runs after the build, not beside it, with no mapper or parity fan-out. The two-agent tests, the review lenses and the parity pass read `skipped (small app)`. The boss reads only the references for the steps the route runs. Captures, the check, the gates and close stay as written.

## Build

For an app with no system, or one where the ask is to make one.

1. `build-design-system`. Receives the target app, the pilot if the ask named one, its phase cap, the order from Budget, and the triage folder as a first read. Its safe moves, decided defaults included, land in its phase 6, before its docs phase. Its inventory writes the product coverage map (`build-design-system/references/inventory.md`), which goes into the handoff offer beside `plan.md`. Done when it returns its handoff report or stop shape, and `.design-system/run.md` has a Handoff section.
2. `migrate-design-system`, audit mode, beside step 1 and pinned to the build's token commit. Receives the inventory, the triage folder and the families the build is making. Done when `.migration/<run>/plan.md` exists and its gates are reconciled with the build's.
3. Late defaults. When reconciling the audit added a decided default the build never landed, `migrate-design-system` in edit mode lands it and nothing more, one surface per commit with captures and a verifier. Then `gen-docs.mjs` regenerates and `check-spec.mjs` reruns with freshness on, before step 4. Done when every decided default reads `default` or `done` with its commit, or `skipped (<reason>)`. With none to land, `skipped (none late)`.
4. Check the build. Walk the "Done, page by page" table in `build-design-system/references/system-structure.md` against the repo. The generated twins, `llms.txt`, the index, the AGENTS.md block and the CI ratchet are required rows. HTML pages are met or found-not-fixed rows. Clone the run branch into a temp folder, install, run the repo's own prerequisites for its typecheck, and see the check, the spec check and the typecheck exit 0 there. Check fixtures must be invisible to the compiler, by an extension it skips or a folder it excludes, so an error from a fixture fails this step. Done when each row is marked met or not met with a path. The handoff's migration map, codemod command and counts by route go into the offer beside `plan.md`.

Without clearance the route ends here, check-first. With it, it continues as Full from step 5.

## Harden

For a weak system, where components exist but states, rules and docs are thin and the app diverges from them.

1. `build-design-system`, harden mode. Receives the foundation, the triage folder, the component layer's path, its phase cap and the order from Budget. Done when `.design-system/run.md` has a Handoff section, and the spec check it names passes on every spec it wrote.
2. `migrate-design-system`, audit mode, side by side with step 1, as Build step 2. The stray-code list harden writes goes into the offer beside `plan.md`.
3. Late defaults, as Build step 3, including the stray-code moves harden gated with a default that it did not land.
4. Check the system, as Build step 4.

Then as Build: without clearance the route ends here.

## Seed

For an app with no UI yet. The system starts from whatever brand material exists, or from the default foundation. This route is `build-design-system` in seed mode plus the boss's check, the same run as calling that skill directly.

1. `build-design-system`, seed mode. Receives the brand material triage found (logo files, a font, a color in a README or a slide), the foundation (default shadcn), and the budget. Done when the handoff lists every brand value as a gate with its default, and the spec check passes on the seed components.
2. Check the system, as Build step 4.

Nothing to migrate. Next is the first screen built on the seed, with `ui-review` on it.

## Full

For "fix it" asks. Build or harden, then, with clearance, migrate and review.

1. to 4. As Build, or as Harden when triage marked the system weak. The audit already ran beside the build.
5. Clearance, per `SKILL.md` (Clear the migration). Without an ask that names the migration, the route ends check-first, and the handoff offers the migration with its size and asks for the one reply `Go, <budget>`. Done when the clearance source is saved, or steps 6 and 7 read `skipped (no clearance)`.
6. `migrate-design-system`, on the run branch. Receives the existing run folder, the budget from clearance, and scope and pilot from `plan.md`. Surfaces migrate one per commit, verified, with captures in `.design-system/review/`. Unexplained diffs stay out and become gates. Done when it returns its final report or stop shape.
7. `ui-review`. Receives the final integration captures from the migration run folder for the flows the ask named. With none named, it takes the three surfaces with the most rows in `plan.md`. Done when each flow has a report with its status line. With no clearance, this step is `skipped (no clearance)`, since the build reviewed its own pilot.

## Named families for a PR

For an ask that names component families and a PR or upstream. It always runs with a minimal footprint and never through Harden, whose specs and checks are what minimal leaves out. The ask clears the named families and nothing else.

1. Edit list, read-only. One worker starts from `triage/raw-families.tsv` and lists every instance of each named family: the shared component if one exists, raw elements that copy its classes, and the variants that drifted from it. It picks each family's canonical look from evidence, the look most routes already render, and gives every listed file an importer count. The list goes in the state file, one decision row per family. Done when every instance has a path, a line and an importer count.
2. Edits. One worker per family on disjoint files, briefed from `references/delegation.md` with the edit list as its plan, one commit per family. Make the smallest change that fixes the family: a missing prop on the component, never a new abstraction, dependency or token. A file with 0 importers stays out and goes in the PR body's follow-ups. Done when each family has its commit and every changed surface has before and after captures.
3. Check. On a clean clone of the run branch, the repo's own lint, typecheck and build, after its typecheck prerequisites, and the repo's formatter in check mode on the changed files. Done when each command's exit code is in the state file.
4. Close per `build-design-system/references/coordinator-path.md` (Close, Minimal footprint).

## Values

For a token source the code does not follow.

1. `token-mapping`. Receives the raw value lists from `triage/` and the existing token source. Done when it returns a report with a status line.
2. Branch on the system first, then the status. A weak system continues with Harden step 1 whatever the status, because a `not actionable (gap threshold)` result there means the roles are missing, not the system. With clearance, such as "make every page consistent" in the ask, Harden steps 1 to 4 run, then Full from step 5. Otherwise `not actionable` continues with Build step 1, `stopped` with Build step 1 and the report as its groundwork, and `complete` with Adopt step 1. Each gets the report passed in.

Which values stay raw, `graphic` brand art among them, is in `build-design-system/references/token-architecture.md` (What never becomes a token). A raw color within tolerance of a role maps to the existing token. Beyond tolerance, it becomes a new token pair under a gate. On the Adopt branch, `migrate-design-system` never adds a token, so a color beyond tolerance stays raw under a gate for the system owner, unless an existing token covers its role, in which case the gate's default moves it to that token.

The person named raw values, so the first writing step's GOAL is the report's identical-value swaps, on every route. Name their count in the Frame, and lead the report with how many raw values are left in product code. On the Adopt branch, those swaps run as their own step before the audit, under the identical-value swap rule at the top of this file.

## Adopt

For a settled system the app has not moved onto. An ask that names families and a PR runs Named families for a PR instead.

1. `migrate-design-system`, audit mode. Receives the system location and commit that triage found, and writes the product coverage map as the build would (`build-design-system/references/inventory.md`). A `missing` pattern becomes a gate, never a new component inside the migration. Done when `plan.md` exists.
2. Clearance, as Full step 5. "Migrate" and "adopt" name the migration. A complaint such as "nobody uses it" does not, so that run ends at the plan with the offer. Decided defaults need none, so without clearance step 3 lands only them and step 4 reads `skipped (no clearance)`.
3. `migrate-design-system`, as Full step 6.
4. `ui-review`, as Full step 7.

## Document

For a settled system with no docs, or docs outside the target structure.

1. `build-design-system`. Receives the existing token source and component folder with the instruction to start from them, so most of the work lands in its docs and enforcement phases. An ask for all or full docs adds "document everything" (`build-design-system/references/coordinator-path.md`). Done as Build step 1.
2. Check the docs, as Build step 4.

## Component

For one named component.

1. `component-docs`. Receives the component name. Done when it returns an entry with its status line.
2. Place the entry. If the repo keeps entries where `system-structure.md` puts them, one worker writes it there as its own change. Otherwise the boss saves it whole to `returns/component-docs.entry.md`, the one return kept whole, and Next says where it belongs. Done when the entry's path is in the state file.

## Review

For a screen or flow close to shipping.

1. `ui-review`, one run per flow, side by side. Receives the flow, the running build if one starts, and the purpose if the ask gave one. With no flow named, take the top routes from `triage/routes.txt`. Done when each run returns a report with its status line.
2. `token-mapping`, when a token source exists or the ask is about consistency. Receives the files those flows render. Runs alongside step 1. With no token source, or a palette-only list, it answers with Consistency by role. Done when it returns a report with its status line.

Nothing in the repo changes on this route.

## Audit

For "how bad is it". Product code stays read-only.

1. `token-mapping`, when a token source exists. As Values step 1.
2. `migrate-design-system`, audit mode, as Adopt step 1. With no token source there is nothing to audit against, so skip it with that reason and let Next say Build.

Nothing changes outside `.design-system/boss/` and `.migration/`, except the audit's `scripts/migration-inventory.mjs`, which the edit run reuses. It stays an untracked file, and the report names it.

## What passes between steps

| From | Artifact | To |
|---|---|---|
| triage | `triage/signals.tsv`, `raw-colors.txt`, `components.tsv` | every first step, as a first read |
| `token-mapping` | its report | `build-design-system` foundations, or the migration's first mapping |
| `build-design-system` | `.design-system/run.md` handoff, migration map, codemod command, counts by route, product coverage map, and in harden mode the stray-code list | `migrate-design-system`, first for late defaults |
| `migrate-design-system` audit | `.migration/<run>/plan.md`, its found-not-fixed table | the handoff's offer, then the editing run |
| every step | its found-not-fixed rows | the one table in the handoff (`references/state.md`, The handoff report) |
| `migrate-design-system` | final integration commit and captures | `ui-review` |
| `component-docs` | the entry and its three blocks | the repo's entry folder, or `returns/component-docs.entry.md` |
