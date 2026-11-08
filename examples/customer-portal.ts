/**
 * Call this from a server route AFTER authenticating the user and loading their
 * bound Vatly customer ID from your database. Never trust a customer ID supplied
 * by the browser, and never select the first customer in the merchant account.
 */
import { VatlyClient } from "@getvatly/sdk";

const vatly = new VatlyClient({ apiKey: process.env.VATLY_API_KEY });

export async function redirectToCustomerPortal(
  authorizedCustomerId: string,
  returnUrl: string,
): Promise<Response> {
  const session = await vatly.customers.createPortalSession(authorizedCustomerId, { returnUrl });
  // This is a short-lived bearer credential. Mint on demand; do not log or store it.
  return new Response(null, {
    status: 303,
    headers: { Location: session.url, "Cache-Control": "no-store" },
  });
}
