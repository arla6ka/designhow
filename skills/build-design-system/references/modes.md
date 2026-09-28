# Modes

> For the team setting this up: build mode is the procedure in `SKILL.md`. This page covers the two other starting points, seed and harden, which reuse most of the same phases. Change the phase list per mode here, not in `SKILL.md`.

Contents

- Picking the mode
- What decides a question
- Seed
- Harden
- What changes in the handoff

## Picking the mode

| Mode | The app has | The run ends with |
|---|---|---|
| build | shipped UI and no system, or a token file nobody follows | a system extracted from the app, proved on a pilot |
| harden | a component layer that exists but has thin states, no rules and divergent copies | the same layer with specs, docs and checks, plus a list of stray code for `migrate-design-system` |
| seed | no UI yet, or a new app | a small system started from brand material or shadcn defaults, with every brand value a gate |

Triage names the mode. When nobody ran triage, read the repo with the boss's rule. Two or fewer routes and five or fewer product components is seed. A component folder with 5 or more components imported by 3 or more routes, and no specs or duplicate families, is harden. Anything else is build, including a `components/ui` folder that holds one legacy button.

## What decides a question

When sources disagree, take the first that settles it:

1. What the person asked for in this run.
2. Project rules in AGENTS.md or CLAUDE.md.
3. Gates already answered, and decisions already in the run record.
4. The system's own specs and docs, once they exist.
5. Shipped code in the same area of the app. This is evidence of what users see today, not proof it is right. A pattern shipped on one screen is a candidate, not a rule.
6. A design spec or old docs.
7. General guidance, including `traps.md`.

A conflict between two sources at the same level is a gate.

## Seed

For a new app, the system starts small and grows with the first screens. Phases 1, 3, 4, 5, 6 and 7 of `SKILL.md` run, in the order below. Inventory shrinks to a search for brand material, and the pilot is the first real screen. Seed waives what needs a shipped app: before screenshots, the migrate audit, the codemod and the migration map. `token-mapping` runs once the tokens and the pilot exist, as the check that every value the pilot uses has a role.

1. **Collect what exists.** Logo files, a font, a color in a README, a slide or a style guide, a product name. Record each with its path. A color the README or brief names is brand material, not a proposal. Nothing found is a valid result.
2. **Create the app.** `shadcn init -t next` will not scaffold into a folder that already has a `package.json`, and `create-next-app` refuses one with a README or dot folders. This sequence works:
   1. `npx create-next-app@latest <tmp>/app --ts --tailwind --app --eslint --use-npm --yes` into a temp folder outside the repo.
   2. Move its files into the repo root, `node_modules` excluded, keeping the repo's own README, `.git` and agent folders. Merge `package.json` by hand if the repo had one.
   3. `npm install` in the repo, then `npx shadcn@latest init -d` in place, then `npx shadcn@latest info --json`.

   When the brief names another framework, use its own starter the same way. A package library or team package the person names wins over shadcn.
3. **Pick the base color.** `init -d` writes the neutral base gray. Keep neutral unless the brand material is clearly warm or cool. Then switch to the nearest base color with `npx shadcn@latest migrate base-color --to <name>` (`migrate --list` names them. 4.21 offers neutral, stone, zinc, gray, mauve, olive, mist and taupe, and stone is the warm one), and record why. `init` has no base-color flag. The brand hex goes into `--primary`, converted to the file's format (OKLCH on current shadcn) with a script, never by eye, and the source hex stays in the role comment. Measure `--primary-foreground` on it. No other role takes the brand color until a screen needs it.
4. **Propose a direction.** One short paragraph on type, color, density and radius, drawn from the brand material and the preset. A brand value, and any value that departs from the preset, is a gate with a default. A preset value kept as it ships is a decision, recorded once with the preset's name, not a gate. A seed run that hands the person 17 gates for stock values has asked them nothing. When the brief says mobile first or names phones, primary actions and standalone buttons are at least 44px tall at phone widths. That is a decision, not a gate. Record where the main action sits and the safe-area insets. With one brand hex, keep it for fills in both themes, measure it as text on the dark surface, and gate a lighter step when it fails. The run continues on the defaults.
5. **Tokens.** Brand values go into shadcn's variable pairs in the `tailwindCss` file. Wire the dark theme so it reaches users, with a `prefers-color-scheme: dark` block or a theme provider that sets `.dark` from the OS setting (next-themes with `attribute="class"` and `defaultTheme="system"`). Prove it with `capture.mjs --themes light,dark` and the default `--theme-via media`, which emulates a dark OS. A class added by hand proves the tokens only. In one run a dark OS still got the light page. Add `--success` and `--warning` pairs when the pilot shows a status, from the preset's own chart or destructive hues where one fits, each a gate. No other new roles until a screen needs one. Measure every text pair the pilot renders, including stock variants with alpha fills such as a destructive Badge. Measure every non-text pair at 3:1 (WCAG 1.4.11): control borders and checkbox edges against their surface, the focus ring as drawn, alpha included, against each surface it sits on, and a checked fill against the page. The brand is new, so a pair that fails is fixed in the owned token (`--input`, `--ring`, `--border`) as a decision, with the before and after ratios.
6. **Pilot, then components.** With no screen named, the pilot is the product's main list screen: the object the README or brief names (invoices, projects, tickets), with its empty, loading and error states. When the ask rules out screens ("before we build any screens"), the pilot is the same list as a pattern page under `/system` with inert data, `/` stays a placeholder that links to it, and the pattern uses the heading level the future page will, an `h1`. Build it from the system, adding only what it needs, usually Button, Input and Field, Table or a list, Badge, Empty, Skeleton and an error Alert. A settings form comes second if budget allows. Run `design-review` on it, and fix its findings as phase 6 of `SKILL.md` says.
7. **Specs.** Each component the pilot uses gets a spec from `spec-template.md`, citing the pilot's uses. The first spec is the coordinator's own, and the rest may fan out.
8. **Patterns.** Always document a loading, an error and an empty pattern, with the width, component and state order, whatever the pilot. Any app that loads data needs them, so Skeleton and the error pattern are never dropped as "nobody asked".
9. **Checks, then docs**, as phases 5 and 7, scaled to what exists.

