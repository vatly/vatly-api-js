/**
 * Provision a webhook endpoint from code (CI, IaC, preview envs).
 *
 * Run it:
 *   VATLY_API_KEY=test_xxxxxxxxxxxxxxxxxx \
 *   VATLY_WEBHOOK_SECRET=whsec_... \
 *   npx tsx examples/webhook-endpoints.ts
 *
 * Vatly validates the URL with a one-time `webhook.setup` ping before accepting
 * the registration, so the endpoint must be publicly reachable with a valid
 * SSL certificate at the time this script runs.
 */

import { VatlyClient } from "@vatly/sdk";

const vatly = new VatlyClient({ apiKey: process.env.VATLY_API_KEY });

async function main() {
  const url = "https://merchant.example/webhooks/vatly";
  const secret = process.env.VATLY_WEBHOOK_SECRET;
  if (!secret) throw new Error("VATLY_WEBHOOK_SECRET is required");

  // Create — Vatly sends a webhook.setup ping to the URL before accepting.
  // Secret is write-only on the server: keep this value, it's what you verify
  // incoming webhook signatures with.
  const endpoint = await vatly.webhookEndpoints.create({
    url,
    secret,
    enabledEvents: ["order.paid", "refund.completed", "subscription.updated"],
  });
  console.log("registered:", endpoint.id);

  // Later: repoint the URL for a new preview environment, keeping the secret.
  await vatly.webhookEndpoints.update(endpoint.id, {
    url: "https://preview-42.merchant.example/webhooks/vatly",
  });

  // Or make it dormant without deleting it: send an empty event list.
  // await vatly.webhookEndpoints.update(endpoint.id, { enabledEvents: [] });

  // Teardown — deliveries stop immediately.
  await vatly.webhookEndpoints.delete(endpoint.id);
  console.log("deleted:", endpoint.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
