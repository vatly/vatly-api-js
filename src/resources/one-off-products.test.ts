import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

const page = (data: unknown[], next: string | null = null) => ({
  data,
  count: data.length,
  links: {
    self: { href: "https://api.example.com/v1/one-off-products" },
    next: next ? { href: next } : null,
    prev: null,
  },
});

describe("oneOffProducts", () => {
  it("list GETs /one-off-products with params", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: page([{ id: "one_off_product_1" }]) },
    ]);

    const res = await client.oneOffProducts.list({ limit: 50 });

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/one-off-products");
    expect(calls[0]!.url).toContain("limit=50");
    expect(res.data[0]!.id).toBe("one_off_product_1");
  });

  it("get GETs and url-encodes the id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "one_off_product_1" } }]);

    await client.oneOffProducts.get("one_off_product_1");

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/one-off-products/one_off_product_1");
  });

  it("listAll walks pages", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: page(
          [{ id: "one_off_product_1" }],
          "https://api.example.com/v1/one-off-products?startingAfter=one_off_product_1",
        ),
      },
      { status: 200, body: page([{ id: "one_off_product_2" }]) },
    ]);

    const ids: string[] = [];
    for await (const p of client.oneOffProducts.listAll()) ids.push(p.id);

    expect(ids).toEqual(["one_off_product_1", "one_off_product_2"]);
    expect(calls[1]!.url).toContain("startingAfter=one_off_product_1");
  });
});
