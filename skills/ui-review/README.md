# ui-review

Critiques a screen, flow, prototype, or running build against a set of criteria. The report ranks each problem, lists states the design leaves out, and hands open questions to a person.

## Use as-is

Say "check this screen before I ship." With repo access and a browser, the skill finds and opens the screens your branch changes. Otherwise share screenshots or a link. A sentence on who the screen serves and what it should get them to do helps, and without it the skill infers the purpose and marks it assumed. If you give no criteria, it uses `references/review-criteria.md` and names that file in the report.

## Replace first

1. **Criteria** in `references/review-criteria.md`. Cut every criterion your team would not stand behind.
2. **Severity levels.** Keep the ids `blocking`, `should-fix` and `note`, which the other skills read, and match their meanings to your tracker.
3. **Exclusions.** Edit "What not to report" to match what your team leaves to other reviews.
4. **Reference system.** Criterion 10 names Geist as a comparison for products with few screens. Swap in your own system once it exists.
5. **Viewports.** URLs get the narrowest and widest widths your product supports. The default is 390 and 1280 px, the widths the build and migrate skills capture.

## Invariants

Each rule prevents a specific failure. Change one only when its stated reason doesn't apply to you.

- Findings cite a criterion. An uncited finding is one reviewer's opinion, and the team ends up debating it.
- Findings carry a location and a viewport. Designers skip what they cannot locate, and a narrow-screen problem may not exist on desktop.
- The screen's purpose comes first. A choice that looks odd often makes sense once you know the user and the task.
- Each finding says how it was established: seen, measured, or inferred, and carries a dedupe key. An inferred finding that would block sets the verdict to "no, pending" the one check that settles it, and never goes into a fix prompt as a fix.
- Product calls, and accessibility changes that remove, rename or restructure semantics, go to a person. A confident wrong verdict costs more than an open question. A fix that only adds semantics, such as a missing label, is a ranked finding, because build and migrate land it as a decision.
- Repeats collapse into one finding with a count. Nobody reads a report where one problem fills a page.
- Evidence is the rendered design. A description only reflects what its writer noticed.
- Called by another skill, it runs to the end, opens with a status line and returns the report as text. A coordinator has no one to answer a question mid-run, and some hosts refuse a report file written by a subagent.

## What the scripts touch

This skill ships no scripts. With `build-design-system` installed beside it, it runs these from there:

- `capture.mjs` opens the app's local or given URL in a headless browser and writes PNG and JSON captures under `.ui-review/<date>-<flow>/`, or the folder a coordinator names.
- `state-timeline.js` runs inside the open page and only reads computed styles. `probe.mjs` reads the captures.
- `check-spec.mjs` reads `docs/system/` and runs read-only `git` commands.
- The accessibility scan installs `axe-core` from npm into `.design-system/tmp/`. That install, and `agent-browser` if you use that tool, are the only network calls besides the page under review.
- A direct run writes its report to `.ui-review/<date>-<flow>.md`. Under a coordinator it writes no report file.

On a local build it intercepts every request that is not a same-origin GET or HEAD and aborts or stubs it, so no form submission leaves the machine.

## Test your changes

A browser tool is optional, and pasted screenshots must keep working after you add one. Run `TESTS.md` against one or two screens from your own product, then confirm a random finding cites a criterion you actually wrote.

## Adapt this skill

Use the interview prompt in `../ADAPTING.md` with `SKILL.md` and both files in `references/`. Topics for this skill: which default criteria you keep, drop or replace, your severity levels, the topics you leave to other reviews, the form work arrives in, the widths you support, and where finished reviews go.
