# Changelog

All notable changes to `@vatly/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
