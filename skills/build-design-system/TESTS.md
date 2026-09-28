# Tests: build a design system

Run these by hand on a real repo, or on a small fixture app built to carry the traps below. A full run takes hours, so most cases stop after the phase they test. Nothing here runs automatically.

## Setup under test

A result only means something next to the setup that produced it. Record this before every run.

- `SKILL.md`, every file in `references/` (`coordinator-path.md` first), and every script in `scripts/`: `check-system.mjs` with `fixtures/check-system/`, `probe.mjs` with `fixtures/probe/`, `capture.mjs`, `gen-docs.mjs`, `props-table.mjs`, `montage.mjs`, `check-docs-leak.mjs`, `check-spec.mjs` and `pixdiff.mjs`
- Mode (build, harden, seed) and foundation (shadcn, library, team package, raw)
- Sibling skills installed: `token-mapping`, `component-docs`, `design-review`, or which were missing
- Project instructions: AGENTS.md or CLAUDE.md loaded or not, and any precedence rule for tokens
- Repo and commit, framework, styling method
- Run command or preview URL, and whether it worked
- Browser for screenshots: agent-browser, Playwright or none, and whether it could open the app
- Subagents or background tasks: available or not, and how many ran at once
- Model for the coordinator, and for workers if different

Five lab fixtures recur below. **messy-raw** is hand-rolled UI with no token file, hundreds of raw colors and several button implementations. **shadcn-drift** is shadcn with drifted ui files, a legacy modal and button, and palette classes in product code. **weak-system** has a `src/ui` layer with thin states that many screens skip. **greenfield** is an empty repo. **oss** is a 57-route open-source app the person does not own.

## Which cases apply

| Case | Applies | Reason |
|---|---|---|
| Normal | Yes | Checks every phase leaves its artifact and the predicate is measured |
| Vague request | Yes | Most people start with one loose sentence, and the skill must trigger and pick defaults instead of asking for paths |
| Called by a coordinator | When a router skill is installed | The caller reads only the final message, so questions asked mid-run go nowhere |
| Missing required input | Yes | Without a way to run the app, the visual phases cannot be verified |
| Conflicting sources | Yes | Token values often live in two places, and a spec may disagree with code |
| Tool failure | Yes | The browser or an inventory tool can be listed and still fail partway |
| Ambiguous judgement | Yes | Names and merges are calls a person should confirm, and blocking on them stalls the run |
| Worker scope | When subagents are available | Two writers on a shared file is the failure delegation invites |
| Enforcement proves itself | Yes | A check that never failed has not been shown to work |
| Scope creep | Yes | "Just migrate everything" is the most common way this run turns into a different job |
| Docs skeleton | Yes | Pages that drift from the shared section order break `component-docs` and the migration's docs check |
| Spec check proves itself | Yes | A spec with a blank state row or an open precedence must fail |
| Harden mode | Weak systems | The usual shadcn app, where components exist and states and rules do not |
| Seed mode | New apps | Brand values must stay gates |
| shadcn tokens stay put | shadcn apps | A generator that owns shadcn's CSS variables breaks every later `add` |
| Library foundation | Library apps | The theme object is the token source |
| Derived rules | Yes | Visual rules must come from the app's evidence, not a reference system's taste |
| Answers the complaint | Yes | Runs have built docs and left the named problem on screen |
| Check exits 0 and catches new drift | Yes | Runs have handed off a red check, and a folder glob let raw hex through |
| Measured traps | Yes | A loading width was claimed fixed and measured 97 to 114px |
| Final message | Yes | The person reads only this, often in the morning |
| Coordinator seat | When a router skill is installed | Build and the boss disagreed on who writes the first family |
| Docs examples isolated | When an HTML docs site exists | Docs heading styles leaked into live examples |
| Scripts prove themselves | Yes | Runs wrote the check, the docs generator and the leak check by hand, and missed multi-line tags and links styled as buttons |
| Repo works after the run | Yes | A check that read `.design-system/` and the skill folder broke once they were gone |
| Docs never cut | Yes | The docs site was cut for budget in 3 of 4 build runs |
| Run branch | Every writing run | Round 3 runs left every screen byte-identical because nothing could land without a person awake |
| Screens change when the ask is about screens | Looks and adoption asks | "Make it look like one thing" and "nobody uses it" failed check A in two rounds |
| Fixtures do not compile | Yes | Copied fixtures broke `tsc` in four runs |
| Phase caps | Yes | The minutes formula said 139 minutes for a run that took 22 |
| Check sees the drift sources | Yes | Re-planting the shadcn-drift bugs passed the round 3 check |
| Props tables generated | Yes | Specs promised generated Props tables and nothing generated them |
| States and seed refinements | Harden asks that name states, seed | Round 3 fixed states on the pilot only, dropped focus on loading, and missed non-text contrast and 44px targets |
| Routing against the boss | When design-system-boss is installed | Both skills claimed "set up a design system" |
| Decided defaults land | Every writing run | Round 4 left codemods and color moves for a non-pilot screen in the Next prompt |
| Semantics that only add | Every writing run | build and migrate disagreed on accessibility-tree changes five times |
| Routes answer 200 | Any ui or token edit | A shared Button edit made / answer 500 while tsc passed |
| Close numbers from one file | Every final message | Two allowlist numbers and an "every screen" line in one close |
| Check init and upstream lines | Every check setup | `--init` wrote `nativeControls: {}`, and base-nova's own literals failed a customized file |
| Captures in one command | Any run with a browser | Shell-variable rules made hundreds of agent-browser lines, and pixdiff needed PW_CHROMIUM by hand |
| Montage shows behavior | Any run that changes a screen | Save greyed out and a notice dropped to 4.56:1 with no line in the review |
| Spec-only fan-out | Under about 15 component files | Spec workers got the family brief and needed a mix of two templates |
| Small footprint | Every run, and repos the person does not own | One OSS run added 327 files and 8.9 MB of PNGs |
| Scripts run from outside the app | Every run with workers | The migration inventory, run from outside the app, printed "0 0 0 0" for a surface that still had 17 imports and 205 raw values |
| Identical swaps at tolerance 0 | Every token swap | pixdiff summed the channels, so `#6b7280` to `#737373` showed "0% no change" |
| Measured layout traps | Any run with a browser | Button labels wrapped at 390 and a panel fill matched the page, and nothing measured either |
| Nested links and buttons | Every check setup | `<Link><Button>` was left to a gate instead of a check with a default fix |
| Seed montage | New apps | The montage exited 1 on "missing before" in an app with no before |
| Allowlist pruned at close | Every run with an allowlist | Entries outlived their fixes, so the fixed literal could come back unflagged |
| Review records travel | Every full-footprint run | The final message linked `review/index.html` and `traces.tsv`, and both were gitignored |
| New states and the shared shell | Any run that adds states or edits the layout | The montage could not show a state with no before, and a nav edit needed a copied trace row on every route |
| Every family leaves with states or a gate | Harden and build | Table states and a Card prop built in one run silently dropped in the next |
| Loading label and component overrides | Every check setup | `{saving ? "Saving…" : "Save"}` and `<Card style={{ padding: 0 }}>` passed the check in the next-screen test |
| Narrow, overlay and motion traps | Any run with a browser | The nav hid Settings at 390, a table hid a column, a dialog did not scroll at 390x320, and motion ran under reduced motion, all unmeasured |
| Coordinator owns the allowlist | Runs with parallel workers | Workers edited the allowlist at once and its counts drifted from 39 to 31 |
| Specs stay fresh | Every run with specs | A Notice spec said 1 call site at a HEAD with 3, and `check-spec` passed |
| Seed dark, stock decisions, gap rows | Seed | A dark OS got the light page, the person got about 17 gates for stock values, and a gaps row stopped the next screen from adding a dialog |
| Montage warnings on open gates | Any run that changes a screen | A run closed with the montage at exit 1 on a contrast finding a sibling had already gated, and no rule said whether the run failed |
| Literal colors and unbound labels | Every check setup | `bg-white` in a drifted Dialog and two `<Label>`s with no `htmlFor` passed the check, and the run found them by hand |
| Values default and review fixes | Values asks, runs with design-review | Success and warning colors defaulted to "keep raw", and a 390 overflow the review named went to follow-ups |
| Rem lengths and shared overflow | Every check setup, harden | A planted `1.25rem` passed the check, and page overflow at 390 in the shared layout waited on a gate |

