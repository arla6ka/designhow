# Worked spec: Combobox

> For the team setting this up: this shows how a spec gets derived, and the depth it should reach. It describes a fictional invoicing app, Northwind, built on shadcn's `base-nova` style with Base UI. Every value in it came from that app's code, call sites, captures and measurements, and the second half of this file shows the command or reading behind each answer. The Usage rules follow `rule-method.md`, with each ground visible. A worker copies the method, never the values. Your app's Combobox will have different states, numbers and rules. Replace this file with one of your own specs once one passes the check.

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
Default: `docs/system/examples/combobox/default.tsx`.

Real uses, 11 call sites (`rg -n "<Combobox\b" app components`, outside `components/ui/`). Three are below.

- Invoices > New invoice: "Bill to" picks the customer. `app/(app)/invoices/new/customer-field.tsx:22`, required, async search, clear off.
- Expenses > Filters: "Project" narrows the table. `app/(app)/expenses/filters.tsx:48`, optional, 40 projects loaded up front, clear on.
- Settings > Tax: "Region" picks from a fixed list of 61 regions. `app/(app)/settings/tax/region.tsx:15`, required, static.

### Example files
| File | Covers | Caption |
|---|---|---|
| `docs/system/examples/combobox/default.tsx` | default | Required customer field, empty, with the trigger |
| `docs/system/examples/combobox/show-clear.tsx` | showClear=true | Optional project filter with a value and the clear button |
| Not applicable: `showClear=false` is the stock default, shown by `default.tsx` | showClear=false | none |
| Not applicable: every call site uses the stock value, shown by `default.tsx` | showTrigger=true | none |
| Not applicable: `showTrigger` has one value in use, so `show-clear.tsx` is the whole matrix | matrix:showClear,showTrigger | none |
| `docs/system/examples/combobox/filled.tsx` | state:filled | A picked customer in the input |
| `docs/system/examples/combobox/open.tsx` | state:open | The list open with 5 customers, one selected |
| `docs/system/examples/combobox/loading.tsx` | state:loading | A search in flight, earlier results kept and unpickable |
| `docs/system/examples/combobox/no-results.tsx` | state:no-results | The empty row for the query "zzzz" |
| `docs/system/examples/combobox/load-failed.tsx` | state:load-failed | The failure row with Retry, value kept |
| `docs/system/examples/combobox/invalid.tsx` | state:invalid | Required field submitted empty, with the error text |
| `docs/system/examples/combobox/disabled.tsx` | state:disabled | The field while its form saves |
| `docs/system/examples/combobox/read-only.tsx` | state:read-only | A sent invoice's customer, no trigger or clear |
| `docs/system/examples/combobox/disabled-item.tsx` | state:disabled-item | An archived customer in the open list |
| `docs/system/examples/combobox/long-name.tsx` | state:long-name | A 48-character name, truncated in the input and wrapped in the list |
| `docs/system/examples/combobox/in-invoice-form.tsx` | composition:Field | The Bill to field inside the New invoice form, with label and error text |

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

### When to use
- The person picks one record from a list that grows with the account's data, such as customers or projects
- The fixed list is longer than Select holds without scrolling (see Limits), and people know the name they want

### When not to use
- 4 or fewer fixed options. Use RadioGroup instead, as 6 of 7 such fields in the app already do
- 5 to 15 fixed options where typing adds nothing. Use Select instead
- The person picks several values. Use the coverage-gaps row "Multi-value choice" instead
- The person picks an action to run, not a value for a field. Use Command instead

### Behavior
- `rule/combobox-debounce`: When the input text changes, start the search 150ms after the last keystroke instead of on every keystroke, because unthrottled requests for "acme l" returned out of order and briefly listed results for "acm". Evidence: app 3/3 async call sites go through `CustomerPicker` (`SEARCH_DELAY_MS`); measured 6 requests and one out-of-order response without the delay, 1 request with it, .design-system/evidence/combobox/debounce-network.txt. Check: test `customer-picker.test.tsx` "sends one request per pause".
- `rule/combobox-keep-results`: When a search is in flight, keep the previous results listed with `aria-disabled` instead of clearing the list, because clearing moves the list height between 0 and 216px on every keystroke. Evidence: measured 0 to 216px per keystroke when cleared and a constant 216px when kept, .design-system/evidence/combobox/keystroke-height.json; app 3/3 async call sites. Check: test `customer-picker.test.tsx` "keeps results while loading".
- `rule/combobox-failure-keeps-value`: When a search fails, keep the selected value and the typed text and show a "Retry" button in the status row, because the person can recover without retyping. Evidence: principle heuristic: help users recognize, diagnose and recover from errors, applied as `trap/field-keeps-input`; app 3/3 async call sites. Check: test "keeps value on failed search".
- `rule/combobox-archived-disabled`: When a record is archived, list it with `aria-disabled` and the suffix "Archived" instead of hiding it, because a selected archived record then still has a row that explains why the field is invalid. Evidence: app 11/11 call sites receive archived records from the API; gate G-07 default. Check: test "archived customer shows as disabled".
- `rule/combobox-escape`: When `Escape` is pressed with the list open, close it and keep the typed text, and when the list is closed, reset the text to the selected value, because that is the keyboard model screen reader users expect from a combobox. Evidence: principle platform: WAI-ARIA Authoring Practices combobox pattern, which Base UI implements. Check: test for the open case, review for the closed case.

