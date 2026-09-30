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

A baseline records how each surface looked and behaved before any migration commit. Capture it once, during the Baselines phase, from the commit the shared layer will start on.

For each surface, capture every state in its `states` column at every width and theme in `frame.md`: a screenshot plus a `.probe.json` with the page's roles, names, states and contrast. When no build wrote the states module `.design-system/scripts/states.mjs`, the baseline agent writes it first (`build-design-system/references/browser.md`). For each surface that animates, also record its before animation lists (`browser.md`, Measuring motion) in `baselines/motion/<surface>.json`, because a motion swap is proven against them.

Make captures repeatable:

- Capture in the environment CI uses, with the same image, browser build and fonts. Laptop and CI screenshots differ in font rendering, which looks like a regression.
- Use fixture data, a fixed user and a frozen clock. Wait for fonts and a named element, never a fixed delay, and let animations finish rather than pausing them.
- Take a no-change control capture and diff it against the first. Regions that change with no code change are noise: dev overlays, random or seeded data, animation, clocks and relative times. Mask them, or capture a production build with fixed data, before calling any diff real. `build-design-system/references/browser.md` has the commands.
- List every mask in `baselines/masks.md` with its reason, because a mask can hide a real regression. Record the control diff in `baselines/noise.txt` as the noise floor. A floor above zero after masking usually means a timing problem, so find the cause before going further.

A state that needs a real payment, a destructive action or production data is marked `not captured` with the reason, never faked. The surface can still migrate, and the report lists that state as unverified.

Capture with `capture.mjs --kind before` over `.design-system/review/surfaces.tsv` (`browser.md` has the full command), the same command workers and verifiers use. The before PNGs stay in `.design-system/review/`. Finish with `baselines/MANIFEST.sha256`, from `shasum -a 256` over every before capture, each hashed by its path there.

### Trap measurements

Measure every trap's before state in the Baselines pass, because an edited surface has lost it. The traps are the ones `build-design-system/references/traps.md` lists for the components each surface uses. Measure each per "Measuring a loading state" in `build-design-system/references/browser.md`, and write one row per trap to `baselines/traps.tsv`:

```
surface	state	trap	element	before	unit	command
team-invite	loading	trap/loading-layout-shift	button[type=submit]	96x36 idle, 96x36 loading	px	measure the box idle, then with the request held
team-invite	close	trap/overlay-focus-return	dialog trigger	body	element	press Escape, then read document.activeElement
```

Reports and verdicts give the after number beside this row. A trap nobody measured before the edit is `before not measured`, never guessed. If a before state was missed, measure it from a second worktree at the base commit, with its own dependency install, and log that in `decisions.tsv`.

A surface with no baseline does not get briefed.

## Parity modes

Set in `frame.md`, it decides which visual differences are acceptable.

**exact.** The system reproduces the legacy look, and the migration only changes the code underneath. Any pixel difference above the noise floor fails. Use it for a refactor onto a system built to match the current look.

**mapped.** The system changes how things look, on purpose. A difference passes only if a row in the surface's mapping file explains it, such as text color moving from `#333` to `--color-text-default`, which renders `#1f2328`. Everything else holds. Elements keep their order, nothing appears or disappears, text does not wrap or clip differently unless a mapped type change explains it, and the accessibility tree matches apart from adds-only changes with a decision row. Most migrations are `mapped`.

## Visual diff rules

- Compare each after-capture to its baseline at the same state, width and theme.
- In `exact` mode, fail on any difference above the noise floor.
- In `mapped` mode, list each changed region with its bounding box and the mapping row that explains it. A region with no explaining row is `unexplained`. One unexplained region fails the surface, or sends it to a gate if the change might be intended.
- Layout shifts count. If a mapped spacing change moves an element, the mapping row must name that spacing value.
- Never raise the threshold, add a mask, or widen the noise floor during the run unless a gate that no longer reads `gate` allows it. Those are baseline edits by another name.
- An identical-value swap is proven per `build-design-system/references/run-record.md` (Terms), for one surface with `pixdiff.mjs <before dir> <after dir> --surface <name>` at tolerance 0 (`browser.md`, Compare after a change), or for a motion value with animation lists matching `baselines/motion/`. A changed motion value is a decision, shown by before and after animation lists, never by a still capture.

## Rendered checklist

A mapped diff can explain a region and still hide a regression inside it. The verifier runs each check at both widths against the baseline's `.probe.json` and writes the numbers in the verdict. Any fail blocks `verified` unless a mapping row names that exact change, except the nav and column check, which always gates.

