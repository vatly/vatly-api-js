# Webhooks

Vatly sends webhooks to notify your application when events happen — an order being paid, a refund completing, a subscription being canceled. Every delivery is HMAC-signed; the SDK verifies the signature and hands you a typed event.

> **Authoritative field reference.** The canonical webhook envelope and per-event `object` schemas live in the [OpenAPI spec](https://docs.vatly.com/openapi.yaml) (see `WebhookDelivery`, `WebhookEvent`, and the resource schemas). When in doubt, trust the spec.

## Webhook events

The `eventName` field identifies what happened. Names are available as constants
on [`WebhookEventName`](../src/webhooks/events.ts).

| Event | `object` type | Description |
|-------|---------------|-------------|
| `order.paid` | Order | Order payment was successful. |
| `order.canceled` | Order | Order was canceled. |
| `order.payment_failed` | Order | A payment failed and dunning started. |
| `order.chargeback_received` | Chargeback | A chargeback was received for an order. |
| `order.chargeback_reversed` | Chargeback | A chargeback was reversed. |
| `refund.completed` | Refund | Refund was processed successfully. |
| `refund.failed` | Refund | Refund processing failed. |
| `refund.canceled` | Refund | Refund was canceled. |
| `subscription.started` | Subscription | Subscription was started. |
| `subscription.billing_updated` | Subscription | Billing details (e.g. the mandate) changed. |
| `subscription.canceled_immediately` | Subscription | Canceled immediately. |
| `subscription.canceled_with_grace_period` | Subscription | Canceled; access until period end. |
| `subscription.cancellation_grace_period_completed` | Subscription | Grace period ended. |
| `subscription.resumed` | Subscription | A canceled subscription was resumed. |
| `checkout.paid` | Checkout | Checkout was paid. |
| `checkout.failed` | Checkout | Checkout payment failed. |
| `checkout.canceled` | Checkout | Checkout was canceled. |
| `checkout.expired` | Checkout | Checkout session expired. |
| `webhook.setup` | Webhook | Verification call sent when an endpoint is registered or its URL changes. |

## Verify and process in one step

`constructWebhookEventFromRequest` reads the raw body and `Vatly-Signature`
header off a Fetch `Request`, verifies the HMAC, and returns a **discriminated**
event. Switching on `event.eventName` narrows `event.object` to the exact
resource — no casts, no follow-up API call (Vatly sends fat, signed payloads, so
`object` is the full `GET /…/{id}` snapshot).

```ts
import { constructWebhookEventFromRequest } from "@vatly/sdk/webhooks";

export async function POST(request: Request): Promise<Response> {
  let event;
  try {
    event = await constructWebhookEventFromRequest(request, process.env.VATLY_WEBHOOK_SECRET!);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  switch (event.eventName) {
    case "order.paid":
      event.object.total; // Money — typed as Order
      break;
    case "subscription.billing_updated":
      event.object.mandate; // typed as Subscription
      break;
    case "webhook.setup":
      return new Response("ok"); // verification handshake — just acknowledge
  }
  return new Response("ok");
}
```

If you already have the raw bytes (e.g. a non-Fetch framework), use
`constructWebhookEvent(rawBody, signatureHeader, secret)`. To verify only and
get the raw `WebhookDelivery` envelope, use `constructEvent` /
`constructEventFromRequest`, then narrow later with `toWebhookEvent(delivery)`.

> **Always verify against the raw body bytes.** Re-serializing the JSON changes
> the bytes (whitespace, key order, number formatting) and breaks the HMAC.

## The `webhook.setup` event

When you register a webhook endpoint (or change its URL), Vatly sends a signed
`webhook.setup` call to confirm the endpoint is reachable. It's delivered as a
normal webhook — same envelope, same signature, same `Vatly-Event-Id` header —
so there's nothing special to parse: verify it and return a `2xx`. Its `object`
is the (secret-free) [`Webhook`](https://docs.vatly.com/openapi.yaml) endpoint
config and `links` is omitted (it's not a persisted event).

## Signature scheme

```
Vatly-Signature: t=1700000000,v1=<hex_hmac_sha256>
Vatly-Event-Id:  webhook_event_Qk8pRtSvWm2NjLhYcZaE
```

- `t` is unix seconds, captured fresh on each delivery attempt.
- `v1` is `HMAC-SHA256("{t}.{rawBody}", webhookSecret)`, lowercase hex.
- The SDK rejects signatures where `|now − t| > 300` seconds by default
  (5-minute clock-skew tolerance). Tune it with `{ toleranceSeconds }`.
- Future algorithm rotation ships `v1=…,v2=…` simultaneously; the SDK verifies
  any version it recognizes and ignores the rest.

## Deduplication is your job

The SDK is stateless — it can't remember which events it has verified. The
clock-skew check bounds how long a leaked signature is replayable, but does not
stop replays inside that window. For full replay defense, dedupe on the
retry-stable `Vatly-Event-Id` (also surfaced as `event.id`) in your own store:

```ts
const eventId = request.headers.get("Vatly-Event-Id");
if (await store.has(eventId)) return new Response("ok"); // already processed
```

## Rotating secrets

Every verification helper accepts a single secret or an array. During a
rotation, pass both — the SDK accepts whichever signed the delivery:

```ts
const event = await constructWebhookEventFromRequest(request, [
  process.env.VATLY_WEBHOOK_SECRET_OLD!,
  process.env.VATLY_WEBHOOK_SECRET_NEW!,
]);
```

## Fetching a persisted event

Persisted events are available via the API. Note these are returned as the
`WebhookEvent` shape (`GET /webhook-events/{id}`), which — unlike an inbound
delivery — never includes the `webhook.setup` call and always carries `links`:

```ts
const event = await vatly.webhookEvents.get("webhook_event_abc123");
```
