# Traps

> For the team setting this up: two parts. The first lists behavior traps that hold in any app, per component family, each with a stable ID. The second is a method for finding the visual habits that make this app look unfinished or generated, and turning each into a rule with the app's own evidence. It carries no list of visual preferences of its own, because a rule that holds in one product is taste in another. The person's stated bans are not imported taste. They go in as rules grounded in the person's words, and outrank the app's majority. Add behavior traps under their family. Retire one by marking it `retired` with the reason, so old citations still resolve.

Contents

- How IDs are used
- Adds-only accessibility changes
- Behavior traps by family
- Finding this app's visual slop
- Writing a derived rule
- Coverage gaps

## How IDs are used

Specs cite trap IDs on their `Traps checked:` line and answer each one in the section that applies. Reviews and worker reports cite them in findings. When the same trap shows up in two reports, it becomes a lint rule or check with the same ID, and the row names the check. Derived visual rules use `rule/<slug>` IDs and live in the app's own specs and foundation pages, not here.

## Adds-only accessibility changes

Every skill in this set sorts accessibility-tree changes by this one rule. On the run branch, a change that only adds semantics lands as a decision. Examples are an accessible name, a role on a custom control, `aria-current`, `aria-invalid` or `aria-describedby`, table semantics for tabular data, and a dialog's label. A change that removes, renames or restructures existing semantics is a gate. A review ranks an adds-only fix as a finding and hands every other tree change to a person.

## Behavior traps by family

Most are about what the user can do, not how it looks, so they hold everywhere. Where a row says "Measured", that measurement finds the trap and proves the fix (`browser.md`).

A trap outranks the app's majority. When a trap is the majority pattern, or a rule derived from copy or any other inventory conflicts with a trap's fix, the fix wins. The conflict becomes a gate whose default is the fix, with the count.

