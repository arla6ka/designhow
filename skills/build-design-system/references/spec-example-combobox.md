# Worked spec: Combobox

> For the team setting this up: this shows how a spec gets derived, and the depth it should reach. It describes a fictional invoicing app, Ledgerline, built on shadcn's `base-nova` style with Base UI. Every value in it came from that app's code, call sites and captures, and the second half of this file shows the command or reading behind each answer. A worker copies the method, never the values. Your app's Combobox will have different states, numbers and rules. Replace this file with one of your own specs once one passes the check.

Contents

- The spec
- How each answer was found
- What a worker should copy

## The spec

The file below passes `scripts/check-spec.mjs`. Everything between the fences is the spec as it sits at `docs/system/combobox.md`.

````markdown
# Combobox

## Description
Combobox lets someone pick one record from a list too long to scan, by typing part of its name.

`import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox"`, source `components/ui/combobox.tsx`, status `ready-with-gaps`.
Foundation: shadcn `combobox` (base-nova, base). Traps checked: `trap/field-label` (ARIA), `trap/field-error-link` (States, ARIA), `trap/field-keeps-input` (precedence), `trap/select-value-lost` (precedence), `trap/select-empty-value` (Variants), `trap/select-async` (States, precedence), `trap/loading-layout-shift` (States), `trap/overlay-focus-return` (Keyboard), `trap/overlay-conditional-render` n/a because the Base UI root owns the popup and callers never mount it.

### Foundation
| Given by the foundation | Added by the team |
|---|---|
| Base UI Combobox root, input, popup, list, items, empty slot, keyboard model and ARIA wiring | `ComboboxStatus`, a row inside the list for loading and load errors, in `components/ledger/combobox-status.tsx`, because customer search hits the API |
| `showTrigger` and `showClear` on `ComboboxInput` | `CustomerPicker` sets `showClear` from the field's `required` flag |
| Item highlight and selected check mark | None. `shadcn add combobox --diff` is empty at commit `8d41c2e`, so the stock file has no local edits |

Parts, in reading order: input (required), trigger button (optional), clear button (optional), popup with list (required), items inside the list (required), empty row (required), status row (team, optional).

## Examples
Default: `components/ui/combobox.examples/default.tsx`.

Real uses, 11 call sites (`rg -n "<Combobox\b" app components`, outside `components/ui/`). Three are below.

- Invoices > New invoice: "Bill to" picks the customer. `app/(app)/invoices/new/customer-field.tsx:22`, required, async search, clear off.
- Expenses > Filters: "Project" narrows the table. `app/(app)/expenses/filters.tsx:48`, optional, 40 projects loaded up front, clear on.
- Settings > Tax: "Region" picks from a fixed list of 61 regions. `app/(app)/settings/tax/region.tsx:15`, required, static.

## Variants

### showClear
- `true`: the value is optional and removing it is a normal act. Used at 4 call sites.
- `false`: the field is required, so clearing would only lead to an error. Used at 7 call sites.

### showTrigger
- `true`: a chevron button opens the list without typing. Used at all 11 call sites. `false` is unused and stays undocumented until a screen needs it.

## States
| State | Trigger | What the user can do | Shown by, besides color | Checked by |
|---|---|---|---|---|
| Empty | No value and no text typed | Type, or open the list with the trigger or Down Arrow | Placeholder text "Search customers" | screenshot |
| Filled | A value was selected | Edit the text to search again, or clear it when `showClear` is on | The selected record's name in the input | test |
| Focus visible | Keyboard focus on the input | Type, open, clear | Focus ring | screenshot |
| Open | Typing, Down Arrow, Alt+Down, or the trigger | Move through items, pick one, close with Escape | Popup below the input, `aria-expanded="true"` | snapshot |
| Highlighted item | Arrow keys or pointer over an item | Pick it with Enter or a click | `data-highlighted` and a background change | by hand |
| Selected item | The item matches the current value | Pick another | Check icon at the item's end | screenshot |
| Loading results | A search request still running after the 150ms debounce | Keep typing. Earlier results stay listed and cannot be picked | Status row "Searching…" with a spinner at the list's height, `aria-busy="true"` on the list | test |
| No results | The search finished with zero matches | Change the text | Empty row "No customers match 'acm'" | test |
| Load failed | The search request failed | Retry from the status row, or keep typing | Status row "Couldn't load customers" with a Retry button | test |
| Disabled item | The record is archived | Read it, skip past it | "Archived" suffix, `aria-disabled="true"` | snapshot |
| Invalid | Submitted with no value in a required field, or the value was archived since | Pick a valid record | Error text under the field from `FieldError`, `aria-invalid="true"` | test |
| Disabled | The parent form is saving, or the user lacks edit rights | Nothing. Tab skips the field | `disabled` on the input, no response from the trigger | test |
| Read-only | The invoice is sent and locked | Read and copy the value | No trigger or clear button, `readOnly` on the input | by hand |
| Long name | A customer name longer than the input | Read the full name in the list | Input truncates with an ellipsis, list items wrap to two lines | screenshot |

