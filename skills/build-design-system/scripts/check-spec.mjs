#!/usr/bin/env node
// check-spec.mjs [--root <repo>] [--no-props] [--no-fresh] <file-or-folder or ->...
// --root defaults to the git root of the first file or folder, else of the current folder, else the current folder.
// Fails a component spec that leaves a question from references/spec-template.md open.
// Prints "file:line rule-id message" per failure. Exit 0 clean, 1 on failures or no specs found, 2 on bad input.
// No dependencies. Folders are searched for *.md files with a "## States" heading outside code fences. "-" reads one
// spec from stdin, for an entry that exists only as text (component-docs under a coordinator).
// spec/props-drift compares the spec with the component at HEAD, through scripts/props-table.mjs: every Variants
// axis must be a prop, every listed value of a string-union prop must still exist, and every "- `prop`" note under
// Props must name a prop. --no-props skips it. Run it at close, so a spec that went stale during the run fails.
// Freshness, skipped by --no-fresh:
// spec/call-sites  "Real uses, <n> call sites" under Examples (or "<n> call sites" in the Description) must equal the <Name tags (Name from the H1) in .tsx and .jsx
//                  files under the check's include folders (scripts/check-system.config.json, else app, src,
//                  components, lib, pages), outside the component's own folder
// spec/stale-cite  every file:line or file:start-end the spec cites must hold the same text as it did at the spec's
//                  last commit. A spec with uncommitted edits is being written against the working tree, so only
//                  the file's existence and the line count are checked
import { dirname, join, relative, resolve } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync, execSync } from "node:child_process";

