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

## 2025-02-25 - Modal Focus Trapping and Restoration
**Learning:** Modals triggered by interactive buttons often break natural keyboard tab sequences if focus remains on the background or if focus is lost entirely upon modal closure. Using standard React refs (`useRef`) and a single state-dependent `useEffect` hook to trap keyboard focus inside the modal and automatically restore it to the trigger button guarantees logical keyboard navigation.
**Action:** When creating or editing modals, always use refs to store the previous active element and track modal bounds, shift focus to the modal's first interactive element on mount, trap Tab/Shift+Tab navigation inside, and restore focus to the trigger on unmount.
