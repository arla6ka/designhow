# Worker brief

This template is for phase 4, when the coordinator hands one component family to another agent: a subagent, a background task or a separate session on its own branch. A brief with an empty field goes back to the coordinator, not to a worker.

Contents

- When to delegate
- What one writer keeps
- The template
- The spec-worker variant
- Filling it in
- Orders by role
- Parallel workers in one checkout
- Reviewing a report
- Retries and dropouts
- Running without subagents

## When to delegate

Delegate a family when its files do not overlap with any other open family, and the first family has landed and set the pattern. Do not delegate:

- the first family, because its result is what the briefs point to. Its one writer is named in `coordinator-path.md` (Lock before fan-out), and it lands before any fan-out
- a family whose canonical pick waits on a gate
- work that edits the token source, generated files, barrel export, registry or migration map

Size the fan-out first. A small app fans out nothing (`coordinator-path.md`, Small app). In a small layer, by default under 15 component files and one theme, the coordinator writes the components and only specs fan out, because a brief costs more than the code. Otherwise families fan out too, one per worker. The window starts at the browser row of `coordinator-path.md` (Machine budget) and never exceeds the budget. Refill a slot only when no report waits for review, and never wait for a whole batch.

Name roles in briefs, not models. The cheapest model that can read the whole scope runs read-only surveys. The strongest runs code, rules and the second review.

Give each worker its own branch or worktree, cut from the run branch, and merge verified work back into the run branch. Two agents in one checkout overwrite each other, and no instruction in a brief prevents that. When the host cannot give a worktree, fall back to disjoint file scopes on one branch: split any shared file first (one stylesheet per component, for example), forbid git commands in workers, and have the coordinator commit each family after review. Record the fallback in the run record, and use the shared brief below.

Before fan-out, remove the reasons a worker would need a shared file. Make the showcase registry, the docs page list and the rules index find files by glob or generation, and add each family's barrel line and registry entry as a stub first. Then a worker's page renders the moment its file exists, and its imports use the public path from the first line. A worker that cannot see its own page ships unmeasured contrast and unchecked states.

Read-only workers, such as phase 2's screen notes, get the same brief with an empty write scope. They return notes as text, and the coordinator saves each, such as `.design-system/inventory/screens/<route>.md`.

The dev server and the browser follow `coordinator-path.md` (Dev server and retries).

## What one writer keeps

Workers read these files and report what they need changed. The token source `tokens/` and every generated token file belong to the one writer `coordinator-path.md` (Lock before fan-out) names for the host. The coordinator writes the rest:

- the barrel export (`components/ui/index.ts` or its equivalent)
- `registry.json` and the migration map
- the check scripts, their config, fixtures, allowlist and drift list
- `.design-system/run.md` and the baseline folder

A worker that needs a new token asks for it in its report, with the role and the call sites, and uses the nearest existing token meanwhile, with the line marked. A worker whose fix removes allowlisted findings lists them as shrink candidates for the coordinator.

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
Scratch drafts go in .design-system/tmp/<worker id>/ only.
You may read anything in the repo.
Your branch: <branch or worktree, or "shared branch, no git commands">.
Dev server: http://localhost:<base port>. If it does not answer, in your own
worktree start <run command> on port <base port + worker n> and stop it when
you finish. In a shared checkout, return blocked: server down.
Browser session name: ds-worker-<n>. Absolute paths only.

CONTEXT
Family members from the inventory (name, file, call sites, root element, props):
<paste rows from components.tsv>
Canonical pick and why: <one line>
Token names you may use: <paste the semantic list for this family's categories>
Reference implementation: <path to the first family's component, examples, tests>
Contract: <paste component-contract.md, or give its path if the worker can read it>
Foundation and base reference: <foundation from triage, and base-shadcn.md, base-library.md or base-raw.md>
Spec: <paste spec-template.md and spec-example-combobox.md, or their paths>
Exemplar spec: <path to the first family's finished spec>. Match its headings,
rule shape and depth. The template is the fallback only when none exists
Rule method: <path to rule-method.md, and writing-method.md when the family renders copy>
Traps for this family: <paste the rows from traps.md>
Gates that touch this family and their defaults: <list, or "none">
Person's calls: <explicit values the person set, each with its file, or "none">
Checks known to fail, and who owns each fix: <list, or "none">

