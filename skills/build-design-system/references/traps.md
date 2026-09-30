# Traps

Two parts. The first lists behavior traps that hold in any app, per component family, each with a stable ID. The second finds the visual habits that make this app look unfinished and turns each into a rule with the app's own evidence. It carries no visual preferences of its own, because a rule that holds in one product is taste in another. The person's stated bans go in as rules grounded in their words and outrank the app's majority. Add traps under their family. Every ID is unique, and `check-system.mjs --self-test` fails on a duplicate. Retire a trap by marking it `retired` with the reason, so old citations still resolve.

Contents

- How IDs are used
- Adds-only accessibility changes
- Behavior traps by family
- Finding this app's visual slop
- Writing a derived rule
- Coverage gaps

## How IDs are used

Specs cite trap IDs on their `Traps checked:` line and answer each one in the section that applies. Reviews and worker reports cite them in findings. When the same trap shows up in two reports, it becomes a lint rule or check with the same ID, and the row names the check. Derived visual rules use `rule/<slug>` IDs and live in the app's own specs and foundation pages, not here.

## Adds-only accessibility changes

Every skill in this set sorts accessibility-tree changes by this one rule. On the run branch, a change that only adds semantics lands as a decision. Examples are an accessible name, a role on a custom control, `aria-current`, `aria-invalid` or `aria-describedby`, table semantics for tabular data, and a dialog's label. A change that removes, renames or restructures existing semantics is a gate. A review ranks an adds-only fix as a finding and hands every other tree change to a person. The rule covers the accessibility tree only. Contrast, target size and keyboard problems are ranked findings.

## Behavior traps by family

Where a row says "Measured", that measurement finds the trap and proves the fix (`browser.md`). Where it says "Static", `check-system.mjs` flags it under the same ID.

A trap outranks the app's majority. When a trap is the majority pattern, or a rule derived from copy or any other inventory conflicts with a trap's fix, the fix wins. The conflict becomes a gate whose default is the fix, with the count.

When a person describes a symptom instead of a component, start here:

| They say | Look at |
|---|---|
| "It feels laggy" or "slow to respond" | `trap/press-delayed`, `trap/motion-input-lag`, `trap/motion-frequent`, `trap/touch-tap-highlight`, `trap/motion-restart` |
| "It jumps" | `trap/weight-shift`, `trap/numbers-shift`, `trap/loading-layout-shift`, `trap/motion-origin` |
| "It's fine on my laptop, not my phone" | `trap/touch-hover-flash`, `trap/hover-unguarded`, `trap/touch-input-zoom`, `trap/touch-autofocus`, `trap/viewport-height`, `trap/safe-area` |
| "I can't click it" | `trap/decor-pointer`, `trap/list-dead-gap`, `trap/menu-diagonal`, `trap/motion-blocks-input` |
| "Scrolling or swiping feels wrong" | `trap/scroll-chain`, `trap/gesture-drag`, `trap/gesture-axes` |
| "The focus ring comes and goes" | `trap/hover-beats-focus`, `trap/open-trigger-unfocused`, `trap/disabled-drops-focus` |

