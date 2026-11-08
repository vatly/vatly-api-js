/**
 * Explicit provisioning and teardown helpers for a server-side deployment script.
 * These functions mutate your Vatly account; call only for an endpoint you own.
 * The URL must be publicly reachable over HTTPS and handle signed webhook.setup.
 */
import { VatlyClient } from "@getvatly/sdk";

const vatly = new VatlyClient({ apiKey: process.env.VATLY_API_KEY });

export async function provisionEndpoint(url: string, secret: string): Promise<string> {
  const endpoint = await vatly.webhookEndpoints.create({
    url,
    secret,
    enabledEvents: ["order.paid", "refund.completed", "subscription.updated"],
  });
  // Persist the endpoint ID in deployment state. Store its secret in a secret
  // manager, not logs. Endpoint registration verifies the signed setup handshake.
  return endpoint.id;
}

export async function disableEndpoint(endpointId: string): Promise<void> {
  await vatly.webhookEndpoints.update(endpointId, { enabledEvents: [] });
}

export async function removeEndpoint(endpointId: string): Promise<void> {
  await vatly.webhookEndpoints.delete(endpointId);
}
