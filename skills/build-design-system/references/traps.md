# Traps

> For the team setting this up: two parts. The first lists behavior traps that hold in any app, per component family, each with a stable ID. The second is a method for finding the visual habits that make this app look unfinished or generated, and turning each into a rule with the app's own evidence. It deliberately carries no list of visual preferences. A rule about weight, tracking or radius that holds in one product is taste in another, and an agent that copies one ships someone else's look. Add behavior traps under their family. Retire one by marking it `retired` with the reason, so old citations still resolve.

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

Most are about what the user can do, not how it looks, so they hold everywhere. The Containers rows ask the app to decide an edge once. When a trap is the app's majority pattern, the majority does not make it the rule. It becomes a gate whose default is the trap's fix, with the count.

| ID | Family | Trap | What the spec must say |
|---|---|---|---|
| `trap/button-div` | Actions | A `div` or `span` with a click handler | Rendered on `button`, or `a` when it navigates. A native `<dialog>` may take the backdrop click when it also wires `onCancel` (`checks.md`) |
| `trap/control-height` | Actions, Text entry, Choice | A Button, Input and Select that sit side by side at different heights, such as 36px buttons next to 32px inputs | The one control height token they share at each size. Measured, never read from source: `montage.mjs` fails a changed surface whose side-by-side controls differ by more than 1px |
| `trap/button-icon-name` | Actions | An icon-only button with no accessible name | Where the name comes from in every variant |
| `trap/button-type` | Actions | Buttons in a form default to submit and fire twice | The `type` default, and why |
| `trap/link-wraps-button` | Actions, Navigation | A Link or `<a>` wraps a Button, or a `<button>` wraps a link. Two tab stops and two roles for one action, and invalid HTML | Which one element renders. Default fix: a ButtonLink, `Button asChild` (or `render`) around the Link, or the Button's styles (`buttonVariants`, `buttonStyles`) on the Link. Measured by `check-system.mjs` under this ID, and in the probe as one control where there were two |
| `trap/loading-layout-shift` | Actions, Feedback | Loading swaps or appends content, such as a spinner, a skeleton or "…", and the box changes size | The loading state keeps the element's box, and what blocks repeat actions. Fixed only with the box measured idle and pending (`browser.md`), and any width change fails |
| `trap/loading-label-swap` | Actions, Feedback | The label changes while the action runs, such as `{saving ? "Saving…" : "Save"}`. The button's width shifts and a screen reader hears a new name mid-action | Default fix: keep the label, show the Button's loading state (a spinner beside the label), set `aria-busy`, and block the repeat click in the handler. Measured: the box idle and pending (`browser.md`, Measuring a loading state) and the accessible name before and after, which the montage lists as a removed and an added control. `check-system.mjs` flags a label ternary on a state the button also gets as `disabled`, `loading` or `aria-busy`, or one named like a loading state |
| `trap/button-label-wrap` | Actions | At 390 a button's label wraps to two lines, so the button stands taller than its neighbors | Default fix: `white-space: nowrap` on the Button, plus a shorter label or a full-width button at small widths. Measured at 390: `probe.mjs` lists every button whose label runs to 2 or more lines, with its height against one line's (`wrappedButtons` in each `.probe.json`). The montage fails a new one. Wraps at 1.42 to 1.44 times one line's height are common, so the line count decides, not a height ratio |
| `trap/field-label` | Text entry, Choice | The placeholder or the current value is the only name | The visible label and how it is tied to the control |
| `trap/field-error-link` | Text entry, Choice | Error text sits near the field and is not tied to it | `aria-invalid` on the control and the link to the error text |
| `trap/field-error-timing` | Text entry | Errors appear on the first keystroke | The event that first shows an error, and when it goes live |
| `trap/field-keeps-input` | Text entry, Choice | A failed submit or request clears what the user entered | What survives a failure |
| `trap/select-value-lost` | Choice | A Select or Combobox drops its value when the form errors or the options reload | The value's lifetime across errors, refetches and option changes |
| `trap/select-empty-value` | Choice | No way back to "none" in an optional field | The clear control or the explicit empty option |
| `trap/select-async` | Choice | "No results" flashes while a search is still running | Precedence of loading over empty |
| `trap/toggle-switch-submit` | Toggles | A switch that only applies on Save | Whether it acts at once. If not, it is a checkbox |
| `trap/toggle-indeterminate` | Toggles | "Select all" with no mixed state | All three states and what each selects |
| `trap/overlay-title` | Overlays | An overlay with no title, announced only as "dialog" | The title part, visible or not |
| `trap/overlay-focus-return` | Overlays, Menus | Focus lands on the page body after close | Where focus goes after close, including when the opener is gone |
| `trap/overlay-conditional-render` | Overlays | The caller mounts and unmounts the overlay itself, so exit, focus return and state break | That callers drive the open state, and the component stays mounted |
| `trap/overlay-destructive` | Overlays | A destructive confirm that closes on an outside click | Which overlay type confirms destructive actions, and what dismisses it |
| `trap/overlay-pending-dismiss` | Overlays, Forms | Cancel, Escape or an outside click closes a dialog while its submit is in flight, so the result lands on a closed form | The default blocks dismissal while a submit is pending: Cancel is `aria-disabled`, Escape and the backdrop do nothing, and the dialog closes on success or stays open with the error. A dialog that stays cancellable says how it aborts the request |
| `trap/overlay-no-max-height` | Overlays | A dialog taller than a short screen runs off it, and nothing scrolls, so its bottom actions are out of reach | Default fix: a max height of the viewport minus the dialog's margins (`max-height: calc(100dvh - 2rem)`) and `overflow-y: auto` on the dialog or its body. Measured at 390x320 with the dialog open: `probe.mjs --widths 390 --height 320 --click <opener>` lists a dialog that runs past the viewport with no scrolling box around or inside it, or that clips its own content (`tallOverlays`). The montage fails a new one |
| `trap/menu-navigation` | Menus | Items that navigate built as buttons, so new-tab breaks | Which items are links |
| `trap/menu-only-path` | Menus | An action reachable only by right-click or hover | The other visible path to each action |
| `trap/tooltip-essential` | Floating hints | Information only a tooltip holds, lost on touch | What the tooltip repeats, and where the essential text lives |
| `trap/toast-errors` | Feedback | An error that needs action shown only in a toast that times out | Which errors persist, and where |
| `trap/live-region-double` | Feedback | Two layers announce the same message | Which layer announces |
| `trap/tabs-routes` | Navigation | Tabs that change the URL built as a tablist | Whether it switches panels or navigates |
| `trap/current-unmarked` | Navigation | The current page or tab looks different and is not marked | `aria-current` or `aria-selected` on it |
| `trap/narrow-hidden-nav` | Navigation, Data | At 390, nav links or table columns sit past the edge of a box that scrolls or clips them, or are hidden with no menu button, and nothing on screen says more is there. A fix for page overflow that moves it into such a box passes an overflow check and hides Settings | Never a silent change: it is a gate listing each hidden item, with the default of a visible cue, such as a wrapping nav, a menu button, a "More" item, or a fade at the clipped edge. Measured at 390 by `probe.mjs` (`clipped`: nav links and column headers less than half inside the box that clips them, or past the viewport, and nav links hidden with no visible menu button). The montage fails a newly hidden item unless its trace row names a gate |
| `trap/link-cue` | Navigation | A link in the main content with no resting cue: the text color around it and no underline | Its resting cue, a color apart from the text or an underline. A change to link color or underline is a gate listing every surface it touches. `montage.mjs` measures the cue before and after |
| `trap/table-divs` | Data | A table built from divs | The table element, or the grid role and its keyboard model |
| `trap/reduced-motion-ignored` | Feedback, Overlays | Animations still run when the OS asks for reduced motion: spinners, enter animations on dialogs and toasts, skeleton shimmer | Default fix: wrap the animation in `@media (prefers-reduced-motion: no-preference)`, or swap movement for an opacity fade under `reduce`. A loading state keeps a static cue, such as the spinner's still frame and `aria-busy`. Measured by `probe.mjs` under `reduce`, which lists animations over 1ms still running or holding their end state (`motion`). `capture.mjs` records them right after a state function runs, before it finishes animations. The montage fails a new one |
| `trap/color-only-status` | Data, Feedback | Status told by color alone | The text or icon that carries it |
| `trap/surface-double-edge` | Containers | One surface draws its edge twice, with a border and a shadow, and nobody decided whether both are meant | Which edge the surface uses. Default: a border on resting surfaces (cards, panels, inputs), a shadow only on raised or overlay ones (menus, popovers, dialogs, toasts). When most resting surfaces draw both, that is a gate with this default, not a rule |
| `trap/surface-matches-parent` | Containers | A panel's fill equals the background behind it, so a hairline border is its only edge and the panel reads as a stroke on the page | Which surface token the panel uses, one step off its parent. Default fix: point the fill at the next surface token, or drop the fill when a border-only panel is the decision. Measured by `probe.mjs` (`flatSurfaces`: an opaque fill within 2 of the composited background behind it, a border of 1px or less on all sides, no shadow) or by computed styles in the browser |

