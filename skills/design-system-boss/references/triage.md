# Triage

Triage runs one script and a few reads, with no browser or subagent. It decides the route, so every call traces to a number a person can rerun.

## Contents

- Running the script
- Signals
- The foundation
- The app's state
- The ask's intent
- The one question
- Standing questions
- Blind spots

## Running the script

```sh
bash <skills>/design-system-boss/scripts/triage.sh <repo> <repo>/.design-system/boss/triage
```

It prints `signal<TAB>value` lines and writes them to `signals.tsv`, with match lists beside it (`raw-colors.txt`, `components.tsv`, `components-layer.tsv`, `families.tsv`, `wrappers.tsv`, `raw-families.tsv`, `layer-dirs.tsv`, `harden-dirs.tsv`, `stray-dirs.tsv`, `tw-semantic.txt`, `routes.txt`, `route-files.txt`, `token-files.txt`, and `shadcn-info.json` when it ran). It also writes `tw-arbitrary.txt`, `tw-palette.txt` and `inline-styles.txt`, the match lists behind `tw_arbitrary`, `tw_palette` and `inline_styles`. It reads only files git tracks or would track, writes only into the output folder, and needs `rg`, plus `node` when a `components.json` exists.

When `components.json` exists, the script asks the shadcn CLI from `node_modules/.bin` for the project's config and never downloads it on its own. `TRIAGE_SHADCN_INFO=npx` allows the download, and `0` skips the call. Without the CLI, the script reads `components.json` directly and says so in `shadcn_info`. Where they differ, trust the CLI over the file and over anything inferred.

When `rg` is missing, the script exits with a message. Run these instead, save each output in the same folder, and record the fallback in the state file. They skip `.gitignore`, so the excludes do that job. `--exclude-dir` matches folder names only, so `S` drops `docs/system`, `public/system` and `static/system` by path, and a folder holding a `SKILL.md` outside `.agents/` or `.claude/` needs its own `--exclude-dir`.

```sh
X='--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=out --exclude-dir=.design-system --exclude-dir=.migration --exclude-dir=.agents --exclude-dir=.claude --exclude-dir=scripts --exclude-dir=fixtures --exclude-dir=__fixtures__ --exclude=*.fixture*'
S='^\./(.*/)?(docs|public|static)/system/'
grep -rIn $X -E '#[0-9a-fA-F]{3,8}([^0-9A-Za-z-]|$)|(^|[^A-Za-z0-9-])(rgba?|hsla?|oklch)\(' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' . \
  | grep -vE "$S" | grep -vE '^[^:]*:[0-9]+:[[:space:]]*--' > raw-colors.txt
grep -rIo $X -E 'var\(--[a-zA-Z][a-zA-Z0-9-]*' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' . | grep -vE "$S" | wc -l
grep -rIn $X --exclude-dir=examples --exclude-dir=docs --exclude-dir=checks -E 'export (default )?(function|const|class) [A-Z]' --include='*.tsx' --include='*.jsx' . | grep -vE "$S" > components.txt
find . -name '*.tokens.json' -o -name 'tailwind.config.*' -o -path '*/tokens/*.json' | grep -v node_modules
cat components.json package.json   # foundation: shadcn config, or a UI library dependency
```

In a monorepo, run it per app folder, each into its own subfolder of `triage/`. After editing the script, run `triage.sh --self-test`. It ends `all as expected`.

## Signals

Two units. A **line** signal counts source lines, so a line holding three hex values counts once. An **occurrence** signal counts every match. `token-mapping` counts occurrences, so compare its totals with `raw_color_occurrences`, never `raw_color_lines`. `adoption_pct` mixes the two, which is fine for picking a state and wrong for a before-and-after claim. The report names the unit beside every count.

