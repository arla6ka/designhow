// state-timeline.js: record one control's computed border, outline, shadow, fill, transform and opacity every frame
// through hover, keyboard focus, press, open, close, Escape and a click outside, and report the state-order traps in
// references/traps.md: trap/hover-beats-focus, trap/disabled-still-hovers, trap/open-trigger-unfocused,
// trap/overlay-focus-return, trap/disabled-drops-focus and trap/press-delayed (references/browser.md, Measuring state
// order). It also counts dropped frames during every motion it records and reports trap/motion-jank (Measuring motion), and with
// --drag it drags the target and reports trap/motion-input-lag when the dragged element trails the pointer.
//
// Two ways to run it:
//   node <skills>/build-design-system/scripts/state-timeline.js --base <url> --route <path> --target <css> [options]
//     drives real pointer and keyboard input through Playwright and prints one line per finding. --help for options.
//   In the page, when another tool drives the input:
//     agent-browser --session ds-1 eval --stdin < <skills>/build-design-system/scripts/state-timeline.js
//     agent-browser --session ds-1 eval "__dsTimeline.start('#trigger', { open: '[role=menu]', instant: 100, drag: '#thumb' })"
//     ...hover, press Tab, click, press Escape, click outside with the tool's own commands...
//     agent-browser --session ds-1 eval "__dsTimeline.stop()"
// Hover and animation frames only run in a tab at the front. A recording from a background tab says so on its
// Coverage line, and its hover results do not count.
(() => {
  // Everything below PAGE runs in the page. It must stay self-contained: the Node driver sends it as source.
  const PAGE = () => {
    const ringOf = (s) => [s.borderTopColor, s.borderTopWidth, s.borderRightColor, s.borderBottomColor, s.borderLeftColor,
      s.outlineStyle === "none" ? "outline none" : `outline ${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`, s.boxShadow].join(" | ");
    const fillOf = (s) => [s.backgroundColor, s.color, s.backgroundImage].join(" | ");
    const lookOf = (s) => [s.transform, s.opacity, s.scale, s.translate, s.filter].join(" | ");
    // A finite animation running anywhere on the page. Loops such as spinners never end, so they do not count.
    const moving = () => document.getAnimations().some((a) => { if (a.playState !== "running") return false; const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {}; return t.iterations !== Infinity && t.activeDuration !== Infinity; });
    const T = (window.__dsTimeline = window.__dsTimeline || {});
    T.start = (sel, o = {}) => {
      const el = document.querySelector(sel);
      if (!el) return { error: `no element matches ${sel}` };
      if (T._st) T._st.off();
      const st = { sel, el, openSel: o.open || null, instant: Number(o.instant) || null, dragEl: o.drag ? document.querySelector(o.drag) : null, frames: [], events: [], ticks: [], drag: [], t0: performance.now(), count: 0, down: false, px: null, py: null };
      if (o.drag && !st.dragEl) return { error: `no element matches ${o.drag}` };
      const popup = () => (st.openSel ? document.querySelector(st.openSel) : null);
      const isOpen = () => {
        const p = popup();
        if (st.openSel) { if (!p) return false; const r = p.getBoundingClientRect(), cs = getComputedStyle(p); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; }
        const e = el.getAttribute("aria-expanded");
        return e != null ? e === "true" : el.getAttribute("data-state") === "open";
      };
      const pseudo = (p) => { const s = getComputedStyle(el, p); return s.content === "none" || s.content === "normal" ? "" : ` ${p} ${ringOf(s)}`; };
      let last = "";
      const sample = () => {
        st.count++;
        const s = getComputedStyle(el), a = document.activeElement;
        const f = { hover: el.matches(":hover"), focus: el.matches(":focus-visible"), active: a === el, press: el.matches(":active"), open: isOpen(),
          disabled: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true", ring: ringOf(s) + pseudo("::before") + pseudo("::after"), fill: fillOf(s), look: lookOf(s),
          body: !a || a === document.body || a === document.documentElement, hidden: document.visibilityState === "hidden" };
        const k = JSON.stringify(f);
        const now = performance.now();
        if (k !== last) { last = k; st.frames.push({ t: +(now - st.t0).toFixed(1), ...f }); }
        // Every frame's time, and whether anything moved, for the jank count. A drag in progress counts as motion.
        st.ticks.push([+(now - st.t0).toFixed(2), moving() || (st.down && !!st.dragEl), f.hidden]);
        // During a drag, read the dragged element after this frame paints, beside the pointer it should follow.
        if (st.down && st.dragEl && st.px !== null) setTimeout(() => { const r = st.dragEl.getBoundingClientRect(); st.drag.push({ t: +(performance.now() - st.t0).toFixed(1), px: st.px, py: st.py, ex: r.left, ey: r.top }); }, 0);
        st.raf = requestAnimationFrame(sample);
      };
      const log = (e) => {
        const p = popup();
        st.events.push({ t: +(performance.now() - st.t0).toFixed(1), type: e.type, key: e.key || null, on: el.contains(e.target) ? "target" : p && p.contains(e.target) ? "popup" : "outside" });
      };
      const types = ["pointerdown", "pointerup", "keydown"];
      for (const t of types) document.addEventListener(t, log, true);
      const track = (e) => {
        if (e.type === "pointerdown") { st.down = true; st.px = e.clientX; st.py = e.clientY; if (st.dragEl) { const r = st.dragEl.getBoundingClientRect(); st.drag.push({ t: +(performance.now() - st.t0).toFixed(1), px: e.clientX, py: e.clientY, ex: r.left, ey: r.top, start: true }); } }
        else if (e.type === "pointerup" || e.type === "pointercancel") st.down = false;
        else { st.px = e.clientX; st.py = e.clientY; }
      };
      const moves = ["pointerdown", "pointermove", "pointerup", "pointercancel"];
      for (const t of moves) window.addEventListener(t, track, true);
      st.off = () => { cancelAnimationFrame(st.raf); for (const t of types) document.removeEventListener(t, log, true); for (const t of moves) window.removeEventListener(t, track, true); };
      T._st = st;
      sample();
      return `recording ${sel}`;
    };
    // A point on the page that no control, the target or its popup covers, for a pointer that must be away or a
    // click outside that must not trigger anything.
    T.away = () => {
      const st = T._st, p = st && st.openSel ? document.querySelector(st.openSel) : null;
      for (let y = innerHeight - 4; y > 4; y -= 16) for (let x = 4; x < innerWidth - 4; x += 16) {
        const e = document.elementFromPoint(x, y);
        if (!e || e.closest("a,button,input,select,textarea,label,summary,[role],[tabindex],[onclick],[contenteditable]")) continue;
        if (st && (st.el.contains(e) || (p && p.contains(e)))) continue;
        return [x, y];
      }
      return [1, 1];
    };
    T.stop = () => {
      const st = T._st;
      if (!st) return { error: "not recording: call __dsTimeline.start(selector) first" };
      st.off(); T._st = null;
      const F = st.frames, E = st.events;
      // Settled look per state: the last recorded frame of the last stretch in that state.
      const key = (f) => [f.hover, f.focus, f.press, f.open, f.disabled].join();
      const runs = [];
      for (const f of F) { const r = runs[runs.length - 1]; if (r && r.k === key(f)) { r.f = f; } else runs.push({ k: key(f), first: f, f }); }
      const pick = (pred) => { const m = runs.filter((r) => pred(r.f)); return m.length ? m[m.length - 1].f : null; };
      const rest = pick((f) => !f.hover && !f.focus && !f.open && !f.press && !f.disabled);
      const hover = pick((f) => f.hover && !f.focus && !f.open && !f.press && !f.disabled);
      const focus = pick((f) => f.focus && !f.hover && !f.open && !f.press && !f.disabled);
      const both = pick((f) => f.focus && f.hover && !f.open && !f.press && !f.disabled);
      const openAway = pick((f) => f.open && !f.hover && !f.press);
      // Disabled with and without hover, compared at the same focus state so a focus ring does not count as hover.
      const dHover = pick((f) => f.disabled && f.hover && !f.press);
      const dRest = pick((f) => f.disabled && !f.hover && !f.press && (!dHover || f.focus === dHover.focus));
      const findings = [], notes = [];
      const add = (trap, text) => findings.push({ trap, text });
      if (focus && both && both.ring !== focus.ring) add("trap/hover-beats-focus", `hover changes the focus look: focused "${focus.ring}", focused and hovered "${both.ring}"`);
      if (dRest && dHover && (dHover.ring !== dRest.ring || dHover.fill !== dRest.fill)) add("trap/disabled-still-hovers", `disabled and hovered "${dHover.fill} / ${dHover.ring}" differs from disabled "${dRest.fill} / ${dRest.ring}"`);
      if (openAway && rest && openAway.ring === rest.ring) add("trap/open-trigger-unfocused", `open with the pointer away, the trigger's border, outline and shadow equal its rest look "${rest.ring}"`);
      // Where focus sits once the page settles after each close, and after the control turns disabled.
      const settledAfter = (i) => { const next = E.find((e) => e.t > F[i].t); const lim = next ? next.t : Infinity; let j = i; while (j + 1 < F.length && F[j + 1].t < lim) j++; return F[j]; };
      for (let i = 1; i < F.length; i++) {
        const was = F[i - 1], f = F[i];
        if (was.open && !f.open) {
          const cause = [...E].reverse().find((e) => e.t <= f.t && (e.type === "keydown" || e.type === "pointerdown"));
          if (!cause || (cause.type === "pointerdown" && cause.on !== "target")) continue;
          const how = cause.type === "keydown" ? `${cause.key} key` : "a press on the trigger";
          if (settledAfter(i).body) add("trap/overlay-focus-return", `closed by ${how} at ${f.t}ms, and focus fell to the page body`);
        }
        if (!was.disabled && f.disabled && (was.active || f.active) && settledAfter(i).body) add("trap/disabled-drops-focus", `turned disabled at ${f.t}ms while focused, and focus fell to the page body`);
      }
      // Timing: how long each press takes to show, and how long each state takes to settle. Press feedback is any
      // change of border, outline, shadow, fill, transform, opacity or open state between pointer down and release.
      // It must start within 100ms, and settle within the instant preset when one is given.
      const timing = [];
      const PRESS_MS = 100;
      for (const e of E.filter((x) => x.type === "pointerdown" && x.on === "target")) {
        const up = E.find((x) => x.t > e.t && x.type === "pointerup"), end = up ? up.t : Infinity;
        const before = [...F].reverse().find((f) => f.t <= e.t);
        if (!before || before.disabled) continue;
        const moved = F.filter((f) => f.t > e.t && f.t <= end && (f.ring !== before.ring || f.fill !== before.fill || f.look !== before.look || f.open !== before.open));
        const held = Math.round((up ? up.t : F[F.length - 1].t) - e.t);
        if (!moved.length) { timing.push("press shows no change before release"); if (held > PRESS_MS) add("trap/press-delayed", `no visible change in the ${held}ms between pointer down and release`); continue; }
        const first = Math.round(moved[0].t - e.t), last = Math.round(moved[moved.length - 1].t - e.t);
        timing.push(`press starts ${first}ms after pointer down and settles at ${last}ms`);
        if (first > PRESS_MS) add("trap/press-delayed", `the first visible change comes ${first}ms after pointer down, past ${PRESS_MS}ms`);
        else if (st.instant && last > st.instant + 20) add("trap/press-delayed", `the press settles ${last}ms after pointer down, longer than the instant preset's ${st.instant}ms`);
      }
      // Jank: a frame whose gap is over 1.5 times the median rAF interval at rest is dropped. Each motion (a stretch of
      // frames with a finite animation running, or a drag) reports dropped/total and its longest gap.
      const TK = st.ticks.filter((x) => !x[2]);
      const gaps = TK.slice(1).map((x, i) => [x[0] - TK[i][0], x[1] || TK[i][1]]);
      const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
      const restGap = med(gaps.filter((g) => !g[1]).map((g) => g[0])) || med(gaps.map((g) => g[0]));
      const motions = [];
      for (let i = 1; i < TK.length; i++) {
        if (!TK[i][1]) continue;
        let j = i; while (j + 1 < TK.length && TK[j + 1][1]) j++;
        const g = TK.slice(i, j + 1).map((x, k) => x[0] - TK[i + k - 1][0]);
        const ms = Math.round(TK[j][0] - TK[i - 1][0]), dropped = g.filter((x) => x > restGap * 1.5).length;
        motions.push({ at: Math.round(TK[i - 1][0]), ms, dropped, total: g.length, longest: Math.round(Math.max(...g)) });
        i = j;
      }
      for (const m of motions) {
        timing.push(`motion at ${m.at}ms for ${m.ms}ms: ${m.dropped}/${m.total} frames dropped, longest gap ${m.longest}ms (rest interval ${restGap.toFixed(1)}ms)`);
        if (restGap && ((m.ms < 300 && m.dropped > 1) || (m.ms >= 300 && m.dropped / m.total > 0.05))) add("trap/motion-jank", `motion at ${m.at}ms for ${m.ms}ms drops ${m.dropped}/${m.total} frames, longest gap ${m.longest}ms, against a ${restGap.toFixed(1)}ms frame at rest`);
      }
      // Input lag: during a drag, how many frames the dragged element trails the pointer on the drag's axis.
      if (st.dragEl) {
        const D = st.drag, s0 = D.find((d) => d.start);
        const lags = [];
        let moved = false;
        if (s0) for (let i = D.indexOf(s0) + 1; i < D.length; i++) {
          const d = D[i], prev = D[i - 1];
          const ax = Math.abs(d.px - s0.px) >= Math.abs(d.py - s0.py) ? "x" : "y";
          const p = ax === "x" ? d.px - s0.px : d.py - s0.py, e2 = ax === "x" ? d.ex - s0.ex : d.ey - s0.ey;
          const step = Math.abs(ax === "x" ? d.px - prev.px : d.py - prev.py);
          if (Math.abs(e2) > 0.5) moved = true;
          if (step > 0.5 && Math.abs(p) > 0.5) lags.push(Math.abs(p - e2) / step);
        }
        const lag = med(lags);
        if (!s0 || !lags.length) notes.push("drag: no pointer movement recorded on the target");
        else if (!moved) notes.push("drag: the dragged element did not move, so it is not a drag target");
        else {
          timing.push(`drag: the element trails the pointer by ${lag.toFixed(2)} frames (median of ${lags.length})`);
          if (lag >= 1) add("trap/motion-input-lag", `the dragged element trails the pointer by ${lag.toFixed(1)} frames, median of ${lags.length} frames`);
        }
      }
      const settle = new Map();
      for (const r of runs) {
        const ms = Math.round(r.f.t - r.first.t), name = r.k.split(",").map((v, i) => (v === "true" ? ["hover", "focus", "press", "open", "disabled"][i] : "")).filter(Boolean).join("+") || "rest";
        if (ms > 0) settle.set(name, Math.max(ms, settle.get(name) || 0));
      }
      for (const [name, ms] of settle) timing.push(`${name} settles over ${ms}ms at most`);
      const seen = { rest, hover, focus, "focus+hover": both, "open, pointer away": openAway, disabled: dRest, "disabled+hover": dHover };
      const hidden = F.filter((f) => f.hidden).length;
      const closes = F.filter((f, i) => i && F[i - 1].open && !f.open).length;
      if (hidden) notes.push(`page hidden in ${hidden} recorded frames: hover not verified, rerun in a tab at the front`);
      const miss = Object.keys(seen).filter((k) => !seen[k]);
      const coverage = `Coverage: ${st.count} frames of ${st.sel}, ${F.length} changes, ${E.length} input events, ${closes} close(s), ${motions.length} motion(s)${st.dragEl ? `, ${st.drag.length} drag samples` : ""}. States seen: ${Object.keys(seen).filter((k) => seen[k]).join(", ") || "none"}. Not reached: ${miss.join(", ") || "none"}. Not measured: descendants of the target, exit-eats-input, escape-nested, looping animations in the jank count, motion driven from script outside a drag, and any look outside border, outline, shadow, fill, text color, transform, opacity and filter${st.instant ? "" : ", the instant preset's length (pass --instant <ms>)"}${hidden ? ". Hover not verified (background tab)" : ""}`;
      return { target: st.sel, findings, timing: [...new Set(timing)], notes, frames: F, events: E, coverage };
    };
    return "state-timeline: call __dsTimeline.start(selector, { open: popupSelector }), drive the input, then __dsTimeline.stop()";
  };
  if (typeof window !== "undefined" && typeof document !== "undefined") return PAGE();

  // Node: drive real input through Playwright.
  const HELP = `state-timeline.js: record one control's look every frame through hover, focus, press, open,
close, Escape and a click outside, and report the state-order traps

Usage:
  node scripts/state-timeline.js --base <url> --route <path> --target <css> [--open <css>] [options]
  node scripts/state-timeline.js --self-test [--fixtures <dir>] [--root <dir>]

  --target <css>     the control to record, such as a menu trigger or a submit button
  --open <css>       the element that is visible while the control is open. Default: the
                     target's aria-expanded, else its data-state="open"
  --instant <ms>     the instant motion preset's duration. A press that settles later
                     is trap/press-delayed. Without it only the 100ms start is checked
  --drag <css>       drag instead: press the target, move the pointer 12 steps of
                     10px, one per frame, and release. <css> is the element that
                     should follow the pointer, such as a slider thumb or the sheet
  --width 1280       viewport width
  --height 800       viewport height
  --theme light      light or dark, through prefers-color-scheme
  --json <file>      also write the frames, input events and findings as JSON
  --root <dir>       the app's repo root, where Playwright is looked for first.
                     Default: the git root of the current folder

The sequence: pointer away, hover, keyboard focus while hovered, pointer away,
blur, press and release (open), pointer away, press the trigger (close), open
and press Escape, open and click outside on an empty point. Reduced motion is
off so eased changes show. Each step waits for the page's finite animations.
With --drag the sequence is the drag alone.

Findings, one line each (trap id, target, measurement):
  trap/hover-beats-focus        hover changes the border, outline or shadow of a
                                focused control
  trap/disabled-still-hovers    a disabled control changes its look on hover
  trap/open-trigger-unfocused   an open trigger, pointer away, looks like it does at rest
  trap/overlay-focus-return     focus falls to the page body after Escape or a
                                press on the trigger closes the popup
  trap/disabled-drops-focus     a focused control turns disabled and focus falls
                                to the page body
  trap/press-delayed            a press shows its first visible change (border,
                                outline, shadow, fill, transform, opacity or open
                                state) more than 100ms after pointer down, shows
                                none before release, or settles later than --instant
  trap/motion-input-lag         with --drag, the element trails the pointer by one
                                frame or more (median over the drag)
  trap/motion-jank              a motion (a finite animation running, or a drag)
                                under 300ms drops more than 1 frame, or a longer one
                                more than 5%. A frame is dropped when its gap is over
                                1.5 times the median rAF interval at rest
Also prints timing lines (press start and settle, each motion's dropped/total
frames and longest gap, drag lag, how long each state settles) and a Coverage
line last. Throttle the CPU yourself for jank and state the rate; the script
runs at the machine's speed.

Exit 0 when nothing is found, 1 on any finding, 2 on bad input or no browser.`;
  const SETTLE = `new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => {
    const fin = document.getAnimations().filter((a) => { const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {}; return t.iterations !== Infinity; }).map((a) => a.finished.catch(() => {}));
    Promise.race([Promise.all(fin), new Promise((r) => setTimeout(r, 2000))]).then(() => requestAnimationFrame(() => setTimeout(ok, 30)));
  })))`;

  async function drive(page, target, open, o = {}) {
    await page.evaluate(`(${PAGE})()`);
    const started = await page.evaluate(([s, op, x]) => window.__dsTimeline.start(s, { open: op, instant: x.instant, drag: x.drag }), [target, open || null, o]);
    if (started && started.error) return started;
    const settle = () => page.evaluate(SETTLE);
    const center = async () => { const b = await page.locator(target).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const away = async () => { const [x, y] = await page.evaluate(() => window.__dsTimeline.away()); await page.mouse.move(x, y); await settle(); };
    const hoverIt = async () => { const [x, y] = await center(); await page.mouse.move(x, y); await settle(); };
    // The press is held past the 100ms feedback limit, so a missing press state shows.
    const press = async () => { await hoverIt(); await page.mouse.down(); await Promise.all([settle(), page.waitForTimeout(160)]); await page.mouse.up(); await settle(); };
    if (o.drag) {
      const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
      await away();
      const [x, y] = await center();
      await page.mouse.move(x, y); await settle();
      await page.mouse.down(); await frame();
      for (let i = 1; i <= 12; i++) { await page.mouse.move(x + 10 * i, y); await frame(); }
      await frame(); await page.mouse.up(); await settle();
      return page.evaluate(() => window.__dsTimeline.stop());
    }
    await away();
    await hoverIt();
    // Tab first, so the focus call that follows counts as keyboard focus and matches :focus-visible.
    await page.keyboard.press("Tab"); await page.evaluate((s) => document.querySelector(s).focus(), target); await settle();
    await away();
    await page.evaluate((s) => document.querySelector(s).blur(), target); await settle();
    await press(); await away();
    await press(); await away();
    await press(); await page.keyboard.press("Escape"); await settle();
    await press();
    const [x, y] = await page.evaluate(() => window.__dsTimeline.away());
    await page.mouse.click(x, y); await settle();
    return page.evaluate(() => window.__dsTimeline.stop());
  }
  const lines = (r) => [...r.findings.map((f) => `${f.trap}\t${r.target}\t${f.text}`), ...r.timing.map((t) => `timing\t${r.target}\t${t}`), ...r.notes.map((n) => `note\t${r.target}\t${n}`)];

  (async () => {
    const { existsSync, readFileSync, readdirSync, writeFileSync } = await import("node:fs");
    const { dirname, join, resolve } = await import("node:path");
    const { pathToFileURL } = await import("node:url");
    const here = dirname(resolve(process.argv[1]));
    const { launchChromium, repoRoot } = await import(pathToFileURL(join(here, "find-chromium.mjs")).href);
    const argv = process.argv.slice(2);
    if (!argv.length || argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(argv.length ? 0 : 2); }
    const KNOWN = ["--base", "--route", "--target", "--open", "--instant", "--drag", "--width", "--height", "--theme", "--json", "--root", "--self-test", "--fixtures"];
    const bad = argv.filter((a) => a.startsWith("--") && !KNOWN.includes(a));
    if (bad.length) { console.error(`state-timeline: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
    const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
    const launched = await launchChromium({}, { root: repoRoot(val("--root")) });
    if (launched.error) { console.error(`state-timeline: ${launched.error}`); process.exit(2); }
    const browser = launched.browser;
    const width = Number(val("--width", "1280")), height = Number(val("--height", "800"));
    if (!width || !height) { console.error("state-timeline: --width and --height take numbers"); process.exit(2); }

    if (argv.includes("--self-test")) {
      // Each fixtures/state-timeline/<case>/ holds case.json ({ "target", "open", "instant", "drag", "expect" }), fail.html and pass.html.
      // fail.html must report the expected trap, and pass.html no trap at all.
      const own = [join(here, "fixtures", "state-timeline"), join(here, "..", "fixtures", "state-timeline")].find(existsSync);
      const dir = val("--fixtures") ? resolve(val("--fixtures")) : own;
      if (!dir || !existsSync(dir)) { console.error(`state-timeline: no fixtures at ${dir || join(here, "..", "fixtures", "state-timeline")}`); process.exit(2); }
      let ok = true, n = 0;
      for (const c of readdirSync(dir).sort()) {
        if (!existsSync(join(dir, c, "case.json"))) continue;
        const spec = JSON.parse(readFileSync(join(dir, c, "case.json"), "utf8"));
        for (const kind of ["fail", "pass"]) {
          const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
          const page = await ctx.newPage();
          let traps = [], err = "";
          try {
            await page.goto(pathToFileURL(join(dir, c, `${kind}.html`)).href, { waitUntil: "load" });
            const r = await drive(page, spec.target, spec.open, { instant: spec.instant, drag: spec.drag });
            if (r.error) err = r.error; else traps = r.findings.map((f) => f.trap);
          } catch (e) { err = String(e.message).split("\n")[0]; }
          await ctx.close();
          const good = !err && (kind === "fail" ? traps.includes(spec.expect) : traps.length === 0);
          if (!good) ok = false; n++;
          console.log(`self-test ${good ? "ok  " : "FAIL"} ${c} ${kind}: ${err || (traps.join(", ") || "no finding")}${kind === "fail" ? `, want ${spec.expect}` : ", want none"}`);
        }
      }
      await browser.close();
      console.log(`self-test: ${n} fixtures, ${ok ? "all as expected" : "FAILED"}`);
      process.exit(ok ? 0 : 1);
    }

    const base = val("--base"), route = val("--route"), target = val("--target");
    if (!base || !/^https?:\/\//.test(base) || !route || !target) { console.error(`state-timeline: --base <url>, --route <path> and --target <css> are required\n\n${HELP}`); await browser.close(); process.exit(2); }
    const theme = val("--theme", "light");
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme === "dark" ? "dark" : "light", reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    let r;
    try {
      await page.goto(new URL(route, base).href, { waitUntil: "load" });
      await page.evaluate("document.fonts.ready");
      const instant = val("--instant") ? Number(val("--instant")) : undefined;
      if (val("--instant") && !(instant > 0)) { console.error("state-timeline: --instant takes a number of ms"); await browser.close(); process.exit(2); }
      r = await drive(page, target, val("--open"), { instant, drag: val("--drag") });
    } catch (e) { console.error(`state-timeline: ${route}: ${String(e.message).split("\n")[0]}`); await browser.close(); process.exit(2); }
    await browser.close();
    if (r.error) { console.error(`state-timeline: ${r.error} on ${route}`); process.exit(2); }
    for (const l of lines(r)) console.log(l);
    if (val("--json")) writeFileSync(resolve(val("--json")), JSON.stringify({ route, width, height, theme, ...r }, null, 1) + "\n");
    console.log(`${r.coverage}. Route ${route} at ${width}x${height}, ${theme}`);
    process.exit(r.findings.length ? 1 : 0);
  })();
})();
