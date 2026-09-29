# Tests: design review

Run these by hand against one or two screens from your own product. For each case, run the same task on the same screens with the same prompt, once with the skill off and once with it on, and compare the reports.

## Setup under test

Two runs compare only when their setups match, so fill this in every time.

- Skill and references in use: `SKILL.md`, `references/sources.md`, and the default criteria file or your own
- Project instructions: loaded or not, and which file (CLAUDE.md / AGENTS.md)
- Tools connected: browser tool, component workbench, or none
- Model name and version

Several cases use an invite dialog built with known defects. Its Cancel and Send invite buttons are both `type="submit"`, Cancel comes first, the role select remounts on error, and the form POSTs to `/api/invite`.

Write each prompt the way a colleague would, such as "check this screen before I ship." Keep "test", "eval" and "rubric" out of it, since a model that knows it is being checked behaves differently. Judge from the report and the transcript (what it opened, what it captured), not the model's account of its work.

## Which cases apply

Every case runs on every setup except these:

| Case | Runs when |
|---|---|
| Called by a coordinator, Report as text under a coordinator | You run build-design-system or migrate-design-system |
| Browser evidence | A browser tool is installed |
| Component specs | The repo has specs |
| Fixed means measured again | A follow-up pass |
| Interaction on a local build | A live build |
| Dialog and form probes, Lost or mismatched input | The flow has a dialog or form |

## Done means

The readiness list under Output in `SKILL.md`.

## Baseline

Run with the skill off first, with the same screens and the prompt "Review this design."

| Case | Without the skill | With the skill |
|---|---|---|
| Normal | | |
| Vague request | | |
| Ambiguous judgment | | |
| Dialog and form probes | | |

Look for criteria made up on the spot, opinions written as problems, one issue listed per screen, a confident accessibility ruling, and findings with no location. The skill's value is unknown until the first column is filled.

## Normal case

**Input:** three screenshots of one flow at 1280 px, a one-line purpose, and the default criteria. Plant the same unclear button label on two screens.

**Expect:** a review record naming the images, 1280 px, today's date, the default criteria file, and the purpose marked given. Findings grouped by severity, each with a criterion, a screen plus region, and evidence naming the capture. The label issue appears once with a count of 2. Every edge case is marked, and the summary matches the findings.

**Fails if:** a finding lacks a criterion or location, the label issue appears twice, or the report claims anything about mobile widths.

## Vague request

**Input:** repo access, a browser tool, a feature branch that changes one settings route, and the prompt "check this screen before I ship". No purpose, no criteria, no URL.

**Expect:** it finds the changed route from the diff, opens it on the dev server at the default widths, writes an assumed purpose at the top of the record, uses the default criteria, and finishes the review.

**Fails if:** it asks for a file path, a URL or a purpose before looking, reviews routes the branch did not touch, or states the purpose without marking it assumed.

**Second version:** the same screens as the normal case with no purpose. It should infer one, mark it assumed and review.

## Missing required input

**Input:** a screenshot of a half-built screen with no title, no heading and no primary action, and no purpose.

**Expect:** it stops, gives a one-line guess at what the screen does, and asks for the real purpose.

**Fails if:** it reviews anyway on a purpose it assumed.

**Second version:** supply the purpose, then swap the images for a written account of them. It should ask for images or a link.

## Conflicting sources

**Input:** an old and a new draft of one screen with different primary buttons, and nothing marking the current one.

**Expect, with no rule:** it names what differs between the versions and asks which is current.

**Expect, with a precedence rule in project instructions:** it reviews the version the rule picks, and the record names it.

**Fails if:** it reviews the first one it saw, or merges both into one set of findings without saying so.

## Tool failure

**Input:** the purpose plus a prototype URL behind a sign-in, with a browser tool connected. Run it a second time with no tool connected.

**Expect:** it says it could not open the rendered page, names the reason, and asks for screenshots.

**Fails if:** it reviews from the URL text, page source, or a guess about the page, or it tries to sign in.

**Passing version:** a public URL with a browser tool. The record lists the URL, the viewports captured and the date, and each finding points to a screenshot.

## Ambiguous judgment

**Input:** a screen with three things in it. A color choice someone would argue about. A layout pattern no criterion covers. Gray body text that may be too light to read.

**Expect:** the color choice is dropped and lands in Left out. The layout pattern goes under "For a person to decide." The gray text is reported there as an observation with no severity and no pass or fail.

**Fails if:** the color choice gets a severity or is dropped silently, a criterion is invented for the layout, or the report rules on contrast.

**Empty version:** a clean screen that meets every criterion. The report says "None" under Blocking and Should fix, and no Note is promoted to fill them.

**Viewport version:** the same screen at 390 and 1280 px, with a problem only at 390. The finding names 390 px only.

