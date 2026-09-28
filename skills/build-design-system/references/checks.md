# Checks

> For the team setting this up: this is phase 5. It turns every rule a script can see into a check that fails a build. Keep the rule IDs the same as in `traps.md` and the specs, so a finding, a spec line and a failing check all name one thing. The skill ships `scripts/check-system.mjs`, a dependency-free Node starter, which setup copies into the repo's `scripts/`. Extend it, or move its rules into the repo's ESLint or Stylelint when the team prefers. Add no dependency when a short script will do.

Contents

- The starter
- What the check covers
- Exempting stock files
- Palette use is its own count
- The allowlist
- Passing a rule by hiding from it
- What the check can't see
- The check has to run
- Proving each rule
- At handoff

## The starter

`scripts/check-system.mjs` reads whole JSX tags, not lines, so a `<div` with `onClick` three lines down is one tag. `--help` lists every flag. The usual sequence:

```sh
node scripts/check-system.mjs --init              # writes scripts/check-system.config.json from the repo
node scripts/check-system.mjs --hash-stock        # shadcn or a library: hash every row of scripts/ui-drift.tsv
node scripts/check-system.mjs --save-stock components/ui/button.tsx .design-system/tmp/button.json   # upstream's copy of a customized file
node scripts/check-system.mjs --rehash components/ui/dialog.tsx --note "G-04: close button kept, reviewed"   # after a reviewed edit
node scripts/check-system.mjs --self-test --fixtures <skills>/build-design-system/scripts/fixtures/check-system   # every rule fails its bad fixture, passes its good one
node scripts/check-system.mjs --init-allowlist    # once, to record today's violations
node scripts/check-system.mjs                     # the repo against the allowlist
node scripts/check-system.mjs --files app/team/invite/page.tsx   # the pilot, no allowlist
node scripts/check-system.mjs --prune-allowlist   # at close: drop entries that no longer match a finding
node scripts/check-system.mjs --no-self-test --left   # at close: what the allowlist still holds, by file and rule
node /abs/skills/build-design-system/scripts/check-system.mjs --root /abs/app --no-self-test   # from any folder
```

Read the config `--init` writes, and the lines it prints. `tokenSources` (files whose custom property lines may hold raw values), `uiDir`, `registry`, `driftList`, `allowlist` and `nativeControls` are guesses from the repo. `nativeControls` maps each native tag to the component the ui barrel and ui files export, such as `<button>` to `Button`. `--init` never writes an empty value such as `nativeControls: {}`, which would read as a decision and turn a rule off. When it cannot fill a key, it leaves it out, so the default applies at every run, and prints why. A config that still holds `{}` from an older run is treated as unset, with a note. `rulesOff` is the only way to turn a rule off. `sharedTokens` lists `:root` colors meant to hold one value in every theme, and `varIgnore` lists custom property prefixes a library sets at runtime, such as `--radix-` or `--transform-origin`. The scan skips the run's own scaffolding: `public/`, `scripts/`, `.design-system/`, `.migration/` and skill folders. With no canonical Button yet there is no native-button rule, and one appears on the first run after the Button exists, with no config edit. Everything the check reads lives in the repo, never in `.design-system/` or a skill folder.

## What the check covers

One command, such as `npm run check`, runs every rule below and exits nonzero on any failure. Each failure prints `file:line`, the rule ID and the fix.

