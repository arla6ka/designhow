# Coordinator path

> For the team setting this up: the one page a coordinator reads to run the build, whether that is this skill's own coordinator or design-system-boss. Open another reference only when the phase that names it starts. Change the caps here, not in `SKILL.md`. Terms such as run branch, surface, gate and clearance are defined in `run-record.md` (Terms).

## Start

1. Create the run branch from the current HEAD: `git switch -c ds/<yyyy-mm-dd>-<route>`, where the route is the mode (`build`, `harden`, `seed`) or the one the boss names. Write the starting branch into the Frame. The run never commits to it.
2. Create `.design-system/run.md` from `run-record.md`, with the Frame, the standing orders and the known gates. Workers read gates, so the gates exist before any worker starts.
3. Decide the footprint. When the repo looks like one the person does not own (a remote that is not theirs, a CONTRIBUTING.md, a README for outside contributors), or the ask mentions a PR or upstream, open a footprint gate with the default "minimal". Minimal adds tokens, the components touched and the screen changes, with no docs site, twins or copied scripts unless asked. Phases 5 and 7 write only what the repo's own lint and docs already hold. When the ask names families, minimal covers only those, and no migrate audit plan is written. Before editing an instance, confirm something imports it. Minimal closes with a PR body in `.design-system/pr.md`, a check that the branch base matches the upstream tip, and dead hunks dropped, per `design-system-boss/references/routes.md` (Minimal footprint close).
4. Set up for the footprint. Full: copy the check scripts per `SKILL.md` phase 1, and add `.design-system/review/**/*.png` and `.design-system/tmp/` to `.gitignore`. Everything else in `.design-system/review/` is a committed record: `surfaces.tsv`, `traces.tsv`, the probe files, the review reports and `index.html`. Minimal: copy nothing and leave `.gitignore` alone. List `.design-system/` in `.git/info/exclude`, so the run record, captures and scratch stay untracked. Either way, fixtures, capture, pixdiff and montage run from `<skills>/build-design-system/scripts/`, where `<skills>` is `.agents/skills/` or `.claude/skills/`.

## Phase caps

The budget is what the person named, else the session the host gives, else 2 hours, which fits one pilot and a first pass of surfaces. At a cap, record what is left as follow-up and move on. Keep up to 4 workers in flight by default, since the coordinator's review limits a fan-out. Stop spawning at 70% of the session by default, so the rest covers review, the check and the close. Under design-system-boss the build is a nested coordinator. It runs every worker in the foreground or blocks on it, and never returns while one of its workers is still running.

The shares are defaults. Move time between phases when the app calls for it, and record why in the Frame.

| Phase | Cap | Read when it starts | Cut first at the cap |
|---|---|---|---|
| 1 Frame and setup | 5% | `run-record.md` (Frame, Standing orders), the base reference | nothing |
| 2 Inventory and baselines | 10% | `inventory.md`, `browser.md` (Capture every route in one command, Measuring a loading state). Measure every pilot trap's before state here and save the numbers in `run.md`, since the first edit erases it | screen notes past the pilot |
| 3 Foundations | 15% | `token-architecture.md` or the base reference | swaps on a route that fails pixdiff go to the map |
| 4 Components | 15% | `component-contract.md`, `traps.md`, `worker-brief.md`, `rule-method.md` | families past the pilot's, each with a gate naming its missing states |
| 5 Checks | 10% | `checks.md` | never cut. Hits past the cap go to the allowlist |
| 6 Pilot | 10% | `browser.md` (Compare after a change, Measuring a loading state) | never cut |
| 6 Surfaces, when cleared | 20% | "Surfaces on the run branch" below | the rest go in Next, by name |
| 7 Docs | 10% | `system-structure.md`, `spec-template.md`, `writing-method.md`, and "Document everything" below when the ask names it | the HTML docs site, then families past the pilot's. Generated docs never |
| 8 Handoff | 5% | `run-record.md` (Handoff report) | nothing |

With no clearance, the surfaces share goes to components and docs, except the time decided gate defaults need. Landing them is exempt from the spawn stop, because it is cheap and it is what makes screens change.

## Clearance

