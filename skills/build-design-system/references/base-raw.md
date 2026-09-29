# Base: hand-rolled

Read this when triage reports `foundation` as `raw`, meaning the app's components were written by hand with no component library or copy-in registry. The defaults in `token-architecture.md`, `component-contract.md` and `system-structure.md` were written for this case, so this page is short. It says what those files assume and where hand-rolled apps usually surprise them.

Contents

- Where tokens live
- What counts as a component
- How drift is measured
- Distribution
- Stack examples
- Moving onto shadcn

## Where tokens live

Wherever the inventory finds them: a CSS file of custom properties, a Sass map, a theme object in JavaScript, a Tailwind config. Often in two of those at once, which is a gate unless AGENTS.md says which wins.

The default target is `token-architecture.md` as written: DTCG JSON under `tokens/`, generating CSS variables, plus the styling framework's theme mapping when there is one (`@theme` on Tailwind v4, for example). A small system, with one theme, no utility framework and a few dozen values (default cutoff about 40), needs only one hand-written CSS file of semantic variables. Existing names that the inventory shows in correct use survive.

## What counts as a component

Every exported component the inventory finds, grouped into families by root element, props and name, per `inventory.md`. The canonical pick follows the ranking in `component-contract.md`. Hand-rolled apps often have a "shared" folder that is itself one of several duplicates, so the folder name is not evidence. Call sites and the native element are.

Frameworks that split server and client code break at runtime when an interactive component lands on the wrong side, and type checks pass either way. After adding a handler, state or an effect to a shared component, request every route and require success (`browser.md`, After an edit). On the Next.js App Router, for example, such a component needs `"use client"` as its first line, including when the handler is a guard added later, such as a Button that returns early while loading. Keep a component server-rendered when it has no handlers, and pass the interactive part down as a child.

Behavior primitives are the common gap, such as a dialog with no focus trap or a menu with no arrow keys. Build on a behavior library only when the app already installs one. Adding one, such as Base UI or Radix, is a gate with the default "keep native elements and write the keyboard handling the spec lists".

## How drift is measured

Two numbers, from the inventory scripts. Raw values outside the token source, by route. Imports of non-canonical members of each family, by route, which is what the migration map and the deprecated-import check read. Legacy is found by import path, because old and new live in different files.

## Distribution

In a single app, the system lives in the app: `tokens/`, `components/ui/`, `docs/system/`, and `registry.json` in the `{ "components": [...] }` form from `system-structure.md`. In a monorepo, it moves to a workspace `packages/ui` that apps import by workspace name. Publishing to npm is a stop.

## Stack examples

The general references state what to do. These show how on one common stack, Next.js with Tailwind v4. Other stacks have their own equivalents.

- **Theme mapping.** The `@theme` key is the utility: `--color-<role>` becomes `bg-<role>`, `text-<role>` and `border-<role>`, so `--color-text-muted` gives `text-text-muted`. Name the key `--color-muted-foreground`, `--color-fg-muted` or `--color-edge`, and point it at the flattened variable. The generated `theme.css` holds an `@theme inline` block such as `--color-fg-subtle: var(--color-text-subtle);`, which gives `text-fg-subtle`.
- **Routes.** On the App Router, `find app -name 'page.*' -not -path '*/node_modules/*'`, then turn each folder path into its route. Private folders (`app/**/_*`) never route, and a route group such as `app/(shop)/` drops out of the URL. On the pages router, the files under `pages/` minus `_app`, `_document` and `api/`.
- **Surfaces.** One surface per `page` folder is a good first cut, with shared `layout` files under the `shared` surface.
- **Checks.** On Next 16, run `next typegen` before `tsc`, or a clean clone fails on missing route types.
- **Docs twins.** Files in `public/system/` are served as static files, so `public/system/button.md` answers at `/system/button.md` with no routing. A rewrite for `Accept: text/markdown` lives in middleware, which Next 16 names `proxy.ts`. A folder named `[slug].md` is not a valid dynamic segment.

## Moving onto shadcn

A hand-rolled app may want shadcn as its component layer. That is a direction change, so it is a gate, with the default "no". When the answer is yes, it runs as seed mode for the system (`shadcn init` with the app's values as the theme), then a migration whose legacy list is the hand-rolled families. It is never folded into a build run.
