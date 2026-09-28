# token-mapping

Maps raw values from a codebase or a running build onto the tokens you already have. It checks what each value does before what it equals, then reports exact matches, near matches, ambiguous rows and gaps. On code it lists `file:line` for every value, so the report works as a migration list. It never edits code or tokens.

## Use as-is

Ask something like "are we using our tokens on the settings page?" With repo access it finds the screen's files and the token list itself. Without it, give it the values (pasted code, or a URL to a running build) and your token list. It reads DTCG JSON, Tokens Studio, Style Dictionary, CSS custom properties, Tailwind theme config or `@theme`, and shadcn's variable pairs. On shadcn it maps onto the names as they are, and it counts a utility like `bg-muted` as a token use. With no token file in the repo, it stops and hands back every value grouped the way Geist lays out its foundations, ready to seed a token set.

## Replace first

1. Categories, tolerances and the gap threshold in `references/mapping-rules.md`. The defaults are guesses.
2. Where your tokens live, in `references/sources.md`, if the search order there would miss them.
3. The rem root and any modes you care about.
4. A precedence rule in CLAUDE.md or AGENTS.md if tokens live in more than one place. Without one, the skill reports every conflict and picks nothing.

## Invariants

Keep these unless your system really differs.

- Purpose before value. An 8px radius token is wrong for an 8px gap, and a report that says otherwise looks right until someone ships it.
- Ambiguous rows stay visible with every candidate, and a gap names the closest token when one fits the purpose. Those two sections hold the only decisions a person needs to make.
- No invented token names. A proposed name in a handoff tends to become real without anyone deciding it.
- Semantic tokens over primitives. Mapping to `gray.600` breaks the first time dark mode or a rebrand changes what "subtle text" means.
- No list, no mapping. Mapping from memory is how wrong names spread.
- Called by another skill, it runs to the end, puts questions in the report and opens with a status line. A coordinator has no one to answer a question mid-run.

## Optional tools

File access to the repo keeps the list current and lets the report state when it was read. A browser lets it read computed values from a dev server, preview or production URL. The pasted path must keep working, because tool access differs by setup and permission.

## Check after changing

Run `TESTS.md` on one real screen or file. Confirm that a number match with the wrong purpose lands in Do not use, a value between two tokens stays ambiguous with both named, a vague ask still finds the list on its own, and the run still stops when no list exists.

## Adapt this skill

Give an agent the prompt below, along with `SKILL.md` and the two files in `references/`.

```
I want to fit the attached token-mapping skill to our system.

Interview me, one question per turn. Cover where our tokens live and in what format, our categories compared with yours, our base unit and tolerances, our modes, the gap threshold, which source wins when two token sources disagree (say, the JSON source and a hand-edited CSS file), and any exceptions we have agreed on.

Rules for you while we do this:
- Leave the procedure, stops, boundaries and final checks alone unless an answer of mine contradicts one.
- If a default tolerance no longer fits our base unit, suggest a replacement and let me approve it.
- Only use token names, categories and exceptions I give you. Anything I can't answer gets marked unresolved.

When the interview ends, split your proposed edits into behavior changes (what the skill accepts, rejects, stops on or hands to a person) and wording changes (same logic, new labels or phrasing). Show both lists and edit nothing until I say go.
```
