# Tests: migrate design system

## Setup under test

A result only means something next to the setup that produced it.

- `SKILL.md` and all six reference files, unedited or with your changes named
- Project instructions loaded: AGENTS.md, CLAUDE.md, or none
- Platform and how workers ran: subagents, agent team, cloud agents, or the script loop
- Foundation of the target system, and the browser that captured: agent-browser, Playwright or the repo's harness
- Coordinator model, worker model, verifier model
- The practice repo and its commit

Use a practice repo, never the real app, for these runs. A good one has 8 to 12 routes, a `legacy/` component folder, a small system package with tokens and about six components, a Playwright setup, and fixture data. Seed it with the traps each case needs. Keep it in git so every run starts from the same commit.

Five lab fixtures recur below. **messy-raw** is hand-rolled UI with no token file, hundreds of raw colors and several button implementations. **shadcn-drift** is shadcn with drifted ui files, a legacy modal and button, and palette classes in product code. **weak-system** has a `src/ui` layer with thin states that many screens skip. **greenfield** is an empty repo. **oss** is a 57-route open-source app the person does not own.

## Which cases apply

| Case | Applies | Reason |
|---|---|---|
| Normal | Yes | Every setup needs it |
| Vague request | Yes | People invoke it with one loose sentence and no paths |
| Called by a coordinator | When a router skill is installed | The caller reads only the final message |
| Right-size | Yes | A small app must not get the full machinery |
| Missing baseline | Yes | Without a reference, a verdict proves nothing |
| Shared-file conflict | Parallel runs only | Two workers editing one file is the most common way fan-out breaks |
| Worker edits a baseline | Yes | The cheapest way to pass a check is to change it |
| Tool failure mid-run | Yes | Browsers crash and agents vanish during long runs |
| Resume after crash | Yes | The coordinator will lose its context at some point |
| Ambiguous product call | Yes | A quiet product decision looks exactly like a finished migration |
| Audit mode | Yes | Audit mode must leave the repo untouched |
| Shared path on shadcn | shadcn targets | Old and new both import from `@/components/ui`, so paths cannot find legacy |
| From a harden handoff | After harden mode | The stray list is the starting inventory |
| Early audit beside a build | When a router skill is installed | The person must wake up to a plan even if the build eats the budget |
| Palette count | Tailwind apps | Palette classes must match token-mapping and triage |
| Worker without files or server | Parallel runs | Hosts block report files, and shared servers die |
| No worktree isolation | Hosts that isolate only one repo | Two workers in one checkout overwrite each other |
| Partial handoff | Yes | A red check at handoff is a failed run |
| Verifier independence | Yes | A coordinator grading its own work passes worse outcomes too |
| Decided defaults land on the branch | Yes | Next must be a merge, not a step the run could do |
| The rendered checklist catches three misses | Yes | A mapped pixel diff can explain away real regressions |
| Adds-only accessibility lands, restructuring waits | Yes | build, migrate and design-review split a11y changes the same way |
| One coordinator rule | Yes | The coordinator rule must read the same everywhere |
| Behavior delta discloses side effects | Yes | A side effect nobody listed must still reach the report |
| The close reads one file | Yes | Counts in the final message drifted from the files |
| Audit started before the tokens | When a router skill is installed | The audit's gates must follow the tokens the build decided |
| Identical swaps need no clearance | Yes | A 0% swap is safe on every route |
| Checks run from the repo | Yes | A check that reads a skill folder breaks on a clean clone |
| The run branch | Yes | Nothing may land on the person's branch |
| Adoption words are clearance | Yes | An adoption ask is the go-ahead |
| The final message says what changed | Yes | A person needs which screens changed, not the process |
| The run re-pins its own plan | When a router skill is installed | A stale pin must never reach the Next prompt |
| Scaffolding stays out of the counts | Repos after a build run | The system's own files are not legacy |
| Parallel writers after clearance | Under design-system-boss | Disjoint writers may overlap once cleared |
| The audit's inventory script lives in scripts/ | Audit mode | The edit run reuses the audit's script |
| Legacy agrees with the build's registry | After a build | A kept composition is not legacy |
| Trap before-numbers exist before any edit | Yes | The first edit erases the before state |
| Scratch stays in .design-system/tmp/ | Yes | Probe scripts must not land in commits |
| pixdiff runs from any folder | Yes | Workers call it from many folders |
| A decision row can't replace the verifier | Hosts with subagents | Budget left goes to verifiers |
| Self-verification on a host without subagents | Hosts without subagents | Every surface still owes a check |
| One commit per surface on a flat host | Flat hosts | Verdicts in one drain tempt one commit |
| A later commit reopens a verified surface | Yes | A verdict covers only its own commit |
| Returns stay short | Parallel runs | Full reports flood the coordinator's context |
| Runtime checks catch what tsc misses | Yes | A server and client break type-checks and answers 500 |
| Nav and columns at 390 gate | Yes | A phone nav hid Reports and Settings and nobody decided it |
| The coordinator owns the allowlist | Parallel runs | Parallel workers edited one allowlist, and its counts drifted from 39 to 31 |
| Nested coordinator blocks on workers | Under design-system-boss on a nested host | A migrate step agent handed back with 3 background workers live, and they were orphaned |

