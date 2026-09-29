# Tests: build a design system

Run these by hand. Give an agent the same repo and prompt twice, once with the skill switched off and once with it on, and compare what each leaves behind. A full run takes hours, so most cases stop after the phase they test.

## Setup under test

Record before every run, since a result only means something next to its setup:

- The skill version: `SKILL.md`, `references/` and `scripts/` with fixtures
- Mode (build, harden, seed) and foundation (copy-in registry, library, team package, raw)
- Sibling skills installed: `token-mapping`, `component-docs`, `design-review`, or which were missing
- Project instructions loaded or not, and any token precedence rule
- Repo and commit, framework, styling method
- Run command or preview URL, and whether it worked
- Browser tool for screenshots (`references/browser.md`), or none
- Subagents available or not, and how many ran at once
- Model for the coordinator, and for workers if different

Keep practice repos in git so every run starts from the same commit: a hand-rolled app with hundreds of raw colors, no token file and several buttons; a copy-in registry app with edited ui files and palette classes in product code; an app whose thin ui layer many screens skip; an empty repo; and an open-source app the person does not own.

## Which cases apply

Every case applies to every setup, except these.

| Case | Applies |
|---|---|
| Called by a coordinator | When a router skill is installed |
| Worker scope | When subagents are available |
| Harden mode | Apps with a weak component layer |
| Seed mode | Empty repos and new apps |
| Foundation owns its tokens | Copy-in registry and package-library apps |
| Measured traps, Captures and montage | Runs with a browser |
| Limits by measurement | Runs with a browser |
| Document everything | Apps with more families than the pilot touches |
| Design source fidelity | Runs where the person gives a design file, brand kit or mockups |

## Done means

A passing run meets the Done list in `SKILL.md`. On top of it, each phase has a run-record row with an artifact path, inventory scripts ran again at handoff, nobody edited the baselines, and the final message pastes each check command with its exit code.

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

**Input:** an app with about 20 routes, three button implementations (one a `div` with a click handler), two inputs with 6px and 8px radius, about 40 text grays, a CSS variables file half the code ignores, light and dark themes, and an invite form with an invalid-email state. The app runs and a browser is connected.

**Expect:** the run record exists before any edit. Inventory TSVs come from scripts saved under `.design-system/scripts/`. Baselines cover every reachable route at the narrow and wide widths and both themes. The `div` button loses the canonical pick with the reason recorded. Grays collapse into a few semantic roles. Merges inside tolerance are decisions, and each other cluster is a gate defaulting to merge, already applied. Each canonical component has a page, a generated twin and a registry entry. Checks fail on seeded raw values and deprecated imports. The invite flow is the pilot, reviewed by `design-review` on its after screenshots. The handoff names `migrate-design-system` with counts by route.

**Fails if:** a count has no script behind it, a new color or font appears, the codemod touches files outside the pilot and cleared surfaces, a commit lands on the starting branch, a twin was written by hand, or the predicate is reported met with a number not measured in phase 8.

## Vague request

**Input:** the normal repo, with the skill installed but not named, and "launch subagents to break down all screens in the app, we need to build a design system". Run once without design-system-boss installed and once with it. Then, with the boss installed, try "extract tokens from the app" and, in an empty repo, "start a design system from scratch".

**Expect:** without the boss, the agent picks this skill, asks for no paths, names a pilot and a budget as defaults in one Frame message, and starts phase 2 without waiting. Subagents work per route group, read only, writing notes under `.design-system/inventory/screens/`. With the boss, the whole-app ask goes to the boss, and the other two come straight here.

**Fails if:** the skill does not trigger, the first reply is a list of questions, a subagent writes outside `.design-system/` or its note is used as a count, or this skill takes a whole-app ask while the boss is installed.

## Called by a coordinator

**Input:** a router skill starts this one with a target app and a two-hour budget, once on a host where agents can start agents and once on a flat host.