const SECTIONS = ["Description", "Examples", "Variants", "States", "Props", "Usage", "Accessibility", "Tokens", "Related"];
const USAGE = ["Use it when", "Use something else when", "Writing", "Do and don't"];
const CHECKED_BY = /^(test|lint|screenshot|a11y scan|snapshot|by hand)(\s*(,|and|\+)\s*(test|lint|screenshot|a11y scan|snapshot|by hand))*$/i;
const SKIP = /^(not applicable|not supplied|needs review)\b/i;

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) { console.log("usage: check-spec.mjs [--root <repo>] [--no-props] [--no-fresh] <file-or-folder or ->...\n--root defaults to the git root of the first file or folder, else of the current folder.\n--no-fresh skips spec/call-sites and spec/stale-cite. - reads one spec from stdin."); process.exit(0); }
const ri = argv.indexOf("--root");
const noProps = argv.includes("--no-props");
const noFresh = argv.includes("--no-fresh");
const USAGE_LINE = "usage: check-spec.mjs [--root <repo>] [--no-props] [--no-fresh] <file-or-folder or ->...\n--root defaults to the git root of the first file or folder, else of the current folder.";
const badFlags = argv.filter((a) => a.startsWith("--") && !["--root", "--no-props", "--no-fresh", "--help"].includes(a));
if (badFlags.length) { console.error(`check-spec: unknown ${badFlags.join(", ")}\n${USAGE_LINE}`); process.exit(2); }
const args = argv.filter((a, i) => !a.startsWith("--") && !(ri >= 0 && i === ri + 1));
const STDIN = "<stdin>";
const stdinText = args.includes("-") ? readFileSync(0, "utf8") : null;
const readSpec = (f) => (f === STDIN ? stdinText : readFileSync(f, "utf8"));
// --root, else the git root of the first path argument, else of the current folder, else the current folder.
function repoRoot(rootFlag, firstPath) {
  if (rootFlag) return resolve(rootFlag);
  const git = (d) => { try { return execSync("git rev-parse --show-toplevel", { cwd: d, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } };
  if (firstPath) {
    let d = resolve(firstPath);
    while (!existsSync(d) && dirname(d) !== d) d = dirname(d);
    if (!statSync(d).isDirectory()) d = dirname(d);
    const g = git(d); if (g) return g;
  }
  return git(process.cwd()) || process.cwd();
}
const root = repoRoot(ri >= 0 ? argv[ri + 1] : null, args.find((a) => a !== "-"));
if (!args.length) { console.error(USAGE_LINE); process.exit(2); }
let propsTables = null;
if (!noProps) try { ({ propsTables } = await import(join(dirname(fileURLToPath(import.meta.url)), "props-table.mjs"))); } catch { console.log("note: scripts/props-table.mjs is missing, so spec/props-drift is skipped"); }
// Props from props-table's markdown: own props with their types, plus the names in "Also accepts: ... (a, b)".
function propsOf(md) {
  const own = new Map(), also = new Set();
  for (const l of md.split("\n")) {
    const m = /^\|\s*`([\w$]+)\??`\s*\|\s*`?((?:[^|\\]|\\.)*?)`?\s*\|/.exec(l);
    if (m && m[1] !== "Prop") own.set(m[1], m[2].replace(/\\\|/g, "|"));
    const a = /^Also accepts:(.*)$/.exec(l);
    if (a) for (const g of a[1].matchAll(/\(([^)]*)\)/g)) for (const n of g[1].split(",")) if (/^\s*[\w$]+\s*$/.test(n)) also.add(n.trim());
  }
  return { own, also };
}

const files = [];
const walk = (p) => {
  const st = statSync(p, { throwIfNoEntry: false });
  if (!st) { console.error(`not found: ${p}`); process.exit(2); }
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) if (!e.startsWith(".") && e !== "node_modules") walk(join(p, e));
  } else if (p.endsWith(".md") && (targets.includes(p) || /^## States\s*$/m.test(readFileSync(p, "utf8").replace(/^(```|~~~)[\s\S]*?^\1/gm, "")))) files.push(p);
};
// A path resolves against the current folder, and against the root when nothing is there.
const targets = args.filter((a) => a !== "-").map((a) => (existsSync(resolve(a)) || !existsSync(join(root, a)) ? a : join(root, a)));
targets.forEach(walk);
if (stdinText !== null) files.push(STDIN);

// Freshness helpers: the check's include folders, <Name tag counts, and git reads.
const EXCL = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".design-system", ".migration", ".design-review", "public", "scripts", "docs", ".agents", ".claude", ".cursor", ".codex"]);
let includeDirs = ["app", "src", "components", "lib", "pages"];
try { const c = JSON.parse(readFileSync(join(root, "scripts/check-system.config.json"), "utf8")); if (Array.isArray(c.include) && c.include.length) includeDirs = c.include; } catch {}
let jsxFiles = null;
const listJsx = () => {
  if (jsxFiles) return jsxFiles;
  jsxFiles = [];
  const walkJ = (rel) => {
    const st = statSync(join(root, rel), { throwIfNoEntry: false });
    if (!st || rel.split("/").some((seg) => EXCL.has(seg))) return;
    if (st.isDirectory()) { for (const e of readdirSync(join(root, rel))) walkJ(rel ? `${rel}/${e}` : e); return; }
    if (/\.(tsx|jsx)$/.test(rel) && !/\.(test|spec|stories)\./.test(rel)) jsxFiles.push(rel);
  };
  for (const d of new Set(includeDirs)) walkJ(d === "." ? "" : d.replace(/^\.\//, "").replace(/\/$/, ""));
  return jsxFiles;
};
const callSites = (name, ownDir) => {
  let n = 0;
  const re = new RegExp(`<${name.replace(/[.$]/g, "\\$&")}(?=[\\s/>])`, "g");
  for (const rel of listJsx()) {
    if (ownDir && (rel === ownDir || rel.startsWith(ownDir + "/"))) continue;
    const code = readFileSync(join(root, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    n += (code.match(re) || []).length;
  }
  return n;
};
const git = (args) => { try { return execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 }).toString(); } catch { return null; } };
const shown = new Map();
const fileAt = (sha, rel) => { const k = `${sha}:${rel}`; if (!shown.has(k)) shown.set(k, git(["show", `${sha}:./${rel}`])); return shown.get(k); };
const norm = (l) => (l ?? "").trim().replace(/\s+/g, " ");

let failures = 0;
for (const file of files) {
  const lines = readSpec(file).split("\n");
  const fail = (line, rule, msg) => { failures++; console.log(`${file}:${line} ${rule} ${msg}`); };

  // Split into H2 sections, ignoring fenced code blocks.
  const h2 = [], h3 = [];
  let fence = false;
  lines.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) fence = !fence;
    if (fence) return;
    let m;
    if ((m = l.match(/^## (.+?)\s*$/))) h2.push({ name: m[1], line: i + 1 });
    else if ((m = l.match(/^### (.+?)\s*$/))) h3.push({ name: m[1], line: i + 1, h2: h2.at(-1)?.name });
  });
  const body = (name) => {
    const i = h2.findIndex((s) => s.name === name);
    if (i < 0) return null;
    const end = h2[i + 1] ? h2[i + 1].line - 1 : lines.length;
    return { start: h2[i].line, lines: lines.slice(h2[i].line, end) };
  };
  const sub = (section, name) => {
    const sec = body(section); if (!sec) return null;
    const at = sec.lines.findIndex((l) => l.trim() === `### ${name}`);
    if (at < 0) return null;
    const rest = sec.lines.slice(at + 1);
    const stop = rest.findIndex((l) => /^### /.test(l));
    return { start: sec.start + at + 1, lines: stop < 0 ? rest : rest.slice(0, stop) };
  };
  const table = (block) => {
    if (!block) return null;
    const rows = [];
    block.lines.forEach((l, i) => { if (/^\s*\|/.test(l)) rows.push({ cells: l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim()), line: block.start + i + 1 }); });
    if (rows.length < 2 || !/^[\s:|-]+$/.test(rows[1].cells.join("|"))) return null;
    return { head: rows[0].cells, rows: rows.slice(2) };
  };
  const filled = (block) => block && block.lines.some((l) => l.trim() && !/^<.*>$/.test(l.trim()));

  // spec/sections and spec/usage-h3
  const names = h2.map((s) => s.name);
  if (names.join("|") !== SECTIONS.join("|"))
    fail(h2[0]?.line ?? 1, "spec/sections", `H2s must be ${SECTIONS.join(", ")} in order. Found: ${names.join(", ") || "none"}`);
  const usage = h3.filter((s) => s.h2 === "Usage").map((s) => s.name);
  if (usage.join("|") !== USAGE.join("|"))
    fail(body("Usage")?.start ?? 1, "spec/usage-h3", `Usage H3s must be ${USAGE.join(", ")}. Found: ${usage.join(", ") || "none"}`);

  // spec/placeholder, outside fenced blocks
  fence = false;
  lines.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) fence = !fence;
    const prose = l.replace(/`[^`]*`/g, "").replace(/<\/?(br|kbd)\s*\/?>/gi, "");
    if (!fence && /<[A-Za-z][^<>]*>/.test(prose))
      fail(i + 1, "spec/placeholder", "template placeholder left in");
  });

  // spec/foundation and spec/traps
  const desc = body("Description");
  const descText = desc ? desc.lines.join("\n") : "";
  if (!/^Foundation:\s*\S/m.test(descText)) fail(desc?.start ?? 1, "spec/foundation", "Description needs a 'Foundation:' line");
  const fnd = sub("Description", "Foundation");
  if (!fnd) fail(desc?.start ?? 1, "spec/foundation", "Description needs a '### Foundation' H3");
  else if (!table(fnd)?.rows.length && !fnd.lines.some((l) => SKIP.test(l.trim())))
    fail(fnd.start, "spec/foundation", "'### Foundation' needs a table row, or 'Not applicable: hand-rolled'");
  if (!/Traps checked:\s*\S/.test(descText)) fail(desc?.start ?? 1, "spec/traps", "Description needs a 'Traps checked:' line");

  // spec/states-table, spec/states-empty, spec/checked-by
  const states = body("States");
  const firstH3 = states ? states.lines.findIndex((l) => /^### /.test(l)) : -1;
  const st = table(states && { start: states.start, lines: firstH3 < 0 ? states.lines : states.lines.slice(0, firstH3) });
  const col = (t, re) => t ? t.head.findIndex((h) => re.test(h)) : -1;
  if (!st || col(st, /^state$/i) < 0 || col(st, /trigger/i) < 0 || col(st, /checked by/i) < 0) {
    fail(states?.start ?? 1, "spec/states-table", "States needs a table with State, Trigger and Checked by columns");
  } else {
    if (!st.rows.length) fail(states.start, "spec/states-empty", "States table has no rows");
    for (const r of st.rows) {
      if (r.cells.length < st.head.length || r.cells.some((c) => c === "" || c === "?" || /^tbd$/i.test(c)))
        fail(r.line, "spec/states-empty", `state row '${r.cells[0] || "(blank)"}' has an empty cell`);
      const cb = r.cells[col(st, /checked by/i)] ?? "";
      if (cb && !CHECKED_BY.test(cb)) fail(r.line, "spec/checked-by", `'${cb}' is not one of test, lint, screenshot, a11y scan, snapshot, by hand`);
    }
  }

  // spec/precedence
  const prec = sub("States", "State precedence");
  if (!prec) fail(states?.start ?? 1, "spec/precedence", "States needs a '### State precedence' H3");
  else {
    const items = prec.lines.map((l, i) => ({ t: l.trim(), line: prec.start + i + 1 })).filter((x) => x.t);
    if (!items.length) fail(prec.start, "spec/precedence", "State precedence is empty");
    for (const x of items) {
      // "Not applicable: why" for the whole list, or per pair: "- filled and empty: Not applicable: why". NEEDS REVIEW is still unanswered.
      const t = x.t.replace(/^[-*]\s*/, "");
      if (/^not applicable\b/i.test(t) || /^[^:?]+:\s*not applicable\b\s*[:,.-]?\s*\S/i.test(t)) continue;
      if (/\?\s*$|\bTBD\b|\bunanswered\b/i.test(x.t) || (/^[-*]\s/.test(x.t) && !/\bwins\b|\bboth show\b/i.test(x.t)))
        fail(x.line, "spec/precedence", `unanswered precedence: '${x.t.slice(0, 80)}'`);
    }
  }

  // spec/keyboard, spec/aria, and Checked by in those tables
  for (const [name, rule] of [["Keyboard", "spec/keyboard"], ["ARIA", "spec/aria"]]) {
    const t = table(sub("Accessibility", name));
    if (!t || !t.rows.length) { fail(body("Accessibility")?.start ?? 1, rule, `Accessibility needs a '### ${name}' table with rows`); continue; }
    const c = col(t, /checked by/i);
    for (const r of t.rows) {
      if (r.cells.some((x) => x === "" || x === "?")) fail(r.line, rule, `${name} row '${r.cells[0]}' has an empty cell`);
      if (c >= 0 && r.cells[c] && !CHECKED_BY.test(r.cells[c])) fail(r.line, "spec/checked-by", `'${r.cells[c]}' is not an allowed Checked by value`);
    }
  }

  // spec/props-drift: the spec against the component's exported props at HEAD
  const src = /source\s+`([^`]+\.(?:tsx|jsx|ts|js))`/.exec(descText);
  if (propsTables && src) {
    if (!existsSync(join(root, src[1]))) fail(desc.start, "spec/props-drift", `source ${src[1]} does not exist (run from the repo root or pass --root)`);
    else {
      const md = propsTables(root, [src[1]]).tables.get(src[1]);
      if (md) {
        const { own, also } = propsOf(md);
        const known = (n) => own.has(n) || also.has(n);
        const byLower = new Map([...own.keys()].map((k) => [k.toLowerCase(), k]));
        const vars = body("Variants");
        if (vars) {
          let axis = null;
          vars.lines.forEach((l, i) => {
            const line = vars.start + i + 1;
            const h = /^### (.+?)\s*$/.exec(l);
            if (h) {
              const name = h[1].replace(/`/g, "").trim();
              axis = byLower.get(name.toLowerCase()) || (also.has(name) ? name : null);
              if (!axis && !SKIP.test(name)) fail(line, "spec/props-drift", `Variants axis '${name}' is not a prop of ${src[1]} at HEAD. Props: ${[...own.keys()].join(", ") || "none"}`);
              return;
            }
            const v = /^[-*]\s*`([^`]+)`/.exec(l.trim());
            const type = axis && own.get(axis);
            if (v && type && /"[^"]*"/.test(type)) {
              const values = new Set([...type.matchAll(/"([^"]*)"/g)].map((x) => x[1]));
              const val = v[1].replace(/^["']|["']$/g, "");
              if (!values.has(val)) fail(line, "spec/props-drift", `${axis}="${val}" is not in ${src[1]} at HEAD. Values: ${[...values].join(", ")}`);
            }
          });
        }
        const pr = body("Props");
        if (pr) pr.lines.forEach((l, i) => {
          const n = /^[-*]\s*`([a-z][\w$]*)`/.exec(l.trim());
          if (n && !known(n[1])) fail(pr.start + i + 1, "spec/props-drift", `Props notes name \`${n[1]}\`, which ${src[1]} does not accept at HEAD`);
        });
      }
    }
  }

  // spec/call-sites and spec/stale-cite: the counts and the code a spec cites, against the repo now
  if (!noFresh) {
    const title = /^#\s+([A-Z][\w$]*)\b/.exec(lines.find((l) => /^#\s/.test(l)) || "");
    const firstH3 = desc ? desc.lines.findIndex((l) => /^### /.test(l)) : -1;
    const intro = desc ? (firstH3 < 0 ? desc.lines : desc.lines.slice(0, firstH3)).join("\n") : "";
    const ex = body("Examples");
    const count = /\b(\d+) call sites?\b/.exec(intro) || /\b(\d+) call sites?\b/.exec((ex ? ex.lines : []).find((l) => /^Real uses\b/i.test(l.trim())) || "");
    if (title && src) {
      if (!count) fail(ex ? ex.start : desc.start, "spec/call-sites", `Examples needs a "Real uses, <n> call sites" line (or the count on the Description's source line): the <${title[1]} tags outside ${dirname(src[1])}/`);
      else {
        const n = callSites(title[1], dirname(src[1]));
        if (n !== Number(count[1])) fail(desc.start, "spec/call-sites", `says ${count[1]} call site(s), and ${includeDirs.join(", ")} hold ${n} <${title[1]} tag(s) outside ${dirname(src[1])}/ now. Recount, and recheck Examples and Variants`);
      }
    }
    let sha = null, dirty = true;
    if (file !== STDIN) {
      const rel = relative(root, resolve(file));
      sha = (git(["log", "-1", "--format=%H", "--", rel]) || "").trim() || null;
      dirty = !sha || (git(["status", "--porcelain", "--", rel]) || "").trim() !== "";
    }
    let inFence = false;
    const cited = new Set();
    lines.forEach((l, i) => {
      if (/^(```|~~~)/.test(l)) inFence = !inFence;
      if (inFence) return;
      for (const m of l.matchAll(/(?<![\w/.@-])((?:[\w@()[\].-]+\/)*[\w@()[\].-]+\.(?:tsx|jsx|ts|js|mjs|css|scss)):(\d+)(?:[-\u2013](\d+))?/g)) {
        const [, path, a, b] = m, from = Number(a), to = Number(b || a);
        if (cited.has(`${path}:${from}-${to}`) || to < from) continue;
        cited.add(`${path}:${from}-${to}`);
        if (!existsSync(join(root, path))) { fail(i + 1, "spec/stale-cite", `cites ${path}:${a}${b ? `-${b}` : ""}, and ${path} does not exist under ${root}`); continue; }
        const now = readFileSync(join(root, path), "utf8").split("\n");
        if (to > now.length) { fail(i + 1, "spec/stale-cite", `cites ${path}:${a}${b ? `-${b}` : ""}, and the file has ${now.length} lines now`); continue; }
        if (dirty) continue;
        const then = fileAt(sha, path);
        if (then === null) { fail(i + 1, "spec/stale-cite", `cites ${path}, which did not exist at the spec's last commit ${sha.slice(0, 7)}. Re-read it and commit the spec again`); continue; }
        const was = then.split("\n").slice(from - 1, to).map(norm), is = now.slice(from - 1, to).map(norm);
        if (was.join("\n") !== is.join("\n")) {
          const k = was.findIndex((x, j) => x !== is[j]);
          fail(i + 1, "spec/stale-cite", `${path}:${from + k} changed since the spec's last commit ${sha.slice(0, 7)}: was "${(was[k] ?? "").slice(0, 60)}", now "${(is[k] ?? "").slice(0, 60)}". Re-read the call site and update the spec`);
        }
      }
    });
  }

  // spec/tokens
  const tok = body("Tokens");
  if (!tok || !(table(tok)?.rows.length || tok.lines.some((l) => /NOT SUPPLIED/.test(l))))
    fail(tok?.start ?? 1, "spec/tokens", "Tokens needs a table with rows, or NOT SUPPLIED with a reason");
}

if (!files.length) { console.log("no specs found. A spec is a .md file with a '## States' heading"); process.exit(1); }
console.log(`${files.length} spec(s) checked, ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
