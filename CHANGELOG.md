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

[Unreleased]: https://github.com/vatly/vatly-js/commits/main