### Limits
- `rule/combobox-min-options`: When a fixed list has 15 or fewer options, use Select instead of Combobox, because Select shows up to 15 options at 390x844 without scrolling, so typing saves nothing. Evidence: measured Select popup scrolls at 16 options at 390x844, .design-system/evidence/select/grow-count-390.json. Check: review, with the option count in the PR.
- `rule/combobox-name-length`: When a record name is longer than 28 characters, truncate it with an ellipsis in the input and wrap it to at most 2 lines in the list instead of widening the popup, because a popup wider than the input runs past a 390px screen. Evidence: measured truncation at 29 characters in the input at 390px, .design-system/evidence/combobox/grow-text-390.json; measured longest customer name in seed data, 48 characters, .design-system/evidence/combobox/seed-names.txt. Check: probe on `long-name.tsx`.

### Content
- Follows `rule/writing-record-names`.
- `rule/combobox-placeholder`: When the input is empty, the placeholder reads "Search {objects}" instead of "Select…", because the placeholder is the only cue that typing filters the list. Evidence: app 9/11 call sites, the two "Select…" placeholders on strays.tsv. Check: lint `rule/combobox-placeholder` on the `placeholder` prop.
- `rule/combobox-empty-row`: When a search returns nothing, the empty row reads "No {objects} match '{query}'", because repeating the query shows a typo without looking back at the input. Evidence: app 3/3 async call sites. Check: test "empty row repeats the query".
- `rule/combobox-status-copy`: When the status row shows, it reads "Searching…" while loading and "{Object} search failed" on failure, with the action "Retry", because the failure names what failed and the action names what it does. Evidence: app 3/3 async call sites; principle heuristic: help users recognize, diagnose and recover from errors. Check: test on `loading.tsx` and `load-failed.tsx`.

### Best practices
- `rule/combobox-in-field`: When a Combobox sits in a form, wrap it in `Field` with a visible `FieldLabel` instead of naming it by placeholder, because the placeholder disappears once a value is picked and the field loses its name. Evidence: app 11/11 call sites; principle wcag: 3.3.2 Labels or Instructions. Check: lint `trap/label-unbound`.
  Don't: `<Combobox><ComboboxInput placeholder="Customer" /></Combobox>`
- `rule/combobox-stack-narrow`: When a form row would hold two Comboboxes, stack them below 640px instead of placing them side by side, because side by side at 390px each input truncates names past 14 characters. Evidence: measured 171px per input and truncation at 15 characters, .design-system/evidence/combobox/two-up-390.json; single use `app/(app)/expenses/filters.tsx:44`. Check: probe on the Expenses filters at 390.
  Don't: `<div className="grid grid-cols-2"><CustomerPicker /><ProjectPicker /></div>`
- `rule/combobox-not-in-popover`: When a Combobox is needed inside a `Popover` or `Menu`, move the task into a `Dialog` instead, because Escape in the nested list closed both layers and sent focus to the page body. Evidence: measured 1 Escape closing 2 layers with focus on `body`, .design-system/evidence/combobox/nested-popover.txt. Check: review.
  Don't: `<PopoverContent><Combobox items={projects} /></PopoverContent>`

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
- RadioGroup: fixed lists of 4 or fewer options.
- NativeSelect: the mobile settings screens, where the platform picker is expected.
- Command: a list of actions rather than a value for a field.
````

## How each answer was found

Each question from `spec-template.md`, with what the worker ran or read in Northwind and what it concluded. This is the part to copy.

**1. Foundation.** `npx shadcn@latest info --json` gave style `base-nova` and base `base`. `npx shadcn@latest add combobox --diff components/ui/combobox.tsx` printed no changes, so the file is `stock`. `rg -l '@/components/ui/combobox' app components` found 11 call sites and one wrapper, `CustomerPicker`. Reading the wrapper showed the status row and the `showClear` logic, which became the right column. Nothing in that column came from memory of what shadcn usually ships.

**2. Variants.** `rg -n 'showClear' app components` gave 4 `true` and 7 `false`. Every `false` sat beside `required`, which is why the variant line says so. `showTrigger` never appears, so the stock default holds everywhere, and the unused `false` value is left out rather than documented on speculation.

