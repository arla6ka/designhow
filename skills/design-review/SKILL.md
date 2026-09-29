---
name: design-review
description: Critiques a screen, flow, prototype, or running build against agreed criteria, accessibility included, and ranks findings by severity. Use for "check this page before I ship", "review this page", "is this flow ready", "is the invite flow accessible", keyboard or screen-reader checks, a critique, a handoff, or a second read on UI. A ship check of the whole app goes to design-system-boss. Token and component compliance go to token-mapping and check-system.mjs.
---

# Design review

A written critique of rendered UI. Each finding cites a criterion, points at a place, and says how it was established. It does not fix the design or rewrite copy.

The default criteria and severities are in `references/review-criteria.md`, and finding the design, evidence and probes in `references/sources.md`. Browser commands are in `../build-design-system/references/browser.md`. Without that sibling, use any browser tool that can capture, read the accessibility tree and intercept requests, skip the spec check, and say so in the Review record.

## Start from whatever the ask gives

"Check this screen before I ship" is enough. Defaults:

- The design: a scope the caller names wins. Otherwise the screens the branch changes, or with no diff a few top routes, picked and stated per `references/sources.md`.
- The purpose: inferred and marked assumed at the top of the record, where a reader corrects it.
- Viewports: the widths of supplied images. For a URL, the narrowest and widest widths the app supports, default 390 and 1280 px, the widths build and migrate capture.

## When a coordinator calls it

Take the captures, criteria and purpose as given and run to the end. Record in the Review record any gap the solo path would ask about. Start the report with one status line: `Status: complete (Blocking n, Should fix n, Note n)`, `Status: complete (partial: <what was not reviewed>)` when the source died mid-run, or `Status: stopped: <condition>`. The answer line and ship line follow. The caller reads Blocking as a fail and turns For a person to decide into gates. Return the report, or the stop shape below, as text and write no report file. The caller saves it and names the captures folder.

## Steps

1. **Find the design.** Capture each screen at each viewport and run an automated accessibility scan there (`references/sources.md`). Done when the record lists the source, tool, viewports, scan and today's date.
2. **Probe dialogs and forms.** Run every probe in `references/sources.md`, interacting only on a local build with every request intercepted, recorded, and aborted or stubbed. Done when each probe has a measured result or a reason it did not run.
3. **Fix the purpose.** Stop if the screen gives no readable purpose, if a stated purpose does not match the screen, if two versions of a screen arrived and nothing says which is current, or if the criteria contradict AGENTS.md or CLAUDE.md and neither says which wins.
4. **Walk the criteria** at each viewport, noting what, where, criterion, why it matters here, and evidence. Done when each criterion is checked at each viewport.
5. **Sort.** Merge repeats into one finding with a count. Lost input, or a field that shows one value while the request sends another, is a criterion 8 finding, never a product question. When one finding's recovery path lands in another, say so in both and rank by the combined effect. Taste goes to Left out. A deliberate departure, or a real problem no criterion covers, goes to For a person to decide.
6. **Sort accessibility observations** by their fix (`../build-design-system/references/traps.md`, Adds-only accessibility changes). A fix that only adds semantics, such as a name or `aria-current`, is a ranked finding under the criterion its effect breaks. Any other goes to For a person to decide unranked, unless AGENTS.md or CLAUDE.md gives the reviewer that call.
7. **Rank** by the criteria file's severities, including its rule for a finding between two levels. An inferred finding that would be Blocking sets the verdict to `no, pending <the one check that settles it>` until that check runs. Order each group by how many places it hits.
8. **Walk the edge cases**, marking each shown or not shown. Add the States rows of any spec for a component on the screen (`docs/system/<component>.md`) and run `node scripts/check-spec.mjs` on those specs (the sibling's copy when the repo has none). A failing spec is one line for a person. With no specs, skip the check and say so.
9. **Write the verdict and summary last**, then check the readiness list below.

## Output

Decide the verdict once and write it twice from that value. Any Blocking finding makes it `no`, and an inferred one `no, pending <check>`. Should fix alone makes it `yes, with fixes`. Only Notes makes it `yes`.

The first line answers the ask in plain words, with no criterion numbers or skill names. "Not yet" pairs only with `no`. The ship line follows with the same verdict, why in one clause, and the count of unranked accessibility questions for a person. A partial run's verdict covers only what was reviewed. Example: `Ready to ship: no. Enter in Email cancels the invite (Blocking 1, Should fix 2, 3 accessibility questions for a person).`

Then six parts, in order.

1. **Review record.** Source, tool, viewports, date, criteria file, first pass or follow-up, the purpose marked given or assumed, and every other assumption. Each n/a criterion gives its reason ("8. No destructive action on this screen"), so n/a never reads as clean. Name every gap, such as a missing capture, a dead source or a skipped spec check.
2. **Summary.** A few lines on what the screen asks, what works, and what most needs attention.
3. **Findings** by severity group. Each gives what was seen; where, as screen and region or the element by role and name with its ref and capture (`button 'Save changes' @e34 (settings-1280.png)`), plus the viewport; the criterion by number and name; why it matters for this user and task; and the evidence. Evidence is seen (a named capture), measured (the value and command, or the requests that fired), or inferred. Cite any matching `trap/` or `rule/` ID.
4. **Edge cases not shown.** One line each.
5. **For a person to decide.** Semantics-changing accessibility fixes, product decisions a fix needs, and problems no criterion covers. One line each, tied to a finding or location.
6. **Left out.** Preferences dropped, each with the reason, so a reader can disagree.

An empty group says "None". A clean screen is a valid result, and its Notes stay Notes.

The report is ready when:

- Every finding has a criterion, findable location, viewport and evidence.
- A finding seen at some widths names only those widths.
- The first line, ship line and summary give one verdict that matches the findings.
- Every probe has a result or a reason, and the scan ran at each viewport.
- Every claim that something works or is fixed names the command or capture that proved it in this session.

Run directly, save the report to `.design-review/<date>-<flow>.md` with captures beside it. The chat reply opens with the answer and ship lines, gives each command run with its exit code, lists up to three items for a person with defaults, and ends with `Next:` and one prompt to paste. That prompt covers every Blocking and every shown-versus-sent finding, each as "Fix X so that <check that fails today>", such as "Fix Enter in Email so that it sends 1 POST and keeps the dialog open until it succeeds". A check that passes today verifies nothing.

A stopped run returns only what stopped it, a one-line guess at what each screen does, and the shortest reply that unblocks it.

## Hard limits

- Every finding rests on a criterion in the file in use. Taste ("a drawer would feel nicer") never becomes a finding.
- Review the rendered design. A description, DOM text or source code supports a finding and never replaces the render.
- A person rules on semantics-changing accessibility fixes and on product decisions. Keep the finding and hand over the decision.
