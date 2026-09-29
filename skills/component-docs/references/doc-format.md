# Documentation format

> Replace this file with your team's format. It is a working default so the skill runs on day one, and the skill treats whatever it says as the agreed format. Edit the headings, section rules and example here, not in `SKILL.md`, and swap the worked example for one of your own published entries as soon as you have one.

The order follows a component page in the Geist design system. It opens with the job and examples to copy, then variants and states, then the API, usage and accessibility. `build-design-system` renders these same sections in this order as the component's docs page (its `references/system-structure.md`), so change both together or not at all.

## Headings, in order

Every entry uses these nine H2s in this order. Usage holds six fixed H3s, Examples holds `### Example files`, Variants holds one H3 per axis named after the prop, and Description may hold `### Parts`. Do not add, drop, rename or merge any other. A section with nothing sourced reads `Not applicable to this component.` when the component has no such thing, and `NOT SUPPLIED` when it has one and nobody provided it, each with a one-line reason.

1. `## Description`
2. `## Examples`
3. `## Variants`
4. `## States`
5. `## Props`
6. `## Usage`, holding `### When to use`, `### When not to use`, `### Behavior`, `### Limits`, `### Content` and `### Best practices`
7. `## Accessibility`
8. `## Tokens`
9. `## Related`

## When the entry is a spec

A spec is this entry with every question in the spec template answered. Read the template from the repo's `docs/system/`, with an existing spec there as the skeleton, and fall back to `build-design-system/references/spec-template.md` only when the repo has neither. The template owns everything a spec adds (extra H3s and tables, the "Gated:" line, the rules `check-spec.mjs` enforces). Where it differs from a section below, as with the States and Tokens tables, the template wins.

## What goes in each section

**Description.** One sentence on the job the component does, never how it looks. Under it, one plain line with the import statement, the runtime side when the framework splits server and client code (its client marker, its server-only marker, or none), the source path, and the status from `registry.json` when the repo has one. List named parts after that line in reading order, each required or optional, with the names from the source. When a part is also used without its parent, move the list into `### Parts` and give that part its props, standalone call sites and how it differs alone.

**Examples.** The default example first, copied verbatim from a story or example file, with its path above it. With no story or example file, the default is the most common real call site, simplified: drop props and children unrelated to the component, change nothing else, and put `simplified from <file:line>` above it. Then one entry per real use: the screen, what put the component there, and which variant appeared, followed by the call-site code when it was read. Mark unshipped screens `(not shipped)` and uses from a brief or pilot `(planned)`, with no code block. Never write example code that no source contains.

Then `### Example files`, a File, Covers and Caption table with one row per file: the default, every variant value and state with a visual or behavior difference, and one composition inside a parent a real use shows. The Covers values and the shape of each file are in `build-design-system/references/spec-template.md` (Answering well, Example files). Files live at `<examples dir>/<component>/<name>.<ext>`, where the examples dir is `examplesDir` in the repo's `scripts/gen-docs.config.json`, else `docs/system/examples`. A file uses only props, children and data a source shows. A direct run writes each missing file. Under a coordinator, it writes them only when the brief's SCOPE names the folder. A value or state with no file gets a row whose File cell reads `NOT SUPPLIED: <reason>` or `Not applicable: <reason>`, and caption `none`.

**Variants.** One H3 per variant axis, named after its prop (`### tone`, `### size`). Under each, one line per value giving its name and the job it covers. When two values cover the same job, say so. When the props type has no variant prop, the section reads `None.` with the reason and no H3. That is a finished section, not a gap.

**States.** One line per state that exists, saying what the user can do in it or what the component does. Check at least default, hover, focus, pressed, disabled, loading and error, and drop those it lacks. When two states can hold at once, say which wins and how to reach the pair ("click the item that is already selected"). Settle it from the built styles (which rule wins in the output) or from a browser read of the element and the rendered result. Mark it `NEEDS REVIEW` only when neither can reach it. Then cover edge conditions that apply: long text, empty content, a slow response, a narrow screen, many instances. Behavior no source or browser read shows goes under Guessed at.