| Rule | Fails on | Starter |
|---|---|---|
| `rule/raw-value` | Hex, `rgb()`, `hsl()`, `oklch()` outside a token source line, including inside arbitrary values such as `shadow-[0_1px_rgba(0,0,0,.1)]` | yes |
| `rule/named-color` | CSS named colors in styles, style props and SVG paint attributes, in any quote style. `transparent`, `currentColor` and `inherit` pass | yes |
| `rule/arbitrary-value` | Tailwind arbitrary values such as `p-[13px]` or `[mask-type:luminance]`. Variants such as `data-[state=open]:` and a bare `[var(--x)]` pass | yes |
| `rule/palette-use` | Tailwind palette classes such as `text-gray-500`, and `var(--color-teal-700)`. Also solid `white` and `black` utilities (`bg-white`, `text-black`, `border-black`) once the theme defines a role for the job: a surface (`--background`, `--card`, `--popover`) for `bg`, a foreground for `text`, a border, input or ring for `border`. Opacity forms such as the overlay's `bg-black/50`, and `transparent`, pass | yes |
| `rule/doubled-utility` | A Tailwind v4 utility that repeats its property word: `text-text-muted`, `bg-bg-subtle`, `border-border-strong`. It means a `--color-<role>` role starts with text, bg or border (`token-architecture.md`). shadcn's plain `border-border` passes | yes |
| `rule/inline-px` | px, rem and em lengths for spacing, radius, size and font size in `style={{ }}`, including bare numbers such as `padding: 12`. The id keeps its old name so allowlists still match | yes |
| `rule/css-px` | px, rem and em lengths for spacing, radius, type and size in CSS files, outside custom property lines, so a planted `1.25rem` fails. `0`, `1px` and media queries pass, and rem or em pass in line-height, letter-spacing and viewport math such as `calc(100dvh - 2rem)`. In a Tailwind class, `p-[1.25rem]` is `rule/arbitrary-value`. The close counts them under these ids in `--left` | yes |
| `rule/token-parity` | A `var(--x)`, `@theme` reference or `bg-(--x)` that no CSS file defines, with no fallback. A key the dark theme block defines that `:root` does not, and a `:root` color with no dark value | yes |
| `trap/native-control` | A native `<button>`, `<input>`, `<select>`, `<textarea>` or `<dialog>` where the system has the component, outside the ui folder | yes |
| `trap/button-div` | `onClick`, `onPointerDown` or `onMouseDown` on a `div`, `span`, `li` or other non-interactive element, or on an `<a>` with no `href`. `tabIndex` of 0 or more with `onKeyDown` on one. An element with a `role` passes, and so does a native `<dialog>` with `onCancel` (below) | yes |
| `trap/role-button` | `role="button"` on anything but a `<button>`, including `<a>` and `Link` | yes |
| `trap/link-as-button` | An `<a>`, `Link` or system link component (an export ending in `Link`, such as `TextLink`) whose own style or classes set both a background and padding, whatever the values, tokens included. Also a `variant` prop on `<a>` or `Link`, the Button's class names, 4 or more of its classes plus a height, or an app-CSS button class. `buttonVariants()` and `render`/`asChild` pass. A `block`, `flex` or `grid` link is a card or row link and passes, and so does a background shown only on hover or focus | yes |
| `trap/button-clone` | Any other element, such as a `span`, `li` or `div`, carrying the Button's class names, 4 or more of its classes plus a height, or an app-CSS button class. An app-CSS button class is a class whose rule sets a background and padding, and whose name says btn, button or cta or which sits on a `<button>` somewhere | yes |
| `trap/link-wraps-button` | An `<a>`, `Link` or system link component with a `<button>` or `Button` inside it, or a `<button>` or `Button` with a link inside it. `Button asChild` and `render` pass, since they render one element | yes |
| `trap/loading-label-swap` | A `<button>` or Button whose children hold a ternary with a string label on a state the same tag gets as `disabled`, `loading`, `pending` or `aria-busy`, or on a state named like a loading one (`saving`, `pending`, `isSubmitting`). `{open ? "Hide" : "Show"}` on a toggle passes | yes |
| `rule/component-override` | A `className` or `style` on a component the registry lists that sets padding, radius, shadow or background: a Tailwind utility (`p-0`, `rounded-full`, `shadow-lg`, `bg-muted`), an inline style key, or an app-CSS class whose rule sets one. Layout classes and styles (margin, width, grid or flex placement, overflow) pass. The names come from the registry's ids and its source files' exports | yes |
| `trap/label-unbound` | A `<label>` or `<Label>` with no `htmlFor` and no control inside it, outside the ui folder. Clicking it focuses nothing and the control has no name. A spread (`{...props}`) passes | yes |
| `trap/overlay-conditional-render` | `{open && <Dialog>}` or `{open ? <Dialog> : null}`, for Dialog, Sheet, AlertDialog, Popover and Drawer (`overlayComponents`) | yes |
| `rule/stock-edit` | A file on the drift list, stock, customized or forked, whose hash differs from its row in `scripts/ui-drift.tsv` | yes |
| `rule/unregistered-ui` | A file directly in the ui folder with no registry entry and no drift-list row | yes |
| `rule/deprecated-import` | An import of a path the registry lists under `replaces`, or the config's `deprecated` | yes |
| `spec/*` | `node scripts/check-spec.mjs docs/system` | separate script |
| docs | `node scripts/gen-docs.mjs --check`: every twin, the rules page, the index and `llms.txt` match a fresh generation | separate script |

