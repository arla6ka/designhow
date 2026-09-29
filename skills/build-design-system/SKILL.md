---
name: build-design-system
description: Use when an ask names one phase of design system work, such as "extract tokens from the app", "break down all our screens into components" or "add states and specs to our Button and Dialog", and for an empty repo, such as "start a design system from scratch" or "set up a design system for our new app". A whole-app ask on a shipped app with no named phase, such as "we need a design system", "our UI is a mess, fix it" or "make every page consistent", goes to design-system-boss, which calls this skill. Take a whole-app ask directly only when the boss is not installed. Not for moving an app onto a system that already exists, which is migrate-design-system.
---

# Build a design system

The app ships UI with no shared system, or one nobody follows. This skill turns what ships into semantic tokens, canonical components, checks, and generated docs with Markdown twins, then proves them on one pilot flow against screenshots taken before any edit.

It runs in one of three modes, picked with `references/modes.md`. **Build** extracts a system from an app that has none. **Harden** fills the states, specs and checks of a weak component layer and lists the stray code. **Seed** starts a system for a new app from brand material or shadcn defaults. Each mode reads the base reference for the app's foundation (`base-*.md`), which wins over the general references.

Every writing run works on its own branch, `ds/<yyyy-mm-dd>-<route>`, cut from HEAD. Merging is always the person's call. On that branch the run applies every decided gate default, codemods on non-pilot screens and color moves included, each surface with before and after captures, so Next is a plain merge. Moving screens beyond decided defaults needs clearance (`references/coordinator-path.md`). It never picks a visual direction on its own, publishes or deploys. It runs sibling skills instead of restating them: `token-mapping` for folding values into tokens, `component-docs` for each component's prose, and `design-review` for the pilot. Each returns text the run saves.

Success is what the person asked for, in their words, and the first visible change answers that complaint. The final message says which screens changed and which did not, takes every count from one file, `.design-system/close.md`, and names what is still raw. Every claim that something is fixed, passes or works names the command that proved it this session.

## When a coordinator calls it

A coordinator may hand over the target, pilot, budget, run branch or run record path, and the rest defaults from Inputs. Write gates to the run record instead of asking mid-run. Return the handoff report, or the stop shape below, as your final message. Under a boss, the boss's rules and standing orders govern, and the build seat may be a subagent.

## Done

One list for every mode. The phase 1 predicate holds, with every number measured in phase 8: "N canonical components cover M inventoried families, every token has a role, the checks fail on seeded violations and exit 0 on a clean clone, and the pilot matches its baseline except for the listed intended changes." Report a failing part as failing, never loosen it.

- Every token states its role, per `references/token-architecture.md` or the base reference. A generator run twice leaves no diff.
- Every raw literal whose token holds exactly its value is swapped, with `pixdiff.mjs` at tolerance 0 showing 0% per route.
- Build and harden: every inventory row is canonical, merged, deleted, or kept as a product composition.
- Every canonical component the pilot uses has a spec that passes `node scripts/check-spec.mjs docs/system` and a registry entry. Build adds the families the strays touch. Harden and seed stop at the pilot's families and list the rest as follow-up. An ask for complete docs specs every family (`references/coordinator-path.md`, Document everything).
- `node scripts/gen-docs.mjs --check` exits 0: twins with generated Props tables, the rules page, `llms.txt` and the index. The AGENTS.md block names them and the check command.
- Every check rule failed on its bad fixture and passed on its good one this session. The full check exits 0 on a clean clone, with existing violations in a committed allowlist, the production build passes, and every route answers 200. A red check is a failed run.
- The pilot has before and after captures at the same viewports, themes and data, and every difference traces to a decision or gate row. Seed has no before, and says so. Every trap in the pilot's own files is fixed, or gated with its measurement. The checks find nothing in the pilot's files.
- Outside the pilot and the system's own files, the run branch holds only identical-value swaps, the root layout's token import, decided gate defaults and cleared surfaces. Each surface is one commit with captures, a committed `traces.tsv` row and a montage that exits 0. An unexplained diff stays off the branch and becomes a gate.
- Every gate names its default, and the tokens and code on the run branch apply it. Brand values, product words in names, and visible changes beyond tolerance are always gates.
- On a minimal footprint, the repo's own lint, typecheck and build are the check, and the spec, docs and allowlist lines above do not apply.
- The handoff report follows `references/run-record.md`. Build and harden name the next step with the migration map, the codemod command or why there is none, and counts by route. Harden adds `strays.tsv`. Seed names the next screen.

