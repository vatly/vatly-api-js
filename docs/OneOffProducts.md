# One-Off Products

One-off products are single-purchase items (no recurring billing). Like subscription plans, they're defined in the Vatly Dashboard and exposed read-only through the API.

> **Authoritative field reference.** This page covers the common cases. The complete, canonical schema lives in the [OpenAPI spec](https://docs.vatly.com/openapi.yaml) (see the `OneOffProduct` schema). When in doubt, trust the spec.

## The One-Off Product resource

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique identifier (`one_off_product_…`). |
| `resource` | `string` | Always `one_off_product`. |
| `name` | `string` | Display name. |
| `description` | `string \| null` | Optional description. |
| `basePrice` | `Money` | Price, e.g. `{ value: "49.00", currency: "EUR" }`. |
| `status` | `string` | e.g. `active` or `archived`. |
| `createdAt` | `string` | Creation timestamp (ISO 8601). |
| `testmode` | `boolean` | Whether this is a test product. |

## Retrieve a one-off product

`GET /v1/one-off-products/{oneOffProductId}`

```ts
const product = await vatly.oneOffProducts.get("one_off_product_abc123");
```

## List one-off products

`GET /v1/one-off-products`

```ts
const page = await vatly.oneOffProducts.list({ limit: 25 });

for await (const product of vatly.oneOffProducts.listAll()) {
  // ...
}
```

To sell a one-off product, pass its `id` in a [checkout](/docs/Checkouts.md)'s `products`.
