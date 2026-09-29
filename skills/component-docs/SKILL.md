---
name: component-docs
description: Writes one component's documentation entry from its code, stories and real call sites, in a Geist-style page order. Use for "document the button", "write docs for Select", "what states does Toast have", usage rules for a component, or a component that is new or changed. Skip foundations, overview pages and patterns that span several components. Docs for a whole design system go to design-system-boss.
---

# Component documentation

A draft entry for one component, built only from what its sources say. Every gap is marked instead of filled, and every judgement call is listed for a person to check. It does not judge the design and does not publish.

The format and checklist are in `references/doc-format.md`, and finding the component, its uses and sources in `references/sources.md`.

## Start from whatever the ask gives

A component name, such as "the button", is enough. Find the code, stories and call sites yourself, and ask only for what no tool can reach. If the ask names several components, document the first and list the rest at the end. A compound component (`Tabs` with `Tab`) is one entry. When a part is also used on its own, it gets a `### Parts` subsection under Description, with its own call sites.

## When a coordinator calls it

A coordinator, such as a router skill or `build-design-system`, passes the code, the variant list and the real uses from its inventory, or planned uses from its pilot or brief. Take them as given and run to the end without asking. Conflicts and Guessed at carry every open question, and the caller turns them and the Gates block into gates. Start the output with one status line: `Status: complete`, `Status: complete with NEEDS REVIEW (n)`, `Status: ready-with-gaps (<n> real uses)`, or `Status: stopped: <condition>`. A direct run uses the same line. Return the entry with its blocks, or the stop shape below, as text. Write no report or scratch file. The coordinator saves the entry, unless the brief's SCOPE names its path.

## Steps

1. **Paste the skeleton.** Copy the heading list from `references/doc-format.md` into the draft, empty.
2. **Find the component** and read its code, props type, styles and stories. Done when each has a Sources line with how it arrived. Run `date` in the shell at each read and copy its output as the time, or leave the time out. Never estimate one afterwards.
3. **Find two real uses**, from what was pasted or by searching call sites. Done when two uses meet the definition in `references/sources.md`, each with a Sources line, or the rules under Fewer than two uses apply.
4. **Check the stops** below. If a missing input applies, return the stop shape and end the run.
5. **Trace every fact.** For each example, variant, prop, state and token, note which source supplied it.
6. **Compare sources** that state the same facts, such as the props type, the stories, old docs and a spec. Done when every difference is a line under Conflicts.
7. **Fill each section** from sourced facts, in the format's order. Copy token names and example code character for character. Write each state as what the user can do or what the component does. When two states can hold at once, settle which wins from the built CSS or a browser read before marking it `NEEDS REVIEW`.
8. **Write Usage rules last,** by the rule method in `references/doc-format.md` (Usage): each rule has a shape, a ground and a check, and passes the four tests or is cut.
9. **Close out.** Fill Guessed at, then fix each failure on the review checklist in `references/doc-format.md`.
10. **Spec check.** When the caller asks for a spec, or the repo's entries already have a `### State precedence` section, the entry is a spec. Fill the extra H3s and tables from the repo's `docs/system/`: its vendored spec template when there is one, and an existing spec there as the skeleton. Use `build-design-system/references/spec-template.md` only when the repo has neither. Pipe the entry to `node scripts/check-spec.mjs -` from the repo root, or the skill's copy when the repo has none. Fix each failure from a source or mark the gap. Never invent a state or a precedence to pass. Put the check's last line in the status block.

## Output

One Markdown entry, ready to paste, followed by three blocks outside it, and a fourth when a rule adds a gate.

- **Sources.** One line per source: what it is (code path, story, call site, pasted code, spec, notes), how it arrived, and the `date` output taken at the read, if one was taken.
- **Conflicts.** One line per disagreement: the fact, what each source says, and either the precedence rule applied (quoted, with where it lives) or "no rule, not chosen".
- **Guessed at.** One line per judgement call: the section, the claim, and what it rests on. "Nothing guessed" when there were none.
- **Gates.** Only when a rule below adds one: the question and its default. Omit the block otherwise.

