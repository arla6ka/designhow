# Inventory

The commands below are one example, for a JavaScript or TypeScript web app with `rg` (ripgrep) and `ast-grep`. Swap in your own paths, file types and patterns, and keep the table formats, because later phases and `migrate-design-system` read them.

Contents

- Why scripts, not reading
- Where the output goes
- Surface map and research
- Routes
- Component definitions and call sites
- Families and duplicates
- Product coverage map
- Raw values
- Existing tokens, fonts and icons
- Copy
- Baseline screenshots
- Delete plan
- Rerunning at handoff
- Excluded paths

## Why scripts, not reading

A model that reads files to count call sites misses re-exports, aliases and files it never opened. Scripts produce every count so the handoff can rerun them and `migrate-design-system` reads the same numbers. The model reads the tables and judges roles.

Save every script under `.design-system/scripts/`. Each writes a TSV or JSON file under `.design-system/inventory/` and prints its row count. A failing script prints the path it choked on and exits nonzero.

## Where the output goes

```
.design-system/
  run.md
  scripts/        scripts a rerun needs: inventory scripts, the states module, rendered-type. Committed. The check never reads them
  tmp/<worker>/   one-off probes, deleted at close
  inventory/      routes.tsv, components.tsv, values.tsv, palette.tsv, tokens.tsv, coverage.tsv
  delete-plan.md
```

Commit `run.md`, `scripts/` and `inventory/`. Captures live in `.design-system/review/` (`coordinator-path.md`, Start).

## Surface map and research

On a whole-app run, the screen notes fan out as read-only workers, one per product area, each with this brief:

```
READ-ONLY. Do not edit files, run servers, change git state or start agents.
AREA: <routes and folders for one product area>
KNOWN SET: <the existing component list, pasted>
For each screen: its route and how a user reaches it, its purpose in one line, every
action and state (loading, empty, error, no permission, saving), and which parts use
the known set, custom components or raw markup. Then every component or pattern beyond
the known set: path, what it does, where it is reused, and whether it should become a
system component. Flag duplicates, raw colors and theme gaps with file:line.
Record accessibility gaps per screen with file:line, and say where the code
contradicts this brief. End with a Coverage: line naming what you read and
what you did not.
Return the report as your final message, with a 15-line summary first.
```

The coordinator saves each report under `.design-system/inventory/screens/`. The notes feed judgment. The counts still come from the scripts below.

For each design file, brand kit, reference system or product the person names, one more read-only worker writes `.design-system/research/<source>.md`: what it offers in the run's own words, which parts are marketing art, and what it decides per `modes.md` (Following a design source). Later briefs cite these files by path. Each research file ends with the conflicts it found, between named sources and between a source and the person's bans. Before any writer starts, the coordinator turns each into a numbered row in `docs/system/decisions.md` (`modes.md`, What decides a question).

## Routes

List every route the user can reach, because each is a baseline target and a unit for `migrate-design-system`. Read the router's own source of truth.

- File-based routers: find every page file the router serves, such as `find <routes dir> -name 'page.*'`, minus framework files and API routes. Turn the folder path into the route.
- Config-based routers: read the route config, or `rg -n "path:\s*['\"]"` over the router folder.
- Dynamic segments: mark each and pick one real value from seed data or fixtures.
- Overlays (dialogs, drawers, menus) that have no route: `rg -n "<(Dialog|Modal|Drawer|Sheet|Popover)\b"`. List each with the route and the action that opens it.

`routes.tsv` columns: route, source file, dynamic value used, needs auth (yes or no), reachable locally (yes, no, or unknown), notes.

## Component definitions and call sites

Find every component the app defines, then count its imports.

```bash
# Definitions: exported functions or consts with a capitalized name
ast-grep --lang tsx -p 'export function $NAME($$$) { $$$ }' --json app components src \
  | jq -r '.[] | [.metaVariables.single.NAME.text, .file, .range.start.line] | @tsv'
ast-grep --lang tsx -p 'export const $NAME = $$$' --json app components src \
  | jq -r '.[] | select(.metaVariables.single.NAME.text | test("^[A-Z]")) | [.metaVariables.single.NAME.text, .file, .range.start.line] | @tsv'

# Call sites: JSX usage per name, across every source folder
rg -o --no-heading -n "<([A-Z][A-Za-z0-9]*)\b" -r '$1' app components src --glob '*.{tsx,jsx}'
```

