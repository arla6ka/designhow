---
name: build-design-system
description: Use when someone wants a design system made from an app that already ships UI, such as "build a design system", "break down all our screens into components", "extract tokens from the app", "consolidate our components", or agents keep guessing at styles. Not for moving an app onto a system that already exists, which is migrate-design-system.
---

# Build a design system

The app ships UI with no shared system, or with one nobody follows. Think three buttons, forty grays, and a token file half the code ignores. This skill turns what ships into semantic tokens, canonical components, docs pages with Markdown twins, and checks, then proves them on one pilot flow against screenshots taken before any edit.

It stops at the pilot. Moving the rest of the app is `migrate-design-system`, which reads the handoff this skill writes. It never picks a new visual direction, publishes a package or deploys. It runs three sibling skills instead of restating them: `token-mapping` for folding values into tokens, `component-docs` for each component's prose, and `design-review` for the pilot.

## When a coordinator calls it

A coordinator, such as a router skill, may hand over the target, pilot, budget or run record path. Use what it gives and default the rest from Inputs. Write gates to the run record instead of asking mid-run. End by returning the handoff report, or the stop shape below, as your final message, since the coordinator reads nothing else.

## Done

Done means the predicate written in phase 1 holds, with every number measured in phase 8. It reads like this. "N canonical components cover M inventoried families, every token has a role, the checks fail on seeded violations and pass on the system and the pilot, and the pilot matches its baseline except for the listed intended changes." Loosening it to finish is a failure, so report a failing part as failing.

- Every token has a `$type`, and every semantic token states its role in `$description`. The generator run twice leaves no diff.
- Every row in the component inventory is canonical, merged, deleted, or kept as a product composition.
- Every canonical component has a page with the nine sections of `references/system-structure.md` in order, a Markdown twin and a registry entry, and all three resolve. Every link in `llms.txt` loads.
- Every check rule failed on its bad fixture and passed on its good one in this session, and runs from the command CI runs.
- The pilot has before and after screenshots at the same viewports, themes and data. Every difference traces to a decision or gate row. `design-review` has no Blocking findings, and the checks find nothing in its files.
- Outside the pilot, the docs and the system's own folders, no import changed.
- Every gate names its default and the change that reverses it. Brand values, product words in names, and visible changes beyond tolerance are always gates.
- The handoff report follows `references/run-record.md` and names `migrate-design-system` as next, with the migration map, the codemod command and counts by route.

If it stops, return the condition that stopped it, every finished artifact (the inventory is useful alone), the run record path, and the smallest reply that unblocks it, such as "Give the command that starts the app locally."

## Inputs

A vague request is the normal case. "Break down all the screens and build us a design system" is enough to start. Fill each row below from the repo or its default, and never ask for exact paths.

| Input | If missing |
|---|---|
| The repo, with write access | Stop. A system built from screenshots has no code to enforce it |
| A way to run the app | Find the `dev` or `start` script, the README, a Procfile or compose file, and try it. If nothing starts, build phases 3 to 6 from code, mark visual claims unverified, stop before the pilot and report "code-complete, not runtime-verified" |
| Target app, in a monorepo | Ask once, naming candidates with route counts. Run phase 2's read-only scripts across all of them meanwhile. Write nothing outside `.design-system/` until someone answers |
| Pilot flow | The flow that uses the most inventoried families and has a form with an error state |
| Budget | Ask once. With no answer, one working session and 4 workers in flight |
| Themes | The ones the app ships, and no new ones |
| Existing tokens, theme config or component library | Start from it. Existing names survive unless the inventory shows them misused |
| Design spec | A second source. Code wins for what ships. Each disagreement is a gate |
| Brand guidance | Keep the brand values in the code exactly |
| AGENTS.md or CLAUDE.md | Record that none were found. Their rules win over this file |

It needs file access and a shell. A headless browser takes screenshots. If the browser is listed but fails, name the failing call and treat it as no way to run the app. Subagents or background tasks let the phase 2 screen notes and phase 4 fan out. Without them, run the same briefs in sequence.

## Procedure

Create `.design-system/run.md` from `references/run-record.md` before phase 1. Each phase ends by writing its artifact path and a decision row there. After a crash or in a new session, read it first and continue from the last finished phase.

Make and record any decision a reversible change can settle. Brand, product vocabulary and visible change on shipped screens become gates with a default, and work goes on around them.

### 1. Frame

1. Read AGENTS.md, CLAUDE.md, the manifest, lockfile, CSS entry points, theme providers and route tree. Note framework, styling method, icon set and check command.
2. Choose the pilot, viewports (default 390 and 1280 px) and themes.
3. Write the predicate with blanks for counts, and the standing orders every brief carries: forbidden paths, the verify command, no new colors or fonts.
4. Size the run. Under about 15 component files and one theme, do phase 4 alone. Otherwise set the in-flight cap from the budget.
5. Send one Frame message with the target, pilot, budget and run command you chose, plus a question for any row with no safe default. Go on to phase 2 without waiting.

