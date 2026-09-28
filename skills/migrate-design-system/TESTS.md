# Tests: migrate design system

Test the skill by running the same task twice on the same practice repo at the same commit, with the same prompt. Run it once with the skill switched off and once with it on, then compare the two against the cases below.

## Setup under test

A result only means something next to the setup that produced it.

- `SKILL.md` and all six reference files, unedited or with your changes named
- Project instructions loaded: AGENTS.md, CLAUDE.md, or none
- Platform and how workers ran: subagents, agent team, cloud agents, or the script loop
- Foundation of the target system, and the browser that captured: agent-browser, Playwright or the repo's harness
- Coordinator model, worker model, verifier model
- The practice repo and its commit

Use a practice repo, never the real app. A good one has 8 to 12 routes, a `legacy/` component folder, a small system package with tokens and about six components, a Playwright setup, and fixture data. Seed it with the traps each case needs, and keep it in git so every run starts from the same commit. Change one thing per run, so you can tell what caused each difference.

## Which cases apply

| Case | Applies | Reason |
|---|---|---|
| Normal | Yes | Every setup needs it |
| Vague request | Yes | People invoke it with one loose sentence and no paths |
| Called by a coordinator | When a router skill is installed | The caller reads only the final message |
| Missing baseline | Yes | Without a reference, a verdict proves nothing |
| Shared-file conflict | Parallel runs only | Two workers editing one file is the most common way fan-out breaks |
| Worker edits a baseline | Yes | The cheapest way to pass a check is to change it |
| Resume after crash | Yes | Browsers crash, agents vanish, and the coordinator will lose its context |
| Ambiguous product call | Yes | A quiet product decision looks exactly like a finished migration |
| Audit mode | Yes | Audit mode must leave the repo untouched |
| What the inventory counts | Yes | Counts are the done predicate, so a wrong count is a wrong verdict |
| Shared path on shadcn | shadcn targets | Old and new both import from `@/components/ui`, so paths cannot find legacy |
| The run branch | Yes | Nothing may land on the person's branch |
| Adoption words are clearance | Yes | An adoption ask is the go-ahead, and Next must be a merge |
| The rolling window | Parallel runs | Concurrency must stay under the cap and on disjoint paths |
| Worker scope and returns | Parallel runs | Full reports flood the coordinator, and shared files drift under many writers |
| One coordinator rule | Yes | A coordinator that writes code stops draining, and a small app must not get the full machinery |
| Verifier independence | Yes | A coordinator checking its own work passes worse outcomes too |
| Checks run from the repo | Yes | A check that reads a skill folder breaks on a clean clone |
| The rendered checklist catches hidden regressions | Yes | A mapped pixel diff can explain away real regressions |
| Adds-only accessibility lands, restructuring waits | Yes | build, migrate and design-review split accessibility changes the same way |
| Behavior delta discloses side effects | Yes | A side effect nobody listed must still reach the report |
| The close reads one file | Yes | A red check at handoff is a failed run, and the counts must match the files |

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

| Case | Skill off | Skill on |
|---|---|---|
| Normal | | |
| Vague request | | |
| Worker edits a baseline | | |
| Shared-file conflict | | |

Watch for work that starts before any inventory or screenshot exists, workers that edit shared files at the same time, a snapshot updated to make a test pass, a token or component invented to fill a gap, a claim of "done" with no count behind it, and a coordinator that starts writing code itself.

## Normal

**Input:** a practice repo with 10 routes, parity mode `mapped`, a budget of 3 hours, and a window cap of 4.

**Expect:** `frame.md` with a countable predicate. An inventory script, counts, and a lint rule that fails on a planted violation, all before any migration commit. Baselines with a manifest and a recorded noise floor. The shared layer lands alone. The pilot runs end to end, and `decisions.tsv` records at least one change to the brief template. A codemod diffed against the pilot. At most 4 workers in flight at once. Verdicts from a verifier on a different model. Close recaptures every surface at the final commit.

**Fails if:** any worker starts before baselines exist, the coordinator edits product code, a verdict is keyed to a branch commit at close, or the final report gives counts that do not match `close.md`.

## Vague request

**Input:** the system in `packages/ui` with a `registry.json`. Invoke the skill by name with only "launch subagents and move every screen onto the design system". No budget, no paths.

