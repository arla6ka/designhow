# component-docs

Writes a documentation entry for one component. It reads the code, the stories and the real places the component appears, then drafts the entry in a fixed format ordered like a Geist component page: description, examples, variants, states, props, usage, accessibility, tokens and related. Anything it could not source is marked, and every judgement call is listed for a person to check.

When the repo keeps specs, the entry is one. It fills the spec template in your repo's `docs/system/` and runs the repo's `scripts/check-spec.mjs` before it returns. `build-design-system` holds the fallback copies.

## Use it as-is

Name the component, as in "document the button". With repo access the skill finds the file, the stories and two real uses by searching call sites. Without it, paste the code and two real uses. A real use is a screen in your product, what put the component there, and which variant showed. One real use still gets an entry, marked ready-with-gaps. For a component no screen uses yet, name the screen that will, and it is recorded as planned. Add your component workbench URL if you run one.

## Replace first

1. The format. `references/doc-format.md` holds the headings, the rules per section and the worked example. If you also use `build-design-system`, its docs pages render these headings, so change both together.
2. The worked example. Put one of your published entries in its place. The model copies its length and tone more closely than any instruction.
3. Which inputs stop the run. The Stops table in `SKILL.md` covers the code, the variant list and real uses. If your team treats missing accessibility notes as blocking, add a row.
4. Your precedence rules. Put them in CLAUDE.md or AGENTS.md, one line per kind of fact (tokens, variants, behavior), with the reason. The skill checks the reason before applying a rule to a case it was not written for.

## Keep these

- One component per run. A multi-component entry is too long to review line by line.
- Missing required inputs stop the run. Invented uses look exactly like real ones and get copied into product work. Change which inputs are required, but keep the stop.
- Conflicts stay visible. Sources disagree often, and a quiet choice means you learn which side it trusted only after publishing.
- Every source is dated. A tool read from last month and a paste from today are different evidence.
- Guessed at keeps guesses from becoming documented fact.
- Under a coordinator, a status line replaces questions. Nobody can answer mid-run, so open questions go in the output and only missing inputs stop it. The entry comes back as text and the coordinator saves it, since some hosts refuse files a subagent writes.

## Optional tools

- The repo gives Variants, Props, Tokens and the import line from code instead of memory, and finds real uses by searching call sites. The pasted path works without it.
- A component workbench, opened in a browser, lets the skill render each story to check States and read its accessibility tree.
- A browser tool (see `build-design-system/references/browser.md`) opens real uses on a dev server, preview or production URL to confirm the screen and the variant.
- A docs platform, if you wire one up, needs a person between the draft and the publish step. The skill does not publish.

## Check after changing

Run `TESTS.md`. At minimum, confirm it still stops with no real and no planned use, returns ready-with-gaps with a gate on one real use, finds the component from its name alone, marks tokens `NOT SUPPLIED` when the code references none, and lists a variant difference between the props type and the stories under Conflicts. Then check one entry's headings against a published one.

## Adapt this skill

Paste this into your agent with `SKILL.md`, both files in `references/`, and one published entry attached.

```
Attached are the component-docs skill, its format file, and (maybe) one entry we published.
I want the skill to write entries the way our team writes them.

Interview me, one question per message. Cover:
- our headings, and what goes under each
- our words for variants, states and parts
- which missing inputs should end a run
- where our code, stories and any specs live, and how you can read them
- which source wins for tokens, for variants, and for behavior, with the reason

Leave the stop rules, the three blocks after each entry, and the final checks alone
unless one of my answers contradicts them.

Swap the Toast example for my published entry, if I gave one, and match its length.

Anything I can't answer gets marked UNDECIDED. Don't fill it in yourself.

Show me the edits in two groups before making any: first, edits that change what
the skill stops on, accepts, checks or asks; second, renames and reformatting.
Make nothing until I approve.
```
