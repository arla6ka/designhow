# Tests: design system boss

Run these by hand on practice repos. Most cases stop after triage, the Frame message or the first step, so they are quick. The full-route case takes hours. Nothing here runs automatically.

## Setup under test

A result only means something next to the setup that produced it. Record this before every run.

- `SKILL.md`, the five files in `references/`, and `scripts/triage.sh`, unedited or with your changes named
- Sibling skills installed, and their versions or commits. Name any that were missing
- Project instructions: AGENTS.md or CLAUDE.md loaded or not
- Host: subagents yes or no, nesting yes or no, worktrees yes or no, browser yes or no
- Repo and commit, and whether `git status` was clean at the start
- Model for the boss, and for step agents if different

Keep these practice repos in git so every run starts from the same commit. **Bare** has about 15 routes, no token file, 400 or so raw colors and three button implementations. **Drifting** has a DTCG token source, 45% adoption and two input families. **Settled** has tokens, `components/ui`, a registry and 90% adoption, with no docs pages. **Fresh shadcn** is `npx shadcn@latest init -d` plus `add --all`, one route and nothing else. **Weak shadcn** is Fresh shadcn with 12 routes, a legacy `Modal` and `PrimaryButton`, palette classes and `text-[#666]` in product code, and no specs. **Library** has MUI with a theme, 10 routes and two `Button` wrappers.

Some cases use the five lab fixtures instead. messy-raw is Bare, shadcn-drift is Weak shadcn, weak-system is Drifting with a `src/ui` layer, greenfield is an empty repo, and oss is a 57-route open-source app the person does not own.

## Which cases apply

| Case | Applies | Why |
|---|---|---|
| Vague build ask | Yes | The ask this skill exists for |
| Fix-it ask | Yes | The full route, and the only one that can edit every screen |
| Messy values | Yes | The branch where token-mapping decides the next skill |
| One component | Yes | A small ask must stay small |
| Pre-ship review | Yes | The route that must change nothing |
| Audit only | Yes | Read-only from end to end |
| Migration clearance | Yes | The costliest step must never start on a guess |
| Ask against state | Yes | "Migrate us" with nothing to migrate onto |
| Unrelated work | Yes | A dirty tree is normal, and it is not the run's to touch |
| Brand trap | Yes | "Make it modern" invites invented colors and fonts |
| Resume | Yes | The boss will lose its context on a long run |
| Flat host | Hosts where agents cannot start agents | The boss can spawn, so every line of product code must come from a worker |
| No subagents | Hosts without subagents | The same route has to run in sequence |
| Missing sibling | Yes | A partial install should stop only what needs the missing skill |
| Triage tool failure | Yes | `rg` may be absent |
| Stock shadcn is not drift | Yes | A clean shadcn install must not read as duplicate families |
| Weak system | Yes | Components with no states or rules get hardened before anyone migrates onto them |
| Greenfield | Yes | A new app gets a seed with brand gates, not a build |
| Library foundation | Yes | The one question is whether the library stays |
| Broad review on main | Yes | A ship ask with no diff still needs a scope |
| Named complaint | Yes | A named symptom must beat a generic "clean it up" |
| Empty repo, either entry | Yes | The boss and build's seed mode must not run two different things |
| Phase caps | Yes | The audit got starved in 3 of 4 lab runs, and the old formula overshot by 6 times |
| Live workers at handoff | Hosts with background agents | Workers that outlive the boss write into an unchecked repo |
| No worktrees | Hosts that cannot isolate the app repo | Two writers in one checkout overwrite each other |
| Final message | Yes | The person reads one message on waking up |
| Triage signals | Yes | A wrong layer or adoption number misroutes the whole run |
| Consistency ask | Yes | "Are colors consistent" had no intent row |
| Weak system, gap threshold | Yes | A not-actionable mapping on weak shadcn sent the run to Build |
| Safe swaps everywhere | Yes | 7 of 8 screens stayed identical after "fix it" |
| Repo works after the run | Yes | The check depended on `.design-system/` and the skill folder |
| Audit pin | Yes | An audit pinned before harden landed contradicted its gates |
| No shell | Hosts with file tools and no shell | Triage, checks and diffs all need a shell |
| Run branch | Yes | 16 of 16 captures were unchanged after "make it look like one thing" |
| Visual consistency ask | Yes | "Looks like a different product" had no intent row |
| Drifting build ask | Yes | "Set up a design system" on drifting shadcn had no routing row |
| Adoption is clearance | Yes | Adoption asks failed "first visible change" in every round-3 run |
| Scaffolding out of triage | Yes | Seen 5 times: after-numbers counted the build's own fixtures and twins |
| Returns as status and files | Yes | Pasting 12 to 17 whole returns was the largest cost in the coordinator's context, seen 3 times |
| No live reader | Yes | An unattended run had nowhere to send the Frame |
| Coordinator path | Yes | About 2,500 lines were read before the first edit |
| Flat host track | Hosts where agents cannot start agents | Holding the build and migrate seats meant about 3,000 lines of sibling references |
| Consistency with a change verb | Yes | "Make it consistent" matched both a writing row and the read-only review row |
| Missing states | Yes | "Missing loading and error states" matched no intent row |
| Weak with a visual ask | Yes | Two routing rows fit a drifting, weak app asked to look like one thing |
| Stray folder | Yes | `components/custom` counted as the layer, so its raw lines hid, then reappeared at close |
| Decided defaults | Yes | Codemods and color moves stayed recorded but unapplied, so Next was not a plain merge |
| Close numbers | Yes | Reports said "every screen" while raw values were left, and counts came from several files |
| PR footprint | Repos the person does not own | A PR upstream must not carry vendored checks, docs or a `.gitignore` edit |
| Named families for a PR | Repos the person does not own | A two-family PR ask went through Harden, whose specs and checks minimal forbids |
| PR close | Repos the person does not own | A 23-line PR had no description, a hunk in a file nothing imports, and a base carrying a non-upstream commit |
| Raw family copies | Yes | Name-suffix families counted callers of Button and missed the raw `<button>` copies of it |
| Coordinator-owned allowlist | Hosts with parallel workers | Parallel workers edited one allowlist at once, and its counts drifted from 39 to 31 |
| Values with a consistency verb on weak shadcn | Yes | The weak row and the Values row both fit "clean it up and make it consistent" with hardcoded colors |
| Step returns with live workers | Nested hosts | A migrate step agent handed back with 3 workers still running |
| Decided defaults budget | Every writing route | The decided-defaults step came after the 70% cutoff, so its cap and the cutoff conflicted |
| Gate slots follow the complaint | Every writing route | The report's 3 gate slots went to gates unrelated to the named complaint |

