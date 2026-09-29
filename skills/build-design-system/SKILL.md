---
name: build-design-system
description: Use when an ask names one phase of design system work, such as "extract tokens from the app" or "add states and specs to our Button and Dialog", and for an empty repo, such as "start a design system from scratch" or "set up a design system for our new app". A whole-app ask on a shipped app with no named phase, such as "we need a design system" or "make every page consistent", goes to design-system-boss, which calls this skill. Take a whole-app ask directly only when the boss is not installed. Not for moving an app onto a system that already exists, which is migrate-design-system.
---

# Build a design system

This skill turns the UI an app ships into semantic tokens, canonical components, checks, and generated docs with Markdown twins. Then it proves them on one pilot flow against screenshots taken before any edit.

It runs in one of three modes (`references/modes.md`). Build extracts a system from an app that has none. Harden fills the states, specs and checks of a weak component layer. Seed starts a system for a new app. Each mode reads the base reference for the app's foundation (`base-*.md`), which wins over the general references and holds the stack-specific commands.

Every writing run works on a run branch, the one the person named for the work or one cut from HEAD, commits locally, and leaves merging to the person (terms in `references/run-record.md`, Terms). The run applies every decided gate default there, with captures per surface, so Next is a plain merge. Moving screens beyond that needs clearance (`references/coordinator-path.md`). The run never picks a visual direction, publishes or deploys. It runs sibling skills instead of restating them: `token-mapping` for folding values into tokens, `component-docs` for component prose, `design-review` for the pilot.

Success is what the person asked for, in their words, and the first visible change answers that complaint. Every claim that something is fixed, passes or works names the command that proved it this session.

## When a coordinator calls it

A coordinator may hand over the target, pilot, budget, run branch or run record path, and the rest defaults from Inputs. Write gates to the run record instead of asking mid-run, and return the handoff report or the stop shape below. Under a boss, the boss's rules and standing orders govern, and the build seat may be a subagent.

## Done

The phase 1 predicate holds, with every number measured in phase 8: "N canonical components cover M inventoried families, every token has a role, the checks fail on seeded violations and exit 0 on a clean clone, and the pilot matches its baseline except for the listed intended changes." Report a failing part as failing. Never loosen it.

- Every token states its role. A generator run twice leaves no diff.
- Every identical-value swap is made, with `pixdiff.mjs` at tolerance 0 showing 0% per route.
- Build and harden: every inventory row is canonical, merged, deleted, or kept as a product composition.
- Every canonical component the pilot uses has a registry entry and a spec that passes `node scripts/check-spec.mjs docs/system`. Build adds the families the strays touch. Harden and seed list the rest as follow-up, unless the ask wants complete docs (`references/coordinator-path.md`, Document everything).
- `node scripts/gen-docs.mjs --check` exits 0, and the AGENTS.md block names the generated docs and the check command.
- Every check rule failed on its bad fixture and passed on its good one this session. The full check exits 0 on a clean clone, with existing violations in a committed allowlist. The production build passes and every route answers 200 on it. A red check is a failed run.
- Every difference between the pilot's before and after captures traces to a decision or gate. Seed has no before, and says so. Every trap in the pilot's files is fixed or gated with its measurement, and the checks find nothing there.
- Outside the pilot and the system's own files, the run branch holds only identical-value swaps, the root token import, decided gate defaults and cleared surfaces, each surface one commit with a `traces.tsv` row and a montage that exits 0. An unexplained diff stays off the branch and becomes a gate.
- Every gate names its default, and the run branch applies it.
- On a minimal footprint, the repo's own lint, typecheck and build are the check, and the spec, docs and allowlist lines above do not apply.
- The handoff report follows `references/run-record.md`, with every count from `.design-system/close.md`. Build and harden name the migration map, the codemod or why there is none, and counts by route. Harden adds `strays.tsv`. Seed names the next screen.

If it stops, return the condition, finished artifacts, the run record path, and the smallest reply that unblocks it.

## Inputs

A vague request is normal. Fill each row from the repo or its default, and never ask for paths.

