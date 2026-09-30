# Run record

The run record is one Markdown file, `.design-system/run.md`. A reviewer reads the run from it without the transcript, and an agent resumes from it after a crash. It has one writer, the coordinating agent.

Contents

- Terms
- Rules
- File shape
- Frame
- Questions
- Standing orders
- Phases
- Decisions
- Gates
- Ledger
- Handoff report
- Resuming

## Terms

These words mean the same thing in every design.how skill. Other files point here instead of redefining them.

- **`<skills>`.** The folder that holds this skill and its siblings: a project `.agents/skills/` or `.claude/skills/`, or a global install such as `~/.claude/skills/`.
- **Surface.** One route, the shared layout every route renders (named `shared`), or a smaller unit migrate cuts, such as a modal. It is the unit of capture, commit and verdict. The capture list `.design-system/review/surfaces.tsv` names every surface, one row each with the columns `surface`, `route`, `states` and `tier` (`inventory.md`, Baseline screenshots). To capture one surface, copy its row under the header into `.design-system/tmp/<worker id>/<surface>.surfaces.tsv`. Migrate's work list, `.migration/<run>/queue.tsv`, is keyed by the same surface names.
- **Run branch.** `ds/<yyyy-mm-dd>-<route>`, cut from HEAD at the start. Every write lands on it. Nothing commits to the starting branch, and merging is the person's call. When the person names a branch for this work, says "work on my current branch", or created one for it in this session, that branch is the run branch and no other is cut. Record "run branch: <name>, the person's own" as a decision. Commits stay local until the person asks for a push or a PR.
- **Identical-value swap.** A raw literal replaced by a token that holds exactly its value. It needs no clearance. `pixdiff.mjs <before dir> <after dir> --surface <name>` at tolerance 0 proves it at 0% over every width and theme capture of each surface it touches, never `montage.mjs --diff`, which reads the first theme only. A motion value replaced by a preset that resolves to the same value, such as a raw `200ms` by a 200ms preset, is also a swap, proven by matching before and after animation lists taken with reduced motion off (`browser.md`, Measuring motion). A changed motion value is a decision.
- **Decision.** A choice a reversible change settles, made and recorded with its evidence. Fixes to broken behavior, adds-only accessibility changes (`traps.md`) and merges inside tolerance are decisions. Removing or restructuring semantics, brand, product vocabulary, visible change on shipped screens beyond tolerance and intentional behavior changes are gates. A merge past tolerance is a gate whose default is the merge.
- **Gate.** A product or brand choice a person could reasonably answer either way. It carries a default, the run applies that default on the run branch, and the person reverses it by naming it at merge. "Decided" means its default or answer is chosen. Its status in the Gates table is `gate` (waits on the person, nothing applied yet), `todo` (decided, not landed), `default` (the default landed and nobody answered), `done` (the person's answer landed) or `skipped (<reason>)` (not landed). At close no gate is `todo`.
- **Clearance.** The person's go-ahead, within a budget, to migrate surfaces beyond the safe moves (`coordinator-path.md`, Clearance). An ask that names the migration counts, within the session budget: "migrate", "migrate everything", "move every screen", "roll out", "adopt", "use it everywhere", or "every page", "every screen" or "the whole app" with a verb that means change ("clean up every page", "move the whole app onto it"). "Clean the app up", "make it consistent" or "fix it" alone grants none, and neither does a fallback route picked because nothing matched.
- **Status.** Every table these skills write uses one status vocabulary: `todo`, `doing`, `done`, `blocked`, `skipped`, `gate` (waiting on the person) and `default` (a gate's default applied, unanswered). A reason follows in parentheses, as in `skipped (small app)`, `blocked (server down)` or `default (unanswered)`, and `blocked` and `skipped` always carry one. Finding severities are `blocking`, `should-fix` and `note`, ranked in that order as `ui-review` ranks them. `node <skills>/build-design-system/scripts/check-record.mjs` checks the run record's tables, and the TSVs and gate files beside it, against these words and their required columns. Each failure names a `record/<id>` rule, and `--help` lists them.
- **Worker status.** A worker's report opens with `done`, `partial`, `blocked: <reason>` or `failed: <reason>`, in every skill. A sibling's `Status: stopped: <condition>` (token-mapping, component-docs, ui-review) counts as `blocked`.
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

Written in phase 1, with counts filled in after phase 2. The first commit that changes a screen fixes the complaint quoted in the Frame. The values below are one invented example.

```markdown
## Frame
Mode: build. Foundation: raw (base-raw.md)
Run branch: ds/2026-03-12-build, from main at 7dc8f3d. Nothing commits to main. Nothing is pushed. Merging is the person's call.
Bans: "no uppercase labels" (the person, 10:03). Design source: none named. Exemplars: none named.
Target: apps/web (CSS variables in styles/globals.css)
Themes: light, dark (data-theme attribute)
Viewports: 390, 1280 (the app's narrowest and widest supported widths)
Pilot: Invite teammate (Settings > Members > Invite). Uses Button, Input, Select, Dialog, Toast. Has an invalid-email error state.
Workers: 5 docs, 2 code (memory pressure 34% free, backend stopped). 31 component files, 2 themes.
Budget: 2 hours (the default, since nobody named one and the host set no session length), split by the phase caps in coordinator-path.md.
Clearance: yes, the ask "make every page look like one product" counts (coordinator-path.md).
Check command in CI: npm run check (read from .github/workflows/ci.yml)

Done when: 9 canonical components cover 9 of 11 inventoried families (2 are product compositions),
every token has a role, the checks fail on 6 seeded violations and pass on the system and the pilot,
and the pilot matches its baseline except for D-07 and gate G-01.
```

## Questions

The person's words in this session and their saved memory outrank every default in these skills, the branch and push policy included.

The Frame asks the questions below that apply, plus at most one routing or target question, each with its default already applied, in one message. Budget and clearance come back as one reply, `Go, <budget>`. Read-only steps start without waiting. Under design-system-boss, the boss asks them.

Every question goes through the host's question tool when it has one, with at most four options and the recommended one first. The recommended option is the one that changes and exposes the least: no public upload, no push. When nobody answers, because the person is away, the run is headless or it runs as a subagent, the run takes each stated default, records it as `default (unanswered)`, and goes on. It never waits and never stops for a gate. The handoff lists every unanswered default first, so the person can overturn them. Before any public action, check which account it runs as. Every progress update ends with what is running, what is committed and what waits on the person.

- Bans. "Anything you never want to see in the UI, its copy or the docs?" Offer uppercase labels, middle-dot or bullet separators, em dashes, exclamation marks, emoji and gradients, none selected. Record each answer word for word as a standing order and a `rule/ban-<slug>` (`checks.md`, Bans), or "none named". A ban stated later becomes a standing order at once, and the next commit sweeps every file for it.
- Design source, when the person named a design file, brand kit or mockups. "Should the system follow it as reference only, partially, or at pixel fidelity?" The default is reference only (`modes.md`, Following a design source). When the source defines a look the app does not have, the same question asks whether the new look goes in place or in a new folder, and the run follows the answer.
- Exemplars, optional. "Which one to three screens are the best in the app today?" Default: none. Each named screen becomes a Frame row, E1 to E3, and a rule drawn from one cites `exemplar E<n>` (`rule-method.md`, Grounds). With none named, nothing changes.
- The one routing or target question, such as a monorepo target nobody named (list candidates with route counts) or an ask that fits two routes a whole phase apart (default: the route that answers the named complaint).

Send a batch of up to six multiple-choice questions only when the person asks to be asked or the run builds or hardens a system. Each lists the recommended option first, already applied. Ask only what changes files a worker writes: the branch and what besides product code is committed, the primary action color and how much brand color the product carries, the typeface and its license, the icon set, and where the person reviews the system.

## Standing orders

This is the one list for every design.how skill, one rule per line, pasted word for word into every brief and every retry. It holds only what binds every role. The lines for one role, such as a code or spec worker, are in `worker-brief.md` (Orders by role), and `design-system-boss` and `migrate-design-system` add their own lines after it, as bullets. When you catch yourself repeating an instruction to every worker, add it here first. The list's first line is reserved for `STOP: <reason>`, unnumbered, which the coordinator writes to halt every new brief.

```markdown
## Standing orders
1. Write only inside your brief's SCOPE. Your scratch lives only in .design-system/tmp/<your worker id>/, deleted at close. Never read, apply or delete another worker's. Shared files (the token source, generated files, the barrel, registries, indexes, the migration map, the check's config, allowlist and drift list) belong to their one writer, so report the change you need.
2. Use only the colors, fonts, shadows, gradients, motion, logos and product names the app already has, or that the design source the Frame follows draws. The person's bans, quoted below, hold in code, copy, docs, examples and the showcase, except on a Don't: line.
3. Baselines, fixtures and checks stay as written, and so do repo-wide gates (lint flags, CI thresholds, warning limits, project instructions). Fix the code instead.
4. Commit only to the branch your brief names, locally. Never merge, deploy, publish, force-push, stash, reset or clean. No push or PR unless the person asked for one. Leave uncommitted changes and branches you did not create as they are.
5. Put a question in your report as a gate with a default, apply the default, and finish the work. Never wait on an answer.
6. Report with the REPORT block as your final message, as text, status first, commands and exit codes pasted, not summarized. Every claim that something is fixed, passes or works names the command that proved it this session and what that command covers. An audit that does not measure the reported defect is not evidence for it. Write no report file.
7. In a checkout other workers share, make small exact edits that fail when the file changed since you read it. Never rewrite a file whole, and never revert or tidy a change you did not make.
8. Start no agents unless your brief names you a coordinator, apart from the two fresh agents a two-agent test needs. A coordinator that is itself a subagent runs its workers as foreground calls and never returns while one runs.
```

## Phases

One row per phase, updated in place.

```markdown
| Phase | Status | Artifact | Notes |
|---|---|---|---|
| 1 Frame | done | run.md#frame | complaint: "the invite form loses what I typed" |
| 2 Inventory | done | inventory/, review/ before captures, delete commit a1b2c3d | 2 routes need auth, unverified |
| 3 Foundations | done | tokens/, mapping-report.md, pixdiff per route, AGENTS.md block | 31 identical swaps on 7 routes at 0% |
| 4 Components | doing | components, specs, registry.json, migration map, codemod | 6 of 9 families verified |
| 5 Checks | todo | | |
| 6 Pilot, then surfaces | todo | | |
| 7 Docs | todo | | |
| 8 Handoff | todo | | |
```

Status words follow Terms (Status). A phase that failed is `blocked (<what failed>)`. A skipped phase keeps its row.

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
| ID | Question | Default | Status | Commit | From |
|---|---|---|---|---|---|
| G-01 | Merge 14 body-text grays into text.default (#171717)? Largest shift #111 to #171717, on 3 screens. Reversing keeps the old values as listed exceptions | merge | default (unanswered) | 3c4d5e6 | token-mapping |
| G-02 | Sidebar secondary text: reuse text.inverse, or add text.inverse.subtle and point 4 call sites at it? | reuse text.inverse | done | 3c4d5e6 | G-sidebar-01 |
| G-04 | Merge Combobox into Select with a `searchable` prop? Changes the settings timezone picker, 7 call sites | keep both | done | | D-combobox-02 |
```

The columns are the same in every design.how skill. From names the worker, sibling or record that proposed the gate. Commit is the commit that applied the default, empty until then. Status follows Terms (Gate).

The run applies every gate's default in the tokens and code on the run branch, not only in this table. A merge default means the merged values are gone from the token files. If no default is safe, the question belongs under Stop and ask in the skill, and the run stops.

Bug fixes, implementation notes and per-site cleanups are decisions, not gates. When open gates pile up past what a person can answer in one sitting, default 8, merge them by theme.

## Ledger

One row per unit of work that needs a verdict: each family, the delete change, the generator, each check, the pilot, each surface.

```markdown
| Unit | Owner | Branch | Commit | Status | Verdict | Evidence |
|---|---|---|---|---|---|---|
| family:button | coordinator | ds/2026-03-12-build | 4f5e6d7 | done | verified | .design-system/evidence/button/ |
| family:select | worker-2 | ds/2026-03-12-build-select, merged | 8a9b0c1 | done | verified with gaps | gap: no indeterminate example |
| pilot:invite | coordinator | ds/2026-03-12-build | 6a7b8c9 | doing | failed | 2 unintended diffs at 390 dark |
| surface:/login | coordinator | ds/2026-03-12-build | 9d8e7f6 | done | verified | review/login-*.png, traces.tsv row G-01 |
```

Status follows Terms (Status). Verdicts are `verified`, `verified with gaps` and `failed`. A new commit on the branch voids the row until it is checked again.

## Handoff report

The final section. The run record keeps the full report. The final message is shorter and follows its own template, below it.

```markdown
## Handoff report

### Summary
Asked: "people hardcode colors everywhere". Answered: 14 of 16 raw color lines now read tokens (8 identical-value swaps, 6 merges under G-01).
Predicate: met on all four parts (components 9 of 11 families, token roles, checks 6/6, pilot except D-07 and G-01).

### Gates, unanswered first
G-01 default (unanswered), merge. G-02 done, reuse text.inverse. G-04 done, keep both, so nothing lands.

### Checks
npm run check → exit 0 on a clean clone (allowlist: 212 entries in 23 files, scripts/check-allowlist.json; ratchet: scripts/check-ratchet.json)
node <skills>/build-design-system/scripts/montage.mjs --diff → exit 0, 8 surfaces: 3 changed (traced to D-07 and G-01), 5 unchanged
Pilot traps: trap/loading-layout-shift, Send invite 101x36 idle and pending (evidence/button/loading-box.txt)
CI: tier 1 on every pull request, tier 2 nightly (checks.md, CI tiers), in .github/workflows/ci.yml

### Screens
Changed on ds/2026-03-12-build: /login (G-01), /settings/billing (G-02), /team (pilot). Unchanged: /empty and /404, which held no drifted values, and /reports, which the budget did not reach. Review page: .design-system/review/index.html.

### What exists
- Token source tokens/, generated styles/tokens.css (npm run tokens)
- Components components/ui/, registry.json, specs docs/system/, changelog docs/system/changelog.md
- Twins, rules and llms.txt in public/ (scripts/gen-docs.mjs), checks in npm run check
- AGENTS.md block and generated index, codemod scripts/codemod-system.mjs, migration map .design-system/migration-map.json

### Readiness
| Component | Grade | Reason |
|---|---|---|
| Button | ready | |
| Select | ready with gaps | no indeterminate example |
| Combobox | ready with gaps | kept apart from Select (G-04), no async example |

### Next screen
The next likely screen is the project list. It hits two coverage gaps: tables (Meanwhile: a divided list, as /settings) and bulk actions (Meanwhile: none selected hides the bar).

### Trial
One fresh agent, given only the repo on a throwaway branch and the AGENTS.md block, built the project list. Check: npm run check exit 0. ui-review: 1 Blocking (row actions unreachable by keyboard). Twins opened: button.md, table-gap row. Gaps it named: tables, bulk actions.

### The check cannot see
Copied from `node scripts/check-system.mjs --list-blind-spots`: rendered contrast, behavior, layout, runtime class names, files outside include, by-hand rules.

### Next
From .design-system/close.md. Raw values left: 412 across 23 routes (was 1,180). Palette use left: 96 across 12 routes. Deprecated imports left: 96 across 19 routes.
Largest: /settings/billing 61, /dashboard 48. The migration of those 23 routes is not run. Hand it to migrate-design-system with the map and codemod above.

### Found, not fixed
| ID | Severity | Route | What | Why not fixed | Fix |
|---|---|---|---|---|---|
| F-01 | blocking | /projects | Row actions unreachable by keyboard | out of scope | A focusable button per row action |
| G-06 | should-fix | /reports | Table has no empty, loading or error state | gate | Build them on the next surface that lists records |
| F-02 | should-fix | /settings/billing | 61 raw values | no clearance | Migrate the route with the map and codemod |
| F-03 | note | shared | Tabs, Tooltip and Avatar have no spec | out of scope | component-docs per family |
Rows past 30: none (.design-system/found-not-fixed.tsv)
```

The Found, not fixed table is the one format every design.how skill uses for what a run found and left, so other files cite it instead of keeping their own follow-up lists. It collects every phase, review, lens and the trial:

- `ID`: the gate id when there is one, else `F-NN`.
- `Severity`: `blocking`, `should-fix` or `note` (Terms, Status). Rows sort by severity, then `high` tier routes first.
- `Route`: the route, or `shared`.
- `Why not fixed`: `no clearance`, `gate` or `out of scope`.
- `Fix`: the change that would close it, in one line.

At most 30 rows. The rest go to `.design-system/found-not-fixed.tsv` with the same columns, and the last line names the file and how many rows it holds.

The final message follows, in this order. The first line is one plain sentence that answers the ask. Then it says which screens changed and which did not, and why. Then the checks, the gates with every unanswered default first, and Next. It ends with the Found, not fixed table. Every count in it comes from `.design-system/close.md` (`coordinator-path.md`, Close), and it names what is still raw instead of saying "every screen". No skill names the person did not use, no process narration and no complaints about the tools or skills. Those stay in this file.

```
The app now looks like one product on a branch you can merge: ds/2026-03-12-build changes 6 of 8 screens to one button, one text color and one field style. /empty and /404 look the same because they held no drifted values. Before and after pictures: .design-system/review/index.html.
Checks: npm run check exit 0 (clean clone). npm run build exit 0, and all 8 routes answer 200 on the production server. Still raw: 23 allowlisted values in the billing and reports pages. The check does not see contrast, focus or layout. The review covered those on /team.
Unanswered, so applied as defaults: 14 body grays become one text color (G-01). As you chose: sidebar secondary text reuses text.inverse (G-02), and Combobox stays apart from Select (G-04).
Next: "Merge ds/2026-03-12-build." To undo one, name it: "Merge ds/2026-03-12-build, but keep the 14 grays separate (reverse G-01)." To move the other 23 routes too (412 raw values), reply "Go, <budget>".
Found, not fixed: <the handoff's table, 4 rows, 1 blocking>
```

The Trial runs once at handoff: a fresh agent gets only the repo and the AGENTS.md block and builds the named next screen on a throwaway branch. Record its check findings, its `ui-review` Blocking count, which twins it opened and which coverage gaps it named. A trial that fails the check or opens no twin is a finding for the handoff.

A run that built the system as a separate layer, in a new folder, adds `### Adoption blockers` before Next: providers not mounted at the root, product imports of the new layer (zero is a blocker), duplicate toast regions, and overlay layering against the legacy layer, each with its file.

The message lists the gates that change what a screen shows or does, unanswered defaults first, by default at most 3 so the person reads them all, each with the default the branch applied. The Next prompt clears every open gate at once and never asks for a step the run could have done, such as rerunning a script. When the run had no clearance, Next offers the migration with its size. Process disputes, such as which record or verifier to trust, stay in the run record. Each claim comes from a command run in this session. A red check is stated, never left out.

## Resuming

A new session or restarted agent reads this file first.

1. Read Frame and Standing orders.
2. Find the last phase marked `done`. Start the next one.
3. After a crash, read the machine again and lower the window first (`coordinator-path.md`, Machine budget), and redo the step that was running in smaller calls.
4. For units in the Ledger that are not verified, check the branch. If the commit moved, rerun its verify commands before trusting the row.
5. Don't rerun a step marked done. Recheck only the claim the next step uses.