When the current behavior looks like a bug, write it as it is, then a `Defect:` line to the owner with what goes wrong for the user and the smallest fix (`SKILL.md`, Defects). For example, `Defect: @acme/web, the close button has no accessible name, so a screen reader announces "button". Add aria-label="Close" in ui/dialog.tsx. (adds semantics only)` Documenting a defect is not accepting it.

**Props.** From code only, as a table: name, type, default, and when to change it. `NOT SUPPLIED` when no props type was read. When the docs site generates the table from the types, keep only notes the table cannot hold, such as a prop ignored in one variant.

**Usage.** Rules a designer or agent follows before reaching for the component. Derive them with `../build-design-system/references/rule-method.md` when the sibling skill is installed. Without it, the method in short:

- Ask per component: its job, what it is not for and what to use instead, where it breaks (length, count, viewport, input method, locale, data states), its limits, copy slots, states over time, input methods, accessibility contract, what it may contain or sit inside, and density and placement.
- Ground every rule in the app (two or more real call sites, or a stated single use), a measurement on the app (a probe or computed style, with its path), or a named principle (an accessibility criterion, a platform convention, a usability heuristic, an input model). A rule with no ground is cut.
- Write each rule as `` - `rule/<component>-<slug>`: When <condition>, <action>, because <reason>. Evidence: <ground>. Check: <lint | test | probe | review> <what runs>. `` A don't says what to do instead. These words fail a rule: "appropriate", "consistent", "properly", "as needed", "user-friendly", "should consider".
- Test each rule before it ships. Write a violating snippet and confirm the check or a reviewer catches it. Negate the rule, and sharpen it if the opposite sounds as fine. Give it with one task to two fresh agents, and sharpen it if they diverge. Sweep every call site: each follows it or is a listed exception.

The six H3s:

- *When to use / When not to use.* A few lines each, two to four by default. Each is a situation a designer is in ("the user just finished an action and stays on the screen"), never a property of the component ("it floats"). Each When not to use line names the other component and says "instead". Neither is empty.
- *Behavior.* Rules on states over time, input methods, focus and feedback.
- *Limits.* Rules with a number set below a measured break, or `NEEDS REVIEW (not measured)` and what to measure.
- *Content.* Rules per copy slot: casing, template, length, forbidden words. When the repo has `docs/system/writing.md`, cite its rule IDs instead of restating them. A copy rule never overrides a trap in `build-design-system/references/traps.md`. The trap's fix wins, and a conflicting copy majority becomes a gate. Pending text, for one, goes in a status region or next to the control and never replaces the action's label.
- *Best practices.* Rules on composition, placement and density, at most five (the limit `check-spec.mjs` enforces on specs). Each is followed by an indented `Don't:` line holding the violating snippet from its test.

**Accessibility.** The native element or library primitive it rests on, the role, which keys reach and operate it, where focus goes after, the screen reader output and its timing, and the accessible name in each variant. Say which facts came from code and which were observed on a rendered story. State a keyboard path only when a native element or named primitive fixes it, or the keys were pressed on a story. Mark anything the sources do not settle `NEEDS REVIEW`. Never write a contrast ratio no tool measured.

**Tokens.** The token names the component reads, grouped by what they control, spelled exactly as the source spells them. Read them from named references in the styles, such as `var(--surface-inverse)` or a theme key, never from a raw value or a screenshot. Utility classes follow `token-mapping`'s split: a class built from a declared role name is token use, listed here by that name, and a class built from a palette step goes under `Palette:` as written, with the theme variable it resolves to under Guessed at. Mark the section `NEEDS REVIEW` when it has no role tokens at all. `NOT SUPPLIED` when none were given or referenced in the code.

**Related.** Components people mix up with this one, each with when to pick it instead.

## Worked example

A Toast from a fictional task-tracking app, as a plain entry rather than a spec. The code and stories were read from the repo, the stories opened in a browser and measured, and two real uses found by call-site search. The blocks after it show the output around the entry.

