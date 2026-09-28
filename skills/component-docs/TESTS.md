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
| Stop tells the coordinator what to do | If you run build-design-system | A stop the caller cannot act on stalls the batch |
| Direct run reply | Yes | A person reads the reply, not the saved entry |
| Template from the repo | Repos with a vendored spec template | The repo's template wins over the skill's copy |
| Direct run on a Next.js Tabs | Next.js apps | Client components, parts and routes all bend the format |
| Scaffolding is not a real use | Repos after a build run | Docs pages and fixtures import the component without being screens |
| An adds-only defect lands as a decision | If you run build-design-system | A missing name or `aria-current` must not wait on a person |

| Case | Runs here | Reason |
|---|---|---|
| Normal | Yes | Checks the entry's shape on clean input |
| Vague request | Yes | Most real asks name a component and nothing else |
| Missing required input | Yes | A missing variant list, code, or real use ends the run early |
| Conflicting sources | Yes | Props types, stories, old docs, a spec and notes can each state variants, tokens and behavior |
| Tool failure | Yes | File access or the browser can be listed but unable to open the path or story, or return part of what was asked |
| Ambiguous judgement | Yes, narrow | Pairing a spec's property with a code prop of a different name is a judgement call |
| Called by a coordinator | If you run build-design-system | The caller needs a finished entry and a status line, not a question |
| Text only under a coordinator | If you run build-design-system | Hosts refuse files a subagent writes, so a saved entry or report can be lost |
| Spec mode | Repos whose entries are specs | The check must pass without invented states |
| One real use | Yes | Small apps have many components with one screen each |
| Planned uses in seed | If you run seed or greenfield builds | New components have no call sites until the pilot exists |

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
**Expect:** all nine headings in order; every example copied from a story or call site with its path; every token copied exactly; both real uses under Examples; Props matches the code's names and defaults; Sources has one line per source, each time copied from a `date` call at the read or left out; Guessed at is present, even if it says "Nothing guessed".
**Fails if:** the entry contains a token, prop, variant or example the input never mentioned, a state mentions a color, or a heading is added or renamed.

## Vague request

**Input:** repo access and the prompt "document the button". No path, no uses, no stories named. The repo has `Button`, `IconButton` and a `legacy/Button`, and `Button` is imported on at least three screens.
**Expect:** it finds `Button` by search without asking for a path, names the other two at the end, and lists the pick under Guessed at. It finds real uses from call sites and marks them "found by search" with `file:line`. The entry follows the format.
**Fails if:** it asks for a file path or for real uses before searching, documents `legacy/Button`, or merges the three components into one entry.

## Missing required input

**Input:** the normal case with the real uses removed, no planned uses, and either no repo access or a component with no call site.
**Expect:** it stops, quotes the row that stopped it, returns the facts it already sourced, names the coordinator's next step from the Stops table, and asks for one screen name, what put the component there, and which variant showed.
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

**Fails if:** it writes tokens from hex values or a screenshot, or gives a read time that no `date` call at the read backs.

## Ambiguous judgement

**Input:** a spec export names a property "Type" with values Info, Positive, Negative. The code prop is `tone` with values neutral, success, error. Nothing links them.
**Expect:** it pairs them, finishes the entry, and lists the pairing under Guessed at.
**Fails if:** it states the pairing as fact with no Guessed at line, or refuses to write Props because the names differ.

## Called by a coordinator

**Input:** a brief from `build-design-system` with the component's code, its variant list and two call sites from the inventory, and a stories file that has one variant the props type lacks.

**Expect:** no questions mid-run. The output opens with `Status: complete with NEEDS REVIEW (1)`, and the variant difference sits under Conflicts.

**Fails if:** it stops before finishing the entry, drops the odd variant, or the status line is missing.

## Text only under a coordinator

**Input:** the coordinator case above as a subagent whose brief names no write path, in a repo whose entries are specs.

**Expect:** the entry and its blocks come back as the final message, and no file is written, scratch copy included. The spec check runs on the text through stdin (`check-spec.mjs -`) and its last line is in the status block. With a brief whose SCOPE names `docs/system/<name>.md`, it writes that one file.

**Fails if:** it writes a report or scratch file, or skips the spec check because no file exists.

## Spec mode

**Input:** repo access, a Select whose code shows loading and invalid states but nothing about what happens when both hold, and "write the spec for Select." `build-design-system` is installed beside it.

**Expect:** the entry carries the spec template's additions. The loading and invalid pair appears under State precedence as `NEEDS REVIEW` with the question in Guessed at, the check fails on that one line and the status block quotes it, and every other failure is fixed from a source.

**Fails if:** a precedence is invented to pass the check, or a state appears that no code, story or capture shows.

## One real use

**Input:** a coordinator brief for Dialog with its code, variant list and one call site (`app/team/invite/page.tsx:40`). No second use exists.
**Expect:** a full entry. Usage carries `NEEDS REVIEW (one real use)`. The first line is `Status: ready-with-gaps (1 real use)`, and a Gates block holds "Second real use" with its default.
**Fails if:** it stops, invents a second use, or reports `Status: complete`.

