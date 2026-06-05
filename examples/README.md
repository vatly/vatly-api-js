# Examples

Runnable snippets for `@vatly/sdk`. They import the package by name
(`@vatly/sdk`), so from a project that has the SDK installed you can copy them
in directly.

| File | What it shows |
|------|---------------|
| [`basic-crud.ts`](basic-crud.ts) | Create a customer, start a hosted checkout, fetch an order, paginate a collection, and handle `VatlyValidationError`. |
| [`nextjs-webhook-route.ts`](nextjs-webhook-route.ts) | A Next.js App Router webhook handler that verifies the signature and processes a typed, discriminated event (incl. the `webhook.setup` handshake). |

## Running `basic-crud.ts`

From a project with `@vatly/sdk` installed:

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

See the [main README](../README.md#webhook-verification) for the full webhook
reference (clock-skew tolerance, secret rotation, dedup).
