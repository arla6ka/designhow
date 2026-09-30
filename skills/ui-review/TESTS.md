# Tests: UI review

Setup, phrasing, the baseline and changing one thing per run are in `../TESTING.md`. The cases below run on one or two screens from your own product.

Several cases use an invite dialog built with known defects. Its Cancel and Send invite buttons are both `type="submit"`, Cancel comes first, the role select remounts on error, and the form POSTs to `/api/invite`.

## Baseline

Run with the skill off first, with the same screens and the prompt "Review this design." Cases: Normal, Vague request, Ambiguous judgment, Dialog and form probes. Watch for criteria made up on the spot, opinions written as problems, one issue listed per screen, a confident accessibility ruling, and findings with no location.

## Which cases apply

Every case runs on every setup except these:

| Case | Runs when |
|---|---|
| Called by a coordinator, Report as text under a coordinator | You run build-design-system or migrate-design-system |
| Browser evidence | A browser tool is installed |
| Component specs | The repo has specs |
| Fixed means measured again | A follow-up pass |
| Interaction on a local build, Answers the hand, Motion curve | A live build |
| Dialog and form probes, Lost or mismatched input | The flow has a dialog or form |

## Done means

The readiness list under Output in `SKILL.md`.

## Normal case

**Input:** three screenshots of one flow at 1280 px, a one-line purpose, and the default criteria. Plant the same unclear button label on two screens.

**Expect:** a review record naming the images, 1280 px, today's date, the default criteria file, and the purpose marked given. Findings grouped by severity, each with a criterion, a screen plus region, evidence naming the capture, and a dedupe key. The label issue appears once with a count of 2 under one key. The report's last line starts `Coverage:` and names 1280 px as measured and the narrow width as not. Every edge case is marked, and the summary matches the findings.

**Fails if:** a finding lacks a criterion, location or evidence type, the label issue appears twice, or the report claims anything about mobile widths.

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

**Seed user version:** the same screen on a local build whose repo has a seed user. It signs in with that user, or with a storage state the person provides, and reviews the screen. With neither, the screen is marked not shown with the reason.

**Passing version:** a public URL with a browser tool. The record lists the URL, the viewports captured and the date, and each finding points to a screenshot.

## Ambiguous judgment

**Input:** a screen with three things in it. A color choice someone would argue about. A layout pattern no criterion covers. Gray body text that may be too light to read.

**Expect:** the color choice is dropped and lands in Left out. The layout pattern goes under "For a person to decide." The gray text gets a contrast ratio from a tool and, below 4.5:1, a ranked finding citing that ratio. From screenshots only, the ratio is marked inferred.

**Fails if:** the color choice gets a severity or is dropped silently, a criterion is invented for the layout, or the gray text goes to a person unranked or is ranked with no ratio.

**Empty version:** a clean screen that meets every criterion. The report says "None" under `blocking` and `should-fix`, and no `note` is promoted to fill them.

**Viewport version:** the same screen at 390 and 1280 px, with a problem only at 390. The finding names 390 px only.

## Called by a coordinator

**Input:** after-captures of one route at 390 and 1280 px from a coordinator brief, with the system's criteria file and no purpose.

**Expect:** no questions. It infers the purpose and marks it assumed, and the report opens with `Status: complete (blocking n, should-fix n, note n)` whose counts match the findings, then `Commit: none`. The scan and probes read `not run: captures only`, and the report still counts as ready.

**Fails if:** it stops to ask for a purpose, or the counts in the status line disagree with the findings.

**Source dies version:** a brief for two routes, with the dev server stopped after the first route's captures. The first route is reviewed in full, the second is marked not reviewed by route and viewport, and the status reads `Status: complete (partial: <what was not reviewed>)`. Returning `stopped`, reviewing the second route from memory or source, or asking for screenshots fails.

## Report as text under a coordinator

**Input:** the coordinator case above, run as a subagent on a host that refuses files a subagent writes outside its scope, with a captures folder named in the brief.

**Expect:** the whole report comes back as the final message. No file lands under `.ui-review/` or anywhere else except captures in the named folder. The coordinator saves the text to `.design-system/review/<surface>-review.md`. A direct run on the same screen still saves `.ui-review/<date>-<flow>.md`.

**Fails if:** it writes a report file under a coordinator, or a direct run leaves no saved report.

## Scope with no diff

**Input:** repo access on main with no branch diff, 57 routes, and "check the app before I ship."

**Expect:** 5 routes, those with the most links and navigations to them in product code, ties broken by nav order. The record says "Default scope: 5 top routes, no branch diff" and lists them with their counts. Each default route answered 200 before capture.

**Fails if:** it reviews every route, picks routes without saying so, or stops to ask which screens.

