/**
 * Customer portal session — redirect a signed-in customer to Vatly's hosted
 * portal so they can view invoices and manage their subscription.
 *
 * Run it:
 *   VATLY_API_KEY=test_xxxxxxxxxxxxxxxxxx npx tsx examples/customer-portal.ts
 *
 * Flow:
 *  1. Find the customer by email (or create them during checkout).
 *  2. Create a portal session; `url` is a short-lived, single-use HTTPS link.
 *  3. Redirect the customer's browser to that `url` from your own handler.
 *
 * The returned URL expires after ~15 minutes and can only be opened once, so
 * mint a fresh session every time the customer clicks "manage billing" — do
 * not store it alongside the user record.
 */

import { VatlyClient } from "@vatly/sdk";

const vatly = new VatlyClient({
  apiKey: process.env.VATLY_API_KEY,
});

async function main() {
  // 1. Look up the customer (replace with your own lookup — email, metadata, …).
  const { data } = await vatly.customers.list({ limit: 1 });
  const customer = data[0];
  if (!customer) throw new Error("No customer to send to the portal");

  // 2. Mint a single-use portal link, with a return URL back to your app.
  const session = await vatly.customers.createPortalSession(customer.id, {
    returnUrl: "https://merchant.example/account/billing",
  });

  console.log("open this URL in the customer's browser:", session.url);
  console.log("expires at:", session.expiresAt);

  // 3. In an HTTP handler you'd issue a 302 instead:
  //      return Response.redirect(session.url, 302);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
