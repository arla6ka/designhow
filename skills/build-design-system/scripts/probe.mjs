// probe.mjs: the state probe capture.mjs runs in the page after each screenshot, and the comparison montage.mjs
// runs on a before and after pair. Node 18+, no dependencies. Run `node scripts/probe.mjs --help` for the CLI.
//
// The probe records what a screenshot cannot show: each control's role, name and states (disabled, aria-disabled,
// aria-busy, aria-invalid, aria-current, aria-expanded, required), headings, the rendered contrast of every text
// element, the resting cue of each link in the main content, and the heights of controls that sit side by side.
// It also measures two traps from references/traps.md:
//   wrappedButtons   trap/button-label-wrap: a button whose label runs to 2 or more lines, with its height against
//                    its single-line height (line height, vertical padding and border, or its min-height when
//                    larger). A wrap usually makes it 1.5x or more, but padding at or above the line height keeps a
//                    two-line button at 1.5x or under, so the line count decides, not the ratio
//   flatSurfaces     trap/surface-matches-parent: an element with an opaque fill equal to the background behind
//                    it, a border of 1px or less on all four sides, and no shadow
//   clipped          trap/narrow-hidden-nav: a nav link or table column header outside the visible box of an
//                    ancestor that clips or scrolls it, or past the viewport's right edge, and nav links hidden
//                    below 768px with no visible menu button. cue is true when the clipping box has a mask
//   tallOverlays     trap/overlay-no-max-height: an open dialog that runs past the viewport with nothing that
//                    scrolls it into reach, or that clips its own content. Measure it at 390x320
//   motion           trap/reduced-motion-ignored: animations with a duration over 1ms under
//                    prefers-reduced-motion: reduce, except those whose keyframes change only opacity or color,
//                    which may stay to explain a state. capture.mjs records them in window.__dsMotion right after
//                    a state function runs, before it finishes animations, so an enter animation still counts
//   textMeasure      trap/text-measure: a paragraph in a reading column (a <p> of 120 characters or more, outside
//                    nav, header, footer, aside, tables, controls and overlays) whose full lines measure over 75ch or
//                    under 30ch. A line's length is its rendered line box, from the text's client rects, over the
//                    width of "0" in the paragraph's font. One entry per column, with how many paragraphs share it

// Animations still running or holding their end state under prefers-reduced-motion: reduce. Evaluated in the page.
// An animation whose keyframes change only opacity or color properties is skipped: it explains a state without movement.
export const MOTION_SRC = `(() => {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const seen = new Map(), out = [];
  const META = new Set(["offset", "computedOffset", "easing", "composite"]);
  const still = (a) => {
    let kf = []; try { kf = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []; } catch (e) {}
    const props = new Set(); for (const f of kf) for (const k of Object.keys(f)) if (!META.has(k)) props.add(k);
    if (!props.size && a.transitionProperty) props.add(a.transitionProperty);
    return props.size > 0 && [...props].every((p) => !p.startsWith("--") && /^(opacity|fill|stroke|.*[cC]olor)$/.test(p));
  };
  const desc = (el) => !el || !el.tagName ? "document" : el.tagName.toLowerCase() + (el.id ? "#" + el.id : el.classList && el.classList[0] ? "." + el.classList[0] : "");
  for (const a of document.getAnimations()) {
    if (out.length >= 30) break;
    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
    const d = typeof t.duration === "number" ? t.duration : 0;
    if (d <= 1 || a.playState === "idle" || still(a)) continue;
    const what = a.animationName ? "animation " + a.animationName : a.transitionProperty ? "transition " + a.transitionProperty : "script animation";
    const k = what + " on " + desc(a.effect && a.effect.target) + (a.effect && a.effect.pseudoElement ? a.effect.pseudoElement : "");
    const n = (seen.get(k) || 0) + 1; seen.set(k, n);
    out.push({ key: n > 1 ? k + " #" + n : k, ms: Math.round(d), iterations: t.iterations === Infinity ? "infinite" : t.iterations, state: a.playState });
  }
  return out;
})()`;

