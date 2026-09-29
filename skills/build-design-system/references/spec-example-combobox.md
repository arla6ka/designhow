# Worked spec: Combobox

> For the team setting this up: this shows how a spec gets derived, and how deep it goes. It describes an invented invoicing app, Acme Invoices, whose Combobox wraps a headless library's combobox. Every value came from that app's code, call sites, captures and measurements, and the second half shows the command or reading behind each answer. A worker copies the method, never the values. Replace this file with one of your own specs once one passes the check.
>
> Acme is a React app, so paths, imports and snippets are JSX. In another framework they change. The questions, grounds and checks do not.

Contents

- The spec
- How each answer was found
- What a worker should copy

## The spec

The file below passes `scripts/check-spec.mjs`. Everything between the fences is the spec as it sits at `docs/system/combobox.md`. Acme's narrowest supported width is 390px, so every measurement below is taken there.

````markdown
# Combobox

## Description
Combobox lets someone pick one record from a list too long to scan, by typing part of its name.

`import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox"`, source `components/ui/combobox.tsx`, status `ready-with-gaps`.
Foundation: headless library Combobox, wrapped in `components/ui/combobox.tsx`. Traps checked: `trap/field-label` (ARIA), `trap/field-error-link` (States, ARIA), `trap/field-keeps-input` (precedence), `trap/select-value-lost` (precedence), `trap/select-empty-value` (Variants), `trap/select-async` (States, precedence), `trap/loading-layout-shift` (States), `trap/overlay-focus-return` (Keyboard), `trap/overlay-conditional-render` n/a because the library root owns the popup and callers never mount it.

### Foundation
| Given by the foundation | Added by the team |
|---|---|
| Combobox root, input, popup, list, items, empty slot, keyboard model and ARIA wiring | `ComboboxStatus`, a row inside the list for loading and load errors, in `components/invoices/combobox-status.tsx`, because customer search hits the API |
| `showTrigger` and `showClear` on `ComboboxInput` | `CustomerPicker` sets `showClear` from the field's `required` flag |
| Item highlight and selected check mark | None. The wrapper has no local edits |

Parts, in reading order: input, trigger (optional), clear button (optional), popup with list, items, empty row, status row (team, optional).

## Examples
Default: `docs/system/examples/combobox/default.tsx`.

Real uses, 11 call sites (`rg -n "<Combobox\b" src components`, outside `components/ui/`). Three are below.

- New invoice, "Bill to": `src/invoices/new/customer-field.tsx:22`, required, async search, clear off.
- Expenses filters, "Project": `src/expenses/filters.tsx:48`, optional, 40 projects loaded up front, clear on.
- Tax settings, "Region": `src/settings/tax/region.tsx:15`, required, 61 fixed regions.

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
| Load failed | The search request failed | Retry from the status row, or keep typing | Status row "Customer search failed" with a Retry button | test |
| Disabled item | The record is archived | Read it, skip past it | "Archived" suffix, `aria-disabled="true"` | snapshot |
| Invalid | Submitted with no value in a required field, or the value was archived since | Pick a valid record | Error text under the field from `FieldError`, `aria-invalid="true"` | test |
| Disabled | The parent form is saving | Read the value. Focus stays on the input and presses do nothing until the save settles | `aria-disabled="true"` on the input, no response from the trigger | test |
| Read-only | The invoice is sent and locked, or the user lacks edit rights | Read and copy the value | No trigger or clear button, `readOnly` on the input | by hand |
| Long name | A customer name longer than the input | Read the full name in the list | Input truncates with an ellipsis, list items wrap to two lines | screenshot |

