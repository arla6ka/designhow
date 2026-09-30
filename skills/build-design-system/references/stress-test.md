# Stress test

The break-it pass at the end of phase 4, after a family's checks pass and before its specs close. `rule-method.md` grows one dimension at a time to set a limit. This page throws hostile data, input and widths at every primitive at once to find what the specs missed. Add rows for your product's own hostile data, such as currency formats or very long record names.

Contents

- Who runs it
- The script
- What stays by hand
- By family
- Output

## Who runs it

One worker per family group, side by side under the machine budget (`coordinator-path.md`, Machine budget), on a dev-only stress page per family under the showcase root, such as `/system/stress/<family>`, which the coordinator creates first. Each worker owns its family's component files and tests, its showcase section and its specs, and fixes breakage and behavior, never the visual style. It adds one "Edge cases" specimen per component page, before the in-context example, from the shared fixtures file.

## The script

`stress.mjs` renders each route in every mode below and reports what breaks, so these never go on a checklist:

```sh
node <skills>/build-design-system/scripts/stress.mjs --base http://localhost:3000 --routes .design-system/review/surfaces.tsv --out .design-system/stress --root /abs/repo
```

| Mode | Condition |
|---|---|
| `narrow` | 320px wide |
| `text-zoom` | 200% text |
| `text-spacing` | WCAG 1.4.12 text spacing at 320px |
| `forced-colors` | `forced-colors: active` |
| `rtl` | `dir="rtl"` on the root |
| `reduced-motion` | `prefers-reduced-motion: reduce` |
| `long-text` | every text node doubled, plus a 36-character unbroken word, at 320px |

Its findings, one JSON line each in `findings.jsonl`, deduped by signature: `stress/overflow-x` (the page scrolls sideways), `stress/clipped-text` (text cut off with no ellipsis or clamp), `stress/overlap` (two controls whose boxes cross), `stress/target-size` (a control under 24x24px too close to another, WCAG 2.5.8) and `stress/console-error`. The wide modes run at `--width`, default 1280. For each width where the layout switches, such as 768 or 900 where a sidebar opens, rerun with `--modes reduced-motion --width <w>`, the mode closest to the shipped page. Exit 1 on any finding. `--help` has the rest.

## What stays by hand

The script cannot enter data, drive input or judge a state. Run these on the stress page in each theme the app ships, at the narrowest width and the widths where the layout switches.

Content
- [ ] Empty, one character, whitespace only
- [ ] 120, 300 and 2,000 characters, and long strings with no spaces: URLs, hashes, emails, IDs
- [ ] Emoji, mixed scripts, and text that looks like markup
- [ ] Numbers at 0, negative, fractions, many decimals, very large, above the max, and missing
- [ ] Dates that are invalid, far past, far future and now
- [ ] Multi-line text pasted into a single-line field

Quantity
- [ ] 0, 1 and 500 options or items, 40 selected chips, 25 tabs, 12 breadcrumbs, 5,000 rows, 40 columns
- [ ] 50 toasts in one second, and the same toast replaced over and over
- [ ] Deep nesting, and one very long single line

State
- [ ] Disabled, invalid, read-only and pending at once
- [ ] Disabled with a reason: focusable, not activatable, the reason reachable by keyboard
- [ ] Pending keeps the label and the box, and a second press is blocked (`component-contract.md`, Variants and states)
- [ ] A selected value missing from the options

Layout
- [ ] Containers of 120 and 160 px
- [ ] Anything that floats opened at each viewport edge and inside a scrolled container: it flips, caps its height and never clips
- [ ] No layout shift when an error or a loader appears, unless the spec says it may

Interaction
- [ ] Keyboard only: Tab, Shift+Tab, Enter, Space, the arrows, Home, End, Escape
- [ ] Focus trap, focus return and scroll lock, one overlay opened from another, and a toast fired from a dialog that stays clickable
- [ ] Rapid clicks, rapid toggling, double submit, and typing during input composition
- [ ] Clipboard denied, and slow or broken images

Visual
- [ ] The focus ring visible on every surface level, in both themes and under `forced-colors`
- [ ] Icons measured against their text or their box (`browser.md`, Measuring optical alignment)
- [ ] Color never the only signal

## By family

On top of the checklist, each family has its own weak points.

| Family | Also try |
|---|---|
| Actions | A label past the button's width at 360, an icon-only button with no name, a link and a button side by side, a pending button in a toolbar row |
| Text entry | A value longer than the field, paste into a field with a max length, an error that appears while typing, autofill in both themes |
| Choice | A selected option that was removed, an async list that fails, an option label longer than the popup, 500 options on a phone |
| Overlays | A dialog taller than a 320 px screen, a sheet opened at 360, Escape while a submit is pending, focus when the opener is gone |
| Feedback | A toast with a 300-character message, a status that changes twice in one second, a live region inside a hidden panel |
| Navigation | 12 nav items at 900, the current item hidden past the edge, a breadcrumb of 10 levels at 360 |
| Data | A table of 40 columns at 768, a cell with a hash and no spaces, an empty table, a row whose action menu opens at the bottom edge |

## Output

Each worker reports, under 300 words: the `stress.mjs` findings before and after with its exit code, the breaks it fixed, by file, with before and after numbers; the breaks it found and did not fix, and why; each new Limits rule with the measured break and its evidence path (`rule-method.md`, Limits by measurement); any shared-file change it needs; and its test, lint, formatter and typecheck results. The coordinator turns every open break into a component fix, a Limits rule or a gate.
