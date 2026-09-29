# Run record

> For the team setting this up: the run record is one Markdown file, `.design-system/run.md`. A reviewer reads the run from it without the transcript, and an agent resumes from it after a crash. Rename the path if you like. Keep one writer, the coordinating agent.

Contents

- Terms
- Rules
- File shape
- Frame
- Standing orders
- Phases
- Decisions
- Gates
- Ledger
- Handoff report
- Resuming

## Terms

These words mean the same thing in every design.how skill. Other files point here instead of redefining them.

- **Surface.** One route, or the shared layout every route renders (named `shared`), with its states from `surfaces.tsv`. It is the unit of capture, commit and verdict.
- **Run branch.** `ds/<yyyy-mm-dd>-<route>`, cut from HEAD at the start. Every write lands on it. Nothing commits to the starting branch, and merging is the person's call. When the person names a branch for this work, or created one for it in this session, that branch is the run branch and no other is cut. Record "run branch: <name>, the person's own" as a decision. Commits stay local until the person asks for a push or a PR.
- **Identical-value swap.** A raw literal replaced by a token that holds exactly its value, proven by a pixel diff of 0 on every route it touches. It needs no clearance.
- **Decision.** A choice a reversible change settles, made and recorded with its evidence. Fixes to broken behavior, adds-only accessibility changes and merges inside tolerance are decisions.
- **Gate.** A product or brand choice a person could reasonably answer either way. It carries a default, the run applies that default on the run branch, and the person reverses it by naming it at merge.
- **Clearance.** The person's go-ahead, within a budget, to move surfaces beyond identical-value swaps and decided gate defaults. What counts as clearance is in `coordinator-path.md` (Clearance).
- **Footprint.** How much the run adds to the repo. Full copies in the check scripts, specs and generated docs. Minimal, the default when the repo is not the person's own or the ask is for a PR, adds only tokens, the components touched and the screen changes, and uses the repo's own lint, typecheck and build as the check (`coordinator-path.md`, Start).

## Rules

- One writer. The coordinator writes this file. Workers report and the coordinator records.
- One ID sequence. Workers prefix what they propose with their family or surface, such as `D-button-01` or `G-billing-01`, because parallel workers would all pick `D-01`. The coordinator gives each the next free `D-NN` or `G-NN` and puts the worker's ID in Evidence.
- Write each row when the decision is made, not at the end.
- Rows point at evidence: a file path, a command and its output, a screenshot path. A row without evidence is a claim.
- Phases and Ledger rows update in place. Decisions and Gates only grow.
- Commit it with the work, so the history and the reasons sit together. On a minimal footprint it stays untracked (`coordinator-path.md`, Start).

## File shape

```markdown
# Design system build: <app name>

## Frame
## Standing orders
## Phases
## Decisions
## Gates
## Ledger
## Handoff report
```

## Frame

Written in phase 1, with counts filled in after phase 2. The values below are one invented example.

```markdown
## Frame
Mode: build. Foundation: raw (base-raw.md)
Run branch: ds/2026-03-12-build, from main at 7dc8f3d. Nothing commits to main. Nothing is pushed. Merging is the person's call.
Bans: "no uppercase labels" (the person, 10:03). Design source: none named.
Target: apps/web (CSS variables in styles/globals.css)
Themes: light, dark (data-theme attribute)
Viewports: 390, 1280 (the app's narrowest and widest supported widths)
Pilot: Invite teammate (Settings > Members > Invite). Uses Button, Input, Select, Dialog, Toast. Has an invalid-email error state.
Workers: 5 docs, 2 code (machine budget: 9 GB free, swap 20%, backend stopped). 31 component files, 2 themes.
Budget: 2 hours (the default: nobody named one and the host set no session length), split by the phase caps in coordinator-path.md.
Clearance: yes, the ask "make every page look like one product" counts (coordinator-path.md).
Check command in CI: npm run check (read from .github/workflows/ci.yml)

Done when: 9 canonical components cover 9 of 11 inventoried families (2 are product compositions),
every token has a role, the checks fail on 6 seeded violations and pass on the system and the pilot,
and the pilot matches its baseline except for D-07 and gate G-01.
```

## Standing orders

One numbered list per run, one rule per line, pasted word for word into every brief and every retry. Under design-system-boss, the boss's list comes first and the build lines follow with the next numbers. Running directly, use this one. When you catch yourself repeating an instruction to a worker, add it here first.