### State precedence
- Disabled and invalid: disabled wins. The error text hides while the form saves, so a pending save never shows a stale error.
- Disabled and open: disabled wins. The list closes, and focus stays on the input.
- Read-only and invalid: read-only wins. A locked invoice never shows field errors.
- Loading results and no results: loading wins until the request settles, so the empty row never flashes during a search.
- Loading results and load failed: load failed wins for the request it came from. A newer request in flight shows loading again.
- Invalid and filled: both show. A failed submit keeps the value and the typed text.
- Load failed and filled: both show. A failed search never clears the selected value.
- Invalid and open: both show. The error text stays under the field while the list is open.
- Selected item and disabled item: disabled item wins in the list. An archived customer that is still the value shows "Archived", cannot be picked again, and the input turns invalid.
- Focus visible and highlighted item: both show. Focus stays on the input while the highlight moves.

## Props
gen-docs writes the table from the root and `ComboboxInput` prop types. `showClear` defaults to `false` in the stock wrapper, and `CustomerPicker` always passes it, so the stock default never reaches a screen.

## Usage

### When to use
- The person picks one record from a list that grows with the account's data, such as customers or projects
- The fixed list is longer than Select holds without scrolling (see Limits), and people know the name they want

### When not to use
- 4 or fewer fixed options. Use RadioGroup instead, as 6 of 7 such fields in the app already do
- 5 to 15 fixed options where typing adds nothing. Use Select instead
- The person picks several values. Use the coverage-gaps row "Multi-value choice" instead
- The person picks an action to run, not a value for a field. Use Command instead

### Rules
- `rule/combobox-debounce`: When the input text changes, start the search 150ms after the last keystroke instead of on every keystroke, because unthrottled responses arrived out of order and listed an older query's results. Evidence: app 3/3 async call sites use `SEARCH_DELAY_MS`; measured 6 requests with one out of order without the delay, 1 with it, .design-system/evidence/combobox/debounce-network.txt. Check: test `customer-picker.test.tsx` "sends one request per pause".
  - Don't: `<ComboboxInput onChange={(e) => search(e.target.value)} />`
  - Do: `<ComboboxInput onChange={(e) => searchLater(e.target.value)} />`, with `searchLater` debounced by `SEARCH_DELAY_MS`
- `rule/combobox-keep-results`: When a search is in flight, keep the previous results listed with `aria-disabled` instead of clearing the list, because clearing moves the list height between 0 and 216px on every keystroke. Evidence: measured 0 to 216px per keystroke when cleared, constant when kept, .design-system/evidence/combobox/keystroke-height.json; app 3/3 async call sites. Check: test `customer-picker.test.tsx` "keeps results while loading".
  - Don't: `{isLoading ? null : <ComboboxList items={results} />}`
  - Do: `<ComboboxItem value={r} aria-disabled={isLoading}>{r.name}</ComboboxItem>`
- `rule/combobox-failure-keeps-value`: When a search fails, keep the selected value and the typed text and show a "Retry" button in the status row, because the person can recover without retyping. Evidence: principle heuristic: help users recognize, diagnose and recover from errors, applied as `trap/field-keeps-input`; app 3/3 async call sites. Check: test "keeps value on failed search".
  - Don't: `onError={() => { setValue(null); setQuery(""); }}`
  - Do: `onError={() => setStatus("failed")}`
- `rule/combobox-archived-disabled`: When a record is archived, list it with `aria-disabled` and the suffix "Archived" instead of hiding it, because a selected archived record then keeps a row that explains why the field is invalid. Evidence: app 11/11 call sites receive archived records from the API; gate G-07 default. Check: test "archived customer shows as disabled".
  - Don't: `items={customers.filter((c) => !c.archived)}`
  - Do: `<ComboboxItem value={c} aria-disabled={c.archived}>{c.name}</ComboboxItem>`
- `rule/combobox-escape`: When `Escape` is pressed with the list open, close it and keep the typed text, and when the list is closed, reset the text to the selected value, because screen reader users expect that keyboard model. Evidence: principle platform: WAI-ARIA Authoring Practices combobox pattern, which the library implements. Check: test for the open case, review for the closed case.
  - Don't: `<ComboboxInput onKeyDown={(e) => e.key === "Escape" && setQuery("")} />`
  - Do: `<ComboboxInput />`, keeping the library's Escape
