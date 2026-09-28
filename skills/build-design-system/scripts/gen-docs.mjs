#!/usr/bin/env node
// gen-docs.mjs: specs and foundation pages in docs/system/*.md become Markdown twins,
// a rules page, llms.txt and a plain HTML index. Node 18+, no dependencies.
// Run `node scripts/gen-docs.mjs --help` for usage.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = `gen-docs.mjs: generate the design system docs from their sources

Usage: node scripts/gen-docs.mjs [options]

Reads every .md under --src (spec-template.md and files starting with _ are skipped)
and writes, under --out:
  <slug>.md     a twin of each source, first line an HTML comment naming this script
  rules.md      every trap/ and rule/ ID the sources cite, with the page that answers
                it and the check that enforces it (from check-system.mjs --list-rules)
  index.md      the overview: what to read first, every page with a one-line note
  index.html    one plain HTML page rendering the overview and every twin
and --llms (llms.txt) linking every twin. Output is byte-stable: no dates.

A component page's Props section gets a table generated from its source file's
types (scripts/props-table.mjs), found through the registry. The source file keeps
only notes under ## Props. A hand-written table there is replaced in the twin.
Purpose text comes from JSDoc on the props type.

Settings live in scripts/gen-docs.config.json (src, out, llms, base, name,
registry, checkCommand). A write run with any of those flags saves them there, so
a later --check with no flags generates the same output.

Options
  --root <dir>        repo root. Default: the git root of the first absolute
                      path among --src, --out, --llms, --registry and --config,
                      else of the current folder, else the current folder
  --src <dir>         sources (default: docs/system)
  --out <dir>         output folder (default: public/system)
  --llms <file>       llms.txt path (default: public/llms.txt)
  --base <url>        URL where --out is served (default: /system)
  --name <text>       system name (default: package.json name)
  --registry <file>   registry for source paths (default: registry.json, if present)
  --check-command <c> the check command the overview names (default: npm run check)
  --config <file>     settings file (default: scripts/gen-docs.config.json)
  --no-props          leave Props sections as written
  --check             write nothing; exit 1 if any output differs from a fresh run
  --help              this text

