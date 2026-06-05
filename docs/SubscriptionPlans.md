# Subscription Plans

Subscription plans define the recurring products customers can subscribe to — price, currency, and billing interval. Plans are created in the Vatly Dashboard; the API exposes them read-only.

> **Authoritative field reference.** This page covers the common cases. The complete, canonical schema lives in the [OpenAPI spec](https://docs.vatly.com/openapi.yaml) (see the `SubscriptionPlan` schema). When in doubt, trust the spec.

## The Subscription Plan resource

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique identifier (`subscription_plan_…`). |
| `resource` | `string` | Always `subscription_plan`. |
| `name` | `string` | Display name. |
| `description` | `string \| null` | Optional description. |
| `basePrice` | `Money` | Price per interval, e.g. `{ value: "29.00", currency: "EUR" }`. |
| `interval` / `intervalCount` | `string` / `number` | Billing cadence (e.g. `month` × 1). |
| `status` | `string` | e.g. `active` or `archived`. |
| `createdAt` | `string` | Creation timestamp (ISO 8601). |
| `testmode` | `boolean` | Whether this is a test plan. |

## Retrieve a subscription plan

`GET /v1/subscription-plans/{subscriptionPlanId}`

```ts
const plan = await vatly.subscriptionPlans.get("subscription_plan_abc123");
console.log(plan.basePrice.value, plan.basePrice.currency);
```

## List subscription plans

`GET /v1/subscription-plans`

```ts
const page = await vatly.subscriptionPlans.list({ limit: 25 });

for await (const plan of vatly.subscriptionPlans.listAll()) {
  // ...
}
```

To sell a plan, pass its `id` in a [checkout](/docs/Checkouts.md)'s `products`.
