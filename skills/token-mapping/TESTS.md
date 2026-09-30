# Tests: token mapping

Setup, phrasing, the baseline and changing one thing per run are in `../TESTING.md`. The cases below run on one real screen or file.

## Baseline

Run with the skill off first, with the same values and token list and the prompt "Map these values to our tokens." Cases: Normal, Vague request, Ambiguous judgment, Missing required input. Watch for a token picked by number, an ambiguous row settled silently, a primitive chosen over a semantic token, and a made-up name on a gap.

## Which cases apply

Every case runs on every setup except these:

| Case | Runs when |
|---|---|
| Vague request | The skill has file access |
| Tool failure | The list is read by a tool, not pasted |
| Called by a coordinator, Gap threshold | You run a coordinator skill |
| Library variable names | The app's component library ships surface and foreground variable pairs |
| Framework palette, Palette var() | The app's styling framework ships a default palette |
| Palette-only list | The list has palette names only |
| The answer comes first | Direct runs |
| Private folders | The router ignores some folders |
| Scaffolding stays out of the values | A build run has left its files in the repo |

## Done means

The readiness list under Output in `SKILL.md`.

With the skill off, watch for a token picked by number, an ambiguous row settled silently, a primitive chosen over a semantic token, and a made-up name on a gap.

## Normal case

**Input:** a DTCG `tokens.json` with semantic and primitive colors, a spacing scale and light and dark modes. Plus one component file with about 15 hardcoded values, including one `border` shorthand and one color written as `hsl()`.

**Expect:** a seven-part report. The border splits into two rows. The `hsl()` color matches its hex token after normalizing, and the source line names how it was converted. Rows carry `file:line` in file order. The source line names the file, time and mode. The last line starts `Coverage:` and names dark mode as not mapped when only light was asked.

**Fails if:** any row is classed on its number alone, a primitive appears where a semantic token fits, or any code file changed.

## Vague request

**Input:** repo access and the prompt "are we using our tokens on the settings page?" The repo keeps tokens in `tokens/tokens.json`, generated into `app/tokens.css`. Nothing is pasted.

**Expect:** it finds the settings route's files, finds `tokens.json` as the source and treats the CSS as a second source, records both choices as assumptions in the source line, and delivers the full report.

**Fails if:** it asks for a file path or a token list before searching, or maps against the generated CSS without saying so.

## Missing required input

**Input:** only the component file. No list is pasted, and the repo has no token file of any kind.

**Expect:** it stops, says the list is missing, and returns every value split into rows with location, category and job, grouped as color, typography, materials, space and layout, motion and other. It asks for the list in one line.

**Fails if:** it maps against token names it expects to exist, borrows Geist's token names, names a role for any group, or refuses without the groundwork.

## Conflicting sources

**Input:** `tokens.json` and a hand-edited `theme.css` that give `color.text.subtle` (`--color-text-subtle`) two different values in light mode.

**Is there a precedence rule?** Put one in AGENTS.md, such as "`tokens.json` wins over `theme.css`", then run this case twice, once with it and once without.

**Expect, with the rule:** it maps against `tokens.json`, names the rule in the source line, and lists the `theme.css` value under For a person to decide.

**Expect, without the rule:** it reports both values, does not choose, and marks the affected rows unresolved.

**Fails if:** it mixes values from both sources or settles the conflict silently. Matching results across the two runs mean the rule does not drive the behavior.

## Tool failure

Tool path only.

**Input:** the normal case, with the tokens split into one file per category and the file read returning only `color.json`, or refusing access to the folder.

**Expect:** it says the read was partial or failed, maps only what came back, marks the other rows unverified, and leaves them out of the gap count. The `Coverage:` line names the files that did not come back.

**Fails if:** the report looks complete, or spacing rows map to token names the tool never returned.

## Ambiguous judgement

**Input:** four rows. A 10px gap between two gap tokens at 8px and 12px. A value with no context, so its job cannot be read. A button fill color that equals `color.border.focus`. A text color that matches in light mode and misses in dark.

**Expect:** the first is ambiguous with both candidates named. The second is ambiguous only if the jobs it might do give two or more candidates between them, and otherwise a gap marked job unread. The fill is not a match and `color.border.focus` appears in Do not use. The last is exact in light and reported as a miss in dark.

**Fails if:** any row gets one confident token, the focus token is accepted, or the dark-mode miss is hidden.

## Called by a coordinator

**Input:** a brief from a coordinator skill with a values file and a proposed token list that leaves three values uncovered.

**Expect:** no questions mid-run. The report starts with `Status: complete` and `Commit: none`, and the three values appear under Gaps and For a person to decide.

**Fails if:** it stops to ask, or the status line is missing.

## Library variable names

**Input:** an app whose component library declares `--muted` and `--muted-foreground` in light and dark, and "are we using our tokens on the billing page?" The page uses a `text-muted-foreground` class on 12 lines, `text-gray-500` on 9 and `#737373` on 2.

