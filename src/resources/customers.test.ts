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

describe("customers", () => {
  it("list GETs /customers with params", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: page("/customers", [{ id: "customer_1" }]) },
    ]);

    const res = await client.customers.list({ limit: 10 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/customers");
    expect(calls[0]!.url).toContain("limit=10");
    expect(res.data[0]!.id).toBe("customer_1");
  });

  it("create POSTs the body to /customers", async () => {
    const { client, calls } = makeTestClient([
      { status: 201, body: { id: "customer_1", resource: "customer" } },
    ]);

    await client.customers.create({ email: "jane@example.com" });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/customers");
    expect(JSON.parse(calls[0]!.body!)).toMatchObject({ email: "jane@example.com" });
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "customer_1" } }]);

    await client.customers.get("customer 1");

    expect(calls[0]!.url).toContain("/customers/customer%201");
  });

  it("listSubscriptions GETs the nested collection", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page("/customers/customer_1/subscriptions", [{ id: "subscription_1" }]),
      },
    ]);

    const res = await client.customers.listSubscriptions("customer_1", { limit: 5 });

    expect(calls[0]!.url).toContain("/customers/customer_1/subscriptions");
    expect(calls[0]!.url).toContain("limit=5");
    expect(res.data[0]!.id).toBe("subscription_1");
  });

  it("getSubscription GETs a single nested subscription", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "subscription_1" } }]);

    await client.customers.getSubscription("customer_1", "subscription_1");

    expect(calls[0]!.url).toContain("/customers/customer_1/subscriptions/subscription_1");
  });

  it("update PATCHes /customers/{id} with the body", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { id: "customer_1", email: "new@example.com" } },
    ]);

    await client.customers.update("customer_1", { email: "new@example.com" });

    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toContain("/customers/customer_1");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ email: "new@example.com" });
  });

  it("createPortalSession POSTs the body to /customers/{id}/portal-sessions", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 201,
        body: {
          url: "https://billing.vatly.com/authenticate?credential=abc",
          expiresAt: "2026-10-19T12:15:00Z",
          returnUrl: "https://merchant.example/billing",
        },
      },
    ]);

    const session = await client.customers.createPortalSession("customer_1", {
      returnUrl: "https://merchant.example/billing",
    });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/customers/customer_1/portal-sessions");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ returnUrl: "https://merchant.example/billing" });
    expect(session.url).toBe("https://billing.vatly.com/authenticate?credential=abc");
  });

  it("createPortalSession allows an empty body", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 201,
        body: {
          url: "https://billing.vatly.com/authenticate?credential=xyz",
          expiresAt: "2026-10-19T12:15:00Z",
          returnUrl: null,
        },
      },
    ]);

    await client.customers.createPortalSession("customer_1");

    expect(calls[0]!.method).toBe("POST");
    expect(JSON.parse(calls[0]!.body!)).toEqual({});
  });

  it("listAllSubscriptions paginates the nested collection", async () => {
    const base = "/customers/customer_1/subscriptions";
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          base,
          [{ id: "subscription_1" }],
          `https://api.example.com/v1${base}?startingAfter=subscription_1`,
        ),
      },
      { status: 200, body: page(base, [{ id: "subscription_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const s of client.customers.listAllSubscriptions("customer_1")) ids.push(s.id);

    expect(ids).toEqual(["subscription_1", "subscription_2"]);
    expect(calls[1]!.url).toContain("startingAfter=subscription_1");
  });
});
