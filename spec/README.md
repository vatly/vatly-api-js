# Production spec provenance

- Retrieved from <https://docs.vatly.com/openapi.yaml> on 2026-11-07.
- Byte-identical to `vatly/vatly-docs/public/openapi.yaml` at upstream commit
  [e32139940395f7971508e593fc662caf9f09bab0](https://github.com/vatly/vatly-docs/commit/e32139940395f7971508e593fc662caf9f09bab0).
- OpenAPI 3.1.0, API version 1.0. The upstream `x-generated-at` says 2026-05-28;
  it is not the retrieval date and is not treated as a freshness guarantee.
- SHA-256: `69640ac82bbba8d101e6aa882facd5f13aa5cf67f38508e5cea18abef03c4940`.

`openapi.yaml` here and at the repository root are verbatim copies. No contract
patches or version downgrades are applied. `pnpm gen` refreshes both and generates
types with optional server-defaulted fields left optional. `pnpm gen:check`
checks their consistency offline. Review upstream changes and update this
provenance record when refreshing the snapshot.

Contract checks cover all 50 REST operations and all 32 inbound delivery names.
They do not claim that authenticated live API behavior has been exercised.
