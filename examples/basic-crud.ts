/**
 * Basic CRUD against the Vatly API.
 *
 * Run it:
 *   VATLY_API_KEY=test_xxxxxxxxxxxxxxxxxx npx tsx examples/basic-crud.ts
 *
 * Uses a `test_`-prefixed key so nothing real is charged.
 */

import { VatlyClient, VatlyValidationError } from "@getvatly/sdk";

const vatly = new VatlyClient({
  apiKey: process.env.VATLY_API_KEY, // must start with live_ or test_
});

async function main() {
  // 1. Create a customer.
  const customer = await vatly.customers.create({ email: "ada@example.com" });
  console.log("created customer:", customer.id);

  // 2. Start a hosted checkout for a plan. Send the customer to checkoutUrl.
  const checkout = await vatly.checkouts.create({
    redirectUrlSuccess: "https://example.com/success",
    redirectUrlCanceled: "https://example.com/cancel",
    products: [{ id: "subscription_plan_Wt5mNvBxKw7YcZaEjLhR", quantity: 1 }],
  });
  console.log("checkout url:", checkout.links.checkoutUrl.href);

  // 3. Fetch a single order (Money values are decimal strings — never coerce to number).
  // const order = await vatly.orders.get("order_Hn5xWqVfKm8RjTgYbUcP");
  // console.log(order.total.value, order.total.currency);

  // 4. Paginate every customer — `listAll` walks pages transparently.
  let count = 0;
  for await (const _c of vatly.customers.listAll({ limit: 100 })) count++;
  console.log("total customers:", count);
}

main().catch((err) => {
  if (err instanceof VatlyValidationError) {
    console.error("validation failed:", err.errors);
    process.exit(1);
  }
  throw err;
});