Every count leaves out the paths in `build-design-system/references/inventory.md` (Excluded paths), build output included, so a route folder named `build` is listed by hand. The script adds `scripts/`, `fixtures/` and `static/system/`, because the build copies its check scripts and fixtures into `scripts/`, check fixtures also sit in plain `fixtures/` folders, and some frameworks serve generated twins from `static/`. Without the rule the build's own fixtures and generated HTML would count as drift. `scaffold_files_skipped` says how many files that left out. Presence signals such as `llms_txt` still see `public/llms.txt`.

Adoption also leaves out the component layer, the token source, examples, docs, tests and stories, or a system's own `var()` uses would make a weak system read as settled. Component and family counts leave out the same examples, docs and check folders, so planted fixtures never read as duplicate families. `component_specs` is the one count that reads `docs/system`, where specs live, so a triage after a run sees the specs it wrote. It leaves out twins and `spec-template.md`.

| Signal | Unit | Measures | Feeds |
|---|---|---|---|
| `token_files` | files | DTCG files, a `tokens/` folder, and the theme or config files of the styling setup the script detects | whether a token source exists |
| `custom_property_defs` | occurrences | CSS custom property definitions | a token source written as plain CSS |
| `token_refs` | occurrences | `var(--…)` and `theme()` uses in product files, token definition lines excluded | adoption |
| `tw_semantic` | occurrences | Tailwind utilities built from the project's own theme color names, such as `bg-primary` | adoption |
| `raw_color_lines` | lines | lines in product files with a hex, `rgb()`, `hsl()` or `oklch()` value, token definition lines excluded. Values inside arbitrary utility values count too | adoption, the Values route |
| `raw_color_occurrences` | occurrences | the same values, counted per match | comparing with `token-mapping` |
| `tw_arbitrary` | occurrences | Tailwind arbitrary values such as `p-[13px]`, with variants like `data-[state=open]:` excluded | adoption |
| `tw_palette` | occurrences | palette-scale classes such as `text-gray-500`, from the framework's default palette or a scale the project declares. Primitives with no purpose, so neither token use nor raw values | `palette_pct` |
| `adoption_pct` | percent of mixed units | token uses (`token_refs` plus `tw_semantic`) as a share of token uses plus raw values (`raw_color_lines` plus `tw_arbitrary`) | drifting or settled |
| `palette_pct` | percent of mixed units | `tw_palette` as a share of token uses plus raw values plus palette classes | how much color has no stated purpose |
| `component_defs`, `same_name_defs` | definitions | exported capitalized components, and names defined in more than one file | duplicates |
| `product_component_defs`, `stock_ui_defs` | definitions | definitions outside stock shadcn files, and inside them | empty, and duplicates |
| `families_with_2plus` | families | families (Button, Input, Dialog and so on) with two or more canonical members. A member is a definition matched on name suffix, or a raw copy. Stock shadcn files count as one member per family. A wrapper is not a member: a definition that renders another member of its family, aliases one, or is marked `@deprecated`, so merging a copy into the canonical component lowers the count. `wrappers.tsv` gives each reason | drifting or settled |
| `raw_family_copies` | elements | raw `<button>`, `<input>`, `<textarea>`, `<select>` and `<a>` elements sharing 3 or more static classes with the same element in another file. The family's component file holds the canonical copy and never counts. `raw-families.tsv` lists each copy and its match | duplicates the name suffix misses, and the Named families edit list |
| `foundation` | name | `shadcn`, `shadcn+registry`, `library:<package>`, `package:<name>`, `raw`, or `none (default: shadcn)` on an empty app (the **empty** rule in The app's state) | which base reference the steps load |
| `ui_library`, `own_package` | names | a UI library dependency, and the team's own UI package | `foundation` |
| `framework`, `tailwind`, `inline_styles`, `storybook`, `git_branch` | names, occurrences | the stack, inline style objects, a Storybook folder and the starting branch | informational. They route nothing, and briefs get them as context |
| `shadcn_base`, `shadcn_style`, `tailwind_css_file`, `shadcn_ui_dir`, `shadcn_registries` | names | from the shadcn CLI, or `components.json` | base-shadcn.md |
| `ui_raw_lines` | lines | raw colors and palette classes inside the component layer, upstream's own on shadcn | reported apart. Raw work across the app is this plus `raw_color_lines` |
| `component_specs` | files | Markdown files with a `### State precedence` section, the mark of a filled spec template | weak or hardened |
| `shared_ui_dirs` | folders | the component layer, always a folder of shared components and never the source root: a folder that holds a route file is dropped, with its reason in `layer-dirs.tsv`. A folder counts by name (`components/ui`, `packages/ui`, `packages/*/src`, `ui/`, `src/ui/`, `src/components/`, `design-system`, `ui-kit`), by a barrel (`index.ts` re-exporting 3 or more components), or because 3 or more route files import a component file from it. Folders inside the route tree do not count by imports, and neither do strays. `layer-dirs.tsv` gives each folder's reason | where a system lives, and what adoption leaves out |
| `harden_dirs` | folders | layer folders with 5 or more components that 3 or more routes import. `harden-dirs.tsv` gives both counts | Harden or Build |
| `stray_dirs` | folders | layer folders that duplicate a family already in a harden dir, such as `components/custom/Button.tsx` beside `components/ui/button.tsx`. A stray is not the layer, so its raw values count as product code before and after, even inside a layer folder. The shadcn ui folder and harden dirs are never strays. `stray-dirs.tsv` names the duplicate | stable before-and-after counts, and harden's stray-code list |
| `system_docs_routes`, `llms_txt`, `registry_json`, `stories` | files | docs a person or agent can read. `registry_json` is `shadcn` (an `items` list), `designhow` (a `components` list), `other` or `no` | settled or documented |
| `build_record`, `migration_runs`, `boss_state` | paths | earlier runs | resume |
| `run_script`, `routes`, `source_lines`, `families_present` | routes, lines, families | whether the app can start, and how big it is. A file-based router (Next, Nuxt, SvelteKit, Astro, Remix) gives route files, private folders left out. Any other app gives the distinct paths in its router config (`path:`, `<Route path=`), `*` left out, so a `pages/` folder there is not a route list. `routes.txt` has one route per line, `route-files.txt` the files they render | which steps can verify visually, and the default flows for a review |
| `ui_lines`, `small_app` | lines, yes or no | lines of markup and style files, and whether `routes` is 8 or fewer with `ui_lines` under 3,000 | the small-app fast path (`routes.md`, Small app) |
| `scaffold_files_skipped` | files | source files left out as scaffolding | reading a before-and-after, where a rise here is the build's own output, not drift |
| `git_uncommitted` | files | uncommitted files outside skill and run folders | the question on unrelated work. Above 0 on a writing route, the boss asks the person and never stashes. So does a starting branch whose recent commits are another author's, unless the person named it. Unanswered, the default cuts the run branch from HEAD in its own worktree, so the checkout and its branch stay as found |

## The foundation

The foundation decides which base reference in `build-design-system/references/` every step loads. It does not change the route.

| `foundation` | Base reference | Where the system lives |
|---|---|---|
| `shadcn`, `shadcn+registry` | `base-shadcn.md` | `components/ui` copied in by the CLI, tokens as CSS variable pairs in `tailwind_css_file`, a namespaced registry when one is configured |
| `library:<package>` | `base-library.md` | the library's theme object and its components, wrapped where the team needs its own API |
| `package:<name>` | `base-shadcn.md` when that package ships a shadcn registry, else `base-library.md` | the team's own package, read like a library |
| `raw` | `base-raw.md` | whatever folders the inventory finds |
| `none (default: shadcn)` | `base-shadcn.md` | nothing yet. The Seed route starts it on shadcn |

Two foundations can show at once, such as shadcn beside a leftover component library. Take the one product code imports most, name the other in the Frame, and treat its imports as legacy.

With no foundation and nothing shipped yet, the default is shadcn, per `base-shadcn.md`. Say so in the Frame, along with the capture tools, `capture.mjs` for captures and a browser tool for one-off evidence (see `browser.md`).

## The app's state

Apply these in order and take the first that matches. Write the deciding signal next to the state.

1. `boss_state` is set. Resume. No new triage decision.
2. `routes` is 1 or fewer and `product_component_defs` is 2 or fewer. **empty**. That is at most a starter page and its layout, so the app has no product route, and the system starts from brand material or shadcn defaults. The component count keeps out an app whose routes live in code, which the script cannot see. A small shipped app gets Build, never Seed.
3. `token_files` is 0 and `custom_property_defs` is under 20. **none**.
4. `adoption_pct` is under 80, `palette_pct` is 30 or more, or `families_with_2plus` is 2 or more. **drifting**.
5. `system_docs_routes` is 0, or `llms_txt` is no, or `registry_json` is no. **settled**.
6. Otherwise **documented**.

`drifting` and `settled` each split by whether a component layer worth hardening exists, which is when `harden_dirs` is set: 5 or more components imported by 3 or more routes. `build-design-system/references/modes.md` keeps a standalone copy of this rule. A smaller or less used layer gets built, not hardened. A system with such a layer is **weak** when `component_specs` is 0 or its families still duplicate. Weak systems get hardened before anyone migrates onto them.

Palette classes sit outside `adoption_pct`, as `token-mapping` counts them. A high `palette_pct` means much of the app's color names a value and no job. The Values and Review routes then answer "are colors consistent" by role, per `token-mapping`'s Consistency by role section, and the Frame says so.

These are unmeasured defaults. Replace them with your app's numbers, here and nowhere else.

A `build_record` with no handoff section means an earlier build stopped partway. Route to Build, and the build resumes from its own record. A migration run folder with open surfaces does the same for Adopt.

Before routing on `documented`, compare one component page and its `.md` twin with the component skeleton in `build-design-system/references/system-structure.md`. If their H2s differ, the state is **settled**, since the docs exist but not in the target structure.

## The ask's intent

Read the ask for these words. The rows run from named complaints to generic verbs, and the first match wins, so a named complaint beats a generic verb. "Clean it up, people hardcode colors everywhere" is values, not full. "Clean it up and make it consistent" with hardcoded colors is values too. Neither names a migration, so both end check-first (`routes.md`, the rules at the top), and the handoff offers the migration with its size.

| The ask says | Intent |
|---|---|
| component families by name plus a PR or upstream: "make the buttons and headings consistent, I want to send this upstream" | named families, minimal footprint |
| one component by name, "document the X", "what states does X have" | component |
| "before we ship", "before I ship", "review this screen", "is this ready", "handoff", "is it consistent", "are we consistent", "check" as the main verb | review |
| "how bad", "audit", "where do we stand", "don't change anything" | audit |
| "hardcoded", "raw values", "use our tokens", "colors are everywhere" | values |
| "every page", "every screen" or "the whole app" with a verb that means change: "make every page consistent", "clean up every page", "migrate everything" | full, and the ask counts as clearance |
| "looks like a different product", "make it look like one thing", "every page looks different" | full |
| "consistent" or "consistency" with a verb that means change: "make it consistent", "fix the inconsistency", "clean up the inconsistent X" | full. With hardcoded values named too, the values row wins |
| "consistent", "consistency", "colors" with no verb that means change | review, plus `token-mapping` on the same files, which answers by role |
| "missing states", or "missing" with a kind of state: "missing loading and error states", "no error state", "no empty state" | harden |
| "harden", "fill the states", "our components have no rules", "tighten the system", "make it solid", "stops drifting" | harden |
| "docs", "document the system", "agents can't read our components", "document all our components", "full design system docs" | docs. "All", "every", "full" or "complete" means every family |
| "fix it", "fix this", "clean it all up", "clean it up", "clean the app up", "mess", "sort out our UI" | full |
| "migrate", "move every screen", "roll out", "adopt", "use it everywhere" | adopt, and the ask counts as clearance |
| "nobody uses it", "nobody follows it", "the screens ignore it" | adopt |
| "start a design system", "new app", "from scratch", "from our brand" | seed |
| "build", "set up", "extract", "break down the screens", "consolidate", "we need a design system" | build |

An ask that matches nothing is **seed** when the state is `empty`, **full** when it is `none` or `drifting`, and **adopt** when it is `settled`. A fallback intent never counts as clearance.

The clearance words are listed in `build-design-system/references/run-record.md` (Terms), and the rows above marked "counts as clearance" follow that list. Only an ask that names the migration clears it. A complaint ("fix it", "make it consistent", "nobody uses it") routes the same way without clearance, which ends check-first with the offer. Clearance holds within the session budget, on the run branch. When an ask names two things, such as missing states and "move every screen", the first row still picks the route and the migration words still give clearance.

"Launch subagents" is a delegation request, not an intent. Honor it in the step that fans out.

## The one question

Ask at most one, and only for one of these:

- A monorepo target nobody named. Name the candidates with their route counts. The default is the app with the most routes.
- An intent that fits two routes differing by a whole phase, such as build only against build then migrate. The default is the route that answers the complaint the person named.
- A read-only repo on a route that writes. The default is Audit.
- A package component library as the foundation, which the team may be keeping or leaving. The default is to keep it and wrap it, per `base-library.md`.

Put it in the Frame with the default already applied, and ask it through the host's question tool when there is one, per `build-design-system/references/run-record.md` (Questions). The run goes on under the default, and read-only steps start without waiting. When screens will stay unchanged on this route, the Frame says so and why.

Unattended runs. When nobody answers, because the person is away, the run is headless or it runs as a subagent, every question keeps its default. The state file records each as `default (unanswered)` in the Gates table with the question word for word, and the handoff lists them first so the person can overturn them. The boss never waits and never stops for an answer. The same holds for every question in this skill: the standing questions, the dirty checkout, someone else's branch and clearance itself, whose default is check-first.

```
Triage: no token source, 412 raw color lines, 3 button families, 18 routes.
Plan: build a system from the app and prove it on the invite flow, then write
a plan for the other 17 screens. All work goes on branch ds/2026-03-12-build.
Budget: 2 hours, 4 workers.
Screens: only the invite flow will look different. Moving the other 17 screens
(6 families) is a separate step: reply "Go, 2h" and I move them, one per commit.
Question: none.
Bans: none named yet. Name any you never want to see, such as uppercase labels.
```

Budget and clearance are not this question. The Frame asks for both as the one reply `Go, <budget>`. With no live reader, the Frame goes into the report.

## Standing questions

The bans and design-source questions, and when a batch of up to six goes with them, are in `build-design-system/references/run-record.md` (Questions). The boss asks them in the Frame on every writing route, and a sibling called under the boss does not ask them again.

When a design source, such as a brand kit or a design file, defines a look the app does not have, the design-source question also asks whether the new look goes in place or in a new folder. Ask it with the host's question tool, and follow the answer. Either way, the pilot, baselines, pixel diffs, the check and the docs generator run against the layer being built. A new folder's build handoff lists its adoption blockers.

## Blind spots

The script counts text. It misses class names built at runtime, styles set in script, and values from a CMS, and it over-counts a hex-looking anchor such as `#add`. Families match on name suffix, so `SaveCTA` counts as a button only if it copies Button's classes. A wrapper counts as its canonical member only when it imports and renders it, so one that renders a library's `Button` still counts as its own. Raw copies need 3 shared static classes, so a copy that drifted further is missed. It cannot tell a stock shadcn file from a heavily edited one with the stock name. That drift is measured against the registry, per `base-shadcn.md`. Say in the Frame that the counts are a first read, and let the siblings' own inventories give the numbers the report uses.
