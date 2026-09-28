# Tests: build a design system

Run these by hand. Give an agent the same repo and prompt twice, once with the skill switched off and once with it on, and compare what each leaves behind. A full run takes hours, so most cases stop after the phase they test. Nothing here runs automatically.

## Setup under test

A result only means something next to the setup that produced it. Record this before every run.

- `SKILL.md`, every file in `references/` (`coordinator-path.md` first), and every script in `scripts/` with its fixtures
- Mode (build, harden, seed) and foundation (shadcn, library, team package, raw)
- Sibling skills installed: `token-mapping`, `component-docs`, `design-review`, or which were missing
- Project instructions: AGENTS.md or CLAUDE.md loaded or not, and any precedence rule for tokens
- Repo and commit, framework, styling method
- Run command or preview URL, and whether it worked
- Browser for screenshots: Playwright, agent-browser or none
- Subagents: available or not, and how many ran at once
- Model for the coordinator, and for workers if different

Keep a few practice repos in git so every run starts from the same commit: a hand-rolled app with no token file, hundreds of raw colors and several button implementations; a shadcn app with edited ui files, a legacy modal and palette classes in product code; an app with a thin `src/ui` layer that many screens skip; an empty repo; and an open-source app the person does not own.

## Which cases apply

Every case applies to every setup, except these.

| Case | Applies |
|---|---|
| Called by a coordinator | When a router skill is installed |
| Worker scope | When subagents are available |
| Harden mode | Apps with a weak component layer |
| Seed mode | Empty repos and new apps |
| Foundation owns its tokens | shadcn and package-library apps |
| Measured traps, Captures and montage | Runs with a browser |

## Done means

- Each phase has a row in the run record with an artifact path.
- Inventory counts came from saved scripts, and the same scripts ran again at handoff.
- Baseline screenshots exist from before the first edit, and nobody edited them.
- Every token states its role. A generator run twice gives no diff.
- Every check rule failed on its bad fixture and passed on its good one, in this session.
- The full check exits 0 at handoff, and the final message pastes the command and exit code.
- Every decided gate default is applied on the run branch, so Next is a merge.
- Every count in the final message appears in `.design-system/close.md`.

## Baseline

Run the task with the skill switched off, on the same repo, with this prompt:

```
Build a design system for this app.
```

| Case | What happened with no skill | What happened with the skill |
|---|---|---|
| Normal | | |
| Vague request | | |

Watch for a token file written before any inventory, a palette borrowed from a popular system, colors that appear nowhere in the app, counts made by reading files, no screenshots before the first edit, every screen migrated at once, docs written by hand, and "the system is ready" with no check ever seen failing.

## Normal

**Input:** an app with about 20 routes, three button implementations (one a `div` with `onClick`), two inputs with 6px and 8px radius, about 40 text grays, a CSS variables file half the code ignores, light and dark themes, and an invite form with an invalid-email state. The app runs and a browser is connected.

**Expect:** the run record exists before any edit. Inventory TSVs come from scripts saved under `.design-system/scripts/`. Baselines cover every reachable route at two widths and both themes. The `div` button loses the canonical pick with the reason recorded. Grays collapse into a few semantic roles: merges inside tolerance are decisions, the rest are one gate per cluster with merging as the default, already applied. Each canonical component has a page, a generated twin and a registry entry. Checks fail on seeded raw values and deprecated imports. The invite flow is the pilot, and `design-review` runs on its after screenshots. The handoff names `migrate-design-system` with counts by route.

**Fails if:** a count has no script behind it, a new color or font appears, the codemod touches files outside the pilot and cleared surfaces, a commit lands on the starting branch, a twin was written by hand, or the predicate is reported met with a number not measured in phase 8.

## Vague request

**Input:** the normal repo, with the skill installed but not named, and "launch subagents to break down all screens in the app, we need to build a design system". Run once without design-system-boss installed and once with it. Then, with the boss installed, try "extract tokens from the app" and, in an empty repo, "start a design system from scratch".

**Expect:** without the boss, the agent picks this skill, asks for no paths, names a pilot and a budget as defaults in one Frame message, and starts phase 2 without waiting. Subagents work per route group, read only, writing notes under `.design-system/inventory/screens/`. With the boss, the whole-app ask goes to the boss, and the phase ask and the empty repo come straight here.

**Fails if:** the skill does not trigger, the first reply is a list of questions, a subagent writes outside `.design-system/` or its note is used as a count, or this skill takes a whole-app ask while the boss is installed.

