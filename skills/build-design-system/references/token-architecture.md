# Token architecture

The default below fits hand-rolled apps. When the repo already has a token source other tools read, keep its format, apply the layer and naming rules inside it, and record the departure. When the foundation owns a token file, the base reference decides where tokens live.

Contents

- The default and why
- When the foundation owns the tokens
- Layers
- Naming
- Source format
- Themes and modes
- Generation
- Motion presets
- What never becomes a token
- When a new token is allowed
- Worked example

## The default and why

Three layers, stored as W3C Design Tokens (DTCG) JSON, generating CSS custom properties and whatever theme mapping the styling framework reads.

Each output has its own reader: people read the JSON descriptions, browsers the CSS variables, a utility framework its theme mapping, and agents the Markdown tables.

Choose a lighter setup when the system is small: one theme, no utility framework, and few distinct values across all categories (default cutoff about 40, the point where a hand-kept file stops being easy to scan). Then a single hand-written CSS file of semantic variables, with a role comment per variable, is enough. The role comment does the job of `$description`. The docs generator reads it, and a variable without one fails the Done list. Record the choice. The naming rules below still apply.

## When the foundation owns the tokens

Some foundations already have a token file that other tools write into. A generator that takes it over breaks those tools.

- A copy-in component foundation keeps its CSS variable pairs as the semantic layer, with its own names, and new roles become new pairs in the same file. No DTCG generator by default (`base-shadcn.md`).
- A package library's theme object is the source, in the shape the library reads. DTCG, if wanted, generates that object (`base-library.md`).

The naming, role and "never becomes a token" rules below still apply inside those files, except renaming. A foundation's names are never renamed.

## Layers

| Layer | Holds | Who reads it | Changes per theme |
|---|---|---|---|
| Primitive | Raw values with palette names: `gray.900`, `blue.600`, `space.4` | Semantic tokens only | No |
| Semantic | Roles: `color.text.default`, `color.surface.raised`, `space.inset.md` | Components and product code | Yes |
| Component | Values one component needs to theme apart from the rest: `button.primary.bg` | That component only | Sometimes |

Rules that follow from the table:

- Product code and components read semantic tokens. A component reading a primitive fails the check.
- A semantic token's value is an alias to a primitive, `{color.gray.900}`, never a raw value. This keeps every raw value in one layer.
- Start with zero component tokens. Add one only when a component must differ from its semantic role in one theme or brand. Delete a component token that only aliases a semantic one.
- Primitives do not change per theme. Themes swap which primitive a semantic token points to.

## Naming

Semantic names read as category, then role, then variant, then state, from general to specific: `color.text.subtle`, `color.border.focus`, `color.action.primary.bg.hover`.

- Name by purpose. `color.text.danger`, not `color.red`. An agent picks tokens by name, so the name must say where the token goes.
- Pair every surface with its foreground: `color.surface.inverse` and `color.text.inverse`. Contrast is checked on the pair.
- Use one word per idea across the whole set. If `subtle` means lower emphasis in text, it means the same in borders. Do not also use `muted` or `secondary` for it.
- Keep existing names the inventory shows in correct use, even when you would have named them differently. Renaming a working token costs every caller and helps nobody. Split a token only when the inventory shows it used for two roles, and record the split.
- No brand or product words in semantic names, such as `color.acme` or `space.dashboard`. Those are gates.
- CSS output flattens the path with hyphens: `color.text.subtle` becomes `--color-text-subtle`.
- When a utility framework builds class names from token names, a role that starts with a property word doubles it, such as `text-text-muted`. Name those keys so the class reads once, and point them at the flattened variable. The check's `rule/doubled-utility` flags the doubled forms, and the base reference gives the framework's naming.

Typical semantic groups, to be trimmed to what the inventory supports:

- Color: `surface`, `text`, `border`, `icon`, `action`, `status` (`info`, `success`, `warning`, `danger`), `focus`
- Space: `inset` (padding inside a component) and `gap` (space between items), each on one scale
- Size: control heights, icon sizes
- Radius: `control`, `container`, `full`
- Typography: composite text styles (`text.body`, `text.label`, `text.heading.1`) that set family, size, weight, line height and letter spacing together
- Shadow and elevation, border width, opacity, motion duration and easing, z-index layers