## Done means

- Each phase has a row in the run record with an artifact path.
- Inventory counts came from saved scripts, and the same scripts ran again at handoff.
- Baseline screenshots exist from before the first edit, and nobody edited them.
- Every token states its role, in `$description` or a role comment in the lighter setup. A generator run twice gives no diff.
- The full check exits 0 at handoff, and the final message pastes the command and exit code.
- Every inventory row has a disposition. Every canonical component has a page, a twin and a registry entry that resolve.
- Every check rule failed on its bad fixture and passed on its good one, in this session.
- The pilot's visual differences each trace to a decision or gate row.
- Left to a person: each gate, each with a default applied.
- Every decided gate default is applied on the run branch, so Next is a merge.
- After each ui or token edit, and at close on the production server, every route answered 200.
- Every count in the final message appears in `.design-system/close.md`.

## Baseline

First, run the task with the skill switched off. Give the model the same repo and this prompt:

```
Build a design system for this app.
```

| Case | What happened with no skill |
|---|---|
| Normal | |

Watch for a token file written before any inventory, a palette or type scale borrowed from a popular system, new colors that appear nowhere in the app, component counts made by reading files instead of running a search, no screenshots before the first edit, every screen migrated at once, docs written by hand beside the component instead of generated, and "the system is ready" with no check that was ever seen failing. Until this row is filled in, you do not know whether the skill helps.

## Normal case

**Input:** a Next.js or Vite app with about 20 routes, three button implementations (one a `div` with `onClick`), two input components with 6px and 8px radius, about 40 distinct text grays, one hand-written CSS variables file that half the code ignores, light and dark themes, and an invite form with an invalid-email state. The run command works and a browser is connected.

**Expect:** the run record exists before any edit. Inventory TSVs come from scripts saved under `.design-system/scripts/`. Baselines cover every reachable route at two widths and both themes and were captured twice with no diff. The `div` button loses the canonical pick with the reason recorded. Grays collapse into a few semantic roles. Merges inside tolerance are decisions, the rest are one gate per cluster with merging as the default, and the token files already hold only the merged values. A generator produces CSS variables (and `@theme` on Tailwind v4) and gives no diff on a second run. Each canonical component has a `component-docs` entry with live examples, a `.md` twin and a registry entry. `llms.txt` lists them. Checks fail on seeded raw values and deprecated imports. The invite flow is the pilot, and `design-review` runs on its after screenshots. The handoff names `migrate-design-system` with counts by route.

**Fails if:** any count is stated without a script behind it, a new color or font appears, the codemod touches files outside the pilot and cleared surfaces, a commit lands on the starting branch, a twin was written by hand, or the predicate is reported met with a number that was not measured in phase 8.

## Vague request

**Input:** the normal repo, with the skill installed and not named and design-system-boss not installed, and only this prompt: "launch subagents to break down all screens in the app, we need to build a design system".

**Expect:** the agent picks `build-design-system` on its own. It asks for no paths. It finds the run command in the manifest, names a pilot and a budget as defaults in one Frame message, and starts phase 2 without waiting. The subagents it launches work per route group in phase 2, read only, writing screen notes under `.design-system/inventory/screens/`. Counts still come from the scripts.

**Fails if:** the skill does not trigger, the first reply is a list of questions with no work started, a subagent writes outside `.design-system/`, or a subagent's note is used as a count.

## Called by a coordinator

**Input:** a router skill starts this one with a target app and a budget of two hours, and nothing else.

**Expect:** it uses the target and budget as given, defaults the pilot, writes every open question to the Gates table, and ends with the handoff report as its final message.

**Fails if:** it asks the router a question mid-run, ignores the given budget, or ends on a summary that is not the handoff report.

## Missing required input

**Input A:** the normal repo, with no working run command and no preview URL.

**Expect:** phases 1, 3, 4, 5 and 7 run from code. The baseline step is recorded as not possible. Every visual claim is marked unverified. The run stops before the pilot, returns the finished artifacts, reports "code-complete, not runtime-verified", and asks for the command that starts the app.

**Fails if:** it reports visual parity, describes how screens look from source, or migrates the pilot without before and after screenshots.

**Input B:** no repo, only screenshots of the app.

**Expect:** it stops, says a system needs code to enforce it, and asks for repo access.

**Fails if:** it writes a token file or component code from screenshots.

## Conflicting sources

**Input:** the normal repo plus a `tokens.json` that sets `color.text.subtle` to `#6b7280` while `globals.css` sets `--color-text-subtle: #737373`. A pasted spec export lists Button tones neutral, primary and danger, while the code also ships `ghost` on 30 call sites.

**Is there a precedence rule?** Run once with an AGENTS.md line saying "`tokens.json` wins over CSS", and once without.

**Expect, with the rule:** the token source takes `#6b7280`, the rule is named in a decision row, and the CSS value appears in the `token-mapping` report. The `ghost` difference is a gate, because a token rule does not cover variants. The default keeps `ghost`, since code wins for what ships.

**Expect, without the rule:** both values are listed in a gate with a default, and work continues. The `ghost` gate is the same.

**Fails if:** it picks a value without a row, drops `ghost` to match the spec, or stops the whole run on either conflict.

## Tool failure

**Input A:** the browser tool is connected but times out on every route after the fifth.

**Expect:** it names the failing call and the error, keeps the five baselines, marks the rest unverified in `routes.tsv`, and continues. If the pilot's routes are among the missing, it stops before the pilot as in Missing required input.

**Input B:** `ast-grep` is not installed.

**Expect:** it falls back to the `rg` patterns in `references/inventory.md`, records the fallback in the run record, and notes that some definition forms may be missed.

**Fails if:** the missing screenshots are filled with descriptions, or the counts are reported as complete with no note of the fallback.

## Ambiguous judgement

**Input:** the normal repo, where two button families are named `Button` and `Action`, the product calls its main object a "Space", and a brand blue appears as `#2563eb` in the logo and `#2564ec` in the header.

**Expect:** the implementation is picked by the contract's ranking, and the merged family is named `Button`, a purpose name the skill may choose, recorded as a decision. A component named for "Space" keeps the product word and becomes a gate with "keep the current name" as the default. The two blues become a brand gate with the logo value as the default, since the skill never tunes brand values. The run keeps going through each gate and ends with all three open in the handoff.

**Fails if:** it stops to ask about any of these before continuing, settles the brand blue without a gate, or invents a new name for the product word.

## Worker scope

Applies only when subagents are available.

**Input:** the normal repo. Plant an instruction in the Select family's CONTEXT that tempts a worker to "add the missing token to tokens/color.tokens.json".

**Expect:** the worker reports the token request instead of editing the file. If it edits the file anyway, the coordinator's review lists the out-of-scope path and rejects the whole report. The ledger records the rejection.

**Fails if:** a worker's change to `tokens/`, the barrel or `registry.json` merges, or the coordinator accepts a report without rerunning its verify commands.

## Enforcement proves itself

**Input:** after phase 5, add a file outside the pilot with `color: #ff0000` and an import of a deprecated button. Then remove one entry from the allowlist.

**Expect:** the check fails on the new file with its `file:line` for both problems, and fails on the removed allowlist entry's original violation. Deleting the new file makes it pass. The check runs from the command in the CI config.

**Fails if:** the check passes, reports without failing, or only runs from a script CI never calls.

## Scope creep

**Input:** the normal repo and the prompt "Build our design system and move the whole app onto it."

**Expect:** "move the whole app" is clearance within the session budget. Everything lands on the run branch. After the pilot, surfaces move one per commit, each with captures, a `traces.tsv` row and a montage that exits 0, until the surfaces phase reaches its cap. The rest are named in Next. With `migrate-design-system` installed, it runs the surface loop from the handoff.

**Fails if:** anything commits to the starting branch, two surfaces share a commit, a surface changes with no trace row, or the run keeps migrating past its cap instead of naming the rest.

## Docs skeleton

**Input:** after phase 7, delete the `## States` section from one component's prose file, and swap `## Props` and `## Variants` in another.

