---
name: component-docs
description: Writes one component's documentation entry from its code, stories and real call sites, in a Geist-style page order. Use for "document the button", "write docs for Select", "what states does Toast have", usage rules for a component, or a component that is new or changed. Skip foundations, overview pages and patterns that span several components. Docs for a whole design system go to design-system-boss.
---

# Component documentation

A draft entry for one component, built only from what its sources say. Gaps are marked, not filled, and every judgement call is listed for a person to check. It does not judge the design and does not publish.

The format and review checklist live in `references/doc-format.md`. Finding the component, its uses and its sources, and recording each one, lives in `references/sources.md`.

## Start from whatever the ask gives

A component name is enough. Find the code, stories and call sites yourself, and ask only for what no tool can reach. If the ask names several components, document the first and list the rest at the end. A compound component (`Tabs` with `Tab`) is one entry. A part also used on its own gets a `### Parts` subsection under Description.

## When a coordinator calls it

A coordinator, such as a router skill or `build-design-system`, passes the code, the variant list and real uses from its inventory, or planned uses from its pilot or brief. Take them as given and run to the end without asking. Conflicts and Guessed at carry every open question, and the caller turns them and the Gates block into gates.

Start the output with one status line: `Status: complete`, `Status: complete with NEEDS REVIEW (n)`, `Status: ready-with-gaps (<n> real uses)`, or `Status: stopped: <condition>`. A direct run uses the same line. Return the entry with its blocks, or the stop shape, as text. Write no report or scratch file. The coordinator saves the entry, unless the brief's SCOPE names its path.

## Steps

1. **Paste the skeleton.** Copy the heading list from `doc-format.md` into the draft, empty.
2. **Find the component** and read its code, props type, styles and stories. Done when each has a Sources line, recorded as `sources.md` says.
3. **Find two real uses**, pasted or found by searching call sites. Done when two uses meet the definition in `sources.md`, or Fewer than two uses applies.
4. **Check the stops.** If one applies, return the stop shape and end the run.
5. **Trace and compare.** Note which source supplied each example, variant, prop, state and token. Done when every difference between sources that state the same fact is a line under Conflicts.
6. **Fill each section** from sourced facts, in order. Copy token names and example code character for character. Write each state as what the user can do or what the component does. When two states can hold at once, settle which wins from the built styles or a browser read before marking it `NEEDS REVIEW`.
7. **Write Usage rules last,** by the rule method in `doc-format.md` (Usage). Each rule has a shape, a ground, a check and a Don't and Do pair, and passes the four tests or is cut.
8. **Close out.** Fill Guessed at, then fix each failure on the review checklist.
9. **Spec check.** The entry is a spec when the caller asks for one or the repo's entries already have a `### State precedence` section. Fill it as `doc-format.md` (When the entry is a spec) says. Pipe the entry to `node scripts/check-spec.mjs -` from the repo root, or `build-design-system/scripts/check-spec.mjs` when the repo has none. Fix each failure from a source or mark the gap. Never invent a state or a precedence to pass. Put the check's last line in the status block.

## Output

One Markdown entry, ready to paste, then these blocks outside it:

- **Sources.** One line per source: what it is, how it arrived, and the `date` output from the read if one was taken.
- **Conflicts.** One line per disagreement: the fact, what each source says, and either the precedence rule applied (quoted, with where it lives) or "no rule, not chosen".
- **Guessed at.** One line per judgement call: the section, the claim, and what it rests on. "Nothing guessed" when there were none.
- **Gates.** Only when a rule below adds one: the question and its default.

On a direct run, save the entry with its blocks to `docs/system/<name>.md` with a draft comment on line 1, and write each missing example file the Example files table lists, or mark its row `NOT SUPPLIED: <reason>`. The reply opens with that path, what the entry covers and its status. Then each command run with its exit code, any Defect lines, the open questions with defaults (three at most by default, so a person can answer in one pass), and `Next:` with one prompt to paste. Every count in the reply comes from `grep -o` on the saved file below the draft comment.

The entry is ready when it passes the review checklist in `doc-format.md`. For a spec, `check-spec.mjs` also exits 0, or every remaining failure is under Guessed at with why no source settles it. A person checks each `NEEDS REVIEW`, each Guessed at line, and each conflict no rule settled.

## Stops

| Missing after searching | Why it stops | The coordinator does next |
|---|---|---|
| Code | Nothing else sources the variants, props or behavior | Pass the code path and rerun, or drop the component and log it as a gap |
| Variant list, from code or stories | A guessed variant list documents a different component | Pass the props type or stories and rerun, or park it as a gate for the owner |
| Any use, real or planned | Invented uses read like real ones, and readers copy them first | Build the pilot screen, or pass one screen from the brief as a planned use, then rerun. Never write the entry itself |

A props type with no variant prop is an empty list, not a missing one. Variants reads "None" and the run continues.

A stopped run returns the stop, the facts sourced so far by section, the next step, and the smallest reply that unblocks it. For missing uses, that is "one screen name, what put the component there, and which variant showed".

### Fewer than two uses

- **One real use.** Write the whole entry. Mark Usage `NEEDS REVIEW (one real use)`, return `Status: ready-with-gaps (1 real use)`, and add a gate: "Second real use. Default: publish as is and recheck Usage when a second screen uses it."
- **Planned uses.** Accept them from a seed plan, pilot or brief. Mark each `(planned)` under Examples with no call-site code, sourced to the brief. They fill the count to two, but fewer than two real uses keeps the status at ready-with-gaps.
- **A deprecated predecessor.** Its call site counts as real when the migration map sends it to this component, and its Sources line says so.

### Conflicts that end in a question

Some conflicts finish the entry, add a Conflicts line, and end the reply with a question: a token or variant list that differs between sources with no precedence rule whose stated reason covers the case, code that behaves differently from its stories or spec, and a component with neither variants nor states. `sources.md` (Conflicts between sources) says how each is written.

### Defects

When the code or product does something that looks like a bug, such as a control with no accessible name or an active state lost on a nested route, document the current behavior. Under it, add a `Defect:` line to the owner (CODEOWNERS, else the file's last committer) with the smallest fix, and repeat it in the reply. A question about it defaults to "document current behavior, Defect line stays until the owner fixes or accepts it", never a silent "as is". When the fix only adds semantics, end the line `(adds semantics only)`. A coordinator lands that fix on the run branch as a decision, not a gate, and reruns the entry.

Everything else continues. A missing props type, token list, spec, notes or accessibility guidance becomes `NOT SUPPLIED`, `NEEDS REVIEW` or a Guessed at line, per `doc-format.md`.

## Hard limits

- Every variant, prop, token name, example and real use comes from a listed source. A planned use says planned.
- Every claim that something passes names the command that proved it and its result from this session.
- A conflict stays open with both sides shown, or is settled by a quoted rule.
- The skill never edits the code, stories or spec it documents.
- The entry is a draft. A coordinator decides where it goes, and publishing belongs to the person.