````markdown
## Description
Toast confirms the result of something the user just did, without moving them off the screen, so the screen needs no success message of its own.

`import { Toast } from "@/components/toast"`, client only, source `src/components/toast/Toast.tsx`, status NOT SUPPLIED (no registry in this repo).

Parts: message (required), action button (optional, one at most), close button (required).

## Examples
`src/components/toast/Toast.stories.tsx`, story `SuccessWithUndo`
```tsx
<Toast tone="success" message="Card moved to Done" action={{ label: "Undo", onAction: undoMove }} />
```

- Board: dragging a card to Done shows Success with "Undo"
- Settings > Members: removing a member fails and shows Error with "Retry". `src/features/members/RemoveMember.tsx:41`

```tsx
<Toast tone="error" message="Could not remove Dana" action={{ label: "Retry", onAction: retry }} />
```

- Exports: starting an export shows Neutral with no action (not shipped)

### Example files
| File | Covers | Caption |
|---|---|---|
| `docs/system/examples/toast/default.tsx` | default | Neutral toast with a message and no action |
| `docs/system/examples/toast/tone-success.tsx` | tone=success | Success with "Undo" |
| `docs/system/examples/toast/tone-error.tsx` | tone=error | Error with "Retry", no timer |
| Not applicable: reached by pointer or focus, shown on the `SuccessWithUndo` story | state:paused | none |
| `docs/system/examples/toast/in-toaster.tsx` | composition:Toaster | Three toasts stacked in the Notifications region |

## Variants

### tone
- Neutral: an action started or finished with nothing to celebrate or fix
- Success: an action finished and can often be undone
- Error: an action failed and may be retried
- Warning: NEEDS REVIEW. In the stories, missing from the `tone` type. See Conflicts

## States
- Visible: the timer runs, the action and close button can be activated
- Paused: pointer or keyboard focus is inside the toast, and the timer stops until it leaves
- Leaving: the close button or timer fired. Input is ignored and the toast is removed. Leaving wins over Paused
- Error toasts have no timer. They stay until closed or until the action runs

Up to three toasts stack, and a fourth removes the oldest. Code cuts a message at two lines, and the old docs page says three. NEEDS REVIEW, see Conflicts.

## Props
| Name | Type | Default | Change it when |
|---|---|---|---|
| `tone` | `"neutral" \| "success" \| "error"` | `"neutral"` | The result succeeded or failed |
| `message` | `string` | required | Always |
| `action` | `{ label: string; onAction: () => void }` | none | The result can be undone or retried |
| `duration` | `number` (ms) | `6000` | Ignored when `tone` is `"error"` |

## Usage

### When to use
- The user finished an action and stays where they are
- The result matters now and is useless an hour later

### When not to use
- The message is about a single form field. Use Field error instead, next to the field
- Someone else caused the event. Use Inbox instead, so it waits for the user

### Behavior
- `rule/toast-error-persists`: When `tone` is `"error"`, keep the toast until it is closed or its action runs instead of timing it out, because its "Retry" is the only path back to the failed request, and `Toast.tsx:57` already ignores `duration` for it. Evidence: single use `RemoveMember.tsx:41`; principle heuristic: help users recognize, diagnose and recover from errors. Check: review.

### Limits
- `rule/toast-message-length`: When a message runs past 60 characters, put the detail on the screen instead of in the toast, because at 360px the toast cuts the message at two lines from 61 characters. Evidence: measured on the `SuccessWithUndo` story at 360px, ellipsis from 61 characters. Check: probe on `tone-success.tsx` at 360px.

### Content
- `rule/toast-error-names-object`: When `tone` is `"error"`, name the object that failed, as in "Could not remove {name}", instead of a generic failure, because the user must know what to retry. Evidence: single use `RemoveMember.tsx:41`. Check: review.
- `rule/toast-action-label`: When a toast has an action, its label is "Undo" or "Retry" instead of "Dismiss", because the close button already dismisses. Evidence: app 2/2 action call sites. Check: lint on `action.label` string values.

