# Production spec provenance

- Retrieved from <https://docs.vatly.com/openapi.yaml> on 2026-11-27.
- Byte-identical to `vatly/vatly-docs/public/openapi.yaml` at upstream commit
  [1d0baecd68b93de43195a774ea3c13cfb23de2a8](https://github.com/vatly/vatly-docs/commit/1d0baecd68b93de43195a774ea3c13cfb23de2a8)
  ("Document checkout discounts and sync the OpenAPI spec").
- OpenAPI 3.1.0, API version 1.0. The upstream `x-generated-at` says 2026-05-28;
  it is not the retrieval date and is not treated as a freshness guarantee.
- SHA-256: `75c539cd33a5d3f5629ae5c806b9e0158ebcd48c1ff5d2a96f95a4ca47ed167c`.

`openapi.yaml` here and at the repository root are verbatim copies. No contract
patches or version downgrades are applied. `pnpm gen` refreshes both and generates
types with optional server-defaulted fields left optional. `pnpm gen:check`
checks their consistency offline. Review upstream changes and update this
provenance record when refreshing the snapshot.

Contract checks cover all 50 REST operations and all 32 inbound delivery names.
They do not claim that authenticated live API behavior has been exercised.