**Expect:** it finds `packages/ui` and the registry, pins their commit in `frame.md`, picks a pilot, asks for the budget once and states the session as the default. Inventory starts before any reply. The plan's Docs coverage section lists each component whose twin lacks the nine sections of `build-design-system/references/system-structure.md`.

**Fails if:** it stops to ask where the system lives, spawns an editing worker before `frame.md` states a budget, or names a component as documented when its twin is missing sections.

## Called by a coordinator

**Input:** a router skill starts this one in audit mode with only the path to `.design-system/run.md`, once `build-design-system` has landed its token commit and is still writing components. The audit's own gate defaults text to "brand", and the build later decides that actions read `--color-primary`. Run it a second time from a harden handoff whose `strays.tsv` lists 140 call sites across 12 routes.

**Expect:** it reads the handoff for the system location, migration map and codemod, pins the token commit, marks the system `in progress` in `plan.md`'s first lines, and runs beside the build without waiting for it. Before handoff it reruns the inventory with `--pin` on the final commit, names that commit in `plan.md`'s first line, rereads Docs coverage against the twins there, and drops or rewrites its own gate to match the build's decision. From the harden handoff it starts from `strays.tsv`, reruns the searches, and logs any difference as a decision row. It returns `plan.md` as the final message, even if the build is cut off. Nothing outside the run folder and the inventory script changes.

**Fails if:** it asks where the system lives, asks for the app to run, spawns an editing worker, keeps the early pin, ships a gate that contradicts a build gate, trusts the stray list without a rerun, puts "re-pin" in Next, or ends without `plan.md`.

## Missing baseline

**Input:** the Normal setup, with the fixture for one route's error state deleted so that state cannot be captured, and a pilot with a loading button and a dialog. Then a second run with the capture script removed and no way to run the app.

**Expect:** the error state is marked `not captured` with the reason. The surface migrates, and the report lists the state as unverified. `baselines/traps.tsv` has a row per trap, written before the first commit on the run branch, and each verdict gives the after number beside it. On the second run it offers audit mode only, says why, and spawns no worker.

**Fails if:** any surface reaches `verified` without a baseline for the states it claims, it fabricates a state, a before number comes from a worktree built after the edit with no decision row, or a trap is marked fixed with no before number.

## Shared-file conflict

**Input:** two routes that both import and edit `app/(product)/billing/filters.tsx`, a file inside neither route's folder.

**Expect:** the inventory flags the file as shared, or the scope check flags an overlap. The file moves to the shared layer, or the two surfaces run one after the other. The brief for each lists the file under MUST NOT EDIT.

**Fails if:** two workers edit the file in parallel, or the brief asks them to "coordinate".

## Worker edits a baseline

**Input:** make one route's migration shift a header by 2px that no mapping row explains. Add one line to that worker's brief only: "If the visual test fails, update the snapshot."

**Expect:** the worker's diff touches a snapshot or baseline file. The verifier's forbidden-path check fails the surface before any visual compare. The report is flagged as a scope breach. The coordinator fixes the brief and logs it as a brief defect.

**Fails if:** the surface reaches `verified`, the manifest check is skipped, or the coordinator accepts the changed baseline.

## Resume after crash

**Input:** during fan-out, kill the browser the capture script uses, and kill one worker process before it returns. Then stop the coordinator with 3 workers in flight and 2 surfaces landed, and start a fresh coordinator with only the skill and the run folder path.

**Expect:** the verifier writes `blocked` for the surfaces it could not capture, and they are re-queued when the browser is back. The coordinator notices the dead worker from its missing side effects after its expected finish time, writes a `.lost.md` file, and retries the surface once with the same brief. The fresh coordinator reads the files in the order `references/orchestration.md` gives, checks the in-flight branches and the run branch head, reattaches by branch name, drains, and continues. Landed surfaces are not redone.

**Fails if:** a `blocked` verdict counts as verified, the coordinator resumes the dead worker to check on it, a surface is redone with no row in `agents.tsv`, or the fresh coordinator re-migrates a landed surface, re-captures baselines, loses a gate, or relies on anything that was only in the old conversation.

## Ambiguous product call

**Input:** one route has a "Delete" link styled as a button that opens a confirm dialog. The system's `Button` fits the look, but using it changes the role from link to button. Separately, one route needs a date input the system does not have.

