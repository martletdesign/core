# Canonical Martlet website CSS extraction (experimental)

The approved `martletdesign/site` application on `develop` supplies the source
appearance; `jameshoward.us` supplies the structural and behavioral reference.
This opt-in entry point moves **CSS**, not personal data or brand assets, into
Core. The Core import will be `@martlet/core/site.css` after publication.

It includes original document typography, articles, documentary layouts, the
homepage and header/footer/page-intro presentation. This opt-in website entry
has document-wide element rules. It does not silently change `full.css` or
the existing Light/Dark APIs.

The site keeps the approved artwork. Core provides configurable media roles:
`--martlet-site-hero-image` and `--martlet-site-hero-image-narrow`. An
individual page introduction still supplies `--hero-image`. Icons, content,
and legal identity belong to the adopting site, never to Core.

Pinned source-site CSS origins:
- `src/styles/tokens.css`: `5b9890a4322906def71df8c01d1f9bde2317b6b8`
- `src/styles/global.css`: `ef483d4b40eb92fab46d7e29c4e47d7e7e66102a`
- `src/styles/content.css`: `14077a2d9d12e4bddb592415e2b4506625a77c41`
- `src/styles/document-pages.css`: `48f61ada079f03ef9e7b121e04e1355bd711042f`
- `src/pages/index.astro`: `78ccebe693fad81675d806f7e4c034c496e30111`
- `src/components/SiteHeader.astro`: `44d899ce05d86ae68a0fdeddea7350a171c4e46e`
- `src/components/SiteFooter.astro`: `6e0c14c6039b6e32800d6aa64a05aaaf9871d437`
- `src/components/PageIntro.astro`: `f8761e51480ce2f2df5f66c855e26fbf0ffcfa81`

## Acceptance boundary
- Standard `npm ci`, `npm run dev`, `npm run build`, `npm run preview` remain.
- The **site is not yet a consumer of this unpublished Core export**. Don't
  remove any site CSS until a clean consumer build reproduces the approved design.
- The gold/bronze emphasis and blue supporting colors both remain.
- No `main`, tags, npm publication, or release automation is permitted.
