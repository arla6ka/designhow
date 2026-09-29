# Badge

## Description
Badge labels a record with its status in one or two words.

`import { Badge } from "@/components/ui/badge"`, source `components/ui/badge.tsx`, status `ready`.
Foundation: hand-rolled. Traps checked: `trap/palette-use` (Tokens).

### Foundation
Not applicable: hand-rolled.

## Examples
Default: `docs/system/examples/badge/default.tsx`.

Real uses, 2 call sites (`rg -n "<Badge\b" app`).

- Invoices list: the status column. `app/invoices.tsx:2`, tone neutral and danger.

### Example files
| File | Covers | Caption |
|---|---|---|
| `docs/system/examples/badge/default.tsx` | default | A neutral Draft badge |
| Not applicable: `neutral` is the default, shown by `default.tsx` | tone=neutral | none |
| `docs/system/examples/badge/tone-danger.tsx` | tone=danger | An Overdue badge |
| `docs/system/examples/badge/in-table.tsx` | composition:Table | A status cell in the invoices table |

## Variants

### tone
- `neutral`: a status that needs no action. Used at 1 call site.
- `danger`: a status that needs action today. Used at 1 call site.

## States
| State | Trigger | What the user can do | Shown by, besides color | Checked by |
|---|---|---|---|---|
| Static | Always | Read it | Its text | screenshot |

### State precedence
Not applicable: a badge has one state.

## Props
Notes only.

## Usage

### When to use
- A row needs its status readable at a glance

### When not to use
- The status needs an action. Use Button instead

### Rules
- `rule/badge-label`: When `tone` is danger, keep the label concise, at most 12 characters, instead of a sentence, because the column is narrow. Evidence: app 2/2 call sites. Check: review.
  - Don't: `<Badge>DRAFT</Badge>`
  - Do: `<Badge>Draft</Badge>`
- `rule/badge-color`: When `tone` is danger, use `--destructive`, because it signals urgency. Evidence: app 2/2 call sites. Check: review.
  - Don't: `<Badge className="bg-red-500">Overdue</Badge>`
  - Do: `<Badge tone="danger">Overdue</Badge>`
- `rule/badge-one-per-row`: When a row holds a status, show 1 Badge per row instead of stacking two, because two badges push the row to 2 lines at 390px. Evidence: app 2/2 call sites; measured 2 lines with 2 badges at 390px, .design-system/evidence/badge/two-up.json. Check: review.
  - Don't: `<Badge>Draft</Badge><Badge>Overdue</Badge>`
  - Do: `<Badge tone="danger">Overdue</Badge>`

### Content
- Follows `rule/writing-status-case`.

### Anti-slop
Not applicable: a badge takes one short label and one tone, and no call site shows a default an agent reaches for wrongly.

### Limits
- `rule/badge-max-chars`: When a label runs past 12 characters, use plain text instead of a Badge, because at 13 characters the badge wraps in the 96px status column at 390px. Evidence: measured wrap at 13 characters, .design-system/evidence/badge/grow-text-390.json. Check: probe on `default.tsx`.
  - Don't: `<Badge>Awaiting approval</Badge>`
  - Do: `<span>Awaiting approval</span>`

## Accessibility
Rests on a `span` with text.

### Keyboard
| Key | Where focus is | Effect | Focus after | Checked by |
|---|---|---|---|---|
| Tab | Before the badge | Skips it | Next control | by hand |

### ARIA
| Part | Role | Accessible name from | States and properties | Announced | Checked by |
|---|---|---|---|---|---|
| Badge | none | Its text | none | Its text | snapshot |

## Tokens
| Part | State | Token |
|---|---|---|
| Fill | danger | `--destructive` |

## Related
- Button: a status the user acts on.