## Done means

- `triage/signals.tsv` and `triage/after/signals.tsv` exist and came from the script.
- The state file names a state, an intent, the deciding signals, a route and a budget.
- Every step has a verdict with an evidence path that opens.
- At most one question went out before the first step, with its default applied.
- The report's numbers are rows in `close.md` and match the files they cite.
- `git status` changed only inside the scopes the steps were given.
- Left to a person: merging the run branch, reversing gates, clearance on a non-adoption ask, and deploying.

## Baseline

First, run with this skill switched off and the five siblings installed. Give the agent the Bare repo and this prompt:

```
Our UI is a mess. Launch subagents to break down all the screens and fix it.
```

| Case | What happened with no boss |
|---|---|
| Fix-it ask | |

Watch for a skill picked from the prompt's wording without looking at the repo, several questions before any work, a migration started with no budget, two skills writing the same files at once, a coordinator that edits components itself, a new palette, a summary that claims success without a count, and no record a second session could resume from. Until this row is filled in, you do not know whether the boss helps.

## Vague build ask

**Input:** Bare, and "Launch subagents to break down all screens in the app, we need to build a design system."

**Expect:** triage runs first and the state is `none`. Intent is build. The Frame message gives the numbers, the Build route, the budget, and at most one question with a default. `build-design-system` runs as one step, with its per-screen inventory fanned out to read-only workers. The boss checks the build against the page table in `system-structure.md`. `migrate-design-system` runs in audit mode only. The report's Next is a merge, plus the Go line for the screens the audit planned.

**Fails if:** the boss asks for paths, the migration edits anything, or the report states a number no file holds.

## Fix-it ask

**Input:** Drifting, and "Our UI is a mess, fix it." Budget given: 8 hours.

**Expect:** state `drifting`, intent full, route Full. "Fix it" aimed at a mess counts as clearance, so the state file names the ask as the clearance source and the 8 hours as the budget. Build, then migrate audit, then the decided defaults on the run branch, then `migrate-design-system` on the other screens, and `design-review` on the final captures. Run it again with "Our UI is a mess, clean it up". That gives no clearance, so the route ends after the decided defaults, at the plan, and Next carries the Go line.

**Fails if:** the fix-it run ends at the plan, migration edits start before `plan.md` exists, or the build and the migration write at the same time.

## Messy values

**Input:** Drifting, and "we have hardcoded colors everywhere." Run twice. Once with a token set that covers most values, and once with a token set so thin that token-mapping reports gaps over its threshold.

**Expect:** `token-mapping` runs first. With the covering set, the route goes on to migrate audit and passes the mapping report in. With the thin set, it goes on to `build-design-system` and passes the report in. Both branches are decision rows.

**Fails if:** the second skill is chosen before the mapping report exists, or the report is summarized into the next brief instead of passed by path.

## One component

**Input:** Settled, and "document the Select."

**Expect:** route Component. Only `component-docs` runs. No build, no migration, no triage question. The entry lands in the repo's entry folder or in `returns/component-docs.entry.md`, with its path in the state file.

**Fails if:** any other sibling runs, or the entry is written somewhere the state file does not name.

## Pre-ship review

**Input:** Settled, and "check the invite flow before I ship."

**Expect:** route Review. `design-review` on the invite flow and `token-mapping` on its files, side by side. `git status` after matches before, outside `.design-system/boss/`.

**Fails if:** anything in the repo changes, or the review findings are "fixed".

## Audit only

**Input:** Drifting, and "how bad is it? don't change anything."

**Expect:** route Audit. `token-mapping`, then migrate audit. Nothing changes outside `.design-system/boss/` and `.migration/`. Next names the route that would fix it and its budget.

**Fails if:** a lint rule, token file or component appears.

## Migration clearance

**Input:** Settled, and "migrate everything to our design system", with no budget given.

**Expect:** Adopt. "Migrate" is an adoption word, so it counts as clearance within the session budget. The audit runs, then `migrate-design-system` edits on the run branch, one surface per commit, each with before and after captures. Run it again with "our components have no rules, make them solid": that ask is not adoption, so the route lands the decided defaults, ends at the plan, and Next is a merge, plus the Go line for the screens the audit planned.

**Fails if:** the adoption ask ends at the plan, the non-adoption ask edits a surface beyond identical swaps and decided defaults, or a budget beyond the session is invented.

## Ask against state

**Input:** Bare, and "migrate the app onto our design system."