Seed uses the Done list in `SKILL.md`. On top of it, the pilot renders its list, empty, loading and error states from the system, each captured at every viewport and theme, and the docs cover the three patterns.

Hard lines for seed: no invented brand. An accent color, typeface or logo treatment that is not in the brand material is a gate, and the default is the neutral preset. One that is in the material is brand. No component the pilot or the three patterns do not need.

## Harden

For a component layer that exists but is weak. The goal is a system the app can safely converge on. Moving the app is still `migrate-design-system`'s job. Order matters, because harden runs out of budget. The complaint comes first, then components and the pilot, then the docs.

1. **Frame and inventory** as phases 1 and 2, plus drift status for every component-layer file per the base reference, and the component's call sites. Start the read-only migrate audit right after step 2's token commit, so its gates match the tokens.
2. **Tokens first, and answer the complaint.** Run `token-mapping` on the raw values. Fix broken token names, and add the missing roles as pairs. A role for a value the app already ships in 2 or more places needs no gate: name it, then swap. On a values or hardcoded-colors ask, a raw color with a nearby role defaults to a new token pair, or to that nearest role, never to "keep raw". This default wins over a `token-mapping` row that says leave it raw. "Keep raw" is only for brand art, such as a wordmark or an illustration. Swap every raw value whose token has the identical value, on every route, with no gate, and prove each route at 0% with `<skills>/build-design-system/scripts/montage.mjs --diff`. When the person named colors or hardcoded values, this step is the first visible change.
3. **Diff against the template.** For each component, fill what the code already answers in `spec-template.md`, and list what is missing: a state with no trigger, a precedence nobody decided, a keyboard path nobody wrote, a trap from `traps.md` the code falls into. Every line in a customized file's upstream diff becomes a decision with a reason or a gate. Save the gap list as `.design-system/harden/gaps.tsv` with the columns component, question, finding, and evidence.
4. **Fill, capped.** Specs cover the pilot's families, and Done is capped there. Families the strays touch go to a follow-up list in the handoff. Fan-out follows the one rule in `SKILL.md` phase 1, with the spec template, the Combobox example and the gap rows. A missing state gets built only when a real screen reaches it, shown with a call site or a capture. Otherwise the spec says `Not applicable` with the reason. When the ask names states ("missing loading and error states"), every component gets its missing states, not only the pilot's families, and state fixes come before specs past the pilot. A loading state follows `component-contract.md`: `aria-disabled`, focus kept, repeat activation blocked in the handler. A missing precedence decision that changes behavior on a shipped screen is a gate.
5. **Converge the copies.** Duplicate components merge into the canonical one by `component-contract.md`, with a migration map entry each. Callers move only on the pilot and on cleared surfaces (`coordinator-path.md`). With no duplicate families, skip the codemod and record why.
6. **Checks** as phase 5, with `node scripts/check-spec.mjs docs/system` in the command.
7. **Pilot** as phase 6. The pilot proves the hardened components on one flow.
8. **Docs** as phase 7, for the capped families. The generated docs and the AGENTS.md block are never cut. The HTML docs site is optional.
9. **Stray code.** Rerun the inventory and write `.design-system/harden/strays.tsv`, one row per call site that bypasses the system or uses a merged copy, with its route. This is migrate's starting inventory.
10. **Handoff** as phase 8.

Hard lines for harden: a fix to broken behavior on the pilot is a decision. An intentional behavior change on a shipped screen is a gate, and its default is applied on the run branch. Identical-value token swaps need neither. A stock shadcn file is never rewritten to fit a spec, since the spec describes it. Team additions follow the base reference's order of preference.

## What changes in the handoff

The handoff in `run-record.md` names the mode on its first line. Seed adds the brand gates and the proposed direction. Harden adds the gap counts before and after, the raw values swapped in step 2, the spec check's output, the follow-up list of families with no spec, and the path to `strays.tsv`, which `migrate-design-system` reads in audit mode.
