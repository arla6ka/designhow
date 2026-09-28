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
- close.md
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
  close.md                    coordinator at Close, the one source of every count in the final message
  inventory/                  the inventory script
  mapping/<surface>.md        the token-mapping run for that surface
  baselines/                  the baseline agent during Baselines, read only afterward
  baselines/traps.tsv         the same agent, every trap's before number, measured before any edit
  lever/                      the lever builder during Build the lever, read only afterward
  briefs/<surface>.<n>.md     coordinator
  inbox/<surface>.<n>.md      coordinator, attempt n's status line and file list
  inbox/<surface>.<n>.captures/  the same worker: captures and probe output, no report
  verdicts/<surface>.<sha>.md coordinator, the verdict's status lines and file list
  captures/<surface>/<sha>/   the verifier for that commit: captures, probes, behavior evidence
```

`<n>` is the attempt number, starting at 1. `<sha>` is the first 12 characters of the commit the verdict covers.

Scratch files from any agent, such as probe scripts, one-off captures and logs, go in `.design-system/tmp/`, never in the repo root, `scripts/` or this folder. The coordinator adds it and `.design-system/review/**/*.png` to `.gitignore` in Frame, and deletes it at Close. The rest of `review/`, traces.tsv and index.html included, is tracked. After that, `git status --porcelain` lists no untracked path, or each one it lists has a `decisions.tsv` row saying why it stays.

## Why one writer per file

Two agents appending to one file will eventually interleave or overwrite, and nothing warns you when they do. A rule in the brief asking them to take turns does not prevent it. So every file above has exactly one writer. Workers and verifiers each publish their own file, and the coordinator reads those files and folds them into its tables at drain time. A worker that needs something changed in a shared file says so in its report.

The same rule covers the repo. The shared layer has one owner during its phase and none afterward. Each surface's files have one worker at a time. `references/inventory.md` shows the check that fails a diff reaching outside its scope.

## frame.md

Written once in Frame. It changes only through a logged decision.

```markdown
# Frame: billing-app to acme-ui 4.2

Done when:
- `node scripts/migration-inventory.mjs --check` exits 0 on the final commit
  (legacy imports 0, raw values outside allowlist 0, palette uses 0 when frame.md includes them, legacy files 0)
- all 38 rows in surfaces.tsv are `landed` with a `verified` ledger row at the final commit
- `lint:legacy` runs in CI at error level

