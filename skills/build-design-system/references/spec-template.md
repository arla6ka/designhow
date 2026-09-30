# Component spec template

A spec is the component's docs entry with every question below answered. It uses the nine H2s of the component page, in order (`component-docs` `references/doc-format.md`, Headings, in order), and adds required H3s and tables inside them. `component-docs` writes the prose, and `scripts/check-spec.mjs` fails a spec that leaves a question open. Add questions if your team needs them. Drop none.

Contents

- Where specs live and who fills them
- The fixed questions
- The template
- Answering well
- Moving an older spec
- What the check enforces

## Where specs live and who fills them

One file per component at `docs/system/<component>.md` in the app's repo, the path `system-structure.md` gives the entry. The page and its Markdown twin render from it.

In build, harden and seed modes, the one writer `coordinator-path.md` (Lock before fan-out) names fills the first spec as the pattern, in the same commit as its component, and the coordinator shows its page to the person before any fan-out. Then the coordinator sends one component per worker with `references/worker-brief.md`, naming that first spec as the exemplar, pasting this template, `rule-method.md` for the Usage rules, `spec-example-combobox.md` for depth and method, and the family's trap rows from `traps.md`. A worker fills the spec from the component's code, call sites and rendered states in this app. It never copies answers from the example, which describes a different app.

## The fixed questions

Every spec answers each of these, or marks it `Not applicable: <reason>` or `NOT SUPPLIED: <what is missing>`.

1. What job does it do, what does it render on, and what did the foundation give versus what did the team add?
2. Which variant axes exist, which values does each take, and which call sites use each value?
3. Which states exist? For each one, what triggers it, what can the user do, what shows it besides color, and how is it checked? Which state changes move, and on which preset?
4. When two states hold at once, which wins? Every pair that can co-occur has an answer.
5. Which keys do what, and where does focus go after open, close, select, submit and error?
6. What role, accessible name, ARIA states and announcements does it expose, in every variant?
7. The eleven questions in `rule-method.md`, each answered as a rule, a row or `Not applicable: <reason>`.
8. Which tokens does it read, per part and per state?
9. What does a script check, and what does a person check by hand?
10. Which traps from `traps.md` apply to its family, and where does the spec answer each?
11. Which example files show each variant value, each state and one composition?

## The template

Copy it whole. Replace every `<...>`. A leftover `<...>` fails the check.

````markdown
# <Component>

## Description
<One sentence on the job it does, with nothing about how it looks.>

`<import line>`, source `<path>`, status `<ready | ready-with-gaps | blocked>`.
Foundation: `<registry item (style, base) | <library> <Component> | hand-rolled>`. Traps checked: `<trap ids>`.

### Foundation
| Given by the foundation | Added by the team |
|---|---|
| <behavior, part or prop the foundation ships> | <what the team changed or added, and why> |

## Examples
<Default example from its example file.>

Real uses, <n> call sites (<the rg command that counted them>):
- <One per real use: screen, what put it there, variant, and file:line.>

### Example files
| File | Covers | Caption |
|---|---|---|
| `<examples dir>/<component>/default.<ext>` | default | <what it renders, one line> |
| `<examples dir>/<component>/<axis>-<value>.<ext>` | <axis>=<value> | <one line> |
| `<examples dir>/<component>/<state>.<ext>` | state:<state> | <one line> |
| `<examples dir>/<component>/in-<parent>.<ext>` | composition:<Parent> | <one line> |

## Variants

### <axis prop>
- `<value>`: <the job this value covers>. Used at <n> call sites.

## States
| State | Trigger | What the user can do | Shown by, besides color | Checked by |
|---|---|---|---|---|
| <state> | <event or data that causes it> | <actions available> | <text, icon, attribute or shape> | <test, lint, screenshot, a11y scan or by hand> |

### State precedence
- <State A> and <State B>: <winning state> wins. <What the user sees.>

### Motion
| Trigger | Kind | Preset | Properties | Reduced motion |
|---|---|---|---|---|
| <state change, such as closed to open> | <input or announce> | `<preset>` | <transform, opacity> | <what shows instead> |

## Props
<Notes only. gen-docs writes the table from the types into the twin. Purpose text goes in JSDoc on the props type.>

## Usage

### When to use
- <situation a user or designer is in>

### When not to use
- <situation>. Use <Other component> instead.

### Rules
- `rule/<component>-<slug>`: When <condition>, <action>, because <reason>. Evidence: <ground>. Check: <lint | test | probe | review> <what runs>.
  - Don't: `<the falsify snippet, one line>`
  - Do: `<the same case written correctly, one line>`

### Content
- Follows `rule/writing-<slug>`.
- `rule/<component>-<slug>`: When <slot> <condition>, <action with a literal or template>, because <reason>. Evidence: <ground>. Check: <lint | test | probe | review> <what runs>.
  - Don't: `<the wrong copy in the real component>`
  - Do: `<the right copy>`

