#!/usr/bin/env node
// capture.mjs: capture routes x widths x themes (x states) into one folder with one command. Node 18+.
// Run `node scripts/capture.mjs --help` for usage.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { launchChromium, repoRoot } from "./find-chromium.mjs";
import { MOTION_SRC, PROBE_SRC } from "./probe.mjs";

const HELP = `capture.mjs: screenshots and state probes for every route, width and theme

Usage:
  node scripts/capture.mjs --base <url> --kind before|after --out <folder> (--routes <r>... | --surfaces <tsv>) [options]
  node scripts/capture.mjs --base <url> --status (--routes <r>... | --surfaces <tsv>)

Every argument is spelled out on the command line, so no shell variable carries a
session name or a path. One command replaces a loop of agent-browser calls.

Routes
  --routes <r>...      each is a path (/settings/billing) or surface=path
                       (billing=/settings/billing), separated by spaces or commas.
                       The surface name defaults to the path as a slug: / is home,
                       /settings/billing is settings-billing. --routes captures the
                       load state only. States need --surfaces
  --surfaces <tsv>     a TSV with a header row holding surface, route (or path or url),
                       and optionally states (comma separated), status (the HTTP
                       code the route should answer, 200 when blank) and tier (high,
                       mid or low, read by other steps and ignored here). It is the only
                       way to capture states. List them here, then pass --states. Build keeps
                       it at .design-system/review/surfaces.tsv, and montage.mjs reads it too
  --expect-status <s=code>...  a surface or route that should answer another code,
                       such as notfound=404 for a not-found demo. It is captured like
                       any other route

Files, in --out
  <surface>-<kind>-<width>.png                 the page as it loads, first theme
  <surface>-<kind>-<width>-<theme>.png         the other themes
  <surface>.<state>-<kind>-<width>.png         a listed state other than default
  ...same name with .probe.json                roles, names and states of every control,
                                               headings, text contrast, link cues and
                                               side-by-side control heights. montage.mjs
                                               compares them. --no-probe skips them
  ...same name with .<audit>.json              what each --eval script returned

Options
  --root <dir>         the app's repo root, where Playwright is looked for first.
                       Default: the git root of --out (or --surfaces), else of the
                       current folder. Run from anywhere with absolute paths
  --widths 390,1280    viewport widths: the narrowest and widest the app supports
  --height 900         viewport height. 320 at --widths 390 measures overlays
                       that run past a short screen (trap/overlay-no-max-height)
  --themes light,dark  first one is the default theme. Default: light
  --theme-via <how>    media (prefers-color-scheme, default), class (toggles .dark on
                       <html>), or storage:<key> (sets localStorage <key> before load,
                       as a theme library does). media is what a dark OS does, so it
                       proves the theme reaches users. class proves the tokens only
  --states <file.mjs>  Playwright only. A module whose default export maps a state
                       name, or surface.state, to async (page) => {} that reaches it:
                       export default { error: async (page) => { ... } }
                       A listed state with no function is reported as not captured
  --eval <file.js>...  in-page audit scripts, such as scripts/optical.js. Each runs in
                       every capture after animations settle, and what it returns is
                       written as JSON beside the screenshot, named by the file:
                       optical.js gives <capture>.optical.json. A script that throws
                       or returns nothing counts as not captured
  --full               full-page screenshots (default: the viewport)
  --mobile             Playwright only. isMobile and hasTouch on, for a review of a phone
  --storage-state <f>  Playwright only. A storage state file the person provides, to reach
                       signed-in screens. Never a real account's session
  --via <tool>         playwright (default) or agent-browser. agent-browser captures
                       the load state only, and runs as --session <name>
  --session <name>     agent-browser session (default ds-capture)
  --status             only request every route and print its HTTP status. Exit 1
                       unless every route answers 200, or its expected status. Run it after any edit to a ui
                       file or the tokens, and against the production server at close

It requests every route before capturing and exits 1 if any answers other than 200
(or its expected status), after capturing the rest. Clocks are fixed, Math.random is seeded, lazy images load
eagerly, and it waits for fonts and, on a React app, for handlers to attach before
a capture.
Exit 2 on bad input or no browser.`;

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(argv.length ? 0 : 2); }
const KNOWN = new Set(["--height", "--root", "--base", "--kind", "--out", "--routes", "--surfaces", "--widths", "--themes", "--theme-via", "--states", "--full", "--via", "--session", "--status", "--no-probe", "--expect-status", "--mobile", "--storage-state", "--eval"]);
const bad = argv.filter((a) => a.startsWith("--") && !KNOWN.has(a));
if (bad.length) { console.error(`capture: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const list = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const out = []; for (let k = i + 1; k < argv.length && !argv[k].startsWith("--"); k++) out.push(argv[k]); return out; };
const die = (m) => { console.error(`capture: ${m}`); process.exit(2); };

const base = val("--base"); if (!base || !/^https?:\/\//.test(base)) die("--base <http://host:port> is required");
const statusOnly = argv.includes("--status");
const kind = val("--kind");
const out = val("--out") && resolve(val("--out"));
if (!statusOnly) {
  if (!/^(before|after)$/.test(kind || "")) die("--kind before or --kind after is required");
  if (!out) die("--out <folder> is required");
}
const widths = val("--widths", "390,1280").split(",").map(Number);
if (widths.some((w) => !w)) die("--widths takes numbers, such as 390,1280");
const height = Number(val("--height", "900"));
if (!height) die("--height takes a number, such as 320");
const themes = val("--themes", "light").split(",");
const via = val("--theme-via", "media");
if (!/^(media|class|storage:.+)$/.test(via)) die("--theme-via is media, class or storage:<key>");
const tool = val("--via", "playwright");
if (!/^(playwright|agent-browser)$/.test(tool)) die("--via is playwright or agent-browser");
const session = val("--session", "ds-capture");
const probe = !argv.includes("--no-probe");
const storageState = val("--storage-state") && resolve(val("--storage-state"));
if (storageState && !existsSync(storageState)) die(`no storage state at ${storageState}`);
if (tool !== "playwright" && (storageState || argv.includes("--mobile"))) die("--mobile and --storage-state need --via playwright");
const root = repoRoot(val("--root"), val("--out") || val("--surfaces") || val("--states"));
if (argv.includes("--eval") && !(list("--eval") || []).length) die("--eval needs one or more in-page script files, such as --eval /abs/skills/build-design-system/scripts/optical.js");
const audits = (list("--eval") || []).flatMap((f) => f.split(",")).filter(Boolean).map((f) => {
  const p = resolve(f); if (!existsSync(p)) die(`--eval: no file at ${p}`);
  const n = basename(p).replace(/\.(m?js)$/, ""); if (n === "probe") die("--eval: a script named probe would overwrite the .probe.json files. Rename it");
  return { name: n, src: readFileSync(p, "utf8") };
});

const slug = (p) => p.replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "home";
let surfaces = [];
const routeArgs = (list("--routes") || []).flatMap((r) => r.split(",")).map((r) => r.trim()).filter(Boolean);
if (argv.includes("--routes") && !routeArgs.length) die("--routes needs one or more paths, such as --routes /,/settings/billing");
if (routeArgs.length && val("--surfaces")) die("give --routes or --surfaces, not both");
if (routeArgs.length && val("--states")) die("--states needs --surfaces. --routes captures the load state only, so list each surface's states in a surfaces.tsv states column");
if (routeArgs.length) surfaces = routeArgs.map((r) => { const m = /^([\w.-]+)=(\/.*)$/.exec(r); return m ? { surface: m[1], route: m[2], states: [] } : { surface: slug(r), route: r.startsWith("/") ? r : `/${r}`, states: [] }; });
else if (val("--surfaces")) {
  const p = resolve(val("--surfaces")); if (!existsSync(p)) die(`no file at ${p}`);
  const rows = readFileSync(p, "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.split("\t"));
  const head = rows.shift().map((h) => h.trim().toLowerCase());
  const col = (...n) => head.findIndex((h) => n.includes(h));
  const cs = col("surface"), cr = col("route", "path", "url"), ct = col("states"), cx = col("status", "expect", "expectstatus");
  if (cs < 0 || cr < 0) die(`${p} needs a header row with surface and route columns. A surfaces file with no route column cannot be captured: pass --routes instead`);
  surfaces = rows.map((r) => ({ surface: r[cs].trim(), route: r[cr].trim(), states: ct >= 0 ? (r[ct] || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "-" && s !== "default") : [], expect: cx >= 0 && /^\d{3}$/.test((r[cx] || "").trim()) ? Number(r[cx].trim()) : 200 }));
} else die("give --routes or --surfaces");
for (const e of list("--expect-status") || []) {
  const m = /^(.+)=(\d{3})$/.exec(e); if (!m) die(`--expect-status takes surface=code or route=code, such as notfound=404, not ${e}`);
  const hit = surfaces.filter((s) => s.surface === m[1] || s.route === m[1]); if (!hit.length) die(`--expect-status: no surface or route ${m[1]}`);
  for (const s of hit) s.expect = Number(m[2]);
}
for (const s of surfaces) s.expect ??= 200;
if (surfaces.some((s) => s.surface.includes("."))) die("a surface name may not contain a dot; the dot separates surface and state");

// 1. Every route answers 200, or the status it is expected to answer. tsc passes a server/client break that only a request shows.
const statuses = [];
for (const s of surfaces) {
  let code;
  try { code = (await fetch(new URL(s.route, base), { redirect: "follow" })).status; } catch (e) { code = `no answer (${e.cause?.code || e.message})`; }
  statuses.push([s, code]);
  console.log(`${code === s.expect ? code : "FAIL"}\t${s.route}\t${code}${s.expect !== 200 ? ` (expected ${s.expect})` : ""}`);
}
const not200 = statuses.filter(([s, c]) => c !== s.expect);
if (statusOnly) { console.log(`${statuses.length} route(s), ${not200.length} not as expected`); process.exit(not200.length ? 1 : 0); }
mkdirSync(out, { recursive: true });

const FREEZE = `(() => { let s = 42; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();`;
const HYDRATED = `new Promise((ok) => { const t0 = Date.now(); const tick = () => { const el = document.querySelector("button, a[href], input, select, textarea, [role=button]"); const ready = !el || Object.keys(el).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactFiber")) || !document.querySelector("#__next, [data-reactroot], script[src*='_next']"); if (ready || Date.now() - t0 > 5000) ok(ready); else setTimeout(tick, 50); }; tick(); })`;
const SETTLE = `(async () => { for (const i of document.querySelectorAll("img[loading=lazy]")) i.loading = "eager"; await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 3000); }))); await document.fonts.ready; document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); return true; })()`;
const themeClass = (t) => `document.documentElement.classList.toggle("dark", ${JSON.stringify(t)} === "dark"); document.documentElement.style.colorScheme = ${JSON.stringify(t)};`;

if (via !== "media" && themes.length > 1) console.error(`capture: --theme-via ${via} sets the theme by hand. It proves the tokens, not that a dark OS reaches them. Capture once with --theme-via media too`);
const name = (s, state, w, t) => `${s.surface}${state ? `.${state}` : ""}-${kind}-${w}${t === themes[0] ? "" : `-${t}`}`;
const written = [], missed = [];
let evals = 0;

if (tool === "playwright") {
  const launched = await launchChromium({}, { root });
  if (launched.error) die(launched.error);
  const browser = launched.browser;
  console.error(`capture: ${launched.from}, ${launched.how}`);
  let steps = {};
  if (val("--states")) { const m = await import(pathToFileURL(resolve(val("--states"))).href); steps = m.default || m; }
  for (const [s, code] of statuses) {
    if (code !== s.expect) { missed.push(`${s.surface}: HTTP ${code}`); continue; }
    for (const t of themes) for (const w of widths) for (const state of ["", ...s.states]) {
      const step = state ? steps[`${s.surface}.${state}`] || steps[state] : null;
      if (state && typeof step !== "function") { missed.push(`${s.surface}.${state}: no function for it in --states`); continue; }
      const ctx = await browser.newContext({ viewport: { width: w, height }, colorScheme: via === "media" ? (t === "dark" ? "dark" : "light") : "light", reducedMotion: "reduce", ...(argv.includes("--mobile") ? { isMobile: true, hasTouch: true } : {}), ...(storageState ? { storageState } : {}) });
      const page = await ctx.newPage();
      try {
        await page.clock.install({ time: new Date("2026-01-01T09:00:00Z") });
        await page.addInitScript(FREEZE);
        if (via.startsWith("storage:")) await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, [via.slice(8), t]);
        await page.goto(new URL(s.route, base).href, { waitUntil: "load" });
        if (via === "class") await page.evaluate(themeClass(t));
        await page.evaluate(HYDRATED);
        if (step) await step(page);
        if (probe) await page.evaluate(`window.__dsMotion = ${MOTION_SRC}`);
        await page.evaluate(SETTLE);
        const file = join(out, `${name(s, state, w, t)}.png`);
        await page.screenshot({ path: file, fullPage: argv.includes("--full"), animations: "disabled" });
        if (probe) writeFileSync(file.replace(/\.png$/, ".probe.json"), JSON.stringify(await page.evaluate(PROBE_SRC), null, 1));
        for (const a of audits) {
          try { const r = await page.evaluate(a.src); if (r === undefined || r === null) throw new Error("returned nothing"); writeFileSync(file.replace(/\.png$/, `.${a.name}.json`), JSON.stringify(r, null, 1)); evals++; }
          catch (e) { missed.push(`${name(s, state, w, t)}: eval ${a.name} failed: ${String(e.message).split("\n")[0]}`); }
        }
        written.push(file);
      } catch (e) { missed.push(`${name(s, state, w, t)}: ${String(e.message).split("\n")[0]}`); }
      await ctx.close();
    }
  }
  await browser.close();
} else {
  // agent-browser, one spelled-out argument list per call: no shell, no variables.
  const ab = (...a) => spawnSync("agent-browser", ["--session", session, ...a], { encoding: "utf8" });
  const abIn = (input, ...a) => spawnSync("agent-browser", ["--session", session, ...a], { encoding: "utf8", input });
  if (spawnSync("agent-browser", ["--version"], { encoding: "utf8" }).status !== 0) die("agent-browser is not installed. Drop --via or install it");
  const freeze = join(root, `.design-system/tmp/${session}/capture-freeze.js`);
  mkdirSync(dirname(freeze), { recursive: true });
  writeFileSync(freeze, `${FREEZE}\nDate.now = () => 1767258000000;\n`);
  let first = true;
  for (const [s, code] of statuses) {
    if (code !== s.expect) { missed.push(`${s.surface}: HTTP ${code}`); continue; }
    for (const state of s.states) missed.push(`${s.surface}.${state}: agent-browser mode captures the load state only. Use --via playwright with --states`);
    for (const t of themes) for (const w of widths) {
      const url = new URL(s.route, base).href;
      const r = first ? ab("--init-script", freeze, "open", url) : ab("open", url);
      first = false;
      if (r.status !== 0) { missed.push(`${name(s, "", w, t)}: open failed: ${(r.stderr || r.stdout).trim().split("\n")[0]}`); continue; }
      ab("set", "viewport", String(w), String(height));
      ab("set", "media", t === "dark" && via === "media" ? "dark" : "light", "reduced-motion");
      if (via === "class") ab("eval", themeClass(t));
      if (via.startsWith("storage:")) { ab("eval", `localStorage.setItem(${JSON.stringify(via.slice(8))}, ${JSON.stringify(t)})`); ab("open", url); }
      abIn(`(async () => { await ${HYDRATED}; ${probe ? `window.__dsMotion = ${MOTION_SRC};` : ""} await ${SETTLE}; return true; })()`, "eval", "--stdin");
      const file = join(out, `${name(s, "", w, t)}.png`);
      const shot = ab("screenshot", ...(argv.includes("--full") ? ["--full"] : []), file);
      if (shot.status !== 0 || !existsSync(file)) { missed.push(`${name(s, "", w, t)}: screenshot failed`); continue; }
      if (probe) {
        const p = abIn(PROBE_SRC, "eval", "--stdin");
        try { const j = JSON.parse(p.stdout.trim()); writeFileSync(file.replace(/\.png$/, ".probe.json"), JSON.stringify(typeof j === "string" ? JSON.parse(j) : j, null, 1)); }
        catch { missed.push(`${name(s, "", w, t)}: probe output was not JSON`); }
      }
      for (const a of audits) {
        const r = abIn(a.src, "eval", "--stdin");
        try { let j = JSON.parse(r.stdout.trim()); if (typeof j === "string") j = JSON.parse(j); if (j === undefined || j === null) throw 0; writeFileSync(file.replace(/\.png$/, `.${a.name}.json`), JSON.stringify(j, null, 1)); evals++; }
        catch { missed.push(`${name(s, "", w, t)}: eval ${a.name} failed: output was not JSON`); }
      }
      written.push(file);
    }
  }
}

for (const m of missed) console.log(`not captured\t${m}`);
console.log(`capture: ${written.length} file(s) in ${out}, ${missed.length} not captured, ${not200.length} route(s) not as expected`);
const planned = surfaces.reduce((n, s) => n + (1 + (tool === "playwright" ? s.states.length : 0)) * widths.length * themes.length, 0);
console.log(`Coverage: ${written.length} of ${planned} captures (${surfaces.length} surface(s), widths ${widths.join(",")}, themes ${themes.join(",")} via ${via}, ${tool}), ${probe ? "probed" : "not probed (--no-probe)"}${audits.length ? `, ${evals} audit result(s) from ${audits.map((a) => a.name).join(", ")}` : ""}. Not captured: hover, focus and pressed states, motion in flight (animations are finished first, reduced motion on), states surfaces.tsv does not list, routes not listed${tool === "agent-browser" ? ", every state (agent-browser captures the load state only)" : ""}`);
process.exit(not200.length || missed.some((m) => /failed|HTTP|not JSON/.test(m)) ? 1 : 0);
