# Component contract

> For the team setting this up: this is what "canonical" means in this skill. Tighten it to your stack, such as your behavior library or your test runner. Keep the rule that a component is not ready until every section below is met or has a recorded gap.

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

Within a family, rank candidates by these questions, in order. Stop at the first one that separates them.

1. Does it render the right native element for its job? A button that is a `div` with a click handler loses.
2. Does it already meet the accessibility section below, or sit on a behavior library the app already installs?
3. Which has the most call sites on shipped screens?
4. Which has the smaller API for the same coverage?

If no candidate passes question 1 or 2, build a new one on the native element or the installed behavior library, and absorb the variants the family actually uses. Do not add a behavior library the app does not have. That is a gate.

Record the ranking in the run record, one line per candidate, so a reviewer can see why the others lost.

## API

- Props describe purpose: `tone="danger"`, not `red`. `size="sm"`, not `small={true}`.
- Mutually exclusive options are one union prop, not several booleans. `variant: "primary" | "secondary" | "ghost"`, never `primary` and `ghost` as separate booleans that can both be true.
- Include only the variants the inventory found in use. A variant nobody uses today is a guess about tomorrow.
- Pass through native attributes of the root element (`type`, `disabled`, `aria-*`, `name`, `form`) and forward the ref.
- Keep native defaults unless the family's existing behavior differs. If every inventoried button inside a form sets `type="button"`, the canonical default is `button` and the docs say so.
- Controlled and uncontrolled use both work where the native element supports both.
- One escape hatch for layout, such as `className` merged last. It is for placement (margin, grid area), and the docs say so. Visual overrides through it are a check violation.
- Compound parts (`Dialog.Title`, `Select.Item`) when a component has named regions. Pick one pattern for the whole system and use it everywhere.

## Variants and states

List every variant axis and every state the component supports. For each state, give the trigger and what the user can do in it.

States to consider, then drop the ones that do not apply with a one-line reason:

- Interaction: default, hover, focus-visible, pressed, disabled
- Value: empty, filled, selected, checked, indeterminate, invalid, read-only
- Async: loading or pending, success, failure
- Overlay: opening, open, closing, closed with focus returned
- Content: long text, wrapping, overflow, empty, missing image

When states overlap, say which wins. A loading button blocks repeat clicks but keeps its width. A disabled field inside an invalid form shows no error.

## Accessibility

- Native element first. Custom keyboard handling only when no native element does the job, and then through the installed behavior library if there is one.
- An accessible name in every variant, including icon-only ones, which require a label prop.
- Visible focus in every theme, drawn with the focus token, not removed and not clipped by `overflow`.
- Keyboard path written out: which keys, what each does, where focus goes after close or submit.
- Target size of at least 24 by 24 CSS px for pointer targets, with spacing so expanded hit areas do not overlap.
- Color is never the only signal for a state. Invalid fields carry text, not only a red border.
- Motion respects `prefers-reduced-motion`.
- Status changes that the user did not trigger by focus are announced once, by one layer.

Contrast is measured by a script against the rendered colors in each theme. Record the measured ratio. Never write a ratio you did not measure.

## Styling

- Reads semantic tokens, or component tokens where `token-architecture.md` allows them. No raw values, no primitives. The check enforces this.
- Owns its own internal spacing (inset). The caller owns spacing between components (gap), through layout.
- No global selectors and no styles that reach into children the component does not render.
- Works in every theme the app ships, with no theme-specific code in the component. Themes swap tokens.

## Docs entry and examples

- One `component-docs` entry, run with the component's code, variant list and two real uses taken from `components.tsv` call sites. The entry and its page use the nine sections of `system-structure.md`, in order.
- One example file per variant axis and per triggerable state. Examples import the component from the path product code uses.
- The example files double as fixtures for screenshots and tests. They use inert data. Mounting an example never sends a request, charges money, or deletes anything.

## Tests

Test what the user can observe, not how the component is built.

- It renders the right role and accessible name for each variant.
- Keyboard: the documented keys do the documented thing.
- States: disabled blocks activation, loading blocks repeat activation, invalid exposes the error text to assistive tech.
- A form inside it: cancel does not submit, submit submits once.

Skip tests that restate a constant, such as asserting a token's value or a class name. Those pass when the component is broken. If the repo has no test runner, use the closest check it does have, such as a browser script over the example files, and record that in the run record.

## Registry and migration map

- One registry entry, with the fields in `system-structure.md`.
- One migration map entry per replaced implementation. The map is what the codemod applies and what `migrate-design-system` reads.

```json
{
  "from": { "import": "@/components/legacy/PrimaryButton", "name": "PrimaryButton" },
  "to": { "import": "@/components/ui/button", "name": "Button" },
  "props": {
    "isLoading": "loading",
    "small": { "prop": "size", "value": "sm" },
    "color": { "red": { "prop": "tone", "value": "danger" } }
  },
  "adds": { "variant": "primary" },
  "unsupported": ["fullWidthOnMobile"],
  "notes": "fullWidthOnMobile moves to the caller's layout. The codemod leaves a TODO comment at each use."
}
```

`unsupported` lists props the canonical component will not take. The codemod must not drop them silently. It leaves the call site unchanged and reports it.

## Readiness grades

- **ready.** Every section above is met, the docs page and twin load, tests pass, and the codemod converts every mapped prop.
- **ready with gaps.** Usable for new code, with named gaps, such as a state with no example or an `unsupported` prop that needs a person. Each gap is a line in the handoff.
- **blocked.** A gate decides its shape, or an accessibility item fails. `migrate-design-system` must not move callers onto it.
