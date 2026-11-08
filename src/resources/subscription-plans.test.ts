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

  it.each([true, false, undefined])("preserves the includeArchived filter %s", async (filter) => {
    const { client, calls } = makeTestClient([{ body: page([]) }]);
    await client.subscriptionPlans.list({ includeArchived: filter });
    expect(new URL(calls[0]!.url).searchParams.get("includeArchived")).toBe(
      filter === undefined ? null : String(filter),
    );
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { id: "subscription_plan_1" } },
    ]);

    await client.subscriptionPlans.get("subscription_plan_1");

    expect(calls[0]!.url).toContain("/subscription-plans/subscription_plan_1");
  });

  it("list forwards includeArchived", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: page([]) }]);

    await client.subscriptionPlans.list({ includeArchived: true });

    expect(calls[0]!.url).toContain("includeArchived=true");
  });

  it("list omits includeArchived when not provided", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: page([]) }]);

    await client.subscriptionPlans.list();

    expect(calls[0]!.url).not.toContain("includeArchived");
  });

  it("create accepts the minimal body (taxBehavior defaulted server-side)", async () => {
    const { client, calls } = makeTestClient([
      { status: 201, body: { id: "subscription_plan_1" } },
    ]);

    await client.subscriptionPlans.create({
      name: "Pro Monthly",
      description: "Full access to all Pro features",
      basePrice: { value: "29.00", currency: "EUR" },
      interval: "month",
      intervalCount: 1,
      productType: "saas",
    });

    const sent = JSON.parse(calls[0]!.body!);
    expect(sent).not.toHaveProperty("taxBehavior");
  });

  it("create POSTs the body to /subscription-plans", async () => {
    const { client, calls } = makeTestClient([
      { status: 201, body: { id: "subscription_plan_1" } },
    ]);

    await client.subscriptionPlans.create({
      name: "Pro Monthly",
      description: "Full access to all Pro features",
      basePrice: { value: "29.00", currency: "EUR" },
      interval: "month",
      intervalCount: 1,
      productType: "saas",
      taxBehavior: "exclusive",
    });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/subscription-plans");
    expect(JSON.parse(calls[0]!.body!).name).toBe("Pro Monthly");
  });

  it("update PATCHes /subscription-plans/{id} with the body", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { id: "subscription_plan_1" } },
    ]);

    await client.subscriptionPlans.update("subscription_plan_1", {
      basePrice: { value: "19.00", currency: "EUR" },
    });

    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toContain("/subscription-plans/subscription_plan_1");
    expect(JSON.parse(calls[0]!.body!)).toEqual({
      basePrice: { value: "19.00", currency: "EUR" },
    });
  });

  it("archive POSTs /subscription-plans/{id}/archive and ignores a 204 body", async () => {
    const { client, calls } = makeTestClient([{ status: 204 }]);

    const result = await client.subscriptionPlans.archive("subscription_plan_1");

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/subscription-plans/subscription_plan_1/archive");
    expect(result).toBeUndefined();
  });

  it("unarchive DELETEs /subscription-plans/{id}/archive and returns the plan", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { id: "subscription_plan_1", archivedAt: null } },
    ]);

    const plan = await client.subscriptionPlans.unarchive("subscription_plan_1");

    expect(calls[0]!.method).toBe("DELETE");
    expect(calls[0]!.url).toContain("/subscription-plans/subscription_plan_1/archive");
    expect(plan.id).toBe("subscription_plan_1");
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
