# Run record

> For the team setting this up: the run record is one Markdown file kept in the repo at `.design-system/run.md`. It is how a reviewer reads the run without the transcript, and how an agent resumes after a crash or a new session. Rename the path if you like. Keep one writer, the coordinating agent.

Contents

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

## Rules

- One writer. The coordinator writes this file. Workers report and the coordinator records.
- One ID sequence. Workers name what they propose with their family or surface as prefix, such as `D-button-01` or `G-billing-01`, because parallel workers would all pick `D-01`. The coordinator gives each the next free `D-NN` or `G-NN` when it adds the row, and puts the worker's ID in Evidence.
- Write as you go. Each decision gets a row when it is made, not at the end.
- Rows point at evidence: a file path, a command and its output, a screenshot path. A row without evidence is a claim.
- Update rows in place. The Phases and Ledger tables show current state. Decisions and Gates only ever grow.
- Commit it with the work, so the history and the reasons sit together. On a minimal footprint it stays untracked, listed in `.git/info/exclude` (`coordinator-path.md`, Start).

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

Written in phase 1, with the counts filled in after phase 2.

```markdown
## Frame
Mode: build. Foundation: raw (base-raw.md)
Run branch: ds/2026-09-28-build, from main at 7dc8f3d. Nothing commits to main. Merging is the person's call.
Target: apps/web (Next.js 16, Tailwind v4, CSS variables in app/globals.css)
Themes: light, dark (data-theme attribute)
Viewports: 390, 1280
Pilot: Invite teammate (Settings > Members > Invite). Uses Button, Input, Select, Dialog, Toast. Has an invalid-email error state.
Workers: yes, up to 4 in flight. 31 component files, 2 themes.
Budget: 2 hours (default: nobody named one and the host set no session length), split by the phase caps in coordinator-path.md. Stop spawning at 70%.
Clearance: yes, the ask "make every page look like one product" counts (coordinator-path.md). Surfaces move one per commit.
Check command in CI: npm run check (read from .github/workflows/ci.yml)

Done when: 9 canonical components cover 9 of 11 inventoried families (2 are product compositions),
every token has a role, the checks fail on 6 seeded violations and pass on the system and the pilot,
and the pilot matches its baseline except for D-07 and gate G-01.
```

## Standing orders

One list per run, numbered, one rule each, pasted word for word into every brief and every retry. Under design-system-boss, the boss's list is the list. Copy it here and add the build lines below it with the next numbers. Running directly, use this one. When you find yourself repeating an instruction to a worker, add it here first.

```markdown
## Standing orders
1. Write only inside your brief's SCOPE.
2. Tokens, generated files, the barrel, registry.json, the migration map and the check's config, allowlist and drift list belong to the coordinator. Report allowlist shrink candidates; never edit the allowlist.
3. Use only the colors, fonts, shadows, gradients and motion the app already has.
4. Baselines, fixtures and checks stay as written. Fix the code instead.
5. Examples use inert data. No requests on mount.
6. Report with the REPORT block, commands and exit codes pasted, not summarized.
7. Return your report as your final message, as text. Write no report file, and never write into a coordinator file.
8. Browser commands use absolute paths and your own --session name, spelled out on every line.
9. Commit only to the run branch, never to the branch the run started on.
10. Swap a raw literal for a token of exactly the same value on any route once pixdiff at tolerance 0 shows 0% for that route. Decided gate defaults land wherever they reach. Other changes outside the pilot land only on cleared surfaces. Each is one surface per commit, with before and after captures in .design-system/review/ (images gitignored, traces.tsv and reports committed) and a traces.tsv row.
11. What the team needs after the run (scripts, config, specs, generated docs) goes in the repo, never only in .design-system/ or a skill folder.
```

## Phases

One row per phase, updated in place.

```markdown
| Phase | State | Artifact | Notes |
|---|---|---|---|
| 1 Frame | done | run.md#frame | complaint: "the invite form loses what I typed" |
| 2 Inventory | done | inventory/, review/ before captures, delete commit a1b2c3d, migrate audit started | 2 routes need auth, unverified |
| 3 Foundations | done | tokens/, tokens.css, theme.css, mapping-report.md, pixdiff per route, AGENTS.md block | 31 identical swaps on 7 routes at 0% |
| 4 Components | in progress | components, specs, registry.json, migration map, codemod | 6 of 9 families verified |
| 5 Checks | not started | check scripts, fixtures, allowlist, CI line | |
| 6 Pilot, then surfaces | not started | before and after pairs, evidence/, review, check output, review/index.html | |
| 7 Docs | not started | docs/system/, public/system/ twins, llms.txt, coverage-gaps.md | |
| 8 Handoff | not started | inventory/after/, handoff below | |
```