- `rule/combobox-in-field`: When a Combobox sits in a form, wrap it in `Field` with a visible `FieldLabel` instead of naming it by placeholder, because the placeholder disappears once a value is picked. Evidence: app 11/11 call sites; principle wcag: 3.3.2 Labels or Instructions. Check: lint `trap/label-unbound`.
  - Don't: `<Combobox><ComboboxInput placeholder="Customer" /></Combobox>`
  - Do: `<Field><FieldLabel>Customer</FieldLabel><Combobox><ComboboxInput /></Combobox></Field>`
- `rule/combobox-stack-narrow`: When a form row would hold two Comboboxes, stack them below 640px instead of placing them side by side, because side by side at 390px each input truncates names past 14 characters. Evidence: measured 171px per input and truncation at 15 characters, .design-system/evidence/combobox/two-up-390.json; single use `src/expenses/filters.tsx:44`. Check: probe on the Expenses filters at 390.
  - Don't: `<FormRow columns={2}><CustomerPicker /><ProjectPicker /></FormRow>`
  - Do: `<FormRow columns={{ base: 1, md: 2 }}><CustomerPicker /><ProjectPicker /></FormRow>`
- `rule/combobox-not-in-popover`: When a Combobox is needed inside a `Popover` or `Menu`, move the task into a `Dialog` instead, because Escape in the nested list closed both layers and sent focus to the page body. Evidence: measured 1 Escape closing 2 layers with focus on `body`, .design-system/evidence/combobox/nested-popover.txt. Check: review.
  - Don't: `<PopoverContent><Combobox items={projects} /></PopoverContent>`
  - Do: `<DialogContent><Combobox items={projects} /></DialogContent>`

### Content
- Follows `rule/writing-record-names`.
- `rule/combobox-placeholder`: When the input is empty, the placeholder reads "Search {objects}" instead of "Select…", because the placeholder is the only cue that typing filters the list. Evidence: app 9/11 call sites, the two "Select…" placeholders on strays.tsv. Check: lint `rule/combobox-placeholder` on the `placeholder` prop.
  - Don't: `<ComboboxInput placeholder="Select…" />`
  - Do: `<ComboboxInput placeholder="Search customers" />`
- `rule/combobox-empty-row`: When a search returns nothing, the empty row reads "No {objects} match '{query}'", because repeating the query shows a typo without looking back at the input. Evidence: app 3/3 async call sites. Check: test "empty row repeats the query".
  - Don't: `<ComboboxEmpty>No results</ComboboxEmpty>`
  - Do: `<ComboboxEmpty>No customers match '{query}'</ComboboxEmpty>`
- `rule/combobox-status-copy`: When the status row shows, it reads "Searching…" while loading and "{Object} search failed" on failure, with the action "Retry", because each names what happened or what the press does. Evidence: app 3/3 async call sites; principle heuristic: help users recognize, diagnose and recover from errors. Check: test on `loading.tsx` and `load-failed.tsx`.
  - Don't: `<ComboboxStatus>Loading...</ComboboxStatus>`
  - Do: `<ComboboxStatus>Searching…</ComboboxStatus>`

### Anti-slop
- `rule/combobox-server-search`: When the records are customers or projects, send the typed text to the search request through `onSearch` and list what it returns instead of filtering an array passed as `items`, because an account in the seed data holds 12,000 customers and a preloaded list took 2.4s to open. Evidence: measured 2.4s to first open with 12,000 seeded customers, .design-system/evidence/combobox/preload-open.txt; app 3/3 async call sites. Check: review.
  - Don't: `<Combobox items={allCustomers} />`
  - Do: `<CustomerPicker onSearch={searchCustomers} />`
- `rule/combobox-no-hand-built`: When a picker needs a search box, use `Combobox` instead of a `Popover` holding an `Input` and a list, because a fresh agent's hand-built picker exposed no listbox and ignored Down Arrow. Evidence: measured 0 listbox roles and no arrow-key handling in a fresh agent's picker, .design-system/evidence/combobox/fresh-agent-snapshot.txt; app 11/11 pickers use Combobox. Check: lint on `PopoverContent` holding an `Input`.
  - Don't: `<PopoverContent><Input /><ul>{items}</ul></PopoverContent>`
  - Do: `<Combobox items={projects}><ComboboxInput /></Combobox>`

