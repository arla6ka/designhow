# Base: package library or team package

Read this when triage reports `foundation` as `library:<package>`, such as MUI, Chakra, Mantine, Ant Design or React Aria, or `package:<name>` for the team's own package. The library owns behavior and most visuals. The system is the theme plus the wrappers and rules the team adds on top. The Frame's one routing question (`run-record.md`, Questions) asks whether the team is keeping the library or leaving it. The default is keeping it.

Contents

- Where tokens live
- What counts as a component
- How drift is measured
- Distribution
- The team's own package
- Leaving a library

## Where tokens live

In the library's theme: `createTheme` for MUI, `extendTheme` or `createSystem` for Chakra, `createTheme` for Mantine, `ConfigProvider` tokens for Ant Design. That object is the token source. Name roles inside it with the rules in `token-architecture.md`, and keep the library's own keys where it expects them, since its components read those.

- Do not add a second token source beside the theme. If the team wants DTCG, generate the theme object from it, and treat the theme file as generated.
- Styles written outside the theme (`sx` with raw values, styled components with hex codes, CSS files that override library class names) are drift.
- Overrides of library internals, such as `.MuiButton-root` selectors, are drift that breaks on the next major version. List them separately.

## What counts as a component

- **Library components used as they are.** Canonical. They get a spec for this app's states and rules, and the Foundation table says "used as shipped".
- **Wrappers.** Components the team wrote around a library component to fix its API or defaults, such as a `Button` that sets `disableElevation` and maps `tone` to `color`. One wrapper per family is canonical, ranked by `component-contract.md`. The rest merge into it.
- **Hand-rolled look-alikes.** Components that rebuild something the library has. Legacy, unless the library's version fails the spec, which is a gate.

Follow the library's composition conventions in every wrapper, whether they are dotted parts or flat names, and its ref handling. `component-contract.md` defers to them.

## How drift is measured

Three counts from the inventory: raw values in `sx`, `style` and styled components; direct imports of a library component where a canonical wrapper exists; and selectors that reach into library class names. The migration map sends direct imports to the wrapper, so legacy is found by import path and by the named import, such as `import { Button } from "@mui/material"` in product code.

## Distribution

The wrappers and theme live in the app, or in a workspace `packages/ui` in a monorepo. Apps import that package, never the library directly, which the enforcement check makes a lint rule. Publishing to npm is a stop.

## The team's own package

When the foundation is the team's own package (`package:@team/ui`), read it like a library. The package is the target system, pinned by version or commit in the migration's `frame.md`. Its specs and docs live in the package's repo, so harden mode writes there only with access, and otherwise returns the specs as files for the package owner. If the package ships a shadcn registry rather than npm code, use `base-shadcn.md` instead.

## Leaving a library

Moving off a library is its own project, a gate with the default "no". When the answer is yes, seed the new system first, then migrate with every library import in `legacy.txt`. The theme values become the seed's token values, so the look stays the same unless a gate says otherwise.