**Predecessor version:** add a legacy `Modal` call site that the migration map sends to Dialog. It counts as the second real use, and its Sources line says why.

## Planned uses in seed

**Input:** a seed run. The coordinator passes Button with its code and variants, no call sites, and two planned uses from the brief: "/settings save button" and "/invoices new invoice".
**Expect:** both appear under Examples marked `(planned)` with no code block, each Sources line reads "planned, from the brief", and the status is `ready-with-gaps (0 real uses)`.
**Fails if:** it stops on the uses row, writes call-site code for a planned use, or marks the entry complete.

## Stop tells the coordinator what to do

**Input:** a coordinator brief for Tooltip with code and variants, no call sites and no planned uses.
**Expect:** `Status: stopped: no uses`, followed by the next step from the Stops table: build the pilot first or pass one planned screen, then rerun.
**Fails if:** the stop has no next step, or the entry comes back with invented uses.

## Direct run reply

**Input:** "document the Badge" in a repo with two call sites and specs, run directly.
**Expect:** the reply opens with what the entry covers and its status, lists each command run with its exit code (the call-site search, `check-spec.mjs`), at most 3 questions with defaults, and one `Next:` prompt.
**Fails if:** it says the spec passes without the command and exit code from this run, or narrates its process.

## Template from the repo

**Input:** a repo with `docs/system/spec-template.md`, two specs in `docs/system/`, and `scripts/check-spec.mjs`. The skill folders are not installed beside this one. Ask for a spec of the Select.

**Expect:** the entry follows the repo's template and existing specs, and the status block quotes `node scripts/check-spec.mjs` with its last line.

**Fails if:** it stops or skips the spec check because `build-design-system` is missing, or reads the skill's template while the repo has one.

**Fallback version:** remove `docs/system/spec-template.md` and `scripts/check-spec.mjs`, with `build-design-system` installed. The run uses the skill's copies and names them in Sources.

## Direct run on a Next.js Tabs

**Input:** "document our Tabs component" in a Next.js App Router repo with no stories. `ui/tabs.tsx` starts with `'use client'`, exports `Tabs` and `Tab`, has no variant prop, uses Tailwind palette utilities, and marks a tab active only on an exact path match. `Tab` is also used alone as a back link. Run directly.
**Expect:**
- The entry lands in `docs/system/tabs.md` with a draft comment on line 1.
- Every Sources time matches a `date` call in the transcript, or there is no time.
- Variants reads `None.` with a reason, and the run does not stop.
- The import line says `'use client'`.
- The default example says `simplified from <file:line>` and differs from the call site only by dropped props.
- `Tab` gets a `### Parts` subsection with its standalone call sites.
- Tokens lists the palette utilities under `Palette:`, with their theme variables under Guessed at.
- Active and pending together is settled from the built CSS or the browser, with how to reach it, and is not `NEEDS REVIEW`.
- The parent tab going idle on child routes has a `Defect:` line with an owner, and the reply repeats it.
- The NEEDS REVIEW count in the reply equals `grep -o 'NEEDS REVIEW'` on the file below line 1.
**Fails if:** any Sources time is later than the file's write time or has no `date` call behind it, the run stops on the variant row, a question about the exact-match behavior defaults to "document as is" with no Defect line, or the reply's count differs from the grep.

**Semantic version:** the same component styled with `bg-muted` and `text-muted-foreground`. Tokens lists them as token use under their own names, with no Palette group and no `NEEDS REVIEW`.

## Scaffolding is not a real use

**Input:** "document the Button" on a repo where Button is imported by `app/settings/page.tsx`, `app/billing/page.tsx`, the `/system` docs route, `public/system/` examples, and `scripts/fixtures/bad-button.tsx.fixture`.

**Expect:** the two real uses are settings and billing. The default example, when no story exists, comes from one of those two. The `/system` page, `public/system/` and the fixture appear nowhere under Examples or Sources as uses.

**Fails if:** a docs page, generated file or fixture fills the use count, or decides which call site is most common.

## An adds-only defect lands as a decision

**Input:** under a coordinator on a run branch, document a Tabs whose items never set `aria-current`, and a Dialog whose close button has no accessible name.

**Expect:** both keep their current behavior in the entry, each with a `Defect:` line that ends `(adds semantics only)`. Neither becomes a Gates block entry. The entry, code and stories stay unedited.

**Fails if:** either defect becomes a gate, the entry claims the fix already landed, or the skill edits the component.

## Record

| When | Case | Setup | Result | Edit made next |
|---|---|---|---|---|
| 2026-09-28 | Text only under a coordinator | `check-spec.mjs -` on the v4-r3-weak Notice spec piped from stdin | exit 1 with `spec/call-sites`: the spec says 1 call site, HEAD holds 3 | Step 10 pipes the entry to the check instead of a scratch file. The skill itself not yet rerun |

Change one thing between runs. If you change two, the next run cannot tell you which one mattered.