// Evaluated in the page as an expression. Returns a plain object.
export const PROBE_SRC = `(() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const solid = (c) => (c === "transparent" ? [0, 0, 0, 0] : rgba(c));
  const over = (top, base) => [0, 1, 2].map((i) => top[i] * top[3] + base[i] * (1 - top[3]));
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2)); };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0.05; };
  const bgOf = (el) => {
    const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e);
    let base = [255, 255, 255];
    for (const e of chain.reverse()) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== "none") return null;
      const b = solid(s.backgroundColor); if (b[3] > 0) base = over(b, base);
    }
    return base;
  };
  const clean = (t) => (t || "").replace(/\\s+/g, " ").trim().slice(0, 60);
  const nameOf = (el) => {
    const l = el.getAttribute("aria-label"); if (l) return clean(l);
    const lb = el.getAttribute("aria-labelledby"); if (lb) return clean(lb.split(/\\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" "));
    if (el.id) { const f = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (f) return clean(f.textContent); }
    const wrap = el.closest("label"); if (wrap && wrap !== el) return clean(wrap.textContent);
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return clean(el.getAttribute("placeholder") || el.getAttribute("title") || el.getAttribute("name") || "");
    return clean(el.innerText || el.textContent || el.getAttribute("title") || "");
  };
  const roleOf = (el) => {
    const r = el.getAttribute("role"); if (r) return r;
    const t = el.tagName;
    if (t === "A") return el.hasAttribute("href") ? "link" : "generic";
    if (t === "BUTTON") return "button";
    if (t === "SELECT") return "combobox";
    if (t === "TEXTAREA") return "textbox";
    if (t === "INPUT") { const ty = (el.type || "text").toLowerCase(); return ({ checkbox: "checkbox", radio: "radio", submit: "button", button: "button", reset: "button", range: "slider", search: "searchbox" })[ty] || "textbox"; }
    return t.toLowerCase();
  };
  const seen = new Map();
  const keyed = (k) => { const n = (seen.get(k) || 0) + 1; seen.set(k, n); return n > 1 ? k + " #" + n : k; };
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };

  const controls = [];
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [role=combobox], [role=menuitem], [tabindex]:not([tabindex="-1"])')) {
    if (!visible(el)) continue;
    const role = roleOf(el), name = nameOf(el);
    const a = (n) => el.getAttribute(n);
    controls.push({ key: keyed(role + ' "' + name + '"'), role, name, tag: el.tagName.toLowerCase(),
      disabled: !!el.disabled, ariaDisabled: a("aria-disabled"), ariaBusy: a("aria-busy"), ariaInvalid: a("aria-invalid"),
      ariaCurrent: a("aria-current"), ariaExpanded: a("aria-expanded"), ariaSelected: a("aria-selected"), required: !!el.required,
      type: a("type"), href: el.tagName === "A" ? (a("href") || "").split("#")[0] : null, box: box(el) });
  }
  seen.clear();
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")].filter(visible).map((h) => ({ key: keyed("heading " + JSON.stringify(clean(h.textContent))), level: h.getAttribute("aria-level") || h.tagName.slice(1), text: clean(h.textContent) }));
  seen.clear();
  const texts = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (texts.length >= 600) break;
    if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|TEMPLATE)$/.test(el.tagName)) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ");
    const t = clean(own); if (!t || !visible(el)) continue;
    const s = getComputedStyle(el);
    const bg = bgOf(el); const fgRaw = solid(s.color);
    const size = parseFloat(s.fontSize), weight = parseInt(s.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const fg = bg ? over(fgRaw, bg) : null;
    texts.push({ key: keyed(el.tagName.toLowerCase() + " " + JSON.stringify(t.slice(0, 40))), color: hex(fgRaw) + (fgRaw[3] < 1 ? "/" + fgRaw[3].toFixed(2) : ""), bg: bg ? hex(bg) : "image", ratio: bg ? ratio(fg, bg) : null, large, size, weight });
  }
  seen.clear();
  const main = document.querySelector("main,[role=main]") || document.body;
  const links = [];
  for (const el of main.querySelectorAll("a[href]")) {
    if (!visible(el) || el.closest("nav,header,footer,[role=navigation],[role=banner],[role=contentinfo]")) continue;
    const s = getComputedStyle(el);
    if (solid(s.backgroundColor)[3] > 0) continue; // a link drawn as a button or card has its own edge
    let p = el.parentElement; while (p && p.closest("a") === el) p = p.parentElement;
    const pc = rgba(getComputedStyle(p || document.body).color), lc = rgba(s.color);
    const underline = /underline/.test(s.textDecorationLine) || [...el.querySelectorAll("*")].some((c) => /underline/.test(getComputedStyle(c).textDecorationLine));
    const apart = Math.abs(pc[0] - lc[0]) + Math.abs(pc[1] - lc[1]) + Math.abs(pc[2] - lc[2]) > 40;
    links.push({ key: keyed("link " + JSON.stringify(nameOf(el))), color: hex(lc), textColor: hex(pc), underline, cue: underline || apart });
  }
  const rowItems = controls.filter((c) => /^(button|textbox|combobox|searchbox)$/.test(c.role) && c.tag !== "textarea" && c.box.h >= 16 && c.box.h <= 80);
  const rows = [];
  const used = new Set();
  for (const c of rowItems) {
    if (used.has(c.key)) continue;
    const cy = c.box.y + c.box.h / 2;
    const row = rowItems.filter((d) => !used.has(d.key) && Math.abs(d.box.y + d.box.h / 2 - cy) <= 4).sort((a, b) => a.box.x - b.box.x);
    let cluster = [row[0]];
    const flush = () => { if (cluster.length > 1) { const hs = new Set(cluster.map((d) => d.box.h)); if (Math.max(...hs) - Math.min(...hs) > 1) rows.push(cluster.map((d) => ({ key: d.key, h: d.box.h }))); } };
    for (let i = 1; i < row.length; i++) { const prev = row[i - 1]; if (row[i].box.x - (prev.box.x + prev.box.w) <= 32) cluster.push(row[i]); else { flush(); cluster = [row[i]]; } }
    flush();
    row.forEach((d) => used.add(d.key));
  }
  seen.clear();
  const px = (v) => parseFloat(v) || 0;
  const wrappedButtons = [];
  for (const el of document.querySelectorAll("button, [role=button], input[type=submit], input[type=button]")) {
    if (!visible(el)) continue;
    const label = clean(el.innerText || el.value || ""); if (!label) continue;
    const s = getComputedStyle(el), h = el.getBoundingClientRect().height;
    const lh = s.lineHeight === "normal" ? px(s.fontSize) * 1.2 : px(s.lineHeight);
    const single = Math.max(lh + px(s.paddingTop) + px(s.paddingBottom) + px(s.borderTopWidth) + px(s.borderBottomWidth), px(s.minHeight));
    if (!single) continue;
    const tops = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1) tops.push(q.top);
    }
    tops.sort((a, b) => a - b);
    let lines = tops.length ? 1 : 0;
    for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > lh * 0.5) lines++;
    // An <input> button has no text node to measure, so its height alone tells.
    const wrapped = el.tagName === "INPUT" ? h > single * 1.5 : lines >= 2;
    if (wrapped) wrappedButtons.push({ key: keyed("button " + JSON.stringify(label)), h: Math.round(h), single: Math.round(single), ratio: +(h / single).toFixed(2), lines, w: Math.round(el.getBoundingClientRect().width) });
  }
  seen.clear();
  const flatSurfaces = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (flatSurfaces.length >= 50) break;
    if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|TEMPLATE|BUTTON|INPUT|SELECT|TEXTAREA|A|HR|IMG|VIDEO|IFRAME|CANVAS|HTML|BODY)$/.test(el.tagName)) continue;
    const s = getComputedStyle(el);
    const own = solid(s.backgroundColor); if (own[3] < 0.99 || (s.backgroundImage && s.backgroundImage !== "none")) continue;
    const sides = ["Top", "Right", "Bottom", "Left"].map((k) => (s["border" + k + "Style"] === "none" ? 0 : px(s["border" + k + "Width"])));
    if (sides.some((w) => w <= 0 || w > 1) || s.boxShadow !== "none") continue;
    const r = el.getBoundingClientRect(); if (r.width < 80 || r.height < 40 || !visible(el)) continue;
    const behind = el.parentElement ? bgOf(el.parentElement) : [255, 255, 255]; if (!behind) continue;
    const mine = over(own, behind);
    if (Math.max(...[0, 1, 2].map((i) => Math.abs(mine[i] - behind[i]))) > 2) continue;
    flatSurfaces.push({ key: keyed(el.tagName.toLowerCase() + " " + JSON.stringify(clean(el.innerText).slice(0, 40))), bg: hex(mine), parentBg: hex(behind), border: s.borderTopColor, box: box(el) });
  }
  seen.clear();
  const clipped = [];
  const toggle = [...document.querySelectorAll("button[aria-expanded], button[aria-controls], header button, nav button, [role=navigation] button")].some(visible);
  const items = [...document.querySelectorAll("nav a[href], [role=navigation] a[href]")].map((e) => [e, "nav link"]).concat([...document.querySelectorAll("th, [role=columnheader]")].map((e) => [e, "column"]));
  for (const [el, kind] of items) {
    if (clipped.length >= 40) break;
    const name = kind === "column" ? clean(el.textContent) : nameOf(el); if (!name) continue;
    const key = keyed(kind + " " + JSON.stringify(name));
    if (!visible(el)) {
      if (kind === "nav link" && innerWidth < 768 && !toggle && !el.closest("[hidden],[aria-hidden=true],details:not([open])")) clipped.push({ key, by: "hidden, and no visible menu button", cue: false });
      continue;
    }
    const r = el.getBoundingClientRect();
    let by = null, cue = false, win = null;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflowX === "visible") continue;
      const b = p.getBoundingClientRect(), left = b.left + p.clientLeft, right = left + p.clientWidth;
      const shown = Math.max(0, Math.min(r.right, right) - Math.max(r.left, left));
      if (shown < r.width / 2) {
        by = p.tagName.toLowerCase() + (p.classList[0] ? "." + p.classList[0] : "") + " (overflow-x " + ps.overflowX + ")";
        cue = [ps.maskImage, ps.webkitMaskImage].some((m) => m && m !== "none");
        win = { visibleW: p.clientWidth, scrollW: p.scrollWidth };
        break;
      }
    }
    if (!by && r.left >= innerWidth - 1) by = "past the viewport's right edge";
    if (by) clipped.push({ key, by, cue, ...(win || {}) });
  }
  seen.clear();
  const tallOverlays = [];
  const scrollsY = (e) => /(auto|scroll|overlay)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1;
  for (const el of document.querySelectorAll("dialog[open], [role=dialog], [role=alertdialog]")) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    const past = r.bottom > innerHeight + 1 || r.top < -1;
    const cut = /(hidden|clip)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
    if (!past && !cut) continue;
    let fixed = null; for (let p = el; p && p !== document.documentElement; p = p.parentElement) if (getComputedStyle(p).position === "fixed") { fixed = p; break; }
    if (past && !cut) {
      if (!fixed) continue; // the page scrolls it into reach
      let reach = false; for (let p = el.parentElement; p && fixed.contains(p); p = p.parentElement) if (scrollsY(p)) reach = true;
      if (reach) continue;
    }
    tallOverlays.push({ key: keyed("dialog " + JSON.stringify(nameOf(el) || clean(el.textContent).slice(0, 30))), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), viewportH: innerHeight, maxHeight: s.maxHeight, overflowY: s.overflowY });
  }
  seen.clear();
  const textMeasure = [], columns = new Map();
  const zero = document.createElement("canvas").getContext("2d");
  for (const el of document.querySelectorAll("p")) {
    if (columns.size >= 20) break;
    if (!visible(el) || el.closest("nav,header,footer,aside,table,button,a,label,figcaption,dialog,[role=navigation],[role=dialog],[role=alertdialog],[role=menu],[role=tooltip],[role=banner],[role=contentinfo]")) continue;
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length < 120) continue;
    const s = getComputedStyle(el);
    if (/pre|nowrap/.test(s.whiteSpace)) continue;
    const lh = s.lineHeight === "normal" ? px(s.fontSize) * 1.2 : px(s.lineHeight);
    const lines = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const g = document.createRange(); g.selectNodeContents(n);
      for (const q of g.getClientRects()) {
        if (q.width < 1) continue;
        const line = lines.find((l) => Math.abs(l.top - q.top) < lh / 2);
        if (line) { line.left = Math.min(line.left, q.left); line.right = Math.max(line.right, q.right); } else lines.push({ top: q.top, left: q.left, right: q.right });
      }
    }
    if (lines.length < 2) continue;
    lines.sort((a, b) => a.top - b.top);
    const full = lines.slice(0, -1).map((l) => l.right - l.left).sort((a, b) => a - b);
    zero.font = s.fontStyle + " " + s.fontWeight + " " + s.fontSize + " " + s.fontFamily;
    const ch0 = zero.measureText("0").width || px(s.fontSize) * 0.5;
    const ch = Math.round(full[full.length >> 1] / ch0);
    if (ch <= 75 && ch >= 30) continue;
    const col = el.parentElement, prev = columns.get(col);
    if (prev) { prev.count++; continue; }
    const t = { key: keyed("p " + JSON.stringify(text.slice(0, 40))), ch, chars: Math.round(text.length / lines.length), lines: lines.length, w: Math.round(el.getBoundingClientRect().width), count: 1 };
    columns.set(col, t); textMeasure.push(t);
  }
  const motion = window.__dsMotion !== undefined ? window.__dsMotion : ${MOTION_SRC};
  return { url: location.pathname + location.search, width: innerWidth, height: innerHeight, controls, headings, texts, links, heightMismatch: rows, wrappedButtons, flatSurfaces, clipped, tallOverlays, textMeasure, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches, motion };
})()`;


