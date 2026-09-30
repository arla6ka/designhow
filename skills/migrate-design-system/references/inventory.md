# Inventory and the done predicate

The inventory is a script, not a search the model runs by hand. It finds every place the app still depends on legacy UI, assigns each finding to a surface, and prints the counts that make up the done predicate. The model decides what to change. The script decides where the changes are and whether any are left.

## Contents

- Finding the target system
- What counts as legacy
- Reconcile with the build's registry
- When old and new share a path
- The four counts
- Assigning findings to surfaces
- Example commands
- The allowlist
- Blocking new legacy usage
- The check commands
- Functional parity
- The shared layer
- Audit mode and plan.md

## Finding the target system

Look for `.design-system/run.md`, `registry.json`, a token source, a UI package or folder, a `/system` route, or the foundation's config file. Read the foundation's base reference in `build-design-system/references/`. Stop and point to `build-design-system` only when nothing is found, or two candidates disagree and no project rule picks one.

## What counts as legacy

Write `inventory/legacy.txt` first, one legacy module specifier or path per line.

```
module  @/components/legacy/*
module  ~/ui/Button
module  old-ui-kit
path    src/styles/legacy/**
path    src/components/legacy/**
```

Include re-exports. If `src/components/index.ts` re-exports a legacy `Button`, importing `Button` from `@/components` is a legacy import. Follow barrel files to the end, and include other workspace packages that import from this app.

## Reconcile with the build's registry

Before a component goes in `legacy.txt`, check it against the build's `registry.json` and migration map, when they exist. Anything the build kept, as a registry entry or a canonical or product-composition row, is not legacy. A path is legacy only when a registry entry lists it under `replaces` or the map marks it merged or deleted. A component neither names is a gate, not a guess. Reconcile again at every re-pin, or a kept file sits in the legacy count forever and zero can never hold.

## When old and new share a path

Some foundations put old and new components under one import path, as copy-in component registries do. Import paths then cannot tell legacy apart, so find it by drift:

- **Stale copies.** A component file that differs from the pinned registry item, beyond the changes its spec records, is legacy. List it as a `path` line with the item that replaces it.
- **Bypasses.** Product markup that rebuilds what the registry has, such as a styled `div` where an alert component exists, and color or type overrides on a primitive. They count as raw values, palette use, or named patterns in the lint rule.
- **Duplicate wrappers.** Two team components for one job, from the build or harden handoff's migration map. The non-canonical one is a `module` line.

The foundation's base reference in `build-design-system/references/` has the per-file diff command and how to pin the registry. When the handoff comes from harden mode, start from its `strays.tsv`, then rerun the search, since the code may have moved.

## The four counts

1. **Legacy imports.** Static imports, re-exports, dynamic `import()`, `require`, and CSS `@import` of anything in `legacy.txt`.
2. **Raw values.** Color literals (hex, `rgb()`, `hsl()`, `oklch()`, named colors other than `transparent` and `currentColor`), length literals in spacing, radius, font size and line height, shadow literals, and one-off values written inline in a class or style, such as a Tailwind arbitrary value `p-[13px]`. Values inside the system package and inside `var(--...)` or the styling tool's theme lookup do not count.
3. **Palette use.** Classes or variables that name a step on a color scale, such as `text-gray-500` or `$blue-600`, from the styling tool's default palette or a scale the project declares. They name a value and no job, so they are neither token use nor raw values. `token-mapping` and the boss's `triage.sh` count them the same way, so the three tools agree. A name built from a declared role, such as `bg-muted`, is token use. `frame.md` says whether palette use is in the done predicate. The default is in when the system declares semantic color tokens, and reported only when it does not.
4. **Legacy files.** Files matching a `path` line in `legacy.txt`.

Scaffolding never counts, because counting the system's own output reports adoption that did not happen. Copy the excluded paths from `build-design-system/references/inventory.md` (Excluded paths) into `inventory/ignore.txt` once, add these two extras, and pass the file to every search:

- The system package, such as `packages/ui/`, because its source defines the tokens.
- `scripts/`, because the checks and their allowlists quote raw values.

Never name an excluded folder as a search root, because ripgrep searches a path it is given even when the ignore file lists it.

Each finding is one row in `inventory/current.tsv`.