### Best practices
- `rule/toast-one-per-bulk`: When one action changes several items, send one toast with the count, as in "{count} cards archived", instead of one per item, because the stack holds 3 and drops the oldest before anyone reads it. Evidence: measured on the stories, a 4th toast removed the 1st (`MAX_TOASTS = 3`, `Toaster.tsx:12`). Check: review.
  Don't: ``cards.forEach((c) => toast({ message: `${c.title} archived` }))``

## Accessibility
From code: Neutral and Success render with `role="status"` and announce politely. Error renders with `role="alert"` and interrupts. The toast region is a landmark named "Notifications". Observed on the `SuccessWithUndo` story: the accessibility tree shows a status named "Card moved to Done", focus stayed on the page, and Escape closed it once focus was inside. NEEDS REVIEW. No source says whether six seconds is long enough for users who need more time, and no contrast was measured.

## Tokens
Surface: `--surface-inverse`
Text: `--text-on-inverse`, `--text-on-inverse-muted`
Spacing: `--space-inset-200`, `--space-gap-100`
Shape: `--radius-300`
Elevation: `--elevation-overlay`

## Related
- Inbox: for events the user did not cause, or that need to wait
- Banner: for a condition that lasts, like being offline, rather than a single result
````

```markdown
**Sources**
- Code: src/components/toast/Toast.tsx, Toaster.tsx, Toast.css and Toast.stories.tsx, read at commit 4e1a9c2, `date` 2026-03-12 14:05 UTC
- Stories: the workbench at localhost:6006, four toast stories, opened in a browser with screenshots and accessibility trees on 2026-03-12 14:10 UTC
- Measurement: message length grown on `SuccessWithUndo` at 360px with `probe.mjs --grow --dimension text`, saved to .design-system/evidence/toast/grow-text-360.json
- Call sites: src/features/board/Board.tsx:88 and src/features/members/RemoveMember.tsx:41, found by search on 2026-03-12 14:12 UTC
- Docs: the current docs page, pasted by the requester, not checked against the repo
- Exports use: pasted by the requester on 2026-03-12, not checked against the product

**Conflicts**
- Variants: Toast.stories.tsx has a Warning story, the `tone` type has no "warning". No precedence rule in AGENTS.md covers variants. Not chosen
- Long messages: the docs page wraps to three lines, code truncates at two. No rule. Not chosen

**Guessed at**
- Props: treated the docs page's "Type" option as `tone`. The values line up, but no source links them
```

## Review checklist

- [ ] The nine H2s and six Usage H3s, in order, none added or renamed
- [ ] Description is one sentence about the job, then the import line
- [ ] Every example block matches its source path exactly, or says `simplified from <file:line>` and only drops props
- [ ] Every real use is supplied or found by search, and every planned use says `(planned)`
- [ ] Variants has one H3 per axis named after the prop, or `None.` with the reason
- [ ] No state line mentions color, border or shadow
- [ ] Every pair of states that can hold at once says which wins, settled by a tool or marked `NEEDS REVIEW`
- [ ] Every behavior that looks like a bug has a `Defect:` line with an owner
- [ ] Every prop exists in the code read, with its real default
- [ ] Every When not to use line names another component and says "instead"
- [ ] Every rule line has an ID, condition, reason, `Evidence:` and `Check:`, and survived the four tests
- [ ] Each Best practices rule has a `Don't:` line the check or a reviewer would catch
- [ ] Example files covers the default, every variant value and state, and one composition, or says why not per row
- [ ] Accessibility names the role, keys and screen reader output, or marks them `NEEDS REVIEW`
- [ ] Every token name matches its source exactly, with palette use kept apart
- [ ] Every gap reads `NOT SUPPLIED` or `NEEDS REVIEW` with a one-line reason
- [ ] Sources, Conflicts and Guessed at sit below the entry, and every Sources time comes from a `date` call at the read or is left out
