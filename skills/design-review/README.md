# design-review

Critiques a screen, flow, prototype, or running build against a set of criteria. The report ranks each problem, lists states the design leaves out, and hands open questions to a person.

## Use as-is

Say "check this screen before I ship." With repo access and a browser, the skill finds the screens your branch changes and opens them itself. Otherwise share screenshots or a link. A sentence on who the screen serves and what it should get them to do helps. Without it, the skill infers the purpose and marks it assumed at the top of the report. If you give no criteria, it falls back to `references/review-criteria.md` and names that file in the report.

## Replace first

1. **Criteria** in `references/review-criteria.md`. Cut every criterion your team would not stand behind. Most of the value of adapting comes from this file.
2. **Severity levels.** Match the names and meanings your tracker already uses.
3. **Exclusions.** Edit the "What not to report" list to match what your team leaves to other reviews.
4. **Reference system.** Criterion 10 names Vercel's Geist as a comparison for products with few screens. Swap in your own system once it exists.
5. **Default viewports.** URLs get 375 and 1440 px unless you set the widths your product supports.

## Invariants

Each rule below prevents a specific failure. Leave them alone unless your review process works differently.

- Findings cite a criterion. An uncited finding is one reviewer's opinion, and the team ends up debating it.
- Findings carry a location and a viewport. Designers skip what they cannot locate, and a narrow-screen problem may not exist on desktop.
- The screen's purpose comes first. A choice that looks odd often makes sense once you know the user and the task. An assumed purpose is marked as one, where a reader corrects it first.
- Each finding says how it was established: seen, measured, or inferred. Inferred findings never block.
- Accessibility calls and product calls go to a person. A wrong verdict delivered with confidence costs more than an open question.
- Repeats collapse into one finding with a count. Nobody reads a report where one problem fills a page.
- Evidence is the rendered design. A description only reflects what its writer noticed.
- Called by another skill, it runs to the end and opens with a status line. A coordinator has no one to answer a question mid-run.

## Optional tools

The skill runs on pasted screenshots alone. With a browser tool it can open a local build, a preview URL, a hosted prototype, or a Storybook story and screenshot each viewport. The report logs the URL or story, the widths, and the date. Make sure pasted screenshots still work after you add a tool.

## Test your changes

Run `TESTS.md` against one or two screens from your own product. Then confirm by hand that a vague ask still finds the screen and marks the purpose assumed, that a screen with no readable purpose still halts the review, that an intentional exception to your patterns is left out of the findings, and that a random finding cites a criterion you actually wrote.

## Adapt this skill

Send this prompt with `SKILL.md` and both files in `references/` attached.

```
I want to fit the attached design-review skill to my team.

Interview me with one short question at a time. Cover these topics only:
- which of the default criteria we keep, drop, or replace with our own
- the severity levels we use and what each one means to us
- the review topics we leave to other people or other checks
- the form work arrives in (screenshots, local builds, preview URLs, Storybook)
- the screen widths we support
- where finished reviews go

Leave the procedure, stop conditions, and final checks as written, unless something I
tell you contradicts them. Never fill a gap with a guess. If I don't know an answer,
mark it open and move on.

When the interview is done, sort your proposed edits into two groups. The first holds
edits that would change what the skill flags, ranks, or halts on. The second holds
renames and formatting that leave its decisions the same. Apply nothing until I approve.
```
