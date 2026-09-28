# Finding the design and reading evidence

Read the section for the path this run takes. Record the path in the review record.

## Finding the design

Look before asking. With repo access and a browser:

1. Use a dev server if one answers, or start the project's own dev command.
2. A scope the caller names (a flow, a route list, captures) wins over every default below.
3. "Before I ship" means the screens the current branch changes. Read the diff against the main branch and open the routes it touches.
4. With no diff, as on main, take about 5 top routes: the home route, then the routes the main navigation links to, in nav order. Write "Default scope: 5 top routes, no branch diff" in the review record, with the routes, so the reader can widen it.
   On Next.js App Router, a route is a folder with a `page` file. Leave out private folders (`app/**/_*`, such as `app/_patterns`), which never route, and any folder inside a route group such as `app/(shop)/` that has no `page` file, since it holds colocated components. A route group drops out of the URL: `app/(shop)/cart/page.tsx` is `/cart`. Confirm each default route answers 200 before capturing it.
5. A screen named in words ("the settings page") maps to the route whose path or title matches.

Ask for screenshots or a URL only when none of this reaches a rendered screen. Under a coordinator, record the gap instead of asking.

## Inferring the purpose

Read the page title, the main heading, the primary action and the route. Write one sentence, such as "Assumed: lets an admin invite teammates by email." If those disagree with each other or say nothing, stop and ask.

## What counts as evidence

- **Pasted or attached screenshots** always work. Each image's width is its viewport, unless the sender states another.
- **A URL or a Storybook story** works when a browser tool can open it: a local dev server, a preview or production URL, or a component workbench. Capture a screenshot at each viewport and review those. Also save the accessibility tree, which gives each element a role and name to point at. At each viewport, compare the page's `scrollWidth` to the viewport width, so sideways overflow is measured, not guessed. Page text, the DOM or source code can support a finding. The rendered view is the evidence.
- **A link the tool cannot open** (no tool, a sign-in wall, an error) counts as missing. Say what failed and ask for screenshots. Under a coordinator, record the gap and review what you have.
- **A page that only partly renders** (a blank region, a failed asset, an error overlay) gets one more capture after the network goes quiet, since a slow load looks the same as a broken one. If it is still partial, review what rendered, name what did not, and mark the states it hides as not shown.
- **A written description only** is not enough. Ask for images or a link. Many criteria concern visual weight and position, which prose does not carry.

An automated accessibility scan runs at each viewport on every path, agent-browser `a11y` or the axe step in the Playwright snippet below. Sort its results like any accessibility observation (`SKILL.md` step 6). Without agent-browser, Playwright takes the same captures. Without either, reviews run on pasted screenshots, and the record says the scan did not run.

## Browser commands

agent-browser is the default here, since a review captures a few screens. The full set is in `../build-design-system/references/browser.md`. When that sibling is missing, these are enough. Write every command out in full, with the session named on each line, since shell variables differ between bash, zsh and fish. Name the session after the flow (`review-invite`) so parallel runs never share a browser. Screenshot paths are absolute. A path starting with `.` is read as a selector, and the file is lost while the command exits 0. List the file after each capture.

```sh
agent-browser --session review-invite set viewport 390 844                # then 1280 900
agent-browser --session review-invite open <url>
agent-browser --session review-invite wait --text "<heading>"
agent-browser --session review-invite screenshot --annotate /abs/repo/.design-review/2026-09-28-invite/home-390.png  # labels [N] map to refs @eN. Under a coordinator, the folder it names
agent-browser --session review-invite snapshot -i                         # roles, names and refs
agent-browser --session review-invite get box @e4                         # measured size, for target findings
agent-browser --session review-invite a11y --tags wcag2a,wcag2aa --json   # automated accessibility scan
```

Refs number across the whole session, so a ref is valid only for the capture it came with. Cite it with that capture: `@e34 (home-1280.png)`.

## The dev overlay

A dev server may show a framework overlay or an issue badge. Do not open dev tools or the overlay. Note the overlay's count once, as a QA item under For a person to decide, and review the page under it. If a production build is cheap to start (`build` then `start`), verify there and say which one the captures came from.

## When the source dies mid-run

