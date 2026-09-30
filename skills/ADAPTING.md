# Adapting the design.how skills

Give an agent the prompt below with the skill's folder attached, plus the sibling folders it calls and, for `component-docs`, one entry your team published. Replace `<skill>` and `<topics>` with the skill's name and the topics its README lists.

```
I want to fit the attached <skill> skill to our codebase and team.

Interview me, one question per message. Cover:
<topics>

Rules for you while we do this:
- Leave the procedure, stop rules, gates, one-writer rules and final checks
  alone unless an answer of mine contradicts one.
- Use only names, paths and commands I give you or that you read in our repo.
  Mark anything I can't answer UNDECIDED. Never fill a gap with a guess.
- If a default value no longer fits an answer, propose a replacement for me
  to approve.

When the interview ends, split your proposed edits into two lists. First,
changes to what the skill does, checks, stops on or hands to a person.
Second, changes to paths, names, thresholds and wording only. Show both and
edit nothing until I say go.
```

## Topics per skill

Each README repeats its own list. They are collected here so a team adapting several skills asks each question once.

- `build-design-system`: where shared UI lives, with the framework, styling method and router; any token file or theme config other tools read; the docs site and URL shape; the words for token roles and variants; the behavior library and test runner; viewports and themes; the screens you consider the app's best; which token source wins; who confirms gates.
- `design-system-boss`: how the team describes design system work, so the intent table matches; what adoption counts as settled and how many duplicate families it tolerates; where tokens, components and docs live, so `triage.sh` searches the right folders; how much time and how many agents a run may use; who clears a migration and how fast; what the agent host can do.
- `migrate-design-system`: where the system lives, its version and owner; the app's structure and what a surface is; what counts as legacy and which raw values may stay; which files never go to a worker; how the app and tests run in CI, with widths and themes; exact or mapped migration; the agent platform and how many agents at once; who answers gates.
- `token-mapping`: where tokens live and in what format; categories; base unit and tolerances; modes; the gap threshold; which token source wins; agreed exceptions.
- `component-docs`: headings and what goes under each; the words for variants, states and parts; which missing inputs end a run; where code, stories and specs live; which source wins for tokens, variants and behavior. Swap the Toast example for your published entry, at its length.
- `ui-review`: which criteria to keep, drop or replace; severity levels; topics left to other checks; the form work arrives in; supported widths; where finished reviews go.
