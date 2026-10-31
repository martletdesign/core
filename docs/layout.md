# Martlet layout extraction

> Candidate imports below refer to an unpublished local `@martlet/core` tarball; published `@martlet/theme` remains available.

Release candidate: core 2.1.0 and Astro 1.1.0. Existing color, font, and component contracts remain available.

## Source observations

- Originating site: [jameshoward.us](https://github.com/k3jph/k3jph.github.io/tree/32b7166a629ea696147d0d779d911b713e4baf7e). Inspected files: `src/styles/global.css`, `src/styles/document-pages.css`, `src/styles/content.css`, `src/components/PageIntro.astro`, `src/components/ProjectShowcase.astro`.
- Demonstration site: [martlettheme.dev](https://github.com/martlettheme/martlettheme/tree/39bf200d265ced6b893fa4ad186c75691ba2ec94). Inspected files: `site/src/pages/index.astro`, `site/src/styles/global.css`.

The originating site pairs a 16rem documentary index with a 48rem reading column and uses 3:2 introduction features, two- and three-column editorial grids, and constrained prose within wider documents. The demonstration site adds facing specimens, a split title/introduction, and a token-reference/contrast-inspector workspace.

## Reusable contract

The core retains its original reading/content/archive widths. New layout variables normalize recurring gaps, a 16rem sidebar, a 30rem minimum main region, a 18rem card minimum, and a 20rem split-panel basis. These are documented defaults, not a claim that every source element used exactly the same values. Martlet's default split is `wide-start`.

Use `@martlet/core/layout.css` with foundation variables for structural classes; it loads no fonts or palette. `full.css` includes it. `layout.json` and the ESM/CommonJS `layout` export describe defaults and provenance. No existing source value is silently replaced.

Intrinsic wrapping responds to the containing region. Grid `columns` is a maximum, not a promise to fit that many columns at every width. Sidebars use a separate main-content minimum; splits retain DOM order. There is no overflow-hiding workaround. Wide tables belong in a labelled `.martlet-scroll` region with `tabindex="0"` when keyboard scrolling is needed.

The Astro package supplies wrappers, site chrome, and complete article, landing, and documentation compositions. Identity, route generation, content rendering, analytics, and consent remain host-owned. Header links wrap naturally; this release does not implement dropdown or disclosure-menu behavior.
