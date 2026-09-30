#!/usr/bin/env node
// oklch.mjs: convert sRGB colors to OKLCH, and measure the OK distance (deltaE OK, x100 scale) between two colors.
// Node 18+, no dependencies. Run `node scripts/oklch.mjs --help`.

const HELP = `oklch.mjs: sRGB to OKLCH, and deltaE OK between two colors

Usage:
  node scripts/oklch.mjs <color>...          one line per color: input, oklch(L C H), L in 0 to 1
  node scripts/oklch.mjs --delta <a> <b>     the deltaE OK between two colors, 0 to about 100
  node scripts/oklch.mjs --self-test         known values

A color is hex (#rgb, #rgba, #rrggbb, #rrggbbaa) or rgb()/rgba() with 0 to 255 or
percent channels. Quote rgb() in the shell. Alpha is ignored. Hue prints as "none"
when chroma is under 0.0001, as it is for grays. deltaE OK is the straight-line
distance in OKLab times 100, the scale token-mapping's rules use: under 0.5 counts
as identical, the color tolerance is 2, and a near pair is under 5.

Exit 0 on success, 1 when a self-test value is off, 2 on bad input.`;

export function parse(input) {
  const s = String(input).trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = s.match(/^rgba?\(\s*([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3);
    if (parts.length === 3) {
      const rgb = parts.map((p) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p)));
      if (rgb.every((v) => Number.isFinite(v) && v >= 0 && v <= 255)) return rgb;
    }
  }
  return null;
}

const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };

export function toOklab(rgb) {
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function toOklch(rgb) {
  const [L, a, b] = toOklab(rgb);
  const C = Math.hypot(a, b);
  const H = C < 0.0001 ? null : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return [L, C, H];
}

export function deltaEOK(x, y) {
  const [p, q] = [toOklab(x), toOklab(y)];
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

export const format = ([L, C, H]) => `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H === null ? "none" : H.toFixed(2)})`;

if (process.argv[1] && (await import("node:path")).resolve(process.argv[1]) === (await import("node:url")).fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const bad = (msg) => { console.error(`oklch: ${msg}\n\n${HELP}`); process.exit(2); };
  if (!argv.length) bad("give a color, --delta <a> <b>, or --self-test");
  if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
  if (argv.includes("--self-test")) {
    // [color, L, C, H] with H null for grays, and [a, b, deltaE OK on the x100 scale].
    const known = [
      ["#ffffff", 1, 0, null],
      ["#000000", 0, 0, null],
      ["#808080", 0.5999, 0, null],
      ["#ff0000", 0.628, 0.2577, 29.23],
      ["#00ff00", 0.8664, 0.2948, 142.5],
      ["#0000ff", 0.452, 0.3132, 264.05],
      ["rgb(255, 0, 0)", 0.628, 0.2577, 29.23],
    ];
    const deltas = [["#ffffff", "#000000", 100], ["#6b7280", "#6b7280", 0], ["#6b7280", "#737373", 2.38]];
    let ok = true;
    for (const [c, L, C, H] of known) {
      const [l, ch, h] = toOklch(parse(c));
      const good = Math.abs(l - L) < 0.001 && Math.abs(ch - C) < 0.001 && (H === null ? h === null : Math.abs(h - H) < 0.05);
      if (!good) ok = false;
      console.log(`self-test ${good ? "ok  " : "FAIL"} ${c}: ${format([l, ch, h])}, want L ${L} C ${C} H ${H ?? "none"}`);
    }
    for (const [a, b, want] of deltas) {
      const d = deltaEOK(parse(a), parse(b));
      const good = Math.abs(d - want) < 0.01;
      if (!good) ok = false;
      console.log(`self-test ${good ? "ok  " : "FAIL"} deltaE OK x100 ${a} ${b}: ${d.toFixed(2)}, want ${want}`);
    }
    console.log(`self-test: ${known.length + deltas.length} values, ${ok ? "all as expected" : "FAILED"}`);
    process.exit(ok ? 0 : 1);
  }
  if (argv[0] === "--delta") {
    if (argv.length !== 3) bad("--delta takes exactly two colors");
    const [a, b] = argv.slice(1).map((c) => parse(c) || bad(`cannot read the color ${c}`));
    console.log(`${argv[1]}\t${argv[2]}\tdeltaE OK x100 ${deltaEOK(a, b).toFixed(2)}`);
    console.log("Coverage: 2 colors as sRGB. Not read: alpha, and any color space other than sRGB");
    process.exit(0);
  }
  const unknown = argv.find((a) => a.startsWith("--"));
  if (unknown) bad(`unknown ${unknown}`);
  for (const c of argv) {
    const rgb = parse(c);
    if (!rgb) bad(`cannot read the color ${c}`);
    console.log(`${c}\t${format(toOklch(rgb))}`);
  }
  console.log(`Coverage: ${argv.length} color(s) as sRGB. Not read: alpha, and any color space other than sRGB`);
}
