# Button

## Description
Button does one job.

## Examples
Default: `docs/system/examples/button/default.tsx`.

## Variants

### tone
- `neutral`: the default.
- `danger`: needs action.

## States
| State | Trigger | What the user can do | Shown by, besides color | Checked by |
|---|---|---|---|---|
| Static | Always | Read it | Its text | screenshot |

### State precedence
Not applicable: one state.

## Props
Notes only.

## Usage

### When to use
- A row needs a status

### When not to use
- A status with no action. Use Badge instead

### Rules
Not applicable: none.

### Content
Not applicable: none.

### Anti-slop
Not applicable: a badge takes one short label and one tone, and no call site shows a default an agent reaches for wrongly.

### Limits
- `rule/button-max-chars`: When a label runs past 12 characters, use plain text instead, because it wraps at 13 characters at 390px. Evidence: measured wrap at 13 characters, .design-system/evidence/grow-text-390.json. Check: probe on `default.tsx`.
  - Don't: `<Button>Save and send the invoice now</Button>`
  - Do: `<Button>Send invoice</Button>`

## Accessibility
Text only.

## Tokens
NOT SUPPLIED: none.

## Related
- Link: navigation.
