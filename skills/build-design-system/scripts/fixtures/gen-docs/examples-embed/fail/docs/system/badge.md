# Badge

## Description
Badge does one job.

## Examples
Default: `docs/system/examples/badge/default.tsx`.

### Example files
| File | Covers | Caption |
|---|---|---|
| `docs/system/examples/badge/default.tsx` | default | A neutral Draft badge |
| `docs/system/examples/badge/tone-danger.tsx` | tone=danger | An Overdue badge |

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
- Needs an action. Use a link instead

### Behavior
Not applicable: none.

### Limits
- `rule/badge-max-chars`: When a label runs past 12 characters, use plain text instead, because it wraps at 13 characters at 390px. Evidence: measured wrap at 13 characters, .design-system/evidence/grow-text-390.json. Check: probe on `default.tsx`.

### Content
Not applicable: none.

### Best practices
Not applicable: none.

## Accessibility
Text only.

## Tokens
NOT SUPPLIED: none.

## Related
- Link: navigation.
