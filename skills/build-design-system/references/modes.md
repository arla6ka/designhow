# Modes

> For the team setting this up: build mode is the procedure in `SKILL.md`. This page covers the two other starting points, seed and harden, which reuse most of the same phases. Change the phase list per mode here, not in `SKILL.md`.

Contents

- Picking the mode
- What decides a question
- Following a design source
- Seed
- Harden
- What changes in the handoff

## Picking the mode

| Mode | The app has | The run ends with |
|---|---|---|
| build | shipped UI and no system, or a token file nobody follows | a system extracted from the app, proved on a pilot |
| harden | a component layer that exists but has thin states, no rules and divergent copies | the same layer with specs, docs and checks, plus a list of stray code for `migrate-design-system` |
| seed | no UI yet, or a new app | a small system started from brand material or a stock preset, with every brand value a gate |

Triage names the mode. When nobody ran triage, read the repo with the boss's rule. Two or fewer routes and five or fewer product components is seed. A component folder with 5 or more components imported by 3 or more routes, and no specs or duplicate families, is harden. Anything else is build, including a shared component folder that holds one legacy button.

## What decides a question

When sources disagree, take the first that settles it:

1. What the person asked for in this run, including the taste they stated: their bans, the references they named, and how closely to follow a design source. Their taste is a ground for rules (`rule-method.md`, Grounds).
2. Project rules in AGENTS.md or CLAUDE.md.
3. Gates already answered, and decisions already in the run record or the committed decisions log (`coordinator-path.md`, Review, decide, fix).
4. The system's own specs and docs, once they exist.
5. Shipped code in the same area of the app. It shows what users see today, not that it is right. A pattern shipped on one screen is a candidate, not a rule.
6. A design spec or old docs, unless the person chose partial or pixel fidelity (below).
7. General guidance, including `traps.md`.

A conflict between two sources at the same level is a gate.

## Following a design source

A design file, brand kit or mockups the person gives may be a reference or the target. The Frame asks which (`design-system-boss/references/triage.md`, Standing questions). The default is reference only, because the person may want the current look, and a full restyle is expensive to undo.

| Answer | What the source decides |
|---|---|
| Reference only | Nothing by itself. Its values and structures are candidates, and a disagreement with the app is a gate whose default keeps the app |
| Partial | The structures and values the person names, such as "cards and tables", at rank 2 in the list above. The rest stays with the app |
| Pixel fidelity | Structure and look wherever it draws, at rank 2. Shipped code still decides behavior and data |

Above reference only, before restyling anything:

1. Read the source in small pieces. List its top-level frames with a small script first, since a whole-file read can time out or drop the connection, and separate product mockups from marketing art.
2. Record the drawing scale. Mockups are often drawn above 1x, so divide by the hairline width, and record the factor as a decision.
3. List each recurring structure in `.design-system/inventory/design-structures.md`: name, frame or node id, parts, spacing, surface and edge, type size, and the component that will carry it.
4. Restyle a sample of one or two components toward the source. Capture each beside a crop of its frame at the same scale, in both themes, and show the person.
5. Restyle the rest only after the person confirms the sample. With nobody answering, the rest is a gate whose default keeps the current look, and the sample stays on the branch under it.

When the person says to keep the current look, at the sample or later, the restyle stops, and the sample reverts in its own commit. Marketing-only treatments in the source, such as illustration or display type, stay out of product UI and are listed on the brand page.

## Seed

The system starts small and grows with the first screens. Phases 1, 3, 4, 5, 6 and 7 of `SKILL.md` run, in the order below. Inventory shrinks to a search for brand material, and the pilot is the first real screen. Seed waives what needs a shipped app: before screenshots, the migrate audit, the codemod and the migration map. `token-mapping` runs once the tokens and the pilot exist, as the check that every value the pilot uses has a role.

The default foundation is shadcn, because one command gives the team component files it owns and a single token file of surface and foreground pairs, which is the shape this skill documents. A framework, package library or team package the person names wins over the default. The commands to create the app and apply a preset are in the base reference.

