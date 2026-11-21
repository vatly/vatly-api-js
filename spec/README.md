# Production spec provenance

- Retrieved from <https://docs.vatly.com/openapi.yaml> on 2026-11-21.
- Byte-identical to `vatly/vatly-docs/public/openapi.yaml` at upstream commit
  [d5c09d94a52c4e7d884c2817b4b7834597294cb0](https://github.com/vatly/vatly-docs/commit/d5c09d94a52c4e7d884c2817b4b7834597294cb0)
  ("Document month and year as the only subscription plan intervals").
- OpenAPI 3.1.0, API version 1.0. The upstream `x-generated-at` says 2026-05-28;
  it is not the retrieval date and is not treated as a freshness guarantee.
- SHA-256: `be578c73c71c234262b6f5f21bd1f01e209fcc64464a1e81d7fd0675eb3c273c`.

`openapi.yaml` here and at the repository root are verbatim copies. No contract
patches or version downgrades are applied. `pnpm gen` refreshes both and generates
types with optional server-defaulted fields left optional. `pnpm gen:check`
checks their consistency offline. Review upstream changes and update this
provenance record when refreshing the snapshot.

Contract checks cover all 50 REST operations and all 32 inbound delivery names.
They do not claim that authenticated live API behavior has been exercised.