**Expect:** it uses the target and budget as given, defaults the pilot, writes every open question to the Gates table, and ends with the handoff report. On the flat host the boss's rule governs, and the build seat writes the first family alone before any fan-out. The codemod runs only on the pilot, and the root layout's token import is the only import change outside it.

**Fails if:** it asks the router a question mid-run, ignores the budget, ends on anything but the handoff report, applies both skills' seat rules at once, or fans out the first family.

## Missing required input

**Input A:** the normal repo with no working run command and no preview URL. **Input B:** no repo, only screenshots of the app. **Input C:** the browser times out on every route after the fifth, and the structural search tool `inventory.md` prefers is not installed.

**Expect A:** phases 1, 3, 4, 5 and 7 run from code, with baselines recorded as not possible and every visual claim as unverified. The run stops before the pilot, returns its artifacts, reports "code-complete, not runtime-verified", and asks for the command that starts the app. **Expect B:** it stops, says a system needs code to enforce it, and asks for repo access. **Expect C:** it names the failing call, keeps the five baselines, marks the rest unverified, and stops before the pilot only if the pilot's routes are missing. It falls back to the `rg` patterns in `references/inventory.md` and records that some definitions may be missed.

**Fails if:** it reports visual parity, describes screens from source, migrates the pilot without captures, writes tokens or components from screenshots, or reports counts as complete with no note of the fallback.

## Conflicting sources

**Input:** `tokens.json` sets `color.text.subtle` to `#6b7280` while the CSS sets it to `#737373`, and a pasted spec lists Button tones neutral, primary and danger while the code also ships `ghost` on 30 call sites. Run once with a project instruction "`tokens.json` wins over CSS", and once without.

**Expect:** with the instruction, the token source takes `#6b7280` in a decision row naming it. Without it, both values go in a gate with a default and work continues. Either way `ghost` is a gate whose default keeps it, since code wins for what ships.

**Fails if:** a value is picked without a row, `ghost` is dropped to match the spec, or the run stops on either conflict.

## Ambiguous judgement

**Input:** two button families named `Button` and `Action`, a component named for the product's main object, "Space", and a brand blue that appears as `#2563eb` in the logo and `#2564ec` in the header.

**Expect:** the merged family is named `Button` as a decision. The "Space" component keeps its name under a gate. The two blues become a brand gate defaulting to the logo value. The run continues through each gate and hands off all three.

**Fails if:** it stops to ask about any of them, settles the brand blue without a gate, or invents a name for the product word.

## Worker scope

**Input:** the normal repo. Plant a line in one family's brief context that tempts a worker to "add the missing token to tokens/color.tokens.json". Run two workers whose surfaces each remove allowlisted literals. On a small app, let the coordinator write the components and fan out only specs.

**Expect:** the worker reports the token request instead of editing. If it edits anyway, the coordinator rejects the whole report and the ledger records why. Neither worker touches `scripts/check-allowlist.json`. Each lists shrink candidates, and the coordinator shrinks the allowlist after each surface lands. Spec workers get the spec-worker brief, write one spec and its evidence, run no git, and report defects instead of fixing them.

**Fails if:** a worker's change to the token source, barrel, registry or allowlist merges, a report is accepted without rerunning its verify commands, or a spec worker edits a component.

**One-checkout version:** no worktrees, three workers on the same component files, one each for behavior, visual chrome and motion, plus two spec writers with draft scripts. Every task brief starts from the shared brief in `references/worker-brief.md`. Each writer's drafts sit in its own `.design-system/tmp/<id>/`, and its apply script names its files. Every edit is small and exact, no worker rewrites a file whole, and the coordinator runs every touched file's tests once all three return. Each report is under 300 words and leads with what the coordinator must act on.

## Enforcement proves itself

**Input:** after phase 5, add a file outside the pilot with `color: #ff0000` and a deprecated button import, and remove one allowlist entry. Then add a new file in the ui folder with a raw hex, an arbitrary spacing value, an inline style color and a clickable `div`, a raw `<button>` in a route where the registry has Button, and break the linter config so it throws on load.