The person gives clearance by naming surfaces or a budget. Adoption asks, listed in `design-system-boss/references/triage.md` (The ask's intent), count as clearance within the session budget. So does an ask about how screens look, such as "every page looks like a different product".

Decided gate defaults need no clearance. Without clearance, nothing else lands outside the pilot except identical-value swaps. When the ask is visual consistency, a small outlier, such as a single off-brand 404 page, moves to the system as a decided default, not a gate. In harden mode and on the boss's Full route, horizontal overflow at the narrow width in shared layout (the shell, the nav, a layout every route renders) is a decided default too, with `document.documentElement.scrollWidth` at that width before and after in its trace row.

## Surfaces on the run branch

A visible change lands on the run branch when it traces to a gate or decision and its surface has captures. The review records are committed (Start), so the review page travels with the branch.

1. Order the surfaces: the one the complaint names, then by how many drifted values each holds. Every route is a row in `.design-system/review/surfaces.tsv` (`surface`, `route`, `states`), and the phase 2 before captures came from it.
2. One surface per commit. Apply the gate defaults and the migration map, with the codemod when one exists. Read every hunk before committing.
3. After a shared UI or token edit, `node <skills>/build-design-system/scripts/capture.mjs --base <url> --status --surfaces .design-system/review/surfaces.tsv` must show 200 on every route, or the status its row expects. When the dev server may serve stale styles after a global style edit, restart it first (`browser.md`).
4. Capture after with one command: `node <skills>/build-design-system/scripts/capture.mjs --base <url> --kind after --out .design-system/review --routes <surface>=<route>`, plus `--states <file.mjs>` for listed states. Add the surface's row to `.design-system/review/traces.tsv`: surface, commit hashes, gate and decision ids, and what changed in plain words, including every line of its behavior delta. A state the run adds has no before: list it in `surfaces.tsv` and capture it after. A shared shell change that touches every route is one row with the surface `shared`.
5. Run `node <skills>/build-design-system/scripts/montage.mjs --diff` and `node scripts/check-system.mjs --files <the surface's files>`. The montage exits 1 on any change no trace row or gate explains, and on the rendered problems `montage.mjs --help` lists, such as recolored text under its contrast floor or a nav link newly hidden at the narrow width with no gate id (`traps.md`, `trap/narrow-hidden-nav`). Fix it, or take the change off the branch and open a gate. A finding that waits on a person may stay on the branch under an open gate: add a row to `.design-system/review/open-gates.tsv` (gate, surface, text the finding contains) and name the gate in the trace row. The montage then lists it as a warning. Once the surface lands, run `node scripts/check-system.mjs --shrink-allowlist` and commit the allowlist on its own. Workers only report shrink candidates.
6. A fix to broken behavior is a decision. An intentional behavior change is a gate, applied by default like any other. Accessibility-tree changes sort by `traps.md` (Adds-only accessibility changes). Link restyles are one gate listing every surface they touch (`SKILL.md`, Boundaries).
7. When `migrate-design-system` is installed, it runs this loop and the build hands it the map. Merging into the person's branch is always the person's call.

## Components close

Phase 4 closes only when every family in scope has its missing states built or gated. In scope means every family the inventory or the harden gap list marks with missing states, not only the pilot's. A family cut at the cap gets a gate naming each missing state, such as "Table: empty, loading, error. Default: build them on the next surface that lists records". A prop the run removes from a component is a gate listing its call sites, even when no call site uses it today. To find them, compare `props-table.mjs` on each component file the run edited, at the starting commit (a worktree in `.design-system/tmp/`) and at HEAD. The handoff lists every family in scope as built, or gated with the gate id.

## Document everything

By default, specs cover the pilot's families, and build adds the families the strays touch. The run specs every family in the inventory when the ask says complete, full, all or every component ("document all our components"), or when the pilot's specs close with budget left before the docs cap.

1. List every canonical row in `components.tsv` by family. Families the pilot touched go first, then the rest by call-site count, highest first.
2. Write `docs/system/writing.md` first, per `writing-method.md`, so every spec's Content cites it instead of deriving voice on its own.
3. Fan out one spec worker per family, with the spec-worker variant in `worker-brief.md` and `rule-method.md`, in the rolling window. A family whose code still needs work gets the family template instead.
4. Review each report as usual. Also open its `rule-tests` file and rerun one two-agent test yourself.
5. At the docs cap, stop starting families. Each family not reached is one handoff line naming its members and call-site counts.

## Sibling skills under this coordinator

Under this coordinator, `component-docs` and `design-review` return text and write no file. The coordinator saves a component entry to `docs/system/<component>.md` and a review to `.design-system/review/<surface>-review.md`. Run directly, each saves to its own default path. A cheap CSS fix a review finding names, such as an overflow at the narrow width or a control height off the scale, lands on the run branch as a decision when existing tokens cover it, with captures and a trace row like any surface. It is not a follow-up.

## Close

1. Run the full check on a clean clone and the repo's production build. Then start the production server and run `capture.mjs --status` against it. A route that answers 200 in dev and fails in production is a failed run.
2. Run `node scripts/check-system.mjs --prune-allowlist`, which drops every allowlist entry the run fixed, and commit the allowlist. Then write the close numbers to one file, `.design-system/close.md`: the output of `node scripts/check-system.mjs --no-self-test --left`, then the montage's output with every warning on an open gate listed by gate id, then the inventory rerun by route. Every count in the final message comes from this file and nowhere else. Under design-system-boss the boss rewrites this file at its own close and keeps the build's rows.
3. The final message is the handoff report, in the format `run-record.md` gives (Handoff report).
