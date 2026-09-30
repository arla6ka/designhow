#!/usr/bin/env node
// gen-docs.mjs: specs and foundation pages in docs/system/*.md become Markdown twins,
// a rules page, llms.txt, a plain HTML index, the compressed index in AGENTS.md and
// docs/system/changelog.md. Node 18+, no dependencies.
// Run `node scripts/gen-docs.mjs --help` for usage.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = `gen-docs.mjs: generate the design system docs from their sources

Usage: node scripts/gen-docs.mjs [options]

Reads every .md under --src (spec-template.md and files starting with _ are skipped)
and writes, under --out:
  <slug>.md     a twin of each source, first line an HTML comment naming this script
  rules.md      every trap/ and rule/ ID the sources cite, with the page that answers
                it, its grounds, and the check that enforces it (check-system.mjs and
                copy-check.mjs --list-rules, else the rule's Check: clause, else review)
  index.md      the overview: what to read first, every page with a one-line note
  index.html    one plain HTML page rendering the overview and every twin
and --llms (llms.txt) linking every twin. Output is byte-stable: no dates.

It also writes:
  AGENTS.md     a compressed index between <!-- ds-index:start --> and
                <!-- ds-index:end -->: token names by role (from the token
                sources in scripts/check-system.config.json), components with
                import path and one-line job, the rule ids, and the commands.
                The markers are appended to the end of AGENTS.md when missing,
                and the file is created when there is none. Text outside the
                markers is never touched
  <src>/changelog.md  commits that touched --src or the token sources, newest
                first, from git log. --check skips it, since the commit that
                writes it changes the log. A changelog.md this script did not
                write is left alone

A component page's Props section gets a table generated from its source file's
types (scripts/props-table.mjs), found through the registry. The source file keeps
only notes under ## Props. A hand-written table there is replaced in the twin.
Purpose text comes from JSDoc on the props type.

A component page's twin embeds each file its "### Example files" table lists:
default, composition and matrix rows at the end of Examples, axis=value rows
under that axis in Variants, and state: rows in States before State precedence.
Line 1 (the Caption: comment) is dropped.

docs/alternative-oneway: when page A's When not to use line names component B
and B has a page, B's Related must name A. --check fails on it; a write run
prints it as a warning.

Settings live in scripts/gen-docs.config.json (src, out, llms, base, name,
registry, checkCommand, examplesDir). A write run with any of those flags saves them there, so
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
  --examples <dir>    example files folder (default: docs/system/examples)
  --config <file>     settings file (default: scripts/gen-docs.config.json)
  --no-props          leave Props sections as written
  --check             write nothing; exit 1 if any output differs from a fresh run
  --self-test         run the fixtures in --fixtures <dir>, default fixtures/gen-docs/
                      beside this script, and nothing else
  --help              this text

Exit 0 on success, 1 on drift in --check mode, 2 on bad input.`;

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
if (argv.includes("--self-test")) process.exit(selfTest(val("--fixtures")) ? 0 : 1);
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
const KEYS = { src: "--src", out: "--out", llms: "--llms", base: "--base", name: "--name", registry: "--registry", checkCommand: "--check-command", examplesDir: "--examples" };
// An absolute path inside the root is kept relative to it, so the saved settings work on any clone.
const inside = (k, v) => (["src", "out", "llms", "registry", "examplesDir"].includes(k) && v && isAbsolute(v) && !relative(root, v).startsWith("..") ? relative(root, v).split(sep).join("/") || "." : v);
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
// Foundation page slugs. check-spec.mjs keeps the same list.
const FOUNDATIONS = ["colors", "typography", "materials", "layout", "spacing", "radius", "elevation", "motion", "icons", "brand", "writing"];
const examplesDir = setting("examplesDir", "docs/system/examples").replace(/^\.\//, "").replace(/\/+$/, "");
const examplesAbs = resolve(root, examplesDir);

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

// registry: id -> source path, and every entry's id and names for the one-way alternative check
const sources = new Map();
const entries = [];
const pascal = (id) => id.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const regPath = resolve(root, setting("registry", "registry.json"));
if (existsSync(regPath)) {
  try {
    const reg = JSON.parse(readFileSync(regPath, "utf8"));
    for (const it of [...(reg.components || []), ...(reg.items || [])]) {
      const id = String(it.id || it.name || "").toLowerCase();
      const s = it.source || it.meta?.source || (it.files || []).map((f) => (typeof f === "string" ? f : f.path))[0];
      if (id && s) sources.set(id, s);
      if (id) entries.push({ id, names: [...new Set([id, it.name, it.meta?.name, it.title, pascal(id)].filter((n) => typeof n === "string" && n))] });
    }
  } catch (e) { console.error(`gen-docs: cannot parse ${rel(regPath)}: ${e.message}`); process.exit(2); }
}

// ---------- read sources ----------
const pages = [];
const walk = (d, prefix) => {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (!e.startsWith(".") && !e.startsWith("_") && !(d === srcDir && e === "rule-tests") && p !== examplesAbs) walk(p, `${prefix}${e}/`); continue; }
    if (!e.endsWith(".md") || e.startsWith("_") || e === "spec-template.md" || e === "README.md" || (d === srcDir && e === "changelog.md")) continue;
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

// ---------- examples in twins ----------
// H2 and H3 positions in a page's lines, outside fences.
function heads(lines) {
  const out = [];
  let fence = null;
  lines.forEach((l, i) => {
    const f = /^(`{3,}|~{3,})/.exec(l);
    if (f) { if (!fence) fence = f[1]; else if (l.startsWith(fence)) fence = null; return; }
    if (fence) return;
    const m = /^(##|###) (.+?)\s*$/.exec(l);
    if (m) out.push({ level: m[1].length, name: m[2].replace(/`/g, "").trim(), i });
  });
  return out;
}
const cellsOf = (l) => l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());
// The rows of a page's "### Example files" table: [{ path, covers, caption }] for rows whose File is a path.
function exampleRows(text) {
  const lines = text.split("\n"), hs = heads(lines);
  const at = hs.findIndex((h) => h.level === 3 && h.name === "Example files");
  if (at < 0) return [];
  const rows = [];
  for (let i = hs[at].i + 1; i < lines.length && !/^#{1,3} /.test(lines[i]); i++) if (/^\s*\|/.test(lines[i])) rows.push(cellsOf(lines[i]));
  if (rows.length < 2) return [];
  const col = (re) => rows[0].findIndex((h) => re.test(h));
  const [cf, cc, cp] = [col(/^file$/i), col(/^covers$/i), col(/^caption$/i)];
  if (cf < 0 || cc < 0) return [];
  return rows.slice(2).map((r) => ({ path: (/^`([^`]+)`$/.exec(r[cf] || "") || [])[1], covers: (r[cc] || "").replace(/`/g, "").trim(), caption: cp >= 0 ? r[cp] || "" : "" })).filter((r) => r.path);
}
const LANG = { tsx: "tsx", jsx: "jsx", ts: "ts", js: "js", vue: "vue", svelte: "svelte", astro: "astro", html: "html" };
function exampleBlock(path, caption) {
  let src = readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n").split("\n");
  if (/Caption:/.test(src[0])) src = src.slice(1);
  const code = src.map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\s+$/, "");
  const longest = Math.max(2, ...[...code.matchAll(/^\s*(`{3,})/gm)].map((m) => m[1].length));
  const fence = "`".repeat(longest + 1);
  return `Example: ${caption} (\`${path}\`)\n\n${fence}${LANG[path.split(".").pop()] || ""}\n${code}\n${fence}`;
}
// Insert each listed example into the twin: default, composition and matrix at the end of Examples, axis=value under
// that axis in Variants (else the end of Variants), state: in States before State precedence.
function withExamples(body, p) {
  const rows = exampleRows(stripComments(p.text));
  if (!rows.length) return body;
  const lines = body.split("\n"), hs = heads(lines);
  const h2 = (name) => hs.findIndex((h) => h.level === 2 && h.name === name);
  const endOf = (k) => { const next = hs.slice(k + 1).find((h) => h.level <= hs[k].level); let e = next ? next.i : lines.length; while (e > hs[k].i + 1 && !lines[e - 1].trim()) e--; return e; };
  const spot = new Map(); // insertion index -> blocks
  const put = (at, block) => { if (!spot.has(at)) spot.set(at, []); spot.get(at).push(block); };
  const exK = h2("Examples");
  for (const r of rows) {
    if (!existsSync(join(root, r.path))) { console.log(`examples: ${r.path} listed in ${rel(p.file)} does not exist`); continue; }
    let at = exK >= 0 ? endOf(exK) : null;
    const axis = /^([A-Za-z][\w-]*)=/.exec(r.covers);
    if (axis) {
      const vK = h2("Variants");
      if (vK >= 0) {
        const vEnd = hs.findIndex((h, k) => k > vK && h.level === 2);
        const aK = hs.findIndex((h, k) => k > vK && (vEnd < 0 || k < vEnd) && h.level === 3 && h.name.toLowerCase() === axis[1].toLowerCase());
        at = endOf(aK >= 0 ? aK : vK);
      }
    } else if (r.covers.startsWith("state:")) {
      const sK = h2("States");
      if (sK >= 0) {
        const pK = hs.findIndex((h, k) => k > sK && h.level === 3 && h.name === "State precedence" && !hs.slice(sK + 1, k).some((x) => x.level === 2));
        if (pK >= 0) { let e = hs[pK].i; while (e > hs[sK].i + 1 && !lines[e - 1].trim()) e--; at = e; } else at = endOf(sK);
      }
    }
    if (at === null) at = lines.length;
    put(at, exampleBlock(r.path, r.caption));
  }
  for (const at of [...spot.keys()].sort((a, b) => b - a)) lines.splice(at, 0, ...spot.get(at).flatMap((b) => ["", b]));
  return lines.join("\n");
}
function stripComments(t) { return t.replace(/^\s*<!--[\s\S]*?-->\s*\n/, ""); }

// ---------- twins ----------
const outputs = new Map(); // abs path -> content
for (const p of pages) {
  let body = p.text.replace(/^\s*<!--[\s\S]*?-->\s*\n/, "");
  if (!/^# /m.test(body.split("\n").find((l) => l.trim()) || "")) body = `# ${titleOf(p)}\n\n${body}`;
  const source = sources.get(p.slug.split("/").pop());
  if (propsFor.has(p.slug)) body = withProps(body, propsFor.get(p.slug));
  if (/^## States\s*$/m.test(stripFences(p.text))) body = withExamples(body, p);
  if (source && !body.includes(source)) body = body.replace(/\s*$/, `\n\nSource: \`${source}\`\n`);
  p.twin = `${MARK(rel(p.file))}\n${body.replace(/\s*$/, "\n")}`;
  p.kind = kindOf(p);
  p.title = titleOf(p);
  p.note = noteOf(p);
  outputs.set(join(outDir, `${p.slug}.md`), p.twin);
}

// ---------- rules page ----------
// A rule definition line and its continuation lines, joined with one space (rule-method.md, Rule shape).
function definitions(text) {
  const out = [];
  let cur = null;
  for (const l of stripFences(text).split("\n")) {
    const m = /^\s*[-*]\s*`?((?:trap|rule)\/[a-z0-9-]+)`?\s*:\s*(.+)$/.exec(l);
    if (m) { cur = { id: m[1], text: m[2].trim() }; out.push(cur); continue; }
    if (cur && /^\s{2,}\S/.test(l) && !/^\s*(Don't|Do):/.test(l) && !/^\s*[-*] /.test(l)) { cur.text += " " + l.trim(); continue; }
    cur = null;
  }
  return out;
}
const GROUND_KINDS = [["app", /^app \d+\/\d+ \S/], ["single use", /^single use \S+:\d+/], ["measured", /^measured .*\d/], ["principle", /^principle (wcag|platform|heuristic|input): \S/], ["person", /^person ["\u201c].+["\u201d]/]];
function groundsOf(text) {
  const e = text.indexOf("Evidence: ");
  if (e < 0) return "";
  const c = text.indexOf("Check: ", e);
  const gs = text.slice(e + 10, c < 0 ? undefined : c).trim().replace(/\.$/, "").split("; ").map((g) => g.trim());
  return GROUND_KINDS.filter(([, re]) => gs.some((g) => re.test(g))).map(([k]) => k).join(", ");
}
const checkOf = (text) => { const c = text.indexOf("Check: ", Math.max(0, text.indexOf("Evidence: "))); return c < 0 ? "" : text.slice(c + 7).trim().replace(/\.$/, ""); };
const hasRules = pages.some((p) => p.slug === "rules");
// Every rule and trap id the docs cite or the checks enforce, for the AGENTS.md index.
let ruleIds = new Set(pages.flatMap((p) => [...stripFences(p.text).matchAll(/`((?:trap|rule)\/[a-z0-9-]+)`/g)].map((m) => m[1])));
if (!hasRules) {
  const listRules = (script) => {
    const m = new Map();
    const f = join(dirname(fileURLToPath(import.meta.url)), script);
    if (!existsSync(f)) return m;
    const r = spawnSync(process.execPath, [f, "--list-rules"], { encoding: "utf8" });
    for (const l of (r.stdout || "").split("\n")) { const [id, text] = l.split("\t"); if (id && text) m.set(id, text); }
    return m;
  };
  const enforced = listRules("check-system.mjs");
  const copyRules = listRules("copy-check.mjs");
  let blind = [];
  const cs = join(dirname(fileURLToPath(import.meta.url)), "check-system.mjs");
  if (existsSync(cs)) {
    const b = spawnSync(process.execPath, [cs, "--list-blind-spots"], { encoding: "utf8" });
    if (b.status === 0) blind = (b.stdout || "").split("\n").filter(Boolean);
  }
  const cited = new Map();
  const entry = (id) => { if (!cited.has(id)) cited.set(id, { pages: new Set(), text: "", ground: "", check: "" }); return cited.get(id); };
  for (const p of pages) {
    for (const line of stripFences(p.text).split("\n")) for (const m of line.matchAll(/`?((?:trap|rule)\/[a-z0-9-]+)`?/g)) entry(m[1]).pages.add(p.slug);
    for (const d of definitions(p.text)) {
      const c = entry(d.id);
      if (c.text) continue;
      c.text = plain(d.text.split(/ Evidence:/)[0]);
      if (d.id.startsWith("rule/")) { c.ground = groundsOf(d.text); c.check = checkOf(d.text); }
    }
  }
  for (const id of enforced.keys()) entry(id);
  // copy-check runs once a writing page exists, so its rules join the page then.
  if (pages.some((p) => p.slug.split("/").pop() === "writing")) for (const id of copyRules.keys()) entry(id);
  ruleIds = new Set(cited.keys());
  const rows = [...cited.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, c]) => {
    const rule = c.text || (enforced.get(id) || copyRules.get(id) || "").split(". Fix:")[0] || "See the page";
    const where = [...c.pages].sort().map((s) => `[${s}](${base}/${s}.md)`).join(", ") || "none yet";
    const check = enforced.has(id) ? "`scripts/check-system.mjs`" : copyRules.has(id) ? "`scripts/copy-check.mjs`" : c.check || "review";
    return `| \`${id}\` | ${rule.replace(/\|/g, "\\|")} | ${where} | ${c.ground} | ${check.replace(/\|/g, "\\|")} |`;
  });
  const md = `${MARK(rel(srcDir) + "/*.md, scripts/check-system.mjs --list-rules and scripts/copy-check.mjs --list-rules")}\n# Rules\n\nEverything this app's UI must not do, in one place. Read it before writing UI. A rule marked "review" has no script yet, so a reviewer checks it.\n\n| ID | Rule | Answered on | Ground | Enforced by |\n|---|---|---|---|---|\n${rows.join("\n")}\n${blind.length ? `\n## What the check can't see\n\nA reviewer or a browser covers these. Passing \`${checkCommand}\` says nothing about them.\n\n${blind.map((b) => `- ${b}.`).join("\n")}\n` : ""}`;
  outputs.set(join(outDir, "rules.md"), md);
  pages.push({ slug: "rules", title: "Rules", kind: "Rules", note: "every trap and rule ID, the page that answers it and the check that enforces it", twin: md, generated: true });
}

// ---------- one-way alternatives ----------
// docs/alternative-oneway: page A's When not to use names registry component B (a name or id after "Use ", whole
// word, case-insensitive), B has a page, and B's Related names A nowhere.
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordIn = (names, t) => names.some((n) => new RegExp(`(?<![\\w-])${escRe(n)}(?![\\w-])`, "i").test(t));
const oneway = [];
for (const a of pages.filter((p) => p.kind === "Components")) {
  const aId = a.slug.split("/").pop();
  const aNames = entries.find((e) => e.id === aId)?.names || [aId, a.title, pascal(aId)];
  const lines = a.text.split("\n"), hs = heads(lines);
  const u = hs.findIndex((h) => h.level === 2 && h.name === "Usage");
  const w = hs.findIndex((h, k) => k > u && u >= 0 && h.level === 3 && h.name === "When not to use" && !hs.slice(u + 1, k).some((x) => x.level === 2));
  if (w < 0) continue;
  for (let i = hs[w].i + 1; i < lines.length && !/^#{1,3} /.test(lines[i]); i++) {
    const t = lines[i].replace(/^[-*]\s+/, "");
    if (!/^[-*] /.test(lines[i]) || t.indexOf("Use ") < 0) continue;
    const rest = t.slice(t.indexOf("Use ") + 4);
    for (const b of entries.filter((e) => e.id !== aId && wordIn(e.names, rest))) {
      const bp = pages.find((p) => p.kind === "Components" && p.slug.split("/").pop() === b.id);
      if (!bp) continue;
      const bl = bp.text.split("\n"), bh = heads(bl);
      const r = bh.findIndex((h) => h.level === 2 && h.name === "Related");
      const related = [];
      if (r >= 0) for (let k = bh[r].i + 1; k < bl.length && !/^## /.test(bl[k]); k++) if (/^\s*[-*] /.test(bl[k])) related.push(bl[k]);
      if (!related.some((l) => wordIn(aNames, l))) oneway.push(`${rel(a.file)}:${i + 1} docs/alternative-oneway ${a.title} routes to ${bp.title}, but ${bp.title}'s Related does not name ${a.title}`);
    }
  }
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

// ---------- AGENTS.md index ----------
// A compressed index an agent reads first: tokens by role, components, rule ids and commands. Aim: 60 lines or fewer.
const csCfg = (() => { try { return JSON.parse(readFileSync(join(root, "scripts/check-system.config.json"), "utf8")); } catch { return {}; } })();
const tokenFiles = (csCfg.tokenSources || []).filter((f) => existsSync(join(root, f)) && /\.(css|scss|pcss)$/.test(f));
// Custom properties outside dark-theme blocks, in source order.
function tokenNames(files) {
  const out = new Map();
  for (const f of files) {
    const code = readFileSync(join(root, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const stack = [];
    let start = 0;
    for (let i = 0; i < code.length; i++) {
      const c = code[i];
      if (c === "{") { stack.push(code.slice(start, i).trim()); start = i + 1; }
      else if (c === "}" || c === ";") {
        const m = /^\s*(--[\w-]+)\s*:\s*([\s\S]*)$/.exec(code.slice(start, i));
        if (m && !stack.some((p) => /\.dark\b|\[data-(?:theme|mode)=["']?dark|prefers-color-scheme:\s*dark|@keyframes/.test(p)) && !out.has(m[1])) out.set(m[1], m[2].trim());
        if (c === "}") stack.pop();
        start = i + 1;
      }
    }
  }
  return out;
}
const ROLES = [
  ["color", (n, v) => /^--color-/.test(n) || /^(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix|color)\(|-?[\d.]+(?:deg)?\s+[\d.]+%\s+[\d.]+%)/i.test(v)],
  ["type", (n) => /font|^--text-|leading|tracking|line-height|letter/.test(n)],
  ["space", (n) => /space|spacing|gap|gutter|inset|pad|margin/.test(n)],
  ["radius", (n) => /radius|rounded/.test(n)],
  ["shadow", (n) => /shadow|elevation/.test(n)],
  ["motion", (n) => /duration|ease|motion|delay|transition|animate/.test(n)],
  ["size", (n) => /size|height|width|control|breakpoint|container/.test(n)],
  ["layer", (n) => /^--z|layer/.test(n)],
];
function agentsIndex() {
  const L = [];
  const docs = rel(outDir);
  L.push("## Design system", "", `Before writing UI, read the page for what you touch in \`${docs}/\` and the rules in \`${docs}/rules.md\`. Use a listed component or token. If none fits, ask before adding one.`);
  const toks = tokenNames(tokenFiles);
  if (toks.size) {
    const by = new Map();
    for (const [n, v] of toks) { const role = (ROLES.find(([, t]) => t(n, v)) || ["other"])[0]; if (!by.has(role)) by.set(role, []); by.get(role).push(n); }
    L.push("", `Tokens by role (${tokenFiles.join(", ")}):`);
    for (const role of [...ROLES.map(([r]) => r), "other"]) if (by.has(role)) { const ns = by.get(role); L.push(`- ${role}: ${ns.slice(0, 24).join(", ")}${ns.length > 24 ? `, and ${ns.length - 24} more` : ""}`); }
  }
  const comps = [];
  const seen = new Set();
  if (existsSync(regPath)) {
    const reg = JSON.parse(readFileSync(regPath, "utf8"));
    for (const it of [...(reg.components || []), ...(reg.items || [])]) {
      const id = String(it.id || it.name || "").toLowerCase(); if (!id || seen.has(id)) continue; seen.add(id);
      const page = pages.find((p) => p.slug.split("/").pop() === id && p.kind === "Components");
      const imp = it.import || it.meta?.import || sources.get(id) || "";
      const job = (page && page.note) || it.description || it.meta?.description || "";
      comps.push(`- ${page ? page.title : it.name || pascal(id)}${imp ? ` \`${imp}\`` : ""}${job ? `: ${job}` : ""}`);
    }
  }
  for (const p of pages.filter((x) => x.kind === "Components" && !seen.has(x.slug.split("/").pop()))) comps.push(`- ${p.title}${sources.get(p.slug.split("/").pop()) ? ` \`${sources.get(p.slug.split("/").pop())}\`` : ""}${p.note ? `: ${p.note}` : ""}`);
  if (comps.length) L.push("", "Components (import, job):", ...comps.sort());
  const ids = [...ruleIds].sort();
  for (const [kind, label] of [["rule/", "Rule ids"], ["trap/", "Trap ids"]]) { const list = ids.filter((x) => x.startsWith(kind)); if (list.length) L.push("", `${label}: ${list.join(", ")}`); }
  const cmds = [[checkCommand, "the check. Run it before you finish"]];
  const has = (f) => existsSync(join(root, "scripts", f));
  if (has("check-system.mjs")) cmds.push(["node scripts/check-system.mjs --explain <rule-id>", "what a rule means and its fix"]);
  if (has("check-spec.mjs")) cmds.push([`node scripts/check-spec.mjs ${rel(srcDir)}`, "a spec leaves no question open"]);
  cmds.push(["node scripts/gen-docs.mjs", "regenerate the docs and this index after editing a page"]);
  L.push("", "Commands:", ...cmds.map(([c, w]) => `- \`${c}\`: ${w}`));
  return `<!-- ds-index:start -->\n<!-- generated by scripts/gen-docs.mjs from ${rel(srcDir)}, the registry and the token sources. Edit those and rerun. -->\n${L.join("\n")}\n<!-- ds-index:end -->`;
}
const agentsPath = join(root, "AGENTS.md");
{
  const block = agentsIndex();
  const cur = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
  const re = /<!-- ds-index:start -->[\s\S]*?<!-- ds-index:end -->/;
  outputs.set(agentsPath, re.test(cur) ? cur.replace(re, () => block) : `${cur}${cur && !cur.endsWith("\n") ? "\n" : ""}${cur ? "\n" : ""}${block}\n`);
}

// ---------- changelog ----------
// Commits that touched the docs sources or the token sources, newest first. Written, never compared by --check.
const changelogPath = join(srcDir, "changelog.md");
let changelog = null;
{
  const CL_MARK = "<!-- generated by scripts/gen-docs.mjs from git log";
  const own = !existsSync(changelogPath) || readFileSync(changelogPath, "utf8").startsWith(CL_MARK);
  const paths = [rel(srcDir), ...tokenFiles];
  let log = null;
  try { log = execSync(`git log -n 300 --date=short --format=%h%x09%ad%x09%s -- ${paths.map((p) => `'${p.replace(/'/g, "")}'`).join(" ")} ':(exclude)${rel(changelogPath)}'`, { cwd: root, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 16 << 20 }).toString(); } catch {}
  if (!own) console.log(`changelog: ${rel(changelogPath)} was not written by this script, so it is left as it is`);
  else if (log && log.trim()) {
    const byDay = new Map();
    for (const l of log.trim().split("\n")) { const [h, d, ...subj] = l.split("\t"); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(`- ${subj.join("\t").trim()} (\`${h}\`)`); }
    changelog = `${CL_MARK} of ${paths.join(", ")}. Rerun after a commit. -->\n# Changelog\n\nChanges to the design system docs and tokens, newest first.\n\n${[...byDay].map(([d, ls]) => `## ${d}\n\n${ls.join("\n")}\n`).join("\n")}`;
  }
}

// ---------- write or check ----------
let drift = 0;
for (const [p, content] of [...outputs].sort()) {
  const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (checkOnly) {
    if (cur === null) { console.log(`missing: ${rel(p)}`); drift++; }
    else if (cur !== content) { console.log(`stale: ${rel(p)} (differs from a fresh generation)`); drift++; }
  } else if (cur !== content) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); }
}
if (!checkOnly && changelog !== null && (!existsSync(changelogPath) || readFileSync(changelogPath, "utf8") !== changelog)) writeFileSync(changelogPath, changelog);
// generated files whose source is gone
if (existsSync(outDir)) {
  const orphans = [];
  const scan = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) scan(p); else if (/\.(md|html)$/.test(e) && !outputs.has(p) && /generated by scripts\/gen-docs\.mjs/.test(readFileSync(p, "utf8").slice(0, 300))) orphans.push(p); } };
  scan(outDir);
  for (const p of orphans) { console.log(`orphan: ${rel(p)} (generated, source removed; delete it)`); drift++; }
}
for (const l of oneway) console.log(checkOnly ? l : `warning: ${l}`);
if (checkOnly) {
  console.log(`gen-docs --check: ${outputs.size} output(s), ${drift ? `${drift} out of date. Run node scripts/gen-docs.mjs` : "all fresh"}${oneway.length ? `, ${oneway.length} one-way alternative(s)` : ""}`);
  process.exit(drift || oneway.length ? 1 : 0);
}
console.log(`gen-docs: ${pages.filter((p) => !p.generated).length} source(s) -> ${outputs.size} file(s) in ${rel(outDir)} and ${rel(llmsPath)}${drift ? `. ${drift} orphan(s) listed above` : ""}`);
process.exit(drift ? 1 : 0);

// ---------- self-test ----------
// Each fixtures/gen-docs/<case>/ holds case.json and fail/ and pass/ folders, each a mini repo whose .fixture files
// are read under their inner name. case.json: { "rule", "match", "count", "failExit", "contains" }. The run writes
// the docs, then runs --check. fail/ must print exactly count --check lines holding match and exit failExit
// (default 1). pass/ must print none and exit 0. contains maps an output path to strings it must hold, in pass/.
// In both folders, once maps a path to strings it must hold exactly once, and twice lists paths a second write must
// leave byte for byte as the first wrote them.
function selfTest(dirArg) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = dirArg ? resolve(dirArg) : ((p) => existsSync(p) ? p : join(here, "..", "fixtures", "gen-docs"))(join(here, "fixtures", "gen-docs"));
  if (!existsSync(dir)) { console.log(`self-test: FAIL, no fixtures at ${dir}`); return false; }
  const me = fileURLToPath(import.meta.url);
  let ok = true, n = 0;
  for (const c of readdirSync(dir).sort()) {
    const caseFile = join(dir, c, "case.json");
    if (!existsSync(caseFile)) continue;
    const spec = JSON.parse(readFileSync(caseFile, "utf8"));
    for (const kind of ["fail", "pass"]) {
      const src = join(dir, c, kind);
      if (!existsSync(src)) { console.log(`self-test: ${c}/${kind} missing`); ok = false; continue; }
      const tmp = mkdtempSync(join(tmpdir(), "gen-docs-"));
      cpSync(src, tmp, { recursive: true });
      const unfix = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) unfix(p); else if (e.endsWith(".fixture")) renameSync(p, p.slice(0, -8)); } };
      unfix(tmp);
      const w = spawnSync(process.execPath, [me, "--root", tmp], { cwd: tmp, encoding: "utf8" });
      const r = spawnSync(process.execPath, [me, "--root", tmp, "--check"], { cwd: tmp, encoding: "utf8" });
      const read = (f) => (existsSync(join(tmp, f)) ? readFileSync(join(tmp, f), "utf8") : "");
      const hits = (r.stdout || "").split("\n").filter((l) => l.includes(spec.match));
      const missing = [];
      if (kind === "pass") for (const [f, want] of Object.entries(spec.contains || {})) {
        const text = existsSync(join(tmp, f)) ? readFileSync(join(tmp, f), "utf8") : "";
        for (const x of want) if (!text.includes(x)) missing.push(`${f} lacks ${JSON.stringify(x)}`);
      }
      for (const [f, want] of Object.entries(spec.once || {})) for (const x of want) { const k = read(f).split(x).length - 1; if (k !== 1) missing.push(`${f} holds ${JSON.stringify(x)} ${k} times, want once`); }
      if (spec.twice) {
        const first = spec.twice.map(read);
        spawnSync(process.execPath, [me, "--root", tmp], { cwd: tmp, encoding: "utf8" });
        spec.twice.forEach((f, k) => { if (read(f) !== first[k]) missing.push(`${f} changed on a second write`); });
      }
      rmSync(tmp, { recursive: true, force: true });
      const good = kind === "fail" ? hits.length === spec.count && r.status === (spec.failExit ?? 1) && !missing.some((x) => !/lacks/.test(x)) : !hits.length && r.status === 0 && !missing.length;
      if (!good) ok = false; n++;
      console.log(`self-test ${good ? "ok  " : "FAIL"} ${spec.rule} ${c}/${kind}: ${hits.length}/${kind === "fail" ? spec.count : 0}, exit ${r.status}${good ? "" : `  ${[...hits, ...missing, (r.stderr || w.stderr || "").trim()].filter(Boolean).join(" | ").slice(0, 600)}`}`);
    }
  }
  console.log(`self-test: ${n} fixtures, ${ok ? "all as expected" : "FAILED"}`);
  return ok;
}
