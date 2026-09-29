#!/usr/bin/env node
// check-system.mjs: the design system check, a starter. Node 18+, no dependencies.
// Reads whole JSX tags, not lines, so a multi-line <div onClick> is still one tag.
// Run `node scripts/check-system.mjs --help` for usage.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HELP = `check-system.mjs: design system check (starter)

Usage: node scripts/check-system.mjs [options] [--files <file>...]

With no options it runs the fixture self-test, then checks the repo against the
allowlist. Exit 0 clean, 1 on findings or a failed self-test, 2 on bad setup.

Options
  --root <dir>         repo root. Default: the git root of the first file given to
                       --files, --rehash or --save-stock, else of the current
                       folder, else the current folder. Pass it in a monorepo
                       whose app is not the git root
  --config <file>      config (default: scripts/check-system.config.json)
  --self-test          run only the fixtures, from --fixtures <dir> or from
                       fixtures/check-system/ beside this script. The standard
                       fixtures stay in the skill folder: --self-test --fixtures
                       <skill>/fixtures/check-system proves this copy
  --fixtures <dir>     the fixture folder for the self-test
  --no-self-test       skip the fixtures. With no fixture folder beside the script,
                       the default run skips them anyway
  --files <f>...       check only these files, with no allowlist (use on the pilot)
  --init               write a starter config guessed from the repo. Refuses to overwrite
  --init-allowlist     write the allowlist from today's findings. Refuses to overwrite
  --shrink-allowlist   lower allowlist counts to what is found now. Never raises one
  --prune-allowlist    drop allowlist entries that match no finding now: a fixed
                       literal, a deleted file, a retired rule. Counts that still
                       match stay. The close runs it before --left
  --hash-stock         fill empty sha256 cells in the drift list, for every status
  --rehash <f>... --note "<why>"
                       record the current hash of these drift-list files after a
                       reviewed edit, and write the note into each row. The note
                       is required
  --save-stock <f> <upstream>
                       save upstream's copy of a customized ui file as
                       <stockDir>/<f>.stock. <upstream> is a plain file or a
                       registry item JSON, such as \`npx shadcn@latest view <item>\`. Findings
                       on lines identical to a stock line are upstream's, not drift
  --left               after the scan, print what the allowlist still holds, by
                       file and rule. The close counts come from this output
  --list-rules         print rule id and rule, tab separated
  --list-blind-spots   print what the check cannot see, one line each
  --json               print findings as JSON
  --help               this text

Config keys (all optional, JSON)
  include        folders to scan               ["app","src","components","lib","pages"]
  exclude        path prefixes to skip          node_modules, .next, public, scripts,
                                                .design-system, .migration, __fixtures__,
                                                skill folders and any folder with a SKILL.md
  tokenSources   files where raw values may sit on custom property lines (--x: #fff)
  uiDir          the component folder           "components/ui"
  examplesDir    the docs' example files, always scanned  gen-docs.config.json's, else
                                                "docs/system/examples"
  registry       registry file                  "registry.json"
  driftList      TSV: file, status, sha256, note "scripts/ui-drift.tsv"
  allowlist      counted exceptions             "scripts/check-allowlist.json"
  nativeControls {"button":"Button","input":"Input","input:checkbox":"Checkbox",...}
                 default: derived from the ui barrel's and ui files' exports and
                 registry ids. An empty {} counts as unset, never as "off"
  buttonFile     the canonical Button source    default: derived
  buttonSignature, buttonSignatureMin (default 4)  classes that mark a Button copy
  linkComponents ["a","Link"]. System link components (exports ending in Link,
                 such as TextLink) are added for the background-and-padding test
  stockDir       upstream copies of customized ui files  "scripts/ui-stock"
  overlayComponents ["Dialog","Sheet","AlertDialog","Popover","Drawer"]
  varIgnore      custom property prefixes set at runtime by a library, never flagged
  sharedTokens   :root color tokens meant to hold one value in every theme
  aliases        {"@/": "src/"}                 default: from tsconfig paths
  deprecated     extra deprecated import paths, beside registry "replaces"
  rulesOff       rule ids to skip
  bans           the person's bans, each {"id":"rule/ban-<slug>","pattern":"<regex>","why":"<their words>"},
                 scanned in UI code (comments skipped) and in the banDocs pages. A line
                 holding "Don't:" or the ban's own id describes the ban and passes
  banDocs        folders of Markdown pages the bans also scan  ["docs/system"]

Fixture files end in .fixture (button.tsx.fixture), so tsc, lint and the
framework never compile them. The self-test reads them under their inner name.
A repo keeps only fixtures for rules the run added, in scripts/fixtures/check-system/.`;

const RULES = {
  "rule/raw-value": ["Hex, rgb(), hsl() or oklch() outside a token source line, including inside Tailwind arbitrary values", "use a semantic token"],
  "rule/named-color": ["A CSS named color in a style, in any quote style", "use a semantic token (transparent, currentColor and inherit pass)"],
  "rule/arbitrary-value": ["A Tailwind arbitrary value such as p-[13px] or bg-[#0f766e]", "use a scale step or a token utility"],
  "rule/palette-use": ["A Tailwind palette class such as text-gray-500, or var(--color-teal-700). Also bg-white, text-black and the other solid white or black utilities when the theme defines a role for that job: a surface (--background, --card, --popover) for bg, a foreground for text, fill and stroke, a border, input or ring for border, outline and ring. Opacity forms such as bg-black/50 and transparent pass", "use a semantic utility such as text-muted-foreground or bg-background"],
  "rule/doubled-utility": ["A Tailwind v4 utility that repeats its property word, such as text-text-muted, bg-bg-subtle or border-border-strong. It comes from a --color-<role> token whose role starts with text, bg or border", "rename the role so the utility reads once: --color-muted-foreground, --color-fg-muted, --color-edge"],
  "rule/inline-px": ["A px, rem or em length for spacing, radius, size or font size in an inline style", "use a spacing, radius, size or type token or utility"],
  "rule/css-px": ["A px, rem or em length for spacing, radius, type or size in a CSS file, outside a custom property line (0 and 1px pass; rem and em pass in line-height, letter-spacing and viewport math)", "use a spacing, radius, type or size token"],
  "rule/token-parity": ["A var(--x) or @theme reference no CSS file defines, or a color key that :root and a dark theme block do not both define", "define the token, fix the name, or list it in sharedTokens"],
  "trap/native-control": ["A native control where a system component exists", "use the system component"],
  "trap/button-div": ["onClick, onPointerDown or onMouseDown on a non-interactive element or an <a> with no href, or tabIndex with onKeyDown on one. A native <dialog> with onCancel passes (the backdrop click)", "render a <button>, or an <a href> when it navigates. Never move the handler into an effect to hide it from this rule"],
  "trap/role-button": ['role="button" on anything but a <button>', "render the Button, or a link when it navigates"],
  "trap/link-as-button": ["An <a>, Link or system link component styled as a button: copied classes, variant props, or a style or class that sets both a background and padding, token values included", "use the Button's link form (render/asChild or buttonVariants)"],
  "trap/button-clone": ["An element other than a link or <button> carrying the Button's classes or an app-CSS button class", "use the Button"],
  "trap/link-wraps-button": ["An <a>, Link or system link component wrapping a <button> or Button, or a <button> or Button (with no asChild or render) wrapping a link. Two tab stops, two roles, and invalid HTML", "one element: a ButtonLink, Button asChild around the Link, or the Button's styles (buttonVariants) on the Link"],
  "trap/label-unbound": ["A <label> or <Label> with no htmlFor and no control inside it. Clicking it focuses nothing, and a screen reader reads the control with no name. A spread ({...props}) passes", "add htmlFor with the control's id, or wrap the control"],
  "trap/overlay-conditional-render": ["An overlay mounted by a condition, such as {open && <Dialog>}", "keep it mounted and pass open={state}"],
  "trap/loading-label-swap": ["A button whose label is a ternary on a loading state, such as {saving ? \"Saving…\" : \"Save\"}, where the condition is also passed to disabled, loading or aria-busy, or is named like one (saving, pending, loading, submitting). The width shifts and a screen reader hears a new name", "keep the label, and show the Button's loading state: a spinner beside it, aria-busy and a blocked repeat click"],
  "rule/component-override": ["A className or style on a component the registry lists that sets padding, radius, shadow or background: Tailwind utilities, inline style keys, or an app-CSS class whose rule sets one. Layout (margin, width, grid or flex placement) passes", "add the variant or prop the screen needs to the component, such as Card inset, or gate it"],
  "rule/stock-edit": ["A ui file on the drift list (stock, customized or forked) changed since its hash was recorded", "revert it, or review the edit, update the row's status and note, and run --rehash <file> in the same commit"],
  "rule/unregistered-ui": ["A file in the ui folder with no registry entry and no drift-list row", "register it, or move it out of the ui folder"],
  "rule/deprecated-import": ["An import of a component the registry says was replaced", "import the canonical component"],
};

