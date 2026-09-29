---
name: component-docs
description: Writes one component's documentation entry from its code, stories and real call sites, in a Geist-style page order. Use for "document the button", "write docs for Select", "what states does Toast have", usage rules for a component, or a new or changed component. Skip foundations, overview pages and multi-component patterns. Docs for a whole design system go to design-system-boss.
---

# Component documentation

A draft entry for one component, built only from what its sources say. Gaps are marked, not filled, and every judgement call is listed for a person to check. It does not judge the design and does not publish. The format and checklist are in `references/doc-format.md`, finding and recording sources in `references/sources.md`. Sibling links are relative to this skill's folder.

## Start from whatever the ask gives

A component name is enough. Find the code, stories and call sites yourself, and ask only for what no tool can reach. Of several named components, document the first and list the rest. A compound component (`Tabs` with `Tab`) is one entry. A part also used on its own gets a `### Parts` subsection under Description.

## When a coordinator calls it

A coordinator passes the code, the variant list and real or planned uses. Take them as given and run to the end without asking. Conflicts and Guessed at carry every open question, and the caller turns them and the Gates block into gates.

Start the output with a status line, `Status: complete`, `Status: complete with NEEDS REVIEW (n)`, `Status: ready-with-gaps (<n> real uses)` or `Status: stopped: <condition>`, then `Commit: none`. A direct run uses the same status line. Return the entry with its blocks, or the stop shape, as text, and write no other file. The coordinator saves the entry, unless the brief's SCOPE names its path.

## Steps

1. **Paste the skeleton.** Copy the heading list from `doc-format.md` into the draft, empty.
2. **Find the component** and read its code, props type, styles and stories. Done when each has a Sources line, recorded as `sources.md` says.
3. **Find real uses**, pasted or found by searching call sites. Done when two uses meet the definition in `sources.md`, or its Fewer than two uses applies.
4. **Check the stops.** If one applies, return the stop shape and end the run.
5. **Trace and compare.** Note which source supplied each example, variant, prop, state and token. Done when every difference between sources that state the same fact is a line under Conflicts.
6. **Fill each section** from sourced facts, in order, per `doc-format.md`. Copy token names and example code character for character. Done when every section is filled or marked.
7. **Write Usage rules last,** by the rule method in `doc-format.md` (Usage). Done when each rule has a shape, a ground, a check and a Don't and Do pair, and passed its tests or was cut.
8. **Close out.** Fill Guessed at. Done when the review checklist passes.
9. **Spec check.** When the entry is a spec, run the check `doc-format.md` (When the entry is a spec) names. Fix each failure from a source or mark the gap, and never invent a state or a precedence to pass. Done when the check's last line is in the status block.

## Output

One Markdown entry, ready to paste, then these blocks outside it:

- Sources, one line per source, as `sources.md` records it.
- Conflicts, one line per disagreement: the fact, each source's version, and the quoted rule applied or "no rule, not chosen".
- Guessed at, one line per judgement call with what it rests on, or "Nothing guessed".
- Gates, only when a rule adds one: the question and its default.

On a direct run, save the entry with its blocks to `docs/system/<name>.md` with a draft comment on line 1, and write each missing example file (`doc-format.md`, Examples). The reply opens with that path, what the entry covers and its status. Then each command run with its exit code, any Defect lines, up to three open questions with defaults, and `Next:` with one prompt to paste. Every count in the reply comes from `grep -o` on the saved file below the draft comment.

The entry is ready when it passes the review checklist, and for a spec when `check-spec.mjs` exits 0 or every remaining failure is under Guessed at with why no source settles it.

## Stops

| Missing after searching | Why it stops | The coordinator does next |
|---|---|---|
| Code | Nothing else sources the variants, props or behavior | Pass the code path and rerun, or drop the component and log it as a gap |
| Variant list, from code or stories | A guessed variant list documents a different component | Pass the props type or stories and rerun, or park it as a gate for the owner |
| Any use, real or planned | Invented uses read like real ones, and readers copy them first | Build the pilot screen, or pass one screen from the brief as a planned use, then rerun. Never write the entry itself |

A props type with no variant prop is an empty list, so Variants reads "None" and the run continues. A stopped run returns the stop, the facts sourced so far by section, the next step, and the smallest reply that unblocks it. For missing uses, that is "one screen name, what put the component there, and which variant showed".

Everything else continues. One real use, planned uses and a deprecated predecessor follow `sources.md` (Fewer than two uses). Conflicts follow `sources.md` (Conflicts between sources), and a behavior that looks like a bug gets a `Defect:` line (`doc-format.md`, States). A missing props type, token list, spec, notes or accessibility guidance becomes `NOT SUPPLIED`, `NEEDS REVIEW` or a Guessed at line.

## Hard limits

- Every variant, prop, token name, example and real use comes from a listed source. A planned use says planned.
- A conflict stays open with both sides shown, or is settled by a quoted rule.
- The skill never edits the code, stories or spec it documents.
- The entry is a draft. A coordinator decides where it goes, and publishing belongs to the person.