1. **Collect what exists.** Logo files, a font, a color in a README, a style guide, a product name. Record each with its path. A color the README or brief names is brand material, not a proposal. Nothing found is a valid result.
2. **Create the app** with the framework's own starter, then the foundation's setup, per the base reference. Scaffold into a temp folder when the starter refuses a non-empty repo, and move the files in, keeping the repo's own README, `.git` and agent folders.
3. **Pick the base color.** Keep the preset's neutral gray unless the brand material is clearly warm or cool, then switch to the nearest base the foundation offers and record why. The brand hex goes into the primary role, converted to the file's color format with a script, never by eye, and the source hex stays in the role comment. Measure the primary foreground on it. No other role takes the brand color until a screen needs it.
4. **Propose a direction.** One short paragraph on type, color, density and radius, drawn from the brand material and the preset. A brand value, and any value that departs from the preset, is a gate with a default. A preset value kept as it ships is a decision, recorded once with the preset's name, because a gate for every stock value asks the person nothing. When the brief says mobile first or names phones, primary actions and standalone buttons are at least 44px tall at phone widths, as a decision, because that is the common touch-target guideline. Record where the main action sits and the safe-area insets. With one brand hex, keep it for fills in both themes, measure it as text on the dark surface, and gate a lighter step when it fails. The run continues on the defaults.
5. **Tokens.** Brand values go into the foundation's token file. Wire the dark theme so it reaches users, following the OS setting through a media query or a theme provider. Prove it with `capture.mjs --themes light,dark` and its default `--theme-via media`, which emulates a dark OS. A class added by hand proves only the tokens. Add success and warning pairs when the pilot shows a status, from the preset's own hues where one fits, each a gate. No other new roles until a screen needs one. Measure every text pair the pilot renders, stock variants with alpha fills included, and every non-text pair per `component-contract.md` (Accessibility). The brand is new, so a pair that fails is fixed in the owned token as a decision, with the before and after ratios.
6. **Pilot, then components.** With no screen named, the pilot is the product's main list screen: the object the README or brief names (invoices, projects, tickets), with its empty, loading and error states. When the ask rules out screens ("before we build any screens"), the pilot is the same list as a pattern page under `/system` with inert data, `/` stays a placeholder that links to it, and the pattern uses the heading level the future page will, an `h1`. Build it from the system, adding only what it needs. A settings form comes second if budget allows. Run `design-review` on it, and fix its findings as phase 6 of `SKILL.md` says.
7. **Specs.** Each component the pilot uses gets a spec from `spec-template.md`, citing the pilot's uses. The first spec is the coordinator's own, and the rest may fan out.
8. **Patterns.** Always document a loading, an error and an empty pattern, with the width, component and state order, whatever the pilot. Any app that loads data needs them, so Skeleton and the error pattern are never dropped as "nobody asked".
9. **Checks, then docs**, as phases 5 and 7, scaled to what exists.

Seed uses the Done list in `SKILL.md`. On top of it, the pilot renders its list, empty, loading and error states from the system, each captured at every viewport and theme, and the docs cover the three patterns.

Hard lines for seed: no invented brand. An accent color, typeface or logo treatment that is not in the brand material is a gate, and the default is the neutral preset. No component the pilot or the three patterns do not need.

## Harden

For a component layer that exists but is weak. The goal is a system the app can safely converge on. Moving the app is still `migrate-design-system`'s job. Harden runs out of budget, so order matters: the complaint first, then components and the pilot, then the docs.

1. **Frame and inventory** as phases 1 and 2, plus drift status for every component-layer file per the base reference, and each component's call sites. Start the read-only migrate audit right after step 2's token commit, so its gates match the tokens.
2. **Tokens first, and answer the complaint.** Run `token-mapping` on the raw values. Fix broken token names, and add the missing roles as pairs. A role for a value the app already ships in 2 or more places needs no gate: name it, then swap. On a values or hardcoded-colors ask, a raw color with a nearby role defaults to a new token pair, or to that nearest role, never to "keep raw". This default wins over a `token-mapping` row that says leave it raw. "Keep raw" is only for brand art, such as a wordmark or an illustration. Make every identical-value swap on every route, and prove each route at 0% with `<skills>/build-design-system/scripts/montage.mjs --diff`. When the person named colors or hardcoded values, this step is the first visible change.
3. **Diff against the template.** For each component, fill what the code already answers in `spec-template.md`, and list what is missing, such as a state with no trigger, an undecided precedence or a trap from `traps.md` the code falls into. Every line in a customized file's upstream diff becomes a decision with a reason or a gate. Save the gap list as `.design-system/harden/gaps.tsv` with the columns component, question, finding, and evidence.
4. **Fill, capped.** Specs cover the pilot's families, unless the ask wants complete docs (`coordinator-path.md`, Document everything). Families the strays touch go to a follow-up list in the handoff. Fan-out follows the rule in `SKILL.md` phase 1, with the spec template, the Combobox example and the gap rows. A missing state gets built only when a real screen reaches it, shown with a call site or a capture. Otherwise the spec says `Not applicable` with the reason. When the ask names states ("missing loading and error states"), every component gets its missing states, and state fixes come before specs past the pilot. A loading state follows `component-contract.md`. A missing precedence decision that changes behavior on a shipped screen is a gate.
5. **Converge the copies.** Duplicate components merge into the canonical one by `component-contract.md`, with a migration map entry each. Callers move only on the pilot and on cleared surfaces (`coordinator-path.md`). With no duplicate families, skip the codemod and record why.
6. **Checks** as phase 5.
7. **Pilot** as phase 6. The pilot proves the hardened components on one flow.
8. **Docs** as phase 7, for the capped families. The generated docs and the AGENTS.md block are never cut.
9. **Stray code.** Rerun the inventory and write `.design-system/harden/strays.tsv`, one row per call site that bypasses the system or uses a merged copy, with its route. This is migrate's starting inventory.
10. **Handoff** as phase 8.

Hard lines for harden: a fix to broken behavior on the pilot is a decision. An intentional behavior change on a shipped screen is a gate, and its default is applied on the run branch. A stock foundation file is never rewritten to fit a spec, since the spec describes it. Team additions follow the base reference's order of preference.

## What changes in the handoff

The handoff in `run-record.md` names the mode on its first line. Seed adds the brand gates and the proposed direction. Harden adds the gap counts before and after, the raw values swapped in step 2, the spec check's output, the follow-up list of families with no spec, and the path to `strays.tsv`, which `migrate-design-system` reads in audit mode.
