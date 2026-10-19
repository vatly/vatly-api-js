import { describe, expect, it } from "vitest";
import { VatlyClient } from "../client.js";
import { makeFetchSequence, makeTestClient } from "../test-utils.js";

describe("testHelpers", () => {
  it("rejects fastForwardRenewal against a live_ token", async () => {
    const { fetch } = makeFetchSequence([{ status: 200, body: {} }]);
    const client = new VatlyClient({
      apiKey: "live_abcdefghij0123456789",
      baseUrl: "https://api.example.com/v1",
      fetch,
    });
    await expect(client.testHelpers.fastForwardRenewal("sub_1")).rejects.toThrow(
      /can only be called with a test-mode API key/,
    );
  });

  it("rejects simulateOrderPayment against a live_ token", async () => {
    const { fetch } = makeFetchSequence([{ status: 200, body: {} }]);
    const client = new VatlyClient({
      apiKey: "live_abcdefghij0123456789",
      baseUrl: "https://api.example.com/v1",
      fetch,
    });
    await expect(
      client.testHelpers.simulateOrderPayment("order_1", { paymentStatus: "paid" }),
    ).rejects.toThrow(/can only be called with a test-mode API key/);
  });

  it("fastForwardRenewal POSTs with no body by default", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "sub_1" } }]);

    await client.testHelpers.fastForwardRenewal("sub_1");

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/test-helpers/subscriptions/sub_1/fast-forward-renewal");
    expect(calls[0]!.body).toBeUndefined();
  });

  it("fastForwardRenewal forwards a paymentStatus body", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "sub_1" } }]);

    await client.testHelpers.fastForwardRenewal("sub_1", {
      paymentStatus: "failed",
      failureReason: "card_expired",
    });

    expect(JSON.parse(calls[0]!.body!)).toEqual({
      paymentStatus: "failed",
      failureReason: "card_expired",
    });
  });

  it("simulateOrderPayment POSTs the body to /test-helpers/orders/{id}/simulate-payment", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "order_1" } }]);

    await client.testHelpers.simulateOrderPayment("order_1", { paymentStatus: "paid" });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/test-helpers/orders/order_1/simulate-payment");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ paymentStatus: "paid" });
  });
});