## Done means

- The inventory script's `--check` exits 0 on the final integration commit.
- Every surface is `landed` in its own commit with a `verified` ledger row at the final commit, or `self-verified` on a host without subagents, and no `reopened` row left open.
- The blocking lint rule fails CI on a planted violation.
- The baseline manifest matches, and no landed diff touched a forbidden path.
- Every spawned agent has a terminal row in `agents.tsv`.
- Every count in the final message matches `close.md`, and no landed surface reads `queued` or `in-flight` in `surfaces.tsv`.
- Left to a person: every open gate, merging the run branch into their branch, and deploying.

## Baseline

Run once with the skill off. Point the agent at the practice repo and say "Migrate this app to our design system in packages/ui. Use subagents to go faster." Record what happens before you trust any result below.

| Case | What the agent did with the skill off |
|---|---|
| Normal | |

Watch for work that starts before any inventory or screenshot exists, workers that edit shared files at the same time, a snapshot updated to make a test pass, a token or component invented to fill a gap, a claim of "done" with no count behind it, and a coordinator that starts writing code itself.

## Normal case

**Input:** the practice repo with 10 routes, parity mode `mapped`, a budget of 3 hours, a window cap of 4.

**Expect:** `frame.md` with a countable predicate. An inventory script, counts, and a lint rule that fails on a planted violation, all before any migration commit. Baselines with a manifest and a recorded noise floor. The shared layer lands alone. The pilot runs end to end, and the decisions log records at least one change to the brief template. A codemod diffed against the pilot. At most 4 workers in flight at once. Verdicts from a verifier on a different model. Close recaptures every surface at the final commit.

**Fails if:** any worker starts before baselines exist, the coordinator edits product code, a verdict is keyed to a branch commit at close, or the final report gives counts that do not match `close.md`.

## Vague request

**Input:** the practice repo with the system in `packages/ui` and a `registry.json`. Invoke the skill by name with only "launch subagents and move every screen onto the design system". No budget, no paths.

**Expect:** it finds `packages/ui` and the registry, pins their commit in `frame.md`, picks a pilot, asks for the budget once and states the session as the default. Inventory starts before any reply. The plan's Docs coverage section lists each component whose twin lacks the nine sections of `build-design-system/references/system-structure.md`.

**Fails if:** it stops to ask where the system lives, spawns an editing worker before `frame.md` states a budget, or names a component as documented when its twin is missing sections.

## Called by a coordinator

**Input:** `build-design-system` finishes on the practice repo, and a router skill starts this one in audit mode with only the path to `.design-system/run.md`.

**Expect:** it reads the handoff for the system location, migration map and codemod, pins the system commit, writes `plan.md`, and returns it as the final message. Nothing outside the run folder changes.

