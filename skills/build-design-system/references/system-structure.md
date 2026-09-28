# System structure

> For the team setting this up: the structure below is modeled on Vercel's Geist. Drop pages your app has no use for and rename the URL root if `/system` is taken. Keep four things: one page per component, the component page sections in the order given here, a Markdown twin for every page, and one index an agent reads first.

Contents

- The model to study
- Routes and files
- Overview page
- Foundation pages
- Brand page
- Component pages
- Pattern pages
- Markdown twins
- llms.txt
- Registry
- Pointer from AGENTS.md
- Checks for the docs
- Done, page by page

## The model to study

Geist, Vercel's design system, is the reference shape. Study it when you have internet access, and build from this file when you do not. Nothing here needs a network call.

- Introduction: https://vercel.com/geist/introduction
- A foundation page: https://vercel.com/geist/colors, https://vercel.com/geist/typography, https://vercel.com/geist/materials, https://vercel.com/geist/grid
- Assets: https://vercel.com/geist/icons
- A component page: https://vercel.com/geist/button, and its twin at https://vercel.com/geist/button.md

What to take from it, in our words:

- Three kinds of page sit under one root. Foundations hold the decisions every component reads. Assets hold files people copy as they are. Components get one page each, all at the same depth.
- A foundation page is organized by role, not by value. The color page groups its steps by what they are for (component fills, borders, text), and names the variable for each.
- A component page leads with rendered examples and the code beside them, then works through sizes, variants and states one heading at a time, and ends with rules for when and how to use it, accessibility included.
- Every page has a Markdown twin at the same URL plus `.md`, and the site answers `Accept: text/markdown` with it.

What not to take: Geist's values, names, component list or brand. The inventory decides which pages exist. A page for a component the app does not use is a page an agent will copy from. Geist also leaves props tables out of its pages. Keep them, because an agent reading a twin needs the API in one place.

## Routes and files

One URL root, flat slugs. The default root is `/system`. Keep component slugs lowercase and hyphenated, equal to the registry id. Foundation and brand slugs are reserved, so a component can never be named `colors`.

```
/system                     overview
/system/colors              foundation
/system/typography          foundation
/system/materials           foundation: radius, border, shadow, surface levels
/system/layout              foundation: space scale, grid, breakpoints
/system/motion              foundation, only if the app animates
/system/icons               asset
/system/brand               asset: logo, typeface, product names
/system/<component>         one per canonical component
/system/patterns/<pattern>  optional, see Pattern pages
/system/registry.json
/llms.txt
```

Every HTML route has a twin: `/system.md`, `/system/colors.md`, `/system/button.md`, and so on.

In the repo, keep the page content next to the thing it documents and generate the rest. On a Next.js App Router app the default layout is:

```
tokens/                          token source (DTCG JSON), see token-architecture.md
components/ui/<component>.tsx    canonical components
components/ui/<component>.examples/   one file per example, imported by the page and the tests
docs/system/<component>.md       the component-docs entry, the only hand-written prose per component
app/system/page.tsx              overview
app/system/[slug]/page.tsx       renders a foundation, asset or component page from registry.json
app/system/[slug].md/route.ts    or a route handler that serves the twin
app/llms.txt/route.ts
registry.json
```

Other stacks keep the same split: one prose file per component, examples as real files, and pages plus twins generated from those files and the token source.

## Overview page

One screen. In order:

1. One sentence on what the system covers and which app it serves.
2. How to import a component, as one code block.
3. The one rule for new UI, such as "Use a registry component. If none fits, open a gate before writing one."
4. Links to each foundation, the brand page, the component list and `llms.txt`.
5. The command that runs the checks.

Done when every link resolves and the component list comes from the registry.

## Foundation pages

One page per foundation. Each page uses these sections, in this order.

1. `## Description`. One or two sentences on what the category decides.
2. `## Tokens`. A table generated from the token source: name, value in each theme, role, and the `$description`. Group rows by role, the way Geist groups color steps by use. Primitives go in a collapsed second table or nowhere.
3. `## Specimens`. A live specimen for each role, drawn with the token itself, never a copied value.
4. `## Usage`. One line per rule, each a decision with its reason.
5. `## Accessibility`. What the category guarantees and how it was measured.
6. `## Not tokens`. Values in this category that stay raw on purpose, and why. See `token-architecture.md`.

