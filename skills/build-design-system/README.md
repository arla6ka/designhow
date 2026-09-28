# build-design-system

Turns an app's existing UI into a design system that people and agents can use. It inventories the real routes, components and values with scripts, captures screenshots before touching anything, and builds semantic tokens in DTCG JSON that generate CSS variables and Tailwind v4 `@theme`. It consolidates duplicate components into canonical ones, documents each on a page with live examples and a Markdown twin, lists everything in `llms.txt` and a registry, and adds checks that fail on raw values and deprecated imports. It proves the result on one real flow and hands the rest of the app to `migrate-design-system` with a readiness report.

It uses three sibling skills: `token-mapping` to fold existing values into the new tokens, `component-docs` for each component page, and `design-review` for the pilot. Install all four together.

## Use as-is

Run `npx skills add arla6ka/designhow` to install it with its sibling skills. To install by hand, copy the folder to `.agents/skills/build-design-system/` in your repo. Codex and Cursor read that path directly. For Claude Code, link or copy it into `.claude/skills/`. Then ask your agent to build a design system for the app. A loose request is fine. The skill finds the run command, picks a pilot and a budget, states them in one message and starts reading the repo while you check them. Name a pilot flow or a budget if you have one in mind.

It works on any web stack it can read and run. It assumes file access, a shell, and a command that starts the app. A browser for screenshots and the ability to start subagents are optional. Without a browser, the run stops before the pilot.

## Replace first

1. The page list and URL root in `references/system-structure.md`. It follows Vercel's Geist (https://vercel.com/geist/introduction). Drop foundations and pages your app does not need. Keep the nine component page sections and their order, because `component-docs` and `migrate-design-system` read them.
2. The token naming groups in `references/token-architecture.md`, if your team already has a vocabulary. Keep the layer rules.
3. The inventory commands in `references/inventory.md`, for your folders, file types and router.
4. The canonical-pick order and accessibility floor in `references/component-contract.md`, to match your behavior library and test runner.
5. A precedence rule in AGENTS.md or CLAUDE.md for tokens that live in two places. Without one, each conflict becomes a gate.
6. Tolerances in `token-mapping`'s rules file. This skill merges values inside them without asking.

## Invariants

Keep these unless your situation really differs.

- Screenshots before the first edit. Without them, nobody can tell an intended change from a regression, and the pilot proves nothing.
- Scripts count, the model judges. Counts read by eye miss re-exports and aliases, and the handoff needs the same scripts rerun.
- No new visual direction. The system describes the app you have. Brand and taste changes are gates for a person.
- Gates with defaults, not questions that stop work. A run that waits on a naming answer for a day produces nothing.
- One writer per shared file. The token source, registry, barrel and migration map belong to the coordinator. Workers report requests.
- Generated docs. A hand-written twin drifts on the first change, and agents trust it anyway.
- One page skeleton for every component. Agents learn where Props and States sit once, and the docs check can test it.
- Every check is seen failing once. A check that never failed may not check anything.
- One pilot, then hand off. Migrating the whole app is a separate job with its own coordination.

## Why it is invocable by the model

The frontmatter does not set `disable-model-invocation`, so an agent can pick this skill when a request matches. That is safe because the first two phases only read the repo and write into `.design-system/`, the one destructive step (deleting unused code) runs through a validated plan, and the codemod never runs past the pilot. `migrate-design-system` is also model-invocable, so the handoff can start it, and it guards cost in its own procedure.

## Optional tools

- A headless browser, such as Playwright, for baseline and pilot screenshots. Without one, the run stops before the pilot and reports code-complete, not runtime-verified.
- `ast-grep` for component definitions and inline styles. Without it, the `rg` fallbacks work and miss a few forms.
- Subagents, background tasks or separate agent sessions on their own branches, for phase 4. Without them, the same briefs run one after another.
- A second model for reviewing worker output where judgment matters, such as accessibility and API shape.

## Check after changing

Run `TESTS.md`. At minimum, run the Missing required input case to confirm it stops before the pilot without a way to run the app, the Enforcement case to confirm a seeded violation fails, and the Scope creep case to confirm the codemod stays inside the pilot. Then run the Vague request case, and read one generated component twin against its page to confirm the headings match.

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
