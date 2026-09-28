---
name: component-docs
description: Writes one component's documentation entry from its code, stories and real call sites, in a Geist-style page order. Use for "document the button", "write docs for Select", "what states does Toast have", usage rules for a component, or a component that is new or changed. Skip foundations, overview pages and patterns that span several components.
---

# Component documentation

A draft entry for one component, built only from what its sources say. Every gap is marked instead of filled, and every judgement call is listed for a person to check. It does not judge the design and does not publish.

The headings, what goes under each, a worked example and the review checklist are in `references/doc-format.md`. How to find the component, its real uses and each kind of source is in `references/sources.md`.

## Start from whatever the ask gives

A component name is enough. "The button" counts. Search the repo for the code, the stories and the call sites yourself, and ask only for what no tool can reach. If the ask names several components, document the first and list the rest at the end.

## When a coordinator calls it

A coordinator, such as a router skill or `build-design-system`, passes the code, the variant list and two real uses from its inventory. Take them as given and run to the end without asking. Conflicts and Guessed at carry every open question, and the caller turns them into gates. Start the output with one status line: `Status: complete`, `Status: complete with NEEDS REVIEW (n)`, or `Status: stopped: <condition>`. End by returning the entry with its three blocks, or the stop shape below, as your final message, since the coordinator reads nothing else.

## Steps

1. **Paste the skeleton.** Copy the heading list from `references/doc-format.md` into the draft, empty.
2. **Find the component** and read its code, props type, styles and stories. Done when each has a Sources line with how it arrived and when.
3. **Find two real uses**, from what was pasted or by searching call sites. Done when two uses meet the definition in `references/sources.md`, each with a Sources line.
4. **Check the stops** below. If a missing input applies, return the stop shape and end the run.
5. **Trace every fact.** For each example, variant, prop, state and token, note which source supplied it.
6. **Compare sources** that state the same facts, such as the props type, the stories, old docs and a spec. Done when every difference is a line under Conflicts.
7. **Fill each section** from sourced facts, in the format's order. Copy token names and example code character for character. Write each state as what the user can do or what the component does.
8. **Write do and don't pairs last.** Keep a pair only if the component or its API allows the don't, and cut any pair that restates a line from "Use it when".
9. **Close out.** Fill Guessed at, then run the review checklist in `references/doc-format.md` and fix each failure.

## Output

One Markdown entry, ready to paste, followed by three blocks outside it.

- **Sources.** One line per source: what it is (code path, story, call site, pasted code, spec, notes), how it arrived, and when it was read.
- **Conflicts.** One line per disagreement: the fact, what each source says, and either the precedence rule applied (quoted, with where it lives) or "no rule, not chosen".
- **Guessed at.** One line per judgement call: the section, the claim, and what it rests on. "Nothing guessed" when there were none.

The entry is ready when:

- It uses every heading in `references/doc-format.md`, in that order, with none added or renamed.
- Every example, variant, prop, token name and real use traces to a line under Sources.
- Every gap reads `NOT SUPPLIED` or `NEEDS REVIEW`.
- Every prop in Props exists in the code read, with the same name and default.
- No state line mentions a color, a border or a shadow.

A person checks each `NEEDS REVIEW` marker, each Guessed at line, and each conflict no rule settled.

## Stops

| Missing after searching | Why it stops |
|---|---|
| Code | Nothing else sources the variants, props or behavior |
| Variant list, from code or stories | An entry built on a guessed variant list documents a different component |
| Two real uses | Invented uses read like real ones, and readers copy them first |

These finish the entry and end it with a question:

- A token has one name in one source and another elsewhere, with no precedence rule for tokens in AGENTS.md or CLAUDE.md. List both and ask which is current.
- Two sources give different variant lists. Before applying a precedence rule, check its stated reason holds for this case. A rule that says the spec wins because code lags does not cover a variant the code has and the spec lacks. Mark the odd variant `NEEDS REVIEW` and ask which list is current.
- Code behaves differently from the stories, the spec or the notes. Write both into States with `NEEDS REVIEW` and ask which is intended.
- The component has neither variants nor states. Ask whether it belongs inside another component's entry.

Each of these also gets a Conflicts line.

Everything else continues. A missing props type, token list, spec, notes or accessibility guidance becomes `NOT SUPPLIED`, `NEEDS REVIEW` or a Guessed at line, as `references/doc-format.md` says per section.

A stopped run returns the stop that applied, the facts already sourced grouped by section, and the smallest reply that unblocks it. For missing uses, that reply is "one screen name, what put the component there, and which variant showed".

## Hard limits

- Every variant, prop, token name, example and real use in the entry comes from a listed source.
- Headings match `references/doc-format.md` exactly.
- A conflict stays open with both sides shown, or is settled by a quoted rule. The code, stories and spec stay unedited.
- The entry is a draft. Publishing it and writing it into the repo belong to whoever called the skill.
