# design-system-boss

One entry skill for the other five. Say something vague, like "our UI is a mess, fix it", and it runs a triage script over the repo. The script works out the foundation (shadcn, a package library, the team's own package, or hand-rolled code), whether a system exists, whether it has specs, and whether the code follows it. Then the boss picks a route: seed a new system, build one from the app, harden a weak one, migrate, map values, document, review or audit. It runs each step through the sibling skill that owns it, with subagents where the host has them, and keeps one state file a new session can resume from. It ends with a report built from files, and its final message is that report: one sentence that answers the ask with numbers, which screens changed and which didn't, each check with its exit code, at most three gates, and the one next step as a prompt, usually a merge.

It never writes product code when it can spawn subagents, never invents brand values, never commits to the branch it started on, and never lets a migration edit code without clearance, which an adoption ask like "nobody uses our components" gives.

## Use as-is

Install it with its siblings: `npx skills add arla6ka/designhow`. By hand, copy the folder next to the other five in `.agents/skills/`, or `.claude/skills/` for Claude Code. Then say what you want in your own words. The boss reads the repo before it asks anything, and it asks at most one question.

Agents often skip an installed skill when the ask does not name it. If yours do, add load conditions to AGENTS.md that name the work, not the skill's topic:

```markdown
Load the design-system-boss skill before you: build, harden or document a design system; move
screens onto shared components; replace hardcoded colors or spacing across more than one file;
or answer "how consistent is our UI".
```

It needs file access, a shell and `rg` (ripgrep). A browser and subagents are optional, and routes that need screenshots stop and say so without one.

## Replace first

1. The state thresholds in `references/triage.md`. Adoption under 80% means drifting, two duplicate families means drifting, and two routes with five components means a new app. Measure your own app before trusting them.
2. The intent words in `references/triage.md`, if your team says "tokenize" where the table says "use our tokens".
3. The search globs in `scripts/triage.sh`, for your folders and file types, and its list of stock shadcn file names if your registry adds its own.
4. The phase caps in `references/routes.md`, once a few runs tell you where the time goes on your app.
5. Project rules for the standing orders, in AGENTS.md or CLAUDE.md. The boss passes them into every brief.

## Invariants

Keep these unless your setup really differs.

- Triage by script. A route chosen from the prompt's wording alone sends a "fix it" ask to whichever skill's description sounded closest.
- One question, with a default. A run that waits on three answers produces nothing.
- The boss never writes product code when it can spawn subagents. When it starts editing, it stops reading returns, and every step behind it waits. On a host without subagents, the boss takes a sibling's seat and follows that sibling's own coordinator rules, recorded as one decision row. A sibling run directly follows its own rule.
- No worker outlives the boss. A worker left running keeps writing into a repo nobody checks.
- One writing step at a time. Build and migrate touching the same files at once produce two versions of each.
- Every writing run works on its own branch, `ds/<yyyy-mm-dd>-<route>`, and merging it is the person's call. Every decided gate default lands there with captures, so the next step is a merge. Migration beyond those defaults needs clearance: a budget from a person, or an ask that is itself about adoption.
- Verdicts from files. A sibling's summary is a claim until its check command runs again.
- One state file, one writer. The boss's context will be lost, and the next agent has only the file.

## Why it is invocable by the model

The frontmatter does not set `disable-model-invocation`, because the asks it serves are vague and never name a skill. That is safe because triage only reads, the route's first writing step starts after the Frame message, every write lands on a run branch that only the person merges, and the most expensive step waits for clearance.

## Optional tools

- Subagents with their own worktrees. Without them, every step runs in sequence and the artifacts are the same.
- A browser for screenshots. Without one, the build stops before its pilot and review steps are skipped with that reason.
- A second model family for checking judgment-heavy returns, such as accessibility calls in a review.

## Check after changing

Run `TESTS.md`. At minimum, run Vague build ask to confirm triage comes first, Migration clearance to confirm no editing starts without a reply, and Unrelated work to confirm a dirty tree is left alone. Then run `scripts/triage.sh` on your own repo twice and confirm the output does not change. If you use shadcn, also run it on a fresh `npx shadcn@latest init -d` with `add --all`, and confirm `families_with_2plus` is 0.

## Adapt this skill

Give an agent the prompt below with this folder and the five sibling folders attached.

```
I want to fit the attached design-system-boss skill to our repo and team.

Interview me, one question per message. Cover:
- how we'd describe design system work in our own words, so the intent table matches us
- what adoption level we'd call "settled", and how many duplicate component families we'd tolerate
- where our tokens, shared components and docs live, so triage.sh searches the right folders
- how much time and how many agents a normal run may use
- who clears a migration, and how fast they usually reply
- what our agent host can do: subagents, nested subagents, worktrees, a browser

Rules for you while we do this:
- Leave the routing table's order, the one-question rule, the clearance step and the
  never list alone unless an answer of mine contradicts one.
- Use only names, paths and commands I give you or that you read in our repo.
  Mark anything I can't answer UNDECIDED.

When the interview ends, split your proposed edits into two lists. First, changes to
what the skill routes, stops on or hands to a person. Second, changes to paths, words
and thresholds only. Show both and edit nothing until I say go.
```
