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

## What the scripts touch

This skill ships no scripts. With `build-design-system` installed beside it, it runs these from there, or the repo's own copies:

- `check-spec.mjs` reads the entry from stdin or `docs/system/` and runs read-only `git` commands.
- `probe.mjs --grow` opens a local or given URL in a headless browser and writes JSON under `.design-system/evidence/<component>/`.

A direct run writes the entry to `docs/system/<name>.md` and missing example files to the examples folder. Under a coordinator it writes only what the brief's SCOPE names. It makes no network call besides the pages it opens.

## Check after changing

Repo access, a component workbench and a browser are optional, and the pasted path must keep working. Run `TESTS.md`, then check one entry's headings against a published one.

## Adapt this skill

Use the interview prompt in `../ADAPTING.md` with `SKILL.md`, both files in `references/` and one published entry. Topics for this skill: your headings and what goes under each, your words for variants, states and parts, which missing inputs end a run, where code, stories and specs live, and which source wins for tokens, variants and behavior. Swap the Toast example for your entry at its length.
