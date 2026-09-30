#!/usr/bin/env node
// stress.mjs: render each route under the conditions that break layouts, and report what broke. Node 18+, no
// dependencies of its own; it needs Playwright, found the way probe.mjs finds it (find-chromium.mjs).
// Run `node scripts/stress.mjs --help` for usage.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `stress.mjs: render every route under stress conditions and list what breaks

Usage:
  node scripts/stress.mjs --base <url> --routes <file> [--out <dir>] [options]
  node scripts/stress.mjs --self-test [--browser] [--root <dir>]

--routes <file> is a plain list, one route per line (# comments allowed), or a
TSV with a header row holding a route column, such as .design-system/review/
surfaces.tsv (surface, route, states, tier). Only the route column is read.

Each route renders once per mode:
  narrow          320px wide
  text-zoom       every element's font size and pixel line height doubled
                  (200% text), at --width
  text-spacing    WCAG 1.4.12: line height 1.5, paragraph spacing 2em, letter
                  spacing 0.12em, word spacing 0.16em, at 320px
  forced-colors   forced-colors: active, at --width
  rtl             dir="rtl" on the root element, at --width
  reduced-motion  prefers-reduced-motion: reduce, at --width
  long-text       every text node doubled, and a 36-character unbroken word added
                  to short ones, at 320px
Finite animations are finished before the oracles run.

Oracles, each a finding id:
  stress/overflow-x      the page scrolls sideways: each deepest element past the
                         viewport's edge that no ancestor scrolls or clips
  stress/clipped-text    text cut off by its own box or an ancestor that hides
                         overflow, with no ellipsis and no line clamp
  stress/overlap         two controls whose boxes cross, neither inside the other
  stress/target-size     a control under 24x24px whose 24px circle reaches another
                         control (WCAG 2.5.8). Links inside a line of text pass
  stress/console-error   a console error or an uncaught exception

Options
  --out <dir>        where findings.jsonl goes. Default .design-system/stress/
                     under the root
  --modes <a,b>      run only these modes. Default: all
  --width 1280       the width of the wide modes
  --height 800       the viewport height
  --root <dir>       the app's repo root, where Playwright is looked for first.
                     Default: the git root of --routes, else of the current folder
  --self-test        signature, dedupe and finding format, no browser.
                     --browser also renders an inline page with a planted overflow
                     and checks the finding, when Playwright is found

Output: one JSON line per finding in <out>/findings.jsonl, deduped by signature
(oracle, selector and the detail with numbers taken out). A finding seen on
several routes or modes is one line listing each. Prints a line per finding and
a Coverage line. Exit 0 when nothing is found, 1 on findings, 2 on bad input or
no browser.`;

export const MODES = {
  narrow: { width: "narrow" },
  "text-zoom": { width: "wide" },
  "text-spacing": { width: "narrow" },
  "forced-colors": { width: "wide", context: { forcedColors: "active" } },
  rtl: { width: "wide" },
  "reduced-motion": { width: "wide", context: { reducedMotion: "reduce" } },
  "long-text": { width: "narrow" },
};
const NARROW = 320;
const LONG_WORD = "Unbrokenlongwordwithoutanyspacesatall";

// Page-side setup for each mode, run after load. Each is an expression.
export const SETUP = {
  "text-zoom": `(() => {
    const all = [...document.querySelectorAll("body, body *")].map((el) => { const s = getComputedStyle(el); return [el, parseFloat(s.fontSize), s.lineHeight]; });
    for (const [el, fs, lh] of all) {
      if (fs) el.style.setProperty("font-size", fs * 2 + "px", "important");
      if (/px$/.test(lh)) el.style.setProperty("line-height", parseFloat(lh) * 2 + "px", "important");
    }
  })()`,
  "text-spacing": `(() => {
    const s = document.createElement("style");
    s.textContent = "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }";
    document.head.appendChild(s);
  })()`,
  rtl: `document.documentElement.setAttribute("dir", "rtl")`,
  "long-text": `(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; for (let n = w.nextNode(); n; n = w.nextNode()) nodes.push(n);
    for (const n of nodes) {
      if (!n.parentElement || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TEXTAREA|OPTION)$/.test(n.parentElement.tagName)) continue;
      const t = n.textContent.trim(); if (t.length < 2) continue;
      n.textContent = n.textContent + " " + t + (t.length <= 24 ? " ${LONG_WORD}" : "");
    }
  })()`,
};

// Finish finite animations, then wait two frames.
const SETTLE = `new Promise((ok) => {
  for (const a of document.getAnimations()) { try { const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {}; if (t.iterations !== Infinity) a.finish(); } catch (e) {} }
  requestAnimationFrame(() => requestAnimationFrame(() => ok()));
})`;

// The oracles, evaluated in the page. Returns [{ oracle, selector, detail }].
export const ORACLE_SRC = `(() => {
  const out = [];
  const iw = document.documentElement.clientWidth;
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0.05; };
  const name = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : el.classList && el.classList[0] ? "." + [...el.classList].slice(0, 2).join(".") : "");
  const sel = (el) => { const p = []; for (let e = el, k = 0; e && e !== document.body && e !== document.documentElement && k < 3; e = e.parentElement, k++) p.unshift(name(e)); return p.join(" > ") || name(el); };
  const clips = (s, ax) => /hidden|clip|auto|scroll/.test(ax === "x" ? s.overflowX : s.overflowY);
  const srOnly = (el) => { const r = el.getBoundingClientRect(); return r.width <= 2 || r.height <= 2; };
  // Horizontal overflow: the deepest elements past the viewport's edge, with no ancestor that scrolls or clips them.
  if (document.documentElement.scrollWidth > iw + 1) {
    const past = [];
    for (const el of document.body.querySelectorAll("*")) {
      if (!visible(el) || srOnly(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right <= iw + 1 && r.left >= -1) continue;
      let held = false; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (clips(getComputedStyle(p), "x")) { held = true; break; }
      if (!held && getComputedStyle(el).position !== "fixed") past.push(el);
    }
    const deep = past.filter((e) => !past.some((o) => o !== e && e.contains(o))).slice(0, 5);
    for (const el of deep) { const r = el.getBoundingClientRect(); out.push({ oracle: "stress/overflow-x", selector: sel(el), detail: r.right > iw + 1 ? "right edge " + Math.round(r.right) + "px past the " + iw + "px viewport" : "left edge " + Math.round(r.left) + "px past the viewport's left" }); }
    if (!deep.length) out.push({ oracle: "stress/overflow-x", selector: "html", detail: "page is " + document.documentElement.scrollWidth + "px wide in a " + iw + "px viewport" });
  }
  // Clipped text: an element with its own text, cut by its box or an ancestor that hides overflow.
  let nClip = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (nClip >= 30) break;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|OPTION|SELECT|TEXTAREA|INPUT)$/.test(el.tagName)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!visible(el) || srOnly(el)) continue;
    const s = getComputedStyle(el);
    if (s.textOverflow === "ellipsis" || (s.webkitLineClamp && s.webkitLineClamp !== "none")) continue;
    let cut = null;
    if (/hidden|clip/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1) cut = "its own box, " + el.scrollWidth + "px of text in " + el.clientWidth + "px";
    else if (/hidden|clip/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) cut = "its own box, " + el.scrollHeight + "px of text in " + el.clientHeight + "px tall";
    else {
      const r = el.getBoundingClientRect();
      for (let p = el.parentElement, k = 0; p && p !== document.body && k < 4; p = p.parentElement, k++) {
        const ps = getComputedStyle(p); if (!/hidden|clip/.test(ps.overflowX + ps.overflowY) || srOnly(p)) continue;
        if (ps.textOverflow === "ellipsis" || (ps.webkitLineClamp && ps.webkitLineClamp !== "none")) break;
        const b = p.getBoundingClientRect(), l = b.left + p.clientLeft, t = b.top + p.clientTop;
        const over = Math.max(r.right - (l + p.clientWidth), l - r.left, r.bottom - (t + p.clientHeight), t - r.top);
        if (over > 1) { cut = name(p) + ", " + Math.round(over) + "px outside it"; break; }
      }
    }
    if (cut) { nClip++; out.push({ oracle: "stress/clipped-text", selector: sel(el), detail: "text cut by " + cut }); }
  }
  // Controls: overlap, and targets under 24px.
  const ctrls = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=checkbox], [role=switch], [role=tab], [role=menuitem], [role=slider]')].filter((el) => visible(el) && !srOnly(el));
  const R = ctrls.map((el) => el.getBoundingClientRect());
  const inside = (a, b) => a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
  let nOver = 0;
  for (let i = 0; i < ctrls.length && nOver < 20; i++) for (let j = i + 1; j < ctrls.length && nOver < 20; j++) {
    const a = ctrls[i], b = ctrls[j], ra = R[i], rb = R[j];
    if (a.contains(b) || b.contains(a) || inside(ra, rb) || inside(rb, ra)) continue;
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 1 && h > 1) { nOver++; out.push({ oracle: "stress/overlap", selector: sel(a) + " | " + sel(b), detail: "boxes cross by " + Math.round(w) + "x" + Math.round(h) + "px" }); }
  }
  const small = ctrls.map((el, i) => ({ el, r: R[i] })).filter((c) => c.r.width < 24 || c.r.height < 24);
  const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const distRect = ([x, y], r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  let nSmall = 0;
  for (const c of small) {
    if (nSmall >= 30) break;
    const el = c.el;
    if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cc = center(c.r);
    const near = ctrls.some((o, k) => o !== el && !o.contains(el) && !el.contains(o) && (distRect(cc, R[k]) < 12 || (small.some((s2) => s2.el === o) && Math.hypot(cc[0] - center(R[k])[0], cc[1] - center(R[k])[1]) < 24)));
    if (near) { nSmall++; out.push({ oracle: "stress/target-size", selector: sel(el), detail: Math.round(c.r.width) + "x" + Math.round(c.r.height) + "px, and another control sits inside its 24px circle" }); }
  }
  return out;
})()`;

// The signature a finding is deduped by: oracle, selector and detail with every number and quoted run taken out.
export function signature(f) {
  const strip = (s) => String(s || "").replace(/https?:\/\/\S+/g, "<url>").replace(/\d+(?:\.\d+)?/g, "#").replace(/\s+/g, " ").trim();
  return `${f.oracle}|${strip(f.selector)}|${strip(f.detail)}`;
}
// Merge findings with one signature into one record listing each route and mode, in first-seen order.
export function dedupe(list) {
  const by = new Map();
  for (const f of list) {
    const k = signature(f);
    if (!by.has(k)) by.set(k, { signature: k, oracle: f.oracle, selector: f.selector, detail: f.detail, route: f.route, mode: f.mode, width: f.width, routes: [], modes: [], count: 0 });
    const x = by.get(k);
    x.count++;
    if (!x.routes.includes(f.route)) x.routes.push(f.route);
    if (!x.modes.includes(f.mode)) x.modes.push(f.mode);
  }
  return [...by.values()];
}
// One JSONL line, keys in a fixed order.
export const FIELDS = ["oracle", "route", "mode", "width", "selector", "detail", "routes", "modes", "count", "signature"];
export const formatLine = (x) => JSON.stringify(Object.fromEntries(FIELDS.map((k) => [k, x[k] ?? null])));
// Routes from a plain list or a TSV with a route column.
export function readRoutes(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (!lines.length) return [];
  const head = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const col = head.findIndex((h) => ["route", "path", "url"].includes(h));
  const rows = col >= 0 ? lines.slice(1).map((l) => (l.split("\t")[col] || "").trim()) : lines.map((l) => l.trim());
  return [...new Set(rows.filter(Boolean))];
}

// Render one route in one mode. Returns [{ oracle, selector, detail, route, mode, width }].
export async function stressPage(browser, url, route, mode, { width, height }) {
  const spec = MODES[mode];
  const w = spec.width === "narrow" ? NARROW : width;
  const ctx = await browser.newContext({ viewport: { width: w, height }, ...(spec.context || {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  const tag = (f) => ({ ...f, route, mode, width: w });
  let found = [];
  try {
    if (url.startsWith("inline:")) await page.setContent(url.slice(7), { waitUntil: "load" });
    else await page.goto(url, { waitUntil: "load" });
    await page.evaluate("document.fonts.ready");
    if (SETUP[mode]) await page.evaluate(SETUP[mode]);
    await page.evaluate(SETTLE);
    found = (await page.evaluate(ORACLE_SRC)).map(tag);
  } catch (e) { errors.push(`could not render: ${String(e.message).split("\n")[0]}`); }
  await ctx.close();
  for (const e of errors.slice(0, 10)) found.push(tag({ oracle: "stress/console-error", selector: "console", detail: e.slice(0, 200) }));
  return found;
}

function selfTest(browserToo, root) {
  let ok = true, n = 0;
  const t = (name, good, got) => { n++; if (!good) ok = false; console.log(`self-test ${good ? "ok  " : "FAIL"} ${name}: ${got}`); };
  const a = { oracle: "stress/overflow-x", selector: "header > nav.links", detail: "right edge 412px past the 320px viewport", route: "/", mode: "narrow", width: 320 };
  const b = { ...a, detail: "right edge 398px past the 320px viewport", route: "/billing" };
  const c = { ...a, mode: "long-text" };
  const d = { ...a, selector: "main > p.lede" };
  t("signature ignores numbers", signature(a) === signature(b), signature(a));
  t("signature keeps the selector", signature(a) !== signature(d), signature(d));
  const merged = dedupe([a, b, c, d]);
  t("dedupe", merged.length === 2 && merged[0].count === 3 && merged[0].routes.join() === "/,/billing" && merged[0].modes.join() === "narrow,long-text" && merged[0].detail === a.detail, JSON.stringify(merged.map((m) => [m.selector, m.count, m.routes, m.modes])));
  const line = formatLine(merged[0]);
  const back = JSON.parse(line);
  t("finding format", Object.keys(back).join() === FIELDS.join() && back.oracle === "stress/overflow-x" && Array.isArray(back.routes) && !line.includes("\n"), line);
  const err = dedupe([{ oracle: "stress/console-error", selector: "console", detail: "Failed to load http://localhost:3000/a.js 404", route: "/", mode: "rtl" }, { oracle: "stress/console-error", selector: "console", detail: "Failed to load http://localhost:3000/b.js 404", route: "/x", mode: "rtl" }]);
  t("console errors dedupe past URLs", err.length === 1 && err[0].routes.length === 2, JSON.stringify(err.map((x) => x.signature)));
  t("routes from a list", readRoutes("# routes\n/\n/billing\n\n/billing\n").join() === "/,/billing", readRoutes("# routes\n/\n/billing\n\n/billing\n").join());
  t("routes from surfaces.tsv", readRoutes("surface\troute\tstates\ttier\nhome\t/\t-\thigh\nbilling\t/billing\topen\tmid\n").join() === "/,/billing", readRoutes("surface\troute\tstates\ttier\nhome\t/\t-\thigh\nbilling\t/billing\topen\tmid\n").join());
  t("every mode has a width", Object.values(MODES).every((m) => m.width === "narrow" || m.width === "wide"), Object.keys(MODES).join(", "));
  if (!browserToo) { console.log(`self-test: ${n} checks, ${ok ? "all as expected" : "FAILED"}`); return Promise.resolve(ok); }
  return (async () => {
    const { launchChromium, repoRoot } = await import("./find-chromium.mjs");
    const launched = await launchChromium({}, { root: repoRoot(root) });
    if (launched.error) { t("browser", false, launched.error.split("\n")[0]); console.log(`self-test: ${n} checks, FAILED`); return false; }
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font:16px/1.5 sans-serif} .row{display:flex;gap:8px} .wide{width:480px;flex-shrink:0;height:20px;background:#ccc} .box{width:120px;height:24px;overflow:hidden} .x{width:16px;height:16px;padding:0;border:0}</style></head><body><main><div class="row"><div id="planted" class="wide"></div></div><div class="box"><span id="cut">A label that runs far past its fixed box and is hidden</span></div><button class="x" id="b1">a</button><button class="x" id="b2">b</button><p>Plain text that wraps.</p></main></body></html>`;
    const found = await stressPage(launched.browser, "inline:" + html, "/fixture", "narrow", { width: 1280, height: 600 });
    await launched.browser.close();
    const has = (o, s) => found.some((f) => f.oracle === o && f.selector.includes(s));
    t("browser: planted overflow caught", has("stress/overflow-x", "#planted"), found.filter((f) => f.oracle === "stress/overflow-x").map((f) => `${f.selector} ${f.detail}`).join("; ") || "none");
    t("browser: clipped text caught", has("stress/clipped-text", "#cut"), found.filter((f) => f.oracle === "stress/clipped-text").map((f) => f.selector).join("; ") || "none");
    t("browser: small targets caught", has("stress/target-size", "#b1") && has("stress/target-size", "#b2"), found.filter((f) => f.oracle === "stress/target-size").map((f) => f.selector).join("; ") || "none");
    t("browser: plain text passes", !found.some((f) => /\bp\b/.test(f.selector.split(" > ").pop())), `${found.length} finding(s)`);
    console.log(`self-test: ${n} checks, ${ok ? "all as expected" : "FAILED"}`);
    return ok;
  })();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(argv.length ? 0 : 2); }
  const KNOWN = ["--base", "--routes", "--out", "--modes", "--width", "--height", "--root", "--self-test", "--browser"];
  const bad = argv.filter((a) => a.startsWith("--") && !KNOWN.includes(a));
  if (bad.length) { console.error(`stress: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
  const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
  if (argv.includes("--self-test")) process.exit((await selfTest(argv.includes("--browser"), val("--root"))) ? 0 : 1);
  const base = val("--base"), routesFile = val("--routes");
  if (!base || !/^https?:\/\//.test(base) || !routesFile) { console.error(`stress: --base <url> and --routes <file> are required\n\n${HELP}`); process.exit(2); }
  if (!existsSync(resolve(routesFile))) { console.error(`stress: no routes file at ${resolve(routesFile)}`); process.exit(2); }
  const routes = readRoutes(readFileSync(resolve(routesFile), "utf8"));
  if (!routes.length) { console.error(`stress: ${routesFile} lists no routes. Give one per line, or a TSV with a route column`); process.exit(2); }
  const modes = val("--modes") ? val("--modes").split(",").map((m) => m.trim()).filter(Boolean) : Object.keys(MODES);
  const unknown = modes.filter((m) => !MODES[m]);
  if (unknown.length) { console.error(`stress: unknown mode ${unknown.join(", ")}. Modes: ${Object.keys(MODES).join(", ")}`); process.exit(2); }
  const width = Number(val("--width", "1280")), height = Number(val("--height", "800"));
  if (!width || !height) { console.error("stress: --width and --height take numbers"); process.exit(2); }
  const { launchChromium, repoRoot } = await import("./find-chromium.mjs");
  const root = repoRoot(val("--root"), routesFile);
  const out = val("--out") ? resolve(val("--out")) : join(root, ".design-system/stress");
  const launched = await launchChromium({}, { root });
  if (launched.error) { console.error(`stress: ${launched.error}`); process.exit(2); }
  const all = [];
  for (const route of routes) for (const mode of modes) {
    const found = await stressPage(launched.browser, new URL(route, base).href, route, mode, { width, height });
    console.log(`${route}\t${mode}\t${found.length} finding(s)`);
    all.push(...found);
  }
  await launched.browser.close();
  const merged = dedupe(all);
  mkdirSync(out, { recursive: true });
  const file = join(out, "findings.jsonl");
  writeFileSync(file, merged.map(formatLine).join("\n") + (merged.length ? "\n" : ""));
  for (const x of merged) console.log(`${x.oracle}\t${x.route}\t${x.mode}\t${x.selector}\t${x.detail}${x.count > 1 ? `\t(${x.count} times: ${x.routes.length} route(s), modes ${x.modes.join(",")})` : ""}`);
  console.log(`stress: ${merged.length} finding(s) from ${all.length} raw, written to ${file}`);
  console.log(`Coverage: ${routes.length} route(s) x ${modes.length} mode(s) (${modes.join(", ")}), narrow ${NARROW}px, wide ${width}px, height ${height}px. Oracles: overflow-x, clipped-text, overlap, target-size, console-error. Not measured: states behind a click, contrast under forced colors, focus order, past 30 clipped texts, 20 overlaps, 30 small targets or 5 overflowing elements per page and mode`);
  process.exit(merged.length ? 1 : 0);
}
