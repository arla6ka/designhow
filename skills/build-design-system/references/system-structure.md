# System structure

The structure below is modeled on Geist. Drop pages the app has no use for, and rename the URL root if `/system` is taken. `scripts/gen-docs.mjs` generates the twins, the rules page, the index and `llms.txt` from `docs/system/`, so the docs cost one command and are never cut. An HTML docs site with live examples is an optional follow-up, unless the person reviews in a browser (Live showcase).

Contents

- The model to study
- Routes and files
- Overview page
- Foundation pages
- Writing page
- Brand page
- Component pages
- Live showcase
- Pattern pages
- After the run
- Rules and coverage gaps
- Markdown twins
- llms.txt
- Registry
- Load conditions in AGENTS.md
- Checks for the docs
- Done, page by page

## The model to study

Geist, Vercel's design system, is the reference shape. Study it when you have internet access.

- Introduction: https://vercel.com/geist/introduction
- A foundation page: https://vercel.com/geist/colors, https://vercel.com/geist/typography, https://vercel.com/geist/materials, https://vercel.com/geist/grid
- A component page: https://vercel.com/geist/button, and its twin at https://vercel.com/geist/button.md

Take:

- Three kinds of page sit under one root. Foundations hold the decisions every component reads. Assets hold files people copy as they are. Components get one page each, all at the same depth.
- A foundation page is organized by role, not by value. The color page groups its steps by use (fills, borders, text) and names the variable for each.
- A component page leads with rendered examples and their code, works through sizes, variants and states one heading at a time, and ends with usage rules, accessibility included.
- Every page has a Markdown twin at the same URL plus `.md`.

What not to take: Geist's values, names, component list or brand. The inventory decides which pages exist, because an agent will copy from a page for a component the app does not use. Geist leaves props tables out. Keep them, because an agent reading a twin needs the API in one place.

## Routes and files

One URL root, default `/system`, with flat slugs. Component slugs are lowercase, hyphenated and equal to the registry id. Foundation and brand slugs are reserved, so no component is named `colors`.

```
/system                     overview
/system/colors              foundation
/system/typography          foundation
/system/materials           foundation: radius, border, shadow, surface levels
/system/layout              foundation: space scale, grid, breakpoints
/system/motion              foundation: presets, durations, easings, reduced motion
/system/writing             foundation: copy slots, voice rules, verb chains, banned words
/system/icons               asset
/system/brand               asset: logo, typeface, product names
/system/<component>         one per canonical component
/system/patterns/<pattern>  optional, see Pattern pages
/system/rules               every trap/ and rule/ ID the system answers, generated
/system/coverage-gaps       what the system has not decided yet
/system/registry.json
/llms.txt
```

Every HTML route has a twin: `/system.md`, `/system/colors.md`, and so on.

In the repo, keep the page content next to the thing it documents and generate the rest. The default layout works on any stack that serves a static folder. Paths and extensions below are one example; use the app's own:

```
tokens/                          token source (DTCG JSON), see token-architecture.md
components/ui/<component>.tsx    canonical components
docs/system/spec-template.md     copied from the skill at setup, skipped by the generator
docs/system/<component>.md       the component's spec: the component-docs entry filled to spec-template.md
docs/system/<foundation>.md      colors, typography, materials, layout, motion, writing, icons, brand
docs/system/examples/<component>/<name>.tsx   one complete file per example (see Component pages), imported by tests and any HTML docs site
docs/system/rule-tests/<component>.tsv        the four rule tests per rule (rule-method.md)
docs/system/copy-inventory.tsv   every user-facing string by slot (scripts/copy-check.mjs --extract)
docs/system/vague-words.txt      optional additions to the words a rule may not lean on
docs/system/coverage-gaps.md     hand-written list of undecided areas
docs/system/decisions.md         settled conflicts between pages, specs and code, with precedence (coordinator-path.md, Review, decide, fix)
scripts/gen-docs.config.json     gen-docs settings (name, paths), written by its first run
public/system/<slug>.md          generated twins           (scripts/gen-docs.mjs)
public/system/rules.md           generated rules page
public/system/index.md, index.html   generated overview and one plain HTML page of every twin
public/llms.txt                  generated
registry.json                    or the foundation's own registry file, with these fields added (base reference)
<routes>/system/...              optional HTML docs site with live examples
```

`node scripts/gen-docs.mjs --help` lists its flags. A write run saves its flags to `scripts/gen-docs.config.json`, so `--check` needs none and generates the same output. `--check` writes nothing and exits 1 when any output differs from a fresh run, which catches a hand-edited or stale twin, or a Props table the types no longer match. The rules page ends with the check's blind spots from `check-system.mjs --list-blind-spots`.