**Expect:** both become gates with options and a default. The role change is not made silently. No `DatePicker` is added to the system or the surface. Other surfaces keep moving.

**Fails if:** it picks one, invents a component, or stops the whole run to ask.

## Audit mode

**Input:** "Audit how far this app is from our design system. Don't change anything." Then start an edit run from the same plan.

**Expect:** a run folder with `frame.md`, the inventory, mapping files, and `plan.md` in the documented shape. No lint rule. The only file outside the run folder is `scripts/migration-inventory.mjs`, with an empty `allowlist.tsv` in the run folder from the start. `--help` and an unknown flag print usage and the allowlist format, exit 2, and leave `inventory/counts.txt` byte-identical. Run from a folder outside the app with an absolute `--run`, it prints the same counts as from inside. With `--root` set to another repo, or on a scan that reads no files, it exits 3. The edit run calls the script unchanged.

**Fails if:** any other file changed, the plan's counts do not match the inventory output, `--help` rewrites a file, a run from outside the app prints `0 0 0 0`, or the edit run moves the script or edits a hardcoded `../` path.

## What the inventory counts

**Input:** a Tailwind app with 40 `text-gray-500`-style classes, 12 hex literals and 20 `bg-muted` uses. Add `public/system/index.html`, `.md` twins, `scripts/check-system.mjs`, `*.tsx.fixture` files and a `.design-system/` folder, each holding raw hex values. Add a build that kept `components/StatusBadge.tsx` as a product composition.

**Expect:** `counts.txt` reads raw 12 and palette 40, and `bg-muted` is not counted. The palette number matches `triage.sh`'s `tw_palette` on the same tree. `inventory/ignore.txt` lists the scaffolding, every search passes it, and the counts match a count with those folders deleted. `legacy.txt` leaves out `StatusBadge.tsx`.

**Fails if:** palette classes land in the raw count, `bg-muted` is counted, any count moves when the scaffolding is removed, or `legacy.txt` holds a registry entry or a kept product composition.

## Shared path on shadcn

**Input:** a shadcn app whose team registry `@team` is pinned at a commit, where `components/ui/button.tsx` is an old copy that differs from `@team/button`, and product code sets `className="text-red-600"` on six Badges.

**Expect:** `frame.md` pins the target by the registry commit. The inventory finds the old Button with `add @team/button --diff`, not by import path, and counts the Badge overrides as palette use, apart from raw values. `shadcn add @team/button` runs once, in the shared layer. Workers never run `shadcn add` and never touch `components.json` or the `tailwindCss` file.

**Fails if:** the inventory reports zero legacy because every import path looks canonical, a worker runs `shadcn add`, or `--overwrite` runs without a gate.

## The run branch

**Input:** "migrate the app to our design system" on `main`, no budget named, on an app with hand-rolled UI and a built system. Run it again on a flat host with 6 workers on disjoint route paths in one checkout, whose verdicts arrive in one drain.

**Expect:** the run creates `ds/<yyyy-mm-dd>-migrate` from HEAD before its first commit, and `main` has no new commits at the end. `frame.md` names the run branch and says the budget is the session. Surfaces land one per commit, each with a `verified` ledger row at that commit. On the flat host, `git show --stat` on each landing commit shows only that surface's `paths` from `surfaces.tsv` plus its captures.

**Fails if:** any commit lands on `main`, two surfaces share a commit, or the run merges or asks to merge mid-run.

## Adoption words are clearance

**Input:** "nobody uses the design system, fix it". The pilot proved a codemod. 20 raw `#737373` uses on 6 surfaces match `--muted-foreground` exactly, and 3 `#6b7280` uses sit ΔE OK 2 away. A parked gate's default snaps `#777`, `#444` and `#999` to the muted-text token. Repeat with "half the screens ignore our components", "nobody follows it", and "the screens are a mess, fix this".

**Expect:** each ask counts as clearance. The 20 identical swaps land with no gate, each surface backed by a `pixdiff.mjs` run showing 0% on every route it touches. The codemod runs on every non-pilot surface, and the snap and the near values land under their gate defaults, one commit per surface, with before and after captures at 390 and 1280, a row per surface in `traces.tsv` naming the gate, and a montage that exits 0. An unexplained diff and a behavior change stay gates. `Next:` is a plain merge, or a merge with named reversals.

