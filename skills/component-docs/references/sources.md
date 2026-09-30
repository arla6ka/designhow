# Finding and reading sources

Read the section for the path this run takes. Every source gets a line under Sources: what it is (code path, story, call site, pasted code, spec, notes), how it arrived (read with a tool, found by search, or pasted), and when it was read. Take the time by running `date` in the shell right before or after the read, and copy its output. A time you did not take stays out of the line. An estimated time is a fabrication, because the Sources block is how a reviewer checks the entry.

## Finding the component

Search the repo for an export with the requested name, then for files named after it in the component folders. One match is the component. With several (`Button`, `IconButton`, `legacy/Button`), take the one product code imports most, list the others at the end of the output, and put the pick under Guessed at. Ask only when nothing matches.

## Finding real uses

A real use names a screen in the product, what put the component on it, and which variant appeared. A screen on a preview build or behind a flag counts if it is marked unshipped. A rule about where the component belongs is not a use, and neither is a use rebuilt from the variant list.

With file access, search for imports of the component outside its own folder, stories and tests. Leave out the paths in `../build-design-system/references/inventory.md` (Excluded paths), plus the `/system` docs route and the check's `scripts/`, since these show the component without using it. Without that sibling, leave out skill folders, `docs/system/`, `public/system/`, fixtures, `.design-system/`, `.migration/`, dependencies and build output. The same exclusions apply when deciding which export product code imports most or which call site is most common. A call site inside a route or screen is a real use:

- The screen is the route or page that renders it.
- What put it there is the job of the surrounding code, such as the handler or label beside it.
- The variant is the props at the call site.

Record each as "found by search" with its `file:line`. Pick them from different screens where possible. Take three by default, because two must survive the definition above, and found uses fill the count to two for the stop rule after any pasted ones. A raw element that does the component's job, such as a native `<select>` for Select, counts as a use only when no such component exists, recorded as "raw element, no component".

A planned use comes from a coordinator's pilot or brief, or from a seed plan: a screen that will use the component and has not been built. Record it as "planned, from <brief or pilot>" with no `file:line`. It fills the count and never counts as real.

### Fewer than two uses

- One real use. Write the whole entry. Mark Usage `NEEDS REVIEW (one real use)`, return `Status: ready-with-gaps (1 real use)`, and add a gate: "Second real use. Default: publish as is and recheck Usage when a second screen uses it."
- Planned uses. Mark each `(planned)` under Examples with no call-site code, sourced to the brief. They fill the count to two, but fewer than two real uses keeps the status at ready-with-gaps.
- A deprecated predecessor. Its call site counts as real when the migration map sends it to this component, and its Sources line says so.

## Code

With file access, read the props type and its defaults, the source, the styles, and the stories or tests. Code is the source for Variants, States, Props, Tokens and the import line. When the framework splits code that runs on the server from code that runs on the client, find which side the component is on from its own markers and the imports that force a side, and record it for the import line. Only a named token reference in the styles counts as a token. A raw hex or pixel value does not. Utility classes split into token use and palette use as `doc-format.md` (Tokens) says. Record file paths and the commit or read time.

## Workbench

When a component workbench is running, open each story in a browser and screenshot it. Read the story's accessibility tree and record the role and accessible name. To state a key, press it on the story and record what happened. Rendered stories support Examples, States and Accessibility, never Tokens. Record the workbench URL, the story IDs and the read time.

## Running product

A browser can confirm a real use on a local dev server, a preview or a production URL. It also settles States: which classes an element has while two states hold, what the accessibility tree says, what happens on a nested route. Behavior observed here is sourced, so it goes in States, not Guessed at.

It is also where Limits get their numbers. Grow one dimension on a real instance until it wraps, truncates or overflows, with `build-design-system/scripts/probe.mjs --grow` when installed or the browser's computed sizes otherwise, and save the result under `.design-system/evidence/<component>/`. Record the URL and the read time. To reach a screen that needs a sign-in, a form submission or changed data, stop there and treat that use as pasted.

## Pasted material

This path always works. Pasted code, props types, token lists and screenshots stand in when no tool is connected, and sit alongside tool reads when both arrive. A pasted source reads "pasted, not checked against the repo". A screenshot supports States, never Tokens.

## Tool failure

When a tool is connected but cannot reach the source, name the call that failed (file read, search, browser, workbench) and the error. Continue from pasted material if there is any. If the tool was the only source of the code or the variant list, the matching stop applies.

When a tool returns part of what was asked, use what came back and mark each missing part `NOT SUPPLIED (tool returned none)`. A sibling component or a screenshot never fills the gap.

## Conflicts between sources

Every disagreement gets a Conflicts line. Most are settled by a numbered row in `docs/system/decisions.md`, cited by number, or a precedence rule in AGENTS.md or CLAUDE.md, quoted with where it lives. Before applying one, check that its stated reason holds for this case. "The spec wins because code lags" does not cover a variant the code has and the spec lacks.

These finish the entry and end the reply with a question:

- A token has different names in two sources and no rule covers tokens. List both and ask which is current.
- Two sources give different variant lists and no rule's reason covers the difference. Mark the odd variant `NEEDS REVIEW` and ask which list is current.
- Code behaves differently from the stories, the spec or the notes. Write both into States with `NEEDS REVIEW` and ask which is intended.
- The component has neither variants nor states. Ask whether it belongs inside another component's entry.
