# Finding and reading sources

Read the section for the path this run takes. Record the path in the source line.

## Finding the values

- A named screen or component maps to its files by route or export name.
- With nothing named, take the style values in the files the current branch changes against the main branch.
- Pasted code or values, a URL to a running build, and screenshots all count.
- Leave out Next.js private folders (`app/**/_*`, such as `app/_patterns`). They never route and are often unimported, so their values are not on any screen. Route groups such as `app/(shop)` do route and stay in.
- Leave out the system's own scaffolding, even when the branch diff touches it: `public/system/`, generated `.md` twins and indexes, `scripts/`, check fixtures (`*.fixture`, `fixtures/`), `.design-system/`, `.migration/` and skill folders (`.agents/`, `.claude/`, `skills/`). Their values are examples and generated copies, not product use, and counting them makes a migration look worse than it is. With ripgrep, pass these as `-g '!<glob>'` and never name one as a search root.

List the excluded folders once under Source.

Record the choice in the source line as an assumption.

## Finding the token list

Look where AGENTS.md or CLAUDE.md points first. Then look for, in this order:

1. `*.tokens.json` or `tokens.json`, or a `tokens/` folder
2. On shadcn, the CSS file named in `components.json` under `tailwind.css`. Its `:root` and `.dark` pairs are the list, one mode each
3. A Tailwind config or an `@theme` block
4. CSS files that define many custom properties on `:root`

If several turn up and one is generated from another, map against the source and treat the generated file as a second source. If they are unrelated, report each and ask which one the team maps against.

## Where purpose comes from

| Format | Purpose is read from |
|---|---|
| DTCG JSON (`.tokens.json`) | `$description`, `$type`, and the group path |
| Tokens Studio JSON | `description`, `type`, and the token set name |
| Style Dictionary source or output | `comment` and the category and type path |
| CSS custom properties | A role in the name (`--color-text-muted`) and comments beside it |
| Tailwind theme config or `@theme` | The key path, such as `colors.surface.raised` |
| shadcn variable pairs | The pair: `--muted` is a surface and `--muted-foreground` is text on it. `--border`, `--input` and `--ring` name their jobs |

The list is only what the project declares. A framework's default theme, such as Tailwind v4's built-in palette, is never the team's list. `mapping-rules.md` ("What counts as the team's list") sorts each use into token use, palette use or raw value.

A Tailwind utility built from a declared role name, such as `bg-muted` or `text-muted-foreground`, is already a token use, like `var(--muted)`. Skip it in the groundwork. With an alpha modifier (`bg-muted/50`) it is still a token use, counted as token + alpha with no row. On shadcn, map onto the names as they are and never propose renaming one, since every copied component reads them.

Palette names like `blue-500` or `space-4` state a value, not a role. A utility built from one is palette use: it gets a row and is counted apart from raw values. A list made only of names like these supports value matching and nothing more, and the report adds Consistency by role.

## Running build

Read computed values in the browser. Record the URL, the selector, the viewport and the theme. Read each element at rest, with no hover or focus, unless the row is about that state. When a value looks wrong, check how it was read before trusting it.

A color picked off a screenshot is approximate. Its row is never exact, its reason says "from screenshot", and the classes otherwise follow the rules file.

## Converting colors

Convert with code whenever a tool can run it, such as a short script that turns every color into OKLCH and compares pairs by ΔE OK. Name the command and its exit code in the source line. Conversion by eye is how near misses get reported as exact.

## Tool failure

A tool listed as connected may still fail to reach the file or page. When a read fails, lacks permission, or returns part of the list, say so, map only against what came back, and mark the other rows unverified. Leave unverified rows out of the gap count.
