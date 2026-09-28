# Tests: design review

## Setup under test

Two runs are comparable only when their setups match, so fill this in every time.

- Skill and references in use: `SKILL.md`, `references/sources.md`, and the default criteria file or your own
- Project instructions: loaded or not, and which file (CLAUDE.md / AGENTS.md)
- Tools connected: browser tool, component workbench, or none
- Model name and version

The messy-raw invite dialog is the reference fixture for the dialog and form cases. Its Cancel and Send invite are both `type="submit"`, Cancel comes first, and the role select remounts on error.

Write each prompt the way a colleague would, such as "check this screen before I ship." Keep words like "test", "eval" or "rubric" out of it, since a model that knows it is graded behaves differently. Grade from the report and the transcript (what it opened, what it captured), not from the model's account of its own work.

## Cases in scope
| Scope with no diff | Yes | A whole-app ask with no branch must pick screens and say which |
| Source dies mid-run | If a coordinator calls it | A partial review must say what it did not cover |
| Mixed visual and accessibility finding | Yes | One fix can be visual and restructure semantics at once |
| Record hygiene | Yes | The record must name every gap and every n/a |
| Ship line | Yes | The caller reads the verdict from one line |
| Fixed means measured again | Follow-up passes | A fix claimed in code proves nothing until it is measured |
| Direct run reply | Yes | A person reads the reply, not the saved report |
| Default routes skip non-routes | Next.js apps with no diff | Private folders and components are not screens |
| The first line answers the ask | Yes | People read the first line and stop |
| Interaction on a local build | Live builds | A probe must never send a real request |
| Dialog and form probes | Flows with a dialog or form | Lost input hides behind screens that look fine |
| Lost or mismatched input | Flows with a form | Shown versus sent is a finding, never a product question |
| Inferred Blocking holds the verdict | Remote previews | An unproven Blocking finding cannot pass a screen |
| One verdict, written twice | Yes | The answer line and the ship line must agree |
| Saved report and a Next that fails first | Direct runs | A Next check that passes today verifies nothing |
| Hidden access grant is Blocking | Flows that grant access | Cancel that keeps a picked role grants it on the next send |
| Silent non-completion counts as cannot finish | Flows with a form | A task that quietly fails reads as done |
| Chained findings and a full Next | Yes | One finding's recovery path can land in another |
| The accessibility scan runs on both paths | Machines without agent-browser | The Playwright path must not skip the scan |
| Captures land where the command says | agent-browser installed | A relative path sends the file somewhere else and still exits 0 |
| Adds-only accessibility fixes are ranked | Yes | Adds-only fixes are findings, and the rest go to a person |

| Case | Runs here | Reason |
|---|---|---|
| Normal | Yes | Every setup needs it |
| Vague request | Yes | Most real asks name no screen, no purpose and no criteria |
| Missing required input | Yes | An unreadable purpose must stop the run, and a prose description should not pass for the design |
| Conflicting sources | Yes | Two versions of a screen, or a screenshot and a live URL, can arrive together |
| Tool failure | Yes | URL and Storybook inputs depend on a browser tool that may be missing or blocked |
| Ambiguous judgment | Yes | The skill critiques and ranks, which is where taste slips in |
| Called by a coordinator | If you run build-design-system or migrate-design-system | The caller reads a status line and cannot answer a question mid-run |
| Report as text under a coordinator | If you run build-design-system or migrate-design-system | A host blocked a report file written inside a subagent, and the review was lost |
| Browser evidence | agent-browser installed | Findings must point at refs and measured values, not descriptions |
| Component specs | Repos with specs | A spec's states extend the edge-case list |

## Done means

The readiness list under Output in `SKILL.md`. Needs a person: accessibility changes that remove, rename or restructure semantics, product decisions, and anything the criteria do not cover. An accessibility fix that only adds semantics is a ranked finding.

## Baseline

Run once with no skill loaded. Send the same screens and the prompt "Review this design." Record what happens.

| Case | Result without the skill |
|---|---|
| Normal |  |

Look for criteria made up on the spot, opinions written as problems, one issue listed per screen, a confident accessibility ruling, and findings with no location. The file cannot tell you whether the skill helps until this row is filled.

## Normal case

**Input:** three screenshots of one flow at 1280 px, a one-line purpose, and the default criteria. Plant the same unclear button label on two screens.

**Expect:** a review record naming the images, 1280 px, today's date, the default criteria file, and the purpose marked given. Findings grouped by severity, each with a criterion, a screen plus region, and evidence naming the capture. The label issue appears once with a count of 2. An edge-case list with shown or not shown for each. A summary that matches the findings.

**Fails if:** a finding lacks a criterion or location, the label issue appears twice, or the report claims anything about mobile widths.

## Vague request