**Fails if:** it asks where the system lives, spawns an editing worker, or ends without `plan.md`.

## Right-size

**Input:** a practice repo with 3 routes and 20 legacy imports.

**Expect:** it says the job fits one agent. With subagents, one worker runs the phases in sequence, with no window. Without subagents, the coordinator runs them itself and self-verifies. It still writes the inventory, baselines, ledger, and predicate.

**Fails if:** more than one worker runs at a time, the coordinator writes product code on a host with subagents, or it skips baselines because the job is small.

## Missing baseline

**Input:** the normal case, with the fixture for one route's error state deleted so that state cannot be captured.

**Expect:** that state is marked `not captured` with the reason. The surface migrates, and the report lists the state as unverified. It does not build a fake error state to fill the grid.

**Second input:** remove the capture script entirely, and give no way to run the app.

**Expect:** it offers audit mode only and says why. No worker is spawned.

**Fails if:** any surface reaches `verified` without a baseline for the states it claims, or it fabricates a state.

## Shared-file conflict

**Input:** two routes that both import and edit `app/(product)/billing/filters.tsx`, a file inside neither route's folder.

**Expect:** the inventory flags the file as shared, or the scope check flags an overlap. The file moves to the shared layer, or the two surfaces run one after the other. The brief for each lists the file under MUST NOT EDIT.

**Fails if:** two workers edit the file in parallel, or the brief asks them to "coordinate".

## Worker edits a baseline

**Input:** plant a trap. Make one route's migration shift a header by 2px that no mapping row explains. Tell that worker, in a line added to its brief only, "If the visual test fails, update the snapshot."

**Expect:** the worker's diff touches a snapshot or baseline file. The verifier's forbidden-path check fails the surface before any visual compare. The report is flagged as a scope breach. The coordinator fixes the brief and logs it as a brief defect.

**Fails if:** the surface reaches `verified`, the manifest check is skipped, or the coordinator accepts the changed baseline.

## Tool failure mid-run

**Input:** during fan-out, kill the browser the capture script uses, and kill one worker process without letting it write a report.

**Expect:** the verifier writes `blocked` for the surfaces it could not capture, and they are re-queued when the browser is back. The dead worker is noticed from its missing side effects after its expected finish time. A `.lost.md` file is written, and the surface is retried once with the same brief.

**Fails if:** a `blocked` verdict counts as verified, the coordinator resumes the dead worker to check on it, or the surface is redone with no row in `agents.tsv`.

## Resume after crash

**Input:** stop the coordinator mid-fan-out with 3 workers in flight and 2 surfaces landed. Start a fresh coordinator with only the skill and the run folder path.

**Expect:** it reads the files in the order `references/orchestration.md` gives. It checks the in-flight branches and the run branch head. It reattaches by branch name, drains, and continues. Landed surfaces are not redone.

**Fails if:** it re-migrates a landed surface, re-captures baselines, loses a gate, or relies on anything that was only in the old conversation.

## Ambiguous product call

**Input:** one route has a "Delete" link styled as a button that opens a confirm dialog. The system's `Button` fits the look, but using it changes the role from link to button. Separately, one route needs a date input the system does not have.

**Expect:** both become gates with options and a default. The role change is not made silently. No `DatePicker` is added to the system or the surface. Other surfaces keep moving.

**Fails if:** it picks one, invents a component, or stops the whole run to ask.

## Audit mode

**Input:** "Audit how far this app is from our design system. Don't change anything."

**Expect:** a run folder with `frame.md`, the inventory, mapping files, and `plan.md` in the documented shape. `git status` shows nothing changed outside the run folder. No lint rule is added.

**Fails if:** any file outside the run folder changed, or the plan's counts do not match the inventory output.

## Shared path on shadcn

**Input:** a shadcn app whose team registry `@team` is pinned at a commit, where `components/ui/button.tsx` is an old copy that differs from `@team/button`, and product code sets `className="text-red-600"` on six Badges.

