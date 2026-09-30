#!/usr/bin/env node
// montage.mjs: one review page for a run branch's before and after captures. Node 18+, no dependencies.
// Run `node scripts/montage.mjs --help` for usage.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { compareProbes, trapLines } from "./probe.mjs";
import { repoRoot } from "./find-chromium.mjs";

const HELP = `montage.mjs: the review page for a run branch

Usage: node scripts/montage.mjs [--root <dir>] [--dir <folder>] [--surfaces <tsv>] [--seed] [--diff [--tolerance <n>]] [--no-probe] [--widths 390,1280] [--title <text>]

--root defaults to the git root of --dir, else of the current folder. A relative
--dir resolves against the current folder. With no --dir, it reads
<root>/.design-system/review, so the command works from any folder with --root.

Reads captures from --dir (default .design-system/review), as capture.mjs names them:
  <surface>-before-<width>.png, <surface>-after-<width>.png          the page as it loads
  <surface>.<state>-before-<width>.png, ...-after-<width>.png        each listed state
and writes index.html there: one section per surface, before beside after.

surfaces.tsv (--surfaces, default <dir>/surfaces.tsv) lists every surface the run
covers, with a states column (comma separated). Every surface in it is counted in
the headline, changed, unchanged or missing. Every listed state other than default
needs a before and an after at every width. A state that cannot be reached safely
gets a row in <dir>/not-captured.tsv (surface.state <tab> reason) instead.

traces.tsv, in the same folder, one row per changed surface:
  surface <tab> commit <tab> gate or decision ids <tab> what changed
The commit is a hash, or several separated by commas. Two rows for one surface
merge. A surface whose pixels or
behavior changed needs a row; a change with no row is unexplained, so take it
off the branch and gate it.

Shared shell: a layout, nav or header change that touches every route gets one
row whose surface is "shared". A changed surface with no row of its own is
attributed to it, and the page lists those surfaces once under the shared row.
A listed surface the shared change did not reach prints a note. A surface that
also changed for its own reasons still needs its own row.

New states and surfaces: a state (or a whole surface) with after captures and no
before capture at any width is new. It shows after only, with the probe's
measured traps, and counts as changed, so it needs a trace row. A new state
never fails for its missing before.

Behavior delta: capture.mjs writes a .probe.json beside each capture. The montage
compares before and after and lists controls added or removed, changed roles and
states (disabled, aria-busy, aria-invalid, aria-current and so on), heading levels,
contrast drops, link restyles, and controls side by side at different heights.
Each of these is a problem, and exits 1:
  - recolored text below 4.5:1 (3:1 when large)
  - a link in the main content with no resting cue (color apart from the text, or an underline)
  - a link color or underline change whose trace row names no gate (G-...)
  - controls side by side at different heights on a changed surface
  - a changed surface with no probe pair (--no-probe accepts that, and says so)
  - a dialog that runs past the viewport with nothing to scroll it (trap/overlay-no-max-height)
  - an animation over 1ms under prefers-reduced-motion (trap/reduced-motion-ignored)
  - a nav link or table column newly clipped or hidden at a narrow width
    (trap/narrow-hidden-nav), unless the trace row, or the shared row, names a gate

Seed mode (--seed, and on its own when --dir holds no before capture at all) is
for a new app with nothing to compare: it shows each after capture alone, lists
the probe's measured traps (wrapped button labels, flat panels) as notes, needs
no traces.tsv, and exits 0 unless an after capture is missing.

--diff runs scripts/pixdiff.mjs on each pair (needs Playwright), prints the
changed-pixel percentage, bounding box and largest channel delta, and writes a
.diff.png beside the after capture. It compares exactly (tolerance 0) unless
--tolerance <n> is given. Without it, a pair counts as changed when the files differ byte for byte.
The montage reads the first theme only, so it never proves a value-identical swap:
pixdiff.mjs on the before and after folders does (references/browser.md).

Open gates: a finding above that a person still has to decide is a warning, not a
failure, when open-gates.tsv (same folder) has a row for it:
  gate <tab> surface or surface.state <tab> text the finding contains
such as G-07 <tab> projects <tab> span "archived". A surface row covers its states.
The surface's trace row, or the shared row, must name the same gate. A missing
capture, a changed surface with no trace row, a commit that is not a hash and a
missing probe are never gated. A row that matches no finding prints a note.

Exit 0 when nothing above is a problem, with each gated warning listed. Exit 1
when any finding is unexplained, with the reasons. Exit 2 on bad input.`;

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
const KNOWN = new Set(["--seed", "--tolerance", "--root", "--dir", "--surfaces", "--diff", "--no-probe", "--widths", "--title"]);
const bad = argv.filter((a) => a.startsWith("--") && !KNOWN.has(a));
if (bad.length) { console.error(`montage: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const root = repoRoot(val("--root"), val("--dir"));
const dir = val("--dir") ? resolve(val("--dir")) : join(root, ".design-system/review");
const title = val("--title", "Run branch review");
const widths = val("--widths", "390,1280").split(",").map(Number);
const useDiff = argv.includes("--diff");
const noProbe = argv.includes("--no-probe");
if (!existsSync(dir)) { console.error(`montage: no folder at ${dir}`); process.exit(2); }

const tsv = (p) => existsSync(p) ? readFileSync(p, "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.split("\t").map((c) => c.trim())) : null;

// The surfaces the run covers, and their states.
const listed = new Map();
const sPath = resolve(val("--surfaces", join(dir, "surfaces.tsv")));
const sRows = tsv(sPath);
if (val("--surfaces") && !sRows) { console.error(`montage: no file at ${sPath}`); process.exit(2); }
if (sRows) {
  const head = sRows.shift().map((h) => h.toLowerCase());
  const cs = head.indexOf("surface"), ct = head.indexOf("states");
  if (cs < 0) { console.error(`montage: ${sPath} needs a header row with a surface column`); process.exit(2); }
  for (const r of sRows) if (r[cs]) listed.set(r[cs], ct >= 0 ? (r[ct] || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "-" && s !== "default") : []);
}
const notCaptured = new Map((tsv(join(dir, "not-captured.tsv")) || []).filter((r) => r[0] && !/^surface/i.test(r[0])).map((r) => [r[0], r[1] || "no reason given"]));

// Captures, split into surface and state.
const shots = new Map();
for (const f of readdirSync(dir)) {
  const m = /^(.+)-(before|after)-(\d+)\.png$/.exec(f);
  if (!m) continue;
  let [, id, kind, w] = m;
  let surface = id, state = "";
  if (!listed.has(id) && id.includes(".")) { const k = id.lastIndexOf("."); surface = id.slice(0, k); state = id.slice(k + 1); }
  if (!shots.has(surface)) shots.set(surface, new Map());
  const st = shots.get(surface);
  if (!st.has(state)) st.set(state, {});
  st.get(state)[`${kind}-${w}`] = f;
}
const seed = argv.includes("--seed") || (shots.size > 0 && ![...shots.values()].some((st) => [...st.values()].some((c) => Object.keys(c).some((k) => k.startsWith("before-")))));
if (!shots.size && !listed.size) { console.error(`montage: no <surface>-{before,after}-<width>.png files in ${dir}`); process.exit(2); }

const traces = new Map();
for (const r of tsv(join(dir, "traces.tsv")) || []) {
  if (!r[0] || /^surface$/i.test(r[0])) continue;
  // Two rows for one surface (two commits) merge: commits, ids and notes join, none is lost.
  const prev = traces.get(r[0]), row = { commit: r[1] || "", ids: r[2] || "", note: r[3] || "" };
  traces.set(r[0], prev ? { commit: [prev.commit, row.commit].filter(Boolean).join(","), ids: [prev.ids, row.ids].filter(Boolean).join("; "), note: [prev.note, row.note].filter(Boolean).join(" ") } : row);
}
const shared = traces.get("shared") || null;
const hashes = (c) => c.split(/\s*,\s*/).filter(Boolean).length > 0 && c.split(/\s*,\s*/).every((h) => /^[0-9a-f]{7,40}$/i.test(h));
const gateIn = (t) => !!(t && /\bG-\w+/.test(t.ids));
const notes = [];
// Findings a person can decide on. Each becomes a problem, or a warning when an open gate covers it.
const findings = [];

const pixdiff = join(dirname(fileURLToPath(import.meta.url)), "pixdiff.mjs");
const readProbe = (f) => { const p = join(dir, f.replace(/\.png$/, ".probe.json")); try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const problems = [];
const rows = [];
const all = [...new Set([...listed.keys(), ...shots.keys()])].sort();
for (const surface of all) {
  const st = shots.get(surface) || new Map();
  const states = ["", ...(listed.get(surface) || [])];
  for (const s of st.keys()) if (!states.includes(s)) states.push(s);
  let changed = false, missing = false, probed = true, isNew = false;
  const deltas = new Set(), sProblems = new Map(), gated = new Map();
  let linkRestyled = 0, heightMismatch = 0;
  // A surface with no before capture at all is new, and so is a state with none.
  const noBefore = (caps) => !Object.keys(caps).some((k) => k.startsWith("before-")) && Object.keys(caps).some((k) => k.startsWith("after-"));
  const newSurface = !seed && [...st.values()].length > 0 && [...st.values()].every(noBefore);
  const sections = states.map((state) => {
    const id = state ? `${surface}.${state}` : surface;
    const caps = st.get(state) || {};
    if (state && notCaptured.has(id) && !Object.keys(caps).length) return { state, skipped: notCaptured.get(id), cells: [] };
    const fresh = !seed && (newSurface || (state && noBefore(caps)));
    if (fresh) { isNew = true; changed = true; }
    const cells = widths.map((w) => {
      const b = caps[`before-${w}`], a = caps[`after-${w}`];
      if (fresh) {
        if (!a) { missing = true; problems.push(`${id}: missing after at ${w} (new ${state ? "state" : "surface"})`); return { w, b: null, a, diff: "missing", fresh }; }
        const pa = readProbe(a);
        if (pa) for (const l of trapLines(pa)) deltas.add(`${state ? `${state}: ` : ""}new at ${w}: ${l.replace(/\t/g, " ")}`); else probed = false;
        return { w, b: null, a, diff: `new ${state ? "state" : "surface"}, after only`, fresh };
      }
      if (seed && a) {
        const pa = readProbe(a);
        if (pa) for (const l of trapLines(pa)) deltas.add(`${state ? `${state}: ` : ""}${w}: ${l.replace(/\t/g, " ")}`); else probed = false;
        return { w, b: null, a, diff: "after only (seed)" };
      }
      if (!b || !a) { missing = true; probed = false; problems.push(`${id}: missing ${seed ? "after" : !b && !a ? "before and after" : !b ? "before" : "after"} at ${w}${state ? " (a state surfaces.tsv lists)" : ""}`); return { w, b, a, diff: "missing" }; }
      let diff, box = "";
      if (useDiff) {
        const r = spawnSync(process.execPath, [pixdiff, join(dir, b), join(dir, a), "--root", root, "--tolerance", val("--tolerance", "0")], { encoding: "utf8" });
        const m = /\t([\d.]+)%(?:\tbbox (\S+ \S+))?/.exec(r.stdout || "") || /\t(\d+x\d+ vs \d+x\d+)/.exec(r.stdout || "");
        if (!m) { problems.push(`${id}: pixdiff failed at ${w} (${((r.stderr || r.stdout || "").trim().split("\n").filter((l) => !/^pixdiff: using/.test(l))[0] || "no output").slice(0, 160)})`); return { w, b, a, diff: "pixdiff failed" }; }
        diff = m[1].includes("x") ? `size ${m[1]}` : `${m[1]}%`;
        const md = /\tmax delta (\d+)/.exec(r.stdout || "");
        if (md && md[1] !== "0") diff += `, max delta ${md[1]}`;
        if (m[2]) box = ` at ${m[2]}`;
        if (!/^0%/.test(diff)) changed = true;
      } else {
        const same = readFileSync(join(dir, b)).equals(readFileSync(join(dir, a)));
        diff = same ? "identical" : "changed";
        if (!same) changed = true;
      }
      const pb = readProbe(b), pa = readProbe(a);
      if (pb && pa) {
        const c = compareProbes(pb, pa);
        for (const d of c.deltas) deltas.add(state ? `${state}: ${d}` : d);
        for (const p of c.problems) { const k = `${id}: ${p}`; if (!sProblems.has(k)) sProblems.set(k, []); sProblems.get(k).push(w); }
        for (const g of c.gated || []) { const k = `${id}: ${g}`; if (!gated.has(k)) gated.set(k, []); gated.get(k).push(w); }
        linkRestyled = Math.max(linkRestyled, c.linkRestyled); heightMismatch += c.heightMismatch;
      } else probed = false;
      return { w, b, a, diff: diff + box, diffImg: existsSync(join(dir, a.replace(/\.png$/, ".diff.png"))) ? a.replace(/\.png$/, ".diff.png") : null };
    });
    return { state, cells };
  });
  const behavior = [...deltas].filter((d) => !/\(as before\)$/.test(d));
  if (behavior.length) changed = true;
  const own = traces.get(surface);
  const viaShared = changed && !own && !!shared && !seed && !isNew;
  const t = own || (viaShared ? shared : null);
  for (const [k, ws] of sProblems) findings.push({ surface, id: k.slice(0, k.indexOf(": ")), text: `${k} (at ${ws.join(" and ")})`, t });
  for (const [k, ws] of gated) {
    if (gateIn(t)) deltas.add(`${k.slice(k.indexOf(": ") + 2)} (gated: ${t.ids})`);
    else findings.push({ surface, id: k.slice(0, k.indexOf(": ")), text: `${k} (at ${ws.join(" and ")}). Moving content out of reach is a gate, never a silent change: name the gate in the trace row`, t });
  }
  if (changed && !t && !seed) problems.push(`${surface}: changed with no row in traces.tsv${isNew ? " (new, after only)" : ""}. Take it off the branch and gate it${shared ? "" : ", or add a shared row when the change is the shared shell"}`);
  if (own && changed && !hashes(own.commit)) problems.push(`${surface}: traces.tsv commit "${own.commit}" is not a commit hash`);
  if (linkRestyled && !gateIn(t)) findings.push({ surface, id: surface, text: `${surface}: ${linkRestyled} link(s) changed color or underline, and the trace row names no gate. A link restyle is a gate listing every surface it touches`, t });
  if (changed && heightMismatch) findings.push({ surface, id: surface, text: `${surface}: controls that sit together have different heights (see its behavior delta). They share one control height token`, t });
  if (changed && !probed && !noProbe) problems.push(`${surface}: changed, with no before and after probe for every capture. Capture with capture.mjs, or pass --no-probe and say so`);
  rows.push({ surface, sections, changed, missing, t, viaShared, isNew, deltas: [...deltas], probed, listed: listed.has(surface) });
}
for (const s of traces.keys()) if (s !== "shared" && !all.includes(s)) problems.push(`${s}: in traces.tsv with no captures`);
// Open gates turn a finding into a warning. Anything they do not cover stays a problem.
const warnings = [];
const openGates = [];
for (const g of tsv(join(dir, "open-gates.tsv")) || []) {
  if (!g[0] || /^gate$/i.test(g[0])) continue;
  if (!/^G-\w+$/.test(g[0])) problems.push(`open-gates.tsv: "${g[0]}" is not a gate id (G-NN)`);
  else if (!g[1] || !g[2]) problems.push(`open-gates.tsv: ${g[0]} needs a surface and the text of the finding`);
  else openGates.push(g);
}
const used = new Set();
for (const f of findings) {
  const i = openGates.findIndex((g) => (g[1] === f.surface || g[1] === f.id) && g[2] && f.text.includes(g[2]));
  if (i < 0) { problems.push(f.text); continue; }
  const [gate] = openGates[i];
  used.add(i);
  if (!f.t || !new RegExp(`\\b${gate.replace(/[^\w-]/g, "")}\\b`).test(f.t.ids)) problems.push(`${f.text}. open-gates.tsv names ${gate} for it, and the trace row does not`);
  else warnings.push(`${f.text} [open gate ${gate}]`);
}
openGates.forEach((g, i) => { if (!used.has(i)) notes.push(`open-gates.tsv: ${g[0]} on ${g[1]} matches no finding. Close the gate or delete the row`); });
const sharedRows = rows.filter((r) => r.viaShared);
if (shared && !seed) {
  if (!hashes(shared.commit)) problems.push(`shared: traces.tsv commit "${shared.commit}" is not a commit hash`);
  if (!sharedRows.length) notes.push("shared: the row covers no surface. Every changed surface has its own row, or nothing changed");
  for (const r of rows) if (!r.changed && !r.missing && !r.isNew) notes.push(`shared: ${r.surface} did not change. A shared shell change should reach every route that renders the shell`);
}

const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nChanged = rows.filter((r) => r.changed).length, nMissing = rows.filter((r) => r.missing && !r.changed).length;
const nUnchanged = rows.length - nChanged - nMissing;
const nNew = rows.filter((r) => r.isNew).length;
const headline = seed ? `Seed: ${rows.length} surfaces, after captures only${nMissing ? `, ${nMissing} missing captures` : ""}` : `${rows.length} surfaces: ${nChanged} changed${sharedRows.length ? ` (${sharedRows.length} through the shared shell only)` : ""}${nNew ? `, ${nNew} with new states or routes` : ""}, ${nUnchanged} unchanged${nMissing ? `, ${nMissing} missing captures` : ""}${warnings.length ? `, ${warnings.length} warning${warnings.length > 1 ? "s" : ""} on open gates` : ""}${noProbe ? ". Behavior not probed (--no-probe)" : ""}`;
const html = `<!doctype html>
<!-- generated by montage.mjs from ${esc(relative(root, dir) || ".")} -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>body{margin:0 auto;padding:16px;max-width:1400px;font:15px/1.45 system-ui,sans-serif}h2{margin-top:40px}figure{margin:0}img{max-width:100%;border:1px solid #888}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0 20px}.meta{color:#555}ul.problems{color:#a00}@media (max-width:700px){.pair{grid-template-columns:1fr}}</style>
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(headline)}. Every change names the gate or decision it comes from. Merging is your call.</p>
<p class="meta">This page, traces.tsv and the probe files are committed. The captures (*.png) are not: on a fresh clone, rerun capture.mjs for the images.</p>
${problems.length ? `<ul class="problems">${problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
${warnings.length ? `<p>Warnings on open gates. Each waits on a person's answer, and the run can close with them:</p><ul>${warnings.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
${notes.length ? `<ul class="meta">${notes.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
${shared && !seed ? `<section id="shared"><h2>shared: the shell every route renders</h2><p class="meta">${esc(shared.ids)}, commit ${esc(shared.commit)}. ${esc(shared.note)}</p><p class="meta">Attributed here, with no row of their own: ${sharedRows.length ? sharedRows.map((r) => `<a href="#${esc(r.surface)}">${esc(r.surface)}</a>`).join(", ") : "none"}.</p></section>` : ""}
${rows.map((r) => `<section id="${esc(r.surface)}">
<h2>${esc(r.surface)}: ${seed ? (r.missing ? "missing captures" : "seed") : r.changed ? (r.viaShared ? "changed (shared shell)" : r.isNew ? "changed (new)" : "changed") : r.missing ? "missing captures" : "unchanged"}</h2>
<p class="meta">${r.viaShared ? `Through the <a href="#shared">shared row</a>: ${esc(r.t.ids)}.` : r.t ? `${esc(r.t.ids)}${r.t.commit ? `, commit ${esc(r.t.commit)}` : ""}. ${esc(r.t.note)}` : r.changed ? "No trace row." : "No change."}</p>
<p class="meta">${seed ? "Measured traps" : "Behavior delta"}: ${r.deltas.length ? esc(r.deltas.join("; ")) : r.probed ? "none" : "not probed"}</p>
${r.sections.map((s) => `${s.state ? `<h3>State: ${esc(s.state)}</h3>` : ""}${s.skipped ? `<p class="meta">Not captured: ${esc(s.skipped)}</p>` : s.cells.map((c) => `<h4>${c.w}px: ${esc(c.diff)}${c.diffImg ? ` (<a href="${esc(c.diffImg)}">diff</a>)` : ""}</h4>
<div class="pair"><figure>${c.b ? `<img src="${esc(c.b)}" alt="${esc(r.surface)} ${esc(s.state || "")} before at ${c.w}px" loading="lazy">` : seed ? "none (seed)" : c.fresh ? "none (new)" : "missing"}<figcaption>before</figcaption></figure><figure>${c.a ? `<img src="${esc(c.a)}" alt="${esc(r.surface)} ${esc(s.state || "")} after at ${c.w}px" loading="lazy">` : "missing"}<figcaption>after</figcaption></figure></div>`).join("\n")}`).join("\n")}
</section>`).join("\n")}
</body>
</html>
`;
writeFileSync(join(dir, "index.html"), html);
for (const r of rows) console.log(`${r.surface}\t${seed ? (r.missing ? "missing" : "seed") : r.changed ? (r.viaShared ? "changed (shared)" : r.isNew ? "changed (new)" : "changed") : r.missing ? "missing" : "unchanged"}\t${r.sections.map((s) => s.skipped ? `${s.state}:not captured` : s.cells.map((c) => `${s.state ? s.state + "@" : ""}${c.w}:${c.diff}`).join(" ")).join(" ")}\t${r.t ? (r.viaShared ? `shared: ${r.t.ids}` : r.t.ids) : "-"}\t${r.deltas.length ? r.deltas.join("; ") : r.probed ? "behavior: none" : "behavior: not probed"}`);
notes.forEach((p) => console.log(`note: ${p}`));
warnings.forEach((p) => console.log(`warning: ${p}`));
problems.forEach((p) => console.log(`problem: ${p}`));
console.log(`montage: ${headline}. Wrote ${join(dir, "index.html")}`);
console.log(`Coverage: ${rows.length} surface(s) at widths ${widths.join(",")}, first theme only, ${useDiff ? `pixels by pixdiff.mjs at tolerance ${val("--tolerance", "0")}` : "pixels by byte comparison"}, behavior ${noProbe ? "not probed (--no-probe)" : "from the .probe.json pairs"}. Not compared: other themes (pixdiff.mjs on the folders proves those), widths outside --widths, hover, focus and motion in flight`);
process.exit(problems.length ? 1 : 0);
