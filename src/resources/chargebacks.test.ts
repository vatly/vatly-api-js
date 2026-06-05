import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

const page = (data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: "https://api.example.com/v1/chargebacks" },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("chargebacks (top-level)", () => {
  it("list GETs /chargebacks with params", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: page([{ id: "chargeback_1" }]) },
    ]);

    const res = await client.chargebacks.list({ limit: 15 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/chargebacks");
    expect(calls[0]!.url).toContain("limit=15");
    expect(res.data[0]!.id).toBe("chargeback_1");
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "chargeback_1" } }]);

    await client.chargebacks.get("chargeback_1");

    expect(calls[0]!.url).toContain("/chargebacks/chargeback_1");
  });

  it("listAll walks pages", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          [{ id: "chargeback_1" }],
          "https://api.example.com/v1/chargebacks?startingAfter=chargeback_1",
        ),
      },
      { status: 200, body: page([{ id: "chargeback_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const c of client.chargebacks.listAll()) ids.push(c.id);

    expect(ids).toEqual(["chargeback_1", "chargeback_2"]);
    expect(calls[1]!.url).toContain("startingAfter=chargeback_1");
  });
});