- **Link cue.** For every `a[href]` in the main content, record computed `color` and `text-decoration-line`. A link now colored like body text with no underline has lost its cue.
- **Text overflow and word breaks at the narrow width.** Count elements where `scrollWidth > clientWidth`, and record the line count of every text element. A new overflow, or a line count that grew, fails. So does any new `overflow-wrap: anywhere` or `word-break: break-all` in the diff.
- **Container width at the narrow width.** Record `document.documentElement.scrollWidth` and the main container's width. Any growth fails, even on a page that already overflowed.
- **Nav links and table columns at the narrow width.** Record whether each nav link and table column header is visible and inside the viewport. One newly hidden, clipped or off screen is a behavior loss. It fails and becomes a gate, even when a mapping row names it.
- **Contrast on recolored text.** For every text element whose color or background changed, record the contrast before and after. Below the team's target fails. The default is WCAG AA, 4.5:1 for body text and 3:1 for large text. A drop that still passes goes in the behavior delta.

## Accessibility snapshot

The after-snapshot must match the baseline, with the same roles, accessible names, states and order. `montage.mjs --diff` lists every changed control, role, state and heading level from the two `.probe.json` files, and the verifier sorts each one by `build-design-system/references/traps.md` (Adds-only accessibility changes).

A clickable `div` that becomes a `button`, or a notice that gains `role="status"`, passes with its decision id in the verdict. A heading level change, a renamed control or a list that becomes a table is a gate. Focus order and keyboard paths are checked under behavior.

## Behavior checks

Check behavior against the brief's KEEP lines, one check per line. Use the surface's existing tests where they cover a line. For the rest, drive the running app and record what you saw.

- Requests. Count network calls per action. One submit sends one request, and an invalid submit sends none.
- Validation timing. Errors appear on the same event as before (blur, submit or change).
- Focus. Where focus goes after open, close, submit, error and delete. Dialogs return focus to their opener.
- Keyboard. Every action on the surface works without a pointer.
- Navigation. URLs, the back button, and new-tab behavior on links.
- Failure. Entered values survive a failed request, and retry works.
- Loading. Pending states do not clear input or allow a double submit. The control keeps its label, its box and its focus, with a spinner inside and `aria-busy`, per the one pending fix (`build-design-system/references/component-contract.md`, Variants and states, for `trap/loading-label-swap` and `trap/loading-layout-shift`).

Record each as pass, fail, or not run with a reason. "Not run" is not a pass.

## Behavior delta

The delta catches side effects no KEEP line lists. For every state in the surface's `states` column, compare the baseline `.probe.json` with the same probe at the commit: which controls exist, which are enabled, what text shows, which requests the primary action fires, and the contrast of recolored text. Write each difference as one line with both values, such as `settings/default: Save enabled -> disabled until a field changes` or `signup/success: "Invite sent." 7.0:1 -> 4.56:1`. Write `none` only with the probe command beside it.

A difference that breaks a KEEP line fails the surface. Any other difference is disclosed, not failed. It goes in the verdict, the ledger's `delta` column, the surface's montage row and the final message.

## Design review

Run `ui-review` on the after-captures with the system's own criteria, or the team's. A `blocking` finding the migration introduced fails the surface. A `blocking` finding already present in the baseline becomes a gate and a found-not-fixed row, and the surface can still verify. `should-fix` and `note` findings go in the verdict and on the found-not-fixed list. Anything the review hands to a person goes in the verdict as a question, and the coordinator turns it into a gate.

## Anti-tamper rules

A worker can pass any check by editing it, so scripts enforce these rules.

- `forbidden-paths.txt` in the run folder lists the globs no worker may touch, matching the do-not-edit standing order. The verifier runs the scope check (`references/inventory.md`, The check commands) before anything else. Any match fails the surface with verdict `failed`, flagged as a scope breach.
- The verifier runs `shasum -a 256 -c baselines/MANIFEST.sha256` before comparing. A mismatch stops all verification and writes a stop line to the coordinator's inbox, because the reference is now untrusted.
- Test files, snapshots, harness config and threshold settings are on the forbidden list. A test that should change because the contract changed goes through a gate.
- A worker who restructures markup only to dodge a diff, such as hiding an element or changing a role, fails even if the diff passes. The accessibility snapshot catches most of these.

## Verdict states

| Verdict | Means | Counts toward done |
|---|---|---|
| `verified` | Visual, accessibility, behavior and review all pass at this commit | Yes |
| `needs-decision` | Checks ran, and a change needs a person's call | No. It opens a gate. |
| `failed` | A check failed or scope was breached | No. It gets a fix attempt. |
| `blocked` | The verifier could not run, such as a dead environment or a missing fixture | No. It is re-queued when the cause is fixed. |
| `self-verified` | Every check passed, run by the coordinator after the fresh-context re-read below, on a host without subagents | Yes, listed separately in the final report |
| `checks-only` | Build, types, lint and tests ran with no rendered check, or only the writer checked it on a host that has subagents | No |
| `reopened` | A later commit touched this surface's paths | No. It needs a new verdict at the final integration commit. |

A verdict applies to one commit. A later commit that touches any of the surface's `paths` reopens it, whoever wrote it, and the coordinator appends a `reopened` ledger row naming that commit.

A decision row never replaces the verifier. When budget is short, the surface stays `checks-only` and counts as unverified. When budget remains at close, spend it on verifiers for every `checks-only`, `self-verified` and `reopened` surface before declaring done.

