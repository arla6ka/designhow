# Verification

A surface is migrated when a verifier has checked the running app at a named commit and written a verdict. A type check, a green CI run, or a worker saying "done" are inputs to that verdict. None of them is the verdict.

## Contents

- Baselines
- Parity modes
- Visual diff rules
- Rendered checklist
- Accessibility snapshot
- Behavior checks
- Behavior delta
- Design review
- Anti-tamper rules
- Verdict states
- Verifier brief
- Self-verification without subagents
- Verdict format
- Integration checks, runtime checks and the final sweep

## Baselines

A baseline is the record of how each surface looked and behaved before any migration commit. Capture it once, during the Baselines phase, from the commit the shared layer will start on.

For each surface, capture every state in its `states` column at every viewport and theme in `frame.md`. Each capture is a screenshot plus a `.probe.json` beside it with the page's roles, names, states and contrast. File names follow `capture.mjs --help`.

Make captures repeatable:

- Capture in the environment CI uses, the same container image, browser build, and fonts. Screenshots from a laptop and from CI differ in anti-aliasing and font rendering, and those differences look like regressions.
- Use fixture data and a fixed user. Freeze the clock. Let animations finish and never pause them (`build-design-system/references/browser.md`). Wait for fonts to load and for a named element to appear, never for a fixed delay.
- Mask regions that change on their own, such as avatars from a CDN, relative times, and charts with random data. List every mask in `baselines/masks.md` with its reason, because a mask can hide a real regression.
- Capture everything twice. The pixel difference between the two runs is the noise floor. Record it in `baselines/noise.txt`. If it is above zero, find the cause before going further, because a non-zero floor usually means a timing problem that will cause false failures later.

A state that cannot be reached without a real payment, a destructive action, or production data is marked `not captured` with the reason. Never build a fake state to fill the grid. Surfaces with uncaptured states can still migrate, but the report lists those states as unverified.

Capture with `node <skills>/build-design-system/scripts/capture.mjs --kind before --out .design-system/review --surfaces .design-system/review/surfaces.tsv --widths 390,1280`, which writes a `.probe.json` beside each capture with the numbers the rendered checklist and behavior delta compare. Workers and verifiers use the same command. Finish with `baselines/MANIFEST.sha256`, made by `shasum -a 256` over every before capture. When workers run in parallel, each uses its own browser session and dev server port, per `build-design-system/references/browser.md`.

### Trap measurements

Measure every trap's before state in the Baselines pass, before any edit, and save the numbers. Once a surface is edited, its before state is gone. The traps are the ones `build-design-system/references/traps.md` lists for the components each surface uses, such as a loading button's box, focus after a dialog closes, or a select's value after an error. Measure each one per "Evidence for a review" in `build-design-system/references/browser.md`, which has the loading-state recipe, and write one row per trap to `baselines/traps.tsv`:

```
surface	state	trap	element	before	unit	command
team-invite	loading	loading-layout-shift	button[type=submit]	96x36 idle, 243x36 loading	px	eval getBoundingClientRect() idle, then with the request held
team-invite	close	focus-return	dialog trigger	body	element	press Escape, then eval document.activeElement
```

A worker's report and the verifier's verdict give the after number beside this row. A trap nobody measured before the edit is reported as `before not measured`, never guessed. If a before state was missed, measure it from a second worktree at the base commit, with an APFS or reflink clone of `node_modules` (`cp -cR` on macOS), since Turbopack refuses a symlinked `node_modules` that points outside the worktree.

If there is no baseline for a surface, that surface does not get briefed.

## Parity modes

Pick one in `frame.md`. It decides what counts as an acceptable visual difference.

**exact.** The system reproduces the legacy look, and the migration only changes the code underneath. Any pixel difference above the noise floor fails.

**mapped.** The system changes how things look, on purpose. A difference passes only if a row in the surface's mapping file explains it. An example is text color moving from `#333` to `--color-text-default`, which renders `#1f2328`. Everything else must hold. Elements stay in the same order, nothing appears or disappears, text does not wrap or clip differently unless a mapped type change explains it, and the accessibility tree matches, apart from changes that only add semantics, each with a decision row.

Most migrations are `mapped`. Use `exact` for a refactor onto a system built to match the current look.

## Visual diff rules

- Compare each after-capture to its baseline at the same state, viewport, and theme.
- In `exact` mode, fail on any difference above the noise floor.
- In `mapped` mode, the verifier lists each changed region with its bounding box and the mapping row that explains it. A region with no explaining row is `unexplained`. One unexplained region fails the surface, or sends it to a gate if the change might be intended.
- Layout shifts count. If a mapped spacing change moves an element, the mapping row must name that spacing value.
- Never raise the threshold, add a mask, or widen the noise floor during the run without a closed gate. Those are baseline edits by another name.

