import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

const page = (data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: "https://api.example.com/v1/subscription-plans" },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("subscriptionPlans", () => {
  it("list GETs /subscription-plans with params", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: page([{ id: "subscription_plan_1" }]) },
    ]);

    const res = await client.subscriptionPlans.list({ limit: 5 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/subscription-plans");
    expect(calls[0]!.url).toContain("limit=5");
    expect(res.data[0]!.id).toBe("subscription_plan_1");
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { id: "subscription_plan_1" } },
    ]);

    await client.subscriptionPlans.get("subscription_plan_1");

    expect(calls[0]!.url).toContain("/subscription-plans/subscription_plan_1");
  });

  it("listAll walks pages", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          [{ id: "subscription_plan_1" }],
          "https://api.example.com/v1/subscription-plans?startingAfter=subscription_plan_1",
        ),
      },
      { status: 200, body: page([{ id: "subscription_plan_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const p of client.subscriptionPlans.listAll()) ids.push(p.id);

    expect(ids).toEqual(["subscription_plan_1", "subscription_plan_2"]);
    expect(calls[1]!.url).toContain("startingAfter=subscription_plan_1");
  });
});
