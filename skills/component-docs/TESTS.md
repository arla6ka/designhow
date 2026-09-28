# Tests: component documentation

Run these by hand against real material from your own system. Nothing here runs automatically.

## Setup under test

Record this before every run. The same input has a different correct result depending on what was loaded.

- Skill file: `SKILL.md`
- References loaded: `references/doc-format.md` (default or replaced?) and `references/sources.md`
- Project instructions: CLAUDE.md or AGENTS.md, loaded or not, and whether it has a precedence rule for tokens or variants
- Code: repo available or pasted, and the commit
- Browser and workbench: connected or not, and whether they can open the story or URL
- Model:

Phrase each prompt the way a colleague would. Leave words like "test", "eval" or "rubric" out of it, because a model that knows it is being graded behaves differently. Grade from the entry and from the transcript (which files it opened, which searches it ran), not from what the model says it did.

## Cases in scope

| Case | Runs here | Reason |
|---|---|---|
| Normal | Yes | Checks the entry's shape on clean input |
| Vague request | Yes | Most real asks name a component and nothing else |
| Missing required input | Yes | A missing variant list, code, or real use ends the run early |
| Conflicting sources | Yes | Props types, stories, old docs, a spec and notes can each state variants, tokens and behavior |
| Tool failure | Yes | File access or the browser can be listed but unable to open the path or story, or return part of what was asked |
| Ambiguous judgement | Yes, narrow | Pairing a spec's property with a code prop of a different name is a judgement call |
| Called by a coordinator | If you run build-design-system | The caller needs a finished entry and a status line, not a question |

## Done means

The readiness list under Output in `SKILL.md`. Needs a person: `NEEDS REVIEW` markers, Guessed at, and unsettled conflicts.

## Baseline

Run once with no skill loaded. Give the model the same material as the normal case and this prompt:

```
Document this component.
```

| Case | Result without the skill |
|---|---|
| Normal | |

Watch for a section order it made up, usage examples that sound right and were not supplied, states described by color, token names that look plausible and appear nowhere in the input, and no mention of where anything came from. Until this row is filled in, you do not know whether the skill helps.

## Normal case

**Input:** one component with its code path, stories, token references in its styles, and two real uses with screen names.
**Expect:** all nine headings in order; every example copied from a story or call site with its path; every token copied exactly; both real uses under Examples; Props matches the code's names and defaults; Sources has one line per source with a time; Guessed at is present, even if it says "Nothing guessed".
**Fails if:** the entry contains a token, prop, variant or example the input never mentioned, a state mentions a color, or a heading is added or renamed.

## Vague request

**Input:** repo access and the prompt "document the button". No path, no uses, no stories named. The repo has `Button`, `IconButton` and a `legacy/Button`, and `Button` is imported on at least three screens.
**Expect:** it finds `Button` by search without asking for a path, names the other two at the end, and lists the pick under Guessed at. It finds real uses from call sites and marks them "found by search" with `file:line`. The entry follows the format.
**Fails if:** it asks for a file path or for real uses before searching, documents `legacy/Button`, or merges the three components into one entry.

## Missing required input

**Input:** the normal case with the real uses removed, and either no repo access or a component with only one call site.
**Expect:** it stops, quotes the row that stopped it, returns the facts it already sourced, and asks for one screen name, what put the component there, and which variant showed.
**Fails if:** an entry comes back. Read the real uses it wrote under Examples. That text is what your readers would have copied.

**Second run:** supply the source file, but make its variant type an import from a file that was not supplied and cannot be read. The two rows can fail independently.

**Third run:** supply two "uses" that are rules, such as "use it for confirmations". It should reject them as not meeting the definition.

## Conflicting sources

**Input:** stories for Neutral, Success, Error and Warning. A props type with `tone` values neutral, success, error. A pasted docs page whose token names differ from the ones referenced in the styles.

**Precedence rule:** run once with a project instructions file that says the styles in code win for tokens, and once without it.

**Expect, rule loaded:** tokens follow the styles, and Conflicts quotes the rule and names the file it came from. The variant difference is still asked about, because a token rule does not cover variants.
**Expect, no rule:** a finished entry with both token sets listed with their sources, not chosen. The variant difference listed in Conflicts, and the output ends by asking which list is current.
**Fails if:** it merges the two lists, drops Warning without saying so, or picks a side without writing a Conflicts line. Identical results from both runs mean the model ignored the rule.

## Tool failure

**Input A:** file access connected, the path points to a folder it has no access to, and a pasted props type is included.
**Expect:** it names the failed call and the error, continues from the paste, and marks the Sources line "pasted, not checked against the repo".

**Input B:** the same, with no paste.
**Expect:** it stops on the Code row and says the tool could not open the path.

**Input C:** the file read returns the source but not the stylesheet it imports.
**Expect:** Tokens reads `NOT SUPPLIED (tool returned none)`.

**Fails if:** it writes tokens from hex values or a screenshot, or presents any tool-read data without a read time.

## Ambiguous judgement

**Input:** a spec export names a property "Type" with values Info, Positive, Negative. The code prop is `tone` with values neutral, success, error. Nothing links them.
**Expect:** it pairs them, finishes the entry, and lists the pairing under Guessed at.
**Fails if:** it states the pairing as fact with no Guessed at line, or refuses to write Props because the names differ.

## Called by a coordinator

**Input:** a brief from `build-design-system` with the component's code, its variant list and two call sites from the inventory, and a stories file that has one variant the props type lacks.

**Expect:** no questions mid-run. The output opens with `Status: complete with NEEDS REVIEW (1)`, and the variant difference sits under Conflicts.

**Fails if:** it stops before finishing the entry, drops the odd variant, or the status line is missing.

## Record

| When | Case | Setup | Result | Edit made next |
|---|---|---|---|---|
|  |  |  |  |  |

Change one thing between runs. If you change two, the next run cannot tell you which one mattered.
