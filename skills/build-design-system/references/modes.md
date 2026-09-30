# Modes

Build mode is the procedure in `SKILL.md`. This page covers seed and harden, which reuse most of the same phases.

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

Triage names the mode. When nobody ran triage, take the first that matches, the same rule as design-system-boss's `triage.md`, which is its home. Seed when the repo has 1 or fewer routes and 2 or fewer product components (a starter page and its layout). Harden when 5 or more components are imported by 3 or more routes, and either there are no specs or families still duplicate. Otherwise build. A small shipped app is build, never seed.

Every mode ends check-first: tokens, one canonical component per family in scope, the pilot flow on the system, docs, a ratcheting CI check that warns on new drift (`checks.md`, CI tiers) and the AGENTS.md index. Outside the pilot only the safe moves land (`coordinator-path.md`, Clearance). Migrating every other screen is a separate mode, `migrate-design-system` in full mode, and runs only on an ask that names it, such as "migrate everything", "move every screen" or "clean up every page". "Clean the app up" or "make it consistent" alone gets check-first plus the found-not-fixed list (`run-record.md`, Handoff report), and Next offers the migration with its size.

## What decides a question

When sources disagree, take the first that settles it:

1. The person's bans and explicit calls: what they said in this run or saved to memory, gates they answered, and decisions already in the run record or `docs/system/decisions.md`. Their taste is a ground for rules (`rule-method.md`, Grounds).
2. The person's own design source, at the fidelity they chose (below). At reference only it decides nothing by itself.
3. `traps.md`. A trap outranks shipped code, even when the trap is the app's majority. The conflict becomes a gate whose default is the trap's fix (`traps.md`).
4. The person's exemplars, the one to three screens named in the Frame (`run-record.md`, Questions). A rule drawn from one outranks the majority, as a gate whose default is the exemplar's pattern. With none named, this level is empty.
5. The app's evidence: project rules in AGENTS.md or CLAUDE.md, the system's own specs and docs once they exist, then shipped code in the same area. Shipped code shows what users see today, not that it is right. A pattern shipped on one screen is a candidate, not a rule. Old docs sit here too.
6. Principles.
7. Outside systems the person named, such as a public design system. They are general guidance and never override the person's design file.

A conflict between two sources at the same level is a gate. Before any writer starts, each conflict between named sources, and between a source and the bans, becomes a numbered row in `docs/system/decisions.md`.

## Following a design source

A design file, brand kit or mockups the person gives may be a reference or the target. The Frame asks which with the host's question tool (`run-record.md`, Questions), and when the source defines a look the app does not have, whether it lands in place or in a new folder. The run follows the answer. A new visual direction happens only when the person chose it there. The default is reference only, because the person may want the current look, and a full restyle is expensive to undo.

Whatever the answer, the pilot, baselines, pixdiff, the check and `gen-docs.mjs` run against the layer being built. A layer built in a new folder lists its adoption blockers in the handoff (`run-record.md`, Handoff report).

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

The system starts small and grows with the first screens. Phases 1, 3, 4, 5, 6, 7 and 8 of `SKILL.md` run, in the order below. Inventory shrinks to a search for brand material, and the pilot is the first real screen. Seed waives what needs a shipped app: before screenshots, the migrate audit, the codemod and the migration map. `token-mapping` runs once the tokens and the pilot exist, as the check that every value the pilot uses has a role.

The default foundation is shadcn, because one command gives the team component files it owns and a single token file of surface and foreground pairs, which is the shape this skill documents. A framework, package library or team package the person names wins over the default. The commands to create the app and apply a preset are in the base reference.

1. **Collect what exists.** Logo files, a font, a color in a README, a style guide, a product name. Record each with its path. A color the README or brief names is brand material, not a proposal. Nothing found is a valid result.
2. **Create the app** with the framework's own starter, then the foundation's setup, per the base reference. Scaffold into a temp folder when the starter refuses a non-empty repo, and move the files in, keeping the repo's own README, `.git` and agent folders.
3. **Pick the base color.** Run `node <skills>/build-design-system/scripts/oklch.mjs` on the brand hex and on each gray base the foundation offers, and record their hue and chroma. When the brand's chroma is at or above the gray threshold, default 0.05, the chroma below which a color reads as gray, switch to the base whose hue is nearest the brand's, as a gate defaulting to that switch. Neutral bases, whose hue is none, stay out of the hue match. Otherwise keep the preset's neutral gray. The brand hex goes into the primary role, converted to the file's color format with a script, never by eye, and the source hex stays in the role comment. Measure the primary foreground on it. No other role takes the brand color until a screen needs it.
4. **Propose a direction.** One short paragraph on type, color, density and radius, drawn from the brand material and the preset. A brand value, and any value that departs from the preset, is a gate with a default. A preset value kept as it ships is a decision, recorded once with the preset's name, because a gate for every stock value asks the person nothing. When the brief says mobile first or names phones, primary actions and standalone buttons are at least 44px tall at phone widths, as a decision, because that is the common touch-target guideline. Record where the main action sits and the safe-area insets. With one brand hex, keep it for fills in both themes, measure it as text on the dark surface, and gate a lighter step when it fails. The run continues on the defaults.
5. **Tokens.** Brand values go into the foundation's token file. Wire the dark theme so it reaches users, following the OS setting through a media query or a theme provider. Prove it with `capture.mjs --themes light,dark` and its default `--theme-via media`, which emulates a dark OS. A class added by hand proves only the tokens. Add success and warning pairs when the pilot shows a status, from the preset's own hues where one fits, each a gate. No other new roles until a screen needs one. Measure every text pair the pilot renders, stock variants with alpha fills included, and every non-text pair per `component-contract.md` (Accessibility). The brand is new, so a pair that fails is fixed in the owned token as a decision, with the before and after ratios.
6. **Pilot, then components.** With no screen named, the pilot is the product's main list screen: the object the README or brief names (invoices, projects, tickets), with its empty, loading and error states. When the ask rules out screens ("before we build any screens"), the pilot is the same list as a pattern page under `/system` with inert data, `/` stays a placeholder that links to it, and the pattern uses the heading level the future page will, an `h1`. Build it from the system, adding only what it needs. A settings form comes second if budget allows. Run `ui-review` on it, and fix its findings as phase 6 of `SKILL.md` says.
7. **Specs.** Each component the pilot uses gets a spec from `spec-template.md`, citing the pilot's uses. The first spec is the coordinator's own, and the rest may fan out.
8. **Checks, then docs, then handoff**, as phases 5, 7 and 8, scaled to what exists. Phase 7 documents the shared state patterns.

