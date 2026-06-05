# Customers

Customers represent the end users who purchase products through Vatly.

> **Authoritative field reference.** This page covers the common cases. The complete, canonical schema lives in the [OpenAPI spec](https://docs.vatly.com/openapi.yaml) (see the `Customer` and `CreateCustomerRequest` schemas). When in doubt, trust the spec.

## The Customer resource

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique identifier for the customer (`customer_…`). |
| `resource` | `string` | Always `customer`. |
| `email` | `string` | Customer's email address (ASCII / Punycode domain). |
| `metadata` | `object \| null` | Your custom key/value metadata. |
| `createdAt` | `string` | Creation timestamp (ISO 8601). |
| `testmode` | `boolean` | Whether this is a test customer. |

## Create a customer

`POST /v1/customers`

### Required attributes

| Name | Type | Description |
| --- | --- | --- |
| `email` | `string` | The customer's email address. |

### Optional attributes

| Name | Type | Description |
| --- | --- | --- |
| `metadata` | `object` | Custom key/value metadata. |

```ts
const customer = await vatly.customers.create({
  email: "ada@example.com",
  metadata: { plan: "pro" },
});
```

Email domains are sent as ASCII (Punycode). To convert a Unicode address
yourself, use the `encodeEmail` helper:

```ts
import { encodeEmail } from "@vatly/sdk";

encodeEmail("user@bücher.de"); // → "user@xn--bcher-kva.de"
```

## Retrieve a customer

`GET /v1/customers/{customerId}`

```ts
const customer = await vatly.customers.get("customer_abc123");
```

## List customers

`GET /v1/customers`

```ts
const page = await vatly.customers.list({ limit: 25 });

for await (const customer of vatly.customers.listAll()) {
  // ...
}
```

## A customer's subscriptions

`GET /v1/customers/{customerId}/subscriptions`

```ts
// One page:
const page = await vatly.customers.listSubscriptions("customer_abc123", { limit: 10 });

// Every subscription:
for await (const sub of vatly.customers.listAllSubscriptions("customer_abc123")) {
  // ...
}

// A single nested subscription:
const sub = await vatly.customers.getSubscription("customer_abc123", "subscription_abc123");
```
