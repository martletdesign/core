# Native HTML forms

> Candidate imports below refer to an unpublished local `@martlet/core` tarball; published `@martlet/theme` remains available.

Core 2.2.2 · Experimental application extension. Import `@martlet/core/full.css`, or import colors, foundation, components and `@martlet/core/forms.css` explicitly. Add `.martlet` and `data-martlet="light"` or `"dark"` to a common ancestor. Fonts are optional and separately imported. The source profile is optional and loads last.

These classes reuse existing semantic colors and the family's field/group/region hierarchy. They are supported markup contracts, not exported controllers or proof of origin-site use. The host supplies identity and state logic. No special layout or navigation orientation is required.

| Class | Required native anatomy and responsibility |
| --- | --- |
| `martlet-form` | `form`; regions separated by the region role. Submission and pending state belong to the host. |
| `martlet-field` | Visible `label[for]`, control with matching `id`, optional hint/error; field-gap spacing. |
| `martlet-hint`, `martlet-error` | Stable `id`, included in the control's `aria-describedby`. Hide an absent error with `hidden`; set `aria-invalid="true"` only while invalid. |
| `martlet-fieldset` | Native `fieldset` and `legend` for a real group, group-gap spacing. Can carry `aria-invalid` plus a described group error. |
| `martlet-checkbox`, `martlet-radio` | Native `label` containing a matching choice `input` and text span; controls keep native geometry and keyboard behavior. |
| `martlet-button`, `martlet-button--secondary`, `martlet-button--quiet` | Native `button` or an anchor for navigation. Always choose the button's native type. A secondary or quiet modifier is used with the base class. Disabled material takes precedence over modifiers. |
| `martlet-actions` | A wrapping command row attached to its task; commit first, subordinate reset/cancel after it. |
| `martlet-error-summary` | Named error section with `tabindex="-1"`, heading and links to real invalid targets. Set `role="alert"` deliberately and focus after failed validation; do not focus on initial render. |
| `martlet-notice` | Information surface; `--success` / `--error` severity modifiers. Set `role="status"` for nonurgent completion, or `role="alert"` deliberately for an urgent failure. Styling never supplies an announcement. |
| `martlet-dialog` | Native `dialog` opened with `showModal()`. Supply an accessible name, initial focus, Escape/cancel behavior and trigger focus restoration. Keep closed dialogs closed; CSS does not set their display. |

```html
<form class="martlet-form" novalidate aria-label="Registration">
  <section class="martlet-error-summary" id="summary" role="alert"
    aria-labelledby="summary-title" tabindex="-1" hidden>
    <h2 id="summary-title">Check your registration</h2>
    <ul><li><a href="#name">Enter your name.</a></li></ul>
  </section>
  <fieldset class="martlet-fieldset">
    <legend>Your details</legend>
    <div class="martlet-field">
      <label for="name">Name (required)</label>
      <input id="name" name="name" required autocomplete="name" aria-describedby="name-hint name-error">
      <p class="martlet-hint" id="name-hint">The name for your registration.</p>
      <p class="martlet-error" id="name-error" hidden>Enter your name.</p>
    </div>
    <label class="martlet-checkbox"><input name="reminder" type="checkbox"><span>Send a reminder</span></label>
  </fieldset>
  <div class="martlet-actions">
    <button class="martlet-button" type="submit">Register</button>
    <button class="martlet-button martlet-button--secondary" type="reset">Reset</button>
  </div>
  <p class="martlet-notice" role="status" aria-atomic="true"></p>
</form>
```

This markup is not a validator. martletollow `docs/patterns/forms.md` for the complete state sequence. The Astro 1.2.2 starter `/form/` supplies an explicitly simulated, nondurable host controller. It retains inputs through validation/failure, names retry, guards changed reset with a native dialog and returns focus. Copy the behavior deliberately; replace the simulation with your own service, cancellation and server validation.

Read-only inputs remain focusable and selectable. Disabled controls are unavailable; the host must explain why. `aria-disabled` alone does not prevent activation. Keep a busy submit target focusable only if the handler prevents duplicate submits; disable editable fields during pending work. Do not clear values or force focus for successful completion. Validation messages remain until revalidation.

For appearance switching, change the nearest `data-martlet` attribute. The host chooses initial preference, persistence and pre-paint handling. This is independent of validation. Fragment targets should have `tabindex="-1"` when navigation needs to move focus; leave heading order and meaningful IDs to content authors.

Automated starter checks cover both appearances, keyboard/focus, failure/retry, modal reset, reflow and enlarged text. They do not establish screen-reader, print, RTL or production-service fitness.
