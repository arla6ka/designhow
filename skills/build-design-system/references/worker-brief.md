# Worker brief

> For the team setting this up: this template is for phase 4, when the coordinating agent hands one component family to another agent. It works with any agent that can start a subagent, a background task or a separate session on its own branch. Keep every field. A brief with an empty field goes back to the coordinator, not to a worker.

Contents

- When to delegate
- What the coordinator keeps
- The template
- Filling it in
- Reviewing a report
- Retries and dropouts
- Running without subagents

## When to delegate

Delegate a family when its files do not overlap with any other open family, and the first family (done by the coordinator) has landed and set the pattern. Do not delegate:

- the first family, because its result is what the briefs point to
- a family whose canonical pick waits on a gate
- work that edits the token source, generated files, barrel export, registry or migration map

Start with three to five workers at once, never above the cap in the Frame section. Add more only if reviews keep up. Refill a slot when a worker finishes instead of waiting for a whole batch. A report that waits a long time for review holds up the frontier as much as a slow worker.

Give each worker its own branch or worktree. Two agents in one checkout overwrite each other, and no instruction in a brief prevents that.

## What the coordinator keeps

These files have one writer, the coordinator. Workers read them and report what they need changed.

- `tokens/` and every generated token file
- the barrel export (`components/ui/index.ts` or its equivalent)
- `registry.json` and the migration map
- the check scripts, fixtures and allowlist
- `.design-system/run.md` and the baseline folder

A worker that needs a new token asks for it in its report, with the role and the call sites. It uses the nearest existing token in the meantime and marks the line.

## The template

Copy this block into the worker's first message. Fill every field. Paste content, not references to the conversation, because the worker cannot see it.

```
GOAL
Make <Family> canonical: one component at <path> that meets the contract, with
examples, tests, a component-docs entry, and a migration map entry for each
replaced implementation.

SCOPE
You may write: <component folder>, <examples folder for this family>,
<tests for this family>, <docs entry path for this family>.
You may read anything in the repo.
Your branch: <branch or worktree>.

CONTEXT
Family members from the inventory (name, file, call sites, root element, props):
<paste rows from components.tsv>
Canonical pick and why: <one line>
Token names you may use: <paste the semantic list for this family's categories>
Reference implementation: <path to the first family's component, examples, tests>
Contract: <paste component-contract.md, or give its path if the worker can read it>
Gates that touch this family and their defaults: <list, or "none">

ACCEPTANCE
- Contract sections met, or each unmet item listed as a gap
- Examples for every variant axis and triggerable state, importing from <import path>
- Tests pass: <test command>
- Migration map entry per replaced implementation, with unsupported props listed
- Zero raw values in your files: <check command> reports none

VERIFY
Run, in this order, and paste the last 20 lines of each:
<typecheck command>
<test command for this family>
<check command scoped to your files>
<screenshot command for this family's examples>

TIMEBOX
<N> minutes or <N> tool calls. At the limit, stop and report what you have,
with status PARTIAL.

FORBIDDEN
- Writing outside SCOPE, including tokens, generated files, the barrel,
  registry.json, the migration map, check scripts and baselines
- Changing call sites outside your examples and tests
- New dependencies
- New colors, fonts, shadows or motion
- Editing a test, fixture or check so it passes

REPORT
Status: DONE, PARTIAL or BLOCKED
Branch and last commit:
Files changed:
Commands run and their results (pasted):
Screenshots: paths
Migration map entries: pasted JSON
Requests for the coordinator: new tokens, barrel lines, registry fields
Gaps against the contract:
Anything you decided that the brief did not cover:

STANDING
<paste the standing orders from the Frame section of run.md, word for word>
```

## Filling it in

- If a field cannot be filled, the family is not ready to hand off. Fix that first, or keep the family.
- Paste inventory rows and token lists in full. A worker given "see the inventory" will build its own, differently.
- Keep the brief to one family. Two families in one brief means two sets of files and a report nobody can grade in one pass.
- The standing orders go in every brief, including retries. Instructions that are only in the first message get lost when a worker is restarted.

## Reviewing a report

Do not trust the report's summary. Check the work itself.

1. Status and fields. A report missing commands, output or a commit gets one rerun. A second miss is logged as a gap, not a pass.
2. Scope. List the files changed on the branch. Any file outside SCOPE rejects the whole report. Send it back with the path named.
3. Verify. Rerun the VERIFY commands yourself on the worker's branch. Your output is the result that counts.
4. Screenshots. Open the example screenshots for each variant and state, in each theme. Compare them with the baseline screenshots of the replaced implementations at the same size.
5. Contract. Walk `component-contract.md` against the code. Accessibility and API shape need judgment, so for those, use a second reviewer that did not write the code. A different model is better when one is available. Give it only the diff, the brief and the contract.
6. Requests. Apply accepted token, barrel and registry changes yourself, in one change per family, after the family merges.
7. Record. Add a ledger row: family, branch, commit, verdict, evidence path. A new commit on the branch voids the row.

Verdicts are `verified`, `verified with gaps`, `failed` or `blocked`. Anything that ran on a different commit from the one merging is not verified.

## Retries and dropouts

- Failed on a check: send the same brief back with the failing output pasted into CONTEXT. Retries with the real error work better than rewording the brief.
- Ran out of time: split the family (for example, the component first, then examples and docs) and send two smaller briefs.
- Tool or environment error: retry once as-is. If it fails again, do the family yourself.
- Two failed retries: stop delegating that family, record why in the run record, and either do it yourself or mark it blocked.
- A worker that never reports gets a ledger row saying so. Do not quietly redo its work without that row.
- Judge a worker by what it left: commits on its branch and its report. Do not resume or message it to ask how it is going, because that restarts it or pulls it off the task. Past its TIMEBOX with no new commit, treat it as lost and retry once.
- A retry is a fresh brief with the failing output folded in, never a follow-up message to the old worker. Instructions added in follow-ups get dropped on the next restart.

If three or more families fail on the same cause, stop spawning. The cause is in the brief, the contract or the reference implementation. Fix it there, then resend.

## Running without subagents

Run the same briefs yourself, one family at a time, on one branch. Keep the scope rule anyway. During a family's turn, edit only that family's files, and apply shared-file changes at the end of the turn. The ledger rows and verdicts stay the same. It is slower and it produces the same artifacts.
