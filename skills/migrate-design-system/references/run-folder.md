# Run folder

The run folder is the only memory the run has. The coordinator's context will be compacted, restarted, or replaced, and the next coordinator resumes from these files alone. If a fact is not in a file, it did not happen.

## Contents

- Layout and writers
- Why one writer per file
- frame.md
- standing-orders.md
- surfaces.tsv
- Worker reports in inbox/
- Verdict files and ledger.tsv
- gates.md
- decisions.tsv
- agents.tsv
- status.md
- RESUME.md
- Where the folder lives

## Layout and writers

```
.migration/<run>/
  frame.md                    coordinator
  standing-orders.md          coordinator
  surfaces.tsv                coordinator
  allowlist.tsv               coordinator, only after a closed gate or a logged decision
  forbidden-paths.txt         coordinator, matches standing order 2
  agents.tsv                  coordinator
  gates.md                    coordinator
  decisions.tsv               coordinator, append only
  ledger.tsv                  coordinator, copied from verdict files at each drain
  status.md                   the status script, never edited by hand
  RESUME.md                   coordinator, on pause
  plan.md                     coordinator, audit mode only
  inventory/                  the inventory script
  mapping/<surface>.md        the token-mapping run for that surface
  baselines/                  the baseline agent during Baselines, read only afterward
  lever/                      the lever builder during Build the lever, read only afterward
  briefs/<surface>.<n>.md     coordinator
  inbox/<surface>.<n>.md      the worker for attempt n
  inbox/<surface>.<n>.captures/  the same worker
  verdicts/<surface>.<sha>.md the verifier for that commit
  captures/<surface>/<sha>/   the verifier for that commit
```

`<n>` is the attempt number, starting at 1. `<sha>` is the first 12 characters of the commit the verdict covers.

## Why one writer per file

Two agents appending to one file will eventually interleave or overwrite, and nothing warns you when they do. A rule in the brief asking them to take turns does not prevent it. So every file above has exactly one writer. Workers and verifiers each publish their own file, and the coordinator reads those files and folds them into its tables at drain time. A worker that needs something changed in a shared file says so in its report.

The same rule covers the repo. The shared layer has one owner during its phase and none afterward. Each surface's files have one worker at a time. `references/inventory.md` shows the check that fails a diff reaching outside its scope.

## frame.md

Written once in Frame. It changes only through a logged decision.

```markdown
# Frame: billing-app to acme-ui 4.2

Done when:
- `node scripts/migration-inventory.mjs --check` exits 0 on the final commit
  (legacy imports 0, raw values outside allowlist 0, legacy files 0)
- all 38 rows in surfaces.tsv are `landed` with a `verified` ledger row at the final commit
- `lint:legacy` runs in CI at error level

Scope: every route under app/(product)/. Out: app/admin/ (separate team).
Target system: @acme/ui 4.2.0, commit 7f3c2e19ab04
Parity mode: mapped
Budget: 16 hours wall clock. Stop spawning at 11 hours.
Window cap: 8
Migration branch: migrate/acme-ui
May look broken mid-run: /settings/* until settings-shell lands
Platform: Claude Code subagents with worktree isolation
```

## standing-orders.md

Numbered lines, one rule each. The coordinator pastes the whole file into every brief and every respawn, because an instruction given once in chat fades after a few turns. When the coordinator notices it is repeating an instruction, it adds a line here first. Line 0 is reserved for a stop order.

```markdown
0. (empty; write STOP: <reason> here to halt all spawning)
1. Target is @acme/ui 4.2.0. Import only from "@acme/ui". Never from "@acme/ui/src".
2. Do not edit: packages/ui/**, app/globals.css, app/providers.tsx, package.json, lockfiles, .migration/**, tests/visual/**, **/__snapshots__/**, playwright.config.ts.
3. Never add a color, font size, radius, shadow or spacing value. Use the token the mapping file names.
4. A gap goes in your report under Shared gaps. Do not work around it.
5. Behavior stays the same. Same requests, same validation timing, same focus order, same URLs.
6. Run the checks in your brief and paste their real output. A claim without output counts as not run.
7. Do not rebase, force-push, or merge. Commit to your own branch only.
```

## surfaces.tsv

One row per surface, updated in place. Tab separated.

