# Triage

Triage is cheap on purpose. One script, a few file reads, no browser and no subagent. It decides the route, so every call it makes has to trace to a number a person can rerun.

## Contents

- Running the script
- Signals
- The foundation
- The app's state
- The ask's intent
- The one question
- Blind spots

## Running the script

```sh
bash <skills>/design-system-boss/scripts/triage.sh <repo> <repo>/.design-system/boss/triage
```

It prints `signal<TAB>value` lines and writes them to `signals.tsv`, with the match lists beside it (`raw-colors.txt`, `components.tsv`, `components-layer.tsv`, `families.tsv`, `raw-families.tsv`, `layer-dirs.tsv`, `harden-dirs.tsv`, `stray-dirs.tsv`, `tw-semantic.txt`, `routes.txt`, `token-files.txt`, and `shadcn-info.json` when it ran). It reads only files git tracks or would track, and writes only into the output folder. It needs `rg`, and `node` for reading `components.json`.

When `components.json` exists, the script runs `shadcn info --json` from `node_modules/.bin`. It never downloads the CLI on its own. Set `TRIAGE_SHADCN_INFO=npx` to allow `npx shadcn@latest info --json`, or `0` to skip it. Without it, the script reads `components.json` directly and says so in `shadcn_info`. Where they differ, trust `shadcn info` over the file and over anything inferred. Without it, run these, save each output in the same folder, and record the fallback in the state file. They skip `.gitignore`, so the excludes do that job.

```sh
X='--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.design-system --exclude-dir=.migration --exclude-dir=.agents --exclude-dir=.claude --exclude-dir=scripts --exclude-dir=fixtures --exclude-dir=system'
grep -rIn $X -E '#[0-9a-fA-F]{3,8}([^0-9A-Za-z-]|$)|(^|[^A-Za-z0-9-])(rgba?|hsla?|oklch)\(' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' . \
  | grep -vE '^[^:]*:[0-9]+:[[:space:]]*--' > raw-colors.txt
grep -rIoh $X -E 'var\(--[a-zA-Z][a-zA-Z0-9-]*' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' . | wc -l
grep -rIn $X --exclude-dir=fixtures --exclude-dir=examples --exclude-dir=docs --exclude-dir=checks -E 'export (default )?(function|const|class) [A-Z]' --include='*.tsx' --include='*.jsx' . > components.txt
find . -name '*.tokens.json' -o -name 'tailwind.config.*' -o -path '*/tokens/*.json' | grep -v node_modules
cat components.json package.json   # foundation: shadcn config, or a UI library dependency
```

In a monorepo, run it once per app folder, each into its own subfolder of `triage/`.

## Signals

Two units, and the table names the one each signal uses. A **line** signal counts source lines, so a line holding three hex values counts once. An **occurrence** signal counts every match. `token-mapping` counts occurrences, so compare its totals with `raw_color_occurrences`, never with `raw_color_lines`. `adoption_pct` mixes the two, which is fine for picking a state and wrong for a before-and-after claim. The report names the unit beside every count it quotes.

Every count leaves out the run's own scaffolding: `public/system/` and `static/system/` (generated twins and indexes), `scripts/`, fixtures (`fixtures/`, `__fixtures__/`, `*.fixture`), `.design-system/`, `.migration/`, and skill folders (`.agents/`, `.claude/`, and any folder holding a `SKILL.md`). A build adds all of these, so without the rule the after-numbers count the build's own check fixtures and generated HTML as product drift. `scaffold_files_skipped` says how many source files that left out. Presence signals such as `llms_txt` still see `public/llms.txt`.

Adoption also leaves out the component layer, the token source, examples (`*.examples/`, `examples/`), docs (`docs/`, `app/system/`), tests and stories. Otherwise a system's own `var()` uses make a weak system read as settled. Component and family counts leave out the same examples, docs and check folders, so planted fixtures never read as duplicate families. `component_specs` leaves out twins and `spec-template.md`, which repeat or imitate a spec.