### State precedence
- Disabled and invalid: disabled wins. The error text hides while the form saves, so a pending save never shows a stale error.
- Disabled and open: disabled wins. Disabling an open combobox closes it, and focus moves to the form's submit button.
- Read-only and invalid: read-only wins. A locked invoice never shows field errors.
- Loading results and no results: loading wins until the request settles, so the empty row never flashes during a search.
- Loading results and load failed: load failed wins for the request it came from. A newer request in flight shows loading again.
- Invalid and filled: both show. A failed submit keeps the value and the typed text.
- Load failed and filled: both show. A failed search never clears the selected value.
- Invalid and open: both show. The error text stays under the field while the list is open.
- Selected item and disabled item: disabled item wins in the list. An archived customer that is still the value shows "Archived", cannot be picked again, and the input turns invalid.
- Focus visible and highlighted item: both show. Focus stays on the input while the highlight moves.

## Props
gen-docs writes the table from `ComboboxPrimitive.Root.Props` and the `ComboboxInput` type. `showClear` defaults to `false` in the stock file, and `CustomerPicker` always passes it, so the stock default never reaches a screen.

## Usage

### Use it when
- The list has more than about 15 options, or grows with the account's data
- People know the name they want and typing is faster than scanning

### Use something else when
- There are fewer than 5 fixed options. Use RadioGroup, as the app already does in 6 of 7 such fields
- There are 5 to 15 fixed options and typing adds nothing. Use Select
- People pick several values. Use the chips form of Combobox, which has its own spec

### Writing
- `rule/combobox-placeholder`: The placeholder names what is searched, "Search customers". Evidence: 9 of 11 call sites. The two "Select…" placeholders are on strays.tsv.
- `rule/combobox-empty-row`: The empty row repeats the typed text, "No customers match 'acm'". Evidence: all 3 async call sites.
- `rule/record-casing`: Record names keep the casing they were saved with. Evidence: every list in the app renders names as stored. Check: lint on `capitalize` classes in item text.

### Do and don't
- Do keep earlier results listed while a search runs / Don't clear the list on each keystroke, which makes it jump
- Do disable archived records and label them / Don't hide them, since a selected archived record then has no row to explain it

## Accessibility
Rests on Base UI Combobox. The input keeps focus throughout, and the popup never takes it.

### Keyboard
| Key | Where focus is | Effect | Focus after | Checked by |
|---|---|---|---|---|
| Down Arrow | Input, closed | Opens and highlights the first item | Input | test |
| Down Arrow, Up Arrow | Input, open | Moves the highlight, skipping disabled items | Input | test |
| Enter | Input, open with a highlight | Picks the highlighted item and closes | Input | test |
| Escape | Input, open | Closes and keeps the typed text | Input | test |
| Escape | Input, closed | Resets the typed text to the selected value | Input | by hand |
| Tab | Input, open | Closes without picking and moves on | Next field | test |
| Enter | Retry button in the status row | Reruns the last search | Input | by hand |

### ARIA
| Part | Role | Accessible name from | States and properties | Announced | Checked by |
|---|---|---|---|---|---|
| Input | combobox | The field's `Label` through `htmlFor` | `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-invalid` | Name, value, and collapsed or expanded, on focus | snapshot |
| List | listbox | The field's label | `aria-busy` while loading | Nothing on its own | snapshot |
| Item | option | Its text | `aria-selected`, `aria-disabled` | Name and position, such as "Acme Ltd, 2 of 9" | a11y scan |
| Status row | status | Its text | Polite live region | "Searching…" once per request, and the failure text | by hand |

