# Running it on your platform

Checked on 2026-09-27. Agent tools change often, so confirm names and flags against current docs before a long run.

The pattern needs four things from a platform. It must start an agent with a brief, give that agent its own checkout, tell the coordinator when the agent finishes, and let the coordinator read what the agent wrote. Everything else lives in the run folder, so it works the same everywhere.

## Worktrees

Give each worker its own git worktree on its own branch, created from the commit in its brief.

```sh
git worktree add ../app-wt/billing-invoices -b migrate/billing-invoices a91c04e2d7b0
# after the surface lands
git worktree remove ../app-wt/billing-invoices
```

Install dependencies once per worktree. A package manager with a shared store, such as pnpm, keeps that fast. The coordinator keeps one shared dev server up until every worker has returned. The brief's SERVER field gives each worker a fallback port, the base port plus its number, such as 3100 + n, so two fallbacks never capture each other's pages.

### No worktree isolation

Some hosts isolate only the session's primary repo, or none. Then run the surfaces in sequence, one worker at a time. Or fan out only surfaces whose MAY EDIT globs share no file, on one branch, with git forbidden in the brief and the coordinator committing each surface after its verdict. It stages only that surface's `paths` from `surfaces.tsv` with `git add -- <paths>` and makes one commit per surface. Batch landing is forbidden, even when several verdicts arrive in one drain. Record which one in `frame.md`. Never run two workers on overlapping paths in one checkout.

## Claude Code

- **Coordinator.** The main session.
- **Workers.** Subagents started in the background, or in the foreground when this skill runs as a step agent (`references/orchestration.md`, The rolling window). Define a `migration-worker` agent in `.claude/agents/` with `isolation: worktree`, the tools it needs, and no more. The brief is the prompt. Subagents do not see the parent conversation, so the brief must stand alone.
- **Verifier.** A second agent definition. For a different model family, run the verifier through another vendor's CLI from a shell step, since Claude Code subagents all run Claude models.
- **Agent teams.** An experimental mode gives a lead a shared task list and teammates. It fits a window of 3 to 5. Put the scope check in a task-completion hook so a teammate cannot mark a task done with an out-of-scope diff.
- **Headless loop.** `claude -p "$(cat brief.md)"` inside each worktree, with an allowed-tools list, driven by the script loop below. Tune the brief on two or three surfaces before running the full list.

## Codex

- **Coordinator.** A Codex CLI session in the main checkout. Repo instructions come from AGENTS.md, and skills from `.agents/skills/`.
- **Workers.** `codex exec` with the brief as the prompt, one per worktree, from the script loop below. Or Codex cloud tasks, where each runs in its own container and returns a diff. The coordinator saves each final message's status line and file list as the inbox file, for local and cloud tasks alike.
- **Verifier.** Another model family, through its own CLI, from the same loop.

## Cursor

- **Coordinator.** A local Cursor agent chat in the main checkout.
- **Workers.** Cloud agents, each on its own branch in its own machine, each returning a branch or pull request. Set up the environment first, including dependencies, fixtures, and the browser the capture script uses. A worker in a broken environment produces confident, unverifiable work.
- **Run folder.** Cloud workers cannot read it. Paste every input into the brief, and save each return's status line and file list as the inbox file. Reattach work by branch name after a restart.
- **Verifier.** A cloud agent on a different model from the worker, briefed from `references/verification.md`.

## Plain script loop

Any agent with a headless mode fits this. The script handles the window, and the coordinator handles drains and briefs.

```sh
#!/usr/bin/env bash
# run-window.sh <run> <list> <cap>: start one worker per surface in <list>, at most <cap> at once
set -euo pipefail
RUN=$1; LIST=$2; CAP=${3:-6}
export RUN
xargs -P "$CAP" -I{} bash -c '
  s={}
  n=$(ls "$RUN/briefs/$s".*.md | wc -l | tr -d " ")
  wt=../app-wt/$s
  [ -d "$wt" ] || git worktree add "$wt" -b "migrate/$s" "$(git rev-parse ds/2026-09-28-migrate)"
  out="$RUN/inbox/$s.$n.captures"; mkdir -p "$out"
  (cd "$wt" && your-agent-cli "$(cat "$RUN/briefs/$s.$n.md")" > "$RUN/inbox/$s.$n.stdout.txt" 2> "$RUN/inbox/$s.$n.log") || true
  sed -n "/^Status:/p;/^Branch:/p;/^## Files changed/,/^## Captures/p" "$RUN/inbox/$s.$n.stdout.txt" > "$RUN/inbox/$s.$n.md"
' < "$LIST"
```

Replace `your-agent-cli` with the headless command for your agent. Before each launch, the coordinator writes the list of surfaces to start and marks those rows `in-flight`. The script, not the worker, keeps the final message from stdout in `inbox/<surface>.<n>.stdout.txt` and stderr in `inbox/<surface>.<n>.log`, outside the worker's captures folder, then writes only the status line and file list to `inbox/<surface>.<n>.md`. The worker writes no report file. Neither shows that the worker is alive. The coordinator drains when new reports appear.

## Choosing

Use in-session subagents or teams for a first run, since you can watch the coordinator work. Use the script loop or cloud agents once the brief has survived the pilot and the sweep, and you want the window to run while nobody watches. On any platform, keep the coordinator somewhere that can read the run folder.