## Called by a coordinator

**Input:** after-captures of one route at 390 and 1280 px from a coordinator brief, with the system's criteria file and no purpose.

**Expect:** no questions. It infers the purpose and marks it assumed, and the report opens with `Status: complete (Blocking n, Should fix n, Note n)` whose counts match the findings.

**Fails if:** it stops to ask for a purpose, or the counts in the status line disagree with the findings.

**Source dies version:** a brief for two routes, with the dev server stopped after the first route's captures. The first route is reviewed in full, the second is marked not reviewed by route and viewport, and the status reads `Status: complete (partial: <what was not reviewed>)`. Returning `stopped`, reviewing the second route from memory or source, or asking for screenshots fails.

## Report as text under a coordinator

**Input:** the coordinator case above, run as a subagent on a host that refuses files a subagent writes outside its scope, with a captures folder named in the brief.

**Expect:** the whole report comes back as the final message. No file lands under `.design-review/` or anywhere else except captures in the named folder. The coordinator saves the text to `.design-system/review/<surface>-review.md`. A direct run on the same screen still saves `.design-review/<date>-<flow>.md`.

**Fails if:** it writes a report file under a coordinator, or a direct run leaves no saved report.

## Scope with no diff

**Input:** repo access on main with no branch diff, 57 routes, and "check the app before I ship."

**Expect:** about 5 routes, the home route then the main nav's links in nav order. The record says "Default scope: 5 top routes, no branch diff" and lists them. Each default route answered 200 before capture.

**Fails if:** it reviews every route, picks routes without saying so, or stops to ask which screens.

**Router conventions version:** a repo whose router ignores a private folder and drops a grouping folder from the URL, with a nav linking a page inside the group. For example, with a router that ignores `_`-prefixed folders and drops parenthesized folders from the URL: `app/page.tsx`, `app/_patterns/page.tsx`, `app/(shop)/cart/page.tsx`, `app/(shop)/_components/Row.tsx`, and a nav linking `/cart`. The scope includes `/` and `/cart`. A finding that names the private folder, or a route list that includes the grouping folder, fails.

**Named scope version:** a coordinator names the layouts flow while the branch has a diff elsewhere. It reviews the layouts flow only.

## Browser evidence

**Input:** repo access, a browser tool, a settings route whose icon-only delete button is 20 by 20 px, and "review the settings page".

**Expect:** the record names the tool, the widths and the accessibility scan. The target-size finding cites the button by role and name with its `@eN` ref, and gives the measured box. Captures use absolute paths under `.design-review/<date>-<flow>/`, the session is named after the flow, and a file listing follows each capture.

**Fails if:** the size is estimated from a screenshot, an automated scan result is ranked as Blocking on its own, a capture path starts with `.`, or a session is named plain `review`.

**Fallback tool version:** remove the preferred tool so the next one in `browser.md` (Pick the tool) runs. The scan still runs at every width. A record with no scan, or "low contrast" without a measured value, fails. With no browser tool at all, it asks for screenshots.

## Component specs

**Input:** the same route, where `docs/system/select.md` lists a "Load failed" state the screen can reach, and a second spec with a blank Trigger cell.

**Expect:** "Load failed" appears in the edge-case list as shown or not shown. The spec check runs on both specs, and the failing one is one line under For a person to decide.

**Fails if:** the review edits the spec, or reports the incomplete spec as a design finding.

## Review record names every gap

**Input:** a dev build showing a framework issue badge, a screen with no destructive action, no specs in the repo, `build-design-system` not installed beside this skill, and two captures per viewport.

**Expect:** the badge count appears once under For a person to decide, and dev tools stay closed. The record lists criterion 8 as n/a with its reason, says the spec check was skipped because no specs exist, and says the sibling skill was missing. Every `@eN` ref names its capture, such as `@e34 (home-1280.png)`.

**Fails if:** a criterion is silently skipped, the overlay is opened or reported as a design finding, or a bare `@eN` appears.

## Ship line

**Input:** three runs on the same route. First with one Blocking finding (the submit button does nothing at 390). Then with that fixed and two Should fix left. Then with only Notes.

**Expect:** the ship line, right after the plain answer line (and the status line under a coordinator), reads `Ready to ship: no`, then `yes, with fixes`, then `yes`, each with a one-clause reason and the count of accessibility questions for a person. With a Blocking finding the first line starts with "No" or "Not yet". With Should fix only, it never says "Not yet".

**Fails if:** the verdict comes after the Review record, disagrees with the severities or with the first line, or an accessibility question sets it.

**Partial version:** stop the dev server after the first of two routes. The ship line says it covers only the first route.

## Direct run reply

**Input:** "check the settings page before I ship it, and tell me if we're using colors consistently", run directly on a branch with a diff.

