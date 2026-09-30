# Run folder

A new coordinator resumes from these files alone, so write each fact here before acting on it.

## Layout and writers

```
.migration/<run>/
  frame.md                    coordinator
  standing-orders.md          coordinator
  queue.tsv                   coordinator
  allowlist.tsv               coordinator, only after a gate that no longer reads `gate`, or a logged decision
  forbidden-paths.txt         coordinator, matches the do-not-edit standing order
  agents.tsv                  coordinator
  gates.md                    coordinator
  decisions.tsv               coordinator, append only
  ledger.tsv                  coordinator, copied from verdict files at each drain
  status.md                   the status script, never edited by hand
  RESUME.md                   coordinator, on pause
  plan.md                     coordinator, audit mode only
  close.md                    coordinator at Close, the one source of every count in the final message
  found-not-fixed.tsv         coordinator, found-not-fixed rows past the 30 that plan.md or the handoff shows
  inventory/                  the inventory script
  mapping/<surface>.md        the token-mapping run for that surface
  parity.tsv                  the parity agent during Parity, the coordinator afterward
  baselines/                  the baseline agent during Baselines, read only afterward
  baselines/traps.tsv         the same agent, every trap's before number, measured before any edit
  codemod/                    the codemod builder during Build the codemod, read only afterward
  briefs/<surface>.<n>.md     coordinator
  inbox/<surface>.<n>.md      coordinator, attempt n's status line and file list
  inbox/<surface>.<n>.captures/  the same worker: captures and probe output, no report
  verdicts/<surface>.<sha>.md coordinator, the verdict's status lines and file list
  captures/<surface>/<sha>/   the verifier for that commit: captures, probes, behavior evidence
```

`<n>` is the attempt number, starting at 1. `<sha>` is the first 12 characters of the commit the verdict covers.

One-off files from any agent, such as probe scripts, one-off captures and logs, go in `.design-system/tmp/<agent id>/`, never in the repo root, `scripts/` or this folder. Scripts a rerun or the check needs, such as the states module, go in `.design-system/scripts/` and are committed. The coordinator adds `.design-system/tmp/` and `.design-system/review/**/*.png` to `.gitignore` in Frame and deletes `tmp/` at Close. The rest of `review/` is tracked. After Close, `git status --porcelain` lists no untracked path without a `decisions.tsv` row saying why it stays.

## Why one writer per file

Two agents appending to one file will eventually interleave or overwrite, with no warning, and a brief asking them to take turns does not prevent it. So every file above has one writer. Workers and verifiers return their results, and the coordinator folds them into its tables at drain time. A worker that needs a shared file changed says so in its report.

The same rule covers the repo. The shared layer has one owner during its phase and none afterward, and each surface's files have one worker at a time. `references/inventory.md` has the scope check that enforces it.

## frame.md

Written once in Frame. It changes only through a logged decision. A dirty checkout, or a branch someone else is working on, stops the run with a question to the person before this file exists. The run never stashes (`build-design-system/references/coordinator-path.md`, Start).

```markdown
# Frame: billing-app to acme-ui 4.2

Done when:
- `node scripts/migration-inventory.mjs --check` exits 0 on the final commit
  (legacy imports 0, raw values outside allowlist 0, palette uses 0 when frame.md includes them, legacy files 0)
- all 38 rows in queue.tsv are `done` with a `verified` ledger row at the final commit
- `lint:legacy` runs in CI at error level

Scope: every route under app/. Out: app/admin/ (separate team).
Target system: @acme/ui 4.2.0, commit 7f3c2e19ab04
Parity mode: mapped
Widths: 390, 1280. Themes: light, dark
Budget: 16 hours wall clock. Stop spawning at 11 hours.
Window cap: 2 (the machine budget's browser row, recorded as D-02)
Run branch: ds/2026-03-12-migrate, from main at 3e1f0a2. Merging into main is the person's call.
May look broken mid-run: /settings/* until settings-shell lands
Platform: subagents with worktree isolation
```

## standing-orders.md

The file holds, word for word, the numbered standing orders in `build-design-system/references/run-record.md`, then the lines below as bullets, then any the project instructions (AGENTS.md, CLAUDE.md) add. To halt all spawning, the coordinator writes `STOP: <reason>` as the file's first line. It pastes the whole file into every brief and respawn. Add these to the standing orders in run-record.md:

```markdown
- Target is @acme/ui 4.2.0. Import only from "@acme/ui". Never from "@acme/ui/src".
- Do not edit: packages/ui/**, app/globals.css, app/providers.tsx, package.json, lockfiles, .migration/**, tests/visual/**, **/__snapshots__/**, the visual test config, and the files the foundation's base reference marks single-writer. Never run the system's add or generate command.
- Never add a color, font size, radius, shadow or spacing value. Use the token the mapping file names.
- A gap goes in your report under Shared gaps. Do not work around it.
- Behavior stays the same. Same requests, same validation timing, same focus order, same URLs.
- Do not rebase.
```

