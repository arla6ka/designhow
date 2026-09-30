// optical.js: measure where each mark's ink sits against its label or box, for trap/icon-optical-size and
// trap/icon-optical-align (references/browser.md, Measuring optical alignment).
// Runs in the page, not in Node:
//   agent-browser --session ds-1 eval --stdin < <skills>/build-design-system/scripts/optical.js
//   await page.evaluate(readFileSync("<skills>/build-design-system/scripts/optical.js", "utf8"))
// Set options before running it, all optional:
//   window.__dsOptical = { ref: "cap" | "x-height" | "mid", scope: "main", tolerance: 0.5, limit: 200 }
// ref is the person's decided reference for marks beside text (a numbered decision, traps.md). With no ref, every
// beside-text row is returned with all three distances so the person can choose from crops.
// Contexts, one per row:
//   beside-text  an icon, dot or image beside a label in the same control. vsCap, vsX and vsMid are the ink center
//                minus the label's first-line cap-height center, x-height center and the midpoint between them (px,
//                positive is low). tall is ink height minus cap height (trap/icon-optical-size)
//   form-box     a checkbox, radio or switch box beside its label: the box against the label's first line, as above
//   alone        a mark with no text in its host, or the check inside a form box: vsBox and hBox are the ink center
//                minus the host box center (px, positive is low or right)
//   corner       a positioned mark in a corner of its container: its ink inset from the two nearest edges against the
//                inset of the first line of text in the opposite corner (cap top and text edge)
//   field-slot   a control inside a field frame: its insets from the frame's top, bottom and near side, which match
// glyph is the ink center minus the mark's own box center: a glyph drawn off center in its viewBox. Each row carries
// clip (page coordinates for a zoomed crop) and, beside text, the three reference lines' page y.
// Returns { page, ref, tolerance, summary, rows, coverage }. coverage is last and names what was not measured.
if (typeof window === "undefined") {
  // Run from Node by mistake, or with --help: print the header above and stop.
  const lines = require("fs").readFileSync(__filename, "utf8").split("\n");
  console.log(lines.slice(0, lines.findIndex((l) => !l.startsWith("//"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(process.argv.includes("--help") ? 0 : 1);
}
(() => {
  const o = Object.assign({ ref: null, scope: null, tolerance: 0.5, limit: 200 }, window.__dsOptical || {});
  const root = (o.scope && document.querySelector(o.scope)) || document.querySelector("main,[role=main]") || document.body;
  const tol = o.tolerance, r2 = (v) => +v.toFixed(2);
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0.05; };
  const px = (v) => parseFloat(v) || 0;
  const desc = (el) => { const n = el.getAttribute && (el.getAttribute("aria-label") || el.getAttribute("data-icon") || el.getAttribute("alt")); return el.tagName.toLowerCase() + (n ? ` "${n.slice(0, 24)}"` : el.classList && el.classList[0] ? "." + el.classList[0] : ""); };
  const notes = { strokes: 0, pseudo: 0, fonts: 0, nativeCheck: 0, img: 0, hidden: 0 };

  // The ink box of an SVG: the union of every drawn shape's box through its screen transform, plus half the stroke.
  const SHAPES = "path,circle,rect,ellipse,line,polyline,polygon,use,text";
  const inkOf = (svg) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const sh of svg.querySelectorAll(SHAPES)) {
      if (sh.closest("defs,clipPath,mask,symbol,marker,pattern")) continue;
      const cs = getComputedStyle(sh);
      if (cs.display === "none" || cs.visibility === "hidden" || px(cs.opacity) === 0) continue;
      const stroked = cs.stroke && cs.stroke !== "none" && px(cs.strokeWidth) > 0;
      if (cs.fill === "none" && !stroked) continue;
      let bb; try { bb = sh.getBBox(); } catch (e) { continue; }
      const m = sh.getScreenCTM(); if (!m || (!bb.width && !bb.height && !stroked)) continue;
      const pad = stroked ? (px(cs.strokeWidth) * Math.hypot(m.a, m.b)) / 2 : 0;
      if (stroked) notes.strokes++;
      for (const [x, y] of [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]) {
        const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f;
        x0 = Math.min(x0, X - pad); y0 = Math.min(y0, Y - pad); x1 = Math.max(x1, X + pad); y1 = Math.max(y1, Y + pad);
      }
    }
    if (x0 === Infinity) return null;
    return { left: x0, top: y0, right: x1, bottom: y1, width: x1 - x0, height: y1 - y0 };
  };

  // The label's first line: its box, and the cap-height, x-height and midpoint centers from the font's own metrics.
  const ctx = document.createElement("canvas").getContext("2d");
  const firstLine = (node) => {
    const r = document.createRange(); r.selectNodeContents(node);
    const t = [...r.getClientRects()].find((q) => q.width > 0 && q.height > 0); if (!t) return null;
    const cs = getComputedStyle(node.nodeType === 3 ? node.parentElement : node);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const H = ctx.measureText("H"), X = ctx.measureText("x");
    const base = t.top + (t.height - H.fontBoundingBoxAscent - H.fontBoundingBoxDescent) / 2 + H.fontBoundingBoxAscent;
    const cap = H.actualBoundingBoxAscent, xh = X.actualBoundingBoxAscent;
    return { t, cap, xh, capTop: base - cap, capC: base - cap / 2, xC: base - xh / 2, mid: base - (cap + xh) / 4, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim() };
  };
  const textIn = (host, skip) => {
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim() || (skip && skip.contains(n)) || !visible(n.parentElement)) continue;
      if (n.parentElement.closest("svg,[aria-hidden=true] svg")) continue;
      return n;
    }
    return null;
  };
  const clipOf = (...rs) => { const x0 = Math.min(...rs.map((r) => r.left)) - 8, y0 = Math.min(...rs.map((r) => r.top)) - 8, x1 = Math.max(...rs.map((r) => r.right)) + 8, y1 = Math.max(...rs.map((r) => r.bottom)) + 8; return { x: Math.round(x0 + scrollX), y: Math.round(y0 + scrollY), w: Math.round(x1 - x0), h: Math.round(y1 - y0) }; };
  const beside = (row, ink, line, sized = true) => {
    const c = ink.top + ink.height / 2;
    Object.assign(row, { font: line.family, cap: r2(line.cap), xh: r2(line.xh), vsCap: r2(c - line.capC), vsX: r2(c - line.xC), vsMid: r2(c - line.mid), tall: r2(ink.height - line.cap),
      lines: { cap: r2(line.capC + scrollY), "x-height": r2(line.xC + scrollY), mid: r2(line.mid + scrollY) } });
    const key = { cap: "vsCap", "x-height": "vsX", mid: "vsMid" }[o.ref];
    row.off = key ? Math.abs(row[key]) > tol : null;
    if (sized && row.tall > 2) row.off = true;
    if (!sized) delete row.tall;
  };

  const rows = [], done = new Set();
  const HOSTS = "button,a,label,li,summary,th,td,[role=option],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=tab],[role=button],[role=link]";
  const FORM = "input[type=checkbox],input[type=radio],[role=checkbox],[role=radio],[role=switch]";
  const FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea,select,[contenteditable=true],[role=combobox],[role=textbox]";
  const framed = (el) => { const s = getComputedStyle(el); return ["Top", "Right", "Bottom", "Left"].some((k) => s["border" + k + "Style"] !== "none" && px(s["border" + k + "Width"]) > 0) || s.boxShadow !== "none"; };

  // Marks: top-level SVGs, small images, and dots (small empty boxes with a fill or border).
  const marks = [];
  for (const svg of root.querySelectorAll("svg")) if (!svg.parentElement.closest("svg")) marks.push([svg, "svg"]);
  for (const img of root.querySelectorAll("img,[role=img]:not(svg)")) { const r = img.getBoundingClientRect(); if (r.width <= 48 && r.height <= 48) { marks.push([img, "img"]); if (img.tagName === "IMG") notes.img++; } }
  for (const el of root.querySelectorAll("span,i,div,b")) {
    if (el.children.length || el.textContent.trim()) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.width > 24 || r.height > 24) continue;
    const s = getComputedStyle(el); if (!(px(s.borderTopWidth) > 0 || (s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent"))) continue;
    marks.push([el, "dot"]);
  }
  for (const el of root.querySelectorAll("*")) for (const p of ["::before", "::after"]) {
    const s = getComputedStyle(el, p);
    if (s.content && s.content !== "none" && s.content !== "normal" && (s.backgroundImage !== "none" || (s.maskImage && s.maskImage !== "none") || !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor))) notes.pseudo++;
  }

  for (const [mark, kind] of marks) {
    if (!visible(mark)) { notes.hidden++; continue; }
    const ink = kind === "svg" ? inkOf(mark) : mark.getBoundingClientRect(); if (!ink) continue;
    const own = mark.getBoundingClientRect();
    const row = { page: location.pathname, mark: desc(mark), kind, icon: r2(ink.height), glyph: [r2(ink.left + ink.width / 2 - (own.left + own.width / 2)), r2(ink.top + ink.height / 2 - (own.top + own.height / 2))] };
    const box = mark.parentElement.closest(FORM);
    // The check inside a form box is alone in that box.
    if (box) {
      const b = box.getBoundingClientRect();
      rows.push(Object.assign(row, { ctx: "alone", host: desc(box), vsBox: r2(ink.top + ink.height / 2 - (b.top + b.height / 2)), hBox: r2(ink.left + ink.width / 2 - (b.left + b.width / 2)), clip: clipOf(b) }));
      row.off = Math.max(Math.abs(row.vsBox), Math.abs(row.hBox)) > tol;
      continue;
    }
    // A control inside a field frame: equal insets from the frame's top, bottom and near side.
    const control = mark.closest("button,[role=button]") || mark;
    let frame = null;
    for (let p = control.parentElement, k = 0; p && k < 4; p = p.parentElement, k++) if ([...p.querySelectorAll(FIELD)].some((f) => !control.contains(f)) && framed(p)) { frame = p; break; }
    if (frame && !done.has(control)) {
      done.add(control);
      const f = frame.getBoundingClientRect(), fs = getComputedStyle(frame), c = control.getBoundingClientRect();
      const right = c.left + c.width / 2 > f.left + f.width / 2;
      const ins = { top: r2(c.top - f.top - px(fs.borderTopWidth)), bottom: r2(f.bottom - px(fs.borderBottomWidth) - c.bottom), side: r2(right ? f.right - px(fs.borderRightWidth) - c.right : c.left - f.left - px(fs.borderLeftWidth)) };
      const v = Object.values(ins);
      rows.push({ page: location.pathname, mark: desc(control), kind: control === mark ? kind : "control", ctx: "field-slot", host: desc(frame), insets: ins, spread: r2(Math.max(...v) - Math.min(...v)), off: Math.max(...v) - Math.min(...v) > tol, clip: clipOf(f) });
    }
    // A positioned mark in a corner of its container mirrors the text in the opposite corner.
    let pos = null;
    for (let p = mark, k = 0; p && k < 3; p = p.parentElement, k++) if (/absolute|fixed/.test(getComputedStyle(p).position)) { pos = p; break; }
    const cont = pos && (pos.offsetParent || pos.parentElement);
    if (pos && cont && !frame) {
      const c = cont.getBoundingClientRect(), cs = getComputedStyle(cont);
      const onRight = ink.left + ink.width / 2 > c.left + c.width / 2, onTop = ink.top + ink.height / 2 < c.top + c.height / 2;
      const mx = onRight ? c.right - px(cs.borderRightWidth) - ink.right : ink.left - c.left - px(cs.borderLeftWidth);
      const my = onTop ? ink.top - c.top - px(cs.borderTopWidth) : c.bottom - px(cs.borderBottomWidth) - ink.bottom;
      let text = null, line = null;
      const w = document.createTreeWalker(cont, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim() || pos.contains(n) || !visible(n.parentElement)) continue;
        const l = firstLine(n); if (!l) continue;
        const cx = l.t.left + l.t.width / 2, cy = l.t.top + l.t.height / 2;
        if ((cx > c.left + c.width / 2) !== onRight && (cy < c.top + c.height / 2) === onTop) { text = n; line = l; break; }
      }
      if (text) {
        const tx = onRight ? line.t.left - c.left - px(cs.borderLeftWidth) : c.right - px(cs.borderRightWidth) - line.t.right;
        const ty = onTop ? line.capTop - c.top - px(cs.borderTopWidth) : c.bottom - px(cs.borderBottomWidth) - (line.capTop + line.cap);
        rows.push(Object.assign(row, { ctx: "corner", host: desc(cont), text: text.textContent.trim().slice(0, 24), corner: `${onTop ? "top" : "bottom"} ${onRight ? "right" : "left"}`, insetMark: [r2(mx), r2(my)], insetText: [r2(tx), r2(ty)], dx: r2(mx - tx), dy: r2(my - ty), off: Math.max(Math.abs(mx - tx), Math.abs(my - ty)) > tol, clip: clipOf(ink, line.t) }));
        continue;
      }
    }
    // Beside text, or alone in its host.
    const host = mark.closest(HOSTS) || mark.parentElement;
    const text = textIn(host, mark);
    if (text) {
      const line = firstLine(text); if (!line) continue;
      rows.push(row); beside(Object.assign(row, { ctx: "beside-text", host: desc(host), text: text.textContent.trim().slice(0, 24), clip: clipOf(ink, line.t) }), ink, line);
    } else {
      const b = host.getBoundingClientRect();
      rows.push(Object.assign(row, { ctx: "alone", host: desc(host), vsBox: r2(ink.top + ink.height / 2 - (b.top + b.height / 2)), hBox: r2(ink.left + ink.width / 2 - (b.left + b.width / 2)), clip: clipOf(b) }));
      row.off = Math.max(Math.abs(row.vsBox), Math.abs(row.hBox)) > tol;
    }
  }
  // Form boxes against their label's first line.
  for (const el of root.querySelectorAll(FORM)) {
    if (!visible(el)) { notes.hidden++; continue; }
    if (el.tagName === "INPUT") notes.nativeCheck++;
    const lab = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby").split(/\s+/)[0])) || el.nextElementSibling;
    const text = lab && textIn(lab, el); if (!text) continue;
    const line = firstLine(text); if (!line) continue;
    const b = el.getBoundingClientRect();
    const row = { page: location.pathname, mark: desc(el), kind: "box", ctx: "form-box", host: desc(lab), text: text.textContent.trim().slice(0, 24), icon: r2(b.height), clip: clipOf(b, line.t) };
    beside(row, b, line, false);
    rows.push(row);
  }
  for (const n of root.querySelectorAll("i,span")) { if (!n.children.length && n.textContent.trim().length === 1 && /icon|material|fa-|glyph/i.test(n.className)) notes.fonts++; }

  const within = (list, k) => list.filter((r) => Math.abs(r[k]) <= tol).length;
  const summary = {};
  for (const c of ["beside-text", "form-box", "alone", "corner", "field-slot"]) {
    const list = rows.filter((r) => r.ctx === c); if (!list.length) continue;
    summary[c] = c === "beside-text" || c === "form-box" ? { n: list.length, withinCap: within(list, "vsCap"), withinXHeight: within(list, "vsX"), withinMid: within(list, "vsMid"), ...(c === "beside-text" ? { tooTall: list.filter((r) => r.tall > 2).length } : {}) }
      : { n: list.length, within: list.filter((r) => !r.off).length };
  }
  const keep = rows.filter((r) => r.off !== false);
  const out = keep.slice(0, o.limit);
  const not = ["pseudo-element marks (::before, ::after)" + (notes.pseudo ? ` (${notes.pseudo} seen)` : ""), "icon-font glyphs and emoji" + (notes.fonts ? ` (${notes.fonts} seen)` : ""), "background-image and canvas marks",
    "native checkbox and radio check marks" + (notes.nativeCheck ? ` (${notes.nativeCheck} native boxes measured as boxes only)` : ""), "image ink (an image counts as its box" + (notes.img ? `, ${notes.img} images` : "") + ")",
    "horizontal centering beside text", "stroke caps and joins (half the stroke width is added" + (notes.strokes ? ` on ${notes.strokes} stroked shapes` : "") + ")", `hidden marks (${notes.hidden})`, "marks outside " + (o.scope || (root === document.body ? "body" : "main"))];
  const coverage = `Coverage: ${rows.length} rows measured (${Object.entries(summary).map(([k, v]) => `${k} ${v.n}`).join(", ") || "none"}), ${out.length} returned${keep.length > out.length ? `, ${keep.length - out.length} over the limit of ${o.limit} dropped` : ""}, reference ${o.ref || "not decided (all beside-text rows returned)"}, tolerance ${tol}px. Not measured: ${not.join(", ")}`;
  return { page: location.pathname, ref: o.ref, tolerance: tol, summary, rows: out, coverage };
})();
