# Component contract

This is what "canonical" means in this skill. A component is not ready until every section below is met or has a recorded gap. Where the base reference says otherwise, it wins. The spec each component gets is in `spec-template.md`.

Contents

- Picking the canonical implementation
- API
- Variants and states
- Accessibility
- Styling
- Docs entry and examples
- Tests
- Registry and migration map
- Readiness grades

## Picking the canonical implementation

A foundation's stock or customized component is canonical for its job without ranking, and so is a library component used as shipped (the base reference). Rank only where the team wrote two things for one job, such as two wrappers around Button, or a hand-rolled dialog beside the stock one.

Within a family, rank candidates by these questions, in order. Stop at the first one that separates them.

1. Does it render the right native element for its job? A button that is a `div` with a click handler loses.
2. Does it already meet the accessibility section below, or sit on a behavior library the app already installs?
3. Which has the most call sites on shipped screens?
4. Which has the smaller API for the same coverage?

If no candidate passes question 1 or 2, build a new one on the native element or the installed behavior library, and absorb the variants the family actually uses. Adding a behavior library the app does not have is a gate.

When the canonical pick wraps a primitive library, list the library's defaults for placement, offsets, timing and focus, and compare them across sibling components. Pickers (select, combobox, date, menu) share one placement rule, derived from the app and written to `docs/system/decisions.md`.

Record the ranking in the run record, one line per candidate, so a reviewer sees why the others lost.

## API

Before the first family, derive the app's own prop vocabulary from `components.tsv` and write it to `docs/system/decisions.md`, because every family worker writes against it at once (`coordinator-path.md`, Lock before fan-out). Take the majority form for each:

- the variant axis names, such as `variant`, `tone` or `intent`, and the size scale, such as `sm`, `md`, `lg`
- boolean naming (`disabled` or `isDisabled`) and event naming (`onChange` or `onValueChange`)
- the value and change pair for controlled use (`value` with `onValueChange`)
- slots against props for named regions, and how a component renders as another element (`asChild`, `render` or `as`)

A split with no majority is a gate. Then:

- Props describe purpose: `tone="danger"`, not `red`. `size="sm"`, not `small={true}`.
- Mutually exclusive options are one union prop, not several booleans. `variant: "primary" | "secondary" | "ghost"`, never `primary` and `ghost` as separate booleans that can both be true. The same holds for state: one `status` of idle, pending, success or error, not `isLoading` and `isError` that can both be true.
- Components called from anywhere, such as toasts and dialog managers, have:
  - one host mounted near the root
  - a call that is safe to repeat, where the same id updates instead of duplicating
  - rendering in a portal at the root or in the top layer, so no ancestor's stacking context or overflow clips it
  - the app's resolved theme
- Include only the variants the inventory found in use, and count a style override passed at two or more call sites as a missing variant.
- Pass through native attributes of the root element (`type`, `disabled`, `aria-*`, `name`, `form`), and let a ref reach the root in whatever form the framework and foundation use. The form itself is never a defect.
- Keep native defaults unless the family's existing behavior differs. If every inventoried button inside a form sets `type="button"`, the canonical default is `button` and the docs say so.
- Controlled and uncontrolled use both work where the native element supports both.
- One escape hatch for layout, such as `className` merged last. It is for placement (margin, grid area), and the docs say so. Visual overrides through it are a check violation.
- Named parts when a component has named regions. Follow the installed library's convention, flat exports (`DialogTitle`) or dotted parts (`Dialog.Title`). Hand-rolled systems pick one pattern and use it everywhere.

## Variants and states

List every variant axis and state in the spec's States table (`spec-template.md`): the trigger, what the user can do, its cue besides color, and how it is checked.

States to consider, dropping the ones that do not apply with a one-line reason:

- Interaction: default, hover, focus-visible, pressed, disabled
- Value: empty, filled, selected, checked, indeterminate, invalid, read-only
- Async: pending, success, failure. The state is named `pending` in props, specs and examples
- Overlay: opening, open, closing, closed with focus returned
- Content: long text, wrapping, overflow, empty, missing image

When states overlap, say which wins, in the spec's State precedence list. `scripts/check-spec.mjs` fails a spec that leaves a pair open. A disabled field inside an invalid form shows no error.

Derive the interaction-state order from the app: for each pair the code lets hold at once, read which style the app applies last, and keep the majority. When the app has none, the default is disabled, then open or focused, then invalid, then hover, then rest. An open trigger shows focus while open (`trap/open-trigger-unfocused`). Hover never overrides focus or invalid (`trap/hover-beats-focus`), and a disabled control never hovers (`trap/disabled-still-hovers`). `scripts/state-timeline.js` measures each pair frame by frame (`browser.md`). Border and halo changes may ease. Press feedback is instant, and a latency allowance never applies to visual feedback.

A pending action has one fix, for `trap/loading-label-swap` and `trap/loading-layout-shift` alike. The idle label stays in place and the control keeps its box. Pending adds a spinner inside the box and sets `aria-busy="true"`, and the control is disabled against repeat submits: `aria-disabled="true"` and an early return in the handler, since native `disabled` can drop keyboard focus to the page. When the copy wants a pending verb ("Saving"), both labels sit stacked in one grid cell, the inactive one `visibility: hidden`, so the box is always the longer label's width.

A pending submit beats dismissal in a dialog by default (`traps.md`, `trap/overlay-pending-dismiss`). The Dialog spec's State precedence says so, and its example has a pending state.