| ID | Family | Trap | What the spec must say |
|---|---|---|---|
| `trap/button-div` | Actions | A `div` or `span` with a click handler | Rendered on `button`, or `a` when it navigates. A native `<dialog>` may take the backdrop click when it also wires its cancel event (`checks.md`) |
| `trap/native-control` | Actions, Text entry, Choice, Overlays | A native `<button>`, `<input>`, `<select>`, `<textarea>` or `<dialog>` outside the ui folder where the system has the component, so its states and tokens drift from the canonical one | The component that replaces each native element. Static |
| `trap/role-button` | Actions | `role="button"` on an element that is not a `<button>`, so Enter, Space, disabled and form behavior have to be rebuilt by hand | Rendered on `button`, or `a` when it navigates. Static |
| `trap/link-as-button` | Actions, Navigation | A link styled with a background and padding, or given a Button `variant`, so it looks like a button and acts like a link | Which element renders the action: a Button that renders as the link, or a link styled as text. Static |
| `trap/button-clone` | Actions | An element carries the Button's classes or an app-CSS button class instead of rendering Button, so it misses the Button's states | That it renders the canonical Button. Static |
| `trap/control-height` | Actions, Text entry, Choice | Buttons, inputs and selects that sit side by side at different heights | The one control height token they share at each size. Measured on the render, never read from source: `montage.mjs` fails a changed surface whose side-by-side controls differ by more than 1px |
| `trap/button-icon-name` | Actions | An icon-only button with no accessible name | Where the name comes from in every variant |
| `trap/icon-optical-size` | Actions, Text entry, Choice, Feedback | An icon reads bigger or heavier than the text or control beside it, often right after a switch from an outline set to a filled one, since filled glyphs fill their box | The icon size per control size, set so the glyph's ink is no taller than the label's cap height. Measured: the ink box of the rendered path against the label's cap height, per control size (`browser.md`, Measuring optical alignment). Rederived after any icon set change |
| `trap/icon-optical-align` | Actions, Text entry, Choice, Feedback, Navigation | A mark is centered by its box, not by what the eye sees, so it reads high or low. Or one global nudge meant for marks beside text also moves marks that sit alone in a box | The reference line for marks beside text, a numbered decision naming the typeface that the person picks from zoomed crops (`browser.md`, Measuring optical alignment). A mark alone in its box (icon button, chip remove, input slot, chevron, a checkbox's check) centers its ink on that box, and a checkbox, radio or switch beside its label is beside text. A corner mark matches the inset of the text in the opposite corner, and a wrapping host measures its first line. Only a glyph whose ink sits off its own box, such as a play triangle, gets its own offset. Each correction is scoped to one context. Measured by `optical.js` per context |
| `trap/button-type` | Actions | Buttons in a form default to submit and fire twice | The `type` default, and why |
| `trap/submit-repeat` | Actions, Forms | A pending submit still accepts a second click or Enter, so the request goes out twice | What blocks a repeat while the request is in flight, and what the control shows meanwhile (`trap/loading-label-swap`) |
| `trap/weight-shift` | Actions, Navigation | The font weight changes on hover, press or selection, so the label widens and its neighbors move | How the state shows without moving anything, such as color, fill or an underline. When weight must change, how the width is held |
| `trap/focus-ring-shape` | Actions, Text entry, Choice | The focus ring ignores the control's corners or gets clipped by a parent, so it reads as a stray box | How the ring is drawn so it follows the radius, its offset, and that no ancestor's overflow cuts it. Checked with the keyboard on the smallest radius the system uses |
| `trap/hover-beats-focus` | Actions, Text entry, Choice | Hovering a focused control changes or removes its focus ring, border or shadow | The state order (`component-contract.md`, Variants and states), and that hover never overrides focus or invalid. Measured by `state-timeline.js` |
| `trap/disabled-still-hovers` | Actions, Text entry, Choice | A disabled control changes color, border or cursor on hover, so it reads as usable | That hover styles skip disabled and `aria-disabled` controls. Measured by `state-timeline.js` |
| `trap/disabled-drops-focus` | Actions, Forms | A focused control turns disabled while its action runs, and focus falls to the page body | That a control blocked while pending keeps focus (`aria-disabled`, `trap/loading-label-swap`). Measured by `state-timeline.js` |
| `trap/open-trigger-unfocused` | Menus, Overlays, Choice | A trigger whose menu or popover is open looks like it does at rest, so nothing ties the popup to it | That an open trigger shows its focus look while open. Measured by `state-timeline.js` |
| `trap/link-wraps-button` | Actions, Navigation | A link wraps a button, or a button wraps a link. Two tab stops and two roles for one action, and invalid HTML | Which one element renders. Default fix: one element, either a link styled with the Button's styles or a Button that renders as the link (the base reference names the library's way). Measured by `check-system.mjs`, and in the probe as one control where there were two |
| `trap/loading-layout-shift` | Actions, Feedback | Loading swaps or appends content, such as a spinner, a skeleton or an ellipsis, and the box changes size | The pending state keeps the element's box, and what blocks repeat actions. Measured idle and pending (`browser.md`, Measuring a loading state). Any change in size fails. One fix for both: `component-contract.md` (Variants and states) |
| `trap/loading-label-swap` | Actions, Feedback | The action's label is replaced while it runs, such as `{saving ? "Saving…" : "Save"}`. The box shifts and a screen reader hears a new name mid-action | The one pending fix in `component-contract.md` (Variants and states): the idle label stays, a spinner sits inside the box, `aria-busy` is set, and `aria-disabled` with an early return blocks the repeat while focus stays. A pending verb sits stacked with the idle label in one grid cell. Measured: the box and the accessible name, idle and pending (`browser.md`, Measuring a loading state). `check-system.mjs` flags a label ternary on a loading state |
| `trap/button-label-wrap` | Actions | At the narrow width a button's label wraps, so the button stands taller than its neighbors | Default fix: `white-space: nowrap` on the Button, plus a shorter label or a full-width button at small widths. Measured at the narrow width: `probe.mjs` lists every button whose label runs to 2 or more lines (`wrappedButtons`), and the montage fails a new one |
| `trap/field-label` | Text entry, Choice | The placeholder or the current value is the only name | The visible label and how it is tied to the control |
| `trap/label-unbound` | Text entry, Choice | A `<label>` with no `htmlFor` and no control inside it, so clicking it does nothing and the control has no name | How each label binds to its control. Static |
| `trap/field-input-type` | Text entry | A field with the wrong or no `type`, `autocomplete` or `inputmode`, so phones show the wrong keyboard, password managers skip it, and spellcheck underlines emails and codes | The `type`, `autocomplete` token and `inputmode` for each field kind the system ships, and where spellcheck and autocorrect are off |
| `trap/field-affix-focus` | Text entry | An icon, prefix or suffix drawn beside the input instead of inside its box, so clicking it does nothing and the focus ring skips it | That affixes sit inside the field's hit area and a click on them focuses the input, unless the affix is its own button with its own name |
| `trap/field-form-enter` | Text entry, Forms | Fields not inside a `form`, so Enter does nothing and the browser's own validation never runs | That fields which submit together sit in one `form` with one submit, and which native constraints (`required`, `type`, `pattern`) the component passes through |
| `trap/field-error-link` | Text entry, Choice | Error text sits near the field and is not tied to it | `aria-invalid` on the control and the link to the error text |
| `trap/field-error-timing` | Text entry | Errors appear on the first keystroke | The event that first shows an error, and when it goes live |
| `trap/field-keeps-input` | Text entry, Choice | A failed submit or request clears what the user entered | What survives a failure |
| `trap/select-value-lost` | Choice | A select or combobox drops its value when the form errors or the options reload | The value's lifetime across errors, refetches and option changes |
| `trap/select-empty-value` | Choice | No way back to "none" in an optional field | The clear control or the explicit empty option |
| `trap/select-async` | Choice | "No results" flashes while a search is still running | Precedence of loading over empty |
| `trap/toggle-switch-submit` | Toggles | A switch that only applies on Save | Whether it acts at once. If not, it is a checkbox |
| `trap/toggle-indeterminate` | Toggles | "Select all" with no mixed state | All three states and what each selects |
| `trap/overlay-title` | Overlays | An overlay with no title, announced only as "dialog" | The title part, visible or not |
| `trap/overlay-focus-return` | Overlays, Menus | Focus lands on the page body after close | Where focus goes after close, including when the opener is gone |
| `trap/overlay-conditional-render` | Overlays | The caller mounts and unmounts the overlay itself, so exit, focus return and state break | That callers drive the open state, and the component stays mounted |
| `trap/exit-eats-input` | Overlays, Menus | A press during an overlay's exit animation reopens it, or lands on the exiting layer and is lost | That the exiting layer takes no pointer input, and what a press on the trigger during exit does. Checked by pressing within the exit's duration (`browser.md`, Measuring state order) |
| `trap/escape-nested` | Overlays, Menus | Escape is handled on the document, so one press closes the outer dialog instead of the open menu or popover inside it | That Escape closes the topmost layer only, and stops there. Checked with a menu open inside a dialog |
| `trap/overlay-destructive` | Overlays | A destructive confirm that closes on an outside click | Which overlay type confirms destructive actions, and what dismisses it |
| `trap/overlay-pending-dismiss` | Overlays, Forms | Cancel, Escape or an outside click closes a dialog while its submit is in flight, so the result lands on a closed form | The default blocks dismissal while a submit is pending. Cancel is `aria-disabled` and keeps focus (`trap/loading-label-swap`), Escape and the backdrop do nothing, and the dialog closes on success or stays open with the error. A dialog that stays cancellable says how it aborts the request |
| `trap/overlay-no-max-height` | Overlays | A dialog taller than a short screen runs off it, and nothing scrolls, so its bottom actions are out of reach | Default fix: a max height of the viewport minus the dialog's margins (`max-height: calc(100dvh - 2rem)`) and `overflow-y: auto` on the dialog or its body. Measured on a short screen with the dialog open: `probe.mjs --widths 390 --height 320 --click <opener>` lists a dialog that runs past the viewport with nothing scrolling it, or that clips its own content (`tallOverlays`). The montage fails a new one |
| `trap/menu-navigation` | Menus | Items that navigate built as buttons, so new-tab breaks | Which items are links |
| `trap/menu-only-path` | Menus | An action reachable only by right-click or hover | The other visible path to each action |
| `trap/menu-diagonal` | Menus | A submenu closes when the pointer cuts diagonally toward it across a neighboring item | How the menu tolerates a diagonal path to an open submenu, such as a short delay or a safe area toward it |
| `trap/list-dead-gap` | Menus, Navigation, Data | Clickable rows or items separated by margin, so the gaps between them do nothing and the hover state flickers | That the space between items belongs to the items as padding, so the hit areas touch |
| `trap/tooltip-essential` | Floating hints | Information only a tooltip holds, lost on touch | What the tooltip repeats, and where the essential text lives |
| `trap/tooltip-disabled-trigger` | Floating hints, Actions | A tooltip explains why a button is disabled, but a disabled button takes no focus or hover, so keyboard and touch users never see it | Where the reason lives instead: visible text near the control, or an `aria-disabled` control that stays focusable and carries the reason |
| `trap/tooltip-interactive` | Floating hints | A hover tooltip holds a link or button, which disappears before the pointer or keyboard reaches it | That hover tooltips hold text only. Anything interactive moves to a popover opened on click |
| `trap/tooltip-group-delay` | Floating hints | Every tooltip in a toolbar waits and animates in, so moving along the row waits at every item | That the first tooltip in a group waits, and neighbors opened while one is showing appear at once without animation |
| `trap/toast-errors` | Feedback | An error that needs action shown only in a toast that times out | Which errors persist, and where |
| `trap/toast-timer` | Feedback | An auto-dismissing message keeps counting while the pointer is on it, focus is inside it, or the tab is hidden, so people lose it mid-read | That the timer pauses on hover, on focus inside and while the page is hidden, and how long it stays. A message that must be read or acted on persists (`trap/toast-errors`) |
| `trap/live-region-double` | Feedback | Two layers announce the same message | Which layer announces |
| `trap/tabs-routes` | Navigation | Tabs that change the URL built as a tablist | Whether it switches panels or navigates |
| `trap/current-unmarked` | Navigation | The current page or tab looks different and is not marked | `aria-current` or `aria-selected` on it |
| `trap/narrow-hidden-nav` | Navigation, Data | At the narrow width, nav links or table columns sit past the edge of a box that scrolls or clips them, or are hidden with no menu button, and nothing on screen says more is there. | A gate listing each hidden item, defaulting to a visible cue such as a wrapping nav, a menu button, a "More" item or a fade at the clipped edge. Measured at the narrow width by `probe.mjs` (`clipped`: items less than half inside their clipping box, and nav hidden with no visible menu button). The montage fails a newly hidden item unless its trace row names a gate |
| `trap/link-cue` | Navigation | A link in the main content with no resting cue: the text color around it and no underline | Its resting cue, a color apart from the text or an underline. A change to link color or underline is a gate listing every surface it touches. `montage.mjs` measures the cue before and after |
| `trap/touch-hover-flash` | All interactive | Hover styles apply on touch, so a tap flashes the hover state or leaves it stuck until the next tap elsewhere | That hover styles apply only where hover exists (`@media (hover: hover)`), and what shows on press instead |
| `trap/hover-unguarded` | All interactive | A `:hover` rule outside `@media (hover: hover)` changes display, visibility or opacity, so what hover reveals shows on touch only after a tap, or never | The guard, and the other path to what hover reveals, such as always visible or shown on focus within. Static |
| `trap/touch-input-zoom` | Text entry | Input text smaller than the phone's zoom threshold, so iOS zooms the page on focus and leaves it zoomed | The input text size at touch widths, at or above 16px, even when the desktop size is smaller, never by disabling pinch zoom (`trap/zoom-disabled`) |
| `trap/zoom-disabled` | Foundations | `user-scalable=no` or `maximum-scale=1` in the viewport meta, so people who need zoom cannot pinch | A viewport meta that allows zoom. Static |
| `trap/touch-autofocus` | Text entry, Overlays | A field that takes focus on load or when a dialog opens on a phone, so the keyboard covers the screen before the user asked | Which surfaces autofocus, and that touch devices skip it unless typing is the only thing to do there. Static for `autoFocus` on a page field outside a dialog |
| `trap/touch-tap-highlight` | All interactive | The system tap highlight is removed and nothing replaces it, or the pressed state shows only on release, so a tap gives no feedback until the action lands | The pressed state each control shows from pointer-down, and that drags and sliders update under the pointer, not on release. Static for a transparent highlight with no pressed style |
| `trap/viewport-height` | Containers, Overlays | A full-height shell or sheet sized to the large viewport, so its bottom actions sit under the browser bar or the software keyboard | `dvh` (or `svh` when the height must not change while scrolling), never `vh`. Dynamic units ignore the software keyboard, so what must stay reachable uses the visual viewport or `interactive-widget=resizes-content`. Static for `100vh` or `h-screen` on a full-height shell |
| `trap/safe-area` | Containers, Navigation | An edge-to-edge layout puts controls under the notch, the rounded corners or the home indicator | Which surfaces pad by `env(safe-area-inset-*)`, which is nonzero only with `viewport-fit=cover`, and that fixed bars include them |
| `trap/scroll-chain` | Containers, Overlays, Menus | Scrolling to the end of an inner panel, sheet or menu starts scrolling the page behind it | Which scroll areas stop the chain (`overscroll-behavior`), and that an open modal locks the page scroll |
| `trap/table-divs` | Data | A table built from divs | The table element, or the grid role and its keyboard model |
| `trap/empty-value` | Data | An empty cell or field value renders as a blank, a dash typed by hand in one place and "N/A" in another | One component for empty values, with text a screen reader announces, such as "None" |
| `trap/numbers-shift` | Data, Feedback | Numbers that change in place, such as timers, counters, prices or table columns, set in proportional figures, so digits jitter and columns don't line up | Tabular figures (`font-variant-numeric: tabular-nums`) where numbers update or align in columns, when the font has them |
| `trap/illustration-announced` | Media, Containers | An illustration built from HTML elements is read out by screen readers as a string of fragments | Its name as one image (`role="img"` with `aria-label`), or `aria-hidden` when it is decoration |
| `trap/loader-small-dots` | Feedback, Actions | A loader under about 20px drawn as several dots, which blur into a smudge at that size | A thin ring spinner at small sizes. Dot loaders only where the loader is large |
| `trap/decor-pointer` | Containers, Feedback | A decorative layer, such as a glow, gradient or overlay shape, sits above content and takes the clicks, hovers or text selection meant for what is under it | That decorative layers set `pointer-events: none` and never cover a control's hit area |
| `trap/gesture-drag` | Overlays, Containers, Choice | A drag drops when the pointer leaves, snaps to the finger's center, jumps on a second touch, or decides on distance alone so a flick bounces back | Pointer capture, the grab offset kept, extra touches ignored, release decided on speed or distance, and pulling past a boundary moves a fraction of the pointer's distance |
| `trap/gesture-axes` | Overlays, Containers, Choice | The element and the page both move on the same swipe, or a small wobble commits to the wrong direction | Which axis the element owns (`touch-action`), and how far the pointer moves before a direction is chosen |
| `trap/demo-on-timers` | Containers, Feedback | A showcase demo steps through states on `setTimeout`, so it drifts from the element's real animation and breaks under reduced motion | That demos wait on the element's own animations (`getAnimations()` and `finished`) or its events, never a fixed delay |
| `trap/weight-synthesized` | Foundations | A weight token names a weight the loaded font files do not have, so the browser fakes bold or picks the next weight | Weight tokens come only from font files that exist. A missing weight is a gate, never synthesized (`font-synthesis: none` shows it) |
| `trap/text-measure` | Foundations | Reading text runs longer than about 75ch or shorter than about 30ch per line, so the eye loses the next line or jumps every few words | A max width in `ch` on reading columns. Measured by `probe.mjs` at each width |
| `trap/overflow-scrollbar` | Containers, Menus | Content 1 to 2px taller or wider than a box capped with `overflow: auto`, so a scrollbar shows for nothing | That the cap leaves room for the content's own height, or the box clips. Measured as `scrollHeight - clientHeight` of 1 or 2 |
| `trap/required-everywhere` | Forms | Every field carries a required marker, so the marker carries no information | That each form marks the rarer of required and optional fields, and never marks every field |
| `trap/external-glyph-internal` | Navigation | An external-link glyph on a link that stays in the app | That the glyph appears only on links that leave the app's origin, with text that says so |
| `trap/color-only-status` | Data, Feedback | Status told by color alone | The text or icon that carries it |
| `trap/surface-double-edge` | Containers | One surface draws its edge twice, with a border and a shadow, and nobody decided whether both are meant | Which edge the surface uses. Default: a border on resting surfaces (cards, panels, inputs), a shadow only on raised or overlay ones (menus, popovers, dialogs, toasts). When most resting surfaces draw both, that is a gate with this default |
| `trap/surface-matches-parent` | Containers | A panel's fill equals the background behind it, so a hairline border is its only edge and the panel reads as a stroke on the page | Which surface token the panel uses, one step off its parent. Default fix: the next surface token, or no fill when a border-only panel is the decision. Measured by `probe.mjs` (`flatSurfaces`: an opaque fill within 2 of the background behind it, a border of 1px or less, no shadow) |

