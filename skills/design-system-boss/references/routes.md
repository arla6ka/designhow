# Routes

Each route is a list of steps. Copy the chosen route's steps into the task list and the state file exactly as written here. Each step names the skill, what it receives, and when it counts as done. Every skill is called through its "When a coordinator calls it" section.

Two rules hold on every route:

- A step that writes to the repo starts only after the step before it has a verdict. Read-only steps may run side by side.
- A step's output passes to the next by path. Never paste a summary of it in place of the file.

## Build

For an app with no system, or one where the ask is to make one.

1. `build-design-system`. Receives the target app, the pilot if the ask named one, the build's share of the budget, and the triage folder as a first read. Done when it returns its handoff report, or its stop shape, and `.design-system/run.md` has a Handoff section.
2. Check the build. Open `build-design-system/references/system-structure.md` and walk its "Done, page by page" table against the repo. Rerun the check command named in the handoff and see it pass. Done when each table row is marked met or not met with a path.
3. `migrate-design-system`, audit mode. Receives the system location and commit from the build handoff, the migration map, the codemod command and the counts by route. Done when `.migration/<run>/plan.md` exists.

The route ends here unless the person clears a migration. With clearance it continues as Full from step 4.

## Full

For "fix it" asks. Build, then migrate, then review.

1. to 3. As Build.
4. Clearance. Ask for it per step 5 of `SKILL.md`, in one message that gives the plan's counts, its estimate and the open gates. Done when the reply is saved, or the route is marked ended at the plan.
5. `migrate-design-system`. Receives the existing run folder, the budget from the clearance reply, and scope and pilot from `plan.md`. Done when it returns its final report, or its stop shape.
6. `design-review`. Receives the final integration captures from the migration run folder for the flows the ask named. With none named, it takes the three surfaces that had the most findings in the first triage. Done when each flow has a report with its status line.

## Values

For a token source the code does not follow.

1. `token-mapping`. Receives the raw value lists from `triage/` and the existing token source. Done when it returns a report with a status line.
2. Branch on its status. `not actionable (gap threshold)` means the token set does not fit the app, so continue with Build step 1 and pass this report in. `complete` means the set fits, so continue with Adopt step 1 and pass the report in as the first mapping.

## Adopt

For a settled system the app has not moved onto.

1. `migrate-design-system`, audit mode. Receives the system location and commit that triage found. Done when `plan.md` exists.
2. Clearance, as Full step 4.
3. `migrate-design-system`, as Full step 5.
4. `design-review`, as Full step 6.

## Document

For a settled system with no docs, or docs outside the target structure.

1. `build-design-system`. Receives the existing token source and component folder with the instruction to start from them. Its inventory will find families already canonical, so most of the work lands in its docs and enforcement phases. Done as Build step 1.
2. Check the docs, as Build step 2.

## Component

For one named component.

1. `component-docs`. Receives the component name. Done when it returns an entry with its status line.
2. Place the entry. If the repo keeps component entries where `system-structure.md` puts them, one worker writes the entry there as its own change. Otherwise the entry stays in `returns/` and Next says where it belongs. Done when the entry's path is in the state file.

## Review

For a screen or flow close to shipping.

1. `design-review`, one run per flow, side by side. Receives the flow, the running build if one starts, and the purpose if the ask gave one. Done when each run returns a report with its status line.
2. `token-mapping`, when a token source exists. Receives the files those flows render. Runs alongside step 1. Done when it returns a report with its status line.

Nothing in the repo changes on this route.

## Audit

For "how bad is it". Read-only from start to end.

1. `token-mapping`, when a token source exists. As Values step 1.
2. `migrate-design-system`, audit mode, when a token source exists. As Adopt step 1. With no token source there is nothing to audit against, so skip it with that reason and let Next say Build.

Nothing changes outside `.design-system/boss/` and `.migration/`.

## What passes between steps

| From | Artifact | To |
|---|---|---|
| triage | `triage/signals.tsv`, `raw-colors.txt`, `components.tsv` | every first step, as a first read |
| `token-mapping` | its report | `build-design-system` foundations, or the migration's first mapping |
| `build-design-system` | `.design-system/run.md` handoff, migration map, codemod command, counts by route | `migrate-design-system` |
| `migrate-design-system` audit | `.migration/<run>/plan.md` | the clearance message, then the editing run |
| `migrate-design-system` | final integration commit and captures | `design-review` |
| `component-docs` | the entry and its three blocks | the repo's entry folder, or `returns/` |
