import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

const page = (data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: "https://api.example.com/v1/webhook-endpoints" },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("webhookEndpoints", () => {
  it("list GETs /webhook-endpoints with params", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: page([{ id: "webhook_1" }]) }]);

    const res = await client.webhookEndpoints.list({ limit: 5 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/webhook-endpoints");
    expect(calls[0]!.url).toContain("limit=5");
    expect(res.data[0]!.id).toBe("webhook_1");
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "webhook_1" } }]);

    await client.webhookEndpoints.get("webhook_1");

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/webhook-endpoints/webhook_1");
  });

  it("create POSTs the body to /webhook-endpoints", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 201,
        body: {
          id: "webhook_1",
          resource: "webhook_endpoint",
          testmode: true,
          url: "https://merchant.example/webhooks/vatly",
          enabledEvents: ["order.paid"],
        },
      },
    ]);

    await client.webhookEndpoints.create({
      url: "https://merchant.example/webhooks/vatly",
      secret: "whsec_test",
      enabledEvents: ["order.paid"],
    });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/webhook-endpoints");
    expect(JSON.parse(calls[0]!.body!)).toMatchObject({
      url: "https://merchant.example/webhooks/vatly",
      secret: "whsec_test",
      enabledEvents: ["order.paid"],
    });
  });

  it("update PATCHes /webhook-endpoints/{id} with the body", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "webhook_1" } }]);

    await client.webhookEndpoints.update("webhook_1", {
      enabledEvents: ["checkout.paid", "order.paid"],
    });

    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toContain("/webhook-endpoints/webhook_1");
    expect(JSON.parse(calls[0]!.body!)).toEqual({
      enabledEvents: ["checkout.paid", "order.paid"],
    });
  });

  it("delete DELETEs /webhook-endpoints/{id}", async () => {
    const { client, calls } = makeTestClient([{ status: 204 }]);

    const result = await client.webhookEndpoints.delete("webhook_1");

    expect(calls[0]!.method).toBe("DELETE");
    expect(calls[0]!.url).toContain("/webhook-endpoints/webhook_1");
    expect(result).toBeUndefined();
  });

  it("listAll walks pages", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          [{ id: "webhook_1" }],
          "https://api.example.com/v1/webhook-endpoints?startingAfter=webhook_1",
        ),
      },
      { status: 200, body: page([{ id: "webhook_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const e of client.webhookEndpoints.listAll()) ids.push(e.id);

    expect(ids).toEqual(["webhook_1", "webhook_2"]);
    expect(calls[1]!.url).toContain("startingAfter=webhook_1");
  });
});