Artifact: the Frame section of the run record.

### 2. Inventory

1. Run the scripts in `references/inventory.md` for routes, component definitions and imports, raw values, existing tokens, fonts and icons. Scripts count. You read the tables. Save the scripts under `.design-system/scripts/` for phase 8.
2. Capture baselines of the pilot and every reachable route at each viewport and theme, before any edit. Wait for fonts. Mask clocks, avatars and random data. Mark unreachable routes unverified.
3. Group components into families by name, root element and props. Mark duplicates.
   If the person asked for subagents per screen, they help here. Give each read-only worker a group of routes, their baselines and the component table. Each writes `.design-system/inventory/screens/<route>.md`: families on each screen, one-off compositions, and repeated layouts that could become patterns. Counts stay with the scripts.
4. Once the target is settled, subtract. List zero-import components that no other package exports, unused CSS and dead variants in `.design-system/delete-plan.md` with evidence. Rerun the search, then delete, as its own change.

Artifact: inventory tables, the baseline folder, screen notes if any, and the deletion change.

### 3. Foundations

1. Follow `references/token-architecture.md`: three layers in DTCG JSON, generating CSS custom properties and, on Tailwind v4, `@theme`. Record any departure.
2. Cluster raw values by category and role. Propose semantic tokens named by purpose, with surface and foreground pairs.
3. Run `token-mapping` with the full value inventory. A gap becomes a role if it repeats or would change globally, otherwise an exception. Ambiguous rows become gates.
4. Merges inside `token-mapping`'s tolerances are decisions. Beyond tolerance, one gate per cluster with merging as default. Every color merge is a gate. State the largest shift and the screens it touches.
5. Write the generator. Run it twice with no diff. Mark generated files in their first line.

Artifact: token source, generated files, the `token-mapping` report and the generate command.

### 4. Components

1. Pick each family's canonical implementation by `references/component-contract.md`. Build on native elements or the behavior library already installed.
2. Do the most-used family yourself, end to end. It is the pattern the briefs point to.
3. Write its old-to-new map and a codemod. Move its uses on one pilot screen by hand, run the codemod on the untouched screen, and fix the codemod until the two diffs match.
4. Fan out the other families, one per worker, with `references/worker-brief.md`, in a rolling window up to the cap. At about 70% of the budget, stop spawning. You alone write the token source, generated files, barrel, registry and migration map.
5. Review each report as the brief says. Rerun its verify commands yourself. Reject any diff outside its scope.
6. Mark replaced implementations deprecated. Leave their callers outside the pilot alone.

Artifact: canonical components, `registry.json`, the migration map and the codemod.

### 5. Docs

1. Build the structure in `references/system-structure.md`, modeled on Vercel's Geist: an overview, foundation pages, a brand page, and one page per canonical component in the nine fixed sections. Add pattern pages only for compositions that repeat.
2. Run `component-docs` per component with its code, variant list and two real uses. Render the entry beside live examples that import the real component.
3. Generate every Markdown twin and `llms.txt` from the same source as the pages. Point AGENTS.md at `llms.txt` in one line.
4. Add the docs checks from `references/system-structure.md`.

Artifact: docs routes, twins, `llms.txt` and the check output.

### 6. Enforcement

1. Turn every rule a script can test into a check: raw values outside the token source, unknown token references, new imports of deprecated components, docs drift, hand edits to generated files.
2. Give each rule a failing and a passing fixture. Run both.
3. Existing violations outside the pilot go in a counted allowlist that may shrink and never grow.
4. Wire the checks into the CI command, and read the CI config to confirm a failure fails the build.

Artifact: check scripts, fixtures, the allowlist and the CI line.

### 7. Pilot

1. Move the rest of the pilot onto the system with the codemod. Read every hunk. Move props the map lists as unsupported by hand.
2. Capture after screenshots with the baseline's viewports, themes and data. A difference that traces to no decision or gate is a defect, fixed at its owner, usually a token or component.
3. Walk the flow by keyboard, trigger its error state, and recover.
4. Run `design-review` on the after screenshots. Fix Blocking findings and rerun.
5. Run the checks on the pilot's files.

Artifact: before and after pairs, the review and the check output.

### 8. Handoff

1. Rerun the inventory scripts. Record remaining raw values and deprecated imports by route.
2. Grade each component ready, ready with gaps, or blocked.
3. Fill the predicate's numbers.
4. Write the handoff report into the run record and return it.

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

Hard lines:

- Use only the colors, fonts, shadows, gradients and motion the app already has. A reference system's values are never the product's.
- Baselines, fixtures and checks stay as written. Fix the code instead.
- The codemod runs on the pilot only.
- One writer per file. Workers never write the token source, registry or barrel.
- Accessibility and contrast results come from rendered output, never from source alone.
- Claim a check blocks merges only after reading the CI config.
