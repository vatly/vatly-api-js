import { describe, expect, it, vi } from "vitest";
import {
  aCreateCheckoutRequest,
  aCreateCustomerRequest,
  anUpdateSubscriptionRequest,
} from "./__fixtures__/requests.js";
import { VatlyClient } from "./client.js";
import {
  VatlyApiError,
  VatlyAuthError,
  VatlyConflictError,
  VatlyConnectionError,
  VatlyForbiddenError,
  VatlyNotFoundError,
  VatlyRateLimitError,
  VatlyTimeoutError,
  VatlyValidationError,
} from "./errors.js";
import { makeFetchSequence } from "./test-utils.js";

const TEST_API_KEY = "test_abcdefghij0123456789"; // matches ^(live|test)_[\w|]{18,}$

function makeClient(opts: {
  fetch: typeof fetch;
  maxRetries?: number;
  timeoutMs?: number;
  idempotencyKeyGenerator?: (() => string) | false;
}) {
  return new VatlyClient({
    apiKey: TEST_API_KEY,
    baseUrl: "https://api.example.com/v1",
    fetch: opts.fetch,
    maxRetries: opts.maxRetries ?? 0,
    timeoutMs: opts.timeoutMs ?? 30_000,
    idempotencyKeyGenerator: opts.idempotencyKeyGenerator,
    // Tests verify exact header values; turn off the client-info header
    // unless a test explicitly opts in.
    clientInfo: false,
  });
}

