#!/usr/bin/env node
// pixdiff.mjs: compare two saved screenshots, or two folders of same-named PNGs.
//
//   node pixdiff.mjs /abs/before.png /abs/after.png
//   node pixdiff.mjs /abs/baseline/ /abs/after/ [--max <percent>] [--tolerance <n>] [--out <dir>] [--no-image] [--root <dir>]
//
// Prints one line per file: path, size match, changed-pixel percentage, the bounding
// box of the changed pixels (x,y wxh in image pixels), the largest per-channel delta
// anywhere in the pair, the tolerance used, and the diff image it wrote.
// A pixel counts as changed when any channel (R, G, B or A) differs by more than
// --tolerance, 0 to 255, default 0: any difference counts. The max delta prints even
// when it is under the tolerance, so a small shift is never silent. A value-identical
// token swap is proven at the default tolerance 0, never with --tolerance: #6b7280 to
// #737373 moves the channels by 8, 1 and 13 and must show as a change.
// The diff image is the after capture faded, with changed pixels in red and the box
// outlined. It goes beside the after file as <name>.diff.png, or into --out.
// Exits 1 when any pair differs in size, is missing, or changes more pixels than
// --max (percent, default 0). agent-browser's `diff screenshot` compares against
// the live page, so use this to compare two files.
//
// Needs Playwright (`playwright` or `playwright-core`) and a Chromium. find-chromium.mjs
// finds both: PW_CHROMIUM, Playwright's own download, any other Playwright download in
// the cache, then the system Chrome. Playwright is looked for first in --root, which defaults to the git root of the
// first image path, else of the current folder. Relative image paths resolve against the current folder.
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { launchChromium, repoRoot } from "./find-chromium.mjs";

const USAGE = "usage: node pixdiff.mjs <before.png|dir> <after.png|dir> [--max <percent>] [--tolerance <n>] [--out <dir>] [--no-image] [--root <dir>]\n--tolerance is the per-channel delta, 0 to 255, a pixel may move and still count as unchanged. Default 0. Keep 0 to prove a value-identical swap\n--root is where Playwright is looked for first. Default: the git root of the first path, else of the current folder";
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log(USAGE); process.exit(0); }
if (args.some((a) => a.startsWith("-") && !["--max", "--out", "--no-image", "--root", "--tolerance"].includes(a))) {
  console.error(USAGE);
  process.exit(2);
}
const take = (f) => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const maxArg = take("--max");
const max = maxArg === undefined ? 0 : Number(maxArg);
const outDir = take("--out");
const rootArg = take("--root");
const tolArg = take("--tolerance");
const tolerance = tolArg === undefined ? 0 : Number(tolArg);
if (!Number.isInteger(tolerance) || tolerance < 0 || tolerance > 255) { console.error(`pixdiff: --tolerance takes a whole number from 0 to 255, not ${tolArg}\n${USAGE}`); process.exit(2); }
const noImage = args.includes("--no-image");
if (noImage) args.splice(args.indexOf("--no-image"), 1);
const [A, B] = args.map((p) => resolve(p));
if (!A || !B || Number.isNaN(max)) {
  console.error(USAGE);
  process.exit(2);
}
for (const p of [A, B]) {
  if (!existsSync(p)) { console.error(`pixdiff: ${p} does not exist (relative paths resolve against ${process.cwd()})`); process.exit(2); }
}

const launched = await launchChromium({}, { root: repoRoot(rootArg, A) });
if (launched.error) { console.error(`pixdiff: ${launched.error}`); process.exit(2); }
const browser = launched.browser;
console.error(`pixdiff: using ${launched.from}, ${launched.how}`);

const walk = (d) => readdirSync(d).flatMap((e) => {
  const p = join(d, e);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith(".png") && !p.includes(".diff.") ? [p] : [];
});
const dirMode = statSync(A).isDirectory();
const pairs = dirMode
  ? walk(A).sort().map((fa) => [relative(A, fa), fa, join(B, relative(A, fa))])
  : [[relative(process.cwd(), B), A, B]];

const page = await browser.newPage();
let failed = 0;
for (const [name, fa, fb] of pairs) {
  if (!existsSync(fb)) { console.log(`${name}\tmissing in ${B}\ttolerance ${tolerance}`); failed++; continue; }
  const r = await page.evaluate(async ([a, b, wantImage, tol]) => {
    const load = (s) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = "data:image/png;base64," + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}`, pct: null };
    const w = ia.width, h = ia.height;
    const px = (i) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(i, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = px(ia), db = px(ib);
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1, maxDelta = 0;
    const changed = new Uint8Array(w * h);
    for (let k = 0, p = 0; k < da.length; k += 4, p++) {
      const d = Math.max(Math.abs(da[k] - db[k]), Math.abs(da[k + 1] - db[k + 1]), Math.abs(da[k + 2] - db[k + 2]), Math.abs(da[k + 3] - db[k + 3]));
      if (d > maxDelta) maxDelta = d;
      if (d > tol) {
        n++; changed[p] = 1;
        const x = p % w, y = (p / w) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    // A changed pixel never rounds down to 0%: the percentage keeps enough digits to show it.
    const raw = 100 * n / (w * h);
    const pct = n && +raw.toFixed(3) === 0 ? +raw.toPrecision(2) : +raw.toFixed(3);
    const out = { size: "same size", pct, bbox: n ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null, maxDelta };
    if (n && wantImage) {
      // the after capture faded to 25%, changed pixels in red, the box outlined
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.globalAlpha = 0.25; x.drawImage(ib, 0, 0); x.globalAlpha = 1;
      const img = x.getImageData(0, 0, w, h);
      for (let p = 0; p < changed.length; p++) if (changed[p]) { img.data[p * 4] = 255; img.data[p * 4 + 1] = 0; img.data[p * 4 + 2] = 0; img.data[p * 4 + 3] = 255; }
      x.putImageData(img, 0, 0);
      x.strokeStyle = "#f0f"; x.lineWidth = 2; x.strokeRect(x0 - 2, y0 - 2, x1 - x0 + 5, y1 - y0 + 5);
      out.png = c.toDataURL("image/png").split(",")[1];
    }
    return out;
  }, [readFileSync(fa).toString("base64"), readFileSync(fb).toString("base64"), !noImage, tolerance]);
  if (r.pct === null || r.pct > max) failed++;
  let img = "";
  if (r.png) {
    const dest = outDir ? join(resolve(outDir), (dirMode ? name : basename(fb)).replace(/\.png$/, ".diff.png")) : fb.replace(/\.png$/, ".diff.png");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(r.png, "base64"));
    img = dest;
  }
  const box = r.bbox ? `bbox ${r.bbox[0]},${r.bbox[1]} ${r.bbox[2]}x${r.bbox[3]}` : r.pct === null ? "-" : "no change";
  const delta = r.pct === null ? "max delta -" : `max delta ${r.maxDelta}`;
  console.log(`${name}\t${r.size}\t${r.pct === null ? "-" : r.pct + "%"}\t${box}\t${delta}\ttolerance ${tolerance}${img ? `\t${relative(process.cwd(), img) || basename(img)}` : ""}`);
}
await browser.close();
console.log(`${pairs.length} compared, ${failed} over ${max}%, tolerance ${tolerance}`);
process.exit(failed ? 1 : 0);