## Source format

One file per category under `tokens/`, plus one file per theme. DTCG rules that matter here:

- Every token has `$value`. Set `$type` on the group so children inherit it.
- Every semantic token has a `$description` that states its role in one sentence. The docs and `token-mapping` read purpose from it.
- Aliases use `{group.token}`. A circular alias is an error the generator must report.
- Mark a retired token with `$deprecated` and the name of its replacement as the reason string.
- Keep tool-specific data under `$extensions` with a reverse-domain key.
- A brand value given as hex keeps its exact color. When the file uses another format, such as OKLCH, convert it with code, never by eye, and keep the source hex in `$description` or the role comment. That settles "brand values stay as given" against "keep the file's format" with no gate.

```json
{
  "color": {
    "$type": "color",
    "text": {
      "default": { "$value": "{color.gray.900}", "$description": "Body text and headings on default surfaces" },
      "subtle": { "$value": "{color.gray.600}", "$description": "Secondary text such as metadata and captions" }
    }
  }
}
```

Check your generator's support before using newer DTCG features such as `$extends` or `$ref`.

## Themes and modes

- The base files hold primitives and the default theme's semantic aliases.
- Each extra theme is one file that overrides semantic aliases only, such as `tokens/theme.dark.tokens.json`. It never defines primitives.
- Every semantic token resolves in every theme. The generator fails if one is missing, and the check's `rule/token-parity` fails when a color key is in one theme block and not the other.
- Support the themes the app ships. Adding dark mode to an app that has none is a gate.
- A theme the app ships on any route counts as shipped, even half built. Each value it lacks is a gate whose default is the nearest existing role in that theme, never a new color. For a class-based dark theme with no provider, capture with `capture.mjs --theme-via class`, and the Frame notes that those captures prove the tokens only.
- Density or brand modes follow the same rule: one override file each, semantic layer only.

## Generation

The generator reads `tokens/` and writes:

- `tokens.css` with `:root { ... }` for the default theme and one block per override, using the selector the app already uses, such as `.dark` or `[data-theme="dark"]`. With no selector yet, use the one the foundation expects.
- The styling framework's theme mapping, when it has one, pointing its names at the CSS variables (the base reference has the syntax). Do not reset the framework's whole color palette to block palette classes. Stock components read colors such as black, white and transparent from it, and a full reset breaks them. The check's `rule/palette-use` catches palette classes instead (`checks.md`). A reset the team asks for is scoped to named palette families and proven on stock components in every theme.
- Optionally `tokens.d.ts` with a union of token names, so a typo in a typed style API fails type checking.
- A Markdown table per category for the foundation pages and their twins.

Requirements:

- First line of every output says it is generated and names the command.
- Output is sorted and stable. Running twice yields no diff.
- Errors name the token path, the file and the valid options, such as "Unknown alias `{color.grey.900}` in tokens/color.tokens.json. Did you mean `{color.gray.900}`?"
- Use the generator the repo already has, or a short Node script. Do not add a dependency a short script would replace.

## Motion presets

A system with overlays, toasts, loaders or toggles always makes motion decisions, so motion is a foundation even when the app barely animates. Name the presets in the token source before the first component, by job: `instant` (press), `micro` (hover), `enter`, `exit`, `overlay`, `sheet`, `collapse`, `loader` and `follow` (drag). Each has a duration, an easing, the properties it animates and its reduced-motion form. Components read presets through named utilities or variants, never their own durations, and the motion page lists each preset with the components that use it.

Classify every motion before picking its preset:

| Kind | When | How it moves |
|---|---|---|
| `input` | The element follows a pointer, drag or scroll | On `follow`: no curve and no duration. It tracks the input each frame and carries the release velocity (`trap/motion-input-lag`) |
| `announce` | The UI tells the person something changed | On a job preset. Enter eases out, and exit is shorter than enter (`trap/motion-ease-in-enter`, `trap/motion-exit-slower`) |