### Anti-slop
- `rule/<component>-<slug>`: When <the case an agent gets wrong by default>, <action>, because <reason>. Evidence: <ground>. Check: <lint | test | probe | review> <what runs>.
  - Don't: `<what an agent writes by default>`
  - Do: `<what this system wants>`

### Limits
- `rule/<component>-<slug>`: When <count, length or size> exceeds <number>, <alternative> instead, because <what breaks>. Evidence: measured <value>, <evidence path>. Check: <lint | test | probe | review> <what runs>.
  - Don't: `<the case past the limit>`
  - Do: `<the alternative>`

## Accessibility
Rests on <native element or library primitive>.

### Keyboard
| Key | Where focus is | Effect | Focus after | Checked by |
|---|---|---|---|---|
| <key> | <part> | <what happens> | <where focus lands> | <test or by hand> |

### ARIA
| Part | Role | Accessible name from | States and properties | Announced | Checked by |
|---|---|---|---|---|---|
| <part> | <role> | <label, text or aria-label> | <aria-expanded and so on> | <what a screen reader hears, and when> | <a11y scan, snapshot or by hand> |

## Tokens
| Part | State | Token |
|---|---|---|
| <part> | <state or "all"> | `<token name as the source spells it>` |

## Related
- <Other component>: <when it is the better pick>.
````

## Answering well

