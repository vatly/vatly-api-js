# Orders

Orders record checkout purchases and subscription renewals, including pending payments. They carry invoice links and tax breakdowns, and let you create refunds and inspect chargebacks.

For all fields and options, see the [Orders API reference](https://docs.vatly.com/api-reference/orders). The [OpenAPI spec](https://docs.vatly.com/openapi.yaml) is also available for tooling.

## The Order resource

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique identifier (`order_…`). |
| `customerId` | `string \| null` | The customer this order belongs to. |
| `status` | `string` | `created`, `pending`, `paid`, `canceled`, or `expired`. Payment recovery is signaled by `order.payment_failed`, not a status of that name. |
| `total` | `Money` | Gross amount (incl. tax). |
| `subtotal` | `Money` | Net amount (excl. tax). |
| `reversedSubtotal` | `Money` | Net amount already reversed via refunds/chargebacks. |
| `refundableSubtotal` | `Money` | Net amount still refundable. |
| `taxSummary` | `array` | Per-rate VAT breakdown. |
| `lines` | `OrderLine[]` | Line items, incl. `productType` / `productId` and `relatedResources`. |
| `discounts` | `Discount[]` | Every discount on the order, totalled over its lines. Empty when none. |
| `invoiceNumber` | `string \| null` | Assigned once the invoice is issued. |
| `paymentMethod` | `string \| null` | Payment method used. |
| `metadata` | `object \| null` | Custom metadata carried from the checkout. |
| `testmode` | `boolean` | Whether this is a test order. |

### Subscription on an order line

`lines[].relatedResources.subscriptionId` names the subscription a signup, renewal or
immediate-update line belongs to. `productType` / `productId` keep their meaning: a
signup line references the plan (`subscription_plan`), a renewal or update line the
subscription (`subscription`).

- `relatedResources` is `null` on historical lines and on unrelated lines (one-off
  products, billing verification, authorization minimums). Older payloads may omit it.
- `subscriptionId` is `null` on a signup line while its subscription is not yet
  available. A later `orders.get` returns the ID once it is.
- An ID is not proof of activation or entitlement. Retrieve the subscription and check
  its status before granting access.

```ts
// For a paid checkout, use checkout.orderId.
const order = await vatly.orders.get("order_abc123");
for (const line of order.lines) {
  const subscriptionId = line.relatedResources?.subscriptionId; // string | null | undefined
  if (subscriptionId) {
    const subscription = await vatly.subscriptions.get(subscriptionId);
  }
}
```

### Discounts

`order.discounts` lists each discount once, with the amount it takes off all
lines together. `lines[].discounts` holds each line's share, matched to the
order's entry by `id`. Both are empty arrays when there is no discount, also in
`order.*` webhooks.

- `amount` always excludes VAT, like `subtotal`, also when the products' prices
  include VAT: €10.00 off a €121.00 price at 21% reads `8.26`.
- A line's `subtotal`, `taxes` and `total` are already net of its discounts;
  `basePrice` is the unit price before discounts.
- `discountType` is `percentage` or `fixed_amount`, but more values may be
  added. The `DiscountType` type accepts any string, so handle an unknown value.
- `percentage` is a decimal string such as `"20.00"`, `null` for a
  `fixed_amount` discount.
- `id` names this application on this order, not a reusable coupon. `id` and
  `discountType` are `null` only on discounts applied before they were recorded.

```ts
for (const discount of order.discounts) {
  switch (discount.discountType) {
    case "percentage":
      console.log(`${discount.percentage}% off: ${discount.amount.value}`);
      break;
    case "fixed_amount":
      console.log(`${discount.amount.value} off`);
      break;
    default:
      console.log(`Discount of ${discount.amount.value}`);
  }
}
```

## Retrieve an order

`GET /v1/orders/{orderId}`

```ts
const order = await vatly.orders.get("order_abc123");
console.log(order.total.value, order.total.currency);
```

## List orders

`GET /v1/orders`

```ts
const page = await vatly.orders.list({ limit: 25 });

for await (const order of vatly.orders.listAll()) {
  // ...
}
```

## Invoice update link (hosted)

`POST /v1/orders/{orderId}/invoice-update-link`

Returns a hosted link where the customer can correct their invoice details
(billing address, VAT number, company name).

```ts
const link = await vatly.orders.createInvoiceUpdateLink("order_abc123");
redirect(link.href);
```

## Refunds on an order

Refunds are created against the order they belong to.

```ts
// Partial refund of specific items:
const refund = await vatly.orders.createRefund("order_abc123", {
  items: [
    { itemId: "order_item_abc123", amount: { value: "15.00", currency: "EUR" } },
  ],
});

// Full refund of the entire order:
const full = await vatly.orders.createFullRefund("order_abc123");

// List / get / cancel:
const page = await vatly.orders.listRefunds("order_abc123", { limit: 10 });
for await (const r of vatly.orders.listAllRefunds("order_abc123")) {
  // ...
}
const one = await vatly.orders.getRefund("order_abc123", "refund_abc123");
await vatly.orders.cancelRefund("order_abc123", "refund_abc123"); // only while pending
```

See [Refunds](Refunds.md) for the top-level refund endpoints.

## Chargebacks on an order

```ts
const page = await vatly.orders.listChargebacks("order_abc123");
const chargeback = await vatly.orders.getChargeback("order_abc123", "chargeback_abc123");
```

See [Chargebacks](Chargebacks.md) for the top-level chargeback endpoints.