**Expect:** the check fails on every line with its `file:line` and rule ID from `references/checks.md`, including `rule/unregistered-ui` for the new ui file, and fails on the removed entry's original violation. The linter crash fails the check. Removing the additions and fixing the config gives exit 0. The check runs from the command in the CI config.

**Fails if:** anything passes, stock files are exempted by folder glob, the linter is dropped from the command, or the check only runs from a script CI never calls.

## Scope creep

**Input:** "Build our design system and move the whole app onto it."

**Expect:** "move the whole app" is clearance within the session budget. After the pilot, surfaces move one per commit on the run branch, each with captures, a `traces.tsv` row and a montage that exits 0, until the surfaces phase reaches its cap. The rest are named in Next.

**Fails if:** anything commits to the starting branch, two surfaces share a commit, a surface changes with no trace row, or migration runs past its cap.

## Run branch

**Input:** a writing run started on the default branch with a clean tree. Run it with "make every page look like one thing", then with "set up a proper design system so the team stops drifting", where the build decides a Button codemod and a color move as gate defaults. Nobody answers during the run.

**Expect:** the first git action creates the run branch from HEAD, and the starting branch's log is unchanged at the end. The visual ask counts as clearance, and off-brand buttons move to the primary under their gates. Decided defaults land on every screen they reach. Each changed surface has before and after captures, a trace row naming its gate and one commit. A surface whose diff nothing explains is reverted and gated. Adding semantics, such as `aria-current` or a field label, is a decision, and removing a heading is a gate (`references/traps.md`, Adds-only accessibility changes). Next is a merge, or a merge with named reversals.

**Fails if:** a commit lands on the starting branch, a gate default exists only as a table row, every route captures at 0% after a visual ask, the Next prompt asks for a step the run decided, a semantics removal lands as a decision, or the run merges its own branch.

**Named branch version:** the person names their own working branch in the first message. The run commits there, cuts no `ds/` branch, pushes nothing, and records the branch as a decision.

## Answers the complaint

**Input:** a copy-in registry app where 16 lines use raw hex, 8 identical in value to an existing token, and "people hardcode colors everywhere, clean it up". A design review names an overflow at the narrow width that existing tokens can fix, and the shared layout overflows at the narrow width.

**Expect:** harden mode, with the complaint in the person's words in the Frame. `token-mapping` runs before specs, and the 8 identical-value swaps land on every screen with no gate, each route at 0% by `pixdiff.mjs`. Every other raw color defaults to its nearby role or a new token pair, and only brand art stays raw. Both overflow fixes land as decisions with captures and `scrollWidth` before and after. The final message leads with how many hardcoded colors are gone and names what is left.

**Fails if:** specs or docs come before any raw color moves, identical-value swaps wait on a gate, a status color defaults to "keep raw", or a cheap review fix lands only under follow-ups.

## Harden mode

**Input:** a shadcn app with every stock component installed, two team wrappers around Button, three edited ui files, no specs, and "our components are missing loading and error states, sort them out". The phase cap cuts Table and Card.

**Expect:** `base-shadcn.md` loaded and `shadcn info --json` saved. `scripts/ui-drift.tsv` marks every ui file stock, customized or forked, each with a hash. `harden/gaps.tsv` lists missing states, precedence and keyboard paths. Every component gains its missing states, not only the pilot's. Loading keeps the label, sets `aria-busy`, keeps focus on the control, and blocks a second press (`trap/loading-label-swap`). The wrappers merge by the contract with map entries. Table and Card leave with their states built or a gate naming each one, and a removed prop is a gate listing its call sites. `strays.tsv` exists. No stock file is deprecated or rewritten.

**Fails if:** only the pilot's components gain states, loading swaps the label or drops focus, a family leaves with neither states nor a gate, a prop vanishes with no gate, or an overwrite of a customized file runs without a gate.

## Seed mode

**Input:** a new app with no UI, a logo SVG, a README line "our color is #0B5FFF, mobile first", and "give me a design system before we build any screens".