What each foundation adds:

| Page | Tokens table groups | Specimens | Accessibility |
|---|---|---|---|
| Colors | surface, text, border, icon, action, status, focus | a swatch per role, placed on the surface it pairs with | contrast ratio for every surface and foreground pair in each theme, from a script |
| Typography | one row per composite text style: family, size, line height, weight, tracking | a line of real product copy per style | smallest size in use, and zoom to 200% without clipping |
| Materials | radius, border width, shadow, surface level | one card per surface level and per floating level (menu, dialog, toast) | focus ring stays visible on every surface level |
| Layout | space scale (inset and gap), grid columns, breakpoints, container widths | the scale as bars, one page shell at each breakpoint | target sizes and reflow at 320 px |
| Motion | durations and easings | each transition, with a reduced-motion toggle | behavior under `prefers-reduced-motion` |

Contrast values come from a script run against the token source in each theme. Do not type them in.

Done when every token in the category appears in the table with a role, every role has a specimen, and the accessibility numbers were produced by a command recorded on the page.

## Brand page

Assets are files, so this page is a list with rules. Sections, in order:

1. `## Logo`. Each file with its repo path, format (SVG first, PNG where needed), and the background it is for. Clear space and minimum size if the team has them.
2. `## Typeface`. Loaded families and weights, license status, and the fallback stack. An unknown license is a gate.
3. `## Icons`. The icon set the app already uses, its import path, the sizes the Typography page allows, and the stroke rule. Give icons their own `/system/icons` page when there are more than about 30, with a searchable grid generated from the icon folder. Do not add an icon library.
4. `## Names`. Product and feature names as the product spells them.

Done when every file listed exists at its path and every rule names who confirmed it, or is a gate.

## Component pages

This is the skeleton every component page and its twin follow. `component-docs` writes the prose in the same sections and order, so the page never reshuffles an entry. Use these H2s, in this order. Do not add, drop or rename any. An empty section says `NOT SUPPLIED` or `Not applicable` with a one-line reason.

1. `## Description`. One sentence on what the component is for. Under it, a plain line with the import statement, the source path and the registry status. If the component has named parts (`Dialog.Title`, `Select.Item`), list them here.
2. `## Examples`. The default example first, then one example rebuilt from each real use in the product, each labeled with the screen it came from. Each example is a live render of the real component with its exact source under it.
3. `## Variants`. One subsection per variant axis (size, tone, shape). Each shows every value side by side in one live example. When two axes interact, add one matrix example, the way Geist compares every type at every size.
4. `## States`. One live example per state a reader can trigger: loading, disabled, invalid, open, and so on. Each says what the user can do in that state. When states overlap, say which wins.
5. `## Props`. A table generated from the component's types: name, type, default, and a one-line purpose. The prose file may add notes under the table. It never restates the table.
6. `## Usage`. Rules for choosing and writing the component, in four H3s in this order: `### Use it when`, `### Use something else when`, `### Writing` (labels and copy rules), `### Do and don't`. Each do and don't pair shows both as live examples when the API allows the don't.
7. `## Accessibility`. The native element or behavior primitive it rests on, the keyboard path (keys, effect, where focus goes after), the accessible name in every variant, and contrast ratios measured in each theme. Mark anything not verified `NEEDS REVIEW`.
8. `## Tokens`. The semantic tokens the component reads, taken from its styles, each linked to its foundation page.
9. `## Related`. Each alternative, with the situation where it is the better pick.

Where the older `component-docs` headings land, for teams moving existing entries:

| Older heading | Section now |
|---|---|
| Summary | Description |
| Parts | Description |
| In the product | Examples |
| Behavior | States |
| Use it when, Use something else when, Writing, Do and don't | Usage |

Examples import from the same path product code uses. A copy of the component inside the docs folder is a defect, because it drifts on the first change. Keep each example as a real file and render both the component and its source text from that file, so every code block on the page compiles.

Done, for one component page:

- All nine sections present, in order, each filled or marked with a reason.
- Every variant value and every triggerable state has a live example, in every theme the app ships.
- The Props table matches the component's types, checked by script.
- Every example file compiles and imports from the product import path.
- Accessibility has a measured keyboard walk and measured contrast, or `NEEDS REVIEW`.
- The twin loads, has the same H2s in the same order, and matches a fresh generation.
- The registry entry points at the page, the twin and the source file.