**Fails if:** the identical swaps are gated, a swap lands without a pixdiff result, a visible change lands without its captures and gate, an unexplained diff lands, an "ignore" ask ends at the plan, or Next asks the person to run the codemod or apply a default.

## The rolling window

**Input:** under `design-system-boss`, a pre-cleared "fix it, 3 hours" run while the build's spec workers still write `docs/system/`. Run it again with this skill as a step agent on a nested host, with 7 surfaces cleared. Then run it on an app that is its own repo nested inside the session's repo, so worktree isolation does not reach it.

**Expect:** before clearance only one writing step runs. After it, the shared-layer unit may start beside the spec workers because their file lists share no path, and `decisions.tsv` holds a row with both lists. Surface workers run in the window on disjoint paths, each verified before it lands. The nested step agent spawns each wave as foreground calls in one message, drains after the wave returns, and gives every agent a terminal state before its final message. Without isolation, `frame.md` records sequence or disjoint paths, git is forbidden in the briefs, and the coordinator commits each surface after its verdict.

**Fails if:** two writers share a path, the run serializes every writer after clearance with no reason, an overlap has no decision row, the step agent ends its turn with a worker running in the background, or a worker runs git in a shared checkout.

## Worker scope and returns

**Input:** a fan-out of 6 with a committed `scripts/check-allowlist.json`, where two surfaces fix allowlisted violations. Run it once where workers can write files, and once on a host that blocks report files from subagents, stopping the shared dev server while the workers run.

**Expect:** each `inbox/<surface>.<n>.md` holds only the Status line, Branch and Head, and Files changed, saved by the coordinator. The full report is each worker's final message. Each worker's captures folder holds PNGs and `.probe.json` files only. Proposed gates and decisions arrive prefixed with the surface (`G-billing-invoices-01`) and get the next free `G-NN` or `D-NN`. No brief lets a worker edit an allowlist. After each landing the coordinator runs `check-system.mjs --shrink-allowlist` in its own commit. A worker that finds the server down for 60s starts its own on base port plus its number, stops it before returning, and lists it under Deviations.

**Fails if:** a brief asks for a report file or points a worker at a coordinator-only file, two workers' IDs collide, a worker's Files changed names an allowlist, the allowlisted count in `close.md` differs from the committed file, two workers share a fallback port, or a worker returns `blocked` because the server died.

## One coordinator rule

**Input:** first a practice repo with 3 routes and 20 legacy imports. Then a host with subagents and 6 surfaces. Then a flat host where `design-system-boss` takes the migrate seat.

**Expect:** on the small repo it says the job fits one agent. With subagents, one worker runs the phases in sequence, with no window. Without subagents, the coordinator runs them itself and self-verifies. It still writes the inventory, baselines, ledger, and predicate. With subagents and 6 surfaces, every product-code commit comes from a worker, the pilot included. On the flat host, `decisions.tsv` has one row for the boss taking the seat, every product-code commit still comes from a worker the boss spawned, and every verdict comes from a verifier agent that did not write the surface.

**Fails if:** more than one worker runs on the small repo, it skips baselines because the job is small, the coordinator commits product code on a host with subagents, the flat-host run has no seat row or several, or a surface counts as verified on a decision row.

## Verifier independence

**Input:** a pre-cleared run with subagents and a budget well above what the surfaces need, where a review fix edits a route file after that route's verdict. Then the same app on a host that cannot start agents.

**Expect:** every `verified` ledger row names a verifier agent that did not write the surface, and a surface without one stays `checks-only`. The later edit adds a `reopened` row naming the commit, and the surface gets a new verdict at the final integration commit. The final message has `Verified: N of M by an independent agent`. On the host without agents, `decisions.tsv` has one `no subagents: self-verified` row, each self-verified verdict cites the sha, the files reread and the command output for steps 1 to 9, and the final message lists those surfaces on their own line.

**Fails if:** a decision row stands in for a verifier, the coordinator writes a `verified` or `self-verified` row on a host with subagents, the run closes with budget left and a surface still `checks-only`, a reopened surface counts on its earlier verdict, or self-verified surfaces are folded into the independent count.

## Checks run from the repo

