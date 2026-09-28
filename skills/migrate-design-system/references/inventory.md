# Inventory and the done predicate

The inventory is a script, not a search the model runs by hand. It finds every place the app still depends on legacy UI, assigns each finding to a surface, and prints counts. Those counts are the done predicate. The model decides what to change. The script decides where the changes are and whether any are left.

## Contents

- What counts as legacy
- Reconcile with the build's registry
- When old and new share a path
- The four counts
- Assigning findings to surfaces
- Example commands
- The allowlist
- Blocking new legacy usage
- The check commands
- Audit mode and plan.md

## What counts as legacy

Write `inventory/legacy.txt` before running anything. It lists every legacy module specifier and path, one per line.

```
module  @/components/legacy/*
module  ~/ui/Button
module  react-bootstrap
path    src/styles/legacy/**
path    src/components/legacy/**
```

Include re-exports. If `src/components/index.ts` re-exports a legacy `Button`, then importing `Button` from `@/components` is a legacy import. Follow barrel files until they end, and include other workspace packages that import from this app.

## Reconcile with the build's registry

Before a component goes in `legacy.txt`, check it against the build's `registry.json` and migration map, when they exist. Anything the build kept is not legacy: a registry entry, or an inventory row whose disposition is canonical or product composition. A path is legacy only when a registry entry lists it under `replaces`, or the map marks it merged or deleted. A component neither one names is a gate, not a guess. Run this again at every re-pin, before the first edit brief. Otherwise a kept file, such as a `StatusBadge` the build kept as a product composition, sits in the legacy count forever and a zero count can never hold.

## When old and new share a path

On shadcn, old and new often both import from `@/components/ui/*`, so import paths cannot tell legacy apart. Find it by drift instead:

- **Stale copies.** Per ui file, run `npx shadcn@latest add @team/<item> --diff <file>` against the pinned registry. A file that differs from the team's item, beyond the changes recorded in its spec, is legacy. List it as a `path` line, and the item that replaces it.
- **Bypasses.** Product markup that rebuilds what the registry has, such as a styled `div` where `Alert` or `Empty` exists, and color or type set through `className` on a primitive. These count as raw values or as named patterns in the ast-grep rule. Palette classes are palette use, the third count below.
- **Duplicate wrappers.** Two team components for one job, from the build or harden handoff's migration map. The non-canonical one is a `module` line.

When the handoff comes from harden mode, start from its `strays.tsv`, then rerun the search, since the code may have moved. Pin a shadcn registry by the registry repo's commit, a `#ref`, or a `version` param.

## The four counts

1. **Legacy imports.** Static imports, re-exports, dynamic `import()`, `require`, and CSS `@import` of anything in `legacy.txt`.
2. **Raw values.** Color literals (hex, `rgb()`, `hsl()`, `oklch()`, named colors other than `transparent` and `currentColor`), length literals in spacing, radius, font size, and line height, shadow literals, and Tailwind arbitrary values such as `bg-[#f5f5f5]` or `p-[13px]`. Values inside the system package and inside `var(--...)` or `theme()` do not count.
3. **Palette use.** Palette-scale utilities such as `bg-blue-600` or `text-gray-500`, from Tailwind's default palette or a scale the project declares. They name a value and no job, so they are neither token use nor raw values. `token-mapping` and the boss's `triage.sh` count them the same way, so the three tools agree. A utility built from a declared role name, such as `bg-muted`, is token use and is not counted. `frame.md` says whether palette use is in the done predicate. Default: in, when the target system declares semantic color tokens, and reported only when it does not.
4. **Legacy files.** Files matching a `path` line in `legacy.txt`.

Scaffolding never counts. Every count excludes `public/system/`, generated `.md` twins and indexes, `scripts/`, check fixtures, `.design-system/`, `.migration/` and skill folders (`.agents/`, `.claude/`, `skills/`). Put these globs in `inventory/ignore.txt` once and pass it to every search, as the commands below do. Never name an excluded folder as a search root, because ripgrep searches a path it is given even when the ignore file lists it. A count that includes the system's own output reports adoption that did not happen.

```
packages/ui/
public/system/
scripts/
*.fixture
fixtures/
.design-system/
.migration/
.agents/
.claude/
skills/
```

Each finding is one row in `inventory/current.tsv`.

```
kind	file	line	match	surface
import	app/(product)/billing/invoices/page.tsx	3	~/ui/Button	billing-invoices
raw	app/(product)/billing/invoices/table.module.css	41	#6b7280	billing-invoices
palette	app/(product)/billing/invoices/row.tsx	12	text-gray-500	billing-invoices
file	src/components/legacy/Modal.tsx	-	-	shared
```

