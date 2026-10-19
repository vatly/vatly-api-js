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

  it("list forwards includeArchived", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: page([]) }]);

    await client.oneOffProducts.list({ includeArchived: true });

    expect(calls[0]!.url).toContain("includeArchived=true");
  });

  it("create POSTs the body to /one-off-products", async () => {
    const { client, calls } = makeTestClient([{ status: 201, body: { id: "one_off_product_1" } }]);

    await client.oneOffProducts.create({
      name: "Premium License",
      basePrice: { value: "299.00", currency: "EUR" },
      productType: "saas",
      taxBehavior: "exclusive",
    });

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/one-off-products");
    expect(JSON.parse(calls[0]!.body!).name).toBe("Premium License");
  });

  it("update PATCHes /one-off-products/{id}", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "one_off_product_1" } }]);

    await client.oneOffProducts.update("one_off_product_1", {
      description: "Now with more premium",
    });

    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toContain("/one-off-products/one_off_product_1");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ description: "Now with more premium" });
  });

  it("archive POSTs /one-off-products/{id}/archive and ignores a 204 body", async () => {
    const { client, calls } = makeTestClient([{ status: 204 }]);

    const result = await client.oneOffProducts.archive("one_off_product_1");

    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toContain("/one-off-products/one_off_product_1/archive");
    expect(result).toBeUndefined();
  });

  it("unarchive DELETEs /one-off-products/{id}/archive and returns the product", async () => {
    const { client, calls } = makeTestClient([
      { status: 200, body: { id: "one_off_product_1", archivedAt: null } },
    ]);

    const product = await client.oneOffProducts.unarchive("one_off_product_1");

    expect(calls[0]!.method).toBe("DELETE");
    expect(calls[0]!.url).toContain("/one-off-products/one_off_product_1/archive");
    expect(product.id).toBe("one_off_product_1");
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
