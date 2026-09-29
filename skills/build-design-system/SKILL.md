---
name: build-design-system
description: Use when an ask names one phase of design system work, such as "extract tokens from the app" or "add states and specs to our Button", or for an empty repo, such as "start a design system from scratch". A whole-app ask on a shipped app ("we need a design system") goes to design-system-boss when it is installed. Moving an app onto an existing system is migrate-design-system.
---

# Build a design system

This skill turns the UI an app ships into semantic tokens, canonical components, checks and generated docs with Markdown twins, then proves them on one pilot flow against screenshots taken before any edit. It runs in build, harden or seed mode (`references/modes.md`), and the base reference for the app's foundation (`references/base-*.md`) wins over the general references. It calls `token-mapping`, `component-docs` and `design-review` instead of restating them.

Every write lands on the run branch (`references/run-record.md`, Terms). The run never picks a visual direction, publishes or deploys.

## When a coordinator calls it

A coordinator may hand over the target, pilot, budget, run branch or run record path, and the rest defaults from Inputs. Write gates to the run record instead of asking, and return the handoff report or the stop shape. Start the reply with the status line, then `Commit: <run branch head>`. Under design-system-boss, the boss's rules and caps govern.

## Done

The phase 1 predicate holds, with every number measured in phase 8: "N canonical components cover M inventoried families, every token has a role, the checks fail on seeded violations and exit 0 on a clean clone, and the pilot matches its baseline except for the listed intended changes." Report a failing part as failing. Never loosen it.

- Every token states its role, and every identical-value swap is made and proven (`references/run-record.md`, Terms).
- Every canonical component the pilot uses has a registry entry and a spec that passes `node scripts/check-spec.mjs docs/system`, with 0 plain entries skipped among registry components.
- The full check exits 0 on a clean clone, every rule was seen failing its bad fixture this session, and every route answers 200 on the production build.
- Every difference in the pilot's captures, and every commit outside the pilot, traces to a decision or gate.
- The handoff report follows `references/run-record.md` (Handoff report), with every count from `.design-system/close.md`.

The rest of Done, per mode and footprint, is in `references/coordinator-path.md` (Close). If it stops, return the condition, finished artifacts, the run record path and the smallest reply that unblocks it.

## Inputs

A vague request is normal. Fill each row from the repo or its default, and never ask for paths.

| Input | If missing |
|---|---|
| The repo, with write access | Stop. A system built from screenshots has no code to enforce it |
| A way to run the app | Try the `dev` or `start` script. If nothing starts, run phases 3, 4, 5 and 7 from code, skip the pilot and report "code-complete, not runtime-verified" |
| Target app, in a monorepo | The Frame's one target question (`references/run-record.md`, Questions). Meanwhile run phase 2's read-only scripts on every candidate |
| Pilot flow | The screen the complaint names, else the flow that uses the most families and has a form with an error state, else a pattern page (`references/modes.md`) |
| Budget | The Frame's "Go, <budget>" reply, else the host's session, else `references/coordinator-path.md` (Phase caps) |
| Themes | The ones the app ships, and no new ones |
| Mode and foundation | From the router's triage, else `references/modes.md` |
| Existing tokens, library, design spec or brand | Start from it per the base reference and `references/modes.md` (What decides a question) |
| AGENTS.md or CLAUDE.md | Their rules win over this file |

It needs a shell, git and Node. Without subagents, run the briefs in sequence.

## Procedure

Before phase 1, create the run branch and `.design-system/run.md` (`references/coordinator-path.md`, Start). Each phase ends with its artifact path and a decision row, and stops at its cap. After a crash, read the run record first. After any shared UI or token edit, `capture.mjs --status` must show every route loading (`references/browser.md`). Decisions and gates sort by `references/run-record.md` (Terms), and cuts at a cap by `references/coordinator-path.md` (Phase caps).

### 1. Frame

1. Read the agent instructions, manifest, style entry points, theme providers and route tree. Name the mode and foundation, and load the base reference. Done when the Frame names both.
2. Write the complaint in the person's words and the first visible change that answers it. Choose the pilot and themes. The viewports are the narrowest and widest widths the app supports, default 390 and 1280 px, a common phone and laptop.
3. Write the predicate with blanks for counts and the standing orders, and ask the questions (`references/run-record.md`, Frame and Questions) unless a coordinator did.
4. Set up the repo for the footprint (`references/coordinator-path.md`, Start). Done when `node scripts/check-system.mjs --init` ran and its guesses are read, or on a minimal footprint when nothing was copied.
5. Settle `references/coordinator-path.md` (Lock before fan-out) and size the fan-out (`references/worker-brief.md`, When to delegate). Start phase 2 without waiting.

### 2. Inventory