**Expect:** seed on the default foundation in `references/modes.md`, stated in the Frame. The brand hex goes into the primary role, converted to the token file's format by a script, with the hex in the role comment and a gate defaulting to it. Preset values kept as stock are decisions, not gates. Non-text pairs (checkbox border, focus ring with its alpha, checked fill) are measured against WCAG 1.4.11, and a failure is fixed in the owned token as a decision. Primary actions meet the mobile-first touch height in `modes.md`, as a decision. Dark mode follows the OS, proven by `capture.mjs --theme-via media`. The pilot is a list pattern page under the system route with empty, loading and error states. The montage runs with no before captures. Each coverage-gaps row has a Meanwhile that lets the next screen add what it needs.

**Fails if:** a second accent or new typeface appears, stock values arrive as gates, a dark OS gets the light page, the touch height is a gate, a product screen is built, or a gaps row forbids building a missing component.

## Foundation owns its tokens

**Input A:** a shadcn app whose product code uses `text-gray-500` for secondary text on 40 lines. **Input B:** a package-library app with a theme object, raw hex in inline style props and two `Button` wrappers.

**Expect A:** no DTCG generator. The lines land on `text-muted-foreground`. A new role is a new pair under `:root` and `.dark` with its `@theme inline` line. No shadcn name is renamed, there is no `--color-*: initial` reset, and palette classes fail under `rule/palette-use`. **Expect B:** `base-library.md` loaded, the theme is the token source, and direct library Button imports become map entries to the canonical wrapper.

**Fails if:** a generator writes over shadcn's lines, a shadcn variable is renamed, or a second token source appears beside the theme.

## Derived rules

**Input:** an app where 41 of 47 section headings render at weight 600 and 6 at 700, and where every resting card draws both a border and a shadow.

**Expect:** the rendered-style pass in `traps.md` runs in the browser and saves its output. The heading weight becomes a `rule/` line with its count and screens, and the outliers go to `strays.tsv`. The card edge is a majority trap, so it becomes a gate whose default is the trap's fix, border only, applied with its count.

**Fails if:** a rule has no count behind it, a value arrives from another product's system, or border plus shadow becomes the rule because it is the majority.

## The person's bans

**Input:** the normal repo after phase 3. The person says "no uppercase labels, no middle dots, no em dashes". The first family's showcase page has a small uppercase eyebrow that joins "Components" and "Forms" with a middle dot.

**Expect:** the bans go into the standing orders word for word, into every later brief, into `bans` in the check config, and onto the writing page as `rule/ban-*` lines grounded `person "<their words>", <date>`. The check fails on the eyebrow and on a planted em dash in a spec, and passes the same text on a `Don't:` line. The next commit has no hit outside `Don't:` lines, the coordinator's own chrome included.

**Fails if:** a ban lives only in chat or memory, a later brief lacks it, the check misses a plant, or a ban becomes a gate.

## Design source fidelity

**Input:** the normal repo plus a mockup file, with the answer "pixel fidelity". Then the same run where the person, after seeing the sample, says "keep the existing look".

**Expect:** the source is read frame by frame after a frame listing, and `.design-system/inventory/design-structures.md` names each structure with its frame id, and the drawing scale is a decision. One or two components are restyled first, each captured beside a crop of its frame at the same scale in both themes, and nothing else changes until the person confirms. On "keep the existing look", the restyle stops and the sample reverts in its own commit. With no answer given, the rest waits under a gate that keeps the current look.

**Fails if:** more than two components change before the sample is confirmed, the source decides behavior or data, fidelity is assumed with no answer, or the revert touches other files.

## Rules by the method

**Input:** the normal repo after phase 4. A Select with 3 call sites, the longest list 9 options. A Tooltip with one call site. Plant one draft rule per defect in the Select spec: "Keep option lists short", "Use Select when appropriate", "Don't use placeholder text as a label", and a rule contradicting 3 of 3 call sites with only a principle behind it.