## Verifier brief

Use the worker template with these fields.

```
SURFACE        <id> at commit <full sha>, base <sha>
OUTCOME        A verdict for this commit, returned as text, starting with the Verdict and Commit lines.
MAY EDIT       <run>/captures/<surface>/<sha>/ only: captures, probe files, behavior evidence
MUST NOT EDIT  everything else. You do not fix code.
INPUTS         the worker's brief and report, the diff, the mapping file,
               baselines for this surface, masks.md, noise.txt, parity mode
RUN            1. forbidden-path check  2. manifest check  3. check out the commit and start the app
               4. capture.mjs --kind after into captures/  5. visual compare
               6. rendered checklist: link cue, overflow and word breaks, container width,
                  nav links and table columns, contrast on recolored text
               7. accessibility compare, sorting adds-only from gates  8. KEEP checks and behavior delta
               9. ui-review
SERVER         your own dev server in your own worktree on port <base + verifier n>, stopped before
               you return, because you check out the surface commit (the verifier exception in
               build-design-system/references/coordinator-path.md, Dev server and retries)
TIME LIMIT     <minutes>
REPORT         return the verdict below as your final message. Write it to no file.
               The coordinator saves its status lines and file list
               to verdicts/<surface>.<sha>.md.
```

Stop at the first failure in steps 1 or 2. For steps 5 to 9, run all of them and report everything you can prove, not only the first problem.

## Self-verification without subagents

A host that cannot start a second agent still owes every surface a check by something other than the pass that wrote it. Only there may the coordinator verify, after a fresh-context re-read. Record `no subagents: self-verified` in `decisions.tsv` once. A host with subagents never uses this path.

1. Finish and commit every edit to the surface. Write the full sha in the verdict first.
2. Start a new session or clear context if the host allows it. Otherwise every line of the verdict cites a file or a command run after step 1, nothing from memory.
3. Reread from disk, cold: the brief's KEEP lines, the mapping file, the baseline captures and their `.probe.json` files, then `git diff <base>..<sha> -- <surface paths>` top to bottom.
4. Run the verifier brief's steps 1 to 9 in order and write each result as you go.
5. Write the verdict with `Verdict: self-verified` and `Verifier: coordinator, fresh-context re-read`.

## Verdict format

```markdown
Verdict: verified
Commit: 5be1c0a93f21
Surface: billing-invoices
Verifier: model-b (worker was model-a)
Mode: mapped. Noise floor 0.

Scope check: pass (4 files, all under app/billing/invoices/)
Manifest: pass

| State | Width | Theme | Visual | Unexplained regions | Aria |
|---|---|---|---|---|---|
| list | wide | light | changed | 0 | adds only: table caption (D-07) |
| list | narrow | dark | changed | 0 | adds only: table caption (D-07) |
| error | wide | light | changed | 0 | match |

Explained changes: table header text color (mapping row 3), badge radius 4 to 6px (row 9).
Rendered: 14 of 14 links keep a cue. Narrow: 0 new overflows, 0 line counts grew, widths unchanged. Recolored text: lowest 4.9:1.

Behavior: 6 of 6 KEEP lines pass. Evidence in captures/billing-invoices/5be1c0a93f21/behavior.md.
Behavior delta: list/wide: "Paid" badge 7.1:1 -> 4.9:1. Probe: the `.probe.json` files in captures/billing-invoices/5be1c0a93f21/.
Design review: 0 blocking, 1 should-fix (note only).
Questions for a person: none.
```

## Integration checks, runtime checks and the final sweep

After each landing, run the cheap checks at the new run-branch commit: build, type check, lint, the inventory check, the system's own check, the forbidden-path check on the landed diff, and the runtime checks below. Run each from the repo's `scripts/` (`node scripts/migration-inventory.mjs --check`, `node scripts/check-system.mjs`, `node scripts/check-spec.mjs`), never from `.design-system/` or a skill folder, so the same commands pass on a clean clone. Run any code generation the type check depends on first. Record the result as a `checks-only` row keyed by that commit. A failure stops landing until it is fixed.

Runtime checks. After any edit to a UI file or tokens, `capture.mjs --status` must show 200 on every route, because a type check misses breaks that only show when a route renders. After an edit to global styles or tokens, restart the dev server before any after-capture and confirm the served CSS has one new rule, because dev servers can serve stale CSS. The commands and stack-specific cases are in `build-design-system/references/browser.md`.

After each landing, capture the surface, add its `traces.tsv` row and rerun the montage, per `build-design-system/references/coordinator-path.md` (Surfaces on the run branch). A surface with a visible change and no trace row does not count as landed. A montage warning on an open gate goes into `close.md`.

Once many surfaces have landed together, one can break another through shared CSS or a layout change. So Close recaptures every surface at the final integration commit and reruns the visual comparison, the rendered checklist and the accessibility comparison. Only verdicts at that commit count toward done, and every `reopened` row needs one. On long runs, also sweep every few landings (default every tenth), so a cross-surface break shows up near the change that caused it.
