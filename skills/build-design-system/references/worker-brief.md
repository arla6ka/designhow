# Worker brief

> For the team setting this up: this template is for phase 4, when the coordinating agent hands one component family to another agent. It works with any agent that can start a subagent, a background task or a separate session on its own branch. Keep every field. A brief with an empty field goes back to the coordinator, not to a worker.

Contents

- When to delegate
- What the coordinator keeps
- The template
- The spec-worker variant
- Filling it in
- Reviewing a report
- Retries and dropouts
- Running without subagents

## When to delegate

Delegate a family when its files do not overlap with any other open family, and the first family has landed and set the pattern. Do not delegate:

- the first family into a fan-out, because its result is what the briefs point to. When the build runs directly, the coordinator writes it. Under a boss, the boss's rule governs, and the build seat may be a subagent that writes it alone before any fan-out
- a family whose canonical pick waits on a gate
- work that edits the token source, generated files, barrel export, registry or migration map

Start with three to five workers at once, never above the cap in the Frame section. Add more only if reviews keep up. Refill a slot when a worker finishes instead of waiting for a whole batch. A report that waits a long time for review holds up the frontier as much as a slow worker.

Give each worker its own branch or worktree, cut from the run branch (`coordinator-path.md`), and merge verified work back into the run branch, never into the branch the run started on. Two agents in one checkout overwrite each other, and no instruction in a brief prevents that. When the host cannot give a worktree, such as a repo that is not the session's primary one, fall back to disjoint file scopes on one branch: split any shared file first (one stylesheet per component, for example), forbid git commands in workers, and have the coordinator commit each family after review. Record the fallback in the run record.

Read-only workers, such as phase 2's screen notes, get the same brief with an empty write scope. They return their notes as text, and the coordinator saves each one, such as `.design-system/inventory/screens/<route>.md`.

The coordinator owns the dev server. It starts one before the fan-out and keeps it running until every worker has returned.

## What the coordinator keeps

These files have one writer, the coordinator. Workers read them and report what they need changed.

- `tokens/` and every generated token file
- the barrel export (`components/ui/index.ts` or its equivalent)
- `registry.json` and the migration map
- the check scripts, their config, fixtures, allowlist and drift list
- `.design-system/run.md` and the baseline folder

A worker that needs a new token asks for it in its report, with the role and the call sites. It uses the nearest existing token in the meantime and marks the line. A worker whose fix removes allowlisted findings lists them as shrink candidates, and the coordinator runs `check-system.mjs --shrink-allowlist` after landing the surface (`coordinator-path.md`).

## The template

Copy this block into the worker's first message. Fill every field. Paste content, not references to the conversation, because the worker cannot see it.

```
GOAL
Make <Family> canonical: one component at <path> that meets the contract, with
examples, tests, a spec (the component-docs entry filled to spec-template.md),
and a migration map entry for each replaced implementation.

SCOPE
You may write: <component folder>, <examples folder for this family>,
<tests for this family>, <docs entry path for this family>,
.design-system/evidence/<family>/ for measurements and captures.
You may read anything in the repo.
Your branch: <branch or worktree, or "shared branch, no git commands">.
Dev server: http://localhost:<base port>. If it is down for 60 seconds, start
your own with <run command> on port <base port + worker n>, use it, and stop it
when you finish. Browser session: --session ds-worker-<n>. Absolute paths only.

CONTEXT
Family members from the inventory (name, file, call sites, root element, props):
<paste rows from components.tsv>
Canonical pick and why: <one line>
Token names you may use: <paste the semantic list for this family's categories>
Reference implementation: <path to the first family's component, examples, tests>
Contract: <paste component-contract.md, or give its path if the worker can read it>
Foundation and base reference: <foundation from triage, and base-shadcn.md, base-library.md or base-raw.md>
Spec: <paste spec-template.md and spec-example-combobox.md, or their paths>
Traps for this family: <paste the rows from traps.md>
Gates that touch this family and their defaults: <list, or "none">

ACCEPTANCE
- Contract sections met, or each unmet item listed as a gap
- Examples for every variant axis and triggerable state, importing from <import path>
- Tests pass: <test command>
- Every trap you mark fixed has measured before and after numbers in
  .design-system/evidence/<family>/, such as the button box idle and pending
- Migration map entry per replaced implementation, with unsupported props listed
- Zero raw values in your files: <check command> reports none
- node <repo>/scripts/check-spec.mjs <repo>/<spec path> exits 0
- Every answer in the spec names its source: a command, a file and line, a
  capture, or a gate. Nothing copied from the example

VERIFY
Run, in this order, and paste the last 20 lines and the exit code of each:
<typecheck command>
<test command for this family>
<check command scoped to your files>
<capture command for this family's examples, with absolute paths. A state
needs --surfaces with a states column; --routes captures the load state only>

TIMEBOX
<N> tool calls, sized from phase 4's cap in coordinator-path.md. At the limit, stop and report what you have,
with status PARTIAL.

FORBIDDEN
- Writing outside SCOPE, including tokens, generated files, the barrel,
  registry.json, the migration map, check scripts, the allowlist and baselines
- Changing call sites outside your examples and tests
- New dependencies
- New colors, fonts, shadows or motion
- Editing a test, fixture or check so it passes
- Writing any file outside SCOPE
- Writing a report file anywhere, report.md included. The report is your
  final message

REPORT
Return this block as your final message, as text. Write it to no file.
The coordinator saves it. Name any decision or gate you propose with your
family as prefix, such as D-button-01 or G-button-01. The coordinator
renumbers it into the run record.
Status: DONE, PARTIAL or BLOCKED
Branch and last commit:
Files changed:
Commands run and their results (pasted):
Screenshots: paths
Migration map entries: pasted JSON
Requests for the coordinator: new tokens, barrel lines, registry fields
Allowlist shrink candidates: file, rule, literal, and the count your
  check-system --files run finds now, or "none"
States built, and states left with a proposed gate:
Props removed or renamed, each with its call sites (each needs a gate):
Gaps against the contract:
Anything you decided that the brief did not cover:

STANDING
<paste the run's one standing-order list from run.md, word for word>
```