`inventory/counts.txt` holds the totals, and the unassigned count.

```
imports 214
raw 1307
palette 388
files 46
unassigned 0
```

State plainly what the script cannot see. Class names built from strings, styles set in JavaScript at runtime, and values coming from a CMS escape static search. List those places in `plan.md` as known blind spots, and have the verifier's visual check cover them.

## Assigning findings to surfaces

Every row in `surfaces.tsv` has a `paths` glob. The script assigns each finding to the one surface whose glob matches its file. Shared code (layouts, providers, the legacy folder itself) belongs to the `shared` row.

- A finding that matches no glob is `unassigned`. Fan-out does not start while `unassigned` is above zero.
- A file that matches two globs is an overlap. The script exits with an error naming the file and both surfaces. Fix the globs. Two workers must never own one file.

For a Next.js app router project, one surface per `app/**/page.tsx` folder is a good first cut, with `layout.tsx` files in `shared`. For a feature-folder app, use one surface per feature folder. Split any surface whose findings exceed what the pilot's worker handled comfortably inside its time limit.

## Example commands

These show the mechanics. Wrap them in one script at `scripts/migration-inventory.mjs`, in audit mode too, so every run and every agent counts the same way and the edit run reuses the audit's script as is.

Legacy imports with ast-grep, as a rule file the script and CI both use:

```yaml
# rules/no-legacy-ui.yml
id: no-legacy-ui
language: tsx
severity: error
message: Import from @acme/ui instead. See .migration/<run>/lever/RECIPE.md.
rule:
  any:
    - kind: import_statement
      has: { field: source, regex: '^.(~/ui/Button|react-bootstrap|@/components/legacy/)' }
    - kind: export_statement
      has: { field: source, regex: '^.(~/ui/Button|react-bootstrap|@/components/legacy/)' }
    - kind: call_expression
      all:
        - has: { field: function, regex: '^(import|require)$' }
        - has: { field: arguments, regex: '(~/ui/Button|react-bootstrap|@/components/legacy/)' }
```

```sh
sg scan --rule rules/no-legacy-ui.yml --json app src | jq -r '.[] | [.file, .range.start.line + 1, .text] | @tsv'
```

Raw colors and Tailwind arbitrary values with ripgrep:

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

Raw lengths are noisier. Limit the search to the properties that should use tokens (`padding`, `margin`, `gap`, `border-radius`, `font-size`, `line-height`) rather than every `px` in the codebase.

Run the script twice in a row and compare output. Identical output is the first test of the script.

## The allowlist

Some raw values are meant to stay, such as a third-party embed's required color or a `1px` hairline the system approves. They go in `allowlist.tsv`, never in the script's patterns.

```
file	match	reason	owner	remove_by
app/(product)/checkout/payment-frame.tsx	#32325d	the payment provider's appearance API needs a literal	payments	never
app/(product)/settings/profile/date.tsx	~/ui/DatePicker	G-04 option B	design-systems	2026-12-01
```

Every entry has a reason and an owner. The check fails on an entry that no longer matches any finding, so the list shrinks as work lands. Adding an entry needs a closed gate or a logged decision. The script reads `allowlist.tsv` from day one, even when it is empty, and `--help` prints this format. Without it, a documented exception such as a native checkbox with no system Checkbox makes a zero count impossible.

## Blocking new legacy usage

Land this in Inventory, before any migration work. Without it, new feature work adds legacy usage as fast as workers remove it, and the count never reaches zero.

- Run the ast-grep rule in CI at error level, or use ESLint `no-restricted-imports` with the same specifiers.
- For raw values, use Stylelint `color-no-hex` or a token-only plugin for CSS, and the raw-value check for TSX.
- Existing findings would fail CI on day one, so generate an ignore list of the files that have findings today, and commit it with the rule. CI fails on any finding in a file not on the list, and on any listed file that no longer has findings. The list can only get shorter. Update it in the same change that lands a surface, so the rule exits 0 on every landed commit.
- Plant one violation in a scratch file and confirm CI fails. Then remove it. Record the failing output in `decisions.tsv`.

When a legacy module reaches zero callers and Delete legacy removes it, change the rule to ban the path outright.

## The check commands

The inventory script supports these calls. Workers and verifiers use the same ones. `--help`, and any flag it does not know, prints usage and the allowlist format, writes nothing and exits 2. It reads `legacy.txt`, `ignore.txt`, `surfaces.tsv` and `allowlist.tsv` from the run folder given by `--run <folder>`, default the newest `.migration/*/` under the root, and never from a path relative to its own file.