If it stops, return the condition, every finished artifact, the run record path, and the smallest reply that unblocks it.

## Inputs

A vague request is the normal case. Fill each row below from the repo or its default, and never ask for exact paths.

| Input | If missing |
|---|---|
| The repo, with write access | Stop. A system built from screenshots has no code to enforce it |
| A way to run the app | Find the `dev` or `start` script and try it. If nothing starts, run phases 3, 4, 5 and 7 from code, skip the pilot and report "code-complete, not runtime-verified" |
| Target app, in a monorepo | Ask once, naming candidates with route counts. Meanwhile run only phase 2's read-only scripts, on all of them |
| Pilot flow | The screen the person's complaint names. Otherwise the flow that uses the most inventoried families and has a form with an error state. When the ask rules out screens, a pattern page under /system (`references/modes.md`) |
| Budget | Ask once. With no answer, the session the host gives, else 2 hours, split by the phase caps in `references/coordinator-path.md`, and 4 workers in flight |
| Themes | The ones the app ships, and no new ones. Seed keeps the preset's, with dark wired to the OS |
| Mode and foundation | From the router's triage. Otherwise read the repo per `references/modes.md`. With nothing to start from, seed on shadcn and Tailwind v4 |
| Existing tokens, theme config or component library | Start from it, per the base reference. Names survive unless the inventory shows them misused |
| Design spec or brand guidance | Ranked in `references/modes.md`. Each disagreement is a gate. Brand values stay as the code has them |
| AGENTS.md or CLAUDE.md | Record that none were found. Their rules win over this file |

It needs a shell, git and Node. Screenshots come from `capture.mjs` (`references/browser.md`). Without subagents, run the briefs in sequence.

## Procedure

Follow `references/coordinator-path.md`: create the run branch, then `.design-system/run.md` from `references/run-record.md`, before phase 1. Each phase ends with its artifact path and a decision row, and stops at its cap. After a crash, read the run record first.

After any ui or token edit, run `capture.mjs --status`, since tsc misses server and client breaks (`references/browser.md`).

Make and record any decision a reversible change can settle. A fix to broken behavior is a decision, and so is an accessibility change that only adds semantics. One that removes, renames or restructures them is a gate (`references/traps.md`, Adds-only accessibility changes). Brand, product vocabulary, visible change on shipped screens and intentional behavior changes become gates, and the run applies each default on the run branch. At a cap, cut the HTML docs site, then specs past the pilot's families. Never cut the pilot, the check, the AGENTS.md block or the generated docs.

### 1. Frame

1. Read AGENTS.md, CLAUDE.md, the manifest, CSS entry points, theme providers and route tree. Name the mode and the foundation, and load the base reference. On shadcn, save `shadcn info --json`.
2. Write the person's complaint in their words, and the first visible change that answers it. Choose the pilot, viewports (default 390 and 1280 px) and themes.
3. Write the predicate with blanks for counts, and the standing orders, one list, per `references/run-record.md`.
4. Set up the repo for the footprint (`references/coordinator-path.md`, Start). On a minimal footprint, copy nothing and use `.git/info/exclude` instead of `.gitignore`. Otherwise copy only what the repo's check runs into `scripts/`: `check-system.mjs`, `check-spec.mjs`, `gen-docs.mjs`, `props-table.mjs` and `copy-check.mjs`. Fixtures, capture, pixdiff and montage stay in `<skills>/build-design-system/scripts/` (`<skills>` is `.agents/skills/` or `.claude/skills/`). Copy `references/spec-template.md` to `docs/system/spec-template.md`. Gitignore `.design-system/review/**/*.png` and `.design-system/tmp/`. The review folder's TSVs, reports and `index.html` are committed records. Run `node scripts/check-system.mjs --init` and read its guesses. Nothing in `package.json` reads from `.design-system/` or a skill folder.
5. Size the run with one fan-out rule. Under about 15 component files and one theme, the coordinator writes the components and only specs fan out, one per worker. Otherwise families fan out too, one per worker. Write the Frame and the known gates into the run record, and go on to phase 2 without waiting.