Without ast-grep, `rg -n "export (default )?(function|const) [A-Z]"` finds most definitions. Record in the run record that the grep path was used, since it misses some forms.

Resolve re-exports and aliases before counting. Read the path aliases (such as `tsconfig.json` paths) and every barrel file, and map each exported name back to its source file. Two names that resolve to one file are one component.

`components.tsv` columns: name, source file, exported from (barrel paths), JSX call sites, files that import it, root element (`button`, `a`, `div`, `input`), props (names from the type), family, disposition.

Leave family and disposition blank until the next step.

## Families and duplicates

A family is a set of components that do the same job for the user. Group them by these signals, in order.

1. Root element and role. Everything that renders a `<button>` or `role="button"` and triggers an action is a candidate for the Button family.
2. Props. Shared prop names such as `variant`, `size`, `loading` and `icon` confirm the grouping.
3. Name. `PrimaryButton`, `SaveButton` and `CTA` are likely members, but never group on name alone.

Links styled as buttons go in the Link family, since they navigate and keep an `<a>`. Product compositions (an invite form, a billing panel) get their own rows with disposition "product composition". They use system components but do not become one.

Disposition is one of: canonical, merged into `<canonical name>`, deleted, product composition. Every row gets one by the end of phase 4.

## Product coverage map

The reverse of migrate's parity list: what the product needs that the system lacks. Write `.design-system/inventory/coverage.tsv` from the screen notes and `components.tsv`, one row per product pattern with its call sites and product areas, marked `covered`, `partial` (name the missing variant, prop or slot) or `missing`.

- Group near-duplicates into one proposal: its variants, a props sketch, the primitives it composes, its states, keyboard and motion.
- Rank proposals by how many surfaces each unblocks.
- A pattern used in two or more product areas becomes a system component. The rest stay product compositions.
- A pattern that needs a look the app does not have goes to a question round before anyone builds it (`run-record.md`, Questions).

## Raw values

Find every literal style value outside the token source. Split shorthands into one row per property, as `token-mapping` expects.

```bash
# Colors in CSS, CSS modules and styled strings
rg -n --no-heading -o "#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)" \
  --glob '*.{css,scss,tsx,jsx,ts}' app components src

# Lengths on spacing, size, radius and type properties
rg -n --no-heading -o "(margin|padding|gap|inset|top|left|right|bottom|width|height|border-radius|font-size|line-height|letter-spacing)[a-z-]*\s*:\s*[^;]*\d(px|rem|em)" \
  --glob '*.{css,scss}' app components src

# Utility-class arbitrary values, such as Tailwind's p-[13px] (raw)
rg -n --no-heading -o "\b[a-z-]+-\[[^\]]+\]" --glob '*.{tsx,jsx,html}' app components src

# Default palette classes of a utility framework, here Tailwind's (palette use, counted apart from raw)
rg -n --no-heading -o "\b(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(/\d+)?\b" \
  --glob '*.{tsx,jsx,html}' app components src

# Inline style objects
ast-grep --lang tsx -p '<$E style={{ $$$ }} $$$>' app components src

# Motion: durations, delays, easings, animated property lists and keyframes
rg -U -n --no-heading -o "(^|[^\w-])(transition|animation)[a-z-]*\s*:[^;{}]+|@keyframes\s+[\w-]+|cubic-bezier\([^)]*\)|(^|[\s:,(])\.?\d+(\.\d+)?m?s\b" \
  --glob '*.{css,scss,sass,less}' app components src
rg -n --no-heading -o "\b(transition|animation)[A-Za-z]*\s*:\s*[^;,}]+|\b(duration|delay|ease|animate)-(\[[^\]]+\]|[\w./-]+)|\btransition(-[\w./-]+)?\b|\b(duration|delay|stiffness|damping|mass|bounce|ease)\s*:\s*(\[[^\]]*\]|[^,}]+)|type:\s*[\"']spring[\"']|cubic-bezier\([^)]*\)" \
  --glob '*.{tsx,jsx,ts,js,mjs,html,vue,svelte}' app components src
```

A hit from the first motion command can carry one leading character; trim it. `delay` and `duration` keys also match options that are not motion, so look at each hit. Motion rows go in `values.tsv` with category `duration`, `easing` or `animated-properties`. Mark each `transition: all` or `transition-all` row with `trap/motion-transition-all`. `animated-properties` rows are inventory only, and `token-mapping` skips them.