**Router conventions version:** a repo whose router ignores a private folder and drops a grouping folder from the URL, with links to a page inside the group. The scope includes that page by its URL. A finding that names the private folder, or a route list that includes the grouping folder, fails.

**Named scope version:** a coordinator names the layouts flow while the branch has a diff elsewhere. It reviews the layouts flow only.

## Browser evidence

**Input:** repo access, a browser tool, a settings route whose icon-only delete button is 20 by 20 px, and "review the settings page".

**Expect:** the record names the tool, the widths and the accessibility scan. The target-size finding cites the button by role and name with its `@eN` ref, and gives the measured box. Captures use absolute paths under `.ui-review/<date>-<flow>/`, the session is named after the flow, and a file listing follows each capture.

**Fails if:** the size is estimated from a screenshot, an automated scan result is ranked `blocking` on its own, a capture path starts with `.`, or a session is named plain `review`.

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

**Input:** three runs on the same route. First with one `blocking` finding (the submit button does nothing at 390). Then with that fixed and two `should-fix` left. Then with only notes.

**Expect:** the ship line, right after the plain answer line (and the status line under a coordinator), reads `Ready to ship: no`, then `yes, with fixes`, then `yes`, each with a one-clause reason and the count of accessibility questions for a person. With a `blocking` finding the first line starts with "No" or "Not yet". With `should-fix` only, it never says "Not yet".

**Fails if:** the verdict comes after the Review record, disagrees with the severities or with the first line, or an accessibility question sets it.

**Partial version:** stop the dev server after the first of two routes. The ship line says it covers only the first route.

## Direct run reply

**Input:** "check the settings page before I ship it, and tell me if we're using colors consistently", run directly on a branch with a diff.

**Expect:** the first line is one plain sentence that answers both halves, such as "Nearly. One tab bug blocks shipping, and cards use two grays for the same text," with no criterion numbers, severities or skill names. The ship line comes second. The reply lists the accessibility scan and any spec check with their exit codes, gives at most 3 items for a person with defaults, and ends with one `Next:` prompt. The report is saved at `.ui-review/<date>-<flow>.md` with captures beside it, and nothing lands in the repo root.

**Fails if:** the first line is the ship line alone, a count, a status or the Review record, the answer is buried below the findings, the reply narrates the review, or the report exists only in chat.

## Fixed means measured again

**Input:** a follow-up pass where the earlier finding was "the Send button widens from 96 to 120px while pending" and the code now claims a fixed width.

**Expect:** the finding is marked fixed only with the width measured again in this session, both numbers given. Without a new measurement it reads "not rechecked".

**Fails if:** it marks the finding fixed from the code, a spec or the worker's claim.

**Inferred version:** the earlier finding was inferred from the DOM. `Next:` asks for the check that settles it, never a fix.

## Interaction on a local build

**Input:** "check the invite flow before I ship it" on `localhost`, with the invite dialog.

**Expect:** every request is intercepted before the first interaction. The record lists what fired for each action (method, URL, body) and whether it was aborted or stubbed. Pending comes from a delayed stub and failure from a 503 stub, and both states are marked shown. Findings from these carry "measured" with the request log.

**Fails if:** a request reaches the real endpoint, pending or failure is marked not shown on a local build, or the finding cites source code instead of the requests that fired.

**Remote version:** the same flow on a preview URL. It opens, hovers and focuses only, marks pending, failure and success not shown with what would reach them, and types nothing. A finding read from the DOM, such as Cancel as `type="submit"`, is marked inferred, and the verdict reads `no, pending <check>` naming one concrete check, such as "press Enter in Email on a local build and count requests". A ship line of `yes, with fixes`, or a vague pending check ("test the form"), fails.

## Dialog and form probes

**Input:** the invite dialog on a local build.

**Expect:** a measured result for each probe. Focus after the close button, after Escape and after a successful submit, each read from `document.activeElement` (the invite dialog gives BODY for all three). The Tab loop. Enter in Email with valid input. Cancel with valid input (0 requests). Submit while pending, with the button box measured idle and pending, where focus sits, and a check for a second request. Failure then retry.

**Fails if:** any probe is missing without a reason, focus return is marked "not checked" while the closed state was reached, or Enter in the first field is never pressed.

**Silent non-completion version:** Enter in Email with valid input closes the dialog with 0 requests. Expect `blocking`, because the user believes the invite went out and it did not, with `__clicks` reading `["Cancel"]` as evidence. A finding that names the button without the listener output, or drops to `should-fix` because Send is still reachable, fails.

## Lost or mismatched input

**Input:** the invite dialog with a 503 stub. Pick Admin, send, then send again.

**Expect:** a finding under criterion 8 that the select shows "Choose a role" while the retry body carries a role. It cites the shown value and the request body. Email kept its value, so that part passes.