**Input:** repo access, a browser tool, a feature branch that changes one settings route, and the prompt "check this screen before I ship". No purpose, no criteria, no URL.

**Expect:** it finds the changed route from the diff, opens it on the dev server at 390 and 1280 px, writes an assumed purpose at the top of the record, uses the default criteria, and finishes the review.

**Fails if:** it asks for a file path, a URL or a purpose before looking, reviews routes the branch did not touch, or states the purpose without marking it assumed.

**Second version:** the same screens as the normal case with no purpose. It should infer one, mark it assumed and review.

## Missing required input

**Input:** a screenshot of a half-built screen with no title, no heading and no primary action, and no purpose.

**Expect:** it stops, gives a one-line guess at what the screen does, and asks for the real purpose.

**Fails if:** it reviews anyway. Read the output for the purpose it assumed.

**Second version:** supply the purpose, then swap the images for a written account of them. It should ask for images or a link.

## Conflicting sources

**Input:** an old and a new draft of one screen with different primary buttons, and nothing marking the current one.

**Is there a precedence rule?** Not in the skill. Check your project instructions.

**Expect, with no rule:** it names what differs between the versions and asks which is current.

**Expect, when a precedence rule is loaded:** it reviews the version the rule picks and the record names it.

**Fails if:** it reviews the first one it saw, or merges both into one set of findings without saying so.

## Tool failure

**Input:** the purpose plus a prototype URL behind a sign-in, with a browser tool connected. Run it a second time with no tool connected.

**Expect:** it says it could not open the rendered page, names the reason, and asks for screenshots.

**Fails if:** it reviews from the URL text, page source, or a guess about the page, or it tries to sign in.

**Passing run to compare:** a public URL with a browser tool. The record should list the URL, the viewports captured, and the date, and each finding should point to a screenshot.

## Ambiguous judgment

**Input:** a screen with three things in it. A color choice someone would argue about. A layout pattern no criterion covers. Gray body text that may be too light to read.

**Expect:** the color choice is dropped. The layout pattern goes under "For a person to decide." The gray text is reported there as an observation with no severity and no pass or fail.

**Fails if:** the color choice gets a severity or is dropped silently instead of landing in Left out, a criterion is invented for the layout, or the report rules on contrast.

**Empty version:** a clean screen that meets every criterion. The report should say "None" under Blocking and Should fix, not promote a Note to fill them.

**Viewport version:** send the same screen at 390 px and 1280 px, with a problem only at 390. The finding should name 390 px only.

## Called by a coordinator

**Input:** after-captures of one route at 390 and 1280 px from a coordinator brief, with the system's criteria file and no purpose.

**Expect:** no questions. It infers the purpose and marks it assumed, and the report opens with `Status: complete (Blocking n, Should fix n, Note n)` whose counts match the findings.

**Fails if:** it stops to ask for a purpose, or the counts in the status line disagree with the findings.

## Report as text under a coordinator

**Input:** the coordinator case above, run as a subagent on a host that refuses files a subagent writes outside its scope, with a captures folder named in the brief.

**Expect:** the whole report comes back as the final message. No file lands under `.design-review/` or anywhere else except captures in the named folder. The coordinator saves the text to `.design-system/review/<surface>-review.md`. A direct run on the same screen still saves `.design-review/<date>-<flow>.md`.

**Fails if:** it writes a report file under a coordinator, or a direct run leaves no saved report.

## Browser evidence

**Input:** repo access, agent-browser installed, a settings route whose icon-only delete button is 20 by 20 px, and "review the settings page".

**Expect:** the record names agent-browser and the widths. The target-size finding cites the button by role and name with its `@eN` ref, and gives the size from `get box`. The scan's results are sorted by their fix. An adds-only fix is a ranked finding, and anything else goes to For a person to decide with no severity.

**Fails if:** the size is estimated from a screenshot, or an automated scan result is ranked as Blocking on its own.

**Fallback version:** remove agent-browser. It should capture with Playwright, or ask for screenshots when neither runs.

## Component specs

**Input:** the same route, where `docs/system/select.md` lists a "Load failed" state the screen can reach, and a second spec with a blank Trigger cell.

**Expect:** "Load failed" appears in the edge-case list as shown or not shown. The spec check runs on both specs, and the failing one is one line under For a person to decide.

**Fails if:** the review edits the spec, or reports the incomplete spec as a design finding.

## Scope with no diff

**Input:** repo access on main with no branch diff, 57 routes, and "check the app before I ship."

**Expect:** about 5 routes, the home route then the main nav's links in nav order. The record says "Default scope: 5 top routes, no branch diff" and lists them.

**Fails if:** it reviews every route, picks routes without saying so, or stops to ask which screens.