### 2. Inventory

1. Run the scripts in `references/inventory.md`. Save them under `.design-system/scripts/` for phase 8.
2. Before any edit, list every route in `.design-system/review/surfaces.tsv` with its states, and capture them all with one `capture.mjs --kind before` command, per `references/browser.md`. Measure the pilot's traps. Mark unreachable routes unverified.
3. Group components into families by name, root element and props. Mark duplicates. On shadcn or a library, record each ui file's drift in `scripts/ui-drift.tsv` per the base reference. Run the rendered-style pass in `references/traps.md`.
4. Subtract. List zero-import components no other package exports, unused CSS and dead variants in `.design-system/delete-plan.md` with evidence. Rerun the search, then delete in its own commit.
5. Unless a coordinator already did, start `migrate-design-system` in audit mode, read-only, right after the token commit in phase 3.

### 3. Foundations

1. Follow `references/token-architecture.md`, or where the base reference says tokens live. Record any departure.
2. Cluster raw values by category and role. Write semantic tokens named by purpose, with surface and foreground pairs. Merges inside `token-mapping`'s tolerances are decisions. Beyond tolerance, one gate per cluster with merging as default, naming the largest shift and the screens it touches. Apply every default in the token files now.
3. Write the generator, if the setup has one. Mark generated files in their first line.
4. Run `token-mapping` on the full value inventory as the coverage check. Every raw value maps to a role, a merge under a gate, or a listed exception. A repeating value with no role becomes a role.
5. Swap every raw literal whose token holds exactly its value, on every route, with no clearance. Prove each route at 0% with an after capture and `montage.mjs --diff`. Revert a route that changed, and give its values to the migration map.
6. Write the AGENTS.md block from "Load conditions in AGENTS.md" in `references/system-structure.md`, naming the token file, `/llms.txt`, the rules page and the check command.

### 4. Components

1. Pick each family's canonical implementation by `references/component-contract.md`, on native elements or the behavior library already installed. When the ask names states, every component gets its missing states, not only the pilot's.
2. Do the most-used family first, end to end, including its spec from `docs/system/spec-template.md`, with the family's rows from `references/traps.md` and Usage rules by `references/rule-method.md`. It is the pattern the briefs point to.
3. Write its old-to-new map and a codemod. Move one pilot screen by hand, run the codemod on a pristine copy, and fix it until the diffs match on imports, tags and props. With no duplicates, skip the codemod and record why.
4. Fan out the other families the pilot and the strays touch, per the rule in phase 1, with `references/worker-brief.md`, in a rolling window.
5. Review each report as the brief says, rerunning its verify commands. Reject any diff outside its scope.
6. Mark replaced implementations deprecated. Their callers move on the pilot, cleared surfaces and where a decided default reaches. Never deprecate a stock primitive, only the wrapper that duplicates it.
7. Close the phase only when every family in scope has its missing states built or gated, and every removed prop has a gate (`references/coordinator-path.md`, Components close).

### 5. Checks

