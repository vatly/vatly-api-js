# Changelog

All notable changes to `@getvatly/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `UnsupportedWebhookEvent` typed fallback for webhook deliveries whose
  `eventName` isn't in the catalogue this SDK release knows about (e.g. the
  server ships a new event between SDK versions). `toWebhookEvent` and the
  `constructWebhookEvent*` helpers now return `MaybeUnsupportedWebhookEvent`;
  use the new `isKnownWebhookEvent()` / `isUnsupportedWebhookEvent()` type
  guards to branch before switching on `eventName`. The `nextjs-webhook-route`
  example demonstrates the pattern. Mirrors `vatly-api-php`'s
  `UnsupportedWebhookReceived` DTO.

### Fixed

- Bind the fetch transport to its global receiver so Cloudflare workerd does not
  reject requests with `Illegal invocation`. Verified with a real read-only API call.
- Expose the production customer email filter in `CustomerListParams`.

## 0.3.0-alpha.1 — prepared, not published

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

### Changed

- Package renamed to `@getvatly/sdk`; GitHub metadata targets `vatly/vatly-js`.
- Version is a prerelease and publication defaults to the `alpha` npm dist-tag.
  No tag or release is created by this work.
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
  needed before external release validation. GitHub transfer precedes publication.

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
- `customers.update()` (PATCH `/customers/{id}` — name/email only).
- `customers.createPortalSession()` for the hosted customer portal, plus
  `CreatePortalSessionRequest` / `PortalSession` types.
- `subscriptionPlans.create()`, `.update()`, `.archive()`, `.unarchive()`, and
  an `includeArchived` filter on `list()` / `listAll()`.
- `oneOffProducts.create()`, `.update()`, `.archive()`, `.unarchive()`, and
  an `includeArchived` filter on `list()` / `listAll()`.
- `client.webhookEndpoints`: full CRUD for the managed `/webhook-endpoints`
  collection (`list`, `listAll`, `get`, `create`, `update`, `delete`) with
  `WebhookEndpoint`, `CreateWebhookEndpointRequest`,
  `UpdateWebhookEndpointRequest`, and `WebhookSubscriptionEventName` types.
- 13 new webhook event names on `WebhookEventName` / `WEBHOOK_EVENT_NAMES` with
  typed `object` narrowing and per-event type aliases: `subscription.updated`,
  `subscription.update_scheduled`, `subscription.canceled_for_nonpayment`, five
  `one_off_product.*`, and five `subscription_plan.*`.
- `testHelpers.simulateOrderPayment(orderId, body)` →
  `POST /test-helpers/orders/{orderId}/simulate-payment`, returning the `Order`.
- Optional `FastForwardSubscriptionRenewalRequest` body on
  `testHelpers.fastForwardRenewal()` so callers can force a `paid` / `failed`
  renewal payment outcome.
- Exported types: `UpdateCustomerRequest`, `CreateSubscriptionPlanRequest`,
  `UpdateSubscriptionPlanRequest`, `CreateOneOffProductRequest`,
  `UpdateOneOffProductRequest`, `SimulateOrderPaymentRequest`,
  `FastForwardSubscriptionRenewalRequest`, and `EurMoney`.
- `examples/customer-portal.ts` and `examples/webhook-endpoints.ts` showing the
  new customer-portal and webhook-endpoint CRUD flows.
- `UnsupportedWebhookEvent` typed fallback for webhook deliveries whose
  `eventName` isn't in the catalogue this SDK release knows about (e.g. the
  server ships a new event between SDK versions). `toWebhookEvent` and the
  `constructWebhookEvent*` helpers now return `MaybeUnsupportedWebhookEvent`;
  use the new `isKnownWebhookEvent()` / `isUnsupportedWebhookEvent()` type
  guards to branch before switching on `eventName`. The `nextjs-webhook-route`
  example demonstrates the pattern.

### Changed

- `constructEvent` / `constructEventFromRequest` now return `WebhookDelivery`
  (the inbound POST envelope — covers the `webhook.setup` verification call and
  makes `links` optional) instead of the persisted `WebhookEvent`. The persisted
  shape is still exported as `WebhookEvent` and returned by
  `client.webhookEvents.get()`.
- `testHelpers.fastForwardRenewal()` now returns the `Subscription` (was
  `unknown`).
- Test files are now type-checked by `pnpm typecheck` (previously excluded).
- Hand-adjusted `CreateOneOffProductRequest`, `CreateSubscriptionPlanRequest`,
  `SimulateOrderPaymentRequest`, and `FastForwardSubscriptionRenewalRequest` so
  fields that only carry a server-side default are optional. The upstream
  `openapi-typescript` v7 generator mis-marks defaulted properties as required;
  the SDK restores the spec's intent so callers don't have to send values they
  want the server to default.

### Removed

- `testHelpers.simulatePaymentFailure()` — the underlying
  `/test-helpers/mandated-payments/{id}/simulate-failure` endpoint has been
  retired by the API. Use `testHelpers.simulateOrderPayment(orderId, { paymentStatus: "failed", failureReason? })`
  against the renewal order instead.

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

[Unreleased]: https://github.com/vatly/vatly-js/commits/main