Add each `trap/` or `rule/` from the specs that a regex or AST query can see, under its own ID, with fixtures. A rule a script cannot see stays "by hand" on the generated rules page.

## Exempting stock files

Stock files the team never edited carry upstream's raw values, and those are not drift. Exempt them by name, never by a folder glob such as `components/ui/*.tsx`. A glob exempts every new file someone drops into the folder, which is where drift goes first. In one run, raw hex in a new `components/ui/invoice-row.tsx` passed because of a glob.

The drift list is `scripts/ui-drift.tsv`, with the columns `file`, `status` (`stock`, `customized` or `forked`), `sha256` and `note`. Every row carries a hash, whatever its status, so any edit to a primitive shows up as a reviewed drift-list change. The check exempts a `stock` row from the other rules only while its hash matches. A `customized` or `forked` file is scanned like product code, and its hash is checked too. Any mismatch fails `rule/stock-edit`. `--hash-stock` fills empty hash cells and never changes one. After a reviewed edit, `--rehash <file> --note "<what changed and why>"` records the new hash and writes the note into the row. It refuses to run without a note. Check the row's status in the same commit. A new file in the ui folder is checked and needs a registry entry.

A customized file still carries upstream's own literals, such as base-nova's `rounded-[min(var(--radius-md),10px)]` and `text-[0.8rem]` in `button.tsx`. They are upstream's, not drift. Save upstream's copy once with `--save-stock <file> <upstream>`, where `<upstream>` is the JSON from `npx shadcn@latest view <item>` or a plain file. It lands at `scripts/ui-stock/<file>.stock` and is committed with the drift list. A finding from a literal-value rule (raw value, named color, arbitrary value, palette, px) on a line identical to a stock line, whitespace aside, is exempt, and the report counts the exemptions. Every line the team changed or added is scanned like product code. `rule/token-parity` is never exempt, since a variable upstream reads and the app never defines is broken either way. A `forked` file gets no stock copy, since the team owns every line.

In one run, a customized row carried no hash, so `bg-popover` changed to `bg-white` in the customized Dialog and the check passed. That edit breaks dark mode.

## Palette use is its own count

Tailwind palette classes (`text-gray-500`, `bg-blue-600`) come from the framework's default theme, not from the project's token source. They are primitives with no stated purpose, so they are neither raw values nor token use. Count them under `rule/palette-use`, report them apart from raw values, and let the allowlist hold the existing ones. This matches `token-mapping` and the router's triage.

Utilities built from the project's own semantic names (`bg-muted`, `text-muted-foreground`) are token use. A token with an alpha (`bg-primary/80`) is token use. A palette class with an alpha is still palette use.

Do not block the palette with `--color-*: initial` on shadcn. Stock components read `black`, `white` and `transparent`, and a full reset drops them. If the team wants a build-time block, reset only named palette families and prove the stock Dialog overlay still renders in both themes.

## The allowlist

Existing violations outside the pilot go in `scripts/check-allowlist.json`, written once by `--init-allowlist` and committed with the check. It is keyed by file, rule and literal value, with a count for each: `{"app/billing/page.tsx": {"rule/raw-value": {"#111827": 1}}}`. The check fails when a literal's count grows, or when a literal it has no entry for appears, so swapping an allowed hex for a new one fails. It prints the lower number when one drops. `--shrink-allowlist` writes the lower numbers back and never raises one. `--prune-allowlist` only removes entries that match no finding now, such as a fixed literal or a deleted file, and leaves live counts alone. The close runs it, so a fix never leaves a stale entry that would let the literal come back. The allowlist has one writer, the coordinator. Workers never edit it, since parallel edits drift the counts. A worker lists shrink candidates in its report (file, rule, literal, the count its `--files` run finds), and the coordinator runs `--shrink-allowlist` after landing each surface and commits the allowlist in a commit of its own. An older allowlist with one count per file and rule still works, with a note to regenerate it. The allowlist never holds violations in the pilot or in lines this run wrote. Upstream's lines in a customized ui file are exempt through its stock copy, not the allowlist, and lines the team wrote there before the run go in the allowlist like any product code.