const BLIND = [
  "Rendered contrast, including non-text contrast of borders, focus rings and checkbox edges. Measure it in a browser",
  "Behavior: what a click, Enter or Escape does, focus order and focus return, and whether Cancel submits",
  "Layout at each viewport, overflow at 390px and touch target sizes",
  "Visual overrides on components the registry does not list, and overrides built at runtime: cn() branches, spread props, a class name held in a variable",
  "A loading state shown some other way than a label ternary on the button, such as a label read from a variable",
  "Class names and values built at runtime, such as template strings, cn() branches or fontSize: size / 2.5",
  "bg-white and text-black when the theme defines no role for their job, their opacity forms such as bg-black/50, and CSS keywords such as white in var() fallbacks",
  "Files outside the include folders, and ui files missing from the drift list (they are scanned, but no hash guards them)",
  "Whether a token's role comment still matches how the token is used",
  "Rules the generated rules page marks review, or enforces only through their own Check: clause",
];
const NAMED = "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" ");
const NAMED_RE = new RegExp(`(?<![\\w-])(${NAMED.join("|")})(?![\\w-])`, "i");
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|taupe|mauve|mist|olive";
const INTERACTIVE = new Set(["button", "input", "select", "textarea", "option", "summary", "details", "label", "video", "audio", "iframe"]);
const CODE_EXT = /\.(tsx|jsx|ts|js|mjs|cjs|vue|svelte|astro)$/;
const JSX_EXT = /\.(tsx|jsx)$/;
const CSS_EXT = /\.(css|scss|sass|less|pcss)$/;
const DEFAULTS = {
  include: ["app", "src", "components", "lib", "pages"],
  exclude: ["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".design-system", ".migration", ".design-review", "public", "scripts", ".agents", ".claude", ".cursor", ".codex", "__fixtures__"],
  tokenSources: [],
  uiDir: null,
  registry: "registry.json",
  driftList: "scripts/ui-drift.tsv",
  allowlist: "scripts/check-allowlist.json",
  nativeControls: null,
  buttonFile: null,
  buttonSignature: null,
  buttonSignatureMin: 4,
  linkComponents: ["a", "Link"],
  overlayComponents: ["Dialog", "Sheet", "AlertDialog", "Popover", "Drawer"],
  varIgnore: ["--tw-", "--radix-", "--anchor-", "--available-", "--transform-origin", "--popup-", "--positioner-", "--active-tab-", "--accordion-panel-", "--collapsible-panel-", "--scroll-area-", "--reka-", "--kb-"],
  sharedTokens: [],
  aliases: null,
  deprecated: [],
  rulesOff: [],
  bans: [],
  banDocs: ["docs/system"],
  stockDir: "scripts/ui-stock",
};

// ---------- small helpers ----------
const posix = (p) => p.split(sep).join("/");
// JSON with comments and trailing commas (tsconfig), string-aware.
const readJSON = (p) => JSON.parse(lex(readFileSync(p, "utf8"), true).code.replace(/,(\s*[}\]])/g, "$1"));
const sha256 = (p) => createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex");
const stripExt = (p) => p.replace(/\.(tsx|jsx|ts|js|mjs|cjs)$/, "").replace(/\/index$/, "");
// Fixtures are stored as <name>.fixture so no compiler sees them. In fixture mode a
// logical path such as ui/button.tsx reads ui/button.tsx.fixture from disk.
const unfix = (name) => name.replace(/\.fixture$/, "");
const phys = (cfg, rel) => (cfg.fixtures && !existsSync(join(cfg.root, rel)) && existsSync(join(cfg.root, rel + ".fixture")) ? rel + ".fixture" : rel);
const readRel = (cfg, rel) => readFileSync(join(cfg.root, phys(cfg, rel)), "utf8");
const existsRel = (cfg, rel) => existsSync(join(cfg.root, phys(cfg, rel)));
const uiEntries = (cfg) => (cfg.uiDir && existsSync(join(cfg.root, cfg.uiDir)) ? readdirSync(join(cfg.root, cfg.uiDir)).map((e) => (cfg.fixtures ? unfix(e) : e)).sort() : []);
const SEGMENT_EXCLUDES = new Set(["node_modules", ".next", ".git", ".design-system", ".migration", ".design-review", ".agents", ".claude", ".cursor", ".codex", "__fixtures__"]);

// Blank out comments, keep offsets. mask[i] = 1 inside a string or template literal.
function lex(src, js) {
  const out = src.split("");
  const mask = new Uint8Array(src.length);
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "*") {
      const e = src.indexOf("*/", i + 2), end = e < 0 ? n : e + 2;
      for (let k = i; k < end; k++) if (out[k] !== "\n") out[k] = " ";
      i = end; continue;
    }
    if (js && c === "/" && d === "/" && (i === 0 || /[\s;{}(),=]/.test(src[i - 1]))) {
      let e = src.indexOf("\n", i); if (e < 0) e = n;
      for (let k = i; k < e; k++) out[k] = " ";
      i = e; continue;
    }
    if (c === '"' || c === "'" || (js && c === "`")) {
      let k = i + 1;
      while (k < n) {
        if (src[k] === "\\") { k += 2; continue; }
        if (src[k] === c) break;
        if (c !== "`" && src[k] === "\n") break;
        k++;
      }
      for (let j = i; j <= Math.min(k, n - 1); j++) mask[j] = 1;
      i = k + 1; continue;
    }
    i++;
  }
  return { code: out.join(""), mask };
}

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
  return (pos) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= pos) lo = mid; else hi = mid - 1; } return lo + 1; };
}

// Skip a balanced {...} starting at code[k] === "{". Returns index after the closing brace, or -1.
function skipBraces(code, k) {
  let depth = 0;
  for (let i = k; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== c) { if (code[j] === "\\") j++; if (c !== "`" && code[j] === "\n") break; j++; }
      i = j; continue;
    }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

const KEYWORDS = new Set(["return", "yield", "default", "case", "else", "do", "in", "of", "await", "typeof", "void"]);
// Find every JSX opening tag with its attributes.
function jsxTags(code, mask) {
  const tags = [];
  for (let i = 0; i < code.length; i++) {
    if (code[i] !== "<" || mask[i] || !/[A-Za-z]/.test(code[i + 1] || "")) continue;
    let p = i - 1;
    while (p >= 0 && /\s/.test(code[p])) p--;
    if (p >= 0 && /[\w$)\].]/.test(code[p])) {
      let w = p; while (w >= 0 && /[\w$]/.test(code[w])) w--;
      if (!KEYWORDS.has(code.slice(w + 1, p + 1))) continue;
    }
    const nm = /^[A-Za-z][\w.:-]*/.exec(code.slice(i + 1, i + 200));
    if (!nm) continue;
    let k = i + 1 + nm[0].length;
    const attrs = [];
    let ok = false;
    while (k < code.length) {
      while (/\s/.test(code[k])) k++;
      if (code[k] === "/" && code[k + 1] === ">") { k += 2; ok = true; break; }
      if (code[k] === ">") { k += 1; ok = true; break; }
      if (code[k] === "{") { const e = skipBraces(code, k); if (e < 0) break; attrs.push({ name: "...", value: code.slice(k + 1, e - 1), expr: true, pos: k }); k = e; continue; }
      const an = /^[A-Za-z_$][\w:.$-]*/.exec(code.slice(k, k + 100));
      if (!an) break;
      const pos = k;
      k += an[0].length;
      while (/\s/.test(code[k])) k++;
      if (code[k] !== "=") { attrs.push({ name: an[0], value: true, pos }); continue; }
      k++;
      while (/\s/.test(code[k])) k++;
      const q = code[k];
      if (q === '"' || q === "'") {
        const e = code.indexOf(q, k + 1); if (e < 0) break;
        attrs.push({ name: an[0], value: code.slice(k + 1, e), expr: false, pos }); k = e + 1;
      } else if (q === "{") {
        const e = skipBraces(code, k); if (e < 0) break;
        attrs.push({ name: an[0], value: code.slice(k + 1, e - 1), expr: true, pos }); k = e;
      } else break;
    }
    if (ok) tags.push({ name: nm[0], attrs, pos: i, end: k });
  }
  return tags;
}

