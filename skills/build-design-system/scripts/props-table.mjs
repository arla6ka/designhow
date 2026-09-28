#!/usr/bin/env node
// props-table.mjs: Props tables for the design system docs, read from the component's types.
// Node 18+. Uses the repo's own `typescript` package when it resolves, and falls back to a
// regex over the props type literal when it does not. gen-docs.mjs imports it.
// Run `node scripts/props-table.mjs --help` for usage.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `props-table.mjs: Markdown Props tables from a component file's types

Usage: node scripts/props-table.mjs [--root <dir>] [--regex] <component file>...

--root defaults to the git root of the first component file, else of the current
folder, else the current folder. Files resolve against the current folder, then
against the root.

For each exported component (a PascalCase export that can be called with props) it
prints a table with Prop, Type, Default and Purpose. Purpose is the prop's JSDoc,
so write purpose text as a /** comment */ on the type, not in the spec.
Props that come from React's DOM types or from a library are summarized in one
"Also accepts" line under the table instead of listed.

It loads typescript from the repo (--root). Without it, or with --regex, it reads
each "type ...Props = {...}" or "interface ...Props {...}" literal in the file
instead. The regex path does not expand imported types or intersections.

Exit 0 when every file gave at least one table, 1 when one gave none, 2 on bad input.`;

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
const posix = (p) => p.split(sep).join("/");
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const code = (s) => (s ? `\`${cell(s)}\`` : "");

function loadTs(root) {
  try { return createRequire(join(root, "package.json"))("typescript"); } catch { return null; }
}

function tsOptions(ts, root) {
  const cfgPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  let options = { jsx: ts.JsxEmit.Preserve, allowJs: true, esModuleInterop: true, skipLibCheck: true, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 };
  if (cfgPath) {
    const read = ts.readConfigFile(cfgPath, ts.sys.readFile);
    if (!read.error) options = { ...ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(cfgPath)).options };
  }
  return { ...options, noEmit: true, skipLibCheck: true, incremental: false, composite: false };
}

