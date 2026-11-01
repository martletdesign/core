# Martlet: a validated form

> Candidate imports below refer to an unpublished local `@martlet/core` tarball; published `@martlet/theme` remains available.

Experimental pattern contract 0.3 · Application extension · React reference specimen

## Purpose and composition

Use this pattern for a deliberate submission with multiple related fields and recoverable errors. The specimen is a publication request with title, summary, request type, response name/address and a notification preference. It is a controlled documentation example; it sends nothing and stores nothing beyond the mounted specimen.

Start with the request and its purpose, then related details, then response preferences, and finally the committing action. Keep one readable progression. Related short fields may share a row when their labels and hints fit; the row returns to one column when it no longer does. Supporting explanation stays next to the decision it informs. A separate guidance region follows the form in source order.

Use the field relationship for label, control, hint and error; group spacing for sibling fields; and region spacing between different decisions. A native fieldset and legend identify a real group. Do not add a card per field. Keep the primary submit action after the editable groups. Secondary discard/reset actions describe their consequence and remain visually subordinate. The specimen uses comfortable density; it introduces no compact-density API.

## Validation and state transitions

| Trigger | Result | Focus and retained work |
| --- | --- | --- |
| Submit invalid fields | Show a summary and field-linked errors; mark only invalid controls. | Focus the summary; its links focus the actual controls. Keep all input. |
| Edit after an error | Retain the error until revalidation on submission. | Keep focus in the edited field. Do not announce validation on every keystroke. |
| Submit valid data | Enter pending state and prevent another submission. | Keep the form visible; make inputs temporarily unavailable and announce saving. |
| Simulated save failure | Explain that work is retained and offer retry. | Focus the actionable failure summary; preserve every field and preference. |
| Retry successfully | Commit the submitted values to the local example state and announce success. | Keep the same form and orientation; do not clear fields or move focus merely for success. |
| Reset a changed specimen | Open a native confirmation dialog with Keep editing and Discard changes. | Escape and Keep editing preserve the draft and return focus to Reset specimen. Discard resets the specimen and returns focus to that trigger. |
| Reset an unchanged specimen | Reset immediately. | Preserve orientation; no unnecessary dialog. |

The pending operation is short and simulated. Unmounting invalidates its completion; a late timer cannot update another specimen. Reset is unavailable while saving. The draft guard covers the specimen's Reset action; documentation navigation is outside that guard and unmounts the example. This is an explicit hosting boundary, not a claim of full application navigation protection.

## Semantics and responsive behavior

Use native form, label, input, select, textarea, checkbox, fieldset and button semantics. Required indicators appear in labels and requirements in hints. Read-only text remains inspectable and available to native form behavior; disabled controls are temporarily unavailable. Do not invent readOnly support for a native select or checkbox. Name the form, error summary and dialog, and expose meaningful pending/saved state without repeated announcements.

At narrow widths the groups and actions stack in source order. Long text and enlarged text wrap without clipping. The guidance region follows the fields; no visual reordering changes keyboard order. Reduced motion does not remove state text. For print, retain the current values and context; hide only documentation inspection controls.

## Implementation and evidence boundaries

React composes Field, TextInput, Textarea, Select, Checkbox, Fieldset, Button, ErrorSummary and Dialog. These are existing exports; no new form-controller API is implied. Core supplies typography and spacing roles. Astro can express the same native HTML structure, but validation, transport, draft management and focus transitions remain host code; there is no Astro Form controller in this candidate.

The reference includes validation, pending, failed/retry, saved and discard-dialog examples. Browser assertions cover values, linked errors, focus restoration, reflow and automated accessibility. Real server errors, conflict resolution, authentication, uploads and manual assistive-technology review remain outside this specimen. New controls and full dark mode remain experimental.

## Native HTML styling

For Astro or direct HTML, use core 2.2.2 `@martlet/core/forms.css` (included by `full.css`) and the exact anatomy in `docs/form-styling.md`. The Astro 1.2.2 starter `/form/` is a runnable host-controller example. Read the classes as visual contracts, not controllers. Set native labels, described-by links, invalid states, summary focus, disabled/pending behavior and dialog return focus in host code.
