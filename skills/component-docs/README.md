# component-docs

Writes a documentation entry for one component. It reads the code, the stories, and the real places the component appears, then drafts the entry in a fixed format whose order follows a Geist-style component page: description, examples, variants, states, props, usage, accessibility, tokens and related. Anything it could not source is marked, and every judgement call is listed so a person can check it.

When the repo keeps specs, the entry is one. It adds the tables from the spec template in your repo's `docs/system/` (each state's trigger, which state wins when two overlap, keyboard, ARIA) and runs the repo's `scripts/check-spec.mjs` before it returns. The copies in `build-design-system` are the fallback.

## Use it as-is

Name the component, as in "document the button". With repo access the skill finds the file, the stories and two real uses on its own by searching for call sites. Without repo access, paste the code and two real uses. A real use is a screen in your product, what put the component there, and which variant showed. One real use still gets an entry, marked ready-with-gaps. For a component no screen uses yet, name the screen that will, and it is recorded as planned. Add the Storybook URL if you run one. The entry follows `references/doc-format.md`.

## Replace first

1. **The format.** `references/doc-format.md` holds the headings, the rules per section, and the worked example. Your team's headings will differ. If you also use `build-design-system`, its docs pages render these headings, so change both together.
2. **The worked example.** Put one of your published entries in its place. The model copies the example's length and tone more closely than any instruction.
3. **Which inputs stop the run.** The Stops table in `SKILL.md` covers the code, the variant list and real uses. If your team treats missing accessibility notes as blocking, add a row for them.
4. **Your precedence rules.** Put them in CLAUDE.md or AGENTS.md, one line per kind of fact (tokens, variants, behavior), with the reason. The skill checks the reason before applying a rule to a case it was not written for.

## Keep these

- **One component per run.** A multi-component entry is too long to review line by line.
- **Missing required inputs stop the run.** Invented uses look exactly like real ones and get copied into product work. Change which inputs are required, but keep the stop.
- **Conflicts stay visible.** The props type, the stories and the old docs disagree often. A quiet choice means you learn which side it trusted only after the entry is published.
- **Every source is dated.** A tool read from last month and a paste from today are different evidence. The Sources block is how a reviewer tells.
- **Guessed at.** It turns judgement into a list someone can correct. Without it, guesses become documented fact.
- **A status line when another skill calls it.** A coordinator has no one to answer a question mid-run, so open questions go in the output and only missing inputs stop it. The entry comes back as text and the coordinator saves it, since some hosts refuse files a subagent writes.

## Optional tools

- **The repo.** Gives Variants, Props, Tokens and the import line from the code instead of from memory, and finds real uses by searching call sites. The pasted path still works without it.
- **A component workbench.** Storybook or similar, opened in a browser, lets the skill render each story to check States and read its accessibility tree.
- **A browser.** Opens real uses on a dev server, preview or production URL to confirm the screen and the variant.
- **A docs platform.** The skill does not publish. If you wire one up, put a person between the draft and the publish step.

## Check after changing

Run `TESTS.md`. At minimum, confirm it still stops when it has no real and no planned use, returns ready-with-gaps with a gate on one real use, finds the component from its name alone, still marks tokens `NOT SUPPLIED` when the code references none, and still lists a variant difference between the props type and the stories under Conflicts. Then put one entry next to a published one and check the headings match.

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

Show me the edits before making them, split in two groups. First, edits that change
what the skill stops on, accepts, checks or asks. Second, edits that only rename or
reformat. Make nothing until I approve.
```
