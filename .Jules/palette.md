# Palette's Journal - Critical UX/A11y Insights

This journal records critical user experience and accessibility insights discovered during the engineering of InterviewIQ.AI.

## 2025-02-20 - Semantic Form Bindings & Segmented Button ARIA
**Learning:** Modern UI frameworks with custom designs or segmented controls often miss native input bindings (`id`/`htmlFor`) or element roles. Icon-only buttons or interactive list cards inside modals lack descriptive screen reader hints (`aria-label`) or state descriptors (`aria-pressed`). Making these changes under 50 lines provides massive accessibility improvements for screen reader users without altering design systems.
**Action:** Always link form label tags directly to their corresponding inputs with `id` and `htmlFor`, specify explicit `aria-label`s on close icons inside modal containers, and use `aria-pressed` on segmented controls to convey selected state.

## 2025-02-22 - Input Limits & Backend Validation Alignment
**Learning:** High-traffic input fields often lack explicit local length constraints, causing silent API failure or backend validation blocks when users provide over-length text. Adding `maxLength` constraints paired with custom real-time error messages provides instant, constructive visual feedback to the user before they submit the form.
**Action:** Always map backend schemas and validation limits (e.g. 100 character limits on textual inputs) to matching `maxLength` attributes and inline descriptive warnings in the frontend setup steps.