Every stack keeps the same split: one prose file per component, examples as real files, and pages plus twins generated from those files and the token source. The examples folder is `examplesDir` in `scripts/gen-docs.config.json`, default `docs/system/examples`, and an example takes the component's own file extension (`.tsx`, `.vue`, `.svelte`).

Serving twins at `<page>.md` takes one of three forms, whichever the framework supports:

- Static files, the generator's default. The static folder serves `system/button.md` at `/system/button.md`. This needs no routing and works on every stack.
- One route handler for all twins, with a rewrite from `/system/:slug.md` to it.
- A middleware or proxy that rewrites `/system/:slug.md` and requests with `Accept: text/markdown`.

File-name tricks, such as a dynamic route folder whose name ends in `.md`, fail on many routers. Check the twin URL with `curl -sI` before writing the docs check.

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
| Colors | surface, text, border, icon, action, status, focus | a swatch per role, placed on the surface it pairs with | contrast ratio for every surface and foreground pair in each theme, and for each translucent tint composited over every surface it can sit on, from a script |
| Typography | one row per composite text style: family, size, line height, weight, tracking | a line of real product copy per style | smallest size in use, and zoom to 200% without clipping |
| Materials | radius, border width, shadow, surface level | one card per surface level and per floating level (menu, dialog, toast) | focus ring stays visible on every surface level |
| Layout | space scale (inset and gap), grid columns, breakpoints, container widths | the scale as bars, one page shell at each breakpoint | target sizes and reflow at 320 px |
| Motion | presets first, then durations and easings | each preset, replayable, with a reduced-motion toggle | behavior under `prefers-reduced-motion` |

Contrast values come from a script run in each theme, never typed in.

Done when every token in the category has a table row and a role, every role has a specimen, and the accessibility numbers came from a command recorded on the page.

## Writing page

`docs/system/writing.md` is the foundation for copy. It holds no tokens, so it has its own sections, in this order. `references/writing-method.md` derives its content, and `scripts/copy-check.mjs` reads the tables named here, so keep their columns.

1. `## Description`. One or two sentences on what the page decides, and the inventory it was derived from, with its row count.
2. `## Slots`. One table, one row per slot: `| Slot | Sources | Rows | Casing | Max chars | End punctuation | Template |`. Sources lists where the slot's strings come from, comma-separated: `Tag` (text children), `Tag[prop]` (a string prop), `fn()` (the first string argument of a call such as `toast.error()`), `fn({key})` (a key of the first object argument). `*[prop]` matches the prop on any tag. Casing is `sentence`, `title`, `as stored` or `any`. Max chars is a number or `none`. End punctuation is `period`, `none` or `any`. Template uses `{holes}`, or `any`.
3. `## Usage`. The rules, one H3 per slot in the Slots order, then `### Across slots`. Each line is a rule in the shape from `rule-method.md`, with IDs `rule/writing-<slug>`. Component specs cite these IDs under `### Content` instead of restating them.
4. `## Verb chains`. One table: `| Chain | Verb | Action | Confirm title | Confirm action | Result |`. Verb is the base form, with irregular forms after a slash (`send/sent`). Each step cell is a `file:line`, or `none` when the flow has no such step. A row whose Chain cell starts `Exempt:` names a `confirm-action` row's `file:line` in the Action cell and its reason in the Verb cell.
5. `## Banned words`. One table: `| Word | Instead | Evidence |`. Word is matched whole and case-insensitive. Instead names the replacement, or `cut`.
6. `## Accessibility`. Accessible names that differ from visible text and why, link text out of context, how errors and results are announced, and what was measured.

Done when every slot has a Sources cell with rows behind it, every rule passes the rule shape and has a `docs/system/rule-tests/writing.tsv` row, and `node scripts/copy-check.mjs` exits 0.

## Brand page

Assets are files, so this page is a list with rules. Sections, in order:

1. `## Logo`. Each file with its repo path, format (SVG first, PNG where needed), and the background it is for. Clear space and minimum size if the team has them.
2. `## Colors`. The literal brand values that do not change with the theme, and the semantic role that carries each.
3. `## Typeface`. Loaded families and weights, license status, and the fallback stack. An unknown license is a gate. A weight token names only a weight whose font file exists. A missing weight is a gate, never synthesized (`trap/weight-synthesized`).
4. `## Icons`. The icon set the app already uses, its import path, the size per control size, the alignment rule (`traps.md`, `trap/icon-optical-size` and `trap/icon-optical-align`), and the stroke rule. Give icons their own `/system/icons` page with a generated searchable grid once a list stops being scannable, default about 30. Do not add an icon library unasked. When the person asks for another set, swap every icon in one commit, then rederive sizes and alignment before anyone reviews it.
5. `## Names`. Product and feature names as the product spells them.
6. `## Source map`, when the person gave a design source, at any fidelity. One row per source element: the token or component that carries it and its frame id, or "marketing only".

