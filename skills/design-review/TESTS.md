# Tests: design review

## Setup under test

Two runs are comparable only when their setups match, so fill this in every time.

- Skill and references in use: `SKILL.md`, `references/sources.md`, and the default criteria file or your own
- Project instructions: loaded or not, and which file (CLAUDE.md / AGENTS.md)
- Tools connected: browser tool, component workbench, or none
- Model name and version

Write each prompt the way a colleague would, such as "check this screen before I ship." Keep words like "test", "eval" or "rubric" out of it, since a model that knows it is graded behaves differently. Grade from the report and the transcript (what it opened, what it captured), not from the model's account of its own work.

## Cases in scope

| Case | Runs here | Reason |
|---|---|---|
| Normal | Yes | Every setup needs it |
| Vague request | Yes | Most real asks name no screen, no purpose and no criteria |
| Missing required input | Yes | An unreadable purpose must stop the run, and a prose description should not pass for the design |
| Conflicting sources | Yes | Two versions of a screen, or a screenshot and a live URL, can arrive together |
| Tool failure | Yes | URL and Storybook inputs depend on a browser tool that may be missing or blocked |
| Ambiguous judgment | Yes | The skill critiques and ranks, which is where taste slips in |
| Called by a coordinator | If you run build-design-system or migrate-design-system | The caller reads a status line and cannot answer a question mid-run |

## Done means

The readiness list under Output in `SKILL.md`. Needs a person: accessibility observations, product decisions, and anything the criteria do not cover.

## Baseline

Run once with no skill loaded. Send the same screens and the prompt "Review this design." Record what happens.

| Case | Result without the skill |
|---|---|
| Normal |  |

Look for criteria made up on the spot, opinions written as problems, one issue listed per screen, a confident accessibility ruling, and findings with no location. The file cannot tell you whether the skill helps until this row is filled.

## Normal case

**Input:** three screenshots of one flow at 1440 px, a one-line purpose, and the default criteria. Plant the same unclear button label on two screens.

**Expect:** a review record naming the images, 1440 px, today's date, the default criteria file, and the purpose marked given. Findings grouped by severity, each with a criterion, a screen plus region, and evidence naming the capture. The label issue appears once with a count of 2. An edge-case list with shown or not shown for each. A summary that matches the findings.

**Fails if:** a finding lacks a criterion or location, the label issue appears twice, or the report claims anything about mobile widths.

## Vague request

**Input:** repo access, a browser tool, a feature branch that changes one settings route, and the prompt "check this screen before I ship". No purpose, no criteria, no URL.

**Expect:** it finds the changed route from the diff, opens it on the dev server at 375 and 1440 px, writes an assumed purpose at the top of the record, uses the default criteria, and finishes the review.

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

**Viewport version:** send the same screen at 375 px and 1440 px, with a problem only at 375. The finding should name 375 px only.

## Called by a coordinator

**Input:** after-captures of one route at 375 and 1440 px from a coordinator brief, with the system's criteria file and no purpose.

**Expect:** no questions. It infers the purpose and marks it assumed, and the report opens with `Status: complete (Blocking n, Should fix n, Note n)` whose counts match the findings.

**Fails if:** it stops to ask for a purpose, or the counts in the status line disagree with the findings.

## Record

| When | Case | Result | Edit made next |
|---|---|---|---|
|  |  |  |  |

Between runs, alter a single variable. Otherwise the next result cannot tell you which edit mattered.
