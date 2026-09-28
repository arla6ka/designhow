# Triage

Triage is cheap on purpose. One script, a few file reads, no browser and no subagent. It decides the route, so every call it makes has to trace to a number a person can rerun.

## Contents

- Running the script
- Signals
- The app's state
- The ask's intent
- The one question
- Blind spots

## Running the script

```sh
bash <skill>/scripts/triage.sh <repo> <repo>/.design-system/boss/triage
```

It prints `signal<TAB>value` lines and writes them to `signals.tsv`, with the match lists beside it (`raw-colors.txt`, `components.tsv`, `families.tsv`, `routes.txt`, `token-files.txt`). It reads only files git tracks or would track, and writes only into the output folder. It needs `rg`. Without it, run these, save each output in the same folder, and record the fallback in the state file. They skip `.gitignore`, so the excludes do that job.

```sh
X='--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.design-system --exclude-dir=.migration'
grep -rIn $X -E '#[0-9a-fA-F]{3,8}\b|(rgba?|hsla?|oklch)\(' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' . \
  | grep -vE '^[^:]*:[0-9]+:[[:space:]]*--' > raw-colors.txt
grep -rIoh $X -E 'var\(--[a-zA-Z][a-zA-Z0-9-]*' --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' . | wc -l
grep -rIn $X -E 'export (default )?(function|const|class) [A-Z]' --include='*.tsx' --include='*.jsx' . > components.txt
find . -name '*.tokens.json' -o -name 'tailwind.config.*' -o -path '*/tokens/*.json' | grep -v node_modules
```

In a monorepo, run it once per app folder, each into its own subfolder of `triage/`.

## Signals

| Signal | Measures | Feeds |
|---|---|---|
| `token_files` | DTCG files, a `tokens/` folder, `tailwind.config.*`, CSS with `@theme` | whether a token source exists |
| `custom_property_defs` | lines that define a CSS custom property | a token source written as plain CSS |
| `token_refs` | `var(--…)` and `theme()` uses | adoption |
| `raw_color_lines` | lines with a hex, `rgb()`, `hsl()` or `oklch()` value, token definition lines excluded | adoption, the Values route |
| `tw_arbitrary`, `tw_palette` | Tailwind `x-[…]` values and default palette classes such as `text-gray-500` | adoption |
| `adoption_pct` | token references as a share of token references plus raw values | drifting or settled |
| `component_defs`, `same_name_defs` | exported capitalized components, and names defined in more than one file | duplicates |
| `families_with_2plus` | families (Button, Input, Dialog and so on) with two or more definitions | drifting or settled |
| `shared_ui_dirs` | `components/ui`, `packages/ui`, a `design-system` folder | where a system lives |
| `system_docs_routes`, `llms_txt`, `registry_json`, `stories` | docs a person or an agent can read | settled or documented |
| `build_record`, `migration_runs`, `boss_state` | earlier runs | resume |
| `run_script`, `routes` | whether the app can start, and how big it is | budget, and which steps can verify visually |
| `git_uncommitted` | files with uncommitted changes | the stop on unrelated work |

## The app's state

Apply these in order and take the first that matches. Write the deciding signal next to the state.

1. `boss_state` is set. Resume. No new triage decision.
2. `token_files` is 0 and `custom_property_defs` is under 20. **none**.
3. `adoption_pct` is under 80, or `families_with_2plus` is 2 or more. **drifting**.
4. `system_docs_routes` is 0, or `llms_txt` is no, or `registry_json` is no. **settled**.
5. Otherwise **documented**.

The thresholds are defaults. A team that has measured its own app should change them here and nowhere else.

A `build_record` with no handoff section means an earlier build stopped partway. Route to Build, and the build skill resumes from its own record. A migration run folder with open surfaces means the same for Adopt.

Before routing on `documented`, open one component page and its `.md` twin and compare their H2s with the component skeleton in `build-design-system/references/system-structure.md`. If they differ, the state is **settled**, because the docs exist but not in the target structure.

## The ask's intent

Read the ask for these words. The first row that matches wins.

| The ask says | Intent |
|---|---|
| one component by name, "document the X", "what states does X have" | component |
| "before we ship", "review this screen", "is this ready", "handoff" | review |
| "how bad", "audit", "where do we stand", "don't change anything" | audit |
| "fix it", "clean it all up", "mess", "sort out our UI" | full |
| "migrate", "move every screen", "roll out", "adopt" | adopt |
| "hardcoded", "raw values", "use our tokens", "colors are everywhere" | values |
| "docs", "document the system", "agents can't read our components" | docs |
| "build", "set up", "extract", "break down the screens", "consolidate" | build |

An ask that matches nothing is **full** when the state is `none` or `drifting`, and **adopt** when it is `settled`.

"Launch subagents" is a delegation request, not an intent. Honor it in the step that fans out.

## The one question

Ask at most one, and only for one of these:

- A monorepo target nobody named. Name the candidates with their route counts.
- An intent that fits two routes differing by a whole phase, such as build only against build then migrate.
- A read-only repo on a route that writes.

Put it in the Frame message with the default already applied. The run goes on under the default until someone answers.

```
Triage: no token source, 412 raw color lines, 3 button families, 18 routes.
Route: Build. build-design-system makes the system and proves it on the
invite flow, then migrate-design-system audits the rest and writes a plan.
Budget: one working session, 4 workers.
Question: should I also move every screen onto the system after the plan?
Default if you don't answer: no. I stop at the plan and the report says what
the migration would cost.
```

Budget and the migration clearance are not this question. Ask for a budget in the same message as part of the frame. The clearance comes later, at step 5.

## Blind spots

The script counts text. It misses class names built at runtime, styles set in JavaScript, and values from a CMS. It over-counts a hex-looking string such as `#add` in an anchor. Its component families match on name suffix only, so `SaveCTA` never counts as a button. Say in the Frame that the counts are a first read, and let the sibling skills' own inventories give the numbers the report finally uses.