Controls that sit together share one control height token per size, so a row of them lines up (`trap/control-height`).

Under about 20px, a pending indicator is a thin ring, never a row of dots (`trap/loader-small-dots`). An empty value, such as a missing date or amount, renders through one component with accessible text (`trap/empty-value`). A form marks the rarer of required and optional fields, never every field (`trap/required-everywhere`).

## Accessibility

- Native element first. Custom keyboard handling only when no native element does the job, and then through the installed behavior library if there is one.
- An accessible name in every variant, including icon-only ones, which require a label prop.
- Visible focus in every theme, drawn with the focus token, not removed and not clipped by `overflow`.
- Keyboard path written out: which keys, what each does, where focus goes after close or submit.
- Pointer targets meet WCAG 2.5.8, at least 24 by 24 CSS px, with spacing so expanded hit areas do not overlap. When the brief says mobile first, primary actions and standalone buttons are at least 44px tall at phone widths, as a decision, following the common touch-target guideline.
- Color is never the only signal for a state. Invalid fields carry text, not only a red border.
- Motion respects `prefers-reduced-motion`.
- Each theme sets `color-scheme`, so native controls and scrollbars match it. State stays visible under `forced-colors: active`, drawn with borders or system colors instead of fills alone.
- A surface with blur or translucency switches to an opaque fill under `prefers-reduced-transparency: reduce` and `prefers-contrast: more`, and is readable with the blur removed, since not every browser reports reduced transparency.
- Status changes that the user did not trigger by focus are announced once, by one layer.

Contrast is measured by a script against the rendered colors in each theme, to WCAG AA by default: 4.5:1 for text, 3:1 for large text. Non-text parts that identify a control or its state need 3:1 against what sits next to them (WCAG 1.4.11): input and checkbox borders, the focus ring as drawn with its alpha, and a checked or selected fill. Record the measured ratio. Never write a ratio you did not measure.

A translucent fill or tint is composited over every surface token it can sit on, in every theme, and each result is measured. Explanatory text, such as the reason a control is disabled, keeps full text contrast. Rerun the measurement before carrying a recorded ratio or reason into a new theme or surface.

## Styling

- Reads semantic tokens, or component tokens where `token-architecture.md` allows them. No raw values, no primitives. The check enforces this.
- Owns its own internal spacing (inset). The caller owns spacing between components (gap), through layout.
- No global selectors and no styles that reach into children the component does not render.
- Works in every theme the app ships, with no theme-specific code in the component. Themes swap tokens.
- Animates only through the named motion presets (`token-architecture.md`, Motion presets). A component with its own duration or easing fails the contract.

## Docs entry and examples

- One `component-docs` entry, run with the component's code, variant list and real uses from `components.tsv`. One real use is enough, graded ready with gaps with a gate. In seed, or for a component the pilot is about to use, pass planned uses marked "(planned)". `component-docs` stops only at zero real and zero planned uses. A deprecated predecessor's call site counts when the migration map maps it. The entry uses the nine sections of `system-structure.md`, filled to the spec template.
- One example file per variant value and per state with a visual or behavior difference, plus one composition inside a parent a real call site uses, at `<examples dir>/<component>/<name>.<ext>` and listed in the spec's `### Example files` table (`spec-template.md`). Each is a complete module: a `Caption:` comment on its first line, the component imported from the path product code uses, and one default-exported example.
- The example files double as fixtures for screenshots and tests. They use inert data. Mounting an example never sends a request, charges money, or deletes anything.

## Tests

Test what the user can observe, not how the component is built.

- It renders the right role and accessible name for each variant.
- Keyboard: the documented keys do the documented thing.
- States: disabled blocks activation, pending blocks repeat activation, keeps focus on the control and keeps its box, invalid exposes the error text to assistive tech.
- A form inside it: cancel does not submit, submit submits once.

Every behavior claim in the spec (keyboard, focus, open state, timers, copy feedback) has an interaction test that fails when the behavior breaks. `check-spec.mjs` warns when a row says "test" and no test file for the component exists. Skip tests that restate a constant, such as a token's value or a class name, since they pass when the component is broken. With no testing library, write a small render-and-query helper in the system folder instead of adding a dependency, and record that.

## Registry and migration map

- One registry entry, with the fields in `system-structure.md`, placed where the base reference says.
- One migration map entry per replaced implementation. The map is what the codemod applies and what `migrate-design-system` reads.

```json
{
  "from": { "import": "@/components/legacy/PrimaryButton", "name": "PrimaryButton" },
  "to": { "import": "@/components/ui/button", "name": "Button" },
  "props": {
    "isLoading": "pending",
    "small": { "prop": "size", "value": "sm" },
    "color": { "red": { "prop": "tone", "value": "danger" } }
  },
  "adds": { "variant": "primary" },
  "unsupported": ["fullWidthOnMobile"],
  "notes": "fullWidthOnMobile moves to the caller's layout. The codemod leaves a TODO comment at each use."
}
```

`unsupported` lists props the canonical component will not take. The codemod never drops them silently. It leaves the call site unchanged and reports it.

## Readiness grades

- **ready.** Every section above is met, the spec passes the check, the docs page and twin load, tests pass, and the codemod converts every mapped prop.
- **ready with gaps.** Usable for new code, with named gaps, such as a state with no example or an `unsupported` prop that needs a person. Each gap is a line in the handoff.
- **blocked.** A gate decides its shape, or an accessibility item fails. `migrate-design-system` must not move callers onto it.