```
kind	file	line	match	surface
import	app/billing/invoices/page.tsx	3	~/ui/Button	billing-invoices
raw	app/billing/invoices/table.module.css	41	#6b7280	billing-invoices
palette	app/billing/invoices/row.tsx	12	text-gray-500	billing-invoices
file	src/components/legacy/Modal.tsx	-	-	shared
```

`inventory/counts.txt` holds the totals and the unassigned count.

```
imports 214
raw 1307
palette 388
files 46
unassigned 0
```

Class names built from strings, styles set at runtime and values from a CMS escape static search. List those places in `plan.md` as blind spots, and have the verifier's visual check cover them.

## Assigning findings to surfaces

Every row in `queue.tsv` has a `paths` glob. The script assigns each finding to the one surface whose glob matches its file. Shared code (layouts, providers, the legacy folder itself) belongs to the `shared` row.

- A finding that matches no glob is `unassigned`. Fan-out does not start while `unassigned` is above zero.
- A file that matches two globs is an overlap. The script exits with an error naming the file and both surfaces. Fix the globs, since two workers must never own one file.

With a file-based router, one surface per route folder is a good first cut, with layout files in `shared`. In a feature-folder app, use one surface per feature folder. Split any surface with more findings than the pilot had.

## Example commands

These show the mechanics for a TypeScript app styled with CSS and utility classes; match your own file types. Wrap them in one script at `scripts/migration-inventory.mjs`, in audit mode too, so every agent counts the same way and the edit run reuses the audit's script as is.

Legacy imports with ast-grep, as a rule file the script and CI both use:

```yaml
# rules/no-legacy-ui.yml
id: no-legacy-ui
language: tsx
severity: error
message: Import from @acme/ui instead. See .migration/<run>/codemod/RECIPE.md.
rule:
  any:
    - kind: import_statement
      has: { field: source, regex: '^.(~/ui/Button|old-ui-kit|@/components/legacy/)' }
    - kind: export_statement
      has: { field: source, regex: '^.(~/ui/Button|old-ui-kit|@/components/legacy/)' }
    - kind: call_expression
      all:
        - has: { field: function, regex: '^(import|require)$' }
        - has: { field: arguments, regex: '(~/ui/Button|old-ui-kit|@/components/legacy/)' }
```

```sh
sg scan --rule rules/no-legacy-ui.yml --json app src | jq -r '.[] | [.file, .range.start.line + 1, .text] | @tsv'
```

Raw colors and inline one-off values with ripgrep:

```sh
rg -n --no-heading --ignore-file inventory/ignore.txt -g '*.{css,scss,tsx,ts}' \
  -e '#[0-9a-fA-F]{3,8}\b' -e '\b(rgb|rgba|hsl|hsla|oklch)\(' app src
rg -n --no-heading --ignore-file inventory/ignore.txt -g '*.tsx' -e '\b[a-z-]+-\[[^\]]+\]' app src
```

Palette use, with the same pattern `triage.sh` uses:

```sh
PAL='slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
rg -n --no-heading -o --ignore-file inventory/ignore.txt -g '*.tsx' -e "\b(bg|text|border|ring|fill|stroke)-($PAL)-[0-9]{2,3}\b" app src
```

Raw lengths are noisier. Limit the search to properties that should use tokens (`padding`, `margin`, `gap`, `border-radius`, `font-size`, `line-height`) rather than every `px` in the codebase.

Run the script twice in a row and compare output. Identical output is its first test.

## The allowlist

Some raw values are meant to stay, such as a third-party embed's required color or a hairline the system approves. They go in `allowlist.tsv`, never in the script's patterns.

```
file	match	reason	owner	remove_by
app/checkout/payment-frame.tsx	#32325d	the payment provider's appearance API needs a literal	payments	never
app/settings/profile/date.tsx	~/ui/DatePicker	G-04 option B	design-systems	2026-12-01
```

Every entry has a reason and an owner. The check fails on an entry that matches no finding, so the list shrinks as work lands. Adding an entry needs a gate that no longer reads `gate`, or a logged decision. The script reads `allowlist.tsv` from day one, even when empty, because without it one documented exception makes a zero count impossible.

## Blocking new legacy usage

Land this in Inventory, before any migration work. Without it, new feature work adds legacy usage as fast as workers remove it, and the count never reaches zero.

