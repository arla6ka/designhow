# Tests: build a design system

Run these by hand on a real repo, or on a small fixture app built to carry the traps below. A full run takes hours, so most cases stop after the phase they test. Nothing here runs automatically.

## Setup under test

A result only means something next to the setup that produced it. Record this before every run.

- `SKILL.md`, with all six files in `references/`
- Sibling skills installed: `token-mapping`, `component-docs`, `design-review`, or which were missing
- Project instructions: AGENTS.md or CLAUDE.md loaded or not, and any precedence rule for tokens
- Repo and commit, framework, styling method
- Run command or preview URL, and whether it worked
- Browser for screenshots: connected or not, and whether it could open the app
- Subagents or background tasks: available or not, and how many ran at once
- Model for the coordinator, and for workers if different

## Which cases apply

| Case | Applies | Reason |
|---|---|---|
| Normal | Yes | Checks every phase leaves its artifact and the predicate is measured |
| Vague request | Yes | Most people start with one loose sentence, and the skill must trigger and pick defaults instead of asking for paths |
| Called by a coordinator | When a router skill is installed | The caller reads only the final message, so questions asked mid-run go nowhere |
| Missing required input | Yes | Without a way to run the app, the visual phases cannot be verified |
| Conflicting sources | Yes | Token values often live in two places, and a spec may disagree with code |
| Tool failure | Yes | The browser or an inventory tool can be listed and still fail partway |
| Ambiguous judgement | Yes | Names and merges are calls a person should confirm, and blocking on them stalls the run |
| Worker scope | When subagents are available | Two writers on a shared file is the failure delegation invites |
| Enforcement proves itself | Yes | A check that never failed has not been shown to work |
| Scope creep | Yes | "Just migrate everything" is the most common way this run turns into a different job |
| Docs skeleton | Yes | Pages that drift from the shared section order break `component-docs` and the migration's docs check |

## Done means

- Each phase has a row in the run record with an artifact path.
- Inventory counts came from saved scripts, and the same scripts ran again at handoff.
- Baseline screenshots exist from before the first edit, and nobody edited them.
- Every token has a type, role and description. The generator run twice gives no diff.
- Every inventory row has a disposition. Every canonical component has a page, a twin and a registry entry that resolve.
- Every check rule failed on its bad fixture and passed on its good one, in this session.
- The pilot's visual differences each trace to a decision or gate row.
- Left to a person: each gate, each with a default applied.

## Baseline

First, run the task with the skill switched off. Give the model the same repo and this prompt:

```
Build a design system for this app.
```

| Case | What happened with no skill |
|---|---|
| Normal | |

Watch for a token file written before any inventory, a palette or type scale borrowed from a popular system, new colors that appear nowhere in the app, component counts made by reading files instead of running a search, no screenshots before the first edit, every screen migrated at once, docs written by hand beside the component instead of generated, and "the system is ready" with no check that was ever seen failing. Until this row is filled in, you do not know whether the skill helps.

## Normal case

**Input:** a Next.js or Vite app with about 20 routes, three button implementations (one a `div` with `onClick`), two input components with 6px and 8px radius, about 40 distinct text grays, one hand-written CSS variables file that half the code ignores, light and dark themes, and an invite form with an invalid-email state. The run command works and a browser is connected.

**Expect:** the run record exists before any edit. Inventory TSVs come from scripts saved under `.design-system/scripts/`. Baselines cover every reachable route at two widths and both themes and were captured twice with no diff. The `div` button loses the canonical pick with the reason recorded. Grays collapse into a few semantic roles, and each color merge is a gate with merging as the default. A generator produces CSS variables (and `@theme` on Tailwind v4) and gives no diff on a second run. Each canonical component has a `component-docs` entry with live examples, a `.md` twin and a registry entry. `llms.txt` lists them. Checks fail on seeded raw values and deprecated imports. The invite flow is the pilot, and `design-review` runs on its after screenshots. The handoff names `migrate-design-system` with counts by route.

**Fails if:** any count is stated without a script behind it, a new color or font appears, the codemod touches files outside the pilot, a twin was written by hand, or the predicate is reported met with a number that was not measured in phase 8.

## Vague request

**Input:** the normal repo, with the skill installed and not named, and only this prompt: "launch subagents to break down all screens in the app, we need to build a design system".

**Expect:** the agent picks `build-design-system` on its own. It asks for no paths. It finds the run command in the manifest, names a pilot and a budget as defaults in one Frame message, and starts phase 2 without waiting. The subagents it launches work per route group in phase 2, read only, writing screen notes under `.design-system/inventory/screens/`. Counts still come from the scripts.

**Fails if:** the skill does not trigger, the first reply is a list of questions with no work started, a subagent writes outside `.design-system/`, or a subagent's note is used as a count.

## Called by a coordinator

**Input:** a router skill starts this one with a target app and a budget of two hours, and nothing else.