It takes `--root <dir>`, the tree it counts, like every build script. The default is the git root of `--run`, else of the current folder, else the current folder, so a worker can run it from any folder with absolute paths. Two failures exit 3 with a message that names the root and says to pass `--root`. The first is a run folder whose real path is not under the root. The second is a scan that reads no source files. Both guard the same false pass. Without them, a script run from outside the app counts an empty tree and prints `0 0 0 0`, which reads as a finished surface.

```sh
node scripts/migration-inventory.mjs                 # writes current.tsv and counts.txt
node scripts/migration-inventory.mjs --paths "<glob>" # prints "imports raw palette files" for one surface
node scripts/migration-inventory.mjs --check          # exits 1 unless the predicate's counts are 0 and the allowlist is clean
node scripts/migration-inventory.mjs --pin            # reruns the counts at HEAD and writes the sha to inventory/pin.txt
node scripts/migration-inventory.mjs --run .migration/2026-03-12 --check  # any call, against a named run folder
node /abs/app/scripts/migration-inventory.mjs --run /abs/app/.migration/2026-03-12 --paths "<glob>"  # from any folder: the root comes from --run
```

Test the guard when the script is written. From a folder outside the app, `--paths "app/**"` with an absolute `--run` prints the same counts as from inside, and `--root` pointing at another repo exits 3.

`--check` is the done predicate. It stays red until the migration finishes, and a partial run reports its counts, not a failure. The handoff check is the blocking rule below with its committed ignore list. It exits 0 at every handoff, partial or not. A red handoff check is a failed run.

Scope check for a worker's diff, run by the verifier before anything else. The first command fails on any forbidden path. The second, stricter one fails on any path outside the brief's MAY EDIT globs.

```sh
set -f   # keep the shell from expanding ** itself
hits=$(git diff --name-only "$BASE..$HEAD" -- $(sed 's/^/:(glob)/' "$RUN/forbidden-paths.txt"))
[ -z "$hits" ] || { printf 'Forbidden:\n%s\n' "$hits"; exit 1; }

outside=$(git diff --name-only "$BASE..$HEAD" -- . $(printf ':(glob,exclude)%s ' $MAY_EDIT))
[ -z "$outside" ] || { printf 'Outside scope:\n%s\n' "$outside"; exit 1; }
```

The done predicate is `--check` exiting 0 on the final integration commit, together with the ledger conditions in `frame.md`.

## Audit mode and plan.md

Audit mode runs Frame and Inventory, including the mapping runs. Outside the run folder it writes one file, `scripts/migration-inventory.mjs`, so the edit run reuses it instead of moving it and repointing its paths. It commits that file on the run branch when there is one, and otherwise leaves it untracked and names it in `plan.md`. No lint rule is added. It ends by writing `plan.md`.

Because it only reads, it can run beside `build-design-system` or harden work. Start it after their token commit lands, and pin the system commit it read in the plan's first line.

The run re-pins the plan itself before handoff, never the person. On the final commit of the run branch: run the inventory with `--pin`, reconcile `legacy.txt` with the registry again, replace the counts and the first line's commit in `plan.md`, reread the Docs coverage table against the twins at that commit, drop gates the build already decided, and merge each remaining conflict with a build gate into one gate. Skip it only when `git diff --name-only <pin>..HEAD` is empty. The later implementation run reruns the inventory against the landed system, so an audit against a system still being built is a plan, not a stale verdict. A coordinator starts it early so the person always wakes up to a plan, even when the build runs out of budget.

```markdown
# Migration plan: <app> to <system version>

System: <package or folder> at <commit>, <landed | in progress>
Counts: imports 214, raw 1307, palette 388, files 46, unassigned 0 (inventory/counts.txt, run twice with identical output)
Blind spots: <places static search cannot see>

## Surfaces
<table: surface, paths, findings, states, depends_on, notes. From surfaces.tsv.>

## Shared layer work
<each shared change, with the files it touches>

## Gaps for the system owner
<each missing token or component, with the surfaces it blocks and file:line>

## Docs coverage
<one row per system component the mapping names: page, .md twin, and whether both have these H2s in this order: Description, Examples, Variants, States, Props, Usage, Accessibility, Tokens, Related. This is the component page skeleton build-design-system writes. A missing or partial twin is a gap for the system owner.>

## Pilot
<the proposed pilot surface and why it exercises the most>

## Lever candidates
<the rewrites a codemod could do, with the share of findings each covers>

## Gates
<each question for a person, with options and a default>

## Estimate
<surfaces, window size, and expected wall clock, based on stated assumptions>
```

A later implementation run starts from this plan and reruns the inventory, since the code will have moved.
