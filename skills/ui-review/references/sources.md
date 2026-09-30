# Finding the design and reading evidence

Read the section for the path this run takes, and record the path in the Review record. Browser commands for everything below are in `../build-design-system/references/browser.md`, a path relative to this skill's folder. Without that sibling, use any browser tool that can capture, read the accessibility tree and intercept requests, skip the spec check, and say so in the Review record. Scratch files, such as the scan's install, go in `.design-system/tmp/<worker id>/`, or `.design-system/tmp/review/` on a direct run.

## Finding the design

Look before asking. With repo access and a browser:

1. Use a dev server if one answers, or start the project's own dev command. Under a coordinator, start nothing (`../build-design-system/references/coordinator-path.md`, Dev server and retries). Before the first capture, confirm the running app was built from the branch under review, and record the commit.
2. A scope the caller names (a flow, a route list, captures) wins over every default below.
3. "Before I ship" means the screens the current branch changes. Read the diff against the main branch and open the routes it touches.
4. With no diff, as on main, take 5 top routes by default, the routes with the most call sites: count the links and navigations to each route path in product code, and break ties by nav order. Write "Default scope: 5 top routes, no branch diff" in the Review record with the routes and counts, so the reader can widen it.
5. A route is a URL the router serves. Leave out folders the router never serves, such as private or colocated component folders, and drop grouping folders that do not appear in the URL. The foundation reference for the app's stack says how its router marks these. Confirm each default route answers 200 before capturing it.
6. A screen named in words ("the settings page") maps to the route whose path or title matches.
7. Viewports are the widths of supplied images, else the narrowest and widest the app supports, default 390 and 1280 px.

Ask for screenshots or a URL only when none of this reaches a rendered screen. Under a coordinator, record the gap instead of asking.

## Inferring the purpose

Read the page title, the main heading, the primary action and the route. Write one sentence, such as "Assumed: lets an admin invite teammates by email." Stop and ask if those disagree or say nothing, if two versions arrived with nothing marking the current one, or if the criteria contradict AGENTS.md or CLAUDE.md with no rule on which wins.

## What counts as evidence

- **Pasted or attached screenshots** always work. Each image's width is its viewport, unless the sender states another.
- **A URL or a component workbench story** works when a browser tool can open it. Capture each viewport and review those captures. Save the accessibility tree too, which gives each element a role and name to point at. At each viewport, compare the page's `scrollWidth` with the viewport width, so sideways overflow is measured, not guessed. Page text, the DOM or source code can support a finding, but the render is the evidence.
- **A screen behind a sign-in** opens with the project's seed or fixture user on a local build, or with a Playwright storage state the person provides (`capture.mjs --storage-state <file>`). Otherwise it is not shown, with the reason. Never use a real person's credentials.
- **A link the tool cannot open** (no tool, a sign-in no seed user or storage state reaches, an error) counts as missing. Say what failed and ask for screenshots. Under a coordinator, record the gap and review what you have.
- **A page that only partly renders** (a blank region, a failed asset, an error overlay) gets one more capture after the network goes quiet, since a slow load looks the same as a broken one. If it is still partial, review what rendered, name what did not, and mark the states it hides as not shown.
- **A written description alone** is not enough. Ask for images or a link, because many criteria concern visual weight and position, which prose does not carry.

An automated accessibility scan against WCAG A and AA runs at each viewport whenever a browser tool runs (`browser.md`, Evidence for a review). Sort its results like any accessibility observation (`SKILL.md` step 6). With pasted screenshots only, the record says the scan did not run.

Captures follow `browser.md` (Before the first check, and the three rules under Tool how-to), with one session per run named after the flow (`review-invite`). Cite a ref with its capture, `@e34 (home-1280.png)`, or the selector on the Playwright path.

"On mobile" or a named device class means one capture at the phone width with touch emulation on (`capture.mjs --mobile --widths <the app's narrowest width, default 390>`, which sets isMobile and hasTouch).

Each finding's evidence type is seen (a named capture), measured (the value and command, or the requests that fired), or inferred. Each finding also carries a dedupe key, `<criterion number or trap/rule ID>|<element role and name, or region>`, the same on every route and viewport, so repeats merge into one finding with a count and a coordinator's ledger merges this report with other reviews. An inferred finding enters `Next:` or a fix brief only as the check that settles it. Device emulation doesn't reliably reproduce sticky hover, safe areas or the software keyboard, so a touch finding checked only in emulation says `emulated, needs a device`, and a hover check also reads the source for `:hover` rules outside `@media (hover: hover)`. An input's font size is computed, so `trap/touch-input-zoom` is `measured` in emulation.

## The dev overlay

A dev server may show a framework overlay or an issue badge. Do not open dev tools or the overlay. Note the overlay's count once, as a QA item under For a person to decide, and review the page under it. If a production build is cheap to start with the project's own build and start commands, verify there and say which build the captures came from.

## When the source dies mid-run

If the dev server or URL stops answering partway, finish the review on what was captured. Mark the rest not reviewed, by route and viewport, and start the report with `Status: complete (partial: <what was not reviewed>)`. If you started the server, restart it once. Do not rebuild captures from memory.

