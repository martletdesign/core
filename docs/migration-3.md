# Upgrading to Martlet Core 3

Core 3 removes the `@martlet/core/reference.css` package export. Replace it with the canonical family stylesheet:

```js
// Core 2
import '@martlet/core/reference.css';

// Core 3
import '@martlet/core/martlet.css';
```

If a build copies the canonical CSS into public assets, update both its source filename and the HTML stylesheet URL. Copy the generated stylesheet without framework-specific edits. Astro, React, and Jekyll use the same Core bytes for this file.

The `css`, `full.css`, `foundation.css`, component, token, JSON, and font exports retain their paths. `reference-fonts.css` and `reference-shell.css` also retain their names; they are separate exports.

Update dependency manifests and lockfiles to Core 3. Astro 3 requires Core `^3.0.0`. Release examples and documentation pin an exact published Core version and its registry integrity. Development Git pins must be replaced before publishing a consumer package.

## Version policy

Each package uses independent semantic versioning. Backward-compatible fixes use a patch, compatible additions use a minor, and incompatible public changes use a major. Public contracts include CSS import paths, documented classes and tokens, component props, and supported dependency ranges. A preview deployment alone does not require a package release.

Use `release/*` branches from `develop`, merge accepted releases into `main`, and merge `main` back into `develop`. Published versions and tags remain immutable. The existing trusted-publisher workflow handles npm publication after accepted `main` checks; there is no separate publishing command in site builds.
