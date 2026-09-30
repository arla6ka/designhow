# Testing the design.how skills

Every skill's `TESTS.md` holds cases run by hand. This page holds what they share.

## How to run a case

Run the same task twice on the same practice repo, at the same commit, with the same prompt: once with the skill off and once with it on. Stop after the phase or step the case tests. Keep practice repos in git so every run starts from the same commit, and change one thing between runs, so a difference has one cause.

## Setup under test

A result only means something next to the setup that produced it. Record before every run:

- The skill's files, unedited or with your changes named, and its scripts with fixtures
- Sibling skills installed, with versions or commits, and any missing
- Project instructions loaded (AGENTS.md, CLAUDE.md or none), and any precedence rule they hold
- Host: subagents, nesting, worktrees, a browser tool and a shell, each yes or no, and the memory pressure reading at the start
- Whether a person answered during the run, or it ran unattended on its defaults
- Repo, commit, and whether `git status` was clean
- The model for the coordinator, and for workers if different

Each `TESTS.md` adds the items only it needs.

## Phrasing the ask

Word each prompt the way a colleague would. Leave out "test", "eval" and "rubric", because a model that knows it is being checked behaves differently. Judge from the artifacts and the transcript (which files it read, which commands it ran), never from the model's summary of its own work.

## Baseline

Fill a table like this for the cases a `TESTS.md` names in its Baseline section, skill-off column first:

| Case | What happened with no skill | What happened with the skill |
|---|---|---|
| Normal | | |

## Scripts

A skill with scripts proves them with `--self-test` from its own folder. Each run ends with "all as expected". The cases never restate what a self-test covers.