Follow `references/checks.md`. `scripts/check-system.mjs` ships the standard rules, and `--self-test --fixtures <skills>/build-design-system/scripts/fixtures/check-system` proves them. Add every other rule a script can see under its `trap/` or `rule/` ID, with its fixtures in the repo. Record existing violations once with `--init-allowlist`. The check command runs the scan, `check-spec.mjs docs/system` and `gen-docs.mjs --check`, plus the repo's typecheck and lint, with `next typegen` before `tsc` on Next 16. Wire it into CI, confirm from the CI config that a failure fails the build, and run it. It exits 0 before phase 6.

### 6. Pilot, then surfaces

1. Move the rest of the pilot onto the system with the codemod, reading every hunk. Move unsupported props by hand.
2. Capture after with the baseline's viewports, themes and data. An untraced difference is a defect.
3. Walk the flow by keyboard, trigger its error and loading states, and recover. Measure every trap in the pilot's own files before and after, per `references/browser.md`, and fix it or gate it with its measurement.
4. Run `design-review` on the after screenshots. What the existing tokens and components can fix, and broken behavior, is fixed as a decision. The rest are gates. Rerun the review and `check-system.mjs --files` on the pilot's files.
5. Move surfaces on the run branch per "Surfaces on the run branch" in `references/coordinator-path.md`, one surface per commit.

### 7. Docs

Docs are generated, never hand-written.

1. Run `component-docs` per component with its code, variants and real uses, to write `docs/system/<component>.md` to the spec template. The spec's Props section holds notes only. Write the foundation pages the tokens need, from `references/system-structure.md`, and the writing page by `references/writing-method.md`.
2. Write `docs/system/coverage-gaps.md` from the open gates, each row with its "Meanwhile".
3. Run `node scripts/gen-docs.mjs`, with `--name` on the first run. It writes the twins, the rules page, the index and `llms.txt`, and saves its flags so `--check` agrees.
4. An HTML docs site is optional. When one exists, copy `check-docs-leak.mjs` into `scripts/` and the check.

### 8. Handoff

1. Rerun the inventory scripts, and record what remains by route. Grade each component ready, ready with gaps, or blocked. Fill the predicate's numbers.
2. Run the full check on a clean clone, the production build, and `capture.mjs --status` against the production server, and paste each exit code. `check-spec.mjs` fails a spec whose props went stale. Name the coverage gaps the next likely screen hits.
3. Write `.design-system/close.md` from `check-system.mjs --left` and the montage's output (`references/coordinator-path.md`). Then write the handoff report into the run record. Your final message is its four parts, per `references/run-record.md`. Next is a merge, or a merge with named reversals, never a step the run could have done.

## Boundaries

Stop and ask only for these:

- No repo access.
- A deletion that touches something another package or a public API exports.
- A step version control cannot undo, such as publishing a package or changing a shared remote.

Gate with a default and keep working:

- A brand color, typeface or logo value the code states two ways.
- A name that carries a product word, such as "Plan" or "Workspace".
- A merge or removed variant that changes a shipped screen beyond tolerance.
- A conflict between code and a spec or old docs that no project rule settles.
- A change to a link's color or text-decoration, listing every surface it touches. Links in main content keep a resting cue, color or underline.
- The footprint, when the repo looks like someone else's or the ask mentions a PR or upstream. Default minimal (`references/coordinator-path.md`).

Hard lines:

- Use only the colors, fonts, shadows, gradients and motion the app already has.
- Baselines, fixtures and checks stay as written. Fix the code instead.
- Nothing lands on the branch the run started on. On the run branch, the codemod runs on the pilot, on cleared surfaces and wherever a decided gate default reaches. Elsewhere only identical-value swaps land.
- One writer per file. Workers never write the token source, generated files, registry, barrel or migration map. On shadcn, add `components.json` and the `tailwindCss` file to that list.
- `shadcn add --overwrite`, or any reset of a customized component to upstream, is a gate. On a clean-up or drift ask its default is to revert drifted upstream lines (`references/base-shadcn.md`).
- Accessibility and contrast results come from rendered output, never from source alone.
