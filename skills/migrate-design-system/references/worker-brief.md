# Worker brief

A worker starts with an empty context and cannot ask a question. Everything it needs is in the brief or at a path the brief names. A gap in the brief becomes a guess, and at twenty workers, twenty different guesses.

## Contents

- The template
- What goes in each field
- Refuse to spawn
- Filled example
- Report schema
- Briefs for other roles

## The template

```
SURFACE        <id from surfaces.tsv>, attempt <n>
OUTCOME        <one sentence a stranger could act on>
BASE           branch <name> from commit <sha>. Worktree <path>. Commit only here.
MAY EDIT       <globs>
MUST NOT EDIT  <globs>, plus everything in standing order 2
INPUTS         <paths to read first>
KEEP           <behavior that must not change, one per line>
DONE WHEN      <checkable lines>
RUN            <exact commands, in order>
SERVER         <shared dev server URL>. If it does not answer for <wait, default 60s>, start your own on
               port <base + worker n> and stop it before you return.
TIME LIMIT     <minutes>. At the limit, commit what you have, report partial, stop.
REPORT         return the schema below as your final message. Write it to no file.
STANDING ORDERS
<standing-orders.md, pasted in full>
```

## What goes in each field

**SURFACE.** The id and attempt number, so the report lands in the right file.

**OUTCOME.** What is true when the work is done, not the steps, such as "The invoices route renders only @acme/ui components and tokens, with no change in behavior."

**BASE.** The exact commit, not only a branch name, because a worker on a stale base passes checks the run branch would fail.

**MAY EDIT.** The surface's own paths from `surfaces.tsv`. Nothing shared.

**MUST NOT EDIT.** The shared layer, other surfaces' paths, baselines, tests, snapshots, harness config, the lever, the run folder, and the allowlists (`scripts/check-allowlist.json`, `allowlist.tsv`), which the coordinator owns because parallel edits make their counts drift. The verifier's forbidden-path check enforces this list, so the two must match.

**INPUTS.** Paths, not pasted text, for anything the worker can read locally: `mapping/<surface>.md`, `lever/RECIPE.md`, the system docs for each component the mapping names, and the pilot's landed diff as a worked example. On a retry, paste the previous report and the failing output in full, since those are what the retry acts on. Cloud workers that cannot read the run folder get every input pasted.

**KEEP.** The behavior that must survive, as checkable lines: which requests fire and when, validation timing, focus movement, keyboard paths, URLs, what persists, and what the user sees on failure. Take them from the surface's tests, its code and the baseline accessibility snapshot. "Preserve behavior" does not count.

**DONE WHEN.** Lines the worker can check itself: its paths' inventory count is zero, its checks pass, its captures exist.

**RUN.** The exact commands: the codemod call, the inventory check scoped to the surface, type check, lint, the surface's tests, and the capture command. Write every path absolute and pass the inventory script `--run <absolute run folder>`, so each command works from any folder. `capture.mjs --routes` captures the load state only, so a surface with listed states needs `--surfaces` with a one-row file the coordinator writes into `briefs/`, plus `--states`. Add known traps, such as "wait for the table's role, not a fixed delay."

**SERVER.** The coordinator keeps the shared dev server up until every worker has returned. The wait before a fallback defaults to 60 seconds, long enough to ride out a restart. The fallback port is the base port plus the worker's number, so two fallbacks never collide. A worker that started its own server stops it before returning and says so under Deviations.

**TIME LIMIT.** By default the pilot's runtime plus half, so a typical surface finishes with margin. A worker that hits it reports what it has.

**REPORT.** The schema, returned as text in the final message and nowhere else. Never ask a worker to write a report file, because many hosts refuse it and each refusal costs a retry. The worker's folder, `inbox/<surface>.<n>.captures/`, holds captures and `.probe.json` files only. A brief line that asks for a report file, or points a worker at a coordinator-only file such as `inbox/<surface>.<n>.md` or anything in `verdicts/`, is a brief defect.

A decision or gate the worker proposes carries its surface as prefix, such as `G-billing-invoices-01`, since two workers both reach for `-01`. The coordinator renumbers it to the next free `D-NN` or `G-NN` and keeps the worker's ID beside it.

**STANDING ORDERS.** The whole file, pasted, never summarized, since a summary drops the line that mattered.

Size the brief to the surface. When the codemod does everything and one command proves it, a short paragraph will do, as long as it names the outcome, scope, command, server and report schema.

## Refuse to spawn

If any field is empty or reads "TBD", the surface is not ready. Do not spawn it.

| Empty field | Usually means | Do this |
|---|---|---|
| MAY EDIT | The surface shares files with another | Merge the two surfaces, or move the file to the shared layer |
| INPUTS has no mapping file | Mapping has unresolved rows | Wait for the gate, or brief only the resolved part |
| KEEP | Nobody knows what the surface does | Run a read-only pass that writes the behavior list first |
| RUN has no capture command | The baseline for this surface is missing | Capture the baseline before briefing |
| BASE | The shared layer has not landed | Wait |