**3. States.** The worker listed candidate states from `component-contract.md`, then kept the ones the code can reach. The 150ms comes from `SEARCH_DELAY_MS` in `CustomerPicker`, not from a guideline. "Archived" came from the API type, where `archived: true` maps to `disabled`. Each state was captured per `browser.md` at 390 and 1280, light and dark. No results came from typing "zzzz". Load failed was reached safely with `agent-browser network route "**/api/customers*" --abort`, without breaking a real server. Read-only needed a sent invoice, which the seed data has. The "Checked by" column came from `components/ledger/customer-picker.test.tsx`: states it asserts are `test`, and the rest say how they were seen.

**4. Precedence.** The worker listed every pair of states the code lets hold at once, by reading which flags can be true together (`isSubmitting` with `errors.customer`, `isLoading` with an empty result), then observed each pair in the browser. Most had an answer in code. Selected and disabled item did not. An archived customer could stay selected with no cue. That became gate G-07, "Show an archived selection as invalid?", with "yes" as the default. The spec records the default, and the gate stays open in the run record.

**5. Keyboard.** Each key was pressed on the New invoice route with `agent-browser press`, and focus was read from `agent-browser snapshot -i` after each press. Escape on a closed input resets the text in the browser but has no test, so it says `by hand`.

**6. ARIA.** `agent-browser snapshot -s '[data-slot=combobox]'` gave the roles and properties per part. `agent-browser a11y --tags wcag2a,wcag2aa` found no violations on the field. The status row's announcement cannot be read from a snapshot, so it went to the by-hand list.

**7. Usage, by the ten questions in `rule-method.md`.** The worker took each question in turn and wrote what it found.

- *Job and not for.* The call sites split into records that grow (customers, projects) and fixed lists (regions, currencies, payment terms). `rg -n "<RadioGroup\b" app` found 7 fixed choice fields with 4 or fewer options, 6 of them radios, which became the RadioGroup line. Multi-value choice has no component, so the line names its coverage-gaps row instead of promising a spec.
- *Where it breaks and limits.* `probe.mjs --grow --dimension count` on Select at 390x844 found the popup scrolls at 16 options, so 15 is Select's ceiling and Combobox's floor. `--dimension text` on the Bill to input found truncation at 29 characters. The seed data's longest name is 48, so truncation is real, and the rule says what happens instead of banning long names.
- *States over time.* The network log for typing "acme l" with the delay set to 0 showed 6 requests and one response out of order. That measurement, not the constant in the code, is why the debounce is a rule. List height per keystroke came from the same run.
- *Input methods.* Escape, Tab and Enter were pressed in both open and closed states. The closed-state reset has no test, so its Check says review for that half.
- *Copy slots.* The worker read the `placeholder` and `empty-title` rows for Combobox in `docs/system/copy-inventory.tsv`, found 9 of 11 placeholders in one shape, and cited the writing page's record-names rule instead of restating it.
- *Composition and density.* The Expenses filters are the one place two Comboboxes share a row, so that rule carries a single-use note plus a measurement. The nested Popover case was built as a throwaway example in the evidence folder, run once, and recorded.

**Rule tests.** Each rule was run through the four tests and recorded in `docs/system/rule-tests/combobox.tsv`. Three rows:

```
rule_id	falsify	negation	two_agent	sweep	verdict	notes
rule/combobox-placeholder	pass	pass	pass	pass	ship	lint fires on placeholder="Select…"; 2 strays listed
rule/combobox-min-options	pass	pass	pass	pass	rewritten	first draft said "short fixed lists" and failed two-agent (Select vs Combobox at 12); now 15, measured
rule/combobox-stack-narrow	pass	pass	pass	pass	ship	single use, grounded by the 390 measurement
```

The first draft of the min-options rule said "short fixed lists". Two fresh agents given "add a currency picker with 12 options" chose Select and Combobox. The rewrite put the measured number in, and both then chose Select.

**8. Tokens.** Read from the classes in `combobox.tsx` (`border-input`, `ring-ring`, `bg-popover` and so on), each mapped to its CSS variable in the `tailwindCss` file. No token was inferred from a screenshot.

**9. What is checked where.** Every by-hand row went to the verifier's list in the run record, so a person knows exactly what no script covers.

**10. Traps.** The rows for the Choice, Text entry, Actions and Overlays families in `traps.md` were each answered in a named section or marked `n/a` with a reason.

## What a worker should copy

- Each answer names where it came from: a command, a file and line, a capture, or a gate.
- Numbers come from the app or a measurement on it. The debounce, the call-site counts, 15 options and 28 characters are Northwind's. Another app measures its own.
- Every rule names its ground: a count, a measurement with its evidence path, or a named principle. A single use says so and adds a second ground.
- A rule that two agents read differently gets the missing number, then gets tested again.
- A question the code does not answer becomes a gate with a default, and the spec records the default.
- The spec never imports a preference from another product.
