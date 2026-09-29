# Component contract

> For the team setting this up: this is what "canonical" means in this skill. Tighten it to your stack, such as your behavior library or your test runner. Keep the rule that a component is not ready until every section below is met or has a recorded gap. Where the foundation's base reference (`base-shadcn.md`, `base-library.md`, `base-raw.md`) says otherwise, it wins. The spec each component gets is in `spec-template.md`.

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

On shadcn, a stock or customized file in the ui folder is canonical for its job without ranking, and so is a library component used as shipped. Rank only where the team wrote two things for one job, such as two wrappers around Button, or a hand-rolled dialog beside the stock one.

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
- Pass through native attributes of the root element (`type`, `disabled`, `aria-*`, `name`, `form`), and let a ref reach the root. On React 19 that is `ref` as an ordinary prop, as shadcn does. `forwardRef` is only needed on older React. Neither form is a defect.
- Keep native defaults unless the family's existing behavior differs. If every inventoried button inside a form sets `type="button"`, the canonical default is `button` and the docs say so.
- Controlled and uncontrolled use both work where the native element supports both.
- One escape hatch for layout, such as `className` merged last. It is for placement (margin, grid area), and the docs say so. Visual overrides through it are a check violation.
- Named parts when a component has named regions. Follow the installed library's convention: flat exports such as `DialogTitle` on shadcn, dotted parts such as `Dialog.Title` where the library uses them. Hand-rolled systems pick one pattern and use it everywhere.

## Variants and states

List every variant axis and every state the component supports, in the spec's States table (`spec-template.md`). For each state, give the trigger, what the user can do in it, its cue besides color, and how it is checked.

States to consider, then drop the ones that do not apply with a one-line reason:

- Interaction: default, hover, focus-visible, pressed, disabled
- Value: empty, filled, selected, checked, indeterminate, invalid, read-only
- Async: loading or pending, success, failure
- Overlay: opening, open, closing, closed with focus returned
- Content: long text, wrapping, overflow, empty, missing image

When states overlap, say which wins, in the spec's State precedence list. A loading button keeps its width and its focus. It sets `aria-disabled="true"` and `aria-busy="true"`, never native `disabled`, which drops keyboard focus to the page body, and its click handler returns early while loading, which blocks repeat activation. A disabled field inside an invalid form shows no error. `scripts/check-spec.mjs` fails a spec that leaves a pair open.

A dialog whose submit is pending and a dismissal compete, and by default the pending submit wins (`trap/overlay-pending-dismiss`). While the request is in flight, Cancel is `aria-disabled`, Escape and the backdrop do nothing, and the dialog closes on success or stays open with the error beside the fields. The Dialog spec's State precedence says so, and its example has a pending state. A dialog that must stay cancellable aborts the request and says so.

Controls that sit together share one height. Button, Input and Select at the same size read one control height token, so a row of them lines up, and the montage measures it.

## Accessibility

- Native element first. Custom keyboard handling only when no native element does the job, and then through the installed behavior library if there is one.
- An accessible name in every variant, including icon-only ones, which require a label prop.
- Visible focus in every theme, drawn with the focus token, not removed and not clipped by `overflow`.
- Keyboard path written out: which keys, what each does, where focus goes after close or submit.
- Target size of at least 24 by 24 CSS px for pointer targets, with spacing so expanded hit areas do not overlap. When the brief says mobile first, primary actions and standalone buttons are at least 44px tall at phone widths, as a decision.
- Color is never the only signal for a state. Invalid fields carry text, not only a red border.
- Motion respects `prefers-reduced-motion`.
- Status changes that the user did not trigger by focus are announced once, by one layer.

Contrast is measured by a script against the rendered colors in each theme. Text needs 4.5:1, or 3:1 when large. Non-text parts that identify a control or its state need 3:1 against what sits next to them (WCAG 1.4.11): input and checkbox borders, the focus ring as drawn with its alpha, and a checked or selected fill. Record the measured ratio. Never write a ratio you did not measure.

## Styling

- Reads semantic tokens, or component tokens where `token-architecture.md` allows them. No raw values, no primitives. The check enforces this.
- Owns its own internal spacing (inset). The caller owns spacing between components (gap), through layout.
- No global selectors and no styles that reach into children the component does not render.
- Works in every theme the app ships, with no theme-specific code in the component. Themes swap tokens.

## Docs entry and examples

- One `component-docs` entry, run with the component's code, variant list and its real uses taken from `components.tsv` call sites. One real use is enough: the entry is graded ready with gaps and opens a gate. In seed, or for a component the pilot is about to use, pass planned uses marked "(planned)". `component-docs` stops only at zero real and zero planned uses. A deprecated predecessor's call site counts when the migration map maps it. The entry and its page use the nine sections of `system-structure.md`, in order, filled to the spec template.
- One example file per variant value and per state with a visual or behavior difference, plus one composition inside a parent a real call site uses, at `<examples dir>/<component>/<name>.<ext>` and listed in the spec's `### Example files` table (`spec-template.md`). Each is a complete module: a `Caption:` comment on its first line, the component imported from the path product code uses, and one default-exported example.
- The example files double as fixtures for screenshots and tests. They use inert data. Mounting an example never sends a request, charges money, or deletes anything.

## Tests

Test what the user can observe, not how the component is built.

- It renders the right role and accessible name for each variant.
- Keyboard: the documented keys do the documented thing.
- States: disabled blocks activation, loading blocks repeat activation and keeps focus on the control, invalid exposes the error text to assistive tech.
- A form inside it: cancel does not submit, submit submits once.

Skip tests that restate a constant, such as asserting a token's value or a class name. Those pass when the component is broken. If the repo has no test runner, use the closest check it does have, such as a browser script over the example files, and record that in the run record.

## Registry and migration map

- One registry entry, with the fields in `system-structure.md`. On shadcn those fields sit under the registry item's `meta`, per `base-shadcn.md`.
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

- **ready.** Every section above is met, the spec passes the check, the docs page and twin load, tests pass, and the codemod converts every mapped prop.
- **ready with gaps.** Usable for new code, with named gaps, such as a state with no example or an `unsupported` prop that needs a person. Each gap is a line in the handoff.
- **blocked.** A gate decides its shape, or an accessibility item fails. `migrate-design-system` must not move callers onto it.
