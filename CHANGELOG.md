# Changelog

## 3.0.0

- **Breaking:** replace the published `@martlet/core/reference.css` export with `@martlet/core/martlet.css`. Update imports and copied asset paths; see [the migration guide](docs/migration-3.md).
- Centralize the canonical Astro, React, and Jekyll stylesheet and the React presentation exports in Core.
- Correct scientific heading contrast, narrow enlarged-text form controls, dashboard table/action spacing, and navigation presentation.
- Preserve the shared colors, tokens, and component exports outside the renamed canonical stylesheet.

## 2.2.2 — adoption repair preview

- Repair source-profile button contrast and role overrides, Martlet dark eyebrow contrast, and native choice-control geometry. Add documented native form classes and direct-HTML anatomy; retain host controllers. Correct supported reading composition.

## Unreleased — source consolidation

- Add versioned source guidance, optional source roles, and contents/footer pattern support. Existing defaults remain compatible; see docs/consolidation.md.


## 2.1.0

- Add optional framework-independent layout primitives and a layout specification with provenance from both live consumers.
- Add namespaced layout defaults without changing existing color or typography values.
- Include layout styling in the full stylesheet; retain color-only imports.
- Document extraction, wrapping, reading order, and host responsibilities.

## 2.0.0

Initial published design-system foundation.