## Called by a coordinator

**Input:** a router skill starts this one with a target app and a two-hour budget, once on a host where agents can start agents and once on a flat host.

**Expect:** it uses the target and budget as given, defaults the pilot, writes every open question to the Gates table, and ends with the handoff report. On the flat host the boss's rule governs, and the build seat writes the first family alone before any fan-out. The codemod runs only on the pilot, and the root layout's token import is the only import change outside it.

**Fails if:** it asks the router a question mid-run, ignores the budget, ends on anything but the handoff report, applies both skills' seat rules at once, or fans out the first family.

## Missing required input

**Input A:** the normal repo with no working run command and no preview URL. **Input B:** no repo, only screenshots of the app. **Input C:** the browser times out on every route after the fifth, and `ast-grep` is not installed.

**Expect A:** phases 1, 3, 4, 5 and 7 run from code. Baselines are recorded as not possible and every visual claim as unverified. The run stops before the pilot, returns its artifacts, reports "code-complete, not runtime-verified", and asks for the command that starts the app. **Expect B:** it stops, says a system needs code to enforce it, and asks for repo access. **Expect C:** it names the failing call, keeps the five baselines, marks the rest unverified, and stops before the pilot only if the pilot's routes are missing. It falls back to the `rg` patterns in `references/inventory.md` and records that some definition forms may be missed.

**Fails if:** it reports visual parity, describes screens from source, migrates the pilot without captures, writes tokens or components from screenshots, or reports counts as complete with no note of the fallback.

## Conflicting sources

**Input:** `tokens.json` sets `color.text.subtle` to `#6b7280` while `globals.css` sets it to `#737373`, and a pasted spec lists Button tones neutral, primary and danger while the code also ships `ghost` on 30 call sites. Run once with an AGENTS.md line "`tokens.json` wins over CSS", and once without.

**Expect:** with the rule, the token source takes `#6b7280` in a decision row naming the rule. Without it, both values go in a gate with a default and work continues. Either way `ghost` is a gate whose default keeps it, since code wins for what ships.

**Fails if:** a value is picked without a row, `ghost` is dropped to match the spec, or the run stops on either conflict.

## Ambiguous judgement

**Input:** two button families named `Button` and `Action`, a component named for the product's main object, "Space", and a brand blue that appears as `#2563eb` in the logo and `#2564ec` in the header.

**Expect:** the merged family is named `Button` as a decision. The "Space" component keeps its name under a gate. The two blues become a brand gate defaulting to the logo value. The run continues through each gate and hands off all three.

**Fails if:** it stops to ask about any of them, settles the brand blue without a gate, or invents a name for the product word.

## Worker scope

**Input:** the normal repo. Plant a line in one family's brief context that tempts a worker to "add the missing token to tokens/color.tokens.json". Run two workers whose surfaces each remove allowlisted literals. On a small app, let the coordinator write the components and fan out only specs.

**Expect:** the worker reports the token request instead of editing. If it edits anyway, the coordinator rejects the whole report and the ledger records why. Neither worker touches `scripts/check-allowlist.json`. Each lists shrink candidates, and the coordinator shrinks the allowlist after landing each surface. Spec workers get the spec-worker brief, write one spec and its evidence, run no git, and report defects instead of fixing them.

**Fails if:** a worker's change to the token source, barrel, registry or allowlist merges, a report is accepted without rerunning its verify commands, or a spec worker edits a component.

## Enforcement proves itself

**Input:** after phase 5, add a file outside the pilot with `color: #ff0000` and a deprecated button import, and remove one allowlist entry. Then add a new file in the ui folder with raw hex, `p-[13px]`, `style={{ color: "teal" }}` and `<div onClick>`, a raw `<button>` in a route where the registry has Button, and break the ESLint config so it throws on load.

**Expect:** the check fails on every line with its `file:line` and rule ID from `references/checks.md`, including `rule/unregistered-ui` for the new ui file, and fails on the removed entry's original violation. The ESLint crash fails the check. Removing the additions and fixing the config gives exit 0. The check runs from the command in the CI config.

**Fails if:** anything passes, stock files are exempted by folder glob, ESLint is dropped from the command, or the check only runs from a script CI never calls.

## Scope creep

**Input:** "Build our design system and move the whole app onto it."

