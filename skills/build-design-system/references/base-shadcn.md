# Base: shadcn

Read this when triage reports `foundation` as `shadcn` or `shadcn+registry`, or when seed mode starts from shadcn defaults. It overrides `token-architecture.md`, `component-contract.md` and `system-structure.md` where they differ. shadcn's own skill (`npx skills add shadcn/ui`) carries the composition rules, and this page does not restate them.

Contents

- Read the project first
- Where tokens live
- What counts as a component
- How drift is measured
- Changing a component
- Seed
- Distribution
- Docs
- Checks
- Shared files

## Read the project first

Read `components.json` and the installed files in the ui folder, and save what they say in the run folder. Also run `npx shadcn@latest info --json` and trust it over anything inferred. Read-only CLI commands (`info`, `view`, `add --dry-run`, `add --diff`) may fetch the CLI through `npx`, since they write nothing to the repo. A command that writes, such as `add`, `apply`, `init` or `migrate` without `--dry-run`, runs only as "Changing a component" and "Seed" say. The fields that matter are `base` (`radix` or `base`), `style`, `tailwindCss`, `resolvedPaths.ui`, `iconLibrary`, `registries` and the installed `components`. `base` decides how triggers compose (`asChild` on Radix, `render` on Base UI), so every brief that writes a trigger pastes it. Moving from Radix to Base UI is its own job, run with shadcn's `migrate-radix-to-base` skill, not inside a build.

## Where tokens live

In the file at `tailwindCss`, as shadcn writes them. Each role is a pair of CSS variables under `:root` and `.dark`, a surface and the text on it (`--muted` and `--muted-foreground`), mapped to utilities by `@theme inline { --color-muted: var(--muted); }`.

- shadcn's names are the semantic layer. Keep every one, including `chart-*` and `sidebar-*`. Never rename one, because every copied component and every future `add` reads them.
- A missing role becomes a new pair in the same file, under `:root` and `.dark`, plus its `@theme inline` line, such as `--warning` and `--warning-foreground`. Never in a new CSS file.
- Values stay in the format the file uses, usually OKLCH. A brand hex is converted with a short Node script (sRGB to OKLab to OKLCH), never by eye, and the source hex stays in the role comment: `--primary: oklch(0.705 0.187 47.6); /* brand #F97316, primary actions */`.
- `shadcn apply <preset>` and any registry item with `cssVars` write into this file. A generator that owns these lines fights both. The default is no generator. If the team wants DTCG as the source, generate only into a region fenced by `/* tokens:begin */` and `/* tokens:end */` comments, and never into the lines shadcn writes.
- Do not put `--color-*: initial` in `@theme inline`. Stock components read `black`, `white` and `transparent`, such as the Dialog overlay's `bg-black/10`, and the reset drops them. Catch palette classes with the check's `rule/palette-use` (`checks.md`). A scoped reset of named palette families is allowed if the team asks, proven on the stock Dialog overlay and on a component that uses `bg-sidebar` and `fill-chart-1`.
- `token-mapping` maps raw values onto these names as they are. It never proposes renaming one.

On Tailwind v3 (`tailwind.config.*` present, no `@theme` in the CSS), the variables hold bare HSL channels under `:root` and `.dark`, such as `--muted: 210 40% 96.1%`, and `tailwind.config` maps them as `muted: "hsl(var(--muted))"`. There is no `@theme inline`. A new role is a config color plus the variable pair. `rule/token-parity` reads the channel values as colors.

## What counts as a component

- **Stock primitives.** Files in `resolvedPaths.ui` whose names match a registry item. They are canonical by default. The canonical-pick ranking in `component-contract.md` does not apply to them.
- **Customized primitives.** Stock files the team edited. Still canonical, with their diff recorded.
- **Team components.** Compositions and wrappers the team wrote, in or out of the ui folder. These get the full ranking when two do the same job.
- **Legacy.** Product markup that bypasses the system: custom divs where `Alert`, `Empty`, `Badge`, `Skeleton`, `Separator` or `Field` exist, color and type overrides through `className`, Tailwind palette classes, and wrappers that duplicate a primitive.

shadcn primitives are flat named exports (`DialogTitle`, not `Dialog.Title`) and take `ref` as a prop on React 19. Neither is a defect. Follow the installed convention in every team component too.