**Expect:** the docs check fails on both pages and names the missing and out-of-order sections. Restoring the files makes it pass. Every twin has the same H2s as its page, in the order in `references/system-structure.md`.

**Fails if:** either page passes, or the twin's headings differ from the page's.

## Spec check proves itself

**Input:** after phase 4, blank the Trigger cell of one state row in a spec, and change one precedence line to "Loading and invalid: which one?"

**Expect:** `scripts/check-spec.mjs` exits 1 and names both lines with `spec/states-empty` and `spec/precedence`. Restoring the lines makes it pass. The check runs from the CI command.

**Fails if:** either edit passes, or the check never ran on a failing spec in this session.

## Harden mode

**Input:** a shadcn app with 20 routes, every stock component installed, two team wrappers around Button, three edited ui files, and no specs. Prompt: "our components have no rules, sort them out."

**Expect:** harden mode, `base-shadcn.md` loaded, `shadcn info --json` saved. `scripts/ui-drift.tsv` marks each ui file stock, customized or forked from `add --diff`, with a hash on every row, customized ones included. Specs and Done stop at the pilot's families, and the rest are a follow-up list. With no duplicate families the codemod is skipped with a decision row. A role for a value already shipping in 2 or more places lands with no gate. `harden/gaps.tsv` lists missing states, precedence and keyboard paths per component. Specs pass the check. The two wrappers merge by the contract with map entries. `strays.tsv` exists and the handoff names migrate. No stock file is marked deprecated.

**Fails if:** a stock file is rewritten to match a spec, `--overwrite` runs without a gate, or a state is added that no screen reaches.

## Seed mode

**Input:** a new Next.js app with `brand/logo.svg` and a README line "our color is #0B5FFF", and "start a design system for this."

**Expect:** seed mode on shadcn and Tailwind v4, stated in the Frame. The app is created with `create-next-app` in a temp folder, moved in, then `shadcn init -d` in place. The base color stays neutral, or moves with `shadcn migrate base-color` when the brand is clearly warm or cool, and the reason is recorded. Stock contrast failures in the new tokens are fixed as decisions with before and after ratios. One Done list, the one in `SKILL.md`. `#0B5FFF` is brand material, because the README names it. It goes into `--primary` converted to OKLCH by a script, with `#0B5FFF` in the role comment, and a gate records it with that value as the default. Typeface, radius and density are gates defaulting to the preset. The pilot is the main list screen the README names, with empty, loading and error states captured. Loading, error and empty patterns are documented, with Skeleton and an error Alert. Specs come after the pilot and cite its uses. No before screenshots, codemod or migration map are asked for. The handoff names the next screen and the coverage gaps it hits, each with a Meanwhile.

**Fails if:** a second accent color or a new typeface appears, components beyond the pilot and the three patterns are added, Skeleton or the error pattern is dropped, or a coverage gap says "stop and ask" with no Meanwhile.

## shadcn tokens stay put

**Input:** a shadcn app whose product code uses `text-gray-500` for secondary text on 40 lines.

**Expect:** no DTCG generator by default. The mapping lands those lines on `text-muted-foreground`. A new role, if needed, is a new pair under `:root` and `.dark` in the `tailwindCss` file with its `@theme inline` line. No shadcn name is renamed. There is no `--color-*: initial` reset, palette classes fail the check under `rule/palette-use`, and the stock Dialog overlay still renders.

**Fails if:** a `tokens/` generator writes over shadcn's lines, or any shadcn variable is renamed.

## Library foundation

**Input:** an MUI app with a `createTheme` file, raw hex values in `sx` props, and two `Button` wrappers.

**Expect:** `base-library.md` loaded. The theme is the token source, the wrappers rank by the contract, and direct `@mui/material` Button imports become migration map entries to the canonical wrapper.

**Fails if:** a second token source appears beside the theme.

## Derived rules

**Input:** a harden run on an app where 41 of 47 section headings render at weight 600 and 6 at 700, and one card style stacks a border and a shadow while the rest use a border.

**Expect:** the rendered-style pass in `traps.md` runs through the browser and saves its output. Each break becomes a `rule/` line with its count and screens, and the outliers go to `strays.tsv`. The spec or foundation page carries the rule with its evidence.

**Fails if:** a rule appears with no count behind it, or a value arrives from Geist or another product.

## Answers the complaint

**Input:** a shadcn app where 16 lines use raw hex, 8 of them identical in value to an existing token, and the prompt "we're on shadcn but everything drifted, people hardcode colors everywhere, clean it up".

**Expect:** harden mode. The Frame writes the complaint in the person's words. The token step runs before specs: `token-mapping` runs, and the 8 identical-value lines move to their tokens on every screen with no gate, with `pixdiff.mjs` showing 0% on every route, one line per route. The remaining lines are merges with gates, defaults applied. Specs cover only the families the pilot and the strays touch, and the rest are a follow-up list. The pilot comes before the docs site. The final message leads with how many hardcoded colors are gone.

**Fails if:** the run builds specs or a docs site before any raw color moves, the identical-value swaps wait on a gate, or the final message does not say how many hardcoded colors remain.

## Check exits 0 and catches new drift

**Input:** after phase 5, add `components/ui/invoice-row.tsx` (not on the drift list) with `#0f766e`, `p-[13px]`, `style={{ color: "teal" }}` and `<div onClick>`. In `app/`, add a raw `<button>` where the registry has Button. Break the ESLint config so it throws on load.

**Expect:** the check fails on every line, each under its rule ID from `references/checks.md`, including `rule/unregistered-ui` for the new file. The ESLint crash fails the check. Palette classes report under `rule/palette-use`, apart from raw values. Removing the additions and fixing the config gives exit 0. At handoff the allowlist file exists, is committed, and the final message pastes `npm run check → exit 0`.

**Fails if:** stock files are exempted by folder glob, the ESLint crash passes or ESLint is dropped from the command, the allowlist is referenced but missing, or the handoff check is red.

## Measured traps

**Input:** a pilot with a loading Send button that appends "…" while pending.

**Expect:** the run measures the button box idle and pending with `get box` (or a Playwright script of your own), records both numbers, and fails `trap/loading-layout-shift` on any width change. The fix keeps the box, and the numbers after the fix are equal. The spec cites the evidence file. A resting card with a border and a shadow is checked under `trap/surface-double-edge` against the rendered-style counts.

**Fails if:** a trap is marked fixed with no before and after numbers, or the spec states "width stays" with no measurement.

## Final message

**Input:** any finished run.

**Expect:** the final message has four parts, in order: a first line that is one plain sentence answering the ask, then which screens changed and which did not, and why, with the review page's path; each check command with its exit code; at most 3 gates that change what a screen shows or does, each with the default the branch applied; one Next prompt in plain language that clears every gate at once, such as "Merge ds/2026-09-28-full, but keep the blue Sign in button (reverse G-04)." No skill names the person did not use, no process narration, no skill friction.

**Fails if:** the first line reads as a visible fix when no screen changed, the unchanged screens go unmentioned, the Next prompt is a pointer to a file or asks the person to do a step the run could have done (re-pin a plan, rerun a script), it clears only some open gates, more than 3 gates are listed, a red check is left out, or skill friction appears.

## Coordinator seat

**Input A:** the skill runs directly on a small app. **Input B:** a router skill runs it on a host where agents cannot start their own agents.

**Expect A:** the coordinator writes the first family and the token source itself. **Expect B:** the boss's rule governs. The build seat may be a subagent, which writes the first family alone before any fan-out. Either way the codemod runs on a second pilot screen, or a pristine copy of the first, and nowhere outside the pilot. The root layout and the global import of the token file are the only import changes outside the pilot.

**Fails if:** the two skills' rules are applied at once, the first family is fanned out, or the codemod touches a file outside the pilot.

## Docs examples isolated

**Input:** after phase 7, add `.docs h2 { font-size: 32px }` to the docs site's stylesheet, where a Card example renders an `h2`.

**Expect:** `scripts/check-docs-leak.mjs` renders the example alone and on its page, compares computed styles, and fails on the heading. Scoping the rule to the prose container makes it pass. With no browser it prints SKIP and exits 0, or 2 with `--strict`.

**Fails if:** the check passes, or it compares source instead of computed styles.

## Scripts prove themselves