// probe.mjs --grow: grow one dimension of a target until its layout breaks (rule-method.md, Limits by measurement).
// Count mode detects the list's axis. A vertical list breaks on height, not wrap. --item falls back to the whole
// document, so items in a pop-up rendered outside the target (a portal) grow once --click has opened it.
// Evaluated in the page as a function of { dimension, target, item, textTarget, sample, max, step, watch }.
export const GROW_SRC = `(o) => {
  const target = document.querySelector(o.target);
  if (!target) return { error: "target" };
  const r = (el) => el.getBoundingClientRect();
  const distinct = (vals) => { const out = []; for (const v of vals.sort((a, b) => a - b)) if (!out.length || v - out[out.length - 1] > 2) out.push(v); return out.length; };
  const clipped = (e) => { const s = getComputedStyle(e); return e.scrollWidth > e.clientWidth + 1 && (s.textOverflow === "ellipsis" || /hidden|clip/.test(s.overflowX) || /hidden|clip/.test(s.overflow)); };
  let items = null, el = null, start, step, max, axis = null, box = null, portal = false;
  const notes = [];
  if (o.dimension === "count") {
    // --item is looked for inside the target first, then anywhere in the document, so items in a pop-up
    // rendered outside the target (a portal) still grow once --click has opened it.
    items = () => { if (!o.item) return [...target.children]; const inside = [...target.querySelectorAll(o.item)]; return inside.length ? inside : [...document.querySelectorAll(o.item)]; };
    const first = items();
    if (!first.length) return { error: "item" };
    portal = !target.contains(first[0]);
    if (portal) notes.push("items found outside the target, in the document (a pop-up rendered elsewhere)");
    start = first.length; step = 1; max = o.max || 20;
    // The list axis. Vertical when every item sits on its own row in one column, or, with one item, when the
    // list lays items out top to bottom. A vertical list never wraps, so its break is height: the nearest
    // clipping or scrolling box starts to scroll, or the list passes the viewport's bottom.
    const list = first.at(-1).parentElement;
    const lefts = first.map((i) => r(i).left), tops = first.map((i) => r(i).top);
    if (first.length > 1) axis = distinct(lefts.slice()) === 1 && distinct(tops.slice()) === first.length ? "vertical" : "horizontal";
    else { const ls = getComputedStyle(list), is = getComputedStyle(first[0]); axis = /flex/.test(ls.display) ? (/column/.test(ls.flexDirection) ? "vertical" : "horizontal") : /grid/.test(ls.display) ? (/column/.test(ls.gridAutoFlow) ? "horizontal" : "vertical") : /^inline/.test(is.display) ? "horizontal" : "vertical"; }
    if (axis === "vertical") {
      for (let e = list; e && e !== document.body && e !== document.documentElement; e = e.parentElement) if (/auto|scroll|hidden|clip/.test(getComputedStyle(e).overflowY)) { box = e; break; }
      notes.push("vertical list: each item is its own row, so wrap does not apply. The break is height overflow" + (box ? " in its scrolling box" : "") + " or the viewport's bottom");
    }
  } else {
    el = o.textTarget ? target.querySelector(o.textTarget) : target;
    if (!el) return { error: "text-target" };
    start = el.textContent.length; step = o.step || 1; max = o.max || 200;
  }
  const lines = (e) => {
    const tops = [];
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const g = document.createRange(); g.selectNodeContents(n); for (const q of g.getClientRects()) if (q.width > 0 && q.height > 0) tops.push(q.top); }
    return distinct(tops);
  };
  const wrapNow = () => (el ? lines(el) : distinct(items().map((i) => r(i).top)));
  // How far down the grown content reaches: the scrolling box when there is one, else the last item, else the target.
  const bottomNow = () => (axis === "vertical" ? (box ? r(box).bottom : r(items().at(-1)).bottom) : r(target).bottom);
  const truncNow = () => { for (const e of el ? [el] : [target, ...items()]) if (clipped(e)) return "scrollWidth " + e.scrollWidth + " > clientWidth " + e.clientWidth + " on " + (e === target ? "the target" : el ? "the text" : "an item") + ", " + (getComputedStyle(e).textOverflow === "ellipsis" ? "text-overflow ellipsis" : "overflow " + getComputedStyle(e).overflowX); return null; };
  // The three overflow tests, each as [key, measurement] when it holds. A test that already held at the start is
  // left out later, so the others still report.
  const overNow = () => {
    const out = [];
    if (target.scrollWidth > target.clientWidth + 1) out.push(["scroll", "scrollWidth " + target.scrollWidth + " > clientWidth " + target.clientWidth]);
    const p = target.parentElement;
    if (p) { const ps = getComputedStyle(p), edge = r(p).right - parseFloat(ps.paddingRight) - parseFloat(ps.borderRightWidth); if (r(target).right > edge + 1) out.push(["edge", "right edge " + Math.round(r(target).right) + " > parent content edge " + Math.round(edge)]); }
    if (document.documentElement.scrollWidth > innerWidth) out.push(["page", "document scrollWidth " + document.documentElement.scrollWidth + " > innerWidth " + innerWidth]);
    if (box && box.scrollHeight > box.clientHeight + 1) out.push(["height", "item " + items().length + " needs scroll: scrollHeight " + box.scrollHeight + " > clientHeight " + box.clientHeight + " on the list's scrolling box"]);
    return out;
  };
  const watch = o.watch ? document.querySelector(o.watch) : target.nextElementSibling;
  const base = { wrap: wrapNow(), trunc: !!truncNow(), over: overNow().map(([k]) => k), fold: bottomNow() > innerHeight, watch: watch ? r(watch) : null };
  if (base.trunc) notes.push("already truncated at the start");
  for (const [k, m] of overNow()) notes.push("already overflowing at the start: " + m + ". Only the other overflow tests count");
  if (base.fold) notes.push("already below the fold at the start");
  const found = new Map();
  const sample = o.sample || (el && el.textContent) || "M";
  let k = 0;
  const lastText = () => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let last = null; for (let n = w.nextNode(); n; n = w.nextNode()) last = n; if (!last) { last = document.createTextNode(""); el.appendChild(last); } return last; };
  for (let at = start + step; at <= max; at += step) {
    if (items) { const last = items().at(-1); last.after(last.cloneNode(true)); }
    else { const t = lastText(); let add = ""; for (let i = 0; i < step; i++) add += sample[k++ % sample.length]; t.textContent += add; }
    void document.body.offsetHeight;
    const hit = (kind, m) => { if (m && !found.has(kind)) found.set(kind, { kind, at, measurement: m }); };
    const wn = wrapNow(); if (axis !== "vertical" && wn > base.wrap) hit("wrap", (el ? "lines " : "rows ") + base.wrap + " -> " + wn);
    if (!base.trunc) hit("truncate", truncNow());
    hit("overflow", (overNow().find(([k2]) => !base.over.includes(k2)) || [])[1]);
    if (!base.fold && bottomNow() > innerHeight) hit("below-fold", "bottom " + Math.round(bottomNow()) + " > innerHeight " + innerHeight);
    if (watch && base.watch) { const b = r(watch), dx = Math.round(b.left - base.watch.left), dy = Math.round(b.top - base.watch.top); if (Math.abs(dx) > 1 || Math.abs(dy) > 1) hit("shift", "watched element moved " + dx + "px across, " + dy + "px down"); }
  }
  const ORDER = ["wrap", "truncate", "overflow", "below-fold", "shift"];
  const breaks = [...found.values()].sort((a, b) => a.at - b.at || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return { start, step, max, axis, portal, breaks, limit: breaks.length ? breaks[0].at - step : null, unbroken: !breaks.length, notes };
}`;

