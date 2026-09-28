# Mapping rules

> For the team setting this up: replace the categories, tolerances and gap threshold with your own. Keep the four classes, and keep checking purpose before value. The skill treats whatever this file says as agreed, so edit it before the first real run.

Contents: Classifications. What counts as the team's list. Aliases and modes. Categories. When the repo has no token file. Normalizing. Tolerances. Gap threshold. Consistency by role. Source conflicts. Report shape.

## Classifications

Each row gets exactly one class per mode. Purpose is checked first, then value.

**Exact.** A token's stated purpose covers the row's job, and the normalized values are identical.

**Semantic.** A token's stated purpose covers the row's job, and the value differs by no more than the tolerance for its category. Write the difference in the reason, for example "15px against 16px, 1px under".

**Ambiguous.** Two or more candidate tokens fit the job and nothing in these rules picks one. A row whose job or category cannot be read is ambiguous when the jobs it might do give two or more candidates between them. Every ambiguous row names all its candidates. A row with fewer than two candidates is never ambiguous.

**Gap.** No token's stated purpose covers the job within tolerance, whatever the numbers say. A row with zero candidates is a gap. So is a row whose purpose fits exactly one token with the value outside tolerance: its reason names that token and the difference ("closest color.text.subtle, ΔE OK 3.4 over"), and For a person to decide asks whether the value or the token moves. A gap never proposes a new token name.

**Not mapped.** Two kinds of use are counted in the summary and get no mapping row. A declared token with an alpha modifier, such as `bg-muted/50` or `color-mix()` over a `var()`, is **token + alpha**: a token use, counted as such. The modifier does not change the base's kind, so a palette utility with one, such as `bg-gray-900/50`, stays palette use and gets a row with its alpha. A value in the `graphic` category is excluded by default.

A value that equals a token but serves a different purpose is never a match. It becomes ambiguous or a gap, and the token goes in Do not use. Numbers repeat all over a system, which makes this the most common confident mistake.

If the list states no purpose at all, the run is value matching only. Rows can still be exact or semantic by value, but each reason begins "Value only", and Do not use stays empty because it cannot be checked. A row whose value matches no token within tolerance is a gap. The report then adds a Consistency by role section, below, because value matching alone cannot say whether colors are used consistently.

A palette-only list (names like `gray-500` with no roles) makes almost every palette row Exact by definition, which says nothing. So with that list the report emits no Exact rows. Consistency by role becomes the main output, right after the Summary, with counts per role. The mapping table keeps only the rows that are not Exact: raw values off the scale, semantic near misses and gaps. The summary still gives the Exact count.

## What counts as the team's list

The team's list is what the project itself declares: token files, `@theme` entries in the project's own CSS, custom properties on `:root`, and shadcn's `cssVars` pairs. A framework's default theme is not the team's list, even when its utilities compile.

- **Token use.** A utility or `var()` built from a name the project declares with a role, such as `bg-muted` or `text-muted-foreground`. Skipped, like `var(--muted)`.
- **Palette use.** A palette-scale utility such as `bg-blue-600` or `text-gray-500`, or a `var()` of a palette-scale name such as `var(--color-gray-500)`, whether it comes from Tailwind's default palette or a scale the project declares. It names a value and no job. It gets a row and a class like a raw value, and the summary counts it apart from raw values. It is never skipped, and never counted as raw hex.
- **Raw value.** A hex, `rgb()`, `oklch()` or other literal, or an arbitrary utility such as `text-[#666]`.

`token-mapping`, the boss's `triage.sh` and `migrate-design-system`'s inventory sort uses into these three the same way, but they count different units. token-mapping counts occurrences, one per property use. triage counts lines. A line with three palette classes is one triage line and three rows here, so the numbers differ and the report names its unit.

## Aliases and modes

- Resolve an alias chain to its final value before comparing.
- When a semantic token (`color.text.subtle`) and its primitive (`gray.600`) both match, map to the semantic token if its purpose fits. Map to a primitive only when no semantic token covers the job, and say so in the reason.
- Map each mode the user asked for as its own column or its own rows. If no mode was named, use the list's default mode and write which one in the source line.
- A value that matches in light mode but not in dark is not exact. Report the mode where it fails.

## Categories

A candidate must belong to the same category as the row's job.

- Color, split by role: surface, text, border, icon, focus, status
- Spacing, split by job: inset (padding inside a component) and gap (space between items). One scale often serves both, so record which job the row does
- Size: fixed widths, heights, icon sizes
- Radius
- Border width
- Typography: family, size, weight, line height, letter spacing
- Shadow: offset, blur, spread, color, each as its own row
- Opacity
- Motion: duration and easing
- Z-index
- Graphic: logo art, illustrations, decorative gradient stops and masks. Excluded from rows and counts by default, and listed once under Source with a count and locations. A caller can bring it back in.

A row whose category cannot be read is ambiguous when two or more candidates span the categories it might be in, and otherwise a gap marked "category unread". Do not guess one.

## When the repo has no token file

There is nothing to map against, so the run stops. The groundwork still goes back, grouped the way Vercel's Geist lays out its foundations, because that layout is a sound default for a new token set and the `build-design-system` skill uses the same one.

- Color: surfaces, text, borders, icons, focus and status, each with its theme
- Typography: families, sizes, weights, line heights, letter spacing
- Materials: how a surface is finished, meaning radius, border width and shadow
- Space and layout: inset, gap, fixed sizes, breakpoints
- Motion: durations and easings
- Other: opacity and z-index

Under each group, list the distinct normalized values with a count and their locations. Do not name a role or a token for any of them. That is the job of whoever builds the set. None of this needs the Geist site to be reachable.

## Normalizing

Before comparing, convert both sides to one form.