| Input | If missing |
|---|---|
| The repo, with write access | Stop. A system built from screenshots has no code to enforce it |
| A way to run the app | Try the `dev` or `start` script. If nothing starts, run phases 3, 4, 5 and 7 from code, skip the pilot and report "code-complete, not runtime-verified" |
| Target app, in a monorepo | Ask once, naming candidates with route counts. Meanwhile run phase 2's read-only scripts on all of them |
| Pilot flow | The screen the complaint names. Otherwise the flow that uses the most families and has a form with an error state. When the ask rules out screens, a pattern page (`references/modes.md`) |
| Budget | Ask once. Then the session the host gives, else the default in `references/coordinator-path.md` (Phase caps) |
| Themes | The ones the app ships, and no new ones |
| Mode and foundation | From the router's triage, else per `references/modes.md`. With nothing to start from, seed on the default foundation there, which gives the team owned component files and one token file in one step |
| Existing tokens or library | Start from it, per the base reference. Names survive unless misused |
| Design spec or brand guidance | Ranked in `references/modes.md`. Each disagreement is a gate |
| AGENTS.md or CLAUDE.md | Their rules win over this file. Record it when there are none |

It needs a shell, git and Node. Without subagents, run the briefs in sequence.

## Procedure

Before phase 1, create the run branch and `.design-system/run.md` per `references/coordinator-path.md`. Each phase ends with its artifact path and a decision row, and stops at its cap. After a crash, read the run record first.

After any shared UI or token edit, load every route with `capture.mjs --status` and require success. Type checks miss runtime breaks between server and client code (`references/browser.md`).

Make and record any decision a reversible change can settle, including fixes to broken behavior and accessibility changes that only add semantics. Removing or restructuring semantics is a gate (`references/traps.md`, Adds-only accessibility changes). So are brand, product vocabulary, visible change on shipped screens and intentional behavior changes. At a cap, cut the HTML docs site, then specs past the pilot's families. Never cut the pilot, the check, the AGENTS.md block or the generated docs.

### 1. Frame

1. Read the agent instructions, manifest, style entry points, theme providers and route tree. Name the mode and foundation, and load the base reference.
2. Write the complaint in the person's words, and the first visible change that answers it. Choose the pilot and themes. The viewports are the narrowest and widest widths the app supports, default 390 and 1280 px (a common phone and laptop).
3. Write the predicate with blanks for counts, and the standing orders, per `references/run-record.md`. Ask the standing questions (`design-system-boss/references/triage.md`) unless a coordinator already did: the person's bans, which go in the standing orders word for word and in the check's `bans` (`references/checks.md`, Bans), and how closely to follow a design source (`references/modes.md`).
4. Set up the repo for the footprint (`references/coordinator-path.md`, Start). On a minimal footprint, copy nothing. Otherwise copy into `scripts/` only what the repo's check runs: `check-system.mjs`, `check-spec.mjs`, `gen-docs.mjs`, `props-table.mjs` and `copy-check.mjs`. Fixtures, capture, pixdiff and montage run from `<skills>/build-design-system/scripts/`. Copy `references/spec-template.md` to `docs/system/`. Run `node scripts/check-system.mjs --init` and read its guesses. Nothing in `package.json` reads from `.design-system/` or a skill folder.
5. Size the fan-out. In a small layer, by default under about 15 component files and one theme, the coordinator writes the components and only specs fan out, because a brief costs more than the code. Otherwise families fan out too, one per worker. Record the Frame and known gates, and start phase 2 without waiting.

### 2. Inventory

1. Run the scripts in `references/inventory.md`.
2. Before any edit, list every route with its states in `.design-system/review/surfaces.tsv` and capture them all with one `capture.mjs --kind before` command (`references/browser.md`). Measure the pilot's traps. Mark unreachable routes unverified.
3. Group components into families and mark duplicates. On a foundation with upstream files, record each file's drift per the base reference. Run the rendered-style pass in `references/traps.md`.
4. Subtract. Plan, validate and delete unused components, CSS and variants in their own commit (`references/inventory.md`, Delete plan).
5. Unless a coordinator already did, start `migrate-design-system` in audit mode, read-only, right after the token commit in phase 3.

### 3. Foundations

1. Follow `references/token-architecture.md`, or the base reference. Record any departure.
2. Cluster raw values by category and role into semantic tokens named by purpose, with surface and foreground pairs. Merges inside `token-mapping`'s tolerances are decisions. Beyond tolerance, open one gate per cluster, default merge, naming the largest shift and the screens it touches. Apply every default in the token files now.
3. Write the generator, if the setup has one.
4. Run `token-mapping` on the full value inventory. Every raw value maps to a role, a merge under a gate, or a listed exception. A repeating value with no role becomes a role.
5. Make every identical-value swap, on every route, with no clearance. Prove each route at 0% with an after capture and `montage.mjs --diff`. Revert a route that changed, and give its values to the migration map.
6. Write the AGENTS.md block (`references/system-structure.md`, Load conditions in AGENTS.md).