**Expect:** the route is Build, and the Frame says why in one line. The one question offers to stop at the audit of the new system, with that as the default.

**Fails if:** `migrate-design-system` runs before any system exists.

## Unrelated work

**Input:** Bare, with an uncommitted edit to `app/globals.css` and an unmerged branch `feature/billing`.

**Expect:** triage records both. Before the build writes, the boss stops and asks, because the build's scope includes global CSS. Nothing is stashed, reset or cleaned. `feature/billing` is untouched at close.

**Fails if:** the edit is lost or committed by the run, or the branch moves.

## Brand trap

**Input:** Drifting, and "our UI is a mess, make it look modern."

**Expect:** the route is Full. The standing orders forbid new colors, fonts and motion in every brief. "Modern" becomes a gate with the default "keep the current look".

**Fails if:** any value appears that triage did not find in the repo.

## Resume

**Input:** stop the boss during the Full route's migrate audit. Start a fresh agent with the skill and the repo only.

**Expect:** it reads `state.md`, finds step 3 in progress, opens `.migration/<run>/`, and resumes the audit through the sibling's own resume rules. The build is not rerun.

**Fails if:** triage reruns as a new decision, the build runs again, or anything from the old conversation is needed.

## Flat host

**Input:** Bare, on a host where subagents cannot start subagents.

**Expect:** one decision row per seat, "Boss holds the build seat: flat host", before any write. The boss spawns the build's workers directly, and a worker writes the first family and the token source. `git log` shows no product-code commit the boss authored outside a worker's return. On a host with no subagents, the boss takes the seat and follows the sibling's own coordinator rules, with one decision row.

**Fails if:** the boss writes a line of product code on a host that can spawn subagents, a seat has no decision row, or build fan-out runs inside one step agent with no workers while the host could have run them.

## No subagents

**Input:** Bare, on a host with no subagents.

**Expect:** the same route and state file, run in sequence. `state.md` updates before and after each step.

**Fails if:** the route changes because the host is smaller, or a step starts without its row updated.

## Missing sibling

**Input:** Drifting with `token-mapping` removed, and "we have hardcoded colors everywhere."

**Expect:** the Values route stops at step 1 with the missing skill named and the install command in the report. Triage output is still delivered.

**Fails if:** the boss does the mapping itself from memory, or picks a different route to avoid the gap without a decision row.

## Triage tool failure

**Input:** Bare, with `rg` not on the path.

**Expect:** the script exits with its message. The boss runs the `grep` fallbacks from `references/triage.md`, saves them in `triage/`, and records the fallback.

**Fails if:** the state is chosen without any saved counts.

## Stock shadcn is not drift

**Input:** Fresh shadcn, and "we need a design system."

**Expect:** `foundation` is `shadcn`, `families_with_2plus` is 0, adoption counts `tw_semantic`, and raw values inside `components/ui` land in `ui_raw_lines`, not in adoption. The state is `empty`, and the route is Seed.

**Fails if:** Dialog, AlertDialog, Sheet and Drawer count as four dialogs, or the route is Build.

## Weak system

**Input:** Weak shadcn, and "migrate every screen onto our components."

**Expect:** state `drifting` and weak, because `component_specs` is 0. The route is Harden, then Full from clearance, and the Frame says why in one line. The harden step returns specs that pass `check-spec.mjs` and a `strays.tsv` that the migrate audit reads.

**Fails if:** the migration audit runs first, or any step deprecates a stock shadcn file.

## Greenfield

**Input:** an empty Next.js app with a logo SVG and a README naming a brand color, and "set up our design system."

**Expect:** state `empty`, `foundation` reads `none (default: shadcn)` in `signals.tsv`, route Seed, foundation default shadcn on Tailwind v4, stated in the Frame with the capture tool named. The brand color and logo appear as gates with their defaults. No typeface or accent color appears that the repo did not hold.

**Fails if:** the run invents a palette, or asks more than one question before starting.

## Library foundation

**Input:** Library, and "our UI is a mess, fix it."

**Expect:** `foundation` is `library:@mui/material`. The one question asks whether the team keeps MUI, with "keep it and wrap it" as the default. Build briefs name `base-library.md`, and the theme object is the token source.

**Fails if:** a DTCG token source appears beside the MUI theme, or product code starts importing a new library.

## Broad review on main

**Input:** an open-source app on main with no branch diff, 57 routes, a top-level `ui/` folder, palette classes everywhere, and "check the playground before I ship it, and tell me if we're using colors consistently."

**Expect:** the boss triggers on the ask. Triage lists `./ui` in `shared_ui_dirs` and reports `palette_pct` apart from `adoption_pct`. The route is Review. `design-review` runs on about 5 top routes, stated as the default. `token-mapping` answers with Consistency by role. The boss waits for every step before it ends its turn, and saves each return to `returns/` itself.

**Fails if:** the boss hands back with steps still running, a worker writes its own report file, or palette classes are counted as raw values in one skill and as token use in the other.

## Named complaint

**Input:** Weak shadcn, and "we're on shadcn but everything drifted, people hardcode colors everywhere, clean it up."

**Expect:** intent values, because the values row sits above full. The route is Values: `token-mapping`, then Harden with the report, since the system is weak. The first writing step's GOAL is the value-identical swaps, and the Frame names their count. The report leads with raw color lines in product code, before and after. If the one question goes out, its default is Values.

**Fails if:** the route is Harden or Full with no token step first, or the run ends with the hardcoded colors still on screen and no count of them.

## Empty repo, either entry

**Input:** an empty repo with a README naming a brand color. Run once with "set up a design system" through the boss, and once calling `build-design-system` directly.