| ID | Family | Trap | What the spec must say |
|---|---|---|---|
| `trap/button-div` | Actions | A `div` or `span` with a click handler | Rendered on `button`, or `a` when it navigates. A native `<dialog>` may take the backdrop click when it also wires its cancel event (`checks.md`) |
| `trap/control-height` | Actions, Text entry, Choice | Buttons, inputs and selects that sit side by side at different heights | The one control height token they share at each size. Measured on the render, never read from source: `montage.mjs` fails a changed surface whose side-by-side controls differ by more than 1px |
| `trap/button-icon-name` | Actions | An icon-only button with no accessible name | Where the name comes from in every variant |
| `trap/icon-optical-size` | Actions, Text entry, Choice, Feedback | An icon reads bigger or heavier than the text or control beside it, often right after a switch from an outline set to a filled one, since filled glyphs fill their box | The icon size per control size, set so the glyph's ink is no taller than the label's cap height and about 60% of the control at most. Measured: the ink box of the rendered path against the label's cap height, per control size (`browser.md`, Measuring optical alignment). Rederived after any icon set change |
| `trap/icon-optical-align` | Actions, Text entry, Choice, Feedback, Navigation | An icon is centered by its box, not by what the eye sees, so it reads high or low. Or one global nudge meant for icons beside text also moves icons that sit alone in a box | Two contexts, two references. An icon beside text centers its ink on the label's cap height. An icon alone in its own box (icon button, chip remove, input slot, checkbox mark, select chevron) centers its ink on that box and gets no text lift. A glyph drawn off center (a side chevron, a check, a triangle) gets its own offset from its measured ink. Each correction is scoped to one context, never global. Measured per context, then decided on zoomed crops (`browser.md`, Measuring optical alignment) |
| `trap/button-type` | Actions | Buttons in a form default to submit and fire twice | The `type` default, and why |
| `trap/link-wraps-button` | Actions, Navigation | A link wraps a button, or a button wraps a link. Two tab stops and two roles for one action, and invalid HTML | Which one element renders. Default fix: one element, either a link styled with the Button's styles or a Button that renders as the link (the base reference names the library's way). Measured by `check-system.mjs`, and in the probe as one control where there were two |
| `trap/loading-layout-shift` | Actions, Feedback | Loading swaps or appends content, such as a spinner, a skeleton or an ellipsis, and the box changes size | The loading state keeps the element's box, and what blocks repeat actions. Measured idle and pending (`browser.md`, Measuring a loading state). Any change in size fails |
| `trap/loading-label-swap` | Actions, Feedback | The action's label is replaced while it runs, such as `{saving ? "Saving…" : "Save"}`. The box shifts and a screen reader hears a new name mid-action | Default fix: keep the label, show the control's loading state (a spinner beside the label), set `aria-busy`, and block the repeat in the handler. Pending text goes in a status or live region or next to the control, never in place of the label. A control blocked while pending keeps focus, so prefer a focusable disabled state such as `aria-disabled` and never let focus drop to the page. Measured: the box and the accessible name, idle and pending (`browser.md`, Measuring a loading state). The montage lists a swap as a removed and an added control, and `check-system.mjs` flags a label ternary on a loading state |
| `trap/button-label-wrap` | Actions | At the narrow width a button's label wraps, so the button stands taller than its neighbors | Default fix: `white-space: nowrap` on the Button, plus a shorter label or a full-width button at small widths. Measured at the narrow width: `probe.mjs` lists every button whose label runs to 2 or more lines (`wrappedButtons`), and the montage fails a new one. The line count decides, not a height ratio, since the ratio moves with line height |
| `trap/field-label` | Text entry, Choice | The placeholder or the current value is the only name | The visible label and how it is tied to the control |
| `trap/field-error-link` | Text entry, Choice | Error text sits near the field and is not tied to it | `aria-invalid` on the control and the link to the error text |
| `trap/field-error-timing` | Text entry | Errors appear on the first keystroke | The event that first shows an error, and when it goes live |
| `trap/field-keeps-input` | Text entry, Choice | A failed submit or request clears what the user entered | What survives a failure |
| `trap/select-value-lost` | Choice | A select or combobox drops its value when the form errors or the options reload | The value's lifetime across errors, refetches and option changes |
| `trap/select-empty-value` | Choice | No way back to "none" in an optional field | The clear control or the explicit empty option |
| `trap/select-async` | Choice | "No results" flashes while a search is still running | Precedence of loading over empty |
| `trap/toggle-switch-submit` | Toggles | A switch that only applies on Save | Whether it acts at once. If not, it is a checkbox |
| `trap/toggle-indeterminate` | Toggles | "Select all" with no mixed state | All three states and what each selects |
| `trap/overlay-title` | Overlays | An overlay with no title, announced only as "dialog" | The title part, visible or not |
| `trap/overlay-focus-return` | Overlays, Menus | Focus lands on the page body after close | Where focus goes after close, including when the opener is gone |
| `trap/overlay-conditional-render` | Overlays | The caller mounts and unmounts the overlay itself, so exit, focus return and state break | That callers drive the open state, and the component stays mounted |
| `trap/overlay-destructive` | Overlays | A destructive confirm that closes on an outside click | Which overlay type confirms destructive actions, and what dismisses it |
| `trap/overlay-pending-dismiss` | Overlays, Forms | Cancel, Escape or an outside click closes a dialog while its submit is in flight, so the result lands on a closed form | The default blocks dismissal while a submit is pending. Cancel is `aria-disabled` and keeps focus (`trap/loading-label-swap`), Escape and the backdrop do nothing, and the dialog closes on success or stays open with the error. A dialog that stays cancellable says how it aborts the request |
| `trap/overlay-no-max-height` | Overlays | A dialog taller than a short screen runs off it, and nothing scrolls, so its bottom actions are out of reach | Default fix: a max height of the viewport minus the dialog's margins (`max-height: calc(100dvh - 2rem)`) and `overflow-y: auto` on the dialog or its body. Measured on a short screen with the dialog open: `probe.mjs --widths 390 --height 320 --click <opener>` lists a dialog that runs past the viewport with nothing scrolling it, or that clips its own content (`tallOverlays`). The montage fails a new one |
| `trap/menu-navigation` | Menus | Items that navigate built as buttons, so new-tab breaks | Which items are links |
| `trap/menu-only-path` | Menus | An action reachable only by right-click or hover | The other visible path to each action |
| `trap/tooltip-essential` | Floating hints | Information only a tooltip holds, lost on touch | What the tooltip repeats, and where the essential text lives |
| `trap/toast-errors` | Feedback | An error that needs action shown only in a toast that times out | Which errors persist, and where |
| `trap/live-region-double` | Feedback | Two layers announce the same message | Which layer announces |
| `trap/tabs-routes` | Navigation | Tabs that change the URL built as a tablist | Whether it switches panels or navigates |
| `trap/current-unmarked` | Navigation | The current page or tab looks different and is not marked | `aria-current` or `aria-selected` on it |
| `trap/narrow-hidden-nav` | Navigation, Data | At the narrow width, nav links or table columns sit past the edge of a box that scrolls or clips them, or are hidden with no menu button, and nothing on screen says more is there. | Never a silent change: it is a gate listing each hidden item, defaulting to a visible cue such as a wrapping nav, a menu button, a "More" item or a fade at the clipped edge. Measured at the narrow width by `probe.mjs` (`clipped`: items less than half inside their clipping box or past the viewport, and nav hidden with no visible menu button). The montage fails a newly hidden item unless its trace row names a gate |
| `trap/link-cue` | Navigation | A link in the main content with no resting cue: the text color around it and no underline | Its resting cue, a color apart from the text or an underline. A change to link color or underline is a gate listing every surface it touches. `montage.mjs` measures the cue before and after |
| `trap/table-divs` | Data | A table built from divs | The table element, or the grid role and its keyboard model |
| `trap/reduced-motion-ignored` | Feedback, Overlays | Animations still run when the OS asks for reduced motion: spinners, enter animations on dialogs and toasts, skeleton shimmer | Default fix: wrap the animation in `@media (prefers-reduced-motion: no-preference)`, or swap movement for an opacity fade under `reduce`. A loading state keeps a static cue, such as the spinner's still frame and `aria-busy`. Measured by `probe.mjs` under `reduce`, which lists animations over 1ms still running or holding their end state (`motion`), right after a state function runs. The montage fails a new one |
| `trap/color-only-status` | Data, Feedback | Status told by color alone | The text or icon that carries it |
| `trap/surface-double-edge` | Containers | One surface draws its edge twice, with a border and a shadow, and nobody decided whether both are meant | Which edge the surface uses. Default: a border on resting surfaces (cards, panels, inputs), a shadow only on raised or overlay ones (menus, popovers, dialogs, toasts). When most resting surfaces draw both, that is a gate with this default, not a rule |
| `trap/surface-matches-parent` | Containers | A panel's fill equals the background behind it, so a hairline border is its only edge and the panel reads as a stroke on the page | Which surface token the panel uses, one step off its parent. Default fix: the next surface token, or no fill when a border-only panel is the decision. Measured by `probe.mjs` (`flatSurfaces`: an opaque fill within 2 of the background behind it, a border of 1px or less, no shadow) |

