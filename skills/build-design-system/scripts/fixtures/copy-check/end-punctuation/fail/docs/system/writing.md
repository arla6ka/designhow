# Writing

## Description
Copy rules for this app, derived from docs/system/copy-inventory.tsv.

## Slots
| Slot | Sources | Rows | Casing | Max chars | End punctuation | Template |
|---|---|---|---|---|---|---|
| button | Button | 1 | sentence | 24 | none | any |
| dialog-title | AlertDialogTitle | 1 | sentence | 40 | any | any |
| confirm-action | AlertDialogAction | 1 | sentence | 20 | none | any |
| toast | toast.success(), toast({title}) | 1 | sentence | 60 | period | any |
| placeholder | *[placeholder] | 1 | sentence | 30 | none | `Search {objects}` |

## Usage

### Across slots
- `rule/writing-verb-chain`: When an action asks for confirmation, use one verb in the button, the confirmation and the result, because a new verb reads as a new action. Evidence: app 1/1 chains. Check: lint `copy/verb-chain`.

## Verb chains
| Chain | Verb | Action | Confirm title | Confirm action | Result |
|---|---|---|---|---|---|
| Delete project | delete | `app/projects.tsx:12` | `app/projects.tsx:14` | `app/projects.tsx:15` | `app/projects.tsx:7` |

## Banned words
| Word | Instead | Evidence |
|---|---|---|
| sorry | cut | app 0/4 toasts apologize |