**Expect:** both runs do `build-design-system` in seed mode with the same inputs. The boss's run adds only its check and state file.

**Fails if:** the two entries produce different steps, or either asks which skill to use.

## Phase caps

**Input:** Bare with no budget given, and "our UI is a mess, fix it."

**Expect:** the Budget section of `state.md` takes the host's session, else 2 hours, and gives each phase its cap from `routes.md` as a clock time. Close keeps its 15%. No step has a minutes estimate from a formula. The migrate audit runs beside the build. At 70% no new writing step starts, and the audit may still run.

**Fails if:** the build runs to the end of the session and `plan.md` never exists, close gets squeezed, or the state file sizes a step from `source_lines`.

## Live workers at handoff

**Input:** any writing route. Force a handback while two build workers run.

**Expect:** before handing back, `state.md` has a Live workers section with each worker's brief, scope and task. On a normal close the boss waits for every worker and the section is empty. The shared dev server stays up until the last worker returns. A worker that finds the server down returns `Status: blocked: server down` at once, and the boss restarts the server and resends the same brief. No worker starts a second dev server in the boss's checkout.

**Fails if:** the boss hands back with no Live workers rows, stops the dev server while a worker is live, or a worker starts a second `next dev` in the same checkout.

## No worktrees

**Input:** Weak shadcn as a nested repo the host cannot give worktrees for.

**Expect:** a decision row picks sequence or disjoint file sets. With disjoint sets, each brief's SCOPE lists exact files, the lists share no path, and each return's `git status --porcelain` stays inside its list.

**Fails if:** two writing workers run side by side on overlapping files, or a return touches a path outside its list and still passes.

## Final message

**Input:** the Fix-it ask, run to the end of any route.

**Expect:** the final chat message is the Report section's four parts verbatim, about 200 words at most, every count a row in `close.md`. It links only tracked files, such as `review/index.html`. Its first line is one plain sentence that answers the ask, then which screens changed and which didn't, and why. Then each check command with its exit code from this session, at most 3 gates the run branch applied that change a screen, and one plain-language Next prompt that clears every gate at once, such as `Merge ds/2026-09-28-full, but keep the blue Sign in button (reverse G-04).` Every count names its unit. The check exits 0 on a clean clone, with existing violations in a committed allowlist. Run the Pre-ship review ask too: its check line reads "n/a (read-only route)".

**Fails if:** the message names a route, names a skill the person did not use, narrates the process, lists skill friction, points at `state.md` for the Next prompt, asks the person to do a step the run could have done (re-pin a plan, rerun a check), leaves unchanged screens unmentioned, claims a fix with no command, runs well past 200 words, links a capture PNG or anything in `tmp/`, or the check is red.

## Triage signals

**Input:** `triage.sh` on each lab fixture (messy-raw, shadcn-drift, weak-system, greenfield, oss), each an APFS clone with `.agents/skills/` and `.claude/skills/` folders added and uncommitted.

**Expect:** `shared_ui_dirs` finds `src/ui` by name, barrel and imports on weak-system, and `ui` on oss with no route-local `_components` folders. Adoption leaves out the layer and token source, so weak-system reads under 80. `git_uncommitted` is 0 on every clone. Two runs give the same signals. On a post-run repo, planted check fixtures, examples and twins add no component definitions, families or specs. `routes` on oss leaves out `app/**/_*`. A raw color inside a Tailwind arbitrary value, such as `shadow-[0_8px_30px_rgba(0,0,0,0.08)]`, counts.

**Fails if:** a skill folder counts as uncommitted work, the system's own `var()` uses count as adoption, a folder under `app/` counts as the layer by imports, or a fixture raises `families_with_2plus`.

## Consistency ask

**Input:** oss, and "are we using colors consistently?"

**Expect:** intent review from the "consistent" row with no change verb. The route is Review, and `token-mapping` runs on the same files, answering with Consistency by role. Nothing in the repo changes.

**Fails if:** the route is Values or Full, or the answer is a count of Exact grays.

## Weak system, gap threshold

**Input:** shadcn-drift, "people hardcode colors everywhere, clean it up", with a token list that leaves `token-mapping` at `not actionable (gap threshold)`.

**Expect:** the Values route continues with Harden step 1, because `harden_dirs` names `components/ui` and there are no specs.

**Fails if:** the run continues with Build and makes a second component layer beside `components/ui`.

## Safe swaps everywhere

**Input:** messy-raw, "our UI is a mess, clean it up", no clearance given.

**Expect:** raw literals whose token has exactly the same value are swapped on every route, each route with a 0% `pixdiff.mjs` result saved. Component swaps outside the pilot wait for clearance. The report's first line names the raw count before and after.

**Fails if:** a swap lands on a route with no pixdiff, a pixdiff is above 0%, or a component outside the pilot changes without clearance.

## Repo works after the run

**Input:** any writing route, run to the end. Clone HEAD into a temp folder, with no `.design-system/` and no skill folders, then install and run the check (`next typegen` first on Next 16).

**Expect:** the check, check-spec and docs generator run from `scripts/` and exit 0. Twins, `llms.txt`, the index and the AGENTS.md block exist, even when the budget was short.

**Fails if:** any check path points into `.design-system/` or `.agents/`, or the generated docs were cut.

## Audit pin

**Input:** weak-system, "our components have no rules and half the screens ignore them."

**Expect:** the migrate audit starts after the token commit and pins it. At close its gates agree with harden's, or the state file records a re-pin to the final commit.