## Rendered checklist

A mapped diff can explain a region and still hide a regression inside it. The verifier runs each check below at 390 and 1280, compares against the baseline's `.probe.json`, and writes the numbers in the verdict. Any fail blocks `verified` unless a mapping row names that exact change, except the nav and column check, which always gates.

- **Link cue after a class swap.** For every `a[href]` in the main content, record computed `color` and `text-decoration-line`. A link whose color now equals the body text color with no underline has lost its cue.
- **Text overflow and word breaks at 390.** Count elements where `scrollWidth > clientWidth`, and record the line count (height over line-height) of every text element. A new overflow, or a line count that grew, fails. So does any new `overflow-wrap: anywhere` or `word-break: break-all` in the diff.
- **Page container width at 390.** Record `document.documentElement.scrollWidth` and the main container's `getBoundingClientRect().width`. Any growth fails, even when the page already overflowed.
- **Nav links and table columns at 390.** Record every nav link and table column header, and whether each is visible and inside the viewport. One that is newly hidden, clipped or off screen is a behavior loss. It fails and becomes a gate, even when a mapping row names it, and is never changed silently.
- **Contrast on recolored text.** For every text element whose computed color or background changed, record the contrast ratio before and after. Below 4.5:1 (3:1 for large text) fails. A drop that still passes goes in the behavior delta.

## Accessibility snapshot

The after-snapshot must match the baseline snapshot, with the same roles, accessible names, states, and order. `montage.mjs --diff` lists every changed control, role, state and heading level from the two `.probe.json` files, and the verifier sorts each one.

Accessibility-tree changes sort by `build-design-system/references/traps.md` (Adds-only accessibility changes).

So a `div` with a click handler that becomes a `button` passes with its decision id in the verdict, and so does a success notice that gains `role="status"`. A heading level that moves from h3 to h2, a name that changes text, or a list that becomes a table is a gate. Focus order and keyboard paths are checked under behavior.

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

## Behavior delta

KEEP lines only cover what someone thought to write down. The delta catches side effects nobody listed. For every state in the surface's `states` column, compare the baseline `.probe.json` with the same probe at the commit: which controls exist, which are enabled or disabled, what text shows, which requests fire on the primary action, and the contrast of recolored text. Write each difference as one line with both values, such as `settings/default: Save enabled -> disabled until a field changes` or `signup/success: "Invite sent." 7.0:1 -> 4.56:1`. Write `none` only with the probe command beside it.

A difference that breaks a KEEP line fails the surface. Any other difference is disclosed, not failed: it goes in the verdict, the ledger's `delta` column, the surface's montage row, and the final message.

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
| `self-verified` | Every check above passed, run by the coordinator after the fresh-context re-read below, on a host without subagents | Yes, and the final report lists these surfaces separately |
| `checks-only` | Build, types, lint and tests ran, with no rendered check, or no agent other than the writer checked it on a host that has subagents | No |
| `reopened` | A later commit touched this surface's paths | No. It needs a new verdict at the final integration commit. |

A verdict applies to one commit. A later commit that touches any path in the surface's `paths` column in `surfaces.tsv` reopens the row, whoever wrote it, shared fixes and review fixes included. The coordinator appends a `reopened` ledger row naming that commit.

A decision row never replaces the verifier. When budget is short, the surface stays `checks-only` and the report counts it as unverified. When budget remains at close, spend it on verifiers for every `checks-only`, `self-verified` and `reopened` surface before declaring done.

## Verifier brief

Use the worker template with these fields.

```
SURFACE        <id> at commit <full sha>, base <sha>
OUTCOME        A verdict for this commit, returned as text.
MAY EDIT       <run>/captures/<surface>/<sha>/ only: captures, probe files, behavior evidence
MUST NOT EDIT  everything else. You do not fix code.
INPUTS         the worker's brief and report, the diff, the mapping file,
               baselines for this surface, masks.md, noise.txt, parity mode
RUN            1. forbidden-path check  2. manifest check  3. check out the commit and start the app
               4. capture.mjs --kind after into captures/  5. visual compare
               6. rendered checklist: link cue, 390 overflow and word breaks, 390 container width,
                  nav links and table columns at 390, contrast on recolored text
               7. accessibility compare, sorting adds-only from gates  8. KEEP checks and behavior delta
               9. design-review
SERVER         your own dev server on port <base + verifier n>, stopped before you return
TIME LIMIT     <minutes>
REPORT         return the verdict below as your final message. Write it to no file.
               The coordinator saves its status lines and file list
               to verdicts/<surface>.<sha>.md.
```

