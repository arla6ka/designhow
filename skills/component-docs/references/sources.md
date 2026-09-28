# Finding and reading sources

Read the section for the path this run takes. Every source gets a line under Sources: what it is, how it arrived (read with a tool, found by search, or pasted), and when it was read.

## Finding the component

Search the repo for an export with the requested name, then for files named after it in the component folders. One match is the component. With several (`Button`, `IconButton`, `legacy/Button`), take the one product code imports most, list the others at the end of the output, and put the pick under Guessed at. Ask only when nothing matches.

## Finding real uses

A real use names a screen in the product, what put the component on it, and which variant appeared. A screen on a preview build or behind a flag counts if it is marked unshipped. A rule about where the component belongs is not a use, and neither is a use rebuilt from the variant list.

With file access, search for imports of the component outside its own folder, stories and tests. A call site inside a route or screen is a real use:

- The screen is the route or page that renders it.
- What put it there is the job of the surrounding code, such as the handler or label beside it.
- The variant is the props at the call site.

Record each as "found by search" with its `file:line`. Take up to three, from different screens where possible. Pasted uses come first, and found ones only fill the count to two.

## Code

With file access, read the props type and its defaults, the source, the styles, and the stories or tests. Code is the source for Variants, States, Props, Tokens and the import line. Only a named token reference in the styles counts as a token. A raw hex or pixel value does not. Record file paths and the commit or read time.

## Workbench

When Storybook or another component workbench is running, open each story in a browser and screenshot it. Read the story's accessibility tree and record the role and accessible name. To state a key, press it on the story and record what happened. Rendered stories support Examples, States and Accessibility. They never support Tokens. Record the workbench URL, the story IDs and the read time.

## Running product

A browser can confirm a real use on a local dev server, a preview or a production URL. Record the URL and the read time. To reach a screen that needs a sign-in, a form submission or changed data, stop there and treat that use as pasted.

## Pasted material

This path always works. Pasted code, props types, token lists and screenshots stand in when no tool is connected, and sit alongside tool reads when both arrive. A pasted source reads "pasted, not checked against the repo". A screenshot supports States. It never supports Tokens.

## Tool failure

When a tool is connected but cannot reach the source, name the call that failed (file read, search, browser, workbench) and the error. Continue from pasted material if there is any. If the tool was the only source of the code or the variant list, the matching stop applies.

When a tool returns part of what was asked, use what came back and mark each missing part `NOT SUPPLIED (tool returned none)`. A sibling component or a screenshot never fills the gap.