```markdown
## Standing orders
1. Write only inside your brief's SCOPE.
2. Tokens, generated files, the barrel, registry.json, the migration map and the check's config, allowlist and drift list belong to the coordinator. Report allowlist shrink candidates; never edit the allowlist.
3. Use only the colors, fonts, shadows, gradients and motion the app already has, or that the design source the Frame follows draws.
4. Baselines, fixtures and checks stay as written. Fix the code instead.
5. Examples use inert data. No requests on mount.
6. Report with the REPORT block, commands and exit codes pasted, not summarized.
7. Return your report as your final message, as text. Write no report file, and never write into a coordinator file.
8. Browser commands use absolute paths and your own browser session name, spelled out on every line.
9. Commit only to the run branch, locally, never to a branch the person did not name for the work. No push or PR unless the person asked for one.
10. Swap a raw literal for a token of exactly the same value on any route once pixdiff at tolerance 0 shows 0% for that route. Decided gate defaults land wherever they reach. Other changes outside the pilot land only on cleared surfaces. Each is one surface per commit, with before and after captures in .design-system/review/ (images gitignored, traces.tsv and reports committed) and a traces.tsv row.
11. What the team needs after the run (scripts, config, specs, generated docs) goes in the repo, never only in .design-system/ or a skill folder.
12. The person's bans, quoted below, hold in code, copy, docs, examples and the showcase, except on a Don't: line.
```

## Phases

One row per phase, updated in place.

```markdown
| Phase | State | Artifact | Notes |
|---|---|---|---|
| 1 Frame | done | run.md#frame | complaint: "the invite form loses what I typed" |
| 2 Inventory | done | inventory/, review/ before captures, delete commit a1b2c3d | 2 routes need auth, unverified |
| 3 Foundations | done | tokens/, mapping-report.md, pixdiff per route, AGENTS.md block | 31 identical swaps on 7 routes at 0% |
| 4 Components | in progress | components, specs, registry.json, migration map, codemod | 6 of 9 families verified |
| 5 Checks | not started | | |
| 6 Pilot, then surfaces | not started | | |
| 7 Docs | not started | | |
| 8 Handoff | not started | | |
```

States are `not started`, `in progress`, `done`, `skipped: <reason>` and `failed: <reason>`. A skipped phase keeps its row.

## Decisions

Append-only. One row per decision a reviewer might question.

```markdown
| ID | Phase | Decision | Why | Evidence | Reversible |
|---|---|---|---|---|---|
| D-07 | 3 | Input radius 6px to 8px (radius.control) | Two input families used 6 and 8, inside the 2px tolerance. 8 has 41 of 52 call sites | values.tsv, components.tsv | yes |
| D-09 | 4 | Canonical Button is components/ui/Button.tsx | Native button, 88 call sites, already forwards ref | ranking in D-09a | yes |
```

A change to a shipped screen beyond tolerance is a gate, not a decision row. Reference the gate id here once it is settled. A fix to broken behavior, such as Cancel submitting a form, is a decision. An intentional change to what a screen does is a gate. Accessibility-tree changes sort by `traps.md` (Adds-only accessibility changes).

## Gates

Append-only. Each gate is a question for a person, with the default the run applied so work could continue.

```markdown
| ID | Question | Options | Default applied | Reverses by | Status |
|---|---|---|---|---|---|
| G-01 | Merge 14 body-text grays into text.default (#171717)? Largest shift #111 to #171717, on 3 screens | merge, keep separate | merge | Keep the old values as listed exceptions | open |
| G-02 | Sidebar secondary text: reuse text.inverse or add text.inverse.subtle? | reuse, add | reuse text.inverse | Add the token and point 4 call sites at it | open |
| G-04 | Merge Combobox into Select with a `searchable` prop? Changes the settings timezone picker | merge, keep both | keep both | Merge and run the codemod on 7 call sites | open |
```

The run applies every gate's default in the tokens and code on the run branch, not only in this table. A merge default means the merged values are gone from the token files. If no default is safe, the question belongs under Stop and ask in the skill, and the run stops.

Bug fixes, implementation notes and per-site cleanups are decisions, not gates. When open gates pile up past what a person can answer in one sitting, default 8, merge them by theme.

## Ledger

One row per unit of work that needs a verdict: each family, the delete change, the generator, each check, the pilot, each surface.

```markdown
| Unit | Owner | Branch | Commit | Verdict | Evidence |
|---|---|---|---|---|---|
| family:button | coordinator | ds/2026-03-12-build | 4f5e6d7 | verified | .design-system/evidence/button/ |
| family:select | worker-2 | ds/2026-03-12-build-select, merged | 8a9b0c1 | verified with gaps | gap: no indeterminate example |
| pilot:invite | coordinator | ds/2026-03-12-build | 6a7b8c9 | failed | 2 unintended diffs at 390 dark |
| surface:/login | coordinator | ds/2026-03-12-build | 9d8e7f6 | verified | review/login-*.png, traces.tsv row G-01 |
```