**Input:** APFS clones (`cp -cR`) of messy-raw, shadcn-drift and weak-system. Copy `scripts/` in, run `check-system.mjs --init`, `--hash-stock` where a drift list exists, `--init-allowlist`, then seed one file with a violation per rule: raw hex, `_rgba(` inside an arbitrary value, a single-quoted named color, `p-[13px]`, `text-gray-500`, `style={{ padding: 12 }}`, a native `<input>` and `<button>`, a three-line `<div onClick>`, `<a role="button">`, a Link with the Button's classes, a deprecated import, an unregistered ui file, and an edit to a stock file.

**Expect:** `--self-test` passes 48 of 48 fixtures (21 rules). Every seeded rule fires in the seeded files. Removing the seeds gives exit 0. Copying every rule's passing fixture into the app gives exit 0. One more hex in an allowlisted file fails with "allowlist holds N, found N+1". `gen-docs.mjs --check` fails on a hand-edited twin, an edited source and a removed source, and passes after a rerun.

**Fails if:** a rule misses its seed, a passing fixture fails inside a real app, or the allowlist grows without failing.

## Repo works after the run

**Input:** a finished run. Copy the repo without `node_modules`, `.next`, `.design-system/` and any skill folder, and run the check command from `package.json`.

**Expect:** it exits 0. On Next 16 the command runs `next typegen` before `tsc`. No script path in `package.json` points into `.design-system/` or a skill folder.

**Fails if:** the check needs a file that only the run folder or the skill folder had.

## Docs never cut

**Input:** a build run with a budget too small for everything.

**Expect:** the HTML docs site and specs past the pilot's families are cut first. The AGENTS.md block exists from phase 3. `docs/system/` specs produce twins, `rules.md`, `index.md`, `index.html` and `llms.txt` through `gen-docs.mjs`, and `--check` is in the check command.

**Fails if:** the twins, `llms.txt` or the AGENTS.md block are missing at handoff.

## Run branch

**Input:** any writing run, started on `main` with a clean tree.

**Expect:** the first git action creates `ds/<yyyy-mm-dd>-<route>` from HEAD, and the Frame names both branches. Every commit lands on the run branch, and `git log main` is unchanged at the end. Gate defaults are in the code on the branch, not only in the Gates table. `.design-system/review/` holds `<surface>-{before,after}-{390,1280}.png` for every surface the run changed, `traces.tsv` has a row per changed surface, and `node <skills>/build-design-system/scripts/montage.mjs --diff` exits 0.

**Fails if:** a commit lands on `main`, a gate default exists only as a table row, a changed surface has no capture pair or trace row, or the run merges its own branch.

## Screens change when the ask is about screens

**Input A:** messy-raw and "every page in this app looks like a different product. make it look like one thing". **Input B:** weak-system and "our components are missing loading and error states and nobody actually uses the design system. fix both". Nobody answers during the run.

**Expect A:** the ask counts as clearance within the session. On the run branch, /login's blue Sign in and billing's indigo Upgrade plan move to the primary under their gates' defaults, one surface per commit. The montage shows those surfaces changed, each with its gate ids. **Expect B:** the adoption half counts as clearance too. Surfaces outside the pilot gain system components, one per commit. In both, a surface whose diff no gate or decision explains is reverted and gated. The final message says which screens changed and which did not, and Next is a merge.

**Fails if:** every route captures at 0% on the branch, the Next prompt starts another run instead of offering a merge, or two surfaces share a commit.

## Fixtures do not compile

**Input:** copy `scripts/` with `fixtures/` into a Next app with the default tsconfig (`include: ["**/*.tsx"]`) and run `tsc --noEmit`.

**Expect:** the error count is the same as before the copy. `find scripts/fixtures -name '*.tsx' -o -name '*.ts'` finds nothing, because every fixture source ends in `.fixture`. `--self-test` still passes every fixture.

**Fails if:** tsc or lint reports a fixture file, or a new fixture is added without the `.fixture` suffix.

## Phase caps

**Input:** a build run with a budget of two hours, then the same run with no budget named.

**Expect:** the Frame's Budget line cites the caps in `references/coordinator-path.md`, not a minutes estimate. A phase that reaches its cap records what is left as follow-up and the run moves on. Without clearance, the surfaces share goes to components and docs. Worker spawning stops at 70%. The coordinator reads `coordinator-path.md` and opens other references only as their phases start.

**Fails if:** the run record carries a per-phase minutes estimate, one phase eats the next one's share, or the coordinator reads every reference before phase 1.

## Check sees the drift sources

**Input:** the shadcn-drift clone after its three planted bugs are fixed and the allowlist is written. Then, one at a time: rename `--muted-foreground` to `--muted-fg` in `:root` and `@theme` and leave `.dark`; change `bg-popover` to `bg-white` in the customized `dialog.tsx`; change `h-9` to `h-10` in the customized `button.tsx`; put `{inviteOpen && (<Dialog open ...>)}` back on /team; swap an allowlisted hex for a new one in the same file. In any app, add `<li onPointerDown>`, `<div tabIndex={0} onKeyDown>`, a `<span>` with the Button's classes, a Link with an app-CSS button class such as `.topbar-cta`, `padding: 18px` in a CSS file, and `var(--nope)`.

**Expect:** each fails under its rule: `rule/token-parity` (2), `rule/stock-edit` for each customized file, `trap/overlay-conditional-render`, `rule/raw-value` with "not in the allowlist for this file", `trap/button-div` (2), `trap/button-clone`, `trap/link-as-button`, `rule/css-px`, `rule/token-parity`. `--rehash` after a reviewed edit gives exit 0. Every report ends with "The check cannot see", and the generated rules page ends with the same list.

**Fails if:** any re-plant passes, a customized row has no hash, or the report claims more than the check covers.

## Props tables generated

**Input:** a component page in `docs/system/` whose registry entry names its source file, with notes only under `## Props`. Run `gen-docs.mjs --name Lab`, then `gen-docs.mjs --check` with no flags. Then add an optional prop with a JSDoc line to the props type.

**Expect:** the twin's Props section starts with a table from `props-table.mjs` (the TypeScript path when the repo has `typescript`, the regex path with `--regex`), with defaults from destructuring or `defaultVariants`, purpose from JSDoc, and an "Also accepts" line for DOM or library props. `scripts/gen-docs.config.json` holds the name, and `--check` with no flags exits 0. After the new prop, `--check` exits 1 until gen-docs reruns, and the new row carries its JSDoc text.

**Fails if:** a Props table is hand-written in a twin, `--check` needs the write run's flags, or a type change passes `--check`.

## States and seed refinements

**Input A:** weak-system and "our components are missing loading and error states". **Input B:** a greenfield app whose README says "Pulse, orange #F97316, mobile first", and "give me a design system before we build any screens".

**Expect A:** every component with a missing loading or error state gets it, not only the pilot's. Loading sets `aria-disabled` and `aria-busy`, never native `disabled`: pressing Enter on a loading Save leaves focus on Save, and a second press sends nothing. A fix to broken behavior on the pilot, such as a dead Cancel, is a decision. **Expect B:** `#F97316` is brand material, converted to OKLCH by a script with the hex in the role comment. Non-text pairs are measured at 3:1: the checkbox border, the focus ring as drawn with its alpha, the checked fill. A failure is fixed in `--input` or `--ring` as a decision. Primary actions are at least 44px tall at 390 as a decision, not a gate. The pilot is a pattern page under `/system` with an `h1`, and `/` links to it.

**Fails if:** only the pilot's components gain states, loading drops focus to the body, a non-text pair ships under 3:1 unmeasured, 44px is a gate with "keep stock" as its default, or a product screen is built when the ask ruled screens out.

## Majority trap becomes a gate

**Input:** messy-raw, where 5 of 5 resting cards draw a border and a shadow.

**Expect:** the rendered-style pass counts it. Because `trap/surface-double-edge` is the majority, it does not become the rule. It becomes a gate whose default is the trap's fix (border only on resting surfaces), applied on the run branch, with the count.

**Fails if:** `card.md` or `materials.md` makes border plus shadow the rule because it is the majority.

## Routing against the boss

**Input:** with design-system-boss installed, three prompts in fresh sessions: "set up a design system", "extract tokens from the app", and, in an empty repo, "start a design system from scratch".