ACCEPTANCE
- Contract sections met, or each unmet item listed as a gap
- Example files per the spec's Example files table: every variant value and state
  with a visual or behavior difference, and one composition, each complete and
  importing from <import path>
- Every Usage rule has its ID, shape, ground, check and Don't and Do lines
  (rule-method.md), and a row in docs/system/rule-tests/<component>.tsv with
  verdict ship, rewritten or gate. The rules land with the component, not later
- Tests pass: <test command>. Every behavior claim (keyboard, focus, open state,
  timers, copy feedback) has an interaction test that fails when it breaks
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
with status partial.

FORBIDDEN
- Writing outside SCOPE, including tokens, generated files, the barrel,
  registry.json, the migration map, check scripts, the allowlist and baselines
- Changing call sites outside your examples and tests
- New dependencies
- New colors, fonts, shadows or motion
- Examples that send a request on mount, charge money or delete anything
- Editing a test, fixture or check so it passes
- Writing a report file anywhere. The report is your final message
- Starting a dev server, browser or container the brief does not name
- Starting agents of your own. Do the reading and the work yourself
- Forcing a numeric target that reads wrong on a zoomed crop. Report it with
  the crop. Never nudge one instance to meet an alignment target; request a
  global offset from the one writer instead

REPORT
Return this block as your final message, as text. Write it to no file.
The coordinator saves it. Name any decision or gate you propose with your
family as prefix, such as D-button-01 or G-button-01. The coordinator
renumbers it into the run record.
Status: done, partial, blocked: <reason> or failed: <reason>
Commit: <sha> on <branch>
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
<paste the run's one standing-order list from run.md, word for word,
then this role's lines from Orders by role>
```

## The spec-worker variant

When only specs fan out (When to delegate), or a document-everything run specs components that already exist (`coordinator-path.md`), a spec worker takes one family. It writes each member's spec, its rule-tests file and its missing example files, and nothing else. The family template asks for code this worker must not touch, so use this variant. Keep every field.

```
GOAL
Write the spec for each of <Components in the family> at
docs/system/<component>.md, filled to spec-template.md from this app's evidence,
with its Usage rules by rule-method.md and its missing example files. The
components are done and are not yours to change. A defect you find goes in
your report, not in the code.

SCOPE
You may write: docs/system/<component>.md, docs/system/rule-tests/<component>.tsv,
<examples dir>/<component>/ for missing example files, and
.design-system/evidence/<component>/ for captures and measurements, and
.design-system/scripts/ for a probe script a spec cites as evidence.
One-off probes go in .design-system/tmp/<worker id>/, which is deleted at
close, so never cite a file there.
You may read anything in the repo. No git commands. The coordinator commits.
Dev server: http://localhost:<base port>. Do not start or restart it. If it
does not answer, return blocked: server down.
Browser session name: ds-spec-<n>. Absolute paths only.

CONTEXT
Component source and examples: <paths>
Props from the types: <paste the output of node <repo>/scripts/props-table.mjs <repo>/<source>>
Real uses: <paste call sites: file:line, screen, variant, state>
Traps for this family: <paste the rows from traps.md>
Gates and decisions that touch it, with defaults: <list, or "none">
Template and worked example: <paths to spec-template.md and spec-example-combobox.md>
Exemplar spec: <path to the first family's finished spec>. Match its headings,
rule shape and depth. The template is the fallback only when none exists
Rule method: <paths to rule-method.md, and writing-method.md with docs/system/writing.md when it exists>
Copy rows for these components: <paste their rows from docs/system/copy-inventory.tsv, or "none yet">
Foundation and base reference: <foundation from triage, and the base-*.md path>

ACCEPTANCE
- node <repo>/scripts/check-spec.mjs <repo>/docs/system/<component>.md exits 0, which includes
  spec/props-drift: every Variants axis and value, and every Props note, matches
  the component at HEAD
- Every States, Keyboard and ARIA row names how it was checked. "test" means a
  <component>.test.* file that fails when the behavior breaks (check-spec warns
  when none exists). "snapshot" points at a file in .design-system/evidence/<component>/.
  A missing test is a defect for the coordinator, not a file you write
- Contrast is measured in each theme with a command, and the ratio is written down
- Every answer names its source: a command, a file and line, a capture, or a gate
- Examples opens with "Real uses, <n> call sites", counted with
  rg -n "<Name\b" in the include folders outside the component's folder.
  check-spec fails the count, and any file:line you cite, once the code moves
