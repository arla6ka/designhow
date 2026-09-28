# Base: hand-rolled

> For the team setting this up: read this when triage reports `foundation` as `raw`, meaning the app's components were written by hand with no component library or copy-in registry. The defaults in `token-architecture.md`, `component-contract.md` and `system-structure.md` were written for this case, so this page is short. It says what those files assume and where hand-rolled apps usually surprise them.

Contents

- Where tokens live
- What counts as a component
- How drift is measured
- Distribution
- Moving onto shadcn

## Where tokens live

Wherever the inventory finds them: a CSS file of custom properties, a Sass map, a theme object in JavaScript, a Tailwind config. Often in two of those at once, which is a gate unless AGENTS.md says which wins.

The default target is `token-architecture.md` as written: DTCG JSON under `tokens/`, generating CSS variables, plus `@theme` on Tailwind v4. When the app has one theme, under about 40 values and no Tailwind, one hand-written CSS file of semantic variables is enough. Existing names that the inventory shows in correct use survive.

## What counts as a component

Every exported component the inventory finds, grouped into families by root element, props and name, per `inventory.md`. The canonical pick follows the ranking in `component-contract.md`. Hand-rolled apps often have a "shared" folder that is itself one of several duplicates, so the folder name is not evidence. Call sites and the native element are.

On the Next App Router, a hand-rolled component with an event handler, state or an effect needs `"use client"` as its first line, or every Server Component page that renders it fails. The same goes for a guard added later, such as a Button that returns early while loading. `tsc` passes either way, so request every route after the edit and require HTTP 200. Keep a component a Server Component when it has no handlers, and pass the interactive part down as a child.

Behavior primitives are the common gap, such as a dialog with no focus trap or a menu with no arrow keys. Build on a behavior library only when the app already installs one. Adding one, such as Base UI or Radix, is a gate with the default "keep native elements and write the keyboard handling the spec lists".

## How drift is measured

Two numbers, from the inventory scripts. Raw values outside the token source, by route. Imports of non-canonical members of each family, by route, which is what the migration map and the deprecated-import check read. Legacy is found by import path, because old and new live in different files.

## Distribution

In a single app, the system lives in the app: `tokens/`, `components/ui/`, `docs/system/`, and `registry.json` in the `{ "components": [...] }` form from `system-structure.md`. In a monorepo, it moves to a workspace `packages/ui` that apps import by workspace name. Publishing to npm is a stop.

## Moving onto shadcn

A hand-rolled app may want shadcn as its component layer. That is a direction change, so it is a gate, with the default "no". When the answer is yes, it runs as seed mode for the system (`shadcn init` with the app's values as the theme), then a migration whose legacy list is the hand-rolled families. It is never folded into a build run.