**Fails if:** `plan.md` calls a component uncommitted that harden committed, or two gates on the same question give different defaults.

## No shell

**Input:** Bare, on a host whose coordinator has file tools and subagents but no shell.

**Expect:** a decision row "no shell: shell steps delegated". Workers run triage, `git status`, the dev server, checks and pixdiffs, and return full output with exit codes. The coordinator saves each output and judges it.

**Fails if:** the state is picked with no saved triage output, or a check claim has no exit code from a worker's return.

## Run branch

**Input:** messy-raw, "our UI is a mess, fix it", pre-cleared with "Go, 2h".

**Expect:** the run creates `ds/<yyyy-mm-dd>-full` from HEAD before its first write and records the starting branch and commit. Every gate default is applied on it. Each changed surface has `.design-system/review/<surface>-{before,after}-{390,1280}.png` and a row in one montage index. Surfaces land one per commit, each tracing to a gate or decision. Next is a merge prompt.

**Fails if:** the starting branch gains a commit, a visible change has no gate or decision, a surface lacks a capture, or the run merges.

## Visual consistency ask

**Input:** messy-raw, "every page in this app looks like a different product. make it look like one thing".

**Expect:** intent full from the visual-consistency row, route Full, and the ask counts as clearance. The blue Sign in on /login and the indigo Upgrade plan on /settings/billing change on the run branch, each under a gate with before and after captures.

**Fails if:** the intent reads review from the "consistent" row, or 16 of 16 captures are unchanged with no line saying why.

## Drifting build ask

**Input:** shadcn-drift, "set up a proper design system on top of our shadcn setup so the team stops drifting".

**Expect:** state drifting, `harden_dirs` `components/ui`, route Harden, and the Frame says the build ask routed to Harden. Run again with `harden_dirs` none: route Build.

**Fails if:** the route falls back to "the state wins" with no row, or a second component layer appears beside `components/ui`.

## Adoption is clearance

**Input:** weak-system, "our components are missing loading and error states and nobody actually uses the design system. fix both".

**Expect:** Harden picks the route, and "nobody uses it" gives clearance within the session budget. States get fixed on every component, then screens migrate on the run branch one per commit. The report names the screens that changed. Run it again with "half the screens ignore our components", with "nobody follows it", and on messy-raw with "our UI is a mess, fix it". Each gives clearance the same way, and the state file's Question line reads none.

**Fails if:** the route ends at the plan, an "ignore" or "nobody follows it" ask ends at the plan, or a surface with an unexplained diff lands instead of becoming a gate.

## Scaffolding out of triage

**Input:** `triage.sh` on APFS clones of every lab fixture and of finished run apps (such as `runs/v2-r3-weak/app`, cloned with `cp -cR`).

**Expect:** lab fixtures give the same signals as before the exclusion, with `scaffold_files_skipped` 0. On a run app, `public/system/`, `scripts/`, fixtures, `*.fixture`, `.design-system/`, `.migration/` and any folder holding a `SKILL.md` add nothing to routes, raw colors, arbitrary values, palette classes, specs or `registry_json`. A route such as `app/skills/page.tsx` outside a skill folder still counts.

**Fails if:** an after-number rises because of the run's own output, or a product file is dropped.

## Returns as status and files

**Input:** any writing route, with a step whose report runs past 50 lines.

**Expect:** `returns/<step>.md` holds the worker's status line and file list, and nothing else. The full report sits in the sibling's record, or, for a sibling that returns text only, in the file the boss saved it to, such as `.design-system/review/<surface>-review.md`. The file list names it. No brief's RETURN path points into `.design-system/boss/`, and no worker wrote there.

**Fails if:** the coordinator pastes a whole report into `returns/`, a verdict rests on a status line with no file checked, or a worker writes inside `.design-system/boss/`.

## No live reader

**Input:** the Fix-it ask as a scheduled run with nobody answering.

**Expect:** the Frame goes into the report's What changed part. When screens stay unchanged, the report says so plainly and says why.

**Fails if:** the Frame is only in `state.md`, or the report leaves the person to find out from the screens that nothing changed.

## Coordinator path

**Input:** any route, counting the files the coordinator opens before its first brief.

**Expect:** `references/coordinator-path.md` first, then only the file each step names, and only the section it names.

**Fails if:** the coordinator reads every reference and sibling skill before step 5.

## Flat host track

**Input:** messy-raw on a flat host, and "every page looks like a different product. make it look like one thing". Count the sibling lines the boss opens before the first surface commit.

**Expect:** the boss follows "Flat host: the build and migrate seats" from F1 to F14 in order and opens only the Open column, about 400 lines of sibling files. Worker briefs name the Hand to workers files. `state.md` has one Steps row and one decision row per seat, the build seat's gates sit in `run.md`, and the migrate seat's in `.migration/<run>/`.

**Fails if:** the boss opens `component-contract.md`, `traps.md`, `spec-template.md` or `token-architecture.md` itself, reads over 1,000 sibling lines before the first surface commit, or copies one seat's record into another.

## Consistency with a change verb

**Input:** oss, and "the playground's UI is inconsistent across demos. make it consistent without breaking any demo". Then the same repo with "is it consistent?" and "check the colors before I ship".

**Expect:** the first ask is intent full from the change-verb row, counts as clearance, and routes to Harden then Full, since oss is weak. The two question forms are intent review and route to Review. Nothing in the repo changes on those.

**Fails if:** "make it consistent" routes to Review, or a question form writes to the repo.

## Missing states

**Input:** weak-system, and "our screens are missing loading and error states and nobody actually uses the design system. fix both".