// One grow run on a loaded page. Returns the JSON record, or { error } when the target or item is missing.
export async function growOnPage(page, o) {
  return page.evaluate(`(${GROW_SRC})(${JSON.stringify(o)})`);
}
const growLine = (dim, w, g) => `grow ${dim} ${w}: ${g.breaks.length ? `${g.breaks.map((b) => `${b.kind} at ${b.at} (${b.measurement})`).join(", ")}; limit ${g.limit}` : `no break up to ${g.max}`}`;

const ATTRS = ["role", "disabled", "ariaDisabled", "ariaBusy", "ariaInvalid", "ariaCurrent", "ariaExpanded", "ariaSelected", "required", "type", "href"];
const byKey = (list) => new Map((list || []).map((x) => [x.key, x]));

// Compare two probes. Returns { deltas: [text], problems: [text], gated: [text], linkRestyled: n }. A gated line is a
// problem unless the surface's trace row names a gate (G-...): the montage decides.
export function compareProbes(before, after) {
  const deltas = [], problems = [], gated = [];
  const b = byKey(before.controls), a = byKey(after.controls);
  const gone = [...b.keys()].filter((k) => !a.has(k)), added = [...a.keys()].filter((k) => !b.has(k));
  if (gone.length) deltas.push(`removed ${gone.slice(0, 4).join(", ")}${gone.length > 4 ? ` and ${gone.length - 4} more` : ""}`);
  if (added.length) deltas.push(`added ${added.slice(0, 4).join(", ")}${added.length > 4 ? ` and ${added.length - 4} more` : ""}`);
  for (const [k, x] of b) {
    const y = a.get(k); if (!y) continue;
    const ch = ATTRS.filter((f) => String(x[f]) !== String(y[f])).map((f) => `${f} ${x[f] ?? "none"} -> ${y[f] ?? "none"}`);
    if (ch.length) deltas.push(`${k}: ${ch.join(", ")}`);
  }
  const hb = byKey(before.headings), ha = byKey(after.headings);
  for (const [k, x] of hb) { const y = ha.get(k); if (!y) deltas.push(`${k} removed`); else if (x.level !== y.level) deltas.push(`${k}: level ${x.level} -> ${y.level}`); }
  for (const k of ha.keys()) if (!hb.has(k)) deltas.push(`${k} added`);
  // Contrast of recolored text: same text, new color or background.
  const tb = byKey(before.texts), ta = byKey(after.texts);
  for (const [k, x] of tb) {
    const y = ta.get(k); if (!y || (x.color === y.color && x.bg === y.bg)) continue;
    if (y.ratio == null) { deltas.push(`${k} recolored over an image, contrast not measured`); continue; }
    const min = y.large ? 3 : 4.5;
    if (y.ratio < min) problems.push(`${k} recolored to ${y.color} on ${y.bg}: contrast ${y.ratio}:1, needs ${min}:1 (was ${x.ratio ?? "?"}:1)`);
    else if (x.ratio != null && x.ratio - y.ratio >= 1) deltas.push(`${k} contrast ${x.ratio} -> ${y.ratio}:1 (${x.color} -> ${y.color})`);
  }
  // Links in the main content keep a resting cue, and a change to their color or underline needs a gate.
  const lb = byKey(before.links), la = byKey(after.links);
  let linkRestyled = 0;
  for (const [k, y] of la) {
    const x = lb.get(k);
    if (x && (x.color !== y.color || x.underline !== y.underline)) linkRestyled++;
    if (!y.cue && (!x || x.cue)) problems.push(`${k} has no resting cue: text color ${y.color} like the text around it, and no underline`);
  }
  if (linkRestyled) deltas.push(`${linkRestyled} link(s) changed color or underline`);
  for (const r of after.heightMismatch || []) {
    const key = r.map((d) => d.key).join(" | ");
    const was = (before.heightMismatch || []).some((q) => q.map((d) => d.key).join(" | ") === key);
    const text = `controls side by side at different heights: ${r.map((d) => `${d.key} ${d.h}px`).join(", ")}`;
    deltas.push(was ? `${text} (as before)` : text);
  }
  // A label that wraps where it did not before is a problem. A panel that went flat is a delta for a person to judge.
  const wb = byKey(before.wrappedButtons);
  for (const y of after.wrappedButtons || []) {
    const text = `${y.key} label wraps to ${y.lines} lines at ${after.width || "?"}px, ${y.h}px tall where one line is ${y.single}px (trap/button-label-wrap)`;
    if (wb.has(y.key)) deltas.push(`${text} (as before)`); else problems.push(text);
  }
  const fb = byKey(before.flatSurfaces);
  for (const y of after.flatSurfaces || []) if (!fb.has(y.key)) deltas.push(`${y.key} fill ${y.bg} equals the background behind it, hairline border only (trap/surface-matches-parent)`);
  // Content moved out of reach at a narrow width is a gate, never a silent fix. A dialog that cannot scroll, and motion
  // under reduced motion, are problems.
  const cb = byKey(before.clipped);
  for (const y of after.clipped || []) {
    const text = `${y.key} out of reach at ${after.width || "?"}px: ${y.by}${y.visibleW ? `, ${y.visibleW}px shown of ${y.scrollW}px` : ""}${y.cue ? ", with a mask cue" : ", no cue"} (trap/narrow-hidden-nav)`;
    if (cb.has(y.key)) deltas.push(`${text} (as before)`); else gated.push(text);
  }
  const ob = byKey(before.tallOverlays);
  for (const y of after.tallOverlays || []) {
    const text = `${y.key} runs ${y.top}px to ${y.bottom}px in a ${y.viewportH}px viewport and nothing scrolls it (max-height ${y.maxHeight}, overflow-y ${y.overflowY}) (trap/overlay-no-max-height)`;
    if (ob.has(y.key)) deltas.push(`${text} (as before)`); else problems.push(text);
  }
  const tmb = byKey(before.textMeasure);
  for (const y of after.textMeasure || []) {
    const text = `${y.key} lines measure ${y.ch}ch (${y.chars} characters), ${y.lines} lines in a ${y.w}px column${y.count > 1 ? `, and ${y.count - 1} more paragraph(s) there` : ""} (trap/text-measure)`;
    if (tmb.has(y.key)) deltas.push(`${text} (as before)`); else problems.push(text);
  }
  const mb = byKey(before.motion);
  for (const y of after.motion || []) {
    const text = `${y.key}, ${y.ms}ms x ${y.iterations}, ${y.state} under prefers-reduced-motion: reduce (trap/reduced-motion-ignored)`;
    if (mb.has(y.key)) deltas.push(`${text} (as before)`); else problems.push(text);
  }
  return { deltas, problems, gated, linkRestyled, heightMismatch: (after.heightMismatch || []).length };
}

