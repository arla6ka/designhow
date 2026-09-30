# Tests: component documentation

Setup, phrasing, the baseline and changing one thing per run are in `../TESTING.md`. The cases below run on real material from your own system.

## Baseline

Run with the skill off first, with the same material and the prompt "Document this component." Cases: Normal, Vague request, Missing required input, Conflicting sources. Watch for a made-up section order, usage examples that were not supplied, states described by color, token names that appear nowhere in the input, and no mention of where anything came from.

## Which cases apply

Skip a case whose condition does not hold for your install.

| Case | Runs here |
|---|---|
| Normal | Yes |
| Vague request | Yes |
| Missing required input | Yes |
| Conflicting sources | Yes |
| Tool failure | Yes |
| Ambiguous judgement | Yes, narrow |
| Called by a coordinator | If you run build-design-system |
| Text only under a coordinator | If you run build-design-system |
| Spec mode | Repos whose entries are specs |
| One real use | Yes |
| Planned uses in seed | If you run seed or new-app builds |
| Stop tells the coordinator what to do | If you run build-design-system |
| Direct run reply | Yes |
| Template from the repo | Repos with a vendored spec template |
| No variant prop, A part used alone, A Defect line | Yes |
| Scaffolding is not a real use | Repos after a build run |
| An adds-only defect lands as a decision | If you run build-design-system |
| Usage rules by the method | Yes |
| Rule method without the sibling | Installs without build-design-system |
| Example files on a direct run | Yes |
| A rule grounded in the person | Yes |

## Done means

The review checklist in `references/doc-format.md`, plus a passing spec check for a spec. Needs a person: `NEEDS REVIEW` markers, Guessed at, and unsettled conflicts.

With the skill off, watch for a made-up section order, usage examples nobody supplied, states described by color, token names that appear nowhere in the input, and no sources.

## Normal case

**Input:** one component with its code path, stories, token references in its styles, and two real uses with screen names.

**Expect:** all nine headings in order. Every example is copied from a story or call site with its path, and every token exactly. Both real uses sit under Examples. Props matches the code's names and defaults. Sources has one line per source, each time copied from a `date` call at the read or left out. Guessed at is present, even as "Nothing guessed".

**Fails if:** the entry holds a token, prop, variant or example the input never mentioned, a state line gives a color and nothing the user can do, or a heading is added or renamed.

## Vague request

**Input:** repo access and "document the button". No path, uses or stories named. The repo has `Button`, `IconButton` and `legacy/Button`, and `Button` is imported on at least three screens.

**Expect:** it finds `Button` by search without asking for a path, names the other two at the end, and lists the pick under Guessed at. Real uses come from call sites, marked "found by search" with `file:line`.

**Fails if:** it asks for a path or for uses before searching, documents `legacy/Button`, or merges the three into one entry.

## Missing required input

**Input:** the normal case with the real uses removed, no planned uses, and either no repo access or a component with no call site.

**Expect:** it stops, quotes the row that stopped it, returns the facts already sourced, names the coordinator's next step, and asks for one screen name, what put the component there, and which variant showed.

**Fails if:** an entry comes back. Read the real uses it wrote under Examples. That text is what your readers would have copied.

**Second version:** supply the source file, but make its variant type an import from a file that cannot be read. The two rows can fail independently.

**Third version:** supply two "uses" that are rules, such as "use it for confirmations". It should reject them as not meeting the definition.

## Conflicting sources

**Input:** stories for Neutral, Success, Error and Warning. A props type with `tone` values neutral, success, error. A pasted docs page whose token names differ from those in the styles.

**Precedence rule:** run once with a project instructions file that says the styles in code win for tokens, and once without it.

**Expect, rule loaded:** tokens follow the styles, and Conflicts quotes the rule and names its file. The variant difference is still asked about, because a token rule does not cover variants.

**Expect, no rule:** a finished entry with both token sets listed with their sources, not chosen. The variant difference is in Conflicts, and the output ends by asking which list is current.

**Fails if:** it merges the two lists, drops Warning silently, or picks a side without a Conflicts line. Identical results from both runs mean the model ignored the rule.

## Tool failure

**Input A:** file access connected, the path points to a folder it cannot open, and a pasted props type is included.
**Expect:** it names the failed call and the error, continues from the paste, and marks the Sources line "pasted, not checked against the repo".

**Input B:** the same, with no paste.
**Expect:** it stops on the Code row and says the tool could not open the path.

**Input C:** the file read returns the source but not the stylesheet it imports.
**Expect:** Tokens reads `NOT SUPPLIED (tool returned none)`.

