# Shared reference styles

`@martlet/core/martlet.css` is the complete external reference stylesheet. Astro, React, and Jekyll consume identical bytes. The main website also imports this entry point. `reference-fonts.css` uses the existing local font URLs; `reference-shell.css` preserves the captured shell for archive provenance and is already included in martlet.css.

Core owns every selector, palette, control role, layout measure, and example composition. Edit `styles/reference/`, `styles/dashboards.css`, or `styles/dashboard-controls.css`, or `styles/website.css` here, build Core, then update the consumer dependency pins and synchronize their generated assets. The consumers contain generated CSS assets and a package-version/hash manifest; they must not edit those assets or add stylesheets, style elements, style attributes, or JavaScript CSS mutations.

Dashboard inputs share Core input tokens and `--martlet-control-height`. Choice inputs retain compact native geometry. Commands use `martlet-button` with `martlet-button--secondary` for subordinate actions. All three routes use the same definitions in either renderer.

Hero focal positions use `data-hero-focal` with center, top, bottom, left, right, left top, right top, left bottom, or right bottom. Custom focal positions require a named Core rule. Palette ribbons use the canonical ordered palette, without inline variables.