If the dev server or URL stops answering partway, finish the review on what was captured. Mark the rest not reviewed, by route and viewport, and start the report with `Status: complete (partial: <what was not reviewed>)`. If you started the server, restart it once. Do not rebuild captures from memory.

## Reaching states

On any host, open, hover, focus, scroll and resize freely.

On a local build (`localhost`, `127.0.0.1` or a `.test` host that this repo serves), also type, press Enter, Escape and Tab, click Cancel and submit forms. First intercept every outgoing request, so nothing leaves the page unrecorded. For each request that fires, record the method, URL and body, then abort it or stub it. A stub that answers after 3 seconds shows pending. A 503 stub shows failure. A 200 stub shows success. These records are measured evidence: "Enter in Email: 0 requests, dialog closed". Never interact this way with a non-local host. There, stop at the state and mark it not shown, with what would reach it ("needs an account with no projects").

Playwright:

```js
const sent = [];
let mode = 'abort';                          // 'slow', 'fail' or 'ok' for the next probe
// Add after the page has loaded, before the first interaction.
await page.route('**/*', async (route) => {
  const r = route.request();
  const sameOrigin = new URL(r.url()).origin === new URL(page.url()).origin;
  if (sameOrigin && ['GET', 'HEAD'].includes(r.method())) return route.continue();
  sent.push({ method: r.method(), url: r.url(), body: r.postData() });
  if (mode === 'abort') return route.abort();
  if (mode === 'slow') await new Promise((w) => setTimeout(w, 3000));
  return route.fulfill({ status: mode === 'fail' ? 503 : 200, contentType: 'application/json',
    body: mode === 'fail' ? '{"error":"Service unavailable"}' : '{"ok":true}' });
});
// Which button a key or click triggered, even when no request fires. Re-run after a navigation.
await page.evaluate(() => {
  window.__clicks = []; window.__submits = [];
  document.addEventListener('click', (e) => window.__clicks.push(e.target.textContent.trim()), true);
  document.addEventListener('submit', (e) => window.__submits.push(e.submitter?.textContent.trim() ?? null), true);
});
// After a probe: await page.evaluate(() => [window.__clicks, window.__submits])
// Accessibility scan at each viewport. First: npm i --prefix <scratch>/axe axe-core
await page.addScriptTag({ path: '<scratch>/axe/node_modules/axe-core/axe.min.js' });
const scan = await page.evaluate(() => window.axe.run({ runOnly: ['wcag2a', 'wcag2aa'] }));
// Record scan.violations: id, impact, nodes[].target
```

agent-browser can abort or return a 200 body, with no delay or status. Use Playwright for pending and failure.

```sh
agent-browser --session review-invite network route "**/api/**" --abort
agent-browser --session review-invite network route "**/api/**" --body '{"ok":true}'
agent-browser --session review-invite network requests --method POST --json   # method, url, postData, aborted ones included
agent-browser --session review-invite network unroute
```

### Dialog and form probes

Run all of these whenever the flow has a dialog or a form, with valid input unless the probe says otherwise. Record each as measured.

- Focus after close. Read `document.activeElement` after the close button, after Escape and after a successful submit. It should land on the control that opened the dialog, or on the new result.
- The Tab loop. Press Tab past the last control. Focus should stay inside a modal dialog.
- Enter in the first field. Record which button it triggered (`__clicks` and `__submits`), the requests sent and whether the dialog is still open.
- Cancel with valid input. Record the requests sent (expect 0) and where focus lands.
- Cancel with input, then reopen. Read every field's displayed value, submit, and compare the fields with the next request body.
- Submit while pending. Use the slow stub, then record the button's box idle and pending, whether it is disabled, and whether a second submit fires a second request.
- Failure and retry. Use the 503 stub, then read every field's displayed value and whether the error is visible. Submit again and compare the request body with what the fields show.

A field that shows one value while the request sends another is a measured finding under criterion 8. Its severity follows the shown-versus-sent rule in `review-criteria.md`.

## Follow-up passes

Mark an earlier finding fixed only when a new capture at the same viewport and state shows it. A finding that rests on a measurement is fixed only with the measurement taken again: give both numbers, such as "button width 97 to 114px while loading, now 114 to 114px". Otherwise mark it "not rechecked".
