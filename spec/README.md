# Production spec provenance

- Retrieved from <https://docs.vatly.com/openapi.yaml> on 2026-11-13.
- Byte-identical to `vatly/vatly-docs/public/openapi.yaml` at upstream commit
  [66c8205ea886e4cb48e8e3b2e988de3839c6d4d8](https://github.com/vatly/vatly-docs/commit/66c8205ea886e4cb48e8e3b2e988de3839c6d4d8)
  (vatly-docs PR #89), which serves the production spec of Vatlify Release 2.
- OpenAPI 3.1.0, API version 1.0. The upstream `x-generated-at` says 2026-05-28;
  it is not the retrieval date and is not treated as a freshness guarantee.
- SHA-256: `5e648169e101edc8b3e088dc0e28d0f0a293e8a0ed057014c7336057d986def9`.

`openapi.yaml` here and at the repository root are verbatim copies. No contract
patches or version downgrades are applied. `pnpm gen` refreshes both and generates
types with optional server-defaulted fields left optional. `pnpm gen:check`
checks their consistency offline. Review upstream changes and update this
provenance record when refreshing the snapshot.

Contract checks cover all 50 REST operations and all 32 inbound delivery names.
They do not claim that authenticated live API behavior has been exercised.