Never mark a stock primitive deprecated because a product wrapper exists. Deprecate the wrapper.

## How drift is measured

Per file in the ui folder, record one row in the repo's `scripts/ui-drift.tsv` (columns `file`, `status`, `sha256`, `note`) with the status `stock`, `customized` or `forked`, then run `node scripts/check-system.mjs --hash-stock`, which hashes every row. The check exempts a stock file only while its hash matches, and checks the hash of customized and forked files too, so a quiet edit to any listed file fails `rule/stock-edit`. After a reviewed edit, `--rehash <file> --note "<what changed and why>"` records the new hash and the note in the same commit. For each `customized` row, save upstream's copy with `node scripts/check-system.mjs --save-stock <file> <item>.json`, where the JSON comes from `npx shadcn@latest view <item>`. The check then exempts upstream's own literals on unchanged lines, such as a style's `rounded-[min(var(--radius-md),10px)]` or `text-[0.8rem]` in `button.tsx`, and scans only the team's lines (`checks.md`).

```sh
npx shadcn@latest add <item> --dry-run          # what would change, without writing
npx shadcn@latest add <item> --diff <file>      # the diff for one file against upstream
```

The upstream copy is the item JSON that `add` compares against, served from ui.shadcn.com under `r/styles/` for the project's style. An empty diff is `stock`. A diff the team can explain line by line is `customized`, and the explanation goes in the spec's Foundation table. A diff too large to merge from upstream is `forked`, and that is a gate with two options, keep the fork and own it or reset to stock and move the changes into a wrapper.

On a clean-up or drift ask ("clean up the system", "stop the drift"), a drifted upstream line in a stock-derived file, such as `bg-popover` edited to `bg-white` or `showCloseButton` flipped, is reverted to upstream on the run branch by default. Each file gets one gate whose other option keeps the local change, listing the lines. A change the team explains as a product need stays and becomes a `customized` row. On any other ask, the default keeps the local change. Do not fetch raw files from GitHub, and do not use the older `shadcn diff` command.

Drift in product code is the raw-value and legacy counts from the inventory, measured outside the ui folder. Raw values inside stock files are upstream's.

## Changing a component

In order of preference: use an existing variant, use a semantic token, add a CSS variable pair, add a `cva` variant in the file, write a wrapper. Each step down costs more on the next upstream update.

- `add <item>` runs only in the shared-layer step, by one writer, since it can install dependencies and write CSS variables.
- An update to a `stock` file may overwrite it. An update to a `customized` file is a hand merge from `add --diff`.
- `--overwrite` destroys local changes. It is a gate every time, and the gate lists the files and their drift status.
- After adding any third-party item, read every file it wrote, fix imports to the project's aliases, and swap icons to `iconLibrary`.
- `cn()` merges classes with `tailwind-merge`, which drops one of two classes it reads as the same group. A custom token utility such as `text-label` (a size) beside `text-muted-foreground` (a color) loses one. Register each custom token group with `extendTailwindMerge`, and test a two-class call per group.
- On the Next.js App Router, for example, a hand-written component or wrapper with an event handler, state or an effect needs `"use client"` as its first line. Stock files already carry it where needed. A handler added to a shared Button without it breaks every server-rendered page that renders the Button, and `tsc` still passes. Attach a handler only where the component is already a client component, then request every route and require 200 (`browser.md`, After an edit).

## Seed

The commands behind seed mode's steps (`modes.md`, Seed) when shadcn is the foundation, on Next.js:

