import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

const page = (path: string, data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: `https://api.example.com/v1${path}` },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("orders", () => {
  it("list GETs /orders with params", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: page("/orders", [{ id: "order_1" }]) },
    ]);

    const res = await client.orders.list({ limit: 25 });

    expect(calls[0]!.url).toContain("/orders");
    expect(calls[0]!.url).toContain("limit=25");
    expect(res.data[0]!.id).toBe("order_1");
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "order_1" } }]);

    await client.orders.get("order 1");

    expect(calls[0]!.url).toContain("/orders/order%201");
  });

  it("createInvoiceUpdateLink POSTs to the link endpoint", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { url: "https://hosted.vatly.com/abc" } },
    ]);

    await client.orders.createInvoiceUpdateLink("order_1");

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/orders/order_1/invoice-update-link");
  });

  describe("nested refunds", () => {
    it("listRefunds GETs the nested collection", async () => {
      const { client, calls } = makeTestClient([
        { status: 200, body: page("/orders/order_1/refunds", [{ id: "refund_1" }]) },
      ]);

      await client.orders.listRefunds("order_1", { limit: 5 });

      expect(calls[0]!.url).toContain("/orders/order_1/refunds");
      expect(calls[0]!.url).toContain("limit=5");
    });

    it("createRefund POSTs the items body", async () => {
      const { client, calls } = makeTestClient([{ status: 201, body: { id: "refund_1" } }]);
      const body = {
        items: [{ itemId: "order_item_1", amount: { value: "15.00", currency: "EUR" as const } }],
      };

      const refund = await client.orders.createRefund("order_1", body);

      expect(calls[0]!.method).toBe("POST");
      expect(calls[0]!.url).toContain("/orders/order_1/refunds");
      expect(JSON.parse(calls[0]!.body!)).toMatchObject(body);
      expect(refund.id).toBe("refund_1");
    });

    it("createFullRefund POSTs to /refunds/full (empty body by default)", async () => {
      const { client, calls } = makeTestClient([{ status: 201, body: { id: "refund_1" } }]);

      await client.orders.createFullRefund("order_1");

      expect(calls[0]!.method).toBe("POST");
      expect(calls[0]!.url).toContain("/orders/order_1/refunds/full");
    });

    it("getRefund GETs a single nested refund", async () => {
      const { client, calls } = makeTestClient([{ status: 200, body: { id: "refund_1" } }]);

      await client.orders.getRefund("order_1", "refund_1");

      expect(calls[0]!.url).toContain("/orders/order_1/refunds/refund_1");
    });

    it("cancelRefund DELETEs and auto-attaches an Idempotency-Key (retry-safe)", async () => {
      const { client, calls } = makeTestClient([{ status: 204 }]);

      const result = await client.orders.cancelRefund("order_1", "refund_1");

      expect(calls[0]!.method).toBe("DELETE");
      expect(calls[0]!.url).toContain("/orders/order_1/refunds/refund_1");
      expect(calls[0]!.headers["idempotency-key"]).toBeTruthy();
      expect(result).toBeUndefined();
    });
  });

  describe("nested chargebacks", () => {
    it("listChargebacks GETs the nested collection", async () => {
      const { client, calls } = makeTestClient([
        { status: 200, body: page("/orders/order_1/chargebacks", [{ id: "chargeback_1" }]) },
      ]);

      await client.orders.listChargebacks("order_1");

      expect(calls[0]!.url).toContain("/orders/order_1/chargebacks");
    });

    it("getChargeback GETs a single nested chargeback", async () => {
      const { client, calls } = makeTestClient([{ status: 200, body: { id: "chargeback_1" } }]);

      await client.orders.getChargeback("order_1", "chargeback_1");

      expect(calls[0]!.url).toContain("/orders/order_1/chargebacks/chargeback_1");
    });
  });
});