## Filled example

```
SURFACE        billing-invoices, attempt 1
OUTCOME        The invoices route renders only @acme/ui components and tokens,
               with no change in behavior. Accessibility-tree changes only add semantics.
BASE           branch migrate/billing-invoices from commit a91c04e2d7b0.
               Worktree ../app-wt/billing-invoices. Commit only here.
MAY EDIT       app/billing/invoices/**
MUST NOT EDIT  app/billing/layout.tsx, app/billing/export/**,
               plus everything in standing order 2
INPUTS         /repo/.migration/q3/mapping/billing-invoices.md
               /repo/.migration/q3/lever/RECIPE.md
               node_modules/@acme/ui/docs/{table,badge,button,empty-state}.md
               git show 4c1d0e7 (pilot: settings-notifications, landed)
KEEP           Page loads invoices with one GET /api/invoices?page=1.
               "Load more" sends one request per click and appends rows. Focus stays on the button.
               Status badge text stays "Paid", "Due", "Overdue". Color is not the only signal.
               Row click navigates to /billing/invoices/<id>. Cmd-click opens a new tab.
               Empty state shows when the list is empty, with the "Create invoice" link.
               Error state shows "Couldn't load invoices" and a Retry button that refetches page 1.
DONE WHEN      node /repo/scripts/migration-inventory.mjs --run /repo/.migration/q3 --paths "app/billing/invoices/**" prints 0 0 0 0
               npm run typecheck, npm run lint, npm test -- invoices all pass
               captures exist for empty, list, error, loading at both widths, light and dark
RUN            node /repo/.migration/q3/lever/codemod.mjs "app/billing/invoices/**"
               (finish by hand what the codemod left, per the mapping file)
               node /repo/scripts/migration-inventory.mjs --run /repo/.migration/q3 --paths "app/billing/invoices/**"
               npm run typecheck && npm run lint && npm test -- invoices
               node /repo/.agents/skills/build-design-system/scripts/capture.mjs --base http://localhost:3100 --kind after --out /repo/.migration/q3/inbox/billing-invoices.1.captures --surfaces /repo/.migration/q3/briefs/billing-invoices.surfaces.tsv --states /repo/.design-system/scripts/states.mjs
               Trap: the list state needs the fixture user "ada@example.test". Wait for role=table, not a timeout.
SERVER         http://localhost:3100. If it does not answer for 60s, start your own on
               port 3107 (3100 + worker 7) and stop it before you return.
TIME LIMIT     45 minutes. At the limit, commit what you have, report partial, stop.
REPORT         return the schema below as your final message. Write it to no file.
STANDING ORDERS
0. (empty)
1. Target is @acme/ui 4.2.0. Import only from "@acme/ui". ...
```

The worker's captures and probe files go to the path in RUN. The verifier treats them as a hint and recaptures from the commit into `captures/`.

## Report schema

The worker returns this as its final message, never as a file. The coordinator parses it, so keep the headings.

```markdown
# <surface> attempt <n>

Status: done | partial | blocked | failed
Branch: <name>   Head: <full sha>
Base: <sha the work started from>

## Inventory for my paths
Before: <imports> <raw values> <palette uses> <legacy files>
After:  <imports> <raw values> <palette uses> <legacy files>

## Commands run
<each command, its exit code, and the last lines of its output, from this session. No output means not run. A claim that something passes without its command here counts as not run.>

## Files changed
<path per line, from git diff --name-only BASE..HEAD>

## Captures
<path, or "none" with the reason>

## Behavior delta
<per state in the surface's states column, what differs from the baseline probe: a control enabled or disabled, text shown, requests fired, contrast of recolored text with both ratios. "None" only with the probe command. The verifier reruns it.>

## Accessibility tree
<each changed line, marked adds-only (a decision) or removes, renames or restructures (a gate)>

## Allowlist shrink candidates
<file, rule and the lower count the check now allows, from `check-system --json` "shrink". "None" is allowed. The coordinator shrinks the list after landing.>

## Shared gaps
<a token, component, prop or shared file the surface needed, with file:line. "None" is allowed.>

## Deviations from the brief
<anything done differently and why. "None" is allowed.>

## Questions for a person
<product or behavior questions. Each one names the file:line and what the options are.>

## Follow-ups outside my scope
<one line each>
```

A report missing Commands run, or whose Files changed include a path outside MAY EDIT, fails at the drain without going to a verifier.

## Briefs for other roles

The shared-layer owner, lever builder and mapper use the same template, with their own files in MAY EDIT and their phase's exit condition from `SKILL.md` in DONE WHEN. The verifier brief is in `references/verification.md`.