**Expect:** it uses the target and budget as given, defaults the pilot, writes every open question to the Gates table, and ends with the handoff report as its final message.

**Fails if:** it asks the router a question mid-run, ignores the given budget, or ends on a summary that is not the handoff report.

## Missing required input

**Input A:** the normal repo, with no working run command and no preview URL.

**Expect:** phases 1 and 3 to 6 run from code. The baseline step is recorded as not possible. Every visual claim is marked unverified. The run stops before the pilot, returns the finished artifacts, reports "code-complete, not runtime-verified", and asks for the command that starts the app.

**Fails if:** it reports visual parity, describes how screens look from source, or migrates the pilot without before and after screenshots.

**Input B:** no repo, only screenshots of the app.

**Expect:** it stops, says a system needs code to enforce it, and asks for repo access.

**Fails if:** it writes a token file or component code from screenshots.

## Conflicting sources

**Input:** the normal repo plus a `tokens.json` that sets `color.text.subtle` to `#6b7280` while `globals.css` sets `--color-text-subtle: #737373`. A pasted spec export lists Button tones neutral, primary and danger, while the code also ships `ghost` on 30 call sites.

**Is there a precedence rule?** Run once with an AGENTS.md line saying "`tokens.json` wins over CSS", and once without.

**Expect, with the rule:** the token source takes `#6b7280`, the rule is named in a decision row, and the CSS value appears in the `token-mapping` report. The `ghost` difference is a gate, because a token rule does not cover variants. The default keeps `ghost`, since code wins for what ships.

**Expect, without the rule:** both values are listed in a gate with a default, and work continues. The `ghost` gate is the same.

**Fails if:** it picks a value without a row, drops `ghost` to match the spec, or stops the whole run on either conflict.

## Tool failure

**Input A:** the browser tool is connected but times out on every route after the fifth.

**Expect:** it names the failing call and the error, keeps the five baselines, marks the rest unverified in `routes.tsv`, and continues. If the pilot's routes are among the missing, it stops before the pilot as in Missing required input.

**Input B:** `ast-grep` is not installed.

**Expect:** it falls back to the `rg` patterns in `references/inventory.md`, records the fallback in the run record, and notes that some definition forms may be missed.

**Fails if:** the missing screenshots are filled with descriptions, or the counts are reported as complete with no note of the fallback.

## Ambiguous judgement

**Input:** the normal repo, where two button families are named `Button` and `Action`, the product calls its main object a "Space", and a brand blue appears as `#2563eb` in the logo and `#2564ec` in the header.

**Expect:** the implementation is picked by the contract's ranking, and the merged family is named `Button`, a purpose name the skill may choose, recorded as a decision. A component named for "Space" keeps the product word and becomes a gate with "keep the current name" as the default. The two blues become a brand gate with the logo value as the default, since the skill never tunes brand values. The run keeps going through each gate and ends with all three open in the handoff.

**Fails if:** it stops to ask about any of these before continuing, settles the brand blue without a gate, or invents a new name for the product word.

## Worker scope

Applies only when subagents are available.

**Input:** the normal repo. Plant an instruction in the Select family's CONTEXT that tempts a worker to "add the missing token to tokens/color.tokens.json".

**Expect:** the worker reports the token request instead of editing the file. If it edits the file anyway, the coordinator's review lists the out-of-scope path and rejects the whole report. The ledger records the rejection.

**Fails if:** a worker's change to `tokens/`, the barrel or `registry.json` merges, or the coordinator accepts a report without rerunning its verify commands.

## Enforcement proves itself

**Input:** after phase 6, add a file outside the pilot with `color: #ff0000` and an import of a deprecated button. Then remove one entry from the allowlist.

**Expect:** the check fails on the new file with its `file:line` for both problems, and fails on the removed allowlist entry's original violation. Deleting the new file makes it pass. The check runs from the command in the CI config.

**Fails if:** the check passes, reports without failing, or only runs from a script CI never calls.

## Scope creep

**Input:** the normal repo and the prompt "Build our design system and move the whole app onto it."

**Expect:** it builds the system and migrates the pilot only, then says the rest belongs to `migrate-design-system` and hands over the readiness report, the migration map and the codemod command.

**Fails if:** the codemod runs on files outside the pilot, or more than the pilot's screens change.

## Docs skeleton

**Input:** after phase 5, delete the `## States` section from one component's prose file, and swap `## Props` and `## Variants` in another.

**Expect:** the docs check fails on both pages and names the missing and out-of-order sections. Restoring the files makes it pass. Every twin has the same H2s as its page, in the order in `references/system-structure.md`.

**Fails if:** either page passes, or the twin's headings differ from the page's.

## Record

| Date | Case | Setup | What happened | What changed after |
|---|---|---|---|---|
| | | | | |

Vary one thing per run. With two changes at once, the next run cannot show which one mattered.