The app's own durations and easings are the source, clustered like any value. When the app has no motion for a job, the gate default is `instant`, no animation, because that is reversible and adds no direction. Under reduced motion the default is an opacity fade in place of movement.

Settle these with the presets, since every animated component depends on them:

- **Reason.** Announce motion exists for feedback, to show where something came from, to show a change of state, or to cover a jump. A surface with none of these gets `instant` or animates out only.
- **Frequency.** The surface's tier in `surfaces.tsv` caps its announce motion. `high` surfaces (nav, list rows, primary actions, menus) get `instant`, or motion on first open only (`trap/motion-frequent`). `mid` surfaces get the short presets, and `low` ones (settings, onboarding, empty states) may use any.
- **Speed.** Press uses `instant`, so feedback shows from pointer-down (`trap/press-delayed`). Other feedback takes the app's fastest durations, and what the user waits on anyway, such as a sheet, takes its longer ones.
- **Size.** A surface enters from the start scale the app uses, else a gate whose default is no scale, and never from 0. A pressed control scales to the app's value, else a gate with the same default. Anchored surfaces grow from their trigger, centered ones from the center, and exit reverses entry (`trap/motion-origin`).
- **Visibility.** Loops pause when off screen or in a hidden tab (`trap/loop-offscreen`), and a theme switch changes colors without transitions (`trap/theme-transition`).
- **Curve.** The job sets the shape and the app sets the values. Enters ease out, movement between two points is symmetric, and only progress and loops are linear (`trap/motion-linear`). A routine change never bounces or overshoots (`trap/motion-overshoot`). An app majority that breaks this is a gate defaulting to the fix (`traps.md`, Motion).
- **Interruption.** Each preset continues from the current value on a retrigger (`trap/motion-restart`).
- **Cost.** Presets animate transform and opacity only, through CSS or the Web Animations API, name each property, and name any exception (`trap/motion-layout-property`, `trap/motion-transition-all`).

Fix a motion finding with the first of these that clears it: delete the animation, shorten or shrink it, fix its curve or origin, make it interruptible, move it to transform and opacity.

## What never becomes a token

Tokens are for decisions someone might change across the whole app. These stay plain values:

- `0`, `100%`, `auto`, `1fr`, `currentColor`, `inherit`.
- A value used once for one layout, such as the offset of a hero illustration. Put it in that component's CSS with a comment naming what it aligns to.
- Values set by content, such as an image's aspect ratio or a chart's data colors computed from a scale.
- Values inside third-party widgets the app does not style.
- Brand art in `token-mapping`'s `graphic` category, such as a wordmark or an illustration.
- A value within `token-mapping`'s tolerance of an existing token for the same role. It maps to that token, and no new one is made.
- Math between tokens. `calc(var(--space-inset-md) * 2)` stays a calc.
- Breakpoints, if the framework already owns them. Record them on the Space and layout page.

The check allows these by rule or by an allowlist entry with a reason, so an agent does not tokenize them to silence a warning.

## When a new token is allowed

- During phase 3, when `token-mapping` reports a gap whose role repeats in two or more places, or that someone would change globally.
- After the build, only in the same change as the first code that needs it, with its `$description` and a docs line.

## Worked example

The inventory finds 23 distinct grays in text colors. Clustering by role gives body text (14 values), secondary text (7) and placeholder text (2). `token-mapping` against `text.default`, `text.subtle` and `text.placeholder` puts 19 rows under a role and marks 4 ambiguous, all gray text on a dark sidebar. Rows inside the color tolerance are decisions. The rest become one merge gate per cluster, default merge, each stating its largest shift and the screens it touches. The four ambiguous rows become one more gate: "Sidebar text uses `text.inverse` (default) or a new `text.inverse.subtle`." The token files apply the defaults now. The primitive layer keeps only the grays the clusters settled on, on a numeric scale with gaps left open. No in-between step such as `gray.150` survives to hold a legacy one-off, and no gray gets added to fill the scale. Each merge gate's "Reverses by" names the primitives to restore.
