# Documentation format

Replace this file with your team's format, since the skill treats whatever it says as agreed. Edit headings, section rules and the example here, not in `SKILL.md`, and swap in one of your published entries once you have one.

The order follows a component page in the Geist design system. It opens with the job and examples to copy, then variants and states, then the API, usage and accessibility. `build-design-system` renders these same sections in this order as the component's docs page (its `references/spec-template.md`), so change both together or not at all.

## Headings, in order

Every entry uses these nine H2s in this order. Usage holds six fixed H3s, Examples holds `### Example files`, Variants holds one H3 per axis named after the prop, and Description may hold `### Parts`. Do not add, drop, rename or merge any other. A section with nothing sourced reads `Not applicable: <reason>` when the component has no such thing, and `NOT SUPPLIED: <what is missing>` when it has one and nobody provided it.

1. `## Description`
2. `## Examples`
3. `## Variants`
4. `## States`
5. `## Props`
6. `## Usage`, holding `### When to use`, `### When not to use`, `### Rules`, `### Content`, `### Anti-slop` and `### Limits`
7. `## Accessibility`
8. `## Tokens`
9. `## Related`

## When the entry is a spec

A spec is this entry with every question in the spec template answered. The entry is a spec when the caller asks for one or the repo's entries already have a `### State precedence` section. That heading is the spec marker: `check-spec.mjs` checks only files that have it and skips the rest with a count. Pipe the entry to `node scripts/check-spec.mjs -` from the repo root, or to `node <skills>/build-design-system/scripts/check-spec.mjs -` when the repo has none, where `<skills>` is the folder that holds this skill and its siblings (`build-design-system/references/run-record.md`, Terms).

Read the template from the repo's `docs/system/`, with an existing spec there as the skeleton, and fall back to `build-design-system/references/spec-template.md` only when the repo has neither. The template owns everything a spec adds (extra H3s and tables, the "Gated:" line, the rules `check-spec.mjs` enforces). Where it differs from a section below, as with the States and Tokens tables, the template wins.

## What goes in each section

**Description.** One sentence on the job the component does, never how it looks. Under it, one plain line with the import statement, the runtime side when the framework splits server and client code (its client marker, its server-only marker, or none), the source path, and the status from `registry.json` when the repo has one. List named parts after that line in reading order, each required or optional, with the names from the source. When a part is also used without its parent, move the list into `### Parts` and give that part its props, standalone call sites and how it differs alone.

**Examples.** The default example first, copied verbatim from a story or example file, with its path above it. With no story or example file, the default is the most common real call site, simplified: drop props and children unrelated to the component, change nothing else, and put `simplified from <file:line>` above it. Then one entry per real use: the screen, what put the component there, and which variant appeared, followed by the call-site code when it was read. Mark unshipped screens `(not shipped)` and uses from a brief or pilot `(planned)`, with no code block. Never write example code that no source contains.

Then `### Example files`, a File, Covers and Caption table with one row per file: the default, every variant value and state with a visual or behavior difference, and one composition inside a parent a real use shows. The Covers values and the shape of each file are in `build-design-system/references/spec-template.md` (Answering well, Example files). Files live at `<examples dir>/<component>/<name>.<ext>`, where the examples dir is `examplesDir` in the repo's `scripts/gen-docs.config.json`, else `docs/system/examples`. A file uses only props, children and data a source shows. A comment in it states one constraint the code cannot show, never history, a measurement or an outside source. A direct run writes each missing file. Under a coordinator, it writes them only when the brief's SCOPE names the folder. A value or state with no file gets a row whose File cell reads `NOT SUPPLIED: <reason>` or `Not applicable: <reason>`, and caption `none`.

**Variants.** One H3 per variant axis, named after its prop (`### tone`, `### size`). Under each, one line per value giving its name and the job it covers. When two values cover the same job, say so. When the props type has no variant prop, the section reads `None.` with the reason and no H3. That is a finished section, not a gap.

**States.** One line per state that exists, saying what the user can do in it or what the component does. A state whose only cue is visual names that cue, as in `Hover: pointer only, color change`. Check at least default, hover, focus, pressed, disabled, pending and error, and drop those it lacks. When two states can hold at once, say which wins and how to reach the pair ("click the item that is already selected"). Settle it from the built styles (which rule wins in the output) or from a browser read of the element and the rendered result. Mark it `NEEDS REVIEW` only when neither can reach it. Then cover edge conditions that apply: long text, empty content, a slow response, a narrow screen, many instances. Behavior no source or browser read shows goes under Guessed at.