// What one probe says about the measured traps, as lines.
export function trapLines(p) {
  return [
    ...(p.wrappedButtons || []).map((b) => `trap/button-label-wrap\t${b.key}\t${b.lines} lines, ${b.h}px tall where one line is ${b.single}px (${b.ratio ?? "?"}x), ${b.w}px wide`),
    ...(p.flatSurfaces || []).map((f) => `trap/surface-matches-parent\t${f.key}\tfill ${f.bg} on ${f.parentBg}, border ${f.border}`),
    ...(p.clipped || []).map((c) => `trap/narrow-hidden-nav\t${c.key}\t${c.by}${c.visibleW ? `, ${c.visibleW}px shown of ${c.scrollW}px` : ""}, ${c.cue ? "mask cue" : "no cue"}, at ${p.width || "?"}px`),
    ...(p.tallOverlays || []).map((o) => `trap/overlay-no-max-height\t${o.key}\t${o.top}px to ${o.bottom}px in a ${o.viewportH}px viewport, max-height ${o.maxHeight}, overflow-y ${o.overflowY}`),
    ...(p.motion || []).map((m) => `trap/reduced-motion-ignored\t${m.key}\t${m.ms}ms x ${m.iterations}, ${m.state}`),
    ...(p.textMeasure || []).map((t) => `trap/text-measure\t${t.key}\t${t.ch}ch per line, want 30 to 75 (${t.chars} characters), ${t.lines} lines, ${t.w}px wide${t.count > 1 ? `, and ${t.count - 1} more paragraph(s) in the same column` : ""}, at ${p.width || "?"}px`),
  ];
}