1. `shadcn init -t next` will not scaffold into a folder that already has a `package.json`, and `create-next-app` refuses one with a README or dot folders. Run `npx create-next-app@latest <tmp>/app --ts --tailwind --app --eslint --use-npm --yes` in a temp folder outside the repo, move its files in (`node_modules` excluded, the repo's README, `.git` and agent folders kept, `package.json` merged by hand), then `npm install`, `npx shadcn@latest init -d` and `npx shadcn@latest info --json`.
2. `init -d` writes the neutral base gray and has no base-color flag. Switch with `npx shadcn@latest migrate base-color --to <name>`. `migrate --list` names the bases the installed version offers. The brand hex goes into `--primary`, in the file's format (OKLCH on current shadcn).
3. Dark mode that follows the OS: a `prefers-color-scheme: dark` block, or a theme provider that sets `.dark` from the OS setting, such as next-themes with `attribute="class"` and `defaultTheme="system"`.
4. Status roles are `--success` and `--warning` pairs, from the preset's chart or destructive hues where one fits. Stock variants with alpha fills, such as a destructive Badge, are measured like any pair.
5. The pilot usually needs Button, Input and Field, Table or a list, Badge, Empty, Skeleton and an error Alert. A coverage gap's Meanwhile can name the stock item to add, such as `npx shadcn@latest add dialog`, with destructive confirms on AlertDialog.

## Distribution

A system built on shadcn ships as a namespaced registry, `@team`, not an npm package.

- The source is a `registry.json` with `name`, `homepage` and `items`. Tokens ship as a `registry:theme` or `registry:style` item with `cssVars`, components as `registry:ui` items, patterns as `registry:block`. `shadcn build` writes the built items to `public/r`.
- Apps add the namespace to `components.json` under `registries`, such as `"@team": "https://ui.team.dev/r/{name}.json"`, with a token header from the environment for a private registry.
- Pin a version through the registry repo's commit, a `#ref` for GitHub-hosted items, or a `version` param. Migrations record the pin in `frame.md`.
- Our metadata goes under each item's `meta`: `docs`, `markdown`, `entry`, `states`, `tokens`, `replaces`, `status`. The item `name` is the registry id. There is no second registry file. `system-structure.md` gives the same fields for non-shadcn projects.
- The item's `docs` field holds the one-line install message and the URL of the component's `.md` twin, since agents using the registry read that first.
- In a monorepo, a workspace `packages/ui` is the alternative. Apps import it by workspace name, and `shadcn init --monorepo` sets up the aliases.
- `registry:base` ships a whole system with config. Use it only when the team wants every app to start from the same preset.

Publishing the registry to a public URL is a stop and ask.

## Docs

Stock variants can fail contrast on their own, usually through alpha fills such as a destructive Badge or `text-destructive/90` in an Alert, while the token pair measures fine. Measure the rendered variants, not only the pairs. In seed the brand is new, so fix a failing pair in the tokens as a decision. On a shipped app it is a gate.

Pages and specs in `system-structure.md` cover what the team owns: customized primitives, team components and product rules, such as "`Button` has `tone`, not `variant`". For a stock primitive with no team rules, the page is short. The Description links shadcn's docs for the item, the spec's Foundation table has one "Stock" row, and States, Keyboard and ARIA still get filled for this app, since the check needs them.

The Foundation row of any spec names the registry item and the `style` and `base` from `components.json`, then lists only the real differences `shadcn add <item> --diff` shows.

When a doc names where a component renders (`component-docs`, Description), read the top of the file on the App Router, for example: `"use client"`, `import "server-only"`, or neither on a server component. Follow its imports for hooks that force a client boundary. In a doc's Tokens table, a utility built from a declared role name (`bg-muted`, `text-muted-foreground`) is token use, and a palette utility (`bg-blue-600`, `text-gray-500`) is palette use.

## Checks

Single-element composition is how shadcn fixes `trap/link-wraps-button`: `Button asChild` around the Link on Radix, `render` on Base UI, or `buttonVariants()` on the Link. `check-system.mjs` passes all three.

shadcn's composition rules are cheap, mechanical findings. Turn the ones that apply into lint in the enforcement phase. Each gets the `trap/` ID from `traps.md` when one matches, or a `rule/` ID with the app's evidence:

- `className` that sets color or type on a primitive
- `space-x-*` and `space-y-*` instead of `gap-*`
- `dark:` color overrides in product code
- an overlay with no title part
- items outside their group part
- Tailwind palette classes such as `text-gray-500`

On Next.js 16, for example, run `next typegen` before `tsc` in the check command, or a clean clone fails on missing route types (`checks.md`, "The check has to run").

## Shared files

Add these to the coordinator's single-writer list and to migrate's forbidden paths: `components.json`, the `tailwindCss` file, `lib/utils`, and the ui folder itself during fan-out. Workers report needed changes to them instead of making them.