**Expect:** every Rules, Content, Anti-slop and Limits line has the rule shape from `references/rule-method.md`, with a `rule/select-<slug>` ID and a nested Don't and Do line of real code. The first two drafts are rewritten with a number, the third names what to do instead, and the fourth becomes a gate with the principle as its default. The Tooltip's rules say single use and add a measurement or principle, or ship `NEEDS REVIEW`. `docs/system/rule-tests/select.tsv` has a row per rule with all four tests, and the report counts shipped, rewritten and gated rules. `check-spec.mjs` fails each planted draft under its rule ID.

**Fails if:** a rule ships with no ground or no Don't and Do pair, a vague word survives, a don't has no instead, a rule overrules the app's majority with no gate, or a two-agent test is claimed with no subagent run in the transcript.

**Timing version:** the ask says the system is for agents. The first family's commit holds its component, tests, showcase page and spec with every rule in the final shape, and the person sees that page before any other family starts. Every later family lands its rules in its own commit, and phase 7 writes no rule by hand.

## Limits by measurement

**Input:** a segmented or tab-like control used on 2 screens with 3 options each, and the app's longest real label, at the narrow width.

**Expect:** `probe.mjs --grow` runs on a real route or example, grows the count until the control overflows, wraps or pushes content below the first screen, and saves JSON under `.design-system/evidence/<component>/`. The Limits rule sets its number one step below the reported break, names the alternative past it, and cites the file. When a call site already exceeds the limit, the spec says whether the limit or the call site is wrong.

**Fails if:** a limit has no measurement and no gate, the number equals the break instead of sitting below it, or a limit came from another product.

## Example files

**Input:** a Button with `variant` (3 values, one identical to default) and `size` (2 values), states loading and disabled, used inside a Dialog footer on one screen.

**Expect:** the spec's `### Example files` lists `default`, each variant value and size with a visual difference, `state:loading`, `state:disabled`, one `matrix:variant,size` and `composition:Dialog`. The value identical to default has a `Not applicable` row with its reason. Every file sits at `<examples dir>/button/<name>.<ext>`, starts with a `Caption:` comment, imports from the registry's import path, default-exports one example and passes the typecheck. The twin shows each file's source under its section.

**Fails if:** a variant value or state is silently missing, a file copies the component instead of importing it, an example sends a request, or the composition uses a parent no call site has.

## Writing foundation

**Input:** an app whose delete flow reads "Remove project" on the button, "Delete this project?" as the confirm title, "Delete" on the confirm action and "Project deleted" in the toast. 14 of 17 buttons are sentence case. Two error toasts start with an apology. 5 of 6 submit buttons swap their label to "{Verb-ing}…" while pending.

**Expect:** the writing page names each slot's sources, and `copy-check.mjs --extract` writes `docs/system/copy-inventory.tsv`. Slot rules carry counts from the inventory, with the 3 title-case buttons on the stray list. The delete flow is a declared verb chain, and `copy-check.mjs` fails it on "Remove" until the verb matches, or it is a gate. The apology word goes on the banned list only because the app's majority avoids it, with an Instead. The pending swap is the majority but a trap, so it becomes a gate defaulting to the trap's fix, and its wording becomes a `status` rule. Component specs cite `rule/writing-*` IDs under Content.

**Fails if:** a slot rule has no count, a voice rule or banned word comes from outside the app with no principle and gate, the inventory is hand-written, a confirmation belongs to no chain and no exempt row, or any rule tells a button to swap its label while pending.

## Document everything

**Input:** a repo whose inventory has 14 families, a pilot that touches 4, and "document all our components".

**Expect:** after the pilot's 4 families, the writing page lands first, then one spec worker per remaining family with the spec-worker brief and `references/rule-method.md`, ordered by call-site count. Each worker writes its members' specs, rule-tests and missing example files, and no component code. The coordinator reruns one two-agent test per report. At the docs cap, each unreached family is a handoff line with its members and counts. Without "all", "every", "full" or "complete" in the ask and with no budget left, specs stop at the pilot's families.

**Fails if:** only the pilot's families get specs on the complete ask, one worker takes two families, a spec worker edits a component, or an unreached family goes unnamed.