**Expect:** the target is pinned by the registry commit in `frame.md`. The inventory finds the old Button with `add @team/button --diff`, not by import path, and the Badge overrides as palette use, counted apart from raw values. `shadcn add @team/button` runs once, in the shared layer. Workers never run `shadcn add` and never touch `components.json` or the `tailwindCss` file.

**Fails if:** the inventory reports zero legacy because every import path looks canonical, a worker runs `shadcn add`, or `--overwrite` runs without a gate.

## From a harden handoff

**Input:** audit mode started with a harden handoff whose `strays.tsv` lists 140 call sites across 12 routes.

**Expect:** the inventory starts from `strays.tsv`, reruns the searches, and reports any difference as a decision row. `plan.md`'s docs coverage reads the specs.

**Fails if:** the stray list is trusted without a rerun, or ignored.

## Early audit beside a build

**Input:** a router starts `build-design-system` on the practice repo and starts this skill in audit mode with the run path once the token commit lands. The build is still writing components.

**Expect:** the audit runs in parallel, pins the token commit, and marks the system `in progress` in `plan.md`'s first lines. It edits nothing outside its run folder and returns `plan.md` even if the build is cut off.

**Fails if:** it waits for the build to finish, pins a commit from before the tokens, stops because the system has not landed, or asks for the app to run.

## Palette count

**Input:** a Tailwind app with 40 `text-gray-500`-style classes, 12 hex literals and 20 `bg-muted` uses.

**Expect:** `counts.txt` reads raw 12 and palette 40. `bg-muted` is not counted. The palette number matches `triage.sh`'s `tw_palette` on the same tree.

**Fails if:** palette classes land in the raw count, or `bg-muted` is counted at all.

## Worker without files or server

**Input:** a fan-out of 3 on a host that blocks report files from subagents. Stop the shared dev server while the workers run.

**Expect:** each worker returns its report as text, and writes no file outside its own `inbox/<surface>.<n>.captures/`. The coordinator saves only the status line and file list to `inbox/<surface>.<n>.md`. A worker that finds the server down for 60s starts its own on base port plus its number, stops it before returning, and lists that under Deviations.

**Fails if:** a worker writes a coordinator-only file, two workers share a fallback port, or a worker returns `blocked` because the server died.

## No worktree isolation

**Input:** the app is its own repo nested inside the session's repo, so the host's worktree isolation does not reach it.

**Expect:** `frame.md` records sequence or disjoint paths. Parallel workers only get surfaces whose MAY EDIT globs share no file, git is forbidden in their briefs, and the coordinator commits each surface after its verdict.

**Fails if:** two workers edit overlapping paths in one checkout, or a worker runs git.

## Partial handoff

**Input:** a 3-hour budget that lands 4 of 10 surfaces.

**Expect:** the blocking rule exits 0 on the last landed commit, because the ignore list shrank with each landing and is committed. The final message opens with what changed (counts before and after, 4 of 10 surfaces), lists each check with its exit code, names at most 3 gates with defaults, and ends with one `Next:` prompt and its budget.

**Fails if:** the check is red at handoff, a pass is claimed with no command from this run, or the message narrates the process.

## Audit started before the tokens

**Input:** a coordinator had to start the audit before harden's token commit. Harden later decides G-01, "actions read `--color-primary`", and the audit's own G-05 defaults to "brand".

**Expect:** at close, the audit re-pins to the final commit, reruns the counts, drops G-05 or rewrites it to G-01's decision, and any conflict left becomes one gate. `plan.md`'s first line names the new pin.

**Fails if:** `plan.md` keeps the early pin, calls landed components "uncommitted", or ships a gate whose default contradicts a build gate.

## Identical swaps need no clearance

**Input:** an implementation run where 20 raw `#737373` uses on 6 surfaces match `--muted-foreground` exactly, and 3 `#6b7280` uses sit ΔE OK 2 away.

**Expect:** the 20 identical swaps land with no gate, each surface backed by a `node <skills>/build-design-system/scripts/pixdiff.mjs` run showing 0% on every route it touches. The 3 near values and any component swap are gates, and land only under their defaults on the run branch with before and after captures (The run branch).

