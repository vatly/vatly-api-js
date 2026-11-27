import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";
import type { CheckoutDiscount, CreateCheckoutRequest } from "../types.js";

const page = (data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: "https://api.example.com/v1/checkouts" },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("checkouts", () => {
  it("list GETs /checkouts and forwards pagination params", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: page([{ id: "checkout_1" }]) }]);

    const res = await client.checkouts.list({ limit: 25 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/checkouts");
    expect(calls[0]!.url).toContain("limit=25");
    expect(res.data[0]!.id).toBe("checkout_1");
  });

  it("create POSTs the body to /checkouts", async () => {
    const { client, calls } = makeTestClient([
      { status: 201, body: { id: "checkout_1", resource: "checkout" } },
    ]);
    const body = {
      redirectUrlSuccess: "https://x.example/success",
      redirectUrlCanceled: "https://x.example/cancel",
      products: [{ id: "subscription_plan_1", quantity: 1 }],
    };

    const checkout = await client.checkouts.create(body);

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/checkouts");
    expect(JSON.parse(calls[0]!.body!)).toMatchObject(body);
    expect(checkout.id).toBe("checkout_1");
  });

  it("create sends trialDays of 1 or more and null, but rejects 0 without a request", async () => {
    const { client, calls } = makeTestClient([{ status: 201, body: { id: "checkout_1" } }]);
    const body = (trialDays: number | null) => ({
      redirectUrlSuccess: "https://x.example/success",
      redirectUrlCanceled: "https://x.example/cancel",
      products: [
        { id: "one_off_product_1", price: null, trialDays: null },
        { id: "subscription_plan_1", trialDays },
      ],
    });

    await expect(client.checkouts.create(body(0))).rejects.toThrow(RangeError);
    await expect(client.checkouts.create(body(-3))).rejects.toThrow(/at least 1/);
    expect(calls).toHaveLength(0);

    await client.checkouts.create(body(1));
    expect(JSON.parse(calls[0]!.body!)).toEqual(body(1));
  });

  it("create sends a percentage or an amount discount, and the types reject both", async () => {
    const { client, calls } = makeTestClient([
      { status: 201, body: { id: "checkout_1" } },
      { status: 201, body: { id: "checkout_2" } },
    ]);
    const body = (discounts: CreateCheckoutRequest["discounts"]): CreateCheckoutRequest => ({
      redirectUrlSuccess: "https://x.example/success",
      redirectUrlCanceled: "https://x.example/cancel",
      products: [{ id: "one_off_product_1" }],
      discounts,
    });

    await client.checkouts.create(body([{ percentage: 12.5, description: "Black Friday" }]));
    await client.checkouts.create(body([{ amount: { value: "10.00", currency: "EUR" } }]));

    expect(JSON.parse(calls[0]!.body!).discounts).toEqual([
      { percentage: 12.5, description: "Black Friday" },
    ]);
    expect(JSON.parse(calls[1]!.body!).discounts).toEqual([
      { amount: { value: "10.00", currency: "EUR" } },
    ]);

    // @ts-expect-error a discount takes a percentage or an amount, not both
    const both: CheckoutDiscount = { percentage: 10, amount: { value: "1.00", currency: "EUR" } };
    // @ts-expect-error a discount needs a percentage or an amount
    const neither: CheckoutDiscount = { description: "Nothing off" };
    expect([both, neither]).toHaveLength(2);
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "a/b" } }]);

    await client.checkouts.get("a/b");

    expect(calls[0]!.url).toContain("/checkouts/a%2Fb");
  });

  it("listAll walks pages via the next link's startingAfter cursor", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          [{ id: "checkout_1" }],
          "https://api.example.com/v1/checkouts?startingAfter=checkout_1",
        ),
      },
      { status: 200, body: page([{ id: "checkout_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const c of client.checkouts.listAll({ limit: 1 })) ids.push(c.id);

    expect(ids).toEqual(["checkout_1", "checkout_2"]);
    expect(calls[1]!.url).toContain("startingAfter=checkout_1");
  });
});