- Lengths go to px. Use a 16px root for `rem` unless the project sets another.
- Line height goes to a unitless ratio. 24px on a 16px font is 1.5.
- Colors go to OKLCH, plus alpha. Accept hex (3, 4, 6 or 8 digits), `rgb()`, `hsl()`, `hwb()`, `oklch()`, `oklab()` and named colors. `#0F172A` and `rgb(15 23 42)` are the same color. Tailwind v4's palette is written in `oklch()`, so converting everything to OKLCH keeps it unclipped.
- Compare two colors by ΔE OK: the distance between them in OKLab, times 100. Under 0.5 counts as identical, which absorbs 8-bit rounding. A value outside sRGB, such as a P3 `oklch()`, is compared the same way, with no clipping.
- Alpha is part of the color. `#0F172A` at 80% is not `#0F172A`. Alphas must match within the opacity tolerance.

## Tolerances

Tolerance only applies after purpose fits. It never turns a wrong-purpose token into a match. A difference equal to the limit is inside it.

| Category | Default limit |
|---|---|
| Color | ΔE OK 2. Under 0.5 is exact |
| Spacing, size, radius | 2px |
| Border width | None |
| Font size | 1px |
| Font weight, family, easing | None |
| Line height | 0.05 as a ratio |
| Letter spacing | 0.01em |
| Opacity | 0.02 |
| Duration | 30ms |

## Gap threshold

When gaps are more than 30% of rows, the run still completes. Start the report with `Status: not actionable (gap threshold)` and ask, under For a person to decide, whether this is the right list. At that rate the likelier cause is the wrong token list, and the table cannot be acted on as a migration list. It is a status, not a stop.

- Count rows, not source values. `border: 1px solid #D4D4D8` is two rows, one border width and one border color. `box-shadow` splits into one row per part.
- Count after classifying everything. The threshold can only fire at the end, so deliver the full table with the question.
- Leave unverified rows (from a partial tool read) out of the count, and say how many were left out.
- Under 12 rows, report the gaps and say the sample is too small to judge coverage.
- Token + alpha and graphic values are not rows, so they never count toward the threshold.

## Consistency by role

Write this section when the list states no purposes, or when the ask is about consistency. With a palette-only list it replaces the mapping table as the main output. "Are colors consistent" needs an answer value matching cannot give. Group every color row (raw and palette) by role: text, surface, border, icon, focus, status. For each role, give the distinct values with counts, the spread in ΔE OK across them, and the near pairs that likely mean one thing (under ΔE OK 5 with different values). Name no token for any cluster. Example:

```markdown
## Consistency by role
- Text: 6 values over 212 rows. gray-500 (88), gray-600 (61), #666 (9) sit within ΔE OK 4 and likely mean one muted text.
- Surface: 3 values over 140 rows. white and gray-50 carry 131 of them.
- Status, error: red-500 (14) and red-600 (11), ΔE OK 6, used for the same error text in two areas.
```

## Source conflicts

A conflict is two sources that disagree about the same token in the same mode. Either they give one name two values, or they give one purpose two different names. A common case is a hand-edited CSS file drifting from the JSON source it was generated from.

These are not conflicts. An alias pointing at a primitive. One token with different values per mode. A token marked deprecated next to its replacement.

With a precedence rule in CLAUDE.md or AGENTS.md, follow it and name it in the source line. The losing source still appears in For a person to decide. With no rule, report both and do not choose.

One list holding the same name with two values in the same mode is a broken list, not a conflict. Stop.

## Report shape

The Summary's first line answers the question the person asked, in one sentence, before any count. "Are colors consistent?" gets "No. Muted text uses three grays within ΔE OK 4, and error red comes in two shades." A mapping ask gets how much maps and what blocks the rest. "Value matching only" goes on the counts line.

```markdown
## Summary
Mostly. 25 of 30 rows land on a token, and the 2 gaps are both component heights.
Rows 30 occurrences (raw 22, palette 8) · Exact 21 · Semantic 4 · Ambiguous 3 · Gap 2 · Do not use 1
Not mapped: token + alpha 5, graphic 3 (excluded).
Mode: light. Dark not mapped.

## Mapping
| Value | Location | Doing | Token | Class | Reason |
|---|---|---|---|---|---|
| #0F172A | src/ui/InvoiceRow.tsx:18 | Row title text | color.text.default | Exact | Purpose fits, value identical |
| 14px | src/ui/InvoiceRow.tsx:22 | Row padding, inset | space.inset.sm (12px) | Semantic | Purpose fits, 2px over, at the limit |
| rgb(100 116 139) | src/ui/InvoiceRow.tsx:31 | Due date text | color.text.subtle | Exact | Same color as #64748B. Semantic token chosen over gray.500 |

## Do not use
- color.border.focus for the overdue badge fill (src/ui/Badge.css:9). Same value, #2563EB, but the token marks focus rings. Using it ties badge color to focus styling.

## Ambiguous
- 10px, gap between avatar and name (src/ui/Owner.tsx:12). Candidates space.gap.xs (8px) and space.gap.sm (12px). Both are gap tokens and 10px sits 2px from each. Settled by a rule on which way dense rows go.

## Gaps
- 52px, fixed height of the table header (src/ui/Table.css:4). No size token covers component heights.

## For a person to decide
- Which way the 10px avatar gap resolves.
- Whether table header height should be a token.

## Source
tokens/tokens.json, DTCG format, read from the repo on 2026-03-12 at 14:10. Light mode. No second source. Colors converted to OKLCH and compared by ΔE OK with a scratch conversion script (`node /tmp/oklch.mjs values.tsv`, exit 0). Graphic excluded: 3 values in src/ui/Logo.tsx.
```