**Expect:** "move the whole app" is clearance within the session budget. After the pilot, surfaces move one per commit on the run branch, each with captures, a `traces.tsv` row and a montage that exits 0, until the surfaces phase reaches its cap. The rest are named in Next.

**Fails if:** anything commits to the starting branch, two surfaces share a commit, a surface changes with no trace row, or migration runs past its cap.

## Run branch

**Input:** a writing run started on `main` with a clean tree. Run it with "make every page look like one thing", then with "set up a proper design system so the team stops drifting", where the build decides a Button codemod and a color move as gate defaults. Nobody answers during the run.

**Expect:** the first git action creates `ds/<yyyy-mm-dd>-<route>` from HEAD, and `git log main` is unchanged at the end. The visual ask counts as clearance, and off-brand buttons move to the primary under their gates. Decided defaults land on every screen they reach, the pilot's and the others. Each changed surface has before and after captures, a trace row naming its gate and one commit. A surface whose diff nothing explains is reverted and gated. Accessibility changes that only add semantics, such as `aria-current` or a field label, land as decisions, and one that removes a heading is a gate, per `references/traps.md` (Adds-only accessibility changes). Next is a merge, or a merge with named reversals.

**Fails if:** a commit lands on `main`, a gate default exists only as a table row, every route captures at 0% after a visual ask, the Next prompt asks for a step the run decided, a semantics removal lands as a decision, or the run merges its own branch.

## Answers the complaint

**Input:** a shadcn app where 16 lines use raw hex, 8 identical in value to an existing token, and "people hardcode colors everywhere, clean it up". A design review names an overflow at 390 fixable with existing tokens, and the shared layout overflows at 390.

**Expect:** harden mode, with the complaint in the person's words in the Frame. `token-mapping` runs before specs, and the 8 identical-value lines move on every screen with no gate, each route at 0% by `pixdiff.mjs`. Every other raw color with a nearby role defaults to a new token pair or that role, and only brand art keeps raw. The review's overflow fix and the shared-layout fix land as decisions with captures and `scrollWidth` before and after. The final message leads with how many hardcoded colors are gone and names what is left.

**Fails if:** specs or docs come before any raw color moves, identical swaps wait on a gate, a status color defaults to "keep raw", or a cheap review fix lands only under follow-ups.

## Harden mode

**Input:** a shadcn app with every stock component installed, two team wrappers around Button, three edited ui files, no specs, and "our components are missing loading and error states, sort them out". The phase cap cuts Table and Card.

**Expect:** `base-shadcn.md` loaded and `shadcn info --json` saved. `scripts/ui-drift.tsv` marks every ui file stock, customized or forked, each with a hash. `harden/gaps.tsv` lists missing states, precedence and keyboard paths. Every component gains its missing states, not only the pilot's. Loading sets `aria-disabled` and `aria-busy`, keeps focus, and blocks a second press. The wrappers merge by the contract with map entries. Table and Card leave with their states built or a gate naming each one, and a removed prop is a gate listing its call sites. `strays.tsv` exists. No stock file is deprecated or rewritten.

**Fails if:** only the pilot's components gain states, loading drops focus, a family leaves with neither states nor a gate, a prop vanishes with no gate, or `--overwrite` runs without a gate.

## Seed mode

**Input:** a new Next.js app with a logo SVG, a README line "our color is #0B5FFF, mobile first", and "give me a design system before we build any screens".

**Expect:** seed on shadcn and Tailwind v4, stated in the Frame. The brand hex goes into `--primary` converted to OKLCH by a script, with the hex in the role comment and a gate defaulting to it. Preset values kept as stock are decisions, not gates. Non-text pairs (checkbox border, focus ring with its alpha, checked fill) are measured at 3:1, and a failure is fixed in the owned token as a decision. Primary actions are at least 44px tall at 390, as a decision. Dark mode follows the OS, proven by `capture.mjs --theme-via media`. The pilot is a list pattern page under `/system` with empty, loading and error states. The montage runs with no before captures. Each coverage-gaps row has a Meanwhile that lets the next screen add what it needs.

**Fails if:** a second accent or new typeface appears, stock values arrive as gates, a dark OS gets the light page, 44px is a gate, a product screen is built, or a gaps row forbids building a missing component.

## Foundation owns its tokens

**Input A:** a shadcn app whose product code uses `text-gray-500` for secondary text on 40 lines. **Input B:** an MUI app with a `createTheme` file, raw hex in `sx` props and two `Button` wrappers.