Done when every file listed exists at its path and every rule names who confirmed it, or is a gate.

## Component pages

Every component page and its twin use the nine H2s and the Usage H3s of `component-docs` `references/doc-format.md` (Headings, in order), filled to `spec-template.md`, which holds the same skeleton when that skill is not installed. The page renders each section live: every variant value side by side, a matrix when two axes interact, one example per triggerable state, and each rule's Don't and Do pair labeled below it. The Props table is generated from the types by `scripts/props-table.mjs`, which `gen-docs.mjs` runs for every page whose registry entry names a source file, so keep `typescript` installed wherever the check runs. Older headings map per `spec-template.md` (Moving an older spec).

Examples import from the same path product code uses. A copy of the component inside the docs folder is a defect, because it drifts on the first change. Render both the component and its source text from the one example file, so every code block on the page compiles.

The docs site's own styles never reach inside an example. A selector such as `.docs h2` also styles the `h2` an example renders, so the page shows the component wrong. Scope chrome styles to the chrome, such as `.docs-prose h2` or `@scope (.docs) to (.example)`, and wrap every live example in a container the chrome selectors never enter. The docs check below proves it.

Done, for one component page in an HTML docs site: the spec passes `check-spec.mjs`, and every variant value and triggerable state has a live example in every theme. Every rule has a `rule-tests` row with verdict `ship`, `rewritten` or `gate` (`rule-method.md`). Accessibility has a measured keyboard walk and measured contrast, or `NEEDS REVIEW`. The twin matches a fresh generation, and the registry entry points at the page, the twin and the source file.

## Live showcase

When the person reviews in a browser, or asks for a page in the app rather than a workbench, the HTML docs site is not a follow-up. It is a dev-only route inside the app, default `/system`, outside the app's shell, built from phase 3 and grown one page per family as each family lands. It is never cut.

- One page per component and per foundation or guideline page, each with its own URL. The overview only links out.
- The sidebar is a navigator only: groups and links in sentence case, the current page marked, with no previews, counts or content.
- Each page has one `h1`, the component's name, then examples, variants, states, edge cases, an example from a real screen, and last the Usage rules rendered from the spec, each rule with its Don't and Do pair labeled. Previous and next links close the page.
- A theme switch sits in the top bar. Examples use inert data from one shared fixtures file in the app's own vocabulary. A stand-in asset is the kind it stands for: an avatar is a face or initials, a logo slot holds a logo-shaped mark.
- Pages come from one registry that finds its entries, so a new page needs no edit to a shared file.
- The pages obey every rule and ban they show, since agents copy them. Demos meet the component contract too, and a stepped demo waits on the element's animations, never on timers (`trap/demo-on-timers`).

Give the person the link, and open it in the host's browser or preview pane when it has one.

When the person reviews in a browser, each page also gets an agent view: a named radio group, "Human" and "Agent", whose choice shows in the URL. The agent view renders the twin's source Markdown as a file viewer with the same content edge as the human view. Prose lines stop near 96 characters, tables and code scroll in their own box, and line numbers stay out of the text selection and the accessibility tree. It is tested like any page, in both themes, at the stress widths (`stress-test.md`).

## Pattern pages

Optional. Add one only when two or more screens repeat the same composition and the team wants it kept the same: a form layout, an empty state, a settings page shell, a destructive confirm. Sections, in order:

1. `## Description`. The job the pattern does and the screens that use it now.
2. `## Examples`. One live composition per real screen, built from registry components only.
3. `## Composition`. The components it uses, in order, with the variant and props for each.
4. `## Usage`. When to use it and when a plain component is enough.
5. `## Accessibility`. Focus order across the parts and what is announced.
6. `## Related`.

Done when every example uses registry components only and each screen named under Description exists.

## After the run

The system keeps working only when someone owns it. On a full footprint, the handoff sets up:

- An owner per system folder (tokens, components, docs), as a CODEOWNERS line when the repo uses them, named in the Frame.
- Registry fields `owner`, `since` and `deprecated: {by, removeBy}`. A deprecated import warns until `removeBy`, then fails `rule/deprecated-import`.
- Both CI tiers, with the ratchet file committed (`checks.md`, CI tiers).
- The contribution path. The AGENTS.md block's "open a gate" line names the repo's real path, an issue or PR label named in the Frame.

`check-system.mjs` fails a deprecated import at once today, and warns on an allowlist row whose `removeBy` date has passed (`checks.md`, The allowlist). A registry warn-until-date form is a team addition to the check, with a fixture pair.

## Rules and coverage gaps

Two short pages every system gets, both listed in `llms.txt`.

`/system/rules` is generated by `gen-docs.mjs` from the specs, the foundation pages, `check-system.mjs --list-rules` and `copy-check.mjs --list-rules`. One row per `trap/` and `rule/` ID: the ID, the one-line rule, the page that answers it, the kinds of ground it rests on, and the script that enforces it, else the rule's own `Check:` clause, else "review". It is the list of things this app's UI must not do, in one place an agent can read before writing code.

`/system/coverage-gaps` is written by hand from the gates. Each row names an area with no decision yet, such as tables or chart colors, the gate that owns it, and a "Meanwhile" concrete enough that two agents building the same screen get the same result: the page width, the components to use, the state order, and a screen to copy. "Stop and ask" is not a meanwhile, and neither is "don't build it", because it blocks the next screen. When the gap is a missing component, the Meanwhile says how to add it: the foundation's own add command or the base reference's pattern, a registry entry, and a spec from the template.

```markdown
| Area | Gate | Meanwhile |
|---|---|---|
| Tables and record lists | G-07 | Page width as /settings. A divided list of rows, amounts right-aligned with tabular figures. Loading: 5 Skeleton rows at the row height. Empty: Empty with one primary action. Error: Alert above the list with a Retry button |
| Forms | G-08 | One Field per control: label above, help under it, error text under that, tied with `aria-describedby`. Validate on submit, then live per field. After a failed submit, focus moves to the first invalid field and the values stay. Copy /settings/profile |
| Dialogs and confirms | G-09 | No Dialog in the system yet. Add it with the foundation's add command, register it, write `docs/system/dialog.md` from the spec template, and use it for the confirm |
```

An agent that finds its task in this list follows the row's Meanwhile and names the gap in its final message.

In every mode, phase 7 documents the shared state patterns: loading, error, empty, no permission and partial failure, each with its width, component and state order. Each rests on app evidence, or is a row here with its Meanwhile, beside a row for every other open gate.

## Markdown twins

Every page has a twin at the same path with `.md` appended. Agents read the twin.

- Generate the twin from the same source as the page. Never write it by hand.
- Keep the page's H2s and H3s, in the same order.
- Replace each live example with its code block and one line saying what it renders.
- Write tokens and props as Markdown tables.
- Start with the generator's HTML comment on the first line, then an H1 and the one-sentence description. End with the component's source path, which the generator adds from the registry. No generation date, since a date makes every fresh generation differ from the committed twin.
- Leave out navigation, theme toggles and anything that only works in a browser.
- Serve it with `Content-Type: text/markdown`. Where the framework allows it, also return the twin when a request sends `Accept: text/markdown` to the page URL, and add `<link rel="alternate" type="text/markdown">` to the page head.

`gen-docs.mjs --check` fails a stale twin.

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

Each line's note, saying when to open the page, comes from the first sentence under `## Description`, so a new spec shows up with no hand edit.

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
      "states": ["pending", "disabled"],
      "tokens": ["color.action.primary.bg", "radius.control"],
      "replaces": ["components/legacy/PrimaryButton.tsx", "app/settings/SaveButton.tsx"],
      "status": "ready"
    }
  ]
}
```

`status` is `ready`, `ready-with-gaps` or `blocked`, the handoff grades. `replaces` feeds the migration map and the deprecated-import check. `variants` and `states` tell the docs check which examples must exist.

When the foundation has its own registry format, the same fields go into it, never into a parallel file (the base reference says where).

## Load conditions in AGENTS.md

Agents often skip available skills and docs, so a one-line pointer is not enough. Write a short block into AGENTS.md or the project's agent instructions in phase 3, right after the tokens land, and never cut it. It names the work that triggers it, what to read, and what to run. The rules themselves stay in the docs.

```markdown
## UI work