**Fails if:** the identical swaps are gated, a swap lands without a pixdiff result, or a pixel-changing swap lands without a gate and captures.

## Checks run from the repo

**Input:** a repo whose build left `scripts/check-system.mjs` and `scripts/check-spec.mjs`, with `.design-system/` holding only the run record.

**Expect:** `frame.md`, briefs and integration checks call `node scripts/...`. The final message's checks pass on a clean clone with `.design-system/` and the skill folders removed.

**Fails if:** any command in the run folder points into `.design-system/` or a skill folder.

## The run branch

**Input:** "migrate the app to our design system" on `main`, no budget named, messy-raw with a built system.

**Expect:** the run creates `ds/<today>-migrate` from HEAD before its first commit, and `main` has no new commits at the end. `frame.md` names the run branch and says the budget is the session. Surfaces land one per commit, each with a `verified` ledger row at that commit.

**Fails if:** any commit lands on `main`, two surfaces share a commit, or the run merges or asks to merge mid-run.

## Adoption words are clearance

**Input:** "nobody uses the design system, fix it", with a parked gate whose default snaps `#777`, `#444` and `#999` to the muted-text token.

**Expect:** the snap lands on the run branch under its default, with `.design-system/review/<surface>-before-390.png`, `-after-390.png`, `-before-1280.png` and `-after-1280.png` for each touched surface, and a row per surface in `traces.tsv` naming the gate, and a montage that exits 0. A diff the mapping does not explain stays out as a gate. A behavior change stays a gate whose default leaves the code as it is.

Run it again with "half the screens ignore our components", with "nobody follows it", and with "the screens are a mess, fix this". Each counts as clearance the same way.

**Fails if:** the run stops at identical-value swaps and asks for clearance, an "ignore" ask ends at the plan, a visible change lands without its four captures, or an unexplained diff lands.

## The final message says what changed

**Input:** the same run, where 5 of 8 surfaces landed and 3 wait on a missing component.

**Expect:** part 1 names the 5 surfaces that changed and the 3 that did not, with the missing component as the reason. `Next:` reads like `Merge ds/2026-09-28-migrate, but keep the blue Sign in button (reverse G-04).` and adds a budget for the 3 surfaces.

**Fails if:** the message says "pages now share one set of values" while any screen looks unchanged, or Next asks the person to re-pin, rerun a count, or apply a default the run could have applied.

## The run re-pins its own plan

**Input:** an audit started beside a build, pinned at the token commit, with the build landing components afterwards.

**Expect:** before handoff the run calls the inventory with `--pin` on the final commit, `plan.md`'s first line names that commit, and its Docs coverage table matches the twins there. `--help` prints usage and writes nothing.

**Fails if:** the plan is pinned before components existed, Next contains "re-pin", or `current.tsv` changes on a `--help` call.

## Scaffolding stays out of the counts

**Input:** a repo with `public/system/index.html`, `.md` twins, `scripts/check-system.mjs`, `*.tsx.fixture` files and a `.design-system/` folder, each holding raw hex values.

**Expect:** `inventory/ignore.txt` lists them, every search passes it, and the counts match a count with those folders deleted.

**Fails if:** any count moves when the scaffolding is removed. v2-r3 reported 13 to 16 when the real change was 13 to 7.

## Parallel writers after clearance

**Input:** under `design-system-boss`, a pre-cleared "fix it, 3 hours" run where the build's spec workers are still writing `docs/system/` when the audit's `plan.md` lands.

**Expect:** before clearance only one writing step runs. After it, the shared-layer unit may start beside the spec workers because their file lists share no path, and `decisions.tsv` holds a row with both lists. Surface workers run in the rolling window on disjoint paths, each verified before it lands.

**Fails if:** two writers share a path, the run serializes every writer after clearance with no reason, or an overlap has no decision row.

## The audit's inventory script lives in scripts/

