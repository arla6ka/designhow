#!/usr/bin/env node
// check-record.mjs: validate the run record and the tables the skills write, against one status vocabulary and the
// required columns (references/run-record.md). Node 18+, no dependencies. Run `node scripts/check-record.mjs --help`.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = `check-record.mjs: validate the run record's tables

Usage: node scripts/check-record.mjs [--root <dir>] [<file>...]
       node scripts/check-record.mjs --self-test

With no files it checks, when they exist:
  .design-system/run.md            Phases, Decisions, Gates, Ledger, and the
                                   Handoff's "### Found, not fixed" table
  .design-system/**/*.tsv          status, severity and tier columns (tmp/ and
                                   evidence/ skipped), found-not-fixed.tsv's columns
  .design-system/boss/state.md     the Steps table
  .migration/*/queue.tsv           status and stage
  .migration/*/agents.tsv          end
  .migration/*/gates.md            "Status: <x>" lines

Rules, one line per failure as "file:line record/<id> message":
  record/columns     a known table without its columns, in order:
                       Phases       Phase | Status | Artifact | Notes
                       Decisions    ID | Phase | Decision | Why | Evidence | Reversible
                       Gates        ID | Question | Default | Status | Commit | From
                       Ledger       Unit | Owner | Branch | Commit | Status | Verdict | Evidence
                       Found, not fixed   ID | Severity | Route | What | Why not fixed | Fix
                       Steps        # | Step | Skill | Status | Record | Verdict | Evidence
                     and a Handoff with no "### Found, not fixed" table
  record/status      a status cell that is not one word of todo, doing, done, blocked,
                     skipped, gate or default, optionally followed by "(<reason>)".
                     A gate's status is gate, todo, default, done or skipped
  record/reason      blocked or skipped with no "(<reason>)"
  record/verdict     a Ledger verdict other than verified, verified with gaps or
                     failed; a Steps verdict other than done, partial, blocked or failed
  record/severity    a severity other than blocking, should-fix or note
  record/why-not-fixed  other than no clearance, gate or out of scope
  record/rank        found-not-fixed rows out of severity order (blocking, then
                     should-fix, then note)
  record/overflow    more than 30 found-not-fixed rows in run.md. The rest go in
                     .design-system/found-not-fixed.tsv
  record/tier        a tier other than high, mid or low
  record/stage       a queue stage other than queued, ready, in-flight, reported,
                     verifying, verified, landed or failed
  record/cells       a row with a different number of cells than its header

Empty verdict and end cells pass (not reached yet). A status column in a file with
a route column (surfaces.tsv) holds HTTP codes and is not checked.

Exit 0 clean, 1 on failures, 2 on bad input or nothing to check.`;

export const STATUS = ["todo", "doing", "done", "blocked", "skipped", "gate", "default"];
const GATE_STATUS = ["gate", "todo", "default", "done", "skipped"];
const NEEDS_REASON = ["blocked", "skipped"];
const SEVERITY = ["blocking", "should-fix", "note"];
const WHY_NOT = ["no clearance", "gate", "out of scope"];
const LEDGER_VERDICT = ["verified", "verified with gaps", "failed"];
const STEP_VERDICT = ["done", "partial", "blocked", "failed"];
const TIER = ["high", "mid", "low"];
const STAGE = ["queued", "ready", "in-flight", "reported", "verifying", "verified", "landed", "failed"];
const MAX_FOUND = 30;
const TABLES = {
  phases: { heading: /^##\s+Phases\s*$/i, cols: ["phase", "status", "artifact", "notes"] },
  decisions: { heading: /^##\s+Decisions\s*$/i, cols: ["id", "phase", "decision", "why", "evidence", "reversible"] },
  gates: { heading: /^##\s+Gates\s*$/i, cols: ["id", "question", "default", "status", "commit", "from"] },
  ledger: { heading: /^##\s+Ledger\s*$/i, cols: ["unit", "owner", "branch", "commit", "status", "verdict", "evidence"] },
  found: { heading: /^###\s+Found,?\s+not fixed\s*$/i, cols: ["id", "severity", "route", "what", "why not fixed", "fix"] },
  steps: { heading: /^##\s+Steps\s*$/i, cols: ["#", "step", "skill", "status", "record", "verdict", "evidence"] },
};

// "word (reason)" -> { word, reason }. The word may hold spaces ("verified with gaps", "no clearance").
function parseCell(c) {
  const m = /^([a-z][a-z -]*?)\s*(?:\((.*)\))?\s*$/i.exec(String(c).trim());
  return m ? { word: m[1].toLowerCase(), reason: (m[2] || "").trim() } : { word: String(c).trim().toLowerCase(), reason: "", bad: true };
}
const oneOf = (c, list) => { const p = parseCell(c); return !p.bad && list.includes(p.word); };
// A value that starts with one of the list and may go on after a space, colon or parenthesis ("gate G-04").
const startsOne = (c, list) => list.some((w) => new RegExp(`^${w.replace(/[-]/g, "\\-")}(?:$|[\\s:(,.])`, "i").test(String(c).trim()));

// Check one status cell. kind "gate" narrows the words.
function statusProblem(c, kind, allowEmpty) {
  const v = String(c).trim().replace(/^`|`$/g, "");
  if (!v) return allowEmpty ? null : ["record/status", "empty status"];
  const p = parseCell(v), list = kind === "gate" ? GATE_STATUS : STATUS;
  if (p.bad || !list.includes(p.word)) return ["record/status", `"${v}" is not one of ${list.join(", ")}, with an optional (<reason>)`];
  if (NEEDS_REASON.includes(p.word) && !p.reason) return ["record/reason", `"${v}" needs a reason: ${p.word} (<reason>)`];
  return null;
}

const splitRow = (l) => l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());
const norm = (h) => h.replace(/[`*_]/g, "").trim().toLowerCase();

// Markdown tables with the heading above each: [{ heading, head, rows: [{ cells, line }], line }].
function mdTables(text) {
  const lines = text.split("\n"), out = [];
  let heading = "", fence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(```|~~~)/.test(l)) { fence = !fence; continue; }
    if (fence) continue;
    if (/^#{1,6}\s/.test(l)) { heading = l.trim(); continue; }
    if (/^\s*\|/.test(l) && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1] || "") && (lines[i + 1] || "").includes("-")) {
      const t = { heading, head: splitRow(l).map(norm), rows: [], line: i + 1 };
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) { t.rows.push({ cells: splitRow(lines[i]), line: i + 1 }); i++; }
      i--;
      out.push(t);
    }
  }
  return out;
}

// Rules that read a column by name, shared by Markdown tables and TSVs.
function checkColumns(t, add, opts = {}) {
  const col = (n) => t.head.indexOf(n);
  for (const r of t.rows) if (r.cells.length !== t.head.length) add(r.line, "record/cells", `${r.cells.length} cells under a ${t.head.length}-column header`);
  const httpStatus = col("route") >= 0 || col("path") >= 0;
  const cs = col("status");
  if (cs >= 0 && !httpStatus) for (const r of t.rows) { const p = statusProblem(r.cells[cs] ?? "", opts.gate ? "gate" : null, opts.emptyStatus); if (p) add(r.line, ...p); }
  const ce = col("end");
  if (ce >= 0) for (const r of t.rows) { const p = statusProblem(r.cells[ce] ?? "", null, true); if (p) add(r.line, ...p); }
  const cv = col("severity");
  if (cv >= 0) for (const r of t.rows) if (!oneOf(r.cells[cv] ?? "", SEVERITY)) add(r.line, "record/severity", `"${r.cells[cv] ?? ""}" is not blocking, should-fix or note`);
  const ct = col("tier");
  if (ct >= 0) for (const r of t.rows) { const v = (r.cells[ct] ?? "").trim(); if (v && !TIER.includes(v.toLowerCase())) add(r.line, "record/tier", `"${v}" is not high, mid or low`); }
  const cg = col("stage");
  if (cg >= 0) for (const r of t.rows) { const v = (r.cells[cg] ?? "").trim(); if (v && !STAGE.includes(v.toLowerCase())) add(r.line, "record/stage", `"${v}" is not one of ${STAGE.join(", ")}`); }
  const cw = col("why not fixed");
  if (cw >= 0) for (const r of t.rows) if (!startsOne(r.cells[cw] ?? "", WHY_NOT)) add(r.line, "record/why-not-fixed", `"${r.cells[cw] ?? ""}" is not no clearance, gate or out of scope`);
  if (cv >= 0 && cw >= 0) {
    let last = -1;
    for (const r of t.rows) { const k = SEVERITY.indexOf(parseCell(r.cells[cv] ?? "").word); if (k < 0) continue; if (k < last) add(r.line, "record/rank", `${SEVERITY[k]} after ${SEVERITY[last]}: rank blocking, then should-fix, then note`); last = Math.max(last, k); }
  }
}

// A Markdown record: run.md, or boss state.md (kind "boss", whose only fixed table is Steps).
export function checkMarkdown(text, kind = "run") {
  const out = [];
  const add = (line, rule, msg) => out.push({ line, rule, msg });
  const tables = mdTables(text);
  const lines = text.split("\n");
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const known = Object.entries(TABLES).filter(([k]) => (kind === "boss") === (k === "steps"));
  for (const [kind, spec] of known) {
    const at = lines.findIndex((l) => spec.heading.test(l.trim()));
    const t = tables.find((x) => spec.heading.test(x.heading)) || (kind === "steps" ? tables.find((x) => x.head.includes("step") && x.head.includes("skill")) : null);
    if (at < 0 && !t) continue;
    if (!t) { if (kind !== "found") add(at + 1, "record/columns", `${lines[at].trim()} has no table. Columns: ${spec.cols.join(" | ")}`); continue; }
    // With the wrong columns the cells cannot be read by name, so the table's other rules wait for the fix.
    if (!same(t.head, spec.cols)) { add(t.line, "record/columns", `${t.heading || kind} table columns are "${t.head.join(" | ")}", want "${spec.cols.join(" | ")}"`); continue; }
    checkColumns(t, add, { gate: kind === "gates" });
    const cv = t.head.indexOf("verdict");
    if (cv >= 0 && (kind === "ledger" || kind === "steps")) for (const r of t.rows) {
      const v = (r.cells[cv] ?? "").trim();
      const list = kind === "ledger" ? LEDGER_VERDICT : STEP_VERDICT;
      if (v && !(kind === "ledger" ? oneOf(v, list) : startsOne(v, list))) add(r.line, "record/verdict", `"${v}" is not one of ${list.join(", ")}`);
    }
    if (kind === "found" && t.rows.length > MAX_FOUND) add(t.rows[MAX_FOUND].line, "record/overflow", `${t.rows.length} rows. Keep the first ${MAX_FOUND} here and the rest in .design-system/found-not-fixed.tsv`);
  }
  // A Handoff needs its found-not-fixed table.
  const h = kind === "boss" ? -1 : lines.findIndex((l) => /^##\s+Handoff(?:\s+report)?\s*$/i.test(l.trim()));
  if (h >= 0 && !lines.slice(h).some((l) => TABLES.found.heading.test(l.trim()))) add(h + 1, "record/columns", `the Handoff has no "### Found, not fixed" table (${TABLES.found.cols.join(" | ")})`);
  // Tables outside the known ones still keep the vocabulary in any status or severity column.
  for (const t of tables) if (!known.some(([, s]) => s.heading.test(t.heading)) && !(kind === "boss" && t.head.includes("step") && t.head.includes("skill"))) checkColumns(t, add, { emptyStatus: true });
  return out;
}

// A TSV: header row, then rows. found-not-fixed.tsv must carry the found-not-fixed columns.
export function checkTsv(text, name) {
  const out = [];
  const add = (line, rule, msg) => out.push({ line, rule, msg });
  const rows = text.split("\n").map((l, i) => ({ l, line: i + 1 })).filter((x) => x.l.trim() && !x.l.startsWith("#"));
  if (!rows.length) return out;
  const t = { head: rows[0].l.split("\t").map(norm), rows: rows.slice(1).map((x) => ({ cells: x.l.split("\t").map((c) => c.trim()), line: x.line })) };
  if (/(^|\/)found-not-fixed\.tsv$/.test(name) && t.head.join("|") !== TABLES.found.cols.join("|")) { add(rows[0].line, "record/columns", `columns are "${t.head.join(" | ")}", want "${TABLES.found.cols.join(" | ")}"`); return out; }
  checkColumns(t, add);
  return out;
}

// Lines "Status: <x>" in a gates file.
export function checkGateLines(text) {
  const out = [];
  text.split("\n").forEach((l, i) => {
    const m = /^\s*[-*]?\s*\**Status\**:\s*(.+?)\s*$/.exec(l);
    if (!m) return;
    const p = statusProblem(m[1].replace(/\.$/, ""), "gate", false);
    if (p) out.push({ line: i + 1, rule: p[0], msg: p[1] });
  });
  return out;
}

// ---------- self-test ----------
function selfTest() {
  const good = `# Design system build: demo

## Phases
| Phase | Status | Artifact | Notes |
|---|---|---|---|
| 1 Frame | done | run.md#frame | |
| 2 Inventory | skipped (small app) | | |
| 3 Foundations | blocked (server down) | | |

## Decisions
| ID | Phase | Decision | Why | Evidence | Reversible |
|---|---|---|---|---|---|
| D-01 | 3 | Radius 8px | 41 of 52 | values.tsv | yes |

## Gates
| ID | Question | Default | Status | Commit | From |
|---|---|---|---|---|---|
| G-01 | Merge grays? | merge | default (unanswered) | 3c4d5e6 | token-mapping |
| G-02 | Keep Combobox? | keep | gate | | worker-2 |

## Ledger
| Unit | Owner | Branch | Commit | Status | Verdict | Evidence |
|---|---|---|---|---|---|---|
| family:button | coordinator | ds/x | 4f5e6d7 | done | verified with gaps | evidence/button/ |
| family:select | worker-2 | ds/x | | doing | | |

## Handoff report

### Found, not fixed
| ID | Severity | Route | What | Why not fixed | Fix |
|---|---|---|---|---|---|
| F-01 | blocking | /billing | Row actions unreachable by keyboard | no clearance | render a button |
| F-02 | should-fix | /team | 14 raw grays | gate G-01 | merge under G-01 |
| F-03 | note | /reports | Tabular figures off | out of scope | tabular-nums |
`;
  const bad = [
    ["unknown status", good.replace("| 1 Frame | done |", "| 1 Frame | finished |"), "record/status"],
    ["old status word", good.replace("| 1 Frame | done |", "| 1 Frame | in progress |"), "record/status"],
    ["skipped without reason", good.replace("skipped (small app)", "skipped"), "record/reason"],
    ["blocked without reason", good.replace("blocked (server down)", "blocked"), "record/reason"],
    ["gate status doing", good.replace("| gate | | worker-2 |", "| doing | | worker-2 |"), "record/status"],
    ["ledger verdict", good.replace("verified with gaps", "looks fine"), "record/verdict"],
    ["severity", good.replace("| F-03 | note |", "| F-03 | minor |"), "record/severity"],
    ["why not fixed", good.replace("| out of scope |", "| no time |"), "record/why-not-fixed"],
    ["rank", good.replace("| F-01 | blocking |", "| F-01 | note |"), "record/rank"],
    ["found columns", good.replace("| ID | Severity | Route | What | Why not fixed | Fix |", "| ID | Severity | Route | What | Fix | Why not fixed |"), "record/columns"],
    ["no found table", good.replace(/### Found, not fixed[\s\S]*$/, "Nothing left.\n"), "record/columns"],
    ["ledger columns", good.replace("| Unit | Owner | Branch | Commit | Status | Verdict | Evidence |", "| Unit | Owner | Branch | Commit | Verdict | Evidence |").replace("|---|---|---|---|---|---|---|\n| family:button", "|---|---|---|---|---|---|\n| family:button"), "record/columns"],
    ["cells", good.replace("| D-01 | 3 | Radius 8px | 41 of 52 | values.tsv | yes |", "| D-01 | 3 | Radius 8px | values.tsv | yes |"), "record/cells"],
    ["overflow", good.replace("| F-03 |", Array.from({ length: 30 }, (_, i) => `| F-${i + 10} | note | /x | y | gate | z |\n`).join("") + "| F-03 |"), "record/overflow"],
  ];
  let ok = true, n = 0;
  const show = (fs) => fs.map((f) => `${f.line} ${f.rule} ${f.msg}`).join("; ");
  const t = (name, good, got) => { n++; if (!good) ok = false; console.log(`self-test ${good ? "ok  " : "FAIL"} ${name}: ${got}`); };
  const base = checkMarkdown(good);
  t("clean run.md", !base.length, base.length ? show(base) : "0 findings");
  for (const [name, text, rule] of bad) {
    const f = checkMarkdown(text);
    t(name, f.length >= 1 && f.every((x) => x.rule === rule), f.length ? show(f) : `no finding, want ${rule}`);
  }
  const steps = "# Boss state\n\n## Steps\n| # | Step | Skill | Status | Record | Verdict | Evidence |\n|---|---|---|---|---|---|---|\n| 1 | Triage | design-system-boss | done | run.md | done | x |\n| 2 | Build | build-design-system | doing | | | |\n";
  t("boss steps clean", !checkMarkdown(steps, "boss").length, show(checkMarkdown(steps, "boss")) || "0 findings");
  const stepsBad = checkMarkdown(steps.replace("| done | x |", "| great | x |"), "boss");
  t("boss steps verdict", stepsBad.length === 1 && stepsBad[0].rule === "record/verdict", show(stepsBad) || "no finding");
  const queue = "surface\tkind\tpaths\tstates\tdepends_on\tstatus\tstage\tattempt\tbranch\thead\tbrief\tlast_report\tnote\nbilling\troute\tapp/billing\t-\t\tdoing\tin-flight\t1\tds/x\tabc\tb.md\tr.md\t\nteam\troute\tapp/team\t-\t\ttodo\tqueued\t0\t\t\t\t\t\n";
  t("queue.tsv clean", !checkTsv(queue, "queue.tsv").length, show(checkTsv(queue, "queue.tsv")) || "0 findings");
  const qBad = checkTsv(queue.replace("doing\tin-flight", "running\tflying"), "queue.tsv");
  t("queue.tsv status and stage", qBad.length === 2 && qBad.some((f) => f.rule === "record/status") && qBad.some((f) => f.rule === "record/stage"), show(qBad));
  const agents = "agent\trow\tstart\tend\nw1\tbilling\t10:00\tblocked (lost)\nw2\tteam\t10:05\t\nw3\tx\t10:06\tskipped\n";
  const aBad = checkTsv(agents, "agents.tsv");
  t("agents.tsv end", aBad.length === 1 && aBad[0].rule === "record/reason" && aBad[0].line === 4, show(aBad));
  const surfaces = "surface\troute\tstates\ttier\tstatus\nhome\t/\t-\thigh\t200\nbilling\t/billing\topen\tsometimes\t\n";
  const sBad = checkTsv(surfaces, "review/surfaces.tsv");
  t("surfaces.tsv tier, HTTP status passes", sBad.length === 1 && sBad[0].rule === "record/tier", show(sBad));
  const fnf = "id\tseverity\troute\twhat\twhy not fixed\tfix\nF-31\tnote\t/x\ty\tgate G-02\tz\n";
  t("found-not-fixed.tsv clean", !checkTsv(fnf, "found-not-fixed.tsv").length, show(checkTsv(fnf, "found-not-fixed.tsv")) || "0 findings");
  const fBad = checkTsv(fnf.replace("why not fixed\tfix", "why\tfix"), ".design-system/found-not-fixed.tsv");
  t("found-not-fixed.tsv columns", fBad.some((f) => f.rule === "record/columns"), show(fBad));
  const gates = "## G-01\nStatus: default (unanswered)\n\n## G-02\nStatus: open\n";
  const gBad = checkGateLines(gates);
  t("gates.md Status lines", gBad.length === 1 && gBad[0].line === 5 && gBad[0].rule === "record/status", show(gBad));
  console.log(`self-test: ${n} checks, ${ok ? "all as expected" : "FAILED"}`);
  return ok;
}

// ---------- CLI ----------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
  const bad = argv.filter((a) => a.startsWith("--") && !["--root", "--self-test"].includes(a));
  if (bad.length) { console.error(`check-record: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
  if (argv.includes("--self-test")) process.exit(selfTest() ? 0 : 1);
  const ri = argv.indexOf("--root");
  const args = argv.filter((a, i) => !a.startsWith("--") && !(ri >= 0 && i === ri + 1));
  const git = (d) => { try { return execSync("git rev-parse --show-toplevel", { cwd: d, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } };
  const root = ri >= 0 ? resolve(argv[ri + 1]) : (args[0] && existsSync(args[0]) && git(dirname(resolve(args[0])))) || git(process.cwd()) || process.cwd();
  const posix = (p) => p.split(sep).join("/");
  let files = args.map((a) => resolve(a));
  if (!files.length) {
    const ds = join(root, ".design-system");
    const walk = (d, out) => { for (const e of existsSync(d) ? readdirSync(d).sort() : []) { const p = join(d, e); if (statSync(p).isDirectory()) { if (!["tmp", "evidence", "node_modules"].includes(e)) walk(p, out); } else if (e.endsWith(".tsv")) out.push(p); } return out; };
    for (const p of [join(ds, "run.md"), join(ds, "boss", "state.md")]) if (existsSync(p)) files.push(p);
    files.push(...walk(ds, []));
    const mig = join(root, ".migration");
    if (existsSync(mig)) for (const run of readdirSync(mig).sort()) for (const f of ["queue.tsv", "agents.tsv", "gates.md"]) if (existsSync(join(mig, run, f))) files.push(join(mig, run, f));
    files = [...new Set(files)];
  }
  if (!files.length) { console.error(`check-record: nothing to check under ${root}: no .design-system/run.md, no TSVs under .design-system/, no .migration/<run>/ files. Pass --root <repo> or a file.`); process.exit(2); }
  let failures = 0;
  for (const f of files) {
    if (!existsSync(f)) { console.error(`check-record: no file at ${f}`); process.exit(2); }
    const text = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
    const rc = posix(relative(process.cwd(), f)), rr = posix(relative(root, f));
    const shown = !rc.startsWith("..") ? rc : !rr.startsWith("..") ? rr : f;
    const found = f.endsWith(".tsv") ? checkTsv(text, posix(f)) : /(^|[\\/])gates\.md$/.test(f) ? checkGateLines(text) : checkMarkdown(text, /[\\/]boss[\\/]state\.md$/.test(f) ? "boss" : "run");
    for (const x of found) { failures++; console.log(`${shown}:${x.line} ${x.rule} ${x.msg}`); }
  }
  console.log(`check-record: ${files.length} file(s), ${failures} failure(s)`);
  process.exit(failures ? 1 : 0);
}
