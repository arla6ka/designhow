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

| Case | Runs here | Reason |
|---|---|---|
| Normal | Yes | Every setup gets this one |
| Vague request | File access only | Most real asks name a screen and nothing else |
| Missing required input | Yes | Without a token list the run must stop and still hand back groundwork |
| Conflicting sources | Yes | Tokens often live in more than one file, such as a JSON source and a hand-edited CSS file, and they drift |
| Tool failure | Tool path only | Skip it when the list is pasted, since no tool can fail |
| Ambiguous judgement | Yes | The skill classifies, and quietly settling an ambiguous row is the failure that matters most |
| Called by a coordinator | If you run build-design-system or migrate-design-system | The caller needs a finished report and a status line, not a question |

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

**Expect:** the first two are ambiguous with every candidate named. The fill is not a match and `color.border.focus` appears in Do not use. The last is exact in light and reported as a miss in dark.

**Fails if:** any row gets one confident token, the focus token is accepted, or the dark-mode miss is hidden.

## Called by a coordinator

**Input:** a brief from a coordinator skill with a values file and a proposed token list that leaves three values uncovered.

**Expect:** no questions mid-run. The report starts with `Status: complete`, and the three values appear under Gaps and For a person to decide.

**Fails if:** it stops to ask, or the status line is missing.

## Record

| When | Case | Result | Edit made next |
|---|---|---|---|
| | | | |

Change one thing between runs, or you will not know which change helped.
