// optical.js: list icons whose ink sits off center, for trap/icon-optical-size and
// trap/icon-optical-align (references/browser.md, Measuring optical alignment).
// Runs in the page, not in Node:
//   agent-browser --session ds-1 eval --stdin < <skills>/build-design-system/scripts/optical.js
//   await page.evaluate(readFileSync("<skills>/build-design-system/scripts/optical.js", "utf8"))
// Each row: page, icon ink height, vsBox (ink center minus host box center, px) and, beside
// text, the label, its cap height and vsCap (ink center minus cap-height center, px).
// Returns only rows off by more than 0.5px, or whose ink stands over 2px taller than the cap.
(() => {
  const rows = [];
  for (const svg of document.querySelectorAll("main svg")) {
    const host = svg.closest("button, a, label, li, [role=option], [role=menuitem], [role=tab]") || svg.parentElement;
    const ink = (svg.querySelector("path") || svg).getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const text = [...host.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()) || host.querySelector("span");
    const row = { page: location.pathname, icon: Math.round(ink.height), vsBox: +(ink.top + ink.height / 2 - (box.top + box.height / 2)).toFixed(2) };
    if (text) {
      const r = document.createRange(); r.selectNodeContents(text); const t = r.getBoundingClientRect();
      const cs = getComputedStyle(text.nodeType === 3 ? text.parentElement : text);
      const ctx = document.createElement("canvas").getContext("2d"); ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText("H"), capTop = t.top + (t.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent;
      Object.assign(row, { text: text.textContent.trim().slice(0, 24), cap: +m.actualBoundingBoxAscent.toFixed(1), vsCap: +(ink.top + ink.height / 2 - (capTop + m.actualBoundingBoxAscent / 2)).toFixed(2) });
    }
    rows.push(row);
  }
  return rows.filter((r) => Math.abs(r.vsCap ?? r.vsBox) > 0.5 || (r.cap && r.icon > r.cap + 2));
})();