### Motion

Every component with a transition or animation checks these rows, whatever its family. Measured rows use `browser.md`, Measuring motion. A bad curve that is the app's majority is still a trap, and the conflict is a gate that defaults to the fix.

| ID | Family | Trap | What the spec must say |
|---|---|---|---|
| `trap/reduced-motion-ignored` | Feedback, Overlays | Animations still run when the OS asks for reduced motion: spinners, enter animations on dialogs and toasts, skeleton shimmer | Default fix: under `reduce`, drop the movement and keep the opacity or color change that explains the state. Movement that carries no meaning goes behind `@media (prefers-reduced-motion: no-preference)`. A loading state keeps a static cue, such as the spinner's still frame and `aria-busy`. Measured by `probe.mjs` under `reduce` (`motion`: animations over 1ms still running after a state function runs, skipping opacity-only and color-only keyframes). The montage fails a new one |
| `trap/loop-offscreen` | Feedback, Media | A looping animation or video keeps running when it is scrolled away or the tab is hidden, spending CPU, GPU and battery | That loops pause when out of view or in a hidden tab, and resume where they stopped |
| `trap/theme-transition` | Foundations | Switching the theme fires every hover and state transition on the page at once | That a theme switch turns transitions off for its own frame, so colors change at once |
| `trap/motion-restart` | Feedback, Overlays, Toggles | Triggering an animated element again mid-flight restarts it from its start value or waits for it to finish | That a retrigger continues from the element's current position toward the new target. Measured (`browser.md`, Measuring motion) |
| `trap/motion-origin` | Overlays, Menus, Floating hints | A menu or popover grows from its own center instead of from the control that opened it, or exits along a different path than it entered | Which surfaces grow from their trigger and which stay centered (dialogs), and that exit reverses entry |
| `trap/motion-layout-property` | Feedback, Containers | Animation on width, height, top, left, margin or padding, so layout runs every frame and the motion stutters on slow devices. Or a CSS variable animated on an ancestor, so every descendant restyles each frame | The animated properties, limited to transform and opacity unless a named exception says why (`trap/motion-transition-all`) |
| `trap/motion-blocks-input` | Overlays, Feedback, Data | An entrance animation that ignores clicks until it finishes | That animated elements take input at once |
| `trap/motion-transition-all` | Motion | `transition: all` or `transition-all`, so every changed property animates, layout and theme colors included | The properties each transition names. Static |
| `trap/motion-ease-in-enter` | Motion | An entrance eased in starts slow, so it feels late | Enters ease out (`token-architecture.md`, Motion presets). Static where the easing and an enter keyframe or class sit together, else measured |
| `trap/motion-exit-slower` | Motion | An exit runs longer than the matching enter, so a dismissed surface lingers | Exit duration shorter than the enter's. Measured |
| `trap/motion-linear` | Motion | Linear easing on anything but progress or a loop, so the motion starts and stops dead | Which presets are linear, only progress and loops. Measured |
| `trap/motion-overshoot` | Motion | A bounce or overshoot on a routine change, such as a menu, toast or toggle | A curve that stays between its end values. Overshoot only on input motion released with velocity. Static for a cubic-bezier with a y value outside 0 to 1, else measured |
| `trap/motion-frequent` | Motion, Menus, Navigation | A surface of tier `high` in `surfaces.tsv` animates on every open, so people wait on it many times a session | Default fix: the `instant` preset, or motion on first open only. Measured |
| `trap/motion-input-lag` | Motion, Overlays, Choice | Motion tied to a pointer, drag or scroll trails the input by a frame or more, or eases toward it | That it is `input` motion on the `follow` preset: it tracks the pointer each frame and carries velocity on release. Measured |
| `trap/motion-jank` | Motion | A motion drops frames, so it stutters: more than 1 dropped frame in a motion under 300ms, or more than 5% in a longer one | The animated properties and preset, and that the motion holds its frames on the throttled CPU the run record names. Measured by `state-timeline.js` (`browser.md`, Measuring motion) |
| `trap/press-delayed` | Actions, Motion | Press feedback shows after 100ms, or waits on a transition longer than the `instant` preset | The pressed state from pointer-down on `instant`. Measured by `state-timeline.js` |

