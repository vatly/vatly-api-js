import { describe, expect, it } from "vitest";
import { VatlyClient } from "../client.js";
import { makeFetchSequence } from "../test-utils.js";

function makeClient(responses: Parameters<typeof makeFetchSequence>[0]) {
  const { fetch, calls } = makeFetchSequence(responses);
  const client = new VatlyClient({
    apiKey: "test_abcdefghij0123456789",
    baseUrl: "https://api.example.com/v1",
    fetch,
  });
  return { client, calls };
}

describe("subscriptions.resume", () => {
  it("POSTs to /subscriptions/{id}/resume and returns the subscription", async () => {
    const { client, calls } = makeClient([
      { status: 200, body: { id: "subscription_1", resource: "subscription", status: "active" } },
    ]);

    const sub = await client.subscriptions.resume("subscription_1");

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/subscriptions/subscription_1/resume");
    expect(sub.id).toBe("subscription_1");
  });

  it("url-encodes the subscription id", async () => {
    const { client, calls } = makeClient([{ status: 200, body: { id: "a b" } }]);

    await client.subscriptions.resume("a b");

    expect(calls[0]!.url).toContain("/subscriptions/a%20b/resume");
  });
});

describe("deprecated aliases", () => {
  it("subscriptions.updateBilling delegates to createBillingUpdateLink", async () => {
    const { client, calls } = makeClient([{ status: 200, body: { id: "subscription_1" } }]);

    await client.subscriptions.updateBilling("subscription_1", {
      redirectUrlSuccess: "https://app.example.com/success",
      redirectUrlCanceled: "https://app.example.com/canceled",
    });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/subscriptions/subscription_1/billing-update-link");
  });

  it("orders.requestAddressUpdateLink delegates to createInvoiceUpdateLink", async () => {
    const { client, calls } = makeClient([{ status: 200, body: { url: "https://hosted/link" } }]);

    await client.orders.requestAddressUpdateLink("order_1");

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/orders/order_1/invoice-update-link");
  });
});