A family with no rows here still gets a spec. Its traps come from the app, through the method below.

## Finding this app's visual slop

Polish is consistency with the app's own decisions. The work is to find what those decisions are, then find where the app breaks them. Run this in harden and build, before specs are filled, and again in `design-review` when criterion 10 comes up.

1. **Measure what the app does.** On the routes with the most traffic, collect computed styles per text role and per surface. The raw-value inventory gives the declared values. The rendered values come from the browser. Save the script as a file, such as `/abs/repo/.design-system/scripts/rendered-type.js`, and pipe it in, which works in every shell:

   ```js
   const seen = {};
   for (const el of document.querySelectorAll("h1,h2,h3,p,label,button,a,td,th,li")) {
     const s = getComputedStyle(el);
     const k = [el.tagName, s.fontSize, s.fontWeight, s.letterSpacing, s.textTransform].join(" ");
     seen[k] = (seen[k] || 0) + 1;
   }
   Object.entries(seen).sort((a, b) => b[1] - a[1]);
   ```

   ```sh
   agent-browser --session ds-1 eval --stdin < /abs/repo/.design-system/scripts/rendered-type.js
   ```

   Do the same for surfaces: border width and color, box-shadow, border-radius and background of every element with a border or shadow. Save each output under `.design-system/inventory/rendered/`.

