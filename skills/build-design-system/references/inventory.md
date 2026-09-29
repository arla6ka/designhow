# Inventory

> For the team setting this up: the commands assume a JavaScript or TypeScript web app and use `rg` (ripgrep) and `ast-grep` where present. Swap in your own paths and file types. Keep the rule that scripts produce the counts, and keep the table formats, because later phases and `migrate-design-system` read them.

Contents

- Why scripts, not reading
- Where the output goes
- Routes
- Component definitions and call sites
- Families and duplicates
- Raw values
- Existing tokens, fonts and icons
- Copy
- Baseline screenshots
- Delete plan
- Rerunning at handoff

## Why scripts, not reading

A model that reads files to count call sites misses re-exports, aliases and files it never opened, and it cannot tell you which ones it missed. A script finds every match, can be rerun at handoff for the after count, and gives `migrate-design-system` the same numbers. The model's job is to read the tables and judge roles, not to produce the numbers.

Save every script under `.design-system/scripts/`. Each one writes a TSV or JSON file under `.design-system/inventory/` and prints its row count. A script that fails prints the path it choked on and exits nonzero.

## Where the output goes

```
.design-system/
  run.md
  scripts/        inventory scripts, rerun at handoff
  inventory/      routes.tsv, components.tsv, values.tsv, palette.tsv, tokens.tsv
  delete-plan.md
```

Commit `run.md`, `scripts/` and `inventory/`. Captures live in `.design-system/review/`, where `*.png` is gitignored and the TSVs, probe files and reports are committed.

## Routes

List every route the user can reach, because each is a baseline target and a unit for `migrate-design-system`.

- Next.js app router: `find app -name 'page.*' -not -path '*/node_modules/*'`. Turn the folder path into the route. Mark dynamic segments (`[slug]`) and pick one real value for each from seed data or fixtures.
- Next.js pages router: files under `pages/`, minus `_app`, `_document` and `api/`.
- React Router, Vue Router, SvelteKit: read the route config file, or `rg -n "path:\s*['\"]"` over the router folder.
- Overlays (dialogs, drawers, menus) that do not have a route: `rg -n "<(Dialog|Modal|Drawer|Sheet|Popover)\b"`. List each with the route and the action that opens it.

`routes.tsv` columns: route, source file, dynamic value used, needs auth (yes or no), reachable locally (yes, no, or unknown), notes.

## Component definitions and call sites

Find every component the app defines, then count where each is imported.

```bash
# Definitions: exported functions or consts with a capitalized name
ast-grep --lang tsx -p 'export function $NAME($$$) { $$$ }' --json app components src \
  | jq -r '.[] | [.metaVariables.single.NAME.text, .file, .range.start.line] | @tsv'
ast-grep --lang tsx -p 'export const $NAME = $$$' --json app components src \
  | jq -r '.[] | select(.metaVariables.single.NAME.text | test("^[A-Z]")) | [.metaVariables.single.NAME.text, .file, .range.start.line] | @tsv'

# Call sites: JSX usage per name, across every source folder
rg -o --no-heading -n "<([A-Z][A-Za-z0-9]*)\b" -r '$1' app components src --glob '*.{tsx,jsx}'
```

Without ast-grep, `rg -n "export (default )?(function|const) [A-Z]"` finds most definitions. Say in the run record that the grep path was used, since it misses some forms.

Resolve re-exports and aliases before counting. Read `tsconfig.json` paths and every barrel file (`index.ts`) and map each exported name back to its source file. Two names that resolve to one file are one component.

`components.tsv` columns: name, source file, exported from (barrel paths), JSX call sites, files that import it, root element (`button`, `a`, `div`, `input`), props (names from the type), family, disposition.

Leave family and disposition blank here. Fill them in the next step.

## Families and duplicates

A family is a set of components that do the same job for the user. Group them by three signals, in this order.

1. Root element and role. Everything that renders a `<button>` or `role="button"` and triggers an action is a candidate for the Button family.
2. Props. Shared prop names such as `variant`, `size`, `loading` and `icon` confirm the grouping.
3. Name. `PrimaryButton`, `SaveButton` and `CTA` are likely members. Name alone is weak evidence, so do not group on it without one of the first two.

Put links styled as buttons in the Link family, not Button. They navigate, so they keep an `<a>`. Put product compositions (an invite form, a billing panel) in their own rows with disposition "product composition". They use system components but do not become one.

Disposition is one of: canonical, merged into `<canonical name>`, deleted, product composition. Every row gets one by the end of phase 4.

