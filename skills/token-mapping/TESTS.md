# Tests: token mapping

## Setup under test

A result only means something next to the setup that produced it.

- `SKILL.md`, with `references/mapping-rules.md` and `references/sources.md` beside it
- CLAUDE.md or AGENTS.md: say which one was loaded, or none
- Tools connected: none, file access to the repo, or a browser
- Model: the one you actually run

A pasted list and a tool-read list are separate test runs. Record which one you used.

Word each prompt as a colleague would. Leave out "test", "eval" and "rubric", because a model that knows it is graded behaves differently. Grade from the report and the transcript (which files it searched and read, whether it ran a conversion), not from the model's summary of itself.

## Cases in scope
| Tailwind v4 palette | Tailwind v4 apps | Palette utilities read as tokens but carry no purpose |
| Palette-only list | Palette-only lists | With no purposes, consistency by role is the answer |
| Gap threshold | If a coordinator calls it | Too many gaps make the report not actionable, never a stop |
| One candidate out of tolerance | Yes | The closest token must be named without being claimed |
| The answer comes first | Direct runs | People read the first sentence and stop |
| Palette var() | Tailwind v4 apps | A palette variable is not a role token |
| Gaps never stop the run | If a coordinator calls it | A new token set leaves most values without a role |
| Palette-only list, no Exact noise | Palette-only lists | Hundreds of Exact rows bury the answer |
| Units named | Yes | Occurrences and lines differ, and triage counts lines |
| Private folders | Next.js apps | Private folders are not product code |
| Scaffolding stays out of the values | Repos after a build run | The system's own files are not product values |

| Case | Runs here | Reason |
|---|---|---|
| Normal | Yes | Every setup gets this one |
| Vague request | File access only | Most real asks name a screen and nothing else |
| Missing required input | Yes | Without a token list the run must stop and still hand back groundwork |
| Conflicting sources | Yes | Tokens often live in more than one file, such as a JSON source and a hand-edited CSS file, and they drift |
| Tool failure | Tool path only | Skip it when the list is pasted, since no tool can fail |
| Ambiguous judgement | Yes | The skill classifies, and quietly settling an ambiguous row is the failure that matters most |
| Called by a coordinator | If you run build-design-system or migrate-design-system | The caller needs a finished report and a status line, not a question |
| shadcn names | shadcn apps | shadcn's variable pairs are the list, and renaming one breaks every copied component |

## Done means

The readiness list under Output in `SKILL.md`. Left to a person: new tokens for gaps, and answers to ambiguous rows.

## Baseline

First, try the task with the skill switched off. Give the model the values and the token list, and say "Map these values to our tokens." Record what happened before you trust any result below.

| Case | Result without the skill |
|---|---|
| Normal | |

Watch for a token picked because its number matched, an ambiguous row settled without comment, a primitive chosen over a semantic token, a name missing from the list, and a made-up name attached to a gap.

## Normal case

**Input:** a DTCG `tokens.json` with semantic and primitive colors, a spacing scale and light and dark modes. Plus one component file with about 15 hardcoded values, including one `border` shorthand and one color written as `hsl()`.

**Expect:** a seven-part report. The border splits into two rows. The `hsl()` color matches its hex token after normalizing, and the source line names how it was converted. Rows carry `file:line` in file order. The source line names the file, time and mode.

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

**Fails if:** it mixes values from both sources, or settles the conflict without saying so. Matching results across the two runs mean the rule is not what drives the behavior.

## Tool failure

Tool path only.

**Input:** the normal case, with the tokens split into one file per category and the file read returning only `color.json`, or refusing access to the folder.

**Expect:** it says the read was partial or failed, maps only what came back, marks the other rows unverified, and leaves them out of the gap count.

**Fails if:** the report looks complete, or spacing rows map to token names the tool never returned.

## Ambiguous judgement

**Input:** four rows. A 10px gap between two gap tokens at 8px and 12px. A value with no context, so its job cannot be read. A button fill color that equals `color.border.focus`. A text color that matches in light mode and misses in dark.

**Expect:** the first is ambiguous with both candidates named. The second is ambiguous only if the jobs it might do give two or more candidates between them, and otherwise a gap marked job unread. The fill is not a match and `color.border.focus` appears in Do not use. The last is exact in light and reported as a miss in dark.

**Fails if:** any row gets one confident token, the focus token is accepted, or the dark-mode miss is hidden.

## Called by a coordinator

**Input:** a brief from a coordinator skill with a values file and a proposed token list that leaves three values uncovered.

**Expect:** no questions mid-run. The report starts with `Status: complete`, and the three values appear under Gaps and For a person to decide.

**Fails if:** it stops to ask, or the status line is missing.

## shadcn names

**Input:** a shadcn app, and "are we using our tokens on the billing page?" The page uses `text-muted-foreground` on 12 lines, `text-gray-500` on 9 and `#737373` on 2.

**Expect:** the list is the `:root` and `.dark` pairs in the file `components.json` names. The 12 theme utilities are skipped as token uses. The palette class and hex rows map to `muted-foreground` by purpose, in each mode, with the difference stated. No row proposes a new name for a shadcn variable.

**Fails if:** `text-muted-foreground` is counted as a raw value, or the report suggests renaming `muted` to a role-first name.