| Signal | Unit | Measures | Feeds |
|---|---|---|---|
| `token_files` | files | DTCG files, a `tokens/` folder, `tailwind.config.*`, CSS with `@theme` | whether a token source exists |
| `custom_property_defs` | occurrences | CSS custom property definitions | a token source written as plain CSS |
| `token_refs` | occurrences | `var(--…)` and `theme()` uses in product files, token definition lines excluded | adoption |
| `tw_semantic` | occurrences | Tailwind utilities built from the project's own `@theme` color names, such as `bg-primary` or `text-muted-foreground` | adoption |
| `raw_color_lines` | lines | lines in product files with a hex, `rgb()`, `hsl()` or `oklch()` value, token definition lines excluded. Values inside Tailwind arbitrary values count, such as `shadow-[0_1px_rgba(0,0,0,.1)]` or `ring-[0_0_0_1px_#e5e5e5_inset]` | adoption, the Values route |
| `raw_color_occurrences` | occurrences | the same values, counted per match | comparing with `token-mapping` |
| `tw_arbitrary` | occurrences | Tailwind arbitrary values such as `p-[13px]`, with variants like `data-[state=open]:` excluded | adoption |
| `tw_palette` | occurrences | palette-scale classes such as `text-gray-500`, from Tailwind's default palette or a scale the project declares. These are primitives with no purpose, so they count as neither token use nor raw values | `palette_pct` |
| `adoption_pct` | percent of mixed units | token uses (`token_refs` plus `tw_semantic`) as a share of token uses plus raw values (`raw_color_lines` plus `tw_arbitrary`) | drifting or settled |
| `palette_pct` | percent of mixed units | `tw_palette` as a share of token uses plus raw values plus palette classes | how much color has no stated purpose |
| `component_defs`, `same_name_defs` | definitions | capitalized components exported inline or through an `export { }` list, and names defined in more than one file | duplicates |
| `product_component_defs`, `stock_ui_defs` | definitions | definitions outside stock shadcn files, and inside them | empty, and duplicates |
| `families_with_2plus` | families | families (Button, Input, Dialog and so on) with two or more members. A member is a definition matched on name suffix, or a raw copy. Stock shadcn files count as one member per family | drifting or settled |
| `raw_family_copies` | elements | raw `<button>`, `<input>`, `<textarea>`, `<select>` and `<a>` elements whose static classes share 3 or more with the same element in another file. The file that defines the family's component holds the canonical copy and is never counted. `raw-families.tsv` gives each copy, its shared count and what it matched | duplicates the name suffix misses, and the edit list on the Named families route |
| `foundation` | name | `shadcn`, `shadcn+registry`, `library:<package>`, `package:<name>`, `raw`, or `none (default: shadcn)` on an empty app, 2 or fewer routes and 5 or fewer product components | which base reference the steps load |
| `shadcn_base`, `shadcn_style`, `tailwind_css_file`, `shadcn_ui_dir`, `shadcn_registries` | names | from `shadcn info --json`, or `components.json` | base-shadcn.md |
| `ui_raw_lines` | lines | raw colors and palette classes inside the component layer. On shadcn these are upstream's | reported apart. Raw work across the app is this plus `raw_color_lines` |
| `component_specs` | files | Markdown files with a `### State precedence` section, the mark of a filled spec template | weak or hardened |
| `shared_ui_dirs` | folders | the component layer. A folder counts by name (`components/ui`, `packages/ui`, `packages/*/src`, `ui/`, `src/ui/`, `src/components/`, `design-system`, `ui-kit`), by a barrel (`index.ts` re-exporting 3 or more components), or because 3 or more route files import components from it. Folders inside the route tree do not count by imports, and neither do strays. `layer-dirs.tsv` gives each folder's reason | where a system lives, and what adoption leaves out |
| `harden_dirs` | folders | layer folders with 5 or more components that 3 or more routes import. `harden-dirs.tsv` gives both counts | Harden or Build |
| `stray_dirs` | folders | layer folders that duplicate a family already in a harden dir, such as `components/custom/Button.tsx` beside `components/ui/button.tsx`. A stray is not the layer: its raw values count as product code, before and after, even when it sits inside a layer folder. The shadcn ui folder and harden dirs are never strays. `stray-dirs.tsv` names the duplicate | stable before-and-after counts, and harden's stray-code list |
| `system_docs_routes`, `llms_txt`, `registry_json`, `stories` | files | docs a person or an agent can read. `registry_json` is `shadcn` (an `items` list), `designhow` (a `components` list), `other` or `no` | settled or documented |
| `build_record`, `migration_runs`, `boss_state` | paths | earlier runs | resume |
| `run_script`, `routes`, `source_lines`, `families_present` | route files, lines, families | whether the app can start, and how big it is. `routes` leaves out Next.js private folders (`app/**/_name/`), which never route | how big the app is, which steps can verify visually, and the default flows for a review |
| `scaffold_files_skipped` | files | source files left out as scaffolding: twins, indexes, `scripts/`, fixtures, run and skill folders | reading a before-and-after: a rise here is the build's own output, not drift |
| `git_uncommitted` | files | files with uncommitted changes, leaving out `.agents/`, `.claude/`, `.design-system/` and `.migration/` | the stop on unrelated work |

