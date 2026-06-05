import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

const page = (data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: "https://api.example.com/v1/refunds" },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("refunds (top-level)", () => {
  it("list GETs /refunds with params", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: page([{ id: "refund_1" }]) }]);

    const res = await client.refunds.list({ limit: 20 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/refunds");
    expect(calls[0]!.url).toContain("limit=20");
    expect(res.data[0]!.id).toBe("refund_1");
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "refund_1" } }]);

    await client.refunds.get("refund_1");

    expect(calls[0]!.url).toContain("/refunds/refund_1");
  });

  it("listAll walks pages", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          [{ id: "refund_1" }],
          "https://api.example.com/v1/refunds?startingAfter=refund_1",
        ),
      },
      { status: 200, body: page([{ id: "refund_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const r of client.refunds.listAll()) ids.push(r.id);

    expect(ids).toEqual(["refund_1", "refund_2"]);
    expect(calls[1]!.url).toContain("startingAfter=refund_1");
  });
});