// Defaults: destructuring defaults in the first parameter, then cva's defaultVariants.
function defaultsIn(src, name) {
  const out = {};
  const dv = /defaultVariants\s*:\s*\{([^}]*)\}/.exec(src);
  if (dv) for (const m of dv[1].matchAll(/["']?([\w-]+)["']?\s*:\s*("[^"]*"|'[^']*'|[\w.-]+)/g)) out[m[1]] = m[2].replace(/'/g, '"');
  const fn = new RegExp(`(?:function\\s+${name}\\s*(?:<[^>]*>)?\\s*\\(|(?:const|let)\\s+${name}\\s*=\\s*(?:[\\w.]+\\()?(?:\\s*function\\s*\\w*)?\\s*\\(?)\\s*\\{`).exec(src);
  if (fn) {
    let i = fn.index + fn[0].length, depth = 1, start = i;
    while (i < src.length && depth) { if (src[i] === "{") depth++; else if (src[i] === "}") depth--; i++; }
    const body = src.slice(start, i - 1);
    let d = 0, cur = "";
    const parts = [];
    for (const c of body) { if ("{[(".includes(c)) d++; if ("}])".includes(c)) d--; if (c === "," && !d) { parts.push(cur); cur = ""; } else cur += c; }
    parts.push(cur);
    for (const p of parts) { const m = /^\s*([\w$]+)(?:\s*:\s*[\w$]+)?\s*=\s*([\s\S]+?)\s*$/.exec(p); if (m) out[m[1]] = m[2].replace(/'/g, '"'); }
  }
  return out;
}

function table(rows) {
  return ["| Prop | Type | Default | Purpose |", "|---|---|---|---|", ...rows.map((r) => `| ${code(r.name + (r.required ? "" : "?"))} | ${code(r.type)} | ${code(r.def)} | ${cell(r.purpose || "")} |`)].join("\n");
}

function viaTypeScript(ts, root, files) {
  const program = ts.createProgram(files.map((f) => resolve(root, f)), tsOptions(ts, root));
  const checker = program.getTypeChecker();
  const out = new Map();
  for (const f of files) {
    const abs = resolve(root, f);
    const sf = program.getSourceFile(abs);
    if (!sf) { out.set(f, null); continue; }
    const mod = checker.getSymbolAtLocation(sf);
    const src = readFileSync(abs, "utf8");
    const blocks = [];
    for (let sym of mod ? checker.getExportsOfModule(mod) : []) {
      let name = sym.getName();
      if (sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
      if (name === "default") name = sym.getName() !== "default" ? sym.getName() : f.split("/").pop().replace(/\.\w+$/, "").replace(/(^|[-_])(\w)/g, (_, s, c) => c.toUpperCase());
      if (!/^[A-Z]/.test(name)) continue;
      if (!(sym.flags & ts.SymbolFlags.Value)) continue;
      const type = checker.getTypeOfSymbolAtLocation(sym, sf);
      const sig = type.getCallSignatures()[0];
      if (!sig || !sig.parameters.length) continue;
      const propsType = checker.getTypeOfSymbolAtLocation(sig.parameters[0], sf);
      const defs = defaultsIn(src, name);
      const rows = [];
      const passed = new Map();
      for (const p of checker.getPropertiesOfType(propsType)) {
        const decls = p.getDeclarations() || [];
        const files = decls.map((d) => posix(d.getSourceFile().fileName));
        const lib = files.length && files.every((x) => x.includes("/node_modules/"));
        const cva = files.some((x) => x.includes("/class-variance-authority/"));
        if (lib && !cva) {
          const pkg = /\/node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(files[0])?.[1] || "a library";
          const key = pkg === "@types/react" ? "native element attributes from React's types" : `${pkg} props`;
          if (!passed.has(key)) passed.set(key, []);
          passed.get(key).push(p.getName());
          continue;
        }
        let t = checker.typeToString(checker.getTypeOfSymbolAtLocation(p, sf), undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope);
        t = t.replace(/\s*\|\s*(null|undefined)\b/g, "");
        rows.push({ name: p.getName(), type: t, required: !(p.flags & ts.SymbolFlags.Optional), def: defs[p.getName()] || "", purpose: ts.displayPartsToString(p.getDocumentationComment(checker)).split(/(?<=\.)\s/)[0] });
      }
      if (!rows.length && !passed.size) continue;
      rows.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
      const also = [...passed].sort().map(([k, names]) => (k.startsWith("native") ? k : `${k}${names.length <= 8 ? ` (${names.sort().join(", ")})` : ` (${names.length})`}`));
      blocks.push({ name, text: `${rows.length ? table(rows) : "No props of its own."}${also.length ? `\n\nAlso accepts: ${also.join("; ")}.` : ""}` });
    }
    out.set(f, blocks.length ? blocks : null);
  }
  return out;
}

// Fallback: each "type XProps = ... { }" or "interface XProps ... { }" literal, top-level members only.
function viaRegex(root, files) {
  const out = new Map();
  for (const f of files) {
    const src = readFileSync(resolve(root, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) => (m.startsWith("/**") ? m : "")).replace(/(^|[^:])\/\/.*$/gm, "$1");
    const blocks = [];
    for (const m of src.matchAll(/(?:interface|type)\s+(\w*Props)\b([^{=]*)(=?)([^{;]*)\{/g)) {
      let i = m.index + m[0].length, depth = 1;
      const start = i;
      while (i < src.length && depth) { if (src[i] === "{") depth++; else if (src[i] === "}") depth--; i++; }
      const body = src.slice(start, i - 1);
      const members = [];
      let d = 0, cur = "", doc = "";
      for (const c of body) {
        if ("{[(<".includes(c)) d++;
        if ("}])>".includes(c)) d--;
        if ((c === ";" || c === "\n" || c === ",") && d <= 0) { members.push(cur); cur = ""; } else cur += c;
      }
      members.push(cur);
      const rows = [];
      for (const raw of members) {
        const jd = /\/\*\*([\s\S]*?)\*\//.exec(raw);
        if (jd) doc = jd[1].replace(/^\s*\*\s?/gm, "").trim();
        const mm = /^\s*(?:readonly\s+)?["']?([\w$-]+)["']?(\?)?\s*:\s*([\s\S]+?)\s*$/.exec(raw.replace(/\/\*\*[\s\S]*?\*\//, ""));
        if (!mm) continue;
        rows.push({ name: mm[1], required: !mm[2], type: mm[3].replace(/\s*\|\s*(null|undefined)\b/g, ""), def: "", purpose: doc.split(/(?<=\.)\s/)[0] });
        doc = "";
      }
      const users = [...src.matchAll(new RegExp(`(?:function|const)\\s+([A-Z]\\w*)[^\\n]*\\b${m[1]}\\b`, "g"))].map((u) => u[1]);
      for (const r of rows) for (const u of users) { const dd = defaultsIn(src, u)[r.name]; if (dd) r.def = dd; }
      const ext = (m[2] + m[4]).replace(/[=&\s]+$/, "").replace(/^\s*(extends)?\s*/, "").trim();
      if (!rows.length && !ext) continue;
      blocks.push({ name: users[0] || m[1], text: `${rows.length ? table(rows) : "No props of its own."}${ext ? `\n\nAlso accepts: ${ext.replace(/\s*&\s*$/, "")} (not expanded).` : ""}` });
    }
    out.set(f, blocks.length ? blocks : null);
  }
  return out;
}

// files: repo-relative paths. Returns { method, tables: Map(file -> markdown or null) }.
export function propsTables(root, files, { regex = false } = {}) {
  const ts = regex ? null : loadTs(root);
  const raw = ts ? viaTypeScript(ts, root, files) : viaRegex(root, files);
  const method = ts ? "TypeScript" : "regex";
  const tables = new Map();
  for (const [f, blocks] of raw) {
    if (!blocks) { tables.set(f, null); continue; }
    const base = f.split("/").pop().replace(/\.\w+$/, "").replace(/(^|[-_])(\w)/g, (_, s, c) => c.toUpperCase());
    blocks.sort((a, b) => Number(b.name === base) - Number(a.name === base));
    tables.set(f, blocks.length === 1 ? blocks[0].text : blocks.map((b) => `### ${b.name}\n\n${b.text}`).join("\n\n"));
  }
  return { method, tables };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(argv.length ? 0 : 2); }
  const ri = argv.indexOf("--root");
  const given = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--root");
  const root = repoRoot(ri >= 0 ? argv[ri + 1] : null, given[0]);
  const files = given.map((f) => posix(relative(root, existsSync(resolve(f)) || !existsSync(join(root, f)) ? resolve(f) : join(root, f))));
  const missing = files.filter((f) => !existsSync(join(root, f)));
  if (missing.length) { console.error(`props-table: not found: ${missing.join(", ")}`); process.exit(2); }
  const { method, tables } = propsTables(root, files, { regex: argv.includes("--regex") });
  let bad = 0;
  for (const [f, md] of tables) {
    console.log(`<!-- ${f}, read with ${method} -->`);
    console.log(md || "No exported component props found.");
    console.log("");
    if (!md) bad++;
  }
  process.exit(bad ? 1 : 0);
}
