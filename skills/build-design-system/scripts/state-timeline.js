// state-timeline.js: record one control's computed border, outline and shadow every frame through hover, keyboard
// focus, press, open, close, Escape and a click outside, and report the state-order traps in references/traps.md:
// trap/hover-beats-focus, trap/disabled-still-hovers, trap/open-trigger-unfocused, trap/overlay-focus-return and
// trap/disabled-drops-focus (references/browser.md, Measuring state order).
//
// Two ways to run it:
//   node <skills>/build-design-system/scripts/state-timeline.js --base <url> --route <path> --target <css> [options]
//     drives real pointer and keyboard input through Playwright and prints one line per finding. --help for options.
//   In the page, when another tool drives the input:
//     agent-browser --session ds-1 eval --stdin < <skills>/build-design-system/scripts/state-timeline.js
//     agent-browser --session ds-1 eval "__dsTimeline.start('#trigger', { open: '[role=menu]' })"
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
    const T = (window.__dsTimeline = window.__dsTimeline || {});
    T.start = (sel, o = {}) => {
      const el = document.querySelector(sel);
      if (!el) return { error: `no element matches ${sel}` };
      if (T._st) T._st.off();
      const st = { sel, el, openSel: o.open || null, frames: [], events: [], t0: performance.now(), count: 0 };
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
          disabled: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true", ring: ringOf(s) + pseudo("::before") + pseudo("::after"), fill: fillOf(s),
          body: !a || a === document.body || a === document.documentElement, hidden: document.visibilityState === "hidden" };
        const k = JSON.stringify(f);
        if (k !== last) { last = k; st.frames.push({ t: +(performance.now() - st.t0).toFixed(1), ...f }); }
        st.raf = requestAnimationFrame(sample);
      };
      const log = (e) => {
        const p = popup();
        st.events.push({ t: +(performance.now() - st.t0).toFixed(1), type: e.type, key: e.key || null, on: el.contains(e.target) ? "target" : p && p.contains(e.target) ? "popup" : "outside" });
      };
      const types = ["pointerdown", "pointerup", "keydown"];
      for (const t of types) document.addEventListener(t, log, true);
      st.off = () => { cancelAnimationFrame(st.raf); for (const t of types) document.removeEventListener(t, log, true); };
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
      // Timing: how long each press takes to show, and how long each state takes to settle.
      const timing = [];
      for (const e of E.filter((x) => x.type === "pointerdown" && x.on === "target")) {
        // Only changes before the release count as press feedback.
        const up = E.find((x) => x.t > e.t && x.type === "pointerup"), end = up ? up.t : Infinity;
        const before = [...F].reverse().find((f) => f.t <= e.t);
        const moved = F.filter((f) => f.t > e.t && f.t <= end && before && (f.ring !== before.ring || f.fill !== before.fill));
        timing.push(moved.length ? `press starts ${Math.round(moved[0].t - e.t)}ms after pointer down and settles at ${Math.round(moved[moved.length - 1].t - e.t)}ms` : "press shows no change before release");
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
      const coverage = `Coverage: ${st.count} frames of ${st.sel}, ${F.length} changes, ${E.length} input events, ${closes} close(s). States seen: ${Object.keys(seen).filter((k) => seen[k]).join(", ") || "none"}. Not reached: ${miss.join(", ") || "none"}. Not measured: descendants of the target, exit-eats-input, escape-nested, and any look outside border, outline, shadow, background and text color${hidden ? ". Hover not verified (background tab)" : ""}`;
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

Findings, one line each (trap id, target, measurement):
  trap/hover-beats-focus        hover changes the border, outline or shadow of a
                                focused control
  trap/disabled-still-hovers    a disabled control changes its look on hover
  trap/open-trigger-unfocused   an open trigger, pointer away, looks like it does at rest
  trap/overlay-focus-return     focus falls to the page body after Escape or a
                                press on the trigger closes the popup
  trap/disabled-drops-focus     a focused control turns disabled and focus falls
                                to the page body
Also prints timing lines (how long a press takes to show, how long each state
settles) and a Coverage line last.

Exit 0 when nothing is found, 1 on any finding, 2 on bad input or no browser.`;
  const SETTLE = `new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => {
    const fin = document.getAnimations().filter((a) => { const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {}; return t.iterations !== Infinity; }).map((a) => a.finished.catch(() => {}));
    Promise.race([Promise.all(fin), new Promise((r) => setTimeout(r, 2000))]).then(() => requestAnimationFrame(() => setTimeout(ok, 30)));
  })))`;

  async function drive(page, target, open) {
    await page.evaluate(`(${PAGE})()`);
    const started = await page.evaluate(([s, o]) => window.__dsTimeline.start(s, { open: o }), [target, open || null]);
    if (started && started.error) return started;
    const settle = () => page.evaluate(SETTLE);
    const center = async () => { const b = await page.locator(target).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const away = async () => { const [x, y] = await page.evaluate(() => window.__dsTimeline.away()); await page.mouse.move(x, y); await settle(); };
    const hoverIt = async () => { const [x, y] = await center(); await page.mouse.move(x, y); await settle(); };
    const press = async () => { await hoverIt(); await page.mouse.down(); await settle(); await page.mouse.up(); await settle(); };
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
    const KNOWN = ["--base", "--route", "--target", "--open", "--width", "--height", "--theme", "--json", "--root", "--self-test", "--fixtures"];
    const bad = argv.filter((a) => a.startsWith("--") && !KNOWN.includes(a));
    if (bad.length) { console.error(`state-timeline: unknown ${bad.join(", ")}\n\n${HELP}`); process.exit(2); }
    const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
    const launched = await launchChromium({}, { root: repoRoot(val("--root")) });
    if (launched.error) { console.error(`state-timeline: ${launched.error}`); process.exit(2); }
    const browser = launched.browser;
    const width = Number(val("--width", "1280")), height = Number(val("--height", "800"));
    if (!width || !height) { console.error("state-timeline: --width and --height take numbers"); process.exit(2); }

    if (argv.includes("--self-test")) {
      // Each fixtures/state-timeline/<case>/ holds case.json ({ "target", "open", "expect" }), fail.html and pass.html.
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
            const r = await drive(page, spec.target, spec.open);
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
      r = await drive(page, target, val("--open"));
    } catch (e) { console.error(`state-timeline: ${route}: ${String(e.message).split("\n")[0]}`); await browser.close(); process.exit(2); }
    await browser.close();
    if (r.error) { console.error(`state-timeline: ${r.error} on ${route}`); process.exit(2); }
    for (const l of lines(r)) console.log(l);
    if (val("--json")) writeFileSync(resolve(val("--json")), JSON.stringify({ route, width, height, theme, ...r }, null, 1) + "\n");
    console.log(`${r.coverage}. Route ${route} at ${width}x${height}, ${theme}`);
    process.exit(r.findings.length ? 1 : 0);
  })();
})();
