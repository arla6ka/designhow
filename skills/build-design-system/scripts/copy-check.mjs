#!/usr/bin/env node
// copy-check.mjs: the app's user-facing strings against its writing page. Node 18+, no dependencies. Uses the repo's
// typescript to read JSX when it resolves, else a regex fallback. Run `node scripts/copy-check.mjs --help` for usage.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HELP = `copy-check.mjs: check the app's strings against docs/system/writing.md

Usage: node scripts/copy-check.mjs [--root <repo>] [mode] [options]

With no mode it runs the fixture self-test when fixtures/copy-check/ sits beside
this script, then checks the repo. With no docs/system/writing.md it exits 0.

Modes
  --extract            write docs/system/copy-inventory.tsv from the slot sources
                       in the writing page's ## Slots table
  --suggest-chains     print candidate verb chains as TSV, then each confirm
                       action in no chain
  --init-allowlist     write scripts/copy-check-allowlist.json from today's
                       findings. Refuses to overwrite
  --shrink-allowlist   lower allowlist counts to what is found now. Never raises one
  --prune-allowlist    drop allowlist entries that match no finding now
  --list-rules         print rule id and rule, tab separated
  --self-test          run only the fixtures, from --fixtures <dir> or from
                       fixtures/copy-check/ beside this script

Options
  --root <dir>         repo root. Default: the git root of the current folder,
                       else the current folder
  --fixtures <dir>     the fixture folder for the self-test
  --no-self-test       skip the fixtures on a default run
  --parser <p>         typescript or regex. Default: typescript when it resolves
                       from the repo, else regex
  --help               this text

The writing page's tables (references/system-structure.md, Writing page):
  ## Slots         Slot | Sources | Rows | Casing | Max chars | End punctuation | Template
  ## Verb chains   Chain | Verb | Action | Confirm title | Confirm action | Result
  ## Banned words  Word | Instead | Evidence
Sources selectors, comma separated: Tag or Ns.Tag (text children), Tag[prop],
*[prop] (the prop on any tag), fn() or a.b() (first argument), fn({key}) (a key
of the first argument). Files scanned: .tsx, .jsx, .ts and .js under the include
folders of scripts/check-system.config.json (default app, src, components, lib,
pages), skipping tests, stories, fixtures, the examples folder and scaffolding.
Product names come from docs/system/brand.md, ## Names, and keep their casing.

