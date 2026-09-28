# Mapping rules

> For the team setting this up: replace the categories, tolerances and gap threshold with your own. Keep the four classes, and keep checking purpose before value. The skill treats whatever this file says as agreed, so edit it before the first real run.

Contents: Classifications. Aliases and modes. Categories. When the repo has no token file. Normalizing. Tolerances. Gap threshold. Source conflicts. Report shape.

## Classifications

Each row gets exactly one class per mode. Purpose is checked first, then value.

**Exact.** A token's stated purpose covers the row's job, and the normalized values are identical.

**Semantic.** A token's stated purpose covers the row's job, and the value differs by no more than the tolerance for its category. Write the difference in the reason, for example "15px against 16px, 1px under".

**Ambiguous.** Two or more tokens fit the job and nothing in these rules picks one. A row is also ambiguous when its job cannot be read from what was supplied, and when the purpose fits but the value is outside tolerance. In that last case someone has to decide whether the value or the token moves.

**Gap.** No token's stated purpose covers the job, whatever the numbers say.

A value that equals a token but serves a different purpose is never a match. It becomes ambiguous or a gap, and the token goes in Do not use. Numbers repeat all over a system, which makes this the most common confident mistake.

If the list states no purpose at all, the run is value matching only. Rows can still be exact or semantic by value, but each reason begins "Value only", and Do not use stays empty because it cannot be checked.

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

A row whose category cannot be read is ambiguous. Do not guess one.

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
- Colors go to sRGB, 8 bits per channel, plus alpha. Accept hex (3, 4, 6 or 8 digits), `rgb()`, `hsl()`, `hwb()`, `oklch()`, `oklab()` and named colors. `#0F172A` and `rgb(15 23 42)` are the same color. Two values match only when every channel and the alpha come out identical after conversion.
- Alpha is part of the color. `#0F172A` at 80% is not `#0F172A`.
- If a color falls outside sRGB (a P3 or wide `oklch()` value), compare it in its own space. If it is not identical there, the row is ambiguous.

## Tolerances

Tolerance only applies after purpose fits. It never turns a wrong-purpose token into a match. A difference equal to the limit is inside it.

| Category | Default limit |
|---|---|
| Color | None. Any channel or alpha difference is a miss |
| Spacing, size, radius | 2px |
| Border width | None |
| Font size | 1px |
| Font weight, family, easing | None |
| Line height | 0.05 as a ratio |
| Letter spacing | 0.01em |
| Opacity | 0.02 |
| Duration | 30ms |

## Gap threshold

Stop and ask when gaps are more than 30% of rows. At that rate the likelier cause is the wrong token list, and the report cannot be acted on.

- Count rows, not source values. `border: 1px solid #D4D4D8` is two rows, one border width and one border color. `box-shadow` splits into one row per part.
- Count after classifying everything. The threshold can only fire at the end, so deliver the full table with the question.
- Leave unverified rows (from a partial tool read) out of the count, and say how many were left out.
- Under 12 rows, report the gaps and say the sample is too small to judge coverage.

## Source conflicts

A conflict is two sources that disagree about the same token in the same mode. Either they give one name two values, or they give one purpose two different names. A common case is a hand-edited CSS file drifting from the JSON source it was generated from.

These are not conflicts. An alias pointing at a primitive. One token with different values per mode. A token marked deprecated next to its replacement.

With a precedence rule in CLAUDE.md or AGENTS.md, follow it and name it in the source line. The losing source still appears in For a person to decide. With no rule, report both and do not choose.

One list holding the same name with two values in the same mode is a broken list, not a conflict. Stop.

## Report shape

```markdown
## Summary
Exact 21 · Semantic 4 · Ambiguous 3 · Gap 2 · Do not use 1
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
tokens/tokens.json, DTCG format, read from the repo on 2026-09-27 at 14:10. Light mode. No second source.
```
