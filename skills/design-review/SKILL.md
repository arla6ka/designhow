---
name: design-review
description: Critiques a screen, flow, prototype or running build against agreed criteria, accessibility included, and ranks findings by severity. Use for "check this page before I ship", "is this flow ready", "is it accessible", keyboard or screen-reader checks, "it feels off on my phone", "it feels janky", or a second read on UI. A whole-app ship check goes to design-system-boss, token compliance to token-mapping.
---

# Design review

A written critique of rendered UI. It does not fix the design or rewrite copy. Criteria are in `references/review-criteria.md`, and finding the design, evidence and probes in `references/sources.md`.

## Start from whatever the ask gives

"Check this screen before I ship" is enough. Defaults:

- The design: a scope the caller names, else the branch's changed screens, else top routes (`references/sources.md`).
- The purpose: inferred and marked assumed at the top of the record.
- Viewports: the widths of supplied images, else the narrowest and widest the app supports, default 390 and 1280 px (`references/sources.md`).

## When a coordinator calls it

Take the captures, criteria and purpose as given and run to the end, recording any gap the solo path would ask about. With captures only, the scan and probes read `not run: captures only`, which counts as a reason. Start the report with a status line, `Status: complete (Blocking n, Should fix n, Note n)`, `Status: complete (partial: <what was not reviewed>)` or `Status: stopped: <condition>`, then `Commit: none`, then the answer and ship lines. Return the report, or the stop shape, as text and write no file.

## Steps

1. **Find the design.** Capture each screen at each viewport and run the accessibility scan there (`references/sources.md`). Done when the record lists the source, tool, viewports, scan and today's date.
2. **Probe dialogs and forms** per `references/sources.md`, on a local build only. Done when each probe has a measured result or a reason it did not run.
3. **Fix the purpose.** Stop if the purpose is unreadable or contradicts the screen, two versions arrived with nothing marking the current one, or the criteria contradict AGENTS.md or CLAUDE.md with no rule on which wins.
4. **Walk the criteria.** Done when each criterion is checked at each viewport.
5. **Sort.** Merge repeats into one finding with a count. When one finding's recovery lands in another, say so in both and rank them together. Taste goes to Left out. A deliberate departure, or a problem no criterion covers, goes to For a person to decide.
6. **Sort accessibility observations.** Contrast, target size and keyboard problems are ranked. A tree change follows `../build-design-system/references/traps.md` (Adds-only accessibility changes).
7. **Rank** by the criteria file's severities. Order each group by how many places it hits.
8. **Walk the edge cases**, marking each shown or not shown, plus the States rows of each spec for a component on the screen, checked against the screen (`references/sources.md`, Component specs).
9. **Write the verdict and summary last.** Done when the readiness list below holds.

## Output

Any Blocking finding makes the verdict `no`, and an inferred one `no, pending <the one check that settles it>`. Should fix alone makes it `yes, with fixes`, and only Notes `yes`. The first line answers the ask in plain words, with no criterion numbers or skill names, and "Not yet" pairs only with `no`. The ship line follows with the same verdict, why in one clause, and the count of unranked accessibility questions for a person. A partial run's verdict covers only what was reviewed. Example: `Ready to ship: no. Enter in Email cancels the invite (Blocking 1, Should fix 2, 3 accessibility questions for a person).`

Then six parts.

1. **Review record.** Source, tool, viewports, date, criteria file, first pass or follow-up, the purpose marked given or assumed, every assumption, and every gap. Each n/a criterion gives its reason ("8. No destructive action on this screen").
2. **Summary.** What the screen asks, what works, and what most needs attention.
3. **Findings** by severity group. Each gives what was seen, where (screen and region, or the element by role and name with its ref or selector and capture, as in `button 'Save changes' @e34 (settings-1280.png)`), the viewport, the criterion by number and name, why it matters for this task, the evidence type and dedupe key (`references/sources.md`, What counts as evidence), and any matching `trap/` or `rule/` ID.
4. **Edge cases not shown.** One line each.
5. **For a person to decide.** Semantics-changing accessibility fixes, product decisions a fix needs, and problems no criterion covers, each tied to a finding or location.
6. **Left out.** Preferences dropped, each with the reason.

An empty group says "None", and a clean screen's Notes stay Notes.

The report is ready when:

- Every finding has a criterion, a findable location, evidence, and only the viewports where it shows.
- The first line, ship line and summary give one verdict that matches the findings.
- Every probe has a result or a reason, and the scan ran at each viewport or reads `not run: captures only`.
- Every claim that something works or is fixed names its command or capture from this session.
- The last line reads `Coverage:` with the routes, viewports, themes and probes measured, then what was not.

Run directly, save the report to `.design-review/<date>-<flow>.md` with captures beside it. The chat reply opens with the answer and ship lines, gives each command run with its exit code, lists up to three items for a person with defaults, and ends with `Next:` and one prompt to paste. That prompt covers every Blocking and shown-versus-sent finding as "Fix X so that <check>", such as "Fix Enter in Email so that it sends 1 POST". Each Next check must fail on the current build.

A stopped run returns only what stopped it, a one-line guess at what each screen does, and the shortest reply that unblocks it.

## Hard limits

- Every finding rests on a criterion in the file in use, never on taste.
- Review the render. A description, DOM text or source code only supports a finding.
- A person rules on semantics-changing accessibility fixes and product decisions, and the finding stays.