const attr = (tag, name) => tag.attrs.find((a) => a.name === name);
// Where an opening tag's element ends: the index of its matching </Name>, or -1 when it closes itself or never closes.
function closingTag(code, tags, t) {
  if (code.slice(t.end - 2, t.end) === "/>") return -1;
  const esc = t.name.replace(/[.$]/g, "\\$&");
  const events = tags.filter((u) => u.name === t.name && u.pos > t.pos && code.slice(u.end - 2, u.end) !== "/>").map((u) => [u.pos, 1]);
  for (const m of code.slice(t.end).matchAll(new RegExp(`</${esc}\\s*>`, "g"))) events.push([t.end + m.index, -1]);
  events.sort((a, b) => a[0] - b[0]);
  let depth = 1;
  for (const [pos, d] of events) { depth += d; if (!depth) return pos; }
  return -1;
}
const literalOf = (a) => {
  if (!a) return null;
  if (!a.expr) return a.value;
  const m = /^\s*(["'`])([^"'`]*)\1\s*$/.exec(a.value);
  return m ? m[2] : null;
};
const classTokens = (a) => {
  if (!a) return [];
  if (!a.expr) return a.value.split(/\s+/).filter(Boolean);
  const out = [];
  for (const m of a.value.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) out.push(...m[2].split(/\s+/).filter(Boolean));
  return out;
};

// ---------- config ----------
function loadConfig(root, file, override) {
  const cfgPath = resolve(root, file || "scripts/check-system.config.json");
  let user = {};
  if (existsSync(cfgPath)) {
    try { user = readJSON(cfgPath); } catch (e) { console.error(`check-system: cannot parse ${cfgPath}: ${e.message}`); process.exit(2); }
  } else if (file) { console.error(`check-system: config not found: ${cfgPath}`); process.exit(2); }
  const cfg = { ...DEFAULTS, ...user, ...(override || {}) };
  cfg.root = root;
  cfg.varIgnore = [...DEFAULTS.varIgnore, ...(user.varIgnore || []), ...((override || {}).varIgnore || [])];
  if (!cfg.uiDir) cfg.uiDir = ["components/ui", "src/components/ui", "src/ui", "ui"].find((d) => existsSync(join(root, d))) || null;
  cfg.aliases = cfg.aliases || tsAliases(root);
  // The docs' example files are product code a reader copies, so the scan covers them: examplesDir from the config,
  // else from scripts/gen-docs.config.json, else docs/system/examples.
  let gd = {};
  try { gd = readJSON(join(root, "scripts/gen-docs.config.json")); } catch {}
  cfg.examplesDir = posix(cfg.examplesDir || gd.examplesDir || "docs/system/examples").replace(/^\.\//, "").replace(/\/+$/, "");
  const inc = cfg.include.map((d) => posix(d).replace(/^\.\//, "").replace(/\/+$/, ""));
  if (existsSync(join(root, cfg.examplesDir)) && !inc.some((d) => d === "." || d === "" || cfg.examplesDir === d || cfg.examplesDir.startsWith(d + "/"))) cfg.include = [...cfg.include, cfg.examplesDir];
  // registry
  cfg.registered = new Set();
  cfg.replaces = new Set((cfg.deprecated || []).map(stripExt));
  const ids = [];
  const regPath = cfg.registry && join(root, cfg.registry);
  if (regPath && existsSync(regPath)) {
    let reg;
    try { reg = readJSON(regPath); } catch (e) { console.error(`check-system: cannot parse ${regPath}: ${e.message}`); process.exit(2); }
    for (const it of [...(reg.components || []), ...(reg.items || [])]) {
      const meta = it.meta || {};
      for (const s of [it.source, meta.source, ...(it.files || []).map((f) => (typeof f === "string" ? f : f.path))]) if (s) cfg.registered.add(posix(s).replace(/^\.\//, ""));
      for (const r of [...(it.replaces || []), ...(meta.replaces || [])]) cfg.replaces.add(stripExt(posix(r)));
      ids.push(String(it.id || it.name || "").toLowerCase());
    }
  }
  // Component names the registry lists: its ids and names in PascalCase, plus what its source files export.
  cfg.registryIds = ids.filter(Boolean);
  // drift list
  cfg.drift = new Map();
  const dPath = cfg.driftList && join(root, cfg.driftList);
  if (dPath && existsSync(dPath)) {
    readFileSync(dPath, "utf8").split("\n").forEach((l, i) => {
      if (!l.trim() || l.startsWith("#")) return;
      const [f, status, hash, note] = l.split("\t");
      if (i === 0 && /^file$/i.test(f)) return;
      cfg.drift.set(posix(f.trim()), { status: (status || "").trim(), hash: (hash || "").trim(), note, line: i + 1 });
    });
  }
  // native controls and button. An empty object is not a way to turn the rule off (rulesOff is), so it counts as unset.
  cfg.notes = [];
  if (cfg.nativeControls && typeof cfg.nativeControls === "object" && !Object.keys(cfg.nativeControls).length) {
    cfg.notes.push("nativeControls is {} in the config, which would silently turn trap/native-control off. It is treated as unset and derived. Delete the key, or list the rule in rulesOff to turn it off");
    cfg.nativeControls = null;
  }
  const exported = uiExports(cfg);
  cfg.registryComponents = registryComponents(cfg);
  cfg.systemLinks = [...exported].filter((n) => /^[A-Z]\w*Link$/.test(n) && n !== "Link");
  if (!cfg.nativeControls) cfg.nativeControls = deriveNativeControls(exported, ids);
  if (!cfg.buttonFile && cfg.uiDir) {
    const e = uiEntries(cfg).find((x) => /^button\.(tsx|jsx)$/i.test(x));
    const f = e ? join(cfg.uiDir, e) : null;
    if (f) cfg.buttonFile = posix(f);
  }
  if (!cfg.buttonSignature && cfg.buttonFile && existsRel(cfg, cfg.buttonFile)) {
    const src = lex(readRel(cfg, cfg.buttonFile), true).code;
    const toks = new Set();
    for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) for (const t of m[2].split(/\s+/)) if (/^[!a-z0-9[\]&_:/.%()=,*'-]+$/i.test(t) && t.length > 1 && !t.includes("${")) toks.add(t);
    cfg.buttonSignature = [...toks];
  }
  cfg.buttonSignature = cfg.buttonSignature || [];
  cfg.off = new Set(cfg.rulesOff || []);
  return cfg;
}

// Component names the system exports: the ui barrel (index.ts and friends), every file directly in the ui folder,
// and registry sources. `export * from "./x"` in the barrel is covered because ./x is read too.
function uiExports(cfg) {
  const names = new Set();
  const files = new Set();
  if (cfg.uiDir) for (const e of uiEntries(cfg)) if (/\.(tsx|jsx|ts|js)$/.test(e) && !/\.(test|spec|stories)\./.test(e)) files.add(`${posix(cfg.uiDir)}/${e}`);
  for (const r of cfg.registered) if (/\.(tsx|jsx|ts|js)$/.test(r)) files.add(r);
  for (const rel of files) {
    if (!existsRel(cfg, rel) || statSync(join(cfg.root, phys(cfg, rel))).isDirectory()) continue;
    const code = lex(readRel(cfg, rel), true).code;
    for (const m of code.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
    for (const m of code.matchAll(/\bexport\s*\{([^}]*)\}/g)) for (const part of m[1].split(",")) {
      const nm = /(?:^|\s)(?:type\s+)?([\w$]+)\s*(?:as\s+([\w$]+))?\s*$/.exec(part.trim());
      if (nm && !/^\s*type\s/.test(part)) names.add(nm[2] || nm[1]);
    }
  }
  names.delete("default");
  return names;
}

// The registry's component list: PascalCase ids and names, and the capitalized exports of registered source files.
function registryComponents(cfg) {
  const out = new Set();
  const pascal = (x) => x.replace(/(^|[-_ /])(\w)/g, (_, __, c) => c.toUpperCase());
  for (const id of cfg.registryIds || []) if (/^[a-z][\w-]*$/i.test(id)) out.add(pascal(id));
  for (const rel of cfg.registered) {
    if (!/\.(tsx|jsx)$/.test(rel) || !existsRel(cfg, rel) || statSync(join(cfg.root, phys(cfg, rel))).isDirectory()) continue;
    const code = lex(readRel(cfg, rel), true).code;
    for (const m of code.matchAll(/\bexport\s+(?:default\s+)?(?:function|const|let|class)\s+([A-Z][\w$]*)/g)) out.add(m[1]);
    for (const m of code.matchAll(/\bexport\s*\{([^}]*)\}/g)) for (const part of m[1].split(",")) { const nm = /([A-Z][\w$]*)\s*$/.exec(part.trim()); if (nm && !/^\s*type\s/.test(part)) out.add(nm[1]); }
  }
  return out;
}

// Native tag -> system component, from real export names, so a finding names the component to use.
const NATIVE_CANDIDATES = {
  button: ["Button"],
  input: ["Input", "TextInput", "TextField"],
  select: ["Select", "NativeSelect"],
  textarea: ["Textarea", "TextArea"],
  dialog: ["Dialog", "Modal"],
  "input:checkbox": ["Checkbox"],
  "input:radio": ["RadioGroup", "Radio"],
};
function deriveNativeControls(exported, ids) {
  const out = {};
  const pascal = (s) => s.replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase());
  const idSet = new Set(ids.map((i) => i.toLowerCase().replace(/[-_ ]/g, "")));
  for (const [tag, cands] of Object.entries(NATIVE_CANDIDATES)) {
    const hit = cands.find((c) => exported.has(c)) || cands.find((c) => idSet.has(c.toLowerCase()));
    if (hit) out[tag] = exported.has(hit) ? hit : pascal(hit);
  }
  return out;
}

function tsAliases(root) {
  for (const f of ["tsconfig.json", "jsconfig.json"]) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    try {
      const paths = readJSON(p).compilerOptions?.paths || {};
      const out = {};
      for (const [k, v] of Object.entries(paths)) if (k.endsWith("/*") && v[0]) out[k.slice(0, -1)] = posix(v[0]).replace(/^\.\//, "").replace(/\*$/, "");
      if (Object.keys(out).length) return out;
    } catch {}
  }
  return { "@/": "" };
}

// ---------- the scan ----------
const GENERIC = /^((inline-)?flex|grid|block|relative|items-.*|justify-.*|gap-.*|shrink.*|grow.*|whitespace-.*|transition.*|outline-none|select-none|text-(xs|sm|base|lg)|font-(normal|medium)|underline.*|hover:underline|w-.*|truncate|sr-only|group(\/.*)?)$/;

// A line of a customized ui file that is identical (whitespace aside) to a line of upstream's copy is upstream's.
const normLine = (l) => l.trim().replace(/\s+/g, " ");
// Only literal-value rules exempt upstream lines. A var() upstream reads and the app never defines is still broken.
const VALUE_RULES = new Set(["rule/raw-value", "rule/named-color", "rule/arbitrary-value", "rule/palette-use", "rule/inline-px", "rule/css-px"]);
function checkFile(cfg, rel, report, stockLines) {
  const src = readRel(cfg, rel);
  const js = CODE_EXT.test(rel), css = CSS_EXT.test(rel), jsx = JSX_EXT.test(rel);
  const { code, mask } = lex(src, js);
  const lineOf = lineIndex(src);
  const srcLines = stockLines ? src.split("\n") : null;
  const on = (r) => !cfg.off.has(r);
  const hit = (pos, rule, detail) => {
    if (!on(rule)) return;
    const line = lineOf(pos);
    if (stockLines && VALUE_RULES.has(rule) && stockLines.has(normLine(srcLines[line - 1] || ""))) { cfg.stockExempt = (cfg.stockExempt || 0) + 1; return; }
    report({ file: rel, line, rule, detail });
  };
  const isToken = cfg.tokenSources.map(posix).includes(rel);
  const lines = code.split("\n");
  const tokenLine = (pos) => isToken && /^\s*--[\w-]+\s*:/.test(lines[lineOf(pos) - 1]);
  const inUi = cfg.uiDir && rel.startsWith(posix(cfg.uiDir) + "/");
  const systemFile = inUi || cfg.registered.has(rel);

  // raw colors: in CSS anywhere; in code only inside string literals
  const rawRe = /(?<![&\w#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|(?<![A-Za-z0-9-])(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g;
  for (const m of code.matchAll(rawRe)) {
    if (js && !mask[m.index]) continue;
    if (tokenLine(m.index)) continue;
    // hsl(var(--x)) and hsl(var(--x) / 50%) read a token that stores bare channels (Tailwind v3 with shadcn).
    if (m[0].endsWith("(") && /^[a-z]+\(\s*var\(--[\w-]+\)\s*(?:\/\s*[\d.]+%?\s*)?\)/i.test(code.slice(m.index, m.index + 120))) continue;
    const call = m[0].endsWith("(") ? /^[a-z]+\([^()]*\)/i.exec(code.slice(m.index, m.index + 80)) : null;
    hit(m.index, "rule/raw-value", call ? call[0].replace(/\s+/g, " ") : m[0].endsWith("(") ? m[0] + ")" : m[0].toLowerCase());
  }
  // named colors
  if (css) {
    for (const m of code.matchAll(/(?:^|[;{\s])((?:background|border(?:-(?:top|right|bottom|left))?|outline|text-decoration|caret|accent|column-rule)?-?color|background|border(?:-(?:top|right|bottom|left))?|outline|fill|stroke|box-shadow)\s*:\s*([^;{}]*)/g)) {
      const nm = NAMED_RE.exec(m[2]);
      if (nm && !tokenLine(m.index + m[0].indexOf(m[1]))) hit(m.index + m[0].indexOf(m[1]), "rule/named-color", `${m[1]}: ${nm[1]}`);
    }
  }
  if (js) {
    for (const m of code.matchAll(/(?<![\w-])(color|background(?:Color)?|border(?:Top|Right|Bottom|Left)?(?:Color)?|outline(?:Color)?|fill|stroke|textDecorationColor|caretColor|accentColor|boxShadow)\s*:\s*(["'`])([^"'`\n]*)\2/g)) {
      const nm = NAMED_RE.exec(m[3]);
      if (nm) hit(m.index, "rule/named-color", `${m[1]}: ${nm[1]}`);
    }
  }
  // Tailwind: arbitrary values and palette classes, inside strings in code
  if (js) {
    for (const m of code.matchAll(/(?<![\w\-[\]])((?:[a-z0-9-]+:)*!?-?[a-z][a-z0-9]*(?:-[a-z0-9.]+)*)-\[([^\]\s'"`]+)\](?!:|\/[\w-]*:|[\w-])/g)) {
      if (!mask[m.index] || /^var\(--[\w-]+\)$/.test(m[2])) continue;
      hit(m.index, "rule/arbitrary-value", `${m[1].replace(/^(?:[a-z0-9-]+:)+/, "")}-[${m[2]}]`);
    }
    for (const m of code.matchAll(/(?<![\w\-[\]&])\[([a-z][a-z-]*):([^\]\s'"`]+)\](?!:|\/[\w-]*:|[\w-])/g)) {
      if (mask[m.index]) hit(m.index, "rule/arbitrary-value", m[0]);
    }
    const pal = new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|decoration|divide|placeholder|caret|accent|shadow)-(?:${PALETTE})-(?:50|[1-9]00|950)(?:\\/\\d+)?(?![\\w-])`, "g");
    for (const m of code.matchAll(pal)) if (mask[m.index]) hit(m.index, "rule/palette-use", m[0]);
    // Solid white and black utilities count as palette use once the theme has a role for that job.
    if (cfg.tokens) {
      const has = (re) => [...cfg.tokens.defined].some((n) => re.test(n));
      const roles = { surface: has(/^--(?:color-)?(?:background|card|popover|surface)$/), fg: has(/^--(?:color-)?(?:[\w-]+-)?foreground$/), edge: has(/^--(?:color-)?(?:border|input|ring)$/) };
      const job = { bg: "surface", from: "surface", via: "surface", to: "surface", text: "fg", fill: "fg", stroke: "fg", placeholder: "fg", caret: "fg", decoration: "fg", border: "edge", divide: "edge", outline: "edge", ring: "edge" };
      for (const m of code.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*!?(bg|text|border(?:-[trblxyse])?|ring|fill|stroke|from|via|to|outline|decoration|divide|placeholder|caret)-(white|black)(?![\w/-])/g)) {
        if (mask[m.index] && roles[job[m[1].replace(/-.*/, "")]]) hit(m.index, "rule/palette-use", m[0]);
      }
    }
    for (const m of code.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*!?(text|bg|border)-\1-[a-z0-9][\w-]*(?:\/\d+)?(?![\w-])/g)) if (mask[m.index]) hit(m.index, "rule/doubled-utility", m[0].replace(/^(?:[a-z0-9-]+:)+/, ""));
  }
  for (const m of code.matchAll(new RegExp(`var\\(--color-(?:${PALETTE})-\\d+\\)`, "g"))) if (!tokenLine(m.index)) hit(m.index, "rule/palette-use", m[0]);

  // px, rem and em lengths in CSS declarations (custom property lines are token definitions).
  // rem and em pass in line-height and letter-spacing, and beside a viewport unit or %, as in calc(100dvh - 2rem).
  if (css) {
    const props = /(?:^|[;{\s])((?:margin|padding|inset|scroll-margin|scroll-padding)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?|gap|row-gap|column-gap|top|right|bottom|left|border(?:-(?:top|bottom)-(?:left|right))?-radius|font-size|line-height|letter-spacing|(?:min-|max-)?(?:width|height)|flex-basis)\s*:\s*([^;{}]*?)\s*(?=[;}])/g;
    for (const m of code.matchAll(props)) {
      const at = m.index + m[0].indexOf(m[1]);
      const relOk = /^(?:line-height|letter-spacing)$/.test(m[1]) || /\d(?:[dsl]?v[hw]|%)/.test(m[2]);
      const len = [...m[2].matchAll(/(-?\d*\.?\d+)(px|r?em)\b/g)].filter((x) => x[2] === "px" ? Math.abs(Number(x[1])) > 1 : !relOk && Number(x[1]) !== 0);
      if (len.length && !tokenLine(at)) hit(at, "rule/css-px", `${m[1]}: ${m[2].trim()}`);
    }
  }

  // custom property references that nothing defines
  if (on("rule/token-parity") && cfg.tokens) {
    const refs = [];
    for (const m of code.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) if (!js || mask[m.index]) refs.push([m.index, m[1], m[2] === ","]);
    if (js) for (const m of code.matchAll(/-\((--[\w-]+)\)/g)) if (mask[m.index]) refs.push([m.index, m[1], false]);
    for (const [pos, name, fallback] of refs) {
      if (fallback || cfg.tokens.defined.has(name) || cfg.varIgnore.some((p) => name.startsWith(p))) continue;
      hit(pos, "rule/token-parity", `${name} is used and never defined`);
    }
    for (const f of cfg.tokens.parity) if (f.file === rel) hit(f.pos, "rule/token-parity", f.detail);
  }

  // overlays mounted by a condition
  if (jsx && on("trap/overlay-conditional-render")) {
    const re = new RegExp(`(&&|\\?)\\s*\\(?\\s*<(${cfg.overlayComponents.join("|")})(?:\\.Root)?(?=[\\s>/])`, "g");
    for (const m of code.matchAll(re)) {
      const lt = m.index + m[0].lastIndexOf("<");
      if (!mask[lt]) hit(lt, "trap/overlay-conditional-render", `{${m[1] === "&&" ? "cond &&" : "cond ?"} <${m[2]}>}`);
    }
  }

  // deprecated imports
  if (js && cfg.replaces.size) {
    for (const m of code.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\(\s*)(["'])([^"']+)\1/g)) {
      const target = resolveImport(cfg, rel, m[2]);
      if (target && cfg.replaces.has(target) && !cfg.replaces.has(stripExt(rel))) hit(m.index, "rule/deprecated-import", m[2]);
    }
  }

  // whole JSX tags
  if (!jsx) return;
  const tags = jsxTags(code, mask);
  for (const t of tags) {
    const lower = /^[a-z]/.test(t.name);
    const role = literalOf(attr(t, "role"));
    // named colors on SVG paint attributes
    if (lower) for (const a of ["fill", "stroke", "color"]) { const v = literalOf(attr(t, a)); if (v && NAMED_RE.test(v) && NAMED_RE.exec(v)[0] === v.trim()) hit(attr(t, a).pos, "rule/named-color", `${a}="${v}"`); }
    // inline px in style={{...}}
    const style = attr(t, "style");
    if (style && style.expr) {
      const re = /(?<![\w$])(margin\w*|padding\w*|gap|rowGap|columnGap|top|right|bottom|left|inset\w*|borderRadius|border\w*Radius|width|height|minWidth|maxWidth|minHeight|maxHeight|fontSize|lineHeight|letterSpacing|flexBasis)\s*:\s*(-?\d*\.?\d+(?![\w%.])|(["'`])[^"'`]*?\d(?:px|r?em)\b[^"'`]*\3)/g;
      for (const m of style.value.matchAll(re)) {
        const num = /^-?\d*\.?\d+$/.test(m[2]);
        if (num && (Number(m[2]) === 0 || m[1] === "lineHeight")) continue;
        // a string with rem or em and no px: rem and em pass in lineHeight, letterSpacing and viewport math, and at 0
        if (!num && !/\dpx\b/.test(m[2]) && (/^(?:lineHeight|letterSpacing)$/.test(m[1]) || /\d(?:[dsl]?v[hw]|%)/.test(m[2]) || ![...m[2].matchAll(/(-?\d*\.?\d+)r?em\b/g)].some((x) => Number(x[1]) !== 0))) continue;
        const off = code.indexOf(style.value, t.pos) + m.index;
        hit(off, "rule/inline-px", `${m[1]}: ${m[2]}`);
      }
    }
    // activation handlers on non-interactive elements
    // A native <dialog> closes on Escape through its cancel event, so a click handler on the element itself is the
    // backdrop pattern, not a fake button. It passes only with onCancel wired, the keyboard path.
    const nativeDialog = t.name === "dialog" && attr(t, "onCancel");
    if (lower && !role && !nativeDialog && !INTERACTIVE.has(t.name) && !(t.name === "a" && attr(t, "href"))) {
      const press = ["onClick", "onPointerDown", "onMouseDown", "onPointerUp", "onMouseUp"].find((h) => attr(t, h));
      const tab = attr(t, "tabIndex"), key = ["onKeyDown", "onKeyUp", "onKeyPress"].find((h) => attr(t, h));
      const focusable = tab && !/^\s*-\d/.test(String(tab.value));
      if (press) hit(t.pos, "trap/button-div", `<${t.name} ${press}>${t.name === "a" ? " with no href" : t.name === "dialog" ? " with no onCancel" : ""}`);
      else if (focusable && key) hit(t.pos, "trap/button-div", `<${t.name} tabIndex ${key}>`);
    }
    // a label that names nothing
    if (!systemFile && (t.name === "label" || t.name === "Label") && on("trap/label-unbound") && !attr(t, "htmlFor") && !attr(t, "for") && !attr(t, "...")) {
      const controls = new Set(["input", "select", "textarea", "Input", "Select", "SelectTrigger", "Textarea", "Checkbox", "Switch", "RadioGroup", "RadioGroupItem", "Slider", ...Object.values(cfg.nativeControls)]);
      const close = closingTag(code, tags, t);
      // Read the element's inner source, since a tag after plain JSX text ("Remember me <input />") is not in tags.
      const inner = close > 0 ? code.slice(t.end, close) : "";
      if (![...inner.matchAll(/<([A-Za-z][\w.]*)(?=[\s/>])/g)].some((m) => controls.has(m[1]))) hit(t.pos, "trap/label-unbound", `<${t.name}> with no htmlFor and no control inside`);
    }
    // role="button" on non-buttons
    if (role === "button" && t.name !== "button") hit(attr(t, "role").pos, "trap/role-button", `<${t.name} role="button">`);
    // a link wrapping a button, or a button wrapping a link
    if (on("trap/link-wraps-button")) {
      const links = [...cfg.linkComponents, ...cfg.systemLinks];
      const buttons = ["button", "Button", cfg.nativeControls.button].filter(Boolean);
      const outerLink = links.includes(t.name);
      const outerButton = buttons.includes(t.name) && !attr(t, "asChild") && !attr(t, "render");
      if (outerLink || outerButton) {
        const close = closingTag(code, tags, t);
        const inner = close > 0 && tags.find((u) => u.pos > t.end && u.pos < close && (outerLink ? buttons : links).includes(u.name));
        if (inner) hit(t.pos, "trap/link-wraps-button", `<${t.name}> wraps <${inner.name}>`);
      }
    }
    // a button label that swaps while it loads
    if (!systemFile && on("trap/loading-label-swap") && ["button", "Button", cfg.nativeControls.button].filter(Boolean).includes(t.name)) {
      const close = closingTag(code, tags, t);
      const inner = close > 0 ? code.slice(t.end, close) : "";
      const lit = (x) => /^(["'`])[^"'`]*\1$/.test(x.trim());
      for (const m of inner.matchAll(/\{\s*(!?\s*[\w$.]+)\s*\?\s*([^:{}]+?)\s*:\s*([^{}]+?)\s*\}/g)) {
        const [a, b] = [m[2], m[3]];
        if (!(lit(a) || lit(b)) || !(lit(a) || a.trim().startsWith("<")) || !(lit(b) || b.trim().startsWith("<"))) continue;
        const cond = m[1].replace(/^!\s*/, ""), last = cond.split(".").pop();
        const state = ["disabled", "loading", "pending", "isLoading", "isPending", "busy", "aria-busy", "aria-disabled"].map((n) => attr(t, n)).filter((x) => x && x.expr).some((x) => new RegExp(`(^|[^\\w$.])${cond.replace(/[.$]/g, "\\$&")}(?![\\w$])`).test(x.value));
        if (state || /(load|sav|pend|submit|busy|send|delet|creat|updat|process|progress|work)/i.test(last))
          hit(t.pos + (t.end - t.pos) + m.index, "trap/loading-label-swap", `<${t.name}> label swaps on ${cond}: ${a.trim().slice(0, 30)} / ${b.trim().slice(0, 30)}`);
      }
    }
    // visual overrides on components the registry lists
    if (!systemFile && on("rule/component-override") && cfg.registryComponents.has(t.name)) {
      const why = [];
      const cls = attr(t, "className"), sty = attr(t, "style");
      for (const x of classTokens(cls)) {
        const bare = x.replace(/^(?:[a-z0-9-]+:)+/, "").replace(/^!/, "");
        if (/^(p[xytrblse]?-|rounded(-|$)|shadow(-|$)|bg-)/.test(bare) && !BG_NOT_COLOR.test(bare) && !/^shadow-none$/.test(bare)) why.push(x);
        else if (cfg.cssVisual && cfg.cssVisual.has(x)) why.push(`.${x} (${cfg.cssVisual.get(x)})`);
      }
      if (sty && sty.expr) for (const m of sty.value.matchAll(/(?<![\w$])(padding\w*|borderRadius|border\w*Radius|boxShadow|background(?:Color)?)\s*:/g)) why.push(`style ${m[1]}`);
      if (why.length) hit(t.pos, "rule/component-override", `<${t.name}> ${why.slice(0, 4).join(", ")}`);
    }
    // native control where a system component exists
    if (lower && !systemFile) {
      let key = t.name;
      if (t.name === "input") {
        const type = (literalOf(attr(t, "type")) || "text").toLowerCase();
        key = cfg.nativeControls[`input:${type}`] ? `input:${type}` : /^(text|email|password|search|tel|url|number|date|time|datetime-local|month|week)$/.test(type) ? "input" : null;
      }
      if (key && cfg.nativeControls[key]) hit(t.pos, "trap/native-control", `<${t.name}${key.includes(":") ? ` type=${key.split(":")[1]}` : ""}> where the system has ${cfg.nativeControls[key]}`);
    }
    // links styled as buttons, and Button copies on any other element
    const plainLink = cfg.linkComponents.includes(t.name);
    const isLink = plainLink || cfg.systemLinks.includes(t.name);
    if (!systemFile && (isLink || (lower && !["button", "input", "select", "textarea"].includes(t.name)))) {
      const rule = isLink ? "trap/link-as-button" : "trap/button-clone";
      const cls = attr(t, "className");
      if (cls && /\bbuttonVariants\s*\(/.test(cls.value)) continue;
      if (plainLink && attr(t, "variant")) { hit(t.pos, rule, `<${t.name} variant=...>`); continue; }
      const toks = classTokens(cls);
      // A link whose own styles set a background and padding is a button, whatever the values. A block, flex or grid
      // link is a card or row link and passes, and so does a background that shows only on hover or focus.
      if (isLink) {
        const why = linkBgPad(cfg, toks, attr(t, "style"));
        if (why) { hit(t.pos, rule, `<${t.name}> sets a background and padding (${why})`); continue; }
      }
      const sig = new Set(cfg.buttonSignature);
      const shared = toks.filter((x) => sig.has(x) && !GENERIC.test(x));
      const named = shared.filter((x) => /btn|button/i.test(x));
      const appCss = toks.filter((x) => cfg.cssButtons.has(x) && !named.includes(x));
      const sized = toks.some((x) => /^(h|size|py|min-h)-/.test(x.replace(/^(?:[a-z0-9-]+:)+/, "")));
      if (appCss.length) { hit(t.pos, rule, `<${t.name}> uses the app-CSS button class .${appCss[0]} (${cfg.cssButtons.get(appCss[0])})`); continue; }
      if (named.length || (shared.length >= cfg.buttonSignatureMin && sized)) hit(t.pos, rule, `<${t.name}> shares ${named.length ? named.join(" ") : shared.length + " classes"} with ${cfg.buttonFile || "the Button"}`);
    }
  }
}

// Does a link's own styling set both a background and padding? Returns the evidence, or null.
// Tailwind: an unconditional bg-* color utility (responsive and dark: prefixes count, hover: and focus: do not)
// plus a p-, px-, py-... utility other than 0. Inline style: background plus padding. App CSS: a class whose rule
// sets both. Block, flex and grid links pass: they are card and row links.
const BG_NOT_COLOR = /^bg-(?:transparent|none|inherit|current|auto|cover|contain|center|top|bottom|left|right|left-top|left-bottom|right-top|right-bottom|repeat.*|no-repeat|fixed|local|scroll|clip-.*|origin-.*|blend-.*|linear-.*|radial-.*|conic-.*|gradient-.*|size-.*|position-.*|top-.*|bottom-.*|left-.*|right-.*)$/;
const LAYOUT_VARIANT = /^(?:(?:sm|md|lg|xl|2xl|dark|max-sm|max-md|max-lg|max-xl):)*/;
function linkBgPad(cfg, toks, style) {
  const base = toks.filter((x) => { const bare = x.replace(LAYOUT_VARIANT, ""); return !bare.includes(":"); }).map((x) => x.replace(LAYOUT_VARIANT, "").replace(/^!/, ""));
  const blockLevel = (v) => /^(block|flex|grid|table|list-item)$/.test(v);
  if (base.some(blockLevel)) return null;
  const bg = base.find((x) => /^bg-/.test(x) && !BG_NOT_COLOR.test(x));
  const pad = base.find((x) => /^p[xytrblse]?-/.test(x) && !/^p[xytrblse]?-0$/.test(x));
  if (bg && pad) return `${bg} ${pad}`;
  if (style && style.expr) {
    const v = style.value;
    const disp = /(?<![\w$])display\s*:\s*["'`](block|flex|grid)["'`]/.exec(v);
    const sbg = /(?<![\w$])background(?:Color)?\s*:\s*(?!["'`](?:transparent|none|inherit|initial|unset)["'`])\S/.test(v);
    const spad = /(?<![\w$])padding\w*\s*:\s*(?!["'`]?0["'`]?\s*[,}])\S/.test(v);
    if (!disp && sbg && spad) return "inline style";
  }
  for (const c of toks) {
    const hitCss = cfg.cssBgPad && cfg.cssBgPad.get(c);
    if (hitCss && !hitCss.block) return `.${c}, ${hitCss.loc}`;
  }
  return null;
}

function resolveImport(cfg, from, spec) {
  let p = null;
  for (const [a, target] of Object.entries(cfg.aliases)) if (spec.startsWith(a)) { p = target + spec.slice(a.length); break; }
  if (p === null && spec.startsWith(".")) p = posix(join(dirname(from), spec));
  if (p === null) return null;
  return stripExt(posix(p).replace(/^\.\//, ""));
}

function listFiles(cfg) {
  const out = [];
  const ex = cfg.exclude.map(posix);
  const skip = (rel) => ex.some((e) => rel === e || rel.startsWith(e + "/") || (SEGMENT_EXCLUDES.has(e) && rel.split("/").includes(e)));
  const walk = (rel) => {
    const abs = join(cfg.root, rel);
    const st = statSync(abs, { throwIfNoEntry: false });
    if (!st || skip(rel)) return;
    if (st.isDirectory()) { if (rel && existsSync(join(abs, "SKILL.md"))) return; for (const e of readdirSync(abs).sort()) walk(rel ? `${rel}/${e}` : e); return; } // a folder holding a SKILL.md is a skill, not product code
    const logical = cfg.fixtures ? unfix(rel) : rel;
    if (cfg.fixtures && logical === rel && /\.(tsx|jsx|ts|js)$/.test(rel)) return; // fixtures must be .fixture files
    if (CODE_EXT.test(logical) || CSS_EXT.test(logical)) out.push(logical);
  };
  for (const d of cfg.include) walk(d === "." || d === "./" ? "" : posix(d).replace(/^\.\//, ""));
  for (const t of cfg.tokenSources) if (!out.includes(posix(t)) && existsRel(cfg, t)) out.push(posix(t));
  return [...new Set(out)];
}

// Walk CSS rule blocks: every declaration with the chain of selectors or at-rules around it.
function cssBlocks(code) {
  const blocks = [];
  const stack = [];
  let start = 0;
  const decl = (a, b) => {
    const text = code.slice(a, b);
    const m = /^(\s*)([\w-]+)\s*:([\s\S]*)$/.exec(text);
    if (m && stack.length) stack[stack.length - 1].decls.push({ prop: m[2], value: m[3].trim(), pos: a + m[1].length });
  };
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'") { const e = code.indexOf(c, i + 1); i = e < 0 ? code.length : e; continue; }
    if (c === "(") { let d = 1, j = i + 1; while (j < code.length && d) { if (code[j] === "(") d++; else if (code[j] === ")") d--; j++; } i = j - 1; continue; }
    if (c === "{") { const pre = code.slice(start, i); stack.push({ prelude: pre.trim(), chain: [...stack.map((b) => b.prelude), pre.trim()], decls: [], pos: start + pre.length - pre.trimStart().length }); start = i + 1; }
    else if (c === ";") { decl(start, i); start = i + 1; }
    else if (c === "}") { decl(start, i); const b = stack.pop(); if (b) blocks.push(b); start = i + 1; }
  }
  return blocks;
}

const DARK = /\.dark\b|\[data-(?:theme|mode|color-scheme)=["']?dark|prefers-color-scheme:\s*dark|\.theme-dark\b/;
const LIGHT_ROOT = /^(?::root|html|:host|\.light|\[data-(?:theme|mode)=["']?light["']?\])(?:\s*,\s*(?::root|html|:host|\.light|\[data-(?:theme|mode)=["']?light["']?\]))*$/;
// Bare HSL channels, as Tailwind v3 with shadcn stores them (222.2 47.4% 11.2%), are colors too.
const COLOR_VALUE = new RegExp(`^(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix|color)\\(.*|-?[\\d.]+(?:deg)?\\s+[\\d.]+%\\s+[\\d.]+%(?:\\s*\\/\\s*[\\d.]+%?)?|${NAMED.join("|")})$`, "i");

// CSS files a stylesheet imports from node_modules (such as tailwindcss or a component library's CSS), for definitions only.
function importedCss(root, spec, from) {
  const cands = [];
  if (/^(\.|\/)/.test(spec)) cands.push(join(dirname(from), spec));
  else {
    const base = join(root, "node_modules", spec);
    cands.push(base, base + ".css", join(base, "index.css"));
    try { const pj = JSON.parse(readFileSync(join(base, "package.json"), "utf8")); for (const k of [pj.style, pj.exports?.["."]?.style, typeof pj.exports?.["."] === "string" ? pj.exports["."] : null]) if (k) cands.push(join(base, k)); } catch {}
  }
  return cands.find((p) => CSS_EXT.test(p) && existsSync(p) && statSync(p).isFile()) || null;
}

// One pass over the repo: defined custom properties, theme parity, app-CSS button classes.
function indexRepo(cfg) {
  const files = listFiles(cfg);
  const defined = new Set();
  const lightDefs = new Set();
  const rootKeys = new Map(), darkKeys = new Map();
  const candidates = new Map();
  const bgPad = new Map();
  const visual = new Map();
  const onButtons = new Set();
  const seenCss = new Set();
  const readCssDefs = (abs, depth) => {
    if (depth > 4 || seenCss.has(abs)) return;
    seenCss.add(abs);
    const code = lex(readFileSync(abs, "utf8"), false).code;
    for (const m of code.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) { defined.add(m[1]); lightDefs.add(m[1]); }
    for (const m of code.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) { const p = importedCss(cfg.root, m[1], abs); if (p) readCssDefs(p, depth + 1); }
  };
  for (const rel of files) {
    const js = CODE_EXT.test(rel), css = CSS_EXT.test(rel);
    const { code, mask } = lex(readRel(cfg, rel), js);
    if (css) {
      for (const m of code.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) { const p = importedCss(cfg.root, m[1], join(cfg.root, rel)); if (p) readCssDefs(p, 0); }
      for (const b of cssBlocks(code)) {
        const dark = b.chain.some((p) => DARK.test(p));
        const root = !dark && LIGHT_ROOT.test(b.prelude);
        for (const d of b.decls) {
          if (!d.prop.startsWith("--")) continue;
          defined.add(d.prop);
          if (!dark) lightDefs.add(d.prop);
          const at = { file: rel, pos: d.pos, value: d.value };
          if (dark && !darkKeys.has(d.prop)) darkKeys.set(d.prop, at);
          if (root && !rootKeys.has(d.prop)) rootKeys.set(d.prop, at);
        }
        const classes = b.prelude.split(",").map((x) => /^\.([\w-]+)$/.exec(x.trim())?.[1]);
        if (!classes.length || classes.some((x) => !x)) continue;
        const bg = b.decls.find((d) => /^background(-color)?$/.test(d.prop) && !/^(transparent|none|inherit|initial|unset)\b/.test(d.value));
        const pad = b.decls.some((d) => /^padding/.test(d.prop));
        const block = b.decls.some((d) => d.prop === "display" && /^(block|flex|grid|table|list-item)\b/.test(d.value));
        if (bg && pad) for (const c of classes) if (!candidates.has(c)) candidates.set(c, `${rel}:${lineIndex(code)(b.pos)}`);
        if (bg && pad) for (const c of classes) if (!bgPad.has(c)) bgPad.set(c, { loc: `${rel}:${lineIndex(code)(b.pos)}`, block });
        const vis = b.decls.find((d) => /^(padding(-\w+)*|border(-\w+)?-radius|box-shadow|background(-color)?)$/.test(d.prop));
        if (vis) for (const c of classes) if (!visual.has(c)) visual.set(c, `${vis.prop} at ${rel}:${lineIndex(code)(b.pos)}`);
      }
    } else if (js) {
      for (const m of code.matchAll(/(["'`])(--[\w-]+)\1/g)) defined.add(m[2]);
      for (const m of code.matchAll(/\[(--[\w-]+):/g)) if (mask[m.index]) defined.add(m[1]);
      if (JSX_EXT.test(rel)) for (const t of jsxTags(code, mask)) if (t.name === "button" || t.name === "Button") for (const c of classTokens(attr(t, "className"))) onButtons.add(c);
    }
  }
  const parity = [];
  if (darkKeys.size && rootKeys.size) {
    for (const [k, v] of darkKeys) if (!lightDefs.has(k)) parity.push({ ...v, detail: `${k} is defined in the dark theme only` });
    for (const [k, v] of rootKeys) if (!darkKeys.has(k) && COLOR_VALUE.test(v.value) && !(cfg.sharedTokens || []).includes(k)) parity.push({ ...v, detail: `${k} has a light color and no dark value` });
  }
  const cssButtons = new Map();
  for (const [c, loc] of candidates) if (/btn|button|cta/i.test(c) || onButtons.has(c)) cssButtons.set(c, loc);
  return { tokens: { defined, parity }, cssButtons, cssBgPad: bgPad, cssVisual: visual };
}

// Upstream's copy of a customized ui file, saved by --save-stock as <stockDir>/<file>.stock.
const stockPath = (cfg, rel) => join(cfg.root, cfg.stockDir || DEFAULTS.stockDir, rel + ".stock");
function stockLinesFor(cfg, rel) {
  const p = stockPath(cfg, rel);
  if (!existsSync(p)) return null;
  return new Set(readFileSync(p, "utf8").split("\n").map(normLine).filter(Boolean));
}

function scan(cfg, only) {
  const findings = [];
  const report = (f) => findings.push(f);
  Object.assign(cfg, indexRepo(cfg));
  const files = only || listFiles(cfg);
  const drift = (rel, d, why) => { if (!cfg.off.has("rule/stock-edit")) report({ file: rel, line: 1, rule: "rule/stock-edit", detail: why }); };
  for (const rel of files) {
    if (/\.mdx?$/.test(rel)) continue;
    const d = cfg.drift.get(rel);
    if (d) {
      // every drift-list row carries a hash, so any edit to a primitive shows up as a reviewed drift-list change
      if (!d.hash) drift(rel, d, `${d.status || "unmarked"} row has no sha256 (${cfg.driftList}:${d.line}); run --hash-stock`);
      else if (existsRel(cfg, rel) && sha256(join(cfg.root, phys(cfg, rel))) !== d.hash) drift(rel, d, `${d.status || "unmarked"} file changed since its hash was recorded (${cfg.driftList}:${d.line})`);
      else if (d.status === "stock") continue; // an untouched stock file carries upstream's values, not drift
    }
    checkFile(cfg, rel, report, d && d.status === "customized" ? stockLinesFor(cfg, rel) : null);
  }
  // unregistered files directly in the ui folder
  if (cfg.uiDir && !cfg.off.has("rule/unregistered-ui")) {
    for (const e of uiEntries(cfg)) {
      const rel = `${posix(cfg.uiDir)}/${e}`;
      if (!/\.(tsx|jsx|ts|js|vue|svelte)$/.test(e) || /^index\.\w+$/.test(e) || /\.(test|spec|stories)\./.test(e)) continue;
      if (statSync(join(cfg.root, phys(cfg, rel))).isDirectory()) continue;
      if (only && !only.includes(rel)) continue;
      if (!cfg.registered.has(rel) && !cfg.drift.has(rel)) report({ file: rel, line: 1, rule: "rule/unregistered-ui", detail: `not in ${cfg.registry} and not in ${cfg.driftList}` });
    }
  }
  checkBans(cfg, files, report, !!only);
  // allowlist key: the literal, without whitespace runs or (file:line) pointers, so it survives edits elsewhere
  for (const f of findings) f.key = f.detail.replace(/\s*\([^()]*:\d+\)/g, "").replace(/\s+/g, " ");
  return findings;
}

// The person's bans (config bans), such as a middle dot or an em dash, in UI code with comments stripped and in
// the docs pages. A line holding "Don't:" or the ban's own id describes the ban, so it passes.
function checkBans(cfg, files, report, onlyGiven) {
  const bans = (cfg.bans || []).filter((b) => b && b.id && b.pattern && !cfg.off.has(b.id)).map((b) => ({ ...b, re: new RegExp(b.pattern, b.flags || "u") }));
  if (!bans.length) return;
  const docs = [];
  if (!onlyGiven) {
    const walk = (rel) => {
      const st = statSync(join(cfg.root, rel), { throwIfNoEntry: false });
      if (!st) return;
      if (st.isDirectory()) { for (const e of readdirSync(join(cfg.root, rel)).sort()) walk(`${rel}/${e}`); return; }
      if (/\.mdx?$/.test(rel) && !/(^|\/)spec-template\.md$/.test(rel)) docs.push(rel);
    };
    for (const d of cfg.banDocs || []) walk(posix(d).replace(/^\.\//, "").replace(/\/$/, ""));
  }
  for (const rel of [...new Set([...files, ...docs])]) {
    const md = /\.mdx?$/.test(rel);
    if (!md && !CODE_EXT.test(rel) && !CSS_EXT.test(rel)) continue;
    const text = md ? readFileSync(join(cfg.root, rel), "utf8") : lex(readRel(cfg, rel), CODE_EXT.test(rel)).code;
    text.split("\n").forEach((l, i) => {
      if (/Don['\u2019]t:/.test(l)) return;
      for (const b of bans) if (b.re.test(l) && !l.includes(b.id)) report({ file: rel, line: i + 1, rule: b.id, detail: `${b.why || "banned by the person"}: ${l.trim().slice(0, 60)}` });
    });
  }
}

// ---------- self-test ----------
const defaultFixtures = () => ((p) => existsSync(p) ? p : join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "check-system"))(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "check-system"));
function selfTest(dirArg) {
  const dir = dirArg ? resolve(dirArg) : defaultFixtures();
  if (!existsSync(dir)) { console.log(`self-test: FAIL, no fixtures at ${dir}`); return false; }
  let ok = true, n = 0;
  for (const c of readdirSync(dir).sort()) {
    const caseFile = join(dir, c, "case.json");
    if (!existsSync(caseFile)) continue;
    const spec = readJSON(caseFile);
    for (const kind of ["fail", "pass"]) {
      const root = join(dir, c, kind);
      if (!existsSync(root)) { console.log(`self-test: ${c}/${kind} missing`); ok = false; continue; }
      const cfg = loadConfig(root, null, { include: ["."], exclude: DEFAULTS.exclude, fixtures: true, ...(spec.config || {}), ...(spec[`${kind}Config`] || {}) });
      const found = scan(cfg);
      const count = (r) => found.filter((f) => f.rule === r).length;
      let good, msg;
      if (kind === "fail") {
        const exp = spec.expect || { [spec.rule]: 1 };
        const bad = Object.entries(exp).filter(([r, k]) => count(r) !== k);
        good = !bad.length;
        msg = Object.entries(exp).map(([r, k]) => `${r} ${count(r)}/${k}`).join(", ");
      } else {
        good = found.length === 0;
        msg = good ? "0 findings" : found.map((f) => `${f.file}:${f.line} ${f.rule} ${f.detail}`).join("; ");
      }
      n++;
      if (!good) ok = false;
      console.log(`self-test ${good ? "ok  " : "FAIL"} ${spec.rule} ${kind}: ${msg}`);
    }
  }
  console.log(`self-test: ${n} fixtures, ${ok ? "all as expected" : "FAILED"}`);
  return ok;
}

// ---------- CLI ----------
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
// The values after a flag, up to the next flag.
const listAfter = (f) => { const i = argv.indexOf(f); if (i < 0) return null; const out = []; for (let k = i + 1; k < argv.length && !argv[k].startsWith("--"); k++) out.push(argv[k]); return out; };
if (flag("--help") || flag("-h")) { console.log(HELP); process.exit(0); }
if (flag("--list-rules")) { for (const [id, [rule, fix]] of Object.entries(RULES)) console.log(`${id}\t${rule}. Fix: ${fix}.`); process.exit(0); }
if (flag("--list-blind-spots")) { BLIND.forEach((b) => console.log(b)); process.exit(0); }

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
const firstPath = [listAfter("--files"), listAfter("--rehash"), listAfter("--save-stock")].map((l) => l && l.find((a) => a !== val("--note"))).find(Boolean);
const root = repoRoot(val("--root"), firstPath);
// A path argument resolves against the current folder, and against the root when nothing is there.
const inRoot = (f) => { const a = resolve(f); return existsSync(a) || !existsSync(join(root, f)) ? a : join(root, f); };
if (flag("--self-test")) process.exit(selfTest(val("--fixtures")) ? 0 : 1);

if (flag("--init")) {
  const p = join(root, "scripts/check-system.config.json");
  if (existsSync(p)) { console.error(`check-system: ${p} exists. Edit it by hand.`); process.exit(2); }
  const cfg = loadConfig(root, null);
  // The default folders, plus a root styles/ folder and the ui folder when no default folder holds them.
  const include = [...DEFAULTS.include, "styles", cfg.uiDir && cfg.uiDir.split("/")[0]].filter((d, i, a) => d && a.indexOf(d) === i && existsSync(join(root, d)));
  const css = [];
  const walk = (rel) => { const abs = join(root, rel); const st = statSync(abs, { throwIfNoEntry: false }); if (!st || /node_modules|\.next|\.git/.test(rel)) return; if (st.isDirectory()) readdirSync(abs).forEach((e) => walk(rel ? `${rel}/${e}` : e)); else if (CSS_EXT.test(rel) && /(:root|@theme)[^{]*\{[^}]*--[\w-]+\s*:/.test(readFileSync(abs, "utf8"))) css.push(rel); };
  include.forEach(walk);
  // Never write an empty value for a key a rule reads: an empty {} or [] reads as a decision. Leave the key out,
  // so the default applies at every run, and say so.
  const out = { include };
  const said = [];
  const put = (k, v, why) => { const empty = v == null || (Array.isArray(v) ? !v.length : typeof v === "object" && !Object.keys(v).length); if (empty) said.push(`${k}: ${why}`); else out[k] = v; };
  put("tokenSources", css, "no CSS file with :root or @theme custom properties found. Left out, so raw values count everywhere until you list the token files");
  put("uiDir", cfg.uiDir, "no components/ui, src/components/ui, src/ui or ui folder. Left out; set it when the system's folder exists");
  Object.assign(out, { registry: DEFAULTS.registry, driftList: DEFAULTS.driftList, allowlist: DEFAULTS.allowlist });
  const exported = uiExports(cfg);
  put("nativeControls", cfg.nativeControls, `no Button, Input, Select, Textarea, Dialog, Checkbox or RadioGroup export found in ${cfg.uiDir || "a ui folder"}, its barrel or the registry. Left out, so each run derives it again once one exists`);
  put("buttonFile", cfg.buttonFile, "no button file in the ui folder. Left out; derived once one exists");
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(out, null, 2) + "\n");
  console.log(`wrote ${p}. Read it: tokenSources, uiDir and nativeControls are guesses.`);
  if (out.nativeControls) console.log(`nativeControls from the ui exports (${[...exported].filter((n) => /^[A-Z]/.test(n)).length} exported names): ${Object.entries(out.nativeControls).map(([k, v]) => `<${k}> -> ${v}`).join(", ")}`);
  for (const l of said) console.log(`left at the default, ${l}`);
  process.exit(0);
}

const cfg = loadConfig(root, val("--config"));

if (flag("--save-stock")) {
  const [file, upstream] = listAfter("--save-stock");
  if (!file || !upstream) { console.error("check-system: --save-stock <ui file> <upstream file or shadcn item JSON>"); process.exit(2); }
  const rel = posix(relative(root, inRoot(file)));
  const d = cfg.drift.get(rel);
  if (!d) { console.error(`check-system: ${rel} has no row in ${cfg.driftList}. Only a customized row uses a stock copy.`); process.exit(2); }
  if (!existsSync(upstream)) { console.error(`check-system: ${upstream} does not exist`); process.exit(2); }
  let text = readFileSync(upstream, "utf8");
  try {
    // shadcn's item JSON (`npx shadcn@latest view <item>`): one item, a list of items, or {items: [...]}
    const j = JSON.parse(text);
    const items = Array.isArray(j) ? j : j.items || [j];
    const files = items.flatMap((it) => it.files || []);
    const base = rel.split("/").pop();
    const f = files.find((x) => String(x.path || x.target || "").split("/").pop() === base) || (files.length === 1 ? files[0] : null);
    if (!f || typeof f.content !== "string") { console.error(`check-system: ${upstream} is JSON with no file named ${base}. Files: ${files.map((x) => x.path).join(", ") || "none"}`); process.exit(2); }
    text = f.content;
  } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
  const out = stockPath(cfg, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  const shared = new Set(text.split("\n").map(normLine).filter(Boolean));
  const mine = readFileSync(join(root, rel), "utf8").split("\n").map(normLine).filter(Boolean);
  console.log(`wrote ${posix(relative(root, out))}: ${mine.filter((l) => shared.has(l)).length} of ${mine.length} non-empty lines of ${rel} match upstream and are exempt${d.status === "customized" ? "" : `. The row's status is ${d.status || "empty"}, so the copy is not used until it is customized`}.`);
  process.exit(0);
}

if (flag("--hash-stock") || flag("--rehash")) {
  const p = join(root, cfg.driftList);
  if (!existsSync(p)) { console.error(`check-system: no drift list at ${p}`); process.exit(2); }
  // Files are every bare argument after --rehash except the value of --note, so either order works.
  const ri = argv.indexOf("--rehash"), ni = argv.indexOf("--note");
  const targets = ri >= 0 ? new Set(argv.slice(ri + 1).filter((a, k) => !a.startsWith("--") && ri + 1 + k !== ni + 1).map((f) => posix(relative(root, inRoot(f))))) : null;
  if (targets && !targets.size) { console.error("check-system: --rehash needs one or more files"); process.exit(2); }
  const note = (val("--note") || "").replace(/[\t\r\n]+/g, " ").trim();
  if (targets && (!note || note.startsWith("--"))) { console.error('check-system: --rehash needs --note "<what changed and why>". The note goes into each row of the drift list, so the reviewed edit is on record.'); process.exit(2); }
  let filled = 0;
  const seen = new Set();
  const out = readFileSync(p, "utf8").split("\n").map((l, i) => {
    const c = l.split("\t");
    const f = c[0]?.trim();
    if (!f || l.startsWith("#") || (i === 0 && /^file$/i.test(f)) || !existsSync(join(root, f))) return l;
    const want = targets ? targets.has(f) : !c[2]?.trim();
    if (!want) return l;
    seen.add(f);
    while (c.length < 4) c.push("");
    c[2] = sha256(join(root, f)); filled++;
    if (targets) c[3] = note;
    return c.join("\t");
  });
  writeFileSync(p, out.join("\n"));
  if (targets) {
    for (const f of targets) if (!seen.has(f)) console.error(`check-system: ${f} has no row in ${cfg.driftList}. Add one with its status and note first.`);
    console.log(`recorded ${filled} new hash(es) and the note in ${cfg.driftList}. Check each row's status, and commit it with the edit.`);
    process.exit(seen.size === targets.size ? 0 : 2);
  }
  console.log(`filled ${filled} empty sha256 cell(s) in ${cfg.driftList}. Existing hashes are never changed; use --rehash <file> after a reviewed edit.`);
  process.exit(0);
}

// The repo carries only the fixtures of rules the run added. The standard fixtures stay in the skill folder, so
// the default run self-tests only when a fixture folder sits beside this script (or --fixtures names one).
let testOk = true;
const fixturesAt = val("--fixtures") || (existsSync(defaultFixtures()) ? null : undefined);
if (!flag("--no-self-test") && !flag("--files") && !flag("--init-allowlist") && !flag("--shrink-allowlist") && !flag("--prune-allowlist") && fixturesAt !== undefined) testOk = selfTest(fixturesAt);

const onlyArgs = listAfter("--files");
const only = onlyArgs ? onlyArgs.map((f) => posix(relative(root, inRoot(f)))) : null;
const outside = (only || []).filter((f) => f.startsWith("../") || f === "..");
if (outside.length) { console.error(`check-system: ${outside.join(", ")} is outside the root ${root}. Pass --root <the app's folder>.`); process.exit(2); }
// No files is never a pass: run from the wrong folder, every count is 0.
if (!only && !listFiles(cfg).length) { console.error(`check-system: no source files under ${root} in ${cfg.include.join(", ")}. Run it from inside the app, or pass --root <the app's folder>.`); process.exit(2); }
const findings = scan(cfg, only);

// The allowlist is keyed by file, rule and literal value: {"app/x.tsx": {"rule/raw-value": {"#166534": 2}}}.
// Swapping an allowed value for a new one fails, because the new literal has no entry.
const byKey = new Map();
for (const f of findings) { const k = `${f.file}\t${f.rule}\t${f.key}`; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(f); }
const alPath = join(root, cfg.allowlist);

if (flag("--prune-allowlist")) {
  if (!existsSync(alPath)) { console.error(`check-system: no allowlist at ${cfg.allowlist}`); process.exit(2); }
  const al = readJSON(alPath);
  const live = new Set([...byKey.keys()]);
  const liveRule = new Set([...byKey.keys()].map((k) => k.split("\t").slice(0, 2).join("\t")));
  const gone = [];
  for (const [file, rules] of Object.entries(al)) {
    for (const [rule, v] of Object.entries(rules)) {
      if (typeof v === "number") { if (!liveRule.has(`${file}\t${rule}`)) { gone.push(`${file} ${rule} (${v})`); delete rules[rule]; } continue; }
      for (const [key, n] of Object.entries(v)) if (!live.has(`${file}\t${rule}\t${key}`)) { gone.push(`${file} ${rule} "${key}" (${n})`); delete v[key]; }
      if (!Object.keys(v).length) delete rules[rule];
    }
    if (!Object.keys(rules).length) delete al[file];
  }
  writeFileSync(alPath, JSON.stringify(al, null, 2) + "\n");
  gone.forEach((g) => console.log(`pruned\t${g}`));
  console.log(`pruned ${gone.length} stale entr${gone.length === 1 ? "y" : "ies"} from ${cfg.allowlist}. Commit it with the close.`);
  process.exit(0);
}

if (flag("--init-allowlist") || flag("--shrink-allowlist")) {
  const exists = existsSync(alPath);
  if (flag("--init-allowlist") && exists) { console.error(`check-system: ${cfg.allowlist} exists. Use --shrink-allowlist.`); process.exit(2); }
  const old = exists ? readJSON(alPath) : null;
  const al = {};
  for (const [k, list] of [...byKey].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const [file, rule, key] = k.split("\t");
    const prev = old?.[file]?.[rule];
    const n = !old ? list.length : typeof prev === "number" ? list.length : Math.min(list.length, prev?.[key] ?? 0);
    if (n) ((al[file] ||= {})[rule] ||= {})[key] = n;
  }
  mkdirSync(dirname(alPath), { recursive: true });
  writeFileSync(alPath, JSON.stringify(al, null, 2) + "\n");
  let total = 0;
  for (const r of Object.values(al)) for (const v of Object.values(r)) for (const n of Object.values(v)) total += n;
  console.log(`wrote ${cfg.allowlist}: ${total} allowed finding(s) in ${Object.keys(al).length} file(s), keyed by literal value`);
  process.exit(0);
}

let allow = {};
if (!only) {
  if (existsSync(alPath)) allow = readJSON(alPath);
  else if (findings.length && !flag("--json")) console.log(`note: no allowlist at ${cfg.allowlist}. Every finding fails. Create one once with --init-allowlist.`);
}

let failed = 0, allowed = 0, legacy = 0;
const shrink = [];
const printed = [];
const legacyLeft = new Map(); // old per-file counts, spent across literals
for (const [k, list] of byKey) {
  const [file, rule, key] = k.split("\t");
  const entry = allow[file]?.[rule];
  let cap;
  if (typeof entry === "number") { legacy++; const left = legacyLeft.has(`${file}\t${rule}`) ? legacyLeft.get(`${file}\t${rule}`) : entry; cap = Math.min(left, list.length); legacyLeft.set(`${file}\t${rule}`, left - cap); }
  else cap = entry?.[key] ?? 0;
  if (list.length > cap) {
    failed += list.length - cap;
    const why = typeof entry === "number" ? ` (legacy allowlist count for this file is used up)` : cap ? ` (allowlist holds ${cap} of "${key}" here, found ${list.length})` : entry ? ` ("${key}" is not in the allowlist for this file)` : "";
    for (const f of list) printed.push(`${f.file}:${f.line} ${f.rule} ${f.detail}. Fix: ${RULES[f.rule][1]}${why}`);
  } else { allowed += list.length; if (list.length < cap) shrink.push(`${file} ${rule} "${key}" ${cap} -> ${list.length}`); }
}
for (const [file, rules] of Object.entries(allow)) for (const [rule, v] of Object.entries(rules)) {
  if (typeof v === "number") continue;
  for (const [key, cap] of Object.entries(v)) if (!byKey.has(`${file}\t${rule}\t${key}`) && cap > 0) shrink.push(`${file} ${rule} "${key}" ${cap} -> 0`);
}

// What the allowlist still holds, by file and rule: the "left" numbers a final message quotes.
const left = new Map();
for (const [k, list] of byKey) {
  const [file, rule, key] = k.split("\t");
  const entry = allow[file]?.[rule];
  const cap = typeof entry === "number" ? entry : entry?.[key] ?? 0;
  const n = Math.min(cap, list.length);
  if (n) left.set(`${file}\t${rule}`, (left.get(`${file}\t${rule}`) || 0) + n);
}

if (flag("--json")) console.log(JSON.stringify({ findings, failed, allowed, shrink, left: [...left].map(([k, n]) => { const [file, rule] = k.split("\t"); return { file, rule, count: n }; }), stockExempt: cfg.stockExempt || 0, notes: cfg.notes, blindSpots: BLIND }, null, 2));
else {
  printed.forEach((l) => console.log(l));
  if (shrink.length) console.log(`allowlist can shrink (run --shrink-allowlist):\n  ${shrink.join("\n  ")}`);
  if (legacy) console.log(`note: ${cfg.allowlist} still holds per-file counts. Delete it and run --init-allowlist to key it by literal value.`);
  for (const n of cfg.notes) console.log(`note: ${n}`);
  if (cfg.stockExempt) console.log(`note: ${cfg.stockExempt} finding(s) sit on lines identical to upstream's copy in ${cfg.stockDir}/ and are exempt`);
  if (flag("--left")) {
    const files = new Set([...left.keys()].map((k) => k.split("\t")[0]));
    const byRule = new Map();
    for (const [k, n] of left) { const r = k.split("\t")[1]; byRule.set(r, (byRule.get(r) || 0) + n); }
    console.log(`left: ${allowed} allowlisted finding(s) in ${files.size} file(s)${byRule.size ? `: ${[...byRule].sort((x, y) => y[1] - x[1]).map(([r, n]) => `${r} ${n}`).join(", ")}` : ""}`);
    for (const [k, n] of [...left].sort(([x], [y]) => (x < y ? -1 : 1))) console.log(`left\t${k}\t${n}`);
  }
  console.log(`check-system: ${only ? only.length : listFiles(cfg).length} file(s) under ${root}, ${failed} failing, ${allowed} allowlisted${testOk ? "" : ", self-test FAILED"}`);
  console.log(`The check cannot see:\n${BLIND.map((b) => `  - ${b}`).join("\n")}`);
}
// exitCode, not exit(): a large --json report on a pipe is written asynchronously, and exit() would cut it at 64 KB.
process.exitCode = failed || !testOk ? 1 : 0;