Seed uses the Done list in `SKILL.md`. On top of it, the pilot renders its list, empty, loading and error states from the system, each captured at every viewport and theme.

Hard lines for seed: no invented brand. An accent color, typeface or logo treatment that is not in the brand material is a gate, and the default is the neutral preset. No component the pilot or the state patterns do not need.

## Harden

For a component layer that exists but is weak. Moving the app is still `migrate-design-system`'s job. Harden runs out of budget, so order matters: the complaint first, then components and the pilot, then the docs.

1. **Frame and inventory** as phases 1 and 2, plus drift status for every component-layer file per the base reference, and each component's call sites. Start the read-only migrate audit right after step 2's token commit, so its gates match the tokens.
2. **Tokens first, and answer the complaint.** Run `token-mapping` on the raw values. Fix broken token names, and add the missing roles as pairs. A role for a value the app already ships in 2 or more places needs no gate. Name it, then swap. A raw color within `token-mapping`'s tolerance of a role maps to that token, as a decision. Beyond tolerance, it is a gate whose default is the merge, the same rule as `SKILL.md` phase 3, never "keep raw", except for the values in `token-architecture.md` (What never becomes a token), such as a `graphic`. The other answer the gate offers is a new pair. Make every identical-value swap on every route, proven as `run-record.md` (Terms) defines it. When the person named colors or hardcoded values, this step is the first visible change.
3. **Diff against the template.** For each component, fill what the code already answers in `spec-template.md`, and list what is missing, such as a state with no trigger, an undecided precedence or a trap from `traps.md` the code falls into. Every line in a customized file's upstream diff becomes a decision with a reason or a gate. Save the gap list as `.design-system/harden/gaps.tsv` with the columns component, question, finding, and evidence.
4. **Fill, capped.** Specs cover the pilot's families, unless the ask wants complete docs (`coordinator-path.md`, Document everything). Families the strays touch go on the found-not-fixed list. Fan-out follows `worker-brief.md` (When to delegate), with the spec template, the Combobox example and the gap rows. A missing state gets built only when a real screen reaches it, shown with a call site or a capture. Otherwise the spec says `Not applicable` with the reason. When the ask names states ("missing loading and error states"), every component gets its missing states, and state fixes come before specs past the pilot. A loading state follows `component-contract.md`. A missing precedence decision that changes behavior on a shipped screen is a gate.
5. **Converge the copies.** Duplicate components merge into the canonical one by `component-contract.md`, with a migration map entry each. Callers move only on the pilot and on cleared surfaces (`coordinator-path.md`). With no duplicate families, skip the codemod and record why.
6. **Checks** as phase 5.
7. **Pilot** as phase 6. The pilot proves the hardened components on one flow.
8. **Docs** as phase 7, for the capped families. The generated docs and the AGENTS.md block are never cut.
9. **Stray code.** Rerun the inventory and write `.design-system/harden/strays.tsv`, one row per call site that bypasses the system or uses a merged copy, with its route. This is migrate's starting inventory.
10. **Handoff** as phase 8.

Hard lines for harden: a fix to broken behavior on the pilot is a decision. An intentional behavior change on a shipped screen is a gate, and its default is applied on the run branch. A stock foundation file is never rewritten to fit a spec, since the spec describes it. Team additions follow the base reference's order of preference.

## What changes in the handoff

The handoff in `run-record.md` names the mode on its first line. Seed adds the brand gates and the proposed direction. Harden adds the gap counts before and after, the raw values swapped in step 2, the spec check's output, a found-not-fixed row per family with no spec, and the path to `strays.tsv`, which `migrate-design-system` reads in audit mode.
