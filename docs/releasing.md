# Core releases and staged publication

`@martlet/core@2.2.3` is already published through the existing stage-only trusted publisher. Do not republish it. The compatible next source version is 2.2.4. Preserve historical `@martlet/theme` versions and tags; see [migration](core-migration.md).

## Acceptance and artifact identity

Follow [the ratified GitFlow policy](https://github.com/k3jph/design-workbench/blob/develop/docs/GITFLOW-ACCEPTANCE.md): candidate branches may fail, the one required `verify` check controls integration, zero human reviews are required, and merging into `develop` or `main` is acceptance. Extended compatibility and browser checks are advisory. Promote release changes through `main` before publication. Publication safeguards, restricted environments, protected version tags, npm 2FA, and provenance remain required; they do not recreate PR-review or historical-CI gates.

Keep `private: true` in source. The existing `.github/workflows/core-stage.yml` accepts an exact main SHA, an independently reproduced publishable tarball SHA-256, and `latest` or `next`. It derives name/version from package, canonical source, and lockfile; refuses an existing or uncertain registry version; verifies the live main identity; then builds two archives from that exact Git source. Only the isolated package manifest changes to `private: false`. Both archives must match each other and the supplied digest, and their regular-file layout and manifest are inspected. The main/ref/registry checks repeat immediately before staging. Jobs have a 15-minute bound and concurrent stages serialize.

The trusted publisher identity remains repository `martletdesign/core`, workflow `core-stage.yml`, environment `core-stage-review`. It uses GitHub OIDC and `npm stage publish --provenance`; no static npm token or direct publication is introduced. The configured environment restrictions and npm owner's separate staging approval remain intact. Obtain the genuine stage identifier from the successful run. Never approve a bootstrap sentinel. If owner approval or identity configuration is required, report that action and continue unrelated implementation work.

## Verification and release record

After npm approval, download the exact registry tarball and compare its integrity and bytes with the accepted archive. Install it in an empty consumer; resolve exports, compile types, and run `npm audit signatures --json --include-attestations`. Verify provenance for the exact package bytes, accepted main SHA, repository, `core-stage.yml`, main ref, and workflow-dispatch event. Existing tag-release guard helpers support these expected provenance parameters. A successful build or merge alone is not publication evidence.

After publication verification, create the protected `v<version>` tag at the eligible accepted main commit. The existing `tag-release.yml` now completes the GitHub source release: it reproduces the isolated archive, verifies exact registry bytes and staged provenance, rechecks the remote protected tag and definite release absence, and attaches the tarball and `SHA256SUMS`. It has no npm write operation, OIDC permission, publication environment, or additional review gate. Existing tags/releases are never overwritten. The historical `publish.yml` release-event publisher is absent. Changing the source alone does not configure npm publishers, create tags/releases, or mutate the registry.

See [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) and [staged publishing](https://docs.npmjs.com/staged-publishing/).