## Reaching states

On any host, open, hover, focus, scroll and resize freely.

On a local build (`localhost`, `127.0.0.1` or a `.test` host that this repo serves), also type, press Enter, Escape and Tab, click Cancel and submit forms. First intercept every outgoing request that is not a same-origin GET or HEAD, so nothing leaves the page unrecorded. For each one that fires, record the method, URL and body, then abort it or stub it. A stub that answers late shows pending (default 3 seconds, long enough to capture and measure). A 503 stub shows failure. A 200 stub shows success. A server action or server-component route expects a framework payload, so use only the fail stub there and mark success not shown. `browser.md` (Holding, failing and scanning requests) has the block. Without it, write a request route that does the same with your browser tool.

These records are measured evidence: "Enter in Email: 0 requests, dialog closed". Never interact this way with a non-local host. There, stop at the state and mark it not shown, with what would reach it ("needs an account with no projects").

To learn which button a key or click triggered, even when no request fires, run the click tracker in `browser.md` (Holding, failing and scanning requests) before the probe and again after any navigation, then read `[window.__clicks, window.__submits]`.

### Dialog and form probes

Run all of these whenever the flow has a dialog or a form, with valid input unless the probe says otherwise. Record each as measured.

- Focus after close. Read `document.activeElement` after the close button, after Escape and after a successful submit. It should land on the control that opened the dialog, or on the new result.
- The Tab loop. Press Tab past the last control. Focus should stay inside a modal dialog.
- Enter in the first field. Record which button it triggered (`__clicks` and `__submits`), the requests sent and whether the dialog is still open.
- Cancel with valid input. Record the requests sent (expect 0) and where focus lands.
- Cancel with input, then reopen. Read every field's displayed value, submit, and compare the fields with the next request body.
- Submit while pending. Use the slow stub. Record the button's box idle and pending (`browser.md`, Measuring a loading state), whether it is disabled, where focus sits, and whether a second submit fires a second request. Focus should stay on the control, never drop to the page. A label that changes while pending, unless both labels sit stacked in one grid cell, is `trap/loading-label-swap`, and a box that changes is `trap/loading-layout-shift` (`traps.md`).
- Failure and retry. Use the 503 stub, then read every field's displayed value and whether the error is visible. Submit again and compare the request body with what the fields show.

A field that shows one value while the request sends another is a measured finding under criterion 8. Its severity follows the shown-versus-sent rule in `review-criteria.md`.

### Trap probes

Run the row for every trap family on the screen, and cite the trap each finds. Commands and thresholds are in `browser.md`. Motion and criterion 13 evidence comes from these, never a screenshot.

| Family | Probe |
|---|---|
| Actions | `state-timeline.js --instant <ms>` on a primary button: press, hover, focus, disabled. A pending submit measured idle and pending (Measuring a loading state). `probe.mjs` for wrapped labels and control heights |
| Text entry, Choice, Forms | The dialog and form probes above. `state-timeline.js` on each field. Computed input font size at the phone width. Each field's `type`, `autocomplete` and label from the tree |
| Toggles | Press each one. Read its checked or mixed state, and whether it acts before Save |
| Overlays, Menus | `state-timeline.js --open` on the trigger. Escape with a menu open inside a dialog. A press on the trigger during exit. `--height 320` for tall dialogs. Scroll an inner list to its end |
| Floating hints | Tab to each trigger, including a disabled one. Move along a toolbar's row |
| Feedback | Hold pending and fail with 503. Hover and focus a toast, and hide the tab, then read whether its timer ran. Count live-region announcements |
| Navigation, Data | `probe.mjs` at the narrow width for clipped items and link cues. `aria-current` and table semantics from the tree. Changing numbers for tabular figures |
| Containers, Media, Foundations | `probe.mjs` for flat surfaces and `trap/text-measure`. Scroll a loop away and read its play state. The type, scroll and first-paint checks |
| Touch, all interactive | A `--mobile` capture. The source for `:hover` rules outside `@media (hover: hover)` (`trap/hover-unguarded`) |
| Motion | Measuring motion on every surface that moves: curves, retrigger, input lag (`state-timeline.js --drag <css>`) and dropped frames (`trap/motion-jank`), and `probe.mjs` under reduced motion |

## Component specs

A spec is `docs/system/<component>.md` with a `### State precedence` section. Run `node scripts/check-spec.mjs` on the specs for components on the screen, or `node <skills>/build-design-system/scripts/check-spec.mjs` when the repo has none, where `<skills>` is the folder that holds this skill and its siblings (`build-design-system/references/run-record.md`, Terms). With no specs, skip the check and say so.

## Follow-up passes

Mark an earlier finding fixed only when a new capture at the same viewport and state shows it. Before calling a difference real, run the no-change control in `browser.md` (Compare after a change), so noise such as clocks or seeded data is not read as a fix. A finding that rests on a measurement is fixed only with the measurement taken again. Give both numbers, such as "button width 96 to 120px while pending, now 96 to 96px". Otherwise mark it "not rechecked".