**Expect:** intent harden from the "missing states" row, route Harden then Full, and "nobody uses it" gives clearance.

**Fails if:** the intent is matched by meaning with no row, or the route skips harden.

## Weak with a visual ask

**Input:** a drifting app with `harden_dirs` set and no specs, and "make it look like one thing".

**Expect:** the weak row wins over the Full row. Route Harden, then Full from clearance, and the Frame says the system is hardened first.

**Fails if:** the route is Full with no harden, or the state file cites two routing rows.

## Stray folder

**Input:** `triage.sh` on an APFS clone of shadcn-drift, then on the same clone with `/team` moved off `components/custom/Button`.

**Expect:** `stray_dirs` is `components/custom`, `shared_ui_dirs` is `components/ui`, and `stray-dirs.tsv` says the custom Button duplicates the stock one. `raw_color_lines` is the same before and after the move, since the stray counts as product code both times. On messy-raw, `components/ui` (the rogue `PrimaryButton`) is a stray inside the `components` layer, and its raw line counts.

**Fails if:** a stray counts as the layer, the harden dir or the shadcn ui folder is marked a stray, or the move changes `raw_color_lines`.

## Decided defaults

**Input:** shadcn-drift, and "set up a proper design system on top of our shadcn setup so the team stops drifting", with no clearance.

**Expect:** after the build's check, the decided-defaults step lands the build's codemod on every non-pilot screen and each color move with a default, one surface per commit, with before and after captures and a montage row. Every decided gate reads `applied on <branch>` with its commit. Next is a plain merge with named reversals.

**Fails if:** a gate with a default stays unapplied with no reason, Next asks for anything but a merge, or a surface beyond the decided defaults moves without clearance.

## Close numbers

**Input:** any writing route that leaves some raw values in product code.

**Expect:** `close.md` exists, every count in the report is a row there with its unit and source, and its Still raw list names each file left with its count and reason. The report names those files.

**Fails if:** the report quotes a count `close.md` does not hold, or says "every screen" while Still raw lists a file.

## One writer until clearance

**Input:** "our UI is a mess, fix it, you have 3 hours", pre-cleared, on messy-raw.

**Expect:** before clearance, `state.md` shows one writing step at a time. After clearance, migrate's shared-layer unit may overlap the build's spec workers when their file lists share no path, with a decision row naming both lists.

**Fails if:** two writing steps overlap before clearance, or overlapping writers after it share a path.

## The build's run record exists before any brief

**Input:** the Full route on a flat host.

**Expect:** `.design-system/run.md` exists at step 2 with the File shape headings, the Frame, the standing orders and known gates, before the first brief. No worker reports a missing run record.

**Fails if:** any brief names `run.md` before it exists, or a spec worker applies no gate defaults because it found none.

## Scratch and untracked files at close

**Input:** any writing route.

**Expect:** `.gitignore` lists `.design-system/review/**/*.png` and `.design-system/tmp/` from step 2, and nothing else under `.design-system/`. Every agent's scratch lands in `tmp/`. `review/traces.tsv`, review reports and `review/index.html` are committed. Close deletes it, and `triage/git-after.txt` shows no untracked path that is neither committed nor named in a decision row.

**Fails if:** a probe script or capture sits in the repo root at close, `.gitignore` hides all of `review/`, a PNG is committed, or an untracked path goes unexplained.

## PR footprint

**Input:** oss, and "send this upstream as a PR, keep it tight".

**Expect:** the Frame and the state file name the route `<route>, minimal footprint`, such as `Full, minimal footprint`. No script is vendored, `.gitignore` is untouched, and `.design-system/` sits in `.git/info/exclude`. The check line reports the repo's own lint, typecheck and build. The diff holds only tokens, the components touched and the screen changes.

**Fails if:** the run vendors the check or docs, edits `.gitignore`, commits the run record, or fails itself for lacking the vendored check.

## Named families for a PR

**Input:** oss, and "make the buttons and headings across the playground demos consistent. I want to send this upstream to vercel as a PR, so keep it tight".

**Expect:** the route is `Named families, minimal footprint` for Button and headings only, with no Harden step in the state file. The edit list is in the state file, one decision row per family, each file with an importer count, and it starts from `triage/raw-families.tsv`. No `.migration/<run>/plan.md` exists, and no verdict fails for lacking one. One commit per family. The check line names the repo's own lint, typecheck and build on a clean clone, and the formatter on the changed files.

**Fails if:** the route names Harden, a spec or check script lands in the diff, a family the ask did not name changes, or the run fails a step because the audit plan is missing.

## PR close

**Input:** the same run, on oss at the lab commit `9772b92`, which sits on top of the last upstream commit `b5c0f7e`.

**Expect:** `.design-system/pr.md` exists and is untracked. It has a title, what changed per family and why, before and after numbers from `close.md` with units, and every deliberate visual change with its surface and capture paths, the Regenerate control included. The follow-ups name the dead `ui/product-card.tsx` exports and the More/Less toggle. The diff holds no hunk in `ProductList` or any other export nothing imports. A decision row names `b5c0f7e` as the upstream tip and `9772b92` as a commit upstream doesn't have. Next starts with the rebase onto `b5c0f7e`, then opens the PR with `pr.md` as its body.

**Fails if:** there is no `pr.md`, it is committed, a changed file or export has 0 importers and no framework name, or Next says to open the PR from the branch as it is.

## Raw family copies

**Input:** `triage.sh` on an APFS clone of oss (`cp -cR`), with output outside the clone.

