#!/usr/bin/env node
// check-spec.mjs [--root <repo>] [--no-props] [--no-fresh] [--no-rule-tests] [--no-examples] <file-or-folder or ->...
// check-spec.mjs --self-test [--fixtures <dir>]
// --root defaults to the git root of the first file or folder, else of the current folder, else the current folder.
// Fails a component spec that leaves a question from references/spec-template.md open, and a rule line that breaks
// the shape in references/rule-method.md. Prints "file:line rule-id message" per failure. Exit 0 clean, 1 on
// failures or no specs found, 2 on bad input. No dependencies.
// A file is a component spec only when it holds the spec marker "### State precedence" outside code fences. A plain
// component-docs entry has none, so it is skipped and counted. Foundation pages (basename in FOUNDATIONS, the list
// gen-docs.mjs uses) are checked too. Foundation pages get the rule-line rules
// only: spec/rule-id, spec/rule-shape, spec/vague-word, spec/dont-instead, spec/rule-cite and spec/rule-tests.
// "-" reads one spec from stdin, for an entry that exists only as text (component-docs under a coordinator).
// spec/props-drift compares the spec with the component at HEAD, through scripts/props-table.mjs: every Variants
// axis must be a prop, every listed value of a string-union prop must still exist, and every "- `prop`" note under
// Props must name a prop. A component that forwards a native element's attributes also accepts those names
// (type, disabled, readOnly, inputMode, on* handlers and the rest). --no-props skips it. Run it at close, so a
// spec that went stale during the run fails.
// spec/motion: when the component's source (the Description's source `path`) or a stylesheet it imports has a
// transition, an animation, @keyframes, a transition or animate-* class, or a motion library import, States needs a
// '### Motion' table (Trigger | Kind | Preset | Properties | Reduced motion) with Kind input or announce and no empty
// Kind, Preset or Reduced motion cell. 'Not applicable: no motion' passes only when the code has none. It reads the
// working tree, so it runs under --no-fresh too (CI tier 1).
// A rule the four tests sent to a gate is one line in its section, on any page kind:
// - Gated: `rule/<id>` (G-NN). <the question>   (references/spec-template.md, Gated rules)
// Freshness, skipped by --no-fresh:
// spec/call-sites  "Real uses, <n> call sites" under Examples (or "<n> call sites" in the Description) must equal the <Name tags (Name from the H1) in .tsx and .jsx
//                  files under the check's include folders (scripts/check-system.config.json, else app, src,
//                  components, lib, pages), outside the component's own folder and the examples folder
// spec/stale-cite  every file:line or file:start-end the spec cites must hold the same text as it did at the spec's
//                  last commit. A spec with uncommitted edits is being written against the working tree, so only
//                  the file's existence and the line count are checked
// spec/dead-path   a backticked repo path (a/b.ext or a/b/) that does not exist, or a backticked `npm run x`
//                  (pnpm, yarn, bun) whose script package.json does not define. "planned" on the line passes it
// spec/example-export  an example that imports a name its module does not export, when the module resolves to a
//                  repo file (a relative path, the component's source, or a tsconfig path). An import line marked
//                  "// planned" passes
// spec/test-file   a warning, never a failure: a States, Keyboard or ARIA row says "test" and no test file for the
//                  component exists (<slug>.test.* or <Name>.spec.*, or one under a __tests__ folder)
// Examples live in examplesDir from scripts/gen-docs.config.json, default docs/system/examples. Rule tests live in
// docs/system/rule-tests/<id>.tsv. docs/system/vague-words.txt adds words a rule may not lean on.
import { dirname, join, relative, resolve, basename, sep } from "node:path";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, execSync, spawnSync } from "node:child_process";

const SECTIONS = ["Description", "Examples", "Variants", "States", "Props", "Usage", "Accessibility", "Tokens", "Related"];
const USAGE = ["When to use", "When not to use", "Rules", "Content", "Anti-slop", "Limits"];
const OLD_USAGE = ["Use it when", "Use something else when", "Writing", "Do and don't"];
const PREV_USAGE = ["Behavior", "Best practices"];
const RULE_SECTIONS = ["Rules", "Content", "Anti-slop", "Limits"];
// Foundation page slugs. Keep equal to FOUNDATIONS in gen-docs.mjs.
const FOUNDATIONS = ["colors", "typography", "materials", "layout", "spacing", "radius", "elevation", "motion", "icons", "brand", "writing"];
const HARD_WORDS = ["appropriate", "appropriately", "consistent", "consistently", "properly", "as needed", "user-friendly", "should consider"];
const SOFT_WORDS = ["short", "long", "few", "many", "clear", "concise", "simple", "large", "small"];
const RULE_TESTS_HEAD = ["rule_id", "falsify", "negation", "two_agent", "sweep", "verdict", "notes"];
const CHECKED_BY = /^(test|lint|screenshot|a11y scan|snapshot|by hand)(\s*(,|and|\+)\s*(test|lint|screenshot|a11y scan|snapshot|by hand))*$/i;
const SKIP = /^(not applicable|not supplied|needs review)\b/i;
const DEF_RE = /^[-*] `(rule\/[^`]+)`: (.+)$/;
const CITE_RE = /^[-*] Follows `(rule\/[a-z0-9-]+)`\.?$/;
// A rule the four tests sent to a gate (references/spec-template.md, Gated rules): - Gated: `rule/<id>` (G-NN). <question>
const GATED_RE = /^[-*] Gated: `(rule\/[a-z0-9]+(?:-[a-z0-9]+)*)` \((G-[\w-]+)\)\.? \S/;
const ID_RE = /^rule\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const HELP = `check-spec.mjs: fail a component spec that leaves a question open

Usage: node scripts/check-spec.mjs [options] <file-or-folder or ->...
       node scripts/check-spec.mjs --self-test [--fixtures <dir>]

Folders are searched for component specs (*.md with a "## States" heading) and
foundation pages (colors, typography, writing and the other foundation slugs).
"-" reads one spec from stdin.

spec/motion: when the component's source or a stylesheet it imports moves (a
transition, animation, @keyframes, a transition or animate-* class, or a motion
library import), States needs a '### Motion' table after State precedence:
  | Trigger | Kind | Preset | Properties | Reduced motion |
Kind is input or announce. Kind, Preset and Reduced motion are never empty.
'Not applicable: no motion' passes only when the code has no motion.

spec/props-drift checks Variants axes and Props notes against the component's
props at HEAD. When the component forwards a native element's attributes, native
names such as type, disabled, readOnly, inputMode and on* handlers count as props.

