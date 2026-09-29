# Finding and reading sources

Read the section for the path this run takes, and record the path in Source.

## Finding the values

- A named screen or component maps to its files by route or export name.
- With nothing named, take the style values in the files the current branch changes against the main branch.
- Pasted code or values, a URL to a running build, and screenshots all count.
- Leave out folders the router never serves and nothing imports, such as private example folders, since their values are on no screen. Folders that only group routes do route and stay in. The foundation reference for the app's stack (`../build-design-system/references/base-*.md`) says how its router marks these.
- Leave out the paths in `../build-design-system/references/inventory.md` (Excluded paths), even when the branch diff touches them, plus the check's own `scripts/`, whose values are examples. Without that sibling, leave out skill folders, `docs/system/`, `public/system/`, fixtures, `.design-system/`, `.migration/`, dependencies and build output. Pass these as exclude globs to the search tool, never as search roots.

List the excluded folders once under Source, and record the choice of values there as an assumption.

## Finding the token list

Look where AGENTS.md or CLAUDE.md points first. Then look for, in this order:

1. `*.tokens.json` or `tokens.json`, or a `tokens/` folder
2. A component library's variable pairs, in the file its config names (the matching `base-*.md` says which)
3. Theme entries where the app's styling layer defines tokens, such as a theme config file or theme block
4. CSS files that define many custom properties on `:root`

If several turn up and one is generated from another, map against the source and treat the generated file as a second source. If they are unrelated, report each and ask which one the team maps against.

## Where purpose comes from

| Format | Purpose is read from |
|---|---|
| DTCG JSON (`.tokens.json`) | `$description`, `$type`, and the group path |
| Tokens Studio JSON | `description`, `type`, and the token set name |
| Style Dictionary source or output | `comment` and the category and type path |
| CSS custom properties | A role in the name (`--color-text-muted`) and comments beside it |
| A styling layer's theme config | The key path, such as `colors.surface.raised` |
| Surface and foreground pairs | The pair: `--muted` is a surface and `--muted-foreground` is text on it. Names like `--border` or `--ring` name their jobs |

The list is only what the project declares, never a framework's default theme. `mapping-rules.md` (What counts as the team's list) sorts each use into token use, palette use or raw value. Where a component library ships variable names that its copied components read, map onto the names as they are and never propose renaming one.

## Running build

Read computed values in the browser. Record the URL, the selector, the viewport and the theme. Read each element at rest, with no hover or focus, unless the row is about that state. When a value looks wrong, check how it was read before trusting it.

A color picked off a screenshot is approximate. Its row is never exact, its reason says "from screenshot", and the classes otherwise follow the rules file.

## Converting colors

Convert with `node <skills>/build-design-system/scripts/oklch.mjs`, where `<skills>` is the folder that holds this skill and its siblings (`build-design-system/references/run-record.md`, Terms). It turns hex or `rgb()` into OKLCH and prints ΔE OK between two colors on the times-100 scale the tolerances use (`--help`). Without that sibling, write a short script: sRGB to linear, then the OKLab matrices, then ΔE OK as the Euclidean distance in OKLab times 100. Name the command and its exit code in Source. Never convert by eye.

## Tool failure

A tool listed as connected may still fail to reach the file or page. When a read fails, lacks permission, or returns part of the list, say so, map only against what came back, and mark the other rows unverified. Leave unverified rows out of the gap count.