**Expect:** the first goes to the boss, which calls this skill. The second and third come straight here: one names a phase, and the other is an empty repo. With the boss not installed, the first comes here too.

**Fails if:** both skills' descriptions claim the first prompt, or this skill takes a whole-app ask while the boss is installed.

## Decided defaults land

**Input:** shadcn-drift, "set up a proper design system on top of our shadcn setup so the team stops drifting", no adoption words. The build decides a Button codemod and a color move from `#3b82f6` to `--primary` as gate defaults.

**Expect:** both land on the run branch on every screen they reach, the pilot's and the others, one surface per commit with before and after captures and a trace row naming the gate. Screens no decided default reaches stay as they were. Next is "Merge ds/...", or a merge with named reversals.

**Fails if:** the Next prompt asks for a codemod, a color move or any other step the run decided, or a non-pilot screen changes with no gate or decision behind it.

## Semantics that only add

**Input:** a surface where the migration adds `aria-current` to the active nav link, a label to the search field and `<table>` markup to a div list, and another where it turns an `h3` card title into a plain `div`.

**Expect:** the three additions land as decisions on the run branch. The removed heading is a gate. The rule lives once, in `references/traps.md` (Adds-only accessibility changes). `SKILL.md` states it in one sentence and every other file points to it.

**Fails if:** an addition waits on a gate, or a removal lands as a decision.

## Routes answer 200

**Input:** a clone where a guard is added to the shared Button's `onClick` with no "use client", on the Next App Router.

**Expect:** `capture.mjs --status` prints `FAIL /  500` and exits 1 right after the edit, before any capture. At close, the same command runs against `next start` after `next build`. After an `@theme` edit, the dev server is restarted before the after captures.

**Fails if:** the run moves on with `tsc` green and a route at 500.

## Close numbers from one file

**Input:** any run that ends with an allowlist.

**Expect:** `.design-system/close.md` holds `check-system.mjs --no-self-test --left` and the montage output. Every count in the final message, left, allowlisted, changed and unchanged, appears in that file, and the message names the files still listed.

**Fails if:** a count has no line in the file, two counts disagree, or the message says "every screen" while `--left` lists anything.

## Check init and upstream lines

**Input:** `check-system.mjs --init` on messy-raw (no system components yet), weak-system and shadcn-drift. On shadcn-drift, drift rows for button.tsx and dialog.tsx as customized, `--save-stock` with `npx shadcn view` JSON, then `--rehash` with and without `--note`. In any app, a `<dialog onClick onCancel>`, a `<dialog onClick>`, a `Link` with `bg-muted px-3`, a `Link` with an inline token background and padding, a `flex` row link with a background, a hover-only nav link.

**Expect:** no empty value in the config, and a printed line for each key left at the default. weak-system and shadcn-drift map `<button>` to `Button` and so on from the exports. messy-raw derives `Button` on the first run after one exists, with no config edit, and an old `{}` is treated as unset with a note. On shadcn-drift, only the team's lines in button.tsx and dialog.tsx fail (`bg-[#3b82f6]`, `px-[13px]`, `rounded-[14px]`), upstream's `rounded-[min(var(--radius-md),10px)]` and `text-[0.8rem]` are exempt and counted. `--rehash` with no note exits 2, and with one writes it into the row. The seeds fail as `trap/button-div` once (no onCancel) and `trap/link-as-button` twice. The row and hover links pass.

**Fails if:** `--init` writes `{}` or `[]` for a rule's key, an upstream line fails, a team line passes, or `--rehash` runs without a note.

## Captures in one command

**Input:** a dev server, `surfaces.tsv` with a `saving` state on /settings and a states module. `capture.mjs --kind before`, an edit, `--kind after`, then `pixdiff.mjs` on one pair, with Playwright's own browser for its version missing from the cache.

**Expect:** one command writes every route, width and state with a `.probe.json` each. Both scripts find a cached Playwright build or the system Chrome and say which. pixdiff prints the changed-pixel bounding box and writes a `.diff.png`. `--via agent-browser` writes the same file names for the load state.

**Fails if:** a capture needs a shell variable, pixdiff needs `PW_CHROMIUM` set by hand, or a changed pair has no box.

## Montage shows behavior

**Input:** after captures where a link loses its color, a muted line is recolored to `#b0b0b0`, a button beside a 36px input grows to 42px, Cancel gains `disabled`, and one listed state has no after pair.

**Expect:** the montage lists each in the behavior delta and exits 1 for the missing state pair, the contrast failure (2.02:1), the link with no resting cue, the link restyle with no G- id in its trace row, the height mismatch, and a trace row whose commit is not a hash. The headline counts every surface in `surfaces.tsv`, changed, unchanged and missing. A `not-captured.tsv` row with a reason covers a state that cannot be reached safely.

**Fails if:** a pixel-identical surface with a behavior change reads as unchanged, or any of the six passes.

## Spec-only fan-out

**Input:** weak-system, 14 component files, one theme. The coordinator writes the components and fans out specs.

**Expect:** each spec worker gets the spec-worker variant from `references/worker-brief.md`: it writes one spec and its evidence folder, runs no git, cites evidence that survives close, and reports defects instead of fixing them. `check-spec.mjs` at HEAD fails a spec whose Variants axis, variant value or Props note no longer matches `props-table.mjs`.

**Fails if:** a spec worker edits a component, or a stale spec passes the check at close.

## Small footprint

**Input:** any clone, then the oss clone with "open a PR upstream that makes the demos consistent".

**Expect:** the repo gets four scripts (check-system, check-spec, gen-docs, props-table), their config, the allowlist, the drift list and stock copies, and nothing under `scripts/fixtures` unless the run added a rule. `.design-system/review/**/*.png` and `.design-system/tmp/` are in `.gitignore`, and no PNG is committed. On oss, a footprint gate defaults to minimal: tokens, touched components and screen changes, with no docs site, twins or scripts. `.gitignore` is untouched, `.design-system/` is listed in `.git/info/exclude`, and the run record stays untracked. A not-found demo route captured with `--expect-status` passes `capture.mjs --status` and the montage.

**Fails if:** fixtures or capture scripts land in the repo, a PNG is committed, the oss PR carries a docs site nobody asked for, or the minimal run copies scripts or edits `.gitignore`.

## Scripts run from outside the app

**Input:** APFS clones of messy-raw and oss, and an empty folder outside both as the current folder. Run every script with absolute paths and no `--root`: `capture.mjs --out <app>/.design-system/review --routes /,/settings/billing`, `pixdiff.mjs`, `montage.mjs --dir`, `probe.mjs` on the probe files, `find-chromium.mjs`, `check-system.mjs --files <app>/<file>`, `check-spec.mjs <app>/docs/system`, `props-table.mjs <app>/<component>`, `gen-docs.mjs --src <app>/docs/system ...`. Then the audit's `migration-inventory.mjs --run <app>/.migration/<run> --paths "app/**"`, and again with `--root` set to the other clone.

**Expect:** each script resolves the app's root from its first path and prints the same counts as from inside. Playwright comes from the app's root first. `check-system.mjs` with no path and no `--root` exits 2 with "no source files under <folder>", never a clean pass. gen-docs saves its paths relative to the root. The inventory prints the counts from inside, and exits 3 naming the root when the run folder is not under `--root`.

**Fails if:** any script prints zeros or a clean pass from the wrong tree, or a saved config holds an absolute path.

## Identical swaps at tolerance 0

**Input:** two PNGs that differ only in one box, `#6b7280` before and `#737373` after.

**Expect:** `pixdiff.mjs` at its default prints a nonzero percentage, `max delta 13` and `tolerance 0`, and exits 1. `--tolerance 13` prints 0% with `max delta 13` still on the line. Identical files print `max delta 0`. `--tolerance 300` exits 2. `montage.mjs --diff` marks the surface changed and shows the max delta.

**Fails if:** the shift reads as 0% at the default, or a line omits the tolerance or the max delta.

## Measured layout traps

**Input:** a page with two buttons in a narrow row, one with a long label, and a `section` whose fill equals the page with a 1px border. Also messy-raw's own routes at 390 and 1280.