**Fails if:** it writes tokens from hex values or a screenshot, or gives a read time no `date` call backs.

## Ambiguous judgement

**Input:** a spec export names a property "Type" with values Info, Positive, Negative. The code prop is `tone` with values neutral, success, error. Nothing links them.

**Expect:** it pairs them, finishes the entry, and lists the pairing under Guessed at.

**Fails if:** it states the pairing as fact, or refuses to write Props because the names differ.

## Called by a coordinator

**Input:** a brief from `build-design-system` with the component's code, its variant list and two call sites from the inventory, and a stories file with one variant the props type lacks.

**Expect:** no questions mid-run. The output opens with `Status: complete with NEEDS REVIEW (1)` and `Commit: none`, and the variant difference sits under Conflicts.

**Fails if:** it stops before finishing, drops the odd variant, or the status line is missing.

## Text only under a coordinator

**Input:** the coordinator case above as a subagent whose brief names no write path, in a repo whose entries are specs.

**Expect:** the entry and its blocks come back as the final message, and no file is written, scratch copy included. The spec check runs on the text through stdin (`check-spec.mjs -`) and its last line is in the status block. With a brief whose SCOPE names `docs/system/<name>.md`, it writes that one file.

**Fails if:** it writes a report or scratch file, or skips the spec check because no file exists.

## Spec mode

**Input:** repo access, a Select whose code shows pending and invalid states but not what happens when both hold, and "write the spec for Select". `build-design-system` is installed beside it.

**Expect:** the entry carries the spec template's additions. The pending and invalid pair sits under State precedence as `NEEDS REVIEW`, with the question in Guessed at. The check fails on that one line and the status block quotes it. Every other failure is fixed from a source.

**Fails if:** a precedence is invented to pass the check, or a state appears that no code, story or capture shows.

## One real use

**Input:** a coordinator brief for Dialog with its code, variant list and one call site (`src/screens/InviteTeammate.tsx:40`). No second use exists.

**Expect:** a full entry. Usage carries `NEEDS REVIEW (one real use)`. The first line is `Status: ready-with-gaps (1 real use)`, and a Gates block holds "Second real use" with its default.

**Fails if:** it stops, invents a second use, or reports `Status: complete`.

**Predecessor version:** add a legacy `Modal` call site that the migration map sends to Dialog. It counts as the second real use, and its Sources line says why.

## Planned uses in seed

**Input:** a seed run. The coordinator passes Button with its code and variants, no call sites, and two planned uses from the brief, "/settings save button" and "/invoices new invoice".

**Expect:** both appear under Examples marked `(planned)` with no code block, each Sources line reads "planned, from the brief", and the status is `ready-with-gaps (0 real uses)`.

**Fails if:** it stops on the uses row, writes call-site code for a planned use, or marks the entry complete.

## Stop tells the coordinator what to do

**Input:** a coordinator brief for Tooltip with code and variants, no call sites and no planned uses.

**Expect:** `Status: stopped: no uses`, then the next step from the Stops table: build the pilot first or pass one planned screen, then rerun.

**Fails if:** the stop has no next step, or an entry comes back with invented uses.

## Direct run reply

**Input:** "document the Badge" in a repo with two call sites and specs, run directly.

**Expect:** the reply opens with what the entry covers and its status, lists each command run with its exit code (the call-site search, `check-spec.mjs`), gives at most three questions with defaults, and ends with one `Next:` prompt.

**Fails if:** it says the spec passes without the command and exit code from this run, or narrates its process.

## Template from the repo

**Input:** a repo with `docs/system/spec-template.md`, two specs in `docs/system/`, and `scripts/check-spec.mjs`. The sibling skill folders are not installed. Ask for a spec of the Select.

**Expect:** the entry follows the repo's template and existing specs, and the status block quotes `node scripts/check-spec.mjs` with its last line.

**Fails if:** it stops or skips the check because `build-design-system` is missing, or reads the skill's template while the repo has one.

**Fallback version:** remove `docs/system/spec-template.md` and `scripts/check-spec.mjs`, with `build-design-system` installed. The run uses the skill's copies and names them in Sources.

## No variant prop

**Input:** "document the Tabs" for a component with no variant prop and no stories, run directly.

**Expect:** Variants reads `None.` with a reason and the run continues. The default example says `simplified from <file:line>` and differs from the call site only by dropped props. The entry lands at `docs/system/tabs.md` with a draft comment on line 1, and every Sources time matches a `date` call in the transcript or is absent.