### Limits
- `rule/combobox-min-options`: When a fixed list has 15 or fewer options, use Select instead of Combobox, because Select shows 15 options at 390x844 without scrolling, so typing saves nothing. Evidence: measured Select scrolls at 16 options at 390x844, .design-system/evidence/select/grow-count-390.json. Check: review, with the option count in the PR.
  - Don't: `<Combobox items={["Net 7", "Net 14", "Net 30"]} />`
  - Do: `<Select items={["Net 7", "Net 14", "Net 30"]} />`
- `rule/combobox-name-length`: When a record name is longer than 28 characters, truncate it with an ellipsis in the input and wrap it to at most 2 lines in the list instead of widening the popup, because a popup wider than the input runs past a 390px screen. Evidence: measured truncation at 29 characters at 390px, .design-system/evidence/combobox/grow-text-390.json; measured longest seeded name 48 characters, .design-system/evidence/combobox/seed-names.txt. Check: probe on `long-name.tsx`.
  - Don't: `<ComboboxContent className="w-max">`
  - Do: `<ComboboxContent>`, with each item wrapping to 2 lines

## Accessibility
Rests on the library's combobox. The input keeps focus throughout, and the popup never takes it.

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
| Input | combobox | The field's `Label` through `htmlFor` | `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-invalid`, `aria-disabled` | Name, value, and collapsed or expanded, on focus | snapshot |
| List | listbox | The field's label | `aria-busy` while loading | Nothing on its own | snapshot |
| Item | option | Its text | `aria-selected`, `aria-disabled` | Name and position, such as "Acme Ltd, 2 of 9" | a11y scan |
| Status row | status | Its text | Polite live region | "Searching…" once per request, and the failure text | by hand |

Contrast: NEEDS REVIEW. The status row text on the popup surface was not measured in dark mode.

## Tokens
| Part | State | Token |
|---|---|---|
| Input border | all | `--border-input` |
| Input border | invalid | `--border-danger` |
| Focus ring | focus visible | `--focus-ring` |
| Popup surface and text | open | `--surface-popover`, `--text-on-popover` |
| Item | highlighted | `--surface-highlight`, `--text-on-highlight` |
| Placeholder, empty and status rows | all | `--text-muted` |
| Popup corners | open | `--radius-popover` |

## Related
- Select: fixed lists of 5 to 15 options that need no typing.
- RadioGroup: fixed lists of 4 or fewer options.
- NativeSelect: the mobile settings screens, where the platform picker is expected.
- Command: a list of actions rather than a value for a field.
````

## How each answer was found

Each question from `spec-template.md`, with what the worker ran or read in Acme Invoices and what it concluded. This is the part to copy.

**1. Foundation.** The worker diffed `components/ui/combobox.tsx` against the library's stock version, as the foundation reference says, and found no local edits. `rg -l 'components/ui/combobox' src components` found 11 call sites and one wrapper, `CustomerPicker`, whose status row and `showClear` logic became the right column. Nothing there came from memory of what the library usually ships.

**2. Variants.** `rg -n 'showClear' src components` gave 4 `true` and 7 `false`, and every `false` sat beside `required`. `showTrigger` never appears, so the stock default holds everywhere and the unused `false` is not documented on speculation.

**3. States.** The worker listed candidate states from `component-contract.md` and kept the ones the code can reach. The 150ms comes from `SEARCH_DELAY_MS` in `CustomerPicker`, not a guideline. "Archived" came from the API type. Each state was captured per `browser.md` at the narrow and wide widths, light and dark. Load failed was reached by blocking the customers request in the browser (`browser.md`), without breaking a real server. Read-only needed a sent invoice from the seed data. States that `customer-picker.test.tsx` asserts are `test` under Checked by, and the rest say how they were seen.