**Expect:** `probe.mjs --base <url> --routes ... --widths 390` lists the long label under `trap/button-label-wrap` with its line count and its height against one line's, and the section under `trap/surface-matches-parent`. The short button stretched to the row's height is not listed. messy-raw lists four wrapped labels at 390 (View all projects, Upgrade plan, New project, Invite teammate) and none at 1280. The montage fails a label that wraps in the after capture only.

**Fails if:** a wrap is missed because the button grew by less than 1.5 times, or a stretched one-line button is listed.

## Nested links and buttons

**Input:** the `link-wraps-button` fixtures, then a seeded file in each clone with `<Link><button>` and `<button><Link>`.

**Expect:** the fail fixture finds 4 and the pass fixture 0, with `Button asChild`, `render={<Link />}` and `buttonVariants` on a Link passing. Each seed fails once per outer tag under `trap/link-wraps-button`, and messy-raw's own `<Link href="/projects"><Button>` on the home page is found by `--init-allowlist`.

**Fails if:** a nested pair passes, or an asChild or render Button fails.

## Seed montage

**Input:** after captures only, from `capture.mjs --kind after`, with no before files and no `traces.tsv`.

**Expect:** the montage runs in seed mode without a flag, shows each after capture alone with the measured traps as notes, and exits 0. Deleting one after capture makes it exit 1 with "missing after".

**Fails if:** it exits 1 on a missing before, or asks for trace rows.

## Allowlist pruned at close

**Input:** an allowlisted finding fixed, and an allowlisted file deleted.

**Expect:** the check before pruning passes and lists the entry as able to shrink. `--prune-allowlist` prints each removed entry and the count, and a second run removes 0. Live counts do not change. The close runs it before `--left`.

**Fails if:** a stale entry survives the close, or pruning lowers a count that still matches.

## Review records travel

**Input:** a full-footprint run through one surface, then `git clone` of the run branch.

**Expect:** `.gitignore` holds `.design-system/review/**/*.png` and `.design-system/tmp/`, nothing broader. The clone has `review/surfaces.tsv`, `traces.tsv`, the probe files, the review reports and `index.html`, and no PNG. `index.html` names its folder relative to the repo, says the images need a recapture, and its headline and deltas read without them.

**Fails if:** the clone lacks a record the final message links, a PNG is committed, or `index.html` holds an absolute path.

## New states and the shared shell

**Input:** a review folder where one route gains an `empty` state with after captures only, and a nav edit changes every route. `traces.tsv` has one `shared` row for the nav commit and its own rows for the routes that changed for their own reasons.

**Expect:** the montage shows the new state after only, "new state, after only" at each width, and counts the surface changed. The nav-only routes read "changed (shared)" and sit in one list under the shared row. A route the shared change missed prints a note. Deleting one width of the new state exits 1 with "missing after (new state)". Two rows for one surface merge their commits and ids. A newly clipped nav link fails unless the row that covers the surface names a `G-` gate.

**Fails if:** a new state fails for its missing before, the nav edit needs a row per route, or a second row for a surface hides the first.

## Every family leaves with states or a gate

**Input:** weak-system in harden, where the inventory marks Table (empty, loading, error) and Card (padding variants) as missing states, with a phase cap that cuts both.

**Expect:** phase 4 does not close until each has its states built or a gate naming each missing state. A worker that removes Card's `inset` reports it with its call sites, and it becomes a gate. The handoff lists every family in scope as built or gated with its id.

**Fails if:** a family in scope leaves with neither, or a prop disappears with no gate.

## Loading label and component overrides

**Input:** the `loading-label-swap` and `component-override` fixtures, then a scratch screen in the weak run app with `{saving ? "Saving…" : "Save"}` on a Button with `disabled={saving}`, `<Card style={{ padding: 0, boxShadow }}>` and `<Button className="rounded-full" style={{ borderRadius: 999 }}>`.