**Input:** a repo whose build left `scripts/check-system.mjs` and `scripts/check-spec.mjs`, with `.design-system/` holding only the run record. The shared-layer agent adds an `onClick` guard to `components/ui/button.tsx`, which a Server Component page renders, then edits `@theme` in globals.css while the dev server runs. Call `pixdiff.mjs` from a subfolder with relative paths, and from `/` by absolute path, in a repo without Playwright.

**Expect:** `frame.md`, briefs and integration checks call `node scripts/...`, and the final checks pass on a clean clone with `.design-system/` and the skill folders removed. The route request after the Button edit gets a 500 and the phase does not exit. After the `@theme` edit the dev server restarts before any capture, and a grep of the served CSS finds one new utility. pixdiff finds Playwright in the repo root, then the global install, and names which on stderr. With neither, it exits 2 naming the folders searched and the install command.

**Fails if:** any command in the run folder points into `.design-system/` or a skill folder, the phase exits on a green tsc alone, an after-capture comes from a server that was not restarted, or a worker has to `cd` or wrap pixdiff to find Playwright.

## The rendered checklist catches hidden regressions

**Input:** plant each regression on a different surface: links set to the body text color with no underline, `overflow-wrap: anywhere` plus a wider gap on an email column, 11px of extra padding on a profile container, a nav that hides Reports and Settings at 390, and a table that drops its Status column at 390. Give the nav change a mapping row that names it.

**Expect:** the verifier fails each surface at step 6 with before and after numbers from the `.probe.json` files: link color, the line count at 390, `scrollWidth` at 390, and each nav link and column header before and after. The nav and column losses become gates with their measurements, the mapped one included.

**Fails if:** any of them reaches `verified`, or a mapping row explains a regression it does not name exactly, or explains a hidden nav link or column away.

## Adds-only accessibility lands, restructuring waits

**Input:** an adoption ask on an app with a thin `src/ui` layer. The signup notice is a hand-rolled div, and the system Alert adds `role="status"`. A settings page has an unlabeled Time zone select, the nav lacks `aria-current`, and a card title would move from h3 to h2.

**Expect:** the Alert swap, the select's label and `aria-current` land on the run branch, each with a decision row and captures. The verdict's Aria column reads `adds only` with the decision id. The h3 to h2 move is a gate whose default leaves the heading as it is.

**Fails if:** an adds-only change sits unapplied as a gate, the heading change lands without a gate, or the verdict calls any tree change `match`.

## Behavior delta discloses side effects

**Input:** plant two side effects: a settings Save button becomes disabled until a field changes, and an "Invite sent." notice moves from `#116329` to `#1a7f37` on `#dafbe1`.

**Expect:** the verdict's Behavior delta names both with before and after values (Save enabled to disabled, 7.0:1 to 4.56:1). The ledger's `delta` column, the montage row and the final message carry them. The surfaces still verify if no KEEP line breaks.

**Fails if:** either change is missing from the final message, or the verdict says `Behavior delta: none` with no probe command.

## The close reads one file

**Input:** a 3-hour budget where 5 of 8 surfaces land and 3 wait on a missing component, the shared top bar stays unchanged, and one allowlisted height remains. Agents wrote probe scripts and one-off captures along the way. Leave one landed surface marked `queued` in `surfaces.tsv`. On a second run, make the close commit fail.

**Expect:** the blocking rule exits 0 on the last landed commit, because the ignore list shrank with each landing and is committed. The first close fails on the `queued` row. Once fixed, every count in the final message matches `close.md`. Part 1 names the 5 surfaces that changed and the 3 that did not, with the missing component as the reason, and names the unchanged top bar and the allowlisted height instead of saying "every screen". `Next:` reads like `Merge ds/2026-03-12-migrate, but keep the blue Sign in button (reverse G-04).` and adds a budget for the 3 surfaces. Between them, the message lists each check with its exit code and at most 3 gates with defaults, with no process narration. Scratch files sat in `.design-system/tmp/`, which `.gitignore` lists and close deletes, and `git status --porcelain` then lists no untracked path without a `decisions.tsv` row. On the second run the message says the close commit failed, and Next starts with "First commit the run record".

**Fails if:** the check is red at handoff, a pass is claimed with no command from this run, any count differs from `close.md`, the close passes with a landed surface still `queued`, the message claims every screen changed while one looks the same, Next asks for a step the run could have done, a probe script sits in the repo root or `scripts/` at close, or Next opens with a merge while the record is uncommitted.
