![Vatly SDK for JavaScript & TypeScript](art/banner.png)

# @vatly/sdk

Official TypeScript SDK for the [Vatly](https://vatly.com) Merchant of Record API.

- Runs on Node 20+, Cloudflare Workers, Vercel Edge, and Deno.
- Types generated from the OpenAPI spec; client is hand-written.
- Zero browser build — handles secret keys.
- Native `fetch`. No `axios`, no `node-fetch`, no `node:crypto`.

## Install

```bash
pnpm add @vatly/sdk
# or: npm install @vatly/sdk / yarn add @vatly/sdk
```

## Quickstart

```ts
import { VatlyClient } from "@vatly/sdk";

const vatly = new VatlyClient({
  apiKey: process.env.VATLY_API_KEY, // must start with live_ or test_
  // server: "staging",              // default: "production"
  // timeoutMs: 30_000,
  // maxRetries: 2,
});

// Create a checkout
const checkout = await vatly.checkouts.create({
  redirectUrlSuccess: "https://example.com/success",
  redirectUrlCanceled: "https://example.com/cancel",
  products: [{ id: "subscription_plan_Wt5mNvBxKw7YcZaEjLhR", quantity: 1 }],
});
console.log(checkout.links.checkoutUrl.href);

// Fetch an order
const order = await vatly.orders.get("order_Hn5xWqVfKm8RjTgYbUcP");

// Paginate every customer
for await (const customer of vatly.customers.listAll({ limit: 100 })) {
  console.log(customer.id, customer.email);
}
```

## Authentication & modes

API keys must match `^(live|test)_[\w|]{18,}$` — a `live_` or `test_` prefix
followed by at least 18 characters of `[A-Za-z0-9_|]`. The client validates
this at construction and detects mode from the prefix, exposed on `client.mode`.
Anything that doesn't match throws synchronously:

```ts
new VatlyClient({ apiKey: "sk_oops" });
// → Error: Vatly: API key must start with `live_` or `test_` followed by at least 18 characters.
```

`VATLY_API_KEY` is read from `process.env` as a fallback on Node. On edge
runtimes without `process`, pass `apiKey` explicitly.

## Error handling

Every non-2xx response maps to a typed error extending `VatlyError`:

| Status | Class                    |
|--------|--------------------------|
| 401    | `VatlyAuthError`         |
| 403    | `VatlyForbiddenError`    |
| 404    | `VatlyNotFoundError`     |
| 422    | `VatlyValidationError` — exposes `.errors: Record<string, string[]>` |
| 429    | `VatlyRateLimitError` — exposes `.retryAfter` (seconds) |
| other  | `VatlyApiError`          |

Network and abort failures raise `VatlyConnectionError` / `VatlyTimeoutError`.

```ts
import { VatlyValidationError } from "@vatly/sdk";

try {
  await vatly.customers.create({ email: "" });
} catch (err) {
  if (err instanceof VatlyValidationError) {
    console.error(err.errors.email);
  } else throw err;
}
```

The Vatly `Error` schema is `{ message: string }` only (`ValidationError` adds
`errors`). There is no `details` field — do not rely on one.

## Retries & idempotency

- Exponential backoff with jitter on `429`, `5xx`, and network failures.
- `Retry-After` (seconds) is respected.
- Default `maxRetries: 2`.
- **Every POST, PATCH, and DELETE automatically receives an `Idempotency-Key`**
  (a UUID v4 from `crypto.randomUUID()`). The Vatly API dedupes on the key for
  all mutating verbs, so retries are safe out of the box.
- The auto-generated key is reused across retries of the same logical call —
  the server dedupes on it.
- Mutating calls without an `Idempotency-Key` (i.e. you opted out of auto-gen
  and didn't supply one) are never retried.

Override the key per call when you have your own request ID:

```ts
await vatly.checkouts.create(body, { idempotencyKey: myTracer.requestId() });
```

Customize or disable auto-generation at client level:

```ts
// Custom generator (e.g. tie keys to a tracing span)
new VatlyClient({ idempotencyKeyGenerator: () => span.context().traceId });

// Disable entirely — caller must supply opts.idempotencyKey for retries to work
new VatlyClient({ idempotencyKeyGenerator: false });
```

## Runtime identification

Every request sends `Vatly-Client-Info` so the Vatly team can diagnose
issues without guessing what runtime you're on. The header is built once at
client construction and reused for every request. Defaults are auto-detected:

```
Vatly-Client-Info: sdk=vatly-sdk-js/0.2.0; runtime=node/v20.11.1; os=darwin; arch=arm64
```

The SDK recognizes Node, Bun, Deno, Cloudflare Workers, and Vercel Edge.
Identify your application:

```ts
new VatlyClient({
  clientInfo: {
    app: "MyApp/1.2.3",
    framework: "Next.js/14",
  },
});
// Vatly-Client-Info: sdk=vatly-sdk-js/0.2.0; runtime=node/v20.11.1; os=linux; arch=x64; app=MyApp/1.2.3; framework=Next.js/14
```

The supported fields are `app` and `framework`, each capped at 64 characters
(over-long values are truncated; header-breaking chars are stripped). The
auto-detected `sdk` / `runtime` / `os` / `arch` defaults cannot be overridden
— if you need more named fields (e.g. `region`, `cloud`), open an issue and
we'll add them as constrained named fields.

Pass `clientInfo: false` to omit the header entirely.

## Browser usage

`VatlyClient` is server-only. Instantiating it in a browser DOM context
(`window` + `document` defined, not jsdom/happy-dom) throws at construction
— Vatly keys are secret material and would leak to every visitor. If you
have a deliberate reason (a testing setup, an Electron renderer with a
server-side key, etc.) pass `dangerouslyAllowBrowser: true`.

## Pagination

Vatly lists are cursor-paginated: `{ data, count, links: { self, next, prev } }`.

```ts
const page = await vatly.orders.list({ limit: 25 });
// or walk every page:
for await (const order of vatly.orders.listAll({ limit: 100 })) {
  // ...
}
```

## Money

`Money` values are kept as decimal strings to preserve precision. Never coerce
to `number` — IEEE-754 loses precision on most decimal amounts.

```ts
import { toMinorUnits, fromMinorUnits } from "@vatly/sdk";

toMinorUnits({ value: "29.00", currency: "EUR" });    // → 2900n
fromMinorUnits(2900n, "EUR");                          // → { value: "29.00", currency: "EUR" }
```

## Webhook verification

Vatly signs every webhook delivery with a structured `Vatly-Signature` header
and exposes the event id in `Vatly-Event-Id` for cheap dedup. The wire format
is a verbatim match for `Stripe-Signature` so anyone familiar with that
pattern can transfer the muscle memory.

```
Vatly-Signature: t=1700000000,v1=<hex_hmac_sha256>
Vatly-Event-Id:  webhook_event_Qk8pRtSvWm2NjLhYcZaE
```

- `t` is unix seconds, captured fresh on every delivery attempt.
- `v1` is `HMAC-SHA256("{t}.{rawBody}", webhookSecret)`, lowercase hex.
- Future algorithm rotation will ship `v1=...,v2=...` simultaneously; the SDK
  verifies any version it recognizes and ignores the rest, so merchants pinning
  `v1` won't break.
- The SDK rejects signatures where `|now − t| > 300` seconds by default
  (5-minute clock-skew tolerance, matches Stripe's SDK default).

One-liner against a Fetch `Request`:

```ts
import { constructEventFromRequest } from "@vatly/sdk/webhooks";

export default async function handler(request: Request) {
  const event = await constructEventFromRequest(request, process.env.VATLY_WEBHOOK_SECRET!);
  // event is a typed WebhookEvent — switch on event.eventName
}
```

Manual steps when you need more control (tighter clock-skew tolerance,
body-stream already consumed, etc.):

```ts
import {
  constructEvent,
  verifyWebhookSignature,
  VATLY_SIGNATURE_HEADER,
  VATLY_EVENT_ID_HEADER,
} from "@vatly/sdk/webhooks";

const rawBody = await request.text();
const signature = request.headers.get(VATLY_SIGNATURE_HEADER);

const event = await constructEvent(rawBody, signature, secret, {
  toleranceSeconds: 60, // tighter than the 300s default
});

// Dedup using the per-event id (stable across retries):
const eventId = request.headers.get(VATLY_EVENT_ID_HEADER); // === event.id
```

⚠ **Verify against the raw bytes**, never a re-serialized JSON object — JSON
round-trips change the bytes (whitespace, key order, number formatting) and
break the HMAC.

### Dedup is your job

The SDK is stateless — it cannot remember which events it has verified. The
`toleranceSeconds` check above is purely a clock-skew bound on `t`; it
rejects a leaked signature once it ages out, but does not stop replays
inside the window.

To get full replay defense, keep your own store keyed on `Vatly-Event-Id`
(stable across delivery retries) and skip events you've already processed:

```ts
const eventId = request.headers.get(VATLY_EVENT_ID_HEADER);
if (await store.has(eventId)) return new Response("ok"); // already handled
const event = await constructEventFromRequest(request, secret);
await store.add(eventId);
// ...process event...
```

### Header lifetimes

| Header | Scope | Use it for |
|---|---|---|
| `Vatly-Signature` | Per delivery attempt — rotates on every retry | Integrity + freshness |
| `Vatly-Event-Id`  | Per event — stable across retries              | Idempotency / dedup |

If a delivery arrives twice (Vatly's retry, your slow ACK, etc.), the
`Vatly-Signature` will be different on each attempt but `Vatly-Event-Id`
stays the same. Verify the signature, then dedupe on the event id.

### Rotating webhook secrets

All four verification helpers accept either a single secret or an array.
During a rotation, pass both and the SDK will accept whichever was used to
sign the delivery:

```ts
const event = await constructEventFromRequest(request, [
  process.env.VATLY_WEBHOOK_SECRET_OLD!,
  process.env.VATLY_WEBHOOK_SECRET_NEW!,
]);
```

Drop the old secret from the array once you're confident nothing in-flight
is still signed with it.

### Disabling the clock-skew check

Pass `toleranceSeconds: 0` to skip the freshness check. Only useful for
replaying historical deliveries from a log; not recommended in production.

## Email & Punycode

The Vatly API expects ASCII-encoded (Punycode, RFC 3492) domains on input and
returns ASCII on output. Local-part Unicode (EAI / SMTPUTF8) is not supported.

```ts
import { encodeEmail, decodeEmail } from "@vatly/sdk";

encodeEmail("user@bücher.de"); // → "user@xn--bcher-kva.de"
decodeEmail("user@xn--bcher-kva.de"); // → "user@bücher.de" (where supported)
```

Implementation: the SDK uses the WHATWG `URL` parser, which is available on
every supported runtime. The decode path degrades to returning the Punycode
form on runtimes that don't expose `URL.toUnicode`.

## Known spec ambiguities

- `updateSubscription` accepts a body containing `trialUntil` alone (the
  `extendTrial` example), but the 422 description still lists "Neither
  subscriptionPlanId nor quantity provided" as a possible error. The SDK
  passes the body through unchanged and lets the server validate. **Flagged
  for clarification.**

## Type generation

The schema in `src/generated/schema.ts` is committed. To regenerate from the
canonical spec on GitHub:

```bash
pnpm gen
```

The script down-converts `openapi: 3.2.0` → `3.1.0` because the current
`openapi-typescript` + `@redocly/openapi-core` toolchain doesn't yet support
3.2.0 (it throws `Unsupported OpenAPI version: 3.2.0`). The spec uses no
3.2-only constructs, so the version stamp is the only patch. If a future spec
revision adds 3.2-isms (e.g. `pathItems`, `prefixItems`,
`unevaluatedProperties`), the script will need a real down-converter.

Build does **not** require network access — generation is a separate step.

## Development

```bash
pnpm install
pnpm gen        # fetch + regenerate types
pnpm typecheck
pnpm test
pnpm build      # → dist/ (ESM + CJS + .d.ts)
```

## License

MIT