Scope: every route under app/(product)/. Out: app/admin/ (separate team).
Target system: @acme/ui 4.2.0, commit 7f3c2e19ab04
Parity mode: mapped
Budget: 16 hours wall clock. Stop spawning at 11 hours.
Window cap: 8
Run branch: ds/2026-03-12-migrate, from main at 3e1f0a2. Merging into main is the person's call.
May look broken mid-run: /settings/* until settings-shell lands
Platform: subagents with worktree isolation
```

## standing-orders.md

Numbered lines, one rule each. The coordinator pastes the whole file into every brief and every respawn, because an instruction given once in chat fades after a few turns. When the coordinator notices it is repeating an instruction, it adds a line here first. Line 0 is reserved for a stop order.

```markdown
0. (empty; write STOP: <reason> here to halt all spawning)
1. Target is @acme/ui 4.2.0. Import only from "@acme/ui". Never from "@acme/ui/src".
2. Do not edit: packages/ui/**, app/globals.css, app/providers.tsx, package.json, lockfiles, .migration/**, tests/visual/**, **/__snapshots__/**, playwright.config.ts. On shadcn, also components.json and components/ui/**, and never run shadcn add.
3. Never add a color, font size, radius, shadow or spacing value. Use the token the mapping file names.
4. A gap goes in your report under Shared gaps. Do not work around it.
5. Behavior stays the same. Same requests, same validation timing, same focus order, same URLs.
6. Run the checks in your brief and paste their real output. A claim without output counts as not run.
7. Do not rebase, force-push, or merge. Commit to your own branch only.
8. Scratch files go in .design-system/tmp/. Nothing scratch goes in the repo root, scripts/ or .migration/.
```

## surfaces.tsv

One row per surface, updated in place. Tab separated.

```
surface	kind	paths	states	depends_on	state	attempt	branch	head	brief	last_report	note
shared	shared	packages/ui-bridge/**	-	-	landed	1	migrate/shared	a91c04e2d7b0	briefs/shared.1.md	inbox/shared.1.md	-
billing-invoices	route	app/(product)/billing/invoices/**	empty,list,error,loading	shared	in-flight	2	migrate/billing-invoices	-	briefs/billing-invoices.2.md	inbox/billing-invoices.1.md	retry: timeout, split out export modal
settings-profile	route	app/(product)/settings/profile/**	default,invalid,saving,saved	shared	gated	0	-	-	-	-	G-04
```

States, in order: `queued`, `gated`, `ready`, `in-flight`, `reported`, `verifying`, `verified`, `landed`. Side exits are `failed` (gets a fix attempt), `abandoned` (after two retries, with a reason), and `deferred` (out of scope by decision). Only the coordinator moves a row, and only at a drain.

The montage reads `.design-system/review/surfaces.tsv`. The coordinator writes it from this file's `surface`, the route and `states` columns at Frame, and keeps it in step at each drain.

## Worker reports in inbox/

Each worker returns its report as its final message (schema in `references/worker-brief.md`). The coordinator reads it once and saves only the `Status:` line, `Branch:`/`Head:`, and the Files changed list to `inbox/<surface>.<n>.md`, never the whole text. A worker writes no report file. Its folder, `inbox/<surface>.<n>.captures/`, holds captures and `.probe.json` files only. No brief asks for `report.md`, and none points a worker's REPORT at a coordinator-only file. A report counts as drained once its path appears in the `last_report` column. The coordinator never deletes or edits a report. When a worker dies with no report, the coordinator writes `inbox/<surface>.<n>.lost.md` with the last side effect it could see.

## Verdict files and ledger.tsv

The verifier returns its verdict as its final message and writes no verdict file (format in `references/verification.md`). Its folder, `captures/<surface>/<sha>/`, holds captures, probe files and behavior evidence. The coordinator saves the `Verdict:` and `Verifier:` lines, the behavior delta line and the file list as `verdicts/<surface>.<sha>.md`. At each drain the coordinator appends one ledger row per new verdict file.

```
when	surface	commit	verdict	visual	a11y	behavior	delta	review	verifier	evidence
2026-03-12T14:02Z	billing-invoices	5be1c0a93f21	verified	mapped 0 unexplained	adds only (D-07)	6/6	Paid badge 7.1 to 4.9:1	0 blocking	model-b	verdicts/billing-invoices.5be1c0a93f21.md
2026-03-12T14:40Z	integration	c03d9e7a1b55	checks-only	-	-	build,types,lint,routes 200	-	-	worker	inventory/counts.txt
2026-03-12T15:10Z	billing-invoices	d41e07c2a9b3	reopened	-	-	-	-	-	coordinator	commit d41e07c touched app/(product)/billing/invoices/page.tsx
```

A new commit that touches a surface's `paths` voids its earlier rows and gets a `reopened` row. The `verifier` column names the agent, never the worker that wrote the commit, or `coordinator` for a `self-verified` row. The ledger answers "was this verified" at a given commit. The chat history does not.

## close.md

Before it is written, `node scripts/check-spec.mjs <spec folder>` runs over the system's specs, and a spec that cites a file the run deleted or moved (`spec/stale-cite`) is refreshed in its own commit. Then close.md is written once, at the final integration commit, from `node scripts/migration-inventory.mjs --check` and a tally of `ledger.tsv` and `surfaces.tsv`. Every count in the final message comes from this file and no other: inventory before and after, allowlisted rows, what is left, surfaces landed of total, verified by an independent agent, self-verified. It lists each montage warning on an open gate, with the gate id, and names each surface and file still carrying raw values or legacy imports, so the message never says "every screen" while that list has a row. A surface that landed but still reads `queued` or `in-flight` in `surfaces.tsv` fails the close. So does a failed close commit, which the message reports first.

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

One entry per question that needs a person. Write the gate before asking, and keep working around it. IDs are `G-NN`, the form the montage and the Next prompt read. A worker's proposed gate arrives as `G-<surface>-01`, and the coordinator renumbers it to the next free `G-NN` here, with the worker's ID in the entry.

```markdown
## G-04. settings-profile uses a date input the system lacks
Opened: 2026-03-12T11:20Z. Asked: system owner.
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
2026-03-12T10:05Z	pilot	split billing-invoices export modal into its own surface	worker hit the time limit twice on modal states	inbox/billing-invoices.1.md	new row billing-export
2026-03-12T12:30Z	sweep	added Tooltip wrapper rename to codemod	5 of 7 failures were the same missing rename	lever/codemod.mjs@3e1a	reran 7, 6 verified
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
  awk '/^## G-/{h=substr($0,4)} /^Answer:[[:space:]]*$/{print "- " h}' gates.md
  echo; echo "## Inventory"
  cat inventory/counts.txt
} > status.md
```

## RESUME.md

Written when the run pauses, and read first on resume. It states what the run was doing, which rows were in flight with their branches, what is verified, the first action to take, and anything surprising. It points at the tables instead of copying them.

## Where the folder lives

Keep `.migration/<run>/` in the main checkout, where the coordinator runs. Workers write only code on their branch and captures at the path in their brief. The coordinator saves the status lines and file list of every worker's and verifier's final message to `inbox/` or `verdicts/`, and is those files' writer. This holds for local and cloud workers alike. Whether to commit the folder is the team's call. Most teams add it at close as the record of the run. Under design-system-boss the run commits it, except on a minimal footprint.