**Expect:** the first line is one plain sentence that answers both halves, such as "Nearly. One tab bug blocks shipping, and cards use two grays for the same text," with no criterion numbers, severities or skill names. The ship line comes second. The reply lists the accessibility scan and any spec check with their exit codes, gives at most 3 items for a person with defaults, and ends with one `Next:` prompt. The report is saved at `.design-review/<date>-<flow>.md` with captures beside it, and nothing lands in the repo root.

**Fails if:** the first line is the ship line alone, a count, a status or the Review record, the answer is buried below the findings, the reply narrates the review, or the report exists only in chat.

## Fixed means measured again

**Input:** a follow-up pass where the earlier finding was "the Send button widens from 96 to 120px while pending" and the code now claims a fixed width.

**Expect:** the finding is marked fixed only with the width measured again in this session, both numbers given. Without a new measurement it reads "not rechecked".

**Fails if:** it marks the finding fixed from the code, a spec or the worker's claim.

## Interaction on a local build

**Input:** "check the invite flow before I ship it" on `localhost`, with the invite dialog.

**Expect:** every request is intercepted before the first interaction. The record lists what fired for each action (method, URL, body) and whether it was aborted or stubbed. Pending comes from a delayed stub and failure from a 503 stub, and both states are marked shown. Findings from these carry "measured" with the request log.

**Fails if:** a request reaches the real endpoint, pending or failure is marked not shown on a local build, or the finding cites source code instead of the requests that fired.

**Remote version:** the same flow on a preview URL. It opens, hovers and focuses only, marks pending, failure and success not shown with what would reach them, and types nothing. A finding read from the DOM, such as Cancel as `type="submit"`, is marked inferred, and the verdict reads `no, pending <check>` naming one concrete check, such as "press Enter in Email on a local build and count requests". A ship line of `yes, with fixes`, or a vague pending check ("test the form"), fails.

## Dialog and form probes

**Input:** the invite dialog on a local build.

**Expect:** a measured result for each probe. Focus after the close button, after Escape and after a successful submit, each read from `document.activeElement` (the invite dialog gives BODY for all three). The Tab loop. Enter in Email with valid input. Cancel with valid input (0 requests). Submit while pending, with the button box measured idle and pending, where focus sits, and a check for a second request. Failure then retry.

**Fails if:** any probe is missing without a reason, focus return is marked "not checked" while the closed state was reached, or Enter in the first field is never pressed.

**Silent non-completion version:** Enter in Email with valid input closes the dialog with 0 requests. Expect Blocking, because the user believes the invite went out and it did not, with `__clicks` reading `["Cancel"]` as evidence. A finding that names the button without the listener output, or drops to Should fix because Send is still reachable, fails.

## Lost or mismatched input

**Input:** the invite dialog with a 503 stub. Pick Admin, send, then send again.

**Expect:** a finding under criterion 8 that the select shows "Choose a role" while the retry body carries a role. It cites the shown value and the request body. Email kept its value, so that part passes.

**Fails if:** it lands under For a person to decide as a product question, or has no severity.

**Access grant version:** pick Admin, click Cancel, reopen, and press Send invite with a 200 stub. The select shows "Choose a role" while the body carries `"role":"admin"`. Expect Blocking under criterion 8, because the hidden value grants access, found by the Cancel then reopen probe. Should fix with "the user chose it earlier" fails. If the hidden value is a display preference, such as a sort order, expect Should fix.

## Chained findings and a full Next

**Input:** a run that finds both the Enter-cancel bug and the role mismatch.

**Expect:** each finding names the other (Enter-cancel, then reopening, lands on the mismatch). `Next:` has one prompt that fixes both, each as "Fix X so that <check that fails today>", such as "Enter in Email sends 1 POST and the dialog stays open until it succeeds".

**Fails if:** Next covers only the Enter bug, the findings never mention each other, or the Next check already passes on the current build, such as "press Cancel and confirm nothing is sent".

## Adds-only accessibility fixes are ranked

**Input:** a settings page whose nav item for the current page lacks `aria-current`, whose Time zone select has no accessible name, and whose card titles skip from h1 to h3.

**Expect:** the missing `aria-current` and the missing name are findings with a severity, under 6 and 5, each with the adds-only fix. The heading levels go to For a person to decide with no severity, since changing them restructures the outline.

**Fails if:** an adds-only fix lands under For a person to decide, the heading change gets a severity, or the ship line counts the ranked fixes as questions for a person.

**Mixed version:** a nav of links styled as tabs, where the selected one loses its visible selected state, and making it a real `tablist` would change every item's role. Expect two entries. The lost visible state is a finding with its own severity, and the role change is one line under For a person to decide with no severity. Sending the whole thing to a person, or ranking the role change, fails.

Change one thing between runs, or the next result cannot tell you which edit mattered.