## Tailwind v4 palette

**Input:** a Tailwind v4 app whose project CSS declares `--color-muted-foreground` and nothing else. Product code uses `text-muted-foreground` on 10 lines, `text-muted-foreground/60` on 3, `text-gray-500` on 20, `bg-blue-600` on 5, and a logo with 4 gradient stops.

**Expect:** the list is the one declared name, not Tailwind's default palette. The 10 lines are skipped as token uses. The 3 alpha uses count as token + alpha with no row. The 25 palette uses get rows, counted as palette apart from raw. Colors compare in OKLCH by ΔE OK. `text-gray-500` lands semantic against `muted-foreground` within ΔE OK 2, or a gap naming it as closest with the ΔE stated, and `bg-blue-600` with no candidate is a gap. The logo stops are graphic, listed once under Source.

**Fails if:** an `oklch()` value with zero candidates is marked ambiguous, `bg-blue-600` is treated as a token use or as raw hex, or the logo stops count toward the gap threshold.

## Palette-only list

**Input:** a list of palette names only (`gray-50` to `gray-900`, `red-500`, `blue-600`), and "are we using colors consistently?"

**Expect:** the first line answers the question in one sentence, such as "No. Muted text uses three grays and error red comes in two shades." The counts line says "Value matching only". A row with no value match is a gap. A Consistency by role section groups the color rows by text, surface, border and status, with counts and ΔE OK spread, and names no token for any cluster.

**Fails if:** the report answers "consistent" with value matches alone, or a cluster gets a proposed token name.

## Gap threshold

**Input:** a list that covers under half the values, called by a coordinator.

**Expect:** the full table, with `Status: not actionable (gap threshold)` and the "is this the right list" question under For a person to decide.

**Fails if:** the status reads `stopped`, or the table is cut short.

## One candidate out of tolerance

**Input:** a declared `--color-text-subtle` at `oklch(0.55 0.02 260)`, and a caption color `#8a8f98` that sits ΔE OK 4 away. No other text token exists.

**Expect:** a gap, not ambiguous. The reason names `color-text-subtle` as closest with the ΔE, and For a person to decide asks whether the value or the token moves.

**Fails if:** the row is ambiguous with one candidate, or the gap proposes a new token name.

## The answer comes first

**Input:** a directly run ask, "are our colors consistent across the dashboard?", on a project that declares role tokens with purposes.

**Expect:** the Summary's first line answers yes, no or mostly, with the reason, before any count. Consistency by role is written because the ask is about consistency, even though the list has purposes. The chat reply gives that answer with its numbers, the conversion command and its exit code, at most 3 questions with defaults, and one `Next:` prompt.

**Fails if:** the first line is a count or "Value matching only", the conversion method has no command, or the reply narrates the run.

## Palette var()

**Input:** a stylesheet with `color: var(--color-gray-500)` on 6 lines, where the project declares the gray scale in `@theme` and no role tokens.

**Expect:** 6 palette rows, counted with palette, not skipped as token uses.

**Fails if:** the rows are skipped, or counted as raw.

## Gaps never stop the run

**Input:** a coordinator brief for a build where the token set is new, so most raw values have no role yet.

**Expect:** `Status: complete` or `Status: not actionable (gap threshold)`, with every gap as a row and under For a person to decide. Stops lists no gap condition.

**Fails if:** the status reads `stopped`, or any gap is treated as a reason to halt.

## Palette-only list, no Exact noise

**Input:** a Tailwind v4 app whose `@theme` holds only `--color-gray-50` to `--color-gray-950`, 250 palette uses, and "are we using colors consistently?"

**Expect:** Consistency by role comes right after the Summary, with distinct values and counts per role. The mapping table lists only non-Exact rows. The summary still gives the Exact count.

**Fails if:** the table has one Exact row per palette use.

## Units named

**Input:** the same app, where triage reports `tw_palette 216` lines.

**Expect:** the counts line says occurrences. If triage is quoted, its number is labeled lines, and the report does not claim the two agree.

**Fails if:** the report says the counts match triage, or gives a count with no unit.

## Private folders

**Input:** a Next.js app with `app/_patterns/page.tsx` using `text-gray-400`, and `app/(shop)/cart/page.tsx` using `text-gray-500`.

**Expect:** `app/_patterns` is left out and listed once under Source. The `(shop)` route group stays in.

**Fails if:** a `_patterns` value appears as a row or in Consistency by role.

## Scaffolding stays out of the values

**Input:** "are we using our tokens?" on a repo after a build run, on a branch whose diff touches `app/settings/page.tsx`, `public/system/index.html`, `docs/system/button.md`, `scripts/check-system.mjs`, `scripts/fixtures/bad-button.tsx.fixture` and `.design-system/run.md`, each holding raw hex values.

**Expect:** rows come from `app/settings/page.tsx` only. Source lists the excluded folders once. The counts match a run with the scaffolding deleted.

**Fails if:** any row cites a file under `public/system/`, `scripts/`, `.design-system/`, `.migration/` or a skill folder, a fixture, or a generated twin.

## Record

| When | Case | Result | Edit made next |
|---|---|---|---|
| | | | |

Change one thing between runs, or you will not know which change helped.