## queue.tsv

One row per surface, tab separated, updated in place.

```
surface	kind	paths	states	depends_on	status	stage	attempt	branch	head	brief	last_report	note
shared	shared	packages/ui-bridge/**	-	-	done	landed	1	migrate/shared	a91c04e2d7b0	briefs/shared.1.md	inbox/shared.1.md	-
billing-invoices	route	app/billing/invoices/**	empty,list,error,loading	shared	doing	in-flight	2	migrate/billing-invoices	-	briefs/billing-invoices.2.md	inbox/billing-invoices.1.md	retry: timeout, split out export modal
settings-profile	route	app/settings/profile/**	default,invalid,saving,saved	shared	gate	-	0	-	-	-	-	G-04
```

`status` uses the words in `build-design-system/references/run-record.md` (Terms, Status): `todo`, `doing`, `done` (landed), `gate` (waits on a gate), `blocked (<reason>)` (the retry failed and the surface could not split) and `skipped (<reason>)` (out of scope by decision). `stage` tracks a `todo` or `doing` row through the pipeline: `queued`, `ready`, `in-flight`, `reported`, `verifying`, `verified`, then `landed` once `done`. A failed attempt stays `doing` at stage `failed` until its one retry. Only the coordinator moves a row, and only at a drain.

This is the migration's work queue, a different file from `.design-system/review/surfaces.tsv` (`build-design-system/references/run-record.md`, Terms), which capture and the montage read. The coordinator writes that file's `surface`, `route` and `states` columns from this one at Frame and keeps them in step at each drain. For one surface's capture, the worker copies that row under the header to `.design-system/tmp/<worker id>/<surface>.surfaces.tsv`.

## Worker reports in inbox/

Each worker returns its report as its final message (schema in `references/worker-brief.md`) and writes no report file. The coordinator reads it once and saves only the `Status:` and `Commit:` lines, `Branch:` and the Files changed list to `inbox/<surface>.<n>.md`. The worker's folder, `inbox/<surface>.<n>.captures/`, holds captures and `.probe.json` files only. A report counts as drained once its path appears in the `last_report` column, and the coordinator never edits or deletes one. When a worker dies with no report, the coordinator writes `inbox/<surface>.<n>.lost.md` with the last side effect it could see.

## Verdict files and ledger.tsv

The verifier returns its verdict as its final message (format in `references/verification.md`) and writes only to `captures/<surface>/<sha>/`. The coordinator saves the `Verdict:`, `Verifier:` and behavior delta lines and the file list as `verdicts/<surface>.<sha>.md`, and appends one ledger row per new verdict file at each drain.

```
when	surface	commit	verdict	visual	a11y	behavior	delta	review	verifier	evidence
2026-03-12T14:02Z	billing-invoices	5be1c0a93f21	verified	mapped 0 unexplained	adds only (D-07)	6/6	Paid badge 7.1 to 4.9:1	0 blocking	model-b	verdicts/billing-invoices.5be1c0a93f21.md
2026-03-12T14:40Z	integration	c03d9e7a1b55	checks-only	-	-	build,types,lint,routes 200	-	-	worker	inventory/counts.txt
2026-03-12T15:10Z	billing-invoices	d41e07c2a9b3	reopened	-	-	-	-	-	coordinator	commit d41e07c touched app/billing/invoices/page.tsx
```

A new commit that touches a surface's `paths` voids its earlier rows and gets a `reopened` row. The `verifier` column names the verifying agent, never the worker, or `coordinator` for a `self-verified` row. The ledger, not the chat history, answers "was this verified" at a given commit.

## close.md

First, `node scripts/check-spec.mjs <spec folder>` runs over the system's specs with freshness on, and a spec that cites a file the run deleted or moved (`spec/stale-cite`) is refreshed in its own commit. Then close.md is written once, at the final integration commit, from `node scripts/migration-inventory.mjs --check` and a tally of `ledger.tsv` and `queue.tsv`. Every count in the final message comes from this file: inventory before and after, allowlisted rows, what is left, surfaces landed of total, verified by an independent agent, self-verified. It lists each montage warning on an open gate with its id. A landed surface whose row is not `done` fails the close. So does a failed close commit, which the message reports first. No gate reads `todo`: each landed, or reads `skipped (<reason>)`. `node <skills>/build-design-system/scripts/check-record.mjs` exits 0 on the run folder's tables.

It ends with the Found, not fixed table in the format of `build-design-system/references/run-record.md` (Handoff report): one row per surface still carrying raw values or legacy imports, per surface left `blocked`, `gate` or `skipped`, and per verifier finding left unfixed, so the message never says "every screen" while the table has a row. Rows past 30 go to `found-not-fixed.tsv`.