When the current behavior looks like a bug, such as a control with no accessible name or an active state lost on a nested route, write it as it is. Then add a `Defect:` line to the owner (CODEOWNERS, else the file's last committer) with what goes wrong for the user and the smallest fix, and repeat it in the reply. A question about it defaults to "document current behavior, Defect line stays until the owner fixes or accepts it". When the fix only adds semantics, end the line `(adds semantics only)`, and a coordinator lands it on the run branch as a decision and reruns the entry. For example, `Defect: @acme/web, the close button has no accessible name, so a screen reader announces "button". Add aria-label="Close" in ui/dialog.tsx. (adds semantics only)`

**Props.** From code only, as a table: name, type, default, and when to change it. `NOT SUPPLIED` when no props type was read. When the docs site generates the table from the types, keep only notes the table cannot hold, such as a prop ignored in one variant.

**Usage.** Rules a designer or agent follows before reaching for the component. Derive them with `../build-design-system/references/rule-method.md` when the sibling skill is installed. Without it, the method in short:

- Ask per component: its job, what it is not for and what to use instead, where it breaks (length, count, viewport, input method, locale, data states), its limits, copy slots, states over time, input methods, accessibility contract, what it may contain or sit inside, density and placement, and what a fresh agent gets wrong with it by default.
- Ground every rule in the app (two or more real call sites, or a stated single use), a measurement on the app (a probe or computed style, with its path), a named principle (an accessibility criterion, a platform convention, a usability heuristic, an input model), or the person (a ban or call recorded in `docs/system/decisions.md`, cited as `person D<n>` and never quoted). A ban stated in this run with no row yet goes in the Gates block as the row to add. A rule with no ground is cut.
- Write each rule as `` - `rule/<component>-<slug>`: When <condition>, <action>, because <reason>. Evidence: <ground>. Check: <lint | test | probe | review> <what runs>. `` A don't says what to do instead. Under every rule, a nested `- Don't:` line with one line of real code that breaks it, then a `- Do:` line with the same case written correctly. These words fail a rule: "appropriate", "consistent", "properly", "as needed", "user-friendly", "should consider".
- Test each rule before it ships. Write a violating snippet and confirm the check or a reviewer catches it. Negate the rule, and sharpen it if the opposite sounds as fine. Sweep every call site: each follows it or is a listed exception. For Anti-slop and Limits rules only, also give the rule with one task to two fresh agents and sharpen it if they diverge, since that test costs two agents per rule.

The six H3s:

- *When to use / When not to use.* A few lines each, two to four by default. Each is a situation a designer is in ("the user just finished an action and stays on the screen"), never a property of the component ("it floats"). Each When not to use line names the other component and says "instead". Neither is empty.
- *Rules.* Rules on states over time, input methods, focus, feedback, composition, placement and density.
- *Content.* Rules per copy slot: casing, template, length, forbidden words. When the repo has `docs/system/writing.md`, cite its rule IDs instead of restating them. A copy rule never overrides a trap in `build-design-system/references/traps.md`. The trap's fix wins, and a conflicting copy majority becomes a gate. Pending text, for one, goes in a status region or next to the control and never replaces the action's label. A count label carries its noun in singular and plural (`1 file`, `3 files`). An exception to the voice, such as an ellipsis on an item that opens a dialog, is written as a rule.
- *Anti-slop.* Rules for what an agent writes by default and this app does not, found by giving one fresh agent a task with the component and comparing its code with the call sites. `Not applicable: <reason>` when nothing differs.
- *Limits.* Rules with a number set below a measured break, or `NEEDS REVIEW (not measured)` and what to measure.

**Accessibility.** The native element or library primitive it rests on, the role, which keys reach and operate it, where focus goes after, the screen reader output and its timing, and the accessible name in each variant. Say which facts came from code and which were observed on a rendered story. State a keyboard path only when a native element or named primitive fixes it, or the keys were pressed on a story. Mark anything the sources do not settle `NEEDS REVIEW`. Never write a contrast ratio no tool measured.

**Tokens.** The token names the component reads, grouped by what they control, spelled exactly as the source spells them. Read them from named references in the styles, such as `var(--surface-inverse)` or a theme key, never from a raw value or a screenshot. Utility classes follow `token-mapping`'s split (its `mapping-rules.md`, What counts as the team's list): a role-name class is listed here by that name, and a palette-step class goes under `Palette:` as written, with the theme variable it resolves to under Guessed at. Mark the section `NEEDS REVIEW` when it has no role tokens at all. `NOT SUPPLIED` when none were given or referenced in the code.

**Related.** Components people mix up with this one, each with when to pick it instead.

## Worked example

A Toast from a fictional task-tracking app, as a plain entry rather than a spec. It is cut to the parts that teach most, so Props, Accessibility, Related and Example files are left out here and never in a real entry.

````markdown
## Description
Toast confirms the result of something the user just did, without moving them off the screen, so the screen needs no success message of its own.

`import { Toast } from "@/components/toast"`, client only, source `src/components/toast/Toast.tsx`, status NOT SUPPLIED (no registry in this repo).

## Examples
`src/components/toast/Toast.stories.tsx`, story `SuccessWithUndo`
```tsx
<Toast tone="success" message="Card moved to Done" action={{ label: "Undo", onAction: undoMove }} />
```

- Settings > Members: removing a member fails and shows Error with "Retry". `src/features/members/RemoveMember.tsx:41`

```tsx
<Toast tone="error" message="Could not remove Dana" action={{ label: "Retry", onAction: retry }} />
```

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

## Usage

### When to use
- The user finished an action and stays where they are

### When not to use
- Someone else caused the event. Use Inbox instead, so it waits for the user

### Rules
- `rule/toast-error-persists`: When `tone` is `"error"`, keep the toast until it is closed or its action runs instead of timing it out, because its "Retry" is the only path back to the failed request, and `Toast.tsx:57` already ignores `duration` for it. Evidence: single use `RemoveMember.tsx:41`; principle heuristic: help users recognize, diagnose and recover from errors. Check: review.
  - Don't: `<Toast tone="error" duration={6000} message="Could not remove Dana" />`
  - Do: `<Toast tone="error" message="Could not remove Dana" action={{ label: "Retry", onAction: retry }} />`

### Content
- `rule/toast-error-names-object`: When `tone` is `"error"`, name the object that failed, as in "Could not remove {name}", instead of a generic failure, because the user must know what to retry. Evidence: single use `RemoveMember.tsx:41`. Check: review.
  - Don't: `<Toast tone="error" message="Something went wrong" />`
  - Do: `<Toast tone="error" message="Could not remove Dana" />`

### Anti-slop
Not applicable: a fresh agent given "confirm that a card moved" wrote the same call as the Board screen, so nothing differs yet.

### Limits
- `rule/toast-message-length`: When a message runs past 60 characters, put the detail on the screen instead of in the toast, because at 360px the toast cuts the message at two lines from 61 characters. Evidence: measured on the `SuccessWithUndo` story at 360px, ellipsis from 61 characters. Check: probe on `tone-success.tsx` at 360px.
  - Don't: `<Toast message="Card moved to Done. Its due date and assignee were cleared" />`
  - Do: `<Toast message="Card moved to Done" />`, with the cleared fields shown on the card

## Tokens
Surface: `--surface-inverse`
Text: `--text-on-inverse`, `--text-on-inverse-muted`
Spacing: `--space-inset-200`, `--space-gap-100`
````

```markdown
**Sources**
- Code: src/components/toast/Toast.tsx, Toaster.tsx, Toast.css and Toast.stories.tsx, read at commit 4e1a9c2, `date` 2026-03-12 14:05 UTC
- Measurement: message length grown on `SuccessWithUndo` at 360px with `probe.mjs --grow --dimension text`, saved to .design-system/evidence/toast/grow-text-360.json
- Call sites: src/features/board/Board.tsx:88 and src/features/members/RemoveMember.tsx:41, found by search on 2026-03-12 14:12 UTC

**Conflicts**
- Variants: Toast.stories.tsx has a Warning story, the `tone` type has no "warning". No precedence rule in AGENTS.md covers variants. Not chosen
```

## Review checklist

- [ ] The nine H2s and six Usage H3s, in order, none added or renamed
- [ ] Description is one sentence about the job, then the import line
- [ ] Every example block matches its source path exactly, or says `simplified from <file:line>` and only drops props
- [ ] Every real use is supplied or found by search, and every planned use says `(planned)`
- [ ] Variants has one H3 per axis named after the prop, or `None.` with the reason
- [ ] Every state line says what the user can do or what the component does, and a color, border or shadow appears only as the named cue of a state with no other
- [ ] Every pair of states that can hold at once says which wins, settled by a tool or marked `NEEDS REVIEW`
- [ ] Every behavior that looks like a bug has a `Defect:` line with an owner
- [ ] Every prop exists in the code read, with its real default
- [ ] Every When not to use line names another component and says "instead"
- [ ] Every rule line has an ID, condition, reason, `Evidence:` and `Check:`, and survived its tests
- [ ] Every rule has a `Don't:` line the check or a reviewer would catch, and a `Do:` line with the same case written correctly
- [ ] Example files covers the default, every variant value and state, and one composition, or says why not per row
- [ ] Accessibility names the role, keys and screen reader output, or marks them `NEEDS REVIEW`
- [ ] Every token name matches its source exactly, with palette use kept apart
- [ ] Every gap reads `NOT SUPPLIED` or `NEEDS REVIEW` with a one-line reason
- [ ] The entry states current behavior with no history ("now", "no longer", "used to"), and no line quotes the person
- [ ] Sources, Conflicts and Guessed at sit below the entry, and every Sources time comes from a `date` call at the read or is left out