**4. Precedence.** The worker listed every pair of states the code lets hold at once, by reading which flags can be true together (`isSubmitting` with `errors.customer`, `isLoading` with an empty result), then observed each pair in the browser. Selected and disabled item had no answer in code, so an archived customer could stay selected with no cue. That became gate G-07, "Show an archived selection as invalid?", defaulting to "yes". The spec records the default, and the gate stays open in the run record. A save that disables the field keeps focus on the input with `aria-disabled`, per `traps.md`.

**5. Keyboard.** Each key was pressed on the New invoice route in the browser (`browser.md`), with focus read from an accessibility snapshot after each press. Escape on a closed input works but has no test, so it says `by hand`.

**6. ARIA.** An accessibility snapshot of the field gave roles and properties per part, and an automated WCAG A and AA scan found no violations. A snapshot cannot show the status row's announcement, so it went to the by-hand list.

**7. Usage, by the eleven questions in `rule-method.md`.**

- *Job and not for.* The call sites split into records that grow (customers, projects) and fixed lists (regions, currencies, payment terms). `rg -n "<RadioGroup\b" src` found 7 fixed choice fields with 4 or fewer options, 6 of them radios, which became the RadioGroup line. Multi-value choice has no component, so the line names its coverage-gaps row instead of promising a spec.
- *Where it breaks and limits.* `probe.mjs --grow --dimension count` on Select at 390x844 found the popup scrolls at 16 options, so 15 is Select's ceiling and Combobox's floor. `--dimension text` on the Bill to input found truncation at 29 characters. The longest seeded name is 48, so the rule says what happens instead of banning long names.
- *States over time.* The network log for a typed query with the delay set to 0 showed 6 requests and one response out of order. That measurement, not the constant in the code, is why the debounce is a rule. List height per keystroke came from the same run.
- *Copy slots.* The worker read the `placeholder`, `empty-title` and `status` rows for Combobox in `docs/system/copy-inventory.tsv`, found 9 of 11 placeholders in one shape, and cited the writing page's record-names rule instead of restating it. "Searching…" sits in the status row, a live region, and never replaces a label.
- *Composition and density.* The Expenses filters are the one place two Comboboxes share a row, so that rule carries a single-use note plus a measurement. The nested Popover case was built as a throwaway example in the evidence folder, run once, and recorded.
- *Slop.* A fresh agent given only "add a project picker to the expense form" loaded every project up front and built a Popover with an Input inside. Its snapshot and the open time on the seed data became the two Anti-slop rules.
- *Don't and Do.* Each Don't is the rule's falsify snippet, written with the real parts, and each Do is the same case the way the call sites write it.

**Rule tests.** Each rule went through the four tests, recorded in `docs/system/rule-tests/combobox.tsv`. Three rows:

```
rule_id	falsify	negation	two_agent	sweep	verdict	notes
rule/combobox-placeholder	pass	pass	pass	pass	ship	lint fires on placeholder="Select…"; 2 strays listed
rule/combobox-min-options	pass	pass	pass	pass	rewritten	first draft said "short fixed lists" and failed two-agent (Select vs Combobox at 12); now 15, measured
rule/combobox-stack-narrow	pass	pass	pass	pass	ship	single use, grounded by the 390 measurement
```

Given the first min-options draft and "add a currency picker with 12 options", two fresh agents chose Select and Combobox. With the measured number in, both chose Select.

**8. Tokens.** Read from the component's styles, with each class or style reference traced to its variable in the token source. No token was inferred from a screenshot.

**9. What is checked where.** Every by-hand row went to the verifier's list in the run record.

**10. Traps.** The rows for the Choice, Text entry, Actions and Overlays families in `traps.md` were each answered in a named section or marked `n/a` with a reason.

## What a worker should copy

- Each answer names where it came from: a command, a file and line, a capture, or a gate.
- Numbers come from the app or a measurement on it. The debounce, the counts, 15 options and 28 characters are Acme's.
- A single use says so and adds a second ground.
- A rule two agents read differently gets the missing number and another test.
- A question the code does not answer becomes a gate with a default, and the spec records the default.
