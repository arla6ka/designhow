#!/usr/bin/env node
// check-docs-leak.mjs: prove the docs page's own styles do not reach inside a live example.
// Renders each example alone and on its docs page, and compares the computed styles of
// every element inside the example. Node 18+, no dependencies of its own.
// Run `node scripts/check-docs-leak.mjs --help` for usage.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const HELP = `check-docs-leak.mjs: compare an example's computed styles alone and on its docs page

Usage
  node scripts/check-docs-leak.mjs --standalone <url> --page <url> [--selector .example]
  node scripts/check-docs-leak.mjs --pairs scripts/docs-leak.json

A pairs file is a JSON list: [{ "name": "button/default", "standalone": "<url>",
"page": "<url>", "selector": ".example", "index": 0 }]. On each URL the check finds
the selector (the index-th match on the page, the first match standalone) and compares
every element inside it, by position, on these properties: font family, size, weight
and style, line height, letter spacing, text transform, color, background color,
margins, padding, border widths and radius, box shadow, text decoration, display, gap.

Render the standalone example inside the same wrapper with no docs chrome, so the
selector matches on both. Animations are finished before reading styles.

Browser: Playwright (playwright or playwright-core, resolved from the current folder,
PW_CHROMIUM for a browser path), else the agent-browser CLI. With neither it prints
SKIP and exits 0, or exits 2 with --strict.

Options
  --viewport <w>x<h>  default 1280x900
  --engine <name>     force playwright or agent-browser (default: the first that works)
  --strict            exit 2 instead of 0 when no browser is available
  --help              this text

