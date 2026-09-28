# Token architecture

> For the team setting this up: the default below fits most web apps. If your repo already has a token source that other tools read, keep its format and apply the layer and naming rules inside it. Record the departure in the run record with the reason.

Contents

- The default and why
- Layers
- Naming
- Source format
- Themes and modes
- Generation
- What never becomes a token
- When a new token is allowed
- Worked example

## The default and why

Three layers, stored as W3C Design Tokens (DTCG) JSON, generating CSS custom properties and, when the app uses Tailwind v4, an `@theme` block.

The reason is that each output is a different reader. People read the JSON with its descriptions. Browsers read the CSS variables. Tailwind turns `@theme` into utilities. Agents read the generated Markdown tables. One source with generated outputs means one place to change a value and no copies to drift. DTCG is an open format, so the source outlives any one build tool.

Choose a lighter setup only when the app has one theme, under about 40 values, and no Tailwind. In that case a single hand-written CSS file of semantic variables, with a comment per variable giving its role, is enough. Record the choice. The naming rules below still apply.

## Layers

| Layer | Holds | Who reads it | Changes per theme |
|---|---|---|---|
| Primitive | Raw values with palette names: `gray.900`, `blue.600`, `space.4` | Semantic tokens only | No |
| Semantic | Roles: `color.text.default`, `color.surface.raised`, `space.inset.md` | Components and product code | Yes |
| Component | Values one component needs to theme apart from the rest: `button.primary.bg` | That component only | Sometimes |

Rules that follow from the table:

- Product code and components read semantic tokens. A component reading a primitive fails the check.
- A semantic token's value is an alias to a primitive, `{color.gray.900}`, never a raw value. This keeps every raw value in one layer.
- Start with zero component tokens. Add one only when a component must differ from its semantic role in one theme or brand. A component token that aliases a semantic token with no reason to differ is a layer with no job. Delete it.
- Primitives do not change per theme. Themes swap which primitive a semantic token points to.

## Naming

Semantic names read as category, then role, then variant, then state, from general to specific: `color.text.subtle`, `color.border.focus`, `color.action.primary.bg.hover`.

- Name by purpose. `color.text.danger`, not `color.red`. An agent picks tokens by name, so the name must say where the token goes.
- Pair every surface with its foreground: `color.surface.inverse` and `color.text.inverse`. Contrast is checked on the pair.
- Use one word per idea across the whole set. If `subtle` means lower emphasis in text, it means the same in borders. Do not also use `muted` or `secondary` for it.
- Keep existing names that the inventory shows are used correctly, even when you would have named them differently. Renaming a working token costs every caller and helps nobody.
- Rename an existing token only when the inventory shows it used for two different roles. Split it, and record the split.
- No brand or product words in semantic names, such as `color.acme` or `space.dashboard`. Those are gates.
- CSS output flattens the path with hyphens: `color.text.subtle` becomes `--color-text-subtle`.

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

Check your generator's support before using newer DTCG features such as `$extends` or `$ref`. Some tools read only `$value`, `$type` and aliases.

## Themes and modes

- The base files hold primitives and the default theme's semantic aliases.
- Each extra theme is one file that overrides semantic aliases only, such as `tokens/theme.dark.tokens.json`. It never defines primitives.
- Every semantic token must resolve in every theme. The generator fails if one is missing.
- Support the themes the app ships. Adding dark mode to an app that has none is a product decision, so it is a gate.
- Density or brand modes follow the same rule: one override file each, semantic layer only.

## Generation

The generator reads `tokens/` and writes:

- `tokens.css` with `:root { ... }` for the default theme and `[data-theme="dark"] { ... }` (or the selector the app already uses) for each override.
- On Tailwind v4, `theme.css` with an `@theme inline` block that maps Tailwind namespaces to the CSS variables, such as `--color-text-subtle: var(--color-text-subtle);`. Start the block with `--color-*: initial;` and the same for each namespace you replace, so Tailwind's default palette cannot compile. Off-system classes then fail at build time.
- Optionally `tokens.d.ts` with a union of token names, so a typo in a typed style API fails type checking.
- A Markdown table per category for the foundation pages and their twins.

Requirements:

- First line of every output says it is generated and names the command.
- Output is sorted and stable. Running twice yields no diff.
- Errors name the token path, the file and the valid options. "Unknown alias `{color.grey.900}` in tokens/color.tokens.json. Did you mean `{color.gray.900}`?"
- Use the tooling already in the repo. Style Dictionary, Terrazzo or a short Node script all work. Do not add a dependency when 60 lines of script would do.

## What never becomes a token

Tokens are for decisions someone might change across the whole app. Leave these as plain values:

- `0`, `100%`, `auto`, `1fr`, `currentColor`, `inherit`.
- A value used once for one layout, such as the offset of a hero illustration. Put it in that component's CSS with a comment naming what it aligns to.
- Values set by content, such as an image's aspect ratio or a chart's data colors computed from a scale.
- Values inside third-party widgets the app does not style.
- Math between tokens. `calc(var(--space-inset-md) * 2)` stays a calc.
- Breakpoints, if the framework already owns them. Record them on the Space and layout page.

The check allows these explicitly, by rule or by an allowlist with a reason, so an agent does not tokenize them to silence a warning.

## When a new token is allowed

- During phase 3, when `token-mapping` reports a gap whose role repeats in two or more places, or that someone would change globally.
- After the build, only in the same change as the first code that needs it, with its `$description` and a docs line.
- Never to fit a value that is within tolerance of an existing token for the same role. Map to the existing one.

## Worked example

The inventory finds 23 distinct grays in text colors. Clustering by role gives three groups: body text (14 values between `#111` and `#2a2a2a`), secondary text (7 values between `#555` and `#737373`), and placeholder text (2 values). `token-mapping` against a proposed `text.default`, `text.subtle` and `text.placeholder` puts 19 rows under the right role with values that differ, and 4 rows as ambiguous, all gray text on a dark sidebar. Color has no tolerance, so the 19 become three merge gates, one per cluster, each stating its largest shift and the screens it touches, with merging as the default. The four become one more gate: "Sidebar text uses `text.inverse` (default) or a new `text.inverse.subtle`." Work continues on the defaults. The primitive layer keeps only the grays the clusters settled on, named on a numeric scale with gaps left open. No gray gets added to fill the scale.
