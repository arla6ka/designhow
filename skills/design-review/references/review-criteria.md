# Review criteria

**For the team setting this up.** This is a starting set. Replace it with the criteria your team has agreed on and delete the rest. The skill treats whatever this file holds as agreed, so an unagreed criterion becomes a finding someone has to defend. Keep the four parts: severity, criteria, edge cases, and what not to report.

## Severity

**Blocking.** The user cannot finish the task, or is likely to lose data, spend money, or take an irreversible action without meaning to. A user who believes the task finished when it did not cannot finish.

**Should fix.** The user gets there but loses time to confusion or detours, or may end up with an outcome they did not want.

**Note.** A small inconsistency, or a pattern worth settling before other screens copy it.

If a finding could go either of two ways, choose the milder level and say why in one sentence.

Shown versus sent is the exception, and the milder-level rule does not apply to it. When a field shows one value while the request sends another, and the hidden value grants access, spends money or picks a recipient, the finding is Blocking. Otherwise it is Should fix.

## Criteria

Cite these by number and name, such as "7. The screen shows what is happening."

**1. The purpose is clear on arrival.** A first-time user can tell within a few seconds what this screen is for and what to do.

**2. One action leads.** The most likely next step has the most visual weight. Secondary actions look secondary, and no two actions compete for first place.

**3. Visual order follows importance.** Size, weight, contrast and position agree about what matters most, so the eye lands there first.

**4. Related things sit together.** Spacing and containers group items the way the content relates. A label sits closer to its own field than to the next one.

**5. Labels name the result.** A button or link says what will happen when it is used. Nothing needs a tooltip or a guess to be understood.

**6. The user knows where they are.** They can see which step, list item, or section they are on, and how to go back.

**7. The screen shows what is happening.** After an action, the user sees a response near where they acted. Loading, saving, success, and failure each look different. Feedback sits at its trigger: a copy shows a brief inline check on the button, not a notification, and a form error marks the field itself. An optimistic update shows the change at once and, when the request fails, puts it back and says so where it happened.

**8. Mistakes are hard to make and easy to fix.** Destructive actions ask for confirmation or offer undo. Errors say what went wrong and how to fix it, next to the cause, and keep what the user already entered. A field shows the value that will be sent. Lost or mismatched input is a finding here, never a product question.

**9. The task asks for no more than it needs.** No field, step, or decision appears that the task does not require. Sensible defaults are filled in.

**10. It matches the rest of the product.** Patterns that look the same behave the same as on neighboring screens. Any departure looks deliberate.

For a product with few neighboring screens, compare against a well-structured public system such as Geist, where one page per component shows every variant and state side by side. Use it to spot a departure, and still cite this criterion, never the system. The review never needs to open it. To find where the app departs from its own decisions, such as two weights doing one job, run "Finding this app's visual slop" in `../build-design-system/references/traps.md` for the component types on the reviewed screens only. Without that sibling skill, skip it and say so in the Review record.

**11. Content holds up at the extremes.** The layout survives the longest realistic names, large numbers, translated text, and missing values, as well as very short content.

**12. It works at every reviewed width.** Nothing essential is cut off, hidden without a way to reach it, or reordered so the meaning changes. Controls stay reachable at the narrow width, and at the widths in between where the layout switches, such as a sidebar opening.

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
- On a touch device: no hover state flashes or sticks on tap, focusing an input doesn't zoom the page, and no field opens the keyboard before the user asked

## What not to report

- Preferences no criterion above supports.
- Design-system compliance, such as token use, component choice or documented states. `token-mapping` and `check-system.mjs` cover those.
- Spacing that follows the design system. Optical misalignment and oversized icons are findings under criterion 10, citing `trap/icon-optical-align` or `trap/icon-optical-size`, since a person sees them first.
- Rewritten copy. Flag the unclear text and say what is unclear.
- The product decision behind a fix. Keep the finding and hand the decision to a person. Keeping the user's input is not a product decision (criterion 8).
- Code defects in a running build, such as console errors. Mention them once under For a person to decide so they reach QA.