const HELP = `probe.mjs: measure the probe's traps on saved probes or live pages

Usage:
  node scripts/probe.mjs <file.probe.json>...
  node scripts/probe.mjs --base <url> --routes <r>... [--widths 390] [--height 900] [--click <selector>] [--root <dir>]
  node scripts/probe.mjs --self-test [--fixtures <dir>]   every trap on its fixture pages (fixtures/probe/)
  node scripts/probe.mjs --grow --base <url> --route <path> --target <css> --dimension count|text
      [--item <css>] [--text-target <css>] [--sample <string>] [--max <n>] [--step <n>]
      [--widths 390[,1280]] [--height <px>] [--click <css>] [--watch <css>] [--out <dir>] [--root <dir>]

Prints one line per finding: trap id, element, measurement. It measures six
traps from references/traps.md:
  trap/button-label-wrap        a button label on 2 or more lines, with its height
                                against one line's
  trap/surface-matches-parent   an opaque fill equal to the background behind it,
                                a 1px or thinner border on all sides, no shadow
  trap/narrow-hidden-nav        a nav link or table column header clipped by a
                                scrolling or hidden box, or past the viewport, and
                                nav links hidden below 768px with no menu button
  trap/overlay-no-max-height    an open dialog that runs past the viewport with
                                nothing to scroll it, or clips its own content
  trap/reduced-motion-ignored   animations over 1ms under prefers-reduced-motion,
                                except those that change only opacity or color
  trap/text-measure             a paragraph in a reading column whose full lines
                                measure over 75ch or under 30ch (rendered line
                                boxes over the width of "0"), once per column
capture.mjs writes the same fields into every .probe.json. Live pages load with
reduced motion on.

  --routes <r>...     paths, separated by spaces or commas
  --widths 390        viewport widths, comma separated (default 390, where labels wrap)
  --height 900        viewport height. Measure overlays at --widths 390 --height 320
  --click <selector>  a Playwright selector clicked after load, before the probe,
                      such as 'button:has-text("Delete workspace")' to open a dialog
  --root <dir>        the app's repo root, where Playwright is looked for first.
                      Default: the git root of the first file, else of the current folder

--grow measures a limit (references/rule-method.md, Limits by measurement). At each
width it grows the target one step at a time and records the first value where
each break happens:
  wrap        text mode: the text's line count rises. count mode on a
              horizontal list: the items fall onto more rows
  truncate    the text or an item clips with an ellipsis, or overflow hidden or clip
  overflow    the target scrolls sideways, passes its parent's content edge, or
              the page scrolls sideways. On a vertical list, also the first item
              that needs scroll in the list's nearest scrolling or clipping box
  below-fold  the grown content's bottom passes the viewport's: the target's, or
              on a vertical list its scrolling box's, else its last item's
  shift       --watch (default the target's next sibling) moves by more than 1px
  --dimension count   clone the last --item (default the target's last child) up
                      to --max items in all (default 20). The list's axis is
                      detected: a vertical list, one item per row, reports no
                      wrap, since every item is already its own row
  --item <css>        looked for inside the target first, then anywhere in the
                      document, so options in a pop-up rendered outside the
                      target grow once --click has opened it
  --dimension text    append --sample (default the current text) to --text-target
                      (default the target), --step characters at a time (default
                      1), up to --max characters (default 200)
  --out <dir>         where grow-<dimension>-<width>.json goes. Default
                      .design-system/evidence/grow/ under the root
limit is the earliest break minus one step, or null when nothing broke.

Exit 0 when nothing is found, 1 on any finding, 2 on bad input or no browser.
--grow exits 0 whenever it measured, breaks or not.`;