**Expect:** the list is the library's light and dark pairs, found where the matching `base-*.md` says. The 12 role classes are skipped as token uses. The palette and hex rows map to `muted-foreground` by purpose, in each mode, with the difference stated. No row proposes a new name for a library variable.

**Fails if:** `text-muted-foreground` is counted as a raw value, or the report suggests renaming `muted` to a role-first name.

## Framework palette

**Input:** an app whose styling framework ships a default palette, and whose project CSS declares `--color-muted-foreground` and nothing else. Product code uses `text-muted-foreground` on 10 lines, `text-muted-foreground/60` on 3, `text-gray-500` on 20, `bg-blue-600` on 5, and a logo with 4 gradient stops.

**Expect:** the list is the one declared name, not the framework's default palette. The 10 lines are skipped as token uses. The 3 alpha uses count as token + alpha with no row. The 25 palette uses get rows, counted as palette apart from raw. Colors compare in OKLCH by ΔE OK. `text-gray-500` lands semantic against `muted-foreground` within ΔE OK 2, or a gap naming it as closest with the ΔE stated, and `bg-blue-600` with no candidate is a gap. The logo stops are graphic, listed once under Source.

**Fails if:** an `oklch()` value with zero candidates is marked ambiguous, `bg-blue-600` is treated as a token use or as raw hex, or the logo stops count toward the gap threshold.

## Palette-only list

**Input:** a list of palette names only (`gray-50` to `gray-900`, `red-500`, `blue-600`), and "are we using colors consistently?"

**Expect:** the first line answers the question in one sentence, such as "No. Muted text uses three grays and error red comes in two shades." The counts line says "Value matching only". A row with no value match is a gap. A Consistency by role section groups the color rows by text, surface, border and status, with counts and ΔE OK spread, and names no token for any cluster.

**Fails if:** the report answers "consistent" with value matches alone, or a cluster gets a proposed token name.

**Large palette version:** a declared theme of one hue's scale steps only, with a few hundred palette uses. Consistency by role comes right after the Summary, with distinct values and counts per role. The mapping table lists only non-Exact rows, and the Summary still gives the Exact count. One Exact row per palette use fails.

## Gap threshold

**Input:** a list that covers under half the values, called by a coordinator.

**Expect:** the full table, with `Status: not actionable (gap threshold)` and the "is this the right list" question under For a person to decide.

**Fails if:** the status reads `stopped`, or the table is cut short.

**New token set version:** a coordinator brief for a build where the token set is new, so most raw values have no role yet. The status is `complete` or `not actionable (gap threshold)`, every gap is a row and sits under For a person to decide, and Stops lists no gap condition. Any gap treated as a reason to halt fails.

## One candidate out of tolerance

**Input:** a declared `--color-text-subtle` at `oklch(0.55 0.02 260)`, and a caption color `#8a8f98` that sits ΔE OK 4 away. No other text token exists.

**Expect:** a gap, not ambiguous. The reason names `color-text-subtle` as closest with the ΔE, and For a person to decide asks whether the value or the token moves.

**Fails if:** the row is ambiguous with one candidate, or the gap proposes a new token name.

## The answer comes first

**Input:** a directly run ask, "are our colors consistent across the dashboard?", on a project that declares role tokens with purposes.

**Expect:** the Summary's first line answers yes, no or mostly, with the reason, before any count. Consistency by role is written because the ask is about consistency, even though the list has purposes. The chat reply gives that answer with its numbers, the conversion command and its exit code, at most 3 questions with defaults, and one `Next:` prompt.

**Fails if:** the first line is a count or "Value matching only", the conversion method has no command, or the reply narrates the run.

## Palette var()

**Input:** a stylesheet with `color: var(--color-gray-500)` on 6 lines, where the project declares the gray scale and no role tokens.

**Expect:** 6 palette rows, counted with palette, not skipped as token uses.

**Fails if:** the rows are skipped, or counted as raw.

## Units named

**Input:** the large palette app above, with a triage count of palette use given in lines.

**Expect:** the counts line says occurrences. A quoted triage number is labeled lines, and the report does not claim the two agree.

**Fails if:** the report says the counts match, or gives a count with no unit.

## Private folders

**Input:** an app with a folder its router never serves and a folder that only groups routes, each holding a page with a palette color.

**Expect:** the unserved folder is left out and listed once under Source. The grouping folder's page stays in.

**Fails if:** a value from the unserved folder appears as a row or in Consistency by role.

## Scaffolding stays out of the values

**Input:** "are we using our tokens?" on a repo after a build run, on a branch whose diff touches `app/settings/page.tsx`, `public/system/index.html`, `docs/system/button.md`, `scripts/check-system.mjs`, `scripts/fixtures/bad-button.tsx.fixture` and `.design-system/run.md`, each holding raw hex values.

**Expect:** rows come from `app/settings/page.tsx` only. Source lists the excluded folders once. The counts match a run with the scaffolding deleted.

**Fails if:** any row cites a file under `public/system/`, `scripts/`, `.design-system/`, `.migration/` or a skill folder, a fixture, or a generated twin.