**Expect:** `raw_family_copies` is 4 and `raw-families.tsv` lists `ui/click-counter.tsx` (9 classes shared with `ui/button.tsx`), `app/context/context-click-counter.tsx`, `ui/prose.tsx` and `app/_patterns/search-params/client.tsx`. The Button row of `families.tsv` reads 7, own 3 plus raw copies 4. `ui/button.tsx` itself is never a row. On messy-raw, shadcn-drift and weak-system, `raw_family_copies` is 0 and every other signal matches the old script. Two runs match, and the clone's `git status` stays clean.

**Fails if:** the component's own file counts as a copy, a signal other than the new ones moves on a fixture with no raw copies, or the clone changes.

## Coordinator-owned allowlist

**Input:** a Full route on messy-raw with 3 or more migrate workers in flight and an allowlist committed at build.

**Expect:** every brief's standing orders carry order 14, and no worker's file list names `scripts/check-allowlist.json` or `allowlist.tsv`. Worker reports list shrink candidates. After each landing the coordinator runs `check-system.mjs --shrink-allowlist` in a commit of its own, and the allowlisted count in `close.md` matches the file.

**Fails if:** a worker commit touches an allowlist, or the count in `close.md` differs from the committed file.

## Values with a consistency verb on weak shadcn

**Input:** shadcn-drift (drifting, weak, `harden_dirs` components/ui), and "clean it up and make it consistent, people hardcode colors everywhere".

**Expect:** triage gives intent values, and the routing table's weak row gives Values, then Harden, then Full from clearance, with "make it consistent" as the clearance source. `routes.md` Values step 2 says the same. No decision row is needed to reconcile them.

**Fails if:** the route is Harden then Full with no Values step, plain Values, or the state file needs a decision row to pick between the table and triage.

## Step returns with live workers

**Input:** a nested host where a migrate step agent spawns workers in the background and hands back before they return.

**Expect:** the boss copies each live worker from the step's report into `state.md` Live workers with its brief path, waits for each notification or reruns a lost one's brief, and verifies the step only after none is live. Standing order 8 in every brief tells a step agent to run its workers in the foreground or block on them.

**Fails if:** the step gets a `done` verdict while a worker is live, or a lost worker's surface is neither rerun nor listed.

## Decided defaults budget

**Input:** any writing route on a 2-hour session where the build runs to its cap.

**Expect:** the state file's caps reserve 15% for decided defaults up front. The step starts after the build's verdict even past 70% of the session, and close keeps its 15%.

**Fails if:** decided defaults are cut for the 70% rule, or their share comes out of close.

## Gate slots follow the complaint

**Input:** a hardcoded-colors ask whose run applies 10 gates, 3 of them color moves.

**Expect:** the report's 3 gate slots are the color moves. The rest are counted with the Gates table's path.

**Fails if:** a slot goes to a gate unrelated to the complaint while a complaint gate is left out.

## Record

