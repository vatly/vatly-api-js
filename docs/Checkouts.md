# Checkouts

Checkouts create hosted payment pages for your customers. When a checkout completes successfully, an Order is created.

For all fields and options, see the [Checkouts API reference](https://docs.vatly.com/api-reference/checkouts). The [OpenAPI spec](https://docs.vatly.com/openapi.yaml) is also available for tooling.

## The Checkout resource

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique identifier for the checkout (`checkout_…`). |
| `resource` | `string` | Always `checkout`. |
| `status` | `string` | `created`, `paid`, `canceled`, `failed`, or `expired`. |
| `customerId` | `string \| null` | The customer this checkout is for, if known. |
| `orderId` | `string \| null` | Order ID, available after successful payment. |
| `redirectUrlSuccess` | `string` | Where the customer returns on success. |
| `redirectUrlCanceled` | `string` | Where the customer returns on cancel. |
| `metadata` | `object \| null` | Your custom key/value metadata. |
| `expiresAt` | `string \| null` | Expiration timestamp (ISO 8601). |
| `createdAt` | `string` | Creation timestamp (ISO 8601). |
| `testmode` | `boolean` | Whether this is a test checkout. |
| `links.checkoutUrl` | `Link` | The hosted page to send the customer to. |

## Create a checkout

`POST /v1/checkouts`

### Required attributes

| Name | Type | Description |
| --- | --- | --- |
| `products` | `array` | Product items to sell. Each item is `{ id, quantity }`, where `id` is a `subscription_plan_…` or `one_off_product_…` id. An item may also set `price`, `trialDays` and `metadata`. |
| `redirectUrlSuccess` | `string` | Success redirect URL. |
| `redirectUrlCanceled` | `string` | Cancel redirect URL. |

### Optional attributes

| Name | Type | Description |
| --- | --- | --- |
| `customerId` | `string` | Attach the checkout to an existing customer. |
| `metadata` | `object` | Custom metadata echoed back on the checkout and resulting order. |
| `locale` | `string` | Language of the hosted checkout: `en`, `de`, `fr`, `nl`, `es`, `it`, `pt`, `pl`, `cs`, `ca`, `da`, `el`, `fi`, `hu`, `is`, `lt`, `lv`, `nb`, `sk`, `sl`, `sv` or `tr`. Omit it to detect the shopper's language. |
| `discounts` | `CheckoutDiscount[]` | A discount on the whole checkout, see [Discounts](#discounts). At most one entry for now. |

`products[].trialDays` gives a subscription plan a trial of that many days. It
must be at least `1`, and the API returns `422` when it is set on a one-off
product. Omit it or pass `null` for no trial; the SDK rejects `0` or less with a
`RangeError` before sending the request.

Optional fields the API marks nullable, such as `metadata`, `products[].price`
and `products[].trialDays`, also accept `null`, which means the same as
omitting them. `metadata` is an object of string values: at most 50 keys, keys
up to 40 characters, values up to 500 characters. Anything else returns `422`.

```ts
const checkout = await vatly.checkouts.create({
  redirectUrlSuccess: "https://yourapp.com/success",
  redirectUrlCanceled: "https://yourapp.com/canceled",
  products: [{ id: "subscription_plan_abc123", quantity: 1 }],
  customerId: "customer_abc123",
  metadata: { signupId: "su_42" },
});

// Send the customer here:
redirect(checkout.links.checkoutUrl.href);
```

## Discounts

`discounts` takes one entry for now: `{ percentage }` or `{ amount }`, with an
optional `description` shown on the checkout and the invoice. The
`CheckoutDiscount` type allows one of `percentage` and `amount`, not both.

- `percentage` is above 0 and below 100, with at most three decimals.
- `amount` is in EUR, on the same basis as the products' prices: including VAT
  on tax-inclusive products, excluding it on tax-exclusive ones. It must be
  below the subtotal it discounts. A customer paying in another currency gets it
  converted at checkout.

The discount is spread over the lines in proportion to their subtotals and
reduces each product's first payment only; renewals are charged the full price.
For a subscription on trial, it applies to the first paid charge after the
trial. A checkout with tax-inclusive prices and a subscription on trial cannot
take a discount yet and returns `422`. Validation errors are keyed
`discounts.0.*`, such as `discounts.0.percentage`.

```ts
const checkout = await vatly.checkouts.create({
  redirectUrlSuccess: "https://yourapp.com/success",
  redirectUrlCanceled: "https://yourapp.com/canceled",
  products: [{ id: "subscription_plan_abc123", quantity: 1 }],
  discounts: [{ percentage: 20, description: "Black Friday" }],
  // or: discounts: [{ amount: { value: "10.00", currency: "EUR" } }],
});
```

The resulting order and its lines list the discount under `discounts`; see
[Orders](./Orders.md#discounts).

## Retrieve a checkout

`GET /v1/checkouts/{checkoutId}`

```ts
const checkout = await vatly.checkouts.get("checkout_abc123");
```

## List checkouts

`GET /v1/checkouts`

```ts
const page = await vatly.checkouts.list({ limit: 25 });

for await (const checkout of vatly.checkouts.listAll()) {
  // ...
}
```
