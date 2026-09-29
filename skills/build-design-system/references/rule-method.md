# Rule method

> For the team setting this up: how a worker writes the rules for one primitive, in any app. It carries no rules of its own. Every rule comes from this app's code, a measurement on it, or a named principle. Keep the rule shape, the grounds and the four tests. Extend the question bank when your product has a concern it misses.

Contents

- Where rules go
- Order of work
- The question bank
- Grounds
- Rule shape
- Limits by measurement
- Test every rule before it ships
- Anti-patterns
- Worked derivation

## Where rules go

A spec's `## Usage` holds six H3s, in this order (`spec-template.md`):

| H3 | Holds |
|---|---|
| `### When to use` | Situations, one per line |
| `### When not to use` | Situations, each naming the alternative |
| `### Behavior` | Rules on states over time, input methods, focus and feedback |
| `### Limits` | Measured rules on count, length and size |
| `### Content` | Rules per copy slot, citing `writing.md` rules where one applies |
| `### Best practices` | Up to five rules on composition, placement and density, the ones a reader must not miss |

Accessibility answers stay in `## Accessibility`. A rule lives in one place. Other sections cite its ID.

## Order of work

1. Collect before writing. List every call site with its props, pull the component's rows from `docs/system/copy-inventory.tsv`, and open the component on a real route at the narrowest width the app supports.
2. Answer the question bank in order, noting where each answer came from.
3. Draft each rule in the shape below, with its ground. Drop any draft without one.
4. Run the four tests. Rewrite or gate what fails.
5. Record the tests, write the spec's Usage, and send outliers to the stray list.

The first family's worker, usually the coordinator, does this end to end. Other workers copy its depth, never its values.

## The question bank

Ask every question for every primitive. An answer becomes a rule, a table row, or `Not applicable: <reason>`. Skipping a question is not an answer.

1. **Job.** What does it do, in one sentence a user would recognize, and which job is it mistaken for? Goes in Description and When to use.
2. **Not for.** Which neighboring jobs belong to another component, and what observable condition sends a user there? Goes in When not to use, and Related links back.
3. **Where it breaks.** Grow each dimension until something fails: content length, item count, nesting, viewport width, input method, locale (longer strings, right to left), and data states (empty, one, many, slow, failed, stale). Goes in Limits and Behavior.
4. **Limits.** At each break, what number does the alternative take over at? Goes in Limits, measured.
5. **Copy slots.** Which text does it render (label, title, body, action, placeholder, helper, error, empty, tooltip, status)? For each, what casing, grammar template, length and forbidden words hold? Goes in Content.
6. **States over time.** Idle, pending, success, failure and recovery. What does the user see and do in each, and how long does feedback stay? Does anything persist, time out, undo, or survive a reload? What happens to a second press while pending, and where is focus? Goes in Behavior, with the mechanics in the States table.
7. **Input methods.** Walk the full task with pointer, touch, keyboard and a screen reader. What can one method not reach (hover-only, right-click-only, drag-only), and what is its other path? Goes in Behavior and Keyboard.
8. **Accessibility contract.** Role, accessible name in every variant, announcements and their timing, focus after each transition, contrast as drawn, target size, motion. Goes in Accessibility.
9. **Composition.** What may it contain, and what may it sit inside? Which pairings break focus, nesting or semantics? Goes in Best practices, and one example file shows the main pairing.
10. **Density and placement.** How many may share a screen, a row or a container? Where does it sit relative to what it acts on? Goes in Best practices or Limits.

## Grounds

Every rule rests on at least one ground, cited after `Evidence:`. A rule with no ground is cut, never softened.

| Ground | Write it as | What counts |
|---|---|---|
| App evidence | `app <n>/<m> <what was counted>, <command or file>` | At least two real call sites. The majority becomes the rule and the outliers go on the stray list |
| Single use | `single use <file:line>, <why it generalizes>` | One call site, stated as one. Pair it with a measurement or a principle, or the rule ships as `NEEDS REVIEW` |
| Measurement | `measured <value>, <evidence path or command>` | A probe, script or computed style on this app, saved under `.design-system/evidence/<component>/` and cited by path |
| Principle | `principle <kind>: <name and mechanism>` | `wcag` with the criterion number, `platform` with the native element or OS convention, `heuristic` with the named usability heuristic, `input` with the input model. Say how it applies here |
| Person | `person "<their words>", <date>` | A ban or preference the person stated in this run, quoted. It outranks the app's majority (`modes.md`, What decides a question) and needs no second ground |

A principle sets a direction. A number comes from the app or a measurement, unless the principle states one, as a WCAG criterion does.

A majority that is itself a trap from `traps.md` never becomes a rule. It becomes a gate whose default is the trap's fix. That includes copy rules from `writing-method.md`.

## Rule shape

Each rule is one list item:

```markdown
- `rule/<component>-<slug>`: When <observable condition>, <do or don't action>, because <reason>. Evidence: <ground>[; <ground>]. Check: <lint | test | probe | review> <what runs>.
```

- The ID is `rule/` plus the component's registry id, a hyphen and a slug of lowercase words: `rule/segmented-max-options`. Foundation pages use their slug, as in `rule/writing-verb-chain`. IDs never change once shipped.
- The condition is observable in code or on screen: a count, a prop value, a state, a viewport, a slot.
- The action holds at least one checkable token: a number with its unit, a quoted literal, a template with `{holes}`, a component name, or a prop or attribute in backticks.
- Every don't names what to do instead, with the word "instead".
- `Check:` names `lint`, `test`, `probe` or `review`, then what runs. Where the language allows, encode the rule in the component's types or a dev-time warning, so the typecheck fails the violation. That counts as `lint`. A rule a script can see gets a check under its own ID, with fixtures (`checks.md`).

