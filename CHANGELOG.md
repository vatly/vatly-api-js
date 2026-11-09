# Changelog

All notable changes to `@getvatly/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 0.3.0-alpha.2

### Fixed

- Serialize explicit subscription cancellation `immediately` values as `1`/`0`,
  matching the production API's boolean validation; omitted values remain omitted.

### Added

- Regression coverage for customer creation, webhook endpoints, subscriptions,
  orders, and refunds (PR #10), plus packaged cancellation-query checks.
- Explicit alpha stability notices: every alpha may include breaking changes.

### Changed

- Upgrade GitHub Actions to versions using the Node 24 action runtime while
  retaining SDK compatibility checks on Node 20, 22, and 24.

## 0.3.0-alpha.1

### Added

- Coverage of all 50 REST operations in the production OpenAPI 3.1.0 snapshot
  from docs.vatly.com, with source commit and SHA-256 recorded in `spec/README.md`.
- Customer identity updates and short-lived customer portal sessions.
- Product/plan creation, updates, archive/unarchive, and `includeArchived` filters.
- Webhook endpoint management and the full 32-name typed delivery catalogue,
  including subscription updates/nonpayment and product/plan lifecycle events.
- Typed deterministic renewal/payment simulation helpers, guarded to test mode.
- `VatlyConflictError`, optional structured `.details`, and safe `in_progress`
  idempotency-conflict retries. Unknown outcomes require caller reconciliation.
- Offline generated-contract drift check, tests against every documented route,
  and isolated tarball tests exercising ESM/CJS over real local HTTP, independently
  signed webhooks, NodeNext/Bundler declarations, and compiled examples.
- Full operation reference, alpha migration notes and updated usage guides.
- Safe customer-portal and endpoint-provisioning examples, with every shipped
  example compiled against the installed package.

### Changed

- Package renamed to `@getvatly/sdk`; GitHub metadata targets `vatly/vatly-api-js`.
- Version is a prerelease and publication defaults to the `alpha` npm dist-tag.
- Webhook helpers return a disjoint known/unsupported event union. Check the
  SDK-owned `known` flag before narrowing `eventName`; unknown signed deliveries
  retain their envelope and an `unknown` object for durable triage.
- Remove the public production/staging `server` selector, `VatlyServer`, and
  environment-specific URL constants. Both live and test keys use the Vatly API
  URL, exported as `VATLY_BASE_URL`; explicit `baseUrl` overrides remain supported.
- Conditional ESM/CJS exports resolve matching `.d.ts` / `.d.cts` declarations.
  Packing builds the SDK and includes docs, examples, banner, and OpenAPI reference.
- Money currencies and pagination link fields now derive directly from generated
  schemas. `fromMinorUnits` preserves the literal currency for EUR-only requests.
- Generation uses the locked installed generator with no OpenAPI downgrade or
  network dependency during builds. Optional server-defaulted fields stay optional.
- Subscription cancellation returns `void` (204) and accepts `immediately` in
  options; billing-update methods return a hosted link, not a subscription.
- `fastForwardRenewal(id, body?, opts?)` returns a typed subscription. The obsolete
  transaction-based `simulatePaymentFailure` is replaced by `simulateOrderPayment`.

### Fixed

- Bind the fetch transport to its global receiver so Cloudflare workerd does not
  reject requests with `Illegal invocation`. Verified with a real read-only API call.
- Expose the production customer email filter in `CustomerListParams`.
- Timeouts remain active through body consumption; cancellation interrupts
  backoff, and an already-aborted request never reaches fetch.
- Header merging is case-insensitive and header-supplied idempotency keys are
  honored without auto-generation overwriting them.
- `Retry-After` supports HTTP-date and zero seconds without truncating long waits
  to 60 seconds. Malformed nonempty JSON success bodies raise a typed API error.
- Auto-pagination rejects broken/repeating cursors instead of truncating or looping.
- Money conversion rejects fractional/unsafe numeric minor units rather than
  silently truncating or losing precision. Large `bigint` values remain exact.
- Webhook examples deduplicate the signed event ID after verification, rather
  than trusting an unsigned event-ID header before signature verification.

### Validation limits

- Authenticated Vatly integration tests and edge-runtime deployment tests have
  not been run. Account-specific credentials/resources and npm scope access are
  needed before external release validation.

## Earlier unreleased baseline work

### Added

- Typed webhook payload→event processing: `constructWebhookEvent` /
  `constructWebhookEventFromRequest` return a discriminated `VatlyWebhookEvent`
  whose `object` narrows to the exact resource when you `switch` on `eventName`.
  Plus `WebhookEventName` constants, `WEBHOOK_EVENT_NAMES`, `isWebhookEventName()`,
  and `toWebhookEvent()`.
- `WebhookDelivery` and `Webhook` are now exported types.
- A verbatim `openapi.yaml` reference at the repo root, regenerated on every
  `pnpm gen`.
- Request-level test coverage for every resource (checkouts, customers,
  one-off-products, subscription-plans, orders, refunds, chargebacks,
  webhook-events).
- Automated npm release workflow with build provenance.

### Changed

- `constructEvent` / `constructEventFromRequest` now return `WebhookDelivery`
  (the inbound POST envelope — covers the `webhook.setup` verification call and
  makes `links` optional) instead of the persisted `WebhookEvent`. The persisted
  shape is still exported as `WebhookEvent` and returned by
  `client.webhookEvents.get()`.

## [0.2.0]

Initial development baseline — the SDK's first feature-complete surface, ahead
of the first tagged npm release.

### Added

- Typed resource clients for checkouts, customers, one-off-products,
  subscription-plans, orders (incl. nested refunds and chargebacks), refunds,
  chargebacks, subscriptions, and webhook-events.
- `subscriptions.resume()` and deprecated aliases for the renamed hosted-link
  methods.
- Cursor pagination with `list()` / `listAll()` async iteration.
- Retries with exponential backoff + jitter, `Retry-After` support, and an
  automatic `Idempotency-Key` on every mutating request (incl. DELETE).
- Multi-runtime webhook signature verification (Web Crypto; Node 20+, Workers,
  Vercel Edge, Deno, Bun) with multi-secret rotation support.
- Typed error classes per HTTP status, Punycode email helpers, and `Money`
  minor-unit helpers.
- Types generated from the Vatly OpenAPI spec.

[Unreleased]: https://github.com/vatly/vatly-api-js/commits/main
