---
name: token-mapping
description: Reports how hardcoded style values on a page, file or diff map onto a project's existing design tokens, purpose first, then value. Use for "are we using our tokens here", "which hardcoded colors map to which tokens", "map these values to tokens", a token audit, or planning a token migration. It never edits. Fixing or cleaning up hardcoded values, and whole-app consistency questions, go to design-system-boss. Skip creating or renaming tokens.
---

# Token mapping

A report that lands raw values (hex codes, pixel values, shadows) on a token list someone else owns. It never creates or renames tokens and never edits code. With no settled token set, it hands back groundwork for building one.

The rules, with a full example report, are in `references/mapping-rules.md`. Finding the values and the list, and reading each format, are in `references/sources.md`.

## Start from whatever the ask gives

"Check the tokens on the settings page" is enough. Find the values and the list yourself, and ask only for what no tool can reach. Defaults:

- Values: what the person named. Otherwise the files the current branch changes, and with no diff, the product code, stated in Source. Either way, leave out the folders `references/sources.md` excludes.
- Mode: the list's default mode, named in Source.
- rem root: 16px, unless the project sets another.

## When a coordinator calls it

Take the values and the list in the brief as given and run to the end without asking. Every question goes under For a person to decide, where the caller turns it into a gate. Start the report with one status line: `Status: complete`, `Status: not actionable (gap threshold)`, or `Status: stopped: <condition>`. Return the report, or the stop shape below, as your final message, since the coordinator reads nothing else.

## Steps

1. **Load the rules.** Read `references/mapping-rules.md` and any AGENTS.md or CLAUDE.md. Done when overrides and any precedence rule are noted.
2. **Load the list.** Done when Source has its name, format, location, read method and time.
3. **Resolve it.** Follow every alias to its final value in each mode, and compare any second source. Done when every alias resolves and every disagreement is written down.
4. **Collect the groundwork.** One row per property, so a `border` shorthand becomes two rows. Each row has its location (`file:line` in code, URL plus selector on a live build), category and job. Sort each use as token use, palette use or raw value (`mapping-rules.md`, What counts as the team's list). Skip token uses and count those with an alpha as token + alpha. Leave `graphic` values out and list them once. Done when every raw and palette value in scope has a row.
5. **Normalize** both sides per the rules file, converting colors with code when a tool can run it.
6. **Classify.** List the candidate tokens whose stated purpose covers the row's job, preferring a semantic token over its primitive. Compare values in each mode and give one class per row per mode. A value match with the wrong purpose moves its token to Do not use. Done when every row has a class and a reason, and every semantic row states its difference in numbers.
7. **Count and close.** Apply the gap threshold. Write Consistency by role when the list states no purposes or the ask is about consistency. Then write the Summary and Source.

## Output

Seven parts, in this order, each shown in `references/mapping-rules.md` (Report shape).

1. Summary. One sentence that answers the person's question, then the counts line, in occurrences.
2. Mapping table, sorted by file and line in code so it doubles as a migration list. With a palette-only list, Consistency by role takes this slot.
3. Do not use. Tokens whose value matches but whose purpose does not fit, with the purpose they do have.
4. Ambiguous. Every candidate, and the fact that would settle the row.
5. Gaps. What the value does and why no token covers it, with the closest token when one fits the purpose out of tolerance. Consistency by role follows when it is written.
6. For a person to decide. The ambiguous rows, the gaps and any open conflict, as questions.
7. Source. The list read and how, modes, the color conversion command and its exit code, any precedence rule applied, and every assumption made to fill a vague ask.

Run directly, the chat reply gives the Summary's answer with its numbers, each command with its exit code, up to three questions for a person with defaults, and `Next:` with one prompt to paste.

The report is ready when:

- Every row has a job, a class and a reason, and every semantic row states its difference.
- Every ambiguous row names two or more candidates.
- A semantic token appears wherever one covers the job, never its primitive.
- Anything inferred rather than read, such as a job taken from a class name, is marked inferred.
- Nothing in the repo changed.

## Stops

Stop and report on these only.

- No list exists, or no tool can read one.
- One name has two values in the same mode, which makes the list broken.
- Two sources disagree and no project rule says which wins. Report both sides.

A stopped run returns the condition, the groundwork from step 4, and the shortest message that unblocks it, such as "Paste `tokens.json` or give its path." With no token file in the repo, group the groundwork by the foundation layout in the rules file so it can seed a new set. Gaps are never a stop, at any count. Past the threshold the run returns the full report with `Status: not actionable (gap threshold)`.

## Hard limits

- Name only tokens that exist in the list that was read. A gap never gets a new token name.
- Keep every candidate on an ambiguous row, even when one looks likelier.
- Match on purpose before value, and on value only within the rules file's tolerances. Colors compare by ΔE OK in OKLCH.
- Read the list and the values fresh each run and record the read time. A failed read gets reported, not filled from memory.
- A public system's token names, Geist's included, are never the team's list.
