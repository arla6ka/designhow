# Verification

A surface is migrated when a verifier has checked the running app at a named commit and written a verdict. A type check, a green CI run, or a worker saying "done" are inputs to that verdict. None of them is the verdict.

## Contents

- Baselines
- Parity modes
- Visual diff rules
- Accessibility snapshot
- Behavior checks
- Design review
- Anti-tamper rules
- Verdict states
- Verifier brief
- Verdict file
- Integration checks and the final sweep

## Baselines

A baseline is the record of how each surface looked and behaved before any migration commit. Capture it once, during the Baselines phase, from the commit the shared layer will start on.

For each surface, capture every state in its `states` column at every viewport and theme in `frame.md`. Each capture is two files, a screenshot and an accessibility snapshot. The accessibility snapshot is the page's roles, names, and states as a tree, such as Playwright's `locator.ariaSnapshot()`. Name files `<surface>/<state>.<viewport>.<theme>.png` and `.aria.yml`.

Make captures repeatable:

- Capture in the environment CI uses, the same container image, browser build, and fonts. Screenshots from a laptop and from CI differ in anti-aliasing and font rendering, and those differences look like regressions.
- Use fixture data and a fixed user. Freeze the clock. Turn off animation and transitions. Wait for fonts to load and for a named element to appear, never for a fixed delay.
- Mask regions that change on their own, such as avatars from a CDN, relative times, and charts with random data. List every mask in `baselines/masks.md` with its reason, because a mask can hide a real regression.
- Capture everything twice. The pixel difference between the two runs is the noise floor. Record it in `baselines/noise.txt`. If it is above zero, find the cause before going further, because a non-zero floor usually means a timing problem that will cause false failures later.

A state that cannot be reached without a real payment, a destructive action, or production data is marked `not captured` with the reason. Never build a fake state to fill the grid. Surfaces with uncaptured states can still migrate, but the report lists those states as unverified.