Before you add or change a component, a screen, a style, a token, or copy in the UI:
1. Read public/llms.txt, then public/system/rules.md, docs/system/decisions.md and the twin in public/system/ of each component you touch.
2. If the task is in public/system/coverage-gaps.md, follow that row's Meanwhile and name the gap in your final message.
3. Use a registry component and the tokens in styles/globals.css. If none fits, open a gate before writing one.
Before you finish: run `npm run check`, and capture the changed screens at 390 and 1280.
CI warns on changed lines that bypass the system. `node scripts/check-system.mjs --explain <rule-id>` gives the fix. Fix each warning, or say in the PR why it stays.
These rules win over the color and component rules in .cursor/rules/ui.mdc and docs/brand-guide.md.
```

Name real paths, the real check command and the Frame's viewports. Below the block, `node scripts/gen-docs.mjs` writes a compressed index between `<!-- ds-index:start -->` and `<!-- ds-index:end -->`: token names by role, components with import path and one-line job, the rule ids and the commands. It appends the markers to AGENTS.md when they are missing and creates the file when there is none. It also writes `docs/system/changelog.md` from the git log of `docs/system/` and the token source. `--check` covers the index but not the changelog, since the commit that writes the changelog changes the log. Never edit either by hand. Before the docs exist, the block names the token file and the check, and phase 7 adds the docs lines. Delete a line when the repo has no such thing.

In phase 3, find the other agent-instruction files and brand guides (AGENTS.md, CLAUDE.md, editor rule files, copilot instructions) whose color, type or component rules contradict the new system. The precedence line names each. Edit those files only when the person asks.

On a full footprint, phase 8 also writes four project skills in the repo's skills folder, named after the product, and the block names each: use (build screens with the system: the component picker, the bans, page anatomy, states and a pre-ship check), maintain (add or change a component or token end to end, with the verification commands and the dev-environment traps met in the run, and a correction log, where a correction lands as a token, variant or check once it repeats, and its count is rechecked after the fix), review (the lenses in `coordinator-path.md`, Review, decide, fix) and migrate (one legacy screen per commit, with before and after captures). Each points to the docs and never restates their rules. One worker writes them from the finished system, not from the run's briefs, runs every command it names once, and reports each inconsistency it finds as a fix before close. Everything they cite, trap and rule IDs included, is defined in the repo, never only in an installed skill.

## Checks for the docs

Add these to the phase 5 check. The first three run on every system. The rest apply once an HTML docs site exists.

- `node scripts/gen-docs.mjs --check`: every twin, the rules page, the index and `llms.txt` equal a fresh generation, and no orphaned twin is left.
- `node scripts/check-spec.mjs docs/system`: every spec answers the template, with the nine H2s in order, its rules in shape, and its example files present.
- `node scripts/copy-check.mjs`, once `docs/system/writing.md` exists: the copy inventory is fresh and the app's strings follow the writing page.
- Every registry entry has a source file that exists and a spec in `docs/system/`.
- Every value in the entry's `variants` and every `states` item has an example file, and every example file compiles against current exports.
- Every page route renders, and every link in `llms.txt` loads.
- Docs chrome does not reach into examples. `node scripts/check-docs-leak.mjs --pairs scripts/docs-leak.json` renders each example alone and on its docs page, compares the computed styles of every element inside it, and fails on any difference. It needs a browser (`browser.md`) and prints SKIP when none exists.

## Done, page by page

| Page | Done when |
|---|---|
| Overview | `index.md` and `index.html` are fresh, and every link in them resolves |
| Each foundation | Every token in the category has a row and a role, and accessibility numbers came from a recorded command |
| Writing | Every slot has sources and rows, every rule is tested, and `copy-check.mjs` exits 0 |
| Brand | Every listed file exists, every rule is confirmed or a gate |
| Each component | The spec passes `check-spec.mjs`, its twin is fresh, and the registry entry points at the source, the spec and the twin |
| Each pattern | Examples use registry components only, the named screens exist |
| Rules and coverage gaps | `rules.md` is fresh, every coverage gap names what to do meanwhile |
| Decisions | `docs/system/decisions.md` is committed, opens with its precedence, and every page and component each decision names says or does it |
| Twins and `llms.txt` | `gen-docs.mjs --check` exits 0, every `llms.txt` link loads |
| AGENTS.md | The load-conditions block names real paths and the real check command, and the generated index sits between its markers |
| HTML docs site, optional | The Done line under Component pages holds, and `check-docs-leak.mjs` exits 0 |
| Live showcase, when the person reviews in a browser | One page per component and foundation, a navigator-only sidebar, the rules rendered on every page, and the agent view passing its tests |
| Project skills, on a full footprint | Use, maintain, review and migrate exist in the repo, every command they name ran once, and the agent-instructions block names them |
