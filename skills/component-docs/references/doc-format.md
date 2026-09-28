# Documentation format

> **Replace this file with your team's format.** It is a working default so the skill runs on day one. The skill treats whatever this file says as the agreed format, so edit the headings, the section rules and the example here, not in `SKILL.md`. Swap the worked example for one of your own published entries as soon as you have one.

The order follows the shape of a component page in Vercel's Geist system. The page opens with what the component is for and examples you can copy, walks through its variants and states, then gives the API, the usage rules and accessibility. Everything the skill needs is in this file, so it runs without reaching the Geist site. The `build-design-system` skill renders these same sections, in this order, as the component's docs page (its `references/system-structure.md`), so change both together or not at all.

## Headings, in order

Use these nine H2 headings, in this sequence, in every entry. Usage holds four H3 headings, also fixed. Variants holds one H3 per variant axis, named after the prop. Do not add, drop, rename, or merge any. A section with nothing sourced reads `Not applicable to this component.` when the component has no such thing, and `NOT SUPPLIED` when it has one and nobody provided it, each with a one-line reason.

1. `## Description`
2. `## Examples`
3. `## Variants`
4. `## States`
5. `## Props`
6. `## Usage`, holding `### Use it when`, `### Use something else when`, `### Writing` and `### Do and don't`
7. `## Accessibility`
8. `## Tokens`
9. `## Related`

## What goes in each section

**Description.** One sentence on the job the component does, with no description of how it looks. Under it, one plain line with the import statement, the source path, and the status from `registry.json` when the repo has one. If the component has named parts (`Dialog.Title`, `Select.Item`, a close button), list them after that line in reading order, each marked required or optional, using the names from the source.

**Examples.** The default example first, copied verbatim from a story or example file, with its path above it. Then one entry per real use: the screen, what put the component there, and which variant appeared, followed by the code at the call site when it was read. Mark unshipped screens `(not shipped)`. A docs site renders each of these live. Never write example code that no source contains.

**Variants.** One H3 per variant axis, named after its prop (`### tone`, `### size`). Under each, one line per value giving its name and the job it covers. When two values cover the same job, say so in the line. That overlap is worth a designer's attention.

**States.** One line per state that exists. Say what the user can do in it, or what the component does. Check at least default, hover, focus, pressed, disabled, loading, and error, and drop the ones the component does not have. When two states can hold at once, say which wins. Then cover behavior under edge conditions where it applies: long text, empty content, a slow response, a narrow screen, and many instances at once. Behavior that the code, stories and notes do not show goes under Guessed at, not here.

**Props.** From code only, as a table: name, type, default, and one line on when to change it. `NOT SUPPLIED` when no props type was read. When the docs site generates this table from the types, keep only the notes the table cannot hold, such as a prop that is ignored in one variant.

**Usage.** The rules a designer or an agent follows before reaching for the component.

- *Use it when / Use something else when.* Two to four lines each. Each line is a situation a designer is in ("the user just finished an action and stays on the same screen"), never a property of the component ("it floats"). Each "something else" line names the other component. This section is never empty.
- *Writing.* Length limits, capitalization, and what the text must never say.
- *Do and don't.* Two to four pairs. Each pair covers one decision the component lets someone get wrong. One line each side.

**Accessibility.** The native element or library primitive it rests on, the role, which keys reach and operate it, where focus goes after, the screen reader output and its timing, and the accessible name in each variant. Say which facts were read from code and which were observed on a rendered story. State a keyboard path only when the code uses a native element or a named library primitive that fixes it, or when the keys were pressed on a story. Mark anything not settled by the sources `NEEDS REVIEW`. Never write a contrast ratio no tool measured.

**Tokens.** The token names the component reads, grouped by what they control, spelled exactly as the source spells them. Read them from named references in the styles, such as `var(--surface-inverse)` or a theme key, never from a raw value or a screenshot. `NOT SUPPLIED` when none were given or referenced in the code.

**Related.** Components people mix up with this one, and one line per component saying when to pick it instead.

## Worked example

A Toast from a fictional task-tracking app. The code and stories were read from the repo, the stories were opened in a browser, and two real uses came from a search for call sites. The blocks after the entry show the output around it.

