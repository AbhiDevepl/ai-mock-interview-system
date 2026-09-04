# Palette's Journal - Critical UX/A11y Insights

This journal records critical user experience and accessibility insights discovered during the engineering of InterviewIQ.AI.

## 2025-02-20 - Semantic Form Bindings & Segmented Button ARIA
**Learning:** Modern UI frameworks with custom designs or segmented controls often miss native input bindings (`id`/`htmlFor`) or element roles. Icon-only buttons or interactive list cards inside modals lack descriptive screen reader hints (`aria-label`) or state descriptors (`aria-pressed`). Making these changes under 50 lines provides massive accessibility improvements for screen reader users without altering design systems.
**Action:** Always link form label tags directly to their corresponding inputs with `id` and `htmlFor`, specify explicit `aria-label`s on close icons inside modal containers, and use `aria-pressed` on segmented controls to convey selected state.

## 2025-02-23 - Interactive File Clear in Complex Forms
**Learning:** File upload components that pre-populate form fields upon analysis can lock the user into an unintended path if there's no way to undo or clear the action. Adding an explicit, high-contrast, accessible "remove" button with an ARIA label and focus indicator ensures that keyboard/screen reader users can confidently start over or alter their selection without refreshing the page.
**Action:** Always provide an easily-discoverable remove/clear button with proper `aria-label` and focus state transitions adjacent to custom file upload controls.

## 2025-02-24 - Dropdown Navigation & Modal Dismiss Keyboard Focus
**Learning:** When developing utility-first layouts, dropdown action items and modal dismissal triggers are frequently given custom click actions but lack default system outlines. Adding custom focus indicators (`focus-visible:ring-2`) and background transitions (`hover:bg-emerald-50`) ensures that both keyboard and motor-impaired users can confidently navigate nested menus.
**Action:** Ensure all button elements inside dynamic overlays (such as dropdowns and modal close buttons) explicitly define cohesive focus rings matching the brand color scheme.

## 2025-02-28 - Drag and Drop Upload Visual Feedback
**Learning:** Standard custom upload containers only support file selection on click, leaving keyboard and mouse-reliant users unaware of native drag-and-drop mechanics. Adding event-driven drag/drop event triggers with styled container borders and scale changes dramatically increases visual clarity and delights users with responsive interactions.
**Action:** When designing customized file uploaders, always implement onDragOver, onDragLeave, and onDrop with transitional styles and feedback text to clarify drag-and-drop functionality.

## 2025-02-28 - Keyboard Arrow Navigation & Roving TabIndex for Visual Radio Cards
**Learning:** Custom visual cards acting as semantic radiogroups are common in personalized user flows but are inaccessible to screen readers and keyboard-only users by default. Implementing standard arrow key navigation (ArrowLeft/ArrowRight/ArrowUp/ArrowDown, Home, End) alongside a roaming tabIndex (where only the active element has `tabIndex={0}` and others have `tabIndex={-1}`) provides a standard, native-like, accessible keyboard interaction model.
**Action:** Always implement standard arrow key handlers, unique focusable button IDs, roaming tabIndex, and group labeling (`aria-labelledby`) for custom radiogroup controls.

## 2025-03-01 - Branding Logos and Interactivity Accessibility
**Learning:** Branding headers or logos featuring `cursor-pointer` are often styled as plain `div` elements, rendering them completely inaccessible to keyboard and screen-reader users, and failing to provide standard navigation functionality (such as returning home on click). Converting these to semantic, keyboard-focusable `<button>` elements with cohesive focus outlines and clear click handlers restores intuitive user journeys and standard accessibility.
**Action:** Always refactor interactive branding elements from non-semantic containers to accessible `<button>` or `<a href>` elements, incorporating appropriate ARIA labels and brand-matched focus rings.
