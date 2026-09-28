# build-design-system

Turns an app's UI into a design system that people and agents can use. It has three modes. Build extracts a system from an app that has none. Harden takes components that exist without states or rules and fills them in. Seed starts a system for a new app from brand material or shadcn defaults. Each mode reads a base reference for the app's foundation: shadcn, a package library such as MUI, the team's own package, or hand-rolled code.

It inventories the real routes, components and values with scripts and captures every screen before touching anything. It then writes semantic tokens (DTCG JSON on hand-rolled apps, shadcn's CSS variable pairs on shadcn), picks one canonical component per family with a spec answered from the app's own evidence, and generates docs with Markdown twins and `llms.txt`. The check it copies into the repo keeps the system enforced after the run, and `references/checks.md` lists its rules. Everything lands on a run branch, `ds/<date>-<route>`, one surface per commit with before and after captures, and the merge is yours.

It uses three sibling skills: `token-mapping` to fold existing values into the new tokens, `component-docs` for each component page, and `design-review` for the pilot. Install all four together.

## Use as-is

Run `npx skills add arla6ka/designhow` to install it with its sibling skills. To install by hand, copy the folder to `.agents/skills/build-design-system/` in your repo. Codex and Cursor read that path directly. For Claude Code, link or copy it into `.claude/skills/`. Then ask your agent for one phase, such as "extract tokens from the app" or "add states and specs to our components". A whole-app ask like "set up a design system" goes to `design-system-boss` when it is installed, which calls this skill. A loose request is fine. The skill finds the run command, picks a pilot and a budget, states them in one message and starts reading the repo while you check them. Name a pilot flow or a budget if you have one in mind.

It works on any web stack it can read and run, and its specs are framework-agnostic, though the examples and the JSX rules are React. It assumes file access, a shell, Node 18 or later for the scripts, and a command that starts the app. A browser for screenshots and the ability to start subagents are optional. Without a browser, the run stops before the pilot.

## Replace first

1. The page list and URL root in `references/system-structure.md`. It follows Vercel's Geist (https://vercel.com/geist/introduction). Drop foundations and pages your app does not need. Keep the nine component page sections and their order, because `component-docs` and `migrate-design-system` read them.
2. The token naming groups in `references/token-architecture.md`, if your team already has a vocabulary. Keep the layer rules.
3. The inventory commands in `references/inventory.md`, for your folders, file types and router.
4. The canonical-pick order and accessibility floor in `references/component-contract.md`, to match your behavior library and test runner.
5. The base reference for your foundation (`references/base-shadcn.md`, `base-library.md`, `base-raw.md`), with your registry namespace, theme file and wrapper folder.
6. The worked spec in `references/spec-example-combobox.md`, with one of your own once it passes the check. Add your team's behavior traps to `references/traps.md`.
7. A precedence rule in AGENTS.md or CLAUDE.md for tokens that live in two places. Without one, each conflict becomes a gate.
8. Tolerances in `token-mapping`'s rules file. This skill merges values inside them without asking.
9. The rules in `references/checks.md` and `scripts/check-system.mjs`, for your lint setup and ui folder. Keep the drift-list hashes, the allowlist and a fixture pair per rule.

## Invariants

Keep these unless your situation really differs.

- Screenshots before the first edit. Without them, nobody can tell an intended change from a regression, and the pilot proves nothing.
- Scripts count, the model judges. Counts read by eye miss re-exports and aliases, and the handoff needs the same scripts rerun.
- No new visual direction. The system describes the app you have. Brand and taste changes are gates for a person.
- Gates with defaults, not questions that stop work. A run that waits on a naming answer for a day produces nothing.
- One writer per shared file. The token source, registry, barrel and migration map belong to the coordinator. Workers report requests.
- Generated docs. A hand-written twin drifts on the first change, and agents trust it anyway.
- The repo works after the run. Scripts, config, allowlist, specs and docs live in the repo. A check that reads from `.design-system/` or a skill folder breaks the day either is gone.
- One page skeleton for every component. Agents learn where Props and States sit once, and the docs check can test it.
- Specs answered from the app. A spec copied from a reference system describes someone else's product, and the rules it carries are their taste.
- The foundation's files stay the foundation's. A generator that owns shadcn's CSS variables, or a rewrite of a stock component, breaks the next upstream update.
- Every check is seen failing once, and the full check exits 0 at handoff. A check that never failed may not check anything, and a red one teaches every later agent to ignore it.
- One pilot, then only cleared surfaces, one per commit, on the run branch. Nothing lands on your branch until you merge, and an unexplained diff becomes a gate instead of a commit.

## Why it is invocable by the model

The frontmatter does not set `disable-model-invocation`, so an agent can pick this skill when a request matches. That is safe because the first two phases only read the repo and write into `.design-system/` and the copied `scripts/`, the one destructive step (deleting unused code) runs through a validated plan, every write lands on a run branch the person merges or drops, and the codemod runs only on the pilot and cleared surfaces. `migrate-design-system` is also model-invocable, so the handoff can start it, and it guards cost in its own procedure.

## Optional tools

- Playwright for captures (`scripts/capture.mjs`, every route, width, theme and state in one command) and agent-browser for one-off evidence (`references/browser.md`). `scripts/pixdiff.mjs` compares two saved screenshots. Both find a Chromium on their own: Playwright's download, any cached one, then the system Chrome. `scripts/check-docs-leak.mjs` uses either and skips with a message when neither exists. Without a browser, the run stops before the pilot and reports code-complete, not runtime-verified.
- `ast-grep` for component definitions and inline styles. Without it, the `rg` fallbacks work and miss a few forms.
- Subagents, background tasks or separate agent sessions on their own branches, for phase 4. Without them, the same briefs run one after another.
- A second model for reviewing worker output where judgment matters, such as accessibility and API shape.

## Check after changing

Run `node scripts/check-system.mjs --self-test` from the skill folder, then `TESTS.md`. At minimum, run the Missing required input case to confirm it stops before the pilot without a way to run the app, the Enforcement case to confirm a seeded violation fails, and the Scope creep case to confirm the codemod stays inside the pilot. Then run the Vague request case, and read one generated component twin against its page to confirm the headings match.

## Adapt this skill

Give an agent the prompt below with the whole skill folder attached.

```
I want to fit the attached build-design-system skill to our codebase and team.

Interview me, one question per message. Cover:
- where our shared UI lives now, and our framework, styling method and router
- whether we already have a token file or theme config other tools read
- our docs site, if any, and the URL shape we want for the system pages
- the words we use for token roles and component variants
- our behavior library and test runner, if any
- which viewports and themes we ship
- which source wins when two token files disagree, and why
- who confirms gates, and how quickly

Rules for you while we do this:
- Leave the phases, the stop rules, the gate rule and the final checks alone
  unless an answer of mine contradicts one.
- Only use names, paths and commands I give you or that you read in our repo.
  Anything I can't answer gets marked UNDECIDED.

When the interview ends, split your proposed edits into two lists. First, changes
to what the skill does, stops on, gates or hands to a person. Second, changes to
paths, names and wording only. Show both and edit nothing until I say go.
```