Stop at the first failure in steps 1 or 2. For steps 5 to 9, run all of them and report everything you can prove, not only the first problem.

## Self-verification without subagents

A host that cannot start a second agent still owes every surface a check by something other than the pass that wrote it. The coordinator may verify only after a fresh-context re-read, and only on such a host. Record `no subagents: self-verified` in `decisions.tsv` once. A host with subagents never uses this path.

1. Finish every edit to the surface and commit it. Write the full sha in the verdict first.
2. Start a new session or clear context if the host allows it. Otherwise, put nothing from memory into the verdict. Every line cites a file or a command run after step 1.
3. Reread from disk, cold: the brief's KEEP lines, the mapping file, the baseline captures and their `.probe.json` files, then `git diff <base>..<sha> -- <surface paths>` top to bottom.
4. Run the verifier brief's steps 1 to 9 in order and write each result as you go.
5. Write the verdict with `Verdict: self-verified` and `Verifier: coordinator, fresh-context re-read`.

## Verdict format

```markdown
# Verdict: billing-invoices at 5be1c0a93f21

Verdict: verified
Verifier: model-b (worker was model-a)
Mode: mapped. Noise floor 0.

Scope check: pass (4 files, all under app/(product)/billing/invoices/)
Manifest: pass

| State | Viewport | Theme | Visual | Unexplained regions | Aria |
|---|---|---|---|---|---|
| list | 1280 | light | changed | 0 | adds only: table caption (D-07) |
| list | 390 | dark | changed | 0 | adds only: table caption (D-07) |
| error | 1280 | light | changed | 0 | match |

Explained changes: table header text color (mapping row 3), badge radius 4 to 6px (row 9).
Rendered: 14 of 14 links keep a cue. At 390, 0 new overflows, 0 line counts grew, scrollWidth 390 to 390, main 358 to 358. Recolored text: 3 elements, lowest 4.9:1.

Behavior: 6 of 6 KEEP lines pass. Evidence in captures/billing-invoices/5be1c0a93f21/behavior.md.
Behavior delta: list/1280: "Paid" badge 7.1:1 -> 4.9:1. No control changed enabled state. Probe: the `.probe.json` files in .design-system/review/ and captures/billing-invoices/5be1c0a93f21/.
Design review: 0 blocking, 1 should-fix (empty-state illustration crops at 390, note only).
Questions for a person: none.
```

## Integration checks, runtime checks and the final sweep

After each landing, run the cheap checks at the new run-branch commit, which are build, type check, lint, the inventory check, the system's own check, the forbidden-path check on the landed diff, and the runtime checks below. Run each from the repo's `scripts/` (`node scripts/migration-inventory.mjs --check`, `node scripts/check-system.mjs`, `node scripts/check-spec.mjs`), never from `.design-system/` or a skill folder, so the same commands pass on a clean clone. On Next 16, run `next typegen` before the type check. Record them as a `checks-only` row keyed by that commit. A failure stops landing until it is fixed.

Runtime checks. After any edit to a ui file or tokens, `node <skills>/build-design-system/scripts/capture.mjs --base <url> --status --surfaces .design-system/review/surfaces.tsv` must show 200 on every route. tsc misses server and client breaks. A handler passed into a Server Component type-checks and returns 500. After edits to `@theme` or global CSS, restart the dev server before any after-capture, because Turbopack can serve stale CSS, then grep the served CSS for one new utility.

After each landing, capture the surface with `capture.mjs --kind after --out .design-system/review`, add its row to `.design-system/review/traces.tsv` (surface, commit, gate or decision ids, what changed and the behavior delta), and rerun `montage.mjs --diff`. A surface with a visible change and no trace row fails the montage and does not count as landed. A finding that waits on a gate, such as a contrast drop the system owner has to fix, is a warning once `.design-system/review/open-gates.tsv` has its row and the trace row names the gate. The montage exits 0 and lists it, and close.md copies the list.

Surface verdicts are keyed to surface branches. Once many surfaces have landed together, one surface can break another through shared CSS or a layout change. So Close recaptures every surface at the final integration commit and runs the visual comparison, the rendered checklist and the accessibility comparison again. Only verdicts at that commit count toward done, and every `reopened` row needs one. For long runs, also sweep at every tenth landing, so a cross-surface break is found near the change that caused it.