## The foundation

The foundation decides which base reference in `build-design-system/references/` every step loads. It does not change the route.

| `foundation` | Base reference | Where the system lives |
|---|---|---|
| `shadcn`, `shadcn+registry` | `base-shadcn.md` | `components/ui` copied in by the CLI, tokens as CSS variable pairs in `tailwind_css_file`, a namespaced registry when one is configured |
| `library:<package>` | `base-library.md` | the library's theme object and its components, wrapped where the team needs its own API |
| `package:<name>` | `base-shadcn.md` when that package ships a shadcn registry, else `base-library.md` | the team's own package, read like a library |
| `raw` | `base-raw.md` | whatever folders the inventory finds |
| `none (default: shadcn)` | `base-shadcn.md` | nothing yet. The Seed route starts it on shadcn |

Two foundations can show at once, such as shadcn beside a leftover MUI dependency. Take the one product code imports most, name the other in the Frame, and treat its imports as legacy.

With no foundation at all and nothing shipped yet, the default is shadcn on Tailwind v4. Say so in the Frame message, with the other tool default, which is `capture.mjs` on Playwright for captures and agent-browser for one-off evidence.

## The app's state

Apply these in order and take the first that matches. Write the deciding signal next to the state.

1. `boss_state` is set. Resume. No new triage decision.
2. `routes` is 2 or fewer and `product_component_defs` is 5 or fewer. **empty**. Nothing ships yet, so the system starts from brand bits or shadcn defaults.
3. `token_files` is 0 and `custom_property_defs` is under 20. **none**.
4. `adoption_pct` is under 80, `palette_pct` is 30 or more, or `families_with_2plus` is 2 or more. **drifting**.
5. `system_docs_routes` is 0, or `llms_txt` is no, or `registry_json` is no. **settled**.
6. Otherwise **documented**.

`drifting` and `settled` each split in two by whether a component layer worth hardening exists. One exists when `harden_dirs` is set: a component folder with 5 or more components imported by 3 or more routes. `build-design-system/references/modes.md` names harden by the same rule. A smaller or less used layer gets built, not hardened. A system with such a layer is **weak** when `component_specs` is 0 or its families still duplicate. Weak systems get hardened before anyone migrates onto them.

Palette classes sit outside `adoption_pct`, the same way `token-mapping` counts them as palette use. A `palette_pct` of 30 or more means much of the app's color names a value and no job. The Values and Review routes then answer "are colors consistent" by role, per `token-mapping`'s Consistency by role section, and the Frame says so.

The thresholds are defaults. A team that has measured its own app should change them here and nowhere else.

A `build_record` with no handoff section means an earlier build stopped partway. Route to Build, and the build skill resumes from its own record. A migration run folder with open surfaces means the same for Adopt.

Before routing on `documented`, open one component page and its `.md` twin and compare their H2s with the component skeleton in `build-design-system/references/system-structure.md`. If they differ, the state is **settled**, because the docs exist but not in the target structure.

## The ask's intent

Read the ask for these words. The rows run from named complaints to generic verbs, and the first row that matches wins. So a complaint the person named beats a generic verb: "clean it up, people hardcode colors everywhere" is values, not full. "Clean it up and make it consistent" with hardcoded colors is values too, and "make it consistent" counts as clearance. On a weak system that routes Values, then Harden, then Full from clearance, as the routing table's weak row and `routes.md` Values step 2 say. Otherwise the later steps of the generic route can follow in Next.