- Run the ast-grep rule in CI at error level, or the linter's restricted-imports rule with the same specifiers.
- For raw values, use a stylesheet linter rule against literals for CSS, and the raw-value check for component files.
- Existing findings would fail CI on day one, so commit an ignore list of today's files with findings alongside the rule. CI fails on a finding in an unlisted file, and on a listed file that no longer has findings, so the list only shrinks. Update it in the change that lands each surface, so the rule exits 0 on every landed commit.
- Plant one violation in a scratch file, confirm CI fails, then remove it. Record the failing output in `decisions.tsv`.

When Delete legacy removes a module with zero callers, change the rule to ban the path outright.

## The check commands

The skill ships no inventory script. The agent writes `scripts/migration-inventory.mjs` to this interface: the flags `--run`, `--root`, `--paths`, `--check`, `--pin` and `--help`, the outputs `inventory/current.tsv`, `inventory/counts.txt` and `inventory/pin.txt` in the shapes above, and exit codes 0 (pass), 1 (`--check` found work left), 2 (usage) and 3 (wrong root). Workers and verifiers use the same calls. `--help`, or any unknown flag, prints usage and the allowlist format, writes nothing and exits 2. It reads `legacy.txt`, `ignore.txt`, `queue.tsv` and `allowlist.tsv` from the run folder given by `--run <folder>`, default the newest `.migration/*/` under the root, and never from a path relative to its own file.

It takes `--root <dir>`, the tree it counts, defaulting to the git root of `--run`, else of the current folder, else the current folder, so a worker can run it from anywhere with absolute paths. It exits 3, naming the root and saying to pass `--root`, when the run folder's real path is not under the root or the scan reads no source files. Both guard one false pass, where a script run from outside the app counts an empty tree and prints `0 0 0 0`, which reads as a finished surface.

```sh
node scripts/migration-inventory.mjs                 # writes current.tsv and counts.txt
node scripts/migration-inventory.mjs --paths "<glob>" # prints "imports raw palette files" for one surface
node scripts/migration-inventory.mjs --check          # exits 1 unless the predicate's counts are 0 and the allowlist is clean
node scripts/migration-inventory.mjs --pin            # reruns the counts at HEAD and writes the sha to inventory/pin.txt
node scripts/migration-inventory.mjs --run .migration/<run> --check  # any call, against a named run folder
node /abs/app/scripts/migration-inventory.mjs --run /abs/app/.migration/<run> --paths "<glob>"  # from any folder: the root comes from --run
```

Test the guard when the script is written. From a folder outside the app, `--paths "app/**"` with an absolute `--run` prints the same counts as from inside, and `--root` pointing at another repo exits 3.

`--check` is the done predicate. It stays red until the migration finishes, and a partial run reports its counts, not a failure. The handoff check is the blocking rule above with its committed ignore list, which exits 0 at every handoff. A red handoff check is a failed run.

The verifier runs the scope check on a worker's diff before anything else. The first command fails on any forbidden path, the second on any path outside the brief's MAY EDIT globs.

```sh
set -f   # keep the shell from expanding ** itself
hits=$(git diff --name-only "$BASE..$HEAD" -- $(sed 's/^/:(glob)/' "$RUN/forbidden-paths.txt"))
[ -z "$hits" ] || { printf 'Forbidden:\n%s\n' "$hits"; exit 1; }

outside=$(git diff --name-only "$BASE..$HEAD" -- . $(printf ':(glob,exclude)%s ' $MAY_EDIT))
[ -z "$outside" ] || { printf 'Outside scope:\n%s\n' "$outside"; exit 1; }
```

## Functional parity

Before Baselines, one read-only agent reads every legacy call site against the system component that replaces it and writes one row per prop or behavior to `parity.tsv`. For each call site it checks controlled and uncontrolled use, refs, test ids, async search, long lists, nested overlays, focus return, form submit, sticky headers and themes, plus every prop the call site passes.

```
surface	file	line	legacy	system	behavior	verdict	proof
billing-invoices	app/billing/invoices/filter.tsx	22	~/ui/Select	Select	async search as the user types	gap: blocking	Select has no onSearch prop
settings-profile	app/settings/profile/form.tsx	40	~/ui/Input	Input	ref focused on submit error	parity	Input forwards ref, input.test.tsx:31
shared	app/layout.tsx	12	~/ui/Toaster	Toaster	one toast region	gap: degrading	both render a live region
```