1. Run the scripts in `references/inventory.md`.
2. Before any edit, list every route with its states in `.design-system/review/surfaces.tsv` and capture them with one `capture.mjs --kind before` command (`references/browser.md`). Record the animation lists of surfaces that animate (`references/browser.md`, Measuring motion). Measure the pilot's traps. Mark unreachable routes unverified.
3. Group components into families and mark duplicates. On a foundation with upstream files, record each file's drift per the base reference. Run the rendered-style pass in `references/traps.md`.
4. Plan, validate and delete unused components, CSS and variants in their own commit (`references/inventory.md`, Delete plan).
5. Unless a coordinator already did, start `migrate-design-system` in audit mode, read-only, right after the token commit in phase 3.

### 3. Foundations

1. Follow `references/token-architecture.md`, or the base reference. Record any departure.
2. Cluster raw values by category and role into semantic tokens named by purpose, with surface and foreground pairs. Merges inside `token-mapping`'s tolerances are decisions. Beyond tolerance, open one gate per cluster, default merge, naming the largest shift and the screens it touches. Apply every default in the token files now.
3. Write the generator, if the setup has one.
4. Run `token-mapping` on the full value inventory. Done when every raw value maps to a role, a merge under a gate, or a listed exception.
5. Make every identical-value swap on every route, each proven as `references/run-record.md` (Terms) defines. Revert a route that changed, and give its values to the migration map.
6. Write the AGENTS.md block (`references/system-structure.md`, Load conditions in AGENTS.md).
7. Name the motion presets (`references/token-architecture.md`) and the icon sizes per control size. When the person reviews in a browser, start the live showcase shell (`references/system-structure.md`, Live showcase).

### 4. Components

1. Pick each family's canonical implementation by `references/component-contract.md`. When the ask names states, every component gets its missing states.
2. Do the most-used family first, end to end in one commit: component, tests, showcase page and spec, with its trap rows and Usage rules by `references/rule-method.md`. Show its page to the person before fan-out. It is the exemplar every brief points to.
3. Write its old-to-new map and a codemod. Move one pilot screen by hand, run the codemod on a pristine copy, and fix it until the two diffs match. With no duplicates, skip the codemod and record why.
4. Fan out the other families the pilot and the strays touch with `references/worker-brief.md`. Reject any diff outside a brief's scope.
5. Mark replaced implementations deprecated. Never deprecate a stock foundation component, only the wrapper that duplicates it.
6. Close the phase per `references/coordinator-path.md` (Components close).

### 5. Checks

Follow `references/checks.md`. The check exits 0 before phase 6. Prove the shipped rules with `node scripts/check-system.mjs --self-test --fixtures <skills>/build-design-system/fixtures/check-system`.

### 6. Pilot, then surfaces

1. Move the rest of the pilot with the codemod, reading every hunk. Move unsupported props by hand.
2. Capture after with the baseline's viewports, themes and data. An untraced difference is a defect.
3. Walk the flow by keyboard, trigger its error and loading states, and recover. Measure every trap in the pilot's files before and after (`references/browser.md`), and fix it or gate it with its measurement.
4. Run `design-review` on the after screenshots. Fix as decisions what existing tokens and components can fix, and broken behavior. The rest are gates. Done when the rerun review and `check-system.mjs --files` on the pilot's files are clean.
5. Move surfaces one per commit (`references/coordinator-path.md`, Surfaces on the run branch).

### 7. Docs

Docs are generated, never hand-written.

1. Run `component-docs` for any canonical component still without a spec. Write the foundation pages from `references/system-structure.md` and the writing page by `references/writing-method.md`.
2. Document the shared state patterns, in every mode: loading, error, empty, no permission and partial failure, each with its width, component and state order. Each rests on app evidence or is a `docs/system/coverage-gaps.md` row with its Meanwhile, beside a row for every other open gate.
3. Run `node scripts/gen-docs.mjs`, with `--name` on the first run. Once `docs/system/writing.md` exists, add `node scripts/copy-check.mjs` to the check command. An HTML docs site adds `check-docs-leak.mjs`.
4. Review, decide, fix (`references/coordinator-path.md`), then regenerate.

### 8. Handoff

1. Rerun the inventory scripts and record what remains by route. Grade each component and fill the predicate's numbers.
2. On a full footprint, write the project skills (`references/system-structure.md`, Load conditions in AGENTS.md).
3. Run the fresh-agent trial (`references/run-record.md`, Handoff report).
4. Close per `references/coordinator-path.md` (Close). Done when the handoff report is in the run record and the final message follows `references/run-record.md`.

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
- The codemod runs on the pilot, cleared surfaces and wherever a decided gate default reaches. Elsewhere only identical-value swaps land.
- Accessibility and contrast results come from rendered output, never from source alone.
