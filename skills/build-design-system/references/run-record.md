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
- Write as you go. Each decision gets a row when it is made, not at the end.
- Rows point at evidence: a file path, a command and its output, a screenshot path. A row without evidence is a claim.
- Update rows in place. The Phases and Ledger tables show current state. Decisions and Gates only ever grow.
- Commit it with the work, so the history and the reasons sit together.

## File shape

```markdown
# Design system build: <app name>

## Frame
## Standing orders
## Phases
## Decisions
## Gates
## Ledger
## Handoff
```

## Frame

Written in phase 1, with the counts filled in after phase 2.

```markdown
## Frame
Target: apps/web (Next.js 16, Tailwind v4, CSS variables in app/globals.css)
Themes: light, dark (data-theme attribute)
Viewports: 390, 1280
Pilot: Invite teammate (Settings > Members > Invite). Uses Button, Input, Select, Dialog, Toast. Has an invalid-email error state.
Workers: yes, up to 4 in flight. 31 component files, 2 themes.
Budget: one working session (default, nobody named one). Stop spawning at 70%.
Check command in CI: npm run check (read from .github/workflows/ci.yml)

Done when: 9 canonical components cover 9 of 11 inventoried families (2 are product compositions),
every token has a role, the checks fail on 6 seeded violations and pass on the system and the pilot,
and the pilot matches its baseline except for D-07 and gate G-01.
```

## Standing orders

Numbered lines, one rule each. Pasted word for word into every worker brief. When you find yourself repeating an instruction to a worker, add it here first.

```markdown
## Standing orders
1. Write only inside your brief's SCOPE.
2. Tokens, generated files, the barrel, registry.json and the migration map belong to the coordinator.
3. No new colors, fonts, shadows, gradients or motion.
4. Never edit a baseline, fixture or check to make it pass.
5. Examples use inert data. No requests on mount.
6. Report with the REPORT block, commands pasted, not summarized.
```

## Phases

One row per phase, updated in place.

```markdown
| Phase | State | Artifact | Notes |
|---|---|---|---|
| 1 Frame | done | run.md#frame | |
| 2 Inventory | done | inventory/, baseline/, delete commit a1b2c3d | 2 routes need auth, unverified |
| 3 Foundations | done | tokens/, tokens.css, theme.css, mapping-report.md | |
| 4 Components | in progress | registry.json | 6 of 9 families verified |
| 5 Docs | not started | | |
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

A decision that changes a shipped screen beyond tolerance is a gate, not a decision row. Reference the gate id here once it is settled.

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

Every gate has a default. If no default is safe, the row belongs under Stop and ask in the skill, and the run stops.

## Ledger

One row per unit of work that needs a verdict: each component family, the delete change, the generator, each check, the pilot.

```markdown
| Unit | Owner | Branch | Commit | Verdict | Evidence |
|---|---|---|---|---|---|
| family:button | coordinator | ds/button | 4f5e6d7 | verified | .design-system/evidence/button/ |
| family:select | worker-2 | ds/select | 8a9b0c1 | verified with gaps | gap: no indeterminate example |
| check:raw-values | coordinator | ds/checks | 2d3e4f5 | verified | fixtures fail 6/6, pass 6/6 |
| pilot:invite | coordinator | ds/pilot | 6a7b8c9 | failed | 2 unintended diffs at 390 dark |
```

Verdicts are `verified`, `verified with gaps`, `failed` and `blocked`. A new commit on the branch voids the row until it is checked again.

## Handoff report

The final section, returned to the user as the run's result. It has the five parts named in `SKILL.md`.

```markdown
## Handoff

### Summary
Predicate: 9 canonical components cover 9 of 11 families (met). Every token has a role (met).
Checks fail 6/6 seeded, pass on system and pilot (met). Pilot matches baseline except D-07 and G-01 (met).

### What exists
Token source tokens/ · generated app/tokens.css, app/theme.css (npm run tokens) · components components/ui/ ·
registry.json · docs /system · llms.txt · checks scripts/check-system.mjs (in npm run check) ·
codemod scripts/codemod-system.mjs · migration map .design-system/migration-map.json

### Readiness
| Component | Grade | Reason |
|---|---|---|
| Button | ready | |
| Select | ready with gaps | no indeterminate example |
| Combobox | blocked | G-04 decides whether it merges into Select |

### Gates
G-01 open, default merge. G-02 open, default reuse text.inverse. G-03 open, default keep. G-04 open, default keep both.

### Next
Raw values left: 412 across 23 routes (was 1,180). Deprecated imports left: 96 across 19 routes.
Largest routes: /settings/billing 61, /dashboard 48. Hand to migrate-design-system with the map and codemod above.
```

## Resuming

A new session or a restarted agent reads this file first.

1. Read Frame and Standing orders.
2. Find the last phase marked `done`. Start the next one.
3. For units in the Ledger that are not verified, check the branch. If the commit moved, rerun its verify commands before trusting the row.
4. Do not redo finished work to feel sure. Recheck the one claim you are about to build on, on the real files.