Exit 0 when every example matches, 1 on any difference or a missing element, 2 on bad input.`;

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
if (argv.includes("--help") || argv.includes("-h") || !argv.length) { console.log(HELP); process.exit(argv.length ? 0 : 2); }

let pairs;
if (val("--pairs")) {
  const p = resolve(val("--pairs"));
  if (!existsSync(p)) { console.error(`check-docs-leak: no pairs file at ${p}`); process.exit(2); }
  pairs = JSON.parse(readFileSync(p, "utf8"));
} else if (val("--standalone") && val("--page")) {
  pairs = [{ name: "example", standalone: val("--standalone"), page: val("--page"), selector: val("--selector", ".example"), index: Number(val("--index", 0)) }];
} else { console.error("check-docs-leak: give --standalone and --page, or --pairs. See --help."); process.exit(2); }
const [vw, vh] = val("--viewport", "1280x900").split("x").map(Number);

// Runs in the page. Returns the styles of every element inside the match, or an error string.
const COLLECT = (sel, index) => {
  const PROPS = ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-transform", "color", "background-color", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-top-left-radius", "border-bottom-right-radius", "box-shadow", "text-decoration-line", "display", "row-gap", "column-gap"];
  const all = document.querySelectorAll(sel);
  const root = all[index] || null;
  if (!root) return `no element matches ${sel} (index ${index}, ${all.length} found)`;
  const out = [];
  const walk = (el, path) => {
    const s = getComputedStyle(el);
    out.push({ path, tag: el.tagName.toLowerCase(), styles: Object.fromEntries(PROPS.map((p) => [p, s.getPropertyValue(p)])) });
    [...el.children].forEach((c, i) => walk(c, `${path}>${c.tagName.toLowerCase()}:${i}`));
  };
  [...root.children].forEach((c, i) => walk(c, `${c.tagName.toLowerCase()}:${i}`));
  return out;
};
const SETTLE = `(async () => {
  await document.fonts.ready;
  for (const a of document.getAnimations()) { try { a.finish(); } catch { await Promise.race([a.finished.catch(() => {}), new Promise((r) => setTimeout(r, 2000))]); } }
  return true;
})()`;

// ---------- browser engines ----------
async function playwrightEngine() {
  const req = createRequire(join(process.cwd(), "noop.js"));
  let chromium;
  for (const n of ["playwright", "playwright-core"]) { try { ({ chromium } = req(n)); break; } catch {} }
  if (!chromium) return null;
  let browser;
  try { browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}); }
  catch (e) { console.log(`check-docs-leak: Playwright found but Chromium did not launch (${e.message.split("\n")[0]}). Trying agent-browser.`); return null; }
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  return {
    name: "playwright",
    async read(url, sel, index) {
      try { await page.goto(url, { waitUntil: "load" }); } catch (e) { return `cannot open ${url}: ${e.message.split("\n")[0]}`; }
      await page.evaluate(SETTLE);
      return page.evaluate(([s, i, fn]) => new Function(`return (${fn})`)()(s, i), [sel, index, COLLECT.toString()]);
    },
    close: () => browser.close(),
  };
}

function agentBrowserEngine() {
  const probe = spawnSync("agent-browser", ["--version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) return null;
  const session = `docs-leak-${process.pid}`;
  const ab = (args, input) => spawnSync("agent-browser", ["--session", session, ...args], { encoding: "utf8", input, timeout: 60000 });
  ab(["set", "viewport", String(vw), String(vh)]);
  return {
    name: "agent-browser",
    async read(url, sel, index) {
      const o = ab(["open", url]);
      if (o.status !== 0) return `agent-browser open failed: ${(o.stderr || o.stdout).trim()}`;
      ab(["eval", "--stdin"], SETTLE);
      const r = ab(["--json", "eval", "--stdin"], `JSON.stringify((${COLLECT.toString()})(${JSON.stringify(sel)}, ${index}))`);
      try {
        let v = JSON.parse(r.stdout);
        v = v?.data?.result ?? v?.result ?? v;
        return typeof v === "string" ? JSON.parse(v) : v;
      } catch { return `could not read agent-browser output: ${(r.stdout || r.stderr).slice(0, 200)}`; }
    },
    close: () => { ab(["close"]); },
  };
}

const want = val("--engine");
const engine = want === "agent-browser" ? agentBrowserEngine() : want === "playwright" ? await playwrightEngine() : (await playwrightEngine()) || agentBrowserEngine();
if (!engine) {
  console.log(want ? `SKIP check-docs-leak: ${want} is not available.` : "SKIP check-docs-leak: no browser. Install Playwright (npm i -D playwright-core) or agent-browser to run it.");
  process.exit(argv.includes("--strict") ? 2 : 0);
}

let failed = 0;
for (const p of pairs) {
  const sel = p.selector || ".example";
  const a = await engine.read(p.standalone, sel, 0);
  const b = await engine.read(p.page, sel, p.index || 0);
  if (typeof a === "string" || typeof b === "string") { console.log(`${p.name}\tERROR ${typeof a === "string" ? `standalone: ${a}` : `page: ${b}`}`); failed++; continue; }
  const diffs = [];
  if (a.length !== b.length) diffs.push(`element count ${a.length} standalone vs ${b.length} on the page`);
  const byPath = new Map(b.map((x) => [x.path, x]));
  for (const x of a) {
    const y = byPath.get(x.path);
    if (!y) { diffs.push(`${x.path} missing on the page`); continue; }
    for (const [k, v] of Object.entries(x.styles)) if (y.styles[k] !== v) diffs.push(`${x.path} ${k}: ${v} alone, ${y.styles[k]} on the page`);
  }
  if (diffs.length) { failed++; console.log(`${p.name}\tLEAK ${diffs.length} difference(s)`); diffs.slice(0, 20).forEach((d) => console.log(`  ${d}`)); if (diffs.length > 20) console.log(`  ... ${diffs.length - 20} more`); }
  else console.log(`${p.name}\tok (${a.length} elements match)`);
}
await engine.close();
console.log(`check-docs-leak (${engine.name}): ${pairs.length} example(s), ${failed} with differences`);
process.exit(failed ? 1 : 0);