Verdicts are `verified`, `verified with gaps`, `failed` and `blocked`. A new commit on the branch voids the row until it is checked again.

## Handoff report

The final section. The run record keeps the full report. The final message is shorter and follows its own template, below it.

```markdown
## Handoff report

### Summary
Asked: "people hardcode colors everywhere". Answered: 14 of 16 raw color lines now read tokens (8 identical-value swaps, 6 merges under G-01).
Predicate: met on all four parts (components 9 of 11 families, token roles, checks 6/6, pilot except D-07 and G-01).

### Checks
npm run check → exit 0 on a clean clone (allowlist: 212 entries in 23 files, scripts/check-allowlist.json)
node <skills>/build-design-system/scripts/montage.mjs --diff → exit 0, 8 surfaces: 3 changed (traced to D-07 and G-01), 5 unchanged
Pilot traps: trap/loading-layout-shift, Send invite 101x36 idle and pending (evidence/button/loading-box.txt)

### Screens
Changed on ds/2026-03-12-build: /login (G-01), /settings/billing (G-02), /team (pilot). Unchanged: /empty and /404, which held no drifted values, and /reports, which the budget did not reach. Review page: .design-system/review/index.html.

### What exists
- Token source tokens/, generated styles/tokens.css (npm run tokens)
- Components components/ui/, registry.json, specs docs/system/
- Twins, rules and llms.txt in public/ (scripts/gen-docs.mjs), checks in npm run check
- AGENTS.md block, codemod scripts/codemod-system.mjs, migration map .design-system/migration-map.json

### Readiness
| Component | Grade | Reason |
|---|---|---|
| Button | ready | |
| Select | ready with gaps | no indeterminate example |
| Combobox | blocked | G-04 decides whether it merges into Select |

Follow-up, no spec yet: Tabs, Tooltip, Avatar.

Families with missing states at inventory: Button (built), Table (empty, loading, error: G-06).

### Gates
G-01 open, default merge. G-02 open, default reuse text.inverse. G-04 open, default keep both.

### Next screen
The next likely screen is the project list. It hits two coverage gaps: tables (Meanwhile: a divided list, as /settings) and bulk actions (Meanwhile: none selected hides the bar).

### The check cannot see
Copied from `node scripts/check-system.mjs --list-blind-spots`: rendered contrast, behavior, layout, runtime class names, files outside include, by-hand rules.

### Next
From .design-system/close.md. Raw values left: 412 across 23 routes (was 1,180). Palette use left: 96 across 12 routes. Deprecated imports left: 96 across 19 routes.
Largest: /settings/billing 61, /dashboard 48. Hand to migrate-design-system with the map and codemod above.
```

The final message is the report's four parts, in this order. The first line is one plain sentence that answers the ask. Then it says which screens changed and which did not, and why. Every count in it comes from `.design-system/close.md` (`coordinator-path.md`, Close), and it names what is still raw instead of saying "every screen". No skill names the person did not use, no process narration and no skill friction. Those stay in this file.

```
The app now looks like one product on a branch you can merge: ds/2026-03-12-build changes 6 of 8 screens to one button, one text color and one field style. /empty and /404 look the same because they held no drifted values. Before and after pictures: .design-system/review/index.html.
Checks: npm run check exit 0 (clean clone). npm run build exit 0, and all 8 routes answer 200 on the production server. Still raw: 23 allowlisted values in the billing and reports pages. The check does not see contrast, focus or layout. The review covered those on /team.
Gates, each already applied on the branch: 14 body grays become one text color (G-01). Sidebar secondary text reuses text.inverse (G-02). Combobox stays apart from Select (G-04).
Next: "Merge ds/2026-03-12-build." To undo one, name it: "Merge ds/2026-03-12-build, but keep the 14 grays separate (reverse G-01)."
```

The message lists the gates that change what a screen shows or does, by default at most 3 so the person reads them all, each with the default the branch applied. The Next prompt clears every open gate at once and never asks for a step the run could have done, such as rerunning a script. Process disputes, such as which record or verifier to trust, stay in the run record. Each claim comes from a command run in this session. A red check is stated, never left out.

## Resuming

A new session or restarted agent reads this file first.

1. Read Frame and Standing orders.
2. Find the last phase marked `done`. Start the next one.
3. After a crash, read the machine again and lower the window first (`design-system-boss/references/delegation.md`, Machine budget), and redo the step that was running in smaller calls.
4. For units in the Ledger that are not verified, check the branch. If the commit moved, rerun its verify commands before trusting the row.
5. Do not redo finished work to feel sure. Recheck, on the real files, the one claim you are about to build on.