Exit 0 on success, 1 on drift in --check mode, 2 on bad input.`;

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
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
const root = repoRoot(val("--root"), ["--src", "--out", "--llms", "--registry", "--config"].map((f) => val(f)).find((p) => p && isAbsolute(p)));
const checkOnly = argv.includes("--check");
// settings: flags win over scripts/gen-docs.config.json, which wins over defaults
const cfgFile = resolve(root, val("--config", "scripts/gen-docs.config.json"));
let saved = {};
if (existsSync(cfgFile)) { try { saved = JSON.parse(readFileSync(cfgFile, "utf8")); } catch (e) { console.error(`gen-docs: cannot parse ${cfgFile}: ${e.message}`); process.exit(2); } }
const KEYS = { src: "--src", out: "--out", llms: "--llms", base: "--base", name: "--name", registry: "--registry", checkCommand: "--check-command" };
// An absolute path inside the root is kept relative to it, so the saved settings work on any clone.
const inside = (k, v) => (["src", "out", "llms", "registry"].includes(k) && v && isAbsolute(v) && !relative(root, v).startsWith("..") ? relative(root, v).split(sep).join("/") || "." : v);
const given = Object.fromEntries(Object.entries(KEYS).filter(([, f]) => argv.includes(f)).map(([k, f]) => [k, inside(k, val(f))]));
const setting = (k, d) => given[k] ?? saved[k] ?? d;
if (checkOnly) for (const [k, v] of Object.entries(given)) if (saved[k] !== undefined && saved[k] !== v) console.log(`note: ${KEYS[k]} ${v} differs from ${posixRel(cfgFile)} (${saved[k]}). --check uses the flag.`);
function posixRel(p) { return relative(root, p).split(sep).join("/"); }
const srcDir = resolve(root, setting("src", "docs/system"));
const outDir = resolve(root, setting("out", "public/system"));
const llmsPath = resolve(root, setting("llms", "public/llms.txt"));
const base = setting("base", "/system").replace(/\/$/, "");
const posix = (p) => p.split(sep).join("/");
const rel = (p) => posix(relative(root, p));
const MARK = (src) => `<!-- generated by scripts/gen-docs.mjs from ${src}. Edit the source and rerun. -->`;
const FOUNDATIONS = ["colors", "typography", "materials", "layout", "spacing", "radius", "elevation", "motion", "icons", "brand"];

if (!existsSync(srcDir)) { console.error(`gen-docs: no source folder at ${rel(srcDir)}`); process.exit(2); }
let pkgName = "App";
try { pkgName = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name || pkgName; } catch {}
const name = setting("name", pkgName.replace(/^@[^/]+\//, "").replace(/(^|[-_])(\w)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase()));
const checkCommand = setting("checkCommand", "npm run check");
if (!checkOnly && Object.keys(given).length && Object.entries(given).some(([k, v]) => saved[k] !== v)) {
  mkdirSync(dirname(cfgFile), { recursive: true });
  writeFileSync(cfgFile, JSON.stringify({ ...saved, ...given }, null, 2) + "\n");
  console.log(`saved ${Object.keys(given).map((k) => KEYS[k]).join(", ")} to ${posixRel(cfgFile)}, so --check generates the same output`);
}

// registry: id -> source path
const sources = new Map();
const regPath = resolve(root, setting("registry", "registry.json"));
if (existsSync(regPath)) {
  try {
    const reg = JSON.parse(readFileSync(regPath, "utf8"));
    for (const it of [...(reg.components || []), ...(reg.items || [])]) {
      const id = String(it.id || it.name || "").toLowerCase();
      const s = it.source || it.meta?.source || (it.files || []).map((f) => (typeof f === "string" ? f : f.path))[0];
      if (id && s) sources.set(id, s);
    }
  } catch (e) { console.error(`gen-docs: cannot parse ${rel(regPath)}: ${e.message}`); process.exit(2); }
}

// ---------- read sources ----------
const pages = [];
const walk = (d, prefix) => {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (!e.startsWith(".") && !e.startsWith("_")) walk(p, `${prefix}${e}/`); continue; }
    if (!e.endsWith(".md") || e.startsWith("_") || e === "spec-template.md" || e === "README.md") continue;
    const slug = prefix + e.replace(/\.md$/, "");
    pages.push({ slug, file: p, text: readFileSync(p, "utf8").replace(/\r\n/g, "\n") });
  }
};
walk(srcDir, "");
if (!pages.length) { console.error(`gen-docs: no .md sources in ${rel(srcDir)}`); process.exit(2); }

const stripFences = (t) => t.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
const titleOf = (p) => (/^# (.+)$/m.exec(stripFences(p.text))?.[1] || p.slug.split("/").pop().replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())).trim();
const plain = (s) => s.replace(/`([^`]*)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
function noteOf(p) {
  const t = stripFences(p.text).split("\n");
  let i = t.findIndex((l) => /^## Description\s*$/.test(l));
  if (i < 0) i = t.findIndex((l) => /^# /.test(l));
  for (let k = i + 1; k < t.length; k++) {
    const l = t[k].trim();
    if (!l || l.startsWith("<!--") || l.startsWith(">") && l.length < 3) continue;
    if (/^#/.test(l)) break;
    if (/^[|`-]/.test(l) || /^Foundation:/.test(l)) continue;
    const s = plain(l.replace(/^>\s*/, ""));
    const first = s.split(/(?<=[.!?])\s/)[0];
    return first.length > 140 ? first.slice(0, 137) + "..." : first;
  }
  return "";
}
const kindOf = (p) => {
  const leaf = p.slug.split("/").pop();
  if (FOUNDATIONS.includes(leaf)) return "Foundations";
  if (p.slug.startsWith("patterns/")) return "Patterns";
  if (leaf === "rules" || leaf === "coverage-gaps") return "Rules";
  if (leaf === "index" || leaf === "overview") return "Overview";
  if (/^## States\s*$/m.test(stripFences(p.text))) return "Components";
  return "Other";
};

// ---------- props tables ----------
// A component page's twin gets a Props table generated from its source's types.
const propsFor = new Map();
let propsTables = null;
try { ({ propsTables } = await import("./props-table.mjs")); } catch { console.log("props: scripts/props-table.mjs is missing, so Props sections stay as written. Copy it from the skill."); }
if (propsTables && !argv.includes("--no-props")) {
  const want = pages.filter((p) => /^## Props\s*$/m.test(p.text) && /^## States\s*$/m.test(stripFences(p.text)))
    .map((p) => [p, sources.get(p.slug.split("/").pop())]).filter(([, s]) => s && existsSync(join(root, s)));
  if (want.length) {
    const { method, tables } = propsTables(root, [...new Set(want.map(([, s]) => s))]);
    for (const [p, s] of want) {
      const md = tables.get(s);
      if (md) propsFor.set(p.slug, `<!-- Props generated from ${s} with ${method} by scripts/props-table.mjs -->\n${md}`);
      else console.log(`props: no exported component props found in ${s}; ${p.slug}.md keeps its Props section as written`);
    }
  }
}
function withProps(body, block) {
  const lines = body.split("\n");
  const i = lines.findIndex((l) => /^## Props\s*$/.test(l));
  if (i < 0) return body;
  let j = i + 1;
  while (j < lines.length && !/^## /.test(lines[j])) j++;
  const notes = lines.slice(i + 1, j).filter((l) => !/^\s*\|/.test(l) && !/^<(Generated|!-- Props generated)/.test(l.trim())).join("\n").trim();
  return [...lines.slice(0, i + 1), "", block, ...(notes ? ["", notes] : []), "", ...lines.slice(j)].join("\n");
}

// ---------- twins ----------
const outputs = new Map(); // abs path -> content
for (const p of pages) {
  let body = p.text.replace(/^\s*<!--[\s\S]*?-->\s*\n/, "");
  if (!/^# /m.test(body.split("\n").find((l) => l.trim()) || "")) body = `# ${titleOf(p)}\n\n${body}`;
  const source = sources.get(p.slug.split("/").pop());
  if (propsFor.has(p.slug)) body = withProps(body, propsFor.get(p.slug));
  if (source && !body.includes(source)) body = body.replace(/\s*$/, `\n\nSource: \`${source}\`\n`);
  p.twin = `${MARK(rel(p.file))}\n${body.replace(/\s*$/, "\n")}`;
  p.kind = kindOf(p);
  p.title = titleOf(p);
  p.note = noteOf(p);
  outputs.set(join(outDir, `${p.slug}.md`), p.twin);
}

// ---------- rules page ----------
const hasRules = pages.some((p) => p.slug === "rules");
if (!hasRules) {
  const enforced = new Map();
  let blind = [];
  const cs = join(dirname(fileURLToPath(import.meta.url)), "check-system.mjs");
  if (existsSync(cs)) {
    const r = spawnSync(process.execPath, [cs, "--list-rules"], { encoding: "utf8" });
    for (const l of (r.stdout || "").split("\n")) { const [id, text] = l.split("\t"); if (id && text) enforced.set(id, text); }
    const b = spawnSync(process.execPath, [cs, "--list-blind-spots"], { encoding: "utf8" });
    if (b.status === 0) blind = (b.stdout || "").split("\n").filter(Boolean);
  }
  const cited = new Map();
  for (const p of pages) {
    for (const line of stripFences(p.text).split("\n")) {
      for (const m of line.matchAll(/`?((?:trap|rule)\/[a-z0-9-]+)`?/g)) {
        const id = m[1];
        if (!cited.has(id)) cited.set(id, { pages: new Set(), text: "" });
        const c = cited.get(id);
        c.pages.add(p.slug);
        const def = new RegExp("^\\s*[-*]\\s*`?" + id.replace("/", "\\/") + "`?\\s*:\\s*(.+)$").exec(line);
        if (def && !c.text) c.text = plain(def[1]).split(/ Evidence:/)[0];
      }
    }
  }
  for (const id of enforced.keys()) if (!cited.has(id)) cited.set(id, { pages: new Set(), text: "" });
  const rows = [...cited.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, c]) => {
    const rule = c.text || (enforced.get(id) || "").split(". Fix:")[0] || "See the page";
    const where = [...c.pages].sort().map((s) => `[${s}](${base}/${s}.md)`).join(", ") || "none yet";
    const check = enforced.has(id) ? "`scripts/check-system.mjs`" : "by hand";
    return `| \`${id}\` | ${rule.replace(/\|/g, "\\|")} | ${where} | ${check} |`;
  });
  const md = `${MARK(rel(srcDir) + "/*.md and scripts/check-system.mjs --list-rules")}\n# Rules\n\nEverything this app's UI must not do, in one place. Read it before writing UI. A rule marked "by hand" has no script yet, so a reviewer checks it.\n\n| ID | Rule | Answered on | Enforced by |\n|---|---|---|---|\n${rows.join("\n")}\n${blind.length ? `\n## What the check can't see\n\nA reviewer or a browser covers these. Passing \`${checkCommand}\` says nothing about them.\n\n${blind.map((b) => `- ${b}.`).join("\n")}\n` : ""}`;
  outputs.set(join(outDir, "rules.md"), md);
  pages.push({ slug: "rules", title: "Rules", kind: "Rules", note: "every trap and rule ID, the page that answers it and the check that enforces it", twin: md, generated: true });
}

// ---------- overview ----------
const ORDER = ["Foundations", "Components", "Patterns", "Rules", "Other"];
const listing = (fmt) => ORDER.map((k) => {
  const ps = pages.filter((p) => p.kind === k).sort((a, b) => a.slug.localeCompare(b.slug));
  return ps.length ? `## ${k}\n${ps.map(fmt).join("\n")}\n` : "";
}).filter(Boolean).join("\n");
const link = (p) => `- [${p.title}](${base}/${p.slug}.md)${p.note ? `: ${p.note}` : ""}`;
const own = pages.find((p) => p.kind === "Overview");
const overview = own
  ? `${own.twin.replace(/\s*$/, "\n")}\n${listing(link)}`
  : `${MARK(rel(srcDir) + "/*.md")}\n# ${name} design system\n\nTokens, components and rules for ${name}. Read a page's .md twin before writing UI, and ${base}/rules.md before any change.\n\nNew UI uses a registry component. If none fits, open a gate before writing one. Check your work with \`${checkCommand}\`.\n\n${listing(link)}`;
outputs.set(join(outDir, own ? `${own.slug}.md` : "index.md"), overview);

// ---------- llms.txt ----------
const llms = `# ${name} design system\n\n> Tokens, components and rules for ${name}. Read a page's .md twin before writing UI. Start with ${base}/rules.md.\n\n${listing(link)}`;
outputs.set(llmsPath, llms);

// ---------- index.html ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`);
function render(md, idp) {
  const out = [];
  const L = md.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  for (let i = 0; i < L.length; i++) {
    const l = L[i];
    let m;
    if ((m = /^(`{3,}|~{3,})(.*)$/.exec(l))) {
      const buf = []; i++;
      while (i < L.length && !L[i].startsWith(m[1])) buf.push(L[i++]);
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`); continue;
    }
    if ((m = /^(#{1,6}) (.+)$/.exec(l))) { const lv = Math.min(6, m[1].length + 1); const id = `${idp}-${m[2].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`; out.push(`<h${lv} id="${id}">${inline(m[2])}</h${lv}>`); continue; }
    if (/^\s*\|/.test(l)) {
      const rows = []; while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]); i--;
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
      const body = rows.filter((r, k) => !(k === 1 && /^[\s|:-]+$/.test(r)));
      out.push(`<table>${body.map((r, k) => `<tr>${cells(r).map((c) => (k === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join("")}</tr>`).join("")}</table>`); continue;
    }
    if (/^\s*([-*]|\d+\.) /.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items = [];
      while (i < L.length && /^\s*([-*]|\d+\.) /.test(L[i])) items.push(L[i++].replace(/^\s*([-*]|\d+\.) /, "")); i--;
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`); continue;
    }
    if (/^>\s?/.test(l)) { out.push(`<blockquote>${inline(l.replace(/^>\s?/, ""))}</blockquote>`); continue; }
    if (!l.trim()) continue;
    const para = [l]; while (i + 1 < L.length && L[i + 1].trim() && !/^(#|\s*\||\s*([-*]|\d+\.) |`{3,}|~{3,}|>)/.test(L[i + 1])) para.push(L[++i]);
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}
const pub = join(root, "public") + sep;
const llmsHref = llmsPath.startsWith(pub) ? "/" + posix(relative(join(root, "public"), llmsPath)) : posix(relative(outDir, llmsPath));
const all = pages.filter((p) => p.kind !== "Overview").sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.slug.localeCompare(b.slug));
const html = `<!doctype html>
<!-- generated by scripts/gen-docs.mjs from ${rel(srcDir)}/*.md. Edit the sources and rerun. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} design system</title>
<link rel="alternate" type="text/markdown" href="${base}/index.md">
<style>body{max-width:72ch;margin:0 auto;padding:16px;font:16px/1.5 system-ui,sans-serif}table{border-collapse:collapse;display:block;overflow-x:auto}td,th{border:1px solid;padding:4px 8px;text-align:left;vertical-align:top}pre{overflow-x:auto}section{margin-top:48px}</style>
</head>
<body>
<nav><h1>${esc(name)} design system</h1>
${ORDER.map((k) => { const ps = all.filter((p) => p.kind === k); return ps.length ? `<h2>${k}</h2><ul>${ps.map((p) => `<li><a href="#${p.slug.replace(/\//g, "-")}">${esc(p.title)}</a> (<a href="${base}/${p.slug}.md">.md</a>)${p.note ? `: ${esc(p.note)}` : ""}</li>`).join("")}</ul>` : ""; }).join("\n")}
<p>Check command: <code>${esc(checkCommand)}</code>. Machine index: <a href="${llmsHref}">llms.txt</a>.</p>
</nav>
${all.map((p) => `<section id="${p.slug.replace(/\//g, "-")}">\n${render(p.twin, p.slug.replace(/\//g, "-"))}\n</section>`).join("\n")}
</body>
</html>
`;
outputs.set(join(outDir, "index.html"), html);

// ---------- write or check ----------
let drift = 0;
for (const [p, content] of [...outputs].sort()) {
  const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (checkOnly) {
    if (cur === null) { console.log(`missing: ${rel(p)}`); drift++; }
    else if (cur !== content) { console.log(`stale: ${rel(p)} (differs from a fresh generation)`); drift++; }
  } else if (cur !== content) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); }
}
// generated files whose source is gone
if (existsSync(outDir)) {
  const orphans = [];
  const scan = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) scan(p); else if (/\.(md|html)$/.test(e) && !outputs.has(p) && /generated by scripts\/gen-docs\.mjs/.test(readFileSync(p, "utf8").slice(0, 300))) orphans.push(p); } };
  scan(outDir);
  for (const p of orphans) { console.log(`orphan: ${rel(p)} (generated, source removed; delete it)`); drift++; }
}
if (checkOnly) {
  console.log(`gen-docs --check: ${outputs.size} output(s), ${drift ? `${drift} out of date. Run node scripts/gen-docs.mjs` : "all fresh"}`);
  process.exit(drift ? 1 : 0);
}
console.log(`gen-docs: ${pages.filter((p) => !p.generated).length} source(s) -> ${outputs.size} file(s) in ${rel(outDir)} and ${rel(llmsPath)}${drift ? `. ${drift} orphan(s) listed above` : ""}`);
process.exit(drift ? 1 : 0);