Contrast: NEEDS REVIEW. The status row text on the popup surface was not measured in dark mode.

## Tokens
| Part | State | Token |
|---|---|---|
| Input border | all | `--input` |
| Input border | invalid | `--destructive` |
| Focus ring | focus visible | `--ring` |
| Popup surface and text | open | `--popover`, `--popover-foreground` |
| Item | highlighted | `--accent`, `--accent-foreground` |
| Placeholder, empty and status rows | all | `--muted-foreground` |
| Popup corners | open | `--radius` |

## Related
- Select: fixed lists of 5 to 15 options that need no typing.
- NativeSelect: the mobile settings screens, where the platform picker is expected.
- Command: a list of actions rather than a value for a field.
````

## How each answer was found

Each question from `spec-template.md`, with what the worker ran or read in Ledgerline and what it concluded. This is the part to copy.

**1. Foundation.** `npx shadcn@latest info --json` gave style `base-nova` and base `base`. `npx shadcn@latest add combobox --diff components/ui/combobox.tsx` printed no changes, so the file is `stock`. `rg -l '@/components/ui/combobox' app components` found 11 call sites and one wrapper, `CustomerPicker`. Reading the wrapper showed the status row and the `showClear` logic, which became the right column. Nothing in that column came from memory of what shadcn usually ships.

**2. Variants.** `rg -n 'showClear' app components` gave 4 `true` and 7 `false`. Every `false` sat beside `required`, which is why the variant line says so. `showTrigger` never appears, so the stock default holds everywhere, and the unused `false` value is left out rather than documented on speculation.

**3. States.** The worker listed candidate states from `component-contract.md`, then kept the ones the code can reach. The 150ms comes from `SEARCH_DELAY_MS` in `CustomerPicker`, not from a guideline. "Archived" came from the API type, where `archived: true` maps to `disabled`. Each state was captured per `browser.md` at 390 and 1280, light and dark. No results came from typing "zzzz". Load failed was reached safely with `agent-browser network route "**/api/customers*" --abort`, without breaking a real server. Read-only needed a sent invoice, which the seed data has. The "Checked by" column came from `components/ledger/customer-picker.test.tsx`: states it asserts are `test`, and the rest say how they were seen.

**4. Precedence.** The worker listed every pair of states the code lets hold at once, by reading which flags can be true together (`isSubmitting` with `errors.customer`, `isLoading` with an empty result), then observed each pair in the browser. Most had an answer in code. Selected and disabled item did not. An archived customer could stay selected with no cue. That became gate G-07, "Show an archived selection as invalid?", with "yes" as the default. The spec records the default, and the gate stays open in the run record.

**5. Keyboard.** Each key was pressed on the New invoice route with `agent-browser press`, and focus was read from `agent-browser snapshot -i` after each press. Escape on a closed input resets the text in the browser but has no test, so it says `by hand`.

**6. ARIA.** `agent-browser snapshot -s '[data-slot=combobox]'` gave the roles and properties per part. `agent-browser a11y --tags wcag2a,wcag2aa` found no violations on the field. The status row's announcement cannot be read from a snapshot, so it went to the by-hand list.

**7. Content rules.** The three `rule/` lines came from the method in `traps.md`. The worker collected the placeholder text of all 11 call sites, found 9 in one shape and 2 in another, and wrote the majority as the rule with the outliers on the stray list. It proposed no wording of its own.

**8. Tokens.** Read from the classes in `combobox.tsx` (`border-input`, `ring-ring`, `bg-popover` and so on), each mapped to its CSS variable in the `tailwindCss` file. No token was inferred from a screenshot.

**9. What is checked where.** Every by-hand row went to the verifier's list in the run record, so a person knows exactly what no script covers.

**10. Traps.** The rows for the Choice, Text entry, Actions and Overlays families in `traps.md` were each answered in a named section or marked `n/a` with a reason.

## What a worker should copy

- Each answer names where it came from: a command, a file and line, a capture, or a gate.
- Numbers come from the app. The debounce, the call-site counts and the option thresholds are Ledgerline's. Another app finds its own.
- A question the code does not answer becomes a gate with a default, and the spec records the default.
- Rules come from the app's majority, with outliers sent to migration. The spec never imports a preference from another product.