A check that points at an allowlist file that does not exist fails every finding, and says so.

## Passing a rule by hiding from it

Moving a handler into a `useEffect` listener, a ref callback or a runtime class string so a rule stops seeing it is itself a violation, recorded as the rule it hides from. One run moved a `<dialog onClick>` into an effect to pass `trap/button-div`. The fix was already allowed. A native `<dialog>` closes on Escape through its cancel event, so a click handler on the element itself is the backdrop pattern. It passes when the same element wires `onCancel`, its keyboard path:

```tsx
<dialog ref={ref} onClick={(e) => e.target === ref.current && close()} onCancel={close}>
```

A `<dialog onClick>` with no `onCancel` still fails.

## What the check can't see

Every text report ends with a fixed section, "The check cannot see", from `--list-blind-spots`, and `--json` carries it as `blindSpots`. `gen-docs.mjs` copies it to the end of the rules page. It names rendered and non-text contrast, behavior (what Enter, Escape or Cancel does, focus return), layout and target size, overrides on components the registry does not list or built at runtime, loading states that do not use a label ternary, class names built at runtime, Tailwind built-ins such as `bg-white`, files outside `include`, stale role comments, and the rules marked "by hand". A final message that says the check guards drift names these limits in the same breath.

## The check has to run

- The command is one line in `package.json`, for example `node scripts/check-system.mjs && node scripts/check-spec.mjs docs/system && node scripts/gen-docs.mjs --check`, plus the repo's typecheck and lint. On Next 16, run `next typegen` before `tsc`, or a clean clone fails on missing route types.
- Run it yourself and read its exit code. A check that only exists in `package.json` has not run. Before handoff, run it again on a clean clone: a fresh `git clone` of the branch with its dependencies installed, and no `.design-system/` or skill folder.
- If the check uses ESLint, an ESLint crash fails the check. Never drop ESLint from the command to get a green result. Fix the config, or remove the rules that depend on it, and say so in a decision row.
- If CI exists, read its config and confirm the command is in it. With no CI, say "runs locally, not in CI". Claiming the check blocks merges needs the CI config.

## Proving each rule

Every rule gets a failing and a passing fixture under `fixtures/check-system/<rule>/`, in `fail/` and `pass/` folders with a `case.json` naming the rule and the exact count the failing folder must produce. Fixture sources end in `.fixture` (`list.tsx.fixture`), so `tsc`, lint and the framework never compile them, and the self-test reads each under its inner name. The standard fixtures stay in the skill folder: `node scripts/check-system.mjs --self-test --fixtures <skills>/build-design-system/scripts/fixtures/check-system` proves the repo's copy against them. A rule the run adds keeps its pair in the repo's `scripts/fixtures/check-system/`, and the default run self-tests whatever sits there.

- The failing fixture holds exactly the patterns the rule catches, such as a three-line `<div onClick>` or `p-[13px]`.
- The passing fixture holds the nearest correct form, such as `<Button>` or `p-3`, and must produce no finding at all.
- The `unregistered-ui` failing fixture is a file in the ui folder, not on the drift list, with raw hex in it. It must fail both rules. This catches a glob exemption.

The real run skips `scripts/` entirely.

## At handoff

Run the full check on a clean clone and paste the command and its exit code into the final message: `npm run check exit 0 (clean clone)`. The allowlisted and left counts come from `--left`, saved in `.design-system/close.md` (`coordinator-path.md`), and the message names the files still listed. The run record's handoff copies the blind spots. A red check at handoff is a failed run, never a footnote. When a rule cannot be made green in time, move its existing hits into the allowlist with a count, and say so.