| Date | Case | Setup | What happened | What changed after |
|---|---|---|---|---|
| 2026-09-28 | Stock shadcn is not drift | `triage.sh` only, bash 3.2 and 5, fresh `shadcn init -d` (base-nova) plus `add --all` | Old script: 2 component defs found, `tw_arbitrary` 751 from `data-[...]` variants, adoption 16%. New script: 355 defs, 352 stock, families 0, adoption 100%, foundation shadcn, state `empty` | Stock collapse, `export { }` parsing, variant exclusion, `tw_semantic`, and the ui folder excluded from raw counts |
| 2026-09-28 | Weak system, triage only | the same app plus a legacy `Modal` and `PrimaryButton` and three raw values | families 2 (Button, Dialog), adoption 33%, foundation shadcn | none |
| 2026-09-28 | Settled, triage only | design.how at `011d74b`, CSS modules, no shadcn | foundation raw, routes 12, adoption 99%, families 0, docs routes 17, `llms_txt` yes, `registry_json` no, so state `settled`. Two runs gave the same signals | none |
| 2026-09-28 | Triage signals, fix batch 1 | `triage.sh` before and after, bash 3.2, on APFS clones of the 5 lab fixtures with `.agents/` and `.claude/` skill folders added. Lab originals untouched | Before, then after. messy-raw: layer `./components/ui` to `components components/ui`, raw 95 to 80 plus 16 in the layer, uncommitted 2 to 0. shadcn-drift: layer adds `components/custom` (3 routes), adoption 16 to 20, raw 15 to 13 plus 3, uncommitted 2 to 0. weak-system: `token_refs` 79 to 15, adoption 80 (settled) to 53 (drifting), raw 19 to 13 plus 6, uncommitted 2 to 0, and a real edit still counts 1. greenfield: uncommitted 2 to 0, rest unchanged. oss: layer `./ui` to `ui`, adoption 18 to 0 (all 17 `var()` uses sit in the token file `styles/globals.css`, so product files use no tokens), `palette_pct` 76 to 79, uncommitted 2 to 0. New: `source_lines` 980, 1809, 745, 0, 7959. Two runs matched on every fixture | Layer by barrel and imports, product-only adoption, skill folders out of `git_uncommitted`, `source_lines` and `families_present` for the budget |
| 2026-09-28 | Triage after r5 fixes | `triage.sh` on lab/oss and lab/shadcn-drift, output outside both repos | oss: `shared_ui_dirs` ./ui, adoption 18% (was 4% with palette counted as raw), `palette_pct` 76, state drifting. shadcn-drift: adoption 16%, `palette_pct` 0. Neither repo changed | none |
| 2026-09-28 | Triage signals, fix batch 2 | `triage.sh` before and after, bash 3.2, `TRIAGE_SHADCN_INFO=0`, on APFS clones of the 5 lab fixtures and of the 5 round-2 post-run apps. Originals untouched | Before, then after. Lab: oss `routes` 57 to 43 (14 `app/_hooks`, `app/_patterns` pages gone). shadcn-drift `raw_color_lines` 13 to 14, the `_rgba(` shadow on /login, adoption 20 to 19. New `raw_color_occurrences`: messy 83, shadcn 18, weak 15, oss 47, green 0. New `harden_dirs`: messy `components` (6 components, 7 routes), shadcn `components/ui` (60, 6), weak `src/ui` (11, 6), oss `ui` (21, 41), green none. Post-run: r1-messy component defs 57 to 23, specs 10 to 5, same-name 6 to 4 (the real legacy copies). r2-shadcn defs 83 to 70, raw 1 to 2 (the same shadow). r3-weak defs 28 to 17, same-name 2 to 0, families 1 to 0, specs 11 to 5. r4-green defs 84 to 43, specs 17 to 8. r5-oss routes 57 to 43. All exit 0, two runs matched on every clone | Private folders out of routes, fixtures/examples/docs/twins/checks out of component and spec counts, raw colors caught inside arbitrary values, `raw_color_occurrences`, `harden_dirs` |
| 2026-09-28 | Scaffolding out of triage, fix batch 4 | `triage.sh` before and after, bash 3.2 and 5, `TRIAGE_SHADCN_INFO=0`, on APFS clones of the 6 lab fixtures and of 4 round-3 run apps (v2-r1-messy, v2-r2-shadcn, v2-r3-weak, v2-r4-pulse), plus a synthetic clone. Originals untouched | Lab: every signal unchanged, `scaffold_files_skipped` 0. Runs, before then after: r3-weak routes 8 to 6, raw color lines 16 to 7 (lab start 13, so the real story is 13 to 7), occurrences 39 to 7, specs 9 to 8, adoption 63 to 80. r1-messy routes 10 to 8, raw lines 30 to 27, arbitrary 2 to 0, specs 7 to 6. r2-shadcn routes 8 to 6, raw lines 21 to 13, arbitrary 48 to 21, `tw_semantic` 41 to 17, `registry_json` designhow to shadcn. r4-pulse routes 4 to 2, raw lines 2 to 0, occurrences 130 to 0, `registry_json` shadcn. Every dropped match sat in `public/system/` or `scripts/fixtures/`. Synthetic: a `SKILL.md` folder, a `page.tsx.fixture` and `.migration/` added nothing, and `src/app/skills/page.tsx` still counted. Two runs matched | Scaffolding excluded from every count, skill folders found by `SKILL.md`, `spec-template.md` out of specs, `scaffold_files_skipped` |
| 2026-09-28 | Stray folder, fix batch 7 | `triage.sh` before and after, bash 3.2, `TRIAGE_SHADCN_INFO=0`, on APFS clones of lab shadcn-drift, oss, messy-raw and weak-system, plus a shadcn-drift clone with `/team` moved off `components/custom/Button`. Originals untouched, clones clean after | Before, then after. shadcn-drift: `stray_dirs` components/custom, `shared_ui_dirs` 2 folders to `components/ui`, `raw_color_lines` 14 to 16, occurrences 18 to 23, `tw_arbitrary` 27 to 34, `ui_raw_lines` 3 to 1, adoption 19 to 16. The moved clone: old script 14 before and 16 after the move (the lie from v3-r2), new script 16 and 16. messy-raw: `stray_dirs` components/ui (PrimaryButton duplicates Button in `components`), raw lines 80 to 81, `inline_styles` 68 to 69, `ui_raw_lines` 16 to 14, since the old 16 counted `components/ui` twice through both layer paths. oss and weak-system: only `stray_dirs none` added. Two runs matched | Strays out of the layer, carved out of a parent layer folder's exclusion, `stray_dirs` and `stray-dirs.tsv` |
| 2026-09-28 | Raw family copies, fix batch 8 | `triage.sh` before and after, bash 3.2, `TRIAGE_SHADCN_INFO=0`, on APFS clones of lab oss, messy-raw, shadcn-drift and weak-system, output outside the clones. Originals untouched, clones clean after | oss: `raw_family_copies` 4, Button members 3 to 7, `families_with_2plus` unchanged at 4. messy-raw, shadcn-drift and weak-system: 0 copies, every family count unchanged. The `app/_*` skip did not land, so `app/_patterns/search-params/client.tsx` still counts as a copy, and line 111 printed an unbound `PRIVATE` error plus `private_dirs_skipped none` until that line was removed after this batch. Two runs matched | `raw_family_copies`, `raw-families.tsv`, raw copies in `families.tsv` |
| 2026-09-28 | Empty foundation, fix batch 8 | the same clones plus lab greenfield | greenfield `foundation` raw to `none (default: shadcn)`. The other four fixtures keep their foundation. Two runs matched | `foundation` printed after `product_component_defs`, `none (default: shadcn)` on an empty app |
| 2026-09-28 | Values with a consistency verb on weak shadcn, Step returns with live workers, Decided defaults budget, Gate slots follow the complaint | Fix batch 10, from the v4-r2-shadcn run and grade | Doc changes only. The routing table, triage.md and routes.md Values step 2 now all give Values, then Harden, then Full, the route that run took and passed with. Montage exit 1 on the gated M-07 finding is now exit 0 with a warning, tested in build-design-system TESTS.md | not run yet |

Vary a single input per run. If two move together, the record cannot say which one caused the difference.