- `parity` names the prop or test that proves it in `proof`.
- `parity with change` means the system does it differently, such as focus returning to the trigger instead of the page. That is a behavior change, so it is a gate (`SKILL.md`, Boundaries).
- `gap: blocking` loses something a user needs to finish the task, and goes to the system owner as a gap. `gap: degrading` is a gate. `gap: cosmetic` needs a mapping row.
- `untested` means nothing proves it either way. It becomes a KEEP line in the surface's brief, which the verifier checks.

Coexistence rows cover what breaks while legacy and system components share a screen, with `surface` set to `shared` when a row spans surfaces: overlay layering between the two layers, duplicate toast regions, a default variant that flips when the import changes, and which prop wins when a legacy and a system prop set the same thing.

While any `gap: blocking` row is open, the fan-out does not start or refill. The row closes when the owner lands what was missing and a rerun reads `parity`, or when a gate keeps that call site on legacy. The build's product coverage map (`build-design-system/references/inventory.md`) is the reverse view, product patterns the system lacks. A call site that needs a `missing` or `partial` pattern there cites that row.

## The shared layer

One agent, alone, lands what every surface needs: the system package and lockfile, theme provider, global styles, token wiring, shared wrappers and the lint config. A command that pulls components from the system's registry or generator runs only in this phase, and one that overwrites a customized file is a gate (the foundation's base reference). After each edit it runs the runtime checks in `references/verification.md`, because a type check misses breaks that show only when a route renders. A component the owner adds to close a gap gets its `component-docs` page before any brief names it.

## Audit mode and plan.md

Audit mode needs neither a settled system nor a running app. It runs Frame, Inventory with the mapping runs, and Parity, and ends by writing `plan.md`. Outside the run folder it writes one file, `scripts/migration-inventory.mjs`, with `--help` and the allowlist format, so the edit run reuses it instead of moving it and repointing its paths. It commits that file on the run branch when there is one, and otherwise leaves it untracked and names it in `plan.md`. No lint rule is added.

Because it only reads, it can run beside `build-design-system` or harden work. Start it once their token commit lands and pin that commit in the plan's first line, so the person gets a plan even when the build runs out of budget.

The run re-pins the plan itself before handoff, never the person. On the run branch's final commit: run the inventory with `--pin`, reconcile `legacy.txt` again, rerun the parity rows whose system component changed, update the counts and first-line commit in `plan.md`, reread Docs coverage against the twins there, drop gates the build already decided, and merge each remaining conflict with a build gate into one gate. Skip it only when `git diff --name-only <pin>..HEAD` is empty. The later implementation run reruns the inventory, since the code will have moved.

```markdown
# Migration plan: <app> to <system version>

System: <package or folder> at <commit>, <done | doing>
Counts: imports 214, raw 1307, palette 388, files 46, unassigned 0 (inventory/counts.txt, run twice with identical output)
Blind spots: <places static search cannot see>

## Surfaces
<table: surface, paths, findings, states, depends_on, notes. From queue.tsv.>

## Shared layer work
<each shared change, with the files it touches>

## Parity
<counts by verdict from parity.tsv, then each blocking and degrading gap with file:line, the system component and what it lacks. Fan-out waits on every blocking row.>

## Gaps for the system owner
<each missing token or component, with the surfaces it blocks and file:line>

## Docs coverage
<one row per system component the mapping names: page, .md twin, and whether both have the component page sections of build-design-system/references/system-structure.md, in order. A missing or partial twin is a gap for the system owner.>

## Pilot
<the proposed pilot surface and why it exercises the most>

## Codemod candidates
<the rewrites a codemod could do, with the share of findings each covers>

## Gates
<each question for a person, with options and a default>

## Estimate
<surfaces, families, window size, and expected wall clock, based on stated assumptions>

## Found, not fixed
<the table in build-design-system/references/run-record.md (Handoff report): one row per surface with findings (`no clearance`), per blocking or degrading parity gap and per gap for the system owner (`out of scope`), and per gate (`gate`). A blocking parity gap is `blocking`, a surface with legacy imports or raw values `should-fix`, palette-only and blind spots `note`. Rows past 30 go to found-not-fixed.tsv.>

Next: To migrate the <N> surfaces (<M> families, about <budget>), reply "Go, <budget>".
```

The offer's size comes from this plan: surfaces from the Surfaces table, families from the system components the mapping names, and the budget from Estimate. Full mode starts only on that reply or an ask that names the migration.
