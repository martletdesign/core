# Core package identity migration

`@martlet/core@2.2.3` is published on npm. Its provenance identifies `martletdesign/core`, `.github/workflows/core-stage.yml`, accepted main commit `3a504ce2c2d34c7dc44cf5ec094d255eaf1aeac6`, and [the publication run](https://github.com/martletdesign/core/actions/runs/41273554192). The source remains private to prevent accidental publication; that flag does not describe registry availability.

## Compatibility

Existing `@martlet/theme@2.1.0` (`latest`) and `@martlet/theme@2.2.2` (`next`) remain available. No historical package, tag, or release is overwritten, deprecated, unpublished, or silently redirected. Keep an exact legacy pin for rollback. Core retains the legacy export mappings, ESM/CommonJS entry points, canonical light/dark semantic colors, CSS opt-in boundaries, font dependencies, and license notices. `scripts/theme-contract.json` preserves the pre-migration manifest contract.

To migrate, replace the dependency name and the `@martlet/theme` prefix in imports with `@martlet/core`, preserving each import suffix. Update the lockfile and build/test the actual consumer. npm treats these identities separately: installing Core does not satisfy a legacy theme peer dependency. Astro, React, source sites, and application-port generators therefore migrate in their own focused changes. Neither package requires a framework or a running workbench. Jekyll's accepted standalone artifacts remain independent of npm.

## Compatible 2.2.4 correction

Published 2.2.3 exposes `design.widths`, `design.shadows`, `design.motion`, `foundation.sourceRepository`, and `foundation.sourceCommit` at runtime but omits them from its declarations. The additive declaration fix is already accepted in source. Version 2.2.4 ships those declarations without changing the palette, runtime object shape, or import paths. The package version metadata advances normally; no new design maturity is inferred. A clean TypeScript consumer compiles both ESM and CommonJS imports and checks readonly declarations.

The optional typography layer also permits an otherwise unbreakable heading word to wrap inside its available width. A 320px consumer with 200% text overflowed with both local Cambo and the fallback serif; localized long headings exposed the same condition. The correction is scoped to h1–h6 inside `.martlet`, preserves type sizes and ordinary heading geometry, and does not apply arbitrary wrapping to buttons, labels, or host content. It is a responsive adaptation, not a new composition or palette.

The registry rehearsal installs the published package beside legacy theme, resolves all 25 exports, compares canonical colors and ESM/CommonJS values, verifies tarball integrity and npm signatures/provenance, and compiles consumer fixtures. Local candidate installation verifies the next tarball separately. These checks establish packaging compatibility; they do not certify unimplemented application behavior or every framework combination.

See [release procedure](releasing.md) for the existing staged publisher. Grammar and framework maturity remain explicit in `language.json`; published availability and design-contract stability are separate facts.