- In prose, element names go in backticks (`<a>`), since check-spec reads a bare
  angle bracket as a template placeholder
- Every rule passed the tests in rule-method.md, or is a gate. The two-agent
  test runs for Anti-slop and Limits rules, with two fresh subagents given only
  the rule and one task from this app
- Every Limits rule cites a probe --grow result saved in the evidence folder

VERIFY
Run, and paste the last 20 lines and the exit code of each:
node <repo>/scripts/check-spec.mjs <repo>/docs/system/<component>.md
<one probe or capture command per state marked screenshot or snapshot. A state
needs capture.mjs --surfaces <tsv with a states column> --states <module>;
--routes captures the load state only>

TIMEBOX
<N> tool calls, sized from phase 4's cap in coordinator-path.md. At the limit, stop and report what you have,
with status partial.

FORBIDDEN
- Editing the component, its tests, tokens, barrel, registry, check
  scripts, the allowlist or any file outside SCOPE
- Git commands, and starting or stopping the dev server
- Copying an answer from the example
- Writing a report file anywhere. The report is your final message
- Starting a browser or container the brief does not name
- Starting agents of your own, apart from the two fresh agents each
  two-agent test needs

REPORT
Return this block as your final message, as text. Write it to no file.
Name any decision or gate you propose with your component as prefix, such
as D-combobox-01. The coordinator renumbers it into the run record.
Status: done, partial, blocked: <reason> or failed: <reason>
Files written:
Commands run and their results (pasted):
Rules: shipped, rewritten and gated, counted from rule-tests
Defects found in the component, each with its measurement and evidence path:
Requests for the coordinator:
Anything you decided that the brief did not cover:

STANDING
<paste the run's one standing-order list from run.md, word for word,
then this role's lines from Orders by role>
```

Review a spec report like a family report, minus the code steps: rerun `check-spec.mjs` yourself, open two evidence files the spec cites, and confirm the worker changed only files in its SCOPE. A defect it reports is the coordinator's to fix, as a decision when it is broken behavior, and the spec is rechecked at HEAD after the fix.

## Filling it in

- A field you cannot fill means the family is not ready to hand off. Fix that first, or keep the family.
- Paste inventory rows and token lists in full. A worker told "see the inventory" builds its own, differently.
- One family per brief. Two families mean two sets of files and a report nobody can grade in one pass.
- The standing orders go in every brief, including retries, because instructions only in the first message get lost when a worker restarts.
- Ask for a report under 300 words that leads with what the coordinator must act on: a shared-file change, a conflict with a decision, a failing command. The report is the final message itself, never a pointer to one.

## Orders by role

The standing orders in `run-record.md` bind every role. Paste this role's lines under them, in STANDING, and no other role's.

- Code worker (family, fix or surface): Examples use inert data, with no request on mount. Scripts a rerun needs go in .design-system/scripts/, committed; the check never reads .design-system/. What the team needs after the run (scripts, config, specs, generated docs) goes in the repo; on a minimal footprint nothing is vendored. An unexplained diff stays out of the commit and becomes a gate. The dev server follows coordinator-path.md (Dev server and retries); in a shared checkout start none and return `blocked: server down` when the brief's port does not answer. Browser commands use absolute paths and your own session name on every line. The brief's Person's calls are values the person set, each with its file; never normalize one to a pattern.
- Surface worker, on top of the code worker's lines: Swap a raw literal for a token of exactly the same value once pixdiff at tolerance 0 shows 0% on every width and theme capture of the route, or matching animation lists for a motion value. Merges inside tolerance and decided gate defaults land wherever they reach. Other changes land only on cleared surfaces. Each is one surface per commit, with before and after captures in .design-system/review/ and a traces.tsv row.
- Spec worker: Examples use inert data. Browser commands use absolute paths and your own session name on every line. The brief's Person's calls are values the person set; never normalize one to a pattern. A script that applies drafts takes an explicit list of your own files.
- Read-only worker: nothing added.

## Parallel workers in one checkout

When several workers edit neighboring files in one checkout, sometimes the same component file for different concerns (behavior, visual chrome, motion), save this shared brief as a file in `.design-system/briefs/` and start every task brief with "Read <path> fully and follow it".

```markdown
# Shared brief for every worker in this run