## Raw values

Find every literal style value outside the token source. Split shorthands into one row per property, the way `token-mapping` expects.

```bash
# Colors in CSS, CSS modules and styled strings
rg -n --no-heading -o "#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)" \
  --glob '*.{css,scss,tsx,jsx,ts}' app components src

# Lengths on spacing, size, radius and type properties
rg -n --no-heading -o "(margin|padding|gap|inset|top|left|right|bottom|width|height|border-radius|font-size|line-height|letter-spacing)[a-z-]*\s*:\s*[^;]*\d(px|rem|em)" \
  --glob '*.{css,scss}' app components src

# Tailwind arbitrary values (raw)
rg -n --no-heading -o "\b[a-z-]+-\[[^\]]+\]" --glob '*.{tsx,jsx,html}' app components src

# Tailwind default palette classes (palette use, counted apart from raw)
rg -n --no-heading -o "\b(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(/\d+)?\b" \
  --glob '*.{tsx,jsx,html}' app components src

# Inline style objects
ast-grep --lang tsx -p '<$E style={{ $$$ }} $$$>' app components src
```

Normalize before counting, with the rules in `token-mapping`'s rules file: lengths to px on the project's root size, colors to sRGB hex with alpha. `#FFF`, `#ffffff` and `rgb(255 255 255)` are one value.

`values.tsv` columns: normalized value, category, property, count, files (first five), and the `file:line` list in a sidecar file. Sort by category, then count descending. This file is the input to `token-mapping` in phase 3.

A value inside a `var()` or `theme()` call is already a token reference. Count it separately in `tokens.tsv` as a use of that token.

Palette classes go in `palette.tsv`, not `values.tsv`. They come from the framework's default theme, so they are neither raw values nor token use. Report them as their own count, the same way `token-mapping`, the router's triage and `checks.md` do. A utility built from a name the project declares (`bg-muted`) is token use.

## Existing tokens, fonts and icons

- CSS custom properties: `rg -n --no-heading -o -e "--[a-z][a-z0-9-]*\s*:" --glob '*.{css,scss}'` for definitions, `rg -n --no-heading -o "var\(--[a-z][a-z0-9-]*"` for uses. A defined token with zero uses is a delete-plan candidate. A used token with no definition is a bug to record.
- Theme config: `tailwind.config.*` keys, `@theme` blocks, theme objects passed to a provider.
- Fonts: `@font-face` rules, framework font loaders (`next/font`), and `<link>` tags to font services. Record family, weights and file paths.
- Icons: the import source for icon components, and inline `<svg>` counts per file.

`tokens.tsv` columns: name, defined in, value per theme, use count, stated role (from the name or comment), notes.

## Copy

Every user-facing string, by slot, comes from `scripts/copy-check.mjs --extract` into `docs/system/copy-inventory.tsv`, once the writing page names each slot's sources. `writing-method.md` has the columns and how to find the sources.

## Baseline screenshots

Before any edit, capture every route with one `capture.mjs --kind before` command (`browser.md`, Capture every route in one command). Mark routes that failed to load or need auth as unverified in `routes.tsv`.

## Delete plan

Deletion is the one destructive step in the build, so it runs as plan, then validate, then execute.

1. Write `delete-plan.md`, one row per item: path or selector, kind (component, CSS class, variant, token), the search that proves it unused, and the count it returned.
2. Validate. A script reruns every search in the plan and fails if any count is above zero. Also search strings in content files, tests, stories and other packages in the workspace. Class names built at runtime (`` `btn-${tone}` ``) hide from searches, so list every dynamic class pattern and keep anything it could produce.
3. Execute only the validated rows, as one change with the plan in its description.

Anything another package or a published API exports stays, whatever the local count. That is a stop-and-ask row.

## Rerunning at handoff

Every count leaves out the run's own scaffolding: `public/system/`, generated twins and indexes, `scripts/` (fixtures included), `.design-system/`, `.migration/` and skill folders (`.agents/`, `.claude/`). With `rg`, add `--glob '!public/system/**' --glob '!scripts/**'` to each command that reaches them. A count that includes them tells the wrong story at handoff, such as raw colors rising because of the generated `index.html`.

In phase 8, rerun every script unchanged and write the output to `inventory/after/`. The handoff counts come from the difference between the two runs: raw values by route, palette use by route, deprecated imports by route, families with one canonical member. If a script had to change, say what changed and rerun it on the original commit too, so the two counts are comparable.
