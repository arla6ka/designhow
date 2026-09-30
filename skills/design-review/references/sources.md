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

Ask for screenshots or a URL only when none of this reaches a rendered screen. Under a coordinator, record the gap instead of asking.

## Inferring the purpose

Read the page title, the main heading, the primary action and the route. Write one sentence, such as "Assumed: lets an admin invite teammates by email." If those disagree with each other or say nothing, stop and ask.

## What counts as evidence

- **Pasted or attached screenshots** always work. Each image's width is its viewport, unless the sender states another.
- **A URL or a component workbench story** works when a browser tool can open it. Capture each viewport and review those captures. Save the accessibility tree too, which gives each element a role and name to point at. At each viewport, compare the page's `scrollWidth` with the viewport width, so sideways overflow is measured, not guessed. Page text, the DOM or source code can support a finding, but the render is the evidence.
- **A screen behind a sign-in** opens with the project's seed or fixture user on a local build, or with a Playwright storage state the person provides (`capture.mjs --storage-state <file>`). Otherwise it is not shown, with the reason. Never use a real person's credentials.
- **A link the tool cannot open** (no tool, a sign-in no seed user or storage state reaches, an error) counts as missing. Say what failed and ask for screenshots. Under a coordinator, record the gap and review what you have.
- **A page that only partly renders** (a blank region, a failed asset, an error overlay) gets one more capture after the network goes quiet, since a slow load looks the same as a broken one. If it is still partial, review what rendered, name what did not, and mark the states it hides as not shown.
- **A written description alone** is not enough. Ask for images or a link, because many criteria concern visual weight and position, which prose does not carry.

An automated accessibility scan against WCAG A and AA runs at each viewport whenever a browser tool runs (`browser.md`, Evidence for a review). Sort its results like any accessibility observation (`SKILL.md` step 6). With pasted screenshots only, the record says the scan did not run.

Captures follow the three rules in `browser.md`: absolute paths, every command spelled out, and one session per run, named after the flow (`review-invite`) so parallel runs never share a browser. A sweep of more than 5 routes runs headless through `capture.mjs`, since a shared browser pane is for showing the person. Reset any emulation you set and close your tab at the end. A hover check run in a background tab is recorded as `hover not verified`. Stop any wait loop when its server stops. Refs number across a whole session, so a ref is valid only with the capture it came from. Cite it that way: `@e34 (home-1280.png)`. On the Playwright path, cite the selector where agent-browser would cite a ref.

"On mobile" or a named device class means one capture at the phone width with touch emulation on (`capture.mjs --mobile --widths <the app's narrowest width, default 390>`, which sets isMobile and hasTouch).

Each finding's evidence type is seen (a named capture), measured (the value and command, or the requests that fired), or inferred. Each finding also carries a dedupe key, `<criterion number or trap/rule ID>|<element role and name, or region>`, the same on every route and viewport, so repeats merge into one finding with a count and a coordinator's ledger merges this report with other reviews. An inferred finding enters `Next:` or a fix brief only as the check that settles it. Device emulation doesn't reliably reproduce sticky hover, safe areas or the software keyboard, so a touch finding checked only in emulation says `emulated, needs a device`, and a hover check also reads the source for `:hover` rules outside `@media (hover: hover)`. An input's font size is computed, so `trap/touch-input-zoom` is `measured` in emulation.

## The dev overlay

A dev server may show a framework overlay or an issue badge. Do not open dev tools or the overlay. Note the overlay's count once, as a QA item under For a person to decide, and review the page under it. If a production build is cheap to start with the project's own build and start commands, verify there and say which build the captures came from.

## When the source dies mid-run

If the dev server or URL stops answering partway, finish the review on what was captured. Mark the rest not reviewed, by route and viewport, and start the report with `Status: complete (partial: <what was not reviewed>)`. If you started the server, restart it once. Do not rebuild captures from memory.

## Reaching states

On any host, open, hover, focus, scroll and resize freely.

On a local build (`localhost`, `127.0.0.1` or a `.test` host that this repo serves), also type, press Enter, Escape and Tab, click Cancel and submit forms. First intercept every outgoing request that is not a same-origin GET or HEAD, so nothing leaves the page unrecorded. For each one that fires, record the method, URL and body, then abort it or stub it. A stub that answers late shows pending (default 3 seconds, long enough to capture and measure). A 503 stub shows failure. A 200 stub shows success. A server action or server-component route expects a framework payload, so use only the fail stub there and mark success not shown. `browser.md` (Holding, failing and scanning requests) has the full block. Without it, this Playwright hold records every request, answers after 3 seconds, and fails with 503 (change the status for success):

```js
const sent = []; // run after the page loads, before the first interaction
await page.route('**/*', async (r) => { const q = r.request(); if (['GET', 'HEAD'].includes(q.method()) && new URL(q.url()).origin === new URL(page.url()).origin) return r.continue();
  sent.push({ method: q.method(), url: q.url(), body: q.postData() }); await new Promise((w) => setTimeout(w, 3000)); return r.fulfill({ status: 503, body: '{}' }); });
```

These records are measured evidence: "Enter in Email: 0 requests, dialog closed". Never interact this way with a non-local host. There, stop at the state and mark it not shown, with what would reach it ("needs an account with no projects").

To learn which button a key or click triggered, even when no request fires, run the click tracker in `browser.md` (Holding, failing and scanning requests) before the probe and again after any navigation, then read `[window.__clicks, window.__submits]`.

### Dialog and form probes

Run all of these whenever the flow has a dialog or a form, with valid input unless the probe says otherwise. Record each as measured.

- Focus after close. Read `document.activeElement` after the close button, after Escape and after a successful submit. It should land on the control that opened the dialog, or on the new result.
- The Tab loop. Press Tab past the last control. Focus should stay inside a modal dialog.
- Enter in the first field. Record which button it triggered (`__clicks` and `__submits`), the requests sent and whether the dialog is still open.
- Cancel with valid input. Record the requests sent (expect 0) and where focus lands.
- Cancel with input, then reopen. Read every field's displayed value, submit, and compare the fields with the next request body.
- Submit while pending. Use the slow stub. Record the button's box idle and pending (`browser.md`, Measuring a loading state), whether it is disabled, where focus sits, and whether a second submit fires a second request. Focus should stay on the control, never drop to the page. A label that changes while pending is `trap/loading-label-swap` in `traps.md`.
- State order. Run `../build-design-system/scripts/state-timeline.js` (`browser.md`) on the dialog's trigger and each field, and cite the trap it reports, such as `trap/hover-beats-focus` or `trap/open-trigger-unfocused`.
- Failure and retry. Use the 503 stub, then read every field's displayed value and whether the error is visible. Submit again and compare the request body with what the fields show.

A field that shows one value while the request sends another is a measured finding under criterion 8. Its severity follows the shown-versus-sent rule in `review-criteria.md`.

## Component specs

A spec is `docs/system/<component>.md` with a `### State precedence` section. Run `node scripts/check-spec.mjs` on the specs for components on the screen, or `node <skills>/build-design-system/scripts/check-spec.mjs` when the repo has none, where `<skills>` is the folder that holds this skill and its siblings (`build-design-system/references/run-record.md`, Terms). With no specs, skip the check and say so.

## Follow-up passes

Mark an earlier finding fixed only when a new capture at the same viewport and state shows it. Before calling a difference real, run the no-change control in `browser.md` (Compare after a change), so noise such as clocks or seeded data is not read as a fix. A finding that rests on a measurement is fixed only with the measurement taken again. Give both numbers, such as "button width 96 to 120px while pending, now 96 to 96px". Otherwise mark it "not rechecked".