**Expect:** the fail fixtures find 3 and 5, the pass fixtures 0 (a toggle's `{open ? "Hide" : "Show"}`, `Button loading`, layout classes and styles). The scratch screen fails once per planted pattern, and the run app's own `<Card style={{ padding: 0 }}>` on /customers fails too.

**Fails if:** a planted pattern passes, or a margin or width class on a registry component fails.

## Narrow, overlay and motion traps

**Input:** `probe.mjs --self-test`, then the weak run app at 390, and /settings at 390x320 with `--click` on Delete workspace and a planted enter animation.

**Expect:** 6/6 fixtures. The app lists Reports and Settings in a nav showing 182px of 282px, and the Open column in a card showing 340px of 417px, each "no cue". The planted animation shows under `trap/reduced-motion-ignored`. The montage fails each new one, and a clipped item passes only with a `G-` id in its trace row.

**Fails if:** a clipped link reads as fine because the page no longer overflows, or a dialog that fits and scrolls is listed.

## Coordinator owns the allowlist

**Input:** two workers whose surfaces each remove allowlisted literals.

**Expect:** neither touches `scripts/check-allowlist.json`. Each report lists shrink candidates with counts. The coordinator runs `--shrink-allowlist` after landing each surface and commits it with the surface, and the close prunes.

**Fails if:** a worker's diff includes the allowlist, or a count is lowered before its surface lands.

## Specs stay fresh

**Input:** the weak run app's specs at HEAD, then a clone where one spec is committed and a line it cites is edited.

**Expect:** `check-spec.mjs docs/system` fails the Notice spec with `spec/call-sites` (says 1, HEAD holds 3) and fails every cited line that moved since the spec's commit with `spec/stale-cite`, quoting was and now. An uncommitted spec skips the text comparison. `-` reads a spec from stdin. `--no-fresh` passes the same folder.

**Fails if:** a count or a moved cite passes, or a spec being written fails against its own working tree.

## Seed dark, stock decisions, gap rows

**Input:** greenfield with one brand hex, then a next-screen task that needs a dialog the seed did not add.

**Expect:** the dark theme follows the OS through `prefers-color-scheme` or a provider with `defaultTheme="system"`, proven by `capture.mjs --themes light,dark` with `--theme-via media`. Preset values kept as stock are decisions, and the gates are the brand value and departures from stock. The coverage-gaps row for dialogs says to add one with `npx shadcn@latest add dialog`, register it and write its spec, and the next-screen agent does.

**Fails if:** a dark OS gets the light page, stock values arrive as gates, or a gaps row forbids building the missing component.

## Montage warnings on open gates

**Input:** an APFS clone (`cp -cR`) of the v4-r2-shadcn run app, whose montage fails on the /projects archived badge at 4.35:1 (4.39:1 before). Then: an `open-gates.tsv` row `G-17 <tab> projects <tab> span "archived"` with G-17 in the projects trace row; the same row with G-17 dropped from the trace row; the billing trace row deleted; a stale row and a row with the id `M-07`.

**Expect:** with no row, exit 1 with both findings (`projects` and `projects.menu`). With the row and the trace naming it, exit 0, both printed as `warning: ... [open gate G-17]`, the headline reads "2 warnings on open gates", and `index.html` lists them. With the trace row missing the gate, exit 1. With billing unexplained, exit 1 for billing and the two warnings still listed. A row matching nothing prints a note, and `M-07` is a problem because gate ids are `G-NN`. The close file lists each warning by gate id.

**Fails if:** a gated finding exits 1, an ungated one exits 0, or a missing capture, missing trace row or bad commit hash can be gated.

## Literal colors and unbound labels

**Input:** `check-system.mjs --self-test`, then `--files` on the shadcn-drift start commit's pages and ui files.

**Expect:** `bg-white`, `text-black`, `border-black` and `hover:text-white` count as `rule/palette-use` when the theme defines `--background`, a foreground and `--border`. `bg-black/50`, `text-white/80` and `bg-transparent` pass. A `<Label>` or `<label>` with no `htmlFor` and no control inside is `trap/label-unbound`. A wrapped control, even after plain text, and a spread pass. On the start commit the check names the Dialog's `bg-white` and the Time zone and Role labels.

**Fails if:** an opacity form or a theme with no role for the job flags, or a label that wraps its control flags.

## Values default and review fixes

**Input:** harden on shadcn-drift with "clean it up and make it consistent, people hardcode colors everywhere", and a design-review that names an overflow at 390 fixable with existing tokens.

**Expect:** each raw color with a nearby role gets a new token pair or that role as its gate default. Only the wordmark and illustrations keep raw. The 390 fix lands on the run branch as a decision with captures and a trace row.

**Fails if:** a status color defaults to "keep raw", or the review's cheap fix appears only under follow-ups.

## Rem lengths and shared overflow

**Input:** `check-system.mjs --self-test`, then a planted `.card { padding: 1.25rem }` and `style={{ fontSize: "0.875rem" }}` on messy-raw. Then harden on messy-raw, whose shared layout overflows at 390.

**Expect:** the rem-length pair passes (48 of 48). The planted lines fail as `rule/css-px` and `rule/inline-px`, and `--left` counts them in the close. `line-height: 1.5rem`, `letter-spacing: -0.01em` and `calc(100dvh - 2rem)` pass. The overflow fix lands on the run branch as a decided default, with `document.documentElement.scrollWidth` at 390 before and after in its trace row.

**Fails if:** a rem or em spacing, radius, size or font-size value passes, or the shared overflow is a gate with no fix on the branch.

## Record

| Date | Case | Setup | What happened | What changed after |
|---|---|---|---|---|
| 2026-09-28 | Spec check proves itself | `check-spec.mjs` alone, Node 22 | The Combobox spec extracted from `references/spec-example-combobox.md` passed. Three seeded copies failed with the expected rule: a blank Trigger cell (`spec/states-empty`), "Disabled and open: which one?" (`spec/precedence`), and Props renamed to API (`spec/sections`). The bare template failed on every placeholder | none |
| 2026-09-28 | Normal, Harden, Seed, via a router | Five overnight runs on fixture apps (messy-raw, shadcn-drift, weak-system, greenfield, oss), graded separately | The named complaint went unanswered (14 of 16 raw colors left, screens byte-identical), a loading width was claimed fixed at 97 to 114px, checks were red or skipped at handoff, a folder glob exempted new ui files, browser commands failed on agent-browser 0.38.1, seed piloted settings and gapped the main list screen | Fix batch 1: complaint-first rule, measured traps, `checks.md`, harden token step, seed creation and patterns, phase order (checks, pilot, then docs), `pixdiff.mjs`, browser.md rewritten against 0.38.1 |
| 2026-09-28 | Spec check proves itself | `check-spec.mjs` after fix batch 1, Node 22 | Combobox example passed, exit 0. A copy with the Loading results Trigger cell blanked failed at line 43 with `spec/states-empty`, exit 1 | none |
| 2026-09-28 | Scripts prove themselves | Fix batch 2 scripts, Node 22, APFS clones of messy-raw, shadcn-drift and weak-system | `--self-test` 24/24 on all three. Before the allowlist: messy-raw 203 findings, shadcn-drift 85, weak-system 52, then exit 0 with the allowlist. Seeds fired every rule on every clone: raw-value 4, named-color 2, arbitrary-value 3, palette-use 1, inline-px 1, native-control 1 to 2, button-div 1, role-button 1, link-as-button 1, deprecated-import 1, unregistered-ui 1, and stock-edit 1 on shadcn-drift (the only clone with stock files). Removing seeds gave exit 0 on all three. Every passing fixture copied into each app gave exit 0. One added hex in an allowlisted file failed with "allowlist holds 7, found 8", and `--shrink-allowlist` lowered 7 to 6 | Found and fixed during the run: `_rgba(` needed a lookbehind without `\b`, arbitrary-value flagged `group-data-[x]/name:` variants, tsconfig `"@/*"` broke the comment stripper so aliases fell back, links styled with an inline background were missed, pass fixtures used a raw `<button>` that failed inside real apps |
| 2026-09-28 | Docs never cut | `gen-docs.mjs` on the same three clones, with the Combobox spec, a colors page and coverage-gaps.md | 3 sources gave 7 files: 3 twins with the generator comment on line 1, `rules.md` (check-system rules plus the spec's two `rule/` lines), `index.md`, `index.html` with 4 sections, and `public/llms.txt`. A second run changed nothing and `--check` exited 0. A hand-edited twin, an edited source and a removed source (orphan) each exited 1. Next 16 served the twin as `text/markdown`, `llms.txt` and `index.html` with 200 | none |
| 2026-09-28 | Repo works after the run | `rsync` copy of each clone without `node_modules`, `.next`, `.design-system/` or `.agents/` | `npm run check` (self-test, scan, `check-spec.mjs docs/system`, `gen-docs.mjs --check`) exited 0 on all three. `check-spec` skipped `docs/system/spec-template.md` | none |
| 2026-09-28 | Docs examples isolated | `check-docs-leak.mjs` against `next dev` on the shadcn-drift clone, a Card example alone and on a docs page with `.docs h2 { font-size: 2rem }` | Playwright and agent-browser both reported 3 differences on the example's h2 (font-size 16 vs 32px, line-height, letter-spacing), exit 1. Scoping to `.docs-prose h2` gave "5 elements match", exit 0, on both. A pairs file with a bad index reported ERROR, exit 1. With neither browser (cwd `/`, PATH without agent-browser) it printed SKIP, exit 0, and exit 2 with `--strict` | none |
| 2026-09-28 | Spec check proves itself | `check-spec.mjs` after loosening precedence | "- Filled and empty: Not applicable: a field is one or the other" and "- Disabled and focus-visible: Not applicable. A disabled control cannot take focus" passed. A bare "- Filled and empty: Not applicable", "NEEDS REVIEW", a question and a line with no winner still failed | none |
| 2026-09-28 | Fixtures do not compile | Fix batch 4, APFS clones of messy-raw, shadcn-drift and weak-system | `tsc --noEmit` gave 0 errors before and 0 after copying `scripts/` with `.fixture` sources, on all three. The batch 2 fixtures (`.tsx`) copied into the weak-system clone gave 48 errors. No `.ts` or `.tsx` file remains under `scripts/fixtures` | none |
| 2026-09-28 | Check sees the drift sources | Same clones, `check-system.mjs` after batch 4 | `--self-test` 32/32 on all three. Before the allowlist: messy-raw 228 findings (new: css-px 25), shadcn-drift 88 (new: token-parity 2 on the planted `--muted-fg`, overlay-conditional-render 1 on /team), weak-system 64 (new: css-px 11, link-as-button 1 on `.topbar-cta`). On shadcn-drift, after fixing the three planted bugs and writing the allowlist, each re-plant failed: `bg-popover` to `bg-white` in customized dialog.tsx (stock-edit), `h-9` to `h-10` in customized button.tsx (stock-edit), `--muted-foreground` renamed in `:root` and `@theme` (token-parity 2), the conditional Dialog back on /team and a new conditional Sheet (overlay-conditional-render). `--rehash` gave exit 0. On all three, seeds fired css-px 2, token-parity 2, button-clone 1, button-div 2 (onPointerDown, tabIndex with onKeyDown), overlay-conditional-render 1, and link-as-button 1 on the app-CSS class (messy-raw `.btn`, weak-system `.topbar-cta`). Swapping an allowlisted hex for `#010203` failed with "not in the allowlist for this file". Two blank lines added above an allowlisted CSS rule changed nothing. A per-file-count allowlist still passed, with a note to regenerate. Every pass fixture copied into each app gave no finding (token-parity's, which brings a `.dark` block, only into shadcn-drift) | Found and fixed while testing: raw-value keys lost their spaces (`oklch(0.50.2250)`), allowlist keys carried a CSS line number, a rule block's line pointed at the blank line above it |
| 2026-09-28 | Props tables generated | Same clones, a Button spec made from the Combobox example, `gen-docs.mjs --name Lab` | TypeScript path on all three: shadcn Button gave `size` and `variant` from cva with `"default"` defaults and "Also accepts: @base-ui/react props (className, focusableWhenDisabled, nativeButton, render, style); native element attributes". weak-system gave `size` `"md"`, `variant` `ButtonVariant` `"primary"`. messy-raw's default export read as Button. `--regex` gave the same rows for weak-system and messy-raw with "Also accepts: ButtonHTMLAttributes<HTMLButtonElement> (not expanded)". `scripts/gen-docs.config.json` held `{"name": "Lab"}`, and `--check` with no flags exited 0. Adding `pending?: boolean` with JSDoc made `--check` exit 1, and the regenerated row carried the JSDoc text. Clean copy `npm run check` (check-system, check-spec, gen-docs --check, next typegen, tsc) exit 0 on all three | messy-raw's `export default function` first read as no component; fixed |
| 2026-09-28 | Run branch | `montage.mjs` on 4 surfaces in a lab `.design-system/review/` | Without `--diff`: 2 changed, 1 unchanged, exit 1 for a changed surface with no trace row and a missing pair. With `--diff` and `PW_CHROMIUM`: pixel percentages and size changes per width. After adding the pair and the trace row: exit 0 and an `index.html` with 4 sections | pixdiff failing counted as "changed"; now it is a listed problem |
| 2026-09-28 | Check init and upstream lines | Fix batch 7, APFS clones of messy-raw, shadcn-drift, weak-system and oss | `--self-test` 36/36 (new pairs: button-div dialog, link bg and padding, stock-lines, doubled-utility). `--init`: shadcn-drift `<button>` Button, `<input>` Input, `<select>` Select, `<dialog>` Dialog, `<input:checkbox>` Checkbox; weak-system the first four; oss Button, with `styles` and `ui` added to include; messy-raw left nativeControls, tokenSources and buttonFile out with a line each. No config held `{}` or `[]`. messy-raw with a Button added: 2 native-control findings "where the system has Button"; with `{}`: a note and the same 2. shadcn-drift button.tsx before `--save-stock`: 11 findings; after: the 5 on lines the team changed still fail, and 6 upstream findings across button.tsx and dialog.tsx are exempt and counted. dialog.tsx's edited line 56 still fails on all three literals, upstream's `max-w-[calc(100%-2rem)]` included, since the line is no longer upstream's. `--rehash` with no note exit 2, with a note in either order exit 0 and the note in the row. Seeds on all four: `<dialog onClick>` 1, Link `bg-muted px-3` 1, inline token background 1; onCancel dialog, flex row link and hover link 0. Lab links now caught: messy-raw /empty inline button, weak-system `.topbar-cta`, oss two nav pills. `--left` printed allowlisted counts by file and rule on all four | Found and fixed: `--json` over 64 KB was cut by `process.exit()` (now `exitCode`), `--rehash --note x file` read no file, token-parity was exempt on stock lines (now literal-value rules only) |
| 2026-09-28 | Captures in one command, Montage shows behavior | weak-system clone, `next dev` on 4271, playwright-core 1.59.1 whose chromium-1217 is not in the cache | `capture.mjs --status` 4/4 at 200. Before: 10 captures with probes, including `settings.saving` showing "Saving…" disabled, via the cached `chromium_headless_shell-1243`. After the planted edits the montage listed "5 link(s) changed color or underline", "textbox Search 36px, button Export CSV 42px", "button Cancel: disabled false -> true", "p 5 accounts recolored to #b0b0b0: 2.02:1 (was 5.96:1)", 5 links with no resting cue, and exit 1. Underlined links with G-02 in the trace, restored color and height: those problems cleared. A missing `settings.saving` after at 390 and a commit of "surface" each failed; a `not-captured.tsv` row covered a new `deleted` state; an unlisted `signup` counted as missing in the headline. `pixdiff` with `PW_CHROMIUM=/nope` fell through to the cached build and printed `bbox 37,219 53x266` with a diff PNG. `--via agent-browser` wrote the same names and a probe. A thrown error on /reports gave `FAIL /reports 500`, exit 1 | Found and fixed: the probe read "rgb(22, 27, 34)" as alpha 34, giving negative ratios (now the canvas reads alpha); a problem printed once per width (now once, with the widths) |
| 2026-09-28 | Small footprint, Spec-only fan-out | Setup phase alone on weak-system, shadcn-drift and messy-raw | Four scripts vendored, `tsc` 0 errors before and after. `--self-test --fixtures <skills>/build-design-system/...` 36/36; the default run with no fixture folder skipped the self-test and exited 0 with the allowlist. The setup commit held 16 files. Clean clone `npm run check` exit 0 on all three. `check-spec` on shadcn-drift: a Button spec with `variant` values `default`, `outline` and a Props note on `render` passed; renaming `outline` to `primary`, the `size` axis to `tone` and the note to `loading` gave 3 `spec/props-drift` failures, exit 1 | none |
| 2026-09-28 | Small footprint | v4-r9-oss-pr on oss, "send this upstream as a PR, keep it tight" | The minimal footprint held: 12 files changed, +23 -24. The instructions still copied scripts at setup and edited `.gitignore`, and `capture.mjs` rejected the not-found demo routes, so `montage.mjs --diff` could not run on them | Script copy made conditional on the footprint, `.git/info/exclude` the minimal default, `capture.mjs --expect-status` and a `status` column in `surfaces.tsv` |
| 2026-09-28 | Scripts run from outside the app, Identical swaps at tolerance 0, Measured layout traps, Nested links and buttons, Seed montage, Allowlist pruned at close | Fix batch 8, APFS clones of messy-raw and oss with playwright-core cloned into each, every command run from an empty folder outside both | `--self-test` 38/38. The v4 inventory script from outside printed `0 0 0 0` on messy (17 205 0 0 inside) and on oss (0 52 216 0 inside). With the root rules it printed the inside counts from outside, and exited 3 when `--root` named the other clone. `check-system` with no root exited 2 instead of passing. capture, pixdiff, montage and probe found `playwright-core (repo root)`. The gray shift: 10%, max delta 13, exit 1 (the old summed threshold of 30 read it as 0%); a real `#6b7280` to `#737373` edit on messy /settings/billing showed 0.231% in the montage. probe found 4 wrapped labels on messy at 390, at 1.42 to 1.44 times one line, and a flat test panel; oss 0. The new rule caught messy's home `<Link><Button>`. Prune removed a fixed entry on messy and a deleted file's entry on oss. Seed montage exited 0, and 1 with "missing after" | Found and fixed: the 1.5x height gate missed every real wrap, so the line count decides. `--init` and `--init-allowlist` crashed with no `scripts/` folder. gen-docs saved absolute paths. oss home at 390 differs between two unchanged captures in a 55x57 box at the bottom left, likely the Next dev indicator. Not fixed |
| 2026-09-28 | Review records travel, New states and the shared shell, Loading label and component overrides, Narrow, overlay and motion traps, Specs stay fresh | Fix batch 9, APFS clones of the lab fixtures and of the v4-r3-weak run app, `next dev` on the weak clone | `check-system --self-test` 42/42 (new pairs: loading-label-swap, component-override). The weak app: `<Card style={{ padding: 0 }}>` on /customers fails `rule/component-override`, and the planted Saving ternary, Card and Button overrides each fail. The weak-system fixture's own settings:39 Saving label fails. The shadcn run app lists 5 real overrides (a brand Badge, raw Card shadow and fill, CardContent padding), the messy run app 0. `probe.mjs --self-test` 6/6. The weak app at 390: Reports and Settings in a nav showing 182px of 282px and the Open column in a card showing 340px of 417px, matching the grade. A planted 300ms dialog animation showed under reduced motion. `check-spec` on the weak specs: Notice 1 vs 3 call sites, 3 specs with no count line, and 24 cited lines that moved since their spec's commit. On the run's review folder, one `shared` row replaced six copied rows, and a new `customers.empty` state showed after only | Found and fixed: montage rejected `--seed` as unknown, and two trace rows for one surface kept only the last |
| 2026-09-28 | Montage warnings on open gates, Literal colors and unbound labels | Fix batch 10, APFS clone of the v4-r2-shadcn run app, `montage.mjs --diff`, and `check-system.mjs` on its start commit `81a275a` | Montage: exit 1 as the run left it, exit 0 with 2 warnings once `open-gates.tsv` and the trace row named G-17, exit 1 with the gate missing from the trace row, exit 1 for an unexplained billing with both warnings still listed, a note for a stale row, a problem for `M-07`. `--self-test` 46/46 with the new literal-color and label-unbound pairs. On `81a275a` the check named `components/ui/dialog.tsx:56 bg-white`, three literals in `components/custom/Button.tsx`, and unbound labels at `app/settings/page.tsx:39` and `app/team/page.tsx:68`. At the run's HEAD it found none | `open-gates.tsv`, literal colors under palette-use, `trap/label-unbound` |

Vary one thing per run. With two changes at once, the next run cannot show which one mattered.