Finish with `baselines/MANIFEST.sha256`, made by `shasum -a 256` over every baseline file. Build `scripts/capture-surface.mjs` (or the project's equivalent) during this phase, so that workers and verifiers capture the same way.

If there is no baseline for a surface, that surface does not get briefed.

## Parity modes

Pick one in `frame.md`. It decides what counts as an acceptable visual difference.

**exact.** The system reproduces the legacy look, and the migration only changes the code underneath. Any pixel difference above the noise floor fails.

**mapped.** The system changes how things look, on purpose. A difference passes only if a row in the surface's mapping file explains it. An example is text color moving from `#333` to `--color-text-default`, which renders `#1f2328`. Everything else must hold. Elements stay in the same order, nothing appears or disappears, text does not wrap or clip differently unless a mapped type change explains it, and the accessibility tree matches.

Most migrations are `mapped`. Use `exact` for a refactor onto a system built to match the current look.

## Visual diff rules

- Compare each after-capture to its baseline at the same state, viewport, and theme.
- In `exact` mode, fail on any difference above the noise floor.
- In `mapped` mode, the verifier lists each changed region with its bounding box and the mapping row that explains it. A region with no explaining row is `unexplained`. One unexplained region fails the surface, or sends it to a gate if the change might be intended.
- Layout shifts count. If a mapped spacing change moves an element, the mapping row must name that spacing value.
- Never raise the threshold, add a mask, or widen the noise floor during the run without a closed gate. Those are baseline edits by another name.

## Accessibility snapshot

The after-snapshot must match the baseline snapshot, with the same roles, accessible names, states, and order. A migration that turns a `div` with a click handler into a `button` is an improvement, and it is also a change to the tree. It goes to a gate, and once accepted, the gate's answer becomes the reference for that surface. Focus order and keyboard paths are checked under behavior.

## Behavior checks

Behavior is checked against the KEEP lines in the brief, one check per line. Use the surface's existing tests where they cover a line. For lines they do not cover, drive the running app and record what you saw.

- Requests. Count network calls for each action. One submit sends one request, and an invalid submit sends none.
- Validation timing. Errors appear on the same event as before (blur, submit, or change).
- Focus. Where focus goes after open, close, submit, error, and delete. Dialogs return focus to their opener.
- Keyboard. Every action on the surface can be reached and done without a pointer.
- Navigation. URLs, back button, and new-tab behavior on links.
- Failure. Entered values survive a failed request. Retry works.
- Loading. Pending states do not clear input or allow a double submit.

Record each check as pass, fail, or not run with a reason. "Not run" is not a pass.

## Design review

Run `design-review` on the after-captures with the system's own criteria, or the team's if they have them. Blocking findings fail the surface. Should-fix findings go in the verdict as notes. Anything the review hands to a person goes in the verdict as a question, and the coordinator turns it into a gate.

## Anti-tamper rules

Workers are under pressure to make checks pass. The cheapest way to pass a check is to change the check, so these rules are enforced by script, not by trust.

- `forbidden-paths.txt` in the run folder lists the globs no worker may touch. It must match standing order 2. The verifier runs `git diff --name-only <base>..<head>` against it before anything else. Any match fails the surface with verdict `failed`, and the report is flagged as a scope breach.
- The verifier checks `shasum -a 256 -c baselines/MANIFEST.sha256` before comparing. A mismatch stops all verification and writes a stop line to the coordinator's inbox, because the reference is now untrusted.
- Test files, snapshot files, harness config, and threshold settings are on the forbidden list. A test that should change because the contract changed goes through a gate.
- A worker who restructures markup only to dodge a diff, such as hiding an element or changing a role, fails even if the diff passes. The accessibility snapshot catches most of these.

## Verdict states

| Verdict | Means | Counts toward done |
|---|---|---|
| `verified` | Visual, accessibility, behavior, and review all pass at this commit | Yes |
| `needs-decision` | Checks ran, and a change needs a person's call | No. It opens a gate. |
| `failed` | A check failed or scope was breached | No. It gets a fix attempt. |
| `blocked` | The verifier could not run, such as a dead environment or a missing fixture | No. It is re-queued when the cause is fixed. |
| `checks-only` | Build, types, lint and tests ran, with no rendered check | No |

A verdict applies to one commit. Any new commit on the surface voids it.

## Verifier brief

Use the worker template with these fields.

```
SURFACE        <id> at commit <full sha>, base <sha>
OUTCOME        A verdict file for this commit.
MAY EDIT       <run>/verdicts/<surface>.<sha>.md and <run>/captures/<surface>/<sha>/ only
MUST NOT EDIT  everything else. You do not fix code.
INPUTS         the worker's brief and report, the diff, the mapping file,
               baselines for this surface, masks.md, noise.txt, parity mode
RUN            1. forbidden-path check  2. manifest check  3. check out the commit and start the app
               4. capture-surface.mjs into captures/  5. visual compare  6. accessibility compare
               7. KEEP checks  8. design-review
TIME LIMIT     <minutes>
REPORT         the verdict file below
```

Stop at the first failure in steps 1 or 2. For steps 5 to 8, run all of them and report everything you can prove, not only the first problem.

## Verdict file

```markdown
# Verdict: billing-invoices at 5be1c0a93f21

Verdict: verified
Verifier: model-b (worker was model-a)
Mode: mapped. Noise floor 0.

Scope check: pass (4 files, all under app/(product)/billing/invoices/)
Manifest: pass

| State | Viewport | Theme | Visual | Unexplained regions | Aria |
|---|---|---|---|---|---|
| list | 1280 | light | changed | 0 | match |
| list | 375 | dark | changed | 0 | match |
| error | 1280 | light | changed | 0 | match |

Explained changes: table header text color (mapping row 3), badge radius 4 to 6px (row 9).

Behavior: 6 of 6 KEEP lines pass. Evidence in captures/billing-invoices/5be1c0a93f21/behavior.md.
Design review: 0 blocking, 1 should-fix (empty-state illustration crops at 375, note only).
Questions for a person: none.
```

## Integration checks and the final sweep

After each landing, run the cheap checks at the new migration-branch commit, which are build, type check, lint, the inventory check, and the forbidden-path check on the landed diff. Record them as a `checks-only` row keyed by that commit. A failure stops landing until it is fixed.

Surface verdicts are keyed to surface branches. Once many surfaces have landed together, one surface can break another through shared CSS or a layout change. So Close recaptures every surface at the final integration commit and runs the visual and accessibility comparison again. Only verdicts at that commit count toward done. For long runs, also sweep at every tenth landing, so a cross-surface break is found near the change that caused it.