**Fails if:** the run stops on the variant row, or a Sources time has no `date` call behind it.

## A part used alone

**Input:** a compound component whose child part is also used on its own elsewhere.

**Expect:** one entry, with a `### Parts` subsection giving the part's props, its standalone call sites and how it differs alone.

**Fails if:** the part gets its own entry or its standalone use is missing.

## A Defect line

**Input:** a component whose current behavior is a bug a user would notice, such as an active state lost on a nested route, run directly.

**Expect:** States describes the current behavior, then a `Defect:` line names the owner and the smallest fix, and the reply repeats it. Any question about it defaults to documenting the current behavior with the Defect line kept. The NEEDS REVIEW count in the reply equals `grep -o 'NEEDS REVIEW'` on the file below line 1.

**Fails if:** the default is "document as is" with no Defect line, or the reply's count differs from the grep.

## Scaffolding is not a real use

**Input:** "document the Button" on a repo where Button is imported by the settings and billing screens, the `/system` docs route, `public/system/` examples, and `scripts/fixtures/bad-button.tsx.fixture`.

**Expect:** the two real uses are settings and billing. With no story, the default example comes from one of those two. The docs route, `public/system/` and the fixture appear nowhere under Examples or Sources as uses.

**Fails if:** a docs page, generated file or fixture fills the use count, or decides which call site is most common.

## An adds-only defect lands as a decision

**Input:** under a coordinator on a run branch, document a Tabs whose items never mark the current one, and a Dialog whose close button has no accessible name.

**Expect:** both keep their current behavior in the entry, each with a `Defect:` line ending `(adds semantics only)`. Neither goes in the Gates block. The entry, code and stories stay unedited.

**Fails if:** either defect becomes a gate, the entry claims the fix landed, or the skill edits the component.

## Usage rules by the method

**Input:** "document the Select" in a repo with two call sites (6 and 9 options), a stories file, and a running dev server.

**Expect:** Usage has the six H3s in order: When to use, When not to use, Rules, Content, Anti-slop, Limits. Every When not to use line names another component and says "instead". Every rule line has a `rule/select-<slug>` ID, a condition, a reason, an `Evidence:` ground (call sites, a measurement with its path, a named principle, or a `docs/system/decisions.md` row by number) and a `Check:`, then a nested `Don't:` and `Do:` line of real code against the component's import. The Limits number comes from growing the option count on a real instance, sits below the break, and cites the saved file. Anti-slop comes from one fresh agent's attempt compared with the call sites, or says `Not applicable` with the reason. Guessed at lists any rule that rests on a principle alone.

**Fails if:** a rule says "appropriate", "consistent" or "as needed", a limit has no measurement and no `NEEDS REVIEW (not measured)`, a don't has no instead, a rule lacks its Don't or Do line, a snippet uses a prop the component does not have, a rule states a number no source or measurement gave, or a rule quotes the person instead of citing a decisions row.

## Rule method without the sibling

**Input:** the Usage case in a repo where `build-design-system` is not installed.

**Expect:** the run uses the short method in `references/doc-format.md` (Usage) and names it in Sources. The rules have the same shape, grounds and tests as with the sibling.

**Fails if:** the run stops, skips the rule shape, or writes Usage as plain advice because `rule-method.md` is missing.

## Example files on a direct run

**Input:** "document the Badge" in a repo with a `tone` prop (4 values), no example files and no stories, used inside a table cell on one screen. Run directly, then under a coordinator whose SCOPE names only the entry's path.

**Expect:** directly, the run writes the default, one file per tone with a visual difference, and a composition inside the table cell, each at `<examples dir>/badge/<name>.<ext>` with a `Caption:` line, the product import path and inert data from the props type and the call site. `### Example files` lists each. Under the coordinator it writes no example file, and each row reads `NOT SUPPLIED: brief scope names no examples folder`.

**Fails if:** an example uses a prop or data no source shows, a tone is dropped without a row, or a file lands outside the brief's SCOPE.

## A rule grounded in the person

**Input:** "document the Badge", where `docs/system/decisions.md` row D7 bans uppercase badge text, and the person says in this run "never show a count badge above 99".

**Expect:** the uppercase rule's `Evidence:` cites D7. The count rule's `Evidence:` names the person's call without quoting it, and the Gates block asks for it as a new decisions row with its default. No line in the entry says "now", "no longer" or "used to".

**Fails if:** either rule quotes the person, the count rule ships with no row and no gate, or the entry narrates what changed.