describe("http", () => {
  it("sends Bearer auth and User-Agent on every request", async () => {
    const { fetch, calls } = makeFetchSequence([{ status: 200, body: { id: "x" } }]);
    const client = makeClient({ fetch });
    await client.checkouts.get("checkout_1");
    expect(calls[0]!.headers.authorization).toBe(`Bearer ${TEST_API_KEY}`);
    expect(calls[0]!.headers["user-agent"]).toMatch(/^vatly-sdk-js\//);
    expect(calls[0]!.headers.accept).toBe("application/json");
  });

  describe("Idempotency-Key", () => {
    it("caller-supplied key wins", async () => {
      const { fetch, calls } = makeFetchSequence([{ status: 201, body: { id: "c1" } }]);
      const client = makeClient({ fetch });
      await client.checkouts.create(aCreateCheckoutRequest(), {
        idempotencyKey: "abc-123",
      });
      expect(calls[0]!.headers["idempotency-key"]).toBe("abc-123");
      expect(calls[0]!.headers["content-type"]).toBe("application/json");
    });

    it("auto-generates a key for POST by default", async () => {
      const { fetch, calls } = makeFetchSequence([{ status: 201, body: {} }]);
      const client = makeClient({ fetch });
      await client.checkouts.create(aCreateCheckoutRequest());
      // Defaults to a UUID v4
      expect(calls[0]!.headers["idempotency-key"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it("auto-generates a key for PATCH by default", async () => {
      const { fetch, calls } = makeFetchSequence([{ status: 200, body: { id: "s1" } }]);
      const client = makeClient({ fetch });
      await client.subscriptions.update("subscription_1", anUpdateSubscriptionRequest());
      expect(calls[0]!.headers["idempotency-key"]).toBeDefined();
    });

    it("does NOT auto-generate for GET", async () => {
      const { fetch, calls } = makeFetchSequence([{ status: 200, body: {} }]);
      const client = makeClient({ fetch });
      await client.checkouts.get("checkout_1");
      expect(calls[0]!.headers["idempotency-key"]).toBeUndefined();
    });

    it("auto-generates a key for DELETE by default", async () => {
      // The vatlify API honors Idempotency-Key on DELETE per its middleware's
      // ALLOWED_METHODS (POST, PATCH, PUT, DELETE), so we auto-key DELETE too.
      // 204 must have no body; spec.body=undefined → Response gets `null`.
      const { fetch, calls } = makeFetchSequence([{ status: 204 }]);
      const client = makeClient({ fetch });
      await client.subscriptions.cancel("subscription_1");
      expect(calls[0]!.headers["idempotency-key"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it("custom generator is invoked once per request", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 201, body: {} },
        { status: 201, body: {} },
      ]);
      let i = 0;
      const gen = () => `key-${++i}`;
      const client = makeClient({ fetch, idempotencyKeyGenerator: gen });
      await client.checkouts.create(aCreateCheckoutRequest());
      await client.checkouts.create(aCreateCheckoutRequest());
      expect(calls[0]!.headers["idempotency-key"]).toBe("key-1");
      expect(calls[1]!.headers["idempotency-key"]).toBe("key-2");
    });

    it("idempotencyKeyGenerator: false disables auto-gen entirely", async () => {
      const { fetch, calls } = makeFetchSequence([{ status: 201, body: {} }]);
      const client = makeClient({ fetch, idempotencyKeyGenerator: false });
      await client.checkouts.create(aCreateCheckoutRequest());
      expect(calls[0]!.headers["idempotency-key"]).toBeUndefined();
    });
  });

  describe("error mapping", () => {
    it("401 → VatlyAuthError", async () => {
      const { fetch } = makeFetchSequence([{ status: 401, body: { message: "Unauthenticated." } }]);
      const client = makeClient({ fetch });
      await expect(client.checkouts.get("x")).rejects.toBeInstanceOf(VatlyAuthError);
    });

    it("403 → VatlyForbiddenError", async () => {
      const { fetch } = makeFetchSequence([{ status: 403, body: { message: "nope" } }]);
      const client = makeClient({ fetch });
      await expect(client.checkouts.get("x")).rejects.toBeInstanceOf(VatlyForbiddenError);
    });

    it("404 → VatlyNotFoundError", async () => {
      const { fetch } = makeFetchSequence([
        { status: 404, body: { message: "Checkout not found." } },
      ]);
      const client = makeClient({ fetch });
      await expect(client.checkouts.get("x")).rejects.toBeInstanceOf(VatlyNotFoundError);
    });

    it("422 → VatlyValidationError exposes field errors", async () => {
      const { fetch } = makeFetchSequence([
        {
          status: 422,
          body: {
            message: "The given data was invalid.",
            errors: { email: ["The email field is required."] },
          },
        },
      ]);
      const client = makeClient({ fetch });
      try {
        await client.customers.create(aCreateCustomerRequest({ email: "" }));
        throw new Error("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(VatlyValidationError);
        const v = err as VatlyValidationError;
        expect(v.errors.email).toEqual(["The email field is required."]);
        expect(v.status).toBe(422);
      }
    });

    it("429 → VatlyRateLimitError carries Retry-After (seconds)", async () => {
      const { fetch } = makeFetchSequence([
        { status: 429, body: { message: "slow down" }, headers: { "Retry-After": "42" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 0 });
      try {
        await client.checkouts.get("x");
        throw new Error("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(VatlyRateLimitError);
        expect((err as VatlyRateLimitError).retryAfter).toBe(42);
      }
    });

    it("500 → VatlyApiError", async () => {
      const { fetch } = makeFetchSequence([{ status: 500, body: { message: "oops" } }]);
      const client = makeClient({ fetch, maxRetries: 0 });
      await expect(client.checkouts.get("x")).rejects.toBeInstanceOf(VatlyApiError);
    });
  });

  describe("retries", () => {
    it.each(["unknown", "parameter_mismatch", undefined])(
      "never retries a 409 outcome %s",
      async (outcome) => {
        const { fetch, calls } = makeFetchSequence([
          { status: 409, body: { message: "Conflict", details: { idempotency_outcome: outcome } } },
        ]);
        const client = makeClient({ fetch, maxRetries: 2 });
        await expect(client.customers.create({ email: "ada@example.com" })).rejects.toMatchObject({
          status: 409,
          details: outcome === undefined ? {} : { idempotency_outcome: outcome },
        });
        expect(calls).toHaveLength(1);
      },
    );

    it("retries only in-progress conflicts with the exact body and key", async () => {
      const { fetch, calls } = makeFetchSequence([
        {
          status: 409,
          headers: { "Retry-After": "0" },
          body: { message: "In progress", details: { idempotency_outcome: "in_progress" } },
        },
        { status: 201, body: { id: "ok" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 1, idempotencyKeyGenerator: false });
      const result = await client.customers.create(
        { email: "ada@example.com" },
        { headers: { "idempotency-key": "header-key" } },
      );
      expect(result.id).toBe("ok");
      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual(calls[1]);
      expect(calls[0]!.headers["idempotency-key"]).toBe("header-key");
    });

    it("exposes exhausted in-progress conflicts and Retry-After", async () => {
      const { fetch } = makeFetchSequence([
        {
          status: 409,
          headers: { "Retry-After": "3" },
          body: { message: "Wait", details: { idempotency_outcome: "in_progress" } },
        },
      ]);
      await expect(
        makeClient({ fetch }).customers.create({ email: "ada@example.com" }),
      ).rejects.toMatchObject({ name: "VatlyConflictError", retryAfter: 3 });
      await expect(
        makeClient({ fetch }).customers.create({ email: "ada@example.com" }),
      ).rejects.toBeInstanceOf(VatlyConflictError);
    });

    it("keeps timeout active while reading a response body", async () => {
      const fetch: typeof globalThis.fetch = async (_, init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              init!.signal!.addEventListener(
                "abort",
                () => controller.error(init!.signal!.reason),
                { once: true },
              );
            },
          }),
        );
      await expect(
        makeClient({ fetch, timeoutMs: 10 }).orders.get("order_1"),
      ).rejects.toBeInstanceOf(VatlyTimeoutError);
    });

    it("aborts during Retry-After without another request", async () => {
      const controller = new AbortController();
      const { fetch, calls } = makeFetchSequence([
        { status: 429, headers: { "Retry-After": "120" }, body: { message: "Wait" } },
      ]);
      const promise = makeClient({ fetch, maxRetries: 2 }).orders.get("order_1", {
        signal: controller.signal,
      });
      setTimeout(() => controller.abort(new Error("stop")), 10);
      await expect(promise).rejects.toBeInstanceOf(VatlyConnectionError);
      expect(calls).toHaveLength(1);
    });

    it("honors Retry-After values above 60 seconds", async () => {
      vi.useFakeTimers();
      try {
        const { fetch, calls } = makeFetchSequence([
          { status: 429, headers: { "Retry-After": "90" }, body: {} },
          { body: { id: "ok" } },
        ]);
        const promise = makeClient({ fetch, maxRetries: 1 }).orders.get("order_1");
        await vi.advanceTimersByTimeAsync(89_999);
        expect(calls).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(1);
        expect((await promise).id).toBe("ok");
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not fetch when already aborted", async () => {
      const { fetch, calls } = makeFetchSequence([{ body: {} }]);
      await expect(
        makeClient({ fetch }).orders.get("order_1", { signal: AbortSignal.abort("stop") }),
      ).rejects.toBeInstanceOf(VatlyConnectionError);
      expect(calls).toHaveLength(0);
    });

    it("rejects invalid JSON success responses rather than returning a false resource type", async () => {
      const { fetch, calls } = makeFetchSequence([{ body: "<html>proxy error</html>" }]);
      await expect(
        makeClient({ fetch, maxRetries: 2 }).orders.get("order_1"),
      ).rejects.toMatchObject({
        name: "VatlyApiError",
        status: 200,
        body: "<html>proxy error</html>",
      });
      expect(calls).toHaveLength(1);
    });

    it("retries 429 with Retry-After backoff and then succeeds", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 429, headers: { "Retry-After": "0" }, body: { message: "slow" } },
        { status: 200, body: { id: "ok" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 2 });
      const res = await client.checkouts.get("checkout_1");
      expect(calls.length).toBe(2);
      expect((res as { id: string }).id).toBe("ok");
    });

    it("retries 503 then succeeds for GETs", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 503, body: { message: "down" } },
        { status: 200, body: { id: "ok" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 2 });
      await client.checkouts.get("checkout_1");
      expect(calls.length).toBe(2);
    });

    it("does NOT retry POST when auto-idempotency is disabled and no key given", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 503, body: { message: "down" } },
        { status: 200, body: { id: "ok" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 5, idempotencyKeyGenerator: false });
      await expect(client.checkouts.create(aCreateCheckoutRequest())).rejects.toBeInstanceOf(
        VatlyApiError,
      );
      expect(calls.length).toBe(1);
    });

    it("DOES retry POST by default (auto-generated idempotency key)", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 503, body: { message: "down" } },
        { status: 201, body: { id: "ok" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 2 });
      await client.checkouts.create(aCreateCheckoutRequest());
      expect(calls.length).toBe(2);
      // Same key on retry — required for the server to dedupe.
      expect(calls[0]!.headers["idempotency-key"]).toBe(calls[1]!.headers["idempotency-key"]);
    });

    it("DOES retry DELETE by default (auto-keyed)", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 503, body: { message: "down" } },
        { status: 204 },
      ]);
      const client = makeClient({ fetch, maxRetries: 2 });
      await client.subscriptions.cancel("subscription_1");
      expect(calls.length).toBe(2);
      // Same key on retry — required for the server to dedupe.
      expect(calls[0]!.headers["idempotency-key"]).toBe(calls[1]!.headers["idempotency-key"]);
    });

    it("DOES retry POST when idempotency key is explicitly provided", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 503, body: { message: "down" } },
        { status: 201, body: { id: "ok" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 2, idempotencyKeyGenerator: false });
      await client.checkouts.create(aCreateCheckoutRequest(), { idempotencyKey: "k1" });
      expect(calls.length).toBe(2);
      expect(calls[0]!.headers["idempotency-key"]).toBe("k1");
      expect(calls[1]!.headers["idempotency-key"]).toBe("k1");
    });

    it("gives up after maxRetries", async () => {
      const { fetch, calls } = makeFetchSequence([
        { status: 503, body: { message: "down" } },
        { status: 503, body: { message: "down" } },
        { status: 503, body: { message: "down" } },
      ]);
      const client = makeClient({ fetch, maxRetries: 2 });
      await expect(client.checkouts.get("x")).rejects.toBeInstanceOf(VatlyApiError);
      expect(calls.length).toBe(3); // 1 initial + 2 retries
    });
  });
});