States are `not started`, `in progress`, `done`, `skipped: <reason>` and `failed: <reason>`. A skipped phase stays in the table.

## Decisions

Append-only. One row per decision a reviewer might question.

```markdown
| ID | Phase | Decision | Why | Evidence | Reversible |
|---|---|---|---|---|---|
| D-03 | 3 | Spacing values of 14, 15 and 17px map to space.inset.md (16px) | Same role, all within the 2px tolerance | mapping-report.md rows 40-52 | yes |
| D-07 | 3 | Input radius 6px to 8px (radius.control) | Two input families used 6 and 8, inside the 2px tolerance. 8 has 41 of 52 call sites | values.tsv, components.tsv | yes |
| D-09 | 4 | Canonical Button is components/ui/Button.tsx | Native button, 88 call sites, already forwards ref | ranking in D-09a | yes |
```

A decision that changes a shipped screen beyond tolerance is a gate, not a decision row. Reference the gate id here once it is settled. A fix to broken behavior, such as Cancel submitting a form, is a decision. An intentional change to what a screen does is a gate. Accessibility-tree changes sort by `traps.md` (Adds-only accessibility changes).

## Gates

Append-only. Each gate is a question for a person, with the default the run applied so work could continue.

```markdown
| ID | Question | Options | Default applied | Reverses by | Status |
|---|---|---|---|---|---|
| G-01 | Merge 14 body-text grays into text.default (#171717)? Largest shift #111 to #171717, on 3 screens | merge, keep separate | merge | Keep the old values as listed exceptions | open |
| G-02 | Sidebar secondary text: reuse text.inverse or add text.inverse.subtle? | reuse, add | reuse text.inverse | Add the token and point 4 call sites at it | open |
| G-03 | Rename "Workspace switcher" to a generic "Account menu"? | keep, rename | keep | Rename in registry and docs | open |
| G-04 | Merge Combobox into Select with a `searchable` prop? Changes the settings timezone picker | merge, keep both | keep both | Merge and run the codemod on 7 call sites | open |
```

Every gate has a default, and the run applies it in the tokens and code on the run branch, not only in this table. The person reverses a gate by naming it when they merge. A merge default means the merged values are gone from the token files. If no default is safe, the row belongs under Stop and ask in the skill, and the run stops.

A gate is a product or brand choice a person could reasonably answer either way. Bug fixes, implementation notes and per-site cleanups are decisions, not gates. More than 8 open gates means merge them by theme.

## Ledger

One row per unit of work that needs a verdict: each component family, the delete change, the generator, each check, the pilot.

```markdown
| Unit | Owner | Branch | Commit | Verdict | Evidence |
|---|---|---|---|---|---|
| family:button | coordinator | ds/2026-09-28-build | 4f5e6d7 | verified | .design-system/evidence/button/ |
| family:select | worker-2 | ds/2026-09-28-build-select, merged into the run branch | 8a9b0c1 | verified with gaps | gap: no indeterminate example |
| check:raw-values | coordinator | ds/2026-09-28-build | 2d3e4f5 | verified | fixtures fail 6/6, pass 6/6 |
| pilot:invite | coordinator | ds/2026-09-28-build | 6a7b8c9 | failed | 2 unintended diffs at 390 dark |
| surface:/login | coordinator | ds/2026-09-28-build | 9d8e7f6 | verified | review/login-*.png, traces.tsv row G-01 |
```

Verdicts are `verified`, `verified with gaps`, `failed` and `blocked`. A new commit on the branch voids the row until it is checked again.

## Handoff report

The final section. The run record keeps the full report. The final message returned to the person or coordinator is shorter and follows its own template, below it.

