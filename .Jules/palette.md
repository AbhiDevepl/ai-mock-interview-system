# Palette's Journal - Critical UX/A11y Insights

This journal records critical user experience and accessibility insights discovered during the engineering of InterviewIQ.AI.

## 2025-02-20 - Semantic Form Bindings & Segmented Button ARIA
**Learning:** Modern UI frameworks with custom designs or segmented controls often miss native input bindings (`id`/`htmlFor`) or element roles. Icon-only buttons or interactive list cards inside modals lack descriptive screen reader hints (`aria-label`) or state descriptors (`aria-pressed`). Making these changes under 50 lines provides massive accessibility improvements for screen reader users without altering design systems.
**Action:** Always link form label tags directly to their corresponding inputs with `id` and `htmlFor`, specify explicit `aria-label`s on close icons inside modal containers, and use `aria-pressed` on segmented controls to convey selected state.

## 2025-02-23 - Interactive File Clear in Complex Forms
**Learning:** File upload components that pre-populate form fields upon analysis can lock the user into an unintended path if there's no way to undo or clear the action. Adding an explicit, high-contrast, accessible "remove" button with an ARIA label and focus indicator ensures that keyboard/screen reader users can confidently start over or alter their selection without refreshing the page.
**Action:** Always provide an easily-discoverable remove/clear button with proper `aria-label` and focus state transitions adjacent to custom file upload controls.
