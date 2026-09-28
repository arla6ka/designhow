# Finding the design and reading evidence

Read the section for the path this run takes. Record the path in the review record.

## Finding the design

Look before asking. With repo access and a browser:

1. Use a dev server if one answers, or start the project's own dev command.
2. "Before I ship" means the screens the current branch changes. Read the diff against the main branch and open the routes it touches.
3. A screen named in words ("the settings page") maps to the route whose path or title matches.

Ask for screenshots or a URL only when none of this reaches a rendered screen.

## Inferring the purpose

Read the page title, the main heading, the primary action and the route. Write one sentence, such as "Assumed: lets an admin invite teammates by email." If those disagree with each other or say nothing, stop and ask.

## What counts as evidence

- **Pasted or attached screenshots** always work. Each image's width is its viewport, unless the sender states another.
- **A URL or a Storybook story** works when a browser tool can open it: a local dev server, a preview or production URL, or a component workbench. Capture a screenshot at each viewport and review those. Where the tool can read it, also save the accessibility tree, which gives each element a role and name to point at. Page text, the DOM or source code can support a finding. The rendered view is the evidence.
- **A link the tool cannot open** (no tool, a sign-in wall, an error) counts as missing. Say what failed and ask for screenshots.
- **A page that only partly renders** (a blank region, a failed asset, an error overlay) gets one more capture after the network goes quiet, since a slow load looks the same as a broken one. If it is still partial, review what rendered, name what did not, and mark the states it hides as not shown.
- **A written description only** is not enough. Ask for images or a link. Many criteria concern visual weight and position, which prose does not carry.

## Reaching states safely

Open, hover, focus, scroll and resize freely. To reach a state that needs a sign-in, a form submission, a purchase or changed data, stop there and mark the state not shown, with what would reach it ("needs an account with no projects").

## Follow-up passes

Mark an earlier finding fixed only when a new capture at the same viewport and state shows it. Otherwise mark it "not rechecked".