A family with no rows here still gets a spec. Its traps come from the app, through the method below.

## Finding this app's visual slop

Find the app's own decisions, then where the app breaks them. Run this in harden and build before specs are filled, and in `ui-review` for criterion 10.

1. **Measure what the app does.** On the routes with the most traffic, collect computed styles per text role and per surface. Save a script like this as a file, such as `/abs/repo/.design-system/scripts/rendered-type.js`, and run it on each route with a browser tool (`browser.md`, Tool how-to):

   ```js
   const seen = {};
   for (const el of document.querySelectorAll("h1,h2,h3,p,label,button,a,td,th,li")) {
     const s = getComputedStyle(el);
     const k = [el.tagName, s.fontSize, s.fontWeight, s.letterSpacing, s.textTransform].join(" ");
     seen[k] = (seen[k] || 0) + 1;
   }
   Object.entries(seen).sort((a, b) => b[1] - a[1]);
   ```

   Do the same for border, shadow, radius and background. Save each output under `.design-system/inventory/rendered/`.

2. **Read the pattern.** For each job, such as body text, a section heading, a button label, a resting card or a floating menu, write down what most of the app does. That majority is the candidate rule. A job with no majority is a gate.

3. **Find the breaks.** Ask these of the tables, one job at a time:
   - Do two weights, sizes or casings do the same job on different screens? Does one role change size across breakpoints with no rule saying so?
   - Does line height fall as size rises, so large text sets tighter than body text? One ratio at every size is a break.
   - Does reading text hold its measure in `ch` (`trap/text-measure`)? Do headings use `text-wrap: balance` and body text `pretty` where supported, and does any heading end on one orphaned word?
   - Does letter spacing differ between elements of the same role?
   - Does one surface stack two edge treatments where the other surfaces of its level use one?
   - Do several radii serve one kind of box? Does an outer radius differ from the inner radius plus the inset between them?
   - Does a container's inset differ from the gap between its children in a way the app's majority does not?
   - Do the rows of one menu or list start their text at different x positions?
   - Does a header's text edge sit off the text edge of the rows below it?
   - Does a control inside a field frame sit at unequal insets from the frame's top, bottom and near side (`optical.js`, field-slot)?
   - Is a color, gradient or shadow used on one screen only?
   - Do some hovers animate color while others change instantly?
   - Is the space above a heading the same as the space below it on some screens and different on others?
   - Do surfaces with the same job use different durations or curves?
   - Does selected text keep its contrast (`::selection`)? Do the first-paint and scroll checks in `browser.md` (Measuring type, scroll and first paint) pass?
   - Does a treatment appear only on screens built recently, or only in one team's area?

   Each yes is a finding with its count and screens, measured against the app's majority, never a fixed number. Every Do example a spec documents must pass these questions.