Normalize before counting, with the rules in `token-mapping`'s rules file: lengths to px on the project's root size, colors to sRGB hex with alpha. `#FFF`, `#ffffff` and `rgb(255 255 255)` are one value.

`values.tsv` columns: normalized value, category, property, count, files (first five), and the `file:line` list in a sidecar file. Sort by category, then count descending. It is `token-mapping`'s input in phase 3.

A value inside a `var()` or `theme()` call is already a token reference. Count it separately in `tokens.tsv` as a use of that token.

Palette classes go in `palette.tsv`, not `values.tsv`. They come from the framework's default theme, so they are neither raw values nor token use. Report them as their own count, as `token-mapping`, the router's triage and `checks.md` do. A utility built from a name the project declares is token use.

## Existing tokens, fonts and icons

- CSS custom properties: `rg -n --no-heading -o -e "--[a-z][a-z0-9-]*\s*:" --glob '*.{css,scss}'` for definitions, `rg -n --no-heading -o "var\(--[a-z][a-z0-9-]*"` for uses. A defined token with zero uses is a delete-plan candidate. A used token with no definition is a bug to record.
- Theme config: utility-framework config and theme blocks, theme objects passed to a provider.
- Fonts: `@font-face` rules, framework font loaders, and `<link>` tags to font services. Record family, weights and file paths.
- Icons: the import source for icon components, and inline `<svg>` counts per file.

`tokens.tsv` columns: name, defined in, value per theme, use count, stated role (from the name or comment), notes.

## Copy

Every user-facing string, by slot, comes from `scripts/copy-check.mjs --extract` into `docs/system/copy-inventory.tsv`, once the writing page names each slot's sources. `writing-method.md` has the columns and how to find the sources. `copy-check.mjs` joins the check command in phase 7.

## Baseline screenshots

Before any edit, list every surface in `.design-system/review/surfaces.tsv` and capture them with one `capture.mjs --kind before` command (`browser.md`, Capture every route in one command). Mark routes that failed to load or need auth as unverified in `routes.tsv`.

`surfaces.tsv` columns: `surface`, `route`, `states` (comma separated) and `tier`, how often a person meets the surface in a session. Assign the tier from the code, first match wins:

- `high`: the shared shell and nav, list and index routes whose rows a person opens, menus, and any surface that holds the product's primary action
- `low`: settings, onboarding, and routes that only render an empty or error state
- `mid`: everything else

The tier ranks surfaces for landing and review, sets how much announce motion a surface gets (`token-architecture.md`), and breaks ties in the pilot choice toward a `high` flow.

## Delete plan

Deletion is the one destructive step in the build, so it runs as plan, validate, execute.

1. Write `delete-plan.md`, one row per item: path or selector, kind (component, CSS class, variant, token), the search that proves it unused, and the count it returned.
2. Validate. A script reruns every search in the plan and fails if any count is above zero. Also search strings in content files, tests, stories and other packages in the workspace. Class names built at runtime (`` `btn-${tone}` ``) hide from searches, so list every dynamic class pattern and keep anything it could produce.
3. Execute only the validated rows, as one change with the plan in its description.

Anything another package or a published API exports stays, whatever the local count, and is a stop-and-ask row.

## Rerunning at handoff

Every count leaves out the Excluded paths below, plus `scripts/`, where the build copies its check scripts. Otherwise the handoff tells the wrong story, such as raw colors rising because of the generated `index.html`.

In phase 8, rerun every script unchanged into `inventory/after/`. The handoff counts come from the difference: raw values, palette use and deprecated imports by route, and families with one canonical member. If a script had to change, say what changed and rerun it on the original commit too, so the counts compare.

## Excluded paths

Every count in every design.how skill leaves out the run's own scaffolding, so a build's fixtures and generated pages never read as drift:

- the skills folder (`.agents/`, `.claude/`) and any folder holding a `SKILL.md`
- `docs/system/` and `public/system/`
- fixtures: `*.fixture` files and `__fixtures__/` folders
- the run records `.design-system/` and `.migration/`
- `node_modules/` and build output, such as `.next/`, `dist/` and `build/`. A route folder named `build` is listed by hand.

`rg` already skips gitignored paths. Add `--glob '!{.agents,.claude,docs/system,public/system,.design-system,.migration,.next,dist,build}/**' --glob '!**/__fixtures__/**' --glob '!**/*.fixture'`, and one `--glob '!<folder>/**'` per folder holding a `SKILL.md`. Every other list of skipped paths points here and adds only its own extras, each with a reason.
