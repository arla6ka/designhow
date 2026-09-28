---
name: design-review
description: Critiques a screen, flow, prototype, or running build against agreed criteria, accessibility included, and ranks findings by severity. Use for "check this page before I ship", "review this page", "is this flow ready", "is the invite flow accessible", keyboard or screen-reader checks on a flow, a critique session, a handoff, or a second read on UI. A ship check of the whole app goes to design-system-boss. Skip token and component compliance, which token-mapping and the design system's own check (check-system.mjs) cover.
---

# Design review

A written critique of rendered UI. Every finding cites a criterion, points at a place, and says how it was established. It does not fix the design, rewrite copy or check design-system compliance.

Criteria and severities are in `references/review-criteria.md`, and evidence, interaction and probes in `references/sources.md`. `../build-design-system/` paths point at the sibling skill. When it is missing, use the commands in `references/sources.md`, skip the spec check, and say so in the Review record.

## Start from whatever the ask gives

"Check this screen before I ship" is enough. Defaults when nothing is said:

- The design: a scope the caller names wins. Otherwise the screens the branch changes, or with no diff about 5 top routes, picked and stated per `references/sources.md`.
- The purpose: inferred from the screen and marked assumed at the top of the record, where a reader corrects it first.
- Criteria: `references/review-criteria.md`.
- Viewports: the widths of supplied images, or 390 and 1280 px for a URL, the widths the build and migrate skills capture.
- First pass, with no constraints given.

## When a coordinator calls it

A coordinator passes captures, and often criteria and a purpose. Take them as given and run to the end without asking. Where the solo path would ask, record the gap in the Review record and go on. Infer a missing purpose and mark it assumed. Start the report with one status line: `Status: complete (Blocking n, Should fix n, Note n)`, `Status: complete (partial: <what was not reviewed>)` when the source died mid-run, or `Status: stopped: <condition>`. The answer line and the ship line follow it. The caller reads Blocking as a fail and turns For a person to decide into gates. Return the report, or the stop shape below, as text. Write no report file. The caller saves it and names the captures folder.

## Steps

