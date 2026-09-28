# Finding and reading sources

Read the section for the path this run takes. Record the path in the source line.

## Finding the values

- A named screen or component maps to its files by route or export name.
- With nothing named, take the style values in the files the current branch changes against the main branch.
- Pasted code or values, a URL to a running build, and screenshots all count.

Record the choice in the source line as an assumption.

## Finding the token list

Look where AGENTS.md or CLAUDE.md points first. Then look for, in this order:

1. `*.tokens.json` or `tokens.json`, or a `tokens/` folder
2. A Tailwind config or an `@theme` block
3. CSS files that define many custom properties on `:root`

If several turn up and one is generated from another, map against the source and treat the generated file as a second source. If they are unrelated, report each and ask which one the team maps against.

## Where purpose comes from

| Format | Purpose is read from |
|---|---|
| DTCG JSON (`.tokens.json`) | `$description`, `$type`, and the group path |
| Tokens Studio JSON | `description`, `type`, and the token set name |
| Style Dictionary source or output | `comment` and the category and type path |
| CSS custom properties | A role in the name (`--color-text-muted`) and comments beside it |
| Tailwind theme config or `@theme` | The key path, such as `colors.surface.raised` |

Palette names like `blue-500` or `space-4` state a value, not a role. A list made only of names like these supports value matching and nothing more.

## Running build

Read computed values in the browser. Record the URL, the selector, the viewport and the theme. Read each element at rest, with no hover or focus, unless the row is about that state. When a value looks wrong, check how it was read before trusting it.

A color picked off a screenshot is approximate, so a row built on one is ambiguous.

## Converting colors

Convert with code whenever a tool can run it, such as a short script that turns `oklch()` or `hsl()` into sRGB channels. Name the method in the source line. Conversion by eye is how near misses get reported as exact.

## Tool failure

A tool listed as connected may still fail to reach the file or page. When a read fails, lacks permission, or returns part of the list, say so, map only against what came back, and mark the other rows unverified. Leave unverified rows out of the gap count.
