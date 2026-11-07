![Vatly SDK for JavaScript & TypeScript](art/banner.png)

# @getvatly/sdk

Server-side JavaScript / TypeScript SDK for [Vatly](https://vatly.com), the
Merchant of Record for European software and digital products.

**Alpha candidate: `0.3.0-alpha.1`.** Prepared for publication, not yet released
by this change. The public API may change during alpha. npm scope: `@getvatly`;
GitHub home after repository transfer: `vatly/vatly-js`.

- All 50 REST operations in the [production OpenAPI spec](https://docs.vatly.com/openapi.yaml).
- Generated request/resource types and 32 discriminated webhook events.
- ESM + CommonJS, matching `.d.ts` / `.d.cts` declarations, no runtime dependencies.
- Native `fetch`, `Headers`, `AbortController`, and Web Crypto. Node 20+;
  designed for Bun, Deno, Cloudflare Workers and Vercel Edge. Node is tested in CI;
  edge runtimes have not yet been integration-tested.
- Server-only: never expose a Vatly API key to a browser.

## Install

Once the alpha is published:

```bash
npm install @getvatly/sdk@alpha
# or: pnpm add @getvatly/sdk@alpha / yarn add @getvatly/sdk@alpha
```

Before publication, `pnpm install --frozen-lockfile && pnpm build && npm pack`
creates an installable local tarball. No registry publishing is needed.

## Quickstart

```ts
import { VatlyClient } from "@getvatly/sdk";

const vatly = new VatlyClient({ apiKey: process.env.VATLY_API_KEY });
const customer = await vatly.customers.create({ email: "ada@example.com" });
const checkout = await vatly.checkouts.create({
  customerId: customer.id,
  redirectUrlSuccess: "https://example.com/success",
  redirectUrlCanceled: "https://example.com/cancel",
  products: [{ id: "subscription_plan_YOUR_PLAN_ID", quantity: 1 }],
});
console.log(checkout.links.checkoutUrl.href); // redirect the customer's browser here

for await (const order of vatly.orders.listAll({ limit: 100 })) {
  console.log(order.id, order.total.value);
}
```

CommonJS: `const { VatlyClient } = require("@getvatly/sdk");`.
See [resource guides](docs/README.md), the [operation reference](docs/API.md), and
[examples](examples/README.md). IDs in examples must be replaced with your own.

## Authentication and configuration

Pass an API key explicitly, or use `VATLY_API_KEY` on Node. Keys start with
`live_` or `test_`, followed by at least 18 characters matching `[A-Za-z0-9_|]`.
The constructor validates this format; `client.mode` exposes `"live" | "test"`.
Both modes use the production API, but data cannot cross mode boundaries.

```ts
const vatly = new VatlyClient({
  apiKey: process.env.VATLY_API_KEY,
  server: "production", // default; "staging" targets the separate staging server
  timeoutMs: 30_000,     // per attempt, including response body; 0 disables
  maxRetries: 2,         // retries after the first attempt
  clientInfo: { app: "MyApp/1.0", framework: "Next.js/15" },
});
```

`baseUrl` overrides `server`; defaults are `https://api.vatly.com/v1` and
`https://api.staging.vatly.com/v1`. Advanced options include `fetch`,
`defaultHeaders`, `userAgent`, and `idempotencyKeyGenerator`. Every method takes
`RequestOptions` last: `{ idempotencyKey, timeoutMs, headers, signal }`.
Cancellation also accepts `{ immediately: true }` in that options object.
Canceling through `signal` also interrupts retry backoff.

`Vatly-Client-Info` identifies SDK version, runtime, OS/architecture when known,
plus optional `app` / `framework` (sanitized and capped at 64 characters each).
Set `clientInfo: false` to omit it. `dangerouslyAllowBrowser: true` bypasses the
browser guard only; it does not make secret keys safe for browser use.

## Errors, retries and idempotency

All HTTP errors extend `VatlyError` and expose `status`, `body`, `details`,
`url`, and `method`. `details` is optional, forward-compatible server context.

| Status | Error |
| --- | --- |
| 401 | `VatlyAuthError` |
| 403 | `VatlyForbiddenError` |
| 404 | `VatlyNotFoundError` |
| 409 | `VatlyConflictError` (also exposes `retryAfter` in seconds) |
| 422 | `VatlyValidationError` (`errors: Record<string, string[]>`) |
| 429 | `VatlyRateLimitError` (`retryAfter` in seconds) |
| Other | `VatlyApiError` |

Network failures and caller aborts raise `VatlyConnectionError`; timeouts raise
`VatlyTimeoutError`. Malformed nonempty JSON success responses raise
`VatlyApiError` rather than pretending to be typed resources. JSON resource
responses are not runtime schema-validated.

```ts
import { VatlyConflictError, VatlyValidationError } from "@getvatly/sdk";
try {
  await vatly.customers.create({ email: "ada@example.com" });
} catch (error) {
  if (error instanceof VatlyValidationError) console.error(error.errors);
  else if (error instanceof VatlyConflictError &&
           error.details?.idempotency_outcome === "unknown") {
    // Read/reconcile the resource before another mutation. Do not blindly retry.
    throw error;
  } else throw error;
}
```

- GETs and keyed mutations retry network failures, timeouts, `429`, and `5xx`
  with exponential backoff and jitter. `Retry-After` seconds or HTTP-date is honored.
- Only a keyed `409` with `details.idempotency_outcome: "in_progress"` retries.
  `unknown`, parameter conflicts and other `409`s never retry automatically.
- POST/PATCH/DELETE get a UUID idempotency key automatically, reused with the
  exact same body across retries. An explicit `idempotencyKey` wins over a header
  key, which wins over auto-generation. No key means no mutation retries.
- Override per call with `{ idempotencyKey: "your-operation-id" }`. Configure
  `idempotencyKeyGenerator: () => yourUniqueId()` or `false` to disable auto-keys.
- The server retains keys for 24 hours and binds them to exact parameters.
  It can replay the first error response, including `5xx`; retries do not
  guarantee eventual success. Reconcile uncertain outcomes before using a new key.

## Pagination

Lists return `{ data, count, links: { self, next, prev } }`. Use `list()` for a
page or `listAll()` for lazy async iteration. `limit` defaults to 10 (max 100).
`startingAfter` and `endingBefore` are mutually exclusive. Auto-pagination
preserves filters, follows the next cursor, and rejects malformed/repeated cursors
instead of silently truncating or looping. Product/plan lists accept `includeArchived`.

## Money and email

Money values stay decimal strings. Never coerce them to floating-point numbers.
New product/plan prices and checkout overrides are EUR-only; subscription price
changes and refunds must use the existing resource's currency.

```ts
import { toMinorUnits, fromMinorUnits } from "@getvatly/sdk";
toMinorUnits({ value: "29.00", currency: "EUR" }); // 2900n
fromMinorUnits(2900n, "EUR"); // { value: "29.00", currency: "EUR" }
```

Use `bigint` for large minor-unit counts; fractional/unsafe numeric counts are
rejected. Helpers default to two fractional digits (optional `decimals` argument).

The API accepts Unicode domains and canonicalizes emails (lowercase local part
and lowercase Punycode domain). `encodeEmail` / `encodeDomain` remain optional
ASCII-domain helpers; `encodeEmail` deliberately rejects non-ASCII local parts
and preserves local-part case. `decodeEmail` / `decodeDomain` return Punycode
unchanged unless the runtime exposes `URL.toUnicode`—for Node display use
`node:url`'s `domainToUnicode` instead.

## Webhook verification

```ts
import { constructWebhookEventFromRequest } from "@getvatly/sdk/webhooks";

export async function POST(request: Request): Promise<Response> {
  const event = await constructWebhookEventFromRequest(request, process.env.VATLY_WEBHOOK_SECRET!);
  switch (event.eventName) {
    case "order.paid":
      console.log(event.object.total); // Order, no cast
      break;
    case "subscription.updated":
      console.log(event.reason, event.object.scheduledUpdate);
      break;
    case "webhook.setup":
      return new Response("ok"); // signed endpoint verification handshake
  }
  return new Response("ok");
}
```

Verify **raw bytes**, not reserialized JSON. `Vatly-Signature` is
`t=<unix seconds>,v1=<hex HMAC-SHA256 of "{t}.{rawBody}">`. Default clock-skew
tolerance is 300 seconds; `{ toleranceSeconds: 0 }` disables freshness checks
only for deliberate historical replay. Invalid signatures throw
`VatlyInvalidSignatureError`. The request helper consumes the body.

The SDK is stateless. After verification, use the **signed `event.id`** to
deduplicate with transactional processing in your database; the unsigned
`Vatly-Event-Id` header is useful for correlation, not trusted identity. Acknowledge
only after successful processing; retry failed work. A clock check alone is not
replay prevention. During rotation pass `[oldSecret, newSecret]`.

For non-Fetch frameworks use `constructWebhookEvent(rawBody, header, secret)`.
`constructEvent*` returns the raw `WebhookDelivery` wire type, while
`toWebhookEvent` correlates it by event name. These helpers verify signatures
and parse JSON, not full resource schemas. Names/constants are exported as
`WebhookEventName`, `WEBHOOK_EVENT_NAMES`, and `isWebhookEventName`.
See [webhook management and event guide](docs/Webhooks.md).

## Development and alpha readiness

```bash
pnpm install --frozen-lockfile
pnpm gen        # explicitly refresh from production docs; review contract changes
pnpm check      # offline drift check, types, lint, tests, build, installed-package checks
```

`openapi.yaml` and `spec/openapi.yaml` are verbatim snapshots; generated types
live in `src/generated/schema.ts`. Generation uses the installed, locked generator,
without version downgrades. Optional fields with server defaults stay optional.
Builds and `gen:check` require no network. See [spec provenance](spec/README.md).

CI covers Node 20/22/24, every documented REST operation, and installed ESM/CJS
consumers with NodeNext/Bundler resolution. `prepack` builds artifacts; the release
workflow verifies and sends prereleases to the `alpha` npm dist-tag, not `latest`.
Publishing requires a separately authorized release and npm access to `@getvatly`.
Repository transfer to `vatly/vatly-js` must precede provenance publication.
Live API testing requires account-specific credentials/resources and has not
been performed in this change. No fluent wrapper or PHP port is included.

## License

MIT