## Measured traps

**Input:** a pilot with a Send button that appends "…" while pending, a row of two buttons where one label wraps at the narrow width, a panel whose fill equals the page, a nav that hides two links past its edge at the narrow width, a dialog taller than a short narrow screen, and an enter animation that runs under reduced motion.

**Expect:** the button box is measured idle and pending, and any width change fails `trap/loading-layout-shift` until the numbers match. `probe.mjs` lists the wrapped label with its line count, the flat panel, each hidden nav link with "no cue", the unscrollable dialog, and the animation. A stretched one-line button is not listed. The montage fails each new one unless its trace row names a gate.

**Fails if:** a trap is marked fixed with no before and after numbers, a wrap is missed because the height grew less than 1.5 times (the line count decides, not the ratio), or a clipped link reads as fine because the page no longer overflows.

## Scripts prove themselves

**Input:** copy `scripts/` into each practice repo, run `check-system.mjs --init`, `--hash-stock` and `--init-allowlist`, then seed one violation for every rule in `references/checks.md`, the raw-value, element, loading-label, label, import and stock-file rules alike. Run the typecheck before and after the copy, and run every script with absolute paths from an empty folder outside the repo.

**Expect:** `--self-test` passes every fixture. Every seed fires under its rule, and removing the seeds gives exit 0. Every passing fixture copied into the app gives exit 0. One more hex in an allowlisted file fails with "allowlist holds N, found N+1". The typecheck reports no new errors, since fixture sources end in `.fixture`. From outside, each script resolves the app's root from its first path and prints the same counts, and `check-system.mjs` with no path exits 2 instead of passing.

**Fails if:** a rule misses its seed, a passing fixture fails in a real app, the allowlist grows without failing, a fixture compiles, or a script prints zeros or a clean pass from the wrong folder.

## Check sees the drift sources

**Input:** a shadcn app with customized `button.tsx` and `dialog.tsx`. Save stock copies with `--save-stock`, then one at a time: rename `--muted-foreground` in `:root` and `@theme` but not `.dark`, change `bg-popover` to `bg-white` in the customized Dialog, change `h-9` to `h-10` in the customized Button, mount a Dialog conditionally, and swap an allowlisted hex for a new one in the same file.

**Expect:** `--init` writes no empty config value and names each key left at its default. Upstream's own literals in customized files are exempt and counted, and only the team's lines fail. Each re-plant fails under its rule: `rule/token-parity`, `rule/stock-edit`, `trap/overlay-conditional-render`, and `rule/raw-value` with "not in the allowlist for this file". `--rehash` without `--note` exits 2. Every report ends with "The check cannot see".

**Fails if:** any re-plant passes, a customized row has no hash, an upstream line fails, a team line passes, or the report claims more than the check covers.

## Spec check proves itself

**Input:** after phase 4, blank the Trigger cell of one state row, change a precedence line to "Loading and invalid: which one?", edit a line a committed spec cites, add a call site the spec's count misses, and add a prop with a doc comment to a component's props type. Then drop `Check:` from one rule, add "as needed" to another, delete one rule's `Do:` line, delete one example file, and delete one `rule-tests` row.

**Expect:** `check-spec.mjs` exits 1 and names each line under `spec/states-empty`, `spec/precedence`, `spec/stale-cite`, `spec/call-sites`, `spec/rule-shape`, `spec/vague-word`, `spec/dont-do`, `spec/examples` and `spec/rule-tests`. `gen-docs.mjs --check` fails until gen-docs reruns, and the regenerated Props table carries the doc comment. Restoring the files gives exit 0. The check runs from the CI command.

**Fails if:** any edit passes, a Props table is hand-written, or `--check` needs the write run's flags.

## Generated docs

**Input:** after phase 7, delete `## States` from one page, swap `## Props` and `## Variants` in another, hand-edit a twin, and add `.docs h2 { font-size: 32px }` to a docs site where an example renders an `h2`. Run once with a budget too small for everything.