A family with no rows here still gets a spec. Its traps come from the app, through the method below.

## Finding this app's visual slop

Polish is consistency with the app's own decisions. Find those decisions, then find where the app breaks them. Run this in harden and build, before specs are filled, and again in `design-review` when criterion 10 comes up.

1. **Measure what the app does.** On the routes with the most traffic, collect computed styles per text role and per surface. Save a script like this as a file, such as `/abs/repo/.design-system/scripts/rendered-type.js`, and run it on each route with a browser tool (`browser.md`, Tool how-to):

   ```js
   const seen = {};
   for (const el of document.querySelectorAll("h1,h2,h3,p,label,button,a,td,th,li")) {
     const s = getComputedStyle(el);
     const k = [el.tagName, s.fontSize, s.fontWeight, s.letterSpacing, s.textTransform].join(" ");
     seen[k] = (seen[k] || 0) + 1;
   }
   Object.entries(seen).sort((a, b) => b[1] - a[1]);
   ```

   Do the same for surfaces (border, shadow, radius and background of every element with a border or shadow). Save each output under `.design-system/inventory/rendered/`.

2. **Read the pattern.** For each job, such as body text, a section heading, a button label, a resting card or a floating menu, write down what most of the app does. That majority is the candidate rule. A job with no majority is a gate.

3. **Find the breaks.** Ask these of the tables, one job at a time:
   - Do two weights, sizes or casings do the same job on different screens?
   - Does letter spacing differ between elements of the same role?
   - Does one surface stack two edge treatments where the other surfaces of its level use one?
   - Do several radii serve one kind of box? Do nested boxes have corners that fight each other?
   - Is a color, gradient or shadow used on one screen only?
   - Do some hovers animate color while others change instantly?
   - Is the space above a heading the same as the space below it on some screens and different on others?
   - Does a treatment appear only on screens built recently, or only in one team's area?

   Each yes is a finding with its count and its screens.

4. **Compare structure with a strong reference.** Open Geist's foundation pages (https://vercel.com/geist/introduction) and ask whether the app has a named role for each thing Geist separates, such as surface levels, text emphasis steps and control heights. Take the structure only, never Geist's values.

5. **Check the render.** Confirm each finding on a capture at every width and theme, per `browser.md`.

6. **Decide.** A break where the majority is clear becomes a rule, and the outliers go on the stray list for migration. A break with no majority is a gate with the most common value as its default. A majority that is itself a trap from the table above never becomes a rule. It becomes a gate that defaults to the trap's fix, such as border plus shadow on 5 of 5 cards. Never settle one by importing a preference from outside the app.

## Writing a derived rule

Each rule the method produces goes where it applies: foundation rules under the foundation page's `## Usage`, component rules under the spec's Usage H3s (`spec-template.md`). Write it in the shape and with a ground from `rule-method.md`:

```markdown
- `rule/typography-heading-weight`: When text is a section heading, render it at weight 600 instead of 700, because 41 of 47 headings already do and two weights for one role read as two levels. Evidence: app 41/47 h2 elements on 12 routes, rendered/type.txt, outliers /billing and /reports on strays.tsv. Check: lint on weight 700 in headings.
```

A rule with no ground is cut. A rule a script can test gets a check with the same ID in the enforcement phase.

## Coverage gaps

Areas where the app has no decision yet. When a task touches one, don't fill it with taste. Write a gate that names the gap, apply the smallest choice that matches neighboring screens, and list it in the system's `coverage-gaps.md` with a concrete Meanwhile (see `system-structure.md`). Common ones are chart colors beyond the foundation's chart tokens, page transitions, right-to-left layouts and print styles.