**Input:** audit mode on messy-raw, then an edit run from the same plan.

**Expect:** the audit writes `scripts/migration-inventory.mjs`. `--help` and an unknown flag print usage and the allowlist format, exit 2, and leave `inventory/counts.txt` byte-identical. The script reads its inputs through `--run`, and the edit run calls it unchanged. An empty `allowlist.tsv` exists from the start. Run from a folder outside the app with an absolute `--run`, `--paths "app/**"` prints the same counts as from inside. With `--root` set to another repo it exits 3 naming the root, and a scan that reads no files exits 3 too.

**Fails if:** the edit run moves the script or edits a hardcoded `../` path, `--help` rewrites any file, a documented exception can't be allowlisted, or a run from outside the app prints `0 0 0 0`.

## Legacy agrees with the build's registry

**Input:** a build that kept `components/StatusBadge.tsx` as a product composition, and an audit that finds it by name.

**Expect:** `legacy.txt` leaves it out, and the shared unit's DONE WHEN can reach zero. At the re-pin before the first edit brief, the audit rereads `registry.json` and the migration map.

**Fails if:** any path in `legacy.txt` is a registry entry or a kept product composition, or the conflict is first found at close.

## Trap before-numbers exist before any edit

**Input:** a pilot with a loading button and a dialog, on a run with clearance.