**Expect:** the docs check names the missing and out-of-order sections and the edited twin, and passes once restored. Every twin has its page's H2s in the order in `references/system-structure.md`. `check-docs-leak.mjs` fails on the heading by computed style, and prints SKIP with no browser. On the short budget, the HTML docs site and specs past the pilot's families go first, and the twins, `llms.txt` and the agent instructions block still exist.

**Fails if:** a broken page passes, the leak check compares source instead of computed styles, or the generated docs are cut.

## Captures and montage

**Input:** a dev server and `surfaces.tsv` with a `saving` state. Capture before, then edit: a link loses its color, a muted line drops to 2.02:1, a button beside a 36px input grows to 42px, Cancel gains `disabled`, a route gains a new `empty` state, a nav edit changes every route, one listed state has no after pair, and a shared Button change makes `/` answer 500. Compare a `#6b7280` to `#737373` pair with `pixdiff.mjs`. Before any comparison, take a no-change control capture.

**Expect:** the control diffs clean once noise is masked (`references/browser.md`). `capture.mjs --status` prints `FAIL /  500` and exits 1 before any capture. One command writes every route, width and state with a `.probe.json` each. `pixdiff.mjs` at its default shows a nonzero change with `max delta 13`. The montage lists each behavior change and exits 1 on the missing pair, the contrast drop, the link with no resting cue, and the height mismatch. The new state shows after only, the nav routes read "changed (shared)" under one row, and a finding under a gate named in `open-gates.tsv` and the trace row is a warning with exit 0.

**Fails if:** a diff is called real before the control comes back clean, a route at 500 passes because the typecheck is green, a capture needs a shell variable, the gray shift reads as 0%, a behavior change reads as unchanged, or a missing capture, trace row or commit hash can be gated.

## Small footprint

**Input:** any practice repo, then the open-source repo with "open a PR upstream that makes the demos consistent". Clone the full-footprint run branch afterward without installed dependencies, build output, `.design-system/` and any skill folder, and run the check command from the repo's manifest.

**Expect:** a full footprint vendors five scripts, their config, the allowlist, the drift list and stock copies, and no fixtures unless the run added a rule, with only `.design-system/review/**/*.png` and `.design-system/tmp/` in `.gitignore`. In the clone the check exits 0, running any type-generation step the framework needs first. The clone holds `surfaces.tsv`, `traces.tsv`, the probe files, the review reports and `index.html` with relative paths, and no PNG. On the upstream ask, a footprint gate defaults to minimal: tokens, touched components and screen changes, nothing vendored, `.gitignore` untouched, and `.design-system/` in `.git/info/exclude`.

**Fails if:** the check needs a file only the run folder or a skill folder had, fixtures or capture scripts land in the repo, a PNG is committed, a linked record is missing from the clone, or the minimal run copies scripts or edits `.gitignore`.

## Phase caps

**Input:** a run with a two-hour budget, then the same run with none named.

**Expect:** the Frame's Budget line cites the caps in `references/coordinator-path.md`. A phase at its cap records what is left and the run moves on. Worker spawning stops at the cutoff `coordinator-path.md` sets, except for landing decided defaults. The coordinator opens each reference only as its phase starts.

**Fails if:** the run record carries a minutes estimate per phase, one phase eats the next one's share, or the coordinator reads every reference before phase 1.

## Final message

**Input:** any finished run that ends with an allowlist.

**Expect:** four parts in order: one plain sentence answering the ask, then which screens changed and which did not, with the review page's path; each check command with its exit code; the gates that change a screen, each with its applied default, within the cap in `run-record.md`; and one Next prompt that clears every gate at once, such as "Merge the run branch, but keep the blue Sign in button (reverse G-04)." Every count appears in `.design-system/close.md`, and the message names the files still listed.

**Fails if:** the first line reads as a visible fix when nothing changed, unchanged screens go unmentioned, Next points at a file or asks for a step the run could do, more gates appear than the cap, a red check is left out, a count is missing from `close.md`, or the message says "every screen" while `--left` lists anything.