if (process.argv[1] && (await import("node:path")).resolve(process.argv[1]) === (await import("node:url")).fileURLToPath(import.meta.url)) {
  const { readFileSync, existsSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const { launchChromium, repoRoot } = await import("./find-chromium.mjs");
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(argv.length ? 0 : 2); }
  const bad = argv.filter((a, i) => a.startsWith("--") && argv[i - 1] !== "--sample" && !["--base", "--routes", "--widths", "--height", "--click", "--root", "--self-test", "--fixtures", "--grow", "--route", "--target", "--dimension", "--item", "--text-target", "--sample", "--max", "--step", "--watch", "--out"].includes(a));
  if (bad.length) { console.error(`probe: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
  if (argv.includes("--self-test")) {
    // Each fixtures/probe/<trap>/ holds case.json ({ "trap", "width", "height", "click", "expect" }), fail.html and
    // pass.html. fail.html must give exactly expect lines for the trap, and pass.html none.
    const { readdirSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath, pathToFileURL } = await import("node:url");
    const i = argv.indexOf("--fixtures");
    const dir = i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : ((p) => existsSync(p) ? p : join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "probe"))(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "probe"));
    if (!existsSync(dir)) { console.error(`probe: no fixtures at ${dir}`); process.exit(2); }
    const ri = argv.indexOf("--root");
    const launched = await launchChromium({}, { root: repoRoot(ri >= 0 ? argv[ri + 1] : undefined) });
    if (launched.error) { console.error(`probe: ${launched.error}`); process.exit(2); }
    let ok = true, n = 0;
    for (const c of readdirSync(dir).sort()) {
      if (!existsSync(join(dir, c, "case.json"))) continue;
      const spec = JSON.parse(readFileSync(join(dir, c, "case.json"), "utf8"));
      if (spec.mode === "grow") {
        // A grow case: page.html, an optional click that opens the target, and the first break it must report.
        const ctx = await launched.browser.newContext({ viewport: { width: spec.width || 390, height: spec.height || 900 } });
        const page = await ctx.newPage();
        let g = null, err = "";
        try { await page.goto(pathToFileURL(join(dir, c, "page.html")).href, { waitUntil: "load" }); if (spec.click) await page.locator(spec.click).first().click({ timeout: 5000 }); g = await growOnPage(page, { dimension: spec.dimension, target: spec.target, item: spec.item, textTarget: spec.textTarget, sample: spec.sample, max: spec.max, step: spec.step, watch: spec.watch }); } catch (e) { err = String(e.message).split("\n")[0]; }
        await ctx.close();
        const first = g && !g.error && g.breaks[0];
        const good = !!first && first.kind === spec.expect.kind && first.at === spec.expect.at;
        if (!good) ok = false; n++;
        console.log(`self-test ${good ? "ok  " : "FAIL"} grow ${spec.dimension} ${c}: ${first ? `${first.kind} at ${first.at}` : err || (g && g.error ? `no ${g.error}` : "no break")}, want ${spec.expect.kind} at ${spec.expect.at}`);
        continue;
      }
      for (const kind of ["fail", "pass"]) {
        const ctx = await launched.browser.newContext({ viewport: { width: spec.width || 390, height: spec.height || 900 }, reducedMotion: "reduce" });
        const page = await ctx.newPage();
        let got = -1, lines = [];
        try {
          await page.goto(pathToFileURL(join(dir, c, `${kind}.html`)).href, { waitUntil: "load" });
          if (spec.click) { await page.locator(spec.click).first().click({ timeout: 3000 }); await page.evaluate(`window.__dsMotion = ${MOTION_SRC}`); }
          lines = trapLines(await page.evaluate(PROBE_SRC)).filter((l) => l.startsWith(spec.trap + "\t"));
          got = lines.length;
        } catch (e) { lines = [String(e.message).split("\n")[0]]; }
        await ctx.close();
        const want = kind === "fail" ? spec.expect : 0, good = got === want;
        if (!good) ok = false; n++;
        console.log(`self-test ${good ? "ok  " : "FAIL"} ${spec.trap} ${kind}: ${got}/${want}${good ? "" : `  ${lines.join(" | ").replace(/\t/g, " ")}`}`);
      }
    }
    await launched.browser.close();
    console.log(`self-test: ${n} fixtures, ${ok ? "all as expected" : "FAILED"}`);
    process.exit(ok ? 0 : 1);
  }
  const val = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && (f === "--sample" || !argv[i + 1].startsWith("--")) ? argv[i + 1] : undefined; };
  if (argv.includes("--grow")) {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const base = val("--base"), route = val("--route"), target = val("--target"), dim = val("--dimension");
    if (!base || !/^https?:\/\//.test(base) || !route || !target || !["count", "text"].includes(dim)) { console.error(`probe: --grow needs --base <url>, --route <path>, --target <css> and --dimension count|text\n\n${HELP}`); process.exit(2); }
    const num = (f) => { const v = val(f); if (v === undefined) return undefined; const n = Number(v); if (!(n > 0)) { console.error(`probe: ${f} takes a positive number`); process.exit(2); } return n; };
    const widths = (val("--widths") || "390").split(",").map(Number);
    if (widths.some((w) => !w)) { console.error("probe: --widths takes numbers, such as 390,1280"); process.exit(2); }
    const height = num("--height") || 900, max = num("--max"), step = num("--step");
    const root = repoRoot(val("--root"));
    const out = val("--out") ? resolve(val("--out")) : join(root, ".design-system/evidence/grow");
    const launched = await launchChromium({}, { root });
    if (launched.error) { console.error(`probe: ${launched.error}`); process.exit(2); }
    for (const w of widths) {
      const ctx = await launched.browser.newContext({ viewport: { width: w, height }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      let g;
      try {
        await page.goto(new URL(route, base).href, { waitUntil: "load" });
        await page.evaluate("document.fonts.ready");
        if (val("--click")) { await page.locator(val("--click")).first().click({ timeout: 5000 }); await page.waitForTimeout(400); }
        g = await growOnPage(page, { dimension: dim, target, item: val("--item"), textTarget: val("--text-target"), sample: val("--sample"), max, step, watch: val("--watch") });
      } catch (e) { console.error(`probe: ${route} at ${w}: ${String(e.message).split("\n")[0]}`); await launched.browser.close(); process.exit(2); }
      await ctx.close();
      if (g.error) { console.error(`grow: no element matches ${g.error === "target" ? target : g.error === "item" ? val("--item") || "a child of the target" : val("--text-target")} on ${route} at ${w}`); await launched.browser.close(); process.exit(2); }
      const rec = { route, width: w, height, target, dimension: dim, ...(g.axis ? { axis: g.axis, portal: g.portal } : {}), start: g.start, step: g.step, max: g.max, breaks: g.breaks, limit: g.limit, unbroken: g.unbroken };
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, `grow-${dim}-${w}.json`), JSON.stringify(rec, null, 2) + "\n");
      console.log(growLine(dim, w, g));
      for (const n of g.notes) console.log(`note: grow ${dim} ${w}: ${n}`);
    }
    await launched.browser.close();
    console.log(`Coverage: grew ${dim} on ${target} at ${route}, widths ${widths.join(",")}, height ${height}. Breaks tested: wrap, truncate, overflow, below-fold, shift. Not tested: other routes, widths, heights and themes, and content other than the grown ${dim === "count" ? "item" : "text"}`);
    process.exit(0);
  }
  const after = (f) => { const i = argv.indexOf(f); if (i < 0) return []; const out = []; for (let k = i + 1; k < argv.length && !argv[k].startsWith("--"); k++) out.push(argv[k]); return out; };
  const flagVals = new Set(["--base", "--widths", "--height", "--click", "--root"].map(val).concat(after("--routes")));
  const files = argv.filter((a) => !a.startsWith("--") && !flagVals.has(a));
  let found = 0, where = "";
  const NOT = "Not measured: hover, focus and keyboard, contrast over images, pseudo-elements, text past the first 600 elements, more than 50 flat panels or 40 clipped items, text measure outside <p> or past 20 columns, and every trap in traps.md this list does not name";
  if (files.length) {
    where = `${files.length} probe file(s)`;
    for (const f of files) {
      if (!existsSync(resolve(f))) { console.error(`probe: no file at ${resolve(f)}`); process.exit(2); }
      const p = JSON.parse(readFileSync(resolve(f), "utf8"));
      if (!("wrappedButtons" in p)) console.log(`${f}\tnote: written before probe.mjs measured traps. Recapture it`);
      for (const l of trapLines(p)) { console.log(`${f}\t${l}`); found++; }
    }
  } else {
    const base = val("--base"); const routes = after("--routes").flatMap((r) => r.split(",")).map((r) => r.trim()).filter(Boolean);
    if (!base || !/^https?:\/\//.test(base) || !routes.length) { console.error(`probe: give .probe.json files, or --base <url> and --routes\n\n${HELP}`); process.exit(2); }
    const widths = (val("--widths") || "390").split(",").map(Number);
    if (widths.some((w) => !w)) { console.error("probe: --widths takes numbers, such as 390,1280"); process.exit(2); }
    const height = Number(val("--height") || 900);
    if (!height) { console.error("probe: --height takes a number, such as 320"); process.exit(2); }
    const click = val("--click");
    where = `${routes.length} route(s) at widths ${widths.join(",")}, height ${height}${click ? `, after clicking ${click}` : ""}, reduced motion on`;
    const launched = await launchChromium({}, { root: repoRoot(val("--root")) });
    if (launched.error) { console.error(`probe: ${launched.error}`); process.exit(2); }
    for (const route of routes) for (const w of widths) {
      const ctx = await launched.browser.newContext({ viewport: { width: w, height }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      try {
        const res = await page.goto(new URL(route, base).href, { waitUntil: "load" });
        await page.evaluate("document.fonts.ready");
        if (click) { await page.locator(click).first().click({ timeout: 5000 }); await page.evaluate(`window.__dsMotion = ${MOTION_SRC}`); await page.waitForTimeout(400); }
        const p = await page.evaluate(PROBE_SRC);
        const lines = trapLines(p);
        console.log(`${route}\t${w}x${height}\tHTTP ${res ? res.status() : "?"}\t${lines.length} finding(s)`);
        for (const l of lines) { console.log(`${route}\t${w}x${height}\t${l}`); found++; }
      } catch (e) { console.error(`probe: ${route} at ${w}: ${String(e.message).split("\n")[0]}`); process.exitCode = 2; }
      await ctx.close();
    }
    await launched.browser.close();
  }
  console.log(`probe: ${found} finding(s)`);
  console.log(`Coverage: 6 traps (button-label-wrap, surface-matches-parent, narrow-hidden-nav, overlay-no-max-height, reduced-motion-ignored, text-measure) on ${where}. ${NOT}`);
  if (process.exitCode !== 2) process.exitCode = found ? 1 : 0;
}