Prints "file:line rule-id message" per finding. Exit 0 clean, 1 on findings or a
failed self-test, 2 on a bad writing page or bad input.`;

const RULES = {
  "copy/inventory-stale": "docs/system/copy-inventory.tsv is missing or differs from a fresh extract. Fix: run --extract and commit it",
  "copy/casing": "A string breaks its slot's casing (sentence or title). Product names from brand.md keep theirs. Fix: recase it",
  "copy/length": "A string runs past its slot's Max chars. Fix: shorten it, or measure the slot again",
  "copy/end-punctuation": "A string breaks its slot's end punctuation: period needs . ? or !, none forbids a single period. Fix: add or drop it",
  "copy/template": "A string does not match its slot's template. Fix: rewrite it to the template",
  "copy/banned-word": "A string uses a word from the Banned words table. Fix: use the word in its Instead cell",
  "copy/verb-chain": "A step of a declared verb chain holds no form of the chain's verb. Fix: use the verb in the action, the confirmation and the result",
  "copy/chain-stale": "A verb chain cell names a file:line with no inventory row, or is malformed. Fix: point it at the moved string",
  "copy/chain-missing": "A confirm-action string sits in no declared chain and no Exempt row. Fix: declare its chain, or exempt it with a reason",
};
const NEVER_ALLOW = new Set(["copy/inventory-stale", "copy/chain-stale"]);
const INVENTORY = "docs/system/copy-inventory.tsv";
const WRITING = "docs/system/writing.md";
const ALLOWLIST = "scripts/copy-check-allowlist.json";
const HEAD = ["slot", "text", "component", "source", "file", "line"];
const EXCL = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".design-system", ".migration", ".ui-review", "public", "scripts", "docs", ".agents", ".claude", ".cursor", ".codex", "fixtures"]);
const STEPS = ["Action", "Confirm title", "Confirm action", "Result"];

class BadInput extends Error {}
const posix = (p) => p.split(sep).join("/");
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const readJSON = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ---------- the writing page ----------
function mdTables(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out = new Map(); // H2 name -> { head, rows: [{ cells, line }] }
  let h2 = null, fence = false;
  lines.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) { fence = !fence; return; }
    if (fence) return;
    const h = /^## (.+?)\s*$/.exec(l);
    if (h) { h2 = h[1].trim(); return; }
    if (!h2 || !/^\s*\|/.test(l)) return;
    const cells = l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
    if (!out.has(h2)) out.set(h2, { head: null, rows: [], sep: false });
    const t = out.get(h2);
    if (!t.head) t.head = { cells: cells.map((c) => c.toLowerCase()), line: i + 1 };
    else if (!t.sep && /^[\s:|-]+$/.test(cells.join("|"))) t.sep = true;
    else t.rows.push({ cells, line: i + 1 });
  });
  return out;
}
const unquote = (s) => s.replace(/^`+|`+$/g, "").replace(/^["“]|["”]$/g, "").trim();
function parseSelector(raw) {
  const s = raw.replace(/`/g, "").trim();
  const NAME = "[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*";
  let m;
  if ((m = new RegExp(`^\\*\\[([\\w:-]+)\\]$`).exec(s))) return { kind: "anyprop", prop: m[1], source: `prop:${m[1]}` };
  if ((m = new RegExp(`^(${NAME})\\[([\\w:-]+)\\]$`).exec(s))) return { kind: "prop", tag: m[1], prop: m[2], source: `prop:${m[2]}` };
  if ((m = new RegExp(`^(${NAME})\\(\\)$`).exec(s))) return { kind: "call", callee: m[1], source: "arg:0" };
  if ((m = new RegExp(`^(${NAME})\\(\\{([\\w$]+)\\}\\)$`).exec(s))) return { kind: "callkey", callee: m[1], key: m[2], source: `arg:0.${m[2]}` };
  if ((m = new RegExp(`^(${NAME})$`).exec(s))) return { kind: "children", tag: m[1], source: "children" };
  return null;
}
function loadWriting(root) {
  const path = join(root, WRITING);
  const text = readFileSync(path, "utf8");
  const tables = mdTables(text);
  const bad = (line, col, v) => { throw new BadInput(`${WRITING}:${line} copy/slots ${col} '${v}' is not allowed`); };
  const colIx = (t, names, where) => {
    const ix = {};
    for (const n of names) { ix[n] = t.head.cells.indexOf(n.toLowerCase()); if (ix[n] < 0) throw new BadInput(`${WRITING}:${t.head.line} ${where} needs a ${n} column`); }
    return ix;
  };
  const st = tables.get("Slots");
  if (!st || !st.head) throw new BadInput(`${WRITING}: no ## Slots table with Slot, Sources, Rows, Casing, Max chars, End punctuation and Template columns`);
  const si = colIx(st, ["Slot", "Sources", "Casing", "Max chars", "End punctuation", "Template"], "## Slots");
  const slots = [];
  for (const r of st.rows) {
    const c = (n) => (r.cells[si[n]] || "").trim();
    const name = unquote(c("Slot"));
    if (!name) continue;
    const casing = unquote(c("Casing")).toLowerCase();
    if (!["sentence", "title", "as stored", "any"].includes(casing)) bad(r.line, "Casing", c("Casing"));
    const maxRaw = unquote(c("Max chars")).toLowerCase();
    if (!(maxRaw === "none" || (/^\d+$/.test(maxRaw) && Number(maxRaw) > 0))) bad(r.line, "Max chars", c("Max chars"));
    const end = unquote(c("End punctuation")).toLowerCase();
    if (!["period", "none", "any"].includes(end)) bad(r.line, "End punctuation", c("End punctuation"));
    const template = unquote(c("Template"));
    if (!template) bad(r.line, "Template", c("Template"));
    const sels = c("Sources").split(",").map((x) => x.trim()).filter(Boolean).map((x) => parseSelector(x) || bad(r.line, "Sources", x));
    if (!sels.length) bad(r.line, "Sources", c("Sources"));
    slots.push({ name, sels, casing, max: maxRaw === "none" ? null : Number(maxRaw), end, template: template.toLowerCase() === "any" ? null : template, line: r.line });
  }
  const chains = [], exempt = [], tableErrors = [];
  const ct = tables.get("Verb chains");
  if (ct && ct.head) {
    const ci = colIx(ct, ["Chain", "Verb", ...STEPS], "## Verb chains");
    for (const r of ct.rows) {
      const c = (n) => (r.cells[ci[n]] || "").trim();
      const chain = c("Chain");
      if (/^Exempt:/i.test(chain)) {
        const at = parseStep(c("Action"));
        if (!at || at === "none") tableErrors.push({ line: r.line, msg: `Exempt row's Action '${c("Action")}' must be the confirm action's file:line` });
        else if (!c("Verb")) tableErrors.push({ line: r.line, msg: `Exempt row for ${at.file}:${at.line} needs its reason in the Verb cell` });
        else exempt.push({ ...at, reason: c("Verb"), line: r.line });
        continue;
      }
      const verb = unquote(c("Verb"));
      if (!verb) { tableErrors.push({ line: r.line, msg: `chain '${chain}' has no Verb` }); continue; }
      const steps = [];
      for (const n of STEPS) {
        const at = parseStep(c(n));
        if (!at) tableErrors.push({ line: r.line, msg: `chain '${chain}' ${n} '${c(n)}' must be file:line or none` });
        else if (at !== "none") steps.push({ step: n, ...at });
      }
      chains.push({ chain, verb, forms: verbForms(verb), steps, line: r.line });
    }
  }
  const banned = [];
  const bt = tables.get("Banned words");
  if (bt && bt.head) {
    const bi = colIx(bt, ["Word", "Instead"], "## Banned words");
    for (const r of bt.rows) {
      const w = unquote((r.cells[bi.Word] || "").replace(/["“”`]/g, ""));
      if (w) banned.push({ word: w, instead: (r.cells[bi.Instead] || "").trim() || "cut it", re: new RegExp(`(?<![\\p{L}\\p{N}])${escRe(w).replace(/\s+/g, "\\s+")}(?![\\p{L}\\p{N}])`, "iu") });
    }
  }
  return { slots, chains, exempt, banned, tableErrors, names: brandNames(root) };
}
function parseStep(cell) {
  const v = cell.replace(/`/g, "").trim();
  if (/^none$/i.test(v)) return "none";
  const m = /^(.+?):(\d+)$/.exec(v);
  return m ? { file: posix(m[1]).replace(/^\.\//, ""), line: Number(m[2]) } : null;
}
// Verb forms: the listed ones plus the regular inflections of the base form.
function verbForms(cell) {
  const [base, ...listed] = cell.toLowerCase().split("/").map((x) => x.trim()).filter(Boolean);
  const f = new Set([base, ...listed, base + "s", base + "es", base + "ed", base + "ing"]);
  if (base.endsWith("e")) { f.add(base + "d"); f.add(base.slice(0, -1) + "ing"); }
  if (/[^aeiou]y$/.test(base)) { f.add(base.slice(0, -1) + "ied"); f.add(base.slice(0, -1) + "ies"); }
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(base)) { const d = base + base.at(-1); f.add(d + "ed"); f.add(d + "ing"); }
  return f;
}
function brandNames(root) {
  const p = join(root, "docs/system/brand.md");
  if (!existsSync(p)) return [];
  const lines = readFileSync(p, "utf8").split("\n");
  const at = lines.findIndex((l) => /^## Names\s*$/.test(l));
  if (at < 0) return [];
  const out = [];
  for (const l of lines.slice(at + 1)) {
    if (/^## /.test(l)) break;
    const m = /^\s*[-*]\s+(.*)$/.exec(l);
    if (!m) continue;
    const tick = /`([^`]+)`/.exec(m[1]);
    const name = tick ? tick[1] : m[1].split(/[:.]/)[0].trim();
    if (name) out.push(name);
  }
  return out.sort((a, b) => b.length - a.length);
}

// ---------- which files ----------
function sourceFiles(root) {
  const cs = readJSON(join(root, "scripts/check-system.config.json")) || {};
  const gd = readJSON(join(root, "scripts/gen-docs.config.json")) || {};
  const include = Array.isArray(cs.include) && cs.include.length ? cs.include : ["app", "src", "components", "lib", "pages"];
  const examples = posix(gd.examplesDir || "docs/system/examples").replace(/^\.\//, "").replace(/\/+$/, "");
  const out = [];
  const walk = (rel) => {
    const st = statSync(join(root, rel), { throwIfNoEntry: false });
    if (!st || rel.split("/").some((s) => EXCL.has(s)) || (rel && (rel === examples || rel.startsWith(examples + "/")))) return;
    if (st.isDirectory()) { for (const e of readdirSync(join(root, rel)).sort()) walk(rel ? `${rel}/${e}` : e); return; }
    if (/\.(tsx|jsx|ts|js)$/.test(rel) && !/\.(test|spec|stories)\./.test(rel) && !/\.d\.ts$/.test(rel)) out.push(rel);
  };
  for (const d of new Set(include)) walk(d === "." ? "" : posix(d).replace(/^\.\//, "").replace(/\/+$/, ""));
  return [...new Set(out)].sort(cmp);
}

// ---------- extraction ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m));
// A hole's name: the last identifier of a name or call, else "value".
function holeFromText(expr) {
  const e = expr.trim().replace(/^\((.*)\)$/s, "$1").trim().replace(/!$/, "");
  const m = /^([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*|\??\.?\[[^\]]*\])*)(\([\s\S]*\))?$/.exec(e);
  if (!m) return "value";
  const last = m[1].match(/[A-Za-z_$][\w$]*$|\[[^\]]*\]$/)[0];
  return last.startsWith("[") ? "value" : last;
}
const unescapeJs = (s) => s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, e) => {
  if (e[0] === "u") return String.fromCodePoint(parseInt(e.replace(/[u{}]/g, ""), 16));
  if (e[0] === "x") return String.fromCharCode(parseInt(e.slice(1), 16));
  return { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", 0: "\0", "\n": "" }[e] ?? e;
});
const cleanChildren = (pieces) => {
  const text = pieces.map((p) => p.text).join("").replace(/\s+/g, " ").trim();
  if (!text || /^(\s|\{[^{}]*\})*$/.test(text)) return null;
  const first = pieces.find((p) => p.text.trim());
  return { text, pos: first.pos };
};

function extractTS(ts, file, code, sels) {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JSX;
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, kind);
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const unwrap = (e) => { while (e && (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(e)))) e = e.expression; return e; };
  const hole = (e) => {
    e = unwrap(e);
    if (ts.isIdentifier(e)) return e.text;
    if (ts.isPropertyAccessExpression(e)) return e.name.text;
    if (ts.isCallExpression(e)) { const c = unwrap(e.expression); if (ts.isIdentifier(c)) return c.text; if (ts.isPropertyAccessExpression(c)) return c.name.text; }
    return "value";
  };
  const str = (e) => {
    e = e && unwrap(e);
    if (!e) return null;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    if (ts.isTemplateExpression(e)) return e.head.text + e.templateSpans.map((s) => `{${hole(s.expression)}}${s.literal.text}`).join("");
    return null;
  };
  const hits = [];
  const children = (nodes, pieces) => {
    for (const ch of nodes) {
      if (ts.isJsxText(ch)) { const raw = ch.getFullText(sf); const k = raw.search(/\S/); pieces.push({ text: decode(raw), pos: k < 0 ? ch.pos : ch.pos + k }); }
      else if (ts.isJsxExpression(ch)) {
        if (!ch.expression) continue;
        const e = unwrap(ch.expression);
        if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) pieces.push({ text: e.text, pos: e.getStart(sf) });
        else pieces.push({ text: `{${hole(e)}}`, pos: e.getStart(sf) });
      } else if (ts.isJsxElement(ch)) children(ch.children, pieces);
      else if (ts.isJsxFragment(ch)) children(ch.children, pieces);
    }
  };
  const visit = (node) => {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (opening) {
      const tag = opening.tagName.getText(sf);
      for (const s of sels) {
        if (s.kind === "children" && s.tag === tag && ts.isJsxElement(node)) {
          const pieces = []; children(node.children, pieces);
          const c = cleanChildren(pieces);
          if (c) hits.push({ sel: s, text: c.text, component: tag, line: lineOf(c.pos) });
        }
        if ((s.kind === "prop" && s.tag === tag) || s.kind === "anyprop") {
          for (const a of opening.attributes.properties) {
            if (!ts.isJsxAttribute(a) || a.name.getText(sf) !== s.prop || !a.initializer) continue;
            const init = a.initializer;
            const v = ts.isStringLiteral(init) ? decode(init.text) : ts.isJsxExpression(init) ? str(init.expression) : null;
            const at = ts.isJsxExpression(init) && init.expression ? unwrap(init.expression).getStart(sf) : init.getStart(sf);
            if (v !== null && v.trim()) hits.push({ sel: s, text: v, component: tag, line: lineOf(at) });
          }
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf).replace(/\s+/g, "");
      for (const s of sels) {
        if ((s.kind !== "call" && s.kind !== "callkey") || s.callee !== callee || !node.arguments.length) continue;
        let e = unwrap(node.arguments[0]);
        if (s.kind === "callkey") {
          if (!ts.isObjectLiteralExpression(e)) continue;
          const p = e.properties.find((x) => ts.isPropertyAssignment(x) && (x.name.text ?? x.name.getText(sf)) === s.key);
          if (!p) continue;
          e = unwrap(p.initializer);
        }
        const v = str(e);
        if (v !== null && v.trim()) hits.push({ sel: s, text: v, component: callee, line: lineOf(e.getStart(sf)) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

// The regex fallback: a small scanner for JSX tags, attributes, children and call arguments.
function extractRegex(code, sels) {
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") starts.push(i + 1);
  const lineOf = (pos) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= pos) lo = mid; else hi = mid - 1; } return lo + 1; };
  const skipString = (i) => { const q = code[i]; for (let j = i + 1; j < code.length; j++) { if (code[j] === "\\") { j++; continue; } if (code[j] === q) return j + 1; if (q !== "`" && code[j] === "\n") return j; } return code.length; };
  // From an opening "{", the index after its matching "}".
  const skipExpr = (i) => {
    let d = 0;
    for (let j = i; j < code.length; j++) {
      const c = code[j];
      if (c === '"' || c === "'" || c === "`") { j = skipString(j) - 1; continue; }
      if (c === "/" && code[j + 1] === "/") { const e = code.indexOf("\n", j); j = e < 0 ? code.length : e; continue; }
      if (c === "/" && code[j + 1] === "*") { const e = code.indexOf("*/", j + 2); j = e < 0 ? code.length : e + 1; continue; }
      if (c === "{") d++;
      else if (c === "}") { d--; if (!d) return j + 1; }
    }
    return code.length;
  };
  const literal = (raw, pos) => {
    const t = raw.trim();
    const off = pos + raw.indexOf(t);
    let m;
    if ((m = /^(["'])([\s\S]*)\1$/.exec(t))) return { text: unescapeJs(m[2]), pos: off };
    if ((m = /^`([\s\S]*)`$/.exec(t))) return { text: unescapeJs(m[1].replace(/\$\{([^}]*)\}/g, (_, e) => `{${holeFromText(e)}}`)), pos: off, template: /\$\{/.test(m[1]) };
    return null;
  };
  // Parse the opening tag at i ("<"), returning { name, attrs: [{ name, raw, pos, quoted }], end, self }.
  const openTag = (i) => {
    const m = /^<([A-Za-z_$][\w$.:-]*)/.exec(code.slice(i, i + 200));
    if (!m) return null;
    let j = i + m[0].length;
    const attrs = [];
    while (j < code.length) {
      while (/\s/.test(code[j])) j++;
      if (code.startsWith("/>", j)) return { name: m[1], attrs, end: j + 2, self: true };
      if (code[j] === ">") return { name: m[1], attrs, end: j + 1, self: false };
      if (code[j] === "{") { j = skipExpr(j); continue; }
      const a = /^[\w$:.-]+/.exec(code.slice(j, j + 100));
      if (!a) return null;
      j += a[0].length;
      while (/\s/.test(code[j])) j++;
      if (code[j] !== "=") { attrs.push({ name: a[0], raw: null }); continue; }
      j++;
      while (/\s/.test(code[j])) j++;
      if (code[j] === '"' || code[j] === "'") { const e = skipString(j); attrs.push({ name: a[0], raw: code.slice(j + 1, e - 1), pos: j + 1, quoted: true }); j = e; }
      else if (code[j] === "{") { const e = skipExpr(j); attrs.push({ name: a[0], raw: code.slice(j + 1, e - 1), pos: j + 1 }); j = e; }
      else return null;
    }
    return null;
  };
  // Children of the element whose opening tag ends at i: text pieces, string and hole expressions, nested text.
  const childPieces = (i) => {
    const pieces = [];
    let depth = 1, j = i, buf = "", bufPos = i;
    const flush = () => { if (buf) pieces.push({ text: decode(buf), pos: bufPos + Math.max(0, buf.search(/\S/)) }); buf = ""; };
    while (j < code.length) {
      if (code.startsWith("</", j)) { flush(); const e = code.indexOf(">", j); depth--; j = e < 0 ? code.length : e + 1; if (!depth) return pieces; bufPos = j; continue; }
      if (code.startsWith("<>", j)) { flush(); depth++; j += 2; bufPos = j; continue; }
      if (code[j] === "<" && /[A-Za-z_$]/.test(code[j + 1] || "")) { flush(); const t = openTag(j); if (!t) return pieces; if (!t.self) depth++; j = t.end; bufPos = j; continue; }
      if (code[j] === "{") {
        flush();
        const e = skipExpr(j);
        const inner = code.slice(j + 1, e - 1).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
        if (inner.trim()) {
          const lit = literal(inner, j + 1);
          if (lit && !lit.template) pieces.push(lit);
          else pieces.push({ text: `{${holeFromText(inner)}}`, pos: j + 1 + inner.search(/\S/) });
        }
        j = e; bufPos = j; continue;
      }
      if (!buf) bufPos = j;
      buf += code[j++];
    }
    return pieces;
  };
  const hits = [];
  const tagSels = sels.filter((s) => s.kind === "children" || s.kind === "prop" || s.kind === "anyprop");
  if (tagSels.length) {
    const re = /<([A-Za-z_$][\w$.]*)(?=[\s/>])/g;
    let m;
    while ((m = re.exec(code))) {
      let k = m.index - 1;
      while (k >= 0 && /\s/.test(code[k])) k--;
      if (k >= 0 && /[\w$)\]"'`]/.test(code[k]) && !/\b(return|yield|await|default)$/.test(code.slice(Math.max(0, k - 8), k + 1))) continue;
      const t = openTag(m.index);
      if (!t) continue;
      for (const s of tagSels) {
        if (s.kind === "children" && s.tag === t.name && !t.self) {
          const c = cleanChildren(childPieces(t.end));
          if (c) hits.push({ sel: s, text: c.text, component: t.name, line: lineOf(c.pos) });
        }
        if ((s.kind === "prop" && s.tag === t.name) || s.kind === "anyprop") {
          for (const a of t.attrs) {
            if (a.name !== s.prop || a.raw === null) continue;
            const v = a.quoted ? { text: decode(a.raw), pos: a.pos } : literal(a.raw.replace(/\/\*[\s\S]*?\*\//g, ""), a.pos);
            if (v && v.text.trim()) hits.push({ sel: s, text: v.text, component: t.name, line: lineOf(v.pos) });
          }
        }
      }
    }
  }
  for (const s of sels.filter((x) => x.kind === "call" || x.kind === "callkey")) {
    const re = new RegExp(`(?<![\\w$.])${s.callee.split(".").map(escRe).join("\\s*\\??\\.\\s*")}\\s*\\(`, "g");
    let m;
    while ((m = re.exec(code))) {
      let j = m.index + m[0].length;
      while (/\s/.test(code[j])) j++;
      let lit = null;
      if (s.kind === "call" && /["'`]/.test(code[j])) { const e = skipString(j); lit = literal(code.slice(j, e), j); }
      if (s.kind === "callkey" && code[j] === "{") {
        const e = skipExpr(j), body = code.slice(j, e);
        const k = new RegExp(`[{,\\s]["']?${escRe(s.key)}["']?\\s*:\\s*(?=["'\`])`).exec(body);
        if (k) { const at = j + k.index + k[0].length; lit = literal(code.slice(at, skipString(at)), at); }
      }
      if (lit && lit.text.trim()) hits.push({ sel: s, text: lit.text, component: s.callee, line: lineOf(lit.pos) });
    }
  }
  return hits;
}

function loadTS(root, parser) {
  if (parser === "regex") return null;
  for (const from of [root, process.cwd()]) {
    try { return createRequire(join(from, "noop.js"))("typescript"); } catch {}
  }
  if (parser === "typescript") throw new BadInput("copy-check: --parser typescript, and typescript does not resolve from the repo");
  return null;
}

// Every row of the inventory, sorted.
function extract(root, w, ts) {
  const rows = [], seen = new Set();
  const sels = w.slots.flatMap((s) => s.sels.map((x) => ({ ...x, slot: s.name })));
  for (const file of sourceFiles(root)) {
    const code = readFileSync(join(root, file), "utf8");
    let hits;
    try { hits = ts ? extractTS(ts, file, code, sels) : extractRegex(code, sels); } catch { hits = extractRegex(code, sels); }
    for (const h of hits) {
      const row = { slot: h.sel.slot, text: h.text, component: h.component, source: h.sel.source, file, line: h.line };
      const k = [row.slot, row.text, row.component, row.source, row.file, row.line].join("\t");
      if (!seen.has(k)) { seen.add(k); rows.push(row); }
    }
  }
  const order = new Map(w.slots.map((s, i) => [s.name, i]));
  rows.sort((a, b) => order.get(a.slot) - order.get(b.slot) || cmp(a.file, b.file) || a.line - b.line || cmp(a.text, b.text));
  return rows;
}
const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\r?\n/g, "\\n");
const toTsv = (rows) => [HEAD.join("\t"), ...rows.map((r) => HEAD.map((h) => esc(r[h])).join("\t"))].join("\n") + "\n";

// ---------- checks ----------
function casingProblem(text, casing, names) {
  if (casing !== "sentence" && casing !== "title") return null;
  const skip = [];
  for (const n of names) { const re = new RegExp(`(?<![\\p{L}\\p{N}])${escRe(n)}(?![\\p{L}\\p{N}])`, "gu"); let m; while ((m = re.exec(text))) skip.push([m.index, m.index + m[0].length]); }
  const tok = /\{[^{}]*\}|"[^"]*"|“[^”]*”|[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;
  let m, pos = 0;
  while ((m = tok.exec(text))) {
    const w = m[0], at = m.index, first = pos++ === 0;
    if (/^[{"“]/.test(w) || skip.some(([a, b]) => at >= a && at < b) || /\d/.test(w) || !/^\p{Script=Latin}/u.test(w)) continue;
    if (/^\p{Lu}{2,}$/u.test(w.replace(/['’-]/g, "")) || /^I(['’](m|ve|ll|d))?$/.test(w)) continue;
    const upper = /^\p{Lu}/u.test(w);
    if (casing === "sentence") {
      if (first && !upper) return `starts lowercase at '${w}'`;
      if (!first && upper && !/[.?!:]\s+$/.test(text.slice(0, at))) return `capitalizes '${w}' mid-sentence`;
    } else if ((first || w.replace(/[^\p{L}]/gu, "").length >= 4) && !upper) return `leaves '${w}' lowercase`;
  }
  return null;
}
function templateRe(t) {
  const parts = t.split(/(\{[^{}]+\})/);
  const body = parts.map((p) => (/^\{[^{}]+\}$/.test(p) ? ".+?" : escRe(p).replace(/\s+/g, "\\s+"))).join("");
  return new RegExp(`^${body}$`, "is");
}

function runCheck(root, { ts }) {
  const w = loadWriting(root);
  const rows = extract(root, w, ts);
  const fresh = toTsv(rows);
  const findings = [];
  const add = (file, line, rule, text, msg) => findings.push({ file, line, rule, text, msg });
  // copy/inventory-stale
  const invPath = join(root, INVENTORY);
  const diffLines = [];
  if (!existsSync(invPath)) add(INVENTORY, 1, "copy/inventory-stale", "", `no ${INVENTORY}. Run node scripts/copy-check.mjs --extract and commit it`);
  else {
    const old = readFileSync(invPath, "utf8").replace(/\r\n/g, "\n");
    if (old !== fresh) {
      const a = old.split("\n"), b = fresh.split("\n"), sa = new Set(a), sb = new Set(b);
      for (const l of a) if (!sb.has(l) && l) diffLines.push(`- ${l}`);
      for (const l of b) if (!sa.has(l) && l) diffLines.push(`+ ${l}`);
      add(INVENTORY, 1, "copy/inventory-stale", "", `differs from a fresh extract. Run node scripts/copy-check.mjs --extract and commit it${diffLines.length ? `\n  ${diffLines.slice(0, 5).join("\n  ")}` : ""}`);
    }
  }
  // Per-row slot rules
  const slotOf = new Map(w.slots.map((s) => [s.name, s]));
  for (const r of rows) {
    const s = slotOf.get(r.slot);
    const cp = casingProblem(r.text, s.casing, w.names);
    if (cp) add(r.file, r.line, "copy/casing", r.text, `'${r.text}' ${cp}. ${r.slot} is ${s.casing} case`);
    const len = [...r.text].length;
    if (s.max !== null && len > s.max) add(r.file, r.line, "copy/length", r.text, `'${r.text}' is ${len} characters. ${r.slot} holds at most ${s.max}`);
    const t = r.text.trim();
    if (!/\{[^{}]*\}$/.test(t)) {
      if (s.end === "period" && !/[.?!]$/.test(t)) add(r.file, r.line, "copy/end-punctuation", r.text, `'${r.text}' needs a period. ${r.slot} ends with . ? or !`);
      if (s.end === "none" && /(^|[^.])\.$/.test(t)) add(r.file, r.line, "copy/end-punctuation", r.text, `'${r.text}' ends with a period. ${r.slot} ends with none`);
    }
    if (s.template && !templateRe(s.template).test(t)) add(r.file, r.line, "copy/template", r.text, `'${r.text}' does not match ${r.slot}'s template '${s.template}'`);
    const bare = r.text.replace(/\{[^{}]*\}/g, " ");
    for (const b of w.banned) if (b.re.test(bare)) add(r.file, r.line, "copy/banned-word", r.text, `'${r.text}' uses '${b.word}'. Instead: ${b.instead}`);
  }
  // Verb chains
  for (const e of w.tableErrors) add(WRITING, e.line, "copy/chain-stale", "", e.msg);
  const at = new Map();
  for (const r of rows) { const k = `${r.file}:${r.line}`; if (!at.has(k)) at.set(k, []); at.get(k).push(r); }
  const chained = new Set();
  for (const c of w.chains) {
    for (const st of c.steps) {
      const k = `${st.file}:${st.line}`;
      if (st.step === "Confirm action") chained.add(k);
      // Several strings can share a line. The step's own slot narrows them when it is there.
      const all = at.get(k);
      const want = { Action: ["button", "link"], "Confirm title": ["dialog-title"], "Confirm action": ["confirm-action"], Result: ["toast", "notice"] }[st.step];
      const here = all && (all.filter((r) => want.includes(r.slot)).length ? all.filter((r) => want.includes(r.slot)) : all);
      if (!here) { add(WRITING, c.line, "copy/chain-stale", "", `chain '${c.chain}' ${st.step} ${k} has no inventory row. The string moved or its slot has no source`); continue; }
      const ok = here.some((r) => r.text.toLowerCase().match(/[\p{L}]+/gu)?.some((x) => c.forms.has(x)));
      if (!ok) add(st.file, st.line, "copy/verb-chain", here[0].text, `'${here[0].text}' has no form of '${[...c.forms][0]}', the verb of chain '${c.chain}' (${st.step})`);
    }
  }
  for (const e of w.exempt) chained.add(`${e.file}:${e.line}`);
  for (const r of rows) if (r.slot === "confirm-action" && !chained.has(`${r.file}:${r.line}`)) add(r.file, r.line, "copy/chain-missing", r.text, `'${r.text}' confirms an action in no verb chain. Declare its chain in ${WRITING}, or add an Exempt row with the reason`);
  findings.sort((a, b) => cmp(a.file, b.file) || a.line - b.line || cmp(a.rule, b.rule));
  return { w, rows, fresh, findings };
}

// ---------- self-test ----------
// Each fixtures/copy-check/<rule>/ holds case.json ({ "rule", "count" }, here or in each folder) and fail/ and pass/
// mini repos whose .fixture files are read under their inner name. fail/ must give exactly count findings of the rule
// and none of any other, and pass/ none. Each runs with the regex reader, and with typescript when it resolves.
function selfTest(dirArg, ts) {
  const dir = dirArg ? resolve(dirArg) : ((p) => existsSync(p) ? p : join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "copy-check"))(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "copy-check"));
  if (!existsSync(dir)) { console.log(`self-test: FAIL, no fixtures at ${dir}`); return false; }
  let ok = true, n = 0;
  for (const c of readdirSync(dir).sort()) {
    if (!statSync(join(dir, c)).isDirectory()) continue;
    for (const kind of ["fail", "pass"]) {
      const src = join(dir, c, kind);
      const caseFile = [join(src, "case.json"), join(dir, c, "case.json")].find(existsSync);
      if (!caseFile) continue;
      const spec = readJSON(caseFile);
      if (!existsSync(src)) { console.log(`self-test: ${c}/${kind} missing`); ok = false; continue; }
      const tmp = mkdtempSync(join(tmpdir(), "copy-check-"));
      cpSync(src, tmp, { recursive: true });
      const unfix = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) unfix(p); else if (e.endsWith(".fixture")) renameSync(p, p.slice(0, -8)); } };
      unfix(tmp);
      for (const [label, reader] of [["regex", null], ...(ts ? [["typescript", ts]] : [])]) {
        let found, err = "";
        try { found = runCheck(tmp, { ts: reader }).findings; } catch (e) { err = e.message; found = []; }
        const mine = found.filter((f) => f.rule === spec.rule).length;
        const others = found.filter((f) => f.rule !== spec.rule);
        const good = !err && (kind === "fail" ? mine === spec.count && !others.length : !found.length);
        if (!good) ok = false; n++;
        console.log(`self-test ${good ? "ok  " : "FAIL"} ${spec.rule} ${kind} (${label}): ${kind === "fail" ? `${mine}/${spec.count}` : `${found.length} findings`}${good ? "" : `  ${err || found.map((f) => `${f.file}:${f.line} ${f.rule} ${f.msg.split("\n")[0]}`).join(" | ").slice(0, 600)}`}`);
      }
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  console.log(`self-test: ${n} fixtures, ${ok ? "all as expected" : "FAILED"}`);
  return ok;
}

// ---------- CLI ----------
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const KNOWN = ["--root", "--extract", "--suggest-chains", "--init-allowlist", "--shrink-allowlist", "--prune-allowlist", "--list-rules", "--self-test", "--fixtures", "--no-self-test", "--parser", "--help"];
if (flag("--help") || flag("-h")) { console.log(HELP); process.exit(0); }
const unknown = argv.filter((a) => a.startsWith("--") && !KNOWN.includes(a));
if (unknown.length) { console.error(`copy-check: unknown ${unknown.join(", ")}. See --help`); process.exit(2); }
if (flag("--list-rules")) { for (const [id, text] of Object.entries(RULES)) console.log(`${id}\t${text}`); process.exit(0); }
const parser = val("--parser");
if (parser && !["typescript", "regex"].includes(parser)) { console.error("copy-check: --parser takes typescript or regex"); process.exit(2); }
function repoRoot(rootFlag) {
  if (rootFlag) return resolve(rootFlag);
  try { return execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || process.cwd(); } catch { return process.cwd(); }
}
const root = repoRoot(val("--root"));

try {
  if (flag("--self-test")) process.exit(selfTest(val("--fixtures"), loadTS(root, parser)) ? 0 : 1);
  if (!existsSync(join(root, WRITING))) { console.log(`copy-check: no ${WRITING}, nothing to check`); process.exit(0); }
  const ts = loadTS(root, parser);
  const reader = ts ? `typescript ${ts.version}` : "the regex fallback";

  if (flag("--extract")) {
    const w = loadWriting(root);
    const rows = extract(root, w, ts);
    mkdirSync(dirname(join(root, INVENTORY)), { recursive: true });
    writeFileSync(join(root, INVENTORY), toTsv(rows));
    const bySlot = new Map(w.slots.map((s) => [s.name, 0]));
    for (const r of rows) bySlot.set(r.slot, bySlot.get(r.slot) + 1);
    console.log(`copy-check: ${rows.length} rows in ${[...bySlot.values()].filter(Boolean).length} slots, read with ${reader}. Wrote ${INVENTORY}`);
    for (const [s, k] of bySlot) if (!k) console.log(`note: slot ${s} has no rows. Check its Sources`);
    process.exit(0);
  }

  if (flag("--suggest-chains")) {
    const w = loadWriting(root);
    const rows = extract(root, w, ts);
    console.log(["file", "action_line", "action_text", "confirm_line", "confirm_text", "result_line", "result_text"].join("\t"));
    const files = [...new Set(rows.map((r) => r.file))];
    for (const f of files) {
      const here = rows.filter((r) => r.file === f);
      const confirms = here.filter((r) => r.slot === "confirm-action"), buttons = here.filter((r) => r.slot === "button");
      const results = here.filter((r) => r.slot === "toast" || r.slot === "notice");
      if (!(confirms.length || buttons.length) || !results.length) continue;
      // The nearest result below the line, else the nearest above it (a handler defined before the markup).
      const after = (line) => results.filter((r) => r.line > line).sort((a, b) => a.line - b.line)[0] || results.slice().sort((a, b) => Math.abs(a.line - line) - Math.abs(b.line - line))[0] || null;
      const words = (t) => new Set(t.toLowerCase().match(/\p{L}+/gu) || []);
      const cell = (r) => (r ? [r.line, esc(r.text)] : ["none", ""]);
      if (confirms.length) for (const c of confirms) {
        const before = buttons.filter((b) => b.line < c.line).sort((a, b) => b.line - a.line);
        const cw = words(c.text);
        const action = before.find((b) => [...words(b.text)].some((x) => cw.has(x))) || before[0] || null;
        console.log([f, ...cell(action), ...cell(c), ...cell(after(c.line))].join("\t"));
      } else for (const b of buttons) console.log([f, ...cell(b), ...cell(null), ...cell(after(b.line))].join("\t"));
    }
    const chained = new Set([...w.chains.flatMap((c) => c.steps.filter((s) => s.step === "Confirm action").map((s) => `${s.file}:${s.line}`)), ...w.exempt.map((e) => `${e.file}:${e.line}`)]);
    for (const r of rows) if (r.slot === "confirm-action" && !chained.has(`${r.file}:${r.line}`)) console.log(`unchained ${r.file}:${r.line} ${r.text}`);
    process.exit(0);
  }

  let testOk = true;
  const beside = ((p) => existsSync(p) ? p : join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "copy-check"))(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "copy-check"));
  const allowMode = flag("--init-allowlist") || flag("--shrink-allowlist") || flag("--prune-allowlist");
  if (!flag("--no-self-test") && !allowMode && (val("--fixtures") || existsSync(beside))) testOk = selfTest(val("--fixtures"), ts);

  const { rows, findings } = runCheck(root, { ts });
  const alPath = join(root, ALLOWLIST);
  const byKey = new Map();
  for (const f of findings) { if (NEVER_ALLOW.has(f.rule)) continue; const k = `${f.file}\t${f.rule}\t${f.text}`; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(f); }

  if (flag("--prune-allowlist")) {
    if (!existsSync(alPath)) { console.error(`copy-check: no allowlist at ${ALLOWLIST}`); process.exit(2); }
    const al = readJSON(alPath) || {};
    const gone = [];
    for (const [file, rules] of Object.entries(al)) {
      for (const [rule, v] of Object.entries(rules)) {
        for (const [key, n] of Object.entries(v)) if (!byKey.has(`${file}\t${rule}\t${key}`)) { gone.push(`${file} ${rule} "${key}" (${n})`); delete v[key]; }
        if (!Object.keys(v).length) delete rules[rule];
      }
      if (!Object.keys(rules).length) delete al[file];
    }
    writeFileSync(alPath, JSON.stringify(al, null, 2) + "\n");
    gone.forEach((g) => console.log(`pruned\t${g}`));
    console.log(`pruned ${gone.length} stale entr${gone.length === 1 ? "y" : "ies"} from ${ALLOWLIST}`);
    process.exit(0);
  }
  if (flag("--init-allowlist") || flag("--shrink-allowlist")) {
    const exists = existsSync(alPath);
    if (flag("--init-allowlist") && exists) { console.error(`copy-check: ${ALLOWLIST} exists. Use --shrink-allowlist.`); process.exit(2); }
    if (flag("--shrink-allowlist") && !exists) { console.error(`copy-check: no allowlist at ${ALLOWLIST}`); process.exit(2); }
    const old = exists ? readJSON(alPath) || {} : null;
    const al = {};
    for (const [k, list] of [...byKey].sort(([a], [b]) => cmp(a, b))) {
      const [file, rule, key] = k.split("\t");
      if (file === WRITING) continue; // table errors are fixed, never allowed
      const n = !old ? list.length : Math.min(list.length, old?.[file]?.[rule]?.[key] ?? 0);
      if (n) ((al[file] ||= {})[rule] ||= {})[key] = n;
    }
    mkdirSync(dirname(alPath), { recursive: true });
    writeFileSync(alPath, JSON.stringify(al, null, 2) + "\n");
    let total = 0;
    for (const r of Object.values(al)) for (const v of Object.values(r)) for (const n of Object.values(v)) total += n;
    console.log(`wrote ${ALLOWLIST}: ${total} allowed finding(s) in ${Object.keys(al).length} file(s), keyed by text`);
    process.exit(0);
  }

  let allow = {};
  if (existsSync(alPath)) allow = readJSON(alPath) || {};
  else if (findings.length) console.log(`note: no allowlist at ${ALLOWLIST}. Every finding fails. Create one once with --init-allowlist.`);
  let failed = 0, allowed = 0;
  const printed = [], shrink = [];
  for (const f of findings.filter((x) => NEVER_ALLOW.has(x.rule))) { failed++; printed.push(`${f.file}:${f.line} ${f.rule} ${f.msg}`); }
  for (const [k, list] of byKey) {
    const [file, rule, key] = k.split("\t");
    const entry = allow[file]?.[rule];
    const cap = file === WRITING ? 0 : entry?.[key] ?? 0;
    if (list.length > cap) {
      failed += list.length - cap;
      const why = cap ? ` (allowlist holds ${cap}, found ${list.length})` : entry ? ` (not in the allowlist for this file)` : "";
      for (const f of list) printed.push(`${f.file}:${f.line} ${f.rule} ${f.msg}${why}`);
    } else { allowed += list.length; if (list.length < cap) shrink.push(`${file} ${rule} "${key}" ${cap} -> ${list.length}`); }
  }
  for (const [file, rules] of Object.entries(allow)) for (const [rule, v] of Object.entries(rules)) for (const [key, cap] of Object.entries(v)) if (!byKey.has(`${file}\t${rule}\t${key}`) && cap > 0) shrink.push(`${file} ${rule} "${key}" ${cap} -> 0`);
  const sortKey = (l) => { const m = /^(.*?):(\d+) /.exec(l); return m ? [m[1], Number(m[2])] : [l, 0]; };
  printed.sort((a, b) => { const [fa, la] = sortKey(a), [fb, lb] = sortKey(b); return cmp(fa, fb) || la - lb; }).forEach((l) => console.log(l));
  if (shrink.length) console.log(`allowlist can shrink (run --shrink-allowlist):\n  ${shrink.join("\n  ")}`);
  console.log(`copy-check: ${rows.length} strings read with ${reader}, ${failed} failing, ${allowed} allowlisted${testOk ? "" : ", self-test FAILED"}`);
  process.exitCode = failed || !testOk ? 1 : 0;
} catch (e) {
  if (e instanceof BadInput) { console.error(e.message); process.exit(2); }
  throw e;
}