**Expect A:** no DTCG generator. The lines land on `text-muted-foreground`. A new role is a new pair under `:root` and `.dark` with its `@theme inline` line. No shadcn name is renamed, there is no `--color-*: initial` reset, and palette classes fail under `rule/palette-use`. **Expect B:** `base-library.md` loaded, the theme is the token source, and direct library Button imports become map entries to the canonical wrapper.

**Fails if:** a generator writes over shadcn's lines, a shadcn variable is renamed, or a second token source appears beside the theme.

## Derived rules

**Input:** an app where 41 of 47 section headings render at weight 600 and 6 at 700, and where every resting card draws both a border and a shadow.

**Expect:** the rendered-style pass in `traps.md` runs in the browser and saves its output. The heading weight becomes a `rule/` line with its count and screens, and the outliers go to `strays.tsv`. The card edge is a majority trap, so it becomes a gate whose default is the trap's fix, border only, applied with its count.

**Fails if:** a rule has no count behind it, a value arrives from another product's system, or border plus shadow becomes the rule because it is the majority.

## Measured traps

**Input:** a pilot with a Send button that appends "…" while pending, a row of two buttons where one label wraps at 390, a panel whose fill equals the page, a nav that hides two links past its edge at 390, a dialog taller than a 390x320 screen, and an enter animation that runs under reduced motion.

**Expect:** the button box is measured idle and pending, and any width change fails `trap/loading-layout-shift` until the numbers match. `probe.mjs` lists the wrapped label with its line count, the flat panel, each hidden nav link with "no cue", the dialog nothing scrolls, and the animation. A stretched one-line button is not listed. The montage fails each new one unless its trace row names a gate.

**Fails if:** a trap is marked fixed with no before and after numbers, a wrap is missed because the height grew less than 1.5 times, or a clipped link reads as fine because the page no longer overflows.

## Scripts prove themselves

**Input:** copy `scripts/` into each practice repo, run `check-system.mjs --init`, `--hash-stock` and `--init-allowlist`, then seed one violation per rule: raw hex, an rgba inside an arbitrary value, a named color, `p-[13px]`, `1.25rem` padding, a palette class, `bg-white` where the theme has a surface role, inline px, a native `<button>`, a three-line `<div onClick>`, `<a role="button">`, a Link styled as a button, `<Link><Button>`, a loading label ternary, a padding override on a registry component, a `<Label>` with no `htmlFor`, a deprecated import, an unregistered ui file and a stock-file edit. Run `tsc --noEmit` before and after the copy, and run every script with absolute paths from an empty folder outside the repo.

**Expect:** `--self-test` passes every fixture. Every seed fires under its rule, and removing the seeds gives exit 0. Every passing fixture copied into the app gives exit 0. One more hex in an allowlisted file fails with "allowlist holds N, found N+1". `tsc` reports no new errors, since fixture sources end in `.fixture`. From outside, each script resolves the app's root from its first path and prints the same counts, and `check-system.mjs` with no path exits 2 instead of passing.

**Fails if:** a rule misses its seed, a passing fixture fails in a real app, the allowlist grows without failing, a fixture compiles, or a script prints zeros or a clean pass from the wrong folder.

## Check sees the drift sources

**Input:** a shadcn app with customized `button.tsx` and `dialog.tsx`. Save stock copies with `--save-stock`, then one at a time: rename `--muted-foreground` in `:root` and `@theme` but not `.dark`, change `bg-popover` to `bg-white` in the customized Dialog, change `h-9` to `h-10` in the customized Button, mount a Dialog conditionally, and swap an allowlisted hex for a new one in the same file.

**Expect:** `--init` writes no empty config value and names each key left at its default. Upstream's own literals in customized files are exempt and counted, and only the team's lines fail. Each re-plant fails under its rule: `rule/token-parity`, `rule/stock-edit`, `trap/overlay-conditional-render`, and `rule/raw-value` with "not in the allowlist for this file". `--rehash` without `--note` exits 2. Every report ends with "The check cannot see".

**Fails if:** any re-plant passes, a customized row has no hash, an upstream line fails, a team line passes, or the report claims more than the check covers.

## Spec check proves itself

**Input:** after phase 4, blank the Trigger cell of one state row, change a precedence line to "Loading and invalid: which one?", edit a line a committed spec cites, add a call site the spec's count misses, and add a prop with a JSDoc line to a component's props type.

