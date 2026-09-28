---
name: token-mapping
description: Reports how hardcoded style values on a page, file or diff map onto a project's existing design tokens, purpose first, then value. Use for "are we using our tokens here", "which hardcoded colors map to which tokens", "map these values to tokens", a token audit, or planning a token migration. It never edits. Fixing or cleaning up hardcoded values, and whole-app consistency questions, go to design-system-boss. Skip creating or renaming tokens.
---

# Token mapping

A report that lands raw values (hex codes, pixel values, shadows) on a token list someone else owns. It never creates or renames tokens and never edits code. With no settled token set, it hands back groundwork for building one.

The rules, with a full example report, live in `references/mapping-rules.md`. Finding the values and the list, and reading each format, are in `references/sources.md`.

## Start from whatever the ask gives

"Check the tokens on the settings page" is enough. Find the values and the list in the repo yourself, and ask only for what no tool can reach. Defaults when nothing is said:

- Values: what the person named. Otherwise the files the current branch changes, and with no diff, the product code, stated in Source. Either way, leave out the system's own scaffolding and Next.js private folders, listed in `references/sources.md`.
- Mode: the list's default mode, named in the source line.
- rem root: 16px, unless the project sets another.

## When a coordinator calls it

A coordinator, such as a router skill, `build-design-system` or `migrate-design-system`, passes the values and the list in its brief. Take them as given and run to the end without asking anything. Put every question under For a person to decide, where the caller turns it into a gate. Start the report with one status line: `Status: complete`, `Status: not actionable (gap threshold)`, or `Status: stopped: <condition>`. End by returning the report, or the stop shape below, as your final message, since the coordinator reads nothing else.

## Steps

1. **Load the rules.** Read `references/mapping-rules.md` and any AGENTS.md or CLAUDE.md. Done when team overrides and any precedence rule are noted.
2. **Load the list.** Done when the source line has its name, format, location, read method and time. One name with two values in the same mode is a broken list. Stop.
3. **Resolve it.** Follow every alias to its final value in each mode being mapped. If a second source exists, compare the two. Done when every alias resolves and every disagreement is written down.
4. **Collect the groundwork.** One row per property, so a `border` shorthand becomes two rows. Each row has its location (`file:line` for code, URL plus selector for a live build), its category, and its job. Skip values that already reference a declared role token, such as `var(--muted)` or `bg-muted`, and count those with an alpha modifier as token + alpha. Palette utilities such as `bg-blue-600` get rows, marked palette. Leave `graphic` values out and list them once. Done when every raw and palette value in scope has a row.
5. **Normalize** both sides as the rules file says. Convert colors with code when a tool can run it.
6. **Classify.** List the candidate tokens whose stated purpose covers the row's job, preferring a semantic token over its primitive. Compare values in each mode and give one class per row per mode. A value match with the wrong purpose moves its token to Do not use. Done when every row has a class and a reason, and every semantic row states its difference in numbers.
7. **Count and close.** Apply the gap threshold, which sets the status and never stops the run. With no purposes in the list, or an ask about consistency, write Consistency by role. With a palette-only list, it is the main output and Exact rows collapse into its counts per role. Then write the summary, its first line answering the person's question, and the source line.

## Output

Seven parts, in this order. `references/mapping-rules.md` shows each one.

1. Summary. First, one sentence that answers the person's question ("are colors consistent?" gets yes, no or mostly, and why). Then rows, split into raw and palette, counts for exact, semantic, ambiguous, gap and Do not use, and token + alpha and graphic as not mapped. Counts are occurrences (one per property use), never lines, and the counts line says so. A list with no stated purpose adds "Value matching only".
2. Mapping table. Value, location, job, token, class, reason. For code, sort by file and line so the table doubles as a migration list. With a palette-only list, Consistency by role takes this slot and the table lists only non-Exact rows.
3. Do not use. Each token whose value matches but whose purpose does not fit, with the purpose it does have.
4. Ambiguous. Every candidate, and the fact that would settle the row.
5. Gaps. What the value does and why no token covers it, with the closest token when one fits the purpose out of tolerance. Consistency by role follows here when the rules file calls for it.
6. For a person to decide. The ambiguous rows, the gaps and any open conflict, as questions.
7. Source. List name, format, path, read method, date and time, modes, the command that converted colors and its exit code, the precedence rule applied if any, and every assumption made to fill a vague ask.

Run directly, the chat reply around the report gives the Summary's answer with its numbers, each command run with its exit code, at most 3 questions from For a person to decide with their defaults, and `Next:` with one prompt the person can paste.

The report is ready when:

- Every row has a job, a class and a reason. Every semantic row states its difference.
- Every ambiguous row names two or more candidates.
- A semantic token appears wherever one covers the job, never its primitive.
- Anything inferred rather than read, such as a job taken from a class name, is marked inferred.
- Nothing in the repo changed.

## Stops

Stop and report on these. Everything else is decided in the run.

- No list exists, or no tool can read one.
- One name has two values in the same mode.
- Two sources disagree and no project rule says which wins. Report both sides.

A stopped run returns the condition, the groundwork from step 4, and the shortest message that unblocks it, such as "Paste `tokens.json` or give its path." With no token file in the repo at all, group the groundwork by the foundation layout in the rules file, so it can seed a new set. Gaps are never a stop, at any count. They are reported rows, and past the threshold the run returns the full report with `Status: not actionable (gap threshold)`.

## Hard limits

- Name only tokens that exist in the list that was read. A gap never gets a new token name.
- Keep every candidate on an ambiguous row, even when one looks likelier.
- Match on purpose before value, and on value only within the rules file's tolerances. Color compares by ΔE OK in OKLCH.
- Read the list and the values fresh each run, with the read time recorded. A failed read gets reported, not filled from memory.
- A public system's token names, Geist's included, are never the team's list.
