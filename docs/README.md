![Vatly SDK for JavaScript & TypeScript](https://raw.githubusercontent.com/sandervanhooft/vatly-js/main/art/banner.png)

# Getting Started

Official TypeScript SDK for the Vatly Merchant of Record API. Handle checkouts, subscriptions, one-off payments, EU VAT compliance, and billing for your SaaS — on Node, Cloudflare Workers, Vercel Edge, Deno, and Bun.

> **Looking for the exact field list?** These guides cover the common paths. The authoritative, machine-readable schema for every endpoint lives in the [OpenAPI spec](https://docs.vatly.com/openapi.yaml) — point your AI assistant or codegen tooling at it when an example leaves a field ambiguous.

## Installation

Install the SDK from npm.

```bash
npm install @vatly/sdk
# or: pnpm add @vatly/sdk / yarn add @vatly/sdk
```

The package ships ESM + CommonJS builds and its own TypeScript types. It uses the
platform `fetch` and Web Crypto — no `axios`, `node-fetch`, or `node:crypto` — so
the same code runs everywhere modern JavaScript runs.

## Quick start

Initialize the client with your API key and create a checkout.

### API Keys

Get your API keys from the [Vatly Dashboard](https://my.vatly.com) under **Settings > API**.

| Name | Type | Description |
| --- | --- | --- |
| `live_` | `prefix` | Production transactions, real charges. |
| `test_` | `prefix` | Sandbox testing, no real charges. |

The client validates the key format at construction and exposes the detected
mode on `client.mode` (`"live"` or `"test"`).

```ts
import { VatlyClient } from "@vatly/sdk";

const vatly = new VatlyClient({
  apiKey: process.env.VATLY_API_KEY, // live_… or test_…
  // server: "staging",              // default: "production"
});

// Create a checkout
const checkout = await vatly.checkouts.create({
  redirectUrlSuccess: "https://yourapp.com/success",
  redirectUrlCanceled: "https://yourapp.com/canceled",
  products: [{ id: "subscription_plan_abc123", quantity: 1 }],
});

// Redirect the customer to the hosted checkout page
console.log(checkout.links.checkoutUrl.href);
```

On Node, `VATLY_API_KEY` is read from `process.env` as a fallback. On edge
runtimes without `process`, pass `apiKey` explicitly.

## Idempotency

The SDK automatically attaches an `Idempotency-Key` header to every `POST`,
`PATCH`, and `DELETE` request (a UUID v4). Checkout creation, subscription
updates, and refund cancellations are protected out of the box, and the key is
reused across automatic retries so a retried call is deduped server-side.

### Override the key per call

Pass `idempotencyKey` in the request options when you have your own request ID:

```ts
await vatly.checkouts.create(body, { idempotencyKey: "checkout-create-123" });

await vatly.subscriptions.update("subscription_123", { quantity: 2 }, {
  idempotencyKey: "subscription-update-123",
});
```

### Custom generator or disable auto-generation

```ts
// Custom generator (e.g. tie keys to a tracing span)
new VatlyClient({ idempotencyKeyGenerator: () => span.context().traceId });

// Disable entirely — caller must supply opts.idempotencyKey for retries to work
new VatlyClient({ idempotencyKeyGenerator: false });
```

## Retries

The client retries `429`, `5xx`, and network failures with exponential backoff
and jitter (default `maxRetries: 2`), honoring the `Retry-After` header. Only
requests that carry an `Idempotency-Key` are retried — which is the default for
every mutating verb.

## Pagination

List endpoints are cursor-paginated. Use `list()` for a single page or
`listAll()` to walk every page with `for await`:

```ts
const page = await vatly.orders.list({ limit: 25 });

for await (const order of vatly.orders.listAll({ limit: 100 })) {
  // ...
}
```

## Resources

The SDK provides access to all Vatly API resources.

| Resource | Description |
| --- | --- |
| [Checkouts](/docs/Checkouts.md) | Create hosted payment pages |
| [Customers](/docs/Customers.md) | Manage customer records |
| [Subscriptions](/docs/Subscriptions.md) | Recurring billing |
| [Subscription Plans](/docs/SubscriptionPlans.md) | Define subscription products |
| [One-Off Products](/docs/OneOffProducts.md) | Single-purchase products |
| [Orders](/docs/Orders.md) | Transaction records |
| [Refunds](/docs/Refunds.md) | Process refunds |
| [Chargebacks](/docs/Chargebacks.md) | Handle disputes |
| [Webhooks](/docs/Webhooks.md) | Real-time event notifications |

## Error handling

Every non-2xx response maps to a typed error extending `VatlyError`.

| Name | Status | Description |
| --- | --- | --- |
| `VatlyAuthError` | `401` | Missing or invalid API key. |
| `VatlyForbiddenError` | `403` | Authenticated but not allowed. |
| `VatlyNotFoundError` | `404` | Resource does not exist. |
| `VatlyValidationError` | `422` | Invalid request; exposes `.errors: Record<string, string[]>`. |
| `VatlyRateLimitError` | `429` | Rate limited; exposes `.retryAfter` (seconds). |
| `VatlyApiError` | other | Any other API error. |
| `VatlyConnectionError` / `VatlyTimeoutError` | — | Network failure / timeout. |

```ts
import { VatlyValidationError } from "@vatly/sdk";

try {
  await vatly.customers.create({ email: "" });
} catch (err) {
  if (err instanceof VatlyValidationError) {
    console.error(err.errors.email);
  } else {
    throw err;
  }
}
```

## Money

Monetary amounts are `Money` objects — `{ value, currency }` where `value` is a
**decimal string** to preserve precision. Never coerce `value` to a JavaScript
`number`. Helpers convert to/from integer minor units:

```ts
import { toMinorUnits, fromMinorUnits } from "@vatly/sdk";

toMinorUnits({ value: "29.00", currency: "EUR" }); // → 2900n
fromMinorUnits(2900n, "EUR");                       // → { value: "29.00", currency: "EUR" }
```

## Requirements

- Node 20+, Cloudflare Workers, Vercel Edge, Deno, or Bun
- Platform `fetch` and Web Crypto (built in on all supported runtimes)
