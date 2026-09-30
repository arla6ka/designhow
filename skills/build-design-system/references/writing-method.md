# Writing method

This derives the app's voice from its own strings and turns it into rules a script checks. It carries no voice of its own. Every slot, template, verb and banned word comes from this app's copy or a named principle. The output is `docs/system/writing.md` (`system-structure.md`, Writing page), the copy inventory, and what `scripts/copy-check.mjs` checks.

Contents

- The copy inventory
- Deriving rules per slot
- Pending and status text
- Localized apps
- The verb chain
- House bans
- Banned words
- What the check enforces
- Docs and code comments

## The copy inventory

`scripts/copy-check.mjs --extract` writes every user-facing string to `docs/system/copy-inventory.tsv`, from the slot sources the writing page names. Like a twin, it is generated, committed and rechecked for freshness. Tab-separated, with a header row:

```
slot	text	component	source	file	line
```

- `slot` is a slot name from the writing page's `## Slots` table. The starting set is `button`, `link`, `dialog-title`, `dialog-body`, `confirm-action`, `toast`, `notice`, `status`, `empty-title`, `empty-body`, `error`, `field-label`, `helper`, `placeholder`, `tooltip`. Drop the ones the app has no use for and add product slots. Rename none after the first commit.
- `text` is the literal string. Interpolations become `{holes}` named after the expression's last identifier (`{name}`, `{count}`). Tabs and newlines are escaped as `\t` and `\n`.
- `component` is the tag or call it came from, such as `Button`, `DialogTitle` or `toast.error`.
- `source` is `children`, `prop:<name>`, or `arg:<n>` and `arg:<n>.<key>` for calls. `file` and `line` point at the string.

Rows sort by slot, then file, then line. Strings in tests, stories, fixtures, examples, generated docs and the run's scaffolding stay out, the same exclusions as `inventory.md`.

Before the first extract, read the app for the components and calls that carry each kind of text, and write them into the Sources column of `## Slots`. Rerun the extract. A slot with zero rows has a wrong source, or the app lacks it.

## Deriving rules per slot

For each slot, read its rows and answer these one at a time. Each answer is a rule in the shape from `rule-method.md`, with the slot count as its app evidence and the outliers on the stray list.

1. **Casing.** Sentence, title, or as stored. Count each.
2. **Template.** The grammar most rows share, written with holes: `{Verb} {object}`, `{Object} {past-tense verb}`, `No {objects} yet`. A slot with two templates doing two jobs gets two rules, each naming its job.
3. **Length.** The longest row that renders without wrapping or truncating at the narrowest width, measured with `probe.mjs --grow --dimension text` on a real instance. The limit sits below the break.
4. **End punctuation.** Whether the slot ends with a period, and whether that depends on sentence count.
5. **Recurring jobs.** Strings that do one job on many screens (dismiss, cancel, retry, undo, a completion). Where most rows agree, the rule fixes the exact literal. Where they don't, it is a gate with the most common literal as its default.
6. **Counts and exceptions.** A count label carries its noun in a singular and a plural form (`1 file`, `3 files`). An exception to the slot's voice, such as an ellipsis on a menu item that opens a dialog, is written as its own rule.

Then test every slot's rows against these principles. Each sets a direction, not a wording to copy:

- **Say what happens.** An action label says what the press does, not that a press is possible. `principle heuristic: match between system and the real world`.
- **Name the object.** A label, title or result that refers to a thing names it, unless one object is already the whole context. `principle heuristic: recognition rather than recall`.
- **No blame.** An error says what failed and what to do next, and never makes the user the subject of the failure. `principle heuristic: help users recognize, diagnose and recover from errors`.
- **One verb from action to result.** See the verb chain below.

A principle that contradicts the majority of a slot's rows is a gate with the principle as its default (`rule-method.md`, Anti-patterns).

Copy rules never override a trap in `traps.md`. When a slot's majority is a trap, the majority becomes a gate whose default is the trap's fix (`rule-method.md`, Grounds).

## Pending and status text

An action's label stays in place while the action runs, and the control keeps its box (`component-contract.md`, Variants and states). Pending feedback, such as "Uploading 3 of 5", goes in the `status` slot, shown in a status or live region or as text next to the control. When the copy wants a pending verb ("Saving"), it sits stacked with the idle label in one grid cell, so the box never changes (`trap/loading-label-swap`). Pending wording is a `status` rule, derived like any other slot.

## Localized apps

When the app renders copy through message keys, read each slot's text from the source-locale catalog, and record the key beside the `file:line`. Measure Limits with the longest locale the app ships, or with a pseudo-locale that pads each string when only one ships, because a limit set on the source language breaks in a longer one. When the app ships a right-to-left locale, ask as gates how dates, numbers and plurals are formatted (the platform's `Intl` API or the app's own helpers), and whether layout uses logical properties such as `margin-inline-start`.

## The verb chain

An action that asks for confirmation or reports a result uses one verb in all three places: the button that starts it, the confirmation (its title and its confirm action), and the result message. A different verb at any step makes the user wonder whether the same thing happened.

Declare each chain in the writing page's `## Verb chains` table. `copy-check.mjs --suggest-chains` lists candidates: files where a `confirm-action` or `button` row sits beside a `toast` or `notice` row. Every `confirm-action` row belongs to a declared chain, or is listed with its reason in the table's `Exempt` rows.

## House bans

Before the first component, the writing page lists the person's bans from the Frame under `### Across slots`, one rule each: casing (such as no uppercase labels), separators (such as no middle dots), punctuation (such as no em dashes or exclamation marks), weights and words. Each is grounded `person D<n>`, the `docs/system/decisions.md` row that records it, and never quotes the person. The coordinator obeys them in its own code, copy and showcase chrome, since the first family is the pattern workers copy. Each ban also goes in the standing orders word for word, and in `bans` in `scripts/check-system.config.json` (`checks.md`, Bans).

Generic filler that makes copy read as machine-written goes on the Banned words table whether or not the app uses it, such as "seamlessly", "leverage", "unlock", "delve", "robust" and "effortless". Ground each as `principle heuristic: aesthetic and minimalist design`, under one gate whose default keeps the list, so the person can strike any.

## Banned words

The team sets the list from its own copy and the person's bans, never from another product. Read the inventory for filler (apology, hedging, words that could go without changing the message) and for synonyms that compete with the app's chosen term. A word goes on the list when most of the app's rows already avoid it, or when a principle grounds it and a gate records the decision. Each row names what to write instead. The system's own terms (token, variant, slot, preset) go on the list unless the product is about them.

## What the check enforces

`node scripts/copy-check.mjs` runs in the check command once `docs/system/writing.md` exists. It fails, with `file:line rule-id message`, on a stale inventory, a row whose slot breaks its casing, length or end punctuation, a banned word, a declared chain whose steps use different verbs, a chain whose cited text moved, and a confirmation in no chain. Existing violations go in `scripts/copy-check-allowlist.json`, written once, keyed like the `check-system.mjs` allowlist. Rules a script cannot see stay `review` on the rules page.

## Docs and code comments

Guidance for the system's own prose, which no script checks. Docs state what holds now and never narrate history, so no "now", "no longer" or "used to". A person-grounded rule cites its `docs/system/decisions.md` row instead of quoting the person. A code comment states one constraint the code cannot show. It never narrates history, restates the code, logs a measurement or names an outside source.