**Named scope version:** a coordinator names the layouts flow while the branch has a diff elsewhere. It reviews the layouts flow only.

## Source dies mid-run

**Input:** a coordinator brief for two routes. Stop the dev server after the first route's captures.

**Expect:** the first route is reviewed in full, the second is marked not reviewed by route and viewport, and the status line reads `Status: complete (partial: <what was not reviewed>)`. No question is asked.

**Fails if:** it returns `stopped`, reviews the second route from memory or source, or asks for screenshots under a coordinator.

## Mixed visual and accessibility finding

**Input:** a nav of links styled as tabs, where the selected one loses its visible selected state. Making it a real `tablist` would change every item's role.

**Expect:** two entries. The lost visible state is a finding with its own severity. The role change is one line under For a person to decide, with no severity, because it restructures existing semantics.

**Fails if:** the whole finding goes to a person with no severity, or the role change gets ranked.

## Record hygiene

**Input:** a dev build showing a framework issue badge, a screen with no destructive action, no specs in the repo, `build-design-system` not installed beside this skill, and two captures per viewport.

**Expect:** the badge count appears once under For a person to decide, and dev tools stay closed. The record lists criterion 8 as n/a with its reason, says the spec check was skipped because no specs exist, and says the sibling skill was missing. Every `@eN` ref names its capture, such as `@e34 (home-1280.png)`.

**Fails if:** a criterion is silently skipped, the overlay is opened or reported as a design finding, or a bare `@eN` appears.

## Ship line

**Input:** three runs on the same route. First with one Blocking finding (the submit button does nothing at 390). Then with that fixed and two Should fix left. Then with only Notes.

**Expect:** the ship line, right after the plain answer line (and the status line under a coordinator), reads `Ready to ship: no`, then `yes, with fixes`, then `yes`, each with a one-clause reason and the count of accessibility questions for a person.

**Fails if:** the verdict comes after the Review record, disagrees with the severities, or an accessibility question sets it.

**Partial version:** stop the dev server after the first of two routes. The ship line says it covers only the first route.

## Fixed means measured again

**Input:** a follow-up pass where the earlier finding was "the Send button widens from 97 to 114px while loading" and the code now claims a fixed width.

**Expect:** the finding is marked fixed only with the width measured again in this session, both numbers given. Without a new measurement it reads "not rechecked".

**Fails if:** it marks the finding fixed from the code, a spec or the worker's claim.

## Direct run reply

**Input:** "is the settings page ready to ship?" run directly, on a branch with a diff.

**Expect:** the reply opens with the plain answer line and then the ship line, lists the accessibility scan and any spec check with their exit codes, gives at most 3 items for a person with defaults, and ends with one `Next:` prompt.

**Fails if:** the answer to "ready to ship" is buried below the findings, or the reply narrates the review.

## Default routes skip non-routes

**Input:** a Next.js App Router repo on main with no diff. It has `app/page.tsx`, `app/_patterns/page.tsx`, `app/(shop)/cart/page.tsx` and `app/(shop)/_components/Row.tsx`, and a nav linking `/cart`.

**Expect:** the default scope includes `/` and `/cart`. `_patterns` and `(shop)/_components` are not reviewed, and nothing cites `/_patterns` as a page. Each default route answered 200 before capture.

**Fails if:** a finding's Where names `/_patterns`, or the route list includes `/(shop)`.

## The first line answers the ask

**Input:** "check the playground before I ship it, and tell me if we're using colors consistently", run directly.

**Expect:** the report's first line is one plain sentence that answers both halves, such as "Nearly. One tab bug blocks shipping, and cards use two grays for the same text." The ship line comes second. No criterion numbers, severities or skill names in that first line.

**Fails if:** the first line is the ship line alone, a count, a status or the Review record.

## Interaction on a local build

**Input:** "check the invite flow before I ship it" on `localhost`, a dialog form that POSTs to `/api/invite`.

**Expect:** every request is intercepted before the first interaction. The record lists what fired for each action (method, URL, body) and whether it was aborted or stubbed. Pending comes from a delayed stub and failure from a 503 stub, and both states are marked shown. Findings from these carry "measured" with the request log.

**Fails if:** a request reaches the real endpoint, pending or failure is marked not shown on a local build, or the finding cites source code instead of the requests that fired.

**Remote version:** the same flow on a preview URL. It opens, hovers and focuses only, marks pending, failure and success not shown with what would reach them, and types nothing.

## Dialog and form probes

**Input:** the same dialog.

**Expect:** a measured result for each probe. Focus after the close button, after Escape and after a successful submit, each read from `document.activeElement` (messy-raw gives BODY for all three). The Tab loop. Enter in Email with valid input (messy-raw closes the dialog with 0 requests). Cancel with valid input (0 requests). Submit while pending, with the button box idle and pending (112 to 259px) and a check for a second request. Failure then retry.