2. **Read the pattern.** For each job, such as body text, a section heading, a button label, a resting card or a floating menu, write down what most of the app does. That majority is the candidate rule. A job with no majority is a gate.

3. **Find the breaks.** Ask these of the tables, one job at a time:
   - Do two weights, sizes or casings do the same job on different screens?
   - Does letter spacing differ between elements of the same role?
   - Does one surface stack two edge treatments, such as a border and a shadow, where the other surfaces of its level use one?
   - Do several radii serve one kind of box? Do nested boxes have corners that fight each other?
   - Is a color, gradient or shadow used on one screen only?
   - Do some hovers animate color while others change instantly?
   - Is the space above a heading the same as the space below it on some screens and different on others?
   - Does a treatment appear only on screens built recently, or only in one team's area?

   Each yes is a finding with its count and its screens.

4. **Compare structure with a strong reference.** Open Geist's foundation pages (https://vercel.com/geist/introduction) and ask whether the app has a named role for each thing Geist separates, such as surface levels, text emphasis steps and control heights. A missing role often explains a break, because two screens solved the same job differently. Take the structure only. Geist's values are Vercel's.

5. **Check the render.** Confirm each finding on a capture at every viewport and theme, per `browser.md`. A value that looks inconsistent in source can be overridden at runtime, and the reverse.

6. **Decide.** A break where the majority is clear becomes a rule, and the outliers go on the stray list for migration. A break with no majority is a gate with the most common value as its default. A majority that is itself a trap from the table above never becomes a rule: it becomes a gate that defaults to the trap's fix, such as border plus shadow on 5 of 5 cards. Never settle one by importing a preference from outside the app.

## Writing a derived rule

Each rule the method produces goes where it applies: foundation rules under the foundation page's `## Usage`, component rules under the spec's `### Writing` or `### Do and don't`. The shape:

```markdown
- `rule/heading-weight`: Section headings use weight 600. Evidence: 41 of 47 h2 elements on 12 routes, rendered/type.txt. Outliers: /billing, /reports (strays.tsv). Check: lint on `font-bold` in headings.
```

A rule without evidence is a preference and does not ship. A rule a script can test gets a check with the same ID in the enforcement phase.

## Coverage gaps

Areas where the app has no decision yet. When a task touches one, do not fill it with taste. Write a gate that names the gap, apply the smallest choice that matches neighboring screens, and list it in the system's `coverage-gaps.md` with a concrete Meanwhile (see `system-structure.md`). Common ones are chart colors beyond the foundation's chart tokens, page transitions, right-to-left layouts and print styles.