These words fail a rule outright: "appropriate", "consistent", "properly", "as needed", "user-friendly", "should consider". These fail unless a number sits in the same rule: "short", "long", "few", "many", "clear", "concise", "simple", "large", "small". Replace each with the number or literal it stands for. A team adds words to `docs/system/vague-words.txt`, one per line, and prefixes a word with `?` when a number beside it makes it acceptable.

## Limits by measurement

A limit is a number set below a measured break.

1. Render the primitive on a real screen or example at the narrowest width the app supports.
2. Grow one dimension at a time with the app's longest real content: items, label characters, nesting depth.
3. Record the first value where it breaks: the label wraps, text truncates, the box overflows its container or the viewport, a row pushes past the first screen, or a neighbor shifts. `probe.mjs --grow` does this and writes JSON to the evidence folder. It detects a list's axis: a vertical list never wraps, so its break is the first item that needs scroll or the list passing the viewport. For options in a pop-up rendered outside the component, open it with `--click` and pass `--item`, which the probe finds anywhere in the page.
4. Set the limit one step below the break. Name the alternative that takes over past it, and cite the measurement.
5. When real call sites already exceed the limit, say whether the limit is wrong or those sites are strays, with the count.

A limit with no measurement and no app evidence is a gate, with the app's current maximum as its default.

## Test every rule before it ships

Run the four tests on each rule and record them in `docs/system/rule-tests/<component>.tsv`, one row per rule, with these columns:

```
rule_id	falsify	negation	two_agent	sweep	verdict	notes
```

Each test cell holds `pass` or `n/a: <reason>`. The verdict is `ship`, `rewritten` (a draft failed, the rewrite passed all four, and `notes` says what changed) or `gate` (the rule left the spec as a gate, `notes` names it, and the page keeps one `Gated:` line in its place, per `spec-template.md`, Answering well, Gated rules). A rule still failing a test does not ship.

- **Falsify.** Write one snippet that breaks the rule. Confirm the named check fails it, or that a reviewer given only the rule flags it. If no violation can be written, cut the rule. For a `lint` or `test` rule, the snippet becomes its failing fixture.
- **Negation.** Write the opposite rule. If it sounds just as fine against the same grounds, the rule is taste. Sharpen it with a number or a reason, or make it a gate.
- **Two agents.** Give the rule and one task from this app to two fresh agents with no other context. If what they build differs on what the rule governs, add the missing number, literal or condition and rerun.
- **Sweep.** Search every call site. Each one follows the rule or is listed as an exception on the stray list with its `file:line`. When exceptions outnumber followers, the rule contradicts the app and becomes a gate.

## Anti-patterns

- **Restating the prop list.** "Use `size` to set the size" is the Props table. A rule says when a value is right and what breaks otherwise.
- **Taste without a reason.** A "because" that repeats the rule ("because it looks cleaner") fails the negation test.
- **Rules no one can check.** If nothing can tell a violation from a pass, the rule is decoration.
- **Overruling the majority without a gate.** A rule grounded only in a principle that contradicts what most call sites do changes shipped screens. It is a gate with the principle as its default, never a silent rule.
- **Importing another product's rules unasked.** A number or literal from another system is not a ground. Derive this app's own. A public guide the person named sets a direction, like a principle, and never supplies wording or values.

## Worked derivation

An invented scheduling app has a SegmentedControl on three screens. The spec worker takes question 4, Limits.

**Question.** At what option count does SegmentedControl stop working, and what takes over?

**App evidence.** `rg -n "<SegmentedItem\b" app components` gives 3 call sites with 2, 3 and 3 options. Nothing near the break was built, so the count sets no number.

**Measurement.** On the calendar route at the app's narrowest width, 390px, with its longest real label ("Fortnight", 9 characters):

```sh
node <skills>/build-design-system/scripts/probe.mjs --grow --base http://localhost:3000 --route /calendar \
  --target '[data-slot=segmented]' --item '[data-slot=segmented-item]' --dimension count --max 8 --widths 390 \
  --out .design-system/evidence/segmented/
```

It reports `overflow at 5: scrollWidth 402 > clientWidth 358`. Four options fit with 12px to spare.

**Principle.** `principle platform: native select`. Once the options no longer fit, a list that opens on demand keeps each one reachable at any width.

**Rule.**

```markdown
- `rule/segmented-max-options`: When a choice has more than 4 options, use Select instead of SegmentedControl, because at 5 options with the app's longest label the control overflows its container at 390px. Evidence: measured overflow at 5 options (402 > 358px), .design-system/evidence/segmented/grow-count-390.json; app 3/3 call sites use 2 to 3 options; principle platform: native select. Check: lint `rule/segmented-max-options` counts `SegmentedItem` children.
```

**Tests.** Falsify: a fixture with 5 items fails the lint, and 4 pass. Negation: "keep SegmentedControl past 4 options" contradicts the measurement. Two agents: given "add a view switch for Day, Week, Fortnight, Month and Year", both pick Select. Sweep: 3 of 3 call sites comply. Verdict `ship`.