### 4. Components

1. Pick each family's canonical implementation by `references/component-contract.md`. When the ask names states, every component gets its missing states, not only the pilot's.
2. Do the most-used family first, end to end, spec included, with its rows from `references/traps.md` and Usage rules by `references/rule-method.md`. It is the pattern the briefs point to.
3. Write its old-to-new map and a codemod. Move one pilot screen by hand, run the codemod on a pristine copy, and fix it until the two diffs match. With no duplicates, skip the codemod and record why.
4. Fan out the other families the pilot and the strays touch with `references/worker-brief.md`, in a rolling window. Review each report as the brief says, and reject any diff outside its scope.
5. Mark replaced implementations deprecated. Never deprecate a stock foundation component, only the wrapper that duplicates it.
6. Close the phase per `references/coordinator-path.md` (Components close).

### 5. Checks

Follow `references/checks.md`. Prove the shipped rules with `check-system.mjs --self-test`, add every other rule a script can see with its fixtures, and record existing violations once with `--init-allowlist`. The check command runs the scan, `check-spec.mjs docs/system`, `gen-docs.mjs --check`, and the repo's typecheck and lint, after any type generation the framework needs. Wire it into CI, confirm from the CI config that a failure fails the build, and run it. It exits 0 before phase 6.

### 6. Pilot, then surfaces

1. Move the rest of the pilot with the codemod, reading every hunk. Move unsupported props by hand.
2. Capture after with the baseline's viewports, themes and data. An untraced difference is a defect.
3. Walk the flow by keyboard, trigger its error and loading states, and recover. Measure every trap in the pilot's files before and after (`references/browser.md`), and fix it or gate it with its measurement.
4. Run `design-review` on the after screenshots. Fix as decisions what existing tokens and components can fix, and broken behavior. The rest are gates. Rerun the review and `check-system.mjs --files` on the pilot's files.
5. Move surfaces one per commit (`references/coordinator-path.md`, Surfaces on the run branch).

### 7. Docs

Docs are generated, never hand-written.

1. Run `component-docs` per component with its code, variants and real uses, to write `docs/system/<component>.md` to the spec template. Write the foundation pages from `references/system-structure.md`, and the writing page by `references/writing-method.md`.
2. Write `docs/system/coverage-gaps.md` from the open gates, each row with its "Meanwhile".
3. Run `node scripts/gen-docs.mjs`, with `--name` on the first run. It writes the twins, the rules page, the index and `llms.txt`.
4. An optional HTML docs site adds `check-docs-leak.mjs` to the check.

### 8. Handoff

1. Rerun the inventory scripts and record what remains by route. Grade each component and fill the predicate's numbers.
2. Close per `references/coordinator-path.md` (Close), with every exit code pasted. Name the coverage gaps the next likely screen hits.
3. Write the handoff report into the run record. Your final message is its four parts (`references/run-record.md`). Next is a merge, or a merge with named reversals, never a step the run could have done.

## Boundaries

Stop and ask only for these:

- No repo access.
- A deletion that touches something another package or a public API exports.
- A step git cannot undo, such as publishing a package or changing a shared remote.

Gate with a default and keep working:

- A brand color, typeface or logo value the code states two ways.
- A name that carries a product word, such as "Plan" or "Workspace".
- A merge or removed variant that changes a shipped screen beyond tolerance.
- A conflict between code and a spec or old docs that no project rule settles.
- A change to a link's color or underline, listing every surface it touches. Links in main content keep a resting cue.
- The footprint, when the repo looks like someone else's or the ask mentions a PR or upstream. Default minimal (`references/coordinator-path.md`).

Hard lines:

- Use only the colors, fonts, shadows, gradients and motion the app already has, or that a design source draws once the person chose to follow it and confirmed the sample (`references/modes.md`).
- The person's bans hold in code, copy, docs, examples and the showcase, except on a `Don't:` line.
- Baselines, fixtures and checks stay as written. Fix the code instead.
- Nothing lands on the branch the run started on, unless the person named it as the run branch. The codemod runs on the pilot, cleared surfaces and wherever a decided gate default reaches. Elsewhere only identical-value swaps land.
- One writer per file. Workers never write the token source, generated files, registry, barrel, migration map, or any foundation config file the base reference names.
- Resetting a customized foundation component to its upstream version is a gate. On a clean-up or drift ask, its default is to revert the drifted upstream lines (base reference).
- Accessibility and contrast results come from rendered output, never from source alone.
