import { describe, expect, it } from "vitest";
import { VatlyClient } from "../client.js";
import { makeFetchSequence } from "../test-utils.js";

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
      client.testHelpers.simulateOrderPayment("order_1", { paymentStatus: "failed" }),
    ).rejects.toThrow(/can only be called with a test-mode API key/);
  });

  it("allows test-mode calls through", async () => {
    const { fetch, calls } = makeFetchSequence([{ status: 200, body: { ok: true } }]);
    const client = new VatlyClient({
      apiKey: "test_abcdefghij0123456789",
      baseUrl: "https://api.example.com/v1",
      fetch,
    });
    await client.testHelpers.fastForwardRenewal("sub_1");
    expect(calls[0]!.url).toContain("/test-helpers/subscriptions/sub_1/fast-forward-renewal");
    expect(calls[0]!.method).toBe("POST");
    expect(JSON.parse(calls[0]!.body!)).toEqual({});
  });
});
