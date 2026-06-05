/**
 * Vatly webhook handler for Next.js (App Router).
 *
 * Drop this at: app/api/webhooks/vatly/route.ts
 *
 * `constructWebhookEventFromRequest` reads the raw body + `Vatly-Signature`
 * header, verifies the HMAC, and returns a discriminated event: switching on
 * `event.eventName` narrows `event.object` to the exact resource — no casts.
 *
 * Set VATLY_WEBHOOK_SECRET in your environment. Configure the endpoint URL in
 * the Vatly dashboard; Vatly sends a one-time `webhook.setup` verification call
 * when you save it.
 */

import { constructWebhookEventFromRequest } from "@vatly/sdk/webhooks";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.VATLY_WEBHOOK_SECRET;
  if (!secret) return new Response("server misconfigured", { status: 500 });

  let event: Awaited<ReturnType<typeof constructWebhookEventFromRequest>>;
  try {
    event = await constructWebhookEventFromRequest(request, secret);
  } catch {
    // Bad/missing signature, stale timestamp, or non-JSON body.
    return new Response("invalid signature", { status: 400 });
  }

  // Optional but recommended: dedupe on the retry-stable event id.
  // const eventId = request.headers.get("Vatly-Event-Id");
  // if (await store.seen(eventId)) return new Response("ok");

  switch (event.eventName) {
    case "order.paid":
      // event.object is a fully-typed Order — incl. total/subtotal/taxSummary/lines.
      console.log("order paid", event.object.id, event.object.total);
      break;

    case "subscription.billing_updated":
      // event.object is a Subscription — refresh the stored payment method.
      console.log("mandate updated", event.object.mandate);
      break;

    case "refund.completed":
      console.log("refund completed", event.object.id);
      break;

    case "webhook.setup":
      // Verification handshake when the endpoint is registered / its URL changes.
      // Nothing to process — a 2xx confirms the endpoint is live.
      break;

    default:
      // Any other event — log and acknowledge so Vatly stops retrying.
      console.log("unhandled webhook", event.eventName);
  }

  return new Response("ok");
}
