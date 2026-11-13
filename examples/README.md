# Examples

Runnable snippets for `@getvatly/sdk`. They import the package by name
(`@getvatly/sdk`), so from a project that has the SDK installed you can copy them
in directly.

| File | What it shows |
|------|---------------|
| [`basic-crud.ts`](basic-crud.ts) | Create a customer, start a hosted checkout, fetch an order, paginate a collection, and handle `VatlyValidationError`. |
| [`customer-portal.ts`](customer-portal.ts) | Redirect an authenticated, authorized customer to a freshly minted portal session without logging the bearer URL. |
| [`webhook-endpoints.ts`](webhook-endpoints.ts) | Explicitly provision, disable, and remove a webhook endpoint from a server-side deployment script. |
| [`nextjs-webhook-route.ts`](nextjs-webhook-route.ts) | A Next.js App Router webhook handler that verifies the signature and processes a typed, discriminated event (incl. the `webhook.setup` handshake). |

## Running `basic-crud.ts`

From a project with `@getvatly/sdk@0.3.0-alpha.4` installed:

```bash
VATLY_API_KEY=test_xxxxxxxxxxxxxxxxxx npx tsx examples/basic-crud.ts
```

Use a `test_`-prefixed key so nothing real is charged. Swap the placeholder
`subscription_plan_…` id for one from your account.

## Using `nextjs-webhook-route.ts`

Copy it to `app/api/webhooks/vatly/route.ts` in a Next.js app, set
`VATLY_WEBHOOK_SECRET`, and register the endpoint URL in the Vatly dashboard.
Vatly sends a one-time `webhook.setup` verification call when you save it — the
handler acknowledges it automatically.

The sample returns 503 for a verified event newer than the SDK catalogue. In a
production handler, retain unsupported envelopes durably for triage, then return
2xx only after that write succeeds. Fluent's transactional webhook driver and
event/outbox dispatcher provide the equivalent integration boundary.

The portal and endpoint examples export functions: copying/importing them does
not automatically create sessions or mutate endpoints. Only call the portal
helper after authenticating and authorizing the bound customer ID. Provisioning
and teardown require explicit permission to mutate the target account.

See the [main README](../README.md#webhook-verification) for the full webhook
reference (clock-skew tolerance, secret rotation, dedup).