A rule that went to a gate stays in its section as one line, on component and
foundation pages alike:
  - Gated: \`rule/<id>\` (G-NN). <the question in plain words>

Options
  --root <dir>       repo root. Default: the git root of the first file or folder,
                     else of the current folder, else the current folder
  --no-props         skip spec/props-drift
  --no-fresh         skip the checks against the repo now: spec/call-sites,
                     spec/stale-cite, spec/dead-path, spec/example-export and
                     the spec/test-file warning. The CI tier that runs on every
                     pull request uses it. spec/motion still runs
  --no-rule-tests    skip spec/rule-tests
  --no-examples      skip spec/examples
  --self-test        run the fixtures in --fixtures <dir>, default
                     fixtures/check-spec/ beside this script, and nothing else
  --fixtures <dir>   the fixture folder for the self-test
  --help             this text

Prints "file:line rule-id message" per failure, and "file:line spec/test-file
warning: message" per warning, which never fails. Exit 0 clean, 1 on failures
or no specs found, 2 on bad input.`;
const USAGE_LINE = "usage: check-spec.mjs [--root <repo>] [--no-props] [--no-fresh] [--no-rule-tests] [--no-examples] <file-or-folder or ->...\n--root defaults to the git root of the first file or folder, else of the current folder. --help for more.";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
const valOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const FLAGS = ["--root", "--no-props", "--no-fresh", "--no-rule-tests", "--no-examples", "--self-test", "--fixtures", "--help"];
const badFlags = argv.filter((a) => a.startsWith("--") && !FLAGS.includes(a));
if (badFlags.length) { console.error(`check-spec: unknown ${badFlags.join(", ")}\n${USAGE_LINE}`); process.exit(2); }
if (argv.includes("--self-test")) process.exit(selfTest(valOf("--fixtures")) ? 0 : 1);