```
surface	kind	paths	states	depends_on	state	attempt	branch	head	brief	last_report	note
shared	shared	packages/ui-bridge/**	-	-	landed	1	migrate/shared	a91c04e2d7b0	briefs/shared.1.md	inbox/shared.1.md	-
billing-invoices	route	app/(product)/billing/invoices/**	empty,list,error,loading	shared	in-flight	2	migrate/billing-invoices	-	briefs/billing-invoices.2.md	inbox/billing-invoices.1.md	retry: timeout, split out export modal
settings-profile	route	app/(product)/settings/profile/**	default,invalid,saving,saved	shared	gated	0	-	-	-	-	gate 4
```

States, in order: `queued`, `gated`, `ready`, `in-flight`, `reported`, `verifying`, `verified`, `landed`. Side exits are `failed` (gets a fix attempt), `abandoned` (after two retries, with a reason), and `deferred` (out of scope by decision). Only the coordinator moves a row, and only at a drain.

## Worker reports in inbox/

Each worker writes one file, `inbox/<surface>.<n>.md`, as its last act. The schema is in `references/worker-brief.md`. A report counts as drained once its path appears in the `last_report` column. The coordinator never deletes or edits a report. When a worker dies with no report, the coordinator writes `inbox/<surface>.<n>.lost.md` with the last side effect it could see.

## Verdict files and ledger.tsv

The verifier writes `verdicts/<surface>.<sha>.md` (format in `references/verification.md`). At each drain the coordinator appends one ledger row per new verdict file.

```
when	surface	commit	verdict	visual	a11y	behavior	review	verifier	evidence
2026-09-27T14:02Z	billing-invoices	5be1c0a93f21	verified	mapped 0 unexplained	match	6/6	0 blocking	model-b	verdicts/billing-invoices.5be1c0a93f21.md
2026-09-27T14:40Z	integration	c03d9e7a1b55	checks-only	-	-	build,types,lint	-	worker	inventory/counts.txt
```

A new commit on a surface voids its earlier rows. The ledger answers "was this verified" at a given commit. The chat history does not.

## gates.md

One entry per question that needs a person. Write the gate before asking, and keep working around it.

```markdown
## Gate 4. settings-profile uses a date input the system lacks
Opened: 2026-09-27T11:20Z. Asked: system owner.
Blocks: settings-profile, settings-billing-address. Everything else continues.
Options:
  A. Owner adds DateField to @acme/ui. Surfaces wait for it.
  B. Keep the legacy DatePicker on these two surfaces, allowlisted with a removal date.
Default if no answer by close: B, with both surfaces reported as not migrated.
Answer:
```

## decisions.tsv

Rows are only ever added. To correct a mistaken entry, add a row that replaces it and leave the old one in place.

```
when	phase	what	because	evidence	outcome
2026-09-27T10:05Z	pilot	split billing-invoices export modal into its own surface	worker hit the time limit twice on modal states	inbox/billing-invoices.1.md	new row billing-export
2026-09-27T12:30Z	sweep	added Tooltip wrapper rename to codemod	5 of 7 failures were the same missing rename	lever/codemod.mjs@3e1a	reran 7, 6 verified
```

## agents.tsv

Every spawn gets a row at spawn time and a terminal state at close. This is how the run proves nothing went missing.

```
id	role	surface	attempt	spawned	expect_by	last_side_effect	end
w-17	worker	billing-invoices	2	13:05	14:05	commit 5be1c0a 13:48	reported
v-09	verifier	billing-invoices	1	13:50	14:20	verdicts/billing-invoices.5be1c0a93f21.md	done
```

Terminal states are `reported`, `done`, `lost` (a `.lost.md` was written), `abandoned`, and `absorbed` (its scope moved to a named row).

## status.md

Generated from `surfaces.tsv`, `ledger.tsv`, and `gates.md` at every drain, and never written by hand. A short script is enough.

```sh
{
  echo "# Status $(date -u +%FT%TZ)"
  echo; echo "## Surfaces by state"
  awk -F'\t' 'NR>1{c[$6]++} END{for(s in c) print "- " s ": " c[s]}' surfaces.tsv
  echo; echo "## Open gates"
  awk '/^## Gate/{h=substr($0,4)} /^Answer:[[:space:]]*$/{print "- " h}' gates.md
  echo; echo "## Inventory"
  cat inventory/counts.txt
} > status.md
```

## RESUME.md

Written when the run pauses, and read first on resume. It states what the run was doing, which rows were in flight with their branches, what is verified, the first action to take, and anything surprising. It points at the tables instead of copying them.

## Where the folder lives

Keep `.migration/<run>/` in the main checkout, where the coordinator runs. Workers in worktrees write their report by absolute path. Cloud workers cannot reach it, so the coordinator saves their final message as the report file, and is that file's writer. Whether to commit the folder is the team's call. Most teams add it at close as the record of the run.
