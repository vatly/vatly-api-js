import { describe, expect, it } from "vitest";
import { VatlyClient } from "./client.js";
import { extractStartingAfter } from "./pagination.js";
import { makeFetchSequence } from "./test-utils.js";

function listPage(ids: string[], next: string | null) {
  return {
    data: ids.map((id) => ({ id })),
    count: ids.length,
    links: {
      self: { href: "https://api.example.com/v1/checkouts", type: "application/json" },
      next: next
        ? {
            href: `https://api.example.com/v1/checkouts?startingAfter=${next}`,
            type: "application/json",
          }
        : null,
      prev: null,
    },
  };
}

describe("pagination", () => {
  it("extracts startingAfter from a next link", () => {
    expect(
      extractStartingAfter("https://api.example.com/v1/checkouts?startingAfter=co_42&limit=10"),
    ).toBe("co_42");
    expect(extractStartingAfter("https://api.example.com/v1/checkouts")).toBeUndefined();
  });

  it("listAll iterates across pages following links.next", async () => {
    const { fetch, calls } = makeFetchSequence([
      { status: 200, body: listPage(["a", "b"], "b") },
      { status: 200, body: listPage(["c", "d"], "d") },
      { status: 200, body: listPage(["e"], null) },
    ]);
    const client = new VatlyClient({
      apiKey: "test_abcdefghij0123456789",
      baseUrl: "https://api.example.com/v1",
      fetch,
    });

    const ids: string[] = [];
    for await (const item of client.checkouts.listAll()) {
      ids.push((item as { id: string }).id);
    }

    expect(ids).toEqual(["a", "b", "c", "d", "e"]);
    expect(calls.length).toBe(3);
    expect(calls[1]!.url).toContain("startingAfter=b");
    expect(calls[2]!.url).toContain("startingAfter=d");
  });

  it("stops when next is null on the first page", async () => {
    const { fetch, calls } = makeFetchSequence([{ status: 200, body: listPage(["only"], null) }]);
    const client = new VatlyClient({
      apiKey: "test_abcdefghij0123456789",
      baseUrl: "https://api.example.com/v1",
      fetch,
    });
    const ids: string[] = [];
    for await (const item of client.checkouts.listAll()) {
      ids.push((item as { id: string }).id);
    }
    expect(ids).toEqual(["only"]);
    expect(calls.length).toBe(1);
  });
});