const ri = argv.indexOf("--root");
const noProps = argv.includes("--no-props");
const noFresh = argv.includes("--no-fresh");
const noRuleTests = argv.includes("--no-rule-tests");
const noExamples = argv.includes("--no-examples");
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
// native is true when the component forwards a native element's attributes (props-table's "native element
// attributes" line, or an HTMLAttributes / ComponentProps<"tag"> type it did not expand). Then a native attribute
// name counts as a prop, minus any name an Omit<..., "a" | "b"> on that line removes.
const NATIVE_TYPE = /native element attributes|HTMLAttributes\b|HTMLProps\b|SVGProps\b|IntrinsicElements\b|ComponentProps(?:WithoutRef|WithRef)?<\s*["'`][a-z]/;
const NATIVE_ATTRS = new Set(("id className style title hidden lang dir tabIndex role slot draggable spellCheck translate " +
  "autoFocus autoCapitalize autoCorrect contentEditable enterKeyHint inputMode accessKey children ref key " +
  "type name value defaultValue checked defaultChecked disabled readOnly required placeholder autoComplete " +
  "min max step minLength maxLength pattern multiple accept capture size cols rows wrap list form formAction " +
  "formMethod formNoValidate formTarget formEncType href target rel download hrefLang referrerPolicy src srcSet " +
  "sizes alt width height loading decoding crossOrigin htmlFor open label selected span colSpan rowSpan headers scope " +
  "start reversed dateTime cite action method noValidate encType acceptCharset").split(" "));
const nativeAttr = (n) => NATIVE_ATTRS.has(n) || /^on[A-Z]\w*$/.test(n);
function propsOf(md) {
  const own = new Map(), also = new Set(), omitted = new Set();
  let native = false;
  for (const l of md.split("\n")) {
    const m = /^\|\s*`([\w$]+)\??`\s*\|\s*`?((?:[^|\\]|\\.)*?)`?\s*\|/.exec(l);
    if (m && m[1] !== "Prop") own.set(m[1], m[2].replace(/\\\|/g, "|"));
    const a = /^Also accepts:(.*)$/.exec(l);
    if (!a) continue;
    for (const g of a[1].matchAll(/\(([^)]*)\)/g)) for (const n of g[1].split(",")) if (/^\s*[\w$]+\s*$/.test(n)) also.add(n.trim());
    if (NATIVE_TYPE.test(a[1])) native = true;
    for (const o of a[1].matchAll(/Omit<[^,]+,([^>]*)>/g)) for (const q of o[1].matchAll(/["'`]([\w$]+)["'`]/g)) omitted.add(q[1]);
  }
  return { own, also, native: (n) => native && nativeAttr(n) && !omitted.has(n) };
}

// ---------- repo settings: examples folder, registry, coverage gaps, vague words ----------
const posix = (p) => p.split(sep).join("/");
const readJSON = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const genCfg = readJSON(join(root, "scripts/gen-docs.config.json")) || {};
const csCfg = readJSON(join(root, "scripts/check-system.config.json")) || {};
const cleanDir = (d) => posix(d).replace(/^\.\//, "").replace(/\/+$/, "");
const examplesDir = cleanDir(genCfg.examplesDir || "docs/system/examples");
const docsDir = join(root, "docs/system");
const pascal = (id) => id.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Registry entries: { id, names (for the alternative and one-way matches), tokens (case-sensitive names), import, variants, states }.
const registry = (() => {
  const p = join(root, genCfg.registry || csCfg.registry || "registry.json");
  if (!existsSync(p)) return null;
  const reg = readJSON(p);
  if (!reg) { console.error(`check-spec: cannot parse ${posix(relative(root, p))}`); process.exit(2); }
  const out = [];
  for (const it of [...(reg.components || []), ...(reg.items || [])]) {
    const meta = it.meta || {};
    const id = String(it.id || it.name || "").toLowerCase();
    if (!id) continue;
    const tokens = [it.name, meta.name, it.title, pascal(id)].filter((n) => typeof n === "string" && n && n !== id);
    out.push({ id, names: [...new Set([id, ...tokens])], tokens: [...new Set(tokens)], import: it.import || meta.import || null, variants: it.variants || meta.variants || null, states: it.states || meta.states || null });
  }
  return out;
})();
// Registry names a rule may use as its checkable token: whole word, case-sensitive.
const tokenRe = registry && registry.some((e) => e.tokens.length) ? new RegExp(`(?<![\\w-])(${registry.flatMap((e) => e.tokens).map(escRe).join("|")})(?![\\w-])`) : null;
const regEntry = (id) => registry && registry.find((e) => e.id === id);
const coverageAreas = (() => {
  const p = join(docsDir, "coverage-gaps.md");
  if (!existsSync(p)) return null;
  const areas = new Set();
  const rows = readFileSync(p, "utf8").split("\n").filter((l) => /^\s*\|/.test(l));
  rows.slice(2).forEach((l) => { const c = l.trim().replace(/^\|/, "").split(/(?<!\\)\|/)[0]; const a = c.replace(/[`"*]/g, "").trim(); if (a) areas.add(a.toLowerCase()); });
  return areas;
})();
const vague = (() => {
  const hard = [...HARD_WORDS], soft = [...SOFT_WORDS];
  const p = join(docsDir, "vague-words.txt");
  if (existsSync(p)) for (const raw of readFileSync(p, "utf8").split("\n")) {
    const l = raw.replace(/#.*$/, "").trim();
    if (!l) continue;
    if (l.startsWith("?")) { if (l.slice(1).trim()) soft.push(l.slice(1).trim()); } else hard.push(l);
  }
  const re = (w) => new RegExp(`(?<![\\p{L}\\p{N}-])${escRe(w).replace(/\s+/g, "\\s+")}(?![\\p{L}\\p{N}-])`, "iu");
  return { hard: hard.map((w) => [w, re(w)]), soft: soft.map((w) => [w, re(w)]) };
})();

// ---------- which files ----------
const files = [];
const plain = []; // .md files with "## States" and no spec marker: plain entries, skipped
const kinds = new Map(); // file -> "component" | "foundation"
const stripFenced = (t) => t.replace(/^(```|~~~)[\s\S]*?^\1/gm, "");
const walk = (p) => {
  const st = statSync(p, { throwIfNoEntry: false });
  if (!st) { console.error(`not found: ${p}`); process.exit(2); }
  if (st.isDirectory()) {
    for (const e of readdirSync(p).sort()) if (!e.startsWith(".") && e !== "node_modules") walk(join(p, e));
    return;
  }
  if (!p.endsWith(".md")) return;
  const isFoundation = FOUNDATIONS.includes(basename(p, ".md"));
  const text = stripFenced(readFileSync(p, "utf8"));
  if (/^### State precedence\s*$/m.test(text)) { files.push(p); kinds.set(p, "component"); }
  else if (isFoundation) { files.push(p); kinds.set(p, "foundation"); }
  else if (/^## States\s*$/m.test(text) || targets.includes(p)) plain.push(p);
};
// A path resolves against the current folder, and against the root when nothing is there.
const targets = args.filter((a) => a !== "-").map((a) => (existsSync(resolve(a)) || !existsSync(join(root, a)) ? a : join(root, a)));
targets.forEach(walk);
if (stdinText !== null) { files.push(STDIN); kinds.set(STDIN, "component"); }

// ---------- rule lines ----------
// Split a page into H2 and H3 sections outside fences. Returns { h2: [{name,line}], h3: [{name,line,h2}] }.
function headings(lines) {
  const h2 = [], h3 = [];
  let fence = false;
  lines.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) fence = !fence;
    if (fence) return;
    let m;
    if ((m = l.match(/^## (.+?)\s*$/))) h2.push({ name: m[1], line: i + 1 });
    else if ((m = l.match(/^### (.+?)\s*$/))) h3.push({ name: m[1], line: i + 1, h2: h2.at(-1)?.name });
  });
  return { h2, h3 };
}
// The Usage sections of a page: [{ name, line, lines: [{t, line}] }]. A component spec's rule sections are the four
// rule H3s. A foundation page reads every list item under ## Usage and its H3s as a potential rule section.
function usageSections(lines) {
  const out = [];
  let inUsage = false, cur = null, fence = false;
  lines.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) { fence = !fence; return; }
    if (fence) return;
    if (/^## /.test(l)) { inUsage = /^## Usage\s*$/.test(l); cur = inUsage ? { name: "Usage", line: i + 1, lines: [] } : null; if (cur) out.push(cur); return; }
    if (!inUsage) return;
    const h = /^### (.+?)\s*$/.exec(l);
    if (h) { cur = { name: h[1], line: i + 1, lines: [] }; out.push(cur); return; }
    if (/^#{1,6} /.test(l)) { cur = { name: l.replace(/^#+\s*/, ""), line: i + 1, lines: [] }; out.push(cur); return; }
    cur.lines.push({ t: l, line: i + 1 });
  });
  return out;
}
// Parse one rule section into definitions, citations, gated rules, Not applicable lines and other items.
function parseRuleSection(sec) {
  const defs = [], cites = [], gated = [], badGated = [], na = [], review = [], other = [];
  let cur = null, inPair = null;
  for (const { t, line } of sec.lines) {
    const def = DEF_RE.exec(t);
    if (def) { cur = { id: def[1], parts: [def[2].trim()], line, dont: null, do: null, section: sec.name }; defs.push(cur); inPair = null; continue; }
    if (!t.trim() || /^#/.test(t)) { cur = null; inPair = null; continue; }
    // The Don't and Do pair under a rule, as a nested list: "  - Don't: `<snippet>`" then "  - Do: `<snippet>`"
    const pair = /^\s{2,}(?:[-*]\s+)?(Don['\u2019]t|Do):\s*(.*)$/.exec(t);
    if (cur && pair) { inPair = pair[1] === "Do" ? "do" : "dont"; cur[inPair] = { line, text: pair[2].trim() }; continue; }
    if (cur && /^\s{2,}\S/.test(t)) { if (inPair) cur[inPair].text += " " + t.trim(); else cur.parts.push(t.trim()); continue; }
    cur = null; inPair = null;
    const c = CITE_RE.exec(t);
    if (c) { cites.push({ id: c[1], line }); continue; }
    if (/^[-*] Gated:/i.test(t)) { const g = GATED_RE.exec(t); if (g) gated.push({ id: g[1], gate: g[2], line }); else badGated.push({ line, t: t.trim() }); continue; }
    if (/^([-*]\s+)?Not applicable:\s*\S/i.test(t)) { na.push(line); continue; }
    if (/^([-*]\s+)?NEEDS REVIEW\b/.test(t)) { review.push({ line, t: t.trim() }); continue; }
    if (/^[-*] /.test(t)) other.push({ line, t: t.trim() });
  }
  for (const d of defs) d.text = d.parts.join(" ");
  return { defs, cites, gated, badGated, na, review, other };
}
// Every definition on a page, by kind.
function pageDefs(text, kind) {
  const secs = usageSections(text.split("\n"));
  const ruleSecs = kind === "component" ? secs.filter((s) => RULE_SECTIONS.includes(s.name)) : secs;
  return ruleSecs.flatMap((s) => parseRuleSection(s).defs);
}
// The parts of a rule's joined text (rule-method.md, Rule shape).
function ruleParts(text) {
  const miss = [];
  const when = text.startsWith("When ");
  if (!when) miss.push('"When" at the start');
  const b = /\bbecause\b/.exec(text);
  const e = text.indexOf("Evidence: ", b ? b.index : 0);
  const eAny = text.indexOf("Evidence: ");
  const c = text.indexOf("Check: ", e >= 0 ? e : 0);
  if (!b || (eAny >= 0 && eAny < b.index)) miss.push('"because"');
  if (e < 0) miss.push('"Evidence:"');
  const action = b ? text.slice(0, b.index) : e >= 0 ? text.slice(0, e) : text;
  const grounds = e >= 0 ? text.slice(e + 10, c >= 0 ? c : undefined).trim().replace(/\.$/, "").split("; ").map((g) => g.trim()).filter(Boolean) : [];
  const check = c >= 0 ? text.slice(c + 7).trim() : null;
  return { miss, action, grounds, check, hasEvidence: e >= 0, hasCheck: c >= 0 };
}
function groundKind(g) {
  let m;
  if ((m = /^app (\d+)\/(\d+) \S/.exec(g))) return Number(m[1]) <= Number(m[2]) && Number(m[2]) >= 2 ? "app" : null;
  if (/^single use \S+:\d+/.test(g)) return "single use";
  if (/^measured .*\d/.test(g)) return "measured";
  if ((m = /^principle (wcag|platform|heuristic|input): \S/.exec(g))) return m[1] !== "wcag" || /\d+\.\d+(\.\d+)?/.test(g) ? "principle" : null;
  // A person-grounded rule cites its docs/system/decisions.md row, and never quotes the person in shipped docs.
  if (/^person D\d+\b/.test(g)) return "person";
  if (/^gate G-\d+ default/.test(g)) return "gate";
  return null;
}
const stripLiterals = (s) => s.replace(/`[^`]*`/g, " ").replace(/"[^"]*"/g, " ").replace(/\u201c[^\u201d]*\u201d/g, " ");

// Definitions across the scanned files plus docs/system/*.md, for duplicate IDs and citations.
const defIndex = new Map(); // id -> [{ abs, shown, line }]
const addDefs = (abs, shown, text, kind) => { for (const d of pageDefs(text, kind)) { if (!defIndex.has(d.id)) defIndex.set(d.id, []); const l = defIndex.get(d.id); if (!l.some((x) => x.abs === abs && x.line === d.line)) l.push({ abs, shown, line: d.line }); } };
// Stdin text stands in for docs/system/<its slug>.md, so that file leaves the index.
const slugOfH1 = (text) => ((text.split("\n").find((l) => /^#\s/.test(l)) || "").replace(/^#\s+/, "").trim()).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stdinSlug = stdinText !== null ? slugOfH1(stdinText) : null;
// Identity by real path, so a symlinked temp or home folder never makes a file look like two.
const real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
const indexed = new Set();
if (existsSync(docsDir)) for (const e of readdirSync(docsDir).sort()) {
  if (!e.endsWith(".md") || e === "spec-template.md" || e === `${stdinSlug}.md`) continue;
  const abs = real(join(docsDir, e));
  const text = readFileSync(abs, "utf8");
  const kind = /^## States\s*$/m.test(stripFenced(text)) ? "component" : "foundation";
  addDefs(abs, posix(relative(root, abs)), text, kind); indexed.add(abs);
}
for (const f of files) {
  const abs = f === STDIN ? STDIN : real(f);
  if (!indexed.has(abs)) addDefs(abs, f, readSpec(f), kinds.get(f));
}

// Freshness helpers: the check's include folders, <Name tag counts, and git reads.
const EXCL = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".design-system", ".migration", ".ui-review", "public", "scripts", "docs", ".agents", ".claude", ".cursor", ".codex"]);
let includeDirs = ["app", "src", "components", "lib", "pages"];
if (Array.isArray(csCfg.include) && csCfg.include.length) includeDirs = csCfg.include;
let jsxFiles = null;
const listJsx = () => {
  if (jsxFiles) return jsxFiles;
  jsxFiles = [];
  const walkJ = (rel) => {
    const st = statSync(join(root, rel), { throwIfNoEntry: false });
    if (!st || rel.split("/").some((seg) => EXCL.has(seg)) || (rel && (rel === examplesDir || rel.startsWith(examplesDir + "/")))) return;
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
// A path to show in a finding: relative to the current folder when inside it.
const disp = (abs) => { const r = relative(real(process.cwd()), real(abs)); return r && !r.startsWith("..") ? posix(r) : abs; };
const notes = new Set();
const note = (s) => { if (!notes.has(s)) { notes.add(s); console.log(`note: ${s}`); } };

// Freshness helpers for spec/dead-path, spec/example-export and spec/test-file.
const pkgScripts = (() => { const j = readJSON(join(root, "package.json")); return j ? new Set(Object.keys(j.scripts || {})) : null; })();
const tsPaths = (() => {
  try {
    const raw = readFileSync(join(root, "tsconfig.json"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"])\/\/.*$/gm, "$1").replace(/,(\s*[}\]])/g, "$1");
    const o = JSON.parse(raw).compilerOptions || {};
    return Object.entries(o.paths || {}).map(([k, v]) => [k, [].concat(v).map((t) => posix(join(o.baseUrl || ".", t)))]);
  } catch { return []; }
})();
const isFile = (rel) => { const st = statSync(join(root, rel), { throwIfNoEntry: false }); return !!st && st.isFile(); };
// The repo file an import specifier names, or null when it is a package or does not resolve.
function resolveModule(fromRel, mod, own) {
  const bases = [];
  if (mod.startsWith(".")) bases.push(posix(join(dirname(fromRel), mod)));
  if (own && mod === own.import) bases.push(own.source.replace(/\.[cm]?[jt]sx?$/, ""));
  for (const [k, targets] of tsPaths) {
    const star = k.endsWith("*"), pre = star ? k.slice(0, -1) : k;
    if (star ? mod.startsWith(pre) : mod === k) for (const t of targets) bases.push(star ? t.replace("*", mod.slice(pre.length)) : t);
  }
  for (const b of bases) for (const ext of ["", ".tsx", ".ts", ".jsx", ".js", ".mjs", "/index.tsx", "/index.ts", "/index.js"]) if (isFile(b + ext)) return b + ext;
  return null;
}
// The names a module exports, or null when it re-exports a whole module and the list cannot be known.
function exportsOf(rel) {
  const code = readFileSync(join(root, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  if (/export\s*\*\s*from/.test(code)) return null;
  const names = new Set();
  for (const m of code.matchAll(/export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of code.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) for (const part of m[1].split(",")) { const n = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop().trim(); if (n) names.add(n); }
  if (/export\s+default\b/.test(code)) names.add("default");
  return names;
}
let testFiles = null;
// Test files in the repo: *.test.* and *.spec.* files, and files under a __tests__ folder.
const listTests = () => {
  if (testFiles) return testFiles;
  testFiles = [];
  const skipDir = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage"]);
  const walkT = (rel) => {
    const st = statSync(join(root, rel || "."), { throwIfNoEntry: false });
    if (!st) return;
    if (st.isDirectory()) { for (const e of readdirSync(join(root, rel || "."))) if (!skipDir.has(e)) walkT(rel ? `${rel}/${e}` : e); return; }
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(rel) || /(^|\/)__tests__\//.test(rel)) testFiles.push(rel);
  };
  walkT("");
  return testFiles;
};
// Motion in a component's source and the stylesheets it imports: a transition or animation in CSS, a style object or a
// class list (transition, transition-*, animate-*), @keyframes, element.animate(), or a motion library import. Returns
// what was found, or "".
const MOTION_LIBS = /(?:from\s*|import\s*\(?\s*|require\(\s*)["'](framer-motion|motion(?:\/[\w-]+)?|react-spring|@react-spring\/[\w-]+|gsap(?:\/[\w-]+)?|animejs|react-transition-group|@formkit\/auto-animate(?:\/[\w-]+)?|@motionone\/[\w-]+)["']/;
function motionIn(rel, depth = 0) {
  let code;
  try { code = readFileSync(join(root, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); } catch { return ""; }
  let m;
  if ((m = MOTION_LIBS.exec(code))) return `imports ${m[1]}`;
  if ((m = /(?<![\w$-])(transition|animation)(?:-[a-z-]+|[A-Z]\w*)?\s*:\s*(?!\s*["'`]?\s*(?:none|initial|unset)\b)["'`]?[\w.(-]/.exec(code))) return m[0].replace(/\s+/g, " ").slice(0, 40);
  if ((m = /@keyframes\s+[\w-]+|\.animate\(\s*[[{]/.exec(code))) return m[0];
  for (const q of code.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) for (const tok of q[2].split(/\s+/)) {
    const u = tok.replace(/^(?:[^:\s]*?\[[^\]]*\][^:\s]*:|[a-z0-9@/-]+:)+/, "").replace(/^!/, "");
    if (/^(?:transition(?:-(?!none$)[a-z-]+)?|animate-(?!none$)[\w-]+)$/.test(u)) return `class ${tok}`;
  }
  if (depth < 1) for (const i of code.matchAll(/(?:^|\n)\s*import\s+(?:[\w{},\s*]+from\s+)?["'](\.{1,2}\/[^"']+\.(?:css|scss|sass|less))["']/g)) {
    const found = motionIn(posix(join(dirname(rel), i[1])), depth + 1);
    if (found) return `${found} in ${posix(join(dirname(rel), i[1]))}`;
  }
  return "";
}
const squash = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const hasTestFor = (...names) => { const keys = names.filter(Boolean).map(squash); return listTests().some((rel) => keys.includes(squash(basename(rel).split(".")[0]))); };

let failures = 0, warnings = 0;
for (const file of files) {
  const text = readSpec(file);
  const lines = text.split("\n");
  const kind = kinds.get(file);
  const fail = (line, rule, msg) => { failures++; console.log(`${file}:${line} ${rule} ${msg}`); };
  const warn = (line, rule, msg) => { warnings++; console.log(`${file}:${line} ${rule} warning: ${msg}`); };
  const slug = file === STDIN ? stdinSlug : basename(file, ".md");
  const abs = file === STDIN ? STDIN : real(file);

  const { h2, h3 } = headings(lines);
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
  const desc = body("Description");
  const descText = desc ? desc.lines.join("\n") : "";

  // ---------- rule lines: every page kind ----------
  const secs = usageSections(lines);
  const bySec = new Map(secs.map((s) => [s.name, s]));
  const ruleSecs = kind === "component" ? secs.filter((s) => RULE_SECTIONS.includes(s.name)) : secs;
  const parsed = new Map(ruleSecs.map((s) => [s.name, parseRuleSection(s)]));
  const defs = [...parsed.values()].flatMap((p) => p.defs);
  for (const d of defs) {
    // spec/rule-id
    if (!ID_RE.test(d.id) || !d.id.startsWith(`rule/${slug}-`)) fail(d.line, "spec/rule-id", `'${d.id}' must be rule/${slug}-<words>`);
    for (const o of defIndex.get(d.id) || []) if (!(o.abs === abs && o.line === d.line)) fail(d.line, "spec/rule-id", `'${d.id}' also defined at ${o.shown}:${o.line}`);
    // spec/rule-shape
    const p = ruleParts(d.text);
    for (const m of p.miss) fail(d.line, "spec/rule-shape", `${d.id} needs ${m}`);
    if (p.hasEvidence) {
      const bad = p.grounds.filter((g) => !groundKind(g));
      const counting = p.grounds.filter((g) => { const k = groundKind(g); return k && k !== "gate"; });
      if (bad.length || !counting.length) fail(d.line, "spec/rule-shape", `${d.id} needs a ground: app n/m, single use file:line, measured <value>, principle <kind>: <name>, person D<n> (a docs/system/decisions.md row)${bad.length ? ` (not a ground: '${bad[0].slice(0, 60)}')` : ""}`);
    }
    const ck = p.hasCheck ? p.check.replace(/\.$/, "").trim() : "";
    if (!/^(lint|test|probe|review)\b/.test(ck) || (!/^review\b/.test(ck) && !/^(lint|test|probe)\s+\S/.test(ck)))
      fail(d.line, "spec/rule-shape", `${d.id} needs "Check:" with lint, test, probe or review`);
    if (!(/\d/.test(p.action) || /"[^"]+"|\u201c[^\u201d]+\u201d/.test(p.action) || /`[^`]+`/.test(p.action) || /\{[^{}\s]+\}/.test(p.action) || (tokenRe && tokenRe.test(p.action))))
      fail(d.line, "spec/rule-shape", `${d.id} needs a number, literal, {hole}, component name or backticked prop`);
    // spec/vague-word
    const bare = stripLiterals(p.action);
    for (const [w, re] of vague.hard) if (re.test(bare)) fail(d.line, "spec/vague-word", `${d.id} leans on '${w}'. Replace it with the number or literal it stands for`);
    if (!/\d/.test(bare)) for (const [w, re] of vague.soft) if (re.test(bare)) fail(d.line, "spec/vague-word", `${d.id} leans on '${w}'. Replace it with the number or literal it stands for`);
    // spec/dont-instead
    if (/(?<![\p{L}])(don['\u2019]t|do not|never|avoid)(?![\p{L}])/iu.test(p.action) && !/\binstead\b/i.test(p.action)) fail(d.line, "spec/dont-instead", `${d.id} says what not to do. Say what to do instead`);
  }
  // A Gated line has one format on every page kind.
  for (const p of parsed.values()) for (const g of p.badGated) fail(g.line, "spec/rule-shape", `'${g.t.slice(0, 60)}' is not a gated rule line (- Gated: \`rule/<id>\` (G-NN). <question>)`);
  // spec/rule-cite
  for (const p of parsed.values()) for (const c of p.cites) if (!defIndex.has(c.id)) fail(c.line, "spec/rule-cite", `cites ${c.id}, which no page defines`);

  // spec/rule-tests
  if (!noRuleTests && defs.length) {
    const tsv = join(docsDir, "rule-tests", `${slug}.tsv`);
    const usageLine = body("Usage")?.start ?? 1;
    if (!existsSync(tsv)) {
      if (file === STDIN) note(`spec/rule-tests skipped for stdin, no docs/system/rule-tests/${slug}.tsv`);
      else fail(usageLine, "spec/rule-tests", `no docs/system/rule-tests/${slug}.tsv`);
    } else {
      const tl = readFileSync(tsv, "utf8").replace(/\r\n/g, "\n").split("\n");
      const tfail = (line, msg) => { failures++; console.log(`${disp(tsv)}:${line} spec/rule-tests ${msg}`); };
      if (tl[0] !== RULE_TESTS_HEAD.join("\t")) tfail(1, `header must be ${RULE_TESTS_HEAD.join(", ")}, tab-separated`);
      const defined = new Set(defs.map((d) => d.id));
      const rows = new Map();
      tl.slice(1).forEach((l, i) => {
        if (!l.trim()) return;
        const line = i + 2;
        const c = l.split("\t");
        const [id, ...tests] = c;
        const verdict = (c[5] || "").trim(), notesCell = (c[6] || "").trim();
        if (rows.has(id)) { tfail(line, `${id} has a second row, first at line ${rows.get(id)}`); return; }
        rows.set(id, line);
        if (defined.has(id)) {
          ["falsify", "negation", "two_agent", "sweep"].forEach((name, k) => { const v = (tests[k] || "").trim(); if (!/^(pass|n\/a: \S.*)$/.test(v)) tfail(line, `${id} ${name} '${v}' must be pass or n/a: <reason>`); });
          if (verdict === "gate") tfail(line, `${id} is gated but still defined`);
          else if (!["ship", "rewritten"].includes(verdict)) tfail(line, `${id} verdict '${verdict}' must be ship or rewritten`);
          else if (verdict === "rewritten" && !notesCell) tfail(line, `${id} is rewritten and needs notes saying what changed`);
        } else if (verdict === "gate") {
          if (!notesCell) tfail(line, `${id} is gated and needs notes naming the gate`);
        } else tfail(line, `rule-tests row ${id} matches no rule`);
      });
      for (const d of defs) if (!rows.has(d.id)) fail(d.line, "spec/rule-tests", `${d.id} has no rule-tests row`);
    }
  }
  // spec/dead-path: every backticked repo path and package script the page names resolves now
  if (!noFresh && file !== STDIN) {
    let inF = false;
    lines.forEach((l, i) => {
      if (/^(```|~~~)/.test(l)) { inF = !inF; return; }
      if (inF || /\bplanned\b/i.test(l)) return;
      for (const m of l.matchAll(/`([^`]+)`/g)) {
        const t = m[1].trim();
        for (const r of t.matchAll(/\b(?:npm|pnpm|yarn|bun) run ([\w:.@/-]+)/g)) {
          if (!pkgScripts) { note("no package.json at the root, so spec/dead-path skips package scripts"); continue; }
          if (!pkgScripts.has(r[1])) fail(i + 1, "spec/dead-path", `\`${r[0]}\`: package.json has no "${r[1]}" script. Fix the name, or mark the line planned`);
        }
        if (!t.includes("/") || !/^(\.{1,2}\/)?[\w.()[\]-]+(\/[\w.@()[\]-]+)*(\/|\.[A-Za-z0-9]{1,6})$/.test(t) || /^[\w-]+\/[\w-]+$/.test(t)) continue;
        const clean = t.replace(/\/$/, "");
        if (!existsSync(join(root, clean)) && !existsSync(join(dirname(resolve(file)), clean)))
          fail(i + 1, "spec/dead-path", `\`${t}\` does not exist under ${root}. Fix the path, or mark the line planned`);
      }
    });
  }
  if (kind !== "component") continue;

  // spec/sections and spec/usage-h3
  const names = h2.map((s) => s.name);
  if (names.join("|") !== SECTIONS.join("|"))
    fail(h2[0]?.line ?? 1, "spec/sections", `H2s must be ${SECTIONS.join(", ")} in order. Found: ${names.join(", ") || "none"}`);
  const usage = h3.filter((s) => s.h2 === "Usage").map((s) => s.name);
  if (usage.join("|") !== USAGE.join("|"))
    fail(body("Usage")?.start ?? 1, "spec/usage-h3", `Usage H3s must be ${USAGE.join(", ")}. Found: ${usage.join(", ") || "none"}${usage.some((u) => OLD_USAGE.includes(u)) ? ". Older headings: see spec-template.md, Moving an older spec" : usage.some((u) => PREV_USAGE.includes(u)) ? ". Behavior and Best practices merge into Rules: see spec-template.md, Moving an older spec" : ""}`);

  // spec/usage-empty
  for (const name of USAGE) {
    const s = bySec.get(name);
    if (!s) continue;
    if (name === "When to use" || name === "When not to use") { if (!s.lines.some((x) => /^[-*] \S/.test(x.t))) fail(s.line, "spec/usage-empty", `${name} is empty`); continue; }
    const p = parsed.get(name);
    const ok = p.defs.length || p.na.length || p.gated.length || (name !== "Limits" && p.cites.length);
    if (!ok) fail(s.line, "spec/usage-empty", `${name} is empty`);
  }
  // Component rule sections hold rule lines, citations, gated rules and Not applicable lines only.
  for (const p of parsed.values()) for (const o of p.other) fail(o.line, "spec/rule-shape", `'${o.t.slice(0, 60)}' is not a rule line (- \`rule/${slug}-<words>\`: When ...) or a citation (- Follows \`rule/<id>\`.)`);
  // spec/alternative
  const wnt = bySec.get("When not to use");
  if (wnt) {
    if (!registry) note("no registry, so spec/alternative checks only \"instead\" on When not to use lines");
    for (const x of wnt.lines) {
      if (!/^[-*] \S/.test(x.t)) continue;
      const t = x.t.replace(/^[-*]\s+/, "");
      if (/^Not applicable:/i.test(t)) continue;
      if (!/\binstead\b/i.test(t)) { fail(x.line, "spec/alternative", `When not to use line does not say "instead"`); continue; }
      if (!registry) continue;
      if (!altTargets(t, slug).length && !gapRow(t)) fail(x.line, "spec/alternative", "When not to use line names no registry component or coverage-gaps row");
    }
  }
  // spec/limits
  const lim = parsed.get("Limits");
  if (lim) {
    for (const d of lim.defs) { const p = ruleParts(d.text); if (!/\d/.test(p.action) || !p.grounds.some((g) => groundKind(g) === "measured")) fail(d.line, "spec/limits", `${d.id} is a limit with no measured ground`); }
    for (const r of lim.review) fail(r.line, "spec/limits", `'${r.t.slice(0, 60)}' is NEEDS REVIEW, still unanswered`);
  }
  // spec/dont-do: every rule on a component page carries the pair a person and an agent both read
  for (const d of defs) {
    if (!d.dont || !d.dont.text.trim()) fail(d.line, "spec/dont-do", `${d.id} needs a "  - Don't:" line with the snippet that breaks it`);
    if (!d.do || !d.do.text.trim()) fail(d.line, "spec/dont-do", `${d.id} needs a "  - Do:" line with the same case written correctly`);
  }

  // spec/placeholder, outside fenced blocks
  let fence = false;
  lines.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) fence = !fence;
    const prose = l.replace(/`[^`]*`/g, "").replace(/<\/?(br|kbd)\s*\/?>/gi, "");
    if (!fence && /<[A-Za-z][^<>]*>/.test(prose))
      fail(i + 1, "spec/placeholder", "template placeholder left in");
  });

  // spec/foundation and spec/traps
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

  // spec/motion: a component whose code moves has a ### Motion table under States, one row per state change
  const srcRel = (/source\s+`([^`]+\.(?:tsx|jsx|ts|js|vue|svelte))`/.exec(descText) || [])[1];
  if (srcRel && existsSync(join(root, srcRel))) {
    const moves = motionIn(srcRel);
    const mo = sub("States", "Motion");
    const na = mo && mo.lines.some((l) => /^\s*(?:[-*]\s*)?Not applicable:\s*no motion\b/i.test(l));
    const mt = table(mo);
    const mcol = (re) => (mt ? mt.head.findIndex((h) => re.test(h)) : -1);
    const [cTrig, cKind, cPre, cProp, cRed] = [/^trigger$/i, /^kind$/i, /^preset$/i, /^properties$/i, /^reduced motion$/i].map(mcol);
    if (moves && !mo) fail(states?.start ?? 1, "spec/motion", `${srcRel} animates (${moves}), so States needs a '### Motion' table after State precedence: Trigger | Kind | Preset | Properties | Reduced motion`);
    else if (moves && !mt) fail(mo.start, "spec/motion", na ? `'Not applicable: no motion', but ${srcRel} animates (${moves})` : "'### Motion' needs a table: Trigger | Kind | Preset | Properties | Reduced motion");
    else if (mo && !mt && !na) fail(mo.start, "spec/motion", "'### Motion' needs a table, or 'Not applicable: no motion' when the code has none");
    else if (mt && [cTrig, cKind, cPre, cProp, cRed].some((c) => c < 0)) fail(mo.start, "spec/motion", `'### Motion' table columns are ${mt.head.join(" | ")}, want Trigger | Kind | Preset | Properties | Reduced motion`);
    else if (mt) {
      if (!mt.rows.length) fail(mo.start, "spec/motion", "'### Motion' table has no rows");
      for (const r of mt.rows) {
        const empty = [[cKind, "Kind"], [cPre, "Preset"], [cRed, "Reduced motion"]].filter(([c]) => !r.cells[c] || r.cells[c] === "?" || /^tbd$/i.test(r.cells[c])).map(([, n]) => n);
        if (empty.length) fail(r.line, "spec/motion", `motion row '${r.cells[cTrig] || "(blank)"}' leaves ${empty.join(", ")} empty`);
        else if (!/^`?(input|announce)`?$/i.test(r.cells[cKind])) fail(r.line, "spec/motion", `motion row '${r.cells[cTrig] || "(blank)"}' has Kind '${r.cells[cKind]}', want input (follows a pointer, drag or scroll) or announce`);
      }
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

  // spec/examples: the Example files table against the registry's variants and states, and the files on disk
  if (!noExamples) {
    const exH3 = sub("Examples", "Example files");
    const exT = table(exH3);
    const ci = (re) => exT ? exT.head.findIndex((h) => re.test(h)) : -1;
    const [cf, cc, ccap] = [ci(/^file$/i), ci(/^covers$/i), ci(/^caption$/i)];
    if (!exH3) fail(body("Examples")?.start ?? 1, "spec/examples", "Examples needs an '### Example files' table");
    else if (!exT || cf < 0 || cc < 0 || ccap < 0) fail(exH3.start, "spec/examples", "'### Example files' needs a table with File, Covers and Caption columns");
    else {
      const dir = `${examplesDir}/${slug}`;
      const entry = regEntry(slug);
      const spec = entry?.import || (/from\s+["']([^"']+)["']/.exec(descText) || [])[1] || null;
      const ownSource = (/source\s+`([^`]+\.(?:tsx|jsx|ts|js))`/.exec(descText) || [])[1] || null;
      if (!spec) note(`${file} has no import path in the registry or the Description, so example imports are not checked`);
      const listed = new Set();
      const covered = new Map(); // covers -> "path" | "na"
      for (const r of exT.rows) {
        const fileCell = r.cells[cf] || "", covers = (r.cells[cc] || "").replace(/`/g, "").trim(), caption = r.cells[ccap] || "";
        if (!/^(default|[A-Za-z][\w-]*=[^\s|]+|state:[\w-]+|composition:[A-Z][\w.]*|matrix:[\w-]+(,[\w-]+)+)$/.test(covers))
          fail(r.line, "spec/examples", `Covers '${covers}' is not one of default, axis=value, state:, composition:, matrix:`);
        const na = /^Not applicable:\s*(\S.*)$/.exec(fileCell), ns = /^NOT SUPPLIED:\s*(\S.*)$/.exec(fileCell), path = /^`([^`]+)`$/.exec(fileCell);
        if (ns) { fail(r.line, "spec/examples", `${covers} has no example file: ${ns[1]}`); covered.set(covers, covered.get(covers) || "open"); continue; }
        if (na) {
          if (covers === "default" || covers.startsWith("composition:")) fail(r.line, "spec/examples", `${covers} needs an example file, not Not applicable`);
          if (!covered.has(covers)) covered.set(covers, "na");
          continue;
        }
        if (!path) { fail(r.line, "spec/examples", `File '${fileCell}' must be one backticked path, or Not applicable: or NOT SUPPLIED: with a reason`); continue; }
        const p = cleanDir(path[1]);
        covered.set(covers, "path");
        listed.add(p);
        if (!caption || /^none$/i.test(caption)) fail(r.line, "spec/examples", `example ${p} needs a caption`);
        if (dirname(p) !== dir) { fail(r.line, "spec/examples", `example ${p} must live in ${dir}/`); continue; }
        const absP = join(root, p);
        if (!existsSync(absP)) {
          if (file === STDIN) note(`spec/examples skipped for stdin, no ${p}`);
          else fail(r.line, "spec/examples", `example ${p} does not exist`);
          continue;
        }
        const code = readFileSync(absP, "utf8");
        if (!/Caption:/.test(code.split("\n")[0])) fail(r.line, "spec/examples", `example ${p} needs a Caption: comment on line 1`);
        if (spec && !new RegExp(`(?:from|import)\\s*\\(?\\s*["']${escRe(spec)}["']|require\\(\\s*["']${escRe(spec)}["']`).test(code)) fail(r.line, "spec/examples", `example ${p} needs an import from ${spec}`);
        if (/\.(tsx|jsx|ts|js|mts|mjs)$/.test(p) && !/export\s+default\b|\bas\s+default\b/.test(code)) fail(r.line, "spec/examples", `example ${p} needs a default export`);
        // spec/example-export: every name the example imports from a repo module exists there now
        if (!noFresh) {
          const own = spec && ownSource ? { import: spec, source: ownSource } : null;
          const codeLines = code.split("\n");
          for (const m of code.matchAll(/^[^\S\n]*import\s+(?!type\s)([^'"]*?)\s+from\s+["']([^"']+)["'][^\n]*/gm)) {
            const at = code.slice(0, m.index).split("\n").length;
            if (/\bplanned\b/i.test(m[0]) || /\bplanned\b/i.test(codeLines[at - 2] || "")) continue;
            const mod = resolveModule(p, m[2], own);
            const have = mod && exportsOf(mod);
            if (!have) continue;
            const clause = m[1].trim(), want = [];
            const named = /\{([^}]*)\}/.exec(clause);
            if (named) for (const part of named[1].split(",")) { const n = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim(); if (n) want.push(n); }
            if (/^[A-Za-z_$][\w$]*/.test(clause.replace(/\{[^}]*\}/, "").replace(/\*\s*as\s+[\w$]+/, "").replace(/,/g, "").trim())) want.push("default");
            for (const n of want) if (!have.has(n)) fail(r.line, "spec/example-export", `example ${p} imports ${n === "default" ? "a default export" : `\`${n}\``} from ${m[2]}, which ${mod} does not export. Export it, or mark the import // planned`);
          }
        }
      }
      // Coverage: the registry's variants and states, else the Variants section's axes and values.
      const need = ["default"];
      let axes = [];
      if (entry && entry.variants && typeof entry.variants === "object" && !Array.isArray(entry.variants)) {
        axes = Object.keys(entry.variants);
        for (const [a, vs] of Object.entries(entry.variants)) for (const v of [].concat(vs)) need.push(`${a}=${v}`);
        for (const s of [].concat(entry.states || [])) need.push(`state:${s}`);
      } else {
        const vars = body("Variants");
        let axis = null;
        for (const l of vars ? vars.lines : []) {
          const h = /^### (.+?)\s*$/.exec(l);
          if (h) { axis = h[1].replace(/`/g, "").trim(); if (!SKIP.test(axis)) axes.push(axis); else axis = null; continue; }
          const v = /^[-*]\s*`([^`]+)`:/.exec(l.trim());
          if (v && axis) need.push(`${axis}=${v[1].replace(/^["']|["']$/g, "")}`);
        }
      }
      for (const c of need) if (!covered.has(c)) fail(exH3.start, "spec/examples", `${c} has no Example files row`);
      if (![...covered.keys()].some((c) => c.startsWith("composition:")))
        fail(exH3.start, "spec/examples", "composition:<Parent> has no Example files row");
      if (axes.length >= 2 && ![...covered.keys()].some((c) => c.startsWith("matrix:"))) fail(exH3.start, "spec/examples", `matrix:${axes.slice(0, 2).join(",")} has no Example files row`);
      // Orphans: files in the component's examples folder that no row lists.
      const absDir = join(root, dir);
      if (existsSync(absDir) && statSync(absDir).isDirectory()) {
        for (const e of readdirSync(absDir).sort()) {
          const p = `${dir}/${e}`;
          if (e.startsWith(".") || statSync(join(absDir, e)).isDirectory()) continue;
          if (!listed.has(p)) fail(exH3.start, "spec/examples", `example ${p} is not listed in Example files`);
        }
      }
    }
  }

  // spec/props-drift: the spec against the component's exported props at HEAD
  const src = /source\s+`([^`]+\.(?:tsx|jsx|ts|js))`/.exec(descText);
  if (propsTables && src) {
    if (!existsSync(join(root, src[1]))) fail(desc.start, "spec/props-drift", `source ${src[1]} does not exist (run from the repo root or pass --root)`);
    else {
      const md = propsTables(root, [src[1]]).tables.get(src[1]);
      if (md) {
        const { own, also, native } = propsOf(md);
        const known = (n) => own.has(n) || also.has(n) || native(n);
        const byLower = new Map([...own.keys()].map((k) => [k.toLowerCase(), k]));
        const vars = body("Variants");
        if (vars) {
          let axis = null;
          vars.lines.forEach((l, i) => {
            const line = vars.start + i + 1;
            const h = /^### (.+?)\s*$/.exec(l);
            if (h) {
              const name = h[1].replace(/`/g, "").trim();
              axis = byLower.get(name.toLowerCase()) || (also.has(name) || native(name) ? name : null);
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

  // spec/test-file: a behavior row checked by "test" needs a test file for the component. A warning only
  if (!noFresh) {
    const byTest = [];
    const tables = [states && table({ start: states.start, lines: (() => { const i = states.lines.findIndex((l) => /^### /.test(l)); return i < 0 ? states.lines : states.lines.slice(0, i); })() }), table(sub("Accessibility", "Keyboard")), table(sub("Accessibility", "ARIA"))];
    for (const t of tables) {
      const c = t ? t.head.findIndex((h) => /checked by/i.test(h)) : -1;
      if (c >= 0) for (const r of t.rows) if (/\btest\b/i.test(r.cells[c] || "")) byTest.push(r.line);
    }
    const name = (/^#\s+([A-Z][\w$]*)\b/.exec(lines.find((l) => /^#\s/.test(l)) || "") || [])[1];
    if (byTest.length && !hasTestFor(slug, name))
      warn(byTest[0], "spec/test-file", `${byTest.length} row(s) say Checked by test, and no test file for ${slug} exists (${slug}.test.*, ${name || slug}.spec.* or one under __tests__). Write an interaction test that fails when the behavior breaks`);
  }

  // spec/tokens
  const tok = body("Tokens");
  if (!tok || !(table(tok)?.rows.length || tok.lines.some((l) => /NOT SUPPLIED/.test(l))))
    fail(tok?.start ?? 1, "spec/tokens", "Tokens needs a table with rows, or NOT SUPPLIED with a reason");
}

// The registry components a When not to use line routes to: names or ids, whole word, case-insensitive, after "Use ".
function altTargets(t, self) {
  const at = t.indexOf("Use ");
  if (at < 0 || !registry) return [];
  const rest = t.slice(at + 4);
  return registry.filter((e) => e.id !== self && e.names.some((n) => new RegExp(`(?<![\\w-])${escRe(n)}(?![\\w-])`, "i").test(rest))).map((e) => e.id);
}
// A 'coverage-gaps row "<Area>"' reference whose Area is a row in docs/system/coverage-gaps.md.
function gapRow(t) {
  const m = /coverage-gaps row ["\u201c]([^"\u201d]+)["\u201d]/.exec(t);
  return !!(m && coverageAreas && coverageAreas.has(m[1].trim().toLowerCase()));
}

const skipped = plain.length ? `, ${plain.length} plain entr${plain.length === 1 ? "y" : "ies"} skipped (no '### State precedence')` : "";
if (!files.length && !plain.length) { console.log("no specs found. A spec is a .md file with a '### State precedence' heading"); process.exit(1); }
console.log(`${files.length} spec(s) checked${skipped}, ${failures} failure(s)${warnings ? `, ${warnings} warning(s)` : ""}`);
process.exit(failures ? 1 : 0);

// ---------- self-test ----------
// Each fixtures/check-spec/<case>/ holds case.json ({ "rule", "count", "args", "fresh", "props" }) and fail/ and pass/
// folders, each a mini repo. Files ending in .fixture are read under their inner name. The run checks docs/system with
// --no-props unless props is true, and --no-fresh unless fresh is true, plus the case's args. fail/ must give exactly count findings of the rule and none of any other,
// and pass/ none at all.
function selfTest(dirArg) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = dirArg ? resolve(dirArg) : ((p) => existsSync(p) ? p : join(here, "..", "fixtures", "check-spec"))(join(here, "fixtures", "check-spec"));
  if (!existsSync(dir)) { console.log(`self-test: FAIL, no fixtures at ${dir}`); return false; }
  let ok = true, n = 0;
  for (const c of readdirSync(dir).sort()) {
    const caseFile = join(dir, c, "case.json");
    if (!existsSync(caseFile)) continue;
    const spec = JSON.parse(readFileSync(caseFile, "utf8"));
    for (const kind of ["fail", "pass"]) {
      const src = join(dir, c, kind);
      if (!existsSync(src)) { console.log(`self-test: ${c}/${kind} missing`); ok = false; continue; }
      const tmp = mkdtempSync(join(tmpdir(), "check-spec-"));
      cpSync(src, tmp, { recursive: true });
      const unfix = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) unfix(p); else if (e.endsWith(".fixture")) renameSync(p, p.slice(0, -8)); } };
      unfix(tmp);
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--root", tmp, ...(spec.fresh ? [] : ["--no-fresh"]), ...(spec.props ? [] : ["--no-props"]), ...(spec.args || []), spec.target || "docs/system"], { cwd: tmp, encoding: "utf8" });
      rmSync(tmp, { recursive: true, force: true });
      const found = (r.stdout || "").split("\n").map((l) => /^\S+:\d+ (spec\/[\w-]+) (.*)$/.exec(l)).filter(Boolean);
      const mine = found.filter((m) => m[1] === spec.rule).length;
      const others = found.filter((m) => m[1] !== spec.rule);
      const good = r.status !== 2 && (kind === "fail" ? mine === spec.count && !others.length : !found.length);
      if (!good) ok = false; n++;
      const detail = kind === "fail" ? `${spec.rule} ${mine}/${spec.count}` : `${found.length} findings`;
      console.log(`self-test ${good ? "ok  " : "FAIL"} ${spec.rule} ${c}/${kind}: ${detail}${good ? "" : `  ${[...found.map((m) => m[0]), (r.stderr || "").trim()].filter(Boolean).join(" | ").slice(0, 600)}`}`);
    }
  }
  console.log(`self-test: ${n} fixtures, ${ok ? "all as expected" : "FAILED"}`);
  return ok;
}