**Fails if:** any probe is missing without a reason, focus return is marked "not checked" while the closed state was reached, or Enter in the first field is never pressed.

## Lost or mismatched input

**Input:** the same dialog with a 503 stub. Pick Admin, send, then send again.

**Expect:** a finding under criterion 8 that the select shows "Choose a role" while the retry body carries a role. It cites the shown value and the request body. Email kept its value, so that part passes.

**Fails if:** it lands under For a person to decide as a product question, or has no severity.

## Inferred Blocking holds the verdict

**Input:** a remote preview of the same dialog, where no submit is allowed and the DOM shows Cancel as `type="submit"`.

**Expect:** the finding is marked inferred, and the verdict reads `no, pending <check>` naming one check, such as "press Enter in Email on a local build and count requests". The first line says the same.

**Fails if:** the ship line says `yes, with fixes` while an inferred finding could block, or the pending check is vague ("test the form").

## One verdict, written twice

**Input:** any run with one Blocking finding.

**Expect:** the first line starts with "No" or "Not yet", and the ship line reads `Ready to ship: no`. With Should fix only, the first line never says "Not yet".

**Fails if:** the first line and the ship line give different answers. v2-r6 wrote "Not yet" above "yes, with fixes".

## Saved report and a Next that fails first

**Input:** a direct run on messy-raw, on 2026-09-28.

**Expect:** the report is at `.design-review/2026-09-28-invite.md` with captures beside it, and nothing lands in the repo root. The reply ends with `Next:` naming a check that fails on the current build and passes after the fix, such as "Enter in Email sends 1 POST and the dialog stays open until it succeeds".

**Fails if:** the report is only in chat, captures sit in the repo root, or the Next check passes today. "Press Cancel and confirm nothing is sent" passes on messy-raw before any fix.

## Hidden access grant is Blocking

**Input:** the invite dialog. Pick Admin, click Cancel, reopen, press Send invite with the 200 stub.

**Expect:** the select shows "Choose a role" while the body carries `"role":"admin"`. The finding is Blocking under criterion 8, citing the shown-versus-sent rule, because the hidden value grants access. The Cancel then reopen probe produced it, not an improvised step.

**Fails if:** it lands at Should fix with "the user chose it earlier", or the Cancel then reopen probe is missing from the record.

**Milder version:** the hidden value is a display preference, such as a sort order. Expect Should fix.

## Silent non-completion counts as cannot finish

**Input:** the same dialog. Press Enter in Email with valid input.

**Expect:** Blocking, with the reason that the user believes the invite went out and it did not. `__clicks` reads `["Cancel"]` and `__submits` is empty or names Cancel. 0 requests.

**Fails if:** the finding says which button fired without the listener output, or drops to Should fix because Send is still reachable.

## Chained findings and a full Next

**Input:** a run that finds both Enter-cancel and the role mismatch.

**Expect:** each finding names the other (Enter-cancel, then reopening, lands on the mismatch). `Next:` has one prompt that fixes both, each as "Fix X so that <check that fails today>".

**Fails if:** Next covers only the Enter bug, or the findings never mention each other.

## The accessibility scan runs on both paths

**Input:** the same review on a machine with Playwright and no agent-browser.

**Expect:** the axe step runs at 390 and 1280. The scan's results are sorted by their fix. An adds-only fix is a ranked finding, and anything else goes to For a person to decide with no severity. The record names the scan.

**Fails if:** the record has no scan, or says "low contrast" without a measured value. v3-r6 dropped the scan when it switched to Playwright.

## Captures land where the command says

**Input:** any agent-browser capture.

**Expect:** absolute paths under `.design-review/<date>-<flow>/`, a session named after the flow, and a file listing after each capture.

**Fails if:** a capture path starts with `.`, or a session is named plain `review`.

## Adds-only accessibility fixes are ranked

**Input:** a settings page whose nav item for the current page lacks `aria-current`, whose Time zone select has no accessible name, and whose card titles skip from h1 to h3.

**Expect:** the missing `aria-current` and the missing name are findings with a severity, under 6 and 5, each with the adds-only fix. The heading levels go to For a person to decide with no severity, since changing them restructures the outline. The wording matches migrate's Boundaries and build's rule.

**Fails if:** an adds-only fix lands under For a person to decide, the heading change gets a severity, or the ship line counts the ranked fixes as questions for a person.

## Record

| When | Case | Result | Edit made next |
|---|---|---|---|
| 2026-09-28 | Report as text under a coordinator | v4-r3-weak: the host refused a review file inside a subagent | Under a coordinator the report is returned as text and the coordinator saves it. Not yet rerun |

Between runs, alter a single variable. Otherwise the next result cannot tell you which edit mattered.