- **Foundation.** Name what the foundation shipped, then list only real differences from its stock source, found by diffing against it. The foundation's reference (`base-shadcn.md`, `base-library.md`, `base-raw.md`) says how. A stock file has one row: "Stock. No team changes." On a package library, the left column is the library's component and the right is the wrapper. Raw code writes `Not applicable: hand-rolled` under the H3.
- **States.** Start from the list in `component-contract.md`, drop what does not apply with a reason, and add product states the code has, such as `syncing` or `locked`. A row with an empty cell fails. "Hover" whose only cue is color is still a row: its cue says "pointer only, color change", and precedence says what beats it. A pending state keeps the action's label and focus (`traps.md`, `trap/loading-label-swap`).
- **Precedence.** Write one line per pair of states that can hold at once, such as pending with invalid or disabled with focus. Each line says which state "wins", or "both show" when the two stack without conflict. A line that asks a question, says TBD, or has no winner fails. When only one state can hold at a time, write `Not applicable: <why the states exclude each other>`, as the whole list or on one pair's line, such as `- Filled and empty: Not applicable: a field is one or the other`. `NEEDS REVIEW` still fails, because the question is open. It is how a draft waits for a person.
- **Motion.** One row per state change that moves, from the component's code. Kind and preset follow `token-architecture.md` (Motion presets), and the rows answer the Motion traps in `traps.md`. A component with no transition or animation writes `Not applicable: no motion` under the H3.
- **Checked by.** Use `test`, `lint`, `screenshot`, `a11y scan`, `snapshot` or `by hand`. `by hand` puts the row on the verifier's list. A blank cell fails.
- **Traps.** Every trap id in `traps.md` for the component's family appears on the Description line, and the section that answers it says so. A trap that does not apply is listed with `n/a` and the reason.
- **Usage.** Follow `rule-method.md`. When to use and When not to use hold situations, not rules, and every When not to use line names a registry component or a coverage-gaps row with "instead". Rules, Content, Anti-slop and Limits hold rule lines only, plus citation lines such as ``- Follows `rule/writing-verb-chain`.`` for rules another page owns, and gated lines (below). Every rule carries a `Don't:` and a `Do:` line as a nested list, Don't first, each one line of real code against the system's import path, or real copy. The Don't is the falsify snippet. The exemplar spec sets the count per H3. A spec with under half the exemplar's rules in an H3 names the reason in its report. An H3 with nothing to say reads `Not applicable: <reason>`. Every rule has a row in `docs/system/rule-tests/<component>.tsv`.
- **Gated rules.** A rule the four tests sent to a gate (`rule-method.md`) leaves the page as a definition but keeps its place as one line, on component and foundation pages alike: ``- Gated: `rule/<page>-<words>` (G-NN). <the question in plain words>``, such as ``- Gated: `rule/badge-no-icon` (G-04). Should a badge carry an icon beside its label?``. Its `rule-tests` row has the verdict `gate` and names the gate in `notes`. Nothing may cite a gated rule. A gated line counts as an answer for `spec/usage-empty`.
- **Example files.** One row per file. Covers is `default`, `<axis>=<value>`, `state:<state>` (the registry's state name), `composition:<Parent>` or `matrix:<axis>,<axis>`. Every registry variant value and state is covered, or has a row whose File cell reads `Not applicable: <reason>`, such as a value that looks and behaves like default. Add at least one composition row, inside a parent a real call site uses, and one matrix row when the registry lists two or more variant axes. Each file is a complete module in the component's language: a first-line comment holding `Caption:` and the caption, an import of the component from the registry's import path, and one default-exported example with inert data.
- **Real uses.** Count them with `rg -n "<Name\b"` in the check's include folders, outside the component's own folder, and cite each as `file:line`. `check-spec.mjs` recounts the tags and rereads every cited line at close, so a spec written before a surface moved fails and gets rerun.
- **Numbers.** Measured values only. A contrast ratio comes from a tool run on the rendered page, per `browser.md`. Otherwise write `NEEDS REVIEW`.

`spec-example-combobox.md` shows the depth expected and how each answer was found. Copy the method, never its values.

## Moving an older spec

A spec written to the earlier Usage H3s (Behavior, Limits, Content, Best practices) moves in one commit per family: Behavior and Best practices rules go under Rules in that order, Limits moves last, Anti-slop is added, and every rule gains its Don't and Do pair. IDs never change. Run `check-spec.mjs` on the family before and after.

Older `component-docs` headings land here:

| Older heading | Section now |
|---|---|
| Summary, Parts | Description |
| In the product | Examples |
| Behavior | States |
| Use it when, Use something else when | Usage: When to use, When not to use |
| Writing | Usage: Content |
| Do and don't | Usage: Rules, each pair rewritten as a rule with its Don't and Do lines |

## What the check enforces

`node scripts/check-spec.mjs docs/system` prints one `file:line rule-id message` per failure and exits 1 on any. It treats a file as a spec only when it holds the marker `### State precedence`. A plain component entry without it is skipped and counted, so an unfinished spec with no precedence section is skipped too. Setup copies the script into the repo's `scripts/` and this template to `docs/system/spec-template.md`, where the check and the docs generator both skip it. The rules:

| Rule | Fails when |
|---|---|
| `spec/sections` | The nine H2s are missing, renamed, added to or out of order |
| `spec/usage-h3` | Usage lacks its six H3s in order: When to use, When not to use, Rules, Content, Anti-slop, Limits |
| `spec/usage-empty` | An H3 under Usage has no rule, citation, gated or `Not applicable: <reason>` line, or When to use or When not to use has no item |
| `spec/rule-id` | A rule line's ID is not `rule/<component>-<slug>`, or the ID is defined twice in `docs/system` |
| `spec/rule-shape` | A rule line lacks "When", "because", an `Evidence:` ground, a `Check:` value, or a checkable token, or a `Gated:` line breaks its format |
| `spec/vague-word` | A rule leans on a word from the vague list (`rule-method.md`) |
| `spec/dont-instead` | A rule that says don't, never or avoid does not say what to do instead |
| `spec/rule-cite` | A `Follows` line cites a rule ID no page in `docs/system` defines |
| `spec/alternative` | A When not to use line names no registry component and no coverage-gaps row |
| `spec/limits` | A Limits rule has no number or no `measured` ground |
| `spec/dont-do` | A rule has no nested `Don't:` line or no `Do:` line under it |
| `spec/rule-tests` | A rule has no `rule-tests` row, a test cell is not `pass` or `n/a: <reason>`, a defined rule's verdict is not `ship` or `rewritten`, or a `gate` row names no gate or its rule is still defined |
| `spec/examples` | A variant value or state has no Example files row, a composition row is missing, or a listed file is missing or incomplete |
| `spec/placeholder` | A `<...>` from the template is left in |
| `spec/foundation` | Description has no `Foundation:` line, or no `### Foundation` H3 with a filled table |
| `spec/traps` | Description has no `Traps checked:` line |
| `spec/states-table` | States has no table with State, Trigger and Checked by columns |
| `spec/states-empty` | A States row has an empty or `?` cell |
| `spec/motion` | The component's code has a transition or animation and the spec has no `### Motion` table, or a row leaves Kind, Preset or Reduced motion empty |
| `spec/precedence` | `### State precedence` is missing, empty, or has a line that asks a question, says TBD, or has none of "wins", "both show" or "Not applicable" with a reason |
| `spec/keyboard` | Accessibility lacks a `### Keyboard` table with at least one row |
| `spec/aria` | Accessibility lacks a `### ARIA` table with at least one row |
| `spec/checked-by` | A Checked by cell holds something other than the allowed words |
| `spec/tokens` | Tokens is empty, with no table and no `NOT SUPPLIED` |
| `spec/props-drift` | A Variants axis or value, or a Props note, no longer matches the component's props at HEAD. When the component forwards a native element's attributes, native names such as `type`, `disabled`, `readOnly` and `inputMode` count as props (`--no-props` skips it) |
| `spec/call-sites` | The "Real uses, <n> call sites" count differs from the `<Name` tags in the check's include folders outside the component's folder and the examples folder, or the line is missing |
| `spec/stale-cite` | A cited `file:line` or `file:start-end` no longer exists, or its text changed since the spec's last commit. A spec with uncommitted edits skips the text comparison. `--no-fresh` skips this rule and `spec/call-sites` |

Run it in CI beside the docs checks in `system-structure.md`. See it fail once on a spec with a blank state row before trusting it.
