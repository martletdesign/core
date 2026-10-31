# Core package identity migration

This private, unpublished candidate is derived from `martletdesign/core` commit `0ee1de92350aa3c1f6c4abacc253a0a0e02fab1b`. It changes the package name from `@martlet/theme` to `@martlet/core` and repository URL while preserving the 25 export mappings, ESM/CommonJS and TypeScript entries, CSS, token data, font dependencies and license/notice. Version numbers mirror the source snapshot for testing; they do not reserve a registry version. `scripts/theme-contract.json` records the pre-migration manifest contract. Do not interpret local tarball installation as npm availability.

## Dependent changes after publication

- Astro: its manifest currently peers on `@martlet/theme`; styles, starter imports, docs, tests and lockfiles also reference it. Decide and test a compatibility strategy explicitly; npm treats the names as different packages, so merely adding `@martlet/core` does not satisfy the existing peer.
- React: update its dependency, CSS imports, consumer documentation, lockfiles and package tests in a separately reviewed change. Keep `@martlet/react` identity and the old lane working.
- Source website: update direct package imports, palettes, generated distribution references, lockfiles, download links and deployment/adoption workflows only after the new artifact is verified and separately authorized. Preserve historical source/provenance URLs.
- Workbench and Jekyll: review gallery imports, `docs/distribution.json`, source manifests, fixtures, lockfiles, agents, package-consumer and pinned conformance tests. Jekyll currently includes standalone assets and must not silently become dependent on npm or a workbench checkout.

The compatibility rehearsal compares local packed candidates with the published `@martlet/theme` source-version tarball: manifest exports/dependencies, generated distribution bytes, licenses and notices, ESM/CommonJS values and each exported file in a clean consumer. It is not a browser, full framework, cross-version or production deployment test. Existing `/theme` package users remain untouched.

## Proposed first-release sequence

1. Review the current Nightjar and source changes, exact version and npm namespace ownership; leave this branch private until a separately approved release change. Inspect existing `/theme` trusted publisher bindings after the repository rename.
2. If approved separately, create the new identity by an authorized staging or publication action. Staging is publicly visible and is not a private test. Coordinate npm trusted-publisher configuration for `martletdesign/core` and `publish.yml` with the first approved release and its validation window.
3. Approve a specific new version/tag and release, publish only under the separate authorization, then independently install and compare the actual registry artifact, integrity, exports and provenance. Preserve the old package and rollback pins.
4. Only after verification, separately review and approve framework/site/workbench adoption, followed by any deployment. A shim or deprecation has its own approval; never unpublish old versions. See [release guard](releasing.md).
