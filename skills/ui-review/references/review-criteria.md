# Review criteria

This is a starting set. Replace it with the criteria your team has agreed on, since the skill treats this file as agreed and an unagreed criterion becomes a finding someone has to defend. Keep the five parts: severity, sorting, criteria, edge cases, and what not to report.

## Severity

**`blocking`.** The user cannot finish the task, or is likely to lose data, spend money, or take an irreversible action without meaning to. A user who believes the task finished when it did not cannot finish.

**`should-fix`.** The user gets there but loses time to confusion or detours, or may end up with an outcome they did not want.

**`note`.** A small inconsistency, or a pattern worth settling before other screens copy it.

If a finding could go either of two ways, choose the milder level and say why in one sentence.

Shown versus sent is the exception, and the milder-level rule does not apply to it. When a field shows one value while the request sends another, and the hidden value grants access, spends money or picks a recipient, the finding is `blocking`. Otherwise it is `should-fix`.

Within a severity, order by the surface's tier in `surfaces.tsv`, `high` before `mid` before `low`, then by how many places the finding hits. Without a tier column, infer it (nav, list rows, primary actions and menus are `high`; settings, onboarding and empty states are `low`) and mark it assumed.

## Sorting

- Merge repeats into one finding with a count. When one finding's recovery lands in another, say so in both and rank them together.
- Flag a finding `system-caused` when its root cause is a token, preset or component in the system, such as every menu opening on a slow preset. It merges every screen it hits, and its fix goes to the system, not the screen.
- Contrast, target size and keyboard problems are ranked. A tree change follows `../build-design-system/references/traps.md` (Adds-only accessibility changes).
- Taste goes to Left out. A deliberate departure, or a problem no criterion covers, goes to For a person to decide.

## Criteria

Cite these by number and name, such as "7. The screen shows what is happening."

**1. The purpose is clear on arrival.** The title, main heading and primary action name the same task.

**2. One action leads.** The most likely next step has the most visual weight. Secondary actions look secondary, and no two actions compete for first place.

**3. Visual order follows importance.** Size, weight, contrast and position agree about what matters most, so the eye lands there first. Blur the capture and name the one element that still reads first. None is a finding.

**4. Related things sit together.** Spacing and containers group items the way the content relates. A label sits closer to its own field than to the next one.

**5. Labels name the result.** A button or link says what will happen when it is used. Nothing needs a tooltip or a guess to be understood.

**6. The user knows where they are.** They can see which step, list item, or section they are on, and how to go back.

**7. The screen shows what is happening.** After an action, the user sees a response near where they acted. Loading, saving, success, and failure each look different. Feedback sits at its trigger: a copy shows a brief inline check on the button, not a notification, and a form error marks the field itself. An optimistic update shows the change at once and, when the request fails, puts it back and says so where it happened.

**8. Mistakes are hard to make and easy to fix.** Irreversible actions ask for confirmation. Reversible ones offer undo instead. A confirm on a reversible action is a Note. Errors say what went wrong and how to fix it, next to the cause, and keep what the user already entered. A field shows the value that will be sent. Lost or mismatched input is a finding here, never a product question.

**9. The task asks for no more than it needs.** No field, step, or decision appears that the task does not require. A value the app already knows, such as the user's email or current workspace, is prefilled.

**10. It matches the rest of the product.** Patterns that look the same behave the same as on neighboring screens. A departure has a reason in code, a spec or a comment, or it is a finding.

For a product with few neighboring screens, Geist's component pages, one page per component with every variant and state side by side, can help spot a departure when you have internet access. The review works without them, and a finding cites this criterion, never the system. To find where the app departs from its own decisions, such as two weights doing one job, run "Finding this app's visual slop" in `../build-design-system/references/traps.md` for the component types on the reviewed screens only. Without that sibling skill, skip it and say so in the Review record.

**11. Content holds up at the extremes.** The layout survives the longest realistic names, large numbers, translated text, and missing values, as well as very short content.

**12. It works at every reviewed width.** Nothing essential is cut off, hidden without a way to reach it, or reordered so the meaning changes. Controls stay reachable at the narrow width, and at the widths in between where the layout switches, such as a sidebar opening.

**13. It answers the hand.** Every press shows feedback within 100ms. Input motion tracks the pointer. Nothing the person triggers waits on an animation before it takes the next input. Focus and selection land where the hand expects. Evidence is measured, from `state-timeline.js` and the trap probes (`sources.md`, Trap probes), never a screenshot. Cite the trap it reports, such as `trap/press-delayed`, `trap/motion-input-lag` or `trap/motion-blocks-input`.

## Edge cases

Mark each shown or not shown. A case not shown is a question for the designer, not a mistake.

- Empty, with no data yet
- Loading, and slow loading
- Error, including a failed save
- Partial data or some items failing
- Long content and very short content
- Narrowest and widest supported viewport, and a width where the layout switches
- First use and a returning user with lots of data
- No permission, or a read-only role
- Offline or a lost connection
- Success or confirmation after the main action
- An empty state that says what goes here and offers the first action, not a blank area
- Stand-in content: every placeholder image, avatar, logo, name and number in a demo or fixture is the kind of thing it stands for, at a realistic length
- On a touch device: no hover state flashes or sticks on tap, focusing an input doesn't zoom the page, and no field opens the keyboard before the user asked (evidence labels in `sources.md`, What counts as evidence)
- Motion: with reduced motion on, the same action repeated quickly, and on a throttled CPU

## What not to report

- Preferences no criterion above supports.
- Design-system compliance, such as token use, component choice or a spec's own completeness. `token-mapping`, `check-system.mjs` and `check-spec.mjs` cover those. Whether the screen shows a spec's states is an edge case (`SKILL.md` step 8).
- Spacing that follows the design system. Optical misalignment and oversized icons are findings under criterion 10, citing `trap/icon-optical-align` or `trap/icon-optical-size`, since a person sees them first. A mark beside text is measured against the alignment reference in `docs/system/decisions.md`. With no such row, give its distance to the cap center, the x-height center and the midpoint, and put the choice under For a person to decide.
- Rewritten copy. Flag the unclear text and say what is unclear.
- The product decision behind a fix. Keep the finding and hand the decision to a person. Keeping the user's input is not a product decision (criterion 8).
- Code defects in a running build, such as console errors. Mention them once under For a person to decide so they reach QA.
- Motion that uses a named preset correctly and still looks wrong. Hand it to For a person to decide with a slow-playback capture. A preset that is itself a Motion trap in `traps.md` is a `system-caused` finding.