**Expect:** `check-spec.mjs` exits 1 and names each line under `spec/states-empty`, `spec/precedence`, `spec/stale-cite` and `spec/call-sites`. `gen-docs.mjs --check` fails until gen-docs reruns, and the regenerated Props table carries the JSDoc text. Restoring the files gives exit 0. The check runs from the CI command.

**Fails if:** any edit passes, a Props table is hand-written, or `--check` needs the write run's flags.

## Generated docs

**Input:** after phase 7, delete `## States` from one page, swap `## Props` and `## Variants` in another, hand-edit a twin, and add `.docs h2 { font-size: 32px }` to a docs site where an example renders an `h2`. Run once with a budget too small for everything.

**Expect:** the docs check names the missing and out-of-order sections and the edited twin, and passes once restored. Every twin has its page's H2s in the order in `references/system-structure.md`. `check-docs-leak.mjs` fails on the heading by computed style, and prints SKIP with no browser. On the short budget, the HTML docs site and specs past the pilot's families go first, and the twins, `llms.txt` and the AGENTS.md block still exist.

**Fails if:** a broken page passes, the leak check compares source instead of computed styles, or the generated docs are cut.

## Captures and montage

**Input:** a dev server and `surfaces.tsv` with a `saving` state. Capture before, then edit: a link loses its color, a muted line drops to 2.02:1, a button beside a 36px input grows to 42px, Cancel gains `disabled`, a route gains a new `empty` state, a nav edit changes every route, one listed state has no after pair, and a shared Button change makes `/` answer 500. Compare a `#6b7280` to `#737373` pair with `pixdiff.mjs`.

**Expect:** `capture.mjs --status` prints `FAIL /  500` and exits 1 before any capture. One command writes every route, width and state with a `.probe.json` each. `pixdiff.mjs` at its default shows a nonzero change with `max delta 13`. The montage lists each behavior change and exits 1 on the missing pair, the contrast drop, the link with no resting cue, and the height mismatch. The new state shows after only, the nav routes read "changed (shared)" under one row, and a finding under a gate named in `open-gates.tsv` and the trace row is a warning with exit 0.

**Fails if:** a route at 500 passes because `tsc` is green, a capture needs a shell variable, the gray shift reads as 0%, a behavior change reads as unchanged, or a missing capture, trace row or commit hash can be gated.

## Small footprint

**Input:** any practice repo, then the open-source repo with "open a PR upstream that makes the demos consistent". Clone the full-footprint run branch afterward without `node_modules`, `.next`, `.design-system/` and any skill folder, and run the check command from `package.json`.

**Expect:** full footprint: four scripts, their config, the allowlist, the drift list and stock copies, no fixtures unless the run added a rule, and only `.design-system/review/**/*.png` and `.design-system/tmp/` in `.gitignore`. In the clone the check exits 0 (with `next typegen` before `tsc` on Next 16), and it holds `surfaces.tsv`, `traces.tsv`, the probe files, the review reports and `index.html` with relative paths, and no PNG. On the upstream ask, a footprint gate defaults to minimal: tokens, touched components and screen changes, nothing vendored, `.gitignore` untouched, and `.design-system/` in `.git/info/exclude`.

**Fails if:** the check needs a file only the run folder or a skill folder had, fixtures or capture scripts land in the repo, a PNG is committed, a linked record is missing from the clone, or the minimal run copies scripts or edits `.gitignore`.

## Phase caps

**Input:** a run with a two-hour budget, then the same run with none named.

**Expect:** the Frame's Budget line cites the caps in `references/coordinator-path.md`. A phase at its cap records what is left and the run moves on. Worker spawning stops at 70%, except for landing decided defaults. The coordinator opens each reference only as its phase starts.

**Fails if:** the run record carries a minutes estimate per phase, one phase eats the next one's share, or the coordinator reads every reference before phase 1.

## Final message

**Input:** any finished run that ends with an allowlist.

**Expect:** four parts in order: one plain sentence answering the ask, then which screens changed and which did not with the review page's path; each check command with its exit code; at most 3 gates that change a screen, each with the default applied; one Next prompt that clears every gate at once, such as "Merge ds/<date>-full, but keep the blue Sign in button (reverse G-04)." Every count appears in `.design-system/close.md`, and the message names the files still listed.

**Fails if:** the first line reads as a visible fix when nothing changed, unchanged screens go unmentioned, Next points at a file or asks for a step the run could do, more than 3 gates appear, a red check is left out, a count is missing from `close.md`, or the message says "every screen" while `--left` lists anything.