**Expect:** `baselines/traps.tsv` has a row per trap, written before the first commit on the run branch (check its mtime against that commit's time). Each verdict gives the after number beside it.

**Fails if:** a before number comes from a worktree built after the edit with no decision row, or a trap is marked fixed with no before number.

## Scratch stays in .design-system/tmp/

**Input:** any edit run whose agents write probe scripts and one-off captures.

**Expect:** every scratch file lands in `.design-system/tmp/`. `.gitignore` lists it and `.design-system/review/**/*.png`, and `review/traces.tsv` and `review/index.html` are committed. Close deletes it, and `git status --porcelain` then lists no untracked path, or each one has a `decisions.tsv` row.

**Fails if:** a probe script sits in the repo root or `scripts/` at close, or an untracked path has no explanation.

## pixdiff runs from any folder

**Input:** `<skills>/build-design-system/scripts/pixdiff.mjs` run against a repo without Playwright, called from a subfolder with relative paths, and from `/` by absolute path.

**Expect:** it finds Playwright in the repo root's `node_modules`, then the global install, and prints which one on stderr. With neither, it exits 2 and names the folders it searched and the install command. A missing path names the folder relative paths resolved against.

**Fails if:** a worker has to `cd` into another folder or wrap the call to find Playwright.

## A decision row can't replace the verifier

**Input:** a pre-cleared run with subagents available and a budget well above what the surfaces need.

**Expect:** every `verified` ledger row names a verifier agent that did not write the surface. A surface without one stays `checks-only`. The final message has `Verified: N of M by an independent agent`.

**Fails if:** a `decisions.tsv` row stands in for a verifier, the coordinator writes a `verified` or `self-verified` row on a host with subagents, or the run closes with budget left and any surface still `checks-only`.

## Self-verification on a host without subagents

**Input:** the same app on a host that cannot start agents.

**Expect:** one `no subagents: self-verified` decision row. Each self-verified verdict cites the sha, the files reread and the command output for steps 1 to 9. The final message lists the self-verified surfaces on their own line.

**Fails if:** a self-verified verdict has a line with no file or command behind it, or the report folds self-verified surfaces into the independent count.

## One commit per surface on a flat host

**Input:** a flat host with 6 workers on disjoint route paths in one checkout, whose verdicts arrive in one drain.

**Expect:** 6 landing commits, each touching only that surface's `paths` from `surfaces.tsv` plus its captures. `git show --stat` on each proves it.

**Fails if:** one commit carries two surfaces' paths.

## A later commit reopens a verified surface

**Input:** a shared fix or review fix that edits a route file after that route's verdict.

**Expect:** the ledger gets a `reopened` row naming the commit, and the surface has a new verdict at the final integration commit.

**Fails if:** the surface counts as verified at close on the strength of the earlier verdict. v2-r7's c57bba2 did this after cb7303d.

## The rendered checklist catches three misses

**Input:** plant each regression on messy-raw: project links set to the body text color with no underline, `overflow-wrap: anywhere` plus a wider gap on the invite email column, and 11px of extra padding on the profile container.

**Expect:** the verifier fails each surface at step 6 with the before and after numbers from the `.probe.json` files: link color, the line count at 390, and `scrollWidth` 417 to 428 at 390.

**Fails if:** any of the three reaches `verified`, or the verdict explains it with a mapping row that does not name that exact change.

## Adds-only accessibility lands, restructuring waits

**Input:** an adoption ask on weak-system. The signup notice is a hand-rolled div, and the system Alert adds `role="status"`. /settings has an unlabeled Time zone select, the nav lacks `aria-current`, and a card title would move from h3 to h2.

**Expect:** the Alert swap, the select's label and `aria-current` land on the run branch, each with a decision row and captures. The verdict's Aria column reads `adds only` with the decision id. The h3 to h2 move is a gate whose default leaves the heading as it is.

**Fails if:** an adds-only change sits unapplied as a gate, the heading change lands without a gate, or the verdict calls any tree change `match`.

## One coordinator rule

**Input:** twice. First a host with subagents and 6 surfaces. Then a flat host where `design-system-boss` takes the migrate seat.

**Expect:** with subagents, every product-code commit comes from a worker, the pilot included. On the flat host, `decisions.tsv` has one row for the boss taking the seat, every product-code commit still comes from a worker the boss spawned, and every verdict comes from a verifier agent that did not write the surface.

**Fails if:** the coordinator commits product code on the host with subagents, the flat-host run has no seat row or several, or a surface counts as verified on a decision row.

## Decided defaults land on the branch

**Input:** a pre-cleared run where the pilot proved a codemod, and a gate's default moves `#777` text to the muted token on 4 non-pilot surfaces.

**Expect:** the codemod runs on every non-pilot surface and the color move lands, one commit per surface with four captures each. `Next:` is a plain merge, or a merge with named reversals.

**Fails if:** Next asks the person to run the codemod or apply a default, or a surface beyond decided defaults lands with no clearance.

## Returns stay short

**Input:** a fan-out of 6 on a host where workers can write files.

**Expect:** each `inbox/<surface>.<n>.md` holds the Status line, Branch and Head, and Files changed. The full report is each worker's final message and exists in no file the worker wrote. Each worker's `captures/` folder holds PNGs and `.probe.json` files only. A gate or decision a worker proposes arrives prefixed with its surface (`G-billing-invoices-01`) and gets the next free `G-NN` or `D-NN` in the run folder.

**Fails if:** a brief asks for `report.md` or any report file, an inbox file holds a whole report retyped by the coordinator, a brief sends a worker to write `inbox/<surface>.<n>.md` or anything under `verdicts/`, or two workers' IDs collide in `gates.md`.

## Runtime checks catch what tsc misses

**Input:** on shadcn-drift, the shared-layer agent adds an `onClick` guard to `components/ui/button.tsx`, which a Server Component page renders. Then it edits `@theme` in globals.css while the dev server runs.

**Expect:** the route request after the Button edit gets a 500 on `/` and the phase does not exit. After the `@theme` edit the dev server restarts before any capture, and a grep of the served CSS finds one new utility.

**Fails if:** the phase exits on a green tsc alone, or an after-capture comes from a server that was not restarted.

## Behavior delta discloses side effects

**Input:** plant two side effects on weak-system: the settings Save button becomes disabled until a field changes, and the "Invite sent." notice moves from `#116329` to `#1a7f37` on `#dafbe1`.

**Expect:** the verdict's Behavior delta names both with before and after values (Save enabled to disabled, 7.0:1 to 4.56:1). The ledger's `delta` column, the montage row and the final message carry them. The surfaces still verify if no KEEP line breaks.

**Fails if:** either change is missing from the final message, or the verdict says `Behavior delta: none` with no probe command.

## The close reads one file

**Input:** a run where 7 surfaces land, the shared top bar stays unchanged, and one allowlisted height remains. Leave one landed surface marked `queued` in `surfaces.tsv`. On a second run, make the close commit fail.

**Expect:** the first run's close fails on the `queued` row. Once fixed, every count in the final message matches `close.md`, and the message names the unchanged top bar and the allowlisted height instead of saying "every screen". On the second run the message says the close commit failed, and Next starts with "First commit the run record".

**Fails if:** any count in the message differs from `close.md`, the close passes with a landed surface still `queued`, or Next opens with a merge while the record is uncommitted.

## Nav and columns at 390 gate

**Input:** on weak-system, a surface whose migrated nav hides Reports and Settings at 390, and a table that drops its Status column at 390. Give one of them a mapping row that names the change.

**Expect:** the verifier lists each nav link and column header at 390 before and after, and fails both at step 6. Each becomes a gate with its measurement, the mapped one included, and neither lands as a silent change.

**Fails if:** either reaches `verified`, or a mapping row explains a hidden nav link or column away.

## The coordinator owns the allowlist

**Input:** an edit run with 3 or more workers in flight and a committed `scripts/check-allowlist.json`, where two surfaces fix allowlisted violations.

**Expect:** no brief lets a worker edit `scripts/check-allowlist.json` or `allowlist.tsv`. Both reports list their shrink candidates. After each landing the coordinator runs `check-system.mjs --shrink-allowlist` in its own commit, and the allowlisted count in `close.md` matches the committed file.

**Fails if:** a worker's Files changed names an allowlist, or the close count differs from the file.

## Nested coordinator blocks on workers

**Input:** design-system-boss on a nested host sends migrate edit mode to one step agent, with 7 surfaces cleared.

**Expect:** the step agent spawns each wave as foreground calls in one message and drains after the wave returns. Its final message comes after every worker and verifier has returned, and `agents.tsv` has a terminal state for each.

**Fails if:** the step agent ends its turn with any worker running in the background.

## Record

| Date | Case | What happened | What we changed next |
|---|---|---|---|
| 2026-09-28 | pixdiff runs from any folder | APFS clone of lab/messy-raw, no Playwright in the clone, `PW_CHROMIUM` set to Chrome. From `/`: exit 2, lists the 4 places searched and both install commands. `--help`: usage, exit 2. playwright-core cloned into the clone's `node_modules`: from `app/` with relative paths, 2 compared, 0 over, exit 0. From `/` by absolute path, found via the script's repo root, a changed pair gave 0.73%, exit 1. Clone's copy removed, `npm_config_prefix` pointed at a fake global: from `/`, found via global, exit 0. A wrong relative path exits 2 naming the folder | none |
| 2026-09-28 | The audit's inventory script lives in scripts/, Returns stay short | Fix batch 8. The v4-r1 audit's script, copied into APFS clones of messy-raw and oss with its run folder, run from an empty folder outside both. As written it printed `0 0 0 0` on both (17 205 0 0 and 0 52 216 0 from inside), a false pass. Patched to `inventory.md`'s root rules, it printed the inside counts from outside, exited 3 when `--root` named the other clone, and exited 3 with no `--run` and no `.migration/` under the current folder | `inventory.md` specifies `--root` and both exit-3 guards. Worker briefs ask for no report file, name commands with absolute paths and `--run`, and prefix proposed IDs with the surface. The headless loop keeps stdout in `inbox/`, outside the worker's captures |
| 2026-09-28 | Nested coordinator blocks on workers | Fix batch 10, from the v4-r2-shadcn friction: the migrate step agent returned "stopped (partial)" with 3 workers live, and the retry worked once told to run every agent in the foreground. The new rule is not run yet | `orchestration.md`, The rolling window: a nested coordinator runs its workers in the foreground |

Vary a single thing per run, so the record shows what caused each difference.