4. **Compare structure with Geist's foundation pages** (https://vercel.com/geist/introduction). Ask whether the app has a named role for each thing Geist separates, such as surface levels, text emphasis steps and control heights. Take the structure only, never Geist's values.

5. **Check the render.** Confirm each finding on a capture at every width and theme, per `browser.md`.

6. **Decide.** A break where the majority is clear becomes a rule, and the outliers go on the stray list for migration. A break with no majority is a gate with the most common value as its default. A majority that is itself a trap loses (Behavior traps by family). Never settle one with a preference from outside the app.

## Writing a derived rule

Each rule the method produces goes where it applies: foundation rules under the foundation page's `## Usage`, component rules under the spec's Usage H3s (`spec-template.md`). Write it in the shape and with a ground from `rule-method.md`:

```markdown
- `rule/typography-heading-weight`: When text is a section heading, render it at weight 600 instead of 700, because 41 of 47 headings already do and two weights for one role read as two levels. Evidence: app 41/47 h2 elements on 12 routes, rendered/type.txt, outliers /billing and /reports on strays.tsv. Check: lint on weight 700 in headings.
```

A rule with no ground is cut. A rule a script can test gets a check with the same ID.

## Coverage gaps

Areas where the app has no decision yet. When a task touches one, don't fill it with taste. Write a gate that names the gap, apply the smallest choice that matches neighboring screens, and list it in the system's `coverage-gaps.md` with a concrete Meanwhile (see `system-structure.md`). Common ones are chart colors beyond the foundation's chart tokens, page transitions, right-to-left layouts and print styles.
