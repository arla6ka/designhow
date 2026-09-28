# Worker brief

A worker starts with an empty context and cannot ask a question. Everything it needs is in the brief or reachable from a path in it. When a brief leaves something out, the worker guesses, and at twenty workers that turns into twenty different guesses.

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
TIME LIMIT     <minutes>. At the limit, commit what you have, report partial, stop.
REPORT         write <absolute path to .migration/<run>/inbox/<surface>.<n>.md> in the schema below
STANDING ORDERS
<standing-orders.md, pasted in full>
```

## What goes in each field

**SURFACE.** The id and the attempt number, so the report lands in the right file.

**OUTCOME.** What is true when the work is done, such as "The invoices route renders only @acme/ui components and tokens, with no change in behavior." It describes the result, not the steps.

**BASE.** The exact commit, not a branch name alone. A worker on a stale base passes checks that the migration branch would fail.

**MAY EDIT.** The surface's own paths from `surfaces.tsv`. Nothing shared.

**MUST NOT EDIT.** The shared layer, other surfaces' paths, baselines, tests, snapshots, harness config, the lever, and the run folder. The verifier's forbidden-path check enforces this list, so the list and the check must match.

**INPUTS.** Paths, not pasted text, for anything the worker can read locally. Include `mapping/<surface>.md`, `lever/RECIPE.md`, the system docs for each component the mapping names, and the pilot's landed diff as a worked example. On a retry, paste the previous report and the failing output in full, since those are the facts the retry exists to act on. Cloud workers that cannot read the local run folder get every input pasted.

**KEEP.** The behavior that must survive, written as checkable lines. Which requests fire and when, validation timing, focus movement, keyboard paths, URLs, what persists, and what the user sees on failure. Take them from the surface's tests, its current code, and the baseline accessibility snapshot. A generic line like "preserve behavior" does not count.

**DONE WHEN.** Lines the worker can check itself. The inventory count for its paths is zero. Its checks pass. Its captures exist at the named path.

**RUN.** The exact commands, including the codemod call, the inventory check scoped to the surface, type check, lint, the surface's tests, and the capture command. Add known traps, such as "wait for the invoice table's role, not a fixed delay."

**TIME LIMIT.** Long enough for the pilot's runtime plus half again. A worker that hits it reports what it has.

**REPORT.** The absolute path and the schema.

**STANDING ORDERS.** The whole file, pasted. Do not summarize it. A summary drops the line that mattered.

Size the brief to the surface. A surface where the codemod does everything and one command proves it can take a short paragraph. That paragraph still names the outcome, scope, command, and report path.

## Refuse to spawn

If any field is empty or reads "TBD", the surface is not ready. Do not spawn it. Common causes and fixes:

| Empty field | Usually means | Do this |
|---|---|---|
| MAY EDIT | The surface shares files with another | Merge the two surfaces, or move the file to the shared layer |
| INPUTS has no mapping file | Mapping has unresolved rows | Wait for the gate, or brief only the resolved part |
| KEEP | Nobody knows what the surface does | Run a read-only pass that writes the behavior list first |
| RUN has no capture command | The baseline for this surface is missing | Capture the baseline before briefing |
| BASE | The shared layer has not landed | Wait |

Never hand a worker a brief with a hole in it and trust it to cope. It will fill the hole with a guess and report success.

## Filled example

```
SURFACE        billing-invoices, attempt 1
OUTCOME        The invoices route renders only @acme/ui components and tokens,
               with no change in behavior or accessibility tree.
BASE           branch migrate/billing-invoices from commit a91c04e2d7b0.
               Worktree ../app-wt/billing-invoices. Commit only here.
MAY EDIT       app/(product)/billing/invoices/**
MUST NOT EDIT  app/(product)/billing/layout.tsx, app/(product)/billing/export/**,
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
DONE WHEN      node scripts/migration-inventory.mjs --paths "app/(product)/billing/invoices/**" prints 0 0 0
               npm run typecheck, npm run lint, npm test -- invoices all pass
               captures exist for empty, list, error, loading at 375 and 1280, light and dark
RUN            node /repo/.migration/q3/lever/codemod.mjs "app/(product)/billing/invoices/**"
               (finish by hand what the codemod left, per the mapping file)
               node scripts/migration-inventory.mjs --paths "app/(product)/billing/invoices/**"
               npm run typecheck && npm run lint && npm test -- invoices
               node scripts/capture-surface.mjs billing-invoices --out /repo/.migration/q3/inbox/billing-invoices.1.captures
               Trap: the list state needs the fixture user "ada@example.test". Wait for role=table, not a timeout.
TIME LIMIT     45 minutes. At the limit, commit what you have, report partial, stop.
REPORT         write /repo/.migration/q3/inbox/billing-invoices.1.md in the schema below
STANDING ORDERS
0. (empty)
1. Target is @acme/ui 4.2.0. Import only from "@acme/ui". ...
```

The worker's captures go next to its report, and the verifier treats them as a hint. It recaptures from the commit itself into `captures/`.

## Report schema

The worker writes this file last. The coordinator parses it, so keep the headings.

```markdown
# <surface> attempt <n>

Status: done | partial | blocked | failed
Branch: <name>   Head: <full sha>
Base: <sha the work started from>

## Inventory for my paths
Before: <imports> <raw values> <legacy files>
After:  <imports> <raw values> <legacy files>

## Commands run
<each command, its exit code, and the last lines of its output. No output means not run.>

## Files changed
<path per line, from git diff --name-only BASE..HEAD>

## Captures
<path, or "none" with the reason>

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

The shared-layer owner, lever builder, and mapper use the same template. Their MAY EDIT lists their own files, and their DONE WHEN names the exit condition of their phase in `SKILL.md`. The verifier brief is in `references/verification.md`.
