# Review criteria

**For the team setting this up.** This is a starting set. Replace it with the criteria your team has agreed on, and delete any you have not. The skill treats whatever this file contains as the agreed criteria, so an unagreed criterion becomes a finding someone has to defend. Keep the four parts: severity, criteria, edge cases, and what not to report.

## Severity

**Blocking.** The user cannot finish the task, or is likely to lose data, spend money, or take an action they cannot undo without meaning to.

**Should fix.** The user gets there, yet loses time to confusion or detours, or may well end up with an outcome they did not want.

**Note.** A small inconsistency, or a pattern worth settling before other screens copy it.

If a finding could go either of two ways, choose the milder level and add a sentence explaining the choice.

## Criteria

Cite these by number and name, for example "7. The screen shows what is happening."

**1. The purpose is clear on arrival.** A first-time user can tell what this screen is for and what they are expected to do within a few seconds.

**2. One action leads.** The most likely next step has the most visual weight. Secondary actions look secondary, and no two actions compete for first place.

**3. Visual order follows importance.** Size, weight, color contrast, and position agree about what matters most. The eye lands on the important thing first.

**4. Related things sit together.** Spacing and containers group items the way the content relates. A label sits closer to its own field than to the next one.

**5. Labels name the result.** A button or link says what will happen when it is used. Nothing needs a tooltip or a guess to be understood.

**6. The user knows where they are.** They can see which step, list item, or section they are on, and how to go back.

**7. The screen shows what is happening.** After an action, the user sees a response near where they acted. Loading, saving, success, and failure each look different.

**8. Mistakes are hard to make and easy to fix.** Destructive actions ask for confirmation or offer undo. Errors say what went wrong and how to fix it, next to the cause, and keep what the user already entered.

**9. The task asks for no more than it needs.** No field, step, or decision appears that the task does not require. Sensible defaults are filled in.

**10. It matches the rest of the product.** Patterns that look the same behave the same as on neighboring screens. Any departure looks deliberate.

For a product with few neighboring screens, compare against a well-structured public system instead. Vercel's Geist is a good example. Each of its components has one page that shows every variant and state side by side, so it is easy to tell whether two buttons that look alike are meant to act alike. Use such a system to spot a departure, and still cite this criterion, never the system. The review never needs to open Geist to run.

**11. Content holds up at the extremes.** The layout survives the longest realistic names, large numbers, translated text, and missing values, as well as very short content.

**12. It works at every reviewed width.** Nothing essential is cut off, hidden without a way to reach it, or reordered so the meaning changes. Controls stay reachable at the narrow widths.

## Edge cases

Check each and mark it shown or not shown. A case that is not shown is a question for the designer, not a mistake.

- Empty, with no data yet
- Loading, and slow loading
- Error, including a failed save
- Partial data or some items failing
- Long content and very short content
- Narrowest and widest supported viewport
- First use and a returning user with lots of data
- No permission, or a read-only role
- Offline or a lost connection
- Success or confirmation after the main action

## What not to report

- Preferences no criterion above supports.
- Design-system compliance, such as token use, component choice, or documented states. The `token-mapping` and `component-docs` skills cover those.
- Pixel alignment and spacing that follow the design system. That belongs in visual QA.
- Rewritten copy. Flag the unclear text and say what is unclear.
- The product decision behind a fix. Keep the finding and hand the decision to a person.
- Code defects in a running build, such as console errors. Mention them once under "For a person to decide" so they reach QA.