Run directly, save the entry with its blocks to `docs/system/<name>.md` with a draft comment on line 1, and write each missing example file the Example files table lists, or mark its row `NOT SUPPLIED: <reason>`. The reply opens with that path, what the entry covers and its status, then each command run with its exit code, any Defect lines, at most 3 questions with their defaults, and `Next:` with one prompt the person can paste. Every count in the reply, such as NEEDS REVIEW markers, comes from `grep -o` on the saved file below the draft comment, never from memory.

The entry is ready when:

- It uses every heading in `references/doc-format.md`, in that order, with none added or renamed.
- Every example, variant, prop, token name and real use traces to a line under Sources.
- Every gap reads `NOT SUPPLIED` or `NEEDS REVIEW`.
- Every variant value and state has an example file or a row saying why not.
- Every probable defect has a Defect line.
- For a spec, `check-spec.mjs` exits 0, or every remaining failure is listed under Guessed at with why no source settles it.

A person checks each `NEEDS REVIEW` marker, each Guessed at line, and each conflict no rule settled.

## Stops

| Missing after searching | Why it stops | The coordinator does next |
|---|---|---|
| Code | Nothing else sources the variants, props or behavior | Pass the code path and rerun, or drop the component from the batch and log it as a gap |
| Variant list, from code or stories. A props type with no variant prop is an empty list, not a missing one. Variants reads "None" and the run continues | An entry built on a guessed variant list documents a different component | Pass the props type or stories and rerun, or park it as a gate for the owner to name the variants |
| Any use: zero real and zero planned | Invented uses read like real ones, and readers copy them first | Build the pilot screen first, or pass one screen from the brief as a planned use, then rerun. Never write the entry itself |

### Fewer than two uses

- **One real use.** Write the whole entry. Mark Usage `NEEDS REVIEW (one real use)`, return `Status: ready-with-gaps (1 real use)`, and add a gate: "Second real use. Default: publish as is and recheck Usage when a second screen uses it."
- **Planned uses.** In seed or new-app work, or when a coordinator passes uses from a pilot or brief, accept them. Mark each `(planned)` under Examples, with no call-site code, and source it to the brief. They fill the count to two. With fewer than two real uses the status stays ready-with-gaps.
- A deprecated predecessor's call site counts as a real use when the migration map sends it to this component. Say so in its Sources line.

These finish the entry and end it with a question:

- A token has one name in one source and another elsewhere, with no precedence rule for tokens in AGENTS.md or CLAUDE.md. List both and ask which is current.
- Two sources give different variant lists. Before applying a precedence rule, check its stated reason holds for this case. A rule that says the spec wins because code lags does not cover a variant the code has and the spec lacks. Mark the odd variant `NEEDS REVIEW` and ask which list is current.
- Code behaves differently from the stories, the spec or the notes. Write both into States with `NEEDS REVIEW` and ask which is intended.
- The code or the running product does something that looks like a bug, such as a parent tab going idle on child routes or a missing `aria-current`. Document the current behavior, add `Defect:` under it addressed to the owner (CODEOWNERS, else the file's last committer from `git log`) with the smallest fix, and repeat it in the reply. A question about it defaults to "document the current behavior, Defect line stays until the owner fixes or accepts it". Never a silent "as is". When the fix only adds semantics, such as a missing `aria-current`, end the Defect line `(adds semantics only)`. A coordinator lands that fix on the run branch as a decision, not a gate, and reruns the entry.
- The component has neither variants nor states. Ask whether it belongs inside another component's entry.

Each of these also gets a Conflicts line.

Everything else continues. A missing props type, token list, spec, notes or accessibility guidance becomes `NOT SUPPLIED`, `NEEDS REVIEW` or a Guessed at line, as `references/doc-format.md` says per section.

A stopped run returns the stop that applied, the facts already sourced grouped by section, the next step from the table, and the smallest reply that unblocks it. For missing uses, that reply is "one screen name, what put the component there, and which variant showed".

## Hard limits

- Every variant, prop, token name, example and real use in the entry comes from a listed source. A planned use says planned.
- Every claim that something passes names the command that proved it and its result from this session.
- A conflict stays open with both sides shown, or is settled by a quoted rule. The code, stories and spec stay unedited.
- The entry is a draft. A coordinator decides where it goes, and publishing belongs to the person.
