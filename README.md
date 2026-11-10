# Martlet core

`@martlet/core@3.0.0` is the framework-independent Martlet foundation. Version 3 renames the canonical stylesheet to `martlet.css`; existing `reference.css` imports must migrate. See [upgrading to Core 3](docs/migration-3.md).

`@martlet/core` is the framework-independent source of truth for Martlet. It contains Light/Dark semantic colors and the typography, spacing, shape, depth, and interaction definitions extracted from jameshoward.us.

## Design direction

For the design direction and criteria for expanding the system, read the [Martlet design charter](docs/charter.md).

## Choose what to adopt

| Import | Effect |
| --- | --- |
| `@martlet/core/css` | Original scoped Light/Dark color variables only; unchanged from v1 |
| `@martlet/core/foundation.css` | Namespaced design variables; no font loading or element styles |
| `@martlet/core/typography.css` | Text roles inside `.martlet`; requires foundation variables |
| `@martlet/core/fonts.css` | Optional, locally bundled Cambo, Lato, Cinzel, and IBM Plex Mono assets through Fontsource |
| `@martlet/core/components.css` | Optional namespaced interface primitives; requires colors and foundation |
| `@martlet/core/full.css` | Colors, foundation, typography, and components; fonts remain optional |
| `@martlet/core/legacy.css` | Optional variable aliases for incremental website migration |

```js
import '@martlet/core/full.css';
import '@martlet/core/fonts.css';
import { light, dark, foundation, design, capabilities } from '@martlet/core';
```

Set `data-martlet="light"` or `data-martlet="dark"` on the element to theme; add `class="martlet"` to opt into typography and interface styling. Modes may coexist on the same page. CSS remains available without JavaScript; font package imports require a CSS-capable bundler. ESM and CommonJS exports, TypeScript declarations, per-mode JSON, `tokens.json`, `foundation.json`, `design.json`, `capabilities.json`, and highlight.js styles are explicit package exports.

## Typography and overrides

- Serif: Cambo, for prose and primary headings.
- Sans: Lato, for interface text, navigation, and metadata.
- Display: Cinzel, for display accents and secondary heading roles.
- Monospace: IBM Plex Mono, for code and terminal text.

These roles come from the originating personal site, not the demonstration site's former Space Grotesk/DM Sans pairing. Berkeley Mono is not distributed. An owner who has licensed it can override `--martlet-font-mono` on their own root or theme scope. Generic consumers need no proprietary fonts. See NOTICE.md for font licenses.

The optional full stylesheet is not a site template: it includes no personal identity, content, analytics, or consent policy. See [`@martlet/astro`](https://github.com/martletdesign/astro) for Astro composition and a neutral starter.

## Source and releases

Edit `source.json` here; run `npm ci --ignore-scripts`, `npm run build`, `npm test`, and `npm pack`. Generated `dist/` is committed for review and reproducibility. Fontsource dependencies are pinned; lockfiles retain their integrity. The source website's original colors are retained as separate identity tokens rather than silently replacing existing semantic app colors. Reduced-motion preferences zero the shared motion tokens.

The `capabilities` export records what each integration applies, requires separate configuration for, or cannot support. A browser color theme does not change fonts. Editors and terminals use the monospace role only where their host allows it.

Install Core 3 with `npm install @martlet/core@^3.0.0`. Test source changes with `npm pack` and a local consumer. Package versions are independent of application-port versions. Legacy `@martlet/theme` imports remain available and are not redirected automatically.

Application-port generators and framework consumers migrate their dependency and imports explicitly; a Core installation does not satisfy an existing `@martlet/theme` peer dependency. Ordinary verification does not publish. An accepted, unused version on `main` is published through the existing `core-stage.yml` trusted publisher. Tag completion verifies the published package and creates its GitHub source release.

## Layouts

Version 2.1 adds optional [`layout.css`](docs/layout.md), the `layout` JavaScript export, and `layout.json`. Layout primitives cover containers, vertical stacks, wrapping clusters, bounded grids, sidebars, and paired regions. Import `@martlet/core/full.css` for the complete styling layer or add `@martlet/core/layout.css` after `foundation.css` for structural classes alone. See [source observations and responsive rules](docs/layout.md).

## Releases

The source private guard prevents ordinary publication. The trusted publisher transforms only the isolated archive manifest and verifies the accepted digest. The automatic path publishes accepted `main` versions; the manual workflow also supports staging. See [release setup](docs/releasing.md).

## Foundations specification

Read the [working foundations specification](docs/foundations.md) for spacing relationships, responsive composition, typography, density, surfaces, motion, accessibility, and the distinction between shipped values and proposed application roles.

## Experimental UI language

[Grammar](docs/grammar.md), [source decisions](docs/source-decisions.md), [framework and migration guide](docs/consolidation.md), and [machine-readable support](language.json) describe the experimental core 2.2.2 / Astro 1.2.2 consolidation. Existing defaults remain compatible; the source profile is opt-in.

[Grammar coverage review](docs/coverage.md), [validated forms](docs/patterns/forms.md), and [query/results patterns](docs/patterns/query-results.md) extend the experimental grammar to 0.3.

## Adoption repair preview

The existing `@martlet/theme@next` is the experimental 2.2.2 line; `latest` remains the stable 2.1 line. Package, grammar and framework versions are separate: grammar 0.3 is the design contract, core 2.2.2 supplies CSS/tokens, Astro 1.2.2 supplies wrappers, and React 0.1.0 retains its tested core 2.1.0 dependency. Exact package versions belong in the lockfile.

[Direct HTML anatomy](docs/native-html.md) documents layout/pattern classes. [Native form styling](docs/form-styling.md) documents the optional `forms.css` layer included in `full.css`; behavior remains host-owned. Existing colors/fonts and marks retain their native identity.

### React presentation

`react.css` adds the React component anatomy to the existing native Core styles. `react-reference.css` supplies the optional reference application layouts and the hydration-root bridge. Both are authored here; React repositories only import or copy these exports. The shared `martlet.css` remains identical for Astro, Jekyll, and React.