Version <n>, <date>. The coordinator rewrites a stale line in place and bumps this line. It never appends a correction.

Repo: <path>. The system lives in <component folder> (import <public path>), specs in
<docs folder>, the showcase at <dev url>/<showcase root>/<slug>. Before touching
anything, read the agent instructions, the writing page, the decisions log and the spec
of every component you work on.

## Other workers edit at the same time
- Re-read a file right before each edit, make small exact edits, and never rewrite an
  existing file whole. If an edit fails because the file changed, re-read and redo only
  your edit. Never revert or tidy a change you did not make.
- Stay inside the files your task names. Shared files (<token source>, <barrel>,
  <registry>, <showcase shell>, <fixtures file>) change only if your task says you own
  that part. Otherwise describe the change in your report.
- No git commands. The coordinator commits.
- Do not run the index generators or edit generated files.
- Scratch goes in .design-system/tmp/<your id>/ only.
- Browser: open your own tab and pass its id to every call. Never click the theme
  toggle, since it flips the theme for every worker. Set the theme on your tab's root.
- The machine is short of memory. Typecheck once near the end through the lock:
  <locked typecheck>. Tests only for your files, through their lock. Formatter from the
  repo root on your files only.

## House rules
<tokens only, the person's bans, the person's calls with their files, the icon rule,
prop naming, the spec format>

## Checks known to fail
<each failing check, and who owns its fix, or "none">. Report a new failure only.

## Final report, under 300 words
What you changed by file, what you found and did not fix and why, any shared-file change
you need, and the results of typecheck, tests, lint and formatter.
```

The task brief on top of it:

```
First read <shared brief path> fully and follow it.
Your job: <one sentence>.
You own: <exact file list or globs>. Others own <the neighboring concerns> in the same
files at the same time, so you change <your concern> only, such as only animation and
transition classes.
Also fix: <each known issue, with its file and the decision it must match>.
Leave: <the specimen, spec section or test the job must add>.
Run your tests, lint, formatter and the locked typecheck at the end, then report.
```

When several concerns share a file, the coordinator runs the tests of every touched file once all their workers return, since a failure mid-run may belong to another worker.

## Reviewing a report

Do not trust the report's summary. Check the work itself.

Open a worker's files only after its final message returns, since it may still be rewriting them.

1. Status and fields. A report missing commands, output or a commit gets one rerun. A second miss is logged as a gap, not a pass.
2. Scope. List the files changed on the branch. Any file outside SCOPE rejects the whole report. Send it back with the path named.
3. Verify. Rerun the VERIFY commands yourself on the worker's branch. Your output is the result that counts.
4. Screenshots. Open the example screenshots for each variant and state, in each theme, beside the baselines of the replaced implementations at the same size.
5. Contract. Walk `component-contract.md` against the code. For accessibility and API shape, which need judgment, use a second reviewer that did not write the code, a different model when one is available, given only the diff, the brief and the contract.
6. Requests. The one writer of each file applies accepted token, barrel and registry changes, one change per family, after the family merges.
7. Record. Save the worker's status line and file list to `.design-system/returns/<family>.<attempt>.md`. Renumber its proposed decisions and gates into the run record (`run-record.md`, Rules), and add a ledger row. Anything that ran on a different commit from the one merging is not verified.

## Retries and dropouts

- A failed, timed-out or lost worker gets the one retry in `coordinator-path.md` (Dev server and retries), with the failing output pasted into CONTEXT. A split sends the component first, then examples and docs.
- A worker that never reports gets a ledger row saying so. Do not quietly redo its work without that row.
- Judge a worker by its commits and its report. Past its TIMEBOX with no new commit, treat it as lost.
- A running worker gets a message only to amend its brief, with the changed decision or the person's words pasted in full, or to `STOP` it, naming which of its own edits to revert. Never ask how it is going, because that restarts it or pulls it off the task. Record each message in the run record.
- A retry is a fresh brief with the failing output folded in, never a follow-up message to the old worker, because follow-ups get dropped on the next restart.

Two units failing on the same cause stop refills for that cause (`coordinator-path.md`, Dev server and retries).

## Running without subagents

Run the same briefs yourself, one family at a time, on one branch. Keep the scope rule anyway. During a family's turn, edit only its files, and apply shared-file changes at the end of the turn. The ledger rows and verdicts stay the same.