The final message is the handoff in `build-design-system/references/run-record.md` (Handoff report), with these additions:

- Part 1 carries `Verified: N of M by an independent agent`, the self-verified surfaces on their own line, every non-empty behavior delta, and the montage path.
- Next adds the budget for surfaces left, such as `Merge ds/2026-03-12-migrate, but keep the blue Sign in button (reverse G-04). 2 hours finishes the 3 surfaces left.` If the close commit failed, Next starts with "First commit the run record (`git add .migration .design-system && git commit`), then merge."
- In audit mode the result is `plan.md` (`references/inventory.md`), summarized in the same parts. Next offers full mode with its size, such as `To migrate the 31 surfaces (7 families, about 6 hours), reply "Go, 6h".`

```
commit        8a41c2e07f93
inventory     before 14 raw, 3 legacy imports, 2 legacy files   after 0 raw, 0, 0
allowlisted   1 (height 200, reports chart, allowlist.tsv:4)
left          none
surfaces      7 landed of 7 (shared top bar unchanged, by decision D-09)
verified      7 of 7 by an independent agent; self-verified: none
still raw     none
close commit  ok
```

## gates.md

One entry per question that needs a person, written before asking, with work routed around it. Each entry's first line after the heading carries the gate record's columns (ID, question, default, status, commit, from), with status `gate`, `todo`, `default (unanswered)`, `done` or `skipped (<reason>)` as `build-design-system/references/run-record.md` (Terms, Gate) defines them. A gate nobody answers takes its default and never holds the run. IDs are `G-NN`, the form the montage and the Next prompt read. A worker's proposed `G-<surface>-01` gets the next free `G-NN`, and `From` keeps the worker's ID.

```markdown
## G-04. settings-profile uses a date input the system lacks
Default: B. Status: gate. Commit: -. From: w-12 (G-settings-profile-01).
Opened: 2026-03-12T11:20Z. Asked: system owner.
Blocks: settings-profile, settings-billing-address. Everything else continues.
Options:
  A. Owner adds DateField to @acme/ui. Surfaces wait for it.
  B. Keep the legacy DatePicker on these two surfaces, allowlisted with a removal date.
Default if no answer by close: B, with both surfaces reported as not migrated.
```

## decisions.tsv

Append only. To correct an entry, add a row that replaces it.

```
when	phase	what	because	evidence	outcome
2026-03-12T10:05Z	pilot	split billing-invoices export modal into its own surface	worker hit the time limit twice on modal states	inbox/billing-invoices.1.md	new row billing-export
2026-03-12T12:30Z	sweep	added Tooltip wrapper rename to codemod	5 of 7 failures were the same missing rename	codemod/codemod.mjs@3e1a	reran 7, 6 verified
```

## agents.tsv

Every spawn gets a row at spawn time and a terminal state at close, which proves nothing went missing.

```
id	role	surface	attempt	spawned	expect_by	last_side_effect	end
w-17	worker	billing-invoices	2	13:05	14:05	commit 5be1c0a 13:48	done
v-09	verifier	billing-invoices	1	13:50	14:20	verdicts/billing-invoices.5be1c0a93f21.md	done
w-12	worker	billing-invoices	1	11:02	12:02	commit 1c9e0d2 11:40	blocked (lost)
```

`end` uses the status words: `done` for a `done` or `partial` return, with the return's word in parentheses when it was `partial`, `blocked (<reason>)` for `blocked`, `failed` or `lost` (a `.lost.md` was written), and `skipped (absorbed into <row>)`.

## status.md

Generated from `queue.tsv`, `ledger.tsv` and `gates.md` at every drain, never by hand:

```sh
{
  echo "# Status $(date -u +%FT%TZ)"
  echo; echo "## Surfaces by status"
  awk -F'\t' 'NR>1{c[$6]++} END{for(s in c) print "- " s ": " c[s]}' queue.tsv
  echo; echo "## Open gates"
  awk '/^## G-/{h=substr($0,4)} /Status: gate\./{print "- " h}' gates.md
  echo; echo "## Inventory"
  cat inventory/counts.txt
} > status.md
```

## RESUME.md

Written on pause and read first on resume. It states what the run was doing, which rows were in flight with their branches, what is verified, the first action, and anything surprising. It points at the tables instead of copying them.

## Where the folder lives

Keep `.migration/<run>/` in the main checkout, where the coordinator runs. Workers, local or cloud, write only code on their branch and captures at the path in their brief. The coordinator writes everything in `inbox/` and `verdicts/`. Whether to commit the folder is the team's call, and most teams add it at close as the run's record. Under design-system-boss the run commits it, except on a minimal footprint (`build-design-system/references/coordinator-path.md`, Minimal footprint).
