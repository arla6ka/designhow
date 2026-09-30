# Running it on your platform

Agent tools change often, so confirm names and flags against current docs before a long run.

The pattern needs four things from a platform: start an agent with a brief, give that agent its own checkout, tell the coordinator when the agent finishes, and let the coordinator read what the agent returned. Everything else lives in the run folder, so it works the same everywhere. Messaging a running agent is optional. Without it, an amendment waits for the retry (`references/orchestration.md`, Liveness).

## Worktrees

Give each worker its own git worktree on its own branch, created from the commit in its brief.

```sh
git worktree add ../app-wt/<surface> -b migrate/<surface> <base sha>
# after the surface lands
git worktree remove ../app-wt/<surface>
```

Install dependencies once per worktree. A package manager with a shared store keeps that fast. Only the coordinator starts the shared dev server and browser (`build-design-system/references/coordinator-path.md`, Dev server and retries). A worker in its own worktree falls back to its own server on the base port plus its number, so two fallbacks never capture each other's pages.

### No worktree isolation

Some hosts isolate only the session's primary repo, or nothing. Then run the surfaces in sequence, one worker at a time. Or fan out only surfaces whose MAY EDIT globs share no file, on one branch, with git forbidden in the brief. The coordinator commits each surface after its verdict, staging only that surface's `paths` from `queue.tsv` with `git add -- <paths>`, one commit per surface, even when several verdicts arrive in one drain. A worker there that finds the shared server down returns `blocked: server down` and starts nothing. Record which mode in `frame.md`. Never run two workers on overlapping paths in one checkout.

## Claude Code

- **Coordinator.** The main session.
- **Workers.** Subagents started in the background, or in the foreground when this skill runs as a step agent (`references/orchestration.md`, The rolling window). Define a `migration-worker` agent in `.claude/agents/` with `isolation: worktree` and only the tools it needs. The brief is the prompt, and it must stand alone, since subagents do not see the parent conversation.
- **Verifier.** A second agent definition. For a different model family, run the verifier through another vendor's CLI from a shell step.
- **Agent teams.** An experimental mode gives a lead a shared task list and teammates. It suits a small window. Put the scope check in a task-completion hook so a teammate cannot mark a task done with an out-of-scope diff.
- **Headless loop.** `claude -p "$(cat brief.md)"` inside each worktree, with an allowed-tools list, driven by the script loop below. Tune the brief on the pilot and the first wave before running the full list.

## Codex

- **Coordinator.** A Codex CLI session in the main checkout. Repo instructions come from AGENTS.md, and skills from `.agents/skills/`.
- **Workers.** `codex exec` with the brief as the prompt, one per worktree, from the script loop below. Or cloud tasks, each in its own container, returning a diff. The coordinator saves each final message's status line and file list as the inbox file.
- **Verifier.** Another model family, through its own CLI, from the same loop.

## Cursor

- **Coordinator.** A local agent chat in the main checkout.
- **Workers.** Cloud agents, each on its own branch and machine, each returning a branch or pull request. Set up the environment first, dependencies, fixtures and the capture browser included, because a worker in a broken environment produces confident, unverifiable work.
- **Run folder.** Cloud workers cannot read it. Paste every input into the brief, save each return's status line and file list as the inbox file, and reattach work by branch name after a restart.
- **Verifier.** A cloud agent on a different model from the worker, briefed from `references/verification.md`.

## Plain script loop

Any agent with a headless mode fits this. The script handles the window, and the coordinator handles drains and briefs.

```sh
#!/usr/bin/env bash
# run-window.sh <run> <list> <cap> <run-branch>: one worker per surface in <list>, at most <cap> at once
set -euo pipefail
RUN=$1; LIST=$2; CAP=${3:?pass the cap from frame.md}; BRANCH=$4
export RUN BRANCH
xargs -P "$CAP" -I{} bash -c '
  s={}
  n=$(ls "$RUN/briefs/$s".*.md | wc -l | tr -d " ")
  wt=../app-wt/$s
  [ -d "$wt" ] || git worktree add "$wt" -b "migrate/$s" "$(git rev-parse "$BRANCH")"
  out="$RUN/inbox/$s.$n.captures"; mkdir -p "$out"
  (cd "$wt" && your-agent-cli "$(cat "$RUN/briefs/$s.$n.md")" > "$RUN/inbox/$s.$n.stdout.txt" 2> "$RUN/inbox/$s.$n.log") || true
  sed -n "/^Status:/p;/^Commit:/p;/^Branch:/p;/^## Files changed/,/^## Captures/p" "$RUN/inbox/$s.$n.stdout.txt" > "$RUN/inbox/$s.$n.md"
' < "$LIST"
```

Replace `your-agent-cli` with your agent's headless command. The script has no default cap. Pass the one in `frame.md`, which starts at the machine budget's browser row and never exceeds the budget (`build-design-system/references/coordinator-path.md`, Machine budget). Before each launch, the coordinator writes the list of surfaces to start and marks those rows `in-flight`. The script, not the worker, keeps the final message in `inbox/<surface>.<n>.stdout.txt` and stderr in `inbox/<surface>.<n>.log`, outside the captures folder, then writes only the status line and file list to `inbox/<surface>.<n>.md`. Neither file shows that the worker is alive. The coordinator drains when new reports appear.

## Choosing

Use in-session subagents or teams for a first run, since you can watch the coordinator work. Move to the script loop or cloud agents once the brief has survived the pilot and the sweep and you want the window to run unwatched. On any platform, keep the coordinator where it can read the run folder.
