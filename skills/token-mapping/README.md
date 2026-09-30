# token-mapping

Maps raw values from a codebase or a running build onto the tokens you already have. It checks what each value does before what it equals, then reports exact matches, near matches, ambiguous rows and gaps, with `file:line` for every value so the report works as a migration list. It never edits code or tokens.

## Use as-is

Ask something like "are we using our tokens on the settings page?" With repo access it finds the screen's files and the token list itself. Without it, give it the values (pasted code, or a URL to a running build) and your token list. It reads DTCG JSON, Tokens Studio, Style Dictionary, CSS custom properties, a styling layer's theme config, and a component library's variable pairs, whose names it maps onto as they are. With no token file in the repo, it stops and hands back every value grouped the way Geist lays out its foundations, ready to seed a token set.

## Replace first

1. Categories, tolerances and the gap threshold in `references/mapping-rules.md`. The defaults suit a 4px grid and a typical type scale, and each says why.
2. Where your tokens live, in `references/sources.md`, if the search order there would miss them.
3. The rem root and any modes you care about.
4. A precedence rule in CLAUDE.md or AGENTS.md if tokens live in more than one place. Without one, the skill reports conflicts and picks nothing.

## Invariants

Change one only when its stated reason doesn't apply to you.

- Purpose before value. An 8px radius token is wrong for an 8px gap, and a report that says otherwise looks right until someone ships it.
- Ambiguous rows keep every candidate, and a gap names the closest token when one fits the purpose. Those two sections hold the only decisions a person makes.
- No invented token names. A name proposed in a handoff tends to become real without anyone deciding it.
- Semantic tokens over primitives. Mapping to `gray.600` breaks the first time dark mode or a rebrand changes what "subtle text" means.
- No list, no mapping. Mapping from memory is how wrong names spread.
- Called by another skill, it runs to the end, puts questions in the report and opens with a status line, since a coordinator has no one to answer mid-run.

## What the scripts touch

This skill ships no scripts and writes no file. With `build-design-system` installed beside it, it runs `oklch.mjs` from there, which converts the colors given as arguments and prints the result, with no file access and no network. It reads token files and product code, and computed styles from a running build when you give a URL.

## Check after changing

File access and a browser are optional, and the pasted path must keep working. Run `TESTS.md` on one real screen or file.

## Adapt this skill

Use the interview prompt in `../ADAPTING.md` with `SKILL.md` and both files in `references/`. Topics for this skill: where your tokens live and in what format, your categories against these, your base unit and tolerances, your modes, the gap threshold, which source wins when two disagree, and any agreed exceptions.
