# Mapping rules

Replace the categories, tolerances and gap threshold with your own before the first real run, since the skill treats this file as agreed. Keep the four classes and purpose before value.

## Classifications

Each row gets exactly one class per mode. Purpose is checked first, then value.

**Exact.** A token's stated purpose covers the row's job, and the normalized values are identical.

**Semantic.** A token's stated purpose covers the row's job, and the value is within its category's tolerance. The reason states the difference, such as "15px against 16px, 1px under".

**Ambiguous.** Two or more candidate tokens fit the job and nothing in these rules picks one. Every ambiguous row names all its candidates, so a row with fewer than two is never ambiguous.

**Gap.** No token's stated purpose covers the job within tolerance, whatever the numbers say, as with zero candidates. So is a row whose purpose fits exactly one token with the value outside tolerance. Its reason names that token and the difference ("closest color.text.subtle, ΔE OK 3.4 over"), and For a person to decide asks whether the value or the token moves. A gap never proposes a new token name.

**Not mapped.** Counted in the Summary with no row. A role token with an alpha applied, such as `color-mix()` over its `var()` or a utility's alpha modifier, is token + alpha. A palette value with an alpha stays palette use and gets a row. Values in the `graphic` category are excluded by default.

A value that equals a token but serves a different purpose is never a match. It becomes ambiguous or a gap, and the token goes in Do not use.

If the list states no purpose at all, the run is value matching only. Rows can still be exact or semantic, each reason beginning "Value only", and Do not use stays empty because it cannot be checked. A value that matches no token within tolerance is a gap. The report adds Consistency by role, because value matching alone cannot say whether colors are used consistently.

A palette-only list (names like `gray-500` with no roles) makes almost every palette row Exact by definition, which says nothing. So Consistency by role becomes the main output, right after the Summary, and the mapping table keeps only rows that are not Exact. The Summary still gives the Exact count.

## What counts as the team's list

The team's list is what the project itself declares: token files, theme entries where the app's styling layer defines tokens, custom properties on `:root`, and a component library's variable pairs. A styling framework's default theme is not the team's list, even when its utilities compile. The foundation references in `../build-design-system/references/` (`base-*.md`) say where each stack declares its tokens.

- **Token use.** A `var()`, or a utility class generated from one, built from a name the project declares with a role, such as `var(--muted)` or a `bg-muted` class. Skipped.
- **Palette use.** A palette-scale name, such as `var(--color-gray-500)` or a `text-gray-500` class, whether it comes from a framework's default palette or a scale the project declares. It names a value and no job, so it gets a row and a class like a raw value, counted apart from raw values.
- **Raw value.** A hex, `rgb()`, `oklch()` or other literal, including one written inside a utility class.

`token-mapping`, the boss's `triage.sh` and `migrate-design-system`'s inventory sort uses the same way but count different units. token-mapping counts occurrences, one per property use, while triage counts lines, so the report names its unit.

## Aliases and modes

- Resolve an alias chain to its final value before comparing.
- When a semantic token (`color.text.subtle`) and its primitive (`gray.600`) both match, map to the semantic token if its purpose fits. Map to a primitive only when no semantic token covers the job, and say so in the reason.
- Map each mode asked for as its own column or rows. With none named, use the list's default mode and say which in Source.
- A value that matches in light mode but not in dark is not exact. Report the mode where it fails.

## Categories

A candidate must belong to the same category as the row's job.

- Color, split by role: surface, text, border, icon, action, focus, status. `action` is the fill and text of a control that acts, such as a button
- Spacing, split by job: inset (padding inside a component) and gap (space between items). One scale often serves both, so record which job the row does
- Size: fixed widths, heights, icon sizes
- Radius
- Border width
- Typography: family, size, weight, line height, letter spacing
- Shadow: offset, blur, spread, color, each as its own row
- Opacity
- Motion: duration and easing
- Z-index
- Graphic: logo art, illustrations, decorative gradient stops and masks. Excluded from rows and counts by default, and listed once under Source with a count and locations. A caller can bring it back in. `build-design-system` keeps these raw too (`token-architecture.md`, What never becomes a token).

A row whose job or category cannot be read is ambiguous when the jobs it might do give two or more candidates between them, and otherwise a gap marked "job unread". Do not guess one.

## When the repo has no token file

The run stops, and the groundwork goes back grouped the way Geist lays out its foundations, the grouping `build-design-system` also uses.

- Color: surfaces, text, borders, icons, action, focus and status, each with its theme
- Typography: families, sizes, weights, line heights, letter spacing
- Materials: how a surface is finished, meaning radius, border width and shadow
- Space and layout: inset, gap, fixed sizes, breakpoints
- Motion: durations and easings
- Other: opacity and z-index

Under each group, list the distinct normalized values with counts and locations. Name no role or token, since that is the job of whoever builds the set.

## Normalizing

Before comparing, convert both sides to one form.

- Lengths go to px. Use a 16px root for `rem` unless the project sets another.
- Line height goes to a unitless ratio. 24px on a 16px font is 1.5.
- Colors go to OKLCH, plus alpha. Accept hex (3, 4, 6 or 8 digits), `rgb()`, `hsl()`, `hwb()`, `oklch()`, `oklab()` and named colors. OKLCH keeps colors outside sRGB, such as P3 `oklch()` values, unclipped.
- Compare two colors by ΔE OK, the distance between them in OKLab times 100, the scale `oklch.mjs` prints. Under 0.5 counts as identical, which absorbs 8-bit rounding.
- Alpha is part of the color. `#0F172A` at 80% is not `#0F172A`. Alphas must match within the opacity tolerance.

## Tolerances

Tolerance only applies after purpose fits. It never turns a wrong-purpose token into a match. A difference equal to the limit is inside it.