```markdown
## Handoff report

### Summary
Asked: "people hardcode colors everywhere". Answered: 14 of 16 raw color lines now read tokens (8 identical-value swaps, 6 merges under G-01).
Predicate: 9 canonical components cover 9 of 11 families (met). Every token has a role (met).
Checks fail 6/6 seeded, pass on system and pilot, exit 0 on a clean clone (met). Pilot matches baseline except D-07 and G-01 (met).

### Checks
npm run check → exit 0 on a clean clone (allowlist: 212 entries in 23 files, scripts/check-allowlist.json)
node <skills>/build-design-system/scripts/montage.mjs --diff → exit 0, 8 surfaces: 3 changed (traced to D-07 and G-01), 5 unchanged
Pilot traps: trap/loading-layout-shift Send invite 101x36 idle, 101x36 pending (evidence/button/loading-box.txt)

### Screens
Changed on ds/2026-09-28-build: /login (G-01), /settings/billing (G-03), /team (pilot). Unchanged: /empty and /404, which held no drifted values, and /reports, which the budget did not reach. Review page: .design-system/review/index.html.

### What exists
Token source tokens/ · generated app/tokens.css, app/theme.css (npm run tokens) · components components/ui/ ·
registry.json · specs docs/system/ · twins, rules, index public/system/ and public/llms.txt (scripts/gen-docs.mjs) ·
checks scripts/check-system.mjs, check-spec.mjs (in npm run check) · AGENTS.md block ·
codemod scripts/codemod-system.mjs · migration map .design-system/migration-map.json

### Readiness
| Component | Grade | Reason |
|---|---|---|
| Button | ready | |
| Select | ready with gaps | no indeterminate example |
| Combobox | blocked | G-04 decides whether it merges into Select |

Follow-up, no spec yet: Tabs, Tooltip, Avatar.

Families with missing states at inventory: Button (built), Table (empty, loading, error: G-06), Card (no removed props).

### Gates
G-01 open, default merge. G-02 open, default reuse text.inverse. G-03 open, default keep. G-04 open, default keep both.

### Next screen
The next likely screen is the project list. It hits two coverage gaps: tables (Meanwhile: divide-y list, as /settings) and bulk actions (Meanwhile: none selected hides the bar).

### The check cannot see
Copied from `node scripts/check-system.mjs --list-blind-spots`: rendered contrast, behavior, layout, overrides on unregistered components or built at runtime, runtime class names, bg-white where the theme has no role for it, files outside include, stale role comments, by-hand rules.

### Next
From .design-system/close.md. Raw values left: 412 across 23 routes (was 1,180). Palette use left: 96 across 12 routes. Deprecated imports left: 96 across 19 routes.
Largest routes: /settings/billing 61, /dashboard 48. Hand to migrate-design-system with the map and codemod above.
```

The final message is the report's four parts, in this order. The first line is one plain sentence that answers the ask. Then it says which screens changed and which did not, and why. Every count in it, such as what is left or allowlisted, comes from one file, `.design-system/close.md` (`coordinator-path.md`, Close), and it names what is still raw instead of saying "every screen". No skill names the person did not use, no process narration and no skill friction. Those stay in this file.

```
The app now looks like one product on a branch you can merge: ds/2026-09-28-build changes 6 of 8 screens to one button, one text color and one field style. /empty and /404 look the same because they held no drifted values. Before and after pictures: .design-system/review/index.html.
Checks: npm run check exit 0 (clean clone). npm run build exit 0, and all 8 routes answer 200 on the production server. Still raw: 23 allowlisted values in app/billing/page.tsx and app/reports/page.tsx. The check does not see contrast, focus or layout; the review covered those on /team.
Gates, each already applied on the branch: 14 body grays become one text color (G-01). Sidebar secondary text reuses text.inverse (G-02). Combobox stays apart from Select (G-04).
Next: "Merge ds/2026-09-28-build." To undo one, name it: "Merge ds/2026-09-28-build, but keep the 14 grays separate (reverse G-01)."
```

The gates are the ones that change what a screen shows or does, at most 3, each with the default the branch applied. The Next prompt clears every open gate at once and never asks for a step the run could have done, such as re-pinning a plan or rerunning a script. It carries no process dispute, such as which record or verifier to trust. That goes in the run record. Each claim comes from a command run in this session. A red check is stated, never left out.

## Resuming

A new session or a restarted agent reads this file first.

1. Read Frame and Standing orders.
2. Find the last phase marked `done`. Start the next one.
3. For units in the Ledger that are not verified, check the branch. If the commit moved, rerun its verify commands before trusting the row.
4. Do not redo finished work to feel sure. Recheck the one claim you are about to build on, on the real files.