## Pattern pages

Optional. Add one only when two or more screens repeat the same composition and the team wants it kept the same: a form layout, an empty state, a settings page shell, a destructive confirm. Sections, in order:

1. `## Description`. The job the pattern does and the screens that use it now.
2. `## Examples`. One live composition per real screen, built from registry components only.
3. `## Composition`. The components it uses, in order, with the variant and props for each.
4. `## Usage`. When to use it and when a plain component is enough.
5. `## Accessibility`. Focus order across the parts and what is announced.
6. `## Related`.

Done when every example uses registry components only and each screen named under Description exists.

## Markdown twins

Every page has a twin at the same path with `.md` appended. The twin is what agents read.

- Generate the twin from the same source as the page. Never write it by hand.
- Keep the page's H2s and H3s, in the same order.
- Replace each live example with its code block and one line saying what it renders.
- Write tokens and props as Markdown tables.
- Start with an H1 and the one-sentence description. End with the component's source path and the date the twin was generated.
- Leave out navigation, theme toggles and anything that only works in a browser.
- Serve it with `Content-Type: text/markdown`. Where the framework allows it, also return the twin when a request sends `Accept: text/markdown` to the page URL, and add `<link rel="alternate" type="text/markdown">` to the page head.

A twin that goes stale is worse than no twin, because agents trust it. The generator runs in the build, and the check fails if a committed twin differs from a fresh one.

## llms.txt

Serve `/llms.txt` at the site root, or at the docs root if the app is not a docs site.

```markdown
# Acme design system

> Tokens, components and rules for the Acme web app. Read a page's .md twin before writing UI.

## Foundations
- [Colors](/system/colors.md): semantic color roles, theme values, contrast pairs
- [Typography](/system/typography.md): text styles and loaded fonts

## Components
- [Button](/system/button.md): actions that submit, confirm or open something
- [Dialog](/system/dialog.md): focused tasks that block the page until closed

## Optional
- [Registry](/system/registry.json): machine-readable component list
```

Each line gets a short note saying when to open the page. Generate the file from the registry and the foundation list, so a new component shows up without a hand edit.

## Registry

`registry.json` lists every canonical component. It is the source for the component list, `llms.txt`, the page routes and the drift check.

```json
{
  "components": [
    {
      "id": "button",
      "name": "Button",
      "import": "@/components/ui/button",
      "source": "components/ui/button.tsx",
      "docs": "/system/button",
      "markdown": "/system/button.md",
      "entry": "docs/system/button.md",
      "variants": { "tone": ["neutral", "primary", "danger"], "size": ["sm", "md"] },
      "states": ["loading", "disabled"],
      "tokens": ["color.action.primary.bg", "radius.control"],
      "replaces": ["components/legacy/PrimaryButton.tsx", "app/settings/SaveButton.tsx"],
      "status": "ready"
    }
  ]
}
```

`status` is `ready`, `ready-with-gaps` or `blocked`, the same grades as the handoff report. `replaces` feeds the migration map and the deprecated-import check. `variants` and `states` tell the docs check which examples must exist. If the project already uses a registry format, extend it with these fields instead of starting a second file.

## Pointer from AGENTS.md

Add one line to AGENTS.md or the project's agent instructions file. Keep it to a pointer, because the rules live in the docs.

```markdown
UI work: read /llms.txt, then the .md twin of each component you use. Run `npm run check:system` before finishing.
```

## Checks for the docs

Add these to the phase 6 checks.

- Every registry entry has a source file that exists, a page route that renders, and a twin that loads.
- Every component page and twin has the nine H2s in order.
- Every value in the entry's `variants` and every `states` item has an example file.
- Every committed twin equals a fresh generation.
- Every link in `llms.txt` resolves.
- Every example file compiles against current exports.
- Props tables match the component types.

## Done, page by page

| Page | Done when |
|---|---|
| Overview | Links resolve, the component list comes from the registry, the check command runs |
| Each foundation | Every token in the category has a row and a role, every role has a specimen, accessibility numbers came from a recorded command |
| Brand | Every listed file exists, every rule is confirmed or a gate |
| Each component | The seven points under Component pages hold |
| Each pattern | Examples use registry components only, the named screens exist |
| Twins and `llms.txt` | Every twin matches a fresh generation, every `llms.txt` link loads |