## The spec-worker variant

When only specs fan out (`SKILL.md` phase 1, under about 15 component files and one theme), the coordinator has already written the components, and a spec worker writes one `docs/system/<component>.md` and nothing else. The family template above asks for code, examples, tests and a migration map this worker must not touch, so use this variant. Keep every field.

```
GOAL
Write the spec for <Component> at docs/system/<component>.md, filled to
spec-template.md from this app's evidence. The component is done and is not
yours to change. A defect you find goes in your report, not in the code.

SCOPE
You may write: docs/system/<component>.md, and .design-system/evidence/<component>/
for probe scripts, captures and measurements. Evidence there survives the run.
Never cite a file in .design-system/tmp/, which is deleted at close.
You may read anything in the repo. No git commands: the coordinator commits.
Dev server: http://localhost:<base port>. Do not start or restart it.
Browser session: --session ds-spec-<n>. Absolute paths only.

CONTEXT
Component source and examples: <paths>
Props from the types: <paste the output of node <repo>/scripts/props-table.mjs <repo>/<source>>
Real uses: <paste call sites: file:line, screen, variant, state>
Traps for this family: <paste the rows from traps.md>
Gates and decisions that touch it, with defaults: <list, or "none">
Template and worked example: <paths to spec-template.md and spec-example-combobox.md>
Foundation and base reference: <foundation from triage, and the base-*.md path>

ACCEPTANCE
- node <repo>/scripts/check-spec.mjs <repo>/docs/system/<component>.md exits 0, which includes
  spec/props-drift: every Variants axis and value, and every Props note, matches
  the component at HEAD
- Every States, Keyboard and ARIA row names how it was checked. "test" or
  "snapshot" points at a file in .design-system/evidence/<component>/. With no
  test runner in the repo, a probe script saved there counts as the test
- Contrast is measured in each theme with a command, and the ratio is written down
- Every answer names its source: a command, a file and line, a capture, or a gate
- Examples opens with "Real uses, <n> call sites", counted with
  rg -n "<Name\b" in the include folders outside the component's folder.
  check-spec fails the count, and any file:line you cite, once the code moves
- In prose, element names go in backticks (`<a>`), since check-spec reads a bare
  angle bracket as a template placeholder

VERIFY
Run, and paste the last 20 lines and the exit code of each:
node <repo>/scripts/check-spec.mjs <repo>/docs/system/<component>.md
<one probe or capture command per state marked screenshot or snapshot. A state
needs capture.mjs --surfaces <tsv with a states column> --states <module>;
--routes captures the load state only>

TIMEBOX
<N> tool calls, sized from phase 4's cap in coordinator-path.md. At the limit, stop and report what you have,
with status PARTIAL.

FORBIDDEN
- Editing the component, its examples, tests, tokens, barrel, registry, check
  scripts, the allowlist or any file outside SCOPE
- Git commands, and starting or stopping the dev server
- Copying an answer from the example
- Writing any file outside SCOPE
- Writing a report file anywhere, report.md included. The report is your
  final message

REPORT
Return this block as your final message, as text. Write it to no file.
Name any decision or gate you propose with your component as prefix, such
as D-combobox-01. The coordinator renumbers it into the run record.
Status: DONE, PARTIAL or BLOCKED
Files written:
Commands run and their results (pasted):
Defects found in the component, each with its measurement and evidence path:
Requests for the coordinator:
Anything you decided that the brief did not cover:

STANDING
<paste the run's one standing-order list from run.md, word for word>
```

Review a spec report the same way as a family report, minus the code steps: rerun `check-spec.mjs` yourself, open two evidence files the spec cites, and confirm the worker's changed files are only its spec and its evidence folder. A defect it reports is the coordinator's to fix, as a decision when it is broken behavior, and the spec is rechecked at HEAD after the fix.

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
7. Record. Save the worker's status line and file list to `.design-system/returns/<family>.<attempt>.md`, not the whole message. Give each decision or gate it proposed (`D-button-01`) the next free `D-NN` or `G-NN` in the run record, with the worker's ID in the row's evidence, since two workers both write `-01`. Then add a ledger row: family, branch, commit, verdict, evidence path. A new commit on the branch voids the row. Open a worker's files only after its final message returns, since it may still be rewriting them.

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