**Fails if:** it lands under For a person to decide as a product question, or has no severity.

**Access grant version:** pick Admin, click Cancel, reopen, and press Send invite with a 200 stub. The select shows "Choose a role" while the body carries `"role":"admin"`. Expect `blocking` under criterion 8, because the hidden value grants access, found by the Cancel then reopen probe. `should-fix` with "the user chose it earlier" fails. If the hidden value is a display preference, such as a sort order, expect `should-fix`.

## Chained findings and a full Next

**Input:** a run that finds both the Enter-cancel bug and the role mismatch.

**Expect:** each finding names the other (Enter-cancel, then reopening, lands on the mismatch). `Next:` has one prompt that fixes both, each as "Fix X so that <check that fails today>", such as "Enter in Email sends 1 POST and the dialog stays open until it succeeds".

**Fails if:** Next covers only the Enter bug, the findings never mention each other, or the Next check already passes on the current build, such as "press Cancel and confirm nothing is sent".

## Adds-only accessibility fixes are ranked

**Input:** a settings page whose nav item for the current page lacks `aria-current`, whose Time zone select has no accessible name, and whose card titles skip from h1 to h3.

**Expect:** the missing `aria-current` and the missing name are findings with a severity, under 6 and 5, each with the adds-only fix. The heading levels go to For a person to decide with no severity, since changing them restructures the outline.

**Fails if:** an adds-only fix lands under For a person to decide, the heading change gets a severity, or the ship line counts the ranked fixes as questions for a person.

**Mixed version:** a nav of links styled as tabs, where the selected one loses its visible selected state, and making it a real `tablist` would change every item's role. Expect two entries. The lost visible state is a finding with its own severity, and the role change is one line under For a person to decide with no severity. Sending the whole thing to a person, or ranking the role change, fails.

## Optical alignment is reported

**Input:** a screen with one icon that reads larger than its neighbors, and one icon alone in its own box that sits off that box's center.

**Expect:** both are findings under criterion 10, citing `trap/icon-optical-size` and `trap/icon-optical-align`. Each names its context and a measured offset or size, and the evidence includes a zoomed crop.

**Fails if:** either lands under What not to report, or an icon is measured against something it does not sit beside.

**Beside text version:** an icon beside a label, with no alignment row in `docs/system/decisions.md`. The finding gives the icon's distance to the cap center, the x-height center and their midpoint, and the choice goes under For a person to decide. Picking a reference line fails.

## Touch findings name their evidence

**Input:** "review this on mobile" with only a desktop browser's device emulation available, where a button's hover style sticks after a tap and an input's text is 14px.

**Expect:** one capture at the phone width with touch emulation on. The input finding cites `trap/touch-input-zoom` as measured, with the computed 14px. The hover finding cites `trap/touch-hover-flash`, says `emulated, needs a device`, and names any `:hover` rule the source has outside `@media (hover: hover)`. The Review record names the emulation as the tool.

**Fails if:** the hover finding reads as confirmed on a device, sticky hover is marked clean because emulation didn't show it, or the 14px input is marked `emulated, needs a device`.

## Stand-in content

**Input:** a team page whose demo data puts a landscape photo in every avatar slot and "Lorem" in every name.

**Expect:** the stand-in content edge case reads not shown, naming the avatar slots and the names, with a capture.

**Fails if:** the edge case is marked shown, or the review ranks the photos as a taste call under Left out.

## Answers the hand

**Input:** a local build where a primary button shows its pressed state only after a 200ms transition, and a list row that ignores clicks until its enter animation ends.

**Expect:** findings under criterion 13, citing `trap/press-delayed` and `trap/motion-blocks-input`, each with the measured time from `state-timeline.js` or the probe that found it.

**Fails if:** either finding rests on a screenshot, has no measured time, or lands under criterion 7.

**Screenshots only version:** criterion 13 reads n/a with the reason that it needs a live build, and no finding or pass is written for it.

## System-caused finding

**Input:** three screens whose menus all open on the same system preset, and that preset eases in and runs longer than the menus' tier allows.

**Expect:** one finding flagged `system-caused`, naming the preset, with a count of 3 and the screens. Its fix and `Next:` prompt point at the token source or preset, not the screens.

**Fails if:** it becomes three findings, the fix edits each screen, or the flag names no token, preset or component.

## Motion curve

**Input:** a local build where a popover enters with a linear curve and exits slower than it enters, on a surface of tier `high`.

**Expect:** a finding citing `trap/motion-linear` and `trap/motion-exit-slower` with durations and easings read from `getAnimations()`, plus `trap/motion-frequent` for the tier. It ranks above an equal-severity finding on a `low` surface.

**Fails if:** the curve is judged from a capture, the finding goes to Left out as taste, or the tier does not change its order.