````markdown
## Description
Toast confirms the result of something the user just did, without moving them off the screen, so the screen needs no success message of its own.

`import { Toast } from "@/components/toast"`, source `src/components/toast/Toast.tsx`, status NOT SUPPLIED (no registry in this repo).

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

- Exports: starting a CSV export shows Neutral with no action (not shipped)

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

Up to three toasts stack, and a fourth removes the oldest. A message longer than two lines is cut with an ellipsis in code. The current docs page says it wraps to three. NEEDS REVIEW, see Conflicts.

## Props
| Name | Type | Default | Change it when |
|---|---|---|---|
| `tone` | `"neutral" \| "success" \| "error"` | `"neutral"` | The result succeeded or failed |
| `message` | `string` | required | Always |
| `action` | `{ label: string; onAction: () => void }` | none | The result can be undone or retried |
| `duration` | `number` (ms) | `6000` | Ignored when `tone` is `"error"` |
| `onClose` | `() => void` | none | The caller must know the toast closed |

## Usage

### Use it when
- The user finished an action and stays where they are
- The action can be reversed or retried from the message itself
- The result matters now and is useless an hour later

### Use something else when
- The message is about a single form field. Use Field error, next to the field
- Someone else caused the event. Use Inbox, so it waits for the user
- The user must decide before going on. Use Dialog

### Writing
One sentence, under 60 characters. Past tense for results ("Card moved to Done"). Action labels are one verb ("Undo", "Retry"). Never "Oops" or "Something went wrong" without saying what failed.

### Do and don't
- Do send one toast for a bulk action ("12 cards archived") / Don't send one per item. The stack limit drops the first ones before anyone reads them
- Do give Error a "Retry" action when the request can be repeated / Don't give any toast a "Dismiss" action. The close button already does that
- Do keep the undo window at least as long as `duration` / Don't commit the delete before the toast closes if the toast offers "Undo"

## Accessibility
From code: Neutral and Success render with `role="status"` and announce politely. Error renders with `role="alert"` and interrupts. The toast region is a landmark named "Notifications", reachable with F6. Observed on the `SuccessWithUndo` story: the accessibility tree shows a status named "Card moved to Done", focus stayed on the page when it appeared, and Escape closed it once focus was inside. NEEDS REVIEW. No source says whether six seconds is long enough for users who need more time, and no contrast was measured.

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
- Code: src/components/toast/Toast.tsx, Toast.css and Toast.stories.tsx, read at commit 4e1a9c2 on 2026-03-12 14:05 UTC
- Stories: Storybook at localhost:6006, the four feedback-toast stories, opened in a browser with screenshots and accessibility trees on 2026-03-12 14:10 UTC
- Call sites: src/features/board/Board.tsx:88 and src/features/members/RemoveMember.tsx:41, found by search on 2026-03-12 14:12 UTC
- Docs: the current docs page, pasted by the requester, not checked against the repo
- Exports use: pasted by the requester on 2026-03-12, not checked against the product

**Conflicts**
- Variants: Toast.stories.tsx has a Warning story, the `tone` type has no "warning". No precedence rule in AGENTS.md covers variants. Not chosen
- Long messages: the docs page wraps to three lines, code truncates at two. No rule. Not chosen

**Guessed at**
- Props: treated the docs page's "Type" option as `tone`. The values line up, but no source links them
- Examples: named the Board call site "Board" after its route folder
- Related: Banner was named on the docs page, with no real use supplied
```

## Review checklist

- [ ] All nine H2 headings and the four Usage H3 headings present, in order, none renamed
- [ ] Description is one sentence with no visual description, followed by the import line
- [ ] Every example block has a source path and matches that source exactly
- [ ] Every real use under Examples names a screen from the supplied material or a call site found by search
- [ ] Variants has one H3 per axis, named after the prop
- [ ] No state line mentions color, border, or shadow
- [ ] Every prop exists in the code read, with its real default
- [ ] "Use something else when" names another component on every line
- [ ] Accessibility names the role, the keys, and the screen reader output, or marks them `NEEDS REVIEW`
- [ ] Every token name matches the source character for character
- [ ] Each do and don't pair is about a single decision the component lets people get wrong
- [ ] Sources, Conflicts, and Guessed at sit below the entry