These defaults let rounding and drift merge while neighboring scale steps stay apart. Adapt them to your base unit and scale. `build-design-system` merges values inside them without asking, so change them here.

| Category | Default limit | Why |
|---|---|---|
| Color | ΔE OK 2. Under 0.5 is exact | Near the smallest visible difference |
| Spacing, size, radius | 2px | Half a 4px grid step |
| Border width | None | 1px and 2px read differently |
| Font size | 1px | Scale steps sit 2px or more apart |
| Font weight, family, easing | None | Each value is a choice |
| Line height | 0.05 as a ratio | px rounding |
| Letter spacing | 0.01em | Too small to see |
| Opacity | 0.02 | 8-bit alpha rounding |
| Duration | 30ms | Too short to notice |

## Gap threshold

When gaps are more than 30% of rows (the default), the likelier cause is the wrong token list, and the table cannot be acted on as a migration list. The run still completes. Start the report with `Status: not actionable (gap threshold)` and ask under For a person to decide whether this is the right list. Adjust the share if your lists are usually thinner or fuller.

- Count rows, one per property, after classifying everything, and deliver the full table with the question.
- Leave unverified rows (from a partial read) out of the count, and say how many.
- Under 12 rows (the default), report the gaps and say the sample is too small to judge coverage.
- Token + alpha and graphic values are not rows, so they never count.

## Consistency by role

Write this section when the list states no purposes or the ask is about consistency. Group every color row (raw and palette) by role: text, surface, border, icon, action, focus, status. For each role, give the distinct values with counts, their spread in ΔE OK, and the near pairs that likely mean one thing. A near pair is under ΔE OK 5 by default, close enough that two values in one role were likely meant as one. Name no token for any cluster. Example:

```markdown
- Text: 6 values over 212 rows. gray-500 (88), gray-600 (61), #666 (9) sit within ΔE OK 4 and likely mean one muted text.
- Surface: 3 values over 140 rows. white and gray-50 carry 131 of them.
- Status, error: red-500 (14) and red-600 (11), ΔE OK 6, used for the same error text in two areas.
```

## Source conflicts

A conflict is two sources that give one name two values, or one purpose two names, in the same mode. A common case is a hand-edited CSS file drifting from the JSON it was generated from. An alias to a primitive, per-mode values and a deprecated token beside its replacement are not conflicts.

With a precedence rule in CLAUDE.md, AGENTS.md or a `docs/system/decisions.md` row, follow it and name it in Source. The losing source still appears in For a person to decide. With no rule, report both and do not choose.

One list holding the same name with two values in the same mode is a broken list, not a conflict. Stop.

## Report shape

The Summary's first line answers the question the person asked, in one sentence, before any count. "Are colors consistent?" gets yes, no or mostly, and why. A mapping ask gets how much maps and what blocks the rest.

The counts line gives rows split into raw and palette, then exact, semantic, ambiguous, gap and Do not use, in occurrences, and says so. Token + alpha and graphic follow as not mapped. A list with no stated purpose adds "Value matching only" to it.

The mapping table's columns are value, location, job, token, class and reason, sorted by file and line so it doubles as a migration list. Do not use gives each token with the purpose it does have. Ambiguous gives every candidate and the fact that would settle the row. Gaps give what the value does and why no token covers it, and Consistency by role follows them when written. For a person to decide asks about the ambiguous rows, the gaps and any open conflict. Source gives the list's name, format, path, read method, date and time, the modes, the color conversion command and exit code, any precedence rule applied, and every assumption. The report's last line starts `Coverage:` and names the files, routes and modes read, then what was not: excluded paths, unverified rows and modes not mapped.

```markdown
## Summary
Mostly. 25 of 30 rows land on a token, and the 2 gaps are both component heights.
Rows 30 occurrences (raw 22, palette 8). Exact 21, Semantic 4, Ambiguous 3, Gap 2, Do not use 1.
Not mapped: token + alpha 5, graphic 3 (excluded).
Mode: light. Dark not mapped.

## Mapping
| Value | Location | Job | Token | Class | Reason |
|---|---|---|---|---|---|
| #0F172A | src/ui/InvoiceRow.tsx:18 | Row title text | color.text.default | Exact | Purpose fits, value identical |
| 14px | src/ui/InvoiceRow.tsx:22 | Row padding, inset | space.inset.sm (12px) | Semantic | Purpose fits, 2px over, at the limit |
| rgb(100 116 139) | src/ui/InvoiceRow.tsx:31 | Due date text | color.text.subtle | Exact | Same color as #64748B. Semantic token chosen over gray.500 |

## Do not use
- color.border.focus for the overdue badge fill (src/ui/Badge.css:9). Same value, #2563EB, but the token marks focus rings.

## Ambiguous
- 10px, gap between avatar and name (src/ui/Owner.tsx:12). Candidates space.gap.xs (8px) and space.gap.sm (12px). Both are gap tokens and 10px sits 2px from each. Settled by a rule on which way dense rows go.

## Gaps
- 52px, fixed height of the table header (src/ui/Table.css:4). No size token covers component heights.

## For a person to decide
- Which way the 10px avatar gap resolves.
- Whether table header height should be a token.

## Source
tokens/tokens.json, DTCG format, read from the repo on 2026-03-12 at 14:10. Light mode. No second source. Colors converted to OKLCH and compared by ΔE OK with `node <skills>/build-design-system/scripts/oklch.mjs` (exit 0). Graphic excluded: 3 values in src/ui/Logo.tsx.

Coverage: src/ui/InvoiceRow.tsx, Badge.css, Owner.tsx, Table.css and Logo.tsx, light mode. Not read: dark mode, and files outside src/ui/.
```
