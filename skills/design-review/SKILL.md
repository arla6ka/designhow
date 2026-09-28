---
name: design-review
description: Critiques a screen, flow, prototype, or running build against agreed criteria and ranks findings by severity. Use for "check this screen before I ship", "review this page", "is this flow ready", a critique session, a handoff, or a second read on UI. Skip token and component compliance, which token-mapping and component-docs cover.
---

# Design review

A written critique of rendered UI. Every finding cites a criterion, points at a place, and says how it was established. It does not fix the design, rewrite copy, settle product questions, or check design-system compliance. Send token use to `token-mapping` and component usage to `component-docs`.

The criteria, the severity levels and the edge-case list live in `references/review-criteria.md`. Finding the design, what counts as evidence, and which states are safe to reach are in `references/sources.md`.

## Start from whatever the ask gives

"Check this screen before I ship" is enough. Defaults when nothing is said:

- The design: the screens the current branch changes, opened on the dev server. Ask for screenshots or a URL only when nothing renders.
- The purpose: inferred from the screen and marked assumed at the top of the record, where a reader corrects it first.
- Criteria: `references/review-criteria.md`.
- Viewports: the widths of supplied images, or 375 and 1440 px for a URL.
- First pass, with no constraints given.

## When a coordinator calls it

A coordinator, such as a router skill, `build-design-system` or `migrate-design-system`, passes captures, and often criteria and a purpose. Take them as given and run to the end without asking. With no purpose in the brief, infer it and mark it assumed. Start the report with one status line: `Status: complete (Blocking n, Should fix n, Note n)` or `Status: stopped: <condition>`. The caller reads Blocking as a fail and turns For a person to decide into gates. End by returning the report, or the stop shape below, as your final message, since the coordinator reads nothing else.

## Steps

1. **Find the design** and capture each screen at each viewport. Done when the record lists the source, the viewports and today's date.
2. **Fix the purpose.** Take it as given, or infer it and mark it assumed. Stop if the screen gives no readable purpose, if a stated purpose does not match the screen, if two versions of a screen arrived and nothing says which is current, or if the criteria contradict AGENTS.md or CLAUDE.md and neither says which wins.
3. **Walk the criteria** in order at each viewport. For each observation note what, where, viewport, criterion, why it matters here, and its evidence. Done when every criterion has been checked at every viewport.
4. **Sort.** Merge repeats into one finding with a count and the places. Move observations no criterion supports to Left out, or to For a person to decide if they still seem important. Move accessibility observations to For a person to decide with no severity, unless AGENTS.md or CLAUDE.md gives the reviewer that call. A deliberate departure from the criteria goes there too, since whether it was right is a person's call.
5. **Rank.** Give each finding a severity from the criteria file. Between two levels, take the lower and say why in one line. An inferred finding goes no higher than Should fix. Within a group, the issue in the most places comes first, then follow the flow.
6. **Walk the edge cases.** Mark each shown or not shown. Done when every case on the list has a mark.
7. **Write the summary last**, then check the report against the readiness list below.

## Output

Six parts, in this order.

1. **Review record.** Source (file names, URL, or story IDs), viewports, date, criteria file, first pass or follow-up, the purpose marked given or assumed, and every other assumption, such as which screens a vague ask meant.
2. **Summary.** Three lines at most. What the screen asks the user to do, what works, and what most needs attention.
3. **Findings**, grouped as Blocking, Should fix, and Note. Each finding gives:
   - **What** was seen, in one or two sentences.
   - **Where.** Screen and region, or URL or story plus the element. On a live build, name the element by role and accessible name ("button 'Save changes'"). Add the viewport width.
   - **Criterion**, by number and name.
   - **Why here**, for this user and this task.
   - **Evidence.** Seen in a capture (name it), measured in the browser (the value and how it was read), or inferred.
4. **Edge cases not shown.** One line each.
5. **For a person to decide.** Accessibility observations, product decisions a fix would need, and observations no criterion covers. One line each, tied to its finding or location.
6. **Left out.** Observations dropped as preference, one line each with the reason, so a reader can disagree.

A group with nothing in it says "None". A clean screen is a valid result, and its Notes stay Notes.

The report is ready when:

- Every finding has a criterion, a findable location, a viewport and evidence.
- Each repeated issue appears once, with its count.
- A finding seen at some widths names only those widths.
- Accessibility observations reach a person with no verdict attached.
- The summary agrees with the findings.

A stopped run returns three things only: what stopped it, a one-line guess at what each screen does, and the shortest reply that lets the review continue.

## Hard limits

- Every finding rests on a criterion in the file in use. Taste ("a drawer would feel nicer") goes to Left out.
- Review the rendered design. A description, DOM text or source code supports a finding and never replaces the render.
- Name what is unclear in copy and for whom, and leave the rewrite to the writer.
- An absent state is marked not shown, never reported as an error.
- A person rules on accessibility and on product decisions. Keep the finding and hand over the decision.
