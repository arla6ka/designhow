---
name: token-mapping
description: Maps hardcoded style values onto a project's existing design tokens, purpose first, then value. Use for "are we using our tokens here", "find the hardcoded colors", "map these values to tokens", a token audit, or planning a token migration. Skip creating or renaming tokens.
---

# Token mapping

A report that lands raw values (hex codes, pixel values, shadows) on a token list someone else owns. It never creates or renames tokens and never edits code. With no settled token set, it hands back groundwork for building one.

The rules live in `references/mapping-rules.md`: the four classes, categories, normalizing, tolerances, the gap threshold, source conflicts, and a full example report. Read it before step 1. Finding the values and the list, and reading each format, are in `references/sources.md`.

## Start from whatever the ask gives

"Check the tokens on the settings page" is enough. Find the values and the list in the repo yourself, and ask only for what no tool can reach. Defaults when nothing is said:

- Values: the files the current branch changes.
- Mode: the list's default mode, named in the source line.
- rem root: 16px, unless the project sets another.

## When a coordinator calls it

A coordinator, such as a router skill, `build-design-system` or `migrate-design-system`, passes the values and the list in its brief. Take them as given and run to the end without asking anything. Put every question under For a person to decide, where the caller turns it into a gate. Start the report with one status line: `Status: complete`, `Status: not actionable (gap threshold)`, or `Status: stopped: <condition>`. End by returning the report, or the stop shape below, as your final message, since the coordinator reads nothing else.

## Steps

1. **Load the rules.** Read `references/mapping-rules.md` and any AGENTS.md or CLAUDE.md. Done when team overrides and any precedence rule are noted.
2. **Load the list.** Done when the source line has its name, format, location, read method and time. One name with two values in the same mode is a broken list. Stop.
3. **Resolve it.** Follow every alias to its final value in each mode being mapped. If a second source exists, compare the two. Done when every alias resolves and every disagreement is written down.
4. **Collect the groundwork.** One row per property, so a `border` shorthand becomes two rows. Each row has its location (`file:line` for code, URL plus selector for a live build), its category, and its job. Skip values that already reference a token, such as `var(--x)`. Done when every raw value in scope has a row.
5. **Normalize** both sides as the rules file says. Convert colors with code when a tool can run it.
6. **Classify.** List the candidate tokens whose stated purpose covers the row's job, preferring a semantic token over its primitive. Compare values in each mode and give one class per row per mode. A value match with the wrong purpose moves its token to Do not use. Done when every row has a class and a reason, and every semantic row states its difference in numbers.
7. **Count and close.** Apply the gap threshold, then write the summary counts and the source line.

## Output

Seven parts, in this order. `references/mapping-rules.md` shows each one.

1. Summary. Counts for exact, semantic, ambiguous, gap and Do not use. A list with no stated purpose makes the first line "Value matching only".
2. Mapping table. Value, location, job, token, class, reason. For code, sort by file and line so the table doubles as a migration list.
3. Do not use. Each token whose value matches but whose purpose does not fit, with the purpose it does have.
4. Ambiguous. Every candidate, and the fact that would settle the row.
5. Gaps. What the value does and why no token covers it.
6. For a person to decide. The ambiguous rows, the gaps and any open conflict, as questions.
7. Source. List name, format, path, read method, date and time, modes, how colors were converted, the precedence rule applied if any, and every assumption made to fill a vague ask.

The report is ready when:

- Every token it names exists in the list that was read.
- Every row has a job, a class and a reason. Every semantic row states its difference.
- Every ambiguous row names all its candidates, and every gap is unnamed.
- A semantic token appears wherever one covers the job, never its primitive.
- Anything inferred rather than read, such as a job taken from a class name, is marked inferred.
- Nothing in the repo changed.

## Stops

Stop and report on these. Everything else is decided in the run.

- No list exists, or no tool can read one.
- One name has two values in the same mode.
- Two sources disagree and no project rule says which wins. Report both sides.
- Gaps pass the threshold. Finish the table first, then ask whether this is the right list.
- A gap needs a name, or a decision that it deserves a token.

A stopped run returns the condition, the groundwork from step 4, and the shortest message that unblocks it, such as "Paste `tokens.json` or give its path." With no token file in the repo at all, group the groundwork by the foundation layout in the rules file, so it can seed a new set. When the threshold fires, also return the finished table marked not actionable.

## Hard limits

- Name only tokens that exist in the list that was read. A gap stays unnamed.
- Keep every candidate on an ambiguous row, even when one looks likelier.
- Match on purpose before value, and on value only within the rules file's tolerances. Color has none.
- Read the list and the values fresh each run, with the read time recorded. A failed read gets reported, not filled from memory.
- A public system's token names, Geist's included, are never the team's list.