1. **Find the design**, capture each screen at each viewport and run the accessibility scan there, with agent-browser when it is installed and Playwright otherwise (`references/sources.md`). The scan is required on both paths. Done when the record lists the source, the tool, the viewports, the scan and today's date.
2. **Probe dialogs and forms.** When the flow has either, run every probe in `references/sources.md`: focus after close, the Tab loop, Enter in the first field, Cancel with valid input, Cancel then reopen, submit while pending, and failure then retry. Interact only on a local build, with every request intercepted, recorded, and aborted or stubbed. Done when each probe has a measured result or a reason it could not run.
3. **Fix the purpose.** Take it as given, or infer it and mark it assumed. Stop if the screen gives no readable purpose, if a stated purpose does not match the screen, if two versions of a screen arrived and nothing says which is current, or if the criteria contradict AGENTS.md or CLAUDE.md and neither says which wins.
4. **Walk the criteria** in order at each viewport. Note what, where, viewport, criterion, why it matters here, and evidence. Done when every criterion has been checked at every viewport.
5. **Sort.** Merge repeats into one finding with a count. Lost input, or a field that shows one value while the request sends another, is a finding under criterion 8, never a product question. When the recovery path from one finding lands in another, say so in both and rank by the combined effect. Move observations no criterion supports to Left out. A deliberate departure from the criteria goes to For a person to decide.
6. **Sort accessibility observations** by their fix (`../build-design-system/references/traps.md`, Adds-only accessibility changes). A fix that only adds semantics, such as a name or `aria-current`, is a finding with a severity under the criterion its effect breaks, such as 6 for a missing `aria-current`. Any other goes to For a person to decide with no severity, unless AGENTS.md or CLAUDE.md gives the reviewer that call.
7. **Rank.** Give each finding a severity from the criteria file. Between two levels, take the lower and say why in one line, except for shown versus sent, which has its own rule there. An inferred finding stays inferred. If it would be Blocking when true, the verdict becomes `no, pending <the one check that settles it>` until that check runs. Order each group by how many places it hits.
8. **Walk the edge cases.** Mark each shown or not shown. Add the States rows of any spec for a component on the screen (`docs/system/<component>.md`), and run `node scripts/check-spec.mjs` on those specs (the sibling's copy when the repo has none). A failing spec is one line for a person. With no specs, skip the check and say so. Done when every case on the list has a mark.
9. **Write the verdict and the summary last**, then check the report against the readiness list below.

## Output

Decide the verdict once, then write it twice from that one value. Any Blocking finding makes it `no`. An inferred finding that would be Blocking makes it `no, pending <check>`. Should fix alone makes it `yes, with fixes`. Only Notes makes it `yes`. The first line answers the ask in plain words with that verdict, no criterion numbers or skill names. "Not yet" pairs only with `no`. The ship line follows with the same verdict, why in one clause, and the count of accessibility questions for a person, which carry no severity. A partial run's verdict covers only what was reviewed. For example: `Ready to ship: no. Enter in Email cancels the invite (Blocking 1, Should fix 2, 3 accessibility questions for a person).`

Then six parts, in this order.

1. **Review record.** Source, viewports, date, criteria file, first pass or follow-up, the purpose marked given or assumed, and every other assumption, such as which screens a vague ask meant. List each criterion marked n/a with its reason ("8. No destructive action on this screen"), so n/a never reads as clean. Name any gap: a capture missing, a source that died, a spec check skipped.
2. **Summary.** Three lines at most. What the screen asks the user to do, what works, and what most needs attention.
3. **Findings**, grouped as Blocking, Should fix, and Note. Each finding gives:
   - **What** was seen, in one or two sentences.
   - **Where.** Screen and region, or URL or story plus the element. On a live build, name the element by role and accessible name with its ref and capture, such as `button 'Save changes' @e34 (phones-1280.png)`. Add the viewport width.
   - **Criterion**, by number and name.
   - **Why here**, for this user and this task.
   - **Evidence.** Seen in a capture (name it), measured in the browser (the value and the command, or the requests that fired), or inferred. Cite any matching `trap/` or `rule/` ID.
4. **Edge cases not shown.** One line each.
5. **For a person to decide.** Accessibility changes that remove, rename or restructure semantics, product decisions a fix would need, and observations no criterion covers. One line each, tied to its finding or location.
6. **Left out.** Observations dropped as preference, one line each with the reason, so a reader can disagree.

A group with nothing in it says "None". A clean screen is a valid result, and its Notes stay Notes.

The report is ready when:

- Every finding has a criterion, a findable location, a viewport and evidence.
- A finding seen at some widths names only those widths.
- The first line, the ship line and the summary give one verdict, and it matches the findings.
- Every dialog and form probe has a result or a reason, and the accessibility scan ran at each viewport.
- Every claim that something works, passes or is fixed names the command or capture that proved it in this session.

Run directly, save the report to `.design-review/<date>-<flow>.md` and captures beside it. The chat reply opens with the answer line and the ship line, gives each command run with its exit code, at most 3 items for a person with their defaults, and ends with `Next:` and one prompt the person can paste. It covers every Blocking and every shown-versus-sent finding, each as "Fix X so that <check that fails today>", such as "Fix Enter in Email so that it sends 1 POST and keeps the dialog open until it succeeds". A check that passes today verifies nothing.

A stopped run returns three things only: what stopped it, a one-line guess at what each screen does, and the shortest reply that lets the review continue.

## Hard limits

- Every finding rests on a criterion in the file in use. Taste ("a drawer would feel nicer") goes to Left out.
- Review the rendered design. A description, DOM text or source code supports a finding and never replaces the render.
- A person rules on accessibility changes that remove, rename or restructure semantics, and on product decisions. Keep the finding and hand over the decision. Lost or mismatched input is not a product decision.