| The ask says | Intent |
|---|---|
| component families by name plus a PR or upstream: "make the buttons and headings consistent, I want to send this upstream" | named families, minimal footprint |
| one component by name, "document the X", "what states does X have" | component |
| "before we ship", "before I ship", "review this screen", "is this ready", "handoff", "is it consistent", "are we consistent", "check" as the main verb | review |
| "how bad", "audit", "where do we stand", "don't change anything" | audit |
| "hardcoded", "raw values", "use our tokens", "colors are everywhere" | values |
| "looks like a different product", "make it look like one thing", "every page looks different", "make every page consistent" | full, and the ask counts as clearance |
| "consistent" or "consistency" with a verb that means change: "make it consistent", "fix the inconsistency", "clean up the inconsistent X" | full, and the ask counts as clearance. The routing table gives Full, or Harden then Full on a weak system. With hardcoded values named too, the values row above wins |
| "consistent", "consistency", "colors" with no verb that means change | review, plus `token-mapping` on the same files, which answers by role |
| "missing states", or "missing" with a kind of state: "missing loading and error states", "no error state", "no empty state" | harden |
| "harden", "fill the states", "our components have no rules", "tighten the system", "make it solid", "stops drifting" | harden |
| "docs", "document the system", "agents can't read our components" | docs |
| "fix it", "fix this", "clean it all up", "clean it up", "mess", "sort out our UI" | full. "Fix it" or "fix this" aimed at a mess or an inconsistency counts as clearance |
| "migrate", "move every screen", "roll out", "adopt", "nobody uses it", "nobody follows it", "the screens ignore it" | adopt, and the ask counts as clearance |
| "start a design system", "new app", "from scratch", "from our brand" | seed |
| "build", "set up", "extract", "break down the screens", "consolidate" | build |

An ask that matches nothing is **seed** when the state is `empty`, **full** when it is `none` or `drifting`, and **adopt** when it is `settled`.

A build or set-up ask on a `drifting` app routes to Harden, and the Frame says so. With no `harden_dirs` there is no layer to harden, so it routes to Build.

Adoption words ("nobody uses it", "nobody follows it", "the screens ignore it", or any "ignore" aimed at the system, "make every page consistent", "make it consistent", "make it look like one thing", "migrate", "use it everywhere", and "fix it" or "fix this" aimed at a mess or an inconsistency) count as clearance to migrate within the session budget, on the run branch. When an ask names two complaints, such as missing states and nobody using the system, the first row still picks the route, and the adoption words still give clearance.

"Launch subagents" is a delegation request, not an intent. Honor it in the step that fans out.

## The one question

Ask at most one, and only for one of these:

- A monorepo target nobody named. Name the candidates with their route counts.
- An intent that fits two routes differing by a whole phase, such as build only against build then migrate. The default is the route that answers the complaint the person named.
- A read-only repo on a route that writes.
- A package library as the foundation (MUI, Chakra, Mantine and the like), where the team may be keeping it or leaving it. Default: keep it and wrap it, per `base-library.md`.

Put it in the Frame message with the default already applied. The run goes on under the default until someone answers, and the read-only steps start without waiting. When screens will stay unchanged on this route, the Frame says so and why.

```
Triage: no token source, 412 raw color lines, 3 button families, 18 routes.
Plan: build a system from the app and prove it on the invite flow, then write
a plan for the other 17 screens. All work goes on branch ds/2026-09-28-build.
Budget: 2 hours, 4 workers.
Screens: only the invite flow will look different. The other 17 stay unchanged
unless you reply "Go, 2h", which lets me move them too, one per commit.
Question: none.
```

Budget and the migration clearance are not this question. Ask for both in the same message as part of the Frame, as the one reply `Go, <budget>`. With no live reader, the Frame goes into the report.

## Blind spots

The script counts text. It misses class names built at runtime, styles set in JavaScript, and values from a CMS. It over-counts a hex-looking string such as `#add` in an anchor. Its component families match on name suffix, so `SaveCTA` never counts as a button unless it renders a raw copy of Button's classes, and a caller such as `SessionButton` counts as a member even when it only renders `Button`. Raw copies need 3 shared static classes, so a copy that drifted further, or builds its classes at runtime, is missed. It cannot tell a stock shadcn file from one the team edited heavily, since both keep the stock name. That drift is measured against the registry, per `base-shadcn.md`, not here. Say in the Frame that the counts are a first read, and let the sibling skills' own inventories give the numbers the report finally uses.
